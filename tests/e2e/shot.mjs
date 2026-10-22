// Screenshot helper: node tests/e2e/shot.mjs <url> <out.png> [width] [height] [waitMs] ["scroll=<y> full reduce"]
import { chromium } from 'playwright';
const [,, url, out, w='1440', h='900', wait='3000', extra=''] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: extra.includes('reduce') ? 'reduce' : 'no-preference' });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (['error','warning'].includes(m.type())) errors.push(m.type() + ': ' + m.text()); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(+wait);
if (extra.includes('scroll=')) { const y = +extra.match(/scroll=(\d+)/)[1]; await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(2000); }
await page.screenshot({ path: out, fullPage: extra.includes('full') });
console.log(JSON.stringify(await page.evaluate(() => ({ chapter: window.__impact?.chapter, shape: window.__impact?.field?.shape, st: window.__impact?.store.get() }))));
console.log(errors.join('\n'));
await browser.close();
