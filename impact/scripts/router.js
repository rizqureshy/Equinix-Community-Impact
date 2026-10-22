// Hash routes, so the prototype works at any base path without server
// configuration (GitHub Pages subpaths, Cloudflare Pages roots, local files).
//   #/                     overview
//   #/community            the impact map (section id `journey`,
//                          since `community` is also a chapter topic)
//   #/chapter/<topic>      a story chapter
//   #/story/<id>           a story opened in the detail view
//   #/stories | #/progress | #/promises | #/people | #/training | #/share | #/sources
//   #/explore and #/principles are older links, kept as aliases
import { topics, getStory } from './content/stories.js';

const SECTIONS = new Set(['journey', 'progress', 'stories', 'promises', 'people', 'training', 'share', 'sources']);
const ALIASES = { community: 'journey', explore: 'journey', principles: 'promises' };
const TOPICS = new Set(topics.map((t) => t.id));

export function parseHash(hash = '') {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [head, arg] = parts;
  if (!head) return { section: 'top' };
  if (ALIASES[head]) return TOPICS.has(arg) ? { section: ALIASES[head], topic: arg } : { section: ALIASES[head] };
  if (head === 'chapter' && TOPICS.has(arg)) return { section: arg, topic: arg };
  if (head === 'story' && getStory(arg)) return { story: arg, section: getStory(arg).topic, topic: getStory(arg).topic };
  if (SECTIONS.has(head)) return { section: head };
  return { section: 'top' };
}

export function hashFor({ section, topic, story } = {}) {
  if (story) return `#/story/${encodeURIComponent(story)}`;
  if (TOPICS.has(section)) return `#/chapter/${section}`;
  if (section === 'journey') return '#/community';
  if (SECTIONS.has(section)) return `#/${section}`;
  return '#/';
}

/** Absolute link to a story that respects the deployed base path. */
export function storyURL(id, loc = window.location) {
  return `${loc.origin}${loc.pathname}${loc.search}${hashFor({ story: id })}`;
}

/** Element id to scroll to for a section. */
export function anchorFor(section) {
  if (TOPICS.has(section)) return `chapter-${section}`;
  return section === 'journey' ? 'community' : section;
}
