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

const ILLUSTRATIVE = 'Illustrative image, AI generated. Not a photograph of the organisation or people named.';

function picture(media, { sizes = '(min-width: 1000px) 40vw, 92vw', eager = false, cls = '' } = {}) {
  if (!media) return '';
  const base = media.path.replace(/-1200\.webp$/, '');
  return `<figure class="media ${cls}">
    <img src="${esc(media.path)}" srcset="${esc(base)}-640.webp 640w, ${esc(media.path)} 1200w" sizes="${sizes}"
      alt="${esc(media.alt)}" width="1200" height="800" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    ${media.usage === 'illustrative' ? `<figcaption class="media-note">${ILLUSTRATIVE}</figcaption>` : ''}
  </figure>`;
}

/** Chapter copy is editorial framing around each lead story. */
const CHAPTERS = {
  care: {
    number: '01',
    title: 'Care that connects.',
    moment: 'A radiologist opens a patient’s scan. Somewhere, a family is waiting for what it shows.',
  },
  discovery: {
    number: '02',
    title: 'Discovery that advances.',
    moment: 'In Sydney, researchers compare one child’s cancer with cases studied on the other side of the world.',
  },
  opportunity: {
    number: '03',
    title: 'Opportunity that grows.',
    moment: 'A student walks into a data center for the first time and asks how it all works.',
  },
  community: {
    number: '04',
    title: 'Community in connection.',
    moment: 'In Minooka, Illinois, a public bike path runs along the data center site, and land is being donated for a future fire station.',
  },
  resources: {
    number: '05',
    title: 'Resources used thoughtfully.',
    moment: 'Early swimmers in Saint-Denis are in water warmed, in part, by heat that once left a data center unused.',
  },
};

export function chapterHTML(topic) {
  const story = getStory(chapterLead[topic.id]);
  const c = CHAPTERS[topic.id];
  const media = story.media[0];
  const video = topic.id === 'resources'
    ? `<figure class="media media--video"><video class="ambient-video" muted playsinline loop preload="none"
        poster="media/clip-pool-poster.jpg" aria-label="${esc(media.alt)}">
        <source src="media/clip-pool.webm" type="video/webm"><source src="media/clip-pool.mp4" type="video/mp4"></video>
        <figcaption class="media-note">${ILLUSTRATIVE}</figcaption></figure>`
    : picture(media);
  const others = stories.filter((s) => s.topic === topic.id && s.id !== story.id);
  return `<article class="chapter" id="chapter-${topic.id}" data-chapter="${topic.id}" data-focus="${topic.sceneTarget}" aria-labelledby="chapter-${topic.id}-title">
  <div class="chapter-inner">
    <p class="eyebrow"><span class="eyebrow-num">${c.number}</span> ${esc(topic.label)}</p>
    ${video}
    <p class="chapter-moment">${esc(c.moment)}</p>
    <h2 class="chapter-title" id="chapter-${topic.id}-title">${esc(c.title)}</h2>
    <p class="chapter-lede">${esc(story.challenge)}</p>
    <div class="connection">
      <p class="connection-label"><span class="thread-swatch${topic.id === 'resources' ? ' thread-swatch--heat' : ''}" aria-hidden="true"></span>${topic.id === 'resources' ? 'The heat connection' : 'The Equinix connection'}</p>
      <p>${esc(story.connection)}</p>
    </div>
    <dl class="roles">
      <div><dt>What Equinix contributes</dt><dd>${esc(story.equinixContribution)}</dd></div>
      <div><dt>What partners deliver</dt><dd>${esc(story.partnerContribution)}</dd></div>
    </dl>
    ${story.metric ? `<p class="metric"><span class="metric-value">${esc(story.metric)}</span> <span class="metric-label">${esc(story.metricLabel)}</span><span class="metric-scope">${esc(story.metricScope)}</span></p>` : ''}
    <div class="chapter-actions">
      <a class="btn btn--primary" href="#/story/${story.id}" data-story-trigger="${story.id}">Open the full story</a>
      ${others.map((o) => `<a class="btn btn--quiet" href="#/story/${o.id}" data-story-trigger="${o.id}">${esc(o.title)}</a>`).join('')}
    </div>
  </div>
</article>`;
}

export function chaptersHTML() {
  return topics.map(chapterHTML).join('\n');
}

export function explorerHTML() {
  const tabs = topics
    .map(
      (t, i) => `<button type="button" role="tab" class="topic-tab" id="topic-tab-${t.id}" data-topic="${t.id}"
        aria-selected="${i === 0}" aria-controls="topic-panel" tabindex="${i === 0 ? 0 : -1}">${esc(t.label)}</button>`,
    )
    .join('');
  return `<div class="topic-tabs" role="tablist" aria-label="Choose a topic">
    <span class="topic-indicator" aria-hidden="true"></span>${tabs}
  </div>
  <div class="topic-panel" id="topic-panel" role="tabpanel" aria-labelledby="topic-tab-${topics[0].id}" aria-live="polite">
    ${topicPreviewHTML(topics[0].id)}
  </div>`;
}

export function topicPreviewHTML(topicId) {
  const topic = topics.find((t) => t.id === topicId);
  const story = getStory(chapterLead[topicId]);
  return `<p class="preview-place">${esc(story.organisation.split(',')[0])} <span aria-hidden="true">·</span> ${esc(story.location)}</p>
    <h3 class="preview-title">${esc(story.title)}</h3>
    <p class="preview-summary">${esc(story.summary)}</p>
    <div class="preview-actions">
      <a class="btn btn--primary" href="#/chapter/${topic.id}">Follow the thread</a>
      <a class="btn btn--quiet" href="#/story/${story.id}" data-story-trigger="${story.id}">Open the story</a>
    </div>`;
}

const sourceLink = (id) => {
  const s = sources[id];
  return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}<span class="visually-hidden"> (opens in a new tab)</span></a>
    <span class="source-meta">${esc(s.publisher)}${s.published ? `, ${formatDate(s.published)}` : ', date not stated'}${s.kind === 'secondary' ? ', secondary reporting' : ''}</span></li>`;
};

export function storyDetailHTML(story) {
  const media = story.media[0];
  return `<header class="story-head">
    <p class="eyebrow">${esc(topics.find((t) => t.id === story.topic).label)} <span aria-hidden="true">·</span> ${esc(relationshipLabels[story.relationship])}</p>
    <h2 class="story-title" id="story-title">${esc(story.title)}</h2>
    <p class="story-org">${esc(story.organisation)} <span aria-hidden="true">·</span> ${esc(story.location)}</p>
  </header>
  ${picture(media, { sizes: '(min-width: 900px) 560px, 92vw', cls: 'story-media' })}
  <div class="story-body">
    <section><h3>The people</h3><p>${esc(story.humanContext)}</p></section>
    <section><h3>The ambition</h3><p>${esc(story.challenge)}</p></section>
    <section class="story-split">
      <div><h3>What Equinix contributes</h3><p>${esc(story.equinixContribution)}</p></div>
      <div><h3>What partners deliver</h3><p>${esc(story.partnerContribution)}</p></div>
    </section>
    <section><h3>What has happened</h3><p>${esc(story.outcome)}</p>
      ${story.metric ? `<p class="metric metric--small"><span class="metric-value">${esc(story.metric)}</span> <span class="metric-label">${esc(story.metricLabel)}</span><span class="metric-scope">${esc(story.metricScope)}${story.reportingPeriod ? ` Period: ${esc(story.reportingPeriod)}.` : ''}</span></p>` : ''}
    </section>
    ${story.quote ? `<blockquote class="story-quote"><p>“${esc(story.quote.text)}”</p><footer>${esc(story.quote.attribution)}</footer></blockquote>` : ''}
    <section class="story-connection"><h3><span class="thread-swatch${story.topic === 'resources' && story.id === 'pa10-heat' ? ' thread-swatch--heat' : ''}" aria-hidden="true"></span>The Equinix connection</h3><p>${esc(story.connection)}</p></section>
    <section class="story-carry"><h3>Carry it forward</h3><p>${esc(story.conversationStarter)}</p>
      <div class="share-actions">
        <button type="button" class="btn btn--primary" data-copy="summary" data-story="${story.id}">Copy story summary</button>
        <button type="button" class="btn btn--quiet" data-copy="link" data-story="${story.id}">Copy story link</button>
      </div>
    </section>
    <section class="story-sources"><h3>Sources</h3><ul>${story.sources.map(sourceLink).join('')}</ul>
      <p class="source-meta">${esc(timeframeLabels[story.timeframe])}. Content checked ${formatDate(story.lastChecked)}.</p></section>
  </div>`;
}

export function collectionItemHTML(story) {
  const topic = topics.find((t) => t.id === story.topic);
  return `<li class="collection-item" data-topic="${story.topic}" data-relationship="${story.relationship}">
    <p class="collection-tags"><span class="tag">${esc(topic.label)}</span><span class="tag tag--quiet">${esc(relationshipLabels[story.relationship])}</span></p>
    <h3 class="collection-title">${esc(story.title)}</h3>
    <p class="collection-org">${esc(story.organisation)}</p>
    <p class="collection-summary">${esc(story.summary)}</p>
    <div class="collection-actions">
      <a class="btn btn--small btn--primary" href="#/story/${story.id}" data-story-trigger="${story.id}">Open story</a>
      <button type="button" class="btn btn--small btn--quiet" data-copy="summary" data-story="${story.id}">Copy summary</button>
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
  <p class="collection-count" id="collection-count" aria-live="polite">${stories.length} stories</p>
  <ul class="collection-list" id="collection-list">${stories.map(collectionItemHTML).join('')}</ul>
  <div class="collection-empty" id="collection-empty" hidden>
    <p>No stories match both filters yet. Try another relationship, or see everything.</p>
    <button type="button" class="btn btn--quiet" data-filter-reset>Show all stories</button>
  </div>`;
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
    <h3 class="sources-heading">Source directory</h3>
    <ul class="source-directory">${Object.keys(sources).map(sourceLink).join('')}</ul>
    <p class="source-meta">All sources checked ${formatDate(LAST_CHECKED)}. Summaries on this page are original paraphrases. Figures keep the scope and period stated by each source.</p>`;
}

export function principlesHTML() {
  return `<ol class="principles-list">${principles
    .map(
      (p, i) => `<li class="principle">
        <span class="principle-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <h3 class="principle-name">${esc(p.name)}</h3>
        <p class="principle-promise">${esc(p.promise)}</p>
        <p class="principle-proof"><span class="visually-hidden">Example: </span>${esc(p.proof)}</p>
      </li>`,
    )
    .join('')}</ol>
  <p class="source-meta">Equinix U.S. Community Principles. Not every action applies at every location. <a href="${esc(sources.S7.url)}" target="_blank" rel="noopener">Read the principles<span class="visually-hidden"> (opens in a new tab)</span></a></p>`;
}
