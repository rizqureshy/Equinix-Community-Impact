// The resources and quick links: the destinations the Resources curtain and
// the footer sitemap show, as the team listed them (titles, copy, groups and
// contributors from the team's table of 3 November 2026). Pure data and string
// functions, used at build time (pre-rendered into the page) and nowhere else.
//
// `href` is null until the address arrives: such an item renders as
// "Link to follow" rather than pointing anywhere invented. `file` names the
// source file the team attached, to be hosted or linked once its home is
// agreed (the repository is public, so internal files should not be committed
// here). `signIn` marks a destination that needs an Equinix sign-in and opens
// in a new tab.
export const GROUPS = [
  { id: 'featured', name: 'Featured', blurb: 'Start here' },
  { id: 'resource', name: 'Resources', blurb: 'Guides, principles and figures' },
  { id: 'practice', name: 'Practice', blurb: 'Rehearse the conversation' },
  { id: 'facilitator', name: 'Facilitator', blurb: 'For running a workshop' },
];

export const RESOURCES = [
  { id: 'hub', group: 'featured', name: 'Community Engagement Employee Hub', blurb: 'Explore Equinix community engagement resources.', by: 'Jodi Baumann', destination: 'Equinix Together: Engaging with Local Communities', href: null, file: null, signIn: true, action: 'Open resource' },
  { id: 'steps', group: 'featured', name: 'STEPS: Sustainability and Customer Conversations', blurb: 'Build confidence discussing sustainability and using sustainability as a customer value driver.', by: 'Patricia Leyva', destination: 'STEPS Sales Webinar Final', href: null, file: 'STEPS Sales Webinar Final.pptx', signIn: true, action: 'Open file' },
  { id: 'q3', group: 'featured', name: 'Sustainability at Equinix: 2026 Q3 Update', blurb: 'Use current sustainability commitments, reporting tools, customer proof points, and community engagement positioning.', by: 'Patricia Leyva', destination: 'CBR Sustainability Slides 2026 Q3 Short', href: null, file: 'CBR Sustainability Slides 2026_Q3_Short.pptx', signIn: true, action: 'Open file' },
  { id: 'grants', group: 'resource', name: 'Grant Partner Guide', blurb: 'Find trusted local, regional, and global partners for community engagement and impact.', by: 'Jodi Baumann', destination: 'Foundation Grant Partner Guide v3', href: null, file: 'Foundation_Grant_Partner_Guide_v3.pdf', signIn: true, action: 'Open file' },
  { id: 'dinner', group: 'resource', name: 'Talking About Data Centers: Dinner Table Guide', blurb: 'Use approachable key messages, straight answers, and community proof points in everyday conversations.', by: 'Jodi Baumann', destination: 'Equinix Community Ambassador Card', href: null, file: 'Equinix_Community_Ambassador_Card_8.5x5.5_with_bleed_v7.pdf', signIn: true, action: 'Open file' },
  { id: 'principles', group: 'resource', name: 'Our Five Community Principles', blurb: 'Understand Equinix’s principles for public infrastructure, power, jobs and skills, natural resources, and digital inclusion.', by: 'Jodi Baumann', destination: 'EQ Five Community Principles brochure', href: null, file: 'EQ Five Community Principles_brochure_8.25x10.75_2026-10-08_PRESS.pdf', signIn: true, action: 'Open file' },
  { id: 'scenarios', group: 'practice', name: 'Practice a Community Conversation', blurb: 'Work through realistic stakeholder scenarios and practice responding with available resources.', by: 'Jodi Baumann', destination: 'GLO MD Scenario Cards', href: null, file: 'GLO_MD_Scenario_Cards.pdf', signIn: true, action: 'Open file' },
  { id: 'metrics', group: 'resource', name: 'FY25 Sustainability Metrics Cheat Sheet', blurb: 'Access current environmental, social, and governance metrics for informed conversations.', by: 'Jodi Baumann', destination: 'Equinix FY25 Sustainability Cheat Sheet', href: null, file: 'Equinix FY25 Sustainability Cheat Sheet_FINAL.docx', signIn: true, action: 'Open file' },
  { id: 'talktrack', group: 'facilitator', name: 'Community Engagement Workshop Talk Track', blurb: 'Use the GLO workshop narrative and facilitation flow to support community engagement conversations.', by: 'Jodi Baumann', destination: 'GLO Kurt Talk Track', href: null, file: 'GLO_Kurt Talk Track 10_12.pptx', signIn: true, action: 'Open file' },
  { id: 'yoodli', group: 'practice', name: 'Practice the Community Conversation in Yoodli', blurb: 'Build confidence through guided practice for real community conversations.', by: 'Myriam Whalen', destination: 'Organization Programs, Yoodli', href: null, file: null, signIn: true, action: 'Open Yoodli practice' },
];

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function note(r) {
  if (!r.href) return r.file ? `${r.action}: file to follow` : `${r.action}: link to follow`;
  return r.signIn ? `${r.action}, Equinix sign-in, new tab` : `${r.action}, new tab`;
}

/** One destination as a link, or a quiet placeholder while its address is awaited. */
function itemHTML(r, cls) {
  const inner = `<b class="${cls}-name">${esc(r.name)}${r.signIn ? '<span class="res-lock" aria-label="needs Equinix sign-in"></span>' : ''}</b><span class="${cls}-blurb">${esc(r.blurb)}</span><small class="${cls}-note">${esc(note(r))}</small>`;
  if (!r.href) return `<li class="${cls}-item is-pending" data-resource="${r.id}"><span class="${cls}-link">${inner}</span></li>`;
  return `<li class="${cls}-item" data-resource="${r.id}"><a class="${cls}-link" href="${esc(r.href)}" target="_blank" rel="noopener">${inner}</a></li>`;
}

/** The curtain: the destinations in their groups. */
export function resourcesHTML() {
  return GROUPS.map((g) => {
    const items = RESOURCES.filter((r) => r.group === g.id);
    if (!items.length) return '';
    return `<li class="curtain-group" data-group="${g.id}"><h3 class="curtain-group-name">${esc(g.name)}<span class="curtain-group-blurb">${esc(g.blurb)}</span></h3><ul class="curtain-group-list">${items.map((r) => itemHTML(r, 'curtain')).join('\n')}</ul></li>`;
  }).join('\n');
}

/** The same destinations as the footer sitemap, the stationary bar at the very bottom. */
export function sitemapHTML() {
  return `<nav class="sitemap" aria-label="Resources and quick links">
    <p class="sitemap-eyebrow eyebrow">Resources and quick links</p>
    <ul class="sitemap-list">${RESOURCES.map((r) => itemHTML(r, 'sitemap')).join('\n')}</ul>
  </nav>`;
}
