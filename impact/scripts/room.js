// Stepping inside a building: the dive film plays from the model's door
// view into the room, the room becomes a panorama you can look around in,
// the story arrives as captions, and "Leave" plays you back out. One
// overlay, one small Three.js sphere, no page state beyond open or closed.
import * as THREE from 'three';
import { roomFor, lineSource, getStory } from './content/rooms.js';

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * @param {HTMLElement} overlay   the .room element
 * @param {object} opts
 * @param {() => boolean} opts.motion
 * @param {boolean} opts.webgl    whether a panorama can be rendered
 * @param {(place: string) => Promise<void>} opts.approach  glide the model to the door; resolves when there
 * @param {(place: string) => void} opts.onLeft  called once the visitor is back on the model
 * @param {(id: string) => void} opts.openStory
 */
export function createRoom(overlay, { motion = () => true, webgl = true, approach, onLeft, openStory }) {
  const stage = overlay.querySelector('.room-stage');
  const film = overlay.querySelector('.room-film');
  const panoHost = overlay.querySelector('.room-pano');
  const poster = overlay.querySelector('.room-poster');
  const captions = overlay.querySelector('.room-captions');
  const titleEl = overlay.querySelector('.room-title');
  const leaveBtn = overlay.querySelector('[data-room-leave]');
  const nextBtn = overlay.querySelector('[data-room-next]');
  const hint = overlay.querySelector('.room-hint');

  let current = null; // room
  let phase = 'closed'; // closed | approaching | diving | inside | leaving
  let lineIndex = -1;
  let lineTimer = 0;
  let returnFocus = null;
  let pano = null; // { renderer, scene, camera, mesh, texture }
  let raf = 0;
  let look = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, dragging: false, lx: 0, ly: 0 };

  // ---- panorama -----------------------------------------------------------
  function ensurePano() {
    if (pano || !webgl) return pano;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    panoHost.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
    const geometry = new THREE.SphereGeometry(50, 64, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    // Turn the sphere so the centre of the panorama (the film's last frame) faces the camera at yaw 0
    mesh.rotation.y = -Math.PI / 2;
    scene.add(mesh);
    pano = { renderer, scene, camera, mesh, material, texture: null };
    return pano;
  }
  function resizePano() {
    if (!pano) return;
    const w = stage.clientWidth || 1;
    const h = stage.clientHeight || 1;
    pano.renderer.setSize(w, h, false);
    pano.renderer.domElement.style.width = `${w}px`;
    pano.renderer.domElement.style.height = `${h}px`;
    pano.camera.aspect = w / h;
    pano.camera.fov = w < 700 ? 80 : 70;
    pano.camera.updateProjectionMatrix();
  }
  new ResizeObserver(resizePano).observe(stage);

  function loadPanoTexture(room) {
    return new Promise((resolve, reject) => {
      const wide = (stage.clientWidth || 1200) * (window.devicePixelRatio || 1) > 1600;
      const url = `${room.pano}-${wide ? 4096 : 2048}.webp`;
      new THREE.TextureLoader().load(
        url,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.minFilter = THREE.LinearFilter;
          t.generateMipmaps = false;
          resolve(t);
        },
        undefined,
        reject,
      );
    });
  }

  function renderPano() {
    raf = 0;
    if (!pano || phase !== 'inside') return;
    const k = motion() ? 0.08 : 1;
    look.yaw += (look.tyaw - look.yaw) * k;
    look.pitch += (look.tpitch - look.pitch) * k;
    // A slow drift while nobody is dragging, so the room breathes
    if (motion() && !look.dragging) look.tyaw += 0.00035;
    const phi = THREE.MathUtils.degToRad(90 - look.pitch);
    const theta = THREE.MathUtils.degToRad(look.yaw);
    pano.camera.lookAt(500 * Math.sin(phi) * Math.sin(theta), 500 * Math.cos(phi), -500 * Math.sin(phi) * Math.cos(theta));
    pano.renderer.render(pano.scene, pano.camera);
    raf = requestAnimationFrame(renderPano);
  }

  function onDown(e) {
    if (phase !== 'inside') return;
    look.dragging = true;
    look.lx = e.clientX;
    look.ly = e.clientY;
    stage.setPointerCapture?.(e.pointerId);
    stage.classList.add('is-dragging');
  }
  function onMove(e) {
    if (!look.dragging) return;
    const dx = e.clientX - look.lx;
    const dy = e.clientY - look.ly;
    look.lx = e.clientX;
    look.ly = e.clientY;
    look.tyaw -= dx * 0.12;
    look.tpitch = Math.max(-60, Math.min(60, look.tpitch + dy * 0.12));
  }
  function onUp() {
    look.dragging = false;
    stage.classList.remove('is-dragging');
  }
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  stage.addEventListener('keydown', (e) => {
    if (phase !== 'inside') return;
    if (e.key === 'ArrowLeft') look.tyaw -= 12;
    else if (e.key === 'ArrowRight') look.tyaw += 12;
    else if (e.key === 'ArrowUp') look.tpitch = Math.min(60, look.tpitch + 8);
    else if (e.key === 'ArrowDown') look.tpitch = Math.max(-60, look.tpitch - 8);
    else return;
    e.preventDefault();
  });

  // ---- captions ----------------------------------------------------------
  function showLine(i) {
    const room = current;
    if (!room) return;
    lineIndex = Math.max(0, Math.min(room.lines.length, i));
    captions.replaceChildren();
    if (lineIndex < room.lines.length) {
      const line = room.lines[lineIndex];
      const src = lineSource(line);
      const el = document.createElement('div');
      el.className = `room-line room-line--${line.kind}${room.heat && line.kind === 'connection' ? ' room-line--heat' : ''}`;
      el.innerHTML = `<p class="room-line-text">${esc(line.text)}</p>${
        src ? `<p class="room-line-source">${esc(line.scope || '')} <a href="${esc(src.url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(src.title)} (opens in a new tab)</span></a></p>` : ''
      }`;
      captions.appendChild(el);
      nextBtn.textContent = lineIndex === room.lines.length - 1 ? 'The full story' : 'Next';
    } else {
      const story = getStory(room.story);
      const el = document.createElement('div');
      el.className = 'room-line room-line--end';
      el.innerHTML = `<p class="room-line-text">${esc(story.title)}</p><p class="room-line-source">${esc(story.organisation)}, ${esc(story.location)}</p><div class="actions"><button type="button" class="btn btn--primary btn--small" data-room-story="${esc(story.id)}">Open the full story</button><button type="button" class="btn btn--ghost btn--small" data-room-leave>Leave</button></div>`;
      captions.appendChild(el);
      nextBtn.textContent = 'Leave';
    }
    scheduleNext();
  }
  function scheduleNext() {
    clearTimeout(lineTimer);
    if (!motion() || !current || lineIndex >= current.lines.length) return;
    lineTimer = setTimeout(() => showLine(lineIndex + 1), 7000);
  }
  function next() {
    if (!current) return;
    if (lineIndex >= current.lines.length) return leave();
    showLine(lineIndex + 1);
  }

  // ---- the journey in and out ---------------------------------------------
  function setPhase(p) {
    phase = p;
    overlay.dataset.phase = p;
  }

  async function playFilm(room, { reverse = false } = {}) {
    if (!motion()) return;
    const name = reverse ? `${room.dive}-out` : room.dive;
    film.innerHTML = `<source src="${name}.webm" type="video/webm"><source src="${name}.mp4" type="video/mp4">`;
    film.load();
    await new Promise((resolve) => {
      const done = () => {
        film.removeEventListener('ended', done);
        film.removeEventListener('error', done);
        resolve();
      };
      film.addEventListener('ended', done);
      film.addEventListener('error', done, { once: true });
      film.play().catch(done);
      // Never hang on a stalled film
      setTimeout(done, 12000);
    });
  }

  async function enter(place, { trigger = null } = {}) {
    const room = roomFor(place);
    if (!room || phase !== 'closed') return;
    current = room;
    returnFocus = trigger || document.activeElement;
    titleEl.textContent = room.title;
    poster.src = room.poster;
    poster.alt = '';
    overlay.hidden = false;
    document.body.classList.add('room-open');
    setPhase('approaching');
    // Load the panorama while the camera glides to the door
    const texture = ensurePano() ? loadPanoTexture(room).catch(() => null) : Promise.resolve(null);
    await (approach ? approach(place) : Promise.resolve());
    if (phase !== 'approaching') return;
    setPhase('diving');
    await playFilm(room);
    if (phase !== 'diving') return;
    const t = await texture;
    if (pano && t) {
      pano.texture?.dispose();
      pano.texture = t;
      pano.material.map = t;
      pano.material.needsUpdate = true;
      look = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, dragging: false, lx: 0, ly: 0 };
      resizePano();
      overlay.classList.add('has-pano');
    } else {
      overlay.classList.remove('has-pano');
    }
    setPhase('inside');
    hint.hidden = !(pano && t);
    if (pano && t && !raf) raf = requestAnimationFrame(renderPano);
    showLine(0);
    leaveBtn.focus();
  }

  async function leave() {
    if (!current || phase === 'closed' || phase === 'leaving') return;
    clearTimeout(lineTimer);
    const room = current;
    const wasInside = phase === 'inside';
    setPhase('leaving');
    cancelAnimationFrame(raf);
    raf = 0;
    if (wasInside) await playFilm(room, { reverse: true });
    overlay.hidden = true;
    document.body.classList.remove('room-open');
    film.pause();
    film.removeAttribute('src');
    film.innerHTML = '';
    captions.replaceChildren();
    setPhase('closed');
    current = null;
    onLeft?.(room.place);
    returnFocus?.focus?.();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target.closest('[data-room-leave]')) leave();
    else if (e.target.closest('[data-room-next]')) next();
    else if (e.target.closest('[data-room-story]')) {
      const id = e.target.closest('[data-room-story]').dataset.roomStory;
      leave().then(() => openStory?.(id));
    }
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      leave();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(lineTimer);
    else scheduleNext();
  });

  return {
    enter,
    leave,
    next,
    get phase() {
      return phase;
    },
    get place() {
      return current?.place || null;
    },
    get line() {
      return lineIndex;
    },
  };
}
