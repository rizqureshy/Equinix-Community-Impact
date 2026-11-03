// The Resources curtain: press the red pill in the header and a length of
// red satin falls over the page, folds moving as if live, with the resources
// on it. Close, Escape or the pill lifts it again. The cloth is a hanging
// plane whose vertices ride layered waves, lit like the fabric behind the
// page; without WebGL, or with motion off, the curtain is a plain red panel
// that appears at once.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const RED = '#e91c24';
const FALL_MS = 1150;
const RISE_MS = 850;
const SETTLE_MS = 700; // the folds calm down after the hem lands

/** The cloth: a curtain hung from above the viewport that falls and rises. */
function createCloth(host, { motion = () => true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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

  const SEG_X = 120;
  const SEG_Y = 70;
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
    W = visW * 1.14;
    H = visH * 1.32;
    geometry?.dispose();
    geometry = new THREE.PlaneGeometry(W, H, SEG_X, SEG_Y);
    base = geometry.attributes.position.array.slice();
    cloth.geometry = geometry;
  }

  function shape(t) {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const yn = (y + H / 2) / H; // 0 at the hem, 1 at the rod
      const hang = 1 - yn; // folds and sway grow toward the hem
      // Pleats: slow vertical folds that drift sideways, with finer ones riding on them
      const pleat = Math.sin(x * 0.75 + t * 0.3 + Math.sin(yn * 3) * 0.6) * 0.55 + Math.sin(x * 1.7 - t * 0.45 + yn * 2) * 0.25 + Math.sin(x * 0.35 + y * 0.4 + t * 0.18) * 0.45;
      // The fall stirs the cloth; the stir fades once the hem has landed
      const stir = agit * Math.sin(x * 2.4 + y * 1.5 + t * 7) * 0.4 * hang;
      pos.array[i * 3] = x + Math.sin(t * 0.5 + yn * 2) * 0.25 * hang;
      pos.array[i * 3 + 1] = y + Math.sin(x * 1.2 + t * 0.8) * 0.35 * hang * hang;
      pos.array[i * 3 + 2] = pleat * (0.35 + 0.65 * hang) + stir;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  function place() {
    // At rest the rod sits just above the top edge; gathered, the whole cloth is above the view
    const rest = visH / 2 + 0.8 - H / 2;
    cloth.position.y = rest + drop * (H + 1.5);
  }

  let raf = 0;
  let running = false;
  let last = 0;
  let tween = null; // { from, to, start, length, onDone }
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;
  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (motion()) time += dt;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.length);
      const e = tween.to < tween.from ? easeOutCubic(t) : easeInCubic(t);
      drop = tween.from + (tween.to - tween.from) * e;
      agit = tween.to < tween.from ? 0.35 + 0.65 * (1 - t) : 0.6;
      if (t >= 1) {
        const done = tween.onDone;
        tween = null;
        done?.();
      }
    } else if (agit > 0.001) {
      agit = Math.max(0, agit - dt * (1000 / SETTLE_MS));
    }
    shape(time);
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
    shape(time);
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
