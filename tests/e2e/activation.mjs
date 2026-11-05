// Browser checks for the Public Sector AI Activation page against the production build.
// Usage: npm run build && npm run test:e2e:activation
// Blocks every request that leaves the local host and exercises the reactive
// Today panel at several dates, the cohort and path choices, the activity
// guide, progress, copy, the calendar file and phone width.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4192;
const BASE = `http://localhost:${PORT}/activation/index.html`;
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
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  return page;
}
const text = (p, sel) => p.locator(sel).first().textContent();
const drawerOpen = (p) => p.evaluate(() => document.querySelector('#activity-drawer').open);

const launchOpts = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
try {
  const browser = await chromium.launch(launchOpts);

  // ---- A program day --------------------------------------------------------
  let p = await open(browser, `${BASE}?date=2026-11-18`);
  await wait(800);
  check((await text(p, '#hero-title')).includes('AI Activation Program'), 'the page opens on its title');
  check((await text(p, '#today-card')).includes('Week 2, Day 8 of 20') && (await text(p, '#today-title')).includes('The Value Case Under Pressure'), 'on a program day the Today panel shows that activity');
  check(await p.evaluate(() => document.querySelector('#tab-2').getAttribute('aria-selected') === 'true' && document.querySelector('#panel-2').classList.contains('is-active')), 'the current week is selected');
  check(await p.evaluate(() => document.querySelectorAll('.day').length === 20 && document.querySelectorAll('#panel-2 .day').length === 5 && document.querySelector('#panel-2 .day.is-today')?.textContent.includes('The Value Case')), 'twenty day cards, five in the week, today marked');
  check(await p.evaluate(() => [...document.querySelectorAll('.tab')].map((t) => t.textContent).join(' ').includes('Rethink AI') && document.querySelectorAll('.tab').length === 4), 'four week tabs');

  // Cohort choice tailors the guide and is remembered
  await p.locator('#cohort-picker [data-cohort="sled"]').click();
  await wait(300);
  check(await p.evaluate(() => localStorage.getItem('psaa-cohort') === '"sled"' && document.querySelector('#cohort-context').textContent.includes('campus')), 'choosing a cohort is remembered and explained');

  // Open the guide from the day card
  await p.locator('#panel-2 .day.is-today').click();
  await wait(700);
  check(await drawerOpen(p), 'a day card opens the activity guide');
  
  check((await p.evaluate(() => location.hash)) === '#/activity/w2-wed', 'the guide has a shareable route', await p.evaluate(() => location.hash));
  check(await p.evaluate(() => document.querySelectorAll('#steps .step').length === 5 && document.querySelector('.prompt').textContent.includes('{') && document.querySelector('#lens-text').textContent.includes('CIO') && !document.querySelector('.lens-all')), 'the guide shows steps, a starter prompt and the chosen cohort lens only');
  check(await p.evaluate(() => { const h = document.querySelector('.act-body').textContent; return h.includes('Why it matters') && h.includes('Share on Viva Engage') && h.includes('Check before you post') && h.includes('The AI skill it teaches'); }), 'the guide has why, share, check and skill sections');

  // Timer highlights the first step
  await p.locator('[data-timer="toggle"]').click();
  await wait(1300);
  check(await p.evaluate(() => document.querySelector('#steps .step[data-step="0"]').classList.contains('is-current') && document.querySelector('#timer b').textContent !== '00:00'), 'the timer runs and highlights the current step');
  await p.locator('[data-timer="reset"]').click();

  // Copy the prompt
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.locator('[data-copy-prompt]').click();
  await wait(300);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  check(clip.includes('Make the strongest case for the alternative'), 'copy prompt copies the starter prompt');
  check((await text(p, '#toast')).includes('Copied'), 'copy confirms success');

  // Mark done, progress updates everywhere
  await p.locator('[data-toggle-done]').click();
  await wait(400);
  check(await p.evaluate(() => localStorage.getItem('psaa-done') === '["w2-wed"]' && document.querySelector('.progress-ring b').textContent === '5%' && document.querySelector('#tab-2 .tab-done').textContent === '1/5' && document.querySelector('[data-toggle-done]').getAttribute('aria-pressed') === 'true'), 'marking done updates the ring, the week tab and the button');
  check(await p.evaluate(() => document.querySelector('#panel-2 .day.is-done')?.textContent.includes('The Value Case')), 'the day card shows done');

  // Next activity, then close with Escape
  await p.locator('.act-nav [data-open="w2-thu"]').click();
  await wait(500);
  check((await text(p, '#drawer-title')).includes('From Signal to Conversation') && (await p.evaluate(() => location.hash)) === '#/activity/w2-thu', 'next moves to the following day');
  await p.keyboard.press('Escape');
  await wait(600);
  check(!(await drawerOpen(p)) && !(await p.evaluate(() => location.hash)).startsWith('#/activity/'), 'Escape closes the guide and clears the route');

  // Week tabs and the learn, share, materials and dates sections
  await p.locator('[data-week="3"]').click();
  await wait(300);
  check(await p.evaluate(() => document.querySelector('#panel-3').classList.contains('is-active') && document.querySelectorAll('#panel-3 .video').length === 3), 'week 3 shows its three videos');
  check(await p.evaluate(() => document.querySelectorAll('#learn-grid .video').length === 9 && document.querySelectorAll('#learn-grid .pending').length === 9), 'the learn section lists every video with its placeholder until a link is added');
  check(await p.evaluate(() => document.querySelector('#engage .engage-pending') && document.querySelector('#engage a[href^="https://engage.cloud.microsoft"]')), 'the share section explains the Viva Engage community is pending and links out');
  check(await p.evaluate(() => document.querySelectorAll('#materials-list .resource').length === 8 && document.querySelectorAll('#timeline li').length === 8 && document.querySelector('#timeline li.is-next')?.textContent.includes('November 20')), 'materials and key dates are listed with the next date marked');
  check(await p.evaluate(() => { const t = window.__psaa.icsText(); return t.startsWith('BEGIN:VCALENDAR') && (t.match(/BEGIN:VEVENT/g) || []).length === 20 && t.includes('DTSTART;VALUE=DATE:20261109') && t.includes('#/activity/w4-fri'); }), 'the calendar file holds twenty dated entries with guide links');

  const small = await p.evaluate(() => [...document.querySelectorAll('.btn, .tab, .segmented button, .day, .motion-toggle')].filter((el) => el.offsetParent).map((el) => [el.className, el.getBoundingClientRect().height]).filter(([, h]) => h > 0 && h < 44));
  check(small.length === 0, 'controls are at least 44px tall', JSON.stringify(small.slice(0, 3)));
  check(!(await p.evaluate(() => document.body.innerText)).includes('—'), 'page copy has no em dashes');
  check(p.external.length === 0, 'no requests leave the host', p.external.slice(0, 3).join(', '));
  check(p.failed.length === 0, 'no missing local assets', p.failed.slice(0, 3).join(', '));
  check(p.errors.length === 0, 'no JavaScript errors', p.errors.slice(0, 3).join(' | '));
  await p.context().close();

  // ---- Before the start, the break, after the end, a direct link -------------
  p = await open(browser, `${BASE}?date=2026-11-02`);
  await wait(500);
  check((await text(p, '#today-card')).includes('7') && (await text(p, '#today-card')).includes('days to go') && (await text(p, '#today-title')).includes('The Challenger'), 'before the start the panel counts down to Day 1');
  await p.locator('[data-open-today]').click();
  await wait(600);
  check(await drawerOpen(p) && (await text(p, '#drawer-title')).includes('The Challenger'), 'the hero button previews Day 1 before the start');
  await p.context().close();
  p = await open(browser, `${BASE}?date=2026-11-25`);
  await wait(500);
  check((await text(p, '#today-card')).includes('Thanksgiving') && (await text(p, '#today-card')).includes('November 30'), 'in the break the panel says so and names the resume date');
  await p.context().close();
  p = await open(browser, `${BASE}?date=2026-12-20`);
  await wait(500);
  check((await text(p, '#today-card')).includes('Program complete'), 'after the end the panel closes the program');
  await p.context().close();
  p = await open(browser, `${BASE}?date=2026-12-02#/activity/w3-wed`);
  await wait(800);
  check(await drawerOpen(p) && (await text(p, '#drawer-title')).includes('Account Data Detective'), 'a direct link opens its guide');
  check(await p.evaluate(() => document.querySelectorAll('[data-path]').length === 3), 'week 3 guides offer the three build paths');
  await p.locator('[data-path="agent"]').click();
  await wait(300);
  check(await p.evaluate(() => localStorage.getItem('psaa-path') === '"agent"' && document.querySelector('#path-text').textContent.includes('agent') && !document.querySelector('.prompt').textContent.includes('{agent / app / dashboard}')), 'choosing a path is remembered and fills the prompt');
  await p.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); document.execCommand = () => false; });
  await p.locator('[data-copy-share]').click();
  await wait(300);
  check(await p.locator('.manual-copy').isVisible(), 'clipboard failure offers the text to copy manually');
  check(p.errors.length === 0, 'no JavaScript errors on direct link', p.errors.join(' | '));
  await p.context().close();

  // ---- Reduced motion ---------------------------------------------------------
  p = await open(browser, `${BASE}?date=2026-11-18`, { reducedMotion: 'reduce' });
  await wait(400);
  check(await p.evaluate(() => document.documentElement.dataset.motion === 'off' && [...document.querySelectorAll('[data-reveal]')].every((el) => getComputedStyle(el).opacity === '1')), 'reduced motion shows everything at once');
  await p.locator('[data-motion-toggle]').click();
  check(await p.evaluate(() => document.documentElement.dataset.motion === 'on' && localStorage.getItem('psaa-motion') === 'on'), 'the motion toggle works and is remembered');
  await p.context().close();

  // ---- Phone ------------------------------------------------------------------
  p = await open(browser, `${BASE}?date=2026-11-18`, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await wait(600);
  check((await p.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'no horizontal scroll at phone width');
  check(await p.evaluate(() => document.querySelector('#today-card').getBoundingClientRect().width <= 390 - 40 + 1), 'the Today panel fits a phone');
  await p.locator('#panel-2 .day.is-today').click();
  await wait(700);
  check((await p.evaluate(() => document.querySelector('#activity-drawer').getBoundingClientRect().width)) === 390, 'the guide opens full width on a phone');
  check(p.errors.length === 0, 'no JavaScript errors on mobile', p.errors.join(' | '));
  await browser.close();
} catch (error) {
  console.error(error);
  failures++;
} finally {
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
