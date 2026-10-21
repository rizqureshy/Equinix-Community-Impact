import { chromium } from 'playwright';
const [,, url, out, w='1440', h='900', wait='3500', extra=''] = process.argv;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: extra.includes('reduce') ? 'reduce' : 'no-preference' });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (['error','warning'].includes(m.type())) errors.push(m.type() + ': ' + m.text()); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(+wait);
if (extra.includes('scroll=')) { const y = +extra.match(/scroll=(\d+)/)[1]; await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(2500); }
await page.screenshot({ path: out, fullPage: extra.includes('full') });
const state = await page.evaluate(() => ({ scene: document.querySelector('#stage')?.dataset.sceneState, reason: document.querySelector('#stage')?.dataset.fallbackReason, st: window.__impact?.store.get() }));
console.log(JSON.stringify(state)); console.log(errors.join('\n'));
await browser.close();
