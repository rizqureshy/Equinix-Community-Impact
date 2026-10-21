// Screenshot tour: scrolls through the page in viewport-height steps.
// Usage: node tests/e2e/tour.mjs <url> <outDir> <width> <height> <stops (comma list of vh)>
import { chromium } from 'playwright';
const [,, url, out, w = '1440', h = '900', stops = '0,1.5,3,5,8'] = process.argv;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.stack || e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url);
await page.waitForTimeout(4000);
for (const s of stops.split(',')) {
  const y = Math.round(Number(s) * +h);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${out}/tour-${w}-${s}.png` });
}
console.log('height', await page.evaluate(() => document.documentElement.scrollHeight / innerHeight), 'errors', errors);
await browser.close();
