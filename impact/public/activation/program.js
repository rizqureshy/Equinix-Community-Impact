// Public Sector Sales AI Activation Program: the content model.
// Edit this file to change the program; the page renders from it.
// Source: "Public Sector Sales AI Activation Program, four week activity plan",
// Rizwan Qureshy, GTM Enablement, November 2026. The brief, AI skill and share
// line of each activity are from the plan. The why, steps, starter prompt,
// cohort lenses, share template and check are the daily exercise guide layer
// drafted for facilitator review.

export const program = {
  title: 'Public Sector Sales AI Activation Program',
  short: 'Public Sector AI Activation',
  owner: 'GTM Enablement',
  cohort: 'US cohort: Federal Civilian Sales, Defense and Intelligence Sales, SLED including higher education, and Public Sector Partner Sales.',
  start: '2026-11-09',
  end: '2026-12-11',
  breakStart: '2026-11-23',
  breakEnd: '2026-11-27',
  minutes: '15 to 20 minutes',
  summary: 'Twenty short activities build from stronger sales judgment to practical account intelligence, reusable AI support, and more strategic customer and partner conversations.',
  // Viva Engage: set `embed` to the group embed URL once the cohort community exists.
  engage: {
    embed: null,
    url: 'https://engage.cloud.microsoft/',
    name: 'Public Sector AI Activation community',
  },
  dataRule:
    'Use public or synthetic practice material and tools approved for your role and data. Internal data stays in approved environments only. Check important claims against sources, label projections as scenarios, and keep human review in every step.',
  tools: ['Microsoft 365 Copilot', 'Copilot agents', 'Approved internal tools for internal data'],
};

export const audiences = [
  {
    id: 'fed',
    name: 'Federal Civilian',
    short: 'Federal Civilian',
    context: 'Agency objectives, early recompete preparation, relationship health, connectivity needs, and coordination with prime partners.',
  },
  {
    id: 'def',
    name: 'Defense and Intelligence',
    short: 'Defense and Intel',
    context: 'Mission context from permitted sources, technical discovery, evidence gaps, and delivery partner roles. Sensitive requirements stay outside practice examples.',
  },
  {
    id: 'sled',
    name: 'SLED and higher education',
    short: 'SLED and higher ed',
    context: 'Public service priorities, research and funding signals, campus networks, on premises alternatives, and regional partner contributions.',
  },
  {
    id: 'partner',
    name: 'Public Sector Partner Sales',
    short: 'Partner Sales',
    context: 'Partner business priorities, capabilities, delivery interests, joint account planning, and coordinated customer engagement.',
  },
];

export const heard = [
  { heard: 'Make the value case stronger', response: 'Challenge assumptions, explain technical value clearly, and adapt messages to the customer and partner.', weeks: [1] },
  { heard: 'Understand accounts and act earlier', response: 'Connect agency or institution priorities, partner interests, and buying signals to evidence and next actions.', weeks: [2] },
  { heard: 'Reduce repetitive preparation', response: 'Build a small agent, app, or dashboard that supports recurring account work and can be maintained.', weeks: [3] },
  { heard: 'Make plans and reviews more strategic', response: 'Use evidence and scenarios to recommend priorities, clarify shared responsibilities, and prepare for difficult questions.', weeks: [4] },
  { heard: 'Build trust in AI supported work', response: 'Practice source checking, distinguish facts from assumptions, and retain human judgment throughout.', weeks: [1, 2, 3, 4] },
];

// Build paths for Week 3. Everyone follows the five activities using one path.
export const paths = [
  { id: 'agent', name: 'Agent', what: 'A Copilot agent for recurring briefings and questions, grounded on an approved source pack.' },
  { id: 'app', name: 'App', what: 'A small app that guides a preparation workflow and organizes discovery inputs.' },
  { id: 'dashboard', name: 'Dashboard', what: 'A dashboard of account priorities, milestones, owners and actions.' },
];

export const weeks = [
  {
    num: 1,
    id: 'rethink',
    name: 'Rethink AI',
    start: '2026-11-09',
    end: '2026-11-13',
    accent: '#e91c24',
    verbs: ['Challenge assumptions', 'Adapt to the audience', 'Simplify accurately', 'Reuse what works'],
    outcome: 'Use AI with greater confidence and judgment to strengthen a value message and prepare for a difficult customer or partner conversation.',
    coaching: 'When AI pushback is useful, when it is invented, and how to improve the next prompt.',
    note: 'November 11 is Veterans Day. Where observed, move that exercise to another short slot within the week; coaching is scheduled on another day.',
    videos: [
      { id: 'w1-v1', title: 'What a Copilot agent is, and what it is not', minutes: 6, about: 'The difference between a chat, a prompt and an agent, in sales terms.', youtubeId: null },
      { id: 'w1-v2', title: 'Prompts that hold up: role, evidence, unknowns, tone, next action', minutes: 8, about: 'The five parts of a reusable prompt, the shape you will reverse engineer on Thursday.', youtubeId: null },
    ],
  },
  {
    num: 2,
    id: 'intelligence',
    name: 'Customer and Partner Intelligence',
    start: '2026-11-16',
    end: '2026-11-20',
    accent: '#0066cc',
    verbs: ['Research priorities', 'Understand relationships', 'Test the value case', 'Prepare the next conversation'],
    outcome: 'Turn a small set of customer and partner sources into a credible intelligence brief, a tested opportunity hypothesis, and useful next questions.',
    coaching: 'Distinguishing a credible signal from an assumption and turning research into a useful question.',
    carry: 'Save the brief and source list for Week 3. The program pauses November 23 to 27 and resumes November 30.',
    videos: [
      { id: 'w2-v1', title: 'Grounding Copilot on your sources: files, SharePoint and the web', minutes: 7, about: 'How to point Copilot at a source pack so answers cite what you gave it.', youtubeId: null },
      { id: 'w2-v2', title: 'Asking for sources and dates, every time', minutes: 5, about: 'Prompt patterns that separate stated plans from inferred opportunities.', youtubeId: null },
    ],
  },
  {
    num: 3,
    id: 'build',
    name: 'Create Your AI Solution',
    start: '2026-11-30',
    end: '2026-12-04',
    accent: '#1f8a70',
    verbs: ['Choose one recurring task', 'Build a small solution', 'Test it', 'Keep it useful'],
    outcome: 'Create and test one reusable prototype for account preparation, account maintenance, or joint customer and partner planning, with clear instructions for updating it.',
    coaching: 'Hands on build support, narrowing scope, and troubleshooting across the three paths.',
    carry: 'Use the tested output to support Week 4. These are learning prototypes; production integrations and automatic account updates require separate implementation.',
    videos: [
      { id: 'w3-v1', title: 'Build your first agent with the Copilot agent builder', minutes: 10, about: 'Name, instructions, knowledge sources and a first test, start to finish.', youtubeId: null },
      { id: 'w3-v2', title: 'Writing agent instructions that stay in scope', minutes: 7, about: 'Briefing structure, what to refuse, and the human review point.', youtubeId: null },
      { id: 'w3-v3', title: 'Testing, updating and sharing an agent with a colleague', minutes: 8, about: 'Refresh a knowledge source, retest, and hand it over with known limits.', youtubeId: null },
    ],
  },
  {
    num: 4,
    id: 'strategy',
    name: 'Account Strategy and Business Reviews',
    start: '2026-12-07',
    end: '2026-12-11',
    accent: '#6e4bd8',
    verbs: ['Establish the evidence', 'Choose priorities', 'Explore scenarios', 'Rehearse', 'Agree next actions'],
    outcome: 'Connect account intelligence and analysis to a practical strategy and a forward looking customer or partner business review with proposed owners, actions, and measures.',
    coaching: 'Strengthening the recommendation, testing the evidence, and turning an account update into a strategic discussion.',
    scope: 'Reviews focus on customer and partner priorities and growth. Sole source support remains a separate activity and is not an assumed outcome of the review.',
    videos: [
      { id: 'w4-v1', title: 'Using your agent for account planning and review preparation', minutes: 8, about: 'Turning the Week 3 prototype into a planning partner.', youtubeId: null },
      { id: 'w4-v2', title: 'Scenario tables with Copilot in Excel', minutes: 7, about: 'Baseline and two changes, with one calculation checked by hand.', youtubeId: null },
    ],
  },
];

export const activities = [
  // ---- Week 1: Rethink AI --------------------------------------------------
  {
    id: 'w1-mon',
    week: 1,
    date: '2026-11-09',
    title: 'The Challenger',
    hook: 'Ask AI to attack the claim before a customer does.',
    brief:
      'Take a claim about retaining an agency account, supporting a mission, enabling university research, or winning with a partner. Ask AI to act as a skeptical stakeholder and identify its three weakest points. Revise the most important claim using only evidence available.',
    skill: 'Adversarial prompting and human judgment.',
    share: 'The weakest claim, your revision, and the evidence still needed.',
    why: 'Most of us use AI to confirm what we already think. Making it argue against you is the fastest way to find the claim a customer or partner will not accept.',
    steps: [
      { min: 3, text: 'Write one claim you make often in two or three sentences. Keep it specific: a retention argument, a mission outcome, a research enablement story, or a partner win theme.' },
      { min: 5, text: 'Give AI a role: a skeptical program leader, a contracting officer, a CIO or a partner executive. Ask for the three weakest points and tell it not to soften them.' },
      { min: 4, text: 'Pick the point that matters most. Ask what evidence would settle it, and whether you actually have that evidence.' },
      { min: 5, text: 'Rewrite the claim using only evidence you can point to today. Label anything that is still an assumption.' },
      { min: 2, text: 'Post your share: the weakest claim, your revision, and the evidence you still need.' },
    ],
    prompt: `Act as a skeptical {stakeholder} who has heard many vendor claims. Here is a claim I make about my account: "{claim}".
Identify its three weakest points. For each: say why it is weak, what evidence would make it credible, and what question you would ask me in a meeting. Do not soften the critique and do not offer compliments.`,
    lenses: {
      fed: 'Use a claim about why the agency should keep or expand its footprint ahead of a recompete. Play the contracting officer or program manager.',
      def: 'Use a mission support claim built only from permitted public context. Play a technical evaluator who wants evidence, not adjectives.',
      sled: 'Use a claim about enabling university research or a state service. Play a CIO weighing an on premises alternative.',
      partner: 'Use a joint win theme with a prime or delivery partner. Play the partner executive who asks what Equinix adds to their deal.',
    },
    shareTemplate: `Day 1, The Challenger.
Weakest claim: {the claim as I used to say it}
Revision: {the claim as I say it now}
Evidence I still need: {one or two items}
What changed my thinking: {one line}`,
    check: 'If AI invented a weakness that no real stakeholder would raise, say so in your share. Spotting invented pushback is part of the skill.',
  },
  {
    id: 'w1-tue',
    week: 1,
    date: '2026-11-10',
    title: 'The Translator',
    hook: 'One message. Three readers. Profile them before you write.',
    brief:
      'Use one message with three audiences: a customer program or business leader, a technical stakeholder, and a partner lead. Ask AI to profile their likely priorities before rewriting. Label inferred priorities and check that all three versions preserve the same facts.',
    skill: 'Audience profiling and context setting.',
    share: 'Two contrasting versions and the difference that matters.',
    why: 'The same facts land differently with a program leader, an engineer and a partner. Profiling the reader first makes the rewrite follow from their priorities rather than your habit.',
    steps: [
      { min: 3, text: 'Take yesterday’s revised claim or a short update you need to send this week. One paragraph is enough.' },
      { min: 5, text: 'Ask AI to profile three readers: a program or business leader, a technical stakeholder, and a partner lead. For each, ask what they care about, what they worry about, and how they measure success. Mark which priorities are inferred.' },
      { min: 6, text: 'Ask for three rewrites, each driven by its profile. Require that every version keep the same facts, figures and caveats.' },
      { min: 4, text: 'Read the three side by side. Check nothing was added or dropped. Pick the two that contrast most.' },
      { min: 2, text: 'Post your share: the two versions and the one difference that matters.' },
    ],
    prompt: `I need to send this message to three readers: a {leader role}, a {technical role} and a {partner role}.
Message: "{message}"
First, profile each reader: their top three priorities, their main concern, and how they judge success. Mark each priority as stated (I told you) or inferred (your assumption).
Then rewrite the message once for each reader. Keep every fact, number and caveat identical across the three versions. Finish with a table of the facts, showing they appear in all three.`,
    lenses: {
      fed: 'Readers: an agency program director, the agency network architect, and the prime contractor’s capture lead.',
      def: 'Readers: a mission owner, a systems integrator engineer, and a delivery partner program manager. Use public context only.',
      sled: 'Readers: a university research office leader, a campus network manager, and a regional partner account manager.',
      partner: 'Readers: the partner’s practice leader, the partner’s solution architect, and the end customer’s program lead.',
    },
    shareTemplate: `Day 2, The Translator.
Version for {reader A}: {two or three lines}
Version for {reader B}: {two or three lines}
The difference that matters: {one line}
Inferred priority I should validate: {one line}`,
    check: 'If a version reads better because it dropped a caveat, it is not a translation. Put the caveat back.',
  },
  {
    id: 'w1-wed',
    week: 1,
    date: '2026-11-11',
    title: 'Make the Complex Simple',
    hook: 'Generate analogies, then ask where each one breaks.',
    brief:
      'Explain interconnection or another relevant technical concept to a nontechnical stakeholder. Generate short analogies, ask AI where each breaks down, and refine the strongest one against a supplied definition or approved reference.',
    skill: 'Self critique and accurate simplification.',
    share: 'Your explanation and the limitation it must preserve.',
    why: 'A good analogy gets a nod in the room. A great one survives the follow up question. Asking AI to critique its own analogies shows you exactly where each one bends.',
    note: 'Veterans Day. If your office observes it, do this exercise in another short slot this week.',
    steps: [
      { min: 2, text: 'Pick the concept you explain most often: interconnection, a private connection to a cloud, a neutral facility, or latency between sites.' },
      { min: 4, text: 'Ask AI for five short analogies aimed at a nontechnical leader, each in two sentences.' },
      { min: 5, text: 'Ask AI to critique its own list: for each analogy, what would someone get wrong if they took it literally?' },
      { min: 5, text: 'Choose the one that survives. Refine it against the approved definition in the source pack, and write the limitation it must carry.' },
      { min: 2, text: 'Post your share: the explanation and the limitation it must preserve.' },
    ],
    prompt: `Explain {concept} to a {nontechnical role} who has ten seconds of attention.
Step 1: give five analogies, two sentences each.
Step 2: for each analogy, say what someone would misunderstand if they took it literally, and which fact about {concept} it hides.
Step 3: recommend the one that survives best, and state the one limitation I must say out loud when I use it.
Approved definition to stay true to: "{definition}"`,
    lenses: {
      fed: 'Explain interconnection to an agency program director who thinks in terms of mission uptime and budget cycles.',
      def: 'Explain a neutral, multi carrier facility to a mission owner, without reference to any specific program or requirement.',
      sled: 'Explain a private connection to a cloud provider to a provost or state agency director weighing an on premises alternative.',
      partner: 'Explain where Equinix fits in the partner’s solution to the partner’s own sales team, so they can repeat it.',
    },
    shareTemplate: `Day 3, Make the Complex Simple.
Concept: {concept}
My explanation: {two or three sentences}
The limitation it must preserve: {one line}
The analogy I rejected and why: {one line}`,
    check: 'Simplification is only accurate if it survives the approved definition. If you cannot find the definition, note that as the evidence still needed.',
  },
  {
    id: 'w1-thu',
    week: 1,
    date: '2026-11-12',
    title: 'Reverse Engineer the Prompt',
    hook: 'Work backwards from a strong brief to a prompt you can reuse.',
    brief:
      'Start with a strong fictional account preparation brief. Ask AI to infer a reusable prompt covering audience, evidence, unknowns, tone, and next action. Test it on a different agency, institution, or partner scenario and correct what fails.',
    skill: 'Prompt design and transfer testing.',
    share: 'Your reusable prompt and one improvement from testing.',
    why: 'You already know what a good brief looks like. Turning that judgment into a prompt gives you a tool you can reuse every week, and testing it on a new scenario shows what the prompt was quietly assuming.',
    steps: [
      { min: 3, text: 'Open the sample account preparation brief from the source pack. Read it once as a seller: what makes it good?' },
      { min: 5, text: 'Ask AI to write the complete prompt that would produce this brief: audience, evidence required, unknowns to list, tone, and the next action it must end with.' },
      { min: 6, text: 'Run that prompt on a different scenario from your cohort context. Compare the result with the original brief.' },
      { min: 4, text: 'Fix what failed: a missing instruction, a vague audience, an assumption about data you did not have. Keep the prompt to one screen.' },
      { min: 2, text: 'Post your share: the reusable prompt and the one improvement testing gave you.' },
    ],
    prompt: `Here is an account preparation brief I consider strong:
"{paste the sample brief}"
Write the complete prompt that would produce a brief of this quality for a different account. The prompt must specify: the audience, the evidence it may use and how to cite it, the unknowns it must list rather than guess, the tone, and the next action it must end with. Keep the prompt under 200 words so I can reuse it.`,
    lenses: {
      fed: 'Test the prompt on a different civilian agency with a recompete 18 months out.',
      def: 'Test it on a fictional defense program described only with public context, and check it refuses to invent sensitive detail.',
      sled: 'Test it on a university with a new research computing grant, or a state agency consolidating sites.',
      partner: 'Test it on a joint account where the partner leads and Equinix is a component, and see whether the prompt still names the partner’s interests.',
    },
    shareTemplate: `Day 4, Reverse Engineer the Prompt.
My reusable prompt: {paste it}
What failed on the second scenario: {one line}
The improvement: {one line}`,
    check: 'A prompt that works on only one scenario is a template, not a tool. If the second run invented facts, add an instruction that unknowns must be listed, not filled.',
  },
  {
    id: 'w1-fri',
    week: 1,
    date: '2026-11-13',
    title: 'The Situation Room',
    hook: 'Price pressure, missing information, a partner out of step. Decide anyway.',
    brief:
      'Work through a scenario with price pressure, incomplete customer information, and unaligned partner engagement. Challenge the assumptions, compare stakeholder perspectives, and produce a three sentence brief with two coordinated next actions.',
    skill: 'Combining prompting techniques to support a decision.',
    share: 'Your brief, next actions, and what changed your thinking.',
    why: 'Real account situations are messy. This is where the week’s four techniques work together: challenge, translate, simplify, and reuse your prompt to reach a decision you can defend.',
    steps: [
      { min: 3, text: 'Read the Situation Room scenario for your cohort context in the source pack. List the three things you do not know.' },
      { min: 5, text: 'Challenge: ask AI which assumptions in the scenario are weakest and which one would change the decision if wrong.' },
      { min: 4, text: 'Translate: ask for the situation as seen by the customer, the partner, and your own leadership. Note where they conflict.' },
      { min: 5, text: 'Decide: write a three sentence brief and two coordinated next actions, one for the customer and one for the partner. Use your Thursday prompt if it fits.' },
      { min: 3, text: 'Post your share: the brief, the next actions, and what changed your thinking.' },
    ],
    prompt: `Scenario: {paste the scenario}.
Unknowns I have: {list}.
1. List the assumptions in this scenario, ranked by how much the decision changes if each is wrong.
2. Describe the situation from three perspectives: the customer leader, the partner lead, and my sales leadership. Where do they conflict?
3. Draft a three sentence brief for my manager and two coordinated next actions, one toward the customer and one toward the partner. Each action must name an owner and a date. State what you assumed.`,
    lenses: {
      fed: 'The scenario centers on a budget continuing resolution, a prime partner slow to engage, and a program office asking for a price concession.',
      def: 'A delivery partner has changed roles mid pursuit, requirements are only partly visible, and the evaluator is cost focused. Public context only.',
      sled: 'A university faces a grant timing change, a regional partner is pitching a competing design, and the CIO is asking why not stay on campus.',
      partner: 'Your partner is pursuing a parallel deal with another provider, the end customer is quiet, and your leadership wants a forecast call this week.',
    },
    shareTemplate: `Day 5, The Situation Room.
Brief: {three sentences}
Next action, customer: {owner, action, date}
Next action, partner: {owner, action, date}
What changed my thinking: {one line}`,
    check: 'Two actions that both point at the customer are not coordinated. One of them should move the partner.',
  },

  // ---- Week 2: Customer and Partner Intelligence --------------------------
  {
    id: 'w2-mon',
    week: 2,
    date: '2026-11-16',
    title: 'The Customer Priority Profiler',
    hook: 'Separate what the customer said from what you hope they meant.',
    brief:
      'Use a small source pack to identify an agency’s mission and modernization priorities, a state or local service objective, or a university’s research and connectivity needs. Separate stated plans from inferred opportunities. Partner sellers examine the end customer alongside the partner’s target market.',
    skill: 'Source grounded synthesis.',
    share: 'Three priorities, their sources and dates, and one unanswered question.',
    why: 'An intelligence brief is only as good as the line between what a source says and what you infer. Dated, sourced priorities are what an account leader will trust.',
    steps: [
      { min: 3, text: 'Open the Week 2 source pack for your cohort context: a strategic plan extract, a budget or funding note, a news item, and a partner page.' },
      { min: 6, text: 'Ask AI to extract the customer’s priorities, each with the source and its date. Require it to mark every item as stated or inferred.' },
      { min: 4, text: 'Challenge one inferred item: what would need to be true for it to be a real opportunity?' },
      { min: 4, text: 'Choose the three priorities that matter most for your account and write one question the sources cannot answer.' },
      { min: 2, text: 'Post your share: three priorities with sources and dates, and your unanswered question.' },
    ],
    prompt: `Using only the sources I provide, list this {customer type}’s mission and modernization priorities.
Sources: {paste or attach the source pack}.
For each priority: quote or closely paraphrase the supporting line, name the source and its date, and mark it STATED (the source says it) or INFERRED (you are connecting dots). Do not add priorities that are not supported. Finish with three questions the sources cannot answer.`,
    lenses: {
      fed: 'Focus on the agency strategic plan and IT modernization priorities, with the recompete window noted if the sources show it.',
      def: 'Use public mission statements and published modernization goals only. Anything sensitive stays out of the exercise.',
      sled: 'Look for research funding signals, campus network or data center plans, and state service objectives such as consolidation or resilience.',
      partner: 'Profile the end customer and the partner’s stated target market side by side, and mark where they overlap.',
    },
    shareTemplate: `Week 2, Day 1, The Customer Priority Profiler.
Priority 1: {priority} ({source}, {date}, stated or inferred)
Priority 2: {priority} ({source}, {date}, stated or inferred)
Priority 3: {priority} ({source}, {date}, stated or inferred)
Unanswered question: {one line}`,
    check: 'If a priority has no date, it is not evidence yet. Find the date or move it to the unanswered questions.',
  },
  {
    id: 'w2-tue',
    week: 2,
    date: '2026-11-17',
    title: 'The Partner and Stakeholder Map',
    hook: 'Map who matters, then treat every motive as a question to validate.',
    brief:
      'Map the customer, prime or delivery partner, technical influencers, and Equinix account and partner roles. Use evidence to identify capabilities and relationships. Treat partner motivations and gaps as questions to validate, then propose one coordinated discovery action.',
    skill: 'Relationship mapping and gap detection.',
    share: 'A simple map and one assumption to validate with the partner.',
    why: 'Public sector deals move through partners and influencers as much as through the customer. A map with honest gaps is more useful than a confident one.',
    steps: [
      { min: 3, text: 'List the roles you know from the source pack: customer leaders, prime or delivery partner, technical influencers, and the Equinix account and partner team.' },
      { min: 5, text: 'Ask AI to build a simple map: who influences whom, which capability each party brings, and what evidence supports each link.' },
      { min: 4, text: 'Ask it to list the partner’s likely motivations and gaps as questions, not statements.' },
      { min: 5, text: 'Pick the assumption that most affects the deal and write one coordinated discovery action to validate it with the partner.' },
      { min: 2, text: 'Post your share: the map in text or a quick sketch, and the assumption you will validate.' },
    ],
    prompt: `Build a stakeholder and partner map for this account from the evidence below.
Parties: {customer roles}, {partner and role}, {technical influencers}, {Equinix roles}.
Evidence: {paste}.
For each party: their capability, their likely interest, and the evidence that supports it (or "no evidence"). Draw the relationships as a simple list of "A influences B because...". Then write the partner’s motivations and gaps as questions I should validate, and propose one discovery action the partner and I can take together.`,
    lenses: {
      fed: 'Include the prime contractor and the agency program office. Ask what the prime gains from Equinix being in the solution.',
      def: 'Map the systems integrator and delivery partner roles from public information. Treat mission ownership as unknown unless published.',
      sled: 'Include the university research office, central IT, procurement, and the regional partner. Ask where procurement rules shape the path.',
      partner: 'Map your partner’s own stakeholders too: who in the partner decides to lead with Equinix, and what they measure.',
    },
    shareTemplate: `Week 2, Day 2, The Partner and Stakeholder Map.
Map: {list of parties and links, or a photo of a sketch}
Assumption to validate with the partner: {one line}
Coordinated discovery action: {owner, action, date}`,
    check: 'A motive written as a fact is an assumption in disguise. Every motive on your map should end with a question mark until the partner confirms it.',
  },
  {
    id: 'w2-wed',
    week: 2,
    date: '2026-11-18',
    title: 'The Value Case Under Pressure',
    hook: 'Make AI argue for the alternative, including staying on premises.',
    brief:
      'Connect one customer priority to a potential Equinix contribution using approved capability information. Ask AI to make the strongest case for an alternative, including remaining on premises where relevant. Identify what would support or weaken the proposed fit.',
    skill: 'Counter analysis and evidence based comparison.',
    share: 'A value hypothesis, the strongest alternative, and evidence needed.',
    why: 'A value case that has never met its strongest alternative will meet it in the room. Better to meet it here first.',
    steps: [
      { min: 3, text: 'Take one priority from Monday. Write a one sentence value hypothesis: because the customer needs X, an Equinix contribution Y could help, using approved capability language.' },
      { min: 5, text: 'Ask AI to make the strongest possible case for the alternative: another provider, a different design, or remaining on premises.' },
      { min: 5, text: 'Ask what evidence would support the Equinix fit and what evidence would weaken it. Keep the two lists honest.' },
      { min: 4, text: 'Decide what you believe today and what you need to find out. Rewrite the hypothesis if the alternative won a point.' },
      { min: 2, text: 'Post your share: the hypothesis, the strongest alternative, and the evidence you need.' },
    ],
    prompt: `Customer priority: {priority with source}.
My value hypothesis: "{because the customer needs X, Equinix contribution Y could help}". Approved capability information: {paste}.
Make the strongest case for the alternative: {another provider, a different architecture, or staying on premises}. Be specific about cost, risk, control and timing. Then list evidence that would support my hypothesis and evidence that would weaken it. End by telling me which single piece of evidence I should go and get first.`,
    lenses: {
      fed: 'The alternative is often the incumbent arrangement continuing through the recompete. Argue for it properly.',
      def: 'Argue for a government owned facility or an existing contract vehicle, using public considerations only.',
      sled: 'Argue for keeping research computing on campus, including grant rules and local staff. This is the case the CIO will make.',
      partner: 'Argue for the partner delivering the solution without Equinix, so you learn what Equinix must add to earn its place.',
    },
    shareTemplate: `Week 2, Day 3, The Value Case Under Pressure.
Value hypothesis: {one sentence}
Strongest alternative: {two lines}
Evidence that would support the fit: {one or two items}
Evidence that would weaken it: {one or two items}
What I will find out first: {one line}`,
    check: 'If the alternative’s case is weak, you probably wrote the prompt to lose. Ask again and tell AI to win.',
  },
  {
    id: 'w2-thu',
    week: 2,
    date: '2026-11-19',
    title: 'From Signal to Conversation',
    hook: 'One dated signal, one message, three questions worth asking.',
    brief:
      'Choose a dated signal from the source pack, such as a planning update, funding announcement, market research notice, or partner initiative. Assess its relevance and uncertainty. Draft a short outreach message and three discovery questions for the appropriate customer or partner contact.',
    skill: 'Interpreting signals and tailoring outreach.',
    share: 'The signal, its source, and the conversation it should open.',
    why: 'Acting earlier means noticing a signal, judging how much to trust it, and turning it into a conversation rather than a pitch.',
    steps: [
      { min: 3, text: 'Choose one dated signal from the source pack: a planning update, a funding announcement, a market research notice, or a partner initiative.' },
      { min: 4, text: 'Ask AI to assess the signal: how relevant to your account, how certain, what it could also mean, and what would confirm it.' },
      { min: 5, text: 'Ask for a short outreach message to the right contact, under 120 words, that references the signal and asks rather than sells.' },
      { min: 4, text: 'Ask for three discovery questions, then cut any that the sources already answer. Rewrite the message in your own voice.' },
      { min: 2, text: 'Post your share: the signal, its source, and the conversation it should open.' },
    ],
    prompt: `Signal: "{signal}" ({source}, {date}).
Account context: {two lines}.
1. Assess the signal: relevance to my account (high, medium, low and why), how certain it is, two other things it could mean, and what would confirm it.
2. Draft an outreach message of under 120 words to {contact role}. Reference the signal, show I understand their situation, and ask for a conversation. No product claims.
3. Give me three discovery questions that the sources cannot already answer.`,
    lenses: {
      fed: 'Signals: a budget justification line, a market research notice, a modernization milestone, or a prime partner announcement.',
      def: 'Signals from public sources only: a published strategy, a public contract announcement, or a partner press release.',
      sled: 'Signals: a research grant award, a campus master plan update, a state resilience initiative, or a regional partner program.',
      partner: 'Signals from the partner itself: a new practice, a certification, a hiring pattern, or a joint announcement with a customer.',
    },
    shareTemplate: `Week 2, Day 4, From Signal to Conversation.
Signal: {what it is} ({source}, {date})
Why it matters and how certain I am: {one line}
Outreach message: {paste}
Discovery questions: {three lines}`,
    check: 'If the message could have been sent without the signal, it is not tailored. The signal should be the reason for the note.',
  },
  {
    id: 'w2-fri',
    week: 2,
    date: '2026-11-20',
    title: 'The Customer and Partner Intelligence Brief',
    hook: 'The week on one page, challenged by an account leader.',
    brief:
      'Bring the week’s work into one page: priorities, stakeholders, value hypothesis, alternatives, unknowns, and next actions. Ask AI what an account or partner leader would challenge. Check the most consequential claim against its source and refine the brief.',
    skill: 'Synthesis, source checking, and concise briefing.',
    share: 'Your brief and one claim you corrected or qualified.',
    why: 'This brief is the raw material for the rest of the program. It feeds the tool you build in Week 3 and the strategy you present in Week 4, so the source checking matters now.',
    carry: 'Save the brief and the source list. You will need both on November 30.',
    steps: [
      { min: 4, text: 'Gather the week: priorities, the map, the value hypothesis and alternative, the signal, and your open questions.' },
      { min: 5, text: 'Ask AI to assemble a one page brief with these headings: priorities, stakeholders, value hypothesis, alternatives, unknowns, next actions. Every claim keeps its source.' },
      { min: 4, text: 'Ask what an account leader or partner leader would challenge first, and why.' },
      { min: 5, text: 'Take the most consequential claim back to its source. Correct or qualify it. Refine the brief.' },
      { min: 2, text: 'Post your share: the brief and the claim you corrected or qualified. Save the brief and source list for Week 3.' },
    ],
    prompt: `Assemble a one page customer and partner intelligence brief from my week’s notes below. Headings: Priorities, Stakeholders and partner, Value hypothesis, Strongest alternative, Unknowns, Next actions (owner and date).
Notes: {paste}.
Keep every source and date attached to its claim. Mark inferred items. Then, as an account leader reading this for the first time, tell me the three things you would challenge and which claim, if wrong, would change the plan the most.`,
    lenses: {
      fed: 'Write for the account leader preparing a recompete strategy. Lead with the window and the relationship health.',
      def: 'Write for a leader who will check every public source. Keep the brief free of anything you could not cite publicly.',
      sled: 'Write for a leader comparing several institutions. Make the funding signal and the on premises alternative explicit.',
      partner: 'Write it as a joint brief the partner could read. Separate the partner’s interests from the customer’s, and name the shared next action.',
    },
    shareTemplate: `Week 2, Day 5, The Intelligence Brief.
Brief: {attach or paste one page}
The claim I corrected or qualified: {before and after}
Source I checked: {name, date}
Saved for Week 3: yes`,
    check: 'The most consequential claim is rarely the most interesting one. Check the claim your next actions depend on.',
  },

  // ---- Week 3: Create Your AI Solution ------------------------------------
  {
    id: 'w3-mon',
    week: 3,
    date: '2026-11-30',
    title: 'Design the Account Workflow',
    hook: 'Pick one recurring task. Decide what the tool does and what stays with you.',
    brief:
      'Pick one recurring task exposed by Week 2. Sketch its inputs, steps, output, and human review point. Define what the solution should do and what it should leave to the seller. Choose the build path that fits the task and available approved tools.',
    skill: 'Turning a business need into clear instructions.',
    share: 'A small workflow sketch and one testable success criterion.',
    why: 'Small, well defined tools get used. The workflow sketch is the instruction set for whatever you build this week, so clarity here saves the rest of the week.',
    paths: true,
    steps: [
      { min: 4, text: 'Reread your Week 2 brief. Pick one task you repeat: a pre meeting briefing, a stakeholder update, a milestone check, a joint plan refresh.' },
      { min: 5, text: 'Sketch the workflow: inputs, steps, output, and the point where a human reviews before anything goes out. Hand drawn is fine.' },
      { min: 4, text: 'Ask AI to tighten the sketch into instructions, and to say what the tool should refuse to do or leave to you.' },
      { min: 4, text: 'Choose the build path: agent, app or dashboard. Write one success criterion you can test on Wednesday.' },
      { min: 2, text: 'Post your share: the sketch and the success criterion.' },
    ],
    prompt: `I want to build a small {agent / app / dashboard} for this recurring task: {task}.
Inputs I have: {list}. Output I need: {describe}. Human review point: {where}.
Turn this into a clear specification: purpose in one sentence, inputs, steps, output format, what the tool must not do, and what stays with me as the seller. Then write one success criterion I can test with sample data, phrased as "given X, the tool produces Y".`,
    byPath: {
      agent: 'An agent that answers recurring questions and produces a briefing in a fixed structure from the approved source pack. The human review point is before any briefing is shared.',
      app: 'A small app that walks you through discovery inputs for a meeting and produces a preparation sheet. The review point is the sheet itself.',
      dashboard: 'A dashboard of account priorities, milestones, owners and actions from sample data. The review point is the weekly check of what changed.',
    },
    lenses: {
      fed: 'Good tasks: a recompete milestone tracker, a monthly agency update brief, or a prime partner coordination checklist.',
      def: 'Good tasks: a public context briefing before technical discovery, or a delivery partner role tracker. Keep sensitive data out of the prototype.',
      sled: 'Good tasks: a grant and funding signal digest, a campus stakeholder update, or an institution comparison sheet.',
      partner: 'Good tasks: a joint account plan refresh, a partner capability brief, or a weekly co sell action list.',
    },
    shareTemplate: `Week 3, Day 1, Design the Account Workflow.
Recurring task: {one line}
Build path: {agent / app / dashboard}
Sketch: {photo or text: inputs, steps, output, review point}
Success criterion: given {X}, the tool produces {Y}`,
    check: 'If the sketch has no human review point, add one before you build. The tool supports your judgment; it does not replace it.',
  },
  {
    id: 'w3-tue',
    week: 3,
    date: '2026-12-01',
    title: 'Build the First Useful Version',
    hook: 'One function working beats five functions planned.',
    brief:
      'Adapt a supplied starter to your scenario. Configure an agent with a briefing structure and approved source pack; create an app that organizes discovery inputs; or populate a dashboard with sample account milestones and actions. Complete one useful function before adding more.',
    skill: 'Building through instructions, configuration, or AI assisted generation.',
    share: 'A screenshot or example output showing the core function.',
    why: 'The first version only needs to do the core thing. Everything else is easier to add once something works end to end.',
    paths: true,
    steps: [
      { min: 3, text: 'Open the starter template for your path and watch the matching build video if you have not yet.' },
      { min: 8, text: 'Adapt the starter to your scenario. Agent: paste the briefing structure as instructions and attach the source pack. App: set up the discovery inputs. Dashboard: load the sample milestones and actions.' },
      { min: 5, text: 'Run the core function once with sample data. Fix the first thing that breaks. Resist adding a second function.' },
      { min: 2, text: 'Capture a screenshot or example output.' },
      { min: 2, text: 'Post your share: the screenshot or output showing the core function.' },
    ],
    prompt: `Here is my specification from yesterday: {paste}.
Help me adapt the {agent / app / dashboard} starter to it. Give me, in order: the exact instructions or configuration to enter, the sample data to use for a first run, and the single core function to test first. Keep it to what I can finish in fifteen minutes; list anything else under "later".`,
    byPath: {
      agent: 'Enter the briefing structure as the agent’s instructions, attach the approved source pack as knowledge, and ask it for one briefing. Check it cites the pack.',
      app: 'Build the input form for one meeting type and generate one preparation sheet from sample answers.',
      dashboard: 'Load the sample account dataset, build one view of milestones by owner and date, and check one total by hand.',
    },
    lenses: {
      fed: 'Sample data: the fictional civilian agency scenario and its source pack.',
      def: 'Sample data: the fictional defense scenario with public context only. No real program data in the prototype.',
      sled: 'Sample data: the fictional university or state agency scenario and its funding signals.',
      partner: 'Sample data: the fictional joint account with the partner’s roles and the shared milestones.',
    },
    shareTemplate: `Week 3, Day 2, Build the First Useful Version.
Path: {agent / app / dashboard}
Core function: {one line}
Screenshot or output: {attach}
First thing that broke and how I fixed it: {one line}`,
    check: 'If the output looks right but you cannot say where a fact came from, the core function is not done yet.',
  },
  {
    id: 'w3-wed',
    week: 3,
    date: '2026-12-02',
    title: 'The Account Data Detective',
    hook: 'Feed it a stale date, a conflict and a missing owner. See what it does.',
    brief:
      'Test the solution with a small synthetic update pack containing a stale date, a conflicting statement, and a missing owner. Agent users test answers and source handling; app users test inputs and logic; dashboard users test calculations, labels, and missing values. Correct one meaningful error.',
    skill: 'Structured testing, data checks, and iteration.',
    share: 'One failed case, the correction, and the retest result.',
    why: 'Trust in an AI supported tool comes from watching it fail on known bad data and fixing the failure. This is the day the tool earns its place.',
    paths: true,
    steps: [
      { min: 3, text: 'Open the synthetic update pack. It contains a stale date, a statement that conflicts with the source pack, and an item with no owner.' },
      { min: 6, text: 'Run each case through your tool. Record what it did with each: flagged it, ignored it, or made something up.' },
      { min: 6, text: 'Pick the most meaningful failure and correct it: an instruction, a validation rule, a label, a formula.' },
      { min: 3, text: 'Retest the same case and one case that previously passed.' },
      { min: 2, text: 'Post your share: the failed case, the correction, and the retest result.' },
    ],
    prompt: `I am testing my {agent / app / dashboard} with three bad inputs: a stale date ({example}), a statement that conflicts with my source ({example}), and an item with no owner.
For each, tell me what a well built tool should do, how to check whether mine did it, and the smallest change that would fix the failure. Then write a short test log format I can reuse: case, expected, actual, fix, retest.`,
    byPath: {
      agent: 'Ask the agent a question the stale item answers. Does it mention the date? Ask about the conflicting statement. Does it surface both sources or pick one silently?',
      app: 'Enter the missing owner and the stale date. Does the app accept them quietly, or ask?',
      dashboard: 'Load the update pack. Do totals change correctly, are labels still right, and how is the missing owner shown?',
    },
    lenses: {
      fed: 'The stale date is a recompete milestone that moved. The conflict is two budget figures from different documents.',
      def: 'The conflict is between two public sources about a program timeline. The tool should show both, not choose.',
      sled: 'The stale date is a grant deadline that passed. The missing owner is on the campus network milestone.',
      partner: 'The conflict is the partner’s stated role versus the customer’s description of it. The missing owner is a shared action.',
    },
    shareTemplate: `Week 3, Day 3, The Account Data Detective.
Failed case: {which bad input and what the tool did}
Correction: {what I changed}
Retest: {result, and whether the previously passing case still passes}`,
    check: 'A tool that filled the missing owner with a plausible name failed the test. Flagging is the right behavior.',
  },
  {
    id: 'w3-thu',
    week: 3,
    date: '2026-12-03',
    title: 'Keep the Account Current',
    hook: 'Change one fact upstream. Does the output follow?',
    brief:
      'Introduce a new customer priority or partner action. Refresh the source, input, or dataset and check whether the output changes correctly. Add a last updated date, maintenance owner, and human review step. Define how obsolete information will be removed or flagged.',
    skill: 'Managing context and maintaining reliable outputs.',
    share: 'A before and after example plus the update instructions.',
    why: 'Account tools decay the day after they are built. A tool with an update routine, an owner and a last updated date is one you can still trust in March.',
    paths: true,
    steps: [
      { min: 3, text: 'Write one new fact: a new customer priority or a new partner action, dated today.' },
      { min: 5, text: 'Add it to the source pack, input set or dataset. Run the tool again and compare before and after. Did the output change where it should, and only there?' },
      { min: 5, text: 'Add a last updated date, a maintenance owner, and a human review step to the tool or its instructions.' },
      { min: 4, text: 'Write the update instructions in five lines, including how obsolete items get flagged or removed.' },
      { min: 2, text: 'Post your share: before and after, and the update instructions.' },
    ],
    prompt: `My {agent / app / dashboard} uses this source or dataset: {describe}. I am adding this new fact: "{fact}" dated {date}.
1. Tell me how to refresh the source so the tool picks it up, and what in the output should change and what should not.
2. Write a maintenance block I can add: last updated, owner, review step, and the rule for flagging or removing obsolete items.
3. Write update instructions in five lines a colleague could follow.`,
    byPath: {
      agent: 'Replace or add a document in the knowledge source. Ask the same question as before and compare the answers and citations.',
      app: 'Add the new input field or option. Check that old preparation sheets still read correctly.',
      dashboard: 'Append the new milestone or action. Check the view, the totals and the label for the new owner.',
    },
    lenses: {
      fed: 'New fact: the agency published an updated modernization milestone, or the prime partner named a new capture lead.',
      def: 'New fact: a public announcement about a program phase. Treat it as a scenario fact in the prototype.',
      sled: 'New fact: a new grant award, or the state agency added a resilience objective.',
      partner: 'New fact: the partner committed to a joint workshop with a date and an owner.',
    },
    shareTemplate: `Week 3, Day 4, Keep the Account Current.
New fact added: {one line, dated}
Before: {what the output said}
After: {what it says now}
Update instructions: {five lines}
Owner and last updated: {name, date}`,
    check: 'If the output changed somewhere unrelated, the tool is leaning on the new fact too hard. Note it as a known limit.',
  },
  {
    id: 'w3-fri',
    week: 3,
    date: '2026-12-04',
    title: 'Make It Usable by a Colleague',
    hook: 'Hand it over. Watch where they get stuck. Fix that one thing.',
    brief:
      'Package the prototype with a short purpose statement, inputs, instructions, and known limits. Have a peer try a sample task, or follow a supplied user test if a peer is unavailable. Fix one usability issue and share a suitable demonstration in the approved environment.',
    skill: 'Usability testing and practical handover.',
    share: 'A short demonstration and the improvement made after testing.',
    why: 'A tool only you can run is a personal habit. Packaging it for a colleague is what turns the week’s work into reusable support for the team.',
    carry: 'Use the tested output to support Week 4. These are learning prototypes; production integrations and automatic account updates require separate implementation.',
    paths: true,
    steps: [
      { min: 4, text: 'Write the one page package: purpose in one sentence, inputs, how to use it, known limits, owner and last updated.' },
      { min: 6, text: 'Ask a peer to try one sample task without your help, or follow the supplied user test script. Note where they hesitate.' },
      { min: 5, text: 'Fix the one usability issue that caused the most hesitation.' },
      { min: 3, text: 'Record or write a short demonstration in the approved environment: what it does, in under two minutes.' },
      { min: 2, text: 'Post your share: the demonstration and the improvement you made.' },
    ],
    prompt: `Write the handover page for my {agent / app / dashboard}: purpose in one sentence, inputs, step by step use, known limits, owner, last updated.
Specification: {paste}. Test log: {paste}.
Then write a five minute user test script for a colleague who has never seen it: three tasks, what a good result looks like, and two questions to ask them afterwards.`,
    byPath: {
      agent: 'Share the agent in the approved environment. Watch whether the colleague knows what to ask it and whether they trust the citations.',
      app: 'Give the colleague the link and one meeting to prepare for. Watch where the form confuses them.',
      dashboard: 'Give the colleague the dashboard and ask them to find what changed this week. Watch which label they misread.',
    },
    lenses: {
      fed: 'Test it with a colleague from another agency account. Their questions will show what you assumed about yours.',
      def: 'Test it with the public context scenario only, and check the known limits say so plainly.',
      sled: 'Test it with a colleague covering a different state or institution type.',
      partner: 'Test it with a colleague who manages a different partner, or with the partner lens from a direct seller.',
    },
    shareTemplate: `Week 3, Day 5, Make It Usable by a Colleague.
Demonstration: {link or short video in the approved environment}
Where my tester got stuck: {one line}
Improvement made: {one line}
Known limits: {two lines}`,
    check: 'Known limits are part of the product. A package without them is a demo, not a handover.',
  },

  // ---- Week 4: Account Strategy and Business Reviews ----------------------
  {
    id: 'w4-mon',
    week: 4,
    date: '2026-12-07',
    title: 'Establish the Account Truth',
    hook: 'What does the evidence support, what changed, and what are you still assuming?',
    brief:
      'Review the Week 2 brief and Week 3 output. Ask AI to identify what the evidence supports, what has changed, and where assumptions remain. Choose the three facts or gaps that most affect the account’s future. Verify the most consequential point.',
    skill: 'Evidence auditing and prioritization.',
    share: 'Three strategic findings and the evidence or gap behind each.',
    why: 'Strategy built on stale or assumed facts stalls in the first meeting. An evidence audit is how a review earns the right to recommend anything.',
    steps: [
      { min: 4, text: 'Put the Week 2 brief and your Week 3 tool’s latest output side by side.' },
      { min: 5, text: 'Ask AI to sort every claim into three columns: supported by evidence, changed since Week 2, still an assumption.' },
      { min: 5, text: 'Choose the three facts or gaps that most affect the account’s future. Say why each matters.' },
      { min: 4, text: 'Verify the most consequential point against its source or by asking your tool for the citation.' },
      { min: 2, text: 'Post your share: three strategic findings, each with its evidence or its gap.' },
    ],
    prompt: `Here is my Week 2 intelligence brief: {paste}. Here is my current account output: {paste}.
Sort every claim into: SUPPORTED (name the evidence), CHANGED (what changed and when), ASSUMPTION (what we are assuming and the risk if wrong). Then recommend the three facts or gaps that most affect the account’s next twelve months, and tell me which one to verify first and how.`,
    lenses: {
      fed: 'The consequential point is often the recompete timeline or the relationship health with the program office.',
      def: 'Audit only public context. Where the truth is unknowable from permitted sources, record it as a gap, not a guess.',
      sled: 'The consequential point is often funding timing or the strength of the on premises alternative.',
      partner: 'Audit the partner’s commitments as carefully as the customer’s facts. A changed partner role is a strategic finding.',
    },
    shareTemplate: `Week 4, Day 1, Establish the Account Truth.
Finding 1: {finding} (evidence or gap)
Finding 2: {finding} (evidence or gap)
Finding 3: {finding} (evidence or gap)
Verified today: {which point, against which source}`,
    check: 'A finding with no evidence and no named gap is an opinion. Either find the source or call it a gap.',
  },
  {
    id: 'w4-tue',
    week: 4,
    date: '2026-12-08',
    title: 'Design the Account Growth Plan',
    hook: 'One retention priority, one growth hypothesis, one relationship action.',
    brief:
      'Draft a concise plan around one retention priority, one growth hypothesis, and one relationship action, where relevant. Include customer outcomes, partner contribution, milestones, proposed owners, and measures. Ask AI where the plan could stall and revise one weak step.',
    skill: 'Strategy design and testing execution risks.',
    share: 'Your account or joint partner plan and the risk you addressed.',
    why: 'A plan with three priorities, owners and measures can be discussed. A plan with twelve cannot. Testing where it stalls before the review is what makes it strategic.',
    steps: [
      { min: 3, text: 'From Monday’s findings, choose one retention priority, one growth hypothesis and one relationship action.' },
      { min: 6, text: 'Ask AI to draft the plan: for each item, the customer outcome, the partner contribution, milestones, a proposed owner and a measure.' },
      { min: 4, text: 'Ask where the plan could stall: procurement, funding, partner capacity, a missing sponsor. Pick the most likely stall.' },
      { min: 5, text: 'Revise the weak step so the stall is addressed. Keep the plan to one page.' },
      { min: 2, text: 'Post your share: the plan and the risk you addressed.' },
    ],
    prompt: `Draft a one page account growth plan from these three items: retention priority "{A}", growth hypothesis "{B}", relationship action "{C}". Evidence: {paste Monday’s findings}.
For each item give: customer outcome, partner contribution, milestones with dates, proposed owner, and a measure of success. Then name the three places this plan is most likely to stall and why. Rewrite the single weakest step so the most likely stall is addressed.`,
    lenses: {
      fed: 'Retention centers on the recompete; growth on a modernization priority; the relationship action on the program office or the prime.',
      def: 'Keep the plan at the level of public mission goals and partner roles. The relationship action may be with the delivery partner.',
      sled: 'Growth may be a research computing or resilience initiative; the relationship action may involve procurement or the research office.',
      partner: 'Write a joint plan. The partner’s contribution and owner appear on every line, and the measure is shared.',
    },
    shareTemplate: `Week 4, Day 2, Design the Account Growth Plan.
Retention priority: {outcome, partner contribution, owner, measure}
Growth hypothesis: {outcome, partner contribution, owner, measure}
Relationship action: {outcome, owner, date}
Most likely stall and how I addressed it: {two lines}`,
    check: 'If every owner is you, the plan has no partner in it. Share the load or name the gap.',
  },
  {
    id: 'w4-wed',
    week: 4,
    date: '2026-12-09',
    title: 'Explore the Scenarios',
    hook: 'A baseline and two changes. Check one number by hand.',
    brief:
      'Using a small supplied synthetic dataset, compare a baseline with two changes, such as delayed funding, increased connectivity demand, or a changed partner role. Check one calculation manually. Use a simple table, chart, or Week 3 tool to show how the assumptions affect the plan.',
    skill: 'Scenario analysis, data projections, and sensitivity to assumptions.',
    share: 'The comparison, assumptions, and one planning implication.',
    why: 'Leaders trust a plan more when they can see what happens if an assumption moves. Scenarios are how a review stops being a status update.',
    steps: [
      { min: 3, text: 'Open the synthetic scenario dataset. Note the baseline: the plan as it stands.' },
      { min: 5, text: 'Define two changes relevant to your account: delayed funding, higher connectivity demand, a changed partner role. Ask AI to project each against the baseline.' },
      { min: 4, text: 'Check one calculation by hand or in a spreadsheet. If it disagrees, trust the hand check and ask AI why.' },
      { min: 5, text: 'Show the comparison as a simple table or chart, or through your Week 3 tool. Label every projection as a scenario.' },
      { min: 2, text: 'Post your share: the comparison, the assumptions, and one planning implication.' },
    ],
    prompt: `Dataset: {paste or attach the synthetic dataset}. Baseline: {describe}.
Scenario 1: {change, for example funding delayed two quarters}. Scenario 2: {change}.
Project both against the baseline for the next four quarters. Show a table with the assumptions stated above each column. Show me the formula behind the {metric} figure so I can check it by hand. Label every projection "scenario", not forecast. Finish with one implication for my plan.`,
    lenses: {
      fed: 'Changes: a continuing resolution delays funding; the recompete moves earlier; the prime changes its teaming.',
      def: 'Changes: a program phase shifts; a delivery partner role changes. Use only the synthetic dataset.',
      sled: 'Changes: a grant arrives late; research demand doubles; the campus keeps part of the workload on premises.',
      partner: 'Changes: the partner wins or loses an adjacent deal; the partner’s delivery capacity shifts; the customer changes the route to market.',
    },
    shareTemplate: `Week 4, Day 3, Explore the Scenarios.
Baseline: {one line}
Scenario 1 and assumption: {one line}
Scenario 2 and assumption: {one line}
Calculation I checked by hand: {metric, result}
Planning implication: {one line}`,
    check: 'A scenario is not a forecast. If the word forecast appears in your table, change it.',
  },
  {
    id: 'w4-thu',
    week: 4,
    date: '2026-12-10',
    title: 'Enter the Customer and Partner Room',
    hook: 'Three voices in the room, every hard question allowed.',
    brief:
      'Rehearse the strategy with AI playing a customer leader, technical stakeholder, and partner executive. Invite hard questions on value, delivery, cost, evidence, and responsibilities. Improve the weakest answer and make the proposed next decision explicit.',
    skill: 'Role play, executive communication, and revision.',
    share: 'The hardest question and your improved answer.',
    why: 'The first time you hear the hardest question should not be in the real review. Rehearsal turns a weak answer into a decision you can ask for.',
    steps: [
      { min: 3, text: 'Give AI your plan and scenarios. Set up three voices: a customer leader, a technical stakeholder, a partner executive.' },
      { min: 6, text: 'Ask each voice for its two hardest questions on value, delivery, cost, evidence and responsibilities. Answer them out loud or in writing, briefly.' },
      { min: 4, text: 'Ask AI which of your answers was weakest and why. Do not argue; improve it.' },
      { min: 5, text: 'Rewrite the weakest answer. Then write the single decision you will ask for at the end of the review.' },
      { min: 2, text: 'Post your share: the hardest question and your improved answer.' },
    ],
    prompt: `Plan: {paste}. Scenarios: {paste}.
Play three people in a business review: a {customer leader role}, a {technical role}, and a {partner executive role}. Each asks me their two hardest questions about value, delivery, cost, evidence and who is responsible for what. Ask one at a time and wait for my answer. After six questions, tell me which answer was weakest and why, and suggest how to make the next decision I am asking for explicit.`,
    lenses: {
      fed: 'Voices: an agency program director, the agency network architect, the prime’s capture lead. Expect a question about the recompete and about cost.',
      def: 'Voices: a mission owner, an integrator engineer, a delivery partner lead. Expect a question about evidence you cannot share.',
      sled: 'Voices: a provost or agency director, the campus network manager, a regional partner executive. Expect the on premises question.',
      partner: 'Voices: the partner’s practice leader, their architect, and the end customer’s program lead. Expect a question about who owns the relationship.',
    },
    shareTemplate: `Week 4, Day 4, Enter the Customer and Partner Room.
Hardest question (from {which voice}): {the question}
My first answer: {one or two lines}
My improved answer: {one or two lines}
The decision I will ask for: {one line}`,
    check: 'If the improved answer is longer than the first one, it is probably not better. Make it clearer, not fuller.',
  },
  {
    id: 'w4-fri',
    week: 4,
    date: '2026-12-11',
    title: 'The Forward Looking Business Review',
    hook: 'What changed, why it matters, what next, and the decisions you need.',
    brief:
      'Assemble a concise review from the week’s work: what changed, why it matters, future priorities, scenario implications, and proposed next actions. Choose a customer QBR or partner business review for your role. End with the decisions and commitments to seek in the real conversation.',
    skill: 'Combining evidence, strategy, and a clear business narrative.',
    share: 'Your review and the decisions it is designed to support.',
    why: 'This is the program’s destination: an evidence based, forward looking review you could take into a real customer or partner conversation next quarter.',
    scope: 'Reviews focus on customer and partner priorities and growth. Sole source support remains a separate activity and is not an assumed outcome of the review.',
    steps: [
      { min: 3, text: 'Choose the format for your role: a customer quarterly business review or a partner business review. Open the review template.' },
      { min: 6, text: 'Ask AI to assemble the review from the week: what changed, why it matters, future priorities, scenario implications, proposed next actions with owners.' },
      { min: 4, text: 'Write the closing slide yourself: the decisions and commitments you will seek in the real conversation.' },
      { min: 5, text: 'Read it as the customer or partner would. Cut anything that is a status update rather than a decision aid. Check the most important number once more.' },
      { min: 2, text: 'Post your share: the review and the decisions it is designed to support.' },
    ],
    prompt: `Assemble a {customer QBR / partner business review} from my week: findings {paste}, plan {paste}, scenarios {paste}, rehearsal notes {paste}.
Structure: what changed since last review, why it matters to the customer and partner, future priorities, scenario implications (labelled as scenarios), proposed next actions with owners and dates. Keep each section to five lines. Leave the final section, "Decisions and commitments we seek", for me to write, but suggest two candidates. Then tell me which slide a skeptical leader would stop on.`,
    lenses: {
      fed: 'A customer QBR for the agency program office, with the prime’s role explicit. The decision may be about recompete preparation steps.',
      def: 'A review built on public context and the partner’s role, with evidence gaps stated plainly as items to discuss.',
      sled: 'A customer QBR for the institution or agency, with the on premises alternative addressed and the funding timeline explicit.',
      partner: 'A partner business review: joint priorities, shared actions, and the commitments you ask of each other.',
    },
    shareTemplate: `Week 4, Day 5, The Forward Looking Business Review.
Format: {customer QBR / partner business review}
Review: {attach}
Decisions and commitments I will seek: {two or three lines}
What this program changed about how I prepare: {one line}`,
    check: 'A review that ends without a decision to ask for is an update. End on the ask.',
  },
];

export const materials = [
  { type: 'Scenario', name: 'Fictional scenario for each cohort context', meta: 'Four short scenarios, one per cohort context', state: 'In preparation', weeks: [1, 2, 3, 4] },
  { type: 'Sources', name: 'Short source pack', meta: 'Plan extract, funding note, news item, partner page, approved definitions', state: 'In preparation', weeks: [1, 2] },
  { type: 'Sample brief', name: 'Sample account preparation brief', meta: 'For Reverse Engineer the Prompt', state: 'In preparation', weeks: [1] },
  { type: 'Dataset', name: 'Synthetic account dataset', meta: 'Milestones, owners, actions', state: 'In preparation', weeks: [3, 4] },
  { type: 'Starters', name: 'Starter templates for the three build paths', meta: 'Agent instructions, app skeleton, dashboard workbook', state: 'In preparation', weeks: [3] },
  { type: 'Test pack', name: 'Synthetic update pack', meta: 'A stale date, a conflicting statement, a missing owner', state: 'In preparation', weeks: [3] },
  { type: 'Templates', name: 'Account plan and review template', meta: 'Compact plan and QBR or partner review layout', state: 'In preparation', weeks: [4] },
  { type: 'Access', name: 'Tool access confirmed before the build week', meta: 'Copilot agents and approved environments', state: 'In preparation', weeks: [3] },
];

export const keyDates = [
  { date: '2026-11-09', label: 'Program starts', detail: 'Week 1, Rethink AI. Day 1: The Challenger.' },
  { date: '2026-11-11', label: 'Veterans Day', detail: 'Where observed, move the exercise to another slot in the week.' },
  { date: '2026-11-13', label: 'Week 1 closes', detail: 'The Situation Room. Coaching this week: when AI pushback is useful.' },
  { date: '2026-11-20', label: 'Week 2 closes', detail: 'The Intelligence Brief. Save the brief and sources for Week 3.' },
  { date: '2026-11-23', label: 'Thanksgiving break', detail: 'November 23 to 27. No scheduled activities or coaching.' },
  { date: '2026-11-30', label: 'Program resumes', detail: 'Week 3, Create Your AI Solution. Choose your build path.' },
  { date: '2026-12-04', label: 'Week 3 closes', detail: 'Make It Usable by a Colleague. Demonstrations shared.' },
  { date: '2026-12-11', label: 'Program closes', detail: 'The Forward Looking Business Review.' },
];

export const rhythm = [
  { label: 'Daily practice', text: 'All 20 exercises are part of the program. Each 15 to 20 minute session makes one focused advance and includes a short Viva Engage share. Later activities reuse earlier work.' },
  { label: 'Weekly AI Coaching Sessions', text: 'Support, troubleshooting, peer examples, and shared experience reinforce the week’s skills. Day and time to be confirmed; not on November 11.' },
  { label: 'Viva Engage', text: 'Share work suitable for the cohort, review others’ approaches, and build a collection of reusable examples.' },
  { label: 'Optional Capstone Team Project', text: 'Groups of 3 to 5 apply the learning to a shared business challenge across the program.' },
];
