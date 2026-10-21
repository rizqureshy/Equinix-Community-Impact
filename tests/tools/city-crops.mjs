// Renders crops of the community model for the promises ledger, one per
// promise, from the live scene. No labels, cards or controls.
// Usage: npm run build && npx vite preview --port 4181 &
//        node tests/tools/city-crops.mjs http://localhost:4181/ impact/public/media
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const [, , url = 'http://localhost:4181/', outDir = 'impact/public/media'] = process.argv;
// Promise number to the place the camera frames
const CROPS = [['1', 'homes'], ['2', 'datacenter'], ['3', 'learning'], ['4', 'aquatic'], ['5', 'shops']];

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto(`${url}#/community`, { waitUntil: 'load' });
await page.addStyleTag({ content: '.scene-labels, .stage-note, .hero-stats, .journey-ui, .site-header { display: none !important } .explorer { height: 960px !important; margin: 0 !important; border-radius: 0 !important }' });
await page.waitForFunction(() => document.querySelector('#stage').dataset.sceneState === 'ready', null, { timeout: 60000 });
const files = [];
for (const [n, place] of CROPS) {
  await page.evaluate((p) => window.__impact.scene.setFocus(p, { instant: true, side: 0 }), place);
  await page.waitForTimeout(1500);
  const png = join(outDir, `promise-art-${n}.png`);
  await page.locator('#stage').screenshot({ path: png });
  files.push(png);
}
await browser.close();
execFileSync('python3', ['-c', `
from PIL import Image
import sys
for png in sys.argv[1:]:
    im = Image.open(png).convert('RGB')
    for w in (1200, 640):
        c = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        c.save(png.replace('.png', '-%d.webp' % w), 'WEBP', quality=80, method=6)
`, ...files]);
execFileSync('rm', files);
console.log(`wrote ${files.length} crops to ${outDir}`);
