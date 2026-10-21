// The red thread: conceptual connections between places in the model.
// Paths are illustrations of relationships, not network routes or physical
// heat pipes at any real location.
import * as THREE from 'three';
import { palette } from './community.js';

const lift = (a, b, h) => {
  const mid = a.clone().lerp(b, 0.5);
  mid.y = Math.max(a.y, b.y) + h;
  return mid;
};

/** Thread definitions: from/to place ids or raw points, and kind. */
export function threadDefinitions(places) {
  const at = (id, dy = 0) => places[id].anchor.clone().add(new THREE.Vector3(0, dy - 1.2, 0));
  const dc = at('datacenter', 0.2);
  const edge = new THREE.Vector3(-3.2, 0.3, -9.4);
  return [
    { id: 'hospital', kind: 'data', points: [dc, lift(dc, at('hospital'), 1.6), at('hospital')] },
    { id: 'research', kind: 'data', points: [dc, lift(dc, at('research'), 1.0), at('research')] },
    { id: 'research-out', kind: 'data', points: [at('research'), lift(at('research'), edge, 0.8), edge, edge.clone().add(new THREE.Vector3(-1.5, -0.2, -1.6))] },
    { id: 'learning', kind: 'data', points: [dc, lift(dc, at('learning'), 2.2), at('learning')] },
    { id: 'homes', kind: 'data', points: [dc, lift(dc, at('homes'), 1.5), at('homes')] },
    { id: 'homes-learning', kind: 'data', points: [at('homes'), lift(at('homes'), at('learning'), 0.8), at('learning')] },
    { id: 'shops', kind: 'data', points: [dc, lift(dc, at('shops'), 1.2), at('shops')] },
    { id: 'heat', kind: 'heat', points: [at('datacenter', -0.9), lift(at('datacenter', -0.9), at('aquatic', -0.6), 0.5), at('aquatic', -0.6)] },
  ];
}

/** Which threads each focus reveals. */
export const threadsForFocus = {
  overview: ['hospital', 'research', 'learning', 'homes', 'shops'],
  hospital: ['hospital'],
  research: ['research', 'research-out'],
  learning: ['learning'],
  homes: ['homes', 'homes-learning', 'shops'],
  aquatic: ['heat'],
  datacenter: ['hospital', 'research', 'learning', 'homes', 'shops', 'heat'],
  shops: ['shops'],
};

export function buildThreads(places) {
  const group = new THREE.Group();
  const threads = {};
  const bead = new THREE.SphereGeometry(0.16, 16, 10);

  for (const def of threadDefinitions(places)) {
    const curve = new THREE.CatmullRomCurve3(def.points, false, 'centripetal');
    const color = def.kind === 'heat' ? palette.amber : palette.red;
    const geo = new THREE.TubeGeometry(curve, 160, def.kind === 'heat' ? 0.12 : 0.09, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      roughness: 0.5,
      transparent: true,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(geo, material);
    mesh.renderOrder = 2;
    const total = geo.index.count;
    geo.setDrawRange(0, 0);

    const pulse = new THREE.Mesh(bead, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }));
    group.add(mesh, pulse);
    threads[def.id] = {
      id: def.id,
      kind: def.kind,
      curve,
      mesh,
      pulse,
      total,
      // Animated values: progress of the drawn path, its opacity, pulse visibility
      state: { progress: 0, opacity: 0, pulse: 0 },
      phase: Math.random(),
    };
  }

  function apply() {
    for (const t of Object.values(threads)) {
      const { progress, opacity, pulse } = t.state;
      // Whole segments only, so the draw range stays a multiple of a triangle.
      const count = Math.floor((t.total * progress) / 3) * 3;
      t.mesh.geometry.setDrawRange(0, count);
      t.mesh.material.opacity = opacity;
      t.mesh.visible = opacity > 0.001 && count > 0;
      t.pulse.material.opacity = pulse * opacity;
      t.pulse.visible = t.pulse.material.opacity > 0.01;
    }
  }

  function tick(dt) {
    for (const t of Object.values(threads)) {
      if (!t.pulse.visible) continue;
      t.phase = (t.phase + dt * (t.kind === 'heat' ? 0.18 : 0.28)) % 1;
      const along = Math.min(Math.max(t.phase, 0), Math.min(t.state.progress, 1));
      t.pulse.position.copy(t.curve.getPointAt(along));
    }
  }

  return { group, threads, apply, tick };
}
