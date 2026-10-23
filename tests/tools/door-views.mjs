// Renders the door view of each building from the live scene: the exact
// frame the camera reaches before the dive film, used as that film's first
// frame. Usage: npm run build && tests/tools/preview-up.sh
//        node tests/tools/door-views.mjs http://localhost:4181/ media-src/rooms
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Options: SKY=1 renders the views inside a sky, land and tree line (files end in .door-sky.png);
//          PLACES=hospital,homes limits the places.
const [, , url = 'http://localhost:4181/', outDir = 'media-src/rooms'] = process.argv;
mkdirSync(outDir, { recursive: true });
const SKY = process.env.SKY === '1';
const PLACES = (process.env.PLACES || 'hospital,research,learning,homes,aquatic,datacenter').split(',');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto(`${url}#/community`, { waitUntil: 'load' });
await page.addStyleTag({ content: '.scene-labels, .stage-note, .hero-stats, .journey-ui, .site-header, #fabric-layer, #weather-light { display: none !important } .explorer { height: 720px !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important } .stage { background: #f5f5f7 !important }' });
await page.waitForFunction(() => document.querySelector('#stage').dataset.sceneState === 'ready', null, { timeout: 60000 });
await page.evaluate(() => window.__impact.scene.setThreadsVisible(false));
if (SKY) await page.evaluate(() => window.__impact.scene.setBackdrop(true));
for (const place of PLACES) {
  await page.evaluate((p) => window.__impact.scene.approach(p, { instant: true }), place);
  await page.waitForTimeout(1200);
  const png = await page.locator('#stage').screenshot();
  writeFileSync(join(outDir, `${place}.door${SKY ? '-sky' : ''}.png`), png);
  console.log('door', place);
}
await browser.close();
