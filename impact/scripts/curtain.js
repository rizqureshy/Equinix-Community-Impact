// The Resources curtain: press the red pill in the header and a length of
// red satin falls over the page, folds moving as if live, with the resources
// on it. Close, Escape or the pill lifts it again. The cloth is a hanging
// plane whose vertices ride layered waves, lit like the fabric behind the
// page; without WebGL, or with motion off, the curtain is a plain red panel
// that appears at once.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const RED = '#e91c24';
const FALL_MS = 1250;
const RISE_MS = 1000;
const SETTLE_MS = 1100; // the folds calm down after the hem lands

/** The cloth: a curtain hung from above the viewport that falls and rises. */
function createCloth(host, { motion = () => true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const DIST = 20;
  camera.position.set(0, 0, DIST);

  const key = new THREE.DirectionalLight('#fff4ea', 1.5);
  key.position.set(-5, 9, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffc9c4', 0.9);
  rim.position.set(7, -3, 6);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#ffffff', '#3a0d0d', 0.35));

  const SEG_X = 150;
  const SEG_Y = 84;
  let W = 10;
  let H = 10;
  let visH = 10;
  let geometry = null;
  let base = null;
  const material = new THREE.MeshPhysicalMaterial({
    color: RED,
    roughness: 0.6,
    metalness: 0,
    sheen: 0.5,
    sheenColor: new THREE.Color('#ff8c86'),
    sheenRoughness: 0.7,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  scene.add(cloth);

  const TAU = Math.PI * 2;
  let drop = 1; // 1 gathered above the viewport, 0 hanging over it
  let agit = 0; // how much the folds are stirred (the fall stirs them)
  let time = 0;

  /** The cloth's size follows the viewport: a little wider than the view and a third taller. */
  function build() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = `${w}px`;
    renderer.domElement.style.height = `${h}px`;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    visH = 2 * DIST * Math.tan((camera.fov * Math.PI) / 360);
    const visW = visH * camera.aspect;
    // The canvas runs 70px past the panel on each side; the cloth fills the panel and waves just beyond it
    const panelShare = Math.max(0.6, (w - 140) / w);
    W = visW * (panelShare + 0.03);
    H = visH * 1.32;
    geometry?.dispose();
    geometry = new THREE.PlaneGeometry(W, H, SEG_X, SEG_Y);
    base = geometry.attributes.position.array.slice();
    cloth.geometry = geometry;
  }

  const LAG = 0.38; // how far the hem trails the rod on the way down (a share of the travel)
  let landed = -1; // the moment the hem landed, for the bounce; -1 while airborne or settled

  function shape(t, now) {
    const pos = geometry.attributes.position;
    const travel = H + 1.5;
    const since = landed < 0 ? -1 : (now - landed) / 1000;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const yn = (y + H / 2) / H; // 0 at the hem, 1 at the rod
      const hang = 1 - yn; // folds, sway and lag grow toward the hem
      // Pleats: deep slow folds that drift sideways, with finer ones riding on them
      const pleat = Math.sin(x * 0.62 + t * 0.19 + Math.sin(yn * 3) * 0.7) * 0.7 + Math.sin(x * 1.5 - t * 0.29 + yn * 2) * 0.26 + Math.sin(x * 0.3 + y * 0.4 + t * 0.12) * 0.55;
      // On the way down the cloth billows: horizontal waves travel up it and the hem flutters
      const billow = agit * (Math.sin(y * 0.7 + t * 2.6) * 0.6 + Math.sin(x * 0.6 - t * 1.7) * 0.3 + Math.sin(x * 2.4 + y * 1.5 + t * 5) * 0.16) * hang;
      // The rod leads and the hem trails, so the cloth stretches out as it falls and gathers as it rises
      const d = Math.min(1, drop * (1 + hang * LAG));
      // Once the hem lands it bounces, less each time
      const bounce = since >= 0 ? Math.sin(since * 5.2) * Math.exp(-since * 2.2) * 0.32 * hang * hang : 0;
      // The side edges wave on their own, more toward the hem
      const edge = Math.pow(Math.abs(x) / (W / 2), 3);
      pos.array[i * 3] = x + Math.sin(t * 0.32 + yn * 2) * 0.24 * hang + Math.sign(x) * Math.sin(y * 0.9 + t * 0.45 + Math.sign(x)) * 0.3 * edge * (0.4 + hang);
      pos.array[i * 3 + 1] = y + d * travel + Math.sin(x * 1.1 + t * 0.5) * 0.32 * hang * hang + bounce;
      pos.array[i * 3 + 2] = pleat * (0.35 + 0.65 * hang) + billow;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  function place() {
    // At rest the rod sits just above the top edge of the layer; the travel is applied per vertex in shape()
    cloth.position.y = visH / 2 + 0.8 - H / 2;
  }

  let raf = 0;
  let running = false;
  let last = 0;
  let tween = null; // { from, to, start, length, onDone }
  // The fall gathers speed like a dropped cloth, then the last stretch eases so the landing is soft
  const gravity = (t) => (t < 0.72 ? (t * t) / 0.72 : 0.72 + (1 - 0.72) * (1 - Math.pow(1 - (t - 0.72) / 0.28, 2)));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (motion()) time += dt;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.length);
      const falling = tween.to < tween.from;
      const e = falling ? gravity(t) : easeInOut(t);
      drop = tween.from + (tween.to - tween.from) * e;
      agit = falling ? 0.35 + 0.35 * t : 0.45;
      if (t >= 1) {
        const done = tween.onDone;
        tween = null;
        if (falling) landed = now;
        done?.();
      }
    } else if (agit > 0.001) {
      agit = Math.max(0, agit - dt * (1000 / SETTLE_MS));
    }
    if (landed >= 0 && now - landed > 3200) landed = -1;
    shape(time, now);
    place();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  }
  const ro = new ResizeObserver(() => {
    build();
    shape(time, performance.now());
    place();
    if (!running) renderer.render(scene, camera);
  });
  ro.observe(host);
  build();

  const run = (to, length) =>
    new Promise((resolve) => {
      tween = { from: drop, to, start: performance.now(), length, onDone: resolve };
      start();
    });
  return {
    /** Drop the cloth over the page; resolves when the hem has landed. */
    fall: () => run(0, FALL_MS),
    /** Gather it back above the view; resolves when it is out of sight. */
    rise: () => run(1, RISE_MS),
    stop,
    dispose() {
      stop();
      ro.disconnect();
      geometry?.dispose();
      material.dispose();
      renderer.dispose();
      pmrem.dispose();
      renderer.domElement.remove();
    },
  };
}

/**
 * @param {HTMLElement} overlay   the .curtain element
 * @param {object} opts
 * @param {() => boolean} opts.motion
 * @param {boolean} opts.webgl
 * @param {HTMLElement[]} opts.triggers  the buttons that open and close it (the pill)
 * @param {() => void} [opts.onOpen]
 * @param {() => void} [opts.onClose]
 */
export function createCurtain(overlay, { motion = () => true, webgl = true, triggers = [], onOpen, onClose } = {}) {
  const clothHost = overlay.querySelector('.curtain-cloth');
  const panel = overlay.querySelector('.curtain-panel');
  const closeBtn = overlay.querySelector('[data-curtain-close]');
  let cloth = null;
  let state = 'closed'; // closed | falling | open | rising
  let returnFocus = null;

  function setState(s) {
    state = s;
    overlay.dataset.state = s;
    for (const t of triggers) t.setAttribute('aria-expanded', String(s === 'open' || s === 'falling'));
  }
  const live = () => webgl && motion();

  async function open({ trigger = null } = {}) {
    if (state !== 'closed') return;
    returnFocus = trigger || document.activeElement;
    // The curtain hangs from the menu bar: the header stays above it and the cloth starts at its lower edge
    const rod = document.querySelector('.nav-keystone') || document.querySelector('.site-header');
    const top = rod ? Math.max(0, Math.round(rod.getBoundingClientRect().bottom - 8)) : 0;
    overlay.style.setProperty('--curtain-top', `${top}px`);
    overlay.hidden = false;
    overlay.classList.toggle('is-plain', !live());
    document.body.classList.add('curtain-open');
    onOpen?.();
    if (live()) {
      if (!cloth) cloth = createCloth(clothHost, { motion });
      if (cloth) {
        setState('falling');
        await cloth.fall();
        if (state !== 'falling') return;
      } else overlay.classList.add('is-plain');
    }
    setState('open');
    closeBtn.focus();
  }
  async function close() {
    if (state !== 'open' && state !== 'falling') return;
    setState('rising');
    if (cloth && live()) {
      await cloth.rise();
      if (state !== 'rising') return;
    }
    cloth?.stop();
    overlay.hidden = true;
    document.body.classList.remove('curtain-open');
    setState('closed');
    onClose?.();
    returnFocus?.focus?.();
    returnFocus = null;
  }
  const toggle = (opts) => (state === 'closed' ? open(opts) : close());

  for (const t of triggers) t.addEventListener('click', () => toggle({ trigger: t }));
  closeBtn.addEventListener('click', () => close());
  document.addEventListener('pointerdown', (e) => {
    // A press on the page beside the curtain lifts it; the header's own controls keep working
    if (state !== 'open' || overlay.contains(e.target) || e.target.closest('.site-header')) return;
    close();
  });
  overlay.addEventListener('click', (e) => {
    // A link to somewhere on this page lifts the curtain first, then goes there
    const go = e.target.closest('[data-curtain-go]');
    if (go) {
      e.preventDefault();
      const href = go.getAttribute('href');
      close().then(() => {
        location.hash = href;
      });
    }
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    // Focus stays on the curtain while it is down
    const items = [...panel.querySelectorAll('a[href], button:not([disabled])')].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  return {
    open,
    close,
    toggle,
    get state() {
      return state;
    },
    get live() {
      return !!cloth && live();
    },
  };
}
