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

const picture = (media, { cls = '', sizes = '(min-width: 900px) 50vw, 100vw', loading = 'lazy' } = {}) => {
  if (!media) return '';
  const small = media.path.replace('-1200', '-640');
  return `<figure class="${cls}">
    <img src="${esc(media.path)}" srcset="${esc(small)} 640w, ${esc(media.path)} 1200w" sizes="${sizes}" alt="${esc(media.alt)}" loading="${loading}" decoding="async" width="1200" height="800" />
    <figcaption class="note">${ILLUSTRATIVE}</figcaption>
  </figure>`;
};

/**
 * The six sequences of the theatre. Each pairs a chapter with the place it
 * happens in and the light-form the field draws for it.
 */
export const CHAPTERS = {
  care: { number: '01', title: 'Care that <em class="ital">connects.</em>', moment: 'A radiologist opens a patient’s scan. Somewhere, a family is waiting for what it shows.', shape: 'pulse', place: 'hospital', placeName: 'Hospital', film: 'clip-care' },
  discovery: { number: '02', title: 'Discovery that <em class="ital">advances.</em>', moment: 'In Sydney, researchers compare one child’s cancer with cases studied on the other side of the world.', shape: 'constellation', place: 'research', placeName: 'Research centre', film: 'clip-discovery' },
  opportunity: { number: '03', title: 'Opportunity that <em class="ital">grows.</em>', moment: 'A student walks into a data center for the first time and asks how it all works.', shape: 'ascent', place: 'learning', placeName: 'Learning centre', film: 'clip-opportunity' },
  community: { number: '04', title: 'Community in <em class="ital">connection.</em>', moment: 'In Minooka, Illinois, a public bike path runs along the data center site, and land is set aside for a future fire station.', shape: 'town', place: 'homes', placeName: 'Homes and high street', film: 'clip-neighbourhood' },
  resources: { number: '05', title: 'Resources used <em class="ital">thoughtfully.</em>', moment: 'Early swimmers in Saint-Denis are in water warmed, in part, by heat that once left a data center unused.', shape: 'ripples', place: 'aquatic', placeName: 'Aquatic centre', film: 'clip-pool' },
};

export function sequenceSteps() {
  const steps = topics.map((t) => {
    const story = getStory(chapterLead[t.id]);
    const c = CHAPTERS[t.id];
    return { id: t.id, topic: t.id, number: c.number, label: t.label, title: c.title, moment: c.moment, shape: c.shape, place: c.place, placeName: c.placeName, story, heat: t.id === 'resources' };
  });
  steps.push({
    id: 'datacenter',
    topic: null,
    number: '06',
    label: 'The source',
    title: 'Where every <em class="ital">thread</em> begins.',
    moment: 'Private connections for care and research. Heat recovered for neighbours. People who keep it running, and who volunteer down the road. A data center is part of its community, not apart from it.',
    shape: 'mark',
    place: 'datacenter',
    placeName: 'Equinix data center',
    story: null,
    heat: false,
  });
  return steps;
}

export function railHTML() {
  return `<ol class="rail" aria-label="Chapters">${sequenceSteps()
    .map(
      (s, i) => `<li><button type="button" class="rail-item" data-go="${i}" aria-current="${i === 0 ? 'step' : 'false'}">
        <span class="rail-num mono">${s.number}</span><span class="rail-label">${esc(s.label)}</span><span class="rail-bar" aria-hidden="true"></span>
      </button></li>`,
    )
    .join('')}</ol>`;
}

export function chaptersHTML() {
  const steps = sequenceSteps();
  const panel = (s, i) => {
    const story = s.story;
    const media = story?.media?.[0] || { path: 'media/people-1200.webp', alt: 'An operations engineer walks along a daylit corridor beside a planted courtyard.' };
    const metric = story?.metric
      ? `<p class="chapter-metric"><span class="chapter-metric-value">${esc(story.metric)}</span><span class="chapter-metric-label">${esc(story.metricLabel)}</span></p>`
      : '';
    const actions = story
      ? `<a class="btn btn--primary" href="#/story/${story.id}" data-story-trigger="${story.id}">Open the story<svg class="arrow" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
         <span class="note chapter-who">${esc(story.organisation)}</span>`
      : `<a class="btn btn--primary" href="#/day">See one day, connected<svg class="arrow" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
         <a class="btn btn--ghost" href="#/share">Browse the library</a>`;
    return `<article class="chapter${i === 0 ? ' is-active' : ''}${s.heat ? ' chapter--heat' : ''}" id="chapter-${s.id}" data-index="${i}" data-place="${s.place}" data-shape="${s.shape}" aria-labelledby="chapter-title-${s.id}" ${i === 0 ? '' : 'aria-hidden="true"'}>
      <div class="chapter-copy">
        <p class="eyebrow"><b>${s.number}</b> ${esc(s.label)} <span class="dot" aria-hidden="true"></span> ${esc(s.placeName)}</p>
        <h2 class="title chapter-title" id="chapter-title-${s.id}">${s.title}</h2>
        <p class="chapter-moment">${esc(s.moment)}</p>
        ${metric}
        <div class="actions chapter-actions">${actions}</div>
      </div>
      <figure class="portal">
        <img src="${esc(media.path)}" srcset="${esc(media.path.replace('-1200', '-640'))} 640w, ${esc(media.path)} 1200w" sizes="(min-width: 900px) 34vw, 70vw" alt="${esc(media.alt)}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" width="1200" height="800" />
        <figcaption class="note">${ILLUSTRATIVE}</figcaption>
      </figure>
    </article>`;
  };
  return `<div class="chapters" id="chapters">${steps.map(panel).join('')}</div>`;
}

/* A day, connected: seven moments from dawn to the night shift, each tied to a sourced story. */
export const DAY = [
  { time: '05:40', place: 'Saint-Denis, Paris', line: 'The pool is warm before the first swimmer arrives.', film: 'clip-pool', story: 'pa10-heat', heat: true, alt: 'Morning light on the still water of an indoor pool.' },
  { time: '07:15', place: 'A reading room', line: 'A radiologist opens a scan. It arrives in under a second.', film: 'clip-care', story: '3verest', alt: 'Two clinicians study a medical scan together.' },
  { time: '09:30', place: 'Sydney', line: 'Researchers compare one child’s case with data from Philadelphia, Memphis and Heidelberg.', film: 'clip-discovery', story: 'childrens-cancer-institute', alt: 'Two researchers look at a data visualisation in a bright laboratory.' },
  { time: '11:00', place: 'An Equinix IBX', line: 'A school group walks the corridors and asks how it all works.', film: 'clip-opportunity', story: 'pathways-to-tech', alt: 'Students with visitor lanyards listen to an engineer inside a data center.' },
  { time: '16:00', place: 'Minooka, Illinois', line: 'A cyclist takes the new public path along the edge of the campus.', film: 'clip-neighbourhood', story: 'community-principles', alt: 'People cycle and walk along a new path through meadow planting.' },
  { time: '18:30', place: 'A public library', line: 'A volunteer helps a neighbour get online for the first time.', film: 'clip-community', story: 'digital-inclusion', alt: 'A teenage volunteer helps an older woman use a tablet.' },
  { time: '23:00', place: 'Markham, Ontario', line: 'The night shift keeps the pulse steady. Outside, recovered heat is still flowing to homes.', film: 'clip-people', story: 'markham-heat', heat: true, alt: 'An operations engineer walks a daylit corridor beside a courtyard.' },
];

export function dayHTML() {
  const card = (m, i) => {
    const story = getStory(m.story);
    return `<article class="moment${m.heat ? ' moment--heat' : ''}" data-index="${i}" aria-labelledby="moment-${i}">
      <p class="moment-time mono" aria-label="${esc(m.time)}"><span>${esc(m.time)}</span></p>
      <figure class="moment-media">
        <video class="film" muted playsinline loop preload="none" poster="media/${m.film}-poster.jpg" aria-label="${esc(m.alt)}">
          <source src="media/${m.film}.webm" type="video/webm" />
          <source src="media/${m.film}.mp4" type="video/mp4" />
        </video>
      </figure>
      <div class="moment-copy">
        <p class="eyebrow">${esc(m.place)}</p>
        <p class="moment-line" id="moment-${i}">${esc(m.line)}</p>
        <a class="btn btn--link btn--small" href="#/story/${story.id}" data-story-trigger="${story.id}">${esc(story.title)}</a>
      </div>
    </article>`;
  };
  return `<div class="day-track" id="day-track">
    <div class="moment moment--start">
      <p class="eyebrow">One day, connected</p>
      <h2 class="title day-title" id="day-title">From the first swimmer to the <em class="ital">night shift.</em></h2>
      <p class="moment-intro">Seven moments, in seven places, from a single day that Equinix infrastructure quietly helps make possible. Scroll to move through it.</p>
      <p class="note">Each moment links to its sourced story. The films are illustrative and AI generated.</p>
    </div>
    ${DAY.map(card).join('')}
    <div class="moment moment--end">
      <p class="moment-intro">None of this is the data center’s work alone. It is what becomes possible when a community is connected to it.</p>
      <a class="btn btn--primary" href="#/promises">The promises behind it</a>
    </div>
  </div>`;
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
// Library: every story, filterable
// ---------------------------------------------------------------------------
export function libraryItemHTML(story) {
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

export function libraryHTML() {
  const chip = (group, value, label, pressed) =>
    `<button type="button" class="chip" data-filter-group="${group}" data-filter="${value}" aria-pressed="${pressed}">${esc(label)}</button>`;
  return `<div class="filters" role="group" aria-label="Filter stories">
      <div class="filter-row">
        <span class="filter-name">Theme</span>
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
// Promises: the five U.S. Community Principles, each with its proof
// ---------------------------------------------------------------------------
export function promisesHTML() {
  const item = (p, i) => `<li class="promise${i === 0 ? ' is-open' : ''}" data-index="${i}">
      <h3><button type="button" class="promise-btn" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="promise-body-${i}" data-promise="${i}">
        <span class="promise-num mono">0${i + 1}</span><span class="promise-name">${esc(p.name)}</span>
        <svg class="promise-plus" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
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

export const NUMBERS = [
  { value: 3.5, suffix: 'M+', decimals: 1, label: 'people connected to the internet by Equinix Foundation partners', scope: 'Nonprofit portfolio, 2025', source: 'S4b' },
  { value: 54400, suffix: '+', decimals: 0, label: 'hours volunteered by Equinix employees', scope: 'All employees, 2025', source: 'S6' },
  { value: 95, prefix: '$', suffix: 'M+', decimals: 0, label: 'spent with small and inclusive U.S. businesses', scope: 'U.S. inclusive procurement, 2025', source: 'S7' },
  { value: 5, suffix: '', decimals: 0, label: 'data centers exporting heat to their communities', scope: 'As of 2025', source: 'S6' },
];

const digits = (n) => (n.decimals ? n.value.toFixed(n.decimals) : n.value.toLocaleString('en-GB'));
const fmt = (n) => `${n.prefix || ''}${digits(n)}${n.suffix}`;

export function numbersHTML() {
  return `<ol class="numbers">${NUMBERS.map(
    (n, i) => `<li class="number${i === 3 ? ' number--heat' : ''}" data-reveal style="--reveal-delay:${i * 90}ms">
      <span class="number-value" aria-label="${esc(fmt(n))}">${n.prefix ? `<span class="number-prefix">${esc(n.prefix)}</span>` : ''}<span class="number-digits" data-count="${n.value}" data-decimals="${n.decimals}">${digits(n)}</span>${n.suffix ? `<span class="number-suffix">${esc(n.suffix)}</span>` : ''}</span>
      <span class="number-label">${esc(n.label)}</span>
      <span class="note">${esc(n.scope)}. <a href="${esc(sources[n.source].url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(sources[n.source].title)} (opens in a new tab)</span></a></span>
    </li>`,
  ).join('')}</ol>`;
}

/** The ticker under the hero: short, sourced facts that pass by. */
export function tickerHTML() {
  const items = [
    ...NUMBERS.map((n) => `<b>${esc(fmt(n))}</b> ${esc(n.label)}`),
    `<b>1,000+</b> homes expected to be warmed by heat from PA10, Saint-Denis`,
    `<b>Under 1 second</b> to retrieve a medical image on 3verest clouds`,
    `<b>Nearly 2,000</b> students reached in the Pathways to Tech pilot`,
    `<b>100</b> nonprofit partners across 48 metros`,
  ];
  const run = items.map((t) => `<li>${t}<span class="tick" aria-hidden="true"></span></li>`).join('');
  return `<div class="ticker" aria-label="Headline figures"><ul class="ticker-run">${run}</ul><ul class="ticker-run" aria-hidden="true">${run}</ul></div>`;
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
      <div data-reveal style="--reveal-delay:90ms"><h3>Happening now</h3><p class="note">Current programmes and customer stories.</p><ul>${list(groups.current)}</ul></div>
      <div data-reveal style="--reveal-delay:180ms"><h3>Committed</h3><p class="note">Stated future commitments, not yet outcomes.</p><ul>${commitments.map((c) => `<li>${esc(c.text)} <a class="source-ref" href="${esc(sources[c.source].url)}" target="_blank" rel="noopener">Source<span class="visually-hidden">: ${esc(sources[c.source].title)} (opens in a new tab)</span></a></li>`).join('')}</ul></div>
    </div>
    <details class="directory">
      <summary>Source directory <span class="source-meta">${Object.keys(sources).length} sources, checked ${formatDate(LAST_CHECKED)}</span></summary>
      <ul class="source-directory">${Object.keys(sources).map(sourceLink).join('')}</ul>
      <p class="source-meta">Summaries on this page are original paraphrases. Figures keep the scope and period stated by each source.</p>
    </details>`;
}
