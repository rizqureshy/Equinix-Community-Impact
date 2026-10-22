// The impact map: a dot-matrix world drawn as one SVG path, with pins for
// the places in the stories and arcs between collaborating places.
// Equirectangular, so a longitude is a straight column and labels stay put.
import { DOTS, LAT_RANGE } from './content/map-dots.js';

const W = 1000;
const H = Math.round((W * (LAT_RANGE[1] - LAT_RANGE[0])) / 360);
const project = (lon, lat) => [((lon + 180) / 360) * W, ((LAT_RANGE[1] - lat) / (LAT_RANGE[1] - LAT_RANGE[0])) * H];
const svgNS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => {
  const n = document.createElementNS(svgNS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

export function createMap(container, { places, arcs, storyTopic, onSelect }) {
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'map', role: 'group', 'aria-label': 'World map with the places in the stories' });
  // Land as one path: a tiny circle per dot.
  const r = 1.15;
  let d = '';
  for (const [lon, lat] of DOTS) {
    const [x, y] = project(lon, lat);
    d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
  }
  svg.appendChild(el('path', { d, class: 'map-land' }));

  const byId = Object.fromEntries(places.map((p) => [p.id, p]));
  const arcLayer = el('g', { class: 'map-arcs' });
  for (const a of arcs) {
    const [x1, y1] = project(byId[a.from].lon, byId[a.from].lat);
    const [x2, y2] = project(byId[a.to].lon, byId[a.to].lat);
    const mx = (x1 + x2) / 2;
    const my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.22;
    const path = el('path', { d: `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`, class: 'map-arc', 'data-topic': storyTopic(a.story), pathLength: '1' });
    arcLayer.appendChild(path);
  }
  svg.appendChild(arcLayer);

  const pinLayer = el('g', { class: 'map-pins' });
  const pins = {};
  for (const p of places) {
    const [x, y] = project(p.lon, p.lat);
    const g = el('g', {
      class: `pin${p.partner ? ' pin--partner' : ''}${p.heat ? ' pin--heat' : ''}`,
      transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`,
      'data-place': p.id,
      'data-topic': storyTopic(p.story),
      role: 'button',
      tabindex: '0',
      'aria-label': `${p.name}: ${p.note}`,
    });
    g.appendChild(el('circle', { r: 14, class: 'pin-halo' }));
    g.appendChild(el('circle', { r: 9, class: 'pin-hit' }));
    g.appendChild(el('circle', { r: p.partner ? 3.2 : 4.2, class: 'pin-dot' }));
    const label = el('text', { x: x > W * 0.86 ? -9 : 9, y: 3.5, class: 'pin-label', 'text-anchor': x > W * 0.86 ? 'end' : 'start' });
    label.textContent = p.name;
    g.appendChild(label);
    pinLayer.appendChild(g);
    pins[p.id] = g;
  }
  svg.appendChild(pinLayer);
  container.appendChild(svg);

  let selected = null;
  function select(id, { silent = false } = {}) {
    selected = id;
    for (const [k, g] of Object.entries(pins)) g.classList.toggle('is-selected', k === id);
    svg.classList.toggle('has-selection', !!id);
    const topic = id ? storyTopic(byId[id].story) : null;
    const story = id ? byId[id].story : null;
    arcLayer.querySelectorAll('.map-arc').forEach((a) => a.classList.toggle('is-lit', !!story && arcs.some((x) => x.story === story && a.dataset.topic === topic)));
    if (!silent) onSelect?.(id ? byId[id] : null);
  }
  function filter(topic) {
    for (const g of Object.values(pins)) g.classList.toggle('is-dim', topic !== 'all' && g.dataset.topic !== topic);
    arcLayer.querySelectorAll('.map-arc').forEach((a) => a.classList.toggle('is-dim', topic !== 'all' && a.dataset.topic !== topic));
    if (selected && topic !== 'all' && pins[selected].dataset.topic !== topic) select(null);
  }
  svg.addEventListener('click', (e) => {
    const g = e.target.closest('.pin');
    if (g) select(g.dataset.place === selected ? null : g.dataset.place);
  });
  svg.addEventListener('keydown', (e) => {
    const g = e.target.closest('.pin');
    if (!g) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(g.dataset.place === selected ? null : g.dataset.place);
    }
  });

  return {
    select,
    filter,
    get selected() {
      return selected;
    },
    pins,
  };
}
