// End-to-end checks against the production build.
// Usage: npm run build && npm run test:e2e
// Starts `vite preview`, blocks every request that leaves the local host,
// and exercises the experience on desktop, mobile, reduced motion and
// without WebGL. Exits non-zero if any assertion fails.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const SITE = BASE; // the full site is the root on version 3; the kiosk is kiosk.html
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
let failures = 0;
const check = (ok, name, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {
    await wait(200);
  }
}

async function open(browser, url, { viewport = { width: 1440, height: 900 }, ...ctxOpts } = {}) {
  const context = await browser.newContext({ viewport, ...ctxOpts });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000); // a page with a large module graph can take a while on a busy machine
  page.external = [];
  page.failed = [];
  page.errors = [];
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === 'localhost' || u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
    page.external.push(u.href);
    return route.abort();
  });
  page.on('response', (r) => r.status() >= 400 && page.failed.push(`${r.status()} ${r.url()}`));
  page.on('pageerror', (e) => page.errors.push(e.stack || e.message));
  page.on('console', (m) => m.type() === 'error' && page.errors.push(m.text()));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return page;
}
const isOpen = (p) => p.evaluate(() => document.querySelector('#story-drawer').open);
const sceneState = (p) => p.evaluate(() => document.querySelector('#stage').dataset.sceneState);
const waitScene = (p) => p.waitForFunction(() => document.querySelector('#stage').dataset.sceneState !== 'loading', null, { polling: 100, timeout: 30000 });
const focus = (p) => p.evaluate(() => window.__impact.scene?.focus);
const view = (p) => p.evaluate(() => window.__impact.scene?.view);
/** Wait until the camera has reached the view it wants. */
async function arrived(p, ms = 8000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await p.evaluate(() => (window.__impact.scene?.travel.dist ?? 0) < 0.05)) return true;
    await wait(250);
  }
  return false;
}
/** The centre of the model on screen. */
const stageCentre = (p) => p.evaluate(() => { const r = document.querySelector('#stage').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });

try {
  const browser = await chromium.launch({ args: GL });

  // ---- Arrival and the community journey ----------------------------------
  let p = await open(browser, SITE);
  check(await p.locator('h1').isVisible(), 'headline and actions visible on arrival');
  await wait(2000);
  check(await p.evaluate(() => !!window.__impact.lenis), 'smooth scrolling active when motion is on');
  check(await p.evaluate(() => document.querySelector('.explorer').offsetHeight <= innerHeight && !!document.querySelector('.journey-bar')), 'the community is an explorer in the page flow with its own controls');
  await waitScene(p);
  check((await sceneState(p)) === 'ready', '3D community renders with WebGL', await sceneState(p));
  // Keep the explorer centred so its controls never sit under the fixed header
  await p.evaluate(() => document.querySelector('#explorer').scrollIntoView({ block: 'center' }));
  await wait(600);
  check(await p.evaluate(() => document.querySelector('.stage-still').complete && document.querySelector('.stage-still').naturalWidth > 0), 'a still of the community is in place before the model is ready');
  check(await p.evaluate(() => { const st = document.querySelector('#stage'); const host = document.querySelector('.scene-host'); const still = document.querySelector('.stage-still'); const was = st.dataset.sceneState; host.style.transition = still.style.transition = 'none'; st.dataset.sceneState = 'loading'; const hidden = getComputedStyle(host).opacity === '0' && getComputedStyle(still).opacity === '1'; st.dataset.sceneState = was; getComputedStyle(host).opacity; getComputedStyle(still).opacity; host.style.transition = still.style.transition = ''; return hidden; }), 'while the buildings load only the still shows, never an empty plinth');
  await p.waitForFunction(() => getComputedStyle(document.querySelector('.scene-host')).opacity === '1' && getComputedStyle(document.querySelector('.stage-still')).opacity === '0', null, { timeout: 3000 }).catch(() => {});
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.scene-host')).opacity === '1' && getComputedStyle(document.querySelector('.stage-still')).opacity === '0'), 'once the model is ready the canvas cross-fades in over the still');
  check(await p.evaluate(() => { const sc = window.__impact.scene; const white = sc.sky === 0; sc.setBackdrop(true); const sky = sc.sky === 1; sc.setBackdrop(false); return white && sky && sc.sky === 0 && window.__impact.skyPlaces.has('datacenter') && !window.__impact.skyPlaces.has('hospital'); }), 'the page is white by default and only the data center is approached under the sky');
  // Free exploration: drag turns the model, the wheel zooms once it has been clicked
  const v0 = await view(p);
  const c = await stageCentre(p);
  await p.mouse.move(c.x, c.y);
  await p.mouse.down();
  await p.mouse.move(c.x + 220, c.y + 40, { steps: 10 });
  await p.mouse.up();
  await wait(300);
  const v1 = await view(p);
  check(v1.az < v0.az - 0.8 && v1.el > v0.el, 'dragging turns the model', `az ${v0.az.toFixed(2)} to ${v1.az.toFixed(2)}, el ${v0.el.toFixed(2)} to ${v1.el.toFixed(2)}`);
  check(await p.evaluate(() => document.querySelector('#explorer').classList.contains('is-explored') && getComputedStyle(document.querySelector('.journey-card--intro')).display === 'none'), 'the opening card gives way once the model is explored');
  check(await arrived(p, 12000), 'the camera follows the hand', JSON.stringify(await p.evaluate(() => window.__impact.scene.travel)));
  const scrollBefore = await p.evaluate(() => scrollY);
  await p.mouse.wheel(0, -300);
  await wait(400);
  const v2 = await view(p);
  check(v2.dist < v1.dist && (await p.evaluate(() => scrollY)) === scrollBefore, 'the wheel zooms the model after a click and the page stays put', `dist ${v1.dist.toFixed(1)} to ${v2.dist.toFixed(1)}`);
  // Leave the model and come back without clicking: the wheel scrolls the page again
  await p.mouse.move(c.x, 5);
  await wait(200);
  await p.mouse.move(c.x, c.y);
  await wait(200);
  await p.mouse.wheel(0, 200);
  await wait(1800);
  check((await view(p)).dist === v2.dist && (await p.evaluate(() => scrollY)) !== scrollBefore, 'without a click the wheel scrolls the page past the model', `dist ${(await view(p)).dist.toFixed(1)} scroll ${scrollBefore} to ${await p.evaluate(() => scrollY)}`);
  await p.evaluate(() => document.querySelector('#explorer').scrollIntoView({ block: 'center' }));
  await wait(400);
  await p.locator('#explorer').focus();
  const vk = await view(p);
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('+');
  await wait(300);
  const vk2 = await view(p);
  check(vk2.az > vk.az && vk2.dist < vk.dist, 'arrow keys turn the model and plus zooms in', `az ${vk.az.toFixed(2)} to ${vk2.az.toFixed(2)}, dist ${vk.dist.toFixed(1)} to ${vk2.dist.toFixed(1)}`);
  await p.locator('[data-reset-view]').click();
  await wait(300);
  const vr = await view(p);
  check(Math.abs(vr.az - 0.42) < 1e-6 && vr.dist === 46 && (await focus(p)) === 'overview' && !(await p.evaluate(() => document.querySelector('#explorer').classList.contains('is-explored'))), 'reset returns to the opening view', JSON.stringify(vr));
  // Labels behind the camera hide themselves; pick one that is in view
  const visiblePlace = await p.evaluate(() => [...document.querySelectorAll('.place-label:not(.is-offscreen)')].map((l) => l.dataset.place).find((pl) => pl !== 'shops'));
  // dispatched rather than pointer-clicked: floating labels can drift under the pointer while the camera eases
  await p.locator(`.place-label[data-place="${visiblePlace}"]`).dispatchEvent('click');
  await p.waitForFunction(() => window.__impact.room.phase === 'inside', null, { polling: 100, timeout: 45000 }).catch(() => {});
  const labelRoom = await p.evaluate(() => ({ phase: window.__impact.room.phase, place: window.__impact.room.place }));
  check(visiblePlace && labelRoom.phase === 'inside' && labelRoom.place === visiblePlace, 'a building or its name steps you inside', `${visiblePlace} ${JSON.stringify(labelRoom)}`);
  await p.evaluate(() => window.__impact.room.leave());
  await p.waitForFunction(() => window.__impact.room.phase === 'closed', null, { polling: 100, timeout: 30000 }).catch(() => {});
  await wait(800);
  const vb = await view(p);
  check((await focus(p)) === 'overview' && Math.abs(vb.az - vr.az) < 1e-6 && vb.dist === vr.dist, 'leaving returns to the view you had before the door', JSON.stringify(vb));
  const trigger = p.locator('#collection-list [data-story-trigger]').first();
  const storyId = await trigger.getAttribute('data-story-trigger');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.dispatchEvent('click');
  await wait(700);
  check((await isOpen(p)) && !!storyId, 'story opens from the collection', storyId);
  check((await p.evaluate(() => location.hash)) === `#/story/${storyId}`, 'open story exposes its URL');
  check((await p.evaluate(() => document.activeElement.className)).includes('drawer-close'), 'focus moves into the story dialog');
  await p.keyboard.press('Escape');
  await wait(700);
  check(!(await isOpen(p)), 'Escape closes the story');
  check((await p.evaluate(() => document.activeElement?.dataset?.storyTrigger)) === storyId, 'focus returns to the trigger');
  await p.goForward();
  await wait(700);
  check(await isOpen(p), 'browser forward restores the story');
  await p.goBack();
  await wait(700);
  check(!(await isOpen(p)), 'browser back closes the story again');
  // Stepping inside: approach, dive film, the room with captions, leave
  await p.evaluate(() => document.querySelector('#explorer').scrollIntoView({ block: 'center' }));
  await wait(400);
  await p.locator('.place-label[data-place="hospital"]').dispatchEvent('click');
  // The visitor's mouse keeps moving over the model during the approach; that must not hold the door
  const cc = await stageCentre(p);
  for (let i = 0; i < 6; i++) {
    await p.mouse.move(cc.x - 100 + i * 30, cc.y - 60 + i * 20);
    await wait(150);
  }
  await p.waitForFunction(() => window.__impact.room.phase === 'inside', null, { polling: 100, timeout: 45000 }).catch(() => {});
  const roomState = await p.evaluate(() => ({ phase: window.__impact.room.phase, place: window.__impact.room.place, line: window.__impact.room.line, pano: document.querySelector('#room').classList.contains('has-pano'), caption: document.querySelector('.room-line-text')?.textContent, title: document.querySelector('.room-title').textContent }));
  check(roomState.phase === 'inside' && roomState.place === 'hospital' && roomState.pano && roomState.line === 0 && /radiologist/.test(roomState.caption || ''), 'stepping inside flies to the door, through the film and into the room with the first caption', JSON.stringify(roomState));
  check(roomState.title === 'The reading room' && (await p.evaluate(() => document.activeElement?.hasAttribute('data-room-leave'))), 'the room names itself and focus lands on Leave');
  // the first line starts once the panorama is up; under software rendering that can take a few seconds
  await p.waitForFunction(() => { const v = document.querySelector('.room-voice'); return v.getAttribute('src') && !v.paused; }, null, { polling: 100, timeout: 10000 }).catch(() => {});
  const spoken = await p.evaluate(() => { const v = document.querySelector('.room-voice'); return { src: v.getAttribute('src') || '', paused: v.paused, pressed: document.querySelector('[data-room-voice]').getAttribute('aria-pressed') }; });
  // under software rendering the first line can already have handed over to the second by the time we look
  check(/hospital-[12]\.mp3$/.test(spoken.src) && !spoken.paused && spoken.pressed === 'true', 'the narrator reads the caption aloud', JSON.stringify(spoken));
  await p.locator('[data-room-voice]').dispatchEvent('click');
  await wait(300);
  check(await p.evaluate(() => document.querySelector('.room-voice').paused && !document.querySelector('.room-voice').getAttribute('src') && !window.__impact.room.voice), 'the voice control silences the narrator');
  await p.locator('[data-room-voice]').dispatchEvent('click');
  await wait(600);
  check(await p.evaluate(() => window.__impact.room.voice && !document.querySelector('.room-voice').paused), 'and brings the narrator back on the same caption');
  const lineBefore = await p.evaluate(() => window.__impact.room.line);
  await p.locator('[data-room-next]').dispatchEvent('click');
  await wait(600);
  const factLine = await p.evaluate(() => ({ line: window.__impact.room.line, fact: !!document.querySelector('.room-line--fact .room-line-source a'), kind: document.querySelector('.room-line')?.className }));
  // (the captions also advance on their own every 7 s, so one extra step is allowed under slow rendering)
  check(factLine.line > lineBefore && factLine.line <= lineBefore + 2 && (factLine.line !== 1 || factLine.fact), 'Next moves one caption on, and the figure carries its scope and source', JSON.stringify(factLine));
  await p.locator('[data-room-next]').dispatchEvent('click');
  await p.locator('[data-room-next]').dispatchEvent('click');
  await wait(600);
  check(await p.evaluate(() => !!document.querySelector('[data-room-story="3verest"]')), 'the last card offers the full story');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => window.__impact.room.phase === 'closed', null, { polling: 100, timeout: 30000 }).catch(() => {});
  check(await p.evaluate(() => window.__impact.room.phase === 'closed' && document.querySelector('#room').hidden && window.__impact.scene.focus === 'overview' && !document.body.classList.contains('room-open')), 'leaving plays you out and back to the model');
  check(await p.evaluate(() => document.activeElement?.dataset?.place === 'hospital'), 'focus returns to the place you chose');

  // The tour: into each building in turn, hands free, with pause, skip and a way out
  const tourState = () => p.evaluate(() => ({ playing: window.__impact.playing, paused: window.__impact.paused, stop: window.__impact.tourStop, phase: window.__impact.room.phase, place: window.__impact.room.place, guided: window.__impact.room.guided, roomPaused: window.__impact.room.paused, voiceSrc: document.querySelector('.room-voice').getAttribute('src') || '', voicePaused: document.querySelector('.room-voice').paused, themePaused: document.querySelector('#theme').paused, themeVol: document.querySelector('#theme').volume, pauseShown: !!document.querySelector('[data-room-pause]').offsetParent, pauseText: document.querySelector('[data-room-pause]').textContent, barPressed: document.querySelector('.bar-btn[data-play]').getAttribute('aria-pressed') }));
  await p.locator('.bar-btn[data-play]').click();
  await p.waitForFunction(() => window.__impact.room.phase === 'inside' && window.__impact.room.place === 'hospital', null, { polling: 100, timeout: 60000 }).catch(() => {});
  await wait(900);
  let ts = await tourState();
  check(ts.playing && ts.stop === 0 && ts.guided && ts.phase === 'inside' && ts.place === 'hospital' && ts.pauseShown && !ts.themePaused && ts.barPressed === 'true', 'the tour steps into the first building and tells its story there', JSON.stringify(ts));
  check(/hospital-1\.mp3$/.test(ts.voiceSrc) && !ts.voicePaused && ts.themeVol < 0.3, 'the narrator speaks inside and the music ducks under it', `${ts.voiceSrc} vol=${ts.themeVol}`);
  await p.locator('[data-room-pause]').dispatchEvent('click');
  await wait(400);
  ts = await tourState();
  check(ts.playing && ts.paused && ts.roomPaused && ts.voicePaused && ts.pauseText === 'Resume' && ts.barPressed === 'false', 'Pause holds the tour inside the room', JSON.stringify(ts));
  await p.locator('[data-room-pause]').dispatchEvent('click');
  await wait(600);
  ts = await tourState();
  check(ts.playing && !ts.paused && !ts.roomPaused && !ts.voicePaused && ts.pauseText === 'Pause', 'Resume carries on where it was', JSON.stringify(ts));
  await p.locator('[data-mute]').dispatchEvent('click');
  await wait(1200);
  ts = await tourState();
  check(ts.themePaused && ts.voiceSrc === '' && ts.playing && (await p.evaluate(() => localStorage.getItem('impact-sound') === null)), 'mute silences the music and the narrator, keeps the tour going and is not remembered', JSON.stringify(ts));
  await p.locator('[data-room-skip]').dispatchEvent('click');
  await p.waitForFunction(() => window.__impact.room.phase === 'inside' && window.__impact.room.place === 'research', null, { polling: 100, timeout: 90000 }).catch(() => {});
  ts = await tourState();
  check(ts.playing && ts.stop === 1 && ts.place === 'research' && ts.phase === 'inside', 'Skip plays you out and into the next building', JSON.stringify(ts));
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => window.__impact.room.phase === 'closed', null, { polling: 100, timeout: 30000 }).catch(() => {});
  await wait(800);
  ts = await tourState();
  check(!ts.playing && ts.phase === 'closed' && (await focus(p)) === 'overview' && (await p.evaluate(() => document.querySelector('.tour-caption').hidden)), 'Escape ends the tour and hands the model back', JSON.stringify(ts));
  check(p.external.length === 0, 'no requests leave the host (journey)', p.external.slice(0, 3).join(', '));
  check(p.failed.length === 0, 'no missing local assets (journey)', p.failed.slice(0, 3).join(', '));
  check(p.errors.length === 0, 'no JavaScript errors (journey)', p.errors.slice(0, 3).join(' | '));
  await p.context().close();

  // ---- Chapters, routes, gallery ------------------------------------------
  p = await open(browser, `${SITE}#/chapter/community`);
  await wait(2500);
  const top = await p.evaluate(() => document.querySelector('#stories').getBoundingClientRect().top);
  check(Math.abs(top) < 40, 'chapter route lands on the Stories theatre', `${Math.round(top)}px`);
  const theatre = await p.evaluate(() => ({ active: window.__impact.theatre.active, auto: window.__impact.theatre.auto, rows: document.querySelectorAll('.theatre-row').length, pressed: document.querySelector('.theatre-row[aria-pressed="true"]')?.dataset.topic, shown: document.querySelector('.theatre-film.on')?.dataset.topic, lead: document.querySelector('.theatre-lead:not([hidden])')?.dataset.topic, playing: (() => { const v = document.querySelector('.theatre-film.on video'); return !!v && v.preload !== 'none'; })() }));
  check(theatre.rows === 5 && theatre.active === 'community' && theatre.pressed === 'community' && theatre.shown === 'community' && theatre.lead === 'community' && theatre.auto === false && theatre.playing, 'the route chooses its chapter in the theatre, loads its film and stops the rotation', JSON.stringify(theatre));
  await p.evaluate(() => window.__impact.theatre.resume());
  await wait(5200);
  await p.waitForFunction(() => window.__impact.theatre.active !== 'community', null, { polling: 250, timeout: 12000 }).catch(() => {});
  const rotated = await p.evaluate(() => window.__impact.theatre.active);
  check(rotated === 'resources', 'left alone, the theatre moves to the next chapter after five seconds', rotated);
  await p.locator('.theatre-row[data-topic="care"]').dispatchEvent('click');
  await wait(300);
  check(await p.evaluate(() => window.__impact.theatre.active === 'care' && window.__impact.theatre.auto === false && location.hash === '#/chapter/care'), 'choosing a chapter stops the rotation and updates the link');
  check(await p.evaluate(() => document.querySelector('.site-nav a[href="#/chapter/care"]').getAttribute('aria-current') === 'true'), 'navigation marks the current section');
  await p.goto(`${SITE}#/explore/discovery`);
  await wait(1200);
  check((await p.evaluate(() => window.__impact.store.get().section)) === 'journey', 'older explore links land on the community');
  await p.goto(`${SITE}#/principles`);
  let promisesTop = Infinity;
  for (let i = 0; i < 24 && Math.abs(promisesTop) >= 40; i++) {
    await wait(250);
    promisesTop = await p.evaluate(() => document.querySelector('#promises').getBoundingClientRect().top);
  }
  check(Math.abs(promisesTop) < 40, 'older principles links land on the promises', `${Math.round(promisesTop)}px`);
  // The promises: a quiet Spine canvas with a begin button and the five promises beneath
  const spineIdle = await p.evaluate(() => ({
    state: document.querySelector('#spine-frame')?.dataset.state,
    embed: document.querySelector('#spine-embed')?.getAttribute('src'),
    tiles: document.querySelectorAll('.promise-tile').length,
    begin: !!document.querySelector('#spine-begin'),
  }));
  check(spineIdle.state === 'idle' && /prototypes\/spine\.html\?mode=preview/.test(spineIdle.embed) && spineIdle.tiles === 5 && spineIdle.begin, 'the promises section holds the Spine canvas and five promise tiles', JSON.stringify(spineIdle));
  // The embedded Spine really draws: render a frame and count ribbon-red pixels on the white canvas; the camera sits on its preview orbit
  let spineFrameDoc = null; // the iframe loads lazily: wait for it and for its scene
  for (let i = 0; i < 80 && !spineFrameDoc; i++) { spineFrameDoc = p.frames().find((f) => f.url().includes('spine.html')) || null; if (spineFrameDoc && !(await spineFrameDoc.evaluate(() => !!window.__spine).catch(() => false))) spineFrameDoc = null; if (!spineFrameDoc) await wait(250); }
  await wait(2000);
  const drawn = spineFrameDoc ? await spineFrameDoc.evaluate(() => new Promise((res) => requestAnimationFrame(() => { const { renderer, scene, camera } = window.__spine; renderer.render(scene, camera); const g = renderer.getContext(); const w = g.drawingBufferWidth, h = g.drawingBufferHeight; const px = new Uint8Array(w * h * 4); g.readPixels(0, 0, w, h, g.RGBA, g.UNSIGNED_BYTE, px); let red = 0, white = 0; for (let i = 0; i < px.length; i += 4) { if (px[i] > 180 && px[i + 1] < 90 && px[i + 2] < 90) red++; else if (px[i] > 245 && px[i + 1] > 245 && px[i + 2] > 245) white++; } res({ red, whiteShare: +(white / (w * h)).toFixed(2), dist: Math.round(camera.position.length()) }); }))).catch((e) => ({ err: String(e) })) : { err: 'no frame' };
  check(drawn.red > 200 && drawn.whiteShare > 0.5 && drawn.dist < 600, 'the embedded Spine draws its red ribbon on a white canvas', JSON.stringify(drawn));
  await p.locator('#spine-begin').dispatchEvent('click');
  await wait(800);
  const spineOpen = await p.evaluate(() => ({ state: document.querySelector('#spine-frame').dataset.state, open: document.body.classList.contains('spine-open') }));
  check(spineOpen.open && spineOpen.state !== 'idle', 'beginning the journey fills the screen with the Spine', JSON.stringify(spineOpen));
  await wait(10500); // the dive film ends or times out, and the ride begins
  const spineRunning = await p.evaluate(() => document.querySelector('#spine-frame').dataset.state);
  check(spineRunning === 'open', 'after the film the Spine takes over', spineRunning);
  await p.evaluate(() => window.postMessage({ type: 'spine:leave' }, '*')); // what the Spine's own Leave button sends
  await wait(600);
  check(await p.evaluate(() => document.querySelector('#spine-frame').dataset.state === 'idle' && !document.body.classList.contains('spine-open')), 'leaving the Spine returns to the page');
  // The people: six colleagues in one line, all inside the stage, the chosen one forward with a translucent story card
  await p.evaluate(() => document.querySelector('#people-stage').scrollIntoView({ block: 'center' }));
  await wait(1200);
  const line = await p.evaluate(() => { const s = document.querySelector('#people-stage').getBoundingClientRect(); const ps = [...document.querySelectorAll('.person')].map((b) => b.getBoundingClientRect()); return { count: ps.length, inside: ps.every((b) => b.left >= s.left - 1 && b.right <= s.right + 1) }; });
  check(line.count === 6 && line.inside, 'the people line holds six colleagues and nobody is cut off at the edges', JSON.stringify(line));
  await p.locator('.person').first().dispatchEvent('click');
  await wait(1800);
  await p.evaluate(() => Promise.race([Promise.all([...document.querySelectorAll('.people-story, .people-story .text')].flatMap((el) => el.getAnimations()).map((a) => a.finished)).catch(() => {}), new Promise((r) => setTimeout(r, 6000))]));
  await p.waitForFunction(() => (document.querySelector('.people-story .text')?.offsetHeight || 0) > 120, null, { polling: 200, timeout: 8000 }).catch(() => {});
  const story = await p.evaluate(() => { const s = document.querySelector('#people-stage').getBoundingClientRect(), c = document.querySelector('.people-story'), r = c.getBoundingClientRect(), t = c.querySelector('.story-text'); return { open: window.__impact.people.open, active: window.__impact.people.active, role: c.querySelector('.where')?.textContent.split(' ')[0], textOpen: !!t && c.querySelector('.text').offsetHeight > 120, below: r.top >= s.bottom - 1, fits: r.left >= 0 && r.right <= innerWidth }; });
  check(story.open && story.active === 0 && story.role === 'Operations' && story.textOpen && story.below && story.fits, 'the first colleague opens with the whole story in the panel beneath the line', JSON.stringify(story));
  await p.waitForFunction(() => !document.querySelector('.people-story').classList.contains('no-voice'), null, { polling: 200, timeout: 8000 }).catch(() => {});
  check(await p.evaluate(() => !document.querySelector('.people-story').classList.contains('no-voice') && !!document.querySelector('.people-story [data-play]')), 'the colleague has a spoken line and a Listen button');
  await p.locator('.person').last().dispatchEvent('click');
  await wait(1800);
  await p.evaluate(() => Promise.race([Promise.all([...document.querySelectorAll('.people-story, .people-story .text')].flatMap((el) => el.getAnimations()).map((a) => a.finished)).catch(() => {}), new Promise((r) => setTimeout(r, 6000))]));
  const lastOne = await p.evaluate(() => { const s = document.querySelector('#people-stage').getBoundingClientRect(), c = document.querySelector('.people-story'); const ps = [...document.querySelectorAll('.person')].map((b) => b.getBoundingClientRect()); return { active: window.__impact.people.active, role: c.querySelector('.where')?.textContent.split(' ')[0], below: c.getBoundingClientRect().top >= s.bottom - 1, peopleInside: ps.every((b) => b.left >= s.left - 1 && b.right <= s.right + 1) }; });
  check(lastOne.active === 5 && lastOne.role === 'Heat' && lastOne.below && lastOne.peopleInside, 'choosing the last colleague changes the panel and keeps everyone on the stage', JSON.stringify(lastOne));
  // A voice someone asked for holds the line: with nobody pinned the line moves on every five seconds,
  // and a Listen pressed while it is rotating used to be cut off by the next turn
  await p.locator('#people-stage').click({ position: { x: 8, y: 8 } });
  await p.locator('.people-story [data-play]').click();
  await p.waitForFunction(() => window.__impact.people.speaking, null, { polling: 100, timeout: 4000 }).catch(() => {});
  await wait(6500);
  const held = await p.evaluate(() => ({ speaking: window.__impact.people.speaking, active: window.__impact.people.active, cls: document.querySelector('.people-story').classList.contains('speaking') }));
  check(held.speaking && held.active === 5 && held.cls, 'while a colleague speaks the line waits instead of moving on', JSON.stringify(held));
  await p.evaluate(() => window.__impact.people.setOpen(false));

  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.goto(`${SITE}#/share`);
  await wait(2500);
  await p.locator('.card [data-copy="summary"]').first().click();
  await wait(300);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  check(clip.includes('Source:') && clip.includes('#/story/3verest'), 'copy summary includes source and story link');
  check((await p.locator('#toast').textContent()).includes('copied'), 'copy confirms success');
  await p.locator('[data-filter="discovery"]').click();
  check((await p.locator('#collection-count').textContent()) === '1 story', 'topic filter narrows the gallery');
  await p.locator('[data-filter="partnership"]').click();
  check(await p.locator('#collection-empty').isVisible(), 'filters show a useful empty state');
  await p.locator('[data-filter-reset]').click();
  check((await p.locator('.card:not([hidden])').count()) === (await p.locator('.card').count()), 'reset shows all stories');

  const small = await p.evaluate(() =>
    [...document.querySelectorAll('.btn, .chip, .motion-toggle, .rail-btn, .bar-btn')]
      .filter((el) => el.offsetParent)
      .map((el) => [el.className, el.getBoundingClientRect().height])
      .filter(([, h]) => h > 0 && h < 44),
  );
  check(small.length === 0, 'controls are at least 44px tall', JSON.stringify(small.slice(0, 3)));
  const labelHit = await p.evaluate(() => { const l = document.querySelector('.place-label'); const b = l.getBoundingClientRect(); const cs = getComputedStyle(l, '::before'); return b.height - parseFloat(cs.top) * 2; });
  check(labelHit >= 44, 'place labels have a 44px hit area', `${labelHit}px`);
  const copy = await p.evaluate(() => document.body.innerText);
  check(!copy.includes('—'), 'page copy has no em dashes');
  check(!/powering hospitals/i.test(copy), 'page copy never claims to power hospitals');
  // The red fabric: behind the page, with a toggle that is remembered
  await p.waitForFunction(() => document.querySelector('#fabric-layer').classList.contains('is-ready'), null, { polling: 100, timeout: 30000 }).catch(() => {});
  check(await p.evaluate(() => document.documentElement.dataset.fabric === 'on' && document.querySelector('#fabric-layer canvas') && Number(getComputedStyle(document.querySelector('#fabric-layer')).opacity) > 0.5 && getComputedStyle(document.querySelector('#fabric-layer')).pointerEvents === 'none'), 'the red fabric flies behind the page and takes no clicks');
  await p.locator('[data-fabric-toggle]').click();
  await wait(300);
  check(await p.evaluate(() => document.documentElement.dataset.fabric === 'off' && localStorage.getItem('impact-fabric') === 'off' && document.querySelector('[data-fabric-toggle]').getAttribute('aria-pressed') === 'false'), 'the fabric can be switched off and the choice is remembered');
  await p.locator('[data-fabric-toggle]').click();
  // Training and resources: placeholders are labelled, the live link is marked, the route lands
  await p.goto(`${SITE}#/training`);
  let resourcesTop = Infinity;
  for (let i = 0; i < 24 && Math.abs(resourcesTop) >= 40; i++) {
    await wait(250);
    resourcesTop = await p.evaluate(() => document.querySelector('#training').getBoundingClientRect().top);
  }
  check(Math.abs(resourcesTop) < 40, 'the training route lands on the section', `${Math.round(resourcesTop)}px`);
  check(await p.evaluate(() => document.querySelectorAll('.resource .resource-state').length === 5 && document.querySelectorAll('.resource-state--live').length === 1 && document.querySelectorAll('.roleplay').length === 4), 'downloadable placeholders, one live link and four role plays are listed');
  check(await p.evaluate(() => document.querySelector('.site-nav a[href="engage.html"]') && document.querySelector('.resource-group--engage a[href="engage.html"]')), 'the Engage page is linked from the nav and the resources');
  // Sunlight: a diffused light sits over the page, blended in, never in the way
  check(await p.evaluate(() => { const l = document.querySelector('#weather-light'); const cs = getComputedStyle(l); return cs.mixBlendMode === 'multiply' && cs.pointerEvents === 'none' && cs.position === 'fixed'; }), 'a diffused sunlight sits over the page and takes no clicks');
  check(p.external.length === 0, 'no requests leave the host (sections)', p.external.slice(0, 3).join(', '));
  check(p.failed.length === 0, 'no missing local assets (sections)', p.failed.slice(0, 3).join(', '));
  check(p.errors.length === 0, 'no JavaScript errors (sections)', p.errors.slice(0, 3).join(' | '));
  await p.context().close();

  // ---- The Resources curtain --------------------------------------------
  // Opened at the foot of the page so the community model is not loading at the same time: in software rendering
  // three WebGL scenes at once stretch the curtain's clock-timed fall and rise into minutes
  p = await open(browser, `${SITE}#/share`);
  await wait(1200);
  const pillAt = await p.evaluate(() => { const b = document.querySelector('.site-nav .nav-pill'); const r = b.getBoundingClientRect(); const items = [...document.querySelectorAll('.site-nav li')]; return { tag: b.tagName, expanded: b.getAttribute('aria-expanded'), index: items.findIndex((li) => li.contains(b)), count: items.length, visible: r.width > 0 }; });
  check(pillAt.tag === 'BUTTON' && pillAt.expanded === 'false' && pillAt.visible && pillAt.index === Math.floor(pillAt.count / 2), 'a red Resources pill sits in the middle of the nav', JSON.stringify(pillAt));
  await p.locator('.site-nav .nav-pill').click();
  await p.waitForFunction(() => ['falling', 'open'].includes(document.querySelector('#curtain').dataset.state), null, { polling: 100, timeout: 10000 }).catch(() => {});
  const falling = await p.evaluate(() => ({ state: document.querySelector('#curtain').dataset.state, canvas: !!document.querySelector('.curtain-cloth canvas'), body: document.body.classList.contains('curtain-open') }));
  check((falling.state === 'falling' || falling.state === 'open') && falling.canvas && falling.body, 'pressing the pill drops a live cloth over the page', JSON.stringify(falling));
  await p.waitForFunction(() => document.querySelector('#curtain').dataset.state === 'open', null, { polling: 100, timeout: 15000 }).catch(() => {});
  await p.waitForFunction(() => getComputedStyle(document.querySelector('.fabric-layer')).opacity === '0', null, { polling: 100, timeout: 5000 }).catch(() => {});
  const down = await p.evaluate(() => ({ state: document.querySelector('#curtain').dataset.state, fabric: getComputedStyle(document.querySelector('.fabric-layer')).opacity, focus: document.activeElement.classList.contains('curtain-close'), items: document.querySelectorAll('.curtain-item').length, locks: document.querySelectorAll('.curtain-item .res-lock').length, groups: document.querySelectorAll('.curtain-group').length, newTab: [...document.querySelectorAll('a.curtain-link')].every((a) => a.target === '_blank' && a.rel.includes('noopener')), expanded: document.querySelector('.nav-pill').getAttribute('aria-expanded') }));
  check(down.state === 'open' && down.fabric === '0' && down.focus && down.items === 10 && down.locks === 10 && down.groups === 4 && down.newTab && down.expanded === 'true', 'with the curtain down the page fabric is gone, focus is on Close, and the ten destinations sit in four groups with their sign-in marks', JSON.stringify(down));
  await p.keyboard.press('Tab');
  await p.keyboard.press('Tab');
  check(await p.evaluate(() => document.querySelector('#curtain').contains(document.activeElement)), 'focus stays on the curtain while it is down');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => document.querySelector('#curtain').dataset.state === 'closed', null, { polling: 100, timeout: 30000 }).catch(() => {});
  await wait(400);
  const lifted = await p.evaluate(() => ({ hidden: document.querySelector('#curtain').hidden, body: document.body.classList.contains('curtain-open'), focus: document.activeElement.classList.contains('nav-pill') }));
  check(lifted.hidden && !lifted.body && lifted.focus, 'Escape lifts the curtain and hands focus back to the pill', JSON.stringify(lifted));
  await p.locator('.site-nav .nav-pill').click();
  await p.waitForFunction(() => document.querySelector('#curtain').dataset.state === 'open', null, { polling: 100, timeout: 15000 }).catch(() => {});
  // dispatched rather than pointer-clicked: the live cloth keeps the frame rate low in software rendering, so Playwright never sees the link as settled
  await p.locator('[data-curtain-go]').first().dispatchEvent('click');
  await p.waitForFunction(() => document.querySelector('#curtain').dataset.state === 'closed' && location.hash === '#/training', null, { polling: 100, timeout: 30000 }).catch(() => {}); // the rise is clock-timed, but software rendering can stretch it
  check((await p.evaluate(() => location.hash)) === '#/training' && (await p.evaluate(() => document.querySelector('#curtain').hidden)), 'the coach link lifts the curtain first, then goes to the training section');
  check(await p.evaluate(() => document.querySelectorAll('.site-footer').length === 1 && document.querySelector('.sitemap') && document.querySelectorAll('.sitemap-item').length === 10 && document.querySelector('.sitemap').compareDocumentPosition(document.querySelector('.site-footer')) & Node.DOCUMENT_POSITION_FOLLOWING), 'the same ten destinations sit at the very bottom of the page as a sitemap');
  await p.context().close();

  // ---- Engage page ----------------------------------------------------------
  p = await open(browser, `${BASE}engage.html`);
  await wait(1200);
  check(await p.locator('#engage-title').isVisible(), 'the Engage page opens on its title');
  check(await p.evaluate(() => { const f = document.querySelector('.engage-frame iframe'); return f && f.getAttribute('src').startsWith('https://engage.cloud.microsoft/embed/') && f.title === 'Viva Engage'; }), 'the Viva Engage feed is embedded');
  check(p.external.every((u) => u.startsWith('https://engage.cloud.microsoft/')), 'the Engage page reaches only Viva Engage', p.external.filter((u) => !u.startsWith('https://engage.cloud.microsoft/')).slice(0, 3).join(', '));
  check(p.errors.length === 0, 'no JavaScript errors on the Engage page', p.errors.join(' | '));
  await p.context().close();

  // ---- Direct story link and clipboard failure ---------------------------
  p = await open(browser, `${SITE}#/story/markham-heat`);
  await wait(1500);
  check(await isOpen(p), 'direct story link opens the story');
  check((await p.locator('#story-title').textContent()).includes('Markham'), 'direct link loads the right story');
  await p.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
    document.execCommand = () => false;
  });
  await p.locator('#drawer-content [data-copy="link"]').click();
  await wait(300);
  check(await p.locator('#drawer-content .manual-copy').isVisible(), 'clipboard failure offers the text to copy manually');
  await p.mouse.move(720, 450);
  await p.mouse.wheel(0, 600);
  await wait(800);
  const scrolled = await p.evaluate(() => Math.max(...['#story-drawer', '.drawer-panel', '.drawer-content'].map((s) => document.querySelector(s).scrollTop)));
  check(scrolled > 100, 'the mouse wheel scrolls the open story', `${scrolled}px`);
  check(p.errors.length === 0, 'no JavaScript errors on direct link', p.errors.join(' | '));
  await p.context().close();

  // ---- The coach (Training) ----------------------------------------------
  p = await open(browser, `${SITE}#/training`);
  await p.route('**/convai-widget-embed*', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await wait(1200);
  check((await p.locator('[data-coach-open]').count()) >= 5 && (await p.evaluate(() => document.querySelector('#coach-host').hidden)), 'every role-play scenario offers the coach, loaded only on request');
  await p.locator('#coach [data-coach-open]').first().dispatchEvent('click');
  await wait(800);
  const coach = await p.evaluate(() => ({ loaded: window.__impact.coachLoaded, agent: document.querySelector('elevenlabs-convai')?.getAttribute('agent-id'), shown: !document.querySelector('#coach-host').hidden, script: !!document.querySelector('script[src*="convai-widget-embed"]') }));
  check(coach.loaded && coach.agent === 'agent_3001m5kqwwswfbgs0w7err64yw6v' && coach.shown && coach.script, 'the coach widget mounts with its agent', JSON.stringify(coach));
  check(p.errors.length === 0, 'no JavaScript errors (coach)', p.errors.join(' | '));
  await p.context().close();

  // ---- Reduced motion -----------------------------------------------------
  p = await open(browser, `${SITE}#/community`, { reducedMotion: 'reduce' });
  await wait(1500);
  check((await p.evaluate(() => document.documentElement.dataset.motion)) === 'off', 'reduced motion respected from first render');
  check(await p.evaluate(() => !window.__impact.lenis), 'no smooth scrolling with reduced motion');
  check(await p.evaluate(() => [...document.querySelectorAll('video.film')].every((v) => v.paused)), 'films stay paused with reduced motion');

  await waitScene(p);
  await p.locator('.bar-btn[data-play]').click();
  await p.waitForFunction(() => window.__impact.room.phase === 'inside', null, { polling: 100, timeout: 20000 }).catch(() => {});
  check((await p.evaluate(() => window.__impact.tourStop === 0 && window.__impact.room.guided && window.__impact.room.place === 'hospital' && document.querySelector('#room').dataset.phase === 'inside')), 'the tour cuts straight inside with reduced motion', await p.evaluate(() => `${window.__impact.tourStop} ${window.__impact.room.phase} ${window.__impact.room.place}`));
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => window.__impact.room.phase === 'closed', null, { polling: 100, timeout: 15000 }).catch(() => {});
  await wait(300);
  check((await focus(p)) === 'overview' && !(await p.evaluate(() => window.__impact.playing)), 'Escape ends the tour and returns to the overview with reduced motion');
  await p.locator('.site-nav .nav-pill').click();
  await p.waitForFunction(() => document.querySelector('#curtain').dataset.state === 'open', null, { polling: 100, timeout: 10000 }).catch(() => {});
  const plain = await p.evaluate(() => ({ state: document.querySelector('#curtain').dataset.state, plain: document.querySelector('#curtain').classList.contains('is-plain'), canvas: !!document.querySelector('.curtain-cloth canvas') }));
  check(plain.state === 'open' && plain.plain && !plain.canvas, 'with reduced motion the curtain is a plain red panel that arrives at once', JSON.stringify(plain));
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => document.querySelector('#curtain').dataset.state === 'closed', null, { polling: 100, timeout: 5000 }).catch(() => {});
  await p.locator('[data-motion-toggle]').click();
  check((await p.evaluate(() => document.documentElement.dataset.motion)) === 'on', 'motion control toggles motion');
  check(p.errors.length === 0, 'no JavaScript errors with reduced motion', p.errors.join(' | '));
  await p.context().close();

  // ---- Mobile -------------------------------------------------------------
  const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  p = await open(browser, SITE, phone);
  await wait(3000);
  check((await p.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'no horizontal scroll at phone width');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('#fabric-layer')).display === 'none' && !document.querySelector('#fabric-layer canvas')), 'the fabric stays off on phones');
  await p.evaluate(() => document.querySelector('#explorer').scrollIntoView({ block: 'start' }));
  await wait(800);
  const card = await p.evaluate(() => {
    const c = document.querySelector('.journey-card--intro').getBoundingClientRect();
    const e = document.querySelector('#explorer').getBoundingClientRect();
    const b = document.querySelector('.journey-bar').getBoundingClientRect();
    return { inside: c.top >= e.top && c.bottom <= b.top && c.width <= 390, c: [c.top, c.bottom], e: [e.top, e.bottom], bar: b.top };
  });
  check(card.inside, 'the opening card fits a phone screen above the controls', JSON.stringify(card));
  await p.goto(`${SITE}#/story/3verest`);
  await wait(800);
  check((await p.evaluate(() => document.querySelector('#story-drawer').getBoundingClientRect().width)) === 390, 'story opens full width on mobile');
  await p.keyboard.press('Escape');
  await wait(600);
  await p.evaluate(() => document.querySelector('#explorer').scrollIntoView({ block: 'center' }));
  await p.locator('.place-label[data-place="hospital"]').dispatchEvent('click');
  await p.waitForFunction(() => window.__impact.room.phase === 'inside', null, { polling: 100, timeout: 45000 }).catch(() => {});
  const phoneRoom = await p.evaluate(() => { const c = document.querySelector('.room-line').getBoundingClientRect(); return { phase: window.__impact.room.phase, fits: c.left >= 0 && c.right <= 390 && c.bottom <= 844 }; });
  check(phoneRoom.phase === 'inside' && phoneRoom.fits, 'the room and its captions fit a phone screen', JSON.stringify(phoneRoom));
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => window.__impact.room.phase === 'closed', null, { polling: 100, timeout: 30000 }).catch(() => {});
  await p.keyboard.press('Escape');
  await wait(500);
  check(await p.evaluate(() => { const f = document.querySelector('#spine-frame').getBoundingClientRect(); const tiles = [...document.querySelectorAll('.promise-tile')]; return f.width <= innerWidth && f.height >= 400 && tiles.length === 5 && tiles.every((t) => t.getBoundingClientRect().width > innerWidth * 0.8); }), 'on phones the Spine canvas fits the screen and the promises stack');
  await p.evaluate(() => document.querySelector('#people-stage').scrollIntoView({ block: 'start' }));
  await wait(1500);
  check(await p.evaluate(() => { const b = document.querySelector('.site-nav .nav-pill'); const r = b.getBoundingClientRect(); const others = [...document.querySelectorAll('.site-nav li:not(.nav-pill-item)')]; return r.width > 0 && r.right <= innerWidth && others.every((li) => li.offsetParent === null); }), 'on phones the Resources pill stays in the header while the other nav items fold away');
  check(await p.evaluate(() => { const row = document.querySelector('.people-row'), c = document.querySelector('.people-story').getBoundingClientRect(); return row.scrollWidth > row.clientWidth && c.width > innerWidth * 0.8 && c.width <= innerWidth && document.body.scrollWidth <= innerWidth + 1; }), 'on phones the people line scrolls sideways and the story sits beneath it');
  check(p.errors.length === 0, 'no JavaScript errors on mobile', p.errors.join(' | '));
  // ---- The kiosk (version 2): the model alone, on a loop ------------------
  p = await open(browser, `${BASE}kiosk.html?rest=2&idle=6`, { viewport: { width: 1920, height: 1080 } });
  await p.waitForFunction(() => document.querySelector('#stage').dataset.sceneState !== 'loading', null, { polling: 100, timeout: 60000 });
  await p.waitForFunction(() => window.__kiosk.mode === 'loop', null, { polling: 100, timeout: 30000 }).catch(() => {}); // the first frames at 1080p are slow in software rendering
  const kioskStart = await p.evaluate(() => ({ mode: window.__kiosk.mode, state: document.querySelector('#stage').dataset.sceneState, dots: document.querySelectorAll('.kiosk-dot').length, chrome: !document.querySelector('.site-header') && !document.querySelector('.site-footer') && !document.querySelector('main') }));
  check(kioskStart.mode === 'loop' && kioskStart.state === 'ready' && kioskStart.dots === 6 && kioskStart.chrome, 'the kiosk shows the model alone, full screen, and starts its loop by itself', JSON.stringify(kioskStart));
  await p.waitForFunction(() => window.__kiosk.room.phase === 'inside', null, { polling: 200, timeout: 60000 }).catch(() => {});
  const kioskFirst = await p.evaluate(() => ({ phase: window.__kiosk.room.phase, place: window.__kiosk.room.place, index: window.__kiosk.index, on: [...document.querySelectorAll('.kiosk-dot')].findIndex((d) => d.classList.contains('is-on')), guided: window.__kiosk.room.guided }));
  check(kioskFirst.phase === 'inside' && kioskFirst.place === 'hospital' && kioskFirst.index === 0 && kioskFirst.on === 0 && kioskFirst.guided, 'the loop steps into the first story on its own and the first dot lights', JSON.stringify(kioskFirst));
  await p.locator('[data-room-leave]').first().click();
  await p.waitForFunction(() => window.__kiosk.room.phase === 'closed', null, { polling: 200, timeout: 30000 }).catch(() => {});
  check((await p.evaluate(() => window.__kiosk.mode)) === 'explore', 'a visitor who leaves the room holds the loop for themselves', await p.evaluate(() => window.__kiosk.mode));
  await p.waitForFunction(() => window.__kiosk.mode === 'loop', null, { polling: 300, timeout: 20000 }).catch(() => {});
  await p.waitForFunction(() => window.__kiosk.room.phase === 'inside', null, { polling: 200, timeout: 60000 }).catch(() => {});
  const kioskAgain = await p.evaluate(() => ({ mode: window.__kiosk.mode, phase: window.__kiosk.room.phase, place: window.__kiosk.room.place }));
  check(kioskAgain.mode === 'loop' && kioskAgain.phase === 'inside' && kioskAgain.place === 'hospital', 'once the visitor has gone the loop starts again from the first story', JSON.stringify(kioskAgain));
  check(p.failed.filter((f) => !f.includes('/voice/')).length === 0 && p.errors.length === 0, 'the kiosk page loads with no missing assets and no JavaScript errors', JSON.stringify([...p.failed, ...p.errors].slice(0, 3)));
  await p.context().close();

  await browser.close();

  // ---- No WebGL -------------------------------------------------------------
  const noGL = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  p = await open(noGL, `${SITE}#/community`);
  await waitScene(p);
  check((await sceneState(p)) === 'fallback', 'without WebGL the still of the community is shown');
  check(await p.evaluate(() => [...document.querySelectorAll('.place-label')].every((l) => l.offsetHeight > 0)), 'the place names are listed without WebGL');
  await p.locator('.place-label[data-place="aquatic"]').dispatchEvent('click');
  await p.waitForFunction(() => window.__impact.room.phase === 'inside', null, { polling: 100, timeout: 45000 }).catch(() => {});
  await wait(1500);
  check(await p.evaluate(() => window.__impact.room.phase === 'inside' && !document.querySelector('#room').classList.contains('has-pano') && Number(getComputedStyle(document.querySelector('.room-poster')).opacity) > 0.9 && !!document.querySelector('.room-line')), 'without WebGL the room shows as a still with its captions');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => window.__impact.room.phase === 'closed', null, { polling: 100, timeout: 30000 }).catch(() => {});
  await p.locator('.site-nav .nav-pill').click();
  await p.waitForFunction(() => document.querySelector('#curtain').dataset.state === 'open', null, { polling: 100, timeout: 10000 }).catch(() => {});
  check(await p.evaluate(() => document.querySelector('#curtain').dataset.state === 'open' && document.querySelector('#curtain').classList.contains('is-plain') && !document.querySelector('.curtain-cloth canvas')), 'without WebGL the curtain is a plain red panel');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => document.querySelector('#curtain').dataset.state === 'closed', null, { polling: 100, timeout: 5000 }).catch(() => {});
  check(p.failed.length === 0, 'no missing local assets without WebGL', p.failed.slice(0, 3).join(', '));
  check(p.errors.length === 0, 'no JavaScript errors without WebGL', p.errors.join(' | '));
  await noGL.close();
} catch (error) {
  console.error(error);
  failures++;
} finally {
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
