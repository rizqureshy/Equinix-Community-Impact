// Main page wiring: the community explorer and its tour, scroll choreography,
// story dialog, gallery and copy actions. Three.js loads lazily, only when
// the community comes near the viewport and WebGL is available.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createStore, topicTarget } from './state.js';
import { parseHash, hashFor, storyURL, anchorFor } from './router.js';
import { journeySteps } from './content/render.js';
import { $, $$, createToast, setupCopy, createStoryDialog, setupMotionToggle } from './story-dialog.js';
import { createSunlight } from './weather.js';
import { createRoom } from './room.js';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

const root = document.documentElement;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const store = createStore({ motion: root.dataset.motion !== 'off' });
let lenis = null;

const notify = createToast($('#toast'));
setupCopy(notify, (id) => storyURL(id));

// ---------------------------------------------------------------------------
// The community: a model you explore freely, with a tour that can play
// ---------------------------------------------------------------------------
const steps = journeySteps(); // the places the tour visits, in order
const stage = $('#stage');
const explorer = $('#explorer');
const journey = $('.journey');
const playButtons = $$('[data-play]');
const muteButton = $('[data-mute]');
const tourCaption = $('.tour-caption');
const theme = $('#theme');
const labels = new Map($$('.place-label').map((el) => [el.dataset.place, el]));
const TOUR_DWELL = 9000; // ms at each place while the tour plays
let scene = null;
let sceneLoading = false;
let playing = false;
let tourIndex = -1; // -1 is the overview
let tourTimer = 0;
let muted = false; // not remembered: a tour should never open silent by surprise

function setCaption(s) {
  tourCaption.replaceChildren();
  tourCaption.hidden = !s;
  if (!s) return;
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = `${s.number} ${s.label}`;
  const title = document.createElement('p');
  title.className = 'tour-caption-title';
  title.textContent = s.placeName;
  const text = document.createElement('p');
  text.className = 'tour-caption-text';
  text.textContent = s.moment;
  tourCaption.append(eyebrow, title, text);
}
/** The tour's camera: a place from the list, or the overview. */
function showTourStop(i) {
  tourIndex = i;
  const s = i < 0 ? null : steps[i];
  scene?.setFocus(s ? s.place : 'overview', { instant: !store.get().motion });
  for (const [place, el] of labels) el.classList.toggle('is-focus', !!s && place === s.place);
  setCaption(s);
}
/** Back to the opening view, by hand. */
function resetView() {
  stopTour();
  tourIndex = -1;
  explorer.classList.remove('is-explored');
  scene?.setFocus('overview', { instant: !store.get().motion });
  for (const el of labels.values()) el.classList.remove('is-focus');
}

// The tour: one place after another, around and around, with music
function setPlayingUI() {
  for (const b of playButtons) {
    b.setAttribute('aria-pressed', String(playing));
    if (b.classList.contains('bar-btn')) b.setAttribute('aria-label', playing ? 'Pause the tour' : 'Play the tour');
    else b.textContent = playing ? 'Pause the tour' : 'Play the tour';
  }
  explorer.classList.toggle('is-playing', playing);
}
function startTour() {
  if (playing) return;
  playing = true;
  setPlayingUI();
  scene?.setDrift(store.get().motion);
  fadeMusic(true);
  if (muted) notify('The tour is playing without music. Use the sound control to turn it on.');
  const advance = () => {
    const next = tourIndex >= steps.length - 1 ? -1 : tourIndex + 1;
    showTourStop(next);
    tourTimer = setTimeout(advance, next < 0 ? TOUR_DWELL * 0.7 : TOUR_DWELL);
  };
  tourTimer = setTimeout(advance, 1200);
}
function stopTour() {
  if (!playing) return;
  playing = false;
  clearTimeout(tourTimer);
  setPlayingUI();
  scene?.setDrift(false);
  fadeMusic(false);
  setCaption(null);
  for (const el of labels.values()) el.classList.remove('is-focus');
}
function toggleTour() {
  playing ? stopTour() : startTour();
}

let fadeTimer = 0;
/** Fade the theme in or out over a fixed time, whatever the frame rate. */
function fadeMusic(on) {
  if (!theme) return;
  clearInterval(fadeTimer);
  const target = on && !muted ? 0.55 : 0;
  if (target > 0) {
    if (theme.preload === 'none') theme.preload = 'auto';
    theme.play().catch(() => notify('The browser blocked the music. Press play again to allow it.', { error: true }));
  }
  const from = theme.volume;
  const started = performance.now();
  const length = 700;
  fadeTimer = setInterval(() => {
    const t = Math.min(1, (performance.now() - started) / length);
    theme.volume = from + (target - from) * t;
    if (t === 1) {
      clearInterval(fadeTimer);
      if (target === 0) theme.pause();
    }
  }, 40);
}
function setMuted(on) {
  muted = on;
  muteButton.setAttribute('aria-pressed', String(on));
  muteButton.setAttribute('aria-label', on ? 'Unmute the music' : 'Mute the music');
  if (playing) fadeMusic(!on);
}
setMuted(muted);
setPlayingUI();

// Controls
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-play]')) return toggleTour();
  if (e.target.closest('[data-mute]')) return setMuted(!muted);
  if (e.target.closest('[data-reset-view]')) return resetView();
});
// A building, or its name, is a door: click it and you step inside
function enterPlace(place) {
  room.enter(place, { trigger: labels.get(place) || null });
}
for (const [place, el] of labels) el.addEventListener('click', () => enterPlace(place));
// The keyboard turns and zooms the model; space plays or pauses the tour
explorer.addEventListener('keydown', (e) => {
  const onControl = e.target !== explorer && e.target.closest('button, a');
  if (e.key === 'ArrowRight') scene?.nudge(0.12, 0);
  else if (e.key === 'ArrowLeft') scene?.nudge(-0.12, 0);
  else if (e.key === 'ArrowUp') scene?.nudge(0, 0.08);
  else if (e.key === 'ArrowDown') scene?.nudge(0, -0.08);
  else if (e.key === '+' || e.key === '=') scene?.zoom(0.85);
  else if (e.key === '-' || e.key === '_') scene?.zoom(1.18);
  else if (e.key === 'Home') resetView();
  else if (e.key === ' ' && !onControl) toggleTour();
  else return;
  if (e.key.startsWith('Arrow') || e.key === 'Home') onExplore();
  e.preventDefault();
});
/** Any hand on the model: the tour stops, the opening card gives way. */
function onExplore() {
  if (playing) stopTour();
  explorer.classList.add('is-explored');
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
        if (playing) showTourStop(tourIndex);
        scene.setDrift(playing && store.get().motion);
      },
      onFail: (err) => {
        console.warn('Community scene unavailable', err);
        stage.dataset.sceneState = 'fallback';
      },
      onSelect: enterPlace,
      onInteract: onExplore,
    });
    if (!scene) stage.dataset.sceneState = 'fallback';
  } catch (err) {
    console.warn('Community scene unavailable', err);
    stage.dataset.sceneState = 'fallback';
  }
}

// Sunlight: a wash of low autumn light over the page
const sunlight = createSunlight({ light: $('#weather-light'), motion: () => store.get().motion });

// The red fabric behind the page: loaded after first paint, with a toggle
const fabricLayer = $('#fabric-layer');
const fabricToggle = $('[data-fabric-toggle]');
let fabric = null;
let fabricLoading = false;
function fabricWanted() {
  return root.dataset.fabric === 'on' && innerWidth > 760 && supportsWebGL2();
}
async function loadFabric() {
  if (fabric || fabricLoading || !fabricWanted()) return;
  fabricLoading = true;
  try {
    const { createFabric } = await import('./fabric.js');
    fabric = createFabric(fabricLayer, { motion: () => store.get().motion });
    if (fabric) fabricLayer.classList.add('is-ready');
  } catch (err) {
    console.warn('Fabric unavailable', err);
  }
  fabricLoading = false;
}
function setFabric(on) {
  root.dataset.fabric = on ? 'on' : 'off';
  fabricToggle.setAttribute('aria-pressed', String(on));
  fabricToggle.setAttribute('aria-label', `Red fabric background, ${on ? 'on' : 'off'}`);
  try {
    localStorage.setItem('impact-fabric', on ? 'on' : 'off');
  } catch {}
  if (on) {
    loadFabric();
    fabric?.start();
  } else {
    // Let it fade out, then stop rendering
    setTimeout(() => {
      if (root.dataset.fabric === 'off') fabric?.stop();
    }, 1100);
  }
}
fabricToggle.addEventListener('click', () => setFabric(root.dataset.fabric !== 'on'));
setFabric(root.dataset.fabric === 'on');
if (fabricWanted()) (window.requestIdleCallback || ((fn) => setTimeout(fn, 600)))(loadFabric);

// Stepping inside a building: the room overlay
const room = createRoom($('#room'), {
  motion: () => store.get().motion,
  webgl: supportsWebGL2(),
  approach: (place) => {
    stopTour();
    if (scene && store.get().motion) return scene.approach(place);
    scene?.approach(place, { instant: true });
    return Promise.resolve();
  },
  onLeft: () => {
    scene?.back({ instant: !store.get().motion });
  },
  openStory: (id) => dialog.open(id),
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-room-enter]');
  if (b) room.enter(b.dataset.roomEnter, { trigger: b });
});

// Load the scene once the community is within reach; pause everything when it leaves
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
const inView = new IntersectionObserver(
  (entries) => {
    const visible = entries.some((e) => e.isIntersecting);
    scene?.setVisible(visible);
    if (!visible) stopTour();
  },
  { rootMargin: '10% 0px' },
);
inView.observe(explorer);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopTour();
});

// ---------------------------------------------------------------------------
// Scroll choreography (built only when motion is on)
// ---------------------------------------------------------------------------
let scrollTriggers = [];

function buildScroll() {
  teardownScroll();
  if (!store.get().motion) {
    $$('.statement-text .w').forEach((w) => w.style.setProperty('--o', '1'));
    scene?.setDrift(false);
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
    sunlight.motionChanged();
    fabric?.motionChanged();
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
      const { count, decimals } = el.dataset;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: Number(count),
        duration: 1.8,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = Number(decimals) ? obj.v.toFixed(Number(decimals)) : Math.round(obj.v).toLocaleString('en-GB');
        },
      });
    }
  },
  { threshold: 0.6 },
);
$$('.number-digits').forEach((n) => counter.observe(n));

// ---------------------------------------------------------------------------
// The promises: the row nearest the reading line is current and its
// photograph and proof show in the sticky panel
// ---------------------------------------------------------------------------
const ledger = $('.ledger');
const ledgerRows = $$('.ledger-row');
const proofs = $$('.proof');
let activePromise = 0;
function setPromise(i) {
  if (i === activePromise) return;
  activePromise = i;
  ledger.dataset.active = String(i);
  ledgerRows.forEach((r, j) => {
    if (j === i) r.setAttribute('aria-current', 'true');
    else r.removeAttribute('aria-current');
  });
  proofs.forEach((f, j) => {
    f.hidden = j !== i;
  });
}
function updateLedger() {
  if (!ledger || !isInView(ledger)) return;
  const line = innerHeight * 0.42;
  let best = 0;
  ledgerRows.forEach((r, i) => {
    if (r.getBoundingClientRect().top <= line) best = i;
  });
  setPromise(best);
}
addEventListener('scroll', updateLedger, { passive: true });
addEventListener('resize', updateLedger);
document.addEventListener('click', (e) => {
  const head = e.target.closest('[data-promise-go]');
  if (!head) return;
  const i = Number(head.dataset.promiseGo);
  setPromise(i);
  const top = ledgerRows[i].getBoundingClientRect().top + scrollY - innerHeight * 0.4;
  if (innerWidth > 1000) scrollToY(top);
});

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
updateLedger();
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
  get tourStop() {
    return tourIndex;
  },
  get playing() {
    return playing;
  },
  startTour,
  stopTour,
  resetView,
  get fabric() {
    return fabric;
  },
  room,
};
