// Application wiring: state, routing, scroll choreography, scene, story
// dialog, gallery and copy actions.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createStore, topicTarget } from './state.js';
import { parseHash, hashFor, storyURL, anchorFor } from './router.js';
import { copyText, summaryText } from './clipboard.js';
import { getStory, sources, topics } from './content/stories.js';
import { storyDetailHTML, flySteps, CHAPTERS } from './content/render.js';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const root = document.documentElement;
const systemReduce = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const store = createStore({ motion: root.dataset.motion !== 'off' });
let scene = null;
let lenis = null;

// ---------------------------------------------------------------------------
// Toast and copy actions
// ---------------------------------------------------------------------------
const toast = $('#toast');
let toastTimer = 0;
function notify(message, { error = false } = {}) {
  toast.textContent = message;
  toast.classList.toggle('is-error', error);
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function showManualCopy(button, text) {
  let box = button.parentElement.querySelector('.manual-copy');
  if (!box) {
    box = document.createElement('textarea');
    box.className = 'manual-copy';
    box.readOnly = true;
    box.rows = 4;
    box.setAttribute('aria-label', 'Text to copy');
    button.parentElement.appendChild(box);
  }
  box.value = text;
  box.focus();
  box.select();
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  const story = getStory(button.dataset.story);
  if (!story) return;
  const link = storyURL(story.id);
  const text = button.dataset.copy === 'link' ? link : summaryText(story, sources, link);
  if (await copyText(text)) notify(button.dataset.copy === 'link' ? 'Story link copied.' : 'Story summary copied, with its source.');
  else {
    notify('Could not copy automatically. The text is selected below for you to copy.', { error: true });
    showManualCopy(button, text);
  }
});

// ---------------------------------------------------------------------------
// Scene: loaded after first paint; the page is fully usable without it
// ---------------------------------------------------------------------------
const stage = $('#stage');
const labels = new Map($$('.place-label').map((el) => [el.dataset.place, el]));

function useFallback(reason) {
  stage.dataset.sceneState = 'fallback';
  stage.dataset.fallbackReason = reason;
  if (scene) {
    try {
      scene.dispose();
    } catch {
      /* already gone */
    }
    scene = null;
  }
}

async function startScene() {
  if (params.get('scene') === 'off') return useFallback('disabled');
  try {
    const mod = await import('./scene/scene.js');
    if (!mod.supportsWebGL2()) return useFallback('no-webgl2');
    scene = mod.createScene($('#scene-host'), {
      labels,
      reducedMotion: !store.get().motion,
      onSelect: selectPlace,
      onHover: (id) => scene?.hoverLabel(id),
      onFail: () => useFallback('context-lost'),
    });
    stage.dataset.sceneState = 'ready';
    scene.setShift(0, { instant: true });
    const s = store.get();
    if (s.focus === 'overview') scene.enter();
    else scene.setFocus(s.focus, { instant: true });
  } catch (error) {
    console.warn('Scene unavailable, showing illustration instead.', error);
    useFallback('error');
  }
}

const steps = flySteps();
function selectPlace(place) {
  const i = steps.findIndex((s) => s.target === place);
  if (i >= 0) goToStep(i);
}
for (const [place, el] of labels) {
  el.addEventListener('click', () => selectPlace(place));
  el.addEventListener('mouseenter', () => scene?.hoverLabel(place));
  el.addEventListener('mouseleave', () => scene?.hoverLabel(null));
  el.addEventListener('focus', () => scene?.hoverLabel(place));
  el.addEventListener('blur', () => scene?.hoverLabel(null));
}

// ---------------------------------------------------------------------------
// Flythrough: expand the model, then one step per place
// ---------------------------------------------------------------------------
const EXPAND = 1; // viewport heights spent expanding the stage
const STEP = 0.85; // viewport heights per place
const flySection = $('#explore');
const flyPin = $('.fly-pin');
const captions = $$('.fly-caption');
const stepButtons = $$('.fly-step');
let flyTrigger = null;
let currentStep = -1;

function showStep(i, { fromScroll = false } = {}) {
  if (i === currentStep) return;
  currentStep = i;
  captions.forEach((c, n) => (c.hidden = n !== i));
  stepButtons.forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
  const step = steps[i];
  if (!step) return;
  // Keep the subject clear of the caption on wide screens.
  scene?.setShift(innerWidth > 760 ? 0.14 : 0);
  if (step.id === 'datacenter') store.set({ section: 'explore', focus: 'datacenter' });
  else store.set({ section: 'explore', topic: step.id });
  if (fromScroll) history.replaceState(null, '', step.id === 'datacenter' ? '#/explore' : hashFor({ section: 'explore', topic: step.id }));
}

/** Scroll position (px) at which a step is showing. */
function stepY(i) {
  if (!flyTrigger) return flySection.getBoundingClientRect().top + scrollY;
  return flyTrigger.start + (EXPAND + i * STEP + STEP * 0.35) * innerHeight;
}

function goToStep(i) {
  if (flyTrigger) scrollToY(stepY(i));
  else {
    if (!isInView(flySection)) scrollToY(stepY(i));
    showStep(i);
  }
}
stepButtons.forEach((b, i) => b.addEventListener('click', () => goToStep(i)));

function setFlyProgress(p) {
  const pos = p * (EXPAND + steps.length * STEP);
  const e = clamp(pos / EXPAND);
  const ease = 1 - Math.pow(1 - e, 3);
  stage.style.setProperty('--inset-y', `${(1 - ease) * 18}vh`);
  stage.style.setProperty('--inset-x', `${(1 - ease) * 24}vw`);
  stage.style.setProperty('--inset-r', `${(1 - ease) * 28}px`);
  $('.fly-title-a').style.transform = `translateX(${-ease * 60}vw)`;
  $('.fly-title-b').style.transform = `translateX(${ease * 60}vw)`;
  $('.fly-title').style.opacity = String(1 - ease);
  stage.style.setProperty('--ui-opacity', String(clamp((e - 0.8) / 0.2)));
  const at = (pos - EXPAND) / STEP;
  stepButtons.forEach((b, i) => b.style.setProperty('--fill', String(clamp(at - i))));
  if (e < 1) {
    if (currentStep !== -1) {
      currentStep = -1;
      scene?.setShift(0);
      store.set({ section: 'explore', focus: 'overview' });
    }
  } else showStep(clamp(Math.floor(at), 0, steps.length - 1), { fromScroll: true });
}

// ---------------------------------------------------------------------------
// Scroll choreography (built only when motion is on)
// ---------------------------------------------------------------------------
let scrollTriggers = [];
const heroReel = $('.hero-reel');

function buildScroll() {
  teardownScroll();
  const on = store.get().motion;
  root.classList.toggle('is-static', !on);
  if (!on) {
    stage.style.removeProperty('--inset-y');
    stage.style.removeProperty('--inset-x');
    stage.style.removeProperty('--inset-r');
    stage.style.setProperty('--ui-opacity', '1');
    $('.fly-title').style.opacity = '0';
    stepButtons.forEach((b, i) => b.style.setProperty('--fill', i === Math.max(currentStep, 0) ? '1' : '0'));
    if (currentStep < 0) showStep(0);
    $$('.statement-text .w').forEach((w) => w.style.setProperty('--o', '1'));
    return;
  }

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(lenisRaf);

  // Hero: the reel drifts closer and the title lifts away
  scrollTriggers.push(
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        heroReel.style.setProperty('--hero-zoom', String(1 + self.progress * 0.15));
        const inner = $('.hero-inner');
        inner.style.transform = `translateY(${-self.progress * 18}vh)`;
        inner.style.opacity = String(1 - self.progress * 1.4);
      },
    }),
  );

  // Flythrough: pinned while the stage expands and the camera tours
  flyTrigger = ScrollTrigger.create({
    trigger: flySection,
    start: 'top top',
    end: () => `+=${(EXPAND + steps.length * STEP) * innerHeight}`,
    pin: flyPin,
    onUpdate: (self) => setFlyProgress(self.progress),
    onRefresh: (self) => setFlyProgress(self.progress),
  });
  scrollTriggers.push(flyTrigger);

  // Statement: each word lights up in turn
  const words = $$('.statement-text .w');
  scrollTriggers.push(
    ScrollTrigger.create({
      trigger: '.statement',
      start: 'top 75%',
      end: 'bottom 60%',
      scrub: true,
      onUpdate: (self) => {
        const lit = self.progress * words.length * 1.15;
        words.forEach((w, i) => w.style.setProperty('--o', String(0.16 + 0.84 * clamp(lit - i))));
      },
    }),
  );

  // Posters: the film settles from a slight zoom as the chapter arrives
  for (const poster of $$('.poster')) {
    const media = $('.poster-media', poster);
    scrollTriggers.push(
      ScrollTrigger.create({
        trigger: poster,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => media.style.setProperty('--zoom', String(1.22 - self.progress * 0.22)),
      }),
    );
  }

  // Promises: each card eases back as the next one stacks over it
  const cards = $$('.stack-card');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    const inner = $('.stack-inner', card);
    scrollTriggers.push(
      ScrollTrigger.create({
        trigger: next,
        start: 'top bottom',
        end: 'top 30%',
        scrub: true,
        onUpdate: (self) => inner.style.setProperty('--s', String(1 - self.progress * 0.06)),
      }),
    );
  });

  ScrollTrigger.refresh();
}

function lenisRaf(time) {
  lenis?.raf(time * 1000);
}

function teardownScroll() {
  scrollTriggers.forEach((t) => t.kill());
  scrollTriggers = [];
  flyTrigger = null;
  if (lenis) {
    gsap.ticker.remove(lenisRaf);
    lenis.destroy();
    lenis = null;
  }
  $$('.stack-inner').forEach((el) => el.style.removeProperty('--s'));
  $$('.poster-media').forEach((el) => el.style.removeProperty('--zoom'));
  heroReel.style.removeProperty('--hero-zoom');
  const inner = $('.hero-inner');
  inner.style.transform = '';
  inner.style.opacity = '';
}

function scrollToY(y, { instant = false } = {}) {
  programmaticUntil = performance.now() + (instant ? 300 : 1600);
  if (lenis) lenis.scrollTo(y, { immediate: instant || !store.get().motion, duration: 1.4, force: true });
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

// ---------------------------------------------------------------------------
// Motion preference
// ---------------------------------------------------------------------------
const motionToggle = $('[data-motion-toggle]');
function applyMotion(on, { persist = false } = {}) {
  root.dataset.motion = on ? 'on' : 'off';
  motionToggle.setAttribute('aria-pressed', String(!on));
  $('.motion-label', motionToggle).textContent = on ? 'Pause motion' : 'Play motion';
  if (persist) {
    try {
      localStorage.setItem('impact-motion', on ? 'on' : 'off');
    } catch {
      /* storage unavailable: preference lasts for this visit */
    }
  }
  const changed = store.get().motion !== on;
  store.set({ motion: on });
  if (changed) {
    const y = scrollY;
    buildScroll();
    syncVideos();
    if (!on) scrollTo(0, Math.min(y, document.documentElement.scrollHeight));
  }
}
motionToggle.addEventListener('click', () => applyMotion(!store.get().motion, { persist: true }));
systemReduce.addEventListener('change', (e) => applyMotion(!e.matches));
motionToggle.setAttribute('aria-pressed', String(!store.get().motion));
$('.motion-label', motionToggle).textContent = store.get().motion ? 'Pause motion' : 'Play motion';

// ---------------------------------------------------------------------------
// Story detail: a modal dialog with focus restore
// ---------------------------------------------------------------------------
const drawer = $('#story-drawer');
const drawerContent = $('#drawer-content');
let returnFocus = null;
let openedByPush = false;

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-story-trigger]');
  if (trigger) {
    returnFocus = trigger;
    openedByPush = true;
  }
});

function openStory(id) {
  const story = getStory(id);
  if (!story) return;
  if (drawer.open && drawer.dataset.story === id) return;
  drawerContent.innerHTML = storyDetailHTML(story);
  drawer.dataset.story = id;
  drawerContent.scrollTop = 0;
  if (!drawer.open) {
    returnFocus ||= document.activeElement;
    lenis?.stop();
    drawer.showModal();
  }
  $('.drawer-close', drawer).focus();
  store.set({ story: id, focus: story.sceneTarget });
}

function finishClose() {
  drawer.classList.remove('is-closing');
  if (drawer.open) drawer.close();
  delete drawer.dataset.story;
  lenis?.start();
  store.set({ story: null });
  const target = returnFocus;
  returnFocus = null;
  if (target && target.isConnected) target.focus({ preventScroll: true });
}

function closeStory() {
  if (!drawer.open) return;
  if (store.get().motion) {
    drawer.classList.add('is-closing');
    setTimeout(finishClose, 190);
  } else finishClose();
}

/** Visitor asked to close: step back through history if we added the entry. */
function requestClose() {
  if (openedByPush && parseHash(location.hash).story) {
    openedByPush = false;
    history.back();
  } else {
    history.replaceState(null, '', hashFor({ section: store.get().section, topic: store.get().topic }));
    closeStory();
  }
}

drawer.addEventListener('cancel', (e) => {
  e.preventDefault();
  requestClose();
});
$('[data-drawer-close]').addEventListener('click', requestClose);
drawer.addEventListener('click', (e) => {
  if (e.target === drawer) requestClose();
});
drawerContent.addEventListener(
  'scroll',
  () => {
    const max = drawerContent.scrollHeight - drawerContent.clientHeight;
    drawer.style.setProperty('--drawer-progress', `${max > 0 ? (drawerContent.scrollTop / max) * 100 : 100}%`);
  },
  { passive: true },
);

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------
let programmaticUntil = 0;

function scrollToSection(section, topic, { instant = false } = {}) {
  if (section === 'top') return scrollToY(0, { instant });
  if (section === 'explore') {
    const i = topic ? steps.findIndex((s) => s.id === topic) : 0;
    scrollToY(stepY(Math.max(i, 0)), { instant });
    if (!flyTrigger) showStep(Math.max(i, 0));
    return;
  }
  const el = document.getElementById(anchorFor(section));
  if (el) scrollToY(el.getBoundingClientRect().top + scrollY, { instant });
}

function applyRoute(route, { initial = false } = {}) {
  const prev = store.get();
  if (route.story) {
    if (initial) {
      store.set({ section: route.section, topic: route.topic });
      scrollToSection(route.section, route.topic, { instant: true });
    }
    openStory(route.story);
    return;
  }
  const returning = !!prev.story;
  if (drawer.open) closeStory();
  const patch = { section: route.section };
  if (route.topic) patch.topic = route.topic;
  store.set(patch);
  if (!returning) scrollToSection(route.section, route.topic, { instant: initial });
}

addEventListener('hashchange', () => applyRoute(parseHash(location.hash)));
// Clicking a link to the current hash should still move there.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (a && a.getAttribute('href') === location.hash && !a.dataset.storyTrigger) {
    e.preventDefault();
    const r = parseHash(location.hash);
    scrollToSection(r.section, r.topic);
  }
});

// ---------------------------------------------------------------------------
// Section spy: the section in the middle of the viewport sets the state
// ---------------------------------------------------------------------------
const spy = new IntersectionObserver(
  (entries) => {
    if (performance.now() < programmaticUntil || store.get().story) return;
    const hit = entries.filter((e) => e.isIntersecting).pop();
    if (!hit) return;
    const section = hit.target.dataset.chapter || hit.target.dataset.section;
    if (section === store.get().section || section === 'explore') {
      if (section === 'explore' && store.get().section !== 'explore') store.set({ section: 'explore' });
      return;
    }
    const patch = { section };
    if (topicTarget[section]) patch.topic = section;
    store.set(patch);
    history.replaceState(null, '', hashFor({ section, topic: store.get().topic }));
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
$$('[data-section], .poster').forEach((s) => spy.observe(s));

// ---------------------------------------------------------------------------
// Render from state
// ---------------------------------------------------------------------------
const navLinks = $$('.site-nav a');
store.subscribe((s, prev) => {
  if (scene) {
    if (s.focus !== prev.focus) scene.setFocus(s.focus);
    if (s.motion !== prev.motion) {
      scene.setReducedMotion(!s.motion);
      scene.setMotion(s.motion);
    }
  }
  if (s.section !== prev.section) {
    const group = topicTarget[s.section] ? 'chapter' : s.section;
    for (const a of navLinks) {
      const h = a.getAttribute('href');
      const on = (group === 'chapter' && h.startsWith('#/chapter')) || h === `#/${s.section}`;
      a.toggleAttribute('aria-current', on);
      if (on) a.setAttribute('aria-current', 'true');
    }
  }
});

const header = $('.site-header');
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  header.style.setProperty('--progress', String(max > 0 ? clamp(scrollY / max) : 0));
  header.classList.toggle('is-scrolled', scrollY > innerHeight * 0.85);
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
function observeFilms() {
  $$('video.film').forEach((v) => filmObserver.observe(v));
}
document.addEventListener('visibilitychange', syncVideos);

// Hero reel: human moments from each chapter, crossfading.
const reel = topics.map((t) => ({ topic: t.label, film: CHAPTERS[t.id].film }));
const REEL_CAPTIONS = ['A care team reading a scan', 'Researchers comparing notes', 'Students on their first tour', 'Neighbours on a new path', 'Morning swimmers'];
let reelIndex = 0;
let reelTimer = 0;
function buildReel() {
  reel.forEach((r, i) => {
    const v = document.createElement('video');
    v.className = 'film';
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = i === 0 ? 'auto' : 'none';
    v.poster = `media/${r.film}-poster.jpg`;
    v.setAttribute('aria-hidden', 'true');
    v.innerHTML = `<source src="media/${r.film}.webm" type="video/webm"><source src="media/${r.film}.mp4" type="video/mp4">`;
    if (i === 0) v.classList.add('is-active');
    heroReel.appendChild(v);
  });
  reelTimer = setInterval(advanceReel, 5200);
}
function advanceReel() {
  if (!store.get().motion || document.hidden || !isInView($('.hero'))) return;
  const vids = $$('video', heroReel);
  vids[reelIndex].classList.remove('is-active');
  reelIndex = (reelIndex + 1) % vids.length;
  const next = vids[reelIndex];
  next.preload = 'auto';
  next.currentTime = 0;
  next.classList.add('is-active');
  $('.hero-caption-topic').textContent = reel[reelIndex].topic;
  $('.hero-caption-text').textContent = REEL_CAPTIONS[reelIndex];
}

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
buildReel();
observeFilms();
buildScroll();
applyRoute(parseHash(location.hash), { initial: true });

const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));
if (document.readyState === 'complete') idle(startScene);
else addEventListener('load', () => idle(startScene), { once: true });
document.fonts?.ready.then(() => ScrollTrigger.refresh());
addEventListener('pagehide', () => clearInterval(reelTimer));

// Exposed for automated checks only.
window.__impact = { store, get scene() { return scene; }, topics, get lenis() { return lenis; } };
