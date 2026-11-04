// One length of red satin, in two states. Flying: it rides a slow wind behind
// the page, a long plane whose vertices are displaced each frame by layered
// travelling waves (a cheap stand-in for cloth simulation that stays smooth and
// never tangles), lit as satin. Hanging: the same cloth, drawn up through the
// keystone in the header and let down over the page as the Carry the Story
// curtain, pleats drifting and the hem settling. The change of state is the
// transition: the flying cloth gathers into the keystone, the layer steps in
// front of the page, and the cloth unfurls from the keystone; the reverse to
// lift it. It renders in its own transparent canvas, fixed to the viewport,
// and only while the tab is visible.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const RED = '#e91c24';
// The pace of the choreography. ?pace=1.5 on the address slows every beat by half, for tuning by eye.
const PACE = Math.min(4, Math.max(0.25, Number(new URLSearchParams(location.search).get('pace')) || 1));
const GATHER_MS = 1700 * PACE; // the flying cloth draws into the keystone
const UNFURL_MS = 2100 * PACE; // the curtain comes down out of it
const FURL_MS = 1500 * PACE; // the curtain gathers back up into it
const RELEASE_MS = 1500 * PACE; // the cloth flies out again
const SETTLE_MS = 2200; // the folds calm down after the hem lands
const FLY_OPACITY = 0.5;
const HANG_OPACITY = 0.9;

/**
 * @param {HTMLElement} host  the fixed layer that receives the canvas
 * @param {object} opts
 * @param {() => boolean} opts.motion  whether motion is on (still pose when off)
 */
export function createFabric(host, { motion = () => true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral tone mapping keeps the red red; ACES would drift it to salmon
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const FOV = 36;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, 21);

  const key = new THREE.DirectionalLight('#fff4ea', 1.7);
  key.position.set(-6, 8, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffc9c4', 1.1);
  rim.position.set(8, -4, -6);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#ffffff', '#3a0d0d', 0.35));

  // One grid serves both shapes: long and narrow as the flying cloth, wide and
  // tall as the curtain. u runs along its length (across the curtain), v across
  // its width (down the curtain).
  const LENGTH = 30;
  const WIDTH = 9;
  const SEG_X = 200;
  const SEG_Y = 48;
  const geometry = new THREE.PlaneGeometry(LENGTH, WIDTH, SEG_X, SEG_Y);
  const base = geometry.attributes.position.array.slice();
  const material = new THREE.MeshPhysicalMaterial({
    color: RED,
    roughness: 0.62,
    metalness: 0,
    sheen: 0.5,
    sheenColor: new THREE.Color('#ff8c86'),
    sheenRoughness: 0.7,
    clearcoat: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: FLY_OPACITY,
    depthWrite: false,
  });
  const cloth = new THREE.Mesh(geometry, material);
  scene.add(cloth);
  const FLY_ROT = new THREE.Euler(-0.08, 0.18, -0.22);
  const FLY_POS = new THREE.Vector3(0.6, 0, 0);

  const pos = geometry.attributes.position;
  const TAU = Math.PI * 2;
  const C = new THREE.Vector3();
  const C2 = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);

  // ---- The flying shape ------------------------------------------------------
  /** The centreline of the cloth at u (0 held end, 1 free end) and time t. */
  function centre(u, t, out) {
    const free = 0.35 + u * 0.95;
    const x = (u - 0.5) * LENGTH;
    const y = (Math.sin(u * TAU * 1.6 + t * 0.5) * 3.1 + Math.sin(u * TAU * 0.7 - t * 0.27) * 2.0 + Math.sin(u * TAU * 2.9 + t * 0.9) * 0.6) * free;
    const z = (Math.sin(u * TAU * 1.3 + t * 0.4 + 1.2) * 2.6 + Math.sin(u * TAU * 2.4 - t * 0.6) * 0.9) * free;
    return out.set(x, y, z);
  }
  const fly = new Float32Array(base.length);
  let gust = 1;
  /** One point of the flying cloth: at u along its length (0 held, 1 free) and v across (-0.5..0.5). */
  function flyPoint(u, v, t, out) {
    const x = (u - 0.5) * LENGTH;
    centre(u, t, C);
    centre(u + 0.004, t, C2); // a step on along the line, even past the free end, so the tangent is never zero
    T.subVectors(C2, C).normalize();
    const roll = Math.sin(u * TAU * 1.1 + t * 0.35) * 1.4 + u * 2.2 + t * 0.08;
    B.crossVectors(T, UP).normalize();
    N.crossVectors(B, T).normalize();
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    const wx = N.x * cr + B.x * sr;
    const wy = N.y * cr + B.y * sr;
    const wz = N.z * cr + B.z * sr;
    const cup = (v * v * 4) * 1.5 * Math.sin(u * TAU * 0.9 + t * 0.7) * (0.3 + u);
    const ripple = (Math.sin(x * 1.1 + v * 3 + t * 1.5) * 0.22 + Math.sin(x * 2.3 - v * 5 + t * 2.4) * 0.08) * (0.3 + u) * gust;
    const fx = B.x * cr - N.x * sr;
    const fy = B.y * cr - N.y * sr;
    const fz = B.z * cr - N.z * sr;
    const swell = 0.7 + 0.3 * Math.sin(u * TAU * 1.3 + t * 0.33) + 0.12 * Math.sin(u * TAU * 3.1 - t * 0.5);
    const edge = v > 0 ? Math.sin(u * TAU * 2.2 + t * 0.8) : Math.sin(u * TAU * 1.7 - t * 0.6 + 2);
    const across = v * WIDTH * swell + Math.sign(v) * (v * v * 4) * edge * 0.9;
    const flutter = (v * v * 4) * Math.sin(x * 2.6 + t * 3.2 + v * 9) * 0.35 * (0.3 + u);
    const outward = cup + ripple + flutter;
    return out.set(C.x + wx * across + fx * outward, C.y + wy * across + fy * outward, C.z + wz * across + fz * outward);
  }
  const V = new THREE.Vector3();
  const F = new THREE.Vector3();
  const K = new THREE.Vector3();
  const Pl = new THREE.Vector3();
  const inv = new THREE.Matrix4();
  const EXT = 0.5; // how far, in lengths of the cloth, the path runs on from the cloth to the keystone
  const MID = 0.5; // the point of the cloth under the keystone: the pull starts there
  /** The flying cloth, pulled `s` of the way into the keystone (0 flying, 1 inside): both tails slide
   *  inward along the cloth's own path to its middle, and the middle rises on a short arc into the keystone. */
  function shapeFlying(t, s) {
    gust = 0.8 + 0.2 * Math.sin(t * 0.29) * Math.sin(t * 0.16 + 1.1);
    const pull = s * (0.5 + EXT);
    if (s > 0) {
      // The keystone, in the cloth's own space, so the thread's end holds still on screen while the cloth untilts
      cloth.updateMatrixWorld();
      inv.copy(cloth.matrixWorld).invert();
      Pl.set(hang.xC, hang.keyY, 0.5).applyMatrix4(inv);
      flyPoint(MID, 0, t, K); // the middle of the cloth, where the arc begins
    }
    for (let i = 0; i < pos.count; i++) {
      const u = (base[i * 3] + LENGTH / 2) / LENGTH;
      const v = base[i * 3 + 1] / WIDTH;
      const side = u < MID ? -1 : 1;
      const d = Math.abs(u - MID) - pull; // how far this point still is from the middle, along the cloth
      if (d >= 0) {
        // Still on the cloth's own path, slid toward the middle
        flyPoint(MID + side * d, v, t, V);
      } else {
        // Past the middle: on the arc from the middle up into the keystone, narrowing as it goes
        const k = Math.min(1, -d / EXT);
        flyPoint(MID, v, t, F);
        const ctlx = (K.x + Pl.x) / 2 + side * 0.6;
        const ctly = Math.max(K.y, Pl.y) + 1.6;
        const ctlz = (K.z + Pl.z) / 2 + 1.2;
        const q = 1 - k;
        const bx = q * q * K.x + 2 * q * k * ctlx + k * k * Pl.x;
        const by = q * q * K.y + 2 * q * k * ctly + k * k * Pl.y;
        const bz = q * q * K.z + 2 * q * k * ctlz + k * k * Pl.z;
        const thin = 1 - 0.85 * k; // the cloth narrows into the keystone
        V.set(bx + (F.x - K.x) * thin + side * 0.12 * (1 - k), by + (F.y - K.y) * thin, bz + (F.z - K.z) * thin);
      }
      fly[i * 3] = V.x;
      fly[i * 3 + 1] = V.y;
      fly[i * 3 + 2] = V.z;
    }
  }

  // ---- The hanging shape -------------------------------------------------------
  // In world units at the cloth's depth: the curtain panel's centre, its top (the
  // keystone's lower edge), its width and its height, set from the page's pixels
  const hang = { xC: 0, yTop: 6, width: 16, height: 20, keyWidth: 3, keyY: 6.5 };
  let spread = 0; // 0 the keystone's width, 1 the curtain's
  let height = 0; // 0 gathered at the keystone's edge, 1 hanging full length
  let agit = 0; // how much the folds are stirred; the unfurl stirs them
  let landed = -1; // when the hem landed, for the bounce
  const hung = new Float32Array(base.length);
  function shapeHanging(t, now) {
    const since = landed < 0 ? -1 : (now - landed) / 1000;
    const W = hang.keyWidth + (hang.width - hang.keyWidth) * spread;
    for (let i = 0; i < pos.count; i++) {
      const u = (base[i * 3] + LENGTH / 2) / LENGTH; // 0 left .. 1 right
      const vn = (base[i * 3 + 1] + WIDTH / 2) / WIDTH; // 0 hem .. 1 rod
      const drop = 1 - vn; // folds, sway and bounce grow toward the hem
      const x = (u - 0.5) * W;
      const pleat = (Math.sin(x * 0.62 + t * 0.19 + Math.sin(vn * 3) * 0.7) * 0.7 + Math.sin(x * 1.5 - t * 0.29 + vn * 2) * 0.26 + Math.sin(x * 0.3 + vn * 4 + t * 0.12) * 0.55) * (0.35 + 0.65 * drop) * (0.3 + 0.7 * spread);
      const billow = agit * (Math.sin(vn * 7 + t * 2.6) * 0.6 + Math.sin(x * 0.6 - t * 1.7) * 0.3 + Math.sin(x * 2.4 + vn * 12 + t * 5) * 0.16) * drop;
      const bounce = since >= 0 ? Math.sin(since * 4.2) * Math.exp(-since * 2.0) * 0.2 * drop * drop : 0;
      const edge = Math.pow(Math.abs(u - 0.5) * 2, 3);
      hung[i * 3] = hang.xC + x + Math.sin(t * 0.32 + vn * 2) * 0.24 * drop * spread + Math.sign(u - 0.5) * Math.sin(vn * 9 + t * 0.45) * 0.3 * edge * (0.4 + drop) * spread;
      hung[i * 3 + 1] = hang.yTop - drop * hang.height * height + Math.sin(x * 1.1 + t * 0.5) * 0.32 * drop * drop * spread + bounce;
      hung[i * 3 + 2] = 0.2 + pleat + billow;
    }
  }

  // ---- The blend ----------------------------------------------------------------
  // state: flying | gathering | hanging | releasing. gather runs 0 (flying) to 1
  // (drawn into the keystone); the hanging shape takes over from there.
  let state = 'flying';
  let gather = 0;
  const tmpQ = new THREE.Quaternion();
  const flyQ = new THREE.Quaternion().setFromEuler(FLY_ROT);
  const idQ = new THREE.Quaternion();
  let scrollDrift = 0;
  let rollZ = FLY_ROT.z;
  function compose(t, now) {
    const flying = state === 'flying' || state === 'gathering' || state === 'releasing';
    if (flying) {
      // The flying cloth's tilt and sway ease away as it is drawn in; set first, so the thread's end is right
      tmpQ.copy(flyQ).slerp(idQ, gather);
      cloth.quaternion.copy(tmpQ);
      cloth.position.set(FLY_POS.x * (1 - gather), scrollDrift * (1 - gather), 0);
      cloth.rotation.z = rollZ * (1 - gather);
      shapeFlying(t, gather);
      pos.array.set(fly);
      material.opacity = FLY_OPACITY + (HANG_OPACITY - FLY_OPACITY) * gather;
    } else {
      shapeHanging(t, now);
      pos.array.set(hung);
      cloth.quaternion.copy(idQ);
      cloth.position.set(0, 0, 0);
      material.opacity = HANG_OPACITY;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  // ---- Time, size, the loop ------------------------------------------------------
  let time = 0;
  let last = 0;
  let raf = 0;
  let running = false;
  let tween = null; // { from, to, start, length, apply, onDone }
  let visH = 10;
  let upp = 0.01; // world units per CSS pixel at the cloth's depth

  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = `${w}px`;
    renderer.domElement.style.height = `${h}px`;
    camera.aspect = w / h;
    // Keep the cloth's apparent size steady across viewport widths
    camera.position.z = w < 900 ? 27 : 21;
    camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan((FOV * Math.PI) / 360);
    upp = visH / h;
    draw();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  /** Where the curtain hangs, from the page's pixels: the panel's box and the keystone's. */
  function setHang({ left, width, top, bottom, keyLeft, keyWidth, keyBottom }) {
    const w = host.clientWidth || innerWidth;
    hang.xC = (left + width / 2 - w / 2) * upp;
    hang.yTop = visH / 2 - (top + 2) * upp; // the rod sits at the keystone's lower edge, never above the bars
    hang.width = width * upp * 1.06;
    hang.height = (bottom - top) * upp * 1.28;
    hang.keyWidth = Math.max(0.6, keyWidth * upp * 0.9);
    hang.keyY = visH / 2 - (keyBottom - 10) * upp;
    void keyLeft;
  }

  function draw() {
    renderer.render(scene, camera);
  }
  const easeInOut = (t) => -(Math.cos(Math.PI * t) - 1) / 2; // a sine ease: no corners at either end
  // The fall: a slow start, a gentle middle and a long soft landing
  const gravity = (t) => 1 - Math.pow(1 - t, 2.6) * (1 - t * 0.35) - (1 - t) * t * t * 0.25;
  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (motion()) time += dt;
    if (tween) {
      const k = Math.min(1, (now - tween.start) / tween.length);
      tween.apply(k, now);
      if (k >= 1) {
        const done = tween.onDone;
        tween = null;
        done?.();
      }
    } else if (agit > 0.001) {
      agit = Math.max(0, agit - dt * (1000 / SETTLE_MS));
    }
    if (landed >= 0 && now - landed > 3200) landed = -1;
    compose(time, now);
    draw();
    // The flying cloth rests between frames only when motion is off; the curtain keeps breathing
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener(
    'scroll',
    () => {
      // The flying cloth sways within the viewport as the page scrolls, never leaving it
      scrollDrift = Math.sin(scrollY * 0.0009) * 2.2;
      rollZ = -0.22 + Math.sin(scrollY * 0.0006) * 0.14;
      if (!motion() && state === 'flying') {
        compose(time, performance.now());
        draw();
      }
    },
    { passive: true },
  );

  const run = (length, apply) =>
    new Promise((resolve) => {
      tween = { start: performance.now(), length, apply, onDone: resolve };
      start();
    });

  compose(0, performance.now());
  resize();
  start();

  return {
    start,
    stop,
    setHang,
    get state() {
      return state;
    },
    /** Draw the flying cloth into the keystone; resolves when it is hidden inside. */
    async gatherIn() {
      if (state !== 'flying' && state !== 'releasing') return;
      state = 'gathering';
      const from = gather;
      await run(GATHER_MS * (1 - from), (k) => {
        gather = from + (1 - from) * easeInOut(k);
      });
      gather = 1;
    },
    /** Let the curtain down out of the keystone; resolves when the hem has landed. */
    async unfurl() {
      state = 'hanging';
      spread = 0;
      height = 0;
      agit = 0.5;
      landed = -1;
      await run(UNFURL_MS, (k) => {
        height = gravity(k);
        // The cloth stays narrow until the hem is a third of the way down, then opens
        spread = easeInOut(Math.min(1, Math.max(0, (height - 0.2) / 0.6)));
        agit = 0.25 + 0.25 * k;
      });
      height = 1;
      spread = 1;
      landed = performance.now();
    },
    /** Gather the curtain back up into the keystone; resolves when it is inside. */
    async furl() {
      if (state !== 'hanging') return;
      landed = -1;
      await run(FURL_MS, (k) => {
        const e = easeInOut(k);
        height = 1 - e;
        spread = 1 - easeInOut(Math.max(0, (k - 0.3) / 0.7));
        agit = 0.3;
      });
      height = 0;
      spread = 0;
    },
    /** Let the cloth fly out of the keystone and back behind the page. */
    async release() {
      state = 'releasing';
      gather = 1;
      await run(RELEASE_MS, (k) => {
        gather = 1 - easeInOut(k);
      });
      gather = 0;
      state = 'flying';
    },
    /** For study only: hold the choreography at a point and draw it. `beat` is gather | unfurl | furl, `k` 0..1. */
    scrub(beat, k) {
      stop();
      tween = null;
      if (beat === 'gather') {
        state = 'gathering';
        gather = k;
      } else {
        state = 'hanging';
        if (beat === 'unfurl') {
          height = gravity(k);
          spread = easeInOut(Math.min(1, Math.max(0, (height - 0.2) / 0.6)));
          agit = 0.25 + 0.25 * k;
        } else {
          const e = easeInOut(k);
          height = 1 - e;
          spread = 1 - easeInOut(Math.max(0, (k - 0.3) / 0.7));
          agit = 0.3;
        }
        landed = -1;
      }
      compose(time, performance.now());
      draw();
      return renderer.domElement.toDataURL('image/png');
    },
    /** For study only: back to flight, running. */
    unscrub() {
      state = 'flying';
      gather = 0;
      start();
    },
    /** With motion off the cloth holds its pose; a redraw keeps it crisp after resizes. */
    motionChanged() {
      if (!motion()) {
        compose(time, performance.now());
        draw();
      }
    },
    dispose() {
      stop();
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      pmrem.dispose();
      renderer.domElement.remove();
    },
  };
}
