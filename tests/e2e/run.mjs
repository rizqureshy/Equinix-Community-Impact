// End-to-end checks against the production build.
// Usage: npm run build && npm run test:e2e
// Starts `vite preview`, blocks every request that leaves the local host,
// and exercises the experience on desktop, mobile, reduced motion and
// without WebGL. Exits non-zero on the first failed assertion.
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

try {
  const browser = await chromium.launch({ args: GL });

  // ---- Desktop journey -------------------------------------------------
  let p = await open(browser, BASE);
  check(await p.locator('h1').isVisible(), 'headline and actions usable before the scene loads', await p.evaluate(() => document.querySelector('#stage').dataset.sceneState));
  await p.waitForFunction(() => document.querySelector('#stage').dataset.sceneState !== 'loading', null, { timeout: 20000 });
  check((await p.evaluate(() => document.querySelector('#stage').dataset.sceneState)) === 'ready', '3D scene renders with WebGL');
  check((await p.evaluate(() => !!window.__impact.lenis)), 'smooth scrolling active when motion is on');

  await p.goto(`${BASE}#/explore/discovery`);
  await wait(3500);
  let s1 = await p.evaluate(() => window.__impact.store.get());
  check(s1.section === 'explore' && s1.topic === 'discovery' && s1.focus === 'research', 'explore route flies to its place', JSON.stringify(s1));
  check(await p.locator('.fly-caption:not([hidden]) .fly-place').textContent() === 'Research centre', 'caption matches the place');

  await p.locator('.fly-step[data-step="2"]').click();
  await wait(3000);
  s1 = await p.evaluate(() => window.__impact.store.get());
  check(s1.topic === 'opportunity' && s1.focus === 'learning', 'step control moves the tour', JSON.stringify(s1));
  await p.locator('.place-label[data-place="aquatic"]').click();
  await wait(3000);
  check((await p.evaluate(() => window.__impact.store.get().focus)) === 'aquatic', 'scene label selects its place');

  const trigger = p.locator('.fly-caption:not([hidden]) [data-story-trigger]');
  const storyId = await trigger.getAttribute('data-story-trigger');
  await trigger.click();
  await wait(700);
  check(await isOpen(p), 'story opens from the tour');
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
  check(!(await isOpen(p)) && (await p.evaluate(() => location.hash)).startsWith('#/explore'), 'browser back restores the tour');

  await p.goto(`${BASE}#/chapter/community`);
  await wait(2500);
  const top = await p.evaluate(() => document.querySelector('#chapter-community').getBoundingClientRect().top);
  check(Math.abs(top) < 40, 'chapter route lands on its poster', `${Math.round(top)}px`);

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
    [...document.querySelectorAll('.btn, .chip, .fly-step, .motion-toggle, .rail-btn, .place-label')]
      .filter((el) => el.offsetParent && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => [el.className, el.getBoundingClientRect().height])
      .filter(([, h]) => h > 0 && h < 34),
  );
  check(small.length === 0, 'controls are comfortably sized', JSON.stringify(small.slice(0, 3)));
  check(p.external.length === 0, 'no requests leave the host', p.external.slice(0, 3).join(', '));
  check(p.failed.length === 0, 'no missing local assets', p.failed.slice(0, 3).join(', '));
  check(p.errors.length === 0, 'no JavaScript errors', p.errors.slice(0, 3).join(' | '));
  await p.context().close();

  // ---- Direct story link and clipboard failure ---------------------------
  p = await open(browser, `${BASE}#/story/markham-heat`);
  await wait(1500);
  check(await isOpen(p), 'direct story link opens without the opening sequence');
  check((await p.locator('#story-title').textContent()).includes('Markham'), 'direct link loads the right story');
  await p.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
    document.execCommand = () => false;
  });
  await p.locator('#drawer-content [data-copy="link"]').click();
  await wait(300);
  check(await p.locator('#drawer-content .manual-copy').isVisible(), 'clipboard failure offers the text to copy manually');
  check(p.errors.length === 0, 'no JavaScript errors on direct link', p.errors.join(' | '));

  await p.context().close();

  // ---- Reduced motion -----------------------------------------------------
  p = await open(browser, `${BASE}#/explore/discovery`, { reducedMotion: 'reduce' });
  await p.waitForFunction(() => document.querySelector('#stage').dataset.sceneState !== 'loading', null, { timeout: 20000 });
  await wait(800);
  check((await p.evaluate(() => document.documentElement.dataset.motion)) === 'off', 'reduced motion respected from first render');
  check((await p.evaluate(() => !window.__impact.lenis)), 'no smooth scrolling or pinning with reduced motion');
  const th = await p.evaluate(() => window.__impact.scene?.debug().threads.research);
  check(th && th.progress === 1 && th.pulse === 0, 'connections appear instantly without looping effects', JSON.stringify(th));
  await p.locator('.fly-step[data-step="4"]').click();
  await wait(400);
  check((await p.evaluate(() => window.__impact.store.get().focus)) === 'aquatic', 'tour steps work without scroll animation');
  await p.locator('[data-motion-toggle]').click();
  check((await p.evaluate(() => document.documentElement.dataset.motion)) === 'on', 'motion control toggles motion');
  check(p.errors.length === 0, 'no JavaScript errors with reduced motion', p.errors.join(' | '));
  await p.context().close();

  // ---- Mobile -------------------------------------------------------------
  p = await open(browser, BASE, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await wait(3000);
  check((await p.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'no horizontal scroll at phone width');
  await p.goto(`${BASE}#/explore/care`);
  await wait(3000);
  const cap = await p.evaluate(() => document.querySelector('.fly-caption:not([hidden])').getBoundingClientRect());
  check(cap.top >= 0 && cap.bottom <= 844 && cap.width <= 390, 'mobile tour caption fits the screen', JSON.stringify(cap));
  await p.goto(`${BASE}#/story/3verest`);
  await wait(800);
  const dw = await p.evaluate(() => document.querySelector('#story-drawer').getBoundingClientRect().width);
  check(dw === 390, 'story opens full width on mobile');
  check(p.errors.length === 0, 'no JavaScript errors on mobile', p.errors.join(' | '));
  await browser.close();

  // ---- No WebGL -------------------------------------------------------------
  const noGL = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  p = await open(noGL, BASE);
  await p.waitForFunction(() => document.querySelector('#stage').dataset.sceneState !== 'loading', null, { timeout: 20000 });
  check((await p.evaluate(() => document.querySelector('#stage').dataset.sceneState)) === 'fallback', 'without WebGL a composed illustration is shown');
  await p.locator('.place-label[data-place="aquatic"]').click();
  await wait(2500);
  check((await p.evaluate(() => window.__impact.store.get().focus)) === 'aquatic', 'place controls still work without WebGL');
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
