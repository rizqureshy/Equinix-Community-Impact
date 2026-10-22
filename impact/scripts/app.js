// Wiring for the experience: the field of light, the theatre of six chapters,
// one horizontal day, promises, the library, routing and the story dialog.
import Lenis from 'lenis';
import { createStore } from './state.js';
import { parseHash, hashFor, storyURL, anchorFor } from './router.js';
import { createField } from './field.js';
import { sequenceSteps } from './content/render.js';
import { topics } from './content/stories.js';
import { $, $$, createToast, setupCopy, createStoryDialog, setupMotionToggle } from './story-dialog.js';

const store = createStore();
const steps = sequenceSteps();
const motionOn = () => document.documentElement.dataset.motion !== 'off';
const vh = () => window.innerHeight;
const notify = createToast($('#toast'));

// ---------------------------------------------------------------------------
// Smooth scrolling (motion on only)
// ---------------------------------------------------------------------------
let lenis = null;
let lenisRaf = 0;
function startLenis() {
  if (lenis || !motionOn()) return;
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
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
  if (lenis && !instant) lenis.scrollTo(y, { duration: 1.3, force: true });
  else window.scrollTo({ top: y, behavior: 'auto' });
}

// ---------------------------------------------------------------------------
// The field
// ---------------------------------------------------------------------------
const canvas = $('#field');
const field = createField(canvas, { count: 4200, motion: motionOn });
/** Chapter forms sit to the right of the copy on wide screens. */
const formShift = () => (window.innerWidth >= 900 ? 0.24 : 0);

// ---------------------------------------------------------------------------
// The theatre
// ---------------------------------------------------------------------------
const theatre = $('#community');
const stage = $('#stage');
const chapters = $$('.chapter', theatre);
const railItems = $$('.rail-item', theatre);
const sequence = $('#sequence');
const N = steps.length;
let chapterIndex = -1;
let theatreTop = 0;
let theatreHeight = 0;
let inTheatre = false;

function layoutTheatre() {
  theatre.style.height = `${(N + 1) * vh()}px`;
  const r = theatre.getBoundingClientRect();
  theatreTop = r.top + window.scrollY;
  theatreHeight = theatre.offsetHeight;
}

/** Scroll position at which chapter `i` is on stage. */
const positionFor = (i) => Math.round(theatreTop + (i + 0.5) * vh());

function setChapter(i, { silent = false } = {}) {
  i = Math.max(0, Math.min(N - 1, i));
  if (i === chapterIndex) return;
  chapterIndex = i;
  const step = steps[i];
  chapters.forEach((c, k) => {
    const on = k === i;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-hidden', String(!on));
    if (on) $$('img', c).forEach((img) => (img.loading = 'eager'));
  });
  railItems.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'step' : 'false'));
  $('b', sequence).textContent = step.number;
  store.set({ section: step.topic || 'journey', topic: step.topic || store.get().topic, focus: step.place });
  if (!silent && !parseHash(location.hash).story) {
    history.replaceState(null, '', step.topic ? hashFor({ section: step.topic }) : '#/community');
  }
}

function goToChapter(i) {
  scrollTo(positionFor(i));
}

/** Progress through the theatre drives the chapter, the rail bars and the counter. */
function updateTheatre(y) {
  const span = theatreHeight - vh();
  const p = (y - theatreTop) / span;
  const inside = p >= -0.5 && p <= 1.15;
  if (inside !== inTheatre) {
    inTheatre = inside;
    sequence.classList.toggle('is-visible', inside && p >= 0 && p <= 1);
    stage.classList.toggle('is-live', inside);
  }
  sequence.classList.toggle('is-visible', p >= -0.02 && p <= 1.02);
  const clamped = Math.max(0, Math.min(0.999, p));
  const i = Math.floor(clamped * N);
  // Before the stage, the field is the light leaving the building; on stage it takes each chapter's form.
  if (p < -0.12) field.setShape('strands', 0);
  else field.setShape(steps[i].shape, formShift());
  railItems.forEach((b, k) => b.style.setProperty('--p', k < i ? 1 : k === i ? Math.max(0.08, clamped * N - i) : 0));
  setChapter(i);
  // The field shows for the hero and theatre, then hands the page over.
  canvas.classList.toggle('is-hidden', p > 1.02);
  field.setVisible(p <= 1.12);
}

railItems.forEach((b) => b.addEventListener('click', () => goToChapter(+b.dataset.go)));
stage.addEventListener('keydown', (e) => {
  if (e.target !== stage && e.target.closest('a, button')) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    goToChapter(chapterIndex + 1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    goToChapter(chapterIndex - 1);
  }
});

// Pointer over the stage: the light follows, the field moves aside, a click sends a ripple.
const cursorLight = $('#cursor-light');
const hero = $('#top');
for (const el of [stage, hero]) {
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !motionOn()) return;
    field.setPointer(e.clientX, e.clientY);
    cursorLight.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    cursorLight.classList.add('is-on');
  });
  el.addEventListener('pointerleave', () => {
    field.setPointer(null);
    cursorLight.classList.remove('is-on');
  });
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button, input')) return;
    field.burst(e.clientX, e.clientY);
  });
}

// ---------------------------------------------------------------------------
// One day, connected: a track that moves sideways as the page moves down
// ---------------------------------------------------------------------------
const day = $('#day');
const dayPin = $('#day-pin');
const dayTrack = $('#day-track');
const dayProgress = $('.day-progress i', day);
const moments = $$('.moment', day);
let dayTop = 0;
let dayDistance = 0;
let dayRail = false;

function layoutDay() {
  dayRail = window.innerWidth < 900 || !motionOn();
  day.classList.toggle('is-rail', dayRail);
  if (dayRail) {
    day.style.height = '';
    dayTrack.style.transform = '';
    return;
  }
  dayDistance = Math.max(0, dayTrack.scrollWidth - window.innerWidth);
  day.style.height = `${vh() + dayDistance}px`;
  dayTop = day.getBoundingClientRect().top + window.scrollY;
}

function updateDay(y) {
  if (dayRail) return;
  const p = Math.max(0, Math.min(1, (y - dayTop) / dayDistance));
  dayTrack.style.transform = `translate3d(${-p * dayDistance}px, 0, 0)`;
  dayProgress.style.setProperty('--p', p);
}

// Films play while near the viewport, whichever way the track moves.
const films = $$('video.film');
const filmObserver = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      const v = en.target;
      v.closest('.moment')?.classList.toggle('is-near', en.isIntersecting);
      if (en.isIntersecting && motionOn()) v.play().catch(() => {});
      else v.pause();
    }
  },
  { rootMargin: '10% 20%', threshold: 0.2 },
);
films.forEach((v) => filmObserver.observe(v));

// ---------------------------------------------------------------------------
// Reveals, words and numbers
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
  { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
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
  const dur = 1600;
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(end * e);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// The statement lights up word by word as it passes the middle of the screen.
const statement = $('[data-words]');
const signalWords = new Set((statement.dataset.signal || '').split(','));
statement.innerHTML = statement.textContent
  .split(/\s+/)
  .map((w) => `<span class="w${signalWords.has(w.replace(/[^a-z]/gi, '').toLowerCase()) ? ' is-signal' : ''}">${w}</span>`)
  .join(' ');
const words = $$('.w', statement);
function updateWords() {
  const r = statement.getBoundingClientRect();
  const start = vh() * 0.85;
  const end = vh() * 0.25;
  const p = Math.max(0, Math.min(1, (start - r.top) / (start - end + r.height * 0.6)));
  const lit = motionOn() ? Math.round(p * words.length) : words.length;
  words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
}

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
  promiseList.addEventListener('pointerover', (e) => {
    const b = e.target.closest('[data-promise]');
    if (b && e.pointerType === 'mouse') openPromise(+b.dataset.promise);
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
// Header: solid once scrolled, the current section marked, a menu on phones
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
const sectionEls = $$('[data-section]');
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const id = en.target.dataset.section;
      const key = id === 'top' ? null : id;
      navLinks.forEach((a) => {
        if (a.dataset.nav === key) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
sectionEls.forEach((s) => sectionObserver.observe(s));

// ---------------------------------------------------------------------------
// Sound: the theme, only after a tap, fading in and out
// ---------------------------------------------------------------------------
const theme = $('#theme');
const soundToggle = $('#sound-toggle');
let fadeTimer = 0;
function fadeTo(target, done) {
  clearInterval(fadeTimer);
  fadeTimer = setInterval(() => {
    const next = theme.volume + (target > theme.volume ? 0.04 : -0.04);
    theme.volume = Math.max(0, Math.min(target, 1) === target ? Math.max(0, Math.min(1, next)) : next);
    if (Math.abs(theme.volume - target) < 0.045) {
      theme.volume = target;
      clearInterval(fadeTimer);
      done?.();
    }
  }, 80);
}
soundToggle.addEventListener('click', async () => {
  const on = soundToggle.getAttribute('aria-pressed') !== 'true';
  soundToggle.setAttribute('aria-pressed', String(on));
  soundToggle.setAttribute('aria-label', `Sound, ${on ? 'on' : 'off'}`);
  if (on) {
    theme.volume = 0;
    try {
      await theme.play();
      fadeTo(0.4);
    } catch {
      soundToggle.setAttribute('aria-pressed', 'false');
      notify('Sound could not start in this browser.', { error: true });
    }
  } else fadeTo(0, () => theme.pause());
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !theme.paused) theme.pause();
  else if (!document.hidden && soundToggle.getAttribute('aria-pressed') === 'true') theme.play().catch(() => {});
});

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
  const anchor = anchorFor(section);
  const topicIndex = steps.findIndex((s) => s.topic === section);
  if (topicIndex >= 0) return scrollTo(positionFor(topicIndex), { instant });
  if (anchor === 'community') return scrollTo(positionFor(0), { instant });
  const el = document.getElementById(anchor);
  if (!el) return scrollTo(0, { instant });
  const y = el.getBoundingClientRect().top + window.scrollY - (section === 'day' ? 0 : 8);
  scrollTo(y, { instant });
}

let firstRoute = true;
function route() {
  const r = parseHash(location.hash);
  if (r.story) {
    dialog.open(r.story);
    if (firstRoute) scrollToSection(r.section, { instant: true });
  } else {
    const go = () => {
      if (r.section === 'top' && !firstRoute) scrollTo(0);
      else if (r.section !== 'top') scrollToSection(r.section, { instant: firstRoute });
      firstRoute = false;
    };
    if (dialog.isOpen) {
      // Let the story finish closing (and scrolling resume) before travelling.
      dialog.close();
      setTimeout(go, 240);
      return;
    }
    go();
  }
  firstRoute = false;
}
window.addEventListener('hashchange', route);

// In-page links to chapters and sections: scroll smoothly, and keep the hash honest.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || a.dataset.storyTrigger) return;
  const r = parseHash(a.getAttribute('href'));
  if (r.story) return;
  e.preventDefault();
  if (location.hash !== a.getAttribute('href')) history.pushState(null, '', a.getAttribute('href'));
  if (r.section === 'top') scrollTo(0);
  else scrollToSection(r.section);
});

// ---------------------------------------------------------------------------
// Scroll loop and layout
// ---------------------------------------------------------------------------
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 24);
    updateTheatre(y);
    updateDay(y);
    updateWords();
  });
}
function layout() {
  layoutTheatre();
  layoutDay();
  onScroll();
}
window.addEventListener('scroll', onScroll, { passive: true });
let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layout, 120);
});

// ---------------------------------------------------------------------------
// Motion preference
// ---------------------------------------------------------------------------
const motion = setupMotionToggle($('[data-motion-toggle]'), {
  initial: motionOn(),
  onChange: (on) => {
    if (on) startLenis();
    else stopLenis();
    field.motionChanged();
    films.forEach((v) => (on ? null : v.pause()));
    layout();
  },
});
if (motion.on) startLenis();

layout();
setChapter(0, { silent: true });
route();
document.fonts?.ready.then(layout);
window.addEventListener('load', layout);

// For tests and the console.
window.__impact = {
  store,
  field,
  steps,
  goToChapter,
  get chapter() {
    return chapterIndex;
  },
  get lenis() {
    return lenis;
  },
  layout,
};
