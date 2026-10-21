// Main page wiring: state, routing, scroll choreography, story dialog,
// gallery and copy actions. The 3D community lives on its own page
// (explore.html), so Three.js never loads here.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createStore, topicTarget } from './state.js';
import { parseHash, hashFor, storyURL, anchorFor } from './router.js';
import { topics } from './content/stories.js';
import { CHAPTERS } from './content/render.js';
import { $, $$, createToast, setupCopy, createStoryDialog, setupMotionToggle } from './story-dialog.js';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

// Links from the first version pointed at the explorer on this page.
{
  const route = parseHash(location.hash);
  if (route.section === 'explore' && !route.story) {
    location.replace(`explore.html${route.topic ? `#/place/${route.topic}` : ''}`);
  }
}

const root = document.documentElement;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const store = createStore({ motion: root.dataset.motion !== 'off' });
let lenis = null;

const notify = createToast($('#toast'));
setupCopy(notify, (id) => storyURL(id));

// ---------------------------------------------------------------------------
// Scroll choreography (built only when motion is on)
// ---------------------------------------------------------------------------
let scrollTriggers = [];
const heroReel = $('.hero-reel');

function buildScroll() {
  teardownScroll();
  if (!store.get().motion) {
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

  // Posters and the community invitation: films settle from a slight zoom
  for (const media of $$('.poster-media, .invite-media')) {
    const trigger = media.closest('.poster, .invite');
    scrollTriggers.push(
      ScrollTrigger.create({
        trigger,
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
  if (lenis) {
    gsap.ticker.remove(lenisRaf);
    lenis.destroy();
    lenis = null;
  }
  $$('.stack-inner').forEach((el) => el.style.removeProperty('--s'));
  $$('.poster-media, .invite-media').forEach((el) => el.style.removeProperty('--zoom'));
  heroReel.style.removeProperty('--hero-zoom');
  const inner = $('.hero-inner');
  inner.style.transform = '';
  inner.style.opacity = '';
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
$$('[data-section], .poster').forEach((s) => spy.observe(s));

const navLinks = $$('.site-nav a');
store.subscribe((s, prev) => {
  if (s.section === prev.section) return;
  const group = topicTarget[s.section] ? 'chapter' : s.section;
  for (const a of navLinks) {
    const h = a.getAttribute('href');
    const on = (group === 'chapter' && h.startsWith('#/chapter')) || h === `#/${s.section}`;
    a.toggleAttribute('aria-current', on);
    if (on) a.setAttribute('aria-current', 'true');
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
    // In the hero reel only the showing film plays.
    const waiting = v.parentElement === heroReel && !v.classList.contains('is-active');
    if (store.get().motion && visibleFilms.has(v) && !document.hidden && !waiting) {
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
  syncVideos();
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
$$('video.film').forEach((v) => filmObserver.observe(v));
buildScroll();
applyRoute(parseHash(location.hash), { initial: true });
document.fonts?.ready.then(() => ScrollTrigger.refresh());
addEventListener('pagehide', () => clearInterval(reelTimer));

// Exposed for automated checks only.
window.__impact = { store, get lenis() { return lenis; } };
