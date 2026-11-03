// The resources and quick links: the destinations the Resources curtain and
// the footer sitemap show. Pure data and string functions, used at build time
// (pre-rendered into the page) and nowhere else.
//
// `href` is null until the team supplies the address: such an item renders
// as "link to follow" rather than pointing anywhere invented. `signIn` marks
// a SharePoint page that needs an Equinix sign-in and opens in a new tab.
export const RESOURCES = [
  { id: 'programs', name: 'Community programs', blurb: 'Programmes, partners and how to join one', href: null, signIn: true },
  { id: 'guides', name: 'Guides and toolkits', blurb: 'What to say, how to run an event', href: null, signIn: true },
  { id: 'policies', name: 'Policies', blurb: 'Giving, volunteering, sponsorship', href: null, signIn: true },
  { id: 'reports', name: 'Impact reports', blurb: 'The sustainability and impact reports', href: 'https://www.equinix.com/about/sustainability', signIn: false },
  { id: 'map', name: 'Global impact map', blurb: 'Every site, every programme', href: null, signIn: false },
  { id: 'partners', name: 'Partner organisations', blurb: 'Who we work with, and where', href: null, signIn: false },
  { id: 'events', name: 'Events', blurb: 'What is coming up near you', href: null, signIn: true },
  { id: 'involved', name: 'Get involved', blurb: 'Volunteer, nominate, give', href: null, signIn: false },
];

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function note(r) {
  if (!r.href) return 'Link to follow';
  return r.signIn ? 'SharePoint, Equinix sign-in, opens in a new tab' : 'Opens in a new tab';
}

/** One destination as a link, or a quiet placeholder while its address is awaited. */
function itemHTML(r, cls) {
  const inner = `<b class="${cls}-name">${esc(r.name)}${r.signIn ? '<span class="res-lock" aria-label="needs Equinix sign-in"></span>' : ''}</b><span class="${cls}-blurb">${esc(r.blurb)}</span><small class="${cls}-note">${note(r)}</small>`;
  if (!r.href) return `<li class="${cls}-item is-pending" data-resource="${r.id}"><span class="${cls}-link">${inner}</span></li>`;
  return `<li class="${cls}-item" data-resource="${r.id}"><a class="${cls}-link" href="${esc(r.href)}" target="_blank" rel="noopener">${inner}</a></li>`;
}

/** The list on the curtain. */
export function resourcesHTML() {
  return RESOURCES.map((r) => itemHTML(r, 'curtain')).join('\n');
}

/** The same destinations as the footer sitemap, the stationary bar at the very bottom. */
export function sitemapHTML() {
  return `<nav class="sitemap" aria-label="Resources and quick links">
    <p class="sitemap-eyebrow eyebrow">Resources and quick links</p>
    <ul class="sitemap-list">${RESOURCES.map((r) => itemHTML(r, 'sitemap')).join('\n')}</ul>
  </nav>`;
}
