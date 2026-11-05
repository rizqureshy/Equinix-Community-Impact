// Prototype: the promises drawn as plans. A numbered list with a thread that grows as you read; beside it a
// sticky sheet where the current promise's drawing draws itself on (stroke by stroke for a vector drawing,
// under a soft sweep for a traced raster). Under the pointer the photograph of the promise kept develops
// through the drawing in an ink blot, and fades back to the plan when the hand leaves.
// Drawings and photographs: media-src/asset-manifest.json (promises).
import '@fontsource-variable/inter-tight';
import { principles, sources } from '../content/stories.js';

const $ = (s, r = document) => r.querySelector(s);
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Which promises have a drawing so far, by index (0 = the first). Others show their number on the sheet.
const DRAWN = { 0: 'k1' };
const PHOTO = (i) => `../media/kept-${i + 1}-1200.webp`;
const state = { ink: 'line', route: 'ref', current: 0 };

// ---- The list ---------------------------------------------------------------------------------
const list = $('#list');
const rows = principles.map((p, i) => {
  const li = document.createElement('li');
  li.className = 'row';
  li.dataset.i = String(i);
  li.innerHTML = `<span class="num">0${i + 1}</span><h2 class="name">${esc(p.name)}</h2><p class="promise">${esc(p.promise)}</p>
    <p class="kept"><b>Kept</b>${esc(p.proof)} <a href="${esc(sources.S7.url)}" target="_blank" rel="noopener">Source</a></p>`;
  list.appendChild(li);
  return li;
});
const threadFill = $('#thread-fill');

// ---- The sheet ----------------------------------------------------------------------------------
const plan = $('#plan');
const drawingHost = $('#drawing');
const hint = $('#hint');
let strokes = []; // [{ el, from, to }] for the vector drawing: each stroke's share of the whole line
let drawingKind = 'none'; // svg | img | none
let progress = 0;
let loadToken = 0;

async function loadDrawing(i) {
  drawingHost.innerHTML = '';
  drawingHost.classList.remove('sweep');
  strokes = [];
  const key = DRAWN[i];
  if (!key) {
    drawingKind = 'none';
    drawingHost.innerHTML = `<div class="pending"><b>0${i + 1}</b>Drawing to follow</div>`;
    return;
  }
  const stem = `../media/promises/drawn/${key}-${state.ink}-${state.route}`;
  const token = ++loadToken;
  if (state.ink === 'tint' && state.route === 'ref') {
    // The wash beneath the lines: one flat marker stroke that develops as the drawing closes
    const wash = new Image();
    wash.decoding = 'async';
    wash.alt = '';
    wash.className = 'wash';
    wash.src = `${stem}.wash.webp`;
    drawingHost.appendChild(wash);
  }
  const res = await fetch(`${stem}.svg`).catch(() => null);
  if (token !== loadToken) return;
  if (res && res.ok) {
    const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
    if (token !== loadToken) return;
    const svg = doc.documentElement;
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    drawingHost.appendChild(document.importNode(svg, true));
    const live = drawingHost.querySelector('svg');
    // Every stroked shape takes its share of the total length, in document order, so the pen travels the sheet once
    const shapes = [...live.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.stroke !== 'none' && cs.stroke !== 'rgba(0, 0, 0, 0)' && typeof el.getTotalLength === 'function';
    });
    let total = 0;
    const lens = shapes.map((el) => {
      let L = 0;
      try { L = el.getTotalLength(); } catch { L = 0; }
      total += L;
      return L;
    });
    let acc = 0;
    strokes = shapes.map((el, k) => {
      const from = acc / (total || 1);
      acc += lens[k];
      const to = acc / (total || 1);
      el.style.strokeDasharray = `${lens[k]} ${lens[k]}`;
      el.style.strokeDashoffset = String(lens[k]);
      el.dataset.len = String(lens[k]);
      const cs = getComputedStyle(el);
      el.dataset.filled = cs.fill !== 'none' && cs.fill !== 'rgba(0, 0, 0, 0)' ? '1' : '';
      return { el, from, to };
    });
    drawingKind = 'svg';
  } else {
    // No strokes for this drawing yet: the raster reveals under a soft sweep instead
    const img = new Image();
    img.decoding = 'async';
    img.alt = '';
    img.src = `${stem}.webp`;
    img.onerror = () => {
      if (token !== loadToken) return;
      drawingKind = 'none';
      drawingHost.innerHTML = `<div class="pending"><b>0${i + 1}</b>Not generated yet</div>`;
    };
    drawingHost.classList.add('sweep');
    drawingHost.appendChild(img);
    drawingKind = 'img';
  }
  draw();
}

// The pen takes its time: the drawing draws itself over a few seconds once it is on the sheet
const DRAW_MS = 3200;
let drawRaf = 0;
function draw() {
  cancelAnimationFrame(drawRaf);
  if (reduce()) {
    applyProgress(1, true);
    return;
  }
  const start = performance.now();
  applyProgress(0, true);
  const step = (now) => {
    const k = Math.min(1, (now - start) / DRAW_MS);
    applyProgress(k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    if (k < 1) drawRaf = requestAnimationFrame(step);
  };
  drawRaf = requestAnimationFrame(step);
}

/** How much of the current drawing is on the sheet: 0 blank, 1 complete. */
function applyProgress(p, force = false) {
  if (!force && Math.abs(p - progress) < 0.002) return;
  progress = p;
  if (drawingKind === 'svg') {
    for (const s of strokes) {
      const k = clamp((p - s.from) / Math.max(1e-6, s.to - s.from));
      const L = Number(s.el.dataset.len);
      s.el.style.strokeDashoffset = String(L * (1 - k));
      if (s.el.dataset.filled) s.el.style.fillOpacity = String(k);
    }
  } else if (drawingKind === 'img') {
    drawingHost.style.setProperty('--p', String(p));
  }
  const wash = drawingHost.querySelector('.wash');
  if (wash) wash.style.opacity = String(clamp((p - 0.35) / 0.5));
}

// ---- Scroll: the current row, the thread, the drawing's progress ------------------------------------
function onScroll() {
  const vh = innerHeight;
  // The thread follows the reading line down the list
  const lr = list.getBoundingClientRect();
  threadFill.style.height = `${clamp((vh * 0.5 - lr.top) / lr.height) * 100}%`;
  // The row nearest the middle of the screen is current
  let best = 0;
  let bestD = Infinity;
  rows.forEach((r, i) => {
    const b = r.getBoundingClientRect();
    const d = Math.abs(b.top + b.height / 2 - vh * 0.5);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  if (best !== state.current) {
    state.current = best;
    rows.forEach((r, i) => r.classList.toggle('on', i === best));
    loadDrawing(best);
  } else rows[best].classList.add('on');
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

// ---- The hand: the photograph develops through the plan in an ink blot -------------------------------
const canvas = $('#photo-canvas');
const ctx = canvas.getContext('2d');
const photo = new Image();
photo.decoding = 'async';
let photoReady = false;
let photoFor = -1;
function loadPhoto(i) {
  if (photoFor === i) return;
  photoFor = i;
  photoReady = false;
  photo.onload = () => (photoReady = true);
  photo.src = PHOTO(i);
}
const blot = { x: 0, y: 0, r: 0, target: 0, t: 0, seed: Math.random() * 10 };
let raf = 0;
let lastFrame = 0;
function size() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const r = plan.getBoundingClientRect();
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(size).observe(plan);
function blotPath(x, y, r, t) {
  ctx.beginPath();
  const n = 48;
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2;
    const wobble = 1 + 0.14 * Math.sin(a * 3 + t * 0.9 + blot.seed) + 0.09 * Math.sin(a * 5 - t * 0.7) + 0.05 * Math.sin(a * 8 + t * 1.3);
    const rr = r * wobble;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
function frame(now) {
  raf = 0;
  const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
  lastFrame = now;
  blot.t += dt;
  // The blot blooms towards its target size and shrinks away when the hand has gone
  blot.r += (blot.target - blot.r) * (blot.target > blot.r ? 0.08 : 0.06);
  const w = canvas.width / Math.min(devicePixelRatio || 1, 2);
  const h = canvas.height / Math.min(devicePixelRatio || 1, 2);
  ctx.clearRect(0, 0, w, h);
  if (photoReady && blot.r > 0.5) {
    // The photograph, covering the sheet
    const s = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
    const pw = photo.naturalWidth * s;
    const ph = photo.naturalHeight * s;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(photo, (w - pw) / 2, (h - ph) / 2, pw, ph);
    // Kept only inside the blot, whose edge is soft like ink into paper
    ctx.globalCompositeOperation = 'destination-in';
    ctx.filter = `blur(${Math.max(6, blot.r * 0.12)}px)`;
    ctx.fillStyle = '#000';
    blotPath(blot.x, blot.y, blot.r, blot.t);
    ctx.fill();
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
  }
  if (blot.r > 0.5 || blot.target > 0) raf = requestAnimationFrame(frame);
}
function wake() {
  if (!raf) {
    lastFrame = performance.now();
    raf = requestAnimationFrame(frame);
  }
}
function point(e) {
  const r = plan.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width };
}
plan.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  const p = point(e);
  blot.x += (p.x - blot.x) * 0.5;
  blot.y += (p.y - blot.y) * 0.5;
  if (blot.target === 0) {
    blot.x = p.x;
    blot.y = p.y;
  }
  blot.target = p.w * 0.34;
  plan.classList.add('touched');
  wake();
});
plan.addEventListener('pointerleave', () => {
  blot.target = 0;
  wake();
});
let touchTimer = 0;
plan.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  const p = point(e);
  blot.x = p.x;
  blot.y = p.y;
  blot.target = p.w * 0.42;
  plan.classList.add('touched');
  wake();
  clearTimeout(touchTimer);
  touchTimer = setTimeout(() => {
    blot.target = 0;
    wake();
  }, 2600);
});

// ---- Switches ------------------------------------------------------------------------------------
for (const b of document.querySelectorAll('[data-ink], [data-route]')) {
  b.addEventListener('click', () => {
    const group = b.dataset.ink ? 'ink' : 'route';
    state[group] = b.dataset.ink || b.dataset.route;
    for (const o of document.querySelectorAll(`[data-${group}]`)) o.setAttribute('aria-pressed', String(o === b));
    loadDrawing(state.current);
  });
}

// ---- Start ----------------------------------------------------------------------------------------
size();
rows[0].classList.add('on');
loadPhoto(0);
loadDrawing(0);
onScroll();
// The photograph follows the current promise
const photoWatch = new MutationObserver(() => loadPhoto(state.current));
rows.forEach((r) => photoWatch.observe(r, { attributes: true, attributeFilter: ['class'] }));
window.__promises = { state, get progress() { return progress; }, get strokes() { return strokes.length; }, blot };
