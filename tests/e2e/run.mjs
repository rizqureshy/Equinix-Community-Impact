// End-to-end checks against the production build.
// Usage: npm run build && npm run test:e2e
// Starts `vite preview`, blocks every request that leaves the local host,
// and exercises the experience on desktop, mobile, reduced motion and
// without WebGL. Exits non-zero if any assertion fails.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
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
  let p = await open(browser, BASE);
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
  await wait(700);
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
  await trigger.click();
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
  await wait(800);
  const spoken = await p.evaluate(() => { const v = document.querySelector('.room-voice'); return { src: v.getAttribute('src') || '', paused: v.paused, pressed: document.querySelector('[data-room-voice]').getAttribute('aria-pressed') }; });
  check(/hospital-1\.mp3$/.test(spoken.src) && !spoken.paused && spoken.pressed === 'true', 'the narrator reads the caption aloud', JSON.stringify(spoken));
  await p.locator('[data-room-voice]').click();
  await wait(300);
  check(await p.evaluate(() => document.querySelector('.room-voice').paused && !document.querySelector('.room-voice').getAttribute('src') && !window.__impact.room.voice), 'the voice control silences the narrator');
  await p.locator('[data-room-voice]').click();
  await wait(600);
  check(await p.evaluate(() => window.__impact.room.voice && !document.querySelector('.room-voice').paused), 'and brings the narrator back on the same caption');
  const lineBefore = await p.evaluate(() => window.__impact.room.line);
  await p.locator('[data-room-next]').click();
  await wait(600);
  const factLine = await p.evaluate(() => ({ line: window.__impact.room.line, fact: !!document.querySelector('.room-line--fact .room-line-source a'), kind: document.querySelector('.room-line')?.className }));
  // (the captions also advance on their own every 7 s, so one extra step is allowed under slow rendering)
  check(factLine.line > lineBefore && factLine.line <= lineBefore + 2 && (factLine.line !== 1 || factLine.fact), 'Next moves one caption on, and the figure carries its scope and source', JSON.stringify(factLine));
  await p.locator('[data-room-next]').click();
  await p.locator('[data-room-next]').click();
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
  p = await open(browser, `${BASE}#/chapter/community`);
  await wait(2500);
  const top = await p.evaluate(() => document.querySelector('#chapter-community').getBoundingClientRect().top);
  check(Math.abs(top) < 40, 'chapter route lands on its chapter', `${Math.round(top)}px`);
  check(await p.evaluate(() => document.querySelector('.site-nav a[href="#/chapter/care"]').getAttribute('aria-current') === 'true'), 'navigation marks the current section');
  await p.goto(`${BASE}#/explore/discovery`);
  await wait(1200);
  check((await p.evaluate(() => window.__impact.store.get().section)) === 'journey', 'older explore links land on the community');
  await p.goto(`${BASE}#/principles`);
  let promisesTop = Infinity;
  for (let i = 0; i < 24 && Math.abs(promisesTop) >= 40; i++) {
    await wait(250);
    promisesTop = await p.evaluate(() => document.querySelector('#promises').getBoundingClientRect().top);
  }
  check(Math.abs(promisesTop) < 40, 'older principles links land on the promises', `${Math.round(promisesTop)}px`);
  await wait(1600); // let the smooth scroll finish before scrolling by hand
  // The ledger: the row at the reading line is current and its proof shows
  // Scroll to the fourth promise and give the smooth scroll time to settle
  for (let i = 0; i < 12; i++) {
    await p.evaluate(() => {
      const r = document.querySelectorAll('.ledger-row')[3].getBoundingClientRect();
      scrollTo(0, r.top + scrollY - innerHeight * 0.3);
    });
    await wait(500);
    if ((await p.evaluate(() => document.querySelector('.ledger').dataset.active)) === '3') break;
  }
  await wait(600);
  const ledgerState = await p.evaluate(() => {
    const img = document.querySelector('.proof:not([hidden]) .proof-art');
    return {
      active: document.querySelector('.ledger').dataset.active,
      current: document.querySelector('.ledger-row[aria-current="true"]')?.dataset.promise,
      proof: document.querySelector('.proof:not([hidden]) .proof-text')?.textContent,
      photo: img && img.complete && img.naturalWidth > 0 && img.getBoundingClientRect().height > 400,
    };
  });
  check(ledgerState.active === '3' && ledgerState.current === '3' && /water-based cooling/.test(ledgerState.proof), 'the promise at the reading line shows its proof', JSON.stringify(ledgerState));
  check(ledgerState.photo === true, 'a large photograph stands behind the proof', JSON.stringify(ledgerState));
  await p.locator('[data-promise-go="1"]').click();
  await wait(2200);
  check((await p.evaluate(() => document.querySelector('.ledger').dataset.active)) === '1', 'choosing a promise moves the ledger to it');

  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.goto(`${BASE}#/share`);
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
  await p.goto(`${BASE}#/training`);
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

  // ---- Engage page ----------------------------------------------------------
  p = await open(browser, `${BASE}engage.html`);
  await wait(1200);
  check(await p.locator('#engage-title').isVisible(), 'the Engage page opens on its title');
  check(await p.evaluate(() => { const f = document.querySelector('.engage-frame iframe'); return f && f.getAttribute('src').startsWith('https://engage.cloud.microsoft/embed/') && f.title === 'Viva Engage'; }), 'the Viva Engage feed is embedded');
  check(p.external.every((u) => u.startsWith('https://engage.cloud.microsoft/')), 'the Engage page reaches only Viva Engage', p.external.filter((u) => !u.startsWith('https://engage.cloud.microsoft/')).slice(0, 3).join(', '));
  check(p.errors.length === 0, 'no JavaScript errors on the Engage page', p.errors.join(' | '));
  await p.context().close();

  // ---- Direct story link and clipboard failure ---------------------------
  p = await open(browser, `${BASE}#/story/markham-heat`);
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
  p = await open(browser, `${BASE}#/training`);
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
  p = await open(browser, `${BASE}#/community`, { reducedMotion: 'reduce' });
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
  await p.locator('[data-motion-toggle]').click();
  check((await p.evaluate(() => document.documentElement.dataset.motion)) === 'on', 'motion control toggles motion');
  check(p.errors.length === 0, 'no JavaScript errors with reduced motion', p.errors.join(' | '));
  await p.context().close();

  // ---- Mobile -------------------------------------------------------------
  const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  p = await open(browser, BASE, phone);
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
  await p.goto(`${BASE}#/story/3verest`);
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
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.ledger-panel')).display === 'none' && [...document.querySelectorAll('.ledger-inline')].every((el) => el.offsetHeight > 0)), 'on phones every promise shows its photograph and proof inline');
  check(p.errors.length === 0, 'no JavaScript errors on mobile', p.errors.join(' | '));
  await browser.close();

  // ---- No WebGL -------------------------------------------------------------
  const noGL = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  p = await open(noGL, `${BASE}#/community`);
  await waitScene(p);
  check((await sceneState(p)) === 'fallback', 'without WebGL the still of the community is shown');
  check(await p.evaluate(() => [...document.querySelectorAll('.place-label')].every((l) => l.offsetHeight > 0)), 'the place names are listed without WebGL');
  await p.locator('.place-label[data-place="aquatic"]').dispatchEvent('click');
  await p.waitForFunction(() => window.__impact.room.phase === 'inside', null, { polling: 100, timeout: 45000 }).catch(() => {});
  await wait(1500);
  check(await p.evaluate(() => window.__impact.room.phase === 'inside' && !document.querySelector('#room').classList.contains('has-pano') && Number(getComputedStyle(document.querySelector('.room-poster')).opacity) > 0.9 && !!document.querySelector('.room-line')), 'without WebGL the room shows as a still with its captions');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => window.__impact.room.phase === 'closed', null, { polling: 100, timeout: 30000 }).catch(() => {});
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
