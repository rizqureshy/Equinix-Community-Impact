// Procedural construction of the illustrative community.
// Pure geometry and materials: no renderer, camera or DOM here, so the
// composition can be tuned without touching interaction code.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const palette = {
  plaster: 0xf1e8da,
  stone: 0xdccbb0,
  sand: 0xdcccb2,
  oak: 0xc69c6d,
  oakDark: 0x9e7550,
  slate: 0x77736d,
  roofLight: 0x8f8b84,
  sage: 0xa3ad87,
  sageDark: 0x7d8b67,
  path: 0xece3d4,
  water: 0x8fc1c9,
  glass: 0x48443f,
  red: 0xe31c25,
  amber: 0xd9902f,
};

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, ...extra });

/** A facade texture of soft window openings, tinted by the material colour. */
function facadeTexture({ cols = 4, rows = 2, tall = false } = {}, glow = false) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  // The colour map darkens window openings; the glow map lights them warmly
  // for the evening scene. Not every window is lit, as in a real street.
  g.fillStyle = glow ? '#000000' : '#ffffff';
  g.fillRect(0, 0, 256, 256);
  const cw = 256 / cols;
  const rh = 256 / rows;
  let n = 0;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const w = cw * (tall ? 0.3 : 0.36);
      const h = rh * (tall ? 0.6 : 0.42);
      n++;
      if (glow) g.fillStyle = (n * 7) % 5 === 0 ? '#2a1a0a' : '#ffc98a';
      else g.fillStyle = 'rgba(70, 58, 46, 0.6)';
      g.fillRect(x * cw + (cw - w) / 2, y * rh + (rh - h) / 2, w, h);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const textures = {};
function facade(color, opts, repeat = [1, 1]) {
  const key = JSON.stringify(opts);
  textures[key] ||= [facadeTexture(opts), facadeTexture(opts, true)];
  const [map, emissiveMap] = textures[key].map((t) => {
    const c = t.clone();
    c.needsUpdate = true;
    c.repeat.set(repeat[0], repeat[1]);
    return c;
  });
  return mat(color, { map, emissiveMap, emissive: 0xffffff, emissiveIntensity: 0.55 });
}

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A box whose sides carry windows and whose top carries a roof material. */
function block(w, h, d, { wall, roof, windows = { cols: 4, rows: 2 }, radius = 0.05 }) {
  const geo = new RoundedBoxGeometry(w, h, d, 2, radius);
  const side = facade(wall, windows, [Math.max(1, Math.round(w / 2.2)), Math.max(1, Math.round(h / 1.6))]);
  const end = facade(wall, windows, [Math.max(1, Math.round(d / 2.2)), Math.max(1, Math.round(h / 1.6))]);
  const top = mat(roof);
  // RoundedBoxGeometry groups follow BoxGeometry: +x, -x, +y, -y, +z, -z
  const mesh = new THREE.Mesh(geo, [end, end, top, top, side, side]);
  mesh.position.y = h / 2;
  return shadowed(mesh);
}

/** A gabled house volume: box body and a triangular prism roof. */
function gableGeometry(w, h, d, roofH) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 - 0.06, 0);
  shape.lineTo(0, roofH);
  shape.lineTo(w / 2 + 0.06, 0);
  shape.lineTo(-w / 2 - 0.06, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d + 0.12, bevelEnabled: false });
  geo.translate(0, h, -(d + 0.12) / 2);
  return geo;
}

function house(w, h, d, wall) {
  const g = new THREE.Group();
  g.add(block(w, h, d, { wall, roof: wall, windows: { cols: 2, rows: 2 }, radius: 0.03 }));
  g.add(shadowed(new THREE.Mesh(gableGeometry(w, h, d, w * 0.42), mat(palette.slate))));
  return g;
}

function sawtoothRoof(w, d, teeth, h) {
  const g = new THREE.Group();
  const tw = w / teeth;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(tw, 0);
  shape.lineTo(tw, h);
  shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  geo.translate(-w / 2, 0, -d / 2);
  const roof = mat(palette.roofLight);
  const glass = mat(0xd9e2e2, { roughness: 0.2, metalness: 0.1 });
  for (let i = 0; i < teeth; i++) {
    const m = shadowed(new THREE.Mesh(geo, roof));
    m.position.x = i * tw;
    g.add(m);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(d * 0.92, h * 0.86), glass);
    pane.rotation.y = -Math.PI / 2;
    pane.position.set(-w / 2 + (i + 1) * tw - 0.01, h * 0.47, 0);
    g.add(pane);
  }
  return g;
}

function barrelRoof(w, d, h) {
  const geo = new THREE.CylinderGeometry(1, 1, w, 32, 1, false, 0, Math.PI);
  geo.rotateZ(Math.PI / 2);
  geo.scale(1, h, d / 2);
  const m = shadowed(new THREE.Mesh(geo, mat(palette.oak, { side: THREE.DoubleSide })));
  return m;
}

function tree(scale = 1, color = palette.sage) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.5, 6), mat(palette.oakDark));
  trunk.position.y = 0.25;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), mat(color, { flatShading: true }));
  crown.position.y = 0.78;
  crown.scale.set(1, 1.15, 1);
  g.add(shadowed(trunk), shadowed(crown));
  g.scale.setScalar(scale);
  return g;
}

function path(x, z, w, d) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, 0.04, d, 1, 0.02), mat(palette.path));
  m.position.set(x, 0.02, z);
  m.receiveShadow = true;
  return m;
}

/**
 * Destinations: a group per place, an anchor point for labels and threads.
 * Positions are composed for the elevated three-quarter view.
 */
export function buildCommunity() {
  const root = new THREE.Group();
  const places = {};

  // Plinth: oak base, warm gravel top, like the visual study.
  const plinth = new THREE.Mesh(
    new RoundedBoxGeometry(27, 1.1, 18, 3, 0.12),
    [mat(palette.oak), mat(palette.oak), mat(palette.sand), mat(palette.oak), mat(palette.oak), mat(palette.oak)],
  );
  plinth.position.y = -0.55;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  root.add(plinth);

  const lawn = (x, z, w, d, color = palette.sage) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, 0.05, d, 1, 0.025), mat(color));
    m.position.set(x, 0.025, z);
    m.receiveShadow = true;
    root.add(m);
  };
  lawn(-8.5, -1.2, 6.5, 2.2);
  lawn(3.6, 4.2, 3.2, 2.2, palette.sageDark);
  lawn(10.6, -5.8, 4, 4);
  lawn(-11.4, 6.4, 3, 3);

  // Streets
  root.add(path(0, 0.6, 26, 1.1));
  root.add(path(-3.6, -4.2, 1.0, 8.4));
  root.add(path(6.4, 4.6, 1.0, 7.8));

  const place = (id, group, x, z, anchorY, rotY = 0) => {
    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    group.traverse((o) => {
      o.userData.target = id;
    });
    root.add(group);
    places[id] = { group, anchor: new THREE.Vector3(x, anchorY, z) };
  };

  // Hospital: an L-shaped civic building with a canopy and rooftop plant.
  {
    const g = new THREE.Group();
    const main = block(5, 2.6, 2.6, { wall: palette.plaster, roof: palette.stone, windows: { cols: 5, rows: 3 } });
    const wing = block(2.2, 2.0, 3.2, { wall: palette.plaster, roof: palette.stone, windows: { cols: 3, rows: 2 } });
    wing.position.set(-1.4, 1.0, 2.6);
    const canopy = shadowed(new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.08, 0.9, 1, 0.03), mat(palette.oak)));
    canopy.position.set(0.9, 0.85, 1.75);
    const plant = block(1.1, 0.5, 0.9, { wall: palette.stone, roof: palette.roofLight, windows: { cols: 1, rows: 1 } });
    plant.position.set(1.2, 2.85, -0.3);
    g.add(main, wing, canopy, plant);
    place('hospital', g, -8.6, -5.4, 3.6);
  }

  // Research centre: oak-clad volume with a sawtooth roof.
  {
    const g = new THREE.Group();
    const body = block(5.4, 1.5, 2.8, { wall: palette.oak, roof: palette.oak, windows: { cols: 6, rows: 1, tall: true } });
    const roof = sawtoothRoof(5.4, 2.8, 5, 0.75);
    roof.position.y = 1.5;
    g.add(body, roof);
    place('research', g, -0.6, -5.8, 2.8);
  }

  // Learning space: a courtyard school in stone with pitched roofs.
  {
    const g = new THREE.Group();
    const wingA = house(4.4, 1.2, 1.3, palette.stone);
    const wingB = house(4.4, 1.2, 1.3, palette.stone);
    wingB.position.z = 2.8;
    const link = block(1.3, 1.2, 1.6, { wall: palette.stone, roof: palette.slate, windows: { cols: 1, rows: 1 } });
    link.position.set(-1.55, 0.6, 1.4);
    const yard = new THREE.Mesh(new RoundedBoxGeometry(2.8, 0.05, 1.4, 1, 0.02), mat(palette.sage));
    yard.position.set(0.6, 0.04, 1.4);
    yard.receiveShadow = true;
    g.add(wingA, wingB, link, yard);
    const t1 = tree(0.6);
    t1.position.set(0.9, 0, 1.4);
    g.add(t1);
    place('learning', g, -8.4, 3.0, 2.6);
  }

  // Homes and a neighbourhood library hub.
  {
    const g = new THREE.Group();
    const walls = [palette.stone, palette.plaster, palette.sand];
    const positions = [];
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 5; i++) positions.push([i * 1.55, row * 2.7]);
    }
    positions.forEach(([x, z], i) => {
      const h = house(1.2, 0.9 + (i % 3) * 0.12, 1.4, walls[i % walls.length]);
      h.position.set(x, 0, z);
      if ((i + 1) % 4 === 0) h.rotation.y = Math.PI / 2;
      g.add(h);
    });
    const hub = block(2.2, 1.1, 1.6, { wall: palette.plaster, roof: palette.sage, windows: { cols: 2, rows: 1, tall: true } });
    hub.position.set(3.3, 0.55, 5.2);
    g.add(hub);
    place('homes', g, -2.9, 2.6, 2.4);
  }

  // Local shops: a short terrace with oak awnings.
  {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const s = block(1.4, 1.1, 1.3, { wall: i % 2 ? palette.plaster : palette.stone, roof: palette.roofLight, windows: { cols: 1, rows: 1, tall: true } });
      s.position.x = i * 1.45;
      const awning = shadowed(new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.05, 0.4, 1, 0.02), mat(i % 2 ? palette.oak : palette.sageDark)));
      awning.position.set(i * 1.45, 0.6, 0.78);
      g.add(s, awning);
    }
    place('shops', g, 8.4, 2.2, 1.9);
  }

  // Community aquatic centre: a barrel-vaulted hall beside an outdoor pool.
  {
    const g = new THREE.Group();
    const hall = block(4.4, 0.9, 3.2, { wall: palette.plaster, roof: palette.plaster, windows: { cols: 6, rows: 1, tall: true } });
    const roof = barrelRoof(4.4, 3.2, 0.9);
    roof.position.y = 0.9;
    const pool = new THREE.Mesh(new RoundedBoxGeometry(2.4, 0.06, 1.4, 1, 0.03), mat(palette.water, { roughness: 0.15, metalness: 0.05 }));
    pool.position.set(0.2, 0.05, 2.5);
    pool.receiveShadow = true;
    const deck = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.04, 2.0, 1, 0.02), mat(palette.path));
    deck.position.set(0.2, 0.02, 2.5);
    deck.receiveShadow = true;
    g.add(hall, roof, deck, pool);
    place('aquatic', g, 9.6, 6.0, 2.5);
  }

  // Equinix data center: low, calm and well-made, with a planted roof and
  // vertical fins. Present without dominating.
  {
    const g = new THREE.Group();
    const body = block(6.4, 1.5, 3.0, { wall: 0xe9e4dc, roof: palette.sageDark, windows: { cols: 1, rows: 1 }, radius: 0.08 });
    body.material[4] = body.material[5] = mat(0xe9e4dc);
    const green = new THREE.Mesh(new RoundedBoxGeometry(6.0, 0.14, 2.6, 1, 0.05), mat(palette.sage, { flatShading: true }));
    green.position.y = 1.55;
    green.castShadow = green.receiveShadow = true;
    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 1.2, 0.16), mat(palette.oak), 34);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 34; i++) {
      m4.makeTranslation(-3.0 + i * 0.18, 0.72, 1.55);
      fins.setMatrixAt(i, m4);
    }
    fins.castShadow = true;
    const entry = block(1.4, 0.9, 0.8, { wall: palette.glass, roof: palette.stone, windows: { cols: 1, rows: 1 } });
    entry.position.set(-3.6, 0.45, 0.6);
    g.add(body, green, fins, entry);
    place('datacenter', g, 4.4, -4.6, 2.4);
  }

  // Trees, placed by hand-tuned scatter clear of buildings.
  const rng = mulberry32(7);
  const occupied = Object.values(places).map(({ group }) => new THREE.Box3().setFromObject(group).expandByScalar(0.4));
  occupied.push(new THREE.Box3(new THREE.Vector3(-13, -1, 0), new THREE.Vector3(13, 1, 1.2)));
  let placed = 0;
  for (let i = 0; i < 400 && placed < 46; i++) {
    const x = (rng() - 0.5) * 25;
    const z = (rng() - 0.5) * 16;
    const p = new THREE.Vector3(x, 0.5, z);
    if (occupied.some((b) => b.containsPoint(p))) continue;
    const t = tree(0.55 + rng() * 0.45, rng() > 0.6 ? palette.sageDark : palette.sage);
    t.position.set(x, 0, z);
    t.rotation.y = rng() * Math.PI;
    root.add(t);
    occupied.push(new THREE.Box3().setFromCenterAndSize(p, new THREE.Vector3(0.7, 2, 0.7)));
    placed++;
  }

  return { root, places, plinthTop: 0 };
}

/** Small deterministic random generator so the composition is stable. */
export function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
