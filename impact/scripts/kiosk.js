// The kiosk: the community model alone, full screen, telling its six stories
// on a loop. A hand on the model holds the loop for the visitor; when they
// have gone, it starts again from the opening view. Nothing else on the page.
import { journeySteps } from './content/render.js';
import { createRoom } from './room.js';

const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.search);
const seconds = (key, fallback, min) => Math.max(min, Number(params.get(key)) || fallback) * 1000;
const REST_MS = seconds('rest', 10, 2); // the opening view between stories and between loops
const IDLE_MS = seconds('idle', 45, 5); // hands off the model before the loop resumes
const STILL_MS = 3000; // the pointer hides when it has not moved
const SKY_PLACES = new Set(['datacenter']); // approached under the sky, as on the site
const motion = () => document.documentElement.dataset.motion !== 'off';

const steps = journeySteps();
const kiosk = $('#kiosk');
const stage = $('#stage');
const explorer = $('#explorer');
const theme = $('#theme');
const soundChip = $('[data-sound]');
const muteBtn = $('[data-mute]');
const dots = $('.kiosk-dots');
const labels = new Map([...document.querySelectorAll('.place-label')].map((el) => [el.dataset.place, el]));

let scene = null;
let mode = 'loading'; // loading | loop | explore | fallback
let paused = false;
let index = -1; // the story the loop is on; -1 is the opening view
let timer = 0;
let idleTimer = 0;
let stillTimer = 0;
let resumeAfterLeave = false;
let muted = false;
let ducked = false;
let soundBlocked = false;

// The six stories as dots along the bottom: the current one red, the told ones darker
steps.forEach((s, i) => {
  const li = document.createElement('li');
  li.className = 'kiosk-dot';
  li.setAttribute('aria-label', `${s.number} ${s.placeName}`);
  dots.append(li);
});
function setDots() {
  [...dots.children].forEach((d, i) => {
    d.classList.toggle('is-on', mode === 'loop' && i === index);
    d.classList.toggle('is-done', mode === 'loop' && i < index);
  });
}
function setMode(m) {
  mode = m;
  kiosk.dataset.mode = m;
  explorer.classList.toggle('is-playing', m === 'loop');
  setDots();
}

// ---------------------------------------------------------------------------
// Sound: the theme under everything, ducked while the narrator speaks. A
// browser may refuse to play before a touch; then a chip asks for one.
// ---------------------------------------------------------------------------
let fadeTimer = 0;
function fadeMusic(on) {
  clearInterval(fadeTimer);
  const target = on && !muted ? (ducked ? 0.16 : 0.55) : 0;
  if (target > 0) {
    if (theme.preload === 'none') theme.preload = 'auto';
    theme.play().then(() => setSoundBlocked(false)).catch(() => setSoundBlocked(true));
  }
  const from = theme.volume;
  const started = performance.now();
  fadeTimer = setInterval(() => {
    const t = Math.min(1, (performance.now() - started) / 700);
    theme.volume = from + (target - from) * t;
    if (t === 1) {
      clearInterval(fadeTimer);
      if (target === 0) theme.pause();
    }
  }, 40);
}
function setSoundBlocked(on) {
  soundBlocked = on;
  soundChip.hidden = !on || muted;
}
function duck(on) {
  ducked = on;
  if (mode === 'loop' || mode === 'explore') fadeMusic(true);
}
function setMuted(on) {
  muted = on;
  if (on) {
    ducked = false;
    room.silence();
  }
  muteBtn.setAttribute('aria-pressed', String(on));
  muteBtn.setAttribute('aria-label', on ? 'Unmute the sound' : 'Mute the sound');
  soundChip.hidden = !soundBlocked || on;
  fadeMusic(!on);
}

// ---------------------------------------------------------------------------
// The rooms, as on the site
// ---------------------------------------------------------------------------
const room = createRoom($('#room'), {
  motion,
  webgl: supportsWebGL2(),
  approach: (place) => {
    if (SKY_PLACES.has(place)) scene?.setBackdrop(true, { fade: motion() ? 2600 : 0 });
    if (scene && motion()) return scene.approach(place);
    scene?.approach(place, { instant: true });
    return Promise.resolve();
  },
  onLeft: (place, { guided, byUser } = {}) => {
    if (SKY_PLACES.has(place)) scene?.setBackdrop(false, { fade: motion() ? 2000 : 0 });
    scene?.back({ instant: !motion() });
    if (resumeAfterLeave) {
      resumeAfterLeave = false;
      startLoop();
    } else if (mode === 'loop' && guided && !byUser && !paused) {
      timer = setTimeout(nextPlace, 700);
    } else if (byUser) {
      explore();
    }
  },
  openStory: () => {},
  muted: () => muted,
  onVoice: (speaking) => duck(speaking),
  onControl: (action) => {
    if (action === 'pause') pauseLoop();
    else if (action === 'resume') resumeLoop();
    else if (action === 'skip') skip();
  },
});

// ---------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------
function startLoop() {
  clearTimeout(timer);
  clearTimeout(idleTimer);
  paused = false;
  index = -1;
  setMode('loop');
  for (const el of labels.values()) el.classList.remove('is-focus');
  scene?.setFocus('overview', { instant: !motion() });
  fadeMusic(true);
  timer = setTimeout(nextPlace, REST_MS);
}
/** Into the next place, or back to the opening view for a rest before the loop goes round again. */
function nextPlace() {
  clearTimeout(timer);
  if (mode !== 'loop' || paused) return;
  const next = index + 1;
  if (next >= steps.length) {
    index = -1;
    setDots();
    for (const el of labels.values()) el.classList.remove('is-focus');
    scene?.setFocus('overview', { instant: !motion() });
    timer = setTimeout(nextPlace, REST_MS);
    return;
  }
  index = next;
  setDots();
  const s = steps[next];
  for (const [place, el] of labels) el.classList.toggle('is-focus', place === s.place);
  room.enter(s.place, { guided: true });
  if (steps[next + 1]) room.warm(steps[next + 1].place);
}
function pauseLoop() {
  if (mode !== 'loop' || paused) return;
  paused = true;
  clearTimeout(timer);
  room.pause();
  armIdle();
}
function resumeLoop() {
  if (mode !== 'loop' || !paused) return;
  paused = false;
  clearTimeout(idleTimer);
  if (room.phase === 'closed') nextPlace();
  else room.resume();
}
function skip() {
  if (mode !== 'loop') return;
  clearTimeout(timer);
  paused = false;
  if (room.phase === 'closed') nextPlace();
  else room.leave();
}
/** A hand on the model: the loop waits until the visitor has gone. */
function explore() {
  clearTimeout(timer);
  if (mode !== 'explore') {
    paused = false;
    setMode('explore');
    for (const el of labels.values()) el.classList.remove('is-focus');
  }
  armIdle();
}
function armIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(resumeFromIdle, IDLE_MS);
}
function resumeFromIdle() {
  if (mode === 'loop' && paused) return resumeLoop();
  if (mode !== 'explore') return;
  if (room.phase === 'closed') return startLoop();
  // Leave the room the visitor left open, then start again from the opening view
  resumeAfterLeave = true;
  room.leave();
}

// A touch on the model, a label, the keys: the visitor is here
function onHand() {
  if (mode === 'loop') explore();
  else if (mode === 'explore') armIdle();
}
explorer.addEventListener('pointerdown', onHand);
for (const [place, el] of labels) {
  el.addEventListener('click', () => {
    explore();
    room.enter(place, { trigger: el });
  });
}
explorer.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') scene?.nudge(0.12, 0);
  else if (e.key === 'ArrowLeft') scene?.nudge(-0.12, 0);
  else if (e.key === 'ArrowUp') scene?.nudge(0, 0.08);
  else if (e.key === 'ArrowDown') scene?.nudge(0, -0.08);
  else if (e.key === '+' || e.key === '=') scene?.zoom(0.85);
  else if (e.key === '-' || e.key === '_') scene?.zoom(1.18);
  else return;
  onHand();
  e.preventDefault();
});
// Any activity anywhere keeps the visitor's turn alive; the first touch also frees the sound
document.addEventListener('pointerdown', () => {
  if (soundBlocked && !muted) fadeMusic(true);
  if (mode === 'explore' || paused) armIdle();
  wake();
});
document.addEventListener('keydown', () => {
  if (mode === 'explore' || paused) armIdle();
  wake();
});
document.addEventListener('pointermove', wake);
function wake() {
  document.body.classList.remove('is-still');
  clearTimeout(stillTimer);
  stillTimer = setTimeout(() => document.body.classList.add('is-still'), STILL_MS);
}
wake();
muteBtn.addEventListener('click', () => setMuted(!muted));
soundChip.addEventListener('click', () => fadeMusic(true));

// ---------------------------------------------------------------------------
// The scene
// ---------------------------------------------------------------------------
function supportsWebGL2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
function fallback() {
  stage.dataset.sceneState = 'fallback';
  setMode('fallback');
  $('.kiosk-fallback').hidden = false;
}
async function loadScene() {
  if (!supportsWebGL2()) return fallback();
  try {
    const { createCityScene } = await import('./scene/city.js');
    scene = createCityScene($('#scene-host'), {
      labels,
      motion,
      onReady: () => {
        stage.dataset.sceneState = 'ready';
        scene.setVisible(true);
        timer = setTimeout(startLoop, 800);
      },
      onFail: (err) => {
        console.warn('Community scene unavailable', err);
        fallback();
      },
      onSelect: (place) => {
        explore();
        room.enter(place, { trigger: labels.get(place) || null });
      },
      onInteract: onHand,
    });
    if (!scene) fallback();
    else scene.setVisible(true);
  } catch (err) {
    console.warn('Community scene unavailable', err);
    fallback();
  }
}
loadScene();

// Exposed for automated checks only
window.__kiosk = {
  get mode() {
    return mode;
  },
  get index() {
    return index;
  },
  get paused() {
    return paused;
  },
  get scene() {
    return scene;
  },
  get soundBlocked() {
    return soundBlocked;
  },
  room,
  steps,
  REST_MS,
  IDLE_MS,
};
