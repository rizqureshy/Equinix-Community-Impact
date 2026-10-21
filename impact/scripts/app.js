// Application wiring: state, routing, scene, narrative and controls.
import { createStore, topicTarget } from './state.js';
import { parseHash, hashFor, storyURL, anchorFor } from './router.js';
import { copyText, summaryText } from './clipboard.js';
import { getStory, sources, topics } from './content/stories.js';
import { storyDetailHTML, topicPreviewHTML } from './content/render.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const root = document.documentElement;
const systemReduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 900px)');
const params = new URLSearchParams(location.search);

const store = createStore({ motion: root.dataset.motion !== 'off' });
let scene = null;

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
    box.style.cssText = 'width:100%;margin-top:8px;font:inherit;font-size:0.85rem;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--paper)';
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
  const ok = await copyText(text);
  if (ok) notify(button.dataset.copy === 'link' ? 'Story link copied.' : 'Story summary copied, with its source.');
  else {
    notify('Could not copy automatically. The text is selected below for you to copy.', { error: true });
    showManualCopy(button, text);
  }
});

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
  store.set({ motion: on });
}
motionToggle.addEventListener('click', () => applyMotion(!store.get().motion, { persist: true }));
systemReduce.addEventListener('change', (e) => applyMotion(!e.matches));
applyMotion(store.get().motion);

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
    const s = store.get();
    scene.setShift(shiftFor(s.section), { instant: true });
    if (s.focus === 'overview' && s.section === 'top' && !s.story) scene.enter();
    else scene.setFocus(s.focus, { instant: true });
  } catch (error) {
    console.warn('Scene unavailable, showing illustration instead.', error);
    useFallback('error');
  }
}

function shiftFor(section) {
  if (narrow.matches) return 0;
  if (section === 'top') return { a: 0.12, b: 0, c: 0 }[root.dataset.opening] ?? 0.12;
  return 0.2;
}

// Scene labels and the canvas both select places.
function selectPlace(place) {
  if (place === 'datacenter') {
    showDataCenterPreview();
    return;
  }
  const topic = Object.entries(topicTarget).find(([, target]) => target === place)?.[0];
  if (topic) navigate(hashFor({ section: 'explore', topic }));
}
for (const [place, el] of labels) {
  el.addEventListener('click', () => selectPlace(place));
  el.addEventListener('mouseenter', () => scene?.hoverLabel(place));
  el.addEventListener('mouseleave', () => scene?.hoverLabel(null));
  el.addEventListener('focus', () => scene?.hoverLabel(place));
  el.addEventListener('blur', () => scene?.hoverLabel(null));
}
$('[data-overview]').addEventListener('click', () => store.set({ focus: 'overview' }));

// ---------------------------------------------------------------------------
// Explorer tabs: one tab stop, arrow keys move and select
// ---------------------------------------------------------------------------
const tabs = $$('.topic-tab');
const indicator = $('.topic-indicator');
const panel = $('#topic-panel');

function placeIndicator() {
  const active = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
  if (!active) {
    indicator.style.width = '0px';
    return;
  }
  indicator.style.width = `${active.offsetWidth}px`;
  indicator.style.height = `${active.offsetHeight}px`;
  indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
}

function renderTopic(topic) {
  for (const t of tabs) {
    const on = t.dataset.topic === topic;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  }
  panel.setAttribute('aria-labelledby', `topic-tab-${topic}`);
  if (panel.dataset.topic !== topic) {
    panel.innerHTML = topicPreviewHTML(topic);
    panel.dataset.topic = topic;
  }
  placeIndicator();
}

function showDataCenterPreview() {
  if (store.get().section !== 'explore') navigate('#/explore');
  for (const t of tabs) t.setAttribute('aria-selected', 'false');
  placeIndicator();
  panel.dataset.topic = 'datacenter';
  panel.innerHTML = `<p class="preview-place">Equinix <span aria-hidden="true">·</span> Illustrative data center</p>
    <h3 class="preview-title">Where every thread in this community begins.</h3>
    <p class="preview-summary">Private interconnection for care and research, heat recovered for neighbours, and the people who keep it all running. A data center is part of its community, not apart from it.</p>
    <div class="preview-actions">
      <a class="btn btn--primary" href="#/principles">Our community principles</a>
      <a class="btn btn--quiet" href="#/people">Meet the people</a>
    </div>`;
  store.set({ focus: 'datacenter' });
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => {
    store.set({ topic: tab.dataset.topic });
    history.replaceState(null, '', hashFor({ section: 'explore', topic: tab.dataset.topic }));
  });
  tab.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = null;
    if (e.key in keys) next = (i + keys[e.key] + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });
});
addEventListener('resize', placeIndicator);
document.fonts?.ready.then(placeIndicator);

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
    drawer.showModal();
  }
  $('.story-title', drawerContent)?.setAttribute('tabindex', '-1');
  $('.drawer-close', drawer).focus();
  store.set({ story: id });
}

function finishClose() {
  drawer.classList.remove('is-closing');
  if (drawer.open) drawer.close();
  delete drawer.dataset.story;
  store.set({ story: null });
  const target = returnFocus;
  returnFocus = null;
  if (target && target.isConnected) target.focus({ preventScroll: true });
}

function closeStory() {
  if (!drawer.open) return;
  if (store.get().motion) {
    drawer.classList.add('is-closing');
    setTimeout(finishClose, 170);
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

function scrollToSection(section, { instant = false } = {}) {
  const el = section === 'top' ? document.body : document.getElementById(anchorFor(section));
  if (!el) return;
  programmaticUntil = performance.now() + (instant ? 300 : 1400);
  const top = section === 'top' ? 0 : el.getBoundingClientRect().top + scrollY - (narrow.matches ? stage.offsetHeight : 0);
  scrollTo({ top, behavior: instant || !store.get().motion ? 'auto' : 'smooth' });
}

function navigate(hash) {
  if (location.hash === hash) applyRoute(parseHash(hash), { user: true });
  else location.hash = hash;
}

function applyRoute(route, { initial = false, user = false } = {}) {
  const prev = store.get();
  if (route.story) {
    // Keep the visitor's place; a direct link starts at the story's chapter.
    if (initial) {
      store.set({ section: route.section, topic: route.topic });
      scrollToSection(route.section, { instant: true });
    }
    openStory(route.story);
    return;
  }
  const returning = !!prev.story;
  if (drawer.open) closeStory();
  const patch = { section: route.section };
  if (route.topic) patch.topic = route.topic;
  store.set(patch);
  if (!returning || user) scrollToSection(route.section, { instant: initial });
}

addEventListener('hashchange', () => applyRoute(parseHash(location.hash)));

// ---------------------------------------------------------------------------
// Scroll spy: the section in the middle of the viewport sets the state
// ---------------------------------------------------------------------------
const sections = $$('[data-section], .chapter');
const sectionOf = (el) => el.dataset.chapter || el.dataset.section;
const spy = new IntersectionObserver(
  (entries) => {
    if (performance.now() < programmaticUntil || store.get().story) return;
    const hit = entries.filter((e) => e.isIntersecting).pop();
    if (!hit) return;
    const section = sectionOf(hit.target);
    if (section === store.get().section) return;
    const patch = { section };
    if (topicTarget[section]) patch.topic = section;
    store.set(patch);
    history.replaceState(null, '', hashFor({ section, topic: store.get().topic }));
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
sections.forEach((s) => spy.observe(s));

// ---------------------------------------------------------------------------
// Render from state
// ---------------------------------------------------------------------------
const railLinks = $$('.thread-rail a');
const railOrder = railLinks.map((a) => a.dataset.rail);
const navLinks = $$('.site-nav a');
const rail = $('.thread-rail');
let flashTimer = 0;

store.subscribe((s, prev) => {
  if (s.topic !== prev.topic || !panel.dataset.topic) renderTopic(s.topic);
  if (scene) {
    if (s.focus !== prev.focus) scene.setFocus(s.focus);
    if (s.section !== prev.section) scene.setShift(shiftFor(s.section));
    if (s.motion !== prev.motion) {
      scene.setReducedMotion(!s.motion);
      scene.setMotion(s.motion);
    }
  }
  if (s.section !== prev.section) {
    const index = railOrder.indexOf(s.section);
    railLinks.forEach((a, i) => {
      a.toggleAttribute('aria-current', i === index);
      if (i === index) a.setAttribute('aria-current', 'true');
      a.classList.toggle('is-passed', index >= 0 && i < index);
    });
    const active = railLinks[index];
    if (active && prev.section) {
      active.classList.add('is-flash');
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => active.classList.remove('is-flash'), 1100);
    }
    const group = topicTarget[s.section] ? 'chapter' : s.section;
    for (const a of navLinks) {
      const h = a.getAttribute('href');
      const on = (group === 'chapter' && h.startsWith('#/chapter')) || h === `#/${s.section}`;
      a.toggleAttribute('aria-current', on);
      if (on) a.setAttribute('aria-current', 'true');
    }
  }
  if (s.motion !== prev.motion) syncVideos();
});

// Rail progress follows the whole page, like a thread being drawn.
function updateProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  rail.style.setProperty('--rail-progress', `${max > 0 ? Math.min(100, (scrollY / max) * 100) : 0}%`);
  $('.site-header').classList.toggle('is-scrolled', scrollY > 8);
}
addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// ---------------------------------------------------------------------------
// Media: reveal images once, play ambient films only while visible
// ---------------------------------------------------------------------------
const reveal = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.remove('is-pending');
      reveal.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -15% 0px' },
);
$$('.chapter .media').forEach((m) => {
  m.classList.add('is-pending');
  reveal.observe(m);
});

const videos = $$('.ambient-video');
const visibleVideos = new Set();
function syncVideos() {
  for (const v of videos) {
    if (store.get().motion && visibleVideos.has(v) && !document.hidden) {
      if (v.preload === 'none') v.preload = 'auto';
      v.play().catch(() => {});
    } else v.pause();
  }
}
const videoObserver = new IntersectionObserver((entries) => {
  for (const e of entries) e.isIntersecting ? visibleVideos.add(e.target) : visibleVideos.delete(e.target);
  syncVideos();
});
videos.forEach((v) => videoObserver.observe(v));
document.addEventListener('visibilitychange', syncVideos);

// ---------------------------------------------------------------------------
// Collection filters
// ---------------------------------------------------------------------------
const filters = { topic: 'all', relationship: 'all' };
const items = $$('.collection-item');
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
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
renderTopic(store.get().topic);
applyRoute(parseHash(location.hash), { initial: true });

// Idle callbacks can be starved on busy devices, so cap the wait.
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));
if (document.readyState === 'complete') idle(startScene);
else addEventListener('load', () => idle(startScene), { once: true });

// Exposed for automated checks only.
window.__impact = { store, get scene() { return scene; }, topics };
