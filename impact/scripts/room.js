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
 * @param {(place: string, info: {guided: boolean, byUser: boolean}) => void} opts.onLeft  called once the visitor is back on the model
 * @param {(id: string) => void} opts.openStory
 * @param {() => boolean} [opts.muted]  when true the narrator stays silent (the tour's mute)
 * @param {(speaking: boolean) => void} [opts.onVoice]  the narrator started or stopped (to duck music)
 * @param {(action: 'pause'|'resume'|'skip') => void} [opts.onControl]  the tour controls in the room's bar
 */
export function createRoom(overlay, { motion = () => true, webgl = true, approach, onLeft, openStory, muted = () => false, onVoice, onControl }) {
  const stage = overlay.querySelector('.room-stage');
  const film = overlay.querySelector('.room-film');
  const panoHost = overlay.querySelector('.room-pano');
  const poster = overlay.querySelector('.room-poster');
  const captions = overlay.querySelector('.room-captions');
  const titleEl = overlay.querySelector('.room-title');
  const leaveBtn = overlay.querySelector('[data-room-leave]');
  const nextBtn = overlay.querySelector('[data-room-next]');
  const hint = overlay.querySelector('.room-hint');
  const voiceEl = overlay.querySelector('.room-voice');
  const voiceBtn = overlay.querySelector('[data-room-voice]');
  const pauseBtn = overlay.querySelector('[data-room-pause]');
  const warmer = document.createElement('video'); // fetches the next dive film ahead of the tour
  warmer.muted = true;
  warmer.preload = 'auto';

  let current = null; // room
  let phase = 'closed'; // closed | approaching | diving | inside | leaving
  let lineIndex = -1;
  let lineTimer = 0;
  let returnFocus = null;
  let pano = null; // { renderer, scene, camera, mesh, texture }
  let raf = 0;
  let look = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, dragging: false, lx: 0, ly: 0 };
  let voiceOn = true; // the narrator reads each caption; a control in the room turns it off
  let guided = false; // on the tour: the room runs itself and leaves when the story is told
  let paused = false; // the tour is paused inside the room
  let leavingByUser = false;
  const END_CARD_MS = 2600; // how long the tour rests on the end card before leaving
  let resumeWaiters = [];
  const waitIfPaused = () => (paused ? new Promise((r) => resumeWaiters.push(r)) : Promise.resolve());

  // ---- narration ----------------------------------------------------------
  function setVoice(on) {
    voiceOn = on;
    voiceBtn.setAttribute('aria-pressed', String(on));
    voiceBtn.textContent = on ? 'Voice on' : 'Voice off';
    if (!on) {
      stopVoice();
      if (phase === 'inside') scheduleNext(false);
    } else if (phase === 'inside' && current && lineIndex >= 0 && lineIndex < current.lines.length) {
      scheduleNext(speak(lineIndex));
    }
  }
  function stopVoice() {
    voiceEl.onended = null;
    voiceEl.onerror = null;
    voiceEl.pause();
    voiceEl.removeAttribute('src');
    onVoice?.(false);
  }
  /** Read caption `i` aloud; false when there is nothing to play. */
  function speak(i) {
    if (!voiceOn || muted() || !current?.voice) return false;
    voiceEl.onended = null;
    voiceEl.onerror = null;
    voiceEl.src = `${current.voice}-${i + 1}.mp3`;
    voiceEl.currentTime = 0;
    voiceEl.play().catch(() => {});
    onVoice?.(true);
    return true;
  }

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
      scheduleNext(speak(lineIndex));
      return;
    } else {
      stopVoice();
      const story = getStory(room.story);
      const el = document.createElement('div');
      el.className = 'room-line room-line--end';
      el.innerHTML = `<p class="room-line-text">${esc(story.title)}</p><p class="room-line-source">${esc(story.organisation)}, ${esc(story.location)}</p><div class="actions"><button type="button" class="btn btn--primary btn--small" data-room-story="${esc(story.id)}">Open the full story</button><button type="button" class="btn btn--ghost btn--small" data-room-leave>Leave</button></div>`;
      captions.appendChild(el);
      nextBtn.textContent = 'Leave';
    }
    scheduleNext(false);
  }
  /** Move on when the narrator has finished (plus a breath), or after 7 s when silent.
   *  On the tour the end card rests a moment, then the room leaves by itself. */
  function scheduleNext(speaking) {
    clearTimeout(lineTimer);
    if (!current || paused) return;
    const atEnd = lineIndex >= current.lines.length;
    if (atEnd) {
      if (guided) lineTimer = setTimeout(() => leave(), END_CARD_MS);
      return;
    }
    if (!motion() && !guided) return;
    const advance = (ms) => {
      clearTimeout(lineTimer);
      lineTimer = setTimeout(() => showLine(lineIndex + 1), ms);
    };
    if (speaking) {
      voiceEl.onended = () => {
        onVoice?.(false);
        advance(1500);
      };
      voiceEl.onerror = () => {
        onVoice?.(false);
        advance(7000);
      };
      advance(25000); // never stall on a clip that fails to end
    } else advance(7000);
  }
  /** Hold the tour where it is: captions stop advancing, the voice and any film wait. */
  function pause() {
    if (paused) return;
    paused = true;
    overlay.classList.add('is-paused');
    pauseBtn.textContent = 'Resume';
    pauseBtn.setAttribute('aria-pressed', 'true');
    clearTimeout(lineTimer);
    voiceEl.pause();
    if (phase === 'diving' || phase === 'leaving') film.pause();
  }
  function resume() {
    if (!paused) return;
    paused = false;
    overlay.classList.remove('is-paused');
    pauseBtn.textContent = 'Pause';
    pauseBtn.setAttribute('aria-pressed', 'false');
    const waiters = resumeWaiters;
    resumeWaiters = [];
    waiters.forEach((r) => r());
    if (phase === 'diving' || phase === 'leaving') {
      film.play().catch(() => {});
      return;
    }
    if (phase !== 'inside') return;
    if (voiceOn && !muted() && voiceEl.getAttribute('src') && voiceEl.paused && !voiceEl.ended) {
      voiceEl.play().catch(() => {});
      onVoice?.(true);
      scheduleNext(true);
    } else scheduleNext(false);
  }
  /** The sound control went off: stop the current line and carry on silently. */
  function silence() {
    if (phase === 'inside' && voiceEl.getAttribute('src')) {
      stopVoice();
      scheduleNext(false);
    }
  }
  /** Fetch a place's dive film now so the tour does not stall at its door. */
  function warm(place) {
    const room = roomFor(place);
    if (!room || !motion()) return;
    const webm = film.canPlayType('video/webm') !== '';
    warmer.src = `${room.dive}.${webm ? 'webm' : 'mp4'}`;
    warmer.load();
  }
  function next() {
    if (!current) return;
    if (lineIndex >= current.lines.length) return leave({ byUser: true });
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

  async function enter(place, { trigger = null, guided: onTour = false } = {}) {
    const room = roomFor(place);
    if (!room || phase !== 'closed') return;
    current = room;
    guided = onTour;
    paused = false;
    leavingByUser = false;
    overlay.classList.toggle('is-guided', guided);
    overlay.classList.remove('is-paused');
    pauseBtn.textContent = 'Pause';
    pauseBtn.setAttribute('aria-pressed', 'false');
    returnFocus = trigger || document.activeElement;
    titleEl.textContent = room.title;
    poster.src = room.poster;
    poster.alt = '';
    overlay.hidden = false;
    document.body.classList.add('room-open');
    setPhase('approaching');
    // Load the panorama while the camera glides to the door
    const texture = ensurePano() ? loadPanoTexture(room).catch(() => null) : Promise.resolve(null);
    await (approach ? approach(place, { guided }) : Promise.resolve());
    if (phase !== 'approaching') return;
    await waitIfPaused();
    setPhase('diving');
    await playFilm(room);
    if (phase !== 'diving') return;
    await waitIfPaused();
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
    (guided ? pauseBtn : leaveBtn).focus();
  }

  async function leave({ byUser = false } = {}) {
    if (!current || phase === 'closed' || phase === 'leaving') return;
    clearTimeout(lineTimer);
    stopVoice();
    leavingByUser = byUser;
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
    const wasGuided = guided;
    guided = false;
    paused = false;
    overlay.classList.remove('is-guided', 'is-paused');
    current = null;
    onLeft?.(room.place, { guided: wasGuided, byUser: leavingByUser });
    if (!wasGuided || leavingByUser) returnFocus?.focus?.();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target.closest('[data-room-leave]')) leave({ byUser: true });
    else if (e.target.closest('[data-room-pause]')) onControl?.(paused ? 'resume' : 'pause');
    else if (e.target.closest('[data-room-skip]')) onControl?.('skip');
    else if (e.target.closest('[data-room-voice]')) setVoice(!voiceOn);
    else if (e.target.closest('[data-room-next]')) next();
    else if (e.target.closest('[data-room-story]')) {
      const id = e.target.closest('[data-room-story]').dataset.roomStory;
      leave({ byUser: true }).then(() => openStory?.(id));
    }
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      leave({ byUser: true });
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(lineTimer);
      voiceEl.pause();
    } else if (phase === 'inside' && !paused) {
      if (voiceOn && !muted() && voiceEl.getAttribute('src') && voiceEl.paused && !voiceEl.ended) {
        voiceEl.play().catch(() => {});
        scheduleNext(true);
      } else scheduleNext(false);
    }
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
    get voice() {
      return voiceOn;
    },
    get guided() {
      return guided;
    },
    get paused() {
      return paused;
    },
    setVoice,
    pause,
    resume,
    silence,
    warm,
  };
}
