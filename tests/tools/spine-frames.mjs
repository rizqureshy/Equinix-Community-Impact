// Render the two frames the dive film is made from: the Spine in preview (far) and the first frame of the ride (near).
// Usage: npm run build && node tests/tools/spine-frames.mjs media-src/spine/film
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const PORT = 4183, BASE = `http://localhost:${PORT}/`;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(BASE)).ok) break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const out = process.argv[2];
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`${BASE}prototypes/spine.html?mode=preview`, { waitUntil: 'load' });
await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 30000 }).catch(() => {});
await wait(6000);
await page.screenshot({ path: `${out}/far.png` });
await page.addStyleTag({ content: '.hud, .hint, .year, .plaque { display: none !important; }' });
await page.evaluate(() => window.postMessage({ type: 'spine:start' }, '*'));
await wait(350);
await page.screenshot({ path: `${out}/near.png` });
await wait(4000);
await page.screenshot({ path: `${out}/ride.png` });
await browser.close(); server.kill();
console.log('frames written');
