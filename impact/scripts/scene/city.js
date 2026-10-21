// The connected community as a live scale model. Buildings are AI generated
// 3D assets (image to 3D), placed on a white plinth and joined by the red
// thread. The scene owns no page state: it is given a scroll progress and a
// pointer, and reports what the visitor hovers or selects.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const palette = {
  red: new THREE.Color('#e31c25'),
  amber: new THREE.Color('#e09a3c'),
  plinth: new THREE.Color('#fbfbfc'),
  road: new THREE.Color('#e6e6ea'),
  green: new THREE.Color('#b9c9b2'),
};

/**
 * Layout of the model. Positions in plinth units (the plinth is 30 wide).
 * `width` is the footprint each generated model is scaled to. `rot` turns
 * the model so its front faces the camera's resting side.
 */
export const PLACES = {
  datacenter: { file: 'b7-datacenter', pos: [0.5, 0, -1.0], width: 8.4, rot: 0.15 },
  hospital: { file: 'b1-hospital', pos: [-8.4, 0, -4.8], width: 7.6, rot: 0.55 },
  research: { file: 'b2-research', pos: [8.6, 0, -5.8], width: 7.2, rot: -0.35 },
  learning: { file: 'b3-learning', pos: [-8.8, 0, 4.4], width: 7.0, rot: 0.35 },
  homes: { file: 'b4-homes', pos: [7.8, 0, 4.4], width: 7.4, rot: -0.55 },
  shops: { file: 'b5-shops', pos: [2.8, 0, 8.6], width: 6.2, rot: 0.1 },
  aquatic: { file: 'b6-aquatic', pos: [-3.6, 0, 8.8], width: 6.6, rot: 0.2 },
};

/** Camera stops: orbit around a target. Azimuth and elevation in radians. */
export const VIEWS = {
  overview: { target: [0, 0.6, 1.0], dist: 46, az: 0.42, el: 0.62 },
  hospital: { target: [-8.2, 1.4, -4.6], dist: 22, az: 0.3, el: 0.5 },
  research: { target: [8.4, 1.4, -5.6], dist: 22, az: 0.7, el: 0.5 },
  learning: { target: [-8.6, 1.2, 4.4], dist: 22, az: 0.2, el: 0.52 },
  homes: { target: [7.6, 1.2, 4.2], dist: 24, az: 0.8, el: 0.5 },
  aquatic: { target: [-3.4, 1.0, 8.6], dist: 22, az: 0.1, el: 0.56 },
  datacenter: { target: [0.5, 1.6, -1.0], dist: 28, az: 0.45, el: 0.5 },
  shops: { target: [2.6, 1.0, 8.2], dist: 20, az: 0.3, el: 0.5 },
};

/** Threads: conceptual connections, not network routes or physical pipes. */
function threadDefinitions() {
  const at = (id, dy = 0.6) => new THREE.Vector3(...PLACES[id].pos).add(new THREE.Vector3(0, dy, 0));
  const lift = (a, b, h) => {
    const m = a.clone().lerp(b, 0.5);
    m.y = Math.max(a.y, b.y) + h;
    return m;
  };
  const dc = at('datacenter', 1.0);
  const edge = new THREE.Vector3(16.5, 0.4, -12);
  return [
    { id: 'hospital', kind: 'data', points: [dc, lift(dc, at('hospital'), 2.2), at('hospital')] },
    { id: 'research', kind: 'data', points: [dc, lift(dc, at('research'), 2.4), at('research')] },
    { id: 'research-out', kind: 'data', points: [at('research', 1.0), lift(at('research', 1.0), edge, 1.4), edge] },
    { id: 'learning', kind: 'data', points: [dc, lift(dc, at('learning'), 2.0), at('learning')] },
    { id: 'homes', kind: 'data', points: [dc, lift(dc, at('homes'), 2.0), at('homes')] },
    { id: 'shops', kind: 'data', points: [at('homes', 0.5), lift(at('homes', 0.5), at('shops', 0.5), 1.0), at('shops', 0.5)] },
    { id: 'heat', kind: 'heat', points: [at('datacenter', 0.3), lift(at('datacenter', 0.3), at('aquatic', 0.3), 0.6), at('aquatic', 0.3)] },
  ];
}

export const threadsForFocus = {
  overview: ['hospital', 'research', 'learning', 'homes', 'shops'],
  hospital: ['hospital'],
  research: ['research', 'research-out'],
  learning: ['learning'],
  homes: ['homes', 'shops'],
  shops: ['shops', 'homes'],
  aquatic: ['heat'],
  datacenter: ['hospital', 'research', 'learning', 'homes', 'shops', 'heat'],
};

export function supportsWebGL2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

function orbitPosition(view, out = new THREE.Vector3()) {
  const [tx, ty, tz] = view.target;
  return out.set(
    tx + Math.sin(view.az) * Math.cos(view.el) * view.dist,
    ty + Math.sin(view.el) * view.dist,
    tz + Math.cos(view.az) * Math.cos(view.el) * view.dist,
  );
}

// ---------------------------------------------------------------------------
// Ground: a white plinth with soft roads, a river of green and small trees
// ---------------------------------------------------------------------------
function buildGround(scene) {
  const ground = new THREE.Group();
  const plinthMat = new THREE.MeshStandardMaterial({ color: palette.plinth, roughness: 0.9, metalness: 0 });

  const plinthShape = new THREE.Shape();
  const w = 30;
  const h = 26;
  const r = 4;
  plinthShape.moveTo(-w / 2 + r, -h / 2);
  plinthShape.lineTo(w / 2 - r, -h / 2);
  plinthShape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  plinthShape.lineTo(w / 2, h / 2 - r);
  plinthShape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  plinthShape.lineTo(-w / 2 + r, h / 2);
  plinthShape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  plinthShape.lineTo(-w / 2, -h / 2 + r);
  plinthShape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const plinth = new THREE.Mesh(new THREE.ExtrudeGeometry(plinthShape, { depth: 1.2, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 3 }), plinthMat);
  plinth.rotation.x = -Math.PI / 2;
  plinth.position.y = -1.45;
  plinth.receiveShadow = true;
  ground.add(plinth);

  // Roads as thin flat strips
  const roadMat = new THREE.MeshStandardMaterial({ color: palette.road, roughness: 1 });
  const road = (x, z, len, wid, rot = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, wid), roadMat);
    m.position.set(x, 0.03, z);
    m.rotation.y = rot;
    m.receiveShadow = true;
    ground.add(m);
  };
  road(0, 1.8, 26, 1.6); // main street, east to west
  road(-4.5, 0, 1.4, 20, 0); // north to south, west
  road(4.6, 0, 1.4, 20, 0); // north to south, east
  road(0, -8.2, 22, 1.2); // back lane

  // A green: an informal park with a few trees
  const greenMat = new THREE.MeshStandardMaterial({ color: palette.green, roughness: 1 });
  const green = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.05, 40), greenMat);
  green.position.set(0.6, 0.025, 4.9);
  green.receiveShadow = true;
  ground.add(green);

  const trunkMat = new THREE.MeshStandardMaterial({ color: '#c9b79b', roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#a7bba0', roughness: 0.95 });
  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.6, 6);
  const leafGeo = new THREE.SphereGeometry(0.34, 12, 10);
  const spots = [
    [-1.6, 4.2], [0.2, 6.4], [2.2, 4.0], [1.4, 5.6], [-0.8, 5.9],
    [-12.4, -0.4], [-12.6, 1.2], [12.6, -0.6], [12.8, 1.4], [-12, 9.2], [12.2, 9.4], [-5.5, -10.2], [6.2, -10.4],
  ];
  for (const [x, z] of spots) {
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 0.3, z);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(x, 0.8, z);
    leaf.castShadow = true;
    ground.add(trunk, leaf);
  }
  scene.add(ground);
  return ground;
}

// ---------------------------------------------------------------------------
// Threads
// ---------------------------------------------------------------------------
function buildThreads(scene) {
  const group = new THREE.Group();
  const threads = {};
  const bead = new THREE.SphereGeometry(0.16, 14, 10);
  for (const def of threadDefinitions()) {
    const curve = new THREE.CatmullRomCurve3(def.points, false, 'centripetal');
    const color = def.kind === 'heat' ? palette.amber : palette.red;
    const geo = new THREE.TubeGeometry(curve, 120, def.kind === 'heat' ? 0.09 : 0.065, 8, false);
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(geo, material);
    mesh.renderOrder = 2;
    const pulse = new THREE.Mesh(bead, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }));
    pulse.renderOrder = 3;
    group.add(mesh, pulse);
    threads[def.id] = { curve, mesh, pulse, material, kind: def.kind, shown: 0, target: 0, phase: Math.random() };
  }
  scene.add(group);
  return threads;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
/**
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {string} opts.assetBase  URL prefix for the GLB files
 * @param {Map<string, HTMLElement>} opts.labels place id to label element
 */
export function createCityScene(container, { assetBase = 'media/city/', labels = new Map(), onReady, onFail, onSelect, onHover, motion = () => true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    onFail?.(err);
    return null;
  }
  const constrained = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, constrained ? 1 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.className = 'scene-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 220);

  // Light: a soft studio key with a wide shadow, plus a cool fill
  const key = new THREE.DirectionalLight('#fff6ea', 2.2);
  key.position.set(-14, 26, 16);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -22;
  key.shadow.camera.right = key.shadow.camera.top = 22;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 80;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#dfe8ff', 0.5);
  fill.position.set(18, 10, -12);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9d9de', 0.35));

  buildGround(scene);
  const threads = buildThreads(scene);

  // Buildings
  const buildings = {}; // id -> group
  const anchors = {}; // id -> Vector3 (label anchor above the roof)
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  function placeModel(id, gltf) {
    const def = PLACES[id];
    const model = gltf.scene;
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) {
          o.material.envMapIntensity = 0.6;
          if ('roughness' in o.material) o.material.roughness = Math.max(o.material.roughness, 0.55);
        }
      }
    });
    // Normalise: footprint to `width`, base on the plinth, centred on XZ
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = def.width / Math.max(size.x, size.z);
    model.scale.setScalar(scale);
    box.setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    model.position.set(-centre.x, -box.min.y, -centre.z);
    const group = new THREE.Group();
    group.add(model);
    group.position.set(...def.pos);
    group.rotation.y = def.rot;
    group.userData.place = id;
    scene.add(group);
    buildings[id] = group;
    anchors[id] = new THREE.Vector3(def.pos[0], size.y * scale + 0.9, def.pos[2]);
  }

  const ids = Object.keys(PLACES);
  const loads = ids.map(
    (id) =>
      new Promise((resolve, reject) => {
        loader.load(`${assetBase}${PLACES[id].file}.glb`, (gltf) => resolve([id, gltf]), undefined, reject);
      }),
  );

  // Camera state
  const cur = { pos: orbitPosition(VIEWS.overview), target: new THREE.Vector3(...VIEWS.overview.target), shift: 0 };
  const want = { pos: cur.pos.clone(), target: cur.target.clone(), shift: 0 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let focus = 'overview';
  let hovered = null;
  let visible = true;
  let ready = false;
  let dirty = true;
  let raf = 0;
  let last = 0;
  let instantNext = true;

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const projected = new THREE.Vector3();

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.height = `${h}px`;
    camera.aspect = w / h;
    camera.fov = w < 700 ? 38 : 30;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /** Blend between two stops. `side` shifts the subject so a card can sit beside it. */
  function viewAt(a, b, t, side) {
    const va = VIEWS[a];
    const vb = VIEWS[b];
    const k = smooth(clamp(t));
    const target = new THREE.Vector3(...va.target).lerp(new THREE.Vector3(...vb.target), k);
    const view = { target: target.toArray(), dist: va.dist + (vb.dist - va.dist) * k, az: va.az + (vb.az - va.az) * k, el: va.el + (vb.el - va.el) * k };
    want.pos.copy(orbitPosition(view));
    want.target.copy(target);
    want.shift = side;
  }

  function revealThreads(ids, instant) {
    for (const [id, th] of Object.entries(threads)) {
      th.target = ids.includes(id) ? 1 : 0;
      if (instant) th.shown = th.target;
    }
  }

  /** Progress through the journey, 0 (overview) to 1 (last stop). */
  const stops = ['overview'];
  function setStops(list) {
    stops.length = 0;
    stops.push('overview', ...list);
  }
  function setProgress(p, { side = 0 } = {}) {
    const n = stops.length - 1;
    const x = clamp(p) * n;
    const i = Math.min(Math.floor(x), n - 1);
    const t = x - i;
    viewAt(stops[i], stops[Math.min(i + 1, n)], t, side);
    const near = t < 0.5 ? stops[i] : stops[Math.min(i + 1, n)];
    if (near !== focus) {
      focus = near;
      revealThreads(threadsForFocus[focus] || [], false);
      for (const [id, el] of labels) el.classList.toggle('is-focus', id === focus);
    }
    dirty = true;
  }

  function setFocus(name, { instant = false } = {}) {
    const v = VIEWS[name] || VIEWS.overview;
    focus = name;
    want.pos.copy(orbitPosition(v));
    want.target.set(...v.target);
    want.shift = 0;
    revealThreads(threadsForFocus[name] || [], instant);
    for (const [id, el] of labels) el.classList.toggle('is-focus', id === name);
    if (instant) instantNext = true;
    dirty = true;
  }

  function placeLabels() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    for (const [id, el] of labels) {
      const a = anchors[id];
      if (!a) {
        el.classList.add('is-offscreen');
        continue;
      }
      projected.copy(a).project(camera);
      const off = projected.z > 1 || Math.abs(projected.x) > 0.98 || Math.abs(projected.y) > 0.98;
      el.classList.toggle('is-offscreen', off);
      if (!off) el.style.transform = `translate(${((projected.x + 1) / 2) * w}px, ${((1 - projected.y) / 2) * h}px)`;
    }
  }

  function pick(event) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((event.clientX - r.left) / r.width) * 2 - 1, -((event.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(Object.values(buildings), true);
    let o = hits[0]?.object;
    while (o && !o.userData.place) o = o.parent;
    return o?.userData.place || null;
  }

  function onPointerMove(event) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.tx = ((event.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((event.clientY - r.top) / r.height) * 2 - 1;
    const id = ready ? pick(event) : null;
    if (id !== hovered) {
      hovered = id;
      renderer.domElement.style.cursor = id ? 'pointer' : '';
      for (const [pid, el] of labels) el.classList.toggle('is-hover', pid === id);
      onHover?.(id);
    }
    dirty = true;
  }
  function onPointerLeave() {
    pointer.tx = pointer.ty = 0;
    if (hovered) {
      hovered = null;
      renderer.domElement.style.cursor = '';
      for (const el of labels.values()) el.classList.remove('is-hover');
      onHover?.(null);
    }
    dirty = true;
  }
  function onClick(event) {
    const id = pick(event);
    if (id) onSelect?.(id);
  }
  container.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('pointerleave', onPointerLeave);
  renderer.domElement.addEventListener('click', onClick);

  const tmp = new THREE.Vector3();
  const right = new THREE.Vector3();
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000) || 0.016);
    last = now;
    if (!visible) return;
    const moving = motion();

    // Camera eases toward the wanted view; the cursor adds a gentle parallax
    const k = instantNext ? 1 : 1 - Math.exp(-dt * 6);
    const kp = instantNext ? 1 : 1 - Math.exp(-dt * 4);
    instantNext = false;
    pointer.x += (pointer.tx - pointer.x) * kp;
    pointer.y += (pointer.ty - pointer.y) * kp;
    cur.shift += (want.shift - cur.shift) * k;
    cur.target.lerp(want.target, k);
    cur.pos.lerp(want.pos, k);

    camera.position.copy(cur.pos);
    const lookAt = cur.target.clone();
    // Shift the subject sideways in screen space so a card can sit beside it
    camera.lookAt(lookAt);
    right.setFromMatrixColumn(camera.matrix, 0);
    const span = cur.pos.distanceTo(cur.target) * 0.34;
    lookAt.addScaledVector(right, cur.shift * span * (container.clientWidth > 760 ? 1 : 0));
    if (moving) {
      camera.position.addScaledVector(right, pointer.x * 0.9);
      camera.position.y += -pointer.y * 0.5;
    }
    camera.lookAt(lookAt);

    // Threads fade in and carry a bead of light
    let animating = false;
    for (const th of Object.values(threads)) {
      if (Math.abs(th.shown - th.target) > 0.002) {
        th.shown += (th.target - th.shown) * (1 - Math.exp(-dt * 5));
        animating = true;
      } else th.shown = th.target;
      th.material.opacity = th.shown * 0.95;
      th.pulse.material.opacity = th.shown;
      th.mesh.visible = th.pulse.visible = th.shown > 0.01;
      if (th.shown > 0.01) {
        if (moving) th.phase = (th.phase + dt * (th.kind === 'heat' ? 0.12 : 0.22)) % 1;
        th.pulse.position.copy(th.curve.getPointAt(clamp(th.phase)));
        animating = animating || moving;
      }
    }

    renderer.render(scene, camera);
    placeLabels();

    const settled = cur.pos.distanceToSquared(want.pos) < 1e-4 && Math.abs(pointer.x - pointer.tx) < 1e-3 && Math.abs(pointer.y - pointer.ty) < 1e-3;
    dirty = animating || !settled;
    if (dirty) raf = requestAnimationFrame(frame);
  }

  function tick() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }
  const ticker = setInterval(() => {
    if (dirty) tick();
  }, 50);

  function setVisible(v) {
    visible = v;
    if (v) {
      last = performance.now();
      dirty = true;
      tick();
    }
  }

  // A missing building should not take the whole community down: place
  // what loaded and report only if nothing did.
  Promise.allSettled(loads).then((results) => {
    const missing = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') placeModel(...r.value);
      else missing.push(ids[i]);
    });
    if (missing.length === ids.length) {
      onFail?.(results[0].reason);
      return;
    }
    if (missing.length) console.warn('Community model: missing buildings', missing);
    ready = true;
    instantNext = true;
    setFocus('overview', { instant: true });
    onReady?.(missing);
  });

  return {
    setStops,
    setProgress,
    setFocus,
    setVisible,
    resize,
    get focus() {
      return focus;
    },
    get ready() {
      return ready;
    },
    canvas: renderer.domElement,
    dispose() {
      clearInterval(ticker);
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
