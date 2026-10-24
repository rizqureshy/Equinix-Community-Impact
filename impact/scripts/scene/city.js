// The connected community as a live scale model. Buildings are AI generated
// 3D assets (image to 3D), placed on a white plinth and joined by the red
// thread. The scene owns no page state: it is given a scroll progress and a
// pointer, and reports what the visitor hovers or selects.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const palette = {
  red: new THREE.Color('#e91c24'),
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

/**
 * Door views: the camera at street level close to each building's entrance,
 * looking at the door. The approach glides here before the dive film takes
 * over, and the film's first frame is rendered from this exact view.
 */
export const DOORS = {
  hospital: { target: [-8.2, 1.6, -4.6], dist: 12, az: 0.97, el: 0.16 },
  research: { target: [8.4, 1.6, -5.6], dist: 12, az: -0.9, el: 0.16 },
  learning: { target: [-8.6, 1.4, 4.4], dist: 11.5, az: 1.95, el: 0.16 },
  homes: { target: [7.6, 1.4, 4.2], dist: 12, az: 1.5, el: 0.16 },
  aquatic: { target: [-3.4, 1.3, 8.6], dist: 10, az: -1.2, el: 0.18 },
  datacenter: { target: [0.5, 1.8, -1.0], dist: 13, az: 0.2, el: 0.16 },
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
    const color = palette.red; // every thread, heat included, is Equinix red
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
export function createCityScene(container, { assetBase = 'media/city/', labels = new Map(), onReady, onFail, onSelect, onHover, onInteract, motion = () => true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
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

  // Light: a low, warm autumn sun with long soft shadows, plus a cool fill
  const key = new THREE.DirectionalLight('#ffe4c0', 2.5);
  key.position.set(-18, 18, 18);
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
  const fill = new THREE.DirectionalLight('#dfe8ff', 0.4);
  fill.position.set(18, 10, -12);
  scene.add(fill);
  const hemi = new THREE.HemisphereLight('#ffffff', '#d9d9de', 0.35);
  scene.add(hemi);


  buildGround(scene);

  // A world around the model for the door views: a soft sky, land beyond the
  // plinth and a distant tree line, so a dive film has somewhere to travel
  // through. Off by default; the page keeps its white.
  let backdrop = null;
  function buildBackdrop() {
    const group = new THREE.Group();
    const gradient = (stops, w = 4, h = 512) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      const grad = g.createLinearGradient(0, 0, 0, h);
      for (const [t, col] of stops) grad.addColorStop(t, col);
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(420, 32, 24),
      new THREE.MeshBasicMaterial({ map: gradient([[0, '#9fbfe4'], [0.42, '#d7e5f4'], [0.5, '#f2efe8'], [1, '#e8e6df']]), side: THREE.BackSide, toneMapped: false, fog: false }),
    );
    group.add(sky);
    const land = new THREE.Mesh(new THREE.CircleGeometry(400, 64), new THREE.MeshStandardMaterial({ color: '#d9d8cc', roughness: 1 }));
    land.rotation.x = -Math.PI / 2;
    land.position.y = -1.25;
    land.receiveShadow = true;
    group.add(land);
    // The tree line: a soft band of silhouettes on a ring, far enough to read as a horizon
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 256;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      const x = rnd() * c.width;
      const rad = 18 + rnd() * 34;
      const y = c.height - 40 - rnd() * 30;
      const shade = 70 + Math.floor(rnd() * 40);
      g.fillStyle = `rgba(${shade}, ${shade + 22}, ${shade - 6}, ${0.55 + rnd() * 0.35})`;
      g.beginPath();
      g.ellipse(x, y, rad * 0.9, rad, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(78, 96, 70, 0.9)';
    g.fillRect(0, c.height - 46, c.width, 46);
    const treeTex = new THREE.CanvasTexture(c);
    treeTex.colorSpace = THREE.SRGBColorSpace;
    treeTex.wrapS = THREE.RepeatWrapping;
    treeTex.repeat.x = 3;
    const trees = new THREE.Mesh(
      new THREE.CylinderGeometry(70, 70, 16, 96, 1, true),
      new THREE.MeshBasicMaterial({ map: treeTex, transparent: true, side: THREE.BackSide, toneMapped: false, depthWrite: false }),
    );
    trees.position.y = 6.5;
    group.add(trees);
    return group;
  }
  function setBackdrop(on) {
    if (on && !backdrop) {
      backdrop = buildBackdrop();
      scene.add(backdrop);
    }
    if (backdrop) backdrop.visible = on;
    scene.fog = on ? new THREE.Fog('#e9ebe4', 70, 180) : null;
    dirty = true;
    tick();
  }
  const threads = buildThreads(scene);

  // Buildings
  const buildings = {}; // id -> group
  const pickProxies = []; // one invisible box per building: picking never touches the real triangles
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
          // Roofs and facades at grazing angles stay sharp
          const maxAniso = renderer.capabilities.getMaxAnisotropy();
          for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) {
            if (o.material[key]) o.material[key].anisotropy = Math.min(8, maxAniso);
          }
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
    // A box the size of the building for hover and click: raycasting the
    // full mesh at this detail would cost tens of milliseconds a move
    box.setFromObject(model);
    const proxySize = box.getSize(new THREE.Vector3());
    const proxy = new THREE.Mesh(new THREE.BoxGeometry(proxySize.x, proxySize.y, proxySize.z), new THREE.MeshBasicMaterial({ visible: false }));
    proxy.position.copy(box.getCenter(new THREE.Vector3()));
    proxy.userData.place = id;
    group.add(proxy);
    pickProxies.push(proxy);
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
  // The view the visitor controls: an orbit around a target. Drag turns it,
  // the wheel or a pinch zooms it, the tour and the doors set it.
  const LIMITS = { el: [0.08, 1.25], dist: [9, 60] };
  const free = { target: [...VIEWS.overview.target], dist: VIEWS.overview.dist, az: VIEWS.overview.az, el: VIEWS.overview.el };
  let saved = null; // the free view to return to after a door
  let byHand = false; // the last change came from a drag, pinch, wheel or key: follow it closely
  let atDoor = false; // at a building's door (the room is opening): the hand is ignored
  let savedFocus = 'overview';
  let focus = 'overview';
  let drift = false;
  let driftAngle = 0;
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

  let threadsHidden = false;
  function revealThreads(ids, instant) {
    for (const [id, th] of Object.entries(threads)) {
      th.target = !threadsHidden && ids.includes(id) ? 1 : 0;
      if (instant) th.shown = th.target;
    }
  }

  /** Glide to a building's door; resolves when the camera has settled. */
  // The approach is timed by the clock, not the frame rate, so it takes the
  // same 2.6 seconds on a slow machine as on a fast one and always arrives.
  let settledResolvers = [];
  let glide = null; // { from, fromTarget, start, length }
  const APPROACH_MS = 2600;
  function approach(name, { instant = false } = {}) {
    const v = DOORS[name];
    if (!v) return Promise.resolve();
    if (!atDoor) {
      saved = { ...free, target: [...free.target] };
      savedFocus = focus;
    }
    focus = name;
    driftAngle = 0;
    drift = false;
    atDoor = true;
    setFree(v);
    want.pos.copy(orbitPosition(v));
    want.target.set(...v.target);
    want.shift = 0;
    revealThreads([], instant);
    for (const el of labels.values()) el.classList.add('is-offscreen');
    if (instant) {
      instantNext = true;
      glide = null;
      dirty = true;
      tick();
      return Promise.resolve();
    }
    glide = { from: cur.pos.clone(), fromTarget: cur.target.clone(), start: performance.now(), length: APPROACH_MS };
    dirty = true;
    tick();
    return new Promise((resolve) => {
      settledResolvers.push(resolve);
      // The glide is clock-timed, so by now the camera is at the door whatever
      // the frame rate; never leave the visitor waiting on a frame that may
      // not come (the model paused off screen, a stalled tab).
      setTimeout(resolve, APPROACH_MS + 400);
    });
  }

  /** The current frame as a PNG data URL (used to render the door views). */
  function snapshot() {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  }

  /** Point the camera at the free view (plus the tour's slow orbit, if any). */
  function applyFree() {
    want.pos.copy(orbitPosition({ ...free, az: free.az + driftAngle }));
    want.target.set(...free.target);
    want.shift = 0;
    dirty = true;
    tick();
  }
  function setFree(v) {
    free.target = [...v.target];
    free.dist = v.dist;
    free.az = v.az;
    free.el = v.el;
  }
  function setFocus(name, { instant = false } = {}) {
    const v = VIEWS[name] || VIEWS.overview;
    glide = null;
    byHand = false;
    atDoor = false;
    focus = name;
    driftAngle = 0;
    setFree(v);
    revealThreads(threadsForFocus[name] || [], instant);
    for (const [id, el] of labels) el.classList.toggle('is-focus', id === name);
    if (instant) instantNext = true;
    applyFree();
  }
  /** Turn the view by hand (drag, keys): azimuth and elevation in radians. */
  function nudge(dAz, dEl) {
    if (atDoor) return;
    byHand = true;
    free.az += dAz;
    free.el = clamp(free.el + dEl, LIMITS.el[0], LIMITS.el[1]);
    applyFree();
  }
  /** Zoom by a factor on the orbit distance (below 1 comes closer). */
  function zoom(factor) {
    if (atDoor) return;
    byHand = true;
    free.dist = clamp(free.dist * factor, LIMITS.dist[0], LIMITS.dist[1]);
    applyFree();
  }
  /** Back from a door to the view the visitor had before it. */
  function back({ instant = false } = {}) {
    glide = null;
    byHand = false;
    atDoor = false;
    if (saved) setFree(saved);
    saved = null;
    focus = savedFocus;
    driftAngle = 0;
    revealThreads(threadsForFocus[focus] || [], instant);
    for (const [id, el] of labels) el.classList.toggle('is-focus', id === focus);
    if (instant) instantNext = true;
    applyFree();
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
    const hits = raycaster.intersectObjects(pickProxies, false);
    return hits[0]?.object.userData.place || null;
  }

  // ---- Interaction --------------------------------------------------------
  // Mouse: drag turns the model, the wheel zooms once the model has been
  // clicked (so scrolling past it still scrolls the page), a click on a
  // building selects it. Touch: one finger scrolls the page, two fingers turn
  // and pinch. The tour stops at the first touch of any of these.
  const pointers = new Map();
  let drag = null; // { x, y, moved }
  let pinch = null; // { dist, cx, cy }
  let suppressClick = false;
  let engaged = false;
  function setEngaged(on) {
    engaged = on;
    container.toggleAttribute('data-lenis-prevent', on);
    container.classList.toggle('is-engaged', on);
  }
  function hoverAt(event) {
    const id = ready && !atDoor ? pick(event) : null;
    if (id !== hovered) {
      hovered = id;
      renderer.domElement.style.cursor = id ? 'pointer' : '';
      for (const [pid, el] of labels) el.classList.toggle('is-hover', pid === id);
      onHover?.(id);
    }
  }
  function onPointerDown(event) {
    if (atDoor) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.pointerType === 'mouse') {
      if (event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, moved: false };
      setEngaged(true);
      container.setPointerCapture?.(event.pointerId);
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      drag = null;
    }
  }
  function onPointerMove(event) {
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (atDoor) return;
    if (drag && event.pointerType === 'mouse') {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      if (!drag.moved && Math.hypot(dx, dy) < 3) return;
      if (!drag.moved) {
        drag.moved = true;
        container.classList.add('is-dragging');
        onInteract?.('drag');
      }
      nudge(-dx * 0.006, dy * 0.005);
      return;
    }
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      byHand = true;
      if (dist > 0 && pinch.dist > 0) free.dist = clamp((free.dist * pinch.dist) / dist, LIMITS.dist[0], LIMITS.dist[1]);
      free.az -= (cx - pinch.cx) * 0.008;
      free.el = clamp(free.el + (cy - pinch.cy) * 0.006, LIMITS.el[0], LIMITS.el[1]);
      pinch = { dist, cx, cy };
      onInteract?.('pinch');
      applyFree();
      return;
    }
    if (event.pointerType === 'mouse') hoverAt(event);
  }
  function onPointerUp(event) {
    pointers.delete(event.pointerId);
    if (drag?.moved) suppressClick = true;
    drag = null;
    if (pointers.size < 2) pinch = null;
    container.classList.remove('is-dragging');
  }
  function onPointerLeave() {
    setEngaged(false);
    if (hovered) {
      hovered = null;
      renderer.domElement.style.cursor = '';
      for (const el of labels.values()) el.classList.remove('is-hover');
      onHover?.(null);
    }
  }
  function onWheel(event) {
    if (!engaged || atDoor) return; // let the page scroll
    event.preventDefault();
    zoom(Math.exp(clamp(event.deltaY, -120, 120) * 0.0016));
    onInteract?.('wheel');
  }
  function onClick(event) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (atDoor) return;
    const id = pick(event);
    if (id) onSelect?.(id);
  }
  renderer.domElement.style.touchAction = 'pan-y';
  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('pointerup', onPointerUp);
  container.addEventListener('pointercancel', onPointerUp);
  container.addEventListener('pointerleave', onPointerLeave);
  container.addEventListener('wheel', onWheel, { passive: false });
  renderer.domElement.addEventListener('click', onClick);

  const tmp = new THREE.Vector3();
  const right = new THREE.Vector3();
  let frames = 0;
  function frame(now) {
    raf = 0;
    frames++;
    const rawDt = Math.max(0, (now - last) / 1000) || 0.016;
    const dt = Math.min(0.05, rawDt);
    last = now;
    if (!visible) return;
    const moving = motion();

    // A slow orbit while the tour plays, so each stop keeps breathing
    if (drift && moving) {
      driftAngle += dt * 0.035;
      want.pos.copy(orbitPosition({ ...free, az: free.az + driftAngle }));
    }
    // Camera eases toward the wanted view: cinematically for the tour and
    // the doors, and close on the hand's heels when the visitor turns it
    const k = instantNext ? 1 : byHand ? 1 - Math.exp(-Math.min(0.25, rawDt) * 14) : 1 - Math.exp(-dt * 2.6);
    instantNext = false;
    cur.shift += (want.shift - cur.shift) * k;
    if (glide) {
      const t = Math.min(1, (now - glide.start) / glide.length);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease in and out
      cur.pos.copy(glide.from).lerp(want.pos, e);
      cur.target.copy(glide.fromTarget).lerp(want.target, e);
      if (t >= 1) glide = null;
    } else {
      cur.target.lerp(want.target, k);
      cur.pos.lerp(want.pos, k);
    }

    camera.position.copy(cur.pos);
    const lookAt = cur.target.clone();
    // Shift the subject sideways in screen space so a card can sit beside it
    camera.lookAt(lookAt);
    right.setFromMatrixColumn(camera.matrix, 0);
    const span = cur.pos.distanceTo(cur.target) * 0.34;
    lookAt.addScaledVector(right, cur.shift * span * (container.clientWidth > 760 ? 1 : 0));
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

    const arrived = cur.pos.distanceToSquared(want.pos) < 1e-4 && !glide;
    const settled = arrived && cur.target.distanceToSquared(want.target) < 1e-4;
    if (arrived && settledResolvers.length) {
      const done = settledResolvers;
      settledResolvers = [];
      done.forEach((r) => r());
    }
    dirty = animating || !settled || (drift && moving);
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
    setFocus,
    approach,
    back,
    setBackdrop,
    nudge,
    zoom,
    setEngaged,
    snapshot,
    /** Show or hide every thread (used by the crop renderer). */
    setThreadsVisible(on) {
      for (const th of Object.values(threads)) {
        th.target = on ? th.target : 0;
        th.shown = on ? th.shown : 0;
      }
      threadsHidden = !on;
      dirty = true;
      tick();
    },
    setDrift(on) {
      drift = on;
      if (!on) {
        driftAngle = 0;
        applyFree();
      }
      dirty = true;
      tick();
    },
    /** The free view: azimuth, elevation, distance and target. */
    get view() {
      return { az: free.az, el: free.el, dist: free.dist, target: [...free.target], engaged };
    },
    setVisible,
    resize,
    get focus() {
      return focus;
    },
    get ready() {
      return ready;
    },
    canvas: renderer.domElement,
    /** For automated checks: how far the camera is from where it wants to be. */
    get travel() {
      return { dist: Math.sqrt(cur.pos.distanceToSquared(want.pos)), pending: settledResolvers.length, visible, raf: !!raf, dirty, frames, focus };
    },
    dispose() {
      clearInterval(ticker);
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      pmrem.dispose();
    },
  };
}
