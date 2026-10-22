// Wiring for the experience: the map, the pillars, the timeline, reveals and
// counters, promises, the library, the header, routing and the story dialog.
import Lenis from 'lenis';
import { createStore } from './state.js';
import { parseHash, hashFor, storyURL, anchorFor } from './router.js';
import { createMap } from './map.js';
import { placeDetailHTML } from './content/render.js';
import { PLACES, ARCS } from './content/places.js';
import { getStory, topics } from './content/stories.js';
import { $, $$, createToast, setupCopy, createStoryDialog, setupMotionToggle } from './story-dialog.js';

const store = createStore();
const motionOn = () => document.documentElement.dataset.motion !== 'off';
const notify = createToast($('#toast'));
const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;

// ---------------------------------------------------------------------------
// Smooth scrolling (motion on only)
// ---------------------------------------------------------------------------
let lenis = null;
let lenisRaf = 0;
function startLenis() {
  if (lenis || !motionOn()) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  const loop = (t) => {
    lenis?.raf(t);
    lenisRaf = requestAnimationFrame(loop);
  };
  lenisRaf = requestAnimationFrame(loop);
}
function stopLenis() {
  if (!lenis) return;
  cancelAnimationFrame(lenisRaf);
  lenis.destroy();
  lenis = null;
}
function scrollTo(y, { instant = false } = {}) {
  if (lenis && !instant) lenis.scrollTo(y, { duration: 1.1, force: true });
  else window.scrollTo({ top: y, behavior: 'auto' });
}

// ---------------------------------------------------------------------------
// The map
// ---------------------------------------------------------------------------
const storyTopic = (id) => getStory(id)?.topic || '';
const panelList = $('#map-panel-list');
const panelDetail = $('#map-panel-detail');
const placeItems = $$('.place-item');
let mapFilter = 'all';

const map = createMap($('#map'), {
  places: PLACES,
  arcs: ARCS,
  storyTopic,
  onSelect(place) {
    placeItems.forEach((b) => b.classList.toggle('is-active', !!place && b.dataset.place === place.id));
    if (!place) {
      panelDetail.hidden = true;
      panelDetail.innerHTML = '';
      panelList.hidden = false;
      return;
    }
    panelDetail.innerHTML = placeDetailHTML(place);
    panelDetail.hidden = false;
    panelList.hidden = true;
    $('#map-panel').scrollTop = 0;
    store.set({ focus: getStory(place.story).sceneTarget });
  },
});
document.addEventListener('click', (e) => {
  const item = e.target.closest('[data-place]:not(.pin)');
  if (item) {
    map.select(item.dataset.place);
    return;
  }
  if (e.target.closest('[data-place-back]')) map.select(null);
  const chip = e.target.closest('[data-map-filter]');
  if (chip) {
    mapFilter = chip.dataset.mapFilter;
    $$('[data-map-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    map.filter(mapFilter);
    placeItems.forEach((b) => (b.hidden = mapFilter !== 'all' && b.dataset.topic !== mapFilter));
  }
});

// ---------------------------------------------------------------------------
// Pillars: the sticky tabs follow the pillar in view
// ---------------------------------------------------------------------------
const tabs = $$('#pillar-tabs a');
const pillarObserver = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const topic = en.target.dataset.topic;
      tabs.forEach((a) => (a.dataset.tab === topic ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
      store.set({ section: topic, topic });
    }
  },
  { rootMargin: '-40% 0px -55% 0px' },
);
$$('.pillar').forEach((p) => pillarObserver.observe(p));

// ---------------------------------------------------------------------------
// Timeline: drag to scroll, arrow keys to step
// ---------------------------------------------------------------------------
const timeline = $('#timeline');
if (timeline) {
  let drag = null;
  timeline.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: timeline.scrollLeft, moved: false };
    timeline.setPointerCapture(e.pointerId);
  });
  timeline.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) {
      drag.moved = true;
      timeline.classList.add('is-dragging');
    }
    timeline.scrollLeft = drag.left - dx;
  });
  const end = (e) => {
    if (!drag) return;
    if (drag.moved) {
      // Swallow the click that follows a drag so links are not followed.
      const stop = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      timeline.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => timeline.removeEventListener('click', stop, { capture: true }), 0);
    }
    drag = null;
    timeline.classList.remove('is-dragging');
    if (e.pointerId != null && timeline.hasPointerCapture(e.pointerId)) timeline.releasePointerCapture(e.pointerId);
  };
  timeline.addEventListener('pointerup', end);
  timeline.addEventListener('pointercancel', end);
  timeline.addEventListener('keydown', (e) => {
    if (e.target !== timeline) return;
    const step = $('.milestone', timeline).offsetWidth + 24;
    if (e.key === 'ArrowRight') timeline.scrollBy({ left: step, behavior: motionOn() ? 'smooth' : 'auto' });
    if (e.key === 'ArrowLeft') timeline.scrollBy({ left: -step, behavior: motionOn() ? 'smooth' : 'auto' });
  });
}

// ---------------------------------------------------------------------------
// Reveals, counters, meters, films
// ---------------------------------------------------------------------------
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('is-in');
      revealObserver.unobserve(en.target);
      $$('[data-count]', en.target).forEach(countUp);
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
);
$$('[data-reveal]').forEach((el) => revealObserver.observe(el));

function countUp(el) {
  const end = parseFloat(el.dataset.count);
  const decimals = +el.dataset.decimals || 0;
  const fmt = (v) => (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-GB'));
  if (!motionOn()) {
    el.textContent = fmt(end);
    return;
  }
  const t0 = performance.now();
  const dur = 1400;
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(end * e);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const films = $$('video.film');
const filmObserver = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      const v = en.target;
      if (en.isIntersecting && motionOn()) v.play().catch(() => {});
      else v.pause();
    }
  },
  { rootMargin: '10% 0px', threshold: 0.2 },
);
films.forEach((v) => filmObserver.observe(v));

// ---------------------------------------------------------------------------
// Promises: open one, the frame beside it changes
// ---------------------------------------------------------------------------
const promiseList = $('.promise-list');
if (promiseList) {
  const items = $$('.promise', promiseList);
  const frames = $$('.promise-frame');
  const openPromise = (i) => {
    items.forEach((li, k) => {
      const on = k === i;
      li.classList.toggle('is-open', on);
      $('.promise-btn', li).setAttribute('aria-expanded', String(on));
      $('.promise-body', li).hidden = !on;
    });
    frames.forEach((f, k) => {
      f.classList.toggle('is-active', k === i);
      f.setAttribute('aria-hidden', String(k !== i));
    });
  };
  promiseList.addEventListener('click', (e) => {
    const b = e.target.closest('[data-promise]');
    if (b) openPromise(+b.dataset.promise);
  });
}

// ---------------------------------------------------------------------------
// Library filters
// ---------------------------------------------------------------------------
const filters = { topic: 'all', relationship: 'all' };
const cards = $$('#library .card');
function applyFilters() {
  let shown = 0;
  for (const c of cards) {
    const ok = (filters.topic === 'all' || c.dataset.topic === filters.topic) && (filters.relationship === 'all' || c.dataset.relationship === filters.relationship);
    c.hidden = !ok;
    if (ok) shown++;
  }
  $('#library-empty').hidden = shown > 0;
}
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip[data-filter-group]');
  if (!chip) return;
  const group = chip.dataset.filterGroup;
  filters[group] = chip.dataset.filter;
  $$(`.chip[data-filter-group="${group}"]`).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  applyFilters();
});

// ---------------------------------------------------------------------------
// Header: a rule once scrolled, the current section marked, a menu on phones
// ---------------------------------------------------------------------------
const header = $('#site-header');
const nav = $('#site-nav');
const navLinks = $$('[data-nav]', nav);
const menuToggle = $('#menu-toggle');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});
const TOPIC_IDS = new Set(topics.map((t) => t.id));
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const id = en.target.dataset.section;
      const key = id === 'top' ? null : TOPIC_IDS.has(id) ? 'stories' : id;
      navLinks.forEach((a) => (a.dataset.nav === key ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
      if (!TOPIC_IDS.has(id)) store.set({ section: id });
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
$$('[data-section]').forEach((s) => sectionObserver.observe(s));
window.addEventListener('scroll', () => header.classList.toggle('is-solid', window.scrollY > 8), { passive: true });

// ---------------------------------------------------------------------------
// Story dialog and routing
// ---------------------------------------------------------------------------
const dialog = createStoryDialog({
  drawer: $('#story-drawer'),
  content: $('#drawer-content'),
  motion: motionOn,
  fallbackHash: () => hashFor({ section: store.get().section === 'top' ? 'share' : store.get().section }),
  onOpen: (story) => {
    store.set({ story: story.id });
    lenis?.stop();
    document.body.classList.add('is-locked');
  },
  onClose: () => {
    store.set({ story: null });
    lenis?.start();
    document.body.classList.remove('is-locked');
  },
});
setupCopy(notify, (id) => storyURL(id));

function scrollToSection(section, { instant = false } = {}) {
  const el = document.getElementById(anchorFor(section));
  if (!el) return scrollTo(0, { instant });
  const offset = TOPIC_IDS.has(section) ? headerH() + 52 : headerH() - 1;
  scrollTo(el.getBoundingClientRect().top + window.scrollY - offset, { instant });
}

let firstRoute = true;
function route() {
  const r = parseHash(location.hash);
  if (r.story) {
    dialog.open(r.story);
    if (firstRoute) scrollToSection(r.section, { instant: true });
    firstRoute = false;
    return;
  }
  const go = () => {
    if (r.section === 'top') {
      if (!firstRoute) scrollTo(0);
    } else scrollToSection(r.section, { instant: firstRoute });
    firstRoute = false;
  };
  if (dialog.isOpen) {
    dialog.close();
    setTimeout(go, 240);
  } else go();
}
window.addEventListener('hashchange', route);

// In-page links: travel smoothly and keep the hash honest.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || a.dataset.storyTrigger) return;
  const href = a.getAttribute('href');
  const r = parseHash(href);
  if (r.story) return;
  e.preventDefault();
  if (location.hash !== href) history.pushState(null, '', href);
  if (r.section === 'top') scrollTo(0);
  else scrollToSection(r.section);
});

// ---------------------------------------------------------------------------
// Motion preference
// ---------------------------------------------------------------------------
const motion = setupMotionToggle($('[data-motion-toggle]'), {
  initial: motionOn(),
  onChange: (on) => {
    if (on) startLenis();
    else {
      stopLenis();
      films.forEach((v) => v.pause());
    }
  },
});
if (motion.on) startLenis();

route();
document.fonts?.ready.then(() => firstRoute === false && null);

// For tests and the console.
window.__impact = {
  store,
  map,
  get lenis() {
    return lenis;
  },
};
