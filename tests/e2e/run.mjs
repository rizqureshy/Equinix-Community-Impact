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
const waitScene = (p) => p.waitForFunction(() => document.querySelector('#stage').dataset.sceneState !== 'loading', null, { timeout: 30000 });
const focus = (p) => p.evaluate(() => window.__impact.scene?.focus);
const step = (p) => p.evaluate(() => window.__impact.step);
/** Wait until the journey has settled on `expected` (camera travel, scrub and snap take a moment). */
async function settled(p, expected, ms = 8000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if ((await step(p)) === expected) {
      await wait(800);
      return true;
    }
    await wait(250);
  }
  return false;
}

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
  await p.evaluate(() => window.__impact.goToStep(2));
  await settled(p, 2);
  check((await step(p)) === 2 && (await focus(p)) === 'learning', 'moving to a stop frames its place and card', `${await step(p)} ${await focus(p)}`);
  check(await p.locator('.journey-card:not([hidden]) h3').textContent() === 'Learning centre', 'the card for the stop is showing');
  check(await p.evaluate(() => document.querySelector('.place-label.is-focus')?.dataset.place === 'learning'), 'the place label is highlighted');
  await p.locator('.journey-dot[data-go="4"]').dispatchEvent('click');
  await settled(p, 4);
  check((await step(p)) === 4 && (await focus(p)) === 'aquatic', 'journey dots move between stops', `${await step(p)} ${await focus(p)}`);
  // Labels behind the camera hide themselves; pick one that is in view
  const visiblePlace = await p.evaluate(() => [...document.querySelectorAll('.place-label:not(.is-offscreen):not(.is-focus)')].map((l) => l.dataset.place).find((pl) => pl !== 'shops'));
  // dispatched rather than pointer-clicked: floating labels can drift under the pointer while the camera eases
  await p.locator(`.place-label[data-place="${visiblePlace}"]`).dispatchEvent('click');
  await wait(4000);
  check(visiblePlace && (await focus(p)) === visiblePlace && (await step(p)) !== 4, 'place labels move to their stop', `${visiblePlace} ${await step(p)} ${await focus(p)}`);
  const before = await step(p);
  await p.locator('[data-step-dir="1"]').click();
  await settled(p, before + 1);
  check((await step(p)) === before + 1, 'next and previous move one stop', `${before} to ${await step(p)}`);
  await p.locator('.journey-dot[data-go="0"]').dispatchEvent('click');
  await settled(p, 0);
  const trigger = p.locator('.journey-card:not([hidden]) [data-story-trigger]');
  const storyId = await trigger.getAttribute('data-story-trigger');
  await trigger.click();
  await wait(700);
  check(await isOpen(p) && storyId === '3verest', 'story opens from a journey card');
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
  // The tour: plays through the stops with music, pauses on any choice
  await p.locator('[data-step-dir="-1"]').click();
  await settled(p, -1);
  check((await step(p)) === -1 && (await focus(p)) === 'overview', 'previous from the first stop returns to the overview');
  await p.locator('.bar-btn[data-play]').click();
  await wait(2800);
  check(await p.evaluate(() => window.__impact.playing && document.querySelector('.bar-btn[data-play]').getAttribute('aria-pressed') === 'true'), 'the tour starts from the control bar');
  check((await step(p)) === 0 && (await p.evaluate(() => !document.querySelector('#theme').paused)), 'the tour moves on and the music plays', `${await step(p)} paused=${await p.evaluate(() => document.querySelector('#theme').paused)}`);
  await p.locator('[data-mute]').click();
  await wait(1200);
  check(await p.evaluate(() => document.querySelector('#theme').paused && localStorage.getItem('impact-sound') === null), 'mute silences the music and is not remembered between visits');
  await p.locator('.journey-dot[data-go="3"]').dispatchEvent('click');
  await wait(600);
  check(await p.evaluate(() => !window.__impact.playing) && (await step(p)) === 3, 'choosing a place pauses the tour');
  await p.locator('#explorer').focus();
  await p.keyboard.press('ArrowRight');
  await wait(400);
  check((await step(p)) === 4, 'arrow keys move between places');
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
  await p.evaluate(() => {
    const r = document.querySelectorAll('.ledger-row')[3].getBoundingClientRect();
    scrollTo(0, r.top + scrollY - innerHeight * 0.3);
  });
  await wait(1800);
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
    [...document.querySelectorAll('.btn, .chip, .motion-toggle, .rail-btn, .journey-dot')]
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
  // Sunlight: a diffused light sits over the page, blended in, never in the way
  check(await p.evaluate(() => { const l = document.querySelector('#weather-light'); const cs = getComputedStyle(l); return cs.mixBlendMode === 'multiply' && cs.pointerEvents === 'none' && cs.position === 'fixed'; }), 'a diffused sunlight sits over the page and takes no clicks');
  check(p.external.length === 0, 'no requests leave the host (sections)', p.external.slice(0, 3).join(', '));
  check(p.failed.length === 0, 'no missing local assets (sections)', p.failed.slice(0, 3).join(', '));
  check(p.errors.length === 0, 'no JavaScript errors (sections)', p.errors.slice(0, 3).join(' | '));
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

  // ---- Reduced motion -----------------------------------------------------
  p = await open(browser, `${BASE}#/community`, { reducedMotion: 'reduce' });
  await wait(1500);
  check((await p.evaluate(() => document.documentElement.dataset.motion)) === 'off', 'reduced motion respected from first render');
  check(await p.evaluate(() => !window.__impact.lenis), 'no smooth scrolling with reduced motion');
  check(await p.evaluate(() => [...document.querySelectorAll('video.film')].every((v) => v.paused)), 'films stay paused with reduced motion');

  await waitScene(p);
  await p.locator('.journey-dot[data-go="3"]').dispatchEvent('click');
  await wait(600);
  check((await step(p)) === 3 && (await focus(p)) === 'homes', 'stops still change by control with reduced motion', `${await step(p)} ${await focus(p)}`);
  await p.locator('[data-motion-toggle]').click();
  check((await p.evaluate(() => document.documentElement.dataset.motion)) === 'on', 'motion control toggles motion');
  check(p.errors.length === 0, 'no JavaScript errors with reduced motion', p.errors.join(' | '));
  await p.context().close();

  // ---- Mobile -------------------------------------------------------------
  const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  p = await open(browser, BASE, phone);
  await wait(3000);
  check((await p.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'no horizontal scroll at phone width');
  await p.evaluate(() => document.querySelector('#explorer').scrollIntoView({ block: 'start' }));
  await p.evaluate(() => window.__impact.goToStep(1));
  await settled(p, 1);
  const card = await p.evaluate(() => {
    const c = document.querySelector('.journey-card:not([hidden])').getBoundingClientRect();
    const e = document.querySelector('#explorer').getBoundingClientRect();
    const b = document.querySelector('.journey-bar').getBoundingClientRect();
    return { inside: c.top >= e.top && c.bottom <= b.top && c.width <= 390, c: [c.top, c.bottom], e: [e.top, e.bottom], bar: b.top };
  });
  check(card.inside, 'journey card fits a phone screen above the controls', JSON.stringify(card));
  await p.goto(`${BASE}#/story/3verest`);
  await wait(800);
  check((await p.evaluate(() => document.querySelector('#story-drawer').getBoundingClientRect().width)) === 390, 'story opens full width on mobile');
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
  await p.locator('.place-label[data-place="aquatic"]').click();
  await settled(p, 4);
  check((await step(p)) === 4, 'place controls still work without WebGL', String(await step(p)));
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
