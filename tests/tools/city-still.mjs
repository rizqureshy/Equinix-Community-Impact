// Renders the community overview from the live scene as the still used
// before the model loads and wherever WebGL is unavailable.
// Usage: npm run build && npx vite preview --port 4181 &
//        node tests/tools/city-still.mjs http://localhost:4181/ impact/public/media/city
// Writes city-hero-1600.webp and city-hero-1000.webp via Pillow.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [, , url = 'http://localhost:4181/', outDir = 'impact/public/media/city'] = process.argv;
mkdirSync(outDir, { recursive: true });
const png = join(outDir, 'city-hero.png');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto(`${url}#/community`, { waitUntil: 'load' });
await page.addStyleTag({ content: '.scene-labels, .stage-note, .hero-stats, .journey-ui, .site-header { display: none !important } .stage { clip-path: none !important }' });
await page.waitForFunction(() => document.querySelector('#stage').dataset.sceneState === 'ready', null, { timeout: 60000 });
await page.evaluate(() => window.__impact.scene.setFocus('overview', { instant: true }));
await page.waitForTimeout(1500);
await page.locator('#stage').screenshot({ path: png });
await browser.close();

execFileSync('python3', [
  '-c',
  `
from PIL import Image
im = Image.open('${png}').convert('RGB')
for w in (1600, 1000):
    c = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    c.save('${outDir}/city-hero-%d.webp' % w, 'WEBP', quality=80, method=6)
`,
]);
execFileSync('rm', [png]);
console.log('wrote city-hero-1600.webp and city-hero-1000.webp');
