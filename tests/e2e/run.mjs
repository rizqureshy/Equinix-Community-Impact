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
  await wait(1500);

  await p.locator('.place-label[data-place="research"]').click();
  await wait(800);
  const s1 = await p.evaluate(() => window.__impact.store.get());
  check(s1.section === 'explore' && s1.topic === 'discovery' && s1.focus === 'research', 'scene label selects its destination and preview', JSON.stringify(s1));
  check((await p.locator('#topic-panel .preview-title').textContent()).includes('every child'), 'preview shows the matching story');

  await p.locator('#topic-tab-discovery').focus();
  await p.keyboard.press('ArrowRight');
  await wait(300);
  check((await p.evaluate(() => [window.__impact.store.get().topic, document.activeElement.id])).join() === 'opportunity,topic-tab-opportunity', 'arrow keys move and select topic tabs');

  const trigger = p.locator('#topic-panel [data-story-trigger]');
  await trigger.click();
  await wait(600);
  check(await isOpen(p), 'story opens from the explorer');
  check((await p.evaluate(() => location.hash)) === '#/story/pathways-to-tech', 'open story exposes its URL');
  check((await p.evaluate(() => document.activeElement.className)).includes('drawer-close'), 'focus moves into the story dialog');
  await p.keyboard.press('Escape');
  await wait(600);
  check(!(await isOpen(p)), 'Escape closes the story');
  check((await p.evaluate(() => document.activeElement?.dataset?.storyTrigger)) === 'pathways-to-tech', 'focus returns to the trigger');
  await p.goForward();
  await wait(600);
  check(await isOpen(p), 'browser forward restores the story');
  await p.goBack();
  await wait(600);
  check(!(await isOpen(p)) && (await p.evaluate(() => location.hash)) === '#/explore/opportunity', 'browser back restores the explorer');

  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.goto(`${BASE}#/share`);
  await wait(1200);
  await p.locator('.collection-item [data-copy="summary"]').first().click();
  await wait(300);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  check(clip.includes('Source:') && clip.includes('#/story/3verest'), 'copy summary includes source and story link');
  check((await p.locator('#toast').textContent()).includes('copied'), 'copy confirms success');

  await p.locator('[data-filter="discovery"]').click();
  check((await p.locator('#collection-count').textContent()) === '1 story', 'topic filter narrows the collection');
  await p.locator('[data-filter="partnership"]').click();
  check(await p.locator('#collection-empty').isVisible(), 'filters show a useful empty state');
  await p.locator('[data-filter-reset]').click();
  check((await p.locator('.collection-item:not([hidden])').count()) === (await p.locator('.collection-item').count()), 'reset shows all stories');

  const small = await p.evaluate(() =>
    [...document.querySelectorAll('.btn, .chip, .topic-tab, .motion-toggle, .drawer-close, .overview-btn')]
      .filter((el) => el.offsetParent)
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height < 44).length,
  );
  check(small === 0, 'controls are at least 44px tall', `${small} too small`);
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
  p = await open(browser, `${BASE}#/chapter/discovery`, { reducedMotion: 'reduce' });
  await p.waitForFunction(() => document.querySelector('#stage').dataset.sceneState !== 'loading', null, { timeout: 20000 });
  check((await p.evaluate(() => document.documentElement.dataset.motion)) === 'off', 'reduced motion respected from first render');
  const th = await p.evaluate(() => window.__impact.scene?.debug().threads.research);
  check(th && th.progress === 1 && th.pulse === 0, 'reduced motion shows connections instantly without looping effects', JSON.stringify(th));
  await p.locator('[data-motion-toggle]').click();
  check((await p.evaluate(() => document.documentElement.dataset.motion)) === 'on', 'motion control toggles motion');

  await p.context().close();

  // ---- Mobile -------------------------------------------------------------
  p = await open(browser, BASE, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await wait(3000);
  check((await p.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'no horizontal scroll at phone width');
  const stageH = await p.evaluate(() => document.querySelector('#stage').getBoundingClientRect().height);
  check(stageH < 844 * 0.5, 'mobile scene stays compact', `${Math.round(stageH)}px`);
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
  await wait(600);
  check((await p.evaluate(() => window.__impact.store.get().topic)) === 'resources', 'place controls still work without WebGL');
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
