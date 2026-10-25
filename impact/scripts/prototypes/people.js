// Prototype page for the people line, with a backdrop switch: the site's red fabric, the daylit corridor, or plain white.
import '@fontsource-variable/inter-tight';
import { createFabric } from '../fabric.js';
import { createPeopleLine } from '../people-line.js';

const params = new URLSearchParams(location.search);
const root = document.documentElement;
let fabric = null;
function setBackdrop(mode) {
  root.dataset.backdrop = mode; root.dataset.fabric = mode === 'fabric' ? 'on' : 'off';
  document.querySelectorAll('[data-bg]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bg === mode)));
  if (mode === 'fabric' && !fabric) { const host = document.getElementById('fabric-layer'); fabric = createFabric(host, { motion: () => !matchMedia('(prefers-reduced-motion: reduce)').matches }); if (fabric) { host.classList.add('is-ready'); fabric.start(); } }
  else if (fabric) { mode === 'fabric' ? fabric.start() : fabric.stop(); }
}
document.querySelectorAll('[data-bg]').forEach((b) => b.addEventListener('click', () => setBackdrop(b.dataset.bg)));
setBackdrop(params.get('bg') || 'fabric');

window.__people = createPeopleLine(document.getElementById('stage'), { media: '../media/', motion: () => !matchMedia('(prefers-reduced-motion: reduce)').matches });
