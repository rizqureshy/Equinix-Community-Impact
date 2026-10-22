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
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 21);

  const key = new THREE.DirectionalLight('#fff4ea', 1.7);
  key.position.set(-6, 8, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffc9c4', 1.1);
  rim.position.set(8, -4, -6);
  scene.add(rim);

  // The cloth is built along a sweeping centreline that rises, dives and
  // turns through space, so the whole length folds over like silk in a
  // wind, rather than a flat band with ripples on it. Each frame: the
  // centreline moves, the cloth's width turns about it (so both faces
  // show), and small ripples ride on top.
  const LENGTH = 30;
  const WIDTH = 7;
  const SEG_X = 220;
  const SEG_Y = 36;
  const geometry = new THREE.PlaneGeometry(LENGTH, WIDTH, SEG_X, SEG_Y);
  const base = geometry.attributes.position.array.slice();
  // Satin: strong sheen, no hard clearcoat, some roughness so folds read as cloth
  const material = new THREE.MeshPhysicalMaterial({
    color: RED,
    roughness: 0.38,
    metalness: 0,
    sheen: 0.8,
    sheenColor: new THREE.Color('#ff7a72'),
    sheenRoughness: 0.5,
    clearcoat: 0.1,
    clearcoatRoughness: 0.5,
    side: THREE.DoubleSide,
  });
  const cloth = new THREE.Mesh(geometry, material);
  cloth.rotation.set(-0.08, 0.18, -0.22);
  cloth.position.set(0.6, 0, 0);
  scene.add(cloth);
  scene.add(new THREE.HemisphereLight('#ffffff', '#3a0d0d', 0.35));

  const pos = geometry.attributes.position;
  const TAU = Math.PI * 2;
  const C = new THREE.Vector3();
  const C2 = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  /** The centreline of the cloth at u (0 held end, 1 free end) and time t. */
  function centre(u, t, out) {
    const free = 0.35 + u * 0.95;
    const x = (u - 0.5) * LENGTH;
    const y = (Math.sin(u * TAU * 1.6 + t * 0.5) * 3.1 + Math.sin(u * TAU * 0.7 - t * 0.27) * 2.0 + Math.sin(u * TAU * 2.9 + t * 0.9) * 0.6) * free;
    const z = (Math.sin(u * TAU * 1.3 + t * 0.4 + 1.2) * 2.6 + Math.sin(u * TAU * 2.4 - t * 0.6) * 0.9) * free;
    return out.set(x, y, z);
  }
  function shape(t) {
    const gust = 0.8 + 0.2 * Math.sin(t * 0.29) * Math.sin(t * 0.16 + 1.1);
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const v = base[i * 3 + 1] / WIDTH; // -0.5 .. 0.5 across the cloth
      const u = (x + LENGTH / 2) / LENGTH;
      centre(u, t, C);
      centre(Math.min(1, u + 0.004), t, C2);
      T.subVectors(C2, C).normalize();
      // A frame that turns about the centreline: the cloth rolls as it flies
      const roll = Math.sin(u * TAU * 1.1 + t * 0.35) * 1.4 + u * 2.2 + t * 0.08;
      B.crossVectors(T, UP).normalize();
      N.crossVectors(B, T).normalize();
      const cr = Math.cos(roll);
      const sr = Math.sin(roll);
      // width direction = N*cos(roll) + B*sin(roll)
      const wx = N.x * cr + B.x * sr;
      const wy = N.y * cr + B.y * sr;
      const wz = N.z * cr + B.z * sr;
      // The width cups: edges curl toward the face, more at the free end
      const cup = (v * v * 4) * 1.2 * Math.sin(u * TAU * 0.9 + t * 0.7) * (0.3 + u);
      // Small ripples riding on the cloth
      const ripple =
        (Math.sin(x * 1.1 + v * 3 + t * 1.5) * 0.22 + Math.sin(x * 2.3 - v * 5 + t * 2.4) * 0.08) * (0.3 + u) * gust;
      // face direction = B*cos(roll) - N*sin(roll)
      const fx = B.x * cr - N.x * sr;
      const fy = B.y * cr - N.y * sr;
      const fz = B.z * cr - N.z * sr;
      const across = v * WIDTH * (0.85 + 0.15 * Math.sin(u * TAU + t * 0.3));
      const outward = cup + ripple;
      pos.array[i * 3] = C.x + wx * across + fx * outward;
      pos.array[i * 3 + 1] = C.y + wy * across + fy * outward;
      pos.array[i * 3 + 2] = C.z + wz * across + fz * outward;
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
    camera.position.z = w < 900 ? 27 : 21;
    camera.updateProjectionMatrix();
    draw();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  function draw() {
    cloth.position.y = scrollDrift;
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
      // The cloth sways within the viewport as the page scrolls, never leaving it
      scrollDrift = Math.sin(scrollY * 0.0009) * 2.2;
      cloth.rotation.z = -0.22 + Math.sin(scrollY * 0.0006) * 0.14;
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
