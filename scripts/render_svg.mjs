// Render SVG files to PNG for a look (ImageMagick cannot write its temp files here).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [, , ...files] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 688, height: 1024 }, deviceScaleFactor: 1 });
for (const f of files) {
  const svg = readFileSync(f, 'utf8');
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff">${svg.replace(/<svg /, '<svg style="width:688px;height:1024px;display:block" ')}</body></html>`);
  await page.waitForTimeout(200);
  const out = f.replace(/\.svg$/, '.render.png');
  await page.screenshot({ path: out });
  console.log('rendered', out);
}
await browser.close();
