// Public Sector Sales AI Activation Program: page wiring.
// Renders everything from program.js; remembers cohort, build path and
// progress in this browser only. Routes: #/activity/<id>, #/week/<n>.
import { program, audiences, heard, paths, weeks, activities, materials, keyDates, rhythm } from './program.js';

/* ---- Utilities ------------------------------------------------------------ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const daysBetween = (a, b) => Math.round((parseDate(key(b)) - parseDate(key(a))) / 86400000);
const fmt = (s, opts = { weekday: 'long', month: 'long', day: 'numeric' }) => parseDate(s).toLocaleDateString('en-US', opts);
const fmtShort = (s) => fmt(s, { month: 'short', day: 'numeric' });
const fmtDow = (s) => fmt(s, { weekday: 'short' });
const range = (a, b) => `${fmt(a, { month: 'long', day: 'numeric' })} to ${fmt(b, { month: parseDate(a).getMonth() === parseDate(b).getMonth() ? undefined : 'long', day: 'numeric' })}`;

const store = {
  get(k, fallback = null) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

/** Today, or the date given as ?date=YYYY-MM-DD for previews and tests. */
function today() {
  const q = new URLSearchParams(location.search).get('date');
  return /^\d{4}-\d{2}-\d{2}$/.test(q || '') ? parseDate(q) : new Date();
}
const TODAY = today();
const TODAY_KEY = key(TODAY);

const byId = Object.fromEntries(activities.map((a) => [a.id, a]));
const weekOf = (a) => weeks.find((w) => w.num === a.week);
const dayIndex = (a) => activities.indexOf(a) + 1;
const inWeek = (w) => activities.filter((a) => a.week === w.num);

/* ---- State ---------------------------------------------------------------- */
const state = {
  cohort: store.get('psaa-cohort', null),
  path: store.get('psaa-path', null),
  done: new Set(store.get('psaa-done', [])),
  week: null,
  open: null,
};
const audience = () => audiences.find((a) => a.id === state.cohort) || null;
const pathName = () => (paths.find((p) => p.id === state.path) || {}).name || null;

/* ---- Toast and copy ------------------------------------------------------- */
let toastTimer;
function toast(msg, error = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('is-error', error);
  t.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2400);
}
async function copyText(text, after) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied. Paste it where you need it.');
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (ok) { toast('Copied. Paste it where you need it.'); return true; }
    } catch { /* fall through */ }
    toast('Copy was blocked. Select the text below and copy it.', true);
    if (after && !after.nextElementSibling?.classList.contains('manual-copy')) {
      const ta = document.createElement('textarea');
      ta.className = 'manual-copy';
      ta.rows = 5;
      ta.value = text;
      ta.setAttribute('aria-label', 'Text to copy manually');
      after.insertAdjacentElement('afterend', ta);
      ta.focus();
      ta.select();
    }
    return false;
  }
}

/* ---- Program status ------------------------------------------------------- */
function status() {
  const start = parseDate(program.start);
  const end = parseDate(program.end);
  const bStart = parseDate(program.breakStart);
  const bEnd = parseDate(program.breakEnd);
  const todayAct = activities.find((a) => a.date === TODAY_KEY);
  const next = activities.find((a) => parseDate(a.date) > TODAY);
  if (todayAct) return { kind: 'today', activity: todayAct, next };
  if (TODAY < start) return { kind: 'before', days: daysBetween(TODAY, start), next: activities[0] };
  if (TODAY >= bStart && TODAY <= bEnd) return { kind: 'break', next, resume: program.breakEnd };
  if (TODAY > end) return { kind: 'after' };
  return { kind: 'between', next };
}

/* ---- Rendering: hero and today ------------------------------------------- */
function renderHero() {
  $('#hero-lede').textContent = program.summary;
  $('#hero-stats').innerHTML = [
    ['4', 'weeks, with a break for Thanksgiving'],
    ['20', 'short activities, one a day'],
    ['15 to 20', 'minutes each, then a short share'],
    [`${fmtShort(program.start)} to ${fmtShort(program.end)}`, '2026, US cohort'],
  ].map(([n, l]) => `<div class="stat"><div class="stat-n">${esc(n)}</div><div class="stat-l">${esc(l)}</div></div>`).join('');
  $('#program-cohort').textContent = program.cohort;
}

function renderCohortPicker() {
  const picker = $('#cohort-picker');
  picker.innerHTML = audiences.map((a) => `<button type="button" role="radio" aria-checked="${state.cohort === a.id}" data-cohort="${a.id}">${esc(a.short)}</button>`).join('');
  const aud = audience();
  $('#cohort-context').textContent = aud ? aud.context : 'Choose a context to tailor the examples. Without one, every guide shows all four.';
}

function renderProgress() {
  const n = state.done.size;
  const pct = Math.round((n / activities.length) * 100);
  const card = $('#progress-card');
  card.innerHTML = `
    <div class="progress-head">
      <div>
        <h2 class="side-title">Your progress</h2>
        <p class="muted small">${n === 0 ? 'Mark an activity done from its guide.' : n === activities.length ? 'All twenty done. Well played.' : `${esc(String(n))} of ${activities.length} activities done.`}</p>
      </div>
      <div class="progress-ring" style="--p:${pct}" role="img" aria-label="${pct} percent complete"><b>${pct}%</b></div>
    </div>
    <div class="progress-weeks">
      ${weeks.map((w) => { const acts = inWeek(w); const d = acts.filter((a) => state.done.has(a.id)).length; return `<div class="progress-week" style="--accent:${w.accent}"><span>Week ${w.num} <b>${d}/${acts.length}</b></span><span class="bar"><i style="--w:${(d / acts.length) * 100}"></i></span></div>`; }).join('')}
    </div>
    <div class="actions">
      <button type="button" class="btn btn--ghost btn--small" data-copy-progress>Copy my progress</button>
      ${n ? '<button type="button" class="btn btn--link btn--small" data-reset-progress>Reset</button>' : ''}
    </div>`;
}

function progressText() {
  const perWeek = weeks.map((w) => { const acts = inWeek(w); return `Week ${w.num}: ${acts.filter((a) => state.done.has(a.id)).length}/${acts.length}`; }).join(', ');
  return `${program.short}: ${state.done.size} of ${activities.length} activities done. ${perWeek}.`;
}

function renderToday() {
  const s = status();
  const card = $('#today-card');
  const open = (a, label) => `<button type="button" class="btn btn--primary btn--large" data-open="${a.id}">${label}</button>`;
  const meta = (a) => `<div class="today-meta"><span>${esc(fmt(a.date))}</span><span>${esc(program.minutes)}</span><span>AI skill: ${esc(a.skill.replace(/\.$/, ''))}</span></div>`;
  if (s.kind === 'today') {
    const a = s.activity;
    const w = weekOf(a);
    const done = state.done.has(a.id);
    card.style.setProperty('--accent', w.accent);
    card.innerHTML = `
      <div class="today-kicker"><span class="dot"></span>Today, Week ${w.num}, Day ${dayIndex(a)} of 20${done ? ', done' : ''}</div>
      <h2 class="today-title" id="today-title">${esc(a.title)}</h2>
      <p class="today-hook">${esc(a.hook)}</p>
      ${meta(a)}
      <div class="actions">${open(a, done ? 'Open the guide again' : 'Start the activity')}${w.videos.length ? `<a class="btn btn--ghost btn--large" href="#learn-w${w.num}">Watch first</a>` : ''}</div>`;
    return;
  }
  if (s.kind === 'before') {
    const a = s.next;
    card.style.setProperty('--accent', weekOf(a).accent);
    card.innerHTML = `
      <div class="today-kicker"><span class="dot"></span>Starts ${esc(fmt(program.start))}</div>
      <div class="countdown"><div><b>${s.days}</b><span>day${s.days === 1 ? '' : 's'} to go</span></div></div>
      <h2 class="today-title" id="today-title">Day 1 is ${esc(a.title)}.</h2>
      <p class="today-hook">${esc(a.hook)} Choose your cohort, add the program to your calendar, and watch the Week 1 videos when they land.</p>
      <div class="actions">${open(a, 'Preview Day 1')}<button type="button" class="btn btn--ghost btn--large" data-ics>Add to calendar</button></div>`;
    return;
  }
  if (s.kind === 'break') {
    const a = s.next;
    card.style.setProperty('--accent', '#e09a3c');
    card.innerHTML = `
      <div class="today-kicker"><span class="dot"></span>Thanksgiving week</div>
      <h2 class="today-title" id="today-title">No activities this week.</h2>
      <p class="today-hook">The program resumes ${esc(fmt(a.date))} with ${esc(a.title)}. If you have your Week 2 brief and source list saved, you are ready.</p>
      <div class="actions">${open(a, 'Preview Week 3, Day 1')}<a class="btn btn--ghost btn--large" href="#/week/2">Catch up on Week 2</a></div>`;
    return;
  }
  if (s.kind === 'after') {
    card.style.setProperty('--accent', weeks[3].accent);
    card.innerHTML = `
      <div class="today-kicker"><span class="dot"></span>Program complete</div>
      <h2 class="today-title" id="today-title">Twenty activities. One forward looking review.</h2>
      <p class="today-hook">${esc(progressText())} The guides stay here for reuse: the prompts, the lenses and the share templates.</p>
      <div class="actions">${open(activities[activities.length - 1], 'Reopen the business review')}<a class="btn btn--ghost btn--large" href="#weeks">Browse the weeks</a></div>`;
    return;
  }
  const a = s.next;
  const w = weekOf(a);
  card.style.setProperty('--accent', w.accent);
  const d = daysBetween(TODAY, parseDate(a.date));
  card.innerHTML = `
    <div class="today-kicker"><span class="dot"></span>Next up, ${d === 1 ? 'tomorrow' : esc(fmtDow(a.date))}</div>
    <h2 class="today-title" id="today-title">${esc(a.title)}</h2>
    <p class="today-hook">${esc(a.hook)}</p>
    ${meta(a)}
    <div class="actions">${open(a, 'Preview the guide')}${w.videos.length ? `<a class="btn btn--ghost btn--large" href="#learn-w${w.num}">Watch first</a>` : ''}</div>`;
}

/* ---- Rendering: program ---------------------------------------------------- */
function renderProgram() {
  $('#heard').innerHTML = heard.map((h) => `
    <div class="heard-row" data-reveal>
      <b>${esc(h.heard)}</b>
      <p>${esc(h.response)}</p>
      <div class="heard-weeks" aria-label="Weeks ${h.weeks.join(', ')}">${h.weeks.map((n) => `<span class="wk" style="background:${weeks[n - 1].accent}">${n}</span>`).join('')}</div>
    </div>`).join('');

  const items = [];
  for (const w of weeks) {
    if (w.num === 3) items.push(`<div class="journey-week journey-week--break" data-reveal><span class="kicker">Break</span><h3>Thanksgiving week</h3><span class="jw-dates">${esc(range(program.breakStart, program.breakEnd))}</span><span class="note">No scheduled activities or coaching.</span></div>`);
    const acts = inWeek(w);
    const done = acts.filter((a) => state.done.has(a.id)).length;
    const current = TODAY >= parseDate(w.start) && TODAY <= parseDate(w.end);
    items.push(`<a class="journey-week" href="#/week/${w.num}" style="--accent:${w.accent}" data-reveal>
      <span class="kicker">Week ${w.num}</span>
      <h3>${esc(w.name)}</h3>
      <span class="jw-dates">${esc(range(w.start, w.end))}</span>
      <span class="state">${current ? 'This week' : done ? `${done} of ${acts.length} done` : TODAY > parseDate(w.end) ? 'Past' : 'Ahead'}</span>
    </a>`);
  }
  $('#journey').innerHTML = items.join('');
  $('#rhythm').innerHTML = rhythm.map((r) => `<div class="rhythm-item" data-reveal><h3>${esc(r.label)}</h3><p>${esc(r.text)}</p></div>`).join('');
  $('#data-rule').innerHTML = `<span class="rule-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 7V5a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor"/></svg></span><p><b>Data and quality rule for every activity.</b> ${esc(program.dataRule)}</p>`;
}

/* ---- Rendering: weeks ------------------------------------------------------ */
function renderWeekTabs() {
  $('#week-tabs').innerHTML = weeks.map((w) => {
    const done = inWeek(w).filter((a) => state.done.has(a.id)).length;
    return `<button type="button" role="tab" class="tab" id="tab-${w.num}" aria-selected="${state.week === w.num}" aria-controls="panel-${w.num}" data-week="${w.num}"><span class="tab-num">W${w.num}</span>${esc(w.name)}<span class="tab-done" aria-label="${done} of 5 done">${done}/5</span></button>`;
  }).join('');
}

function videoHTML(v, w) {
  const frame = v.youtubeId
    ? `<div class="video-frame" data-video="${esc(v.youtubeId)}"><img src="https://i.ytimg.com/vi/${esc(v.youtubeId)}/hqdefault.jpg" alt="" loading="lazy" /><button type="button" class="video-play" aria-label="Play ${esc(v.title)}"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3l10 6-10 6z" fill="currentColor"/></svg></button></div>`
    : `<div class="video-frame"><div class="pending"><b>Video coming</b><span>Link to be added before Week ${w.num}</span></div></div>`;
  return `<article class="video" id="video-${esc(v.id)}">${frame}<h4>${esc(v.title)}</h4><p>${esc(v.about)}</p><div class="meta"><span>Week ${w.num}</span><span>${v.minutes} min</span></div></article>`;
}

function renderWeekPanels() {
  $('#week-panels').innerHTML = weeks.map((w) => {
    const acts = inWeek(w);
    return `<section class="panel${state.week === w.num ? ' is-active' : ''}" id="panel-${w.num}" role="tabpanel" aria-labelledby="tab-${w.num}" style="--accent:${w.accent}">
      <div class="week-head">
        <div>
          <p class="kicker">Week ${w.num}, ${esc(range(w.start, w.end))}</p>
          <h3>${esc(w.name)}</h3>
          <div class="week-verbs">${w.verbs.map((v) => `<span class="chip">${esc(v)}</span>`).join('')}</div>
        </div>
        <div class="week-outcome"><p class="kicker">Week outcome</p><p>${esc(w.outcome)}</p></div>
      </div>
      <div class="days">
        ${acts.map((a) => {
          const done = state.done.has(a.id);
          return `<button type="button" class="day${a.date === TODAY_KEY ? ' is-today' : ''}${done ? ' is-done' : ''}" data-open="${a.id}" aria-label="Open ${esc(a.title)}, ${esc(fmt(a.date))}${done ? ', done' : ''}">
            <span class="done-mark" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            <span class="day-top"><span>${esc(fmtDow(a.date))}</span><span class="day-date">${esc(fmtShort(a.date))}${a.date === TODAY_KEY ? ', today' : ''}</span></span>
            <h4>${esc(a.title)}</h4>
            <p class="day-hook">${esc(a.hook)}</p>
            <span class="day-foot"><span>${esc(a.skill.replace(/\.$/, ''))}</span><span class="open">Guide</span></span>
          </button>`;
        }).join('')}
      </div>
      <div class="week-foot">
        <div class="week-note"><p class="kicker">Coaching focus</p><p>${esc(w.coaching)}</p></div>
        ${w.note || w.carry || w.scope ? `<div class="week-note"><p class="kicker">${w.note ? 'Calendar note' : w.carry ? 'Carry forward' : 'Scope'}</p><p>${esc(w.note || w.carry || w.scope)}</p></div>` : ''}
      </div>
      ${w.videos.length ? `<div class="watch"><p class="kicker">Watch this week</p><div class="videos">${w.videos.map((v) => videoHTML(v, w)).join('')}</div></div>` : ''}
    </section>`;
  }).join('');
}

function selectWeek(n, { scroll = false } = {}) {
  state.week = n;
  $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(Number(t.dataset.week) === n)));
  $$('.panel').forEach((p) => p.classList.toggle('is-active', p.id === `panel-${n}`));
  if (scroll) $('#weeks').scrollIntoView({ block: 'start' });
}

/* ---- Rendering: learn, share, materials, dates --------------------------- */
function renderLearn() {
  $('#learn-grid').innerHTML = weeks.map((w) => `<div class="learn-week" id="learn-w${w.num}" style="--accent:${w.accent}" data-reveal><p class="kicker">Week ${w.num}, ${esc(w.name)}</p><div class="videos">${w.videos.map((v) => videoHTML(v, w)).join('')}</div></div>`).join('');
}

function renderEngage() {
  const e = program.engage;
  const feed = e.embed
    ? `<div class="engage-frame"><iframe name="embed-feed" title="Viva Engage" src="${esc(e.embed)}" loading="lazy"></iframe></div>`
    : `<div class="engage-frame engage-pending"><p class="kicker">Viva Engage</p><h3>The cohort community is being set up.</h3><p>The ${esc(e.name)} feed will appear here. Until then, open Viva Engage directly and post your shares in the cohort community.</p><a class="btn btn--primary" href="${esc(e.url)}" target="_blank" rel="noopener">Open Viva Engage<span class="visually-hidden"> (opens in a new tab)</span></a></div>`;
  $('#engage').innerHTML = `<div class="engage-grid">${feed}
    <div class="engage-side">
      <div class="side-card"><h3 class="side-title">What a good share looks like</h3><ol><li>Lead with the day and the activity name, so others can find it.</li><li>Post the thing the guide asks for, not the whole chat.</li><li>Say what changed your thinking in one line.</li><li>Name an unknown or a claim you corrected. That is the most useful part for the cohort.</li><li>Practice material only. Internal data stays in approved environments.</li></ol></div>
      <div class="side-card"><h3 class="side-title">Review someone else&rsquo;s share</h3><p class="muted small">Once a week, reply to a colleague from another cohort context. Ask one question their sources cannot answer. The coaching sessions pick up the best threads.</p></div>
    </div></div>`;
}

function renderMaterials() {
  $('#materials-list').innerHTML = materials.map((m) => `<li class="resource">
    <span class="resource-type">${esc(m.type)}</span>
    <span class="resource-name">${esc(m.name)}</span>
    <span class="resource-meta">${esc(m.meta)}</span>
    <span class="resource-weeks" aria-label="Used in weeks ${m.weeks.join(', ')}">${m.weeks.map((n) => `<span class="wk">${n}</span>`).join('')}</span>
    <span class="resource-state${m.url ? ' resource-state--live' : ''}">${m.url ? `<a href="${esc(m.url)}">Open</a>` : esc(m.state)}</span>
  </li>`).join('');
}

function renderTimeline() {
  const next = keyDates.find((k) => parseDate(k.date) >= TODAY);
  $('#timeline').innerHTML = keyDates.map((k) => `<li class="${parseDate(k.date) < TODAY ? 'is-past' : ''}${k === next ? ' is-next' : ''}"><div class="tl-date">${esc(fmt(k.date, { month: 'long', day: 'numeric' }))}<span>${esc(fmtDow(k.date))}${k === next ? ', next' : ''}</span></div><div><b>${esc(k.label)}</b><p>${esc(k.detail)}</p></div></li>`).join('');
}

/* ---- Calendar file --------------------------------------------------------- */
function icsText() {
  const base = location.href.split('#')[0].split('?')[0];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const fold = (s) => s.replace(/\r?\n/g, '\\n').replace(/,/g, '\\,');
  const events = activities.map((a) => {
    const d = parseDate(a.date);
    return [
      'BEGIN:VEVENT',
      `UID:psaa-${a.id}@equinix`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${a.date.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${key(addDays(d, 1)).replace(/-/g, '')}`,
      `SUMMARY:AI Activation Day ${dayIndex(a)}: ${fold(a.title)}`,
      `DESCRIPTION:${fold(`${a.hook}\n\n${a.brief}\n\nShare: ${a.share}\n\nGuide: ${base}#/activity/${a.id}`)}`,
      `URL:${base}#/activity/${a.id}`,
      'END:VEVENT',
    ].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Equinix GTM Enablement//Public Sector AI Activation//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${program.short}`, ...events, 'END:VCALENDAR'].join('\r\n');
}
function downloadIcs() {
  const blob = new Blob([icsText()], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'public-sector-ai-activation.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Calendar file downloaded: twenty all day entries, one per activity.');
}

/* ---- Activity drawer ------------------------------------------------------- */
const drawer = $('#activity-drawer');
const content = $('#drawer-content');
let timer = { id: null, elapsed: 0, running: false };

const promptFor = (a) => {
  let p = a.prompt;
  if (a.paths && pathName()) p = p.replace(/\{agent \/ app \/ dashboard\}/g, pathName().toLowerCase());
  return p;
};
const highlight = (text) => esc(text).replace(/\{([^}]+)\}/g, '<mark>{$1}</mark>');

function renderDrawer(a) {
  const w = weekOf(a);
  const i = activities.indexOf(a);
  const prev = activities[i - 1];
  const next = activities[i + 1];
  const done = state.done.has(a.id);
  const aud = audience();
  const total = a.steps.reduce((s, x) => s + x.min, 0);
  drawer.style.setProperty('--accent', w.accent);
  drawer.style.setProperty('--drawer-progress', `${((i + 1) / activities.length) * 100}%`);
  content.innerHTML = `
    <p class="act-kicker"><span>Week ${w.num}, Day ${i + 1} of 20</span><span class="when">${esc(fmt(a.date))}${a.date === TODAY_KEY ? ', today' : ''}</span>${done ? '<span class="when">Done</span>' : ''}</p>
    <h2 class="act-title" id="drawer-title">${esc(a.title)}</h2>
    <p class="act-hook">${esc(a.hook)}</p>
    <div class="act-actions">
      <button type="button" class="btn ${done ? 'btn--ghost' : 'btn--primary'}" data-toggle-done="${a.id}" aria-pressed="${done}">${done ? 'Marked done' : 'Mark as done'}</button>
      <button type="button" class="btn btn--ghost" data-copy-link="${a.id}">Copy link</button>
      ${w.videos.length ? `<a class="btn btn--link" href="#learn-w${w.num}" data-close-first>Watch this week&rsquo;s videos</a>` : ''}
    </div>
    <div class="act-body">
      <section><h3>Why it matters</h3><div class="act-why"><p>${esc(a.why)}</p></div></section>
      <section><h3>The brief</h3><p class="act-brief">${esc(a.brief)}</p>${a.note ? `<p class="note" style="margin-top:8px">${esc(a.note)}</p>` : ''}</section>
      ${a.paths ? `<section><h3>Your build path</h3><div class="paths"><div class="segmented segmented--row" role="radiogroup" aria-label="Build path">${paths.map((p) => `<button type="button" role="radio" aria-checked="${state.path === p.id}" data-path="${p.id}">${esc(p.name)}</button>`).join('')}</div><p class="path-text" id="path-text">${esc(state.path ? a.byPath[state.path] : 'Choose the path you are building on: ' + paths.map((p) => `${p.name.toLowerCase()}, ${p.what.charAt(0).toLowerCase()}${p.what.slice(1, -1)}`).join('; ') + '.')}</p></div></section>` : ''}
      <section>
        <h3>Steps <span class="n">${total} min</span></h3>
        <ol class="steps" id="steps">${a.steps.map((s, k) => `<li class="step" data-step="${k}"><span class="num">${k + 1}</span><span>${esc(s.text)}</span><span class="min">${s.min} min</span></li>`).join('')}</ol>
        <div class="timer" id="timer">
          <button type="button" class="btn btn--primary btn--small" data-timer="toggle">Start the ${total} minute timer</button>
          <b aria-live="off">00:00</b>
          <button type="button" class="btn btn--ghost btn--small" data-timer="reset">Reset</button>
          <span class="note">The current step is highlighted as you go.</span>
        </div>
      </section>
      <section>
        <h3>Starter prompt</h3>
        <pre class="prompt" id="prompt-text">${highlight(promptFor(a))}</pre>
        <div class="prompt-foot"><button type="button" class="btn btn--ghost btn--small" data-copy-prompt>Copy prompt</button><span class="note">Replace the <mark style="background:#f0f0f3;padding:0 4px;border-radius:4px">{highlighted}</mark> parts with your own account details.</span></div>
      </section>
      <section>
        <h3>Your cohort lens</h3>
        <div class="lens">
          <div class="segmented" role="radiogroup" aria-label="Cohort context">${audiences.map((x) => `<button type="button" role="radio" aria-checked="${state.cohort === x.id}" data-cohort="${x.id}">${esc(x.short)}</button>`).join('')}</div>
          <div id="lens-text">${aud ? `<p>${esc(a.lenses[aud.id])}</p>` : `<dl class="lens-all">${audiences.map((x) => `<div><dt>${esc(x.name)}</dt><dd>${esc(a.lenses[x.id])}</dd></div>`).join('')}</dl>`}</div>
        </div>
      </section>
      <section>
        <h3>Share on Viva Engage</h3>
        <div class="share-box">
          <p class="lead">${esc(a.share)}</p>
          <pre id="share-text">${highlight(a.shareTemplate)}</pre>
          <div class="prompt-foot"><button type="button" class="btn btn--ghost btn--small" data-copy-share>Copy share template</button><a class="btn btn--link btn--small" href="${esc(program.engage.url)}" target="_blank" rel="noopener">Open Viva Engage<span class="visually-hidden"> (opens in a new tab)</span></a></div>
        </div>
      </section>
      <section class="act-split">
        <div><h3>The AI skill it teaches</h3><p>${esc(a.skill)}</p></div>
        <div><h3>Check before you post</h3><p>${esc(a.check)}</p></div>
      </section>
      ${a.carry || a.scope ? `<section><h3>${a.carry ? 'Carry forward' : 'Scope'}</h3><p class="act-brief">${esc(a.carry || a.scope)}</p></section>` : ''}
      <nav class="act-nav" aria-label="Previous and next activity">
        ${prev ? `<button type="button" class="btn btn--ghost" data-open="${prev.id}"><span>Previous, Day ${i}</span>${esc(prev.title)}</button>` : '<span></span>'}
        ${next ? `<button type="button" class="btn btn--ghost" data-open="${next.id}" style="text-align:right"><span>Next, Day ${i + 2}</span>${esc(next.title)}</button>` : '<span></span>'}
      </nav>
    </div>`;
  content.scrollTop = 0;
}

function openActivity(id, { push = true } = {}) {
  const a = byId[id];
  if (!a) return;
  stopTimer(true);
  state.open = id;
  renderDrawer(a);
  if (!drawer.open) drawer.showModal();
  if (push && location.hash !== `#/activity/${id}`) history.pushState(null, '', `#/activity/${id}`);
  $('#drawer-title').focus?.();
  document.documentElement.style.overflow = 'hidden';
}
function closeDrawer({ keepHash = false } = {}) {
  if (!drawer.open) return;
  stopTimer(true);
  drawer.classList.add('is-closing');
  const finish = () => {
    drawer.classList.remove('is-closing');
    drawer.close();
    state.open = null;
    document.documentElement.style.overflow = '';
    if (!keepHash && location.hash.startsWith('#/activity/')) history.replaceState(null, '', `${location.pathname}${location.search}#weeks`);
  };
  if (document.documentElement.dataset.motion === 'off') finish();
  else drawer.addEventListener('animationend', finish, { once: true });
}

/* Timer: counts up through the steps and highlights the current one. */
function tickTimer() {
  const a = byId[state.open];
  if (!a) return;
  const m = Math.floor(timer.elapsed / 60);
  const s = timer.elapsed % 60;
  const label = $('#timer b');
  if (label) label.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  let acc = 0;
  let current = -1;
  a.steps.forEach((st, k) => { if (current === -1 && timer.elapsed < (acc + st.min) * 60) current = k; acc += st.min; });
  $$('#steps .step').forEach((el, k) => {
    el.classList.toggle('is-current', k === current);
    el.classList.toggle('is-past', current !== -1 ? k < current : timer.elapsed > 0);
  });
  if (current === -1 && timer.running && timer.elapsed > 0) {
    stopTimer();
    toast('Time is up. Post your share and mark the activity done.');
  }
}
function startTimer() {
  if (timer.running) return;
  timer.running = true;
  const btn = $('[data-timer="toggle"]');
  if (btn) btn.textContent = 'Pause';
  timer.id = setInterval(() => { timer.elapsed += 1; tickTimer(); }, 1000);
}
function stopTimer(reset = false) {
  clearInterval(timer.id);
  timer.running = false;
  const btn = $('[data-timer="toggle"]');
  if (reset) timer.elapsed = 0;
  if (btn) btn.textContent = timer.elapsed ? 'Resume' : btn.textContent.replace(/^Pause$/, 'Start');
  if (drawer.open) tickTimer();
}

/* ---- State changes --------------------------------------------------------- */
function setCohort(id) {
  state.cohort = state.cohort === id ? null : id;
  store.set('psaa-cohort', state.cohort);
  renderCohortPicker();
  if (state.open) renderDrawer(byId[state.open]);
  const aud = audience();
  toast(aud ? `Examples now follow ${aud.name}.` : 'Showing all four cohort contexts.');
}
function setPath(id) {
  state.path = state.path === id ? null : id;
  store.set('psaa-path', state.path);
  if (state.open) renderDrawer(byId[state.open]);
}
function toggleDone(id) {
  if (state.done.has(id)) state.done.delete(id); else state.done.add(id);
  store.set('psaa-done', [...state.done]);
  renderProgress();
  renderWeekTabs();
  renderWeekPanels();
  renderProgram();
  renderToday();
  observeReveals();
  if (state.open === id) renderDrawer(byId[id]);
  if (state.done.has(id)) toast(state.done.size === activities.length ? 'All twenty done. Post your review and celebrate.' : `Done. ${state.done.size} of ${activities.length}.`);
}

/* ---- Routing --------------------------------------------------------------- */
function route() {
  const h = location.hash;
  const act = h.match(/^#\/activity\/([\w-]+)$/);
  const wk = h.match(/^#\/week\/(\d)$/);
  if (act && byId[act[1]]) { selectWeek(byId[act[1]].week); openActivity(act[1], { push: false }); return; }
  if (drawer.open) closeDrawer({ keepHash: true });
  if (wk && weeks.some((w) => w.num === Number(wk[1]))) { selectWeek(Number(wk[1]), { scroll: true }); return; }
  if (h === '#weeks') return;
}

/* ---- Reveal and current section ----------------------------------------- */
let revealObserver;
function observeReveals() {
  if (document.documentElement.dataset.motion === 'off' || !('IntersectionObserver' in window)) { $$('[data-reveal]').forEach((el) => el.classList.add('is-in')); return; }
  revealObserver ??= new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealObserver.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]:not(.is-in)').forEach((el) => revealObserver.observe(el));
}
function watchSections() {
  if (!('IntersectionObserver' in window)) return;
  const links = $$('.site-nav a');
  const io = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((l) => l.toggleAttribute('aria-current', l.getAttribute('href') === `#${visible.target.id}`) || (l.getAttribute('href') === `#${visible.target.id}` ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
  }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.2, 0.5] });
  $$('main > section[id]').forEach((s) => io.observe(s));
}

/* ---- Events ---------------------------------------------------------------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-open],[data-cohort],[data-path],[data-toggle-done],[data-copy-prompt],[data-copy-share],[data-copy-link],[data-copy-progress],[data-reset-progress],[data-ics],[data-timer],[data-week],[data-drawer-close],[data-close-first],[data-open-today],.video-play');
  if (!t) return;
  if (t.dataset.open) { e.preventDefault(); openActivity(t.dataset.open); }
  else if (t.dataset.cohort) setCohort(t.dataset.cohort);
  else if (t.dataset.path) setPath(t.dataset.path);
  else if (t.dataset.toggleDone) toggleDone(t.dataset.toggleDone);
  else if (t.hasAttribute('data-copy-prompt')) copyText(promptFor(byId[state.open]), t.parentElement);
  else if (t.hasAttribute('data-copy-share')) copyText(byId[state.open].shareTemplate, t.parentElement);
  else if (t.dataset.copyLink) copyText(`${location.href.split('#')[0]}#/activity/${t.dataset.copyLink}`, t.parentElement);
  else if (t.hasAttribute('data-copy-progress')) copyText(progressText(), t.parentElement);
  else if (t.hasAttribute('data-reset-progress')) { state.done.clear(); store.set('psaa-done', []); toggleDone('__none__'); toast('Progress reset.'); }
  else if (t.hasAttribute('data-ics')) downloadIcs();
  else if (t.dataset.timer === 'toggle') (timer.running ? stopTimer() : startTimer());
  else if (t.dataset.timer === 'reset') stopTimer(true);
  else if (t.dataset.week) { selectWeek(Number(t.dataset.week)); history.replaceState(null, '', `#/week/${t.dataset.week}`); }
  else if (t.hasAttribute('data-drawer-close')) closeDrawer();
  else if (t.hasAttribute('data-close-first')) closeDrawer({ keepHash: true });
  else if (t.hasAttribute('data-open-today')) {
    const s = status();
    const a = s.activity || s.next || activities[activities.length - 1];
    if (a) { e.preventDefault(); openActivity(a.id); }
  } else if (t.classList.contains('video-play')) {
    const frame = t.closest('.video-frame');
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(frame.dataset.video)}?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }
});
drawer.addEventListener('cancel', (e) => { e.preventDefault(); closeDrawer(); });
drawer.addEventListener('click', (e) => { if (e.target === drawer) closeDrawer(); });
window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);

const motionBtn = $('[data-motion-toggle]');
function syncMotion() {
  const off = document.documentElement.dataset.motion === 'off';
  motionBtn.setAttribute('aria-pressed', String(off));
  $('.motion-label', motionBtn).textContent = off ? 'Play motion' : 'Pause motion';
}
motionBtn.addEventListener('click', () => {
  const off = document.documentElement.dataset.motion === 'off';
  document.documentElement.dataset.motion = off ? 'on' : 'off';
  try { localStorage.setItem('psaa-motion', document.documentElement.dataset.motion); } catch { /* ignore */ }
  syncMotion();
  observeReveals();
});

/* ---- Boot ------------------------------------------------------------------ */
function initialWeek() {
  const s = status();
  if (s.kind === 'today') return s.activity.week;
  if (s.kind === 'after') return 4;
  if (s.next) return s.next.week;
  return 1;
}
state.week = initialWeek();
renderHero();
renderCohortPicker();
renderProgress();
renderToday();
renderProgram();
renderWeekTabs();
renderWeekPanels();
renderLearn();
renderEngage();
renderMaterials();
renderTimeline();
syncMotion();
observeReveals();
watchSections();
route();

window.__psaa = { state, status, openActivity, closeDrawer, selectWeek, toggleDone, setCohort, setPath, icsText, activities, weeks, TODAY_KEY };
