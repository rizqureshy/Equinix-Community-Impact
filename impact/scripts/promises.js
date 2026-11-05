// The promises, drawn as plans. A numbered list with a thread that grows as you read; beside it a sticky
// sheet where the current promise's plan draws itself in one red line, rests a beat, and then the
// photograph of the promise kept develops through it and stays, the lines faint over it. Nothing reacts
// to the hand. Listen on a promise has the narrator read it, and the sheet keeps time with him: the pen
// draws while he reads the promise, the photograph comes up as he says "Kept". "Play the five promises"
// runs the section hands free. Markup is pre-rendered by principlesHTML (content/render.js); drawings,
// photographs and voice are recorded in media-src/asset-manifest.json.
import { principles } from './content/stories.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

const DRAW_MS = 3000;
const HOLD_MS = 800;
const DEVELOP_MS = 1600;
// Where "Kept" falls in each spoken line, as a share of its length (media-src/voice/promises-lines.json)
const KEPT_AT = principles.map((p) => {
  const before = `Promise. ${p.name}. ${p.promise} `.length;
  return before / (before + `Kept: ${p.proof}`.length);
});

/**
 * @param {HTMLElement} section  the promises section, with its list, sheet and play button
 * @param {object} opts
 * @param {string} [opts.media]  path to the media folder from the page
 * @param {() => boolean} [opts.motion]
 * @param {(y: number) => void} [opts.scrollToY]  the page's own scroller, when it has one
 * @param {(on: boolean) => void} [opts.onVoice]  the narrator starts and stops (the music ducks)
 */
export function createPromises(section, { media = 'media/', motion = () => true, scrollToY = null, onVoice = () => {} } = {}) {
  if (!section) return null;
  const $ = (s) => section.querySelector(s);
  const rows = [...section.querySelectorAll('.promise-item')];
  const list = $('.promises-list');
  const threadFill = $('.promises-thread i');
  const plan = $('.plan');
  const drawingHost = $('.plan-drawing');
  const washHost = $('.plan-wash');
  const photoImg = $('.plan-photo img');
  const playAll = $('[data-promises-play]');
  if (!rows.length || !plan) return null;
  const still = () => !motion() || matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DRAWING = (i) => `${media}promises/drawn/k${i + 1}-tint-ref`;
  const PHOTO = (i) => `${media}kept-${i + 1}-1200.webp`;
  const VOICE = (i) => `${media}voice/promises/promise-${i + 1}.mp3`;

  const state = { current: -1, phase: 'paper', playing: -1, auto: false };
  let strokes = [];
  let progress = 0;
  let loadToken = 0;

  function setPhase(ph) {
    state.phase = ph;
    plan.dataset.phase = ph;
    rows.forEach((r, i) => r.classList.toggle('is-kept', i === state.current && (ph === 'developing' || ph === 'kept')));
  }

  async function loadDrawing(i) {
    const token = ++loadToken;
    drawingHost.innerHTML = '';
    washHost.innerHTML = '';
    strokes = [];
    photoImg.src = PHOTO(i);
    photoImg.alt = principles[i].alt || '';
    const stem = DRAWING(i);
    const res = await fetch(`${stem}.svg`).catch(() => null);
    if (token !== loadToken) return false;
    if (!(res && res.ok)) {
      drawingHost.innerHTML = `<div class="plan-pending"><b>0${i + 1}</b></div>`;
      return false;
    }
    const wash = new Image();
    wash.decoding = 'async';
    wash.alt = '';
    wash.src = `${stem}.wash.webp`;
    washHost.appendChild(wash);
    const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
    if (token !== loadToken) return false;
    const svg = doc.documentElement;
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMax slice'); // the same crop as the photograph: bottom-aligned, sides kept
    drawingHost.appendChild(document.importNode(svg, true));
    const live = drawingHost.querySelector('svg');
    const shapes = [...live.querySelectorAll('path, line, polyline, polygon, circle, ellipse')].filter((el) => typeof el.getTotalLength === 'function');
    let total = 0;
    const lens = shapes.map((el) => {
      let L = 0;
      try { L = el.getTotalLength(); } catch { L = 0; }
      total += L;
      return L;
    });
    let acc = 0;
    // Every stroke takes its share of the whole line, in pen order
    strokes = shapes.map((el, k) => {
      const from = acc / (total || 1);
      acc += lens[k];
      const to = acc / (total || 1);
      el.style.strokeDasharray = `${lens[k]} ${lens[k]}`;
      el.style.strokeDashoffset = String(lens[k]);
      el.dataset.len = String(lens[k]);
      return { el, from, to };
    });
    applyProgress(0, true);
    return true;
  }

  /** How much of the plan is on the sheet: 0 blank, 1 complete. The wash comes up as the lines close. */
  function applyProgress(p, force = false) {
    if (!force && Math.abs(p - progress) < 0.002) return;
    progress = p;
    for (const s of strokes) {
      const k = clamp((p - s.from) / Math.max(1e-6, s.to - s.from));
      s.el.style.strokeDashoffset = String(Number(s.el.dataset.len) * (1 - k));
    }
    washHost.style.opacity = String(clamp((p - 0.35) / 0.5));
  }

  // ---- The sequence: draw, rest, develop, keep ----------------------------------------------
  let seqToken = 0;
  let drawRaf = 0;
  async function present(i, { drawMs = DRAW_MS, holdMs = HOLD_MS } = {}) {
    const token = ++seqToken;
    cancelAnimationFrame(drawRaf);
    setPhase('paper');
    const ok = await loadDrawing(i);
    if (token !== seqToken || !ok) return;
    if (still()) {
      applyProgress(1, true);
      setPhase('developing');
      await wait(60);
      if (token === seqToken) setPhase('kept');
      return;
    }
    setPhase('drawing');
    await new Promise((done) => {
      const start = performance.now();
      const step = (now) => {
        if (token !== seqToken) return done();
        const k = Math.min(1, (now - start) / drawMs);
        applyProgress(ease(k));
        if (k < 1) drawRaf = requestAnimationFrame(step);
        else done();
      };
      drawRaf = requestAnimationFrame(step);
    });
    if (token !== seqToken) return;
    setPhase('held');
    await wait(holdMs);
    if (token !== seqToken) return;
    setPhase('developing');
    await wait(DEVELOP_MS);
    if (token !== seqToken) return;
    setPhase('kept');
  }

  // ---- The narrator -------------------------------------------------------------------------
  let audio = null;
  function stopVoice() {
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio = null;
      onVoice(false);
    }
    state.playing = -1;
    for (const b of section.querySelectorAll('[data-listen]')) {
      b.setAttribute('aria-pressed', 'false');
      b.querySelector('span').textContent = 'Listen';
    }
  }
  /** Read promise i and keep the sheet in time with the voice. Resolves when the line has ended. */
  function playLine(i) {
    stopVoice();
    return new Promise((resolve) => {
      const a = new Audio(VOICE(i));
      a.preload = 'auto';
      audio = a;
      state.playing = i;
      const btn = section.querySelector(`[data-listen="${i}"]`);
      btn?.setAttribute('aria-pressed', 'true');
      if (btn) btn.querySelector('span').textContent = 'Stop';
      let started = false;
      const fallBack = () => {
        if (audio === a) stopVoice();
        present(i);
        resolve();
      };
      const begin = () => {
        if (started || audio !== a) return;
        started = true;
        const d = a.duration && isFinite(a.duration) ? a.duration : 12;
        const keptAt = d * KEPT_AT[i];
        // The pen finishes a breath before "Kept"; the photograph comes up as he says it
        present(i, { drawMs: Math.max(1600, (keptAt - 0.5) * 1000), holdMs: 500 });
        a.play().then(() => onVoice(true)).catch(fallBack);
      };
      a.addEventListener('loadedmetadata', begin, { once: true });
      a.addEventListener('error', fallBack, { once: true });
      a.onended = () => {
        if (audio === a) stopVoice();
        resolve();
      };
      setTimeout(() => { if (!started && audio === a) begin(); }, 2500); // metadata that never arrives should not hang the run
    });
  }
  section.addEventListener('click', (e) => {
    const b = e.target.closest('[data-listen]');
    if (!b) return;
    const i = Number(b.dataset.listen);
    if (state.playing === i) {
      stopVoice();
      return;
    }
    if (state.auto) stopAll();
    goTo(i);
    playLine(i);
  });

  // ---- Play the five promises -----------------------------------------------------------------
  let autoRun = 0;
  function goTo(i) {
    const r = rows[i].getBoundingClientRect();
    const pr = plan.getBoundingClientRect();
    const line = pr.height > 0 ? Math.min(innerHeight * 0.5, pr.top + pr.height / 2) : innerHeight * 0.5;
    const y = scrollY + r.top + r.height / 2 - line;
    if (scrollToY) scrollToY(y);
    else scrollTo({ top: y, behavior: still() ? 'auto' : 'smooth' });
    if (state.current !== i) {
      state.current = i;
      rows.forEach((row, k) => row.classList.toggle('on', k === i));
    }
  }
  async function runAll() {
    const token = ++autoRun;
    state.auto = true;
    playAll?.setAttribute('aria-pressed', 'true');
    for (let i = 0; i < rows.length; i++) {
      if (token !== autoRun) return;
      goTo(i);
      await wait(700);
      if (token !== autoRun) return;
      await playLine(i);
      if (token !== autoRun) return;
      await wait(1100);
    }
    if (token === autoRun) stopAll();
  }
  function stopAll() {
    autoRun++;
    state.auto = false;
    stopVoice();
    playAll?.setAttribute('aria-pressed', 'false');
  }
  playAll?.addEventListener('click', () => (state.auto ? stopAll() : runAll()));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (state.auto || state.playing >= 0)) stopAll();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (state.auto || state.playing >= 0)) stopAll();
  });

  // ---- Scroll: the thread, and the current row when the reader is driving -------------------------
  let armed = false; // nothing draws until the section is near
  function onScroll() {
    const vh = innerHeight;
    const sr = section.getBoundingClientRect();
    if (sr.bottom < 0 || sr.top > vh) return;
    // The reading line is the middle of the sheet, so the current promise sits beside its plan
    const pr = plan.getBoundingClientRect();
    const line = pr.height > 0 && pr.top >= 0 && pr.bottom <= vh ? pr.top + pr.height / 2 : vh * 0.5;
    const lr = list.getBoundingClientRect();
    threadFill.style.height = `${clamp((line - lr.top) / lr.height) * 100}%`;
    if (state.auto || state.playing >= 0) return; // the voice is leading
    let best = 0;
    let bestD = Infinity;
    rows.forEach((r, i) => {
      const b = r.getBoundingClientRect();
      const d = Math.abs(b.top + b.height / 2 - line);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    // The first plan starts as the section arrives; after that the nearest row is current
    if (!armed) {
      if (sr.top > vh * 0.6) return;
      armed = true;
    }
    if (best !== state.current) {
      state.current = best;
      rows.forEach((r, i) => r.classList.toggle('on', i === best));
      present(best);
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  return {
    state,
    get progress() {
      return progress;
    },
    get strokes() {
      return strokes.length;
    },
    present,
    playLine,
    playAll: runAll,
    stop: stopAll,
  };
}
