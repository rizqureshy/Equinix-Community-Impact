// "Fly through the community": a scroll-scrubbed AI film of the six places.
// With motion on, the stage pins and scroll drives the film; with motion off,
// the same scenes are shown as a plain sequence of stills and captions.
//   #/place/<id>   start at a scene      #/story/<id>   a story over the film
import { gsap } from 'gsap';
import Lenis from 'lenis';
import { createScrub } from './flight/scrub.js';
import { flySteps } from './content/render.js';
import { getStory } from './content/stories.js';
import { $, $$, createToast, setupCopy, createStoryDialog, setupMotionToggle } from './story-dialog.js';

gsap.ticker.lagSmoothing(0);
const root = document.documentElement;
const steps = flySteps();
const N = steps.length;
const DIVE = 1.5; // viewport heights of scroll per scene clip
const CONNECT = 0.9; // ...per connecting flight

// Film order: dive 1, connector 1, dive 2, … dive N. H.264 where the browser
// supports it, VP9 otherwise.
const ext = document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm';
const segments = [];
for (let i = 1; i <= N; i++) {
  segments.push({ kind: 'dive', scene: i - 1, src: `media/flight/dive-${i}.${ext}`, poster: `media/flight/dive-${i}-poster.jpg`, weight: DIVE });
  if (i < N) segments.push({ kind: 'connector', scene: i - 1, src: `media/flight/conn-${i}.${ext}`, poster: `media/flight/conn-${i}-poster.jpg`, weight: CONNECT });
}
const diveSegment = (scene) => scene * 2;

const notify = createToast($('#toast'));
setupCopy(notify, (id) => new URL(`./#/story/${id}`, location.href).href);

const flight = $('#flight');
const stage = $('#flight-stage');
const scenes = $$('.flight-scene');
const dots = $$('.flight-dot');
const intro = $('.flight-intro');
let motion = root.dataset.motion !== 'off';
let scrub = null;
let lenis = null;
let current = -1;

function showScene(i) {
  if (i === current) return;
  current = i;
  scenes.forEach((s, n) => s.classList.toggle('is-active', n === i));
  dots.forEach((d, n) => d.setAttribute('aria-current', String(n === i)));
  if (i >= 0 && !dialog.isOpen) history.replaceState(null, '', `#/place/${steps[i].id}`);
}

/** Scroll length of the pinned film, in pixels. */
const filmLength = () => segments.reduce((s, x) => s + x.weight, 0) * innerHeight;

function onScroll() {
  const header = $('.site-header');
  const max = document.documentElement.scrollHeight - innerHeight;
  header.style.setProperty('--progress', String(max > 0 ? Math.min(1, scrollY / max) : 0));
  if (!scrub) return;
  const top = flight.offsetTop;
  const progress = (scrollY - top) / filmLength();
  scrub.render(progress);
}

function onFrame({ index, local, progress }) {
  const seg = segments[index];
  // Captions settle in while the camera arrives in a scene, and clear before the next flight.
  const inScene = seg.kind === 'dive' && local > (seg.scene === 0 ? 0.35 : 0.3);
  showScene(inScene ? seg.scene : -1);
  intro.classList.toggle('is-hidden', progress > 0.04);
  stage.classList.toggle('is-started', progress > 0.001);
  dots.forEach((d, n) => d.style.setProperty('--fill', String(segments[diveSegment(n)] && index >= diveSegment(n) ? 1 : 0)));
}

function scrollToScene(i, { instant = false } = {}) {
  if (!scrub) {
    scenes[i]?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    return;
  }
  // Land just after the camera has arrived, where the caption reads.
  const y = flight.offsetTop + (scrub.startOf(diveSegment(i)) + (DIVE / segments.reduce((s, x) => s + x.weight, 0)) * 0.72) * filmLength();
  if (lenis) lenis.scrollTo(y, { immediate: instant, duration: 2.2, force: true });
  else scrollTo({ top: y, behavior: instant ? 'auto' : 'smooth' });
}
dots.forEach((d, i) => d.addEventListener('click', () => scrollToScene(i)));

function build() {
  teardown();
  root.classList.toggle('flight-static', !motion);
  if (!motion) {
    scenes.forEach((s) => s.classList.add('is-active'));
    return;
  }
  flight.style.height = `${(segments.reduce((s, x) => s + x.weight, 0) + 1) * 100}svh`;
  scrub = createScrub(stage, { segments, onFrame });
  scrub.preload();
  lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
  lenis.on('scroll', onScroll);
  gsap.ticker.add(raf);
  onScroll();
}
function raf(time) {
  lenis?.raf(time * 1000);
}
function teardown() {
  scrub?.dispose();
  scrub = null;
  if (lenis) {
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
  }
  flight.style.height = '';
  current = -1;
  scenes.forEach((s) => s.classList.remove('is-active'));
}
addEventListener('scroll', () => !lenis && onScroll(), { passive: true });
addEventListener('resize', onScroll);

// ---------------------------------------------------------------------------
// Story dialog and routing
// ---------------------------------------------------------------------------
const dialog = createStoryDialog({
  drawer: $('#story-drawer'),
  content: $('#drawer-content'),
  motion: () => motion,
  fallbackHash: () => (current >= 0 ? `#/place/${steps[current].id}` : '#/'),
  onOpen: () => lenis?.stop(),
  onClose: () => lenis?.start(),
});

function applyRoute({ initial = false } = {}) {
  const [kind, id] = location.hash.replace(/^#\/?/, '').split('/');
  if (kind === 'story' && getStory(id)) return dialog.open(id);
  if (dialog.isOpen) dialog.close();
  if (kind === 'place' && initial) {
    const i = steps.findIndex((s) => s.id === id);
    if (i >= 0) requestAnimationFrame(() => scrollToScene(i, { instant: true }));
  }
}
addEventListener('hashchange', () => applyRoute());

setupMotionToggle($('[data-motion-toggle]'), {
  initial: motion,
  onChange: (on) => {
    motion = on;
    build();
  },
});

build();
applyRoute({ initial: true });

// Exposed for automated checks only.
window.__impact = { get state() { return scrub?.state; }, get current() { return current; }, get lenis() { return lenis; } };
