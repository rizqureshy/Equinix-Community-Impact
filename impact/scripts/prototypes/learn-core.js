// Learner experiences, sketch round 1: the logic behind the four sketches.
// Pure functions over the story module, so the page can be thin and the
// scoring can be unit tested. Nothing here touches the DOM. Every figure a
// sketch shows comes from stories.js with its scope, period and source.
import { stories, sources, topics, principles, chapterLead, getStory } from '../content/stories.js';

// ---- Shared: the figures ----------------------------------------------------

/** Every story that carries a figure, with the three things a figure must travel with. */
export const figures = () =>
  stories
    .filter((s) => s.metric)
    .map((s) => ({
      id: s.id,
      title: s.title,
      topic: s.topic,
      organisation: s.organisation,
      metric: s.metric,
      label: s.metricLabel,
      scope: s.metricScope,
      period: s.reportingPeriod,
      sourceIds: s.sources,
      source: s.sources.map((id) => `${sources[id].title} (${sources[id].publisher})`)[0],
    }));

/** Deterministic shuffle so a seeded deal can be reproduced in tests. */
export function shuffle(list, rng = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Sketch 1: Pitch mode ---------------------------------------------------

const BEAT_SECONDS = 18;

/**
 * Ninety seconds on one chapter: five beats of eighteen seconds, each a
 * sentence or two to say and, where a figure is spoken, the caveat to say
 * with it. Pass 'all' for a walk across the five chapters.
 */
export function pitchBeats(topicId = 'care') {
  if (topicId === 'all') {
    return topics.map((t) => {
      const s = getStory(chapterLead[t.id]);
      const detail = s.metric
        ? { say: `${s.metric} ${s.metricLabel}.`, caveat: `${s.metricScope} Period: ${s.reportingPeriod}.` }
        : { say: s.outcome, caveat: null };
      return {
        kind: t.label,
        title: s.title,
        say: `${s.summary} ${detail.say}`,
        caveat: detail.caveat,
        seconds: BEAT_SECONDS,
        sourceIds: s.sources,
      };
    });
  }
  const s = getStory(chapterLead[topicId]);
  if (!s) return [];
  const beats = [
    { kind: 'Open', title: 'A person and a place', say: s.humanContext, caveat: null },
    { kind: 'What', title: 'What is happening', say: s.summary, caveat: null },
    s.metric
      ? { kind: 'Figure', title: `${s.metric} ${s.metricLabel}`, say: `${s.metric} ${s.metricLabel}. ${s.outcome}`, caveat: `${s.metricScope} Period: ${s.reportingPeriod}.` }
      : { kind: 'Detail', title: 'What the source says', say: s.outcome, caveat: 'No headline figure in this story. Say what the source says and no more.' },
    { kind: 'Our part', title: 'Where Equinix sits', say: s.connection, caveat: 'Equinix provides the infrastructure. The partner does the work.' },
    { kind: 'Close', title: 'Turn it back to them', say: s.conversationStarter, caveat: null },
  ];
  return beats.map((b) => ({ ...b, seconds: BEAT_SECONDS, sourceIds: s.sources }));
}

/** The one-page leave-behind for a pitch, as plain text (copy) and as structured data (print). */
export function leaveBehind(topicId = 'care') {
  const beats = pitchBeats(topicId);
  const topic = topics.find((t) => t.id === topicId);
  const title = topicId === 'all' ? 'Infrastructure for human possibility: five chapters in ninety seconds' : `${topic.label}: ${getStory(chapterLead[topicId]).title}`;
  const ids = [...new Set(beats.flatMap((b) => b.sourceIds))];
  const refs = ids.map((id) => ({ id, title: sources[id].title, publisher: sources[id].publisher, url: sources[id].url, kind: sources[id].kind }));
  const text = [
    title,
    '',
    ...beats.map((b) => `${b.kind}. ${b.say}${b.caveat ? ` (${b.caveat})` : ''}`),
    '',
    'Sources',
    ...refs.map((r) => `${r.title}, ${r.publisher}. ${r.url}`),
    '',
    'Figures keep their scope and period. Equinix provides infrastructure; partners do the work.',
  ].join('\n');
  return { title, beats, refs, text };
}

// ---- Sketch 2: Scope check ----------------------------------------------------

/**
 * For each figure, three questions: which scope, which period, which source.
 * Distractors are the real scopes, periods and sources of other figures, so
 * the learner is choosing between true sentences and must know which belongs.
 */
export function buildDrill(rng = Math.random, count = 5) {
  const all = figures();
  const pick = (list, exclude) => {
    const pool = shuffle([...new Set(list.filter((v) => v && v !== exclude))], rng).slice(0, 2);
    return shuffle([exclude, ...pool], rng);
  };
  return shuffle(all, rng)
    .slice(0, count)
    .map((f) => ({
      id: f.id,
      title: f.title,
      organisation: f.organisation,
      metric: f.metric,
      label: f.label,
      steps: [
        { key: 'scope', ask: 'Which scope travels with this figure?', answer: f.scope, options: pick(all.map((x) => x.scope), f.scope) },
        { key: 'period', ask: 'Which period?', answer: f.period, options: pick(all.map((x) => x.period), f.period) },
        { key: 'source', ask: 'Which source?', answer: f.source, options: pick(all.map((x) => x.source), f.source) },
      ],
    }));
}

// ---- Sketch 3: Teach-back ------------------------------------------------------

/** How each figure may be said aloud. Any one form earns the point. */
const SAY = {
  '3verest': ['under 1 second', 'under a second', 'under one second', 'less than a second', 'sub second', 'sub-second', 'in a second', '28 times', '28x'],
  'harrison-ai': ['months to days', 'from months to days', 'days instead of months', '8x', '8 times', 'eight times'],
  'pathways-to-tech': ['2,000', '2000', 'two thousand', '2 000'],
  'community-principles': ['95', 'ninety five', 'ninety-five'],
  'digital-inclusion': ['3.5', 'three and a half', 'three point five', '3,5'],
  'employee-volunteering': ['54,400', '54400', 'fifty four thousand', 'fifty-four thousand', '54,000', '54000', '54 thousand'],
  'pa10-heat': ['1,000', '1000', 'a thousand', 'one thousand', 'thousand homes'],
  'markham-heat': ['14 million', '14m', 'fourteen million', '14,000,000'],
  'efficient-operations': ['1.37', 'one point three seven', 'one point thirty seven', '1,37', '96'],
};

/** Words that carry the scope or period of each story. Any one earns the point. */
const SCOPE = {
  '3verest': ['3verest reports', 'reported by 3verest', 'their own platform', 'its own platform', 'own figure', 'their figure', 'compared with', 'public cloud', 'according to 3verest', 'they report', 'they say'],
  'harrison-ai': ['equinix reports', 'reported by equinix', 'march 2025', '2025', 'private ai', 'their deployment', 'this deployment'],
  'childrens-cancer-institute': ['sydney', 'philadelphia', 'memphis', 'heidelberg', 'fabric', 'direct', 'private'],
  'pathways-to-tech': ['pilot', 'two year', 'two-year', 'americas', 'asia', '2025', 'select communities'],
  'technician-coalition': ['brazil', 'june 2026', '2026', 'planned', 'first cohort', 'initial cohort', 'generation'],
  'community-principles': ['2025', 'u.s.', 'us ', 'united states', 'inclusive procurement', 'certified', 'calendar year', 'small business', 'small and inclusive'],
  'digital-inclusion': ['2025', 'foundation', 'partners', 'portfolio', 'nonprofit', 'non-profit'],
  'employee-volunteering': ['2025', 'all employees', 'sustainability report', 'calendar year', 'last year'],
  'pa10-heat': ['expected', 'expects', '2024', 'free of charge', '15 years', 'fifteen years', 'this site', 'pa10', 'saint-denis', 'saint denis', 'april 2025'],
  'markham-heat': ['late 2023', '2023', 'one of', 'april 2025', 'district energy', 'contributes', 'one source'],
  'efficient-operations': ['2025', 'average', 'retail ibx', 'definition', 'does not mean', 'annual', 'coverage'],
};

const SOURCE_WORDS = ['source', 'customer story', 'case study', 'blog', 'sustainability report', 'annual report', 'press release', 'equinix together', 'data center knowledge', 'equinix reports', 'reported', 'published', 'according to', 'equinix.com', 'foundation page', 'equinix says', 'our report', 'the report', 'their website', 'investor'];
const ROLE_WORDS = ['provide', 'provides', 'provided', 'host', 'hosts', 'hosted', 'connect', 'connects', 'connection', 'interconnect', 'fabric', 'data center', 'data centre', 'infrastructure', 'home for', 'a place', 'the place', 'space', 'export', 'recovered', 'convened', 'fund', 'funds', 'funding', 'grants', 'volunteer', 'our people', 'our facilities', 'foundation'];
const PARTNER_WORDS = ['they', 'their', 'them', 'partner', 'operator', 'researchers', 'clinicians', 'radiologists', 'nonprofit', 'non-profit', 'utility', 'schools', 'generation', 'the institute', 'customer'];

/** Phrases the house rules forbid, with the line to say instead. */
const FLAGS = [
  { match: /power(s|ing|ed)? (the )?(hospitals?|care|labs?|research)/, note: 'Never "powering hospitals". Equinix hosts and connects; the care is the partner’s.' },
  { match: /we (deliver|provide) (the )?care/, note: 'Equinix does not deliver care. Say what the partner does and where Equinix sits.' },
  { match: /we (cure|treat|heal|save lives|diagnose)/, note: 'The clinical work belongs to the partner. Credit them by name.' },
  { match: /our (researchers|doctors|clinicians|scientists)/, note: 'The researchers are the partner’s, not ours.' },
  { match: /guarantee/, note: 'No guarantees. Say what the source reports.' },
  { match: /thousands of jobs|hundreds of jobs/, note: 'No source on the page supports a jobs total. Never invent a figure.' },
  { match: /every (hospital|school|home|city)|all (hospitals|schools|homes)/, note: 'Keep the scope: a named example, not everywhere.' },
];

const STORY_FLAGS = {
  'pa10-heat': [
    { when: (t) => /(1,?000|thousand)/.test(t) && !/(expect|will|planned|projected|due to)/.test(t), note: 'Say "expected": the 1,000 homes are an expectation Equinix published, not a count.' },
    { when: (t) => /we (heat|warm) the (olympic )?pool/.test(t), note: 'The heat network operator warms the pool. Equinix supplies recovered heat to the network.' },
  ],
  'efficient-operations': [
    { when: (t) => /renewable/.test(t) && !/(coverage|definition|across retail|published)/.test(t), note: 'Renewable energy coverage uses Equinix’s published definition. Say "coverage", not "supply".' },
  ],
  'harrison-ai': [
    { when: (t) => /(accuracy|accurate|detects? cancer)/.test(t), note: 'Harrison.ai’s accuracy claims are theirs and are deliberately not restated here.' },
  ],
};

export const norm = (t) =>
  String(t || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9$%.,'\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const has = (text, words) => words.find((w) => text.includes(w)) || null;

/**
 * Score a spoken or typed teach-back against one story. Returns the five
 * checks the coach also makes, a flag list, and the three-line feedback the
 * coach gives: one thing that landed, one to tighten, and the caveat check.
 */
export function scoreTeachBack(storyId, transcript, seconds = null) {
  const s = getStory(storyId);
  if (!s) throw new Error(`Unknown story ${storyId}`);
  const t = norm(transcript);
  const words = t ? t.split(' ').filter(Boolean).length : 0;
  const orgWords = norm(s.organisation).split(/[ ,.]+/).filter((w) => w.length > 2 && !['the', 'and', 'equinix', 'foundation'].includes(w));

  const checks = [
    {
      key: 'who',
      label: 'Named the partner',
      ok: !!has(t, orgWords) || (storyId === 'community-principles' && /minooka|comed|principles/.test(t)) || (storyId === 'efficient-operations' && /equinix/.test(t)),
      hint: `Say who: ${s.organisation}.`,
      landed: `You named ${s.organisation}.`,
    },
    s.metric
      ? { key: 'figure', label: 'Said the figure', ok: !!has(t, SAY[storyId] || []), hint: `The figure is ${s.metric} ${s.metricLabel}.`, landed: `The figure landed: ${s.metric} ${s.metricLabel}.` }
      : { key: 'figure', label: 'Stayed with the source', ok: !/\d{2,}|thousand|million|percent|%/.test(t), hint: 'This story has no headline figure. Say what the source says and no more.', landed: 'You did not invent a figure where the source has none.' },
    {
      key: 'scope',
      label: s.metric ? 'Gave scope or period' : 'Gave the specifics',
      ok: !!has(t, SCOPE[storyId] || []),
      hint: s.metric ? `Scope: ${s.metricScope} Period: ${s.reportingPeriod}.` : `Specifics the source gives: ${(SCOPE[storyId] || []).slice(0, 4).join(', ')}.`,
      landed: s.metric ? 'The figure travelled with its scope.' : 'You kept to the specifics the source gives.',
    },
    {
      key: 'source',
      label: 'Named a source',
      ok: !!has(t, SOURCE_WORDS),
      hint: `Name where it comes from: ${s.sources.map((id) => sources[id].publisher).join(' or ')}.`,
      landed: 'You said where the figure comes from.',
    },
    {
      key: 'role',
      label: 'Equinix as infrastructure, partner does the work',
      ok: !!has(t, ROLE_WORDS) && (!!has(t, PARTNER_WORDS) || !!has(t, orgWords)),
      hint: 'Say where Equinix sits (hosts, connects, provides) and who does the work.',
      landed: 'Equinix sat where it belongs: the infrastructure, with the partner doing the work.',
    },
  ];

  const flags = [
    ...FLAGS.filter((f) => f.match.test(t)).map((f) => f.note),
    ...(STORY_FLAGS[storyId] || []).filter((f) => f.when(t)).map((f) => f.note),
  ];

  const passed = checks.filter((c) => c.ok);
  const failed = checks.filter((c) => !c.ok);
  const score = Math.max(0, passed.length - Math.min(flags.length, 2));
  const pace = seconds >= 10 && words ? Math.round((words / seconds) * 60) : null;
  const landed = passed.length ? passed[0].landed : words ? 'You spoke. Now give it a name, a figure and a source.' : 'Nothing heard yet.';
  const tighten = flags[0] || (failed.length ? failed[0].hint : pace && pace > 190 ? 'Slow down: that was fast for a listener to hold a figure.' : 'Nothing to tighten. Try it in half the time.');
  const caveat = s.metric
    ? checks[2].ok && checks[3].ok
      ? 'Your figure carried scope, period and source.'
      : `Your figure needs ${[!checks[2].ok && 'its scope and period', !checks[3].ok && 'its source'].filter(Boolean).join(' and ')}.`
    : 'No figure in this story, so nothing to caveat. Keep it that way.';

  return { storyId, words, seconds, pace, score, outOf: checks.length, checks, flags, feedback: { landed, tighten, caveat } };
}

// ---- Sketch 4: Choose the reply --------------------------------------------------

/**
 * Four conversations, three turns each. Every reply is graded against the
 * house rules, and the other person reacts the way people do. Figures in the
 * replies are the page's own, with their scope.
 */
export const scenarios = [
  {
    id: 'customer',
    who: 'A customer',
    title: 'A customer asks what we give back',
    storyIds: ['3verest', 'childrens-cancer-institute'],
    turns: [
      {
        line: 'Nice pitch on latency. But honestly, what does Equinix actually do for people? Not the servers. The people.',
        replies: [
          { grade: 'best', text: 'Let me give you one specific example. 3verest runs sovereign healthcare clouds out of Equinix facilities. Radiologists on their platform can retrieve a medical image in under a second, by 3verest’s own account, and the patient data stays in its country.', reaction: 'Under a second, from a cloud? Who is claiming that, you or them?', note: 'One named customer, one figure, and its scope in the same breath.' },
          { grade: 'weak', text: 'We power hospitals and research labs all over the world and keep care running.', reaction: 'You run the hospitals?', note: 'Equinix does not deliver the care. "Powering hospitals" is the phrase the house rules ask you never to use.' },
          { grade: 'ok', text: 'We have a Foundation with a lot of programmes. I can send you the Sustainability Report.', reaction: 'Sure, send it over.', note: 'True, but a report is not a story and the door just closed politely. Lead with a person and a place; offer the report after.' },
        ],
      },
      {
        line: 'Under a second, from a cloud? Who is claiming that, you or them?',
        replies: [
          { grade: 'best', text: '3verest. It is their figure for their own platform, compared with general public clouds, in the Equinix customer story. Our part is the in-country space and the private connection, so the images never cross the public internet.', reaction: 'That is clear. Is it only imaging, or anything closer to research?', note: 'Scope and source said naturally, and the role stated as infrastructure.' },
          { grade: 'weak', text: 'It is our figure. Equinix delivers sub-second medical imaging.', reaction: 'Hm.', note: 'The figure belongs to 3verest. Claim only what the source says, and credit who said it.' },
          { grade: 'ok', text: 'I would need to check who measured it.', reaction: 'Fair enough.', note: 'Honest, but the scope is in the story and you knew it. Practise saying it until it comes out on its own.' },
        ],
      },
      {
        line: 'Is it only imaging, or anything closer to research?',
        replies: [
          { grade: 'best', text: 'Children’s Cancer Institute in Sydney. They compare one child’s genomic data with cases in Philadelphia, Memphis and Heidelberg over Equinix Fabric. The science is theirs. We shorten the distance between their data and the people they need to compare it with.', reaction: 'That one I will remember.', note: 'Second story, same shape: the partner does the work, Equinix provides the connection.' },
          { grade: 'weak', text: 'Yes. Equinix is helping cure childhood cancer with its network.', reaction: '…', note: 'Nobody cures anything with a network. The discoveries belong to the researchers.' },
          { grade: 'ok', text: 'There are more examples on our community impact page.', reaction: 'I will have a look.', note: 'A link is not a conversation. Tell one story, then share the link.' },
        ],
      },
    ],
  },
  {
    id: 'neighbour',
    who: 'A neighbour',
    title: 'A neighbour worries about power and water',
    storyIds: ['community-principles', 'pathways-to-tech'],
    turns: [
      {
        line: 'Your data center is going up a mile from my house. My bills are going up, and I hear these things drink water.',
        replies: [
          { grade: 'best', text: 'Those are fair worries, and they are the first two things our U.S. Community Principles address. On power, we commit to paying our full share of grid costs; with ComEd that is a ten-year transmission agreement the utility itself described as a model. On water, new sites in water-stressed areas avoid water-based cooling.', reaction: 'Says who? Everyone promises things before they build.', note: 'Acknowledge first, then specifics with names: ComEd, dry cooling.' },
          { grade: 'weak', text: 'Data centers actually lower your bills, because the fixed costs get spread across more demand.', reaction: 'That is not what I have read.', note: 'Not a claim the sources make. Stay with the commitments that are published.' },
          { grade: 'ok', text: 'I understand the concern. Let me take your details and someone from community relations will be in touch.', reaction: 'So you do not know.', note: 'Acknowledging is right. Deferring everything leaves the worry standing, and you had two specific answers.' },
        ],
      },
      {
        line: 'Says who? Everyone promises things before they build.',
        replies: [
          { grade: 'best', text: 'The principles are published on Equinix Together, with 2025 figures reported against them. In Minooka, Illinois, that meant seventeen million dollars of public infrastructure, a public bike path along the site and land for a future fire station. Local leaders set those priorities, not us.', reaction: 'A bike path. Huh. What about jobs? These places employ nobody.', note: 'A public source, dated figures, and credit to the community for setting the priorities.' },
          { grade: 'weak', text: 'Equinix has been a good neighbour for over twenty-five years. Trust me.', reaction: '…', note: 'Trust is earned by specifics, not asserted.' },
          { grade: 'ok', text: 'It is all in the Sustainability Report.', reaction: 'Which is how long?', note: 'Name one thing from it and let the report be the backup.' },
        ],
      },
      {
        line: 'What about jobs? These places employ nobody.',
        replies: [
          { grade: 'best', text: 'Operations teams are small, that is true, so we do not oversell it. What we do say: in 2025 Equinix spent more than ninety-five million dollars with small and inclusive U.S. businesses, and Pathways to Tech brings students aged 14 to 18 into our data centers, starting with schools in Ashburn and Dallas.', reaction: 'All right. Send me the link to those principles.', note: 'Concede the true part, then the sourced figure with its scope and period.' },
          { grade: 'weak', text: 'Thousands of jobs, directly and indirectly.', reaction: 'Show me.', note: 'No source on the page supports a jobs total. Never invent a figure.' },
          { grade: 'ok', text: 'We run a schools programme.', reaction: 'Doing what?', note: 'Name it and give its reach: nearly 2,000 students in the two-year pilot.' },
        ],
      },
    ],
  },
  {
    id: 'student',
    who: 'A student',
    title: 'A student asks what a data center job looks like',
    storyIds: ['pathways-to-tech', 'technician-coalition'],
    turns: [
      {
        line: 'What does someone actually do all day in a data center? Is it just plugging in cables?',
        replies: [
          { grade: 'best', text: 'Some days, yes, and it matters. Kayla, a technician on our Chicago team, started on a Pathways to Tech tour like this one. Within months she had an internship. Now she keeps the hall running: power, cooling, customer installs, and the checks that stop a problem before it starts.', reaction: 'She started on a tour? I am sixteen and I do not know anyone who works in tech. How would I even start?', note: 'A real path from the sources, told as a story.' },
          { grade: 'weak', text: 'It is basically IT support with better pay.', reaction: 'Oh.', note: 'Sells the role short, and it is not from the sources.' },
          { grade: 'ok', text: 'There are lots of roles: technicians, engineers, security, facilities.', reaction: 'OK…', note: 'Accurate but generic. The student asked about a day. Give them a person.' },
        ],
      },
      {
        line: 'I am sixteen and I do not know anyone who works in tech. How would I even start?',
        replies: [
          { grade: 'best', text: 'You are exactly who Pathways to Tech is for: ages 14 to 18, classroom talks, tours and hands-on days run by our own volunteers, with a route into internships and apprenticeships. After a two-year pilot that reached nearly 2,000 students, it is rolling out to every Equinix location.', reaction: 'Is there one near me? And why would Equinix bother with school kids?', note: 'Programme, age range, reach with its scope, and what comes next.' },
          { grade: 'weak', text: 'Just apply online. We hire thousands a year.', reaction: '…', note: 'Not in the sources, and it skips the step the student actually needs.' },
          { grade: 'ok', text: 'Study hard and look at apprenticeships when you finish school.', reaction: 'Right.', note: 'Kind, but there is a programme built for this question. Name it.' },
        ],
      },
      {
        line: 'Why would Equinix bother with school kids?',
        replies: [
          { grade: 'best', text: 'Because the work that keeps data centers running is mostly invisible, so people never consider it. The industry is short of technicians. The Equinix Foundation and Generation launched a training coalition that starts in Brazil, with first cohorts planned for June 2026. Opening our doors early is where that pipeline begins.', reaction: 'Makes sense.', note: 'An honest motive, with a second sourced programme as proof.' },
          { grade: 'weak', text: 'Corporate social responsibility, mostly.', reaction: 'So, PR.', note: 'True of nothing in particular. Say the real reason.' },
          { grade: 'ok', text: 'We want to give back to the communities we are in.', reaction: 'Cool.', note: 'Warm but weightless. Connect it to the technician shortage.' },
        ],
      },
    ],
  },
  {
    id: 'journalist',
    who: 'A journalist',
    title: 'A journalist asks for a number',
    storyIds: ['pa10-heat', 'efficient-operations'],
    turns: [
      {
        line: 'Give me one number on your Paris data center and the Olympic pool.',
        replies: [
          { grade: 'best', text: 'PA10 feeds the heat network that supplies the Olympic Aquatics Centre in Saint-Denis. Equinix expects its excess heat to warm more than a thousand nearby homes, provided free of charge for fifteen years. That is Equinix’s own statement from April 2025; Data Center Knowledge has the technical detail.', reaction: 'Expected. So the homes are not warm yet?', note: 'The figure, its scope word, the period and both sources.' },
          { grade: 'weak', text: 'We heat the Olympic pool and a thousand homes in Paris.', reaction: 'Since when, and all of them?', note: 'Drops "expected", drops the network operator, and the pool is warmed by the network, not by Equinix.' },
          { grade: 'ok', text: 'I cannot give you a number without checking.', reaction: 'So there is not one.', note: 'There is a sourced figure. Practise it until the caveat comes out naturally.' },
        ],
      },
      {
        line: 'Expected. So the homes are not warm yet?',
        replies: [
          { grade: 'best', text: 'The connection to the network was made in 2024, and the operator distributes the heat as the neighbourhood connects. Our word is "expected" because that is what Equinix has published. I will not round it up for you.', reaction: 'Appreciated. And how green are you overall? One figure.', note: 'Holding the caveat under pressure is the skill.' },
          { grade: 'weak', text: 'They are warm. Trust me, it has been two years.', reaction: 'Can I quote you on that?', note: 'You just invented a fact on the record.' },
          { grade: 'ok', text: 'I am not sure of the status today.', reaction: 'OK.', note: 'You knew the period: from 2024, expected. Say it.' },
        ],
      },
      {
        line: 'How green are you overall? One figure.',
        replies: [
          { grade: 'best', text: 'For 2025, an average annual PUE of 1.37, and 96 percent renewable energy coverage across our retail IBX data centers under Equinix’s published definition. Coverage is not the same as direct renewable supply at every site, and I would rather you quote the definition with the number.', reaction: 'That is more careful than most.', note: 'Both figures scoped, the period stated, the definition caveat volunteered.' },
          { grade: 'weak', text: 'We are 96 percent renewable.', reaction: 'Everywhere, all the time?', note: 'Coverage uses a published definition. Say "coverage", not "supply".' },
          { grade: 'ok', text: 'Our Sustainability Report has all of that.', reaction: 'Which page?', note: 'Right source, but one figure was the ask.' },
        ],
      },
    ],
  },
];

export const GRADE_POINTS = { best: 2, ok: 1, weak: 0 };

/** The debrief after a conversation: points, and the house rule each weak reply broke. */
export function debrief(scenarioId, picks) {
  const sc = scenarios.find((s) => s.id === scenarioId);
  if (!sc) throw new Error(`Unknown scenario ${scenarioId}`);
  const rows = picks.map((i, turn) => {
    const r = sc.turns[turn].replies[i];
    return { turn: turn + 1, grade: r.grade, points: GRADE_POINTS[r.grade], note: r.note };
  });
  const points = rows.reduce((a, r) => a + r.points, 0);
  const max = sc.turns.length * 2;
  const verdict = points === max ? 'Every reply carried a name, a figure with its scope, and the right role for Equinix.' : points >= max - 2 ? 'Close. One reply left a figure without its scope, or let Equinix take the partner’s credit.' : 'Worth another run. The notes below say which house rule each reply missed.';
  return { points, max, rows, verdict, storyIds: sc.storyIds };
}

export { stories, sources, topics, principles, chapterLead, getStory };
