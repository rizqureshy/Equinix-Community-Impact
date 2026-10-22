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
const near = (p, sel, tol = 140) => p.evaluate(({ sel, tol }) => Math.abs(document.querySelector(sel).getBoundingClientRect().top) < tol, { sel, tol });
const topOf = (p, sel) => p.evaluate((sel) => Math.round(document.querySelector(sel).getBoundingClientRect().top), sel);

try {
  const browser = await chromium.launch();

  // ---- Arrival ---------------------------------------------------------------
  let p = await open(browser, BASE);
  check(await p.locator('h1').isVisible(), 'headline visible on arrival');
  await wait(1200);
  check(await p.evaluate(() => !!window.__impact.lenis), 'smooth scrolling active when motion is on');
  check(await p.evaluate(() => document.querySelectorAll('.pillar-link').length === 5), 'the five pillars are the way in');
  check(await p.evaluate(() => document.querySelector('.hero-mosaic img').complete), 'hero photographs are loaded');

  // ---- The map -----------------------------------------------------------------
  check(await p.evaluate(() => document.querySelector('#map svg') && document.querySelectorAll('#map .pin').length === 16), 'the map draws with sixteen pins', await p.evaluate(() => document.querySelectorAll('#map .pin').length));
  check(await p.evaluate(() => document.querySelector('#map .map-land').getAttribute('d').length > 10000), 'land is drawn');
  await p.click('.place-item[data-place="saint-denis"]');
  await wait(400);
  check(await p.evaluate(() => window.__impact.map.selected === 'saint-denis'), 'choosing a place in the list selects its pin');
  check(await p.evaluate(() => !document.querySelector('#map-panel-detail').hidden && /Saint-Denis/.test(document.querySelector('#map-panel-detail').textContent)), 'the panel shows the place');
  check(await p.evaluate(() => document.querySelector('#map .pin[data-place="saint-denis"]').classList.contains('is-selected')), 'the pin is marked selected');
  await p.click('#map .pin[data-place="sydney"] .pin-hit', { force: true });
  await wait(400);
  check(await p.evaluate(() => window.__impact.map.selected === 'sydney' && document.querySelectorAll('#map-panel-detail .place-card').length === 2), 'clicking a pin shows its two stories');
  check(await p.evaluate(() => document.querySelectorAll('#map .map-arc.is-lit').length === 3), 'the research arcs light up from Sydney');
  await p.click('[data-map-filter="resources"]');
  await wait(300);
  check(await p.evaluate(() => document.querySelector('#map .pin[data-place="london"]').classList.contains('is-dim') && !document.querySelector('#map .pin[data-place="markham"]').classList.contains('is-dim')), 'filtering by pillar dims the other pins');
  check(await p.evaluate(() => window.__impact.map.selected === null && document.querySelector('#map-panel-detail').hidden), 'a filtered-out selection is cleared');
  check(await p.evaluate(() => Array.from(document.querySelectorAll('.place-item')).filter((b) => !b.hidden).every((b) => b.dataset.topic === 'resources')), 'the list follows the filter');
  await p.click('[data-map-filter="all"]');
  await p.focus('#map .pin[data-place="markham"]');
  await p.keyboard.press('Enter');
  await wait(300);
  check(await p.evaluate(() => window.__impact.map.selected === 'markham'), 'pins work from the keyboard');

  // ---- Stories from the map and elsewhere ------------------------------------------
  await p.click('#map-panel-detail [data-story-trigger]');
  await wait(400);
  check(await isOpen(p), 'a place opens its story');
  check(await p.evaluate(() => location.hash === '#/story/markham-heat'), 'the story has its own link', await p.evaluate(() => location.hash));
  check(await p.evaluate(() => document.activeElement === document.querySelector('.drawer-close')), 'focus moves into the story');
  check(await p.evaluate(() => document.querySelectorAll('#drawer-content .story-sources a').length >= 1), 'the story shows its sources');
  await p.click('#drawer-content [data-copy="summary"]');
  await wait(400);
  check(await p.evaluate(() => document.querySelector('#toast').classList.contains('is-visible') || !!document.querySelector('.manual-copy')), 'copying a summary gives feedback');
  await p.keyboard.press('Escape');
  await wait(600);
  check(!(await isOpen(p)), 'Escape closes the story');
  check(await p.evaluate(() => document.activeElement?.dataset.storyTrigger === 'markham-heat'), 'focus returns to the trigger');

  // ---- Pillars ------------------------------------------------------------------------
  await p.evaluate(() => (location.hash = '#/chapter/opportunity'));
  await wait(1800);
  check(await near(p, '#chapter-opportunity', 160), 'a pillar link lands on the pillar', await topOf(p, '#chapter-opportunity'));
  check(await p.evaluate(() => document.querySelector('#pillar-tabs a[data-tab="opportunity"]').getAttribute('aria-current') === 'true'), 'the sticky tabs mark the pillar in view');
  check(await p.evaluate(() => document.querySelector('#site-nav a[data-nav="stories"]').getAttribute('aria-current') === 'true'), 'the header marks Pillars');
  check(await p.evaluate(() => document.querySelectorAll('.pillar').length === 5 && document.querySelectorAll('.pillar .lead-story').length === 5 && document.querySelectorAll('.story-mini').length === 6), 'five pillars, five lead stories, six more');
  check(await p.evaluate(() => window.__impact.store.get().topic === 'opportunity'), 'state follows the pillar in view');
  await p.click('#chapter-opportunity .lead-story [data-story-trigger]');
  await wait(400);
  check(await isOpen(p) && (await p.evaluate(() => location.hash === '#/story/pathways-to-tech')), 'a lead story opens');
  await p.keyboard.press('Escape');
  await wait(500);

  // ---- Progress ------------------------------------------------------------------------
  await p.evaluate(() => (location.hash = '#/progress'));
  await wait(1800);
  check(await near(p, '#progress', 120), 'the progress link lands on the section', await topOf(p, '#progress'));
  check(await p.evaluate(() => document.querySelectorAll('.milestone').length === 8 && document.querySelectorAll('.milestone--commitment').length === 2), 'eight milestones, two of them commitments');
  const first = await p.evaluate(() => document.querySelector('.milestone').getBoundingClientRect().left);
  check(first > 40, 'the first milestone starts inside the margin', String(Math.round(first)));
  const tl = await p.locator('#timeline').boundingBox();
  await p.mouse.move(tl.x + tl.width * 0.7, tl.y + tl.height / 2);
  await p.mouse.down();
  await p.mouse.move(tl.x + tl.width * 0.2, tl.y + tl.height / 2, { steps: 12 });
  await p.mouse.up();
  await wait(300);
  check(await p.evaluate(() => document.querySelector('#timeline').scrollLeft > 200), 'the timeline drags sideways', await p.evaluate(() => document.querySelector('#timeline').scrollLeft));
  await p.evaluate(() => document.querySelector('.measures').scrollIntoView());
  await wait(2200);
  check(await p.evaluate(() => document.querySelector('.number-digits').textContent === '3.5'), 'numbers count up to their value', await p.evaluate(() => document.querySelector('.number-digits').textContent));
  check(await p.evaluate(() => document.querySelector('.meter').classList.contains('is-in')), 'meters fill when in view');

  // ---- Promises and library -------------------------------------------------------------
  await p.evaluate(() => (location.hash = '#/promises'));
  await wait(1600);
  await p.click('[data-promise="2"]');
  await wait(300);
  check(await p.evaluate(() => document.querySelector('.promise-frame.is-active').dataset.index === '2' && document.querySelector('.promise[data-index="2"] .promise-body').hidden === false), 'opening a promise changes the picture beside it');
  await p.evaluate(() => (location.hash = '#/share'));
  await wait(1600);
  check(await near(p, '#share', 120), 'the library link lands on the library', await topOf(p, '#share'));
  await p.click('.chip[data-filter-group="topic"][data-filter="care"]');
  const visible = await p.evaluate(() => Array.from(document.querySelectorAll('#library .card')).filter((c) => !c.hidden).map((c) => c.dataset.topic));
  check(visible.length === 2 && visible.every((t) => t === 'care'), 'the library filters by pillar', visible.join(','));

  // ---- Direct links ------------------------------------------------------------------------
  await p.goto('about:blank');
  await p.goto(`${BASE}#/story/3verest`, { waitUntil: 'load' });
  await wait(1200);
  check(await isOpen(p) && (await p.evaluate(() => document.querySelector('#story-title').textContent.includes('Medical images'))), 'a direct story link opens the story on arrival');
  await p.goto('about:blank');
  await p.goto(`${BASE}#/community`, { waitUntil: 'load' });
  await wait(1200);
  check(await near(p, '#community', 120), 'a direct section link lands on the section', await topOf(p, '#community'));
  check(await p.evaluate(() => document.querySelectorAll('.pillar-tabs a').length === 5), 'the pillar tabs are present');

  check(p.external.length === 0, 'no request left the local host', p.external.slice(0, 3).join(' '));
  check(p.failed.length === 0, 'no failed requests', p.failed.slice(0, 3).join(' '));
  check(p.errors.length === 0, 'no page errors', p.errors.slice(0, 2).join(' | '));
  await p.context().close();

  // ---- Motion off ---------------------------------------------------------------------
  p = await open(browser, BASE, { reducedMotion: 'reduce' });
  await wait(800);
  check(await p.evaluate(() => document.documentElement.dataset.motion === 'off'), 'reduced motion is respected');
  check(await p.evaluate(() => !window.__impact.lenis), 'no smooth scrolling with motion off');
  check(await p.evaluate(() => document.querySelector('.motion-label').textContent === 'Play motion'), 'the toggle offers to play motion');
  await p.evaluate(() => document.querySelector('.measures').scrollIntoView());
  await wait(600);
  check(await p.evaluate(() => document.querySelector('.number-digits').textContent === '3.5'), 'numbers show their value at once with motion off');
  await p.click('.place-item[data-place="chicago"]');
  await wait(200);
  check(await p.evaluate(() => window.__impact.map.selected === 'chicago'), 'the map still works with motion off');
  check(p.errors.length === 0, 'no page errors with motion off', p.errors.slice(0, 2).join(' | '));
  await p.context().close();

  // ---- Phone -----------------------------------------------------------------------------
  p = await open(browser, BASE, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await wait(1000);
  check(await p.evaluate(() => document.body.scrollWidth <= innerWidth + 1), 'no horizontal overflow on a phone', await p.evaluate(() => `${document.body.scrollWidth} > ${innerWidth}`));
  check(await p.evaluate(() => getComputedStyle(document.querySelector('#site-nav')).display === 'none'), 'the menu is closed by default');
  await p.tap('#menu-toggle');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('#site-nav')).display !== 'none'), 'the menu opens');
  await p.tap('#site-nav a[data-nav="progress"]');
  await wait(1500);
  check(await near(p, '#progress', 140), 'the menu leads to a section', await topOf(p, '#progress'));
  check(await p.evaluate(() => getComputedStyle(document.querySelector('#site-nav')).display === 'none'), 'the menu closes after a choice');
  await p.evaluate(() => (location.hash = '#/community'));
  await wait(1200);
  await p.tap('.place-item[data-place="brazil"]');
  await wait(300);
  check(await p.evaluate(() => window.__impact.map.selected === 'brazil' && !document.querySelector('#map-panel-detail').hidden), 'places open on a phone');
  check(await p.evaluate(() => { const r = document.querySelector('#map svg').getBoundingClientRect(); return r.width > 300 && r.width <= innerWidth; }), 'the map fits a phone screen');
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
