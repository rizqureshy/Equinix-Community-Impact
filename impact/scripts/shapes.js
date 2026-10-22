// Light-forms for the field: each returns 2n normalised coordinates
// (x in [-aspect, aspect], y in [-1, 1], y down) that the particles travel to.
// Forms are drawn in code rather than loaded, so the page stays a single
// small download and every form scales to the viewport.

const rnd = (lo, hi) => lo + Math.random() * (hi - lo);

function fill(out, i, x, y) {
  out[i * 2] = x;
  out[i * 2 + 1] = y;
}

/** Points along a cubic bezier, with a little scatter so lines read as light, not wire. */
function bezier(out, from, to, p0, p1, p2, p3, scatter = 0.006) {
  const n = to - from;
  for (let k = 0; k < n; k++) {
    const t = (k + Math.random()) / n;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    fill(out, from + k, x + rnd(-scatter, scatter), y + rnd(-scatter, scatter));
  }
}

function segment(out, from, to, a, b, scatter = 0.005) {
  const n = to - from;
  for (let k = 0; k < n; k++) {
    const t = (k + Math.random()) / n;
    fill(out, from + k, a[0] + (b[0] - a[0]) * t + rnd(-scatter, scatter), a[1] + (b[1] - a[1]) * t + rnd(-scatter, scatter));
  }
}

function ring(out, from, to, cx, cy, rx, ry, scatter = 0.006, arc = [0, Math.PI * 2]) {
  const n = to - from;
  for (let k = 0; k < n; k++) {
    const a = arc[0] + (arc[1] - arc[0]) * ((k + Math.random()) / n);
    fill(out, from + k, cx + Math.cos(a) * rx + rnd(-scatter, scatter), cy + Math.sin(a) * ry + rnd(-scatter, scatter));
  }
}

function disc(out, from, to, cx, cy, r) {
  for (let k = from; k < to; k++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * r;
    fill(out, k, cx + Math.cos(a) * d, cy + Math.sin(a) * d);
  }
}

function dust(out, from, to, aspect) {
  for (let k = from; k < to; k++) fill(out, k, rnd(-aspect, aspect), rnd(-1, 1));
}

/** Fibre strands sweeping in from the lower right: light leaving a building. */
export function strands(n, aspect) {
  const out = new Float32Array(n * 2);
  const strandCount = 34;
  const dustN = Math.floor(n * 0.08);
  const per = Math.floor((n - dustN) / strandCount);
  const src = [aspect * 1.05, 1.15];
  let i = 0;
  for (let s = 0; s < strandCount; s++) {
    const end = [rnd(-aspect * 1.05, aspect * 0.1), rnd(-1.1, 0.25)];
    const c1 = [src[0] - rnd(0.3, 0.9) * aspect, src[1] - rnd(0.05, 0.4)];
    const c2 = [end[0] + rnd(0.1, 0.8) * aspect, end[1] + rnd(-0.3, 0.3)];
    bezier(out, i, i + per, src, c1, c2, end, 0.004);
    i += per;
  }
  dust(out, i, n, aspect);
  return out;
}

/** A pulse through a scan: the heartbeat line crossing a reading ring. */
export function pulse(n, aspect) {
  const out = new Float32Array(n * 2);
  const w = Math.min(aspect, 1.6) * 0.92;
  const lineN = Math.floor(n * 0.46);
  const ringN = Math.floor(n * 0.42);
  // The line: flat, a small bump, the spike, a dip, flat.
  const pts = [
    [-w, 0], [-w * 0.42, 0], [-w * 0.34, -0.04], [-w * 0.27, 0], [-w * 0.2, 0], [-w * 0.15, 0.08], [-w * 0.1, -0.52], [-w * 0.04, 0.22], [0, 0],
    [w * 0.1, 0], [w * 0.17, -0.07], [w * 0.24, 0], [w, 0],
  ];
  const total = pts.slice(1).reduce((acc, p, k) => acc + Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]), 0);
  let i = 0;
  for (let k = 0; k < pts.length - 1; k++) {
    const len = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
    const cnt = k === pts.length - 2 ? lineN - i : Math.round((len / total) * lineN);
    segment(out, i, i + cnt, pts[k], pts[k + 1], 0.004);
    i += cnt;
  }
  ring(out, i, i + ringN, -w * 0.09, -0.08, 0.5, 0.5, 0.007);
  i += ringN;
  ring(out, i, i + Math.floor((n - i) * 0.6), -w * 0.09, -0.08, 0.56, 0.56, 0.02);
  i += Math.floor((n - i) * 0.6);
  dust(out, i, n, aspect);
  return out;
}

/** Research centres on four continents, joined by private arcs from Sydney. */
export function constellation(n, aspect) {
  const out = new Float32Array(n * 2);
  const a = Math.min(aspect, 1.7);
  const sydney = [a * 0.62, 0.52];
  const nodes = [
    [-a * 0.66, -0.22], // Philadelphia
    [-a * 0.78, 0.08], // Memphis
    [a * 0.02, -0.6], // Heidelberg
  ];
  const dustN = Math.floor(n * 0.16);
  const nodeN = Math.floor(n * 0.05);
  const arcN = Math.floor((n - dustN - nodeN * 4) / 3);
  let i = 0;
  for (const nd of nodes) {
    const mid = [(sydney[0] + nd[0]) / 2, (sydney[1] + nd[1]) / 2];
    const lift = -0.55 - Math.random() * 0.2;
    bezier(out, i, i + arcN, sydney, [sydney[0] - a * 0.3, sydney[1] + lift * 0.6], [mid[0] - a * 0.1, mid[1] + lift], nd, 0.005);
    i += arcN;
  }
  for (const nd of [sydney, ...nodes]) {
    disc(out, i, i + nodeN, nd[0], nd[1], 0.045);
    i += nodeN;
  }
  dust(out, i, n, aspect);
  return out;
}

/** A rising path of steps, ending at a lit doorway. */
export function ascent(n, aspect) {
  const out = new Float32Array(n * 2);
  const a = Math.min(aspect, 1.6);
  const steps = 7;
  const x0 = -a * 0.85;
  const x1 = a * 0.55;
  const y0 = 0.72;
  const y1 = -0.45;
  const doorN = Math.floor(n * 0.14);
  const dustN = Math.floor(n * 0.08);
  const per = Math.floor((n - doorN - dustN) / (steps * 2));
  let i = 0;
  for (let s = 0; s < steps; s++) {
    const xa = x0 + ((x1 - x0) * s) / steps;
    const xb = x0 + ((x1 - x0) * (s + 1)) / steps;
    const ya = y0 + ((y1 - y0) * s) / steps;
    const yb = y0 + ((y1 - y0) * (s + 1)) / steps;
    segment(out, i, i + per, [xa, ya], [xb, ya], 0.004);
    i += per;
    segment(out, i, i + per, [xb, ya], [xb, yb], 0.004);
    i += per;
  }
  // The doorway: a tall open rectangle of light just past the top step.
  const dx = x1 + a * 0.18;
  const dh = 0.62;
  const dw = 0.2;
  const side = Math.floor(doorN / 3);
  segment(out, i, i + side, [dx, y1 + 0.02], [dx, y1 - dh], 0.003);
  i += side;
  segment(out, i, i + side, [dx, y1 - dh], [dx + dw, y1 - dh], 0.003);
  i += side;
  segment(out, i, i + (doorN - side * 2), [dx + dw, y1 - dh], [dx + dw, y1 + 0.02], 0.003);
  i += doorN - side * 2;
  dust(out, i, n, aspect);
  return out;
}

/** Blocks and streets of a small town, with a path running through. */
export function town(n, aspect) {
  const out = new Float32Array(n * 2);
  const a = Math.min(aspect, 1.7);
  const cols = 5;
  const rows = 3;
  const gx = (a * 1.7) / cols;
  const gy = 1.5 / rows;
  const pathN = Math.floor(n * 0.2);
  const windowN = Math.floor(n * 0.1);
  const dustN = Math.floor(n * 0.06);
  const blockN = n - pathN - windowN - dustN;
  const per = Math.floor(blockN / (cols * rows * 4));
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -a * 0.85 + c * gx + gx * 0.14;
      const y = -0.75 + r * gy + gy * 0.14;
      const w = gx * 0.72;
      const h = gy * 0.72;
      segment(out, i, i + per, [x, y], [x + w, y]);
      i += per;
      segment(out, i, i + per, [x + w, y], [x + w, y + h]);
      i += per;
      segment(out, i, i + per, [x + w, y + h], [x, y + h]);
      i += per;
      segment(out, i, i + per, [x, y + h], [x, y]);
      i += per;
    }
  }
  // Lit windows inside a few blocks
  for (let k = 0; k < windowN; k++) {
    const c = Math.floor(Math.random() * cols);
    const r = Math.floor(Math.random() * rows);
    const x = -a * 0.85 + c * gx + gx * (0.22 + Math.floor(Math.random() * 4) * 0.14);
    const y = -0.75 + r * gy + gy * (0.24 + Math.floor(Math.random() * 3) * 0.17);
    fill(out, i++, x + rnd(-0.003, 0.003), y + rnd(-0.003, 0.003));
  }
  // The path: a slow wave crossing the town
  bezier(out, i, i + pathN, [-a * 1.05, 0.55], [-a * 0.3, -0.9], [a * 0.3, 1.1], [a * 1.05, -0.35], 0.012);
  i += pathN;
  dust(out, i, n, aspect);
  return out;
}

/** Warmth spreading through water: rings widening from a source. */
export function ripples(n, aspect) {
  const out = new Float32Array(n * 2);
  const a = Math.min(aspect, 1.8);
  const cx = 0;
  const cy = 0.12;
  const rings = 8;
  const coreN = Math.floor(n * 0.06);
  const dustN = Math.floor(n * 0.07);
  const per = Math.floor((n - coreN - dustN) / rings);
  let i = 0;
  for (let r = 0; r < rings; r++) {
    const rad = 0.12 + (r / (rings - 1)) * Math.min(a * 0.95, 1.5);
    ring(out, i, i + per, cx, cy, rad, rad * 0.46, 0.006 + r * 0.004);
    i += per;
  }
  disc(out, i, i + coreN, cx, cy, 0.06);
  i += coreN;
  dust(out, i, n, aspect);
  return out;
}

// The Equinix fortress mark, from the supplied brand file (viewBox 855 x 470).
const MARK = [
  [360.02, 0], [288.02, 25.08], [288.02, 402.81], [240.02, 386.11], [240.02, 41.88], [96.02, 92.17], [96.02, 335.82], [48.04, 319.05], [48.04, 108.9], [0, 125.7], [0, 353.16], [144.01, 403.42], [144.01, 126.23], [192.04, 109.49], [192.04, 420.19], [336.04, 470.45], [336.04, 59.19], [360.02, 50.82], [384.01, 59.19], [384.01, 470.45], [528.07, 420.19], [528.07, 109.49], [576, 126.23], [576, 403.42], [720, 353.16], [720, 125.7], [671.99, 108.9], [671.99, 319.05], [624.04, 335.82], [624.04, 92.17], [480.01, 41.88], [480.01, 386.11], [431.98, 402.81], [431.98, 25.08],
];

function inPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The source: the fortress mark, filled with light. */
export function mark(n, aspect) {
  const out = new Float32Array(n * 2);
  const dustN = Math.floor(n * 0.08);
  const scale = Math.min(1.25 / 470, (aspect * 1.4) / 720);
  const ox = (-720 * scale) / 2;
  const oy = (-470 * scale) / 2 + 0.03;
  let i = 0;
  let guard = 0;
  while (i < n - dustN && guard++ < n * 40) {
    const x = Math.random() * 720;
    const y = Math.random() * 470.45;
    if (inPolygon(x, y, MARK)) fill(out, i++, ox + x * scale, oy + y * scale);
  }
  dust(out, i, n, aspect);
  return out;
}

export const SHAPES = { strands, pulse, constellation, ascent, town, ripples, mark };

/** Which colours each form is drawn in. */
export const PALETTES = {
  strands: { light: [255, 242, 216], accent: [255, 74, 79], accentShare: 0.22 },
  pulse: { light: [255, 242, 216], accent: [255, 74, 79], accentShare: 0.3 },
  constellation: { light: [255, 242, 216], accent: [255, 74, 79], accentShare: 0.2 },
  ascent: { light: [255, 242, 216], accent: [255, 122, 69], accentShare: 0.24 },
  town: { light: [255, 242, 216], accent: [255, 122, 69], accentShare: 0.26 },
  ripples: { light: [255, 226, 170], accent: [232, 160, 64], accentShare: 0.55 },
  mark: { light: [255, 120, 122], accent: [233, 28, 36], accentShare: 0.7 },
};
