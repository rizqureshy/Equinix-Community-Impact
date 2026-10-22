// Where the stories happen, the pillars that frame them, and the milestones
// of progress. Coordinates are approximate city positions for the map.

/** The five pillars, keyed by topic id. `word` is the single word on the page. */
export const PILLARS = {
  care: {
    number: '01',
    word: 'Care',
    title: 'Care that arrives in time.',
    intro: 'Hospitals and health platforms keep patient data close, fast and governed on Equinix infrastructure, so a scan is ready the moment a clinician needs it.',
    moment: 'A radiologist opens a patient’s scan. Somewhere, a family is waiting for what it shows.',
    film: 'clip-care',
  },
  discovery: {
    number: '02',
    word: 'Research',
    title: 'Research that crosses borders.',
    intro: 'Private, direct connections let research teams compare data with partners on other continents, and give AI developers compute next to sensitive data.',
    moment: 'In Sydney, researchers compare one child’s cancer with cases studied in Philadelphia, Memphis and Heidelberg.',
    film: 'clip-discovery',
  },
  opportunity: {
    number: '03',
    word: 'Growth',
    title: 'Growth that starts with a school tour.',
    intro: 'Pathways to Tech, apprenticeships and an industry coalition open data center careers to young people who never knew the work existed.',
    moment: 'A student walks into a data center for the first time and asks how it all works.',
    film: 'clip-opportunity',
  },
  community: {
    number: '04',
    word: 'Support',
    title: 'Support for the places we call home.',
    intro: 'Public infrastructure, inclusive procurement, employee volunteering and digital inclusion grants: how Equinix shows up as a neighbour.',
    moment: 'In Minooka, Illinois, a public bike path runs along the data center site, and land is set aside for a future fire station.',
    film: 'clip-neighbourhood',
  },
  resources: {
    number: '05',
    word: 'Progress',
    title: 'Progress you can measure.',
    intro: 'Recovered heat warming pools and homes, efficiency reported every year, and dated commitments for what comes next.',
    moment: 'Early swimmers in Saint-Denis are in water warmed, in part, by heat that once left a data center unused.',
    film: 'clip-pool',
  },
};

/** Pins on the map. `partner` marks a collaborator location rather than an Equinix site or programme. */
export const PLACES = [
  { id: 'london', name: 'United Kingdom', lat: 51.5, lon: -0.12, story: '3verest', note: 'The NHS is among the users of 3verest sovereign healthcare clouds hosted in Equinix facilities.' },
  { id: 'sydney', name: 'Sydney', lat: -33.87, lon: 151.21, story: 'childrens-cancer-institute', also: ['harrison-ai'], note: 'Children’s Cancer Institute connects its precision medicine data through Equinix Fabric. Harrison.ai builds clinical AI on infrastructure hosted in an Equinix data center.' },
  { id: 'philadelphia', name: 'Philadelphia', lat: 39.95, lon: -75.17, story: 'childrens-cancer-institute', partner: true, note: 'Research collaborator of Children’s Cancer Institute.' },
  { id: 'memphis', name: 'Memphis', lat: 35.15, lon: -90.05, story: 'childrens-cancer-institute', partner: true, note: 'Research collaborator of Children’s Cancer Institute.' },
  { id: 'heidelberg', name: 'Heidelberg', lat: 49.4, lon: 8.69, story: 'childrens-cancer-institute', partner: true, note: 'Research collaborator of Children’s Cancer Institute.' },
  { id: 'chicago', name: 'Chicago', lat: 41.88, lon: -87.63, story: 'pathways-to-tech', note: 'Where Kayla went from a Pathways to Tech tour to a full-time technician role.' },
  { id: 'ashburn', name: 'Ashburn, Virginia', lat: 39.04, lon: -77.49, story: 'pathways-to-tech', note: 'One of the first Pathways to Tech school partnerships.' },
  { id: 'dallas', name: 'Dallas, Texas', lat: 32.78, lon: -96.8, story: 'pathways-to-tech', note: 'School partnerships and a new Learning Lab.' },
  { id: 'brazil', name: 'Brazil', lat: -23.55, lon: -46.63, story: 'technician-coalition', note: 'First cohorts of the Global Data Center Technician Training Coalition.' },
  { id: 'minooka', name: 'Minooka, Illinois', lat: 41.45, lon: -88.26, story: 'community-principles', note: '$17M in public infrastructure, a public bike path and land for a future fire station.' },
  { id: 'san-jose', name: 'San Jose, California', lat: 37.34, lon: -121.89, story: 'community-principles', note: 'Grid collaboration with PG&E and the City of San Jose.' },
  { id: 'lagos', name: 'Lagos', lat: 6.52, lon: 3.38, story: 'digital-inclusion', partner: true, note: 'Enterprise Development Centre at Pan-Atlantic University, a Foundation partner.' },
  { id: 'india', name: 'India', lat: 23.02, lon: 72.57, story: 'digital-inclusion', partner: true, note: 'YUVA Unstoppable, a Foundation partner.' },
  { id: 'saint-denis', name: 'Saint-Denis, Paris', lat: 48.94, lon: 2.36, story: 'pa10-heat', heat: true, note: 'PA10 heat for the Olympic Aquatics Centre and more than 1,000 homes.' },
  { id: 'markham', name: 'Markham, Ontario', lat: 43.86, lon: -79.34, story: 'markham-heat', heat: true, note: 'TR5 heat into Markham District Energy.' },
  { id: 'helsinki', name: 'Helsinki', lat: 60.17, lon: 24.94, story: 'efficient-operations', heat: true, note: 'Heat export case study in the 2025 Sustainability Report; one of five data centers exporting heat.' },
];

/** Arcs drawn between a story's places. */
export const ARCS = [
  { from: 'sydney', to: 'philadelphia', story: 'childrens-cancer-institute' },
  { from: 'sydney', to: 'memphis', story: 'childrens-cancer-institute' },
  { from: 'sydney', to: 'heidelberg', story: 'childrens-cancer-institute' },
];

/** Milestones for the progress timeline. `kind` separates what has happened from what is committed. */
export const MILESTONES = [
  { year: '1998', kind: 'past', title: 'Equinix is founded', text: 'A company that intends to stay in its communities for decades.', source: 'S7' },
  { year: '2022', kind: 'past', title: 'The Foundation begins awarding grants', text: 'Since then, 100 nonprofit partners across 48 metros.', source: 'S4b' },
  { year: '2023', kind: 'past', title: 'Heat starts to leave the building', text: 'PA10 opens in Saint-Denis, designed to export heat. TR5 begins supplying Markham District Energy.', source: 'S3', story: 'markham-heat' },
  { year: '2024', kind: 'past', title: 'Warm water for an Olympic pool', text: 'PA10 connects to the network supplying the Aquatics Centre. Equinix states that future IBX data centers will be designed for heat recovery.', source: 'S3b', story: 'pa10-heat' },
  { year: '2025', kind: 'past', title: 'A year measured and reported', text: 'Average PUE of 1.37, 96% renewable coverage, 54,400+ volunteer hours, $95M+ with inclusive U.S. businesses, 3.5M+ people connected by Foundation partners.', source: 'S6', story: 'efficient-operations' },
  { year: '2026', kind: 'now', title: 'Pathways scale up', text: 'Pathways to Tech goes global after a pilot reaching nearly 2,000 students. The technician coalition launches in Brazil. A further $50M for the Foundation.', source: 'S8', story: 'pathways-to-tech' },
  { year: '2030', kind: 'commitment', title: 'Commitment: PUE of 1.33 or better', text: 'A dated efficiency target across the portfolio.', source: 'S7' },
  { year: '2040', kind: 'commitment', title: 'Commitment: net zero', text: 'Science Based Targets initiative approved.', source: 'S5' },
];
