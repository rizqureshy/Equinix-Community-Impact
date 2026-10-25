// Prototype: the People section as a focus pull. Ten waist-up portraits in three
// depth rows; whoever is nearest the pointer comes forward, sharp, with their story.
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/fraunces';

// Cast: role, where, one sourced figure, one line, source. Positions are percentages
// of the stage; depth 0 is the front row. Generated portraits stand in for a shoot.
const CAST = [
  { img: 'p01-account-lead', role: 'Customer account lead', where: 'Customer and CRO teams', fig: '2', figl: 'customers whose stories we carry: 3verest and Children’s Cancer Institute', line: 'Works alongside the customers in these stories and carries them into every conversation.', src: 'Site stories', x: 37, y: 24, d: 0 },
  { img: 'p02-night-electrician', role: 'Night shift, electrical', where: 'Operations', fig: '99.9999%', figl: 'of 2025 the building stayed up', line: 'About thirty seconds of downtime in a year, across the global footprint.', src: 'Form 10-K for 2025', x: 16, y: 13, d: 1 },
  { img: 'p03-technician', role: 'Data center technician', where: 'Operations, Chicago', fig: '1 tour', figl: 'started it', line: 'A Pathways to Tech tour sparked it, an internship followed within months, and now a full-time technician. Kayla’s path.', src: 'Equinix blog, March 2026', x: 62, y: 26, d: 0 },
  { img: 'p04-tour-guide', role: 'Pathways to Tech guide', where: 'Community', fig: '1,800+', figl: 'students on tours in 2025', line: 'More than 60 tours and sessions across 32 locations.', src: 'Equinix release, August 2026', x: 49, y: 10, d: 1 },
  { img: 'p05-heat-engineer', role: 'Heat export engineer', where: 'Helsinki and Espoo', fig: '19 GWh', figl: 'of heat given back in 2025', line: 'Recovered heat into district networks, up from 14.5 GWh the year before.', src: '2025 Annual Report', x: 77, y: 14, d: 1 },
  { img: 'p06-cooling-engineer', role: 'Cooling plant engineer', where: 'Operations', fig: '1.37', figl: 'power usage effectiveness in 2025', line: 'The sixth yearly improvement in a row, running halls closer to 27°C.', src: '2025 Annual Report', x: 3, y: 4, d: 2 },
  { img: 'p07-network-engineer', role: 'Network engineer', where: 'Interconnection', fig: '500,000+', figl: 'interconnections', line: 'And a record 9,700 added in a single quarter of 2026.', src: 'Q4 2025 and Q2 2026 results', x: 29, y: 1, d: 2 },
  { img: 'p08-volunteer', role: 'WeGive volunteer', where: 'Impact Month', fig: '54,400+', figl: 'volunteer hours in 2025, up 45%', line: '28 WeAreEquinix teams backed 31 local nonprofits.', src: '2025 Sustainability Report', x: 10, y: 28, d: 0 },
  { img: 'p09-security-officer', role: 'Security officer', where: 'Operations', fig: '24/7', figl: 'officers on site', line: 'Mantrap entry and biometric readers at the door of every hall.', src: 'IBX technical specification', x: 61, y: 0, d: 2 },
  { img: 'p10-energy-manager', role: 'Energy manager', where: 'Sustainability', fig: '96%', figl: 'renewable coverage, eighth year above 90%', line: '29 power purchase agreements across 12 countries.', src: 'Form 10-K for 2025', x: 84, y: 3, d: 2 },
];
const WIDTH = [27, 24, 22]; // percent of the stage per depth row

const stage = document.getElementById('stage'), row = document.getElementById('row'), story = document.getElementById('story'), inner = document.getElementById('storyInner'), roles = document.getElementById('roles'), hint = document.getElementById('hint');
const narrow = () => matchMedia('(max-width: 760px)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const people = CAST.map((c, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'person'; b.setAttribute('aria-label', `${c.role}. ${c.line}`);
  b.style.left = c.x + '%'; b.style.top = c.y + '%'; b.style.width = WIDTH[c.d] + '%'; b.style.zIndex = String(10 - c.d * 3);
  const im = document.createElement('img'); im.src = `../media/people/${c.img}.webp`; im.alt = ''; im.decoding = 'async'; im.width = 900; im.height = 1350;
  const n = document.createElement('span'); n.className = 'name'; n.textContent = c.role;
  b.append(im, n); row.appendChild(b);
  b.addEventListener('click', () => { pinned = pinned === i ? null : i; setActive(i, true); });
  b.addEventListener('focus', () => setActive(i, false));
  const r = document.createElement('button'); r.type = 'button'; r.innerHTML = `<b>${c.role}</b><span>${c.where}</span>`; r.setAttribute('aria-pressed', 'false');
  r.addEventListener('click', () => { pinned = i; setActive(i, true); if (narrow()) b.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }); });
  roles.appendChild(r);
  return { c, el: b, img: im, role: r, lift: 0, blur: 0, scale: 1, shiftX: 0, shiftY: 0 };
});

let active = null, pinned = null, pointer = null, storyTimer = null;
function renderStory(i) {
  const c = CAST[i];
  story.classList.add('swap');
  clearTimeout(storyTimer);
  storyTimer = setTimeout(() => {
    inner.innerHTML = `<div class="where">${c.where}</div><div class="role">${c.role}</div><div class="fig">${c.fig}<small>${c.figl}</small></div><div class="line">${c.line}</div><div class="src">${c.src}</div>${pinned === i ? '<div class="pin">Pinned. Click again to release</div>' : ''}`;
    story.classList.remove('swap');
  }, reduce ? 0 : 220);
  // The card sits on the side the person is not on
  if (!narrow()) { const onLeft = c.x + WIDTH[c.d] / 2 < 50; story.style.left = onLeft ? 'auto' : '3%'; story.style.right = onLeft ? '3%' : 'auto'; }
  story.classList.add('show');
}
function setActive(i, fromClick) {
  if (i === active && !fromClick) return;
  active = i;
  people.forEach((p, j) => { p.el.classList.toggle('on', j === i); p.role.setAttribute('aria-pressed', String(j === i)); });
  if (i === null) { story.classList.remove('show'); return; }
  renderStory(i);
  hint.textContent = 'Click to keep someone in front; move again to let go.';
}

// Desktop: the nearest face to the pointer is in focus; parallax by depth.
stage.addEventListener('pointermove', (e) => { if (narrow() || e.pointerType === 'touch') return; const r = stage.getBoundingClientRect(); pointer = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; });
stage.addEventListener('pointerleave', () => { pointer = null; });

function nearest() {
  if (!pointer) return null;
  let best = null, bd = 1e9; const r = stage.getBoundingClientRect();
  people.forEach((p, i) => { const b = p.el.getBoundingClientRect(); const fx = (b.left + b.width / 2 - r.left) / r.width, fy = (b.top + b.height * 0.28 - r.top) / r.height; const d = Math.hypot((fx - pointer.x) * 1.0, (fy - pointer.y) * 1.6) - (2 - p.c.d) * 0.02; if (d < bd) { bd = d; best = i; } });
  return best;
}

// Mobile: the portrait nearest the centre of the row is in focus.
function nearestCentre() {
  const r = row.getBoundingClientRect(); const cx = r.left + r.width / 2; let best = null, bd = 1e9;
  people.forEach((p, i) => { const b = p.el.getBoundingClientRect(); const d = Math.abs(b.left + b.width / 2 - cx); if (d < bd) { bd = d; best = i; } });
  return best;
}
row.addEventListener('scroll', () => { if (narrow()) setActive(nearestCentre(), false); }, { passive: true });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; const k = reduce ? 1 : 1 - Math.exp(-dt * 9);
  if (!narrow()) {
    const want = pinned !== null ? pinned : nearest();
    if (want !== active && (pointer || pinned !== null)) setActive(want, false);
    if (!pointer && pinned === null && active !== null && document.activeElement?.className !== 'person') setActive(null, false);
  }
  const px = pointer ? pointer.x - 0.5 : 0, py = pointer ? pointer.y - 0.5 : 0;
  people.forEach((p, i) => {
    const on = i === active; const d = p.c.d;
    const tScale = on ? 1.07 : active === null ? 1 : 0.965; const tBlur = on || active === null ? 0 : 1.2 + d * 1.1; const tLift = on ? -3 : 0;
    const par = narrow() ? 0 : (0.6 - d * 0.2) * 2.2; const tX = -px * par, tY = -py * par * 0.6;
    p.scale += (tScale - p.scale) * k; p.blur += (tBlur - p.blur) * k; p.lift += (tLift - p.lift) * k; p.shiftX += (tX - p.shiftX) * k; p.shiftY += (tY - p.shiftY) * k;
    p.el.style.transform = `translate(${p.shiftX.toFixed(2)}%, ${(p.lift + p.shiftY).toFixed(2)}%) scale(${p.scale.toFixed(3)})`;
    p.el.style.filter = p.blur > 0.05 ? `blur(${p.blur.toFixed(2)}px) brightness(${(1 - p.blur * 0.06).toFixed(3)})` : '';
    p.el.style.zIndex = on ? '30' : String(10 - d * 3);
  });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if (narrow()) { people[0].el.scrollIntoView({ inline: 'center', block: 'nearest' }); setActive(0, false); }
