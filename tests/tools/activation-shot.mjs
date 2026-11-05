// Screenshot helper for the activation page: node tests/tools/activation-shot.mjs <url> <out.png> [width] [height] [script]
import { chromium } from 'playwright';
const [, , url, out, w = '1440', h = '900', script = ''] = process.argv;
const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
if (script) { await p.evaluate("document.documentElement.style.scrollBehavior='auto'"); await p.evaluate(script); await p.waitForTimeout(900); }
await p.screenshot({ path: out, fullPage: false });
if (errors.length) console.log('ERRORS', errors.join(' | '));
console.log('shot', out);
await b.close();
