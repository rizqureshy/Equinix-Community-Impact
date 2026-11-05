// The promises on a white table. Five sheets of paper lie scattered on a white surface, lit by one warm key
// from the upper left and a cool fill, with soft contact shadows, a crease and a lifted corner each. On
// arrival each plan draws itself in one red line, in turn. Choose a sheet (click it, its tab, or Listen) and
// it lifts, turns flat and comes forward; then the photograph of the promise kept develops through the
// drawing like a print in a tray and stays, the lines faint over it. Put it back and it drops into the pile
// and returns to a plan. The narrator reads on request and the table keeps time with him. White on white:
// everything here is told by light and shadow, which is why it is WebGL (Three.js) and not CSS.
import * as T from 'three';
import { principles } from './content/stories.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);

const SHEET_W = 3;
const SHEET_H = 4;
const TEX_W = 1024;
const TEX_H = 1365;
const DRAW_MS = 3000;
const HOLD_MS = 800;
const DEVELOP_MS = 1600;
const LIFT_MS = 1100;
// Where each sheet lies on the table: x, z, rotation; and a crease and corner of its own
const SLOTS = [
  { x: -3.0, z: -0.2, r: -0.16, corner: [-1, 1], crease: [0.35, [0.62, 0.3]] },
  { x: -0.9, z: -1.9, r: 0.11, corner: [1, 1], crease: [-0.5, [0.4, 0.55]] },
  { x: 1.1, z: -0.3, r: -0.06, corner: [1, 1], crease: [1.25, [0.5, 0.6]] },
  { x: -1.6, z: 1.6, r: 0.21, corner: [-1, -1], crease: [0.9, [0.3, 0.4]] },
  { x: 1.9, z: 1.9, r: -0.24, corner: [1, -1], crease: [-0.2, [0.7, 0.7]] },
];
const FRONT = { x: -0.6, z: 0.6 }; // where on the table the held sheet stands over; it comes up towards the camera from there
const FRONT_CLOSER = 0.1; // how far along the line from the table towards the camera it is held (1 = at the camera)
const _flat = new T.Quaternion();
const _euler = new T.Euler();
const _obj = new T.Object3D();
// Where "Kept" falls in each spoken line, as a share of its length
const KEPT_AT = principles.map((p) => {
  const before = `Promise. ${p.name}. ${p.promise} `.length;
  return before / (before + `Kept: ${p.proof}`.length);
});

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// ---- Procedural paper ---------------------------------------------------------------------------
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
/** A normal map: fine fibre, and one soft crease across the sheet (none when creaseAt is off the sheet). */
function paperNormal(w, h, creaseAngle, creaseAt) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const hf = new Float32Array(w * h);
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < hf.length; i++) hf[i] = (rnd() - 0.5) * 0.9;
  const sm = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    let a = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a += hf[(y + dy) * w + x + dx];
    sm[y * w + x] = a / 9;
  }
  const ca = Math.cos(creaseAngle);
  const sa = Math.sin(creaseAngle);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = ((x / w - creaseAt[0]) * ca + (y / h - creaseAt[1]) * sa) * w;
    sm[y * w + x] += Math.exp(-(d * d) / 18) * 6 - Math.exp(-(d * d) / 400) * 1.2;
  }
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const l = sm[y * w + Math.max(0, x - 1)];
    const r = sm[y * w + Math.min(w - 1, x + 1)];
    const u = sm[Math.max(0, y - 1) * w + x];
    const dn = sm[Math.min(h - 1, y + 1) * w + x];
    const i = (y * w + x) * 4;
    img.data[i] = 128 + (l - r) * 0.12 * 127;
    img.data[i + 1] = 128 + (u - dn) * 0.12 * 127;
    img.data[i + 2] = 255;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
const grain = noiseCanvas(TEX_W, TEX_H, 70, 3);

/** Parse the strokes of a traced drawing (scripts/trace_drawing.py) into Path2D with lengths. */
function parseStrokes(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const vb = (doc.documentElement.getAttribute('viewBox') || '0 0 688 1024').split(/\s+/).map(Number);
  const out = [];
  for (const el of doc.querySelectorAll('path')) {
    const d = el.getAttribute('d') || '';
    const nums = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
    let L = 0;
    for (let i = 2; i + 1 < nums.length; i += 2) L += Math.hypot(nums[i] - nums[i - 2], nums[i + 1] - nums[i - 1]);
    if (L > 0) out.push({ path: new Path2D(d), len: L });
  }
  return { strokes: out, w: vb[2], h: vb[3] };
}

/**
 * @param {HTMLElement} section  the promises section: `.table-host` for the canvas, `[data-sheet]` tabs,
 *   `.table-copy` with [data-copy-num], [data-copy-name], [data-copy-text], [data-copy-kept], `[data-listen]`,
 *   `[data-promises-play]`
 */
export function createPaperTable(section, { media = 'media/', motion = () => true, onVoice = () => {}, dpr = 1.5 } = {}) {
  if (!section) return null;
  const host = section.querySelector('.table-host');
  const tabs = [...section.querySelectorAll('[data-sheet]')];
  const copy = section.querySelector('.table-copy');
  const listen = section.querySelector('[data-listen]');
  const playAll = section.querySelector('[data-promises-play]');
  if (!host) return null;
  const still = () => !motion() || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => matchMedia('(max-width: 900px)').matches;

  const state = { front: -1, phase: 'pile', playing: -1, auto: false, drawn: 0, ready: false };

  // ---- Renderer, scene, light -------------------------------------------------------------------
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dpr));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.NoToneMapping;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  renderer.setClearColor(0x000000, 0);
  scene.background = null;
  const camera = new T.PerspectiveCamera(28, 1, 0.1, 100);
  const key = new T.DirectionalLight('#fff7ee', 2.0);
  key.position.set(-6, 9, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(narrow() ? 2048 : 4096, narrow() ? 2048 : 4096);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  key.shadow.radius = 14;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  scene.add(new T.HemisphereLight('#e9eff7', '#ffffff', 1.9));
  // Only the shadows the sheets throw are drawn on the surface; the page shows through everywhere else
  const table = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({ color: '#30343d', opacity: 0.26 }));
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  // ---- The sheets ---------------------------------------------------------------------------------
  const sheets = SLOTS.map((slot, i) => {
    const geo = new T.PlaneGeometry(SHEET_W, SHEET_H, 60, 80);
    const pos = geo.attributes.position;
    const [creaseAngle, creaseAt] = slot.crease;
    for (let k = 0; k < pos.count; k++) {
      const u = pos.getX(k) / SHEET_W + 0.5;
      const v = pos.getY(k) / SHEET_H + 0.5;
      const cu = slot.corner[0] > 0 ? u : 1 - u;
      const cv = slot.corner[1] > 0 ? v : 1 - v;
      const lift = Math.max(0, cu - 0.55) / 0.45 * Math.max(0, cv - 0.55) / 0.45;
      let z = 0.16 * lift * lift;
      z += 0.03 - 0.03 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
      const d = (u - creaseAt[0]) * Math.cos(creaseAngle) + (v - creaseAt[1]) * Math.sin(creaseAngle);
      z += 0.012 * Math.exp(-(d * d) / 0.0025);
      pos.setZ(k, z);
    }
    geo.computeVertexNormals();
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const ctx = canvas.getContext('2d');
    const done = document.createElement('canvas'); // completed strokes accumulate here
    done.width = TEX_W;
    done.height = TEX_H;
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 8;
    const normal = new T.CanvasTexture(paperNormal(512, 683, creaseAngle, creaseAt));
    const mat = new T.MeshStandardMaterial({ map, normalMap: normal, normalScale: new T.Vector2(0.38, 0.38), roughness: 0.94, metalness: 0, side: T.DoubleSide });
    const mesh = new T.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.i = i;
    scene.add(mesh);
    const sheet = {
      i, mesh, canvas, ctx, done, map, slot,
      strokes: null, scale: 1, wash: null, photo: null,
      progress: 0, drawnTo: 0, develop: 0, // develop 0 plan, 1 print
      flex: 0, // how much the paper gives at the moment (it bends a little as it is lifted and held)
      base: Float32Array.from(geo.attributes.position.array), // the sheet's resting shape
      pose: null,
    };
    sheet.pose = flatPose(sheet, 0.02 + i * 0.02);
    place(sheet, sheet.pose);
    paintBase(sheet);
    return sheet;
  });

  /** Lying on the table at its slot (nudged by dx, dz), face up. */
  function flatPose(sheet, y, dx = 0, dz = 0, s = 1) {
    const q = new T.Quaternion().setFromEuler(_euler.set(-Math.PI / 2, 0, sheet.slot.r));
    return { pos: new T.Vector3(sheet.slot.x + dx, y, sheet.slot.z + dz), quat: q, s };
  }
  /** Held up over the table, facing the reader, tilted back a touch like a page held to read. */
  function heldPose() {
    const over = new T.Vector3(FRONT.x, 2.5, FRONT.z); // held clear of the table, its shadow falling behind it
    const pos = over.clone().lerp(camera.position, FRONT_CLOSER);
    _obj.position.copy(pos);
    _obj.lookAt(camera.position);
    _obj.rotateX(-0.09);
    return { pos, quat: _obj.quaternion.clone(), s: 1 };
  }
  function place(sheet, p) {
    sheet.mesh.position.copy(p.pos);
    sheet.mesh.quaternion.copy(p.quat);
    sheet.mesh.scale.setScalar(p.s);
  }
  /** The paper gives: a gentle curl across its width and a soft ripple along it, by `sheet.flex`. */
  function deform(sheet, now) {
    const pos = sheet.mesh.geometry.attributes.position;
    const base = sheet.base;
    const f = sheet.flex;
    const t = now / 1000;
    for (let k = 0; k < pos.count; k++) {
      const x = base[k * 3];
      const y = base[k * 3 + 1];
      const u = x / SHEET_W + 0.5;
      const v = y / SHEET_H + 0.5;
      // edges curl back towards the hand, the middle stays forward; a ripple runs along the length
      const curl = ((u - 0.5) * (u - 0.5) * 4 - 0.33) * 0.26 * f;
      const ripple = Math.sin(v * Math.PI * 2.2 - t * 5.5 + u * 1.5) * 0.045 * f;
      pos.array[k * 3 + 2] = base[k * 3 + 2] + curl + ripple;
    }
    pos.needsUpdate = true;
    sheet.mesh.geometry.computeVertexNormals();
  }
  function paintBase(sheet) {
    const { ctx } = sheet;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fdfcf9';
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.globalAlpha = 0.035;
    ctx.drawImage(grain, 0, 0);
    ctx.globalAlpha = 1;
    sheet.map.needsUpdate = true;
  }
  /** The drawing's frame on the sheet: width to width, bottom-aligned (the top quarter of the drawing is sky). */
  function frameOf(sheet) {
    const w = sheet.strokes?.w || 688;
    const h = sheet.strokes?.h || 1024;
    const scale = TEX_W / w;
    return { scale, dx: 0, dy: TEX_H - h * scale };
  }
  /** Repaint a sheet's texture from its state: paper, wash, strokes to `progress`, the print to `develop`. */
  function paint(sheet) {
    const { ctx, done } = sheet;
    const f = frameOf(sheet);
    paintBaseNoUpdate(sheet);
    if (sheet.wash && sheet.progress > 0.35) {
      ctx.globalAlpha = clamp((sheet.progress - 0.35) / 0.5) * (1 - sheet.develop);
      ctx.drawImage(sheet.wash, 0, f.dy, TEX_W, sheet.wash.naturalHeight * (TEX_W / sheet.wash.naturalWidth));
      ctx.globalAlpha = 1;
    }
    if (sheet.photo && sheet.develop > 0) {
      // The print comes up: soft and pale first, then sharp
      const k = sheet.develop;
      ctx.save();
      ctx.globalAlpha = easeOut(k);
      const blur = Math.round((1 - k) * 14);
      ctx.filter = `blur(${blur}px) saturate(${0.3 + 0.7 * k}) sepia(${0.4 * (1 - k)}) brightness(${1 + 0.08 * (1 - k)})`;
      const s = Math.max(TEX_W / sheet.photo.naturalWidth, TEX_H / sheet.photo.naturalHeight);
      const pw = sheet.photo.naturalWidth * s;
      const ph = sheet.photo.naturalHeight * s;
      ctx.drawImage(sheet.photo, (TEX_W - pw) / 2, TEX_H - ph, pw, ph);
      ctx.restore();
    }
    // The strokes: those done, then the one in hand; faint once the print is up
    if (sheet.strokes) {
      const { strokes } = sheet.strokes;
      const target = sheet.progress * sheet.strokes.total;
      const dctx = done.getContext('2d');
      let acc = sheet.strokes.accAt(sheet.drawnTo);
      if (sheet.drawnTo < strokes.length && acc + strokes[sheet.drawnTo].len <= target) {
        dctx.save();
        dctx.translate(f.dx, f.dy);
        dctx.scale(f.scale, f.scale);
        dctx.strokeStyle = '#e91c24';
        dctx.lineWidth = 1.45;
        dctx.lineCap = 'round';
        dctx.lineJoin = 'round';
        while (sheet.drawnTo < strokes.length && acc + strokes[sheet.drawnTo].len <= target) {
          dctx.stroke(strokes[sheet.drawnTo].path);
          acc += strokes[sheet.drawnTo].len;
          sheet.drawnTo++;
        }
        dctx.restore();
      }
      ctx.globalAlpha = 1 - 0.68 * sheet.develop;
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(done, 0, 0);
      const cur = strokes[sheet.drawnTo];
      if (cur && target > acc) {
        ctx.save();
        ctx.translate(f.dx, f.dy);
        ctx.scale(f.scale, f.scale);
        ctx.strokeStyle = '#e91c24';
        ctx.lineWidth = 1.45;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const part = clamp((target - acc) / cur.len);
        ctx.setLineDash([cur.len * part, cur.len]);
        ctx.stroke(cur.path);
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    sheet.map.needsUpdate = true;
  }
  function paintBaseNoUpdate(sheet) {
    const { ctx } = sheet;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fdfcf9';
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.globalAlpha = 0.035;
    ctx.drawImage(grain, 0, 0);
    ctx.globalAlpha = 1;
  }
  /** Rebuild `done` from scratch (after a reset of progress). */
  function resetDone(sheet) {
    sheet.done.getContext('2d').clearRect(0, 0, TEX_W, TEX_H);
    sheet.drawnTo = 0;
  }

  // ---- Assets --------------------------------------------------------------------------------------
  const loadImage = (src) => new Promise((res) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
  async function loadSheet(sheet) {
    const stem = `${media}promises/drawn/k${sheet.i + 1}-tint-ref`;
    const [svg, wash] = await Promise.all([fetch(`${stem}.svg`).then((r) => (r.ok ? r.text() : null)).catch(() => null), loadImage(`${stem}.wash.webp`)]);
    if (svg) {
      const parsed = parseStrokes(svg);
      let total = 0;
      const acc = [0];
      for (const s of parsed.strokes) {
        total += s.len;
        acc.push(total);
      }
      sheet.strokes = { ...parsed, total, accAt: (n) => acc[n] || 0 };
    }
    sheet.wash = wash;
    // the photograph only when a sheet comes forward; start it loading now, quietly
    loadImage(`${media}kept-${sheet.i + 1}-1200.webp`).then((im) => (sheet.photo = im));
  }

  // ---- Size and the frame ------------------------------------------------------------------------------
  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = `${w}px`;
    renderer.domElement.style.height = `${h}px`;
    camera.aspect = w / h;
    // The desk from a chair; on narrow screens a little higher and further back so the pile fits
    if (narrow()) camera.position.set(0, 15.5, 10.4);
    else camera.position.set(1.8, 12.2, 9.7);
    camera.lookAt(narrow() ? 0 : 0.9, 0, 0.1);
    camera.updateProjectionMatrix();
    needsRender = true;
  }
  new ResizeObserver(resize).observe(host);

  // ---- Animation ------------------------------------------------------------------------------------------
  let raf = 0;
  let running = false;
  let needsRender = true;
  let visible = false;
  const tweens = new Set(); // { t0, dur, step(k), done }
  function tween(dur, step, done) {
    const tw = { t0: performance.now(), dur, step, done };
    tweens.add(tw);
    wake();
    return tw;
  }
  function frame(now) {
    raf = 0;
    for (const tw of [...tweens]) {
      const k = Math.min(1, (now - tw.t0) / tw.dur);
      tw.step(k, now);
      if (k >= 1) {
        tweens.delete(tw);
        tw.done?.();
      }
      needsRender = true;
    }
    const held = state.front >= 0 && sheets[state.front].restFlex > 0 && !still();
    if (held && !tweens.size) {
      const sh = sheets[state.front];
      sh.flex = sh.restFlex * (0.85 + 0.15 * Math.sin(now / 900));
      deform(sh, now);
      needsRender = true;
    }
    if (needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
    if ((tweens.size || held) && visible) raf = requestAnimationFrame(frame);
    else running = false;
  }
  function wake() {
    if (running || !visible) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function moveTo(sheet, to, dur, { arc = 0, give = 0, settle = 0 } = {}) {
    const from = { pos: sheet.pose.pos.clone(), quat: sheet.pose.quat.clone(), s: sheet.pose.s };
    return new Promise((res) => {
      if (still() || dur <= 0) {
        sheet.pose = { pos: to.pos.clone(), quat: to.quat.clone(), s: to.s };
        sheet.flex = settle;
        place(sheet, sheet.pose);
        deform(sheet, performance.now());
        needsRender = true;
        wake();
        return res();
      }
      const pos = new T.Vector3();
      const quat = new T.Quaternion();
      tween(dur, (k, now) => {
        const e = easeInOut(k);
        pos.lerpVectors(from.pos, to.pos, e);
        pos.y += arc * Math.sin(k * Math.PI);
        quat.slerpQuaternions(from.quat, to.quat, e);
        sheet.pose = { pos: pos.clone(), quat: quat.clone(), s: from.s + (to.s - from.s) * e };
        place(sheet, sheet.pose);
        // the paper gives most in the middle of the move, and keeps a little once held
        sheet.flex = give * Math.sin(k * Math.PI) + settle * e + (1 - e) * (sheet.restFlex || 0);
        deform(sheet, now);
      }, () => {
        sheet.restFlex = settle;
        res();
      });
    });
  }

  // ---- Drawing on, developing, the phases -----------------------------------------------------------------
  async function drawOn(sheet, ms = DRAW_MS) {
    if (!sheet.strokes) return;
    sheet.progress = 0;
    resetDone(sheet);
    if (still()) {
      sheet.progress = 1;
      paint(sheet);
      needsRender = true;
      wake();
      return;
    }
    await new Promise((res) => tween(ms, (k) => {
      sheet.progress = easeInOut(k);
      paint(sheet);
    }, res));
  }
  async function developTo(sheet, target, ms = DEVELOP_MS) {
    const from = sheet.develop;
    if (still()) ms = 200;
    await new Promise((res) => tween(ms, (k) => {
      sheet.develop = from + (target - from) * easeInOut(k);
      paint(sheet);
    }, res));
  }

  function setPhase(ph) {
    state.phase = ph;
    section.dataset.phase = ph;
  }
  function setCopy(i) {
    if (!copy) return;
    const p = principles[i];
    copy.querySelector('[data-copy-num]').textContent = `0${i + 1}`;
    copy.querySelector('[data-copy-name]').textContent = p.name;
    copy.querySelector('[data-copy-text]').textContent = p.promise;
    copy.querySelector('[data-copy-kept]').textContent = p.proof;
    copy.hidden = false;
    tabs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === i)));
    listen?.setAttribute('data-listen', String(i));
  }

  let seq = 0;
  /** Bring sheet i to the front; `voice` paces the print to the narrator. */
  async function front(i, { drawMs = null, holdMs = HOLD_MS } = {}) {
    const token = ++seq;
    const prev = state.front;
    state.front = i;
    setCopy(i);
    section.classList.add('has-front');
    setPhase('lifting');
    const sheet = sheets[i];
    const jobs = [];
    if (prev >= 0 && prev !== i) jobs.push(putBack(sheets[prev], { quiet: true }));
    // the others ease back a touch so the held sheet has room
    for (const s of sheets) if (s !== sheet && s.i !== prev) jobs.push(moveTo(s, flatPose(s, s.pose.pos.y, -0.25, 0.15), 700));
    // the chosen sheet lifts off the table and comes up to face the reader, giving a little as it moves
    jobs.push(moveTo(sheet, heldPose(), LIFT_MS, { arc: 0.3, give: 0.55, settle: 0.16 }));
    await Promise.all(jobs);
    if (token !== seq) return;
    if (sheet.progress < 1 && drawMs !== 0) {
      setPhase('drawing');
      await drawOn(sheet, drawMs || DRAW_MS);
      if (token !== seq) return;
    }
    setPhase('held');
    await wait(holdMs);
    if (token !== seq) return;
    setPhase('developing');
    if (!sheet.photo) sheet.photo = await loadImage(`${media}kept-${sheet.i + 1}-1200.webp`);
    if (token !== seq) return;
    sheet.develop = 0;
    copy?.classList.add('is-kept');
    await developTo(sheet, 1);
    if (token !== seq) return;
    setPhase('kept');
  }
  async function putBack(sheet, { quiet = false } = {}) {
    if (!quiet) {
      seq++;
      state.front = -1;
      section.classList.remove('has-front');
      copy?.classList.remove('is-kept');
      tabs.forEach((t) => t.setAttribute('aria-pressed', 'false'));
      setPhase('pile');
    }
    const back = moveTo(sheet, flatPose(sheet, 0.02 + sheet.i * 0.02), 900, { arc: 0.3, give: 0.4, settle: 0 });
    const fade = sheet.develop > 0 ? developTo(sheet, 0, 900) : Promise.resolve();
    await Promise.all([back, fade]);
    if (!quiet) for (const s of sheets) if (s.i !== state.front) moveTo(s, flatPose(s, s.pose.pos.y), 600);
  }

  // ---- The narrator ----------------------------------------------------------------------------------------
  let audio = null;
  function stopVoice() {
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio = null;
      onVoice(false);
    }
    state.playing = -1;
    listen?.setAttribute('aria-pressed', 'false');
    if (listen) listen.querySelector('span').textContent = 'Listen';
  }
  function playLine(i) {
    stopVoice();
    return new Promise((resolve) => {
      const a = new Audio(`${media}voice/promises/promise-${i + 1}.mp3`);
      a.preload = 'auto';
      audio = a;
      state.playing = i;
      listen?.setAttribute('aria-pressed', 'true');
      if (listen) listen.querySelector('span').textContent = 'Stop';
      let started = false;
      const fallBack = () => {
        if (audio === a) stopVoice();
        front(i);
        resolve();
      };
      const begin = () => {
        if (started || audio !== a) return;
        started = true;
        const d = a.duration && isFinite(a.duration) ? a.duration : 12;
        const keptAt = d * KEPT_AT[i];
        // The sheet lifts and (if it is still a plan) draws while he reads the promise; the print comes up at "Kept"
        const sheet = sheets[i];
        const drawMs = sheet.progress < 1 ? Math.max(1200, (keptAt - 0.5) * 1000 - LIFT_MS) : 0;
        const holdMs = sheet.progress < 1 ? 400 : Math.max(300, (keptAt - 0.3) * 1000 - LIFT_MS);
        front(i, { drawMs, holdMs });
        a.play().then(() => onVoice(true)).catch(fallBack);
      };
      a.addEventListener('loadedmetadata', begin, { once: true });
      a.addEventListener('error', fallBack, { once: true });
      a.onended = () => {
        if (audio === a) stopVoice();
        resolve();
      };
      setTimeout(() => { if (!started && audio === a) begin(); }, 2500);
    });
  }
  listen?.addEventListener('click', () => {
    const i = Number(listen.dataset.listen);
    if (state.playing === i) return stopVoice();
    if (state.auto) stopAll();
    playLine(i);
  });

  // ---- Play the five promises ----------------------------------------------------------------------------------
  let autoRun = 0;
  async function runAll() {
    const token = ++autoRun;
    state.auto = true;
    playAll?.setAttribute('aria-pressed', 'true');
    for (let i = 0; i < sheets.length; i++) {
      if (token !== autoRun) return;
      await playLine(i);
      if (token !== autoRun) return;
      await wait(1000);
    }
    if (token === autoRun) stopAll();
  }
  function stopAll() {
    autoRun++;
    state.auto = false;
    stopVoice();
    playAll?.setAttribute('aria-pressed', 'false');
  }
  playAll?.addEventListener('click', () => (state.auto ? stopAll() : runAll()));
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (state.auto || state.playing >= 0) stopAll();
    else if (state.front >= 0) putBack(sheets[state.front]);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (state.auto || state.playing >= 0)) stopAll();
  });

  // ---- Choosing a sheet: a click on the table, or its tab --------------------------------------------------------------
  const ray = new T.Raycaster();
  const ndc = new T.Vector2();
  function sheetAt(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(sheets.map((s) => s.mesh), false)[0];
    return hit ? hit.object.userData.i : -1;
  }
  function choose(i) {
    if (state.auto) stopAll();
    else if (state.playing >= 0) stopVoice();
    if (i < 0) return;
    if (state.front === i) putBack(sheets[i]);
    else front(i);
  }
  renderer.domElement.addEventListener('click', (e) => choose(sheetAt(e)));
  renderer.domElement.addEventListener('pointermove', (e) => {
    renderer.domElement.style.cursor = sheetAt(e) >= 0 ? 'pointer' : '';
  });
  tabs.forEach((t, i) => t.addEventListener('click', () => choose(i)));

  // ---- Arrival: the sheets are put down and draw themselves in turn ------------------------------------------------
  let arrived = false;
  async function arrive() {
    if (arrived) return;
    arrived = true;
    state.ready = true;
    for (const s of sheets) {
      s.pose = flatPose(s, 0.9 + s.i * 0.02);
      place(s, s.pose);
    }
    needsRender = true;
    wake();
    // put down one after another
    sheets.forEach((s, i) => setTimeout(() => moveTo(s, flatPose(s, 0.02 + i * 0.02), 700, { give: 0.25 }), i * 140));
    await wait(900);
    // draw in turn, overlapping a little
    const per = still() ? 0 : 1700;
    for (let i = 0; i < sheets.length; i++) {
      drawOn(sheets[i], DRAW_MS).then(() => (state.drawn++));
      await wait(per);
    }
  }
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) {
      wake();
      if (!arrived) ready.then(arrive);
    }
  }, { rootMargin: '60px' });
  io.observe(host);

  const ready = Promise.all(sheets.map(loadSheet)).then(() => {
    for (const s of sheets) paint(s);
    needsRender = true;
    resize();
  });

  return {
    state,
    sheets,
    front,
    putBack: () => (state.front >= 0 ? putBack(sheets[state.front]) : Promise.resolve()),
    playLine,
    playAll: runAll,
    stop: stopAll,
    ready,
  };
}
