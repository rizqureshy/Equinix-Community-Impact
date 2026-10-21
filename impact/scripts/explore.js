// The 3D community: a separate, explorable space. Visitors move between
// places with the step controls, arrow keys, the labels or by clicking a
// building. Each place opens its story in the shared dialog.
//   #/place/<topic|datacenter>   a place in the tour
//   #/story/<id>                 a story opened over the scene
import { createStore } from './state.js';
import { flySteps } from './content/render.js';
import { getStory } from './content/stories.js';
import { $, $$, createToast, setupCopy, createStoryDialog, setupMotionToggle } from './story-dialog.js';

const root = document.documentElement;
const params = new URLSearchParams(location.search);
const store = createStore({ motion: root.dataset.motion !== 'off', section: 'explore' });
const steps = flySteps();
let scene = null;

const notify = createToast($('#toast'));
// Shared links point at the main page, where every story lives in context.
setupCopy(notify, (id) => new URL(`./#/story/${id}`, location.href).href);

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const stage = $('#stage');
const labels = new Map($$('.place-label').map((el) => [el.dataset.place, el]));

function useFallback(reason) {
  stage.dataset.sceneState = 'fallback';
  stage.dataset.fallbackReason = reason;
  try {
    scene?.dispose();
  } catch {
    /* already gone */
  }
  scene = null;
}

async function startScene() {
  if (params.get('scene') === 'off') return useFallback('disabled');
  try {
    const mod = await import('./scene/scene.js');
    if (!mod.supportsWebGL2()) return useFallback('no-webgl2');
    scene = mod.createScene($('#scene-host'), {
      labels,
      reducedMotion: !store.get().motion,
      onSelect: (place) => go(steps.findIndex((s) => s.target === place)),
      onHover: (id) => scene?.hoverLabel(id),
      onFail: () => useFallback('context-lost'),
    });
    stage.dataset.sceneState = 'ready';
    const focus = store.get().focus;
    if (focus === 'overview') scene.enter();
    else {
      scene.setShift(shift(), { instant: true });
      scene.setFocus(focus, { instant: true });
    }
  } catch (error) {
    console.warn('Scene unavailable, showing illustration instead.', error);
    useFallback('error');
  }
}

const shift = () => (innerWidth > 760 ? 0.14 : 0);

store.subscribe((s, prev) => {
  if (!scene) return;
  if (s.focus !== prev.focus) {
    scene.setShift(s.focus === 'overview' ? 0 : shift());
    scene.setFocus(s.focus);
  }
  if (s.motion !== prev.motion) {
    scene.setReducedMotion(!s.motion);
    scene.setMotion(s.motion);
  }
});

for (const [place, el] of labels) {
  el.addEventListener('click', () => go(steps.findIndex((s) => s.target === place)));
  el.addEventListener('mouseenter', () => scene?.hoverLabel(place));
  el.addEventListener('mouseleave', () => scene?.hoverLabel(null));
  el.addEventListener('focus', () => scene?.hoverLabel(place));
  el.addEventListener('blur', () => scene?.hoverLabel(null));
}

// ---------------------------------------------------------------------------
// Tour: one step per place, with an opening overview
// ---------------------------------------------------------------------------
const captions = $$('.fly-caption');
const stepButtons = $$('.fly-step');
const intro = $('.explore-intro');
let current = -1;

function show(i) {
  current = i;
  intro.hidden = i >= 0;
  $('.fly-ui').classList.toggle('is-touring', i >= 0);
  captions.forEach((c, n) => (c.hidden = n !== i));
  stepButtons.forEach((b, n) => {
    b.setAttribute('aria-pressed', String(n === i));
    b.style.setProperty('--fill', n <= i ? '1' : '0');
  });
  $('[data-prev]').disabled = i <= 0;
  $('[data-next]').textContent = i >= steps.length - 1 ? 'Back to the overview' : i < 0 ? 'Start the tour' : 'Next place';
  const step = steps[i];
  if (!step) store.set({ focus: 'overview' });
  else if (step.id === 'datacenter') store.set({ focus: 'datacenter' });
  else store.set({ topic: step.id, focus: step.target });
}

/** Move to a step and record it in the URL without adding history. */
function go(i) {
  if (i < -1 || i >= steps.length) i = -1;
  show(i);
  history.replaceState(null, '', i < 0 ? '#/' : `#/place/${steps[i].id}`);
}

stepButtons.forEach((b, i) => b.addEventListener('click', () => go(i)));
$('[data-prev]').addEventListener('click', () => go(Math.max(0, current - 1)));
$('[data-next]').addEventListener('click', () => go(current >= steps.length - 1 ? -1 : current + 1));
$('[data-start]').addEventListener('click', () => go(0));
addEventListener('keydown', (e) => {
  if (dialog.isOpen || e.target.closest('input, textarea')) return;
  if (e.key === 'ArrowRight') go(Math.min(steps.length - 1, current + 1));
  if (e.key === 'ArrowLeft') go(Math.max(-1, current - 1));
});

// ---------------------------------------------------------------------------
// Story dialog and routing
// ---------------------------------------------------------------------------
const dialog = createStoryDialog({
  drawer: $('#story-drawer'),
  content: $('#drawer-content'),
  motion: () => store.get().motion,
  fallbackHash: () => (current < 0 ? '#/' : `#/place/${steps[current].id}`),
  onOpen: (story) => {
    const i = steps.findIndex((s) => s.story === story.id || s.id === story.topic);
    if (i >= 0 && i !== current) show(i);
    store.set({ story: story.id });
  },
  // Keep the camera where it is: the place behind the story stays in view.
  onClose: () => store.set({ story: null, focus: store.get().focus }),
});

function applyRoute() {
  const [kind, id] = location.hash.replace(/^#\/?/, '').split('/');
  if (kind === 'story' && getStory(id)) return dialog.open(id);
  if (dialog.isOpen) dialog.close();
  if (kind === 'place') show(steps.findIndex((s) => s.id === id));
  else if (current !== -1 && !kind) show(-1);
}
addEventListener('hashchange', applyRoute);

setupMotionToggle($('[data-motion-toggle]'), {
  initial: store.get().motion,
  onChange: (on) => store.set({ motion: on, focus: store.get().focus }),
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
show(-1);
applyRoute();
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 800 }) : setTimeout(fn, 100));
if (document.readyState === 'complete') idle(startScene);
else addEventListener('load', () => idle(startScene), { once: true });

// Exposed for automated checks only.
window.__impact = { store, get scene() { return scene; } };
