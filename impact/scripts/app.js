// Main page wiring: the pinned community journey, scroll choreography,
// story dialog, gallery and copy actions. Three.js loads lazily, only when
// the community comes near the viewport and WebGL is available.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createStore, topicTarget } from './state.js';
import { parseHash, hashFor, storyURL, anchorFor } from './router.js';
import { journeySteps } from './content/render.js';
import { $, $$, createToast, setupCopy, createStoryDialog, setupMotionToggle } from './story-dialog.js';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

const root = document.documentElement;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const store = createStore({ motion: root.dataset.motion !== 'off' });
let lenis = null;

const notify = createToast($('#toast'));
setupCopy(notify, (id) => storyURL(id));

// ---------------------------------------------------------------------------
// The community: stage, scene and journey
// ---------------------------------------------------------------------------
const steps = journeySteps();
const stage = $('#stage');
const pin = $('.journey-pin');
const journey = $('.journey');
const cards = $$('.journey-card');
const dots = $$('.journey-dot');
const labels = new Map($$('.place-label').map((el) => [el.dataset.place, el]));
const INTRO = 0.1; // share of the pin spent opening the product shot to full bleed
let scene = null;
let sceneLoading = false;
let activeStep = -1;

function showStep(i) {
  if (i === activeStep) return;
  activeStep = i;
  cards.forEach((c, j) => {
    c.hidden = j !== i;
  });
  dots.forEach((d, j) => d.setAttribute('aria-current', String(j === i)));
}
showStep(0);

function framing(open) {
  // Product-shot frame while the hero is in view, full bleed once pinned
  const inset = 1 - clamp(open);
  stage.style.setProperty('--inset-y', `${inset * 4}vh`);
  stage.style.setProperty('--inset-x', `${inset * 5}vw`);
  stage.style.setProperty('--inset-r', `${inset * 28}px`);
}

function onJourneyProgress(p) {
  framing(p / INTRO);
  pin.style.setProperty('--stats-opacity', String(1 - clamp(p / (INTRO * 0.7))));
  const jp = clamp((p - INTRO) / (1 - INTRO));
  const x = jp * steps.length;
  const step = x < 0.55 ? -1 : Math.min(steps.length - 1, Math.floor(x - 0.55));
  pin.style.setProperty('--ui-opacity', String(clamp((x - 0.3) / 0.25)));
  if (step >= 0) showStep(step);
  scene?.setProgress(jp, { side: step < 0 ? 0 : step % 2 === 0 ? -1 : 1 });
}

function supportsWebGL2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

async function loadScene() {
  if (scene || sceneLoading) return;
  sceneLoading = true;
  if (!supportsWebGL2()) {
    stage.dataset.sceneState = 'fallback';
    return;
  }
  try {
    const { createCityScene } = await import('./scene/city.js');
    scene = createCityScene($('#scene-host'), {
      labels,
      motion: () => store.get().motion,
      onReady: () => {
        stage.dataset.sceneState = 'ready';
        if (journeyTrigger) onJourneyProgress(journeyTrigger.progress);
        else scene.setFocus(steps[activeStep]?.place || 'overview', { instant: true });
        ScrollTrigger.refresh();
      },
      onFail: (err) => {
        console.warn('Community scene unavailable', err);
        stage.dataset.sceneState = 'fallback';
      },
      onSelect: (place) => goToPlace(place),
    });
    if (!scene) stage.dataset.sceneState = 'fallback';
    else scene.setStops(steps.map((s) => s.place));
  } catch (err) {
    console.warn('Community scene unavailable', err);
    stage.dataset.sceneState = 'fallback';
  }
}

// Load the scene once the community is within reach
const near = new IntersectionObserver(
  (entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      near.disconnect();
      loadScene();
    }
  },
  { rootMargin: '120% 0px' },
);
near.observe(journey);
const inView = new IntersectionObserver((entries) => scene?.setVisible(entries.some((e) => e.isIntersecting)), { rootMargin: '10% 0px' });
inView.observe(journey);

/** Scroll position at which step `i` is in view (motion on and pinned). */
function stepScrollY(i) {
  if (!journeyTrigger) return journey.getBoundingClientRect().top + scrollY;
  const jp = (i + 1) / steps.length;
  return journeyTrigger.start + (INTRO + (1 - INTRO) * jp) * (journeyTrigger.end - journeyTrigger.start);
}
function goToStep(i) {
  if (journeyTrigger) scrollToY(stepScrollY(i));
  else {
    showStep(i);
    scene?.setFocus(steps[i].place);
    if (!isInView(journey)) scrollToY(journey.getBoundingClientRect().top + scrollY);
  }
}
function goToPlace(place) {
  const i = steps.findIndex((s) => s.place === place);
  if (i >= 0) goToStep(i);
}
dots.forEach((d) => d.addEventListener('click', () => goToStep(Number(d.dataset.go))));
for (const [place, el] of labels) el.addEventListener('click', () => goToPlace(place));

// ---------------------------------------------------------------------------
// Scroll choreography (built only when motion is on)
// ---------------------------------------------------------------------------
let scrollTriggers = [];
let journeyTrigger = null;

function buildScroll() {
  teardownScroll();
  if (!store.get().motion) {
    $$('.statement-text .w').forEach((w) => w.style.setProperty('--o', '1'));
    framing(1);
    pin.style.setProperty('--ui-opacity', '1');
    pin.style.setProperty('--stats-opacity', '0');
    if (activeStep < 0) showStep(0);
    scene?.setFocus(steps[activeStep].place, { instant: true });
    return;
  }

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(lenisRaf);

  // Hero copy drifts up and fades as the community arrives
  const heroCopy = $('.hero-copy');
  scrollTriggers.push(
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        heroCopy.style.transform = `translateY(${-self.progress * 12}vh)`;
        heroCopy.style.opacity = String(1 - self.progress * 1.6);
      },
    }),
  );

  // The community pins and the camera travels through six stops, settling
  // on the nearest stop when the scroll rests (snap pattern adapted from the
  // 21st.dev Sticky Content Wrapper reference).
  framing(0);
  const stopProgress = [0, ...steps.map((_, i) => INTRO + (1 - INTRO) * ((i + 1) / steps.length))];
  journeyTrigger = ScrollTrigger.create({
    trigger: journey,
    start: 'top top',
    end: `+=${(steps.length + 1) * 100}%`,
    pin: pin,
    pinSpacing: true,
    scrub: 0.4,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    snap: {
      snapTo: stopProgress,
      duration: { min: 0.25, max: 0.7 },
      ease: 'power2.inOut',
      delay: 0.08,
      inertia: false,
      onStart: () => lenis?.stop(),
      onComplete: () => lenis?.start(),
    },
    onUpdate: (self) => onJourneyProgress(self.progress),
  });
  scrollTriggers.push(journeyTrigger);
  onJourneyProgress(0);

  // Statement: each word lights up in turn
  const words = $$('.statement-text .w');
  scrollTriggers.push(
    ScrollTrigger.create({
      trigger: '.statement',
      start: 'top 75%',
      end: 'bottom 55%',
      scrub: true,
      onUpdate: (self) => {
        const lit = self.progress * words.length * 1.15;
        words.forEach((w, i) => w.style.setProperty('--o', String(clamp(lit - i))));
      },
    }),
  );

  ScrollTrigger.refresh();
}

function lenisRaf(time) {
  lenis?.raf(time * 1000);
}

function teardownScroll() {
  scrollTriggers.forEach((t) => t.kill());
  scrollTriggers = [];
  journeyTrigger = null;
  if (lenis) {
    gsap.ticker.remove(lenisRaf);
    lenis.destroy();
    lenis = null;
  }
  const heroCopy = $('.hero-copy');
  heroCopy.style.transform = '';
  heroCopy.style.opacity = '';
}

let programmaticUntil = 0;
function scrollToY(y, { instant = false } = {}) {
  programmaticUntil = performance.now() + (instant ? 300 : 1600);
  if (lenis) lenis.scrollTo(y, { immediate: instant, duration: 1.4, force: true });
  else scrollTo({ top: y, behavior: instant || !store.get().motion ? 'auto' : 'smooth' });
}
const isInView = (el) => {
  const r = el.getBoundingClientRect();
  return r.top < innerHeight && r.bottom > 0;
};

// Split the statement into words once.
{
  const el = $('[data-words]');
  el.innerHTML = el.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="w">${w}</span>`)
    .join(' ');
}

// Sections and cards fade up as they arrive
const reveal = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      reveal.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
);
$$('[data-reveal]').forEach((el) => reveal.observe(el));

setupMotionToggle($('[data-motion-toggle]'), {
  initial: store.get().motion,
  onChange: (on) => {
    store.set({ motion: on });
    buildScroll();
    syncVideos();
  },
});

// ---------------------------------------------------------------------------
// Story dialog and routing
// ---------------------------------------------------------------------------
const dialog = createStoryDialog({
  drawer: $('#story-drawer'),
  content: $('#drawer-content'),
  motion: () => store.get().motion,
  fallbackHash: () => hashFor({ section: store.get().section, topic: store.get().topic }),
  onOpen: (story) => {
    lenis?.stop();
    store.set({ story: story.id });
  },
  onClose: () => {
    lenis?.start();
    store.set({ story: null });
  },
});

function scrollToSection(section, { instant = false } = {}) {
  if (section === 'top') return scrollToY(0, { instant });
  if (section === 'journey' && journeyTrigger) return scrollToY(journeyTrigger.start + INTRO * (journeyTrigger.end - journeyTrigger.start), { instant });
  const el = document.getElementById(anchorFor(section));
  if (el) scrollToY(el.getBoundingClientRect().top + scrollY, { instant });
}

function applyRoute(route, { initial = false } = {}) {
  const prev = store.get();
  if (route.story) {
    if (initial) {
      store.set({ section: route.section, topic: route.topic });
      scrollToSection(route.section, { instant: true });
    }
    dialog.open(route.story);
    return;
  }
  const returning = !!prev.story;
  if (dialog.isOpen) dialog.close();
  const patch = { section: route.section };
  if (route.topic) patch.topic = route.topic;
  store.set(patch);
  if (!returning) scrollToSection(route.section, { instant: initial });
}

addEventListener('hashchange', () => applyRoute(parseHash(location.hash)));
// Clicking a link to the current hash should still move there.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (a && a.getAttribute('href') === location.hash && !a.dataset.storyTrigger) {
    e.preventDefault();
    scrollToSection(parseHash(location.hash).section);
  }
});

// The section in the middle of the viewport sets the state.
const spy = new IntersectionObserver(
  (entries) => {
    if (performance.now() < programmaticUntil || store.get().story) return;
    const hit = entries.filter((e) => e.isIntersecting).pop();
    if (!hit) return;
    const section = hit.target.dataset.chapter || hit.target.dataset.section;
    if (section === store.get().section) return;
    const patch = { section };
    if (topicTarget[section]) patch.topic = section;
    store.set(patch);
    history.replaceState(null, '', hashFor({ section, topic: store.get().topic }));
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
$$('[data-section], .chapter').forEach((s) => spy.observe(s));

const navLinks = $$('.site-nav a');
store.subscribe((s, prev) => {
  if (s.section === prev.section) return;
  const group = topicTarget[s.section] || s.section === 'stories' ? 'chapter' : s.section;
  for (const a of navLinks) {
    const h = a.getAttribute('href');
    const on = (group === 'chapter' && h.startsWith('#/chapter')) || h === `#/${s.section}`;
    if (on) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
});

const header = $('.site-header');
function onScroll() {
  header.classList.toggle('is-scrolled', scrollY > 40);
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------------------------------------------------------------------------
// Films: play only while visible and motion is on
// ---------------------------------------------------------------------------
const visibleFilms = new Set();
function syncVideos() {
  for (const v of $$('video.film')) {
    if (store.get().motion && visibleFilms.has(v) && !document.hidden) {
      if (v.preload === 'none') v.preload = 'auto';
      v.play().catch(() => {});
    } else v.pause();
  }
}
const filmObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) e.isIntersecting ? visibleFilms.add(e.target) : visibleFilms.delete(e.target);
    syncVideos();
  },
  { rootMargin: '10% 0px' },
);
document.addEventListener('visibilitychange', syncVideos);
$$('video.film').forEach((v) => filmObserver.observe(v));

// Numbers count up once when they arrive.
const counter = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counter.unobserve(e.target);
      if (!store.get().motion) continue;
      const el = e.target;
      const { count, decimals, prefix, suffix } = el.dataset;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: Number(count),
        duration: 1.8,
        ease: 'power3.out',
        onUpdate: () => {
          const n = Number(decimals) ? obj.v.toFixed(Number(decimals)) : Math.round(obj.v).toLocaleString('en-GB');
          el.textContent = `${prefix}${n}${suffix}`;
        },
      });
    }
  },
  { threshold: 0.6 },
);
$$('.number-value').forEach((n) => counter.observe(n));

// ---------------------------------------------------------------------------
// Story gallery: filters and rail buttons
// ---------------------------------------------------------------------------
const filters = { topic: 'all', relationship: 'all' };
const items = $$('.card');
const list = $('#collection-list');
function applyFilters() {
  let shown = 0;
  for (const item of items) {
    const ok =
      (filters.topic === 'all' || item.dataset.topic === filters.topic) &&
      (filters.relationship === 'all' || item.dataset.relationship === filters.relationship);
    item.hidden = !ok;
    if (ok) shown++;
  }
  for (const chip of $$('.chip')) chip.setAttribute('aria-pressed', String(filters[chip.dataset.filterGroup] === chip.dataset.filter));
  $('#collection-count').textContent = shown === 1 ? '1 story' : `${shown} stories`;
  $('#collection-empty').hidden = shown > 0;
  list.hidden = shown === 0;
  list.scrollLeft = 0;
}
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) {
    filters[chip.dataset.filterGroup] = chip.dataset.filter;
    applyFilters();
  }
  if (e.target.closest('[data-filter-reset]')) {
    filters.topic = filters.relationship = 'all';
    applyFilters();
    $('.chip').focus();
  }
  const railBtn = e.target.closest('[data-rail-dir]');
  if (railBtn) list.scrollBy({ left: Number(railBtn.dataset.railDir) * list.clientWidth * 0.8, behavior: store.get().motion ? 'smooth' : 'auto' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
buildScroll();
applyRoute(parseHash(location.hash), { initial: true });
document.fonts?.ready.then(() => ScrollTrigger.refresh());

// Exposed for automated checks only.
window.__impact = {
  store,
  get lenis() {
    return lenis;
  },
  get scene() {
    return scene;
  },
  get step() {
    return activeStep;
  },
  goToStep,
};
