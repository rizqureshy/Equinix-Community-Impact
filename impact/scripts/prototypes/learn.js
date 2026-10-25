// Learner experiences, sketch round 1: the page wiring for the four sketches.
// Thin on purpose: all content and scoring comes from learn-core.js. Sound
// (the browser's own voice) and the microphone start only from a click.
import {
  topics, stories, sources, getStory,
  pitchBeats, leaveBehind,
  buildDrill,
  scoreTeachBack,
  scenarios, debrief,
} from './learn-core.js';
import { copyText } from '../clipboard.js';

const $ = (id) => document.getElementById(id);
const motionOff = () => document.documentElement.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.dataset.motion = 'off';
const el = (tag, attrs = {}, ...children) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? '' : v);
  }
  n.append(...children.filter((c) => c !== null && c !== undefined));
  return n;
};
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.ceil(s)) % 60).padStart(2, '0')}`;
const RING = 2 * Math.PI * 54;
const ring = (circle, frac) => { circle.style.strokeDashoffset = String(RING * (1 - Math.max(0, Math.min(1, frac)))); };
let toastTimer;
const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200); };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window or blocked storage: progress is simply not kept */ } },
};

/** Marks the sketch in view in the header tabs. */
(() => {
  const tabs = [...document.querySelectorAll('.tabs a')];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) tabs.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${e.target.id}`));
  }, { rootMargin: '-40% 0px -50% 0px' });
  document.querySelectorAll('.sketch').forEach((s) => io.observe(s));
})();

// ---- Speech out (browser voice) and speech in (browser recognition) ----------

const speech = {
  on: false,
  voice: null,
  ready() { return 'speechSynthesis' in window; },
  pick() {
    if (!this.ready()) return null;
    const vs = speechSynthesis.getVoices();
    this.voice = vs.find((v) => /en-GB/i.test(v.lang) && /Daniel|Arthur|Serena|Kate|Google UK English Male|Google UK English Female/i.test(v.name)) || vs.find((v) => /en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
    return this.voice;
  },
  say(text) {
    if (!this.on || !this.ready()) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (!this.voice) this.pick();
    if (this.voice) u.voice = this.voice;
    u.rate = 0.96;
    u.pitch = 1;
    speechSynthesis.speak(u);
  },
  stop() { if (this.ready()) speechSynthesis.cancel(); },
};
if (speech.ready()) speechSynthesis.addEventListener?.('voiceschanged', () => speech.pick());

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

// ---- 1 Pitch mode ----------------------------------------------------------------

(() => {
  const root = document.querySelector('.pitch');
  const picks = $('pitch-topics');
  let topicId = 'care';
  let beats = [];
  let i = -1;
  let left = 0;
  let total = 90;
  let timer = null;
  let paused = false;

  const choices = [...topics.map((t) => ({ id: t.id, label: t.label })), { id: 'all', label: 'All five chapters' }];
  for (const c of choices) {
    picks.append(el('button', {
      type: 'button', class: 'chip', role: 'radio', 'aria-checked': String(c.id === topicId), 'data-topic': c.id, text: c.label,
      onclick: () => { if (root.dataset.state === 'running') return; topicId = c.id; picks.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.topic === c.id))); preview(); },
    }));
  }

  const preview = () => {
    beats = pitchBeats(topicId);
    total = beats.reduce((a, b) => a + b.seconds, 0);
    $('pitch-time').textContent = mmss(total);
    ring($('pitch-ring'), 1);
    $('pitch-kind').textContent = 'Ready';
    $('pitch-say').textContent = topicId === 'all' ? 'Five chapters, one figure each, ninety seconds.' : `${beats.length} beats on ${topics.find((t) => t.id === topicId).label.toLowerCase()}. Press Pitch.`;
    $('pitch-caveat').textContent = '';
    const list = $('pitch-beats');
    list.replaceChildren(...beats.map((b) => el('li', {}, el('span', { text: b.kind }))));
    $('pitch-leave').hidden = true;
  };

  const show = () => {
    const b = beats[i];
    $('pitch-kind').textContent = `${i + 1} of ${beats.length} · ${b.kind}`;
    const h = $('pitch-say');
    h.textContent = b.say;
    if (!motionOff()) { h.style.animation = 'none'; void h.offsetWidth; h.style.animation = ''; }
    $('pitch-caveat').textContent = b.caveat || '';
    [...$('pitch-beats').children].forEach((li, k) => { li.classList.toggle('done', k < i); li.classList.toggle('on', k === i); });
    speech.say(b.caveat ? `${b.say} ${b.caveat}` : b.say);
  };

  const tick = () => {
    if (paused) return;
    left -= 1;
    const elapsed = total - left;
    $('pitch-time').textContent = mmss(left);
    ring($('pitch-ring'), left / total);
    const boundary = beats.slice(0, i + 1).reduce((a, b) => a + b.seconds, 0);
    if (elapsed >= boundary) next();
    if (left <= 0) finish();
  };

  const next = () => {
    if (i + 1 >= beats.length) return finish();
    i += 1;
    show();
  };

  const start = () => {
    preview();
    root.dataset.state = 'running';
    i = -1; left = total; paused = false;
    $('pitch-start').hidden = true; $('pitch-pause').hidden = false; $('pitch-next').hidden = false; $('pitch-pause').textContent = 'Pause';
    picks.querySelectorAll('.chip').forEach((b) => (b.disabled = true));
    next();
    clearInterval(timer);
    timer = setInterval(tick, 1000);
  };

  const finish = () => {
    clearInterval(timer);
    speech.stop();
    root.dataset.state = 'done';
    $('pitch-start').hidden = true; $('pitch-pause').hidden = true; $('pitch-next').hidden = true;
    picks.querySelectorAll('.chip').forEach((b) => (b.disabled = false));
    [...$('pitch-beats').children].forEach((li) => { li.classList.add('done'); li.classList.remove('on'); });
    $('pitch-kind').textContent = 'Done';
    $('pitch-say').textContent = 'Ninety seconds. Here is what to leave behind.';
    $('pitch-caveat').textContent = '';
    ring($('pitch-ring'), 0);
    $('pitch-time').textContent = '0:00';
    const lb = leaveBehind(topicId);
    $('leave-title').textContent = lb.title;
    $('leave-beats').replaceChildren(...lb.beats.map((b) => el('li', {}, el('b', { text: `${b.kind}. ` }), document.createTextNode(b.say), b.caveat ? el('small', { text: b.caveat }) : null)));
    $('leave-refs').replaceChildren(...lb.refs.map((r) => el('li', {}, document.createTextNode(`${r.title}, ${r.publisher}${r.kind === 'secondary' ? ' (secondary reporting)' : ''}. `), el('a', { href: r.url, target: '_blank', rel: 'noopener', text: r.url }))));
    const leave = $('pitch-leave');
    leave.hidden = false;
    leave.dataset.text = lb.text;
    leave.scrollIntoView({ block: 'nearest', behavior: motionOff() ? 'auto' : 'smooth' });
  };

  $('pitch-start').addEventListener('click', start);
  $('pitch-again').addEventListener('click', () => { root.dataset.state = 'idle'; $('pitch-start').hidden = false; preview(); root.scrollIntoView({ block: 'start', behavior: motionOff() ? 'auto' : 'smooth' }); });
  $('pitch-pause').addEventListener('click', () => { paused = !paused; $('pitch-pause').textContent = paused ? 'Resume' : 'Pause'; if (paused) speech.stop(); else show(); });
  $('pitch-next').addEventListener('click', () => { const boundary = beats.slice(0, i + 1).reduce((a, b) => a + b.seconds, 0); left = total - boundary; next(); $('pitch-time').textContent = mmss(left); ring($('pitch-ring'), left / total); });
  $('pitch-hear').addEventListener('click', (e) => {
    if (!speech.ready()) return toast('This browser has no voice to read with.');
    speech.on = !speech.on;
    e.currentTarget.setAttribute('aria-pressed', String(speech.on));
    if (!speech.on) speech.stop();
    else if (root.dataset.state === 'running' && i >= 0) show();
    else speech.say('Pitch mode. Pick a chapter and press Pitch.');
  });
  $('leave-copy').addEventListener('click', async () => toast((await copyText($('pitch-leave').dataset.text || '')) ? 'Copied' : 'Copy failed. Select the text instead.'));
  $('leave-print').addEventListener('click', () => window.print());
  preview();
})();

// ---- 2 Scope check ---------------------------------------------------------------

(() => {
  const root = document.querySelector('.drill');
  let deck = [];
  let card = null;
  let step = 0;
  let correct = 0;
  let streak = 0;
  let best = store.get('learn.drill.best', 0);
  let wrongThisCard = false;
  const paint = () => {
    $('drill-score').textContent = String(correct);
    $('drill-streak').textContent = String(streak);
    $('drill-left').textContent = String(deck.length + (card ? 1 : 0));
    $('drill-best').textContent = String(best);
  };

  const deal = () => {
    deck = buildDrill(Math.random, 5);
    correct = 0; streak = 0; card = null;
    root.dataset.state = 'running';
    $('drill-start').hidden = true;
    nextCard();
  };

  const nextCard = () => {
    $('drill-continue').hidden = true;
    card = deck.shift() || null;
    step = 0; wrongThisCard = false;
    if (!card) return done();
    $('drill-story').textContent = `${card.organisation} · ${card.title}`;
    $('drill-metric').replaceChildren(...card.metric.split(/([^0-9.,]+)/).filter(Boolean).map((part) => /^[0-9.,]+$/.test(part) ? document.createTextNode(part) : el('span', { class: 'mark', text: part })));
    $('drill-label').textContent = card.label;
    $('drill-verdict').textContent = '';
    paint();
    askStep();
  };

  const askStep = () => {
    const st = card.steps[step];
    $('drill-ask').textContent = st.ask;
    $('drill-options').replaceChildren(...st.options.map((o) => el('button', { type: 'button', class: 'opt', text: o, onclick: (e) => answer(e.currentTarget, o, st) })));
    $('drill-verdict').textContent = '';
  };

  const answer = (btn, chosen, st) => {
    const right = chosen === st.answer;
    [...$('drill-options').children].forEach((b) => { b.disabled = true; if (b.textContent === st.answer) b.dataset.mark = 'right'; });
    if (!right) btn.dataset.mark = 'wrong';
    if (right) { correct += 1; streak += 1; best = Math.max(best, streak); store.set('learn.drill.best', best); }
    else { streak = 0; wrongThisCard = true; }
    paint();
    const v = $('drill-verdict');
    v.replaceChildren(el('b', { text: right ? 'Yes. ' : 'No. ' }), document.createTextNode(right ? `That ${st.key} belongs to this figure.` : `The ${st.key} that travels with ${card.metric} is highlighted. This card comes back.`));
    setTimeout(() => {
      step += 1;
      if (step < card.steps.length) return askStep();
      if (wrongThisCard) deck.push({ ...card, steps: card.steps.map((s) => ({ ...s, options: s.options.slice().sort(() => Math.random() - 0.5) })) });
      $('drill-continue').hidden = false;
      $('drill-continue').focus();
    }, motionOff() ? 400 : 900);
  };

  const done = () => {
    root.dataset.state = 'done';
    $('drill-story').textContent = 'Set complete';
    $('drill-metric').textContent = `${correct}`;
    $('drill-label').textContent = 'answers right across the set';
    $('drill-ask').textContent = correct >= 15 ? 'Every figure travelled with its scope, period and source.' : 'The cards you missed came back until you had them. Deal again tomorrow.';
    $('drill-options').replaceChildren();
    $('drill-verdict').textContent = '';
    $('drill-start').hidden = false;
    $('drill-start').textContent = 'Deal again';
    paint();
  };

  $('drill-start').addEventListener('click', deal);
  $('drill-continue').addEventListener('click', nextCard);
  $('drill-story').textContent = '';
  $('drill-ask').textContent = 'Deal five cards to begin.';
  paint();
})();

// ---- 3 Teach-back ----------------------------------------------------------------

(() => {
  const root = document.querySelector('.teach');
  const sel = $('teach-story');
  const text = $('teach-text');
  const LIMIT = 60;
  let left = LIMIT;
  let timer = null;
  let startedAt = 0;
  let rec = null;
  let finalText = '';

  for (const s of stories) sel.append(el('option', { value: s.id, text: `${s.organisation}: ${s.title}` }));
  sel.value = 'pa10-heat';

  const brief = () => {
    const s = getStory(sel.value);
    const pubs = [...new Set(s.sources.map((id) => sources[id].publisher))].join(' or ');
    $('teach-brief').replaceChildren(
      el('p', {}, el('b', { text: 'Tell it in sixty seconds. ' }), document.createTextNode(s.summary)),
      el('p', {}, el('b', { text: 'Make sure it carries: ' }), document.createTextNode(s.metric ? `who (${s.organisation}), the figure (${s.metric} ${s.metricLabel}), its scope or period, a source (${pubs}), and where Equinix sits.` : `who (${s.organisation}), the specifics the source gives, a source (${pubs}), where Equinix sits, and no figure the source does not give.`)),
    );
  };

  const paintTime = () => { $('teach-time').textContent = mmss(left); ring($('teach-ring'), left / LIMIT); };

  const start = () => {
    finalText = '';
    text.value = '';
    $('teach-result').hidden = true;
    left = LIMIT; paintTime();
    startedAt = Date.now();
    root.dataset.state = 'listening';
    $('teach-start').hidden = true; $('teach-stop').hidden = false; $('teach-reset').hidden = true;
    sel.disabled = true;
    if (Recognition) {
      try {
        rec = new Recognition();
        rec.lang = 'en-GB'; rec.continuous = true; rec.interimResults = true;
        rec.onresult = (e) => {
          let interim = '';
          for (let k = e.resultIndex; k < e.results.length; k++) {
            const r = e.results[k];
            if (r.isFinal) finalText += `${r[0].transcript} `; else interim += r[0].transcript;
          }
          text.value = `${finalText}${interim}`.replace(/\s+/g, ' ');
        };
        rec.onerror = (e) => { $('teach-note').textContent = e.error === 'not-allowed' ? 'Microphone not allowed. Type instead.' : 'Listening stopped. Type instead, or press Done.'; rec = null; text.focus(); };
        rec.onend = () => { if (root.dataset.state === 'listening' && rec) { try { rec.start(); } catch { /* already started */ } } };
        rec.start();
        $('teach-note').textContent = 'Listening. Speak, or type if you prefer. Press Done when finished.';
      } catch { rec = null; $('teach-note').textContent = 'Type your teach-back, then press Done.'; text.focus(); }
    } else {
      $('teach-note').textContent = 'This browser cannot listen. Type your teach-back, then press Done.';
      text.focus();
    }
    clearInterval(timer);
    timer = setInterval(() => { left -= 1; paintTime(); if (left <= 0) stop(); }, 1000);
  };

  const stop = () => {
    clearInterval(timer);
    const seconds = Math.min(LIMIT, Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
    if (rec) { const r = rec; rec = null; try { r.stop(); } catch { /* already stopped */ } }
    root.dataset.state = 'scored';
    $('teach-stop').hidden = true; $('teach-reset').hidden = false;
    sel.disabled = false;
    const res = scoreTeachBack(sel.value, text.value, seconds);
    $('teach-score').textContent = `${res.score} of ${res.outOf}`;
    $('teach-pace').textContent = res.words ? `${res.words} words in ${seconds}s${res.pace ? `, about ${res.pace} words a minute` : ''}` : 'Nothing heard or typed.';
    $('teach-checks').replaceChildren(...res.checks.map((c) => el('li', { class: c.ok ? 'ok' : '' }, el('span', {}, document.createTextNode(c.label), c.ok ? null : el('small', { text: c.hint })))));
    $('teach-flags').replaceChildren(...res.flags.map((f) => el('li', { text: f })));
    $('fb-landed').textContent = res.feedback.landed;
    $('fb-tighten').textContent = res.feedback.tighten;
    $('fb-caveat').textContent = res.feedback.caveat;
    $('teach-result').hidden = false;
    $('teach-note').textContent = '';
  };

  const reset = () => { root.dataset.state = 'idle'; $('teach-start').hidden = false; $('teach-reset').hidden = true; $('teach-result').hidden = true; text.value = ''; left = LIMIT; paintTime(); $('teach-note').textContent = ''; };

  sel.addEventListener('change', () => { brief(); reset(); });
  $('teach-start').addEventListener('click', start);
  $('teach-stop').addEventListener('click', stop);
  $('teach-reset').addEventListener('click', reset);
  text.addEventListener('input', () => { if (root.dataset.state === 'listening' && !rec) finalText = text.value; });
  brief(); paintTime();
  $('teach-note').textContent = Recognition ? 'This browser can listen. The microphone is used only after you press Start.' : 'This browser cannot listen, so you will type. Chrome and Edge can transcribe.';
})();

// ---- 4 Choose the reply ---------------------------------------------------------

(() => {
  const root = document.querySelector('.reply');
  const people = $('reply-people');
  const chat = $('reply-chat');
  const choices = $('reply-choices');
  let sc = null;
  let turn = 0;
  let picks = [];

  for (const s of scenarios) {
    people.append(el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': 'false', 'data-id': s.id, text: s.who, onclick: () => begin(s.id) }));
  }

  const bubble = (cls, who, body, extra = {}) => el('div', { class: `bubble ${cls}`, ...extra }, who ? el('span', { class: 'who', text: who }) : null, typeof body === 'string' ? document.createTextNode(body) : body);

  const begin = (id) => {
    sc = scenarios.find((s) => s.id === id);
    turn = 0; picks = [];
    people.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === id)));
    root.dataset.state = 'running';
    $('reply-debrief').hidden = true;
    chat.replaceChildren();
    ask();
  };

  const ask = () => {
    const t = sc.turns[turn];
    const prev = turn > 0 ? sc.turns[turn - 1].replies[picks[turn - 1]].reaction : '';
    if (!prev.toLowerCase().includes(t.line.toLowerCase())) chat.append(bubble('them', sc.who, t.line));
    const order = t.replies.map((r, i) => i).sort(() => Math.random() - 0.5);
    choices.replaceChildren(el('p', { class: 'kicker', text: 'Your reply' }), ...order.map((i) => el('button', { type: 'button', class: 'opt', text: t.replies[i].text, onclick: () => choose(i) })));
    chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: motionOff() ? 'auto' : 'smooth' });
  };

  const choose = (i) => {
    const r = sc.turns[turn].replies[i];
    picks.push(i);
    choices.replaceChildren();
    chat.append(bubble('you', 'You', r.text));
    const label = { best: 'Landed', ok: 'Half way', weak: 'Missed' }[r.grade];
    const after = () => {
      chat.append(bubble('them', sc.who, r.reaction));
      chat.append(bubble('noted', null, el('span', {}, el('b', { text: `${label}. ` }), document.createTextNode(r.note)), { 'data-grade': r.grade }));
      chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: motionOff() ? 'auto' : 'smooth' });
      turn += 1;
      setTimeout(() => (turn < sc.turns.length ? ask() : end()), motionOff() ? 0 : 500);
    };
    setTimeout(after, motionOff() ? 0 : 600);
  };

  const end = () => {
    const d = debrief(sc.id, picks);
    root.dataset.state = 'done';
    $('debrief-points').textContent = `${d.points} of ${d.max}`;
    $('debrief-verdict').textContent = d.verdict;
    $('debrief-rows').replaceChildren(...d.rows.map((r) => el('li', { 'data-grade': r.grade }, el('b', { text: `Turn ${r.turn}, ${{ best: 'landed', ok: 'half way', weak: 'missed' }[r.grade]}. ` }), document.createTextNode(r.note))));
    const dl = $('reply-debrief');
    dl.hidden = false;
    dl.scrollIntoView({ block: 'nearest', behavior: motionOff() ? 'auto' : 'smooth' });
  };

  $('reply-again').addEventListener('click', () => begin(sc.id));
  chat.textContent = 'Choose who you are talking to.';
})();

window.__learn = { pitchBeats, buildDrill, scoreTeachBack, scenarios, debrief };
