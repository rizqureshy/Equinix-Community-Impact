// Screenshots of the fly-through at points along the scroll.
// Usage: node tests/e2e/flight-shots.mjs <base> <outDir> [stops as fractions of the film]
import { chromium } from 'playwright';
const [,, base, out, stops = '0,0.08,0.16,0.3,0.55,0.95'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', (e) => errors.push(e.stack));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await p.goto(`${base}flight.html`);
await p.waitForTimeout(2500);
for (const s of stops.split(',')) {
  await p.evaluate((f) => {
    const flight = document.querySelector('#flight');
    const film = flight.offsetHeight - innerHeight;
    window.scrollTo(0, flight.offsetTop + film * f);
  }, Number(s));
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `${out}/fl-${s}.png` });
  console.log(s, JSON.stringify(await p.evaluate(() => [window.__impact.state, window.__impact.current])));
}
console.log('errors', errors);
await b.close();
