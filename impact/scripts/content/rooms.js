// The rooms you can step into from the community model: one per stop.
// Each has a panorama (AI generated, illustrative), a dive film whose first
// frame is the model's door view and whose last frame is the room, and a
// short caption script drawn from the lead story. Captions keep the scope
// of every figure and never claim more than the story does.
import { getStory, sources } from './stories.js';

const room = (place, title, story, lines, { heat = false } = {}) => ({
  place,
  title,
  story,
  heat,
  pano: `media/rooms/${place}-pano`,
  dive: `media/rooms/${place}-dive`,
  poster: `media/rooms/${place}-room-1280.webp`,
  voice: `media/voice/${place}`, // <place>-1.mp3, -2, -3: one spoken line per caption
  lines,
});

export const rooms = {
  hospital: room('hospital', 'The reading room', '3verest', [
    { kind: 'moment', text: 'A radiologist opens a patient’s scan. Somewhere, a family is waiting for what it shows.' },
    { kind: 'fact', text: 'Under 1 second to retrieve a medical image on 3verest’s platform, compared with general public clouds.', source: 'S1', scope: 'Reported by 3verest for its own platform.' },
    { kind: 'connection', text: '3verest built its medical imaging cloud on Equinix. The connection is private, close to the hospitals, and always on.' },
  ]),
  research: room('research', 'The laboratory', 'childrens-cancer-institute', [
    { kind: 'moment', text: 'In Sydney, researchers compare one child’s cancer with cases studied on the other side of the world.' },
    { kind: 'fact', text: 'Children’s Cancer Institute shares and analyses genomic data with research partners around the world.', source: 'S2b' },
    { kind: 'connection', text: 'The science is theirs. Equinix provides the private, well-connected place their data lives and travels from.' },
  ]),
  learning: room('learning', 'The training floor', 'pathways-to-tech', [
    { kind: 'moment', text: 'A student walks into a data center for the first time and asks how it all works.' },
    { kind: 'fact', text: 'Nearly 2,000 students reached in the two-year Pathways to Tech pilot.', source: 'S4c', scope: 'Select communities across the Americas and Asia-Pacific.' },
    { kind: 'connection', text: 'Kayla’s tour became an internship, then a full-time technician role in Chicago.' },
  ]),
  homes: room('homes', 'The path by the site', 'community-principles', [
    { kind: 'moment', text: 'In Minooka, Illinois, a public bike path runs along the data center site, and land is being donated for a future fire station.' },
    { kind: 'fact', text: '$95M+ spent with small and inclusive U.S. businesses in 2025.', source: 'S7', scope: 'U.S. inclusive procurement, calendar year 2025.' },
    { kind: 'connection', text: 'Five promises to the places we call home, reported against every year.' },
  ]),
  aquatic: room('aquatic', 'The pool hall', 'pa10-heat', [
    { kind: 'moment', text: 'Early swimmers in Saint-Denis are in water warmed, in part, by heat that once left a data center unused.' },
    { kind: 'fact', text: '1,000+ homes expected to be warmed by heat exported from Equinix PA10.', source: 'S3', scope: 'Expected reach, as stated by Equinix in April 2025. Specific to this site.' },
    { kind: 'connection', text: 'Here the thread is warm, not digital: heat leaving a data center and arriving as warm water in a public pool.' },
  ], { heat: true }),
  datacenter: room('datacenter', 'The data hall', 'efficient-operations', [
    { kind: 'moment', text: 'Every customer workload and every community connection depends on a hall like this, run carefully every hour of every day.' },
    { kind: 'fact', text: '1.37 average annual PUE in 2025.', source: 'S6', scope: 'Equinix global portfolio, calendar year 2025.' },
    { kind: 'connection', text: 'A data center is part of its community, not apart from it. Every thread on the model begins here.' },
  ]),
};

export function roomFor(place) {
  return rooms[place] || null;
}

/** A line's source entry, for the caption footer. */
export function lineSource(line) {
  return line.source ? sources[line.source] : null;
}

export { getStory };
