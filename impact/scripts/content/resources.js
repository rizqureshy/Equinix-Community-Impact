// The resources and quick links: the destinations the Resources curtain shows, as the team listed them (titles, copy, groups and
// contributors from the team's table of 3 November 2026). Pure data and string
// functions, used at build time (pre-rendered into the page) and nowhere else.
//
// Addresses from the team's link inventory of 4 November 2026, each the
// original contributor's source: the hub on the Equinix intranet, the two
// sustainability decks on their SharePoint team sites, six files in their
// author's OneDrive, and the Yoodli programme. All behind an Equinix sign-in
// and opened in a new tab. A `null` href would render as "link to follow" rather than point
// anywhere invented. `file` names the attached source file.
export const GROUPS = [
  { id: 'featured', name: 'Featured', blurb: 'Start here' },
  { id: 'resource', name: 'Resources', blurb: 'Guides, principles and figures' },
  { id: 'practice', name: 'Practice', blurb: 'Rehearse the conversation' },
  { id: 'facilitator', name: 'Facilitator', blurb: 'For running a workshop' },
];

export const RESOURCES = [
  { id: 'hub', group: 'featured', name: 'Community Engagement Employee Hub', blurb: 'Explore Equinix community engagement resources.', by: 'Jodi Baumann', destination: 'Equinix Together: Engaging with Local Communities', href: 'https://equinixinc.sharepoint.com/sites/Intranet/SitePages/Company/Equinix-Together---Engaging-with-Local-Communities.aspx?web=1', file: null, signIn: true, action: 'Open resource' },
  { id: 'steps', group: 'featured', name: 'STEPS: Sustainability & Customer Conversations', blurb: 'Build confidence discussing sustainability and using sustainability as a customer value driver.', by: 'Patricia Leyva', destination: 'STEPS Sales Webinar Final', href: 'https://equinixinc.sharepoint.com/:p:/s/SustainabilityPMO/IQCiamImFXUqRY3lpaha-6o6AaWcEB78tDgo63NSJpZhzRY?e=waUEjj', file: 'STEPS Sales Webinar Final.pptx', signIn: true, action: 'Open file' },
  { id: 'q3', group: 'featured', name: 'Sustainability at Equinix: 2026 Q3 Update', blurb: 'Use current sustainability commitments, reporting tools, customer proof points, and community engagement positioning.', by: 'Patricia Leyva', destination: 'CBR Sustainability Slides 2026 Q3 Short', href: 'https://equinixinc.sharepoint.com/:p:/r/sites/equinixcorporatesustainability/Shared%20Documents/Presentations%20and%20Docs/Sustainability-overview-slides/CBR%20Sustainability%20Slides%202026_Q3_Short.pptx?d=we2ee5822f26b42b2a9db73778225a2f7&csf=1&web=1&e=shH2fq', file: 'CBR Sustainability Slides 2026_Q3_Short.pptx', signIn: true, action: 'Open file' },
  { id: 'grants', group: 'resource', name: 'Grant Partner Guide', blurb: 'Find trusted local, regional, and global partners for community engagement and impact.', by: 'Jodi Baumann', destination: 'Foundation Grant Partner Guide v3', href: 'https://equinixinc-my.sharepoint.com/personal/jbaumann_equinix_com/Documents/Microsoft%20Teams%20Chat%20Files/Foundation_Grant_Partner_Guide_v3%20(1).pdf', file: 'Foundation_Grant_Partner_Guide_v3.pdf', signIn: true, action: 'Open file' },
  { id: 'dinner', group: 'resource', name: 'Talking About Data Centers: Dinner Table Guide', blurb: 'Use approachable key messages, straight answers, and community proof points in everyday conversations.', by: 'Jodi Baumann', destination: 'Equinix Community Ambassador Card', href: 'https://equinixinc-my.sharepoint.com/personal/jbaumann_equinix_com/Documents/Microsoft%20Teams%20Chat%20Files/Equinix_Community_Ambassador_Card_8.5x5.5_with_bleed_v7.pdf', file: 'Equinix_Community_Ambassador_Card_8.5x5.5_with_bleed_v7.pdf', signIn: true, action: 'Open file' },
  { id: 'principles', group: 'resource', name: 'Our Five Community Principles', blurb: 'Understand Equinix’s principles for public infrastructure, power, jobs and skills, natural resources, and digital inclusion.', by: 'Jodi Baumann', destination: 'EQ Five Community Principles brochure', href: 'https://equinixinc-my.sharepoint.com/personal/jbaumann_equinix_com/Documents/Microsoft%20Teams%20Chat%20Files/EQ%20Five%20Community%20Principles_brochure_8.25x10.75_2026-10-08_PRESS%20(1).pdf', file: 'EQ Five Community Principles_brochure_8.25x10.75_2026-10-08_PRESS.pdf', signIn: true, action: 'Open file' },
  { id: 'scenarios', group: 'practice', name: 'Practice a Community Conversation', blurb: 'Work through realistic stakeholder scenarios and practice responding with available resources.', by: 'Jodi Baumann', destination: 'GLO MD Scenario Cards', href: 'https://equinixinc-my.sharepoint.com/personal/jbaumann_equinix_com/Documents/Microsoft%20Teams%20Chat%20Files/GLO_MD_Scenario_Cards%20(2).pdf', file: 'GLO_MD_Scenario_Cards.pdf', signIn: true, action: 'Open file' },
  { id: 'metrics', group: 'resource', name: 'FY25 Sustainability Metrics Cheat Sheet', blurb: 'Access current environmental, social, and governance metrics for informed conversations.', by: 'Jodi Baumann', destination: 'Equinix FY25 Sustainability Cheat Sheet', href: 'https://equinixinc-my.sharepoint.com/personal/jbaumann_equinix_com/_layouts/15/Doc.aspx?sourcedoc=%7B90FABABE-0529-4A6B-A2B7-645D0744A04A%7D&file=Equinix%20FY25%20Sustainability%20Cheat%20Sheet_FINAL%20(1).docx&action=default&mobileredirect=true&DefaultItemOpen=1', file: 'Equinix FY25 Sustainability Cheat Sheet_FINAL.docx', signIn: true, action: 'Open file' },
  { id: 'talktrack', group: 'facilitator', name: 'Community Engagement Workshop Talk Track', blurb: 'Use the GLO workshop narrative and facilitation flow to support community engagement conversations.', by: 'Jodi Baumann', destination: 'GLO Kurt Talk Track', href: 'https://equinixinc-my.sharepoint.com/personal/jbaumann_equinix_com/_layouts/15/Doc.aspx?sourcedoc=%7B7FA32091-884E-4A5F-9C3A-BA71086AEA0C%7D&file=GLO_Kurt%20Talk%20Track%2010_12.pptx&action=edit&mobileredirect=true&DefaultItemOpen=1', file: 'GLO_Kurt Talk Track 10_12.pptx', signIn: true, action: 'Open file' },
  { id: 'yoodli', group: 'practice', name: 'Practice the Community Conversation in Yoodli', blurb: 'Build confidence through guided practice for real community conversations.', by: 'Myriam Whalen', destination: 'Organization Programs, Yoodli', href: 'https://app.yoodli.ai/org/content/programs/7KtSBQbHujY3BuMiPUSLHK', file: null, signIn: true, action: 'Open Yoodli practice' },
];

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function note(r) {
  if (!r.href) return r.file ? `${r.action}: file to follow` : `${r.action}: link to follow`;
  return r.signIn ? `${r.action}, Equinix sign-in, new tab` : `${r.action}, new tab`;
}

/** One destination as a link, or a quiet placeholder while its address is awaited: the title alone. */
function itemHTML(r, cls) {
  const inner = `<b class="${cls}-name">${esc(r.name)}</b>${r.href ? '' : `<small class="${cls}-note">${esc(note(r))}</small>`}`;
  if (!r.href) return `<li class="${cls}-item is-pending" data-resource="${r.id}"><span class="${cls}-link">${inner}</span></li>`;
  return `<li class="${cls}-item" data-resource="${r.id}"><a class="${cls}-link" href="${esc(r.href)}" target="_blank" rel="noopener">${inner}</a></li>`;
}

/** The curtain: the destinations in their groups. */
export function resourcesHTML() {
  return GROUPS.map((g, i) => {
    const items = RESOURCES.filter((r) => r.group === g.id);
    if (!items.length) return '';
    return `<li class="curtain-group" data-group="${g.id}" style="--i: ${i}"><h3 class="curtain-group-name">${esc(g.name)}<span class="curtain-group-blurb">${esc(g.blurb)}</span></h3><ul class="curtain-group-list">${items.map((r) => itemHTML(r, 'curtain')).join('\n')}</ul></li>`;
  }).join('\n');
}
