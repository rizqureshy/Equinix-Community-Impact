// HTML rendering for content. Pure string functions with no DOM access, used
// at build time (pre-rendered into index.html) and at runtime (story detail,
// the map panel).
import {
  stories,
  sources,
  topics,
  chapterLead,
  getStory,
  storiesForTopic,
  principles,
  relationshipLabels,
  timeframeLabels,
  LAST_CHECKED,
} from './stories.js';
import { PILLARS, PLACES, MILESTONES } from './places.js';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const ILLUSTRATIVE = 'Illustrative, AI generated. Not the organisation or people named.';
const ARROW = '<svg class="arrow" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const picture = (media, { cls = '', sizes = '(min-width: 900px) 50vw, 100vw', loading = 'lazy', caption = true } = {}) => {
  if (!media) return '';
  const small = media.path.replace('-1200', '-640');
  return `<figure class="${cls}">
    <img src="${esc(media.path)}" srcset="${esc(small)} 640w, ${esc(media.path)} 1200w" sizes="${sizes}" alt="${esc(media.alt)}" loading="${loading}" decoding="async" width="1200" height="800" />
    ${caption ? `<figcaption class="note">${ILLUSTRATIVE}</figcaption>` : ''}
  </figure>`;
};

const topicLabel = (id) => topics.find((t) => t.id === id)?.label || '';
const metricHTML = (story, cls = 'stat') =>
  story.metric
    ? `<p class="${cls}"><span class="${cls}-value serif">${esc(story.metric)}</span><span class="${cls}-label">${esc(story.metricLabel)}</span></p>`
    : '';

// ---------------------------------------------------------------------------
// Hero: the five pillars as the way in
// ---------------------------------------------------------------------------
export function pillarRowHTML() {
  return `<ol class="pillar-row" aria-label="Explore by pillar">${topics
    .map((t) => {
      const p = PILLARS[t.id];
      return `<li><a class="pillar-link" href="#/chapter/${t.id}" data-topic="${t.id}"><span class="pillar-num">${p.number}</span><span class="pillar-word">${esc(p.word)}</span><span class="pillar-line">${esc(p.title)}</span>${ARROW}</a></li>`;
    })
    .join('')}</ol>`;
}

// ---------------------------------------------------------------------------
// The map panel: places to choose, and the detail for one place (runtime)
// ---------------------------------------------------------------------------
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

export function placesListHTML() {
  const byStory = (id) => getStory(id);
  const own = PLACES.filter((p) => !p.partner);
  const storyCount = new Set(PLACES.flatMap((p) => [p.story, ...(p.also || [])])).size;
  return `<p class="eyebrow">Places</p>
    <h3 class="title--sm">${cap(WORDS[own.length] || String(own.length))} places, ${WORDS[storyCount] || storyCount} stories.</h3>
    <ol class="place-list" aria-label="Places on the map">${own
    .map((p) => {
      const s = byStory(p.story);
      return `<li><button type="button" class="place-item${p.heat ? ' place-item--heat' : ''}" data-place="${p.id}" data-topic="${s.topic}">
        <span class="place-dot" aria-hidden="true"></span>
        <span class="place-name">${esc(p.name)}</span>
        <span class="place-story">${esc(s.title)}</span>
      </button></li>`;
    })
    .join('')}</ol>`;
}

export function placeDetailHTML(place) {
  const ids = [place.story, ...(place.also || [])];
  const cards = ids
    .map((id) => {
      const s = getStory(id);
      return `<article class="place-card">
        <p class="eyebrow">${esc(topicLabel(s.topic))} <span class="muted">· ${esc(s.organisation)}</span></p>
        <h4 class="title--sm">${esc(s.title)}</h4>
        <p class="muted">${esc(s.summary)}</p>
        ${metricHTML(s)}
        <div class="actions"><a class="btn btn--primary btn--small" href="#/story/${s.id}" data-story-trigger="${s.id}">Open the story ${ARROW}</a><button type="button" class="btn btn--ghost btn--small" data-copy="summary" data-story="${s.id}">Copy summary</button></div>
      </article>`;
    })
    .join('');
  return `<button type="button" class="btn btn--link btn--small place-back" data-place-back>All places</button>
    <p class="eyebrow place-kind">${place.partner ? 'Partner location' : place.heat ? 'Heat export' : 'Equinix site or programme'}</p>
    <h3 class="title--md">${esc(place.name)}</h3>
    <p class="muted">${esc(place.note)}</p>
    ${cards}`;
}

// ---------------------------------------------------------------------------
// Pillars: five sections, each with a lead story and the rest of its stories
// ---------------------------------------------------------------------------
export function pillarTabsHTML() {
  return `<nav class="pillar-tabs" id="pillar-tabs" aria-label="Pillars"><div class="wrap"><ol>${topics
    .map((t) => `<li><a href="#/chapter/${t.id}" data-tab="${t.id}"><span class="tab-num">${PILLARS[t.id].number}</span>${esc(PILLARS[t.id].word)}</a></li>`)
    .join('')}</ol></div></nav>`;
}

function storyCardHTML(s) {
  return `<li class="story-mini">
    <p class="eyebrow">${esc(relationshipLabels[s.relationship])}</p>
    <h4 class="title--sm">${esc(s.title)}</h4>
    <p class="story-mini-org">${esc(s.organisation)} <span aria-hidden="true">·</span> ${esc(s.location)}</p>
    <p class="muted">${esc(s.summary)}</p>
    ${metricHTML(s, 'stat stat--small')}
    <div class="actions"><a class="btn btn--dark btn--small" href="#/story/${s.id}" data-story-trigger="${s.id}">Open the story</a><button type="button" class="btn btn--ghost btn--small" data-copy="summary" data-story="${s.id}">Copy summary</button></div>
  </li>`;
}

export function pillarsHTML() {
  return topics
    .map((t, i) => {
      const p = PILLARS[t.id];
      const lead = getStory(chapterLead[t.id]);
      const rest = storiesForTopic(t.id).filter((s) => s.id !== lead.id);
      const heat = t.id === 'resources';
      return `<section class="pillar${i % 2 ? ' pillar--flip' : ''}${heat ? ' pillar--heat' : ''}" id="chapter-${t.id}" data-section="${t.id}" data-topic="${t.id}" aria-labelledby="pillar-title-${t.id}">
      <div class="wrap">
        <header class="pillar-head" data-reveal>
          <p class="eyebrow"><b>${p.number}</b> ${esc(p.word)}</p>
          <h2 class="title" id="pillar-title-${t.id}">${esc(p.title)}</h2>
          <p class="lede">${esc(p.intro)}</p>
        </header>
        <div class="pillar-grid">
          <div class="lead-media" data-reveal>
            ${picture(lead.media[0], { cls: 'lead-figure', sizes: '(min-width: 900px) 48vw, 100vw' })}
            <figure class="lead-film">
              <video class="film" muted playsinline loop preload="none" poster="media/${p.film}-poster.jpg" aria-label="${esc(p.moment)}">
                <source src="media/${p.film}.webm" type="video/webm" />
                <source src="media/${p.film}.mp4" type="video/mp4" />
              </video>
              <figcaption class="film-caption"><span class="serif">${esc(p.moment)}</span><span class="note">Illustrative film, AI generated.</span></figcaption>
            </figure>
          </div>
          <article class="lead-story" data-reveal style="--reveal-delay: 120ms" aria-labelledby="lead-${lead.id}">
            <p class="eyebrow">Lead story <span class="muted">· ${esc(relationshipLabels[lead.relationship])}</span></p>
            <h3 class="title--md" id="lead-${lead.id}">${esc(lead.title)}</h3>
            <p class="lead-org">${esc(lead.organisation)} <span aria-hidden="true">·</span> ${esc(lead.location)}</p>
            <p class="lead-summary">${esc(lead.humanContext)}</p>
            ${metricHTML(lead, 'stat stat--lead')}
            <dl class="contrib">
              <div><dt>What Equinix contributes</dt><dd>${esc(lead.equinixContribution)}</dd></div>
              <div><dt>What partners deliver</dt><dd>${esc(lead.partnerContribution)}</dd></div>
            </dl>
            <div class="actions">
              <a class="btn btn--primary" href="#/story/${lead.id}" data-story-trigger="${lead.id}">Open the story ${ARROW}</a>
              <button type="button" class="btn btn--ghost" data-copy="summary" data-story="${lead.id}">Copy summary</button>
            </div>
          </article>
        </div>
        ${rest.length ? `<ul class="story-minis" data-reveal>${rest.map(storyCardHTML).join('')}</ul>` : ''}
      </div>
    </section>`;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Progress: the timeline and the measures
// ---------------------------------------------------------------------------
export function timelineHTML() {
  const item = (m, i) => {
    const story = m.story ? getStory(m.story) : null;
    return `<li class="milestone milestone--${m.kind}" data-index="${i}">
      <span class="milestone-year serif">${esc(m.year)}</span>
      <span class="milestone-mark" aria-hidden="true"></span>
      <h3 class="title--sm">${esc(m.title)}</h3>
      <p class="muted">${esc(m.text)}</p>
      <p class="milestone-links">
        ${story ? `<a href="#/story/${story.id}" data-story-trigger="${story.id}">Story</a>` : ''}
        <a href="${esc(sources[m.source].url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(sources[m.source].title)} (opens in a new tab)</span></a>
      </p>
    </li>`;
  };
  return `<div class="timeline" id="timeline" tabindex="0" aria-label="Timeline from 1998 to 2040. Scroll sideways, or drag.">
    <ol class="timeline-track">${MILESTONES.map(item).join('')}</ol>
  </div>
  <p class="timeline-legend note"><span class="legend-swatch" aria-hidden="true"></span>Happened or happening <span class="legend-swatch legend-swatch--commitment" aria-hidden="true"></span>Committed, not yet an outcome</p>`;
}

export const NUMBERS = [
  { value: 3.5, suffix: 'M+', decimals: 1, label: 'people connected to the internet by Equinix Foundation partners', scope: 'Nonprofit portfolio, 2025', source: 'S4b' },
  { value: 54400, suffix: '+', decimals: 0, label: 'hours volunteered by Equinix employees, up 45% on 2024', scope: 'All employees, 2025', source: 'S6' },
  { value: 95, prefix: '$', suffix: 'M+', decimals: 0, label: 'spent with small and inclusive U.S. businesses', scope: 'U.S. inclusive procurement, 2025', source: 'S7' },
  { value: 5, suffix: '', decimals: 0, label: 'data centers exporting recovered heat to their communities', scope: 'As of 2025', source: 'S6' },
];

const digits = (n) => (n.decimals ? n.value.toFixed(n.decimals) : n.value.toLocaleString('en-GB'));
const fmt = (n) => `${n.prefix || ''}${digits(n)}${n.suffix}`;

export function numbersHTML() {
  return `<ol class="numbers">${NUMBERS.map(
    (n, i) => `<li class="number${i === 3 ? ' number--heat' : ''}" data-reveal style="--reveal-delay:${i * 80}ms">
      <span class="number-value serif" aria-label="${esc(fmt(n))}">${n.prefix ? `<span class="number-affix">${esc(n.prefix)}</span>` : ''}<span class="number-digits" data-count="${n.value}" data-decimals="${n.decimals}">${digits(n)}</span>${n.suffix ? `<span class="number-affix">${esc(n.suffix)}</span>` : ''}</span>
      <span class="number-label">${esc(n.label)}</span>
      <span class="note">${esc(n.scope)}. <a href="${esc(sources[n.source].url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(sources[n.source].title)} (opens in a new tab)</span></a></span>
    </li>`,
  ).join('')}</ol>`;
}

/** Two measures with a target, drawn as simple single-hue meters with the value in text. */
export function metersHTML() {
  return `<div class="meters">
    <div class="meter" data-reveal>
      <p class="eyebrow">Renewable energy coverage</p>
      <p class="meter-value"><span class="serif" data-count="96" data-decimals="0">96</span>%</p>
      <div class="meter-bar" role="img" aria-label="96 percent renewable energy coverage in 2025, the eighth year in a row above 90 percent"><i style="--v: 0.96"></i><b class="meter-tick" style="--v: 0.9" aria-hidden="true"><span>90% since 2018</span></b></div>
      <p class="note">Across retail IBX data centers in 2025, the eighth year in a row above 90% globally. Equinix’s published definition; not continuous direct supply at every site. <a href="${esc(sources.S5.url)}" target="_blank" rel="noopener">Source<span class="visually-hidden"> (opens in a new tab)</span></a></p>
    </div>
    <div class="meter" data-reveal style="--reveal-delay: 100ms">
      <p class="eyebrow">Power usage effectiveness</p>
      <p class="meter-value"><span class="serif">1.37</span> <span class="meter-target">target 1.33 by 2030</span></p>
      <div class="meter-bar meter-bar--pue" role="img" aria-label="Average annual PUE of 1.37 in 2025, with a target of 1.33 or better by 2030; lower is better"><i style="--v: 0.62"></i><b class="meter-tick" style="--v: 0.5" aria-hidden="true"><span>1.33</span></b></div>
      <p class="note">Average annual PUE in 2025, where 1.0 would be perfect. Lower is better. Scale shown from 1.0 to 1.6. <a href="${esc(sources.S7.url)}" target="_blank" rel="noopener">Source<span class="visually-hidden"> (opens in a new tab)</span></a></p>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Promises
// ---------------------------------------------------------------------------
export function promisesHTML() {
  const item = (p, i) => `<li class="promise${i === 0 ? ' is-open' : ''}" data-index="${i}">
      <h3><button type="button" class="promise-btn" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="promise-body-${i}" data-promise="${i}">
        <span class="promise-num">0${i + 1}</span><span class="promise-name">${esc(p.name)}</span>
        <svg class="promise-plus" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button></h3>
      <div class="promise-body" id="promise-body-${i}" ${i === 0 ? '' : 'hidden'}>
        <p class="promise-text">${esc(p.promise)}</p>
        <p class="promise-proof"><span class="promise-kind">${esc(p.kind)} <span aria-hidden="true">·</span> ${esc(p.where)}</span>${esc(p.proof)}</p>
      </div>
    </li>`;
  const frame = (p, i) => `<figure class="promise-frame${i === 0 ? ' is-active' : ''}" data-index="${i}" ${i === 0 ? '' : 'aria-hidden="true"'}>
      <img src="media/${p.art}-1200.webp" srcset="media/${p.art}-640.webp 640w, media/${p.art}-1200.webp 1200w" sizes="(min-width: 900px) 46vw, 100vw" alt="${esc(p.alt)}" loading="lazy" decoding="async" width="1200" height="800" />
      <figcaption><span class="promise-headline">${esc(p.headline)}</span><span class="note">Illustrative, AI generated.</span></figcaption>
    </figure>`;
  return `<div class="promises-grid">
    <ol class="promise-list">${principles.map(item).join('')}</ol>
    <div class="promise-visual" aria-live="polite">${principles.map(frame).join('')}</div>
  </div>
  <p class="note promises-note">Equinix U.S. Community Principles. Not every action applies at every location. <a href="${esc(sources.S7.url)}" target="_blank" rel="noopener">Read the principles<span class="visually-hidden"> (opens in a new tab)</span></a></p>`;
}

// ---------------------------------------------------------------------------
// Story detail
// ---------------------------------------------------------------------------
const sourceLink = (id) => {
  const s = sources[id];
  return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}<span class="visually-hidden"> (opens in a new tab)</span></a>
    <span class="source-meta">${esc(s.publisher)}${s.published ? `, ${formatDate(s.published)}` : ', date not stated'}${s.kind === 'secondary' ? ', secondary reporting' : ''}</span></li>`;
};

export function storyDetailHTML(story) {
  const heat = story.id === 'pa10-heat' || story.id === 'markham-heat';
  return `<header class="story-head">
    <p class="eyebrow">${esc(topicLabel(story.topic))} <span class="muted">· ${esc(relationshipLabels[story.relationship])}</span></p>
    <h2 class="story-title" id="story-title">${esc(story.title)}</h2>
    <p class="story-org">${esc(story.organisation)} <span aria-hidden="true">·</span> ${esc(story.location)}</p>
  </header>
  ${picture(story.media[0], { cls: 'story-media', sizes: '(min-width: 700px) 640px, 100vw' })}
  <div class="story-body">
    <section><h3>The people</h3><p>${esc(story.humanContext)}</p></section>
    <section><h3>The ambition</h3><p>${esc(story.challenge)}</p></section>
    <section class="story-split">
      <div><h3>What Equinix contributes</h3><p>${esc(story.equinixContribution)}</p></div>
      <div><h3>What partners deliver</h3><p>${esc(story.partnerContribution)}</p></div>
    </section>
    <section><h3>What has happened</h3><p>${esc(story.outcome)}</p>
      ${story.metric ? `<p class="metric"><span class="metric-value">${esc(story.metric)}</span><span class="metric-label">${esc(story.metricLabel)}</span><span class="metric-scope">${esc(story.metricScope)}${story.reportingPeriod ? ` Period: ${esc(story.reportingPeriod)}.` : ''}</span></p>` : ''}
    </section>
    ${story.quote ? `<blockquote class="story-quote"><p>“${esc(story.quote.text)}”</p><footer>${esc(story.quote.attribution)}</footer></blockquote>` : ''}
    <section class="story-connection"><h3><span class="thread-swatch${heat ? ' thread-swatch--heat' : ''}" aria-hidden="true"></span>The Equinix connection</h3><p>${esc(story.connection)}</p></section>
    <section class="story-carry"><h3>Carry it forward</h3><p>${esc(story.conversationStarter)}</p>
      <div class="actions">
        <button type="button" class="btn btn--primary" data-copy="summary" data-story="${story.id}">Copy story summary</button>
        <button type="button" class="btn btn--ghost" data-copy="link" data-story="${story.id}">Copy story link</button>
      </div>
    </section>
    <section class="story-sources"><h3>Sources</h3><ul>${story.sources.map(sourceLink).join('')}</ul>
      <p class="source-meta">${esc(timeframeLabels[story.timeframe])}. Content checked ${formatDate(story.lastChecked)}.</p></section>
  </div>`;
}

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------
export function libraryItemHTML(story) {
  const media = story.media[0];
  const art = media
    ? `<img class="card-img" src="${esc(media.path.replace('-1200', '-640'))}" alt="" loading="lazy" decoding="async" width="640" height="427">`
    : `<span class="card-type serif" aria-hidden="true">${esc(story.metric || topicLabel(story.topic))}</span>`;
  return `<li class="card" data-topic="${story.topic}" data-relationship="${story.relationship}">
    <div class="card-art${media ? '' : ' card-art--type'}">${art}</div>
    <div class="card-body">
      <p class="card-tags"><span class="tag">${esc(topicLabel(story.topic))}</span><span class="tag tag--quiet">${esc(relationshipLabels[story.relationship])}</span></p>
      <h3 class="card-title">${esc(story.title)}</h3>
      <p class="card-org">${esc(story.organisation)}</p>
      <p class="card-summary">${esc(story.summary)}</p>
      <div class="card-actions">
        <a class="btn btn--dark btn--small" href="#/story/${story.id}" data-story-trigger="${story.id}">Open story</a>
        <button type="button" class="btn btn--ghost btn--small" data-copy="summary" data-story="${story.id}">Copy summary</button>
      </div>
    </div>
  </li>`;
}

export function libraryHTML() {
  const chip = (group, value, label, pressed) =>
    `<button type="button" class="chip" data-filter-group="${group}" data-filter="${value}" aria-pressed="${pressed}">${esc(label)}</button>`;
  return `<div class="filters" role="group" aria-label="Filter stories">
      <div class="filter-row">
        <span class="filter-name">Pillar</span>
        ${chip('topic', 'all', 'All', 'true')}${topics.map((t) => chip('topic', t.id, t.label, 'false')).join('')}
      </div>
      <div class="filter-row">
        <span class="filter-name">Equinix role</span>
        ${chip('relationship', 'all', 'All', 'true')}${Object.entries(relationshipLabels)
          .map(([k, v]) => chip('relationship', k, v, 'false'))
          .join('')}
      </div>
    </div>
    <ul class="library" id="library" aria-live="polite">${stories.map(libraryItemHTML).join('')}</ul>
    <p class="note library-empty" id="library-empty" hidden>No stories match these filters yet.</p>`;
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------
export function sourcesHTML() {
  const groups = { historical: [], current: [], commitment: [] };
  for (const s of stories) groups[s.timeframe].push(s);
  const commitments = [
    { text: 'SBTi-approved targets to reach net zero by 2040.', source: 'S5' },
    { text: 'A power usage effectiveness (PUE) of 1.33 or better by 2030.', source: 'S7' },
    { text: 'All future IBX colocation data centers designed with heat recovery and export capabilities, as stated by Equinix in July 2024.', source: 'S3b' },
    { text: 'A new $50 million commitment to the Equinix Foundation, announced 27 August 2026.', source: 'S4b' },
  ];
  const list = (arr) => arr.map((s) => `<li><a href="#/story/${s.id}" data-story-trigger="${s.id}">${esc(s.title)}</a> <span class="source-meta">${esc(s.organisation)}</span></li>`).join('');
  return `<div class="progress-grid">
      <div data-reveal><h3>Achieved</h3><p class="note">Results reported for a past period.</p><ul>${list(groups.historical)}</ul></div>
      <div data-reveal style="--reveal-delay:90ms"><h3>Happening now</h3><p class="note">Current programmes and customer stories.</p><ul>${list(groups.current)}</ul></div>
      <div data-reveal style="--reveal-delay:180ms"><h3>Committed</h3><p class="note">Stated future commitments, not yet outcomes.</p><ul>${commitments.map((c) => `<li>${esc(c.text)} <a class="source-ref" href="${esc(sources[c.source].url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(sources[c.source].title)} (opens in a new tab)</span></a></li>`).join('')}</ul></div>
    </div>
    <details class="directory">
      <summary>Source directory <span class="source-meta">${Object.keys(sources).length} sources, checked ${formatDate(LAST_CHECKED)}</span></summary>
      <ul class="source-directory">${Object.keys(sources).map(sourceLink).join('')}</ul>
      <p class="source-meta">Summaries on this page are original paraphrases. Figures keep the scope and period stated by each source.</p>
    </details>`;
}
