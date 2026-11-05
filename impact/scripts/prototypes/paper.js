// Lighting test for the promises table: white paper on a white table, read through light alone.
// One warm key from the upper left (the page's own sunlight direction), a cool hemisphere fill, soft
// shadow maps for the contact shadow, paper with a fine tooth, one old crease and a lifted corner, and
// the drawing in the paper's own texture so the ink takes the same light as the sheet.
import * as T from 'three';
import '@fontsource-variable/inter-tight';

const host = document.getElementById('stage');
const params = new URLSearchParams(location.search);
const W = host.clientWidth;
const H = host.clientHeight;

const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.NoToneMapping;
host.appendChild(renderer.domElement);

const scene = new T.Scene();
scene.background = new T.Color('#f4f3f0');
const camera = new T.PerspectiveCamera(28, W / H, 0.1, 100);
// Looking down at a desk from a chair: above and in front, not straight down
camera.position.set(0, 9.2, 7.4);
camera.lookAt(0, 0, -0.3);

// ---- Light ------------------------------------------------------------------------------------
const key = new T.DirectionalLight('#fff7ee', Number(params.get('key') || 2.0));
key.position.set(-6, 9, 4.5);
key.castShadow = true;
key.shadow.mapSize.set(4096, 4096);
key.shadow.camera.near = 1;
key.shadow.camera.far = 30;
key.shadow.camera.left = -7;
key.shadow.camera.right = 7;
key.shadow.camera.top = 7;
key.shadow.camera.bottom = -7;
key.shadow.radius = Number(params.get('radius') || 14);
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key);
const fill = new T.HemisphereLight('#e9eff7', '#ffffff', Number(params.get('fill') || 1.9));
scene.add(fill);

// ---- Procedural paper: tooth, and a crease in the normal map ---------------------------------------
function noiseCanvas(w, h, amp, seed = 1) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 128 + (rnd() - 0.5) * amp;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
/** A normal map: fine fibre noise plus one soft crease running across the sheet. */
function paperNormal(w, h, creaseAngle, creaseAt) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  // height field first
  const hf = new Float32Array(w * h);
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < hf.length; i++) hf[i] = (rnd() - 0.5) * 0.9;
  // smooth the noise a little so it reads as fibre, not static
  const sm = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    let a = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a += hf[(y + dy) * w + x + dx];
    sm[y * w + x] = a / 9;
  }
  const ca = Math.cos(creaseAngle);
  const sa = Math.sin(creaseAngle);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // signed distance to the crease line through creaseAt
    const d = ((x / w - creaseAt[0]) * ca + (y / h - creaseAt[1]) * sa) * w;
    // a crease: a narrow ridge with a soft valley either side
    const ridge = Math.exp(-(d * d) / 18) * 6 - Math.exp(-(d * d) / 400) * 1.2;
    sm[y * w + x] += ridge;
  }
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const l = sm[y * w + Math.max(0, x - 1)];
    const r = sm[y * w + Math.min(w - 1, x + 1)];
    const u = sm[Math.max(0, y - 1) * w + x];
    const dn = sm[Math.min(h - 1, y + 1) * w + x];
    const nx = (l - r) * 0.12;
    const ny = (u - dn) * 0.12;
    const i = (y * w + x) * 4;
    img.data[i] = 128 + nx * 127;
    img.data[i + 1] = 128 + ny * 127;
    img.data[i + 2] = 255;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** The paper's colour map: warm white with a faint tooth, the drawing laid into it. */
function paperMap(drawing) {
  const w = 1024;
  const h = 1365;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fdfcf9';
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.045;
  ctx.drawImage(noiseCanvas(512, 683, 90, 3), 0, 0, w, h);
  ctx.globalAlpha = 1;
  if (drawing) {
    // cover the sheet with the lower three quarters of the drawing
    const s = Math.max(w / drawing.naturalWidth, h / drawing.naturalHeight);
    const dw = drawing.naturalWidth * s;
    const dh = drawing.naturalHeight * s;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(drawing, (w - dw) / 2, h - dh, dw, dh);
    ctx.globalCompositeOperation = 'source-over';
  }
  return c;
}

// ---- The table --------------------------------------------------------------------------------
const tableNormal = new T.CanvasTexture(paperNormal(512, 512, 0, [-9, -9]));
tableNormal.wrapS = tableNormal.wrapT = T.RepeatWrapping;
tableNormal.repeat.set(6, 6);
const table = new T.Mesh(
  new T.PlaneGeometry(40, 40),
  new T.MeshStandardMaterial({ color: '#f4f3f0', roughness: 1, metalness: 0, normalMap: tableNormal, normalScale: new T.Vector2(0.2, 0.2) }),
);
table.rotation.x = -Math.PI / 2;
table.receiveShadow = true;
scene.add(table);

// ---- A sheet ----------------------------------------------------------------------------------
const SHEET_W = 3;
const SHEET_H = 4;
function makeSheet({ corner = [1, 1], lift = 0.3, cup = 0.03, creaseAngle = 0.35, creaseAt = [0.62, 0.3], drawing = null } = {}) {
  const geo = new T.PlaneGeometry(SHEET_W, SHEET_H, 60, 80);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = x / SHEET_W + 0.5;
    const v = y / SHEET_H + 0.5;
    // one corner lifts, the way paper that has been handled does
    const cu = corner[0] > 0 ? u : 1 - u;
    const cv = corner[1] > 0 ? v : 1 - v;
    const k = Math.max(0, cu - 0.55) / 0.45 * Math.max(0, cv - 0.55) / 0.45;
    let z = lift * k * k;
    // a gentle cup across the middle
    z += cup * Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * -1 + cup;
    // the crease: a slight tent along the fold
    const d = (u - creaseAt[0]) * Math.cos(creaseAngle) + (v - creaseAt[1]) * Math.sin(creaseAngle);
    z += 0.012 * Math.exp(-(d * d) / 0.0025);
    pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  const map = new T.CanvasTexture(paperMap(drawing));
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  const normal = new T.CanvasTexture(paperNormal(512, 683, creaseAngle, creaseAt));
  const mat = new T.MeshStandardMaterial({ map, normalMap: normal, normalScale: new T.Vector2(0.38, 0.38), roughness: 0.94, metalness: 0, side: T.DoubleSide });
  const mesh = new T.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 0.025;
  return mesh;
}

const img = new Image();
img.src = params.get('drawing') || '../media/promises/drawn/k1-tint-ref.webp';
img.decode().catch(() => {}).then(() => {
  const sheet = makeSheet({ drawing: img.complete && img.naturalWidth ? img : null });
  sheet.rotation.z = -0.11;
  sheet.position.set(-0.4, 0.025, -0.2);
  scene.add(sheet);
  if (params.get('pile')) {
    // a few more sheets behind, for the look of the pile
    const b = makeSheet({ corner: [-1, 1], lift: 0.16, creaseAngle: -0.5, creaseAt: [0.4, 0.5] });
    b.rotation.z = 0.18;
    b.position.set(2.6, 0.002, -1.2);
    scene.add(b);
    const c = makeSheet({ corner: [1, -1], lift: 0.12, creaseAngle: 1.2, creaseAt: [0.5, 0.6] });
    c.rotation.z = -0.3;
    c.position.set(-3.4, 0.001, -0.6);
    scene.add(c);
  }
  renderer.render(scene, camera);
  window.__paper = { ready: true, renderer, scene, camera };
});
