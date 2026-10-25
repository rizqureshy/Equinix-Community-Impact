// Prototype: the People section as one line of six colleagues. No blur: whoever is
// nearest the pointer simply comes to the front, and their story appears beneath.
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/fraunces';

// Each person carries one impact story: role, headline, figure, the story, source.
// Figures keep their scope and period. Equinix provides the infrastructure; partners do the work.
const CAST = [
  { img: 'p02-night-electrician', role: 'Operations engineer', where: 'Storms, earthquakes and grid emergencies', head: 'When the weather turns, the building stays up', fig: '99.9999%', figl: 'of 2025 the global footprint stayed up', story: 'Through Sandy every New York and New Jersey site ran on generators with 48 hours of fuel, and engineers slept on cots beside them. Through Harvey, HO1 Houston never lost power while the streets outside were under water. Through the Texas freeze of 2021, all nine Texas sites stayed on. After Tohoku, Equinix Japan gave carriers free exchange ports so they could rebuild capacity.', src: 'Form 10-K for 2025; trade press accounts of 2012, 2017 and 2021; Equinix Japan, March 2011' },
  { img: 'p05-heat-engineer', role: 'Heat export engineer', where: 'Helsinki, Espoo, Frankfurt, Paris, Markham', head: 'The warmth a data center makes goes next door', fig: '19 GWh', figl: 'of recovered heat given to communities in 2025', story: 'Helsinki homes have been warmed by an Equinix building since 2010. In Espoo two sites feed Fortum’s district network, up to 2,000 homes a year. In Frankfurt three halls are to warm about 1,000 Griesheim households free of charge. In 2024 Equinix opened the offer to any town that wants the heat.', src: '2025 Annual Report; Equinix newsroom, 2023 and 2024' },
  { img: 'p06-cooling-engineer', role: 'Cooling engineer', where: 'Air, not water, where water is scarce', head: 'Cool the halls without draining the town', fig: '0.91', figl: 'litres of water per kWh across the portfolio in 2025', story: 'New sites in water-stressed places avoid water-based cooling altogether, a commitment written into the U.S. Community Principles. Across the footprint 37% of the water drawn in 2024 was non-potable. In 2022 Equinix became the first colocation operator to run its halls closer to 27°C, which cuts cooling energy, and in Georgia an on-site plant returns treated water to the Flint watershed.', src: '2025 Annual Report; 2024 Sustainability Data Summary; U.S. Community Principles; 2025 Sustainability Report' },
  { img: 'p04-tour-guide', role: 'Pathways coach', where: 'Schools, apprentices, veterans', head: 'From a school tour to a technician’s badge', fig: '1,800+', figl: 'students on data center tours in 2025', story: 'More than 60 tours and sessions across 32 locations in one year. One of them sparked Kayla’s path: an internship within months, then a full-time technician role in Chicago. Apprenticeships and internships brought in 12% of 2025 hires, and SkillBridge cohorts train transitioning service members as technicians in six U.S. cities.', src: 'Equinix release, August 2026; Equinix blog, March 2026; 2025 Sustainability Report; Equinix careers' },
  { img: 'p10-energy-manager', role: 'Energy engineer', where: 'Clean power and a fair grid', head: 'Clean power for us, no extra cost for the neighbours', fig: '96%', figl: 'renewable coverage in 2025, the eighth year above 90%', story: '29 power purchase agreements across 12 countries add 1,472 MW of new wind and solar to the grids we share. More than 100 MW of fuel cells run at 19 U.S. sites. And in Hampton, Georgia, Equinix pays 100% of the grid costs its demand creates for 20 years, so residents’ bills do not rise.', src: 'Form 10-K for 2025; Equinix press releases, August 2025 and August 2026' },
  { img: 'p08-volunteer', role: 'WeGive volunteer', where: 'Impact Month, every metro', head: 'Time given where we live', fig: '54,400+', figl: 'volunteer hours in 2025, up 45% on the year', story: '28 WeAreEquinix teams chose and backed 31 local nonprofits with $280,000 in funding, and Impact Month reached more than 40 locations, from an emergency food drive in Secaucus to classroom sessions in Mumbai. When colleagues themselves are hit by disaster, the Employee Relief Fund made 19 grants in 2025.', src: '2025 Sustainability Report' },
];

const row = document.getElementById('row'), story = document.getElementById('story'), inner = document.getElementById('storyInner'), roles = document.getElementById('roles'), hint = document.getElementById('hint'), marker = document.getElementById('marker');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => matchMedia('(max-width: 760px)').matches;

const people = CAST.map((c, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'person'; b.setAttribute('aria-label', `${c.role}. ${c.head}.`);
  b.style.zIndex = String(10 + i);
  const im = document.createElement('img'); im.src = `../media/people/${c.img}.webp`; im.alt = ''; im.decoding = 'async'; im.width = 605; im.height = 900;
  b.appendChild(im); row.appendChild(b);
  b.addEventListener('mouseenter', () => { if (pinned === null) setActive(i); });
  b.addEventListener('focus', () => setActive(i));
  b.addEventListener('click', () => { pinned = pinned === i ? null : i; setActive(i, true); });
  const r = document.createElement('button'); r.type = 'button'; r.innerHTML = `<b>${c.role}</b><span>${c.where}</span>`; r.setAttribute('aria-pressed', 'false');
  r.addEventListener('click', () => { pinned = i; setActive(i, true); if (narrow()) b.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }); });
  roles.appendChild(r);
  return { c, el: b, role: r };
});

let active = null, pinned = null, storyTimer = null;
function setActive(i, force) {
  if (i === active && !force) return;
  active = i;
  people.forEach((p, j) => { p.el.classList.toggle('on', j === i); p.el.style.zIndex = j === i ? '40' : String(10 + j); p.role.setAttribute('aria-pressed', String(j === i)); });
  if (i === null) { story.classList.remove('show'); marker.style.opacity = '0'; return; }
  const c = CAST[i];
  story.classList.add('swap'); clearTimeout(storyTimer);
  storyTimer = setTimeout(() => {
    inner.innerHTML = `<div class="where">${c.role} · ${c.where}</div><div class="head">${c.head}</div><div class="fig">${c.fig}<small>${c.figl}</small></div><div class="line">${c.story}</div><div class="src">${c.src}${pinned === i ? ' · Pinned, click again to release' : ''}</div>`;
    story.classList.remove('swap');
  }, reduce ? 0 : 200);
  story.classList.add('show');
  // A small red marker sits under the person in front
  const r = row.getBoundingClientRect(), b = people[i].el.getBoundingClientRect();
  marker.style.left = `${((b.left + b.width / 2 - r.left) / r.width) * 100}%`; marker.style.opacity = '1';
  hint.textContent = 'Click to keep someone in front; click again to let go.';
}
row.addEventListener('mouseleave', () => { if (pinned === null && !row.contains(document.activeElement)) setActive(null); });

// Phones: the person nearest the centre of the row is in front
function nearestCentre() { const r = row.getBoundingClientRect(); const cx = r.left + r.width / 2; let best = 0, bd = 1e9; people.forEach((p, i) => { const b = p.el.getBoundingClientRect(); const d = Math.abs(b.left + b.width / 2 - cx); if (d < bd) { bd = d; best = i; } }); return best; }
row.addEventListener('scroll', () => { if (narrow()) setActive(nearestCentre()); }, { passive: true });
addEventListener('resize', () => { if (active !== null) setActive(active, true); });
if (narrow()) { requestAnimationFrame(() => { people[0].el.scrollIntoView({ inline: 'center', block: 'nearest' }); setActive(0); }); } else { setActive(0); }
