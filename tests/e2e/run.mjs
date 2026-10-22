// End-to-end checks against the production build.
// Usage: npm run build && npm run test:e2e
// Starts `vite preview`, blocks every request that leaves the local host,
// and exercises the experience on desktop, mobile and with motion off.
// Exits non-zero if any assertion fails.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
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
  const context = await browser.newContext({ viewport, permissions: ['clipboard-read', 'clipboard-write'], ...ctxOpts });
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
  await page.goto(url, { waitUntil: 'load' });
  return page;
}
const isOpen = (p) => p.evaluate(() => document.querySelector('#story-drawer').open);
const chapter = (p) => p.evaluate(() => window.__impact.chapter);
const shape = (p) => p.evaluate(() => window.__impact.field.shape);
const activeChapter = (p) => p.evaluate(() => document.querySelector('.chapter.is-active')?.id);
/** Wait until the theatre has settled on chapter `expected` (smooth scrolling takes a moment). */
async function settled(p, expected, ms = 6000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if ((await chapter(p)) === expected) {
      await wait(500);
      return true;
    }
    await wait(150);
  }
  return false;
}

try {
  const browser = await chromium.launch();

  // ---- Arrival and the theatre ---------------------------------------------
  let p = await open(browser, BASE);
  check(await p.locator('h1').isVisible(), 'headline visible on arrival');
  await wait(1500);
  check(await p.evaluate(() => !!window.__impact.lenis), 'smooth scrolling active when motion is on');
  check(await p.evaluate(() => { const c = document.querySelector('#field'); return c.width > 0 && !c.classList.contains('is-hidden'); }), 'the field is drawing behind the hero');
  check((await shape(p)) === 'strands', 'the hero shows light leaving the building', await shape(p));
  check(await p.evaluate(() => document.querySelectorAll('.chapter').length === 6 && document.querySelectorAll('.rail-item').length === 6), 'six chapters on the stage with a rail');

  await p.evaluate(() => window.__impact.goToChapter(2));
  check(await settled(p, 2), 'the theatre moves to chapter three on request');
  check((await activeChapter(p)) === 'chapter-opportunity', 'chapter three is on stage', await activeChapter(p));
  check((await shape(p)) === 'ascent', 'the field takes the chapter form', await shape(p));
  check(await p.evaluate(() => location.hash === '#/chapter/opportunity'), 'the hash follows the chapter', await p.evaluate(() => location.hash));
  check(await p.evaluate(() => document.querySelector('#sequence b').textContent === '03' && document.querySelector('#sequence').classList.contains('is-visible')), 'the sequence counter reads 03');
  check(await p.evaluate(() => document.querySelector('.chapter.is-active .portal img').complete), 'the chapter photograph is loaded');

  await p.click('.rail-item[data-go="4"]');
  check(await settled(p, 4), 'the rail moves between chapters');
  check((await shape(p)) === 'ripples', 'the heat chapter draws ripples', await shape(p));

  await p.focus('#stage');
  await p.keyboard.press('ArrowRight');
  check(await settled(p, 5), 'arrow keys move the stage');
  check((await shape(p)) === 'mark', 'the last chapter draws the mark', await shape(p));
  await p.keyboard.press('ArrowLeft');
  check(await settled(p, 4), 'arrow left steps back');

  // ---- Stories ---------------------------------------------------------------
  await p.click('.chapter.is-active [data-story-trigger]');
  await wait(400);
  check(await isOpen(p), 'a chapter opens its story');
  check(await p.evaluate(() => location.hash === '#/story/pa10-heat'), 'the story has its own link', await p.evaluate(() => location.hash));
  check(await p.evaluate(() => document.activeElement === document.querySelector('.drawer-close')), 'focus moves into the story');
  check(await p.evaluate(() => /Sources/.test(document.querySelector('#drawer-content').textContent) && document.querySelectorAll('#drawer-content .story-sources a').length >= 1), 'the story shows its sources');
  await p.click('#drawer-content [data-copy="summary"]');
  await wait(400);
  check(await p.evaluate(() => document.querySelector('#toast').classList.contains('is-visible') || !!document.querySelector('.manual-copy')), 'copying a summary gives feedback');
  await p.keyboard.press('Escape');
  await wait(600);
  check(!(await isOpen(p)), 'Escape closes the story');
  check(await p.evaluate(() => location.hash === '#/chapter/resources'), 'closing returns to the chapter link', await p.evaluate(() => location.hash));
  check(await p.evaluate(() => document.activeElement?.dataset.storyTrigger === 'pa10-heat'), 'focus returns to the trigger');

  // ---- Direct links --------------------------------------------------------------
  await p.goto(`${BASE}#/story/3verest`, { waitUntil: 'load' });
  await wait(1200);
  check(await isOpen(p), 'a direct story link opens the story on arrival');
  check(await p.evaluate(() => document.querySelector('#story-title').textContent.includes('Medical images')), 'the linked story is the one shown');
  await p.goto('about:blank');
  await p.goto(`${BASE}#/promises`, { waitUntil: 'load' });
  await wait(1500);
  check(await p.evaluate(() => Math.abs(document.querySelector('#promises').getBoundingClientRect().top) < 80), 'a section link lands on the section');
  check(await p.evaluate(() => document.querySelector('#field').classList.contains('is-hidden')), 'the field hands over once the theatre is done');

  // ---- Promises, library, day --------------------------------------------------------
  await p.click('[data-promise="2"]');
  await wait(300);
  check(await p.evaluate(() => document.querySelector('.promise-frame.is-active').dataset.index === '2' && document.querySelector('.promise[data-index="2"] .promise-body').hidden === false), 'opening a promise changes the picture beside it');
  await p.evaluate(() => (location.hash = '#/share'));
  await wait(1800);
  check(await p.evaluate(() => Math.abs(document.querySelector('#share').getBoundingClientRect().top) < 80), 'an in-page section link travels to the section', await p.evaluate(() => Math.round(document.querySelector('#share').getBoundingClientRect().top)));
  await p.click('.chip[data-filter-group="topic"][data-filter="care"]');
  const visible = await p.evaluate(() => Array.from(document.querySelectorAll('#library .card')).filter((c) => !c.hidden).map((c) => c.dataset.topic));
  check(visible.length === 2 && visible.every((t) => t === 'care'), 'the library filters by theme', visible.join(','));
  await p.evaluate(() => (location.hash = '#/day'));
  await wait(1800);
  const before = await p.evaluate(() => document.querySelector('#day-track').getBoundingClientRect().left);
  await p.evaluate(() => scrollBy(0, innerHeight * 2));
  await wait(1200);
  const after = await p.evaluate(() => document.querySelector('#day-track').getBoundingClientRect().left);
  check(after < before - 200, 'the day moves sideways as the page scrolls', `${Math.round(before)} -> ${Math.round(after)}`);
  check(await p.evaluate(() => Array.from(document.querySelectorAll('.day video')).some((v) => !v.paused || v.readyState > 0)), 'films in view start playing');

  check(p.external.length === 0, 'no request left the local host', p.external.slice(0, 3).join(' '));
  check(p.failed.length === 0, 'no failed requests', p.failed.slice(0, 3).join(' '));
  check(p.errors.length === 0, 'no page errors', p.errors.slice(0, 2).join(' | '));
  await p.context().close();

  // ---- Motion off ---------------------------------------------------------------------
  p = await open(browser, BASE, { reducedMotion: 'reduce' });
  await wait(1000);
  check(await p.evaluate(() => document.documentElement.dataset.motion === 'off'), 'reduced motion is respected');
  check(await p.evaluate(() => !window.__impact.lenis), 'no smooth scrolling with motion off');
  check(await p.evaluate(() => document.querySelector('.motion-label').textContent === 'Play motion'), 'the toggle offers to play motion');
  await p.evaluate(() => window.__impact.goToChapter(1));
  await wait(500);
  check((await chapter(p)) === 1 && (await activeChapter(p)) === 'chapter-discovery', 'chapters still change with motion off');
  check(await p.evaluate(() => document.querySelector('#day').classList.contains('is-rail')), 'the day is a plain rail with motion off');
  check(p.errors.length === 0, 'no page errors with motion off', p.errors.slice(0, 2).join(' | '));
  await p.context().close();

  // ---- Phone -----------------------------------------------------------------------------
  p = await open(browser, BASE, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await wait(1200);
  check(await p.evaluate(() => document.body.scrollWidth <= innerWidth + 1), 'no horizontal overflow on a phone', await p.evaluate(() => `${document.body.scrollWidth} > ${innerWidth}`));
  check(await p.evaluate(() => getComputedStyle(document.querySelector('#site-nav')).display === 'none'), 'the menu is closed by default');
  await p.tap('#menu-toggle');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('#site-nav')).display !== 'none'), 'the menu opens');
  await p.tap('#site-nav a[data-nav="journey"]');
  check(await settled(p, 0), 'the menu leads to the story');
  check(await p.evaluate(() => { const r = document.querySelector('.chapter.is-active .portal').getBoundingClientRect(); return r.height > 100 && r.bottom < innerHeight; }), 'the chapter photograph fits a phone screen');
  check(await p.evaluate(() => document.querySelector('#day').classList.contains('is-rail')), 'the day is a swipe rail on a phone');
  check(p.errors.length === 0, 'no page errors on a phone', p.errors.slice(0, 2).join(' | '));
  await p.context().close();

  // ---- Engage page --------------------------------------------------------------------------
  p = await open(browser, `${BASE}engage.html`);
  check(await p.locator('h1').isVisible(), 'the Engage page renders');
  check(await p.evaluate(() => !!document.querySelector('iframe[title="Viva Engage"]')), 'the Viva Engage feed is embedded');
  check(p.errors.length === 0, 'no page errors on Engage', p.errors.slice(0, 2).join(' | '));
  await p.context().close();

  await browser.close();
} catch (e) {
  console.error(e);
  failures++;
} finally {
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
