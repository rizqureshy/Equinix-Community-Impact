// Prototype, second pass: one line of six colleagues. The one you look at steps forward
// and the neighbours make room; their story appears beside the face; click for the whole story.
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/fraunces';

// Each person carries one impact story: role, headline, figure, the story, source.
// Figures keep their scope and period. Equinix provides the infrastructure; partners do the work.
const CAST = [
  { img: 'p02-night-electrician', role: 'Operations engineer', where: 'Storms, earthquakes and grid emergencies', head: 'When the weather turns, the building stays up', fig: '6', figl: 'engineers who stayed inside HO1 Houston from Friday to Tuesday as Harvey flooded the streets', story: 'The streets around HO1 were under water and customers could not reach it, so the six on site did their hands-on work for them, and the building never lost power. Through Sandy, Newark ran eleven and a half hours on generator with no interruption for Cloudflare, every New York and New Jersey site had 48 hours of fuel, and when a generator at NY9 failed the engineers had it repaired by morning. Before Irma, the Miami team moved in with food, water and cots to hold a site that TeleGeography called the only critical communications node in the storm’s path. Fuel contracts put these buildings second in line behind hospitals, every IBX is certified to the ISO 22301 continuity standard, and in the winter of 2022 European sites raised their diesel reserves from 60% to 90% in case the grid failed.', src: 'Data Center Frontier, Sept 2017; Cloudflare, Oct 2012; InformationWeek, Oct 2012; Data Center Knowledge, Sept 2017; Equinix newsroom, April 2017; Irish Times, Aug 2022', size: 1.0, off: 0 },
  { img: 'p05-heat-engineer', role: 'Heat export engineer', where: 'Helsinki, Espoo, Frankfurt, Paris, Markham', head: 'The warmth a data center makes goes next door', fig: '19 GWh', figl: 'of recovered heat given to communities in 2025', story: 'Helsinki homes have been warmed by an Equinix building since 2010, the first data center heating project in the world, and two more sites there now heat several thousand households. In Espoo two sites feed Fortum’s district network for up to 2,000 homes a year. In Markham, TR5 supplies homes, a hotel, a university and a mall, with hot water all year round. In Paris the Olympic aquatic centre gets its heat free for 15 years, and in Frankfurt three halls are to warm about 1,000 Griesheim households free of charge. In 2024 Equinix opened the offer to any town that wants the heat.', src: '2025 Annual Report; Helen, June 2022; Equinix newsroom, May 2023, July 2023 and June 2024', size: 0.9, off: 5 },
  { img: 'p06-cooling-engineer', role: 'Cooling engineer', where: 'Air, not water, where water is scarce', head: 'Cool the halls without draining the town', fig: '0.91', figl: 'litres of water per kWh across the portfolio in 2025', story: 'In 2023 the design guidelines were changed to rule out evaporative cooling in highly water-stressed areas, because it is the largest driver of water use. The same year a new build already planned for evaporative cooling was switched to air after a water-stress analysis, even though the metro was prepared for drought, because the neighbours were worried. Madrid’s MD5 opened in 2026 on a cooling model that runs without consuming water; in Toronto a site draws on deep lake water and in Amsterdam on an aquifer; Johannesburg cools with outside air. Only about 40% of sites use evaporative cooling at all, and every site that uses water for cooling now reports it to customers in a verified water report.', src: 'Climate Week NYC Q&A with Christopher Wellise, Aug 2025; Alex Setmajer, Sustainability Matters, Nov 2024 and Mar 2025; Equinix newsroom and press, 2022 to 2026; 2025 Annual Report; Form 10-K for 2025', size: 1.04, off: -1 },
  { img: 'p04-tour-guide', role: 'Pathways coach', where: 'Schools, apprentices, veterans', head: 'From a school tour to a technician’s badge', fig: '1,800+', figl: 'students on data center tours in 2025', story: 'More than 60 tours and sessions across 32 locations in one year. One of them sparked Kayla’s path: an internship within months, then a full-time technician role in Chicago. Apprenticeships and internships brought in 12% of 2025 hires, and SkillBridge cohorts train transitioning service members as technicians in six U.S. cities.', src: 'Equinix release, August 2026; Equinix blog, March 2026; 2025 Sustainability Report; Equinix careers', size: 0.9, off: 6 },
  { img: 'p10-energy-manager', role: 'Energy engineer', where: 'Clean power and a fair grid', head: 'Clean power for us, no extra cost for the neighbours', fig: '96%', figl: 'renewable coverage in 2025, the eighth year above 90%', story: '29 power purchase agreements across 12 countries add 1,472 MW of new wind and solar to the grids we share. More than 100 MW of fuel cells run at 19 U.S. sites. And in Hampton, Georgia, Equinix pays 100% of the grid costs its demand creates for 20 years, so residents’ bills do not rise.', src: 'Form 10-K for 2025; Equinix press releases, August 2025 and August 2026', size: 1.0, off: 0 },
  { img: 'p08-volunteer', role: 'WeGive volunteer', where: 'Impact Month, every metro', head: 'Time given where we live', fig: '54,400+', figl: 'volunteer hours in 2025, up 45% on the year', story: '28 WeAreEquinix teams chose and backed 31 local nonprofits with $280,000 in funding, and Impact Month reached more than 40 locations, from an emergency food drive in Secaucus to classroom sessions in Mumbai. When colleagues themselves are hit by disaster, the Employee Relief Fund made 19 grants in 2025.', src: '2025 Sustainability Report', size: 0.95, off: 3 },
];

const stage = document.getElementById('stage'), row = document.getElementById('row'), card = document.getElementById('card'), roles = document.getElementById('roles'), hint = document.getElementById('hint');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => matchMedia('(max-width: 760px)').matches;
const BASE_W = 24; // percent of the row for a size-1 portrait

const people = CAST.map((c, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'person'; b.setAttribute('aria-label', `${c.role}. ${c.head}.`);
  b.style.width = `${BASE_W * c.size}%`; b.style.setProperty('--off', `${c.off}%`); b.style.zIndex = String(10 + Math.round(c.size * 10));
  const im = document.createElement('img'); im.src = `../media/people/${c.img}.webp`; im.alt = ''; im.decoding = 'async'; im.width = 605; im.height = 900;
  b.appendChild(im); row.appendChild(b);
  b.addEventListener('mouseenter', () => { idle = false; if (pinned === null) setActive(i); });
  b.addEventListener('focus', () => { idle = false; setActive(i); });
  b.addEventListener('click', () => { idle = false; if (pinned === i) { pinned = null; setOpen(false); } else { pinned = i; setActive(i, true); setOpen(true); } });
  const r = document.createElement('button'); r.type = 'button'; r.innerHTML = `<b>${c.role}</b><span>${c.where}</span>`; r.setAttribute('aria-pressed', 'false');
  r.addEventListener('click', () => { idle = false; pinned = i; setActive(i, true); setOpen(true); if (narrow()) b.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }); });
  roles.appendChild(r);
  // narration, if a spoken line exists for this person
  const a = new Audio(); a.preload = 'none'; a.src = `../media/voice/people-${c.img}.mp3`;
  const p = { c, el: b, role: r, audio: a, x: 0, s: 1, voice: false };
  fetch(a.src, { method: 'HEAD' }).then((res) => { p.voice = res.ok; }).catch(() => {});
  return p;
});

let active = null, pinned = null, open = false, idle = true, idleTimer = 0, cardTimer = null, speaking = null;
function stopVoice() { if (speaking) { speaking.pause(); speaking.currentTime = 0; speaking = null; } card.classList.remove('speaking'); }
function speak(i) {
  stopVoice(); const a = people[i].audio; speaking = a; card.classList.add('speaking');
  a.onended = () => { if (speaking === a) { speaking = null; card.classList.remove('speaking'); } };
  a.play().catch(() => { speaking = null; card.classList.remove('speaking'); card.classList.add('no-voice'); });
}
function renderCard(i) {
  const c = CAST[i];
  card.innerHTML = `<div class="where">${c.role} \u00b7 ${c.where}</div><div class="head">${c.head}</div><div class="fig">${c.fig}<small>${c.figl}</small></div><div class="more"><p class="line">${c.story}</p><p class="src">${c.src}</p></div><div class="actions"><button type="button" class="read" data-read>${open ? 'Close' : 'Read their story'}</button><button type="button" class="play" data-play aria-label="Listen"><i></i>Listen</button></div>`;
  card.querySelector('[data-read]').addEventListener('click', (e) => { e.stopPropagation(); pinned = i; setOpen(!open); });
  card.querySelector('[data-play]').addEventListener('click', (e) => { e.stopPropagation(); pinned = i; setOpen(true); speaking ? stopVoice() : speak(i); });
}
function placeCard(i) {
  if (narrow()) { card.style.left = ''; card.style.right = ''; card.style.top = ''; return; }
  const r = stage.getBoundingClientRect(), b = people[i].el.getBoundingClientRect();
  const cx = (b.left + b.width / 2 - r.left) / r.width; const onLeft = cx > 0.5;
  const edge = onLeft ? (b.left - r.left) / r.width : (b.right - r.left) / r.width;
  card.classList.toggle('on-left', onLeft);
  if (onLeft) { card.style.left = `max(2%, ${(edge * 100 - 2).toFixed(1)}% - var(--cardw))`; card.style.right = 'auto'; }
  else { card.style.left = `min(${(edge * 100 + 1).toFixed(1)}%, calc(98% - var(--cardw)))`; card.style.right = 'auto'; }
  card.style.top = `${Math.max(4, (b.top - r.top) / r.height * 100 + 6).toFixed(1)}%`;
}
function setActive(i, force) {
  if (i === active && !force) return;
  if (i !== active) { stopVoice(); if (!force) { open = false; } }
  active = i;
  people.forEach((p, j) => { p.el.classList.toggle('on', j === i); p.role.setAttribute('aria-pressed', String(j === i)); });
  if (i === null) { card.classList.remove('show', 'open'); return; }
  card.classList.add('swap'); clearTimeout(cardTimer);
  cardTimer = setTimeout(() => { renderCard(i); placeCard(i); card.classList.remove('swap'); card.classList.toggle('open', open); card.classList.toggle('no-voice', !people[i].voice); }, reduce ? 0 : 180);
  card.classList.add('show');
  hint.textContent = 'Click a person for the whole story, or listen to it.';
}
function setOpen(v) { open = v; card.classList.toggle('open', open); const b = card.querySelector('[data-read]'); if (b) b.textContent = open ? 'Close' : 'Read their story'; if (!open) stopVoice(); if (active !== null) placeCard(active); }
row.addEventListener('mouseleave', () => { if (pinned === null && !row.contains(document.activeElement)) { setActive(null); idleTimer = 0; idle = true; } });
stage.addEventListener('click', (e) => { if (e.target === stage || e.target === row) { pinned = null; setOpen(false); setActive(null); idle = true; } });

// Phones: the person nearest the centre of the row is in front
function nearestCentre() { const r = row.getBoundingClientRect(); const cx = r.left + r.width / 2; let best = 0, bd = 1e9; people.forEach((p, i) => { const b = p.el.getBoundingClientRect(); const d = Math.abs(b.left + b.width / 2 - cx); if (d < bd) { bd = d; best = i; } }); return best; }
row.addEventListener('scroll', () => { if (narrow()) { idle = false; setActive(nearestCentre()); } }, { passive: true });
addEventListener('resize', () => { if (active !== null) placeCard(active); });

// Motion: the chosen person steps forward, the neighbours make room, the row drifts toward the centre.
let last = performance.now(), drift = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; const k = reduce ? 1 : 1 - Math.exp(-dt * 7);
  if (idle && !narrow()) { idleTimer += dt; if (idleTimer > 5) { idleTimer = 0; const next = active === null ? 0 : (active + 1) % people.length; setActive(next); } }
  const tDrift = active === null || narrow() ? 0 : (() => { const r = row.getBoundingClientRect(), b = people[active].el.getBoundingClientRect(); return ((r.left + r.width / 2) - (b.left + b.width / 2)) / r.width * 100 * 0.25; })();
  drift += (tDrift - drift) * k; row.style.transform = narrow() ? '' : `translateX(${drift.toFixed(2)}%)`;
  people.forEach((p, i) => {
    const on = i === active; const tS = on ? 1.26 : 1; let tX = 0;
    if (active !== null && !on && !narrow()) tX = (i < active ? -1 : 1) * Math.max(0, (open ? 7 : 4) - Math.abs(i - active) * 1.2);
    p.s += (tS - p.s) * k; p.x += (tX - p.x) * k;
    p.el.style.transform = `translate(${p.x.toFixed(2)}%, calc(var(--off) + ${on ? -3 : 0}%)) scale(${p.s.toFixed(3)})`;
    p.el.style.zIndex = on ? '40' : String(10 + Math.round(p.c.size * 10));
  });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (narrow()) { requestAnimationFrame(() => { people[0].el.scrollIntoView({ inline: 'center', block: 'nearest' }); setActive(0); }); }
