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

/** Chapter framing around each lead story, and the film that carries its poster. */
export const CHAPTERS = {
  care: {
    number: '01',
    title: ['Care that', 'connects.'],
    moment: 'A radiologist opens a patient’s scan. Somewhere, a family is waiting for what it shows.',
    film: 'clip-care',
    still: 'care',
    place: 'Hospital',
  },
  discovery: {
    number: '02',
    title: ['Discovery that', 'advances.'],
    moment: 'In Sydney, researchers compare one child’s cancer with cases studied on the other side of the world.',
    film: 'clip-discovery',
    still: 'discovery',
    place: 'Research centre',
  },
  opportunity: {
    number: '03',
    title: ['Opportunity that', 'grows.'],
    moment: 'A student walks into a data center for the first time and asks how it all works.',
    film: 'clip-opportunity',
    still: 'opportunity',
    place: 'Learning space',
  },
  community: {
    number: '04',
    title: ['Community in', 'connection.'],
    moment: 'In Minooka, Illinois, a public bike path runs along the data center site, and land is being donated for a future fire station.',
    film: 'clip-neighbourhood',
    still: 'neighbourhood',
    place: 'Homes and neighbourhood',
  },
  resources: {
    number: '05',
    title: ['Resources used', 'thoughtfully.'],
    moment: 'Early swimmers in Saint-Denis are in water warmed, in part, by heat that once left a data center unused.',
    film: 'clip-pool',
    still: 'resources',
    place: 'Aquatic centre',
  },
};

function film(name, still, alt, { cls = '', eager = false } = {}) {
  return `<video class="film ${cls}" muted playsinline loop preload="${eager ? 'auto' : 'none'}" poster="media/${name}-poster.jpg" aria-label="${esc(alt)}">
      <source src="media/${name}.webm" type="video/webm"><source src="media/${name}.mp4" type="video/mp4"></video>`;
}

// ---------------------------------------------------------------------------
// Story posters: full-bleed film, giant title, body panel scrolls over it
// ---------------------------------------------------------------------------
export function chapterHTML(topic) {
  const story = getStory(chapterLead[topic.id]);
  const c = CHAPTERS[topic.id];
  const others = stories.filter((s) => s.topic === topic.id && s.id !== story.id);
  const heat = topic.id === 'resources';
  return `<section class="poster" id="chapter-${topic.id}" data-chapter="${topic.id}" aria-labelledby="chapter-${topic.id}-title">
  <div class="poster-stage">
    <div class="poster-media">${film(c.film, c.still, story.media[0]?.alt || '')}</div>
    <div class="poster-shade" aria-hidden="true"></div>
    <div class="poster-head">
      <p class="poster-kicker"><span class="poster-num">${c.number}</span><span class="poster-line${heat ? ' poster-line--heat' : ''}" aria-hidden="true"></span>${esc(topic.label)}</p>
      <h2 class="poster-title" id="chapter-${topic.id}-title"><span>${esc(c.title[0])}</span> <em>${esc(c.title[1])}</em></h2>
      <p class="poster-moment">${esc(c.moment)}</p>
    </div>
    <p class="poster-note">${ILLUSTRATIVE}</p>
  </div>
  <article class="poster-body">
    <p class="poster-org">${esc(story.organisation)} <span aria-hidden="true">·</span> ${esc(story.location)}</p>
    <h3 class="poster-story">${esc(story.title)}</h3>
    <p class="poster-lede">${esc(story.challenge)}</p>
    <div class="connection">
      <p class="connection-label"><span class="thread-swatch${heat ? ' thread-swatch--heat' : ''}" aria-hidden="true"></span>${heat ? 'The heat connection' : 'The Equinix connection'}</p>
      <p>${esc(story.connection)}</p>
    </div>
    <dl class="roles">
      <div><dt>What Equinix contributes</dt><dd>${esc(story.equinixContribution)}</dd></div>
      <div><dt>What partners deliver</dt><dd>${esc(story.partnerContribution)}</dd></div>
    </dl>
    ${story.metric ? `<p class="metric"><span class="metric-value">${esc(story.metric)}</span><span class="metric-label">${esc(story.metricLabel)}</span><span class="metric-scope">${esc(story.metricScope)}</span></p>` : ''}
    <div class="actions">
      <a class="btn btn--primary" href="#/story/${story.id}" data-story-trigger="${story.id}">Open the full story</a>
      ${others.map((o) => `<a class="btn btn--ghost" href="#/story/${o.id}" data-story-trigger="${o.id}">${esc(o.title)}</a>`).join('')}
    </div>
  </article>
</section>`;
}

export function chaptersHTML() {
  return topics.map(chapterHTML).join('\n');
}

// ---------------------------------------------------------------------------
// Flythrough steps: one caption per place, plus the data center itself
// ---------------------------------------------------------------------------
export function flySteps() {
  const steps = topics.map((t) => {
    const story = getStory(chapterLead[t.id]);
    return { id: t.id, target: t.sceneTarget, label: t.label, place: CHAPTERS[t.id].place, moment: CHAPTERS[t.id].moment, title: story.title, story: story.id };
  });
  steps.push({
    id: 'datacenter',
    target: 'datacenter',
    label: 'Every thread',
    place: 'Equinix data center',
    moment: 'Private interconnection for care and research. Heat recovered for neighbours. People who keep it running, and who volunteer down the road.',
    title: 'Where every thread in this community begins',
    story: null,
  });
  return steps;
}

export function flythroughHTML() {
  const steps = flySteps();
  return `<div class="fly-captions">${steps
    .map(
      (s, i) => `<div class="fly-caption" data-step="${i}" ${i ? 'hidden' : ''}>
      <p class="fly-kicker"><span>${String(i + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}</span> ${esc(s.label)}</p>
      <h3 class="fly-place">${esc(s.place)}</h3>
      <p class="fly-moment">${esc(s.moment)}</p>
      ${s.story ? `<a class="btn btn--primary btn--small" href="#/story/${s.story}" data-story-trigger="${s.story}">${esc(s.title)}</a>` : `<a class="btn btn--primary btn--small" href="#/principles">Our five community promises</a>`}
    </div>`,
    )
    .join('')}</div>
  <div class="fly-steps" role="group" aria-label="Places in the community">${steps
    .map((s, i) => `<button type="button" class="fly-step" data-step="${i}" aria-pressed="${i === 0}"><span class="fly-step-bar" aria-hidden="true"><i></i></span><span class="fly-step-label">${esc(s.label)}</span></button>`)
    .join('')}</div>`;
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
    <p class="eyebrow">${esc(topics.find((t) => t.id === story.topic).label)} <span aria-hidden="true">·</span> ${esc(relationshipLabels[story.relationship])}</p>
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
      ${story.metric ? `<p class="metric metric--small"><span class="metric-value">${esc(story.metric)}</span><span class="metric-label">${esc(story.metricLabel)}</span><span class="metric-scope">${esc(story.metricScope)}${story.reportingPeriod ? ` Period: ${esc(story.reportingPeriod)}.` : ''}</span></p>` : ''}
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
// Story gallery: poster cards in a horizontal rail with filters
// ---------------------------------------------------------------------------
export function collectionItemHTML(story) {
  const topic = topics.find((t) => t.id === story.topic);
  const media = story.media[0];
  const art = media
    ? `<img class="card-img" src="${esc(media.path.replace('-1200', '-640'))}" alt="" loading="lazy" decoding="async" width="640" height="427">`
    : `<span class="card-type" aria-hidden="true">${esc(story.metric || topic.label)}</span>`;
  return `<li class="card" data-topic="${story.topic}" data-relationship="${story.relationship}">
    <div class="card-art${media ? '' : ' card-art--type'}">${art}<span class="card-thread${story.topic === 'resources' ? ' card-thread--heat' : ''}" aria-hidden="true"></span></div>
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
    <p class="collection-count" id="collection-count" aria-live="polite">${stories.length} stories</p>
    <div class="rail-nav"><button type="button" class="rail-btn" data-rail-dir="-1" aria-label="Previous stories">←</button><button type="button" class="rail-btn" data-rail-dir="1" aria-label="Next stories">→</button></div>
  </div>
  <ul class="cards" id="collection-list" tabindex="0" aria-label="Stories">${stories.map(collectionItemHTML).join('')}</ul>
  <div class="collection-empty" id="collection-empty" hidden>
    <p>No stories match both filters yet. Try another relationship, or see everything.</p>
    <button type="button" class="btn btn--ghost" data-filter-reset>Show all stories</button>
  </div>`;
}

// ---------------------------------------------------------------------------
// Principles as stacking cards; impact numbers; sources
// ---------------------------------------------------------------------------
export function principlesHTML() {
  return `<ol class="stack">${principles
    .map(
      (p, i) => `<li class="stack-card" style="--i:${i}">
        <div class="stack-inner">
          <span class="stack-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <div class="stack-copy">
            <h3 class="stack-name">${esc(p.name)}</h3>
            <p class="stack-promise">${esc(p.promise)}</p>
            <p class="stack-proof"><span class="visually-hidden">Example: </span>${esc(p.proof)}</p>
          </div>
        </div>
      </li>`,
    )
    .join('')}</ol>
  <p class="source-meta stack-note">Equinix U.S. Community Principles. Not every action applies at every location. <a href="${esc(sources.S7.url)}" target="_blank" rel="noopener">Read the principles<span class="visually-hidden"> (opens in a new tab)</span></a></p>`;
}

/** Headline figures, each with its scope. */
export const NUMBERS = [
  { value: 3.5, suffix: 'M+', decimals: 1, label: 'people connected to the internet by Equinix Foundation partners', scope: 'Nonprofit portfolio, 2025', source: 'S4b' },
  { value: 54400, suffix: '+', decimals: 0, label: 'hours volunteered by Equinix employees', scope: 'All employees, 2025', source: 'S6' },
  { value: 95, prefix: '$', suffix: 'M+', decimals: 0, label: 'spent with small and inclusive U.S. businesses', scope: 'U.S. inclusive procurement, 2025', source: 'S7' },
  { value: 5, suffix: '', decimals: 0, label: 'data centers exporting heat to their communities', scope: 'As of 2025', source: 'S6' },
];

export function numbersHTML() {
  const fmt = (n) => {
    const v = n.decimals ? n.value.toFixed(n.decimals) : n.value.toLocaleString('en-GB');
    return `${n.prefix || ''}${v}${n.suffix}`;
  };
  return `<ul class="numbers">${NUMBERS.map(
    (n) => `<li class="number">
      <span class="number-value" data-count="${n.value}" data-decimals="${n.decimals}" data-prefix="${n.prefix || ''}" data-suffix="${n.suffix}">${fmt(n)}</span>
      <span class="number-label">${esc(n.label)}</span>
      <span class="number-scope">${esc(n.scope)}. <a href="${esc(sources[n.source].url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(sources[n.source].title)} (opens in a new tab)</span></a></span>
    </li>`,
  ).join('')}</ul>`;
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
      <div><h3>Achieved</h3><p class="source-meta">Results reported for a past period.</p><ul>${list(groups.historical)}</ul></div>
      <div><h3>Happening now</h3><p class="source-meta">Current programmes and customer stories.</p><ul>${list(groups.current)}</ul></div>
      <div><h3>Committed</h3><p class="source-meta">Stated future commitments, not yet outcomes.</p><ul>${commitments.map((c) => `<li>${esc(c.text)} <a class="source-ref" href="${esc(sources[c.source].url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(sources[c.source].title)} (opens in a new tab)</span></a></li>`).join('')}</ul></div>
    </div>
    <details class="directory">
      <summary>Source directory <span class="source-meta">${Object.keys(sources).length} sources, checked ${formatDate(LAST_CHECKED)}</span></summary>
      <ul class="source-directory">${Object.keys(sources).map(sourceLink).join('')}</ul>
      <p class="source-meta">Summaries on this page are original paraphrases. Figures keep the scope and period stated by each source.</p>
    </details>`;
}
