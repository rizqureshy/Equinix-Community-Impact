// A length of red satin flying in a slow wind behind the page. The cloth is
// a long plane whose vertices are displaced each frame by layered travelling
// waves (a cheap stand-in for cloth simulation that stays smooth and never
// tangles), lit as satin. It renders in its own transparent canvas, fixed
// behind the content, and only while the tab is visible.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const RED = '#e91c24';

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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  const key = new THREE.DirectionalLight('#fff1e0', 2.4);
  key.position.set(-6, 8, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffd0d0', 1.2);
  rim.position.set(8, -4, -6);
  scene.add(rim);

  // The cloth: long and narrow, finely divided along its length
  const LENGTH = 26;
  const WIDTH = 3.6;
  const SEG_X = 180;
  const SEG_Y = 26;
  const geometry = new THREE.PlaneGeometry(LENGTH, WIDTH, SEG_X, SEG_Y);
  const base = geometry.attributes.position.array.slice();
  const material = new THREE.MeshPhysicalMaterial({
    color: RED,
    roughness: 0.32,
    metalness: 0,
    sheen: 1,
    sheenColor: new THREE.Color('#ff9a96'),
    sheenRoughness: 0.45,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
  });
  const cloth = new THREE.Mesh(geometry, material);
  cloth.rotation.set(-0.18, 0.22, -0.32);
  cloth.position.set(1.2, 1.0, 0);
  scene.add(cloth);

  // Wind: a few travelling waves of different lengths and speeds, plus a
  // slow twist along the length and a large, lazy swing of the whole cloth
  const waves = [
    { k: 0.55, ky: 0.0, w: 0.9, a: 0.95 },
    { k: 1.15, ky: 0.35, w: 1.6, a: 0.42 },
    { k: 2.4, ky: 0.9, w: 2.7, a: 0.12 },
    { k: 0.28, ky: 0.0, w: 0.35, a: 1.1 },
  ];
  const pos = geometry.attributes.position;
  function shape(t) {
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const u = (x + LENGTH / 2) / LENGTH; // 0 at the trailing end, 1 at the leading edge
      const flutter = 0.35 + u * 0.9; // the free end moves most
      let z = 0;
      let dy = 0;
      for (const wv of waves) {
        z += Math.sin(x * wv.k + y * wv.ky + t * wv.w) * wv.a * flutter;
      }
      // A slow twist so the cloth rolls over and shows both faces
      const twist = Math.sin(x * 0.22 + t * 0.4) * 0.9 * (0.2 + u);
      dy = y * Math.cos(twist) - y;
      z += y * Math.sin(twist);
      // Edges curl a little more than the middle
      z += Math.sign(y) * Math.pow(Math.abs(y) / (WIDTH / 2), 3) * 0.25 * Math.sin(x * 0.8 + t * 1.2);
      pos.array[i * 3 + 1] = y + dy + Math.sin(x * 0.35 + t * 0.5) * 0.35 * u;
      pos.array[i * 3 + 2] = z;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  let time = 0;
  let last = 0;
  let raf = 0;
  let running = false;
  let scrollDrift = 0;

  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = `${w}px`;
    renderer.domElement.style.height = `${h}px`;
    camera.aspect = w / h;
    // Keep the cloth's apparent size steady across viewport widths
    camera.position.z = w < 900 ? 22 : 16;
    camera.updateProjectionMatrix();
    draw();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  function draw() {
    cloth.position.y = 1.0 + scrollDrift;
    renderer.render(scene, camera);
  }
  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (motion()) time += dt;
    shape(time);
    draw();
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
      // The cloth rises slowly as the page scrolls, like something passing overhead
      scrollDrift = Math.min(6, scrollY * 0.0025);
      if (!motion()) draw();
    },
    { passive: true },
  );

  shape(0);
  resize();
  start();

  return {
    start,
    stop,
    /** With motion off the cloth holds its pose; a redraw keeps it crisp after resizes. */
    motionChanged() {
      if (!motion()) {
        shape(time);
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
