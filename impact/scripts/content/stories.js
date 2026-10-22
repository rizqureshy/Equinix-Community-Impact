// Story content for the impact experience.
// Content lives here, separate from scene construction, so stories can be
// edited without touching rendering code. Every claim below is paraphrased
// from the listed sources; figures keep their published scope and period.
// Original page copy avoids em dashes by editorial rule.

export const LAST_CHECKED = '2026-10-21';

/** Source registry. `kind` distinguishes primary Equinix material from secondary reporting. */
export const sources = {
  S1: {
    id: 'S1',
    title: '3verest speeds medical image access 28x with Equinix',
    publisher: 'Equinix customer story',
    url: 'https://www.equinix.com/insights/case-studies/3verest',
    published: null,
    kind: 'primary',
    supports: 'Sovereign healthcare clouds hosted in Equinix facilities; private connectivity; sub-second image retrieval reported by 3verest.',
  },
  S2: {
    id: 'S2',
    title: "Children's Cancer Institute relies on Equinix to connect its data directly with global partners",
    publisher: 'Equinix customer story',
    url: 'https://www.equinix.com/insights/case-studies/childrens-cancer-institute',
    published: null,
    kind: 'primary',
    supports: 'Equinix Fabric connection between Sydney research data, cloud providers and collaborators in Philadelphia, Memphis and Heidelberg.',
  },
  S2b: {
    id: 'S2b',
    title: 'How life science and healthcare organizations can get AI-ready',
    publisher: 'Equinix blog',
    url: 'https://blog.equinix.com/blog/2025/03/05/how-life-science-and-healthcare-organizations-can-get-ai-ready/',
    published: '2025-03-05',
    kind: 'primary',
    supports: "Children's Cancer Institute data exchange with research institutions worldwide; Harrison.ai AI development on NVIDIA infrastructure hosted in an Equinix data center.",
  },
  S3: {
    id: 'S3',
    title: 'The hidden benefit of data centers: warming communities, not just servers',
    publisher: 'Equinix blog',
    url: 'https://blog.equinix.com/blog/2025/04/24/the-hidden-benefit-of-data-centers-warming-communities-not-just-servers/',
    published: '2025-04-24',
    kind: 'primary',
    supports: 'Equinix Heat Export program; TR5 heat to Markham District Energy; PA10 heat to the network supplying the Saint-Denis Olympic Aquatics Centre and more than 1,000 homes.',
  },
  S3b: {
    id: 'S3b',
    title: 'Paris 2024: Excess data center heat used to warm Olympic swimming pools',
    publisher: 'Data Center Knowledge',
    url: 'https://www.datacenterknowledge.com/sustainability/paris-2024-excess-data-center-heat-used-to-warm-olympic-swimming-pools',
    published: '2024-07-26',
    kind: 'secondary',
    supports: 'Technical description of PA10 heat recovery quoting Equinix heat export lead Noah Nkonge: 28°C recovery, heat pumps to 65°C, free of charge for 15 years.',
  },
  S3c: {
    id: 'S3c',
    title: 'Sustainably heating the Paris 2024 Olympic pool',
    publisher: 'Equinix video page',
    url: 'https://www.equinix.com/resources/videos/sustainability-pa10-theb1m',
    published: null,
    kind: 'primary',
    supports: 'Video overview of PA10 heat reuse for the community and the Aquatic Centre.',
  },
  S4: {
    id: 'S4',
    title: 'Equinix Foundation',
    publisher: 'Equinix',
    url: 'https://www.equinix.com/about/equinix-foundation',
    published: null,
    kind: 'primary',
    supports: 'Foundation focus areas, employee programmes (WeGive, WeSkill, Pathways to Tech, Matching Gifts) and partner selection.',
  },
  S4b: {
    id: 'S4b',
    title: 'Equinix commits additional $50 million to the Equinix Foundation',
    publisher: 'Equinix press release',
    url: 'https://investor.equinix.com/news-events/press-releases/detail/1120/equinix-commits-additional-50-million-to-the-equinix',
    published: '2026-08-27',
    kind: 'primary',
    supports: 'Foundation grants to 100 nonprofit partners across 48 metros; 2025 portfolio results; named partners.',
  },
  S4c: {
    id: 'S4c',
    title: 'Pathways to Tech: connecting ambitious youth to data center and tech careers',
    publisher: 'Equinix Foundation',
    url: 'https://www.equinix.com/about/equinix-foundation/pathways-to-tech',
    published: null,
    kind: 'primary',
    supports: 'Programme for ages 14 to 18 across 75+ locations; Kayla’s path from a tour to a full-time technician role.',
  },
  S5: {
    id: 'S5',
    title: 'Environmental sustainability',
    publisher: 'Equinix',
    url: 'https://www.equinix.com/about/sustainability/environmental',
    published: null,
    kind: 'primary',
    supports: '2025 average annual PUE, renewable energy coverage across retail IBX data centers, efficiency investment and net-zero target.',
  },
  S6: {
    id: 'S6',
    title: '2025 Sustainability Report',
    publisher: 'Equinix',
    url: 'https://www.equinix.com/about/sustainability/annual-report',
    published: null,
    kind: 'primary',
    supports: 'Reporting period 1 January to 31 December 2025: heat export from five data centers, Helsinki case study, volunteering, Pathways to Tech pilot reach.',
  },
  S7: {
    id: 'S7',
    title: 'Our U.S. community principles',
    publisher: 'Equinix Together',
    url: 'https://equinixtogether.com/community-principles/',
    published: null,
    kind: 'primary',
    supports: 'Five principles of community investment with 2025 figures: inclusive procurement, power responsibility, jobs and skills, natural resources, digital inclusion.',
  },
  S7b: {
    id: 'S7b',
    title: "We're not just building data centers. We're building communities.",
    publisher: 'Equinix Together, Arquelle Shaw, President of the Americas',
    url: 'https://equinixtogether.com/2026/06/02/we-are-building-communities/',
    published: '2026-06-02',
    kind: 'primary',
    supports: 'Minooka public infrastructure, grid cost commitments with PG&E and ComEd, local procurement and Pathways to Tech in Ashburn.',
  },
  S8: {
    id: 'S8',
    title: 'The heartbeat of the digital world runs on people',
    publisher: 'Equinix blog',
    url: 'https://blog.equinix.com/blog/2026/03/24/the-heartbeat-of-the-digital-world-runs-on-people/',
    published: '2026-03-24',
    kind: 'primary',
    supports: 'Workforce development: Pathways to Tech global launch, Global Data Center Technician Training Coalition with Generation, apprenticeships and Learning Labs.',
  },
};

export const topics = [
  { id: 'care', label: 'Care', chapter: 'care', sceneTarget: 'hospital' },
  { id: 'discovery', label: 'Discovery', chapter: 'discovery', sceneTarget: 'research' },
  { id: 'opportunity', label: 'Opportunity', chapter: 'opportunity', sceneTarget: 'learning' },
  { id: 'community', label: 'Community', chapter: 'community', sceneTarget: 'homes' },
  { id: 'resources', label: 'Responsible growth', chapter: 'resources', sceneTarget: 'aquatic' },
];

/** Relationship types keep direct Equinix action apart from enabled customer work and partner outcomes. */
export const relationshipLabels = {
  enables: 'Infrastructure that enables customer work',
  action: 'Direct Equinix action',
  partnership: 'Community partnership',
};

export const timeframeLabels = {
  historical: 'Historical achievement',
  current: 'Current programme',
  commitment: 'Future commitment',
};

const illustrative = (path, alt, generationId, model, prompt) => ({
  path,
  alt,
  provenance: `Higgsfield (${model}), generation ${generationId}. Prompt file: media-src/higgsfield/${prompt}`,
  usage: 'illustrative',
});

export const stories = [
  // ---- Care ---------------------------------------------------------------
  {
    id: '3verest',
    topic: 'care',
    relationship: 'enables',
    timeframe: 'current',
    title: 'Medical images, ready when the care team needs them',
    summary:
      '3verest runs sovereign healthcare clouds from Equinix facilities so radiologists can retrieve medical images in under a second while patient data stays within its jurisdiction.',
    organisation: '3verest',
    location: '21 regions worldwide, with the U.K. NHS among its users',
    humanContext:
      'Radiologists read the images that decide what happens next for a patient. When retrieval is slow, a diagnosis waits with it.',
    challenge:
      'Medical images are large, heavily regulated and kept for decades, yet clinicians need them in seconds. Healthcare operators also need proof that data, backups and AI inference stay within their jurisdiction.',
    equinixContribution:
      'In-country data center space as the physical anchor, carrier-neutral interconnection for private connections between care providers, medical device platforms and clouds, and Equinix Fabric Geo Zones that keep traffic inside defined geographic boundaries, even during failover.',
    partnerContribution:
      '3verest designs and operates the sovereign healthcare clouds, including imaging archives and governed AI inference, offered through medical device partners such as Agfa, GE HealthCare and Philips.',
    outcome:
      'Radiologists working on 3verest clouds can retrieve images in under a second, which 3verest reports as 28 times faster than the minutes seen on general public clouds.',
    metric: 'Under 1 second',
    metricLabel: 'to retrieve a medical image',
    metricScope: 'Reported by 3verest for its own platform, compared with general public clouds. Specific to this customer example.',
    reportingPeriod: 'Not stated in source',
    connection:
      'Equinix does not deliver the care. It provides the secure, local and directly connected foundation that lets 3verest keep critical medical data close, fast and governed.',
    quote: {
      text: 'Every slow image retrieval is a radiologist waiting.',
      attribution: 'Scott Crawford, CEO, 3verest, in the Equinix customer story',
    },
    conversationStarter: 'Ask a healthcare customer where their imaging data lives and how quickly clinicians can reach it.',
    sources: ['S1'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [illustrative('media/care-1200.webp', 'Two clinicians review a medical scan together on a monitor in a daylit reading room.', 'a2ba7305-3f2d-485d-afad-bb8a5443ac4c', 'Seedream 5.0 Pro', 'care.prompt.txt')],
    sceneTarget: 'hospital',
    shareSummary:
      '3verest hosts sovereign healthcare clouds in Equinix facilities. Private, local interconnection lets radiologists retrieve medical images in under a second (3verest reports 28x faster than general public clouds) while patient data stays in its jurisdiction.',
  },
  {
    id: 'harrison-ai',
    topic: 'care',
    relationship: 'enables',
    timeframe: 'historical',
    title: 'Faster AI development for earlier detection',
    summary:
      'Harrison.ai develops AI that helps clinicians read chest X-rays, building its models on NVIDIA infrastructure hosted in an Equinix data center.',
    organisation: 'Harrison.ai',
    location: 'Australia',
    humanContext: 'Clinicians reading chest X-rays look for early signs of cancer and other critical illness, often under time pressure.',
    challenge: 'Training clinical AI models takes large amounts of compute close to sensitive data.',
    equinixContribution: 'A data center home for private AI infrastructure, close to the networks and partners Harrison.ai depends on.',
    partnerContribution: 'Harrison.ai builds and validates the AI solutions and works with clinicians who make the diagnoses. NVIDIA provides the AI infrastructure.',
    outcome:
      'Equinix reports that the private AI deployment gave Harrison.ai 8x the data processing capability and reduced model training from months to days.',
    metric: 'Months to days',
    metricLabel: 'model training time',
    metricScope: 'As reported by Equinix for Harrison.ai’s private AI deployment. Clinical accuracy claims belong to Harrison.ai and are not restated here.',
    reportingPeriod: 'Reported March 2025',
    connection: 'The clinical progress is Harrison.ai’s. Equinix provides a well-connected place for the infrastructure that powers its development work.',
    quote: null,
    conversationStarter: 'Healthcare AI teams often need compute next to sensitive data. This is a short, specific example to share.',
    sources: ['S2b'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [],
    sceneTarget: 'hospital',
    shareSummary:
      'Harrison.ai builds AI that helps clinicians read chest X-rays, using NVIDIA infrastructure hosted in an Equinix data center. Equinix reports 8x data processing capability and model training cut from months to days (Equinix blog, March 2025).',
  },

  // ---- Discovery ----------------------------------------------------------
  {
    id: 'childrens-cancer-institute',
    topic: 'discovery',
    relationship: 'enables',
    timeframe: 'current',
    title: 'Comparing notes across the world for every child with cancer',
    summary:
      "Children's Cancer Institute in Sydney uses Equinix Fabric to connect its precision medicine data directly with cloud providers and research collaborators overseas.",
    organisation: "Children's Cancer Institute",
    location: 'Sydney, Australia, with collaborators in Philadelphia, Memphis and Heidelberg',
    humanContext:
      'Every childhood cancer is different, and treatments developed for adults often do not translate. Researchers measure as much as they can about each case to find what will help.',
    challenge:
      'That precision medicine approach creates terabytes of data, and the most useful patterns appear only when it is compared with data from research centres in other countries. In-house computing could not scale to that, and the data needed protecting.',
    equinixContribution:
      'Equinix Fabric gives the Institute a direct, private connection into its cloud providers and to collaborators worldwide, without the carrier costs usually involved in building that connectivity.',
    partnerContribution:
      'The Institute’s researchers lead the science, from generating the data to integrating it with partner centres and pursuing new treatments.',
    outcome:
      'Data generated in Sydney can be compared directly with data from Philadelphia, Memphis and Heidelberg in the same cloud environment.',
    metric: null,
    metricLabel: null,
    metricScope: null,
    reportingPeriod: null,
    connection:
      'The discoveries belong to the researchers. Equinix helps by shortening the distance between their data and the people they need to compare it with.',
    quote: {
      text: 'Equinix allows us to have a direct, secure connection into our cloud providers and fundamentally connect globally to our collaborators.',
      attribution: "Emilio Caspanello, ICT Manager, Children's Cancer Institute, in the Equinix customer story",
    },
    conversationStarter: 'Research customers often collaborate across borders. Ask how they move large datasets between partners today.',
    sources: ['S2', 'S2b'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [illustrative('media/discovery-1200.webp', 'Two researchers in a bright laboratory look together at a colourful data visualisation on a laptop.', 'd92ccbfc-c997-43b6-a878-847bb1238e70', 'Seedream 5.0 Pro', 'discovery.prompt.txt')],
    sceneTarget: 'research',
    shareSummary:
      "Children's Cancer Institute in Sydney uses Equinix Fabric for a direct, secure connection to its cloud providers and to research collaborators in Philadelphia, Memphis and Heidelberg, so precision medicine data from Australian patients can be compared with data overseas.",
  },

  // ---- Opportunity --------------------------------------------------------
  {
    id: 'pathways-to-tech',
    topic: 'opportunity',
    relationship: 'action',
    timeframe: 'current',
    title: 'From a school tour to a technician’s badge',
    summary:
      'Pathways to Tech opens Equinix data centers to students aged 14 to 18 through classroom talks, facility tours and education days led by employee volunteers.',
    organisation: 'Equinix employees and the Equinix Foundation',
    location: 'Now scaling to every Equinix location',
    humanContext:
      'Kayla first explored tech careers on a Pathways to Tech data center tour as a resident at i.c. stars, an Equinix Foundation partner in Chicago. Within months she had an IBX internship. Today she is a full-time Equinix Data Center Technician on the Chicago team.',
    challenge:
      'The work that keeps data centers running is largely hidden, so most young people never consider it as a career, or know how to start.',
    equinixContribution:
      'Employee volunteers lead classroom talks, IBX tours and hands-on education days, and the programme offers a structured path into Equinix internships, apprenticeships and early-career roles. School partnerships began in Ashburn, Virginia, and Dallas, Texas.',
    partnerContribution: 'Schools and youth organisations, including Foundation partners such as i.c. stars, bring students and support them into training and work.',
    outcome:
      'After a two-year pilot that reached nearly 2,000 students across the Americas and Asia-Pacific, Pathways to Tech is scaling to all Equinix locations worldwide.',
    metric: 'Nearly 2,000',
    metricLabel: 'students reached in the two-year pilot',
    metricScope: 'Two-year pilot in select communities across the Americas and Asia-Pacific, as reported in the 2025 Sustainability Report and Equinix blog.',
    reportingPeriod: 'Pilot completed by 2025',
    connection:
      'This is Equinix acting directly: our own people opening our own facilities, so students can picture themselves working there.',
    quote: null,
    conversationStarter: 'Ask local colleagues whether a nearby school could join Pathways to Tech, or whether a customer would like to co-host.',
    sources: ['S4c', 'S6', 'S8', 'S7b'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [illustrative('media/opportunity-1200.webp', 'Teenage students with visitor lanyards listen to an engineer explain a cooling system inside a bright data center.', 'e1d2fc0f-38ba-4fc1-94ae-eab7525282d7', 'Seedream 5.0 Pro', 'opportunity-v2.prompt.txt')],
    sceneTarget: 'learning',
    shareSummary:
      'Pathways to Tech opens Equinix data centers to students aged 14 to 18. After a two-year pilot reaching nearly 2,000 students, it is scaling to every Equinix location, with routes into internships and apprenticeships (Equinix 2025 Sustainability Report).',
  },
  {
    id: 'technician-coalition',
    topic: 'opportunity',
    relationship: 'partnership',
    timeframe: 'current',
    title: 'An industry-wide answer to the technician shortage',
    summary:
      'The Equinix Foundation and Generation launched the Global Data Center Technician Training Coalition, starting in Brazil with co-funding from ODATA, Cisco and Vertiv.',
    organisation: 'Equinix Foundation with Generation and coalition partners',
    location: 'Brazil first, with wider expansion planned',
    humanContext: 'For an unemployed young adult, a technician course with a job at the end can change the direction of a life.',
    challenge: 'The Uptime Institute estimates the data center industry is short of about 2.4 million workers, a problem too big for one company to solve.',
    equinixContribution: 'The Foundation created the coalition and helps fund it, alongside Equinix apprenticeships and new Learning Labs in Dallas, Paris and Singapore.',
    partnerContribution:
      'Generation, a global nonprofit that trains unemployed young people for high-demand jobs, delivers the training. ODATA, Cisco Systems and Vertiv co-fund the first programme.',
    outcome: 'Initial cohorts in Brazil were planned to begin in June 2026, the starting point for a broader global expansion.',
    metric: null,
    metricLabel: null,
    metricScope: null,
    reportingPeriod: null,
    connection: 'Generation delivers the outcome. Equinix convened the coalition so the whole industry can grow the workforce together.',
    quote: {
      text: 'Your gender doesn’t define what you can do with your life.',
      attribution: 'Holly Byrne Nugent, Equinix Technician Apprentice, quoted on the Equinix blog',
    },
    conversationStarter: 'Customers hiring for operations face the same shortage. The coalition invites co-funding partners.',
    sources: ['S8'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [],
    sceneTarget: 'learning',
    shareSummary:
      'The Equinix Foundation and Generation launched the Global Data Center Technician Training Coalition, starting in Brazil with co-funding from ODATA, Cisco and Vertiv, to address an industry shortage estimated at 2.4 million workers (Equinix blog, March 2026).',
  },

  // ---- Community ----------------------------------------------------------
  {
    id: 'community-principles',
    topic: 'community',
    relationship: 'action',
    timeframe: 'current',
    title: 'A neighbour that plans to stay for decades',
    summary:
      'Equinix’s U.S. Community Principles set out what neighbours can expect: paying our full share of grid costs, investing in public infrastructure, local jobs and skills, careful use of resources and digital inclusion.',
    organisation: 'Equinix with local governments, utilities and community leaders',
    location: 'Minooka, Illinois; San Jose, California; and U.S. communities where Equinix operates',
    humanContext:
      'In Minooka, Illinois, local leaders told Equinix what their community needed. The answer included a public bike path along the site and land for a future fire station.',
    challenge:
      'Data centers use power, water and land, and AI is accelerating demand. Communities rightly ask who pays for grid upgrades and what a new neighbour will give back.',
    equinixContribution:
      'At the Minooka campus, Equinix is contributing $17M in public infrastructure, including roads, traffic signals and multi-use paths. Across the U.S., Equinix funds the power and water infrastructure its sites need, with long-term utility agreements such as a 10-year transmission agreement with ComEd and a collaboration with PG&E and the City of San Jose.',
    partnerContribution:
      'Local leaders, utilities and residents set the priorities. Utilities plan and build the grid upgrades; local businesses supply the work.',
    outcome:
      'In 2025, Equinix spent more than $95 million with certified small, veteran-owned and other qualified businesses through inclusive procurement in the U.S.',
    metric: '$95M+',
    metricLabel: 'with small and inclusive U.S. businesses',
    metricScope: 'U.S. inclusive procurement with certified and qualified businesses in calendar year 2025, as reported in Equinix’s U.S. Community Principles.',
    reportingPeriod: '2025',
    connection:
      'Here the thread is not a cable. It is the long-term relationship between a data center and the town around it: roads, paths, power, taxes and local work.',
    quote: {
      text: 'We’re not just building data centers. We’re building communities.',
      attribution: 'Arquelle Shaw, President of the Americas, Equinix, June 2026',
    },
    conversationStarter:
      'When a customer or community asks what a data center means for them, the five U.S. Community Principles give a specific, sourced answer.',
    sources: ['S7', 'S7b'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [illustrative('media/neighbourhood-1200.webp', 'A parent and child cycle and an older couple walk along a new path through meadow planting, with a low timber and stone building beyond.', 'f399c835-7686-42ff-aa3d-bb8719a2b250', 'Nano Banana 2', 'neighbourhood.prompt.txt')],
    sceneTarget: 'homes',
    shareSummary:
      'Equinix’s U.S. Community Principles commit us to pay our full share of grid costs and invest locally. In Minooka, Illinois, Equinix is contributing $17M in public infrastructure, including a public bike path and land for a future fire station, and spent $95M+ with small and inclusive U.S. businesses in 2025.',
  },
  {
    id: 'digital-inclusion',
    topic: 'community',
    relationship: 'partnership',
    timeframe: 'current',
    title: 'Bringing more people online, and helping them thrive there',
    summary:
      'The Equinix Foundation funds nonprofits that expand connectivity, digital skills and workforce readiness, chosen with input from local Equinix employees.',
    organisation: 'Equinix Foundation and its nonprofit partners',
    location: '100 nonprofit partners across 48 metros since 2022',
    humanContext:
      'Booking a doctor, applying for work or helping a grandchild with homework increasingly happens online. Without access and skills, people are left out of everyday life.',
    challenge: 'An estimated 2.2 billion people remained unconnected to the internet in 2025, disproportionately from economically marginalised communities.',
    equinixContribution:
      'Grants, employee volunteering and expertise, and, where useful, Equinix technology resources and data center space. Local WeAreEquinix teams help identify community partners.',
    partnerContribution:
      'Partners such as unconnected.org, UNICEF Digital Inclusion through Giga, YUVA Unstoppable and the Enterprise Development Centre at Pan-Atlantic University design and deliver programmes in their own communities.',
    outcome:
      'In 2025, the Foundation’s nonprofit portfolio connected more than 3.5 million people to the internet and reached more than 1.6 million people with digital literacy and skills training.',
    metric: '3.5M+',
    metricLabel: 'people connected to the internet by partners',
    metricScope: 'Results delivered by the Equinix Foundation’s nonprofit portfolio in calendar year 2025, as reported by Equinix in August 2026.',
    reportingPeriod: '2025',
    connection: 'The partners do the work in their communities. Equinix brings funding, people and the reach of the digital infrastructure industry.',
    quote: null,
    conversationStarter: 'Many customers have their own digital inclusion goals. The Foundation co-funds with partners including Cisco and HPE.',
    sources: ['S4b', 'S4', 'S7'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [illustrative('media/community-1200.webp', 'A teenage volunteer helps an older woman use a tablet at a table in a sunlit library.', '0409d5e3-9c9a-47e6-88c5-e294043de654', 'Seedream 5.0 Pro', 'community.prompt.txt')],
    sceneTarget: 'homes',
    shareSummary:
      'The Equinix Foundation has awarded grants to 100 nonprofit partners across 48 metros. In 2025 its partner portfolio connected more than 3.5 million people to the internet and reached more than 1.6 million with digital skills training (Equinix, August 2026).',
  },
  {
    id: 'employee-volunteering',
    topic: 'community',
    relationship: 'action',
    timeframe: 'historical',
    title: 'Colleagues giving time where they live',
    summary:
      'Through WeGive, WeSkill and Matching Gifts, Equinix employees support local organisations with their time, expertise and giving, choosing the causes themselves.',
    organisation: 'Equinix employees',
    location: 'Communities where Equinix operates',
    humanContext: 'The people who run our facilities also live in these neighbourhoods. Their skills can help a local nonprofit grow.',
    challenge: 'Community organisations often need practical expertise as much as funding.',
    equinixContribution:
      'WeGive is fully employee-led: local WeAreEquinix teams choose the organisations they support. WeSkill volunteers share professional expertise, and Matching Gifts rose to $2,500 per employee in 2025.',
    partnerContribution: 'Local nonprofits lead their own programmes and decide where volunteer support helps most.',
    outcome:
      'In 2025, more than 4,600 employees contributed over 54,000 service hours, and 28 WeAreEquinix teams supported 31 local digital inclusion nonprofits with $280,000 in community grants.',
    metric: '54,400+',
    metricLabel: 'employee volunteering hours in 2025',
    metricScope: 'All Equinix employees, calendar year 2025, as reported in the 2025 Sustainability Report (a 45% increase on 2024).',
    reportingPeriod: '1 January to 31 December 2025',
    connection: 'This is Equinix as a neighbour: colleagues showing up for the communities around our sites.',
    quote: null,
    conversationStarter: 'Ask colleagues in your metro about their local WeAreEquinix team and how to join.',
    sources: ['S6', 'S7', 'S4'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [],
    sceneTarget: 'homes',
    shareSummary:
      'Equinix employees volunteered more than 54,400 hours in 2025, up 45% year over year. Employee-led WeGive teams choose the local nonprofits they support (Equinix 2025 Sustainability Report).',
  },

  // ---- Responsible growth -------------------------------------------------
  {
    id: 'pa10-heat',
    topic: 'resources',
    relationship: 'action',
    timeframe: 'current',
    title: 'Warm water for a neighbourhood pool in Saint-Denis',
    summary:
      'Equinix PA10 in Saint-Denis, Paris, recovers heat from customer servers for the local heat network that supplies the Olympic Aquatics Centre and homes nearby.',
    organisation: 'Equinix PA10 with the local heat network operator',
    location: 'Saint-Denis, Paris, France',
    humanContext: 'Swimmers, schools and local clubs use the Aquatic Centre, which hosted events at the Paris 2024 Olympics.',
    challenge: 'Servers produce heat that is usually released into the air. The neighbourhood around them needs heat for water and homes.',
    equinixContribution:
      'PA10 opened in 2023 and was designed to recover and export heat from customer equipment. Heat is recovered at about 28°C, raised to 65°C by heat pumps and passed through a heat exchanger to the heat network operator.',
    partnerContribution: 'The heat network operator distributes the heat to the Olympic Aquatics Centre and the surrounding Plaine Saulnier neighbourhood.',
    outcome:
      'Equinix connected PA10 to the heat network supplying the Aquatics Centre in 2024. Its excess heat is expected to warm more than 1,000 homes nearby, and Equinix describes the heat as provided free of charge for 15 years.',
    metric: '1,000+',
    metricLabel: 'homes expected to be warmed',
    metricScope: 'Expected reach of PA10 heat export, as stated by Equinix in April 2025. Specific to this site.',
    reportingPeriod: 'From 2024',
    connection: 'Here the thread is warm, not digital: heat leaving a data center and arriving as warm water in a public pool.',
    quote: {
      text: 'Our heat export initiative demonstrates the power of collective community action to support a move toward a circular economy.',
      attribution: 'Noah Nkonge, Heat Export Lead, Equinix, quoted by Data Center Knowledge, July 2024',
    },
    conversationStarter: 'Customers with sustainability goals often ask what happens to data center heat. PA10 is a specific, named example.',
    sources: ['S3', 'S3b', 'S3c'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [illustrative('media/resources-1200.webp', 'Morning light on the still water of an indoor public pool under a timber roof, with a few swimmers.', 'b279b6d5-79ab-4f43-87d6-7e8c9561b621', 'Seedream 5.0 Pro', 'resources.prompt.txt')],
    sceneTarget: 'aquatic',
    shareSummary:
      'Equinix PA10 in Saint-Denis recovers heat from customer servers for the heat network supplying the Olympic Aquatics Centre, with more than 1,000 nearby homes expected to benefit. Equinix does not seek income from the heat it exports (Equinix blog, April 2025).',
  },
  {
    id: 'markham-heat',
    topic: 'resources',
    relationship: 'partnership',
    timeframe: 'current',
    title: 'Heat for homes, offices and two community pools in Markham',
    summary:
      'Equinix TR5 exports residual heat to Markham District Energy, the city-owned utility that warms buildings, condo hot water and two community centre pools.',
    organisation: 'Equinix TR5 with Markham District Energy',
    location: 'Markham, Ontario, Canada',
    humanContext:
      'Markham created its district energy utility after the 1998 ice storm, so families would stay warm even if the electricity grid failed.',
    challenge: 'A fast-growing city needs reliable, efficient heat and has a goal of net zero emissions by 2050.',
    equinixContribution: 'Since late 2023, Equinix TR5 has exported residual heat into the Markham District Energy system through its heat pump project. Equinix seeks no income from the heat.',
    partnerContribution:
      'Markham District Energy distributes the heat to over 14 million square feet of mixed-use development, including condo hot water and two swimming pools in community centres.',
    outcome:
      'The heat supports Markham’s Municipal Energy Plan. In summer there is sometimes more heat than the community can use; the aim is to recover all of it as more buildings connect.',
    metric: '14M sq ft',
    metricLabel: 'of mixed-use buildings served by the network',
    metricScope: 'Floor area served by the Markham District Energy system that TR5 contributes to, as described by Equinix in April 2025. TR5 is one of its heat sources.',
    reportingPeriod: 'From late 2023',
    connection: 'Markham District Energy delivers the warmth. Equinix contributes heat that would otherwise go to waste.',
    quote: {
      text: 'We’re using the MDE system to reduce emissions in the community and provide efficient heating and cooling to buildings in our City.',
      attribution: 'Peter Ronson, Chief Operating Officer, Markham District Energy, on the Equinix blog',
    },
    conversationStarter: 'Heat export now runs at five Equinix data centers. Markham shows how it fits a city’s own energy plan.',
    sources: ['S3', 'S6'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [],
    sceneTarget: 'aquatic',
    shareSummary:
      'Equinix TR5 exports residual heat to Markham District Energy in Ontario, which serves over 14 million square feet of buildings, condo hot water and two community centre pools (Equinix blog, April 2025).',
  },
  {
    id: 'efficient-operations',
    topic: 'resources',
    relationship: 'action',
    timeframe: 'current',
    title: 'Running facilities more efficiently, year after year',
    summary:
      'Equinix reports its 2025 performance, an average annual PUE of 1.37 and 96% renewable energy coverage across retail IBX data centers, and has dated commitments for what comes next.',
    organisation: 'Equinix',
    location: 'Global retail IBX portfolio',
    humanContext: 'Every customer workload and every community connection depends on facilities that use energy and water carefully.',
    challenge: 'Demand for digital infrastructure, including AI, is rising. Growth needs to come with efficiency, careful water use and a credible path to lower emissions.',
    equinixContribution:
      'Energy efficiency investment ($36M in 2025), clean and renewable energy purchases, on-site fuel cells, and at new sites, avoiding water-based cooling in water-stressed areas. Recovered heat from five data centers was exported to local communities as of 2025.',
    partnerContribution:
      'Energy suppliers, utilities and technology partners contribute, and more than 600 customers use Green Power Reports for their own reporting.',
    outcome:
      'In 2025, Equinix reported an average annual PUE of 1.37 and 96% renewable energy coverage across retail IBX data centers, the eighth year in a row above 90% globally.',
    metric: '1.37',
    metricLabel: 'average annual PUE in 2025',
    metricScope:
      'Equinix reported average for 2025. Renewable energy coverage uses Equinix’s published definition across retail IBX data centers and does not mean continuous direct renewable supply at every site.',
    reportingPeriod: '1 January to 31 December 2025',
    connection: 'Responsibility here is operational: measured practices, reported every year, with dated commitments for the future.',
    quote: null,
    conversationStarter: 'Point customers to Green Power Reports and the annual Sustainability Report for scoped, dated figures.',
    sources: ['S5', 'S6', 'S7'],
    verificationStatus: 'sourced',
    lastChecked: LAST_CHECKED,
    media: [],
    sceneTarget: 'datacenter',
    shareSummary:
      'Equinix reported an average annual PUE of 1.37 and 96% renewable energy coverage across its retail IBX data centers in 2025, with SBTi-approved targets for net zero by 2040 (Equinix 2025 Sustainability Report).',
  },
];

/** Equinix's five U.S. Community Principles, summarised with one sourced proof point each. */
// `where` and `kind` label the proof point; `headline` is the proof in a
// few words; `art` names the photograph beside it (AI generated for this
// page, illustrative; see media-src/promises) with its alt text.
export const principles = [
  { name: 'Public infrastructure investment', promise: 'Invest in roads, paths and public services around our sites, and fund the power and water infrastructure our sites need.', proof: 'A public bike path and land for a future fire station in Minooka, Illinois.', headline: 'A bike path, and land for a fire station.', where: 'Minooka, Illinois', kind: 'Site example', art: 'kept-1', alt: 'A cyclist rides a new path along the landscaped edge of a campus in low autumn light, past a cleared corner plot.' },
  { name: 'Power responsibility', promise: 'Pay our full share of grid costs so our demand does not raise residents’ bills.', proof: 'A 10-year transmission agreement with ComEd that the utility described as a model.', headline: 'A 10-year agreement the utility called a model.', where: 'With ComEd', kind: 'Agreement', art: 'kept-2', alt: 'Family homes on a quiet street at golden hour, with a line of transmission pylons fading into the haze behind them.' },
  { name: 'Jobs and skills development', promise: 'Create quality jobs and educational pathways for tomorrow’s workforce.', proof: 'School partnerships through Pathways to Tech, starting in Ashburn and Dallas.', headline: 'From a school tour to a career.', where: 'Ashburn and Dallas', kind: 'Programme', art: 'kept-3', alt: 'Three students follow a technician along a bright data center corridor as he points at equipment behind glass.' },
  { name: 'Natural resource protection', promise: 'Use water and land carefully and report transparently.', proof: 'Avoiding water-based cooling at new sites in water-stressed areas.', headline: 'Dry cooling where water is scarce.', where: 'New sites in water-stressed areas', kind: 'Design choice', art: 'kept-4', alt: 'A clear creek in a dry valley, with a long low building and its rooftop fan units in the distance.' },
  { name: 'Bridge the digital divide', promise: 'Expand access to connectivity, skills and careers.', proof: '28 WeAreEquinix teams supported 31 local digital inclusion nonprofits in 2025.', headline: '28 teams, 31 nonprofits, one year.', where: 'Employee teams, 2025', kind: 'Result', art: 'kept-5', alt: 'Volunteers help a grandmother and a teenager with laptops at a wooden table in a sunlit community room.' },
];

/** The story that leads each chapter. */
export const chapterLead = {
  care: '3verest',
  discovery: 'childrens-cancer-institute',
  opportunity: 'pathways-to-tech',
  community: 'community-principles',
  resources: 'pa10-heat',
};

export const getStory = (id) => stories.find((s) => s.id === id) || null;
export const storiesForTopic = (topic) => stories.filter((s) => s.topic === topic);
