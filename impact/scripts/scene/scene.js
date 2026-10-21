// Renderer, camera choreography and interaction for the living community.
// The scene never owns application state: it is told what to focus on and
// reports what a visitor pointed at or selected.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { buildCommunity, mulberry32 } from './community.js';
import { buildThreads, threadsForFocus } from './threads.js';

/** Camera framing per focus: orbit around a target. */
const VIEWS = {
  overview: { target: [0.6, 1.2, 0.6], dist: 60, az: 0.62, el: 0.64 },
  hospital: { target: [-3.4, 1.0, -4.6], dist: 40, az: 0.36, el: 0.6 },
  research: { target: [1.4, 1.0, -5.2], dist: 34, az: 0.62, el: 0.62 },
  learning: { target: [-1.2, 1.0, -1.2], dist: 46, az: 0.44, el: 0.66 },
  homes: { target: [1.2, 1.0, 0.4], dist: 44, az: 0.5, el: 0.66 },
  aquatic: { target: [7.2, 1.0, 0.8], dist: 40, az: 0.78, el: 0.64 },
  datacenter: { target: [2.0, 0.8, -1.0], dist: 50, az: 0.55, el: 0.62 },
  shops: { target: [7.4, 0.6, -0.6], dist: 34, az: 0.7, el: 0.6 },
};

export function supportsWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

/** A soft window-light pattern projected by the key light, as in the visual study. */
function windowCookie() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 512, 512);
  g.filter = 'blur(10px)';
  g.fillStyle = 'rgba(40,30,20,0.55)';
  // Mullions and a transom, slightly skewed like light through a tall window
  for (let i = 1; i < 4; i++) g.fillRect(i * 128 - 7, 0, 14, 512);
  g.fillRect(0, 300, 512, 14);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createScene(container, { labels = new Map(), onSelect, onHover, reducedMotion = false, onFail } = {}) {
  const constrained = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !constrained, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, constrained ? 1 : 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // The model is static, so its shadows render once; moving details cast none.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  // On slow frames, finish transitions on time rather than stretching them.
  gsap.ticker.lagSmoothing(0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'scene-canvas';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.3;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 200);

  // Light: warm low sun through a window, soft sky fill, gentle bounce.
  // Golden hour: a low warm sun, a cool dusk sky and lit windows.
  const hemi = new THREE.HemisphereLight(0xbfc8d6, 0x3b2c20, 0.5);
  scene.add(hemi);
  const sun = new THREE.SpotLight(0xffbf7a, 5600, 150, Math.PI / 6.5, 0.8, 2);
  sun.position.set(-34, 22, 16);
  sun.target.position.set(1, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(constrained ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  sun.map = windowCookie();
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0x9fb4d8, 0.35);
  fill.position.set(18, 12, -10);
  scene.add(fill);

  // Soft contact shadow under the model on the warm-white page.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.45 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.1;
  ground.receiveShadow = true;
  scene.add(ground);

  const { root, places } = buildCommunity();
  scene.add(root);
  const thread = buildThreads(places);
  scene.add(thread.group);

  // Residents walking the streets: tiny figures that make the model feel lived in.
  const walkers = [];
  {
    const rng = mulberry32(21);
    const geo = new THREE.CapsuleGeometry(0.07, 0.16, 3, 6);
    const tones = [0x6f6a64, 0x9b7b5b, 0x4f5a63, 0xb8a58c, 0x7a6151];
    const routes = [
      { from: new THREE.Vector3(-12, 0.16, 0.45), to: new THREE.Vector3(12, 0.16, 0.45) },
      { from: new THREE.Vector3(12, 0.16, 0.85), to: new THREE.Vector3(-12, 0.16, 0.85) },
      { from: new THREE.Vector3(-3.5, 0.16, -8), to: new THREE.Vector3(-3.5, 0.16, 0) },
      { from: new THREE.Vector3(6.4, 0.16, 8.2), to: new THREE.Vector3(6.4, 0.16, 1) },
    ];
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: tones[i % tones.length], roughness: 0.9 }));
      const route = routes[i % routes.length];
      walkers.push({ mesh: m, route, t: rng(), speed: 0.012 + rng() * 0.012 });
      m.position.lerpVectors(route.from, route.to, walkers[i].t);
      scene.add(m);
    }
  }

  // ---- Camera rig -------------------------------------------------------
  const rig = { tx: 0, ty: 0, tz: 0, dist: 40, az: 0.6, el: 0.7, shift: 0 };
  const setRig = (name) => {
    const v = VIEWS[name] || VIEWS.overview;
    return { tx: v.target[0], ty: v.target[1], tz: v.target[2], dist: v.dist, az: v.az, el: v.el };
  };
  Object.assign(rig, setRig('overview'), { dist: 80, el: 0.86, az: 0.42 });

  let width = 1;
  let height = 1;
  let idle = 0;
  const target = new THREE.Vector3();

  function updateCamera() {
    const aspectBoost = width / height < 1 ? Math.pow(height / width, 0.75) : 1;
    const d = rig.dist * aspectBoost;
    const az = rig.az + Math.sin(idle) * 0.025;
    target.set(rig.tx, rig.ty, rig.tz);
    camera.position.set(
      target.x + d * Math.sin(az) * Math.cos(rig.el),
      target.y + d * Math.sin(rig.el),
      target.z + d * Math.cos(az) * Math.cos(rig.el),
    );
    camera.lookAt(target);
    // Shift the subject right when narrative text occupies the left.
    const shiftPx = Math.round(rig.shift * width);
    camera.aspect = (width + 2 * shiftPx) / height;
    if (shiftPx) camera.setViewOffset(width + 2 * shiftPx, height, 0, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  function resize() {
    const r = container.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    renderer.setSize(width, height, false);
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // ---- Labels -------------------------------------------------------------
  const projected = new THREE.Vector3();
  function placeLabels() {
    for (const [id, el] of labels) {
      const p = places[id];
      if (!p) continue;
      projected.copy(p.anchor).project(camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      const inside = projected.z < 1 && x > 8 && x < width - 8 && y > 8 && y < height - 8;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.classList.toggle('is-offscreen', !inside);
    }
  }

  // ---- Focus and threads -----------------------------------------------
  let focus = 'overview';
  let active = new Set();
  let motion = !reducedMotion;
  let reduce = reducedMotion;

  function revealThreads(ids, { instant }) {
    const next = new Set(ids);
    for (const t of Object.values(thread.threads)) {
      const on = next.has(t.id);
      const faint = focus === 'overview' && on;
      // Overview shows every connection quietly; a focus shows its own clearly.
      const to = { progress: on ? 1 : t.state.progress, opacity: on ? (faint ? 0.8 : 1) : 0, pulse: on && motion ? 1 : 0 };
      gsap.killTweensOf(t.state);
      if (instant) {
        Object.assign(t.state, to, on ? {} : { progress: 0 });
      } else if (on && !active.has(t.id)) {
        t.state.progress = 0;
        gsap.to(t.state, { ...to, duration: 1.4, ease: 'power2.inOut', delay: 0.25, onUpdate: markDirty });
      } else {
        gsap.to(t.state, { ...to, duration: 0.5, ease: 'power1.out', onUpdate: markDirty, onComplete: () => { if (!on) t.state.progress = 0; } });
      }
    }
    active = next;
    thread.apply();
  }

  function setFocus(name, { instant = false } = {}) {
    if (!VIEWS[name]) name = 'overview';
    focus = name;
    const to = setRig(name);
    gsap.killTweensOf(rig, 'tx,ty,tz,dist,az,el');
    if (instant || reduce) Object.assign(rig, to);
    else gsap.to(rig, { ...to, duration: 1.6, ease: 'power3.inOut', onUpdate: markDirty });
    revealThreads(threadsForFocus[name] || [], { instant: instant || reduce });
    highlight(name === 'overview' ? null : name);
    markDirty();
  }

  function setShift(value, { instant = false } = {}) {
    gsap.killTweensOf(rig, 'shift');
    if (instant || reduce) rig.shift = value;
    else gsap.to(rig, { shift: value, duration: 0.9, ease: 'power2.inOut', onUpdate: markDirty });
    markDirty();
  }

  // ---- Hover and selection ---------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;

  /** The focused place lights up: its windows glow brighter than the rest. */
  function highlight(id, strength = 1.6) {
    for (const [pid, p] of Object.entries(places)) {
      const level = !id ? 0.55 : pid === id ? strength : 0.3;
      p.group.traverse((o) => {
        if (!o.isMesh) return;
        for (const m of [].concat(o.material)) if (m.emissiveMap) m.emissiveIntensity = level;
      });
    }
    for (const [lid, el] of labels) el.classList.toggle('is-focus', lid === id);
  }

  function pick(event) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - r.left) / r.width) * 2 - 1, -((event.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(root, true).find((h) => h.object.userData.target);
    return hit ? hit.object.userData.target : null;
  }

  function onPointerMove(event) {
    if (event.pointerType !== 'mouse') return;
    const id = pick(event);
    if (id === hovered) return;
    hovered = id;
    canvas.style.cursor = id ? 'pointer' : '';
    for (const [lid, el] of labels) el.classList.toggle('is-hover', lid === id);
    onHover?.(id);
  }
  function onClick(event) {
    const id = pick(event);
    if (id) onSelect?.(id);
  }
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('click', onClick);

  // ---- Loop ---------------------------------------------------------------
  let dirty = true;
  let raf = 0;
  let visible = true;
  let last = performance.now();
  let failed = false;
  function markDirty() {
    dirty = true;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    // rAF timestamps can precede the clock reading taken at creation.
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!visible || document.hidden || failed) return;
    if (motion) {
      // Drift only in the overview, so labels hold still when a place is in focus.
      if (focus === 'overview') idle += dt * 0.25;
      for (const w of walkers) {
        w.t = (w.t + dt * w.speed) % 1;
        w.mesh.position.lerpVectors(w.route.from, w.route.to, w.t);
        w.mesh.position.y = 0.16 + Math.abs(Math.sin(w.t * 400)) * 0.012;
      }
      thread.tick(dt);
      dirty = true;
    }
    if (!dirty) return;
    thread.apply();
    updateCamera();
    renderer.render(scene, camera);
    placeLabels();
    dirty = false;
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) dirty = true;
  });
  io.observe(container);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    failed = true;
    onFail?.('context-lost');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    failed = false;
    dirty = true;
  });

  resize();
  updateCamera();
  raf = requestAnimationFrame(frame);

  /** Gentle arrival from a higher viewpoint into the resting composition. */
  function enter() {
    if (reduce) {
      setFocus('overview', { instant: true });
      return;
    }
    const to = setRig('overview');
    gsap.to(rig, { ...to, duration: 2.6, ease: 'power3.out', onUpdate: markDirty });
    focus = 'overview';
    setTimeout(() => revealThreads(threadsForFocus.overview, { instant: false }), 900);
  }

  return {
    enter,
    setFocus,
    setShift,
    get focus() {
      return focus;
    },
    setMotion(on) {
      motion = on && !reduce;
      for (const t of Object.values(thread.threads)) {
        if (active.has(t.id)) t.state.pulse = motion ? 1 : 0;
      }
      thread.apply();
      dirty = true;
    },
    setReducedMotion(on) {
      reduce = on;
      if (on) this.setMotion(false);
    },
    hoverLabel(id) {
      highlight(id || (focus === 'overview' ? null : focus), id ? 1.2 : 1.6);
      dirty = true;
    },
    render() {
      dirty = true;
    },
    /** Inspection hook for automated checks. */
    debug() {
      return { focus, active: [...active], threads: Object.fromEntries(Object.values(thread.threads).map((t) => [t.id, { progress: t.state.progress, opacity: t.state.opacity, pulse: t.state.pulse, visible: t.mesh.visible }])) };
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('click', onClick);
      gsap.killTweensOf(rig);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        for (const m of [].concat(o.material || [])) {
          m.map?.dispose();
          m.dispose();
        }
      });
      envTex.dispose();
      pmrem.dispose();
      sun.map?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
