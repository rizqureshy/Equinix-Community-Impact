// HTML rendering for content. Pure string functions with no DOM access, used
// at build time (pre-rendered into index.html) and at runtime (story detail).
import {
  stories,
  sources,
  topics,
  chapterLead,
  getStory,
  principles,
  relationshipLabels,
  timeframeLabels,
  LAST_CHECKED,
} from './stories.js';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const ILLUSTRATIVE = 'Illustrative, AI generated. Not the organisation or people named.';

/** Chapter framing around each lead story, and the place it lives in the city. */
export const CHAPTERS = {
  care: { number: '01', title: 'Care that connects.', moment: 'A radiologist opens a patient’s scan. Somewhere, a family is waiting for what it shows.', film: 'clip-care', place: 'hospital', placeName: 'Hospital' },
  discovery: { number: '02', title: 'Discovery that advances.', moment: 'In Sydney, researchers compare one child’s cancer with cases studied on the other side of the world.', film: 'clip-discovery', place: 'research', placeName: 'Research centre' },
  opportunity: { number: '03', title: 'Opportunity that grows.', moment: 'A student walks into a data center for the first time and asks how it all works.', film: 'clip-opportunity', place: 'learning', placeName: 'Learning centre' },
  community: { number: '04', title: 'Community in connection.', moment: 'In Minooka, Illinois, a public bike path runs along the data center site, and land is being donated for a future fire station.', film: 'clip-neighbourhood', place: 'homes', placeName: 'Homes and high street' },
  resources: { number: '05', title: 'Resources used thoughtfully.', moment: 'Early swimmers in Saint-Denis are in water warmed, in part, by heat that once left a data center unused.', film: 'clip-pool', place: 'aquatic', placeName: 'Aquatic centre' },
};

/** The stops of the city journey, in order. */
export function journeySteps() {
  const steps = topics.map((t) => {
    const story = getStory(chapterLead[t.id]);
    const c = CHAPTERS[t.id];
    return { id: t.id, place: c.place, placeName: c.placeName, label: t.label, number: c.number, moment: c.moment, summary: story.summary, story: story.id, heat: t.id === 'resources' };
  });
  steps.push({
    id: 'datacenter',
    place: 'datacenter',
    placeName: 'Equinix data center',
    label: 'Every thread',
    number: '06',
    moment: 'Private connections for care and research. Heat recovered for neighbours. People who keep it running, and who volunteer down the road.',
    summary: 'A data center is part of its community, not apart from it.',
    story: null,
    heat: false,
  });
  return steps;
}

export function journeyHTML() {
  return `<div class="journey-cards">
    <article class="journey-card journey-card--intro" aria-labelledby="journey-intro">
      <p class="eyebrow">The community</p>
      <h3 class="title--md" id="journey-intro">Six places. One thread.</h3>
      <p class="journey-moment">A data center is part of the community around it. Look around the model, then click a building to step inside.</p>
      <p class="journey-how muted">Drag to turn it. Click the model, then scroll to zoom. On a phone, use two fingers.</p>
      <div class="actions">
        <button type="button" class="btn btn--primary btn--small" data-play>Play the tour</button>
      </div>
    </article>
    <aside class="tour-caption" hidden aria-live="polite"></aside>
  </div>
  <div class="journey-bar" role="group" aria-label="Model controls">
    <button type="button" class="bar-btn" data-reset-view aria-label="Reset the view"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="7" cy="7" r="1.6" fill="currentColor"/></svg></button>
    <span class="bar-sep" aria-hidden="true"></span>
    <button type="button" class="bar-btn bar-btn--play" data-play aria-pressed="false" aria-label="Play the tour"><svg class="icon-play" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2.2v9.6L11.4 7Z" fill="currentColor"/></svg><svg class="icon-pause" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2.5h2.4v9H3.5zM8.1 2.5h2.4v9H8.1z" fill="currentColor"/></svg></button>
    <button type="button" class="bar-btn" data-mute aria-pressed="false" aria-label="Mute the music"><svg class="icon-sound" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5h2.5L8 2v10L4.5 9H2z" fill="currentColor"/><path d="M10 4.5a3.5 3.5 0 0 1 0 5M11.6 2.6a6 6 0 0 1 0 8.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><svg class="icon-muted" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5h2.5L8 2v10L4.5 9H2z" fill="currentColor"/><path d="m10 5 3 4m0-4-3 4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
  </div>
  <audio id="theme" loop preload="none" aria-hidden="true"><source src="media/audio/community-theme.mp3" type="audio/mpeg"><source src="media/audio/community-theme.ogg" type="audio/ogg; codecs=opus"></audio>`;
}

// ---------------------------------------------------------------------------
// Chapters: large rounded film with headline above, quiet copy below
// ---------------------------------------------------------------------------
function film(name, alt, { cls = '' } = {}) {
  return `<video class="film ${cls}" muted playsinline loop preload="none" poster="media/${name}-poster.jpg" aria-label="${esc(alt)}">
      <source src="media/${name}.webm" type="video/webm"><source src="media/${name}.mp4" type="video/mp4"></video>`;
}

export function chapterHTML(topic, i) {
  const story = getStory(chapterLead[topic.id]);
  const c = CHAPTERS[topic.id];
  const others = stories.filter((s) => s.topic === topic.id && s.id !== story.id);
  const heat = topic.id === 'resources';
  return `<section class="chapter${i % 2 ? ' chapter--soft' : ''}" id="chapter-${topic.id}" data-chapter="${topic.id}" aria-labelledby="chapter-${topic.id}-title">
  <div class="wrap center chapter-head" data-reveal>
    <p class="eyebrow">${c.number} <span class="muted">${esc(topic.label)}</span></p>
    <h2 class="title" id="chapter-${topic.id}-title">${esc(c.title)}</h2>
    <p class="lede">${esc(c.moment)}</p>
  </div>
  <div class="wrap chapter-media" data-reveal>
    <figure class="frame">${film(c.film, story.media[0]?.alt || '')}<figcaption class="note">${ILLUSTRATIVE}</figcaption></figure>
  </div>
  <div class="wrap chapter-grid" data-reveal>
    <div class="chapter-copy">
      <p class="chapter-org muted">${esc(story.organisation)} <span aria-hidden="true">·</span> ${esc(story.location)}</p>
      <h3 class="title--md">${esc(story.title)}</h3>
      <p class="chapter-text">${esc(story.challenge)}</p>
      <p class="chapter-connection"><span class="thread-swatch${heat ? ' thread-swatch--heat' : ''}" aria-hidden="true"></span>${esc(story.connection)}</p>
      <div class="actions">
        <a class="btn btn--primary" href="#/story/${story.id}" data-story-trigger="${story.id}">Open the full story</a>
        ${others.map((o) => `<a class="btn btn--link" href="#/story/${o.id}" data-story-trigger="${o.id}">${esc(o.title)}</a>`).join('')}
      </div>
    </div>
    <aside class="chapter-aside">
      <dl class="roles">
        <div><dt>Equinix contributes</dt><dd>${esc(story.equinixContribution)}</dd></div>
        <div><dt>Partners deliver</dt><dd>${esc(story.partnerContribution)}</dd></div>
      </dl>
      ${story.metric ? `<p class="metric"><span class="metric-value">${esc(story.metric)}</span><span class="metric-label">${esc(story.metricLabel)}</span><span class="metric-scope">${esc(story.metricScope)}</span></p>` : ''}
    </aside>
  </div>
</section>`;
}

export function chaptersHTML() {
  return topics.map(chapterHTML).join('\n');
}

// ---------------------------------------------------------------------------
// Story detail dialog
// ---------------------------------------------------------------------------
function picture(media, { sizes = '(min-width: 900px) 640px, 92vw', cls = '' } = {}) {
  if (!media) return '';
  const base = media.path.replace(/-1200\.webp$/, '');
  return `<figure class="media ${cls}">
    <img src="${esc(media.path)}" srcset="${esc(base)}-640.webp 640w, ${esc(media.path)} 1200w" sizes="${sizes}"
      alt="${esc(media.alt)}" width="1200" height="800" loading="lazy" decoding="async">
    ${media.usage === 'illustrative' ? `<figcaption class="media-note">${ILLUSTRATIVE}</figcaption>` : ''}
  </figure>`;
}

const sourceLink = (id) => {
  const s = sources[id];
  return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}<span class="visually-hidden"> (opens in a new tab)</span></a>
    <span class="source-meta">${esc(s.publisher)}${s.published ? `, ${formatDate(s.published)}` : ', date not stated'}${s.kind === 'secondary' ? ', secondary reporting' : ''}</span></li>`;
};

export function storyDetailHTML(story) {
  const heat = story.id === 'pa10-heat' || story.id === 'markham-heat';
  return `<header class="story-head">
    <p class="eyebrow">${esc(topics.find((t) => t.id === story.topic).label)} <span class="muted">· ${esc(relationshipLabels[story.relationship])}</span></p>
    <h2 class="story-title" id="story-title">${esc(story.title)}</h2>
    <p class="story-org">${esc(story.organisation)} <span aria-hidden="true">·</span> ${esc(story.location)}</p>
  </header>
  ${picture(story.media[0], { cls: 'story-media' })}
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
// Story gallery: cards in a snap rail with filters
// ---------------------------------------------------------------------------
export function collectionItemHTML(story) {
  const topic = topics.find((t) => t.id === story.topic);
  const media = story.media[0];
  const art = media
    ? `<img class="card-img" src="${esc(media.path.replace('-1200', '-640'))}" alt="" loading="lazy" decoding="async" width="640" height="427">`
    : `<span class="card-type" aria-hidden="true">${esc(story.metric || topic.label)}</span>`;
  return `<li class="card" data-topic="${story.topic}" data-relationship="${story.relationship}">
    <div class="card-art${media ? '' : ' card-art--type'}">${art}</div>
    <div class="card-body">
      <p class="card-tags"><span class="tag">${esc(topic.label)}</span><span class="tag tag--quiet">${esc(relationshipLabels[story.relationship])}</span></p>
      <h3 class="card-title">${esc(story.title)}</h3>
      <p class="card-org">${esc(story.organisation)}</p>
      <p class="card-summary">${esc(story.summary)}</p>
      <div class="card-actions">
        <a class="btn btn--primary btn--small" href="#/story/${story.id}" data-story-trigger="${story.id}">Open story</a>
        <button type="button" class="btn btn--ghost btn--small" data-copy="summary" data-story="${story.id}">Copy summary</button>
      </div>
    </div>
  </li>`;
}

export function collectionHTML() {
  const chip = (group, value, label, pressed) =>
    `<button type="button" class="chip" data-filter-group="${group}" data-filter="${value}" aria-pressed="${pressed}">${esc(label)}</button>`;
  return `<div class="filters">
    <div class="filter-group" role="group" aria-label="Filter by topic">
      ${chip('topic', 'all', 'All topics', true)}${topics.map((t) => chip('topic', t.id, t.label, false)).join('')}
    </div>
    <div class="filter-group" role="group" aria-label="Filter by relationship">
      ${chip('relationship', 'all', 'All relationships', true)}${Object.entries(relationshipLabels).map(([k, v]) => chip('relationship', k, v, false)).join('')}
    </div>
  </div>
  <div class="rail-head">
    <p class="collection-count muted" id="collection-count" aria-live="polite">${stories.length} stories</p>
    <div class="rail-nav"><button type="button" class="rail-btn" data-rail-dir="-1" aria-label="Previous stories">←</button><button type="button" class="rail-btn" data-rail-dir="1" aria-label="Next stories">→</button></div>
  </div>
  <ul class="cards" id="collection-list" tabindex="0" aria-label="Stories">${stories.map(collectionItemHTML).join('')}</ul>
  <div class="collection-empty" id="collection-empty" hidden>
    <p>No stories match both filters yet. Try another relationship, or see everything.</p>
    <button type="button" class="btn btn--ghost" data-filter-reset>Show all stories</button>
  </div>`;
}

// ---------------------------------------------------------------------------
// Promises, numbers, sources
// ---------------------------------------------------------------------------
/**
 * The promises: a numbered list beside a sticky panel that shows, for the
 * promise at the reading line, a photograph with the proof set large over
 * it. On narrow screens, or without motion, each promise carries its proof
 * and photograph inline.
 */
export function principlesHTML() {
  const rows = principles
    .map(
      (p, i) => `<li class="promise-tile">
        <span class="promise-num" aria-hidden="true">${i + 1}</span>
        <strong class="promise-name">${esc(p.name)}</strong>
        <span class="promise-text">${esc(p.promise)}</span>
      </li>`,
    )
    .join('');
  return `<ol class="promise-row" aria-label="The five promises">${rows}</ol>
    <p class="note center promise-source">From the Equinix U.S. Community Principles. <a href="${esc(sources.S7.url)}" target="_blank" rel="noopener">Source<span class="visually-hidden"> (opens in a new tab)</span></a></p>`;
}

export const NUMBERS = [
  { value: 3.5, suffix: 'M+', decimals: 1, label: 'people connected to the internet by Equinix Foundation partners', scope: 'Nonprofit portfolio, 2025', source: 'S4b' },
  { value: 54400, suffix: '+', decimals: 0, label: 'hours volunteered by Equinix employees', scope: 'All employees, 2025', source: 'S6' },
  { value: 95, prefix: '$', suffix: 'M+', decimals: 0, label: 'spent with small and inclusive U.S. businesses', scope: 'U.S. inclusive procurement, 2025', source: 'S7' },
  { value: 5, suffix: '', decimals: 0, label: 'data centers exporting heat to their communities', scope: 'As of 2025', source: 'S6' },
];

export function numbersHTML() {
  const digits = (n) => (n.decimals ? n.value.toFixed(n.decimals) : n.value.toLocaleString('en-GB'));
  // Each figure carries a short thread that draws in as it arrives
  const thread = (i) => `<svg class="number-thread" viewBox="0 0 200 40" aria-hidden="true"><path d="M2 ${30 - (i % 2) * 8} C 60 ${(i % 2) * 20 + 4}, 120 ${38 - (i % 3) * 10}, 198 ${10 + (i % 2) * 12}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" pathLength="1"/><circle class="number-bead" r="4" fill="currentColor"><animateMotion dur="6s" repeatCount="indefinite" path="M2 ${30 - (i % 2) * 8} C 60 ${(i % 2) * 20 + 4}, 120 ${38 - (i % 3) * 10}, 198 ${10 + (i % 2) * 12}"/></circle></svg>`;
  return `<ul class="numbers">${NUMBERS.map(
    (n, i) => `<li class="number${i === 3 ? ' number--heat' : ''}" data-reveal>
      ${thread(i)}
      <span class="number-value" aria-label="${esc(`${n.prefix || ''}${digits(n)}${n.suffix}`)}">${n.prefix ? `<span class="number-prefix">${esc(n.prefix)}</span>` : ''}<span class="number-digits" data-count="${n.value}" data-decimals="${n.decimals}">${digits(n)}</span>${n.suffix ? `<span class="number-suffix">${esc(n.suffix)}</span>` : ''}</span>
      <span class="number-label">${esc(n.label)}</span>
      <span class="note">${esc(n.scope)}. <a href="${esc(sources[n.source].url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(sources[n.source].title)} (opens in a new tab)</span></a></span>
    </li>`,
  ).join('')}</ul>`;
}

/** Hero stat pills: three of the numbers, short form. */
export function heroStatsHTML() {
  const picks = [NUMBERS[0], NUMBERS[1], NUMBERS[3]];
  const short = ['people connected by Foundation partners in 2025', 'employee volunteer hours in 2025', 'data centers exporting heat'];
  const fmt = (n) => `${n.prefix || ''}${n.decimals ? n.value.toFixed(n.decimals) : n.value.toLocaleString('en-GB')}${n.suffix}`;
  return `<ul class="hero-stats" aria-label="Headline figures">${picks
    .map((n, i) => `<li class="stat"><span class="stat-value">${fmt(n)}</span><span class="stat-label">${esc(short[i])}</span></li>`)
    .join('')}</ul>`;
}

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
      <div data-reveal><h3>Happening now</h3><p class="note">Current programmes and customer stories.</p><ul>${list(groups.current)}</ul></div>
      <div data-reveal><h3>Committed</h3><p class="note">Stated future commitments, not yet outcomes.</p><ul>${commitments.map((c) => `<li>${esc(c.text)} <a class="source-ref" href="${esc(sources[c.source].url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(sources[c.source].title)} (opens in a new tab)</span></a></li>`).join('')}</ul></div>
    </div>
    <details class="directory">
      <summary>Source directory <span class="source-meta">${Object.keys(sources).length} sources, checked ${formatDate(LAST_CHECKED)}</span></summary>
      <ul class="source-directory">${Object.keys(sources).map(sourceLink).join('')}</ul>
      <p class="source-meta">Summaries on this page are original paraphrases. Figures keep the scope and period stated by each source.</p>
    </details>`;
}
