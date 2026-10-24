// Prototype: the Spine of Impact ride. Placeholder scene, sourced milestones,
// illustrative AI images on the cards (see media-src/asset-manifest.json).
import * as T from 'three';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/fraunces';

const root = document.documentElement;
const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
const col = (n) => new T.Color(css(n));
const dark = () => (matchMedia('(prefers-color-scheme: dark)').matches ? root.dataset.theme !== 'light' : root.dataset.theme === 'dark');

// Impact milestones only. Every entry is dated, scoped and sourced in the research doc.
const Y0 = 2010, Y1 = 2027;
const WINGS = { planet: ['Energy and heat', '--planet'], connect: ['Connection', '--connect'], community: ['Community', '--community'], alwayson: ['Always on', '--alwayson'] };
const M = [
  { y: 2010.4, w: 'planet', img: 'helsinki-2010', t: 'The first data center to heat homes', f: 'since 2010', fl: 'Helsinki Kanavaranta, with Helen', s: 'Named by Equinix as the world’s first data centre heating project; homes have been warmed from it since 2010.', u: 'https://newsroom.equinix.com/2023-07-13-Repurposing-Heat-for-Community-Use-Heat-Export-Project-Powered-by-Equinix-Sets-Stage-for-Further-Cooperation' },
  { y: 2011.2, w: 'alwayson', img: 'tohoku-2011', t: 'Tokyo stays up through the Tohoku earthquake', f: 'free ports', fl: 'so carriers could rebuild capacity', s: 'TY1 and TY2 undamaged; Equinix Japan offered free exchange VLANs and ports after subsea cables were cut. March 2011.', u: 'https://equinix.mediaroom.com/2011-03-15-Equinix-To-Offer-Free-Internet-Exchange-Service-In-Japan-For-Networks-Restoration' },
  { y: 2012.8, w: 'alwayson', img: 'sandy-2012', t: 'Hurricane Sandy: New York and New Jersey hold', f: '48 h', fl: 'of generator fuel at every site', s: 'All NY and NJ sites ran on generators; staff slept on site. One NY9 generator failed and was restored in 1 h 15 min. Trade press account, October 2012.', u: 'https://www.datacenterknowledge.com/business/generators-keep-nj-data-centers-humming' },
  { y: 2015.4, w: 'planet', img: 'clean-energy-2015', t: 'First data center company to aim for 100% clean energy', f: '100%', fl: 'goal for the whole portfolio', s: 'Set in 2015, with a 1 MW biogas fuel cell at SV5 and a 105 MW solar agreement covering California.', u: 'https://newsroom.equinix.com/2015-10-26-Equinix-Recognized-by-EPA-for-Leading-Green-Power-Use' },
  { y: 2015.8, w: 'community', img: 'community-2015', t: 'The Community Impact programme begins', f: '2015', fl: 'employee giving and volunteering, organised', s: 'Equinix dates its Community Impact programme to 2015, the base the Foundation later built on.', u: 'https://newsroom.equinix.com/2022-09-28-Equinix-Commits-50-Million-to-Global-Foundation-to-Advance-Digital-Inclusion' },
  { y: 2017.6, w: 'alwayson', img: 'harvey-2017', t: 'Hurricane Harvey: Houston never loses service', f: '0', fl: 'minutes of lost power at HO1', s: 'Streets flooded so customers could not reach the site; the site itself never lost utility power or service. August 2017, trade press.', u: 'https://www.datacenterknowledge.com/uptime/four-providers-houston-data-centers-online-but-access-roads-flooded' },
  { y: 2019.1, w: 'connect', img: 'curie-2019', t: 'Curie: the first new cable to Chile in twenty years', f: '20 yrs', fl: 'since the last cable to Chile', s: 'Google chose LA4 as the landing station. One cable; Equinix was then in 25+ cable projects.', u: 'https://investor.equinix.com/news-events/press-releases/detail/183/google-selects-equinix-for-curie-subsea-cable-landing' },
  { y: 2021.1, w: 'alwayson', img: 'texas-2021', t: 'Texas winter storm: all nine sites stay on', f: '9 of 9', fl: 'Texas data centers operational', s: 'On utility power where available, generators elsewhere, during the February 2021 grid emergency.', u: 'https://www.datacenterfrontier.com/energy/article/11428394/texas-data-centers-rely-on-generators-amid-power-emergency' },
  { y: 2021.45, w: 'planet', img: 'climate-2021', t: 'First in the industry to pledge climate neutral by 2030', f: '2030', fl: 'science-based, 50% cut from 2019', s: 'Global operations and supply chain; founding signatory of the EU Climate Neutral Data Centre Pact the same year.', u: 'https://newsroom.equinix.com/2021-06-16-Equinix-Sets-2030-Global-Climate-Neutral-Target' },
  { y: 2022.3, w: 'connect', img: 'genoa-2022', t: '2Africa makes its first landing, in Genoa', f: '1st', fl: 'landing of the 2Africa cable', s: 'The GN1 data center received the first landing of the cable that rings Africa. April 2022.', u: 'https://www.structureresearch.net/2022/04/22/2africa-lands-in-equinix-data-centre-in-genoa-italy/' },
  { y: 2022.7, w: 'community', img: 'foundation-2022', t: 'The Equinix Foundation is born', f: '$50M', fl: 'to advance digital inclusion', s: 'Launched September 2022. Its grants, not Equinix, do the training and connecting.', u: 'https://newsroom.equinix.com/2022-09-28-Equinix-Commits-50-Million-to-Global-Foundation-to-Advance-Digital-Inclusion' },
  { y: 2023.4, w: 'planet', img: 'espoo-2023', t: 'Espoo: recovered heat for a town’s homes', f: '2,000', fl: 'homes a year, up to', s: 'Two Espoo data centers feed Fortum’s district heating, 4 MW rising to 6 MW. May 2023.', u: 'https://newsroom.equinix.com/2023-05-12-Fortum-and-Equinix-team-up-Recycled-heat-from-Equinix-data-centers-to-be-utilized-in-Fortums-district-heating-network' },
  { y: 2023.7, w: 'planet', img: 'frankfurt-2023', t: 'Frankfurt: heat for a neighbourhood, free of charge', f: '1,000', fl: 'Griesheim households, from 2025', s: 'FR4, FR6 and FR8 with Vonovia and partners. Announced July 2023; go-live still to be verified.', u: 'https://newsroom.equinix.com/2023-07-13-Repurposing-Heat-for-Community-Use-Heat-Export-Project-Powered-by-Equinix-Sets-Stage-for-Further-Cooperation' },
  { y: 2024.1, w: 'connect', img: 'nigeria-2024', t: 'Nigeria’s first international cable outside Lagos', f: '250 km', fl: 'of new fibre to Port Harcourt', s: '2Africa lands at Qua Iboe Beach, facilitated by MainOne, an Equinix company. February 2024.', u: 'https://techcabal.com/2026/02/09/equinix-opens-first-south-south-data-centre/' },
  { y: 2024.45, w: 'planet', img: 'heat-call-2024', t: 'Help us heat our neighbours', f: '6', fl: 'countries with heat export projects', s: 'An open call to utilities and towns to take recovered heat: France, Finland, Germany, Ireland, Switzerland, Canada. June 2024.', u: 'https://newsroom.equinix.com/2024-06-05-Help-Us-Heat-Our-Neighbors-Equinix-Makes-Data-Center-Heat-Available-to-Warm-Nearby-Buildings-and-Swimming-Pools' },
  { y: 2024.8, w: 'planet', img: 'helsinki-2024', t: 'Helsinki: a second data center warms the city', f: '1,500', fl: 'one-bedroom flats, about', s: 'HE5 excess heat through heat pumps into Helen’s network. October 2024.', u: 'https://newsroom.equinix.com/2024-10-17-More-Helsinki-homes-to-be-heated-using-excess-heat-from-Equinix-data-center' },
  { y: 2025.2, w: 'community', img: 'giga-2025', t: 'Mapping every school’s connection with Giga', f: '3 yrs', fl: 'with UNICEF and ITU', s: 'The Foundation supports school connectivity mapping and a latency pilot on Equinix infrastructure. March 2025.', u: 'https://giga.global/giga-and-equinix-foundation-join-forces-to-help-bridge-the-digital-divide-connect-every-school-in-the-world-to-the-internet-by-2030/' },
  { y: 2025.5, w: 'community', img: 'procurement-2025', t: 'Spending with the businesses next door', f: '$95M+', fl: 'with small, veteran-owned and HUBZone firms', s: 'Inclusive procurement in calendar 2025, as reported in the 2025 Sustainability Report.', u: 'https://d1io3yog0oux5.cloudfront.net/_6111a4f0545388396ff7e7a9f1006ce4/equinix/db/2251/27036/file/Equinix-Inc_2025_Sustainability-Report.pdf' },
  { y: 2025.7, w: 'connect', img: 'smap-2025', t: 'SMAP lands in Perth and Sydney', f: '400 Tbps', fl: 'cable landing directly in the buildings', s: '5,000 km, 16 fibre pairs. One cable system. September 2025.', u: 'https://newsroom.equinix.com/2025-09-22-Equinix-Selected-for-SMAP-Cable-Landing-in-Perth-and-Sydney' },
  { y: 2025.85, w: 'community', img: 'volunteering-2025', t: 'Colleagues give their time where they live', f: '54,400+', fl: 'volunteer hours in 2025, up 45%', s: 'All employees, calendar 2025, 2025 Sustainability Report.', u: 'https://d1io3yog0oux5.cloudfront.net/_6111a4f0545388396ff7e7a9f1006ce4/equinix/db/2251/27036/file/Equinix-Inc_2025_Sustainability-Report.pdf' },
  { y: 2025.97, w: 'planet', img: 'heat-2025', t: 'A year of heat given back', f: '19 GWh', fl: 'exported to communities in 2025', s: 'Global, calendar 2025; up from 14.5 GWh in 2024. Coverage 96% renewable, PUE 1.37.', u: 'https://investor.equinix.com/sec-filings/all-sec-filings/content/0001101239-26-000075/EQIXAnnualRpt2025PRINT.pdf' },
  { y: 2026.2, w: 'community', img: 'learning-labs-2026', t: 'Learning Labs for the next technicians', f: '3', fl: 'labs: Dallas, Paris, Singapore', s: 'Apprenticeships and early-career programmes relaunched globally. March 2026, trade press.', u: 'https://datacentrereview.com/2026/03/equinix-expands-global-skills-push-as-ai-drives-data-centre-hiring-pressure/' },
  { y: 2026.45, w: 'planet', img: 'dublin-2026', t: 'Dublin: the first hydrogen power trial', f: '< 1.3', fl: 'site PUE during the trial', s: 'Two green-hydrogen units supporting cooling at DB3 for 12 weeks. June 2026.', u: 'https://newsroom.equinix.com/2026-06-19-Equinix-Trials-Landmark-Hydrogen-Power-Solution-at-Dublin-Data-Centre' },
  { y: 2026.62, w: 'community', img: 'georgia-2026', t: 'Georgia: neighbours’ bills will not rise', f: '100%', fl: 'of grid costs paid, for 20 years', s: 'Hampton: Equinix funds a substation and two lines and pays all costs for its demand. August 2026.', u: 'https://investor.equinix.com/news-events/press-releases/detail/1118/equinix-partners-with-central-georgia-electric-membership' },
  { y: 2026.8, w: 'community', img: 'skills-2026', t: 'Skills that travel further than the buildings', f: '1.6M', fl: 'people trained in digital skills in 2025', s: 'By Foundation grantees, calendar 2025, reported August 2026 with a further $50M commitment.', u: 'https://investor.equinix.com/news-events/press-releases/detail/1120/equinix-commits-additional-50-million-to-the-equinix' },
  { y: 2027, w: 'community', img: 'promises-2027', t: 'The five promises', f: '5', fl: 'commitments to the places we call home', s: 'Where the spine ends: the promises, each hung beside the exhibit that proves it.', u: 'https://equinixtogether.com/community-principles/', end: true },
];
const tOf = (y) => (y - Y0) / (Y1 - Y0);

// Scene.
const stage = document.getElementById('stage');
const canvas = document.getElementById('c');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(50, 1, 0.1, 600);
scene.add(new T.HemisphereLight(0xffffff, 0x8a8a8a, 2.6));
const sun = new T.DirectionalLight(0xffffff, 1.8); sun.position.set(5, 10, 4); scene.add(sun);

// The ribbon: a long sweeping curve.
const pts = []; const N = 14;
for (let i = 0; i <= N; i++) { const u = i / N; pts.push(new T.Vector3(Math.sin(u * Math.PI * 1.7) * 26, Math.sin(u * Math.PI * 3.1) * 5 + u * 6, -u * 220)); }
const curve = new T.CatmullRomCurve3(pts, false, 'catmullrom', 0.6);
const RED = new T.Color('#e91c24');
const ribbonMat = new T.MeshStandardMaterial({ color: RED, roughness: 0.45, metalness: 0.05, emissive: RED, emissiveIntensity: 0 });
scene.add(new T.Mesh(new T.TubeGeometry(curve, 600, 0.2, 12, false), ribbonMat));
const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); })();
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(16, 16, 14, 0, Math.PI * 2); g.fill(); return new T.CanvasTexture(c); })();

// Dust: drifting points around the path, kept small so the scene stays crisp.
const DUST = 3600; const dustPos = new Float32Array(DUST * 3);
for (let i = 0; i < DUST; i++) { const p = curve.getPointAt(Math.random()); const r = 6 + Math.random() * 40; const a = Math.random() * Math.PI * 2; dustPos[i * 3] = p.x + Math.cos(a) * r; dustPos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 30; dustPos[i * 3 + 2] = p.z + Math.sin(a) * r; }
const dustGeo = new T.BufferGeometry(); dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
const dustMat = new T.PointsMaterial({ size: 0.2, map: dotTex, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
const dust = new T.Points(dustGeo, dustMat); scene.add(dust);


// Cards: an image with a small caption, composed on a canvas.
const CW = 960, CH = 640, RADIUS = 36;
const images = new Map();
function loadImage(key) {
  if (images.has(key)) return images.get(key);
  const im = new Image(); im.decoding = 'async'; const rec = { im, ok: false };
  im.onload = () => { rec.ok = true; nodes.filter((n) => n.m.img === key).forEach(drawCard); };
  im.onerror = () => { rec.ok = false; };
  im.src = `../media/spine/${key}.webp`; images.set(key, rec); return rec;
}
function wrap(g, text, maxW) { const out = []; let cur = ''; for (const word of text.split(' ')) { const t = cur ? cur + ' ' + word : word; if (g.measureText(t).width > maxW && cur) { out.push(cur); cur = word; } else cur = t; } if (cur) out.push(cur); return out; }
function drawCard(n) {
  const c = n.canvas, g = c.getContext('2d'); const rec = images.get(n.m.img); const tint = col(WINGS[n.m.w][1]);
  g.clearRect(0, 0, CW, CH); g.save(); g.beginPath(); g.roundRect(0, 0, CW, CH, RADIUS); g.clip();
  if (rec && rec.ok) {
    const iw = rec.im.naturalWidth, ih = rec.im.naturalHeight, s = Math.max(CW / iw, CH / ih); g.drawImage(rec.im, (CW - iw * s) / 2, (CH - ih * s) / 2, iw * s, ih * s);
  } else {
    const grad = g.createLinearGradient(0, 0, CW, CH); grad.addColorStop(0, `#${tint.clone().lerp(new T.Color(dark() ? '#000000' : '#ffffff'), 0.55).getHexString()}`); grad.addColorStop(1, `#${tint.clone().lerp(new T.Color(dark() ? '#000000' : '#ffffff'), 0.2).getHexString()}`); g.fillStyle = grad; g.fillRect(0, 0, CW, CH);
  }
  const band = g.createLinearGradient(0, CH * 0.5, 0, CH); band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(1, 'rgba(0,0,0,0.72)'); g.fillStyle = band; g.fillRect(0, 0, CW, CH);
  g.fillStyle = `#${tint.getHexString()}`; g.fillRect(0, CH - 10, CW, 10);
  g.textBaseline = 'alphabetic'; g.font = `500 44px 'Inter Tight Variable', Arial, sans-serif`;
  const lines = wrap(g, n.m.t, CW - 88).slice(0, 2); const top = CH - 54 - (lines.length - 1) * 52;
  g.fillStyle = '#ffffff'; lines.forEach((l, i) => g.fillText(l, 44, top + i * 52));
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = `600 24px 'Inter Tight Variable', Arial, sans-serif`;
  g.fillText(`${Math.floor(n.m.y)}  ·  ${WINGS[n.m.w][0].toUpperCase()}`, 44, top - 58);
  g.restore(); n.tex.needsUpdate = true;
}

// Milestone nodes.
const CARD_W = 4.8, CARD_H = 3.2;
const nodes = M.map((m, i) => {
  const t = tOf(m.y); const p = curve.getPointAt(Math.min(0.9999, t)); const tan = curve.getTangentAt(Math.min(0.9999, t));
  const side = new T.Vector3().crossVectors(tan, new T.Vector3(0, 1, 0)).normalize().multiplyScalar(i % 2 ? 3.8 : -3.8);
  const lift = i % 4 < 2 ? 1.7 : 3.1;
  const g = new T.Group(); g.position.copy(p);
  const core = new T.Mesh(new T.SphereGeometry(m.end ? 0.7 : 0.3, 24, 24), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.3 }));
  const halo = new T.Sprite(new T.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.18 })); halo.scale.set(m.end ? 3 : 1.5, m.end ? 3 : 1.5, 1);
  const foot = side.clone().add(new T.Vector3(0, lift - CARD_H / 2 - 0.22, 0));
  const leader = new T.QuadraticBezierCurve3(new T.Vector3(0, 0, 0), new T.Vector3(side.x * 0.12, foot.y * 0.72, side.z * 0.12), foot);
  const stem = new T.Group();
  const stemMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, fog: false });
  stem.add(new T.Mesh(new T.TubeGeometry(leader, 24, 0.018, 6, false), stemMat));
  const dot = new T.Mesh(new T.SphereGeometry(0.07, 12, 12), stemMat); dot.position.copy(foot); stem.add(dot);
  stem.material = stemMat;
  const canvasEl = document.createElement('canvas'); canvasEl.width = CW; canvasEl.height = CH;
  const tex = new T.CanvasTexture(canvasEl); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const card = new T.Mesh(new T.PlaneGeometry(CARD_W, CARD_H), new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide, fog: false }));
  card.position.copy(side).add(new T.Vector3(0, lift, 0)); card.userData.node = i;
  g.add(core, halo, stem, card); scene.add(g);
  const n = { m, t, g, core, halo, stem, card, canvas: canvasEl, tex, p };
  loadImage(m.img); drawCard(n); return n;
});
const cardMeshes = nodes.map((n) => n.card);

// Year beacons along the ribbon.
const beacons = []; for (let y = Y0; y <= 2026; y++) { const p = curve.getPointAt(tOf(y)); const s = new T.Sprite(new T.SpriteMaterial({ map: dotTex, transparent: true, opacity: 0.5, depthWrite: false })); s.scale.set(0.22, 0.22, 1); s.position.copy(p).add(new T.Vector3(0, -0.55, 0)); scene.add(s); beacons.push({ s, y }); }

// Theme application.
function applyTheme() {
  const bg = col('--bg'); scene.background = bg; scene.fog = new T.FogExp2(bg.getHex(), dark() ? 0.0045 : 0.006);
  ribbonMat.emissiveIntensity = dark() ? 0.35 : 0.05;
  dustMat.color = dark() ? new T.Color('#9fb0d8') : new T.Color('#8f8a7e'); dustMat.opacity = dark() ? 0.4 : 0.3;
  beacons.forEach((b) => { b.s.material.color = col('--muted'); });
  nodes.forEach((n) => { const c = col(WINGS[n.m.w][1]); n.core.material.color.copy(c); n.core.material.emissive.copy(c); n.halo.material.color.copy(c); n.stem.material.color.copy(c); drawCard(n); });
  document.getElementById('theme').textContent = dark() ? 'Day' : 'Night';
}
if (!root.dataset.theme) root.dataset.theme = 'dark'; // The universe opens at night; Day is one tap away.
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
document.getElementById('theme').addEventListener('click', () => { root.dataset.theme = dark() ? 'light' : 'dark'; applyTheme(); });

// Music for the tour.
const music = document.getElementById('music');
let musicTarget = 0, muted = false;
const muteBtn = document.getElementById('mute');
muteBtn.addEventListener('click', () => { muted = !muted; muteBtn.setAttribute('aria-pressed', String(muted)); muteBtn.textContent = muted ? 'Unmute' : 'Mute'; });
function musicOn() { musicTarget = 0.5; if (music.paused) { music.volume = 0; music.play().catch(() => {}); } }
function musicOff() { musicTarget = 0; }

// Travel state.
let t = 0, target = 0.004, touring = false, mapMode = false, focused = null, wasTouring = false;
const clamp = (v) => Math.max(0, Math.min(1, v));
const hint = document.getElementById('hint');
let moved = false;
const rideBtn = document.getElementById('ride'), mapBtn = document.getElementById('map');
function stopTour() { if (!touring) return; touring = false; rideBtn.setAttribute('aria-pressed', 'false'); rideBtn.textContent = 'Tour'; musicOff(); }
function startTour() { touring = true; if (target > 0.995) { target = 0; t = 0; } rideBtn.setAttribute('aria-pressed', 'true'); rideBtn.textContent = 'Pause'; mapMode = false; mapBtn.setAttribute('aria-pressed', 'false'); musicOn(); moved = true; }
rideBtn.addEventListener('click', () => { unfocus(false); touring ? stopTour() : startTour(); });
mapBtn.addEventListener('click', () => { unfocus(false); mapMode = !mapMode; mapBtn.setAttribute('aria-pressed', String(mapMode)); if (mapMode) stopTour(); });

// Focus on a card: the camera turns to it and the story comes forward.
const story = document.getElementById('story');
function focus(n) {
  if (focused === n) return; focused = n; wasTouring = touring; if (touring) { touring = false; rideBtn.textContent = 'Resume'; }
  target = n.t; document.body.classList.add('focused');
  story.style.setProperty('--c', `var(${WINGS[n.m.w][1]})`);
  const img = document.getElementById('sImg'); img.src = `../media/spine/${n.m.img}.webp`; img.alt = '';
  document.getElementById('sChip').textContent = `${Math.floor(n.m.y)} · ${WINGS[n.m.w][0]}`;
  document.getElementById('sTitle').textContent = n.m.t;
  document.getElementById('sFig').innerHTML = `${n.m.f}<small>${n.m.fl}</small>`;
  document.getElementById('sScope').textContent = n.m.s;
  document.getElementById('sSrc').href = n.m.u;
  story.classList.add('show'); nodes.forEach((x) => x.tick.classList.toggle('on', x === n));
}
function unfocus(resume) {
  if (!focused) return; focused = null; document.body.classList.remove('focused'); story.classList.remove('show');
  if (wasTouring && resume) { touring = true; rideBtn.textContent = 'Pause'; } else if (wasTouring) { stopTour(); rideBtn.setAttribute('aria-pressed', 'false'); }
  wasTouring = false;
}
document.getElementById('back').addEventListener('click', () => unfocus(true));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') unfocus(true); });

// Pointer: scroll and drag travel, click opens a card.
const ray = new T.Raycaster(), ndc = new T.Vector2(); let pointer = null;
function pick() { if (!pointer) return null; const r = stage.getBoundingClientRect(); ndc.set(((pointer.x - r.left) / r.width) * 2 - 1, -((pointer.y - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const hit = ray.intersectObjects(cardMeshes, false)[0]; return hit ? nodes[hit.object.userData.node] : null; }
stage.addEventListener('wheel', (e) => { e.preventDefault(); unfocus(false); target = clamp(target + e.deltaY * 0.00012); stopTour(); moved = true; }, { passive: false });
let drag = null;
stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, t: target, dist: 0 }; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY }; if (!drag) return; drag.dist = Math.max(drag.dist, Math.hypot(e.clientX - drag.x, e.clientY - drag.y)); if (drag.dist > 6) { unfocus(false); target = clamp(drag.t + (drag.y - e.clientY) * 0.0009); stopTour(); moved = true; } });
const endDrag = (e) => { if (drag && drag.dist <= 6 && e.type === 'pointerup') { pointer = { x: e.clientX, y: e.clientY }; const n = pick(); if (n) focus(n); else if (focused) unfocus(true); } drag = null; };
stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('pointerleave', () => { pointer = null; });
window.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') { unfocus(false); target = clamp(target + 0.02); stopTour(); moved = true; e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { unfocus(false); target = clamp(target - 0.02); stopTour(); e.preventDefault(); } if (e.key === 'Home') target = 0; if (e.key === 'End') target = 1; });

// Track with ticks.
const track = document.getElementById('track'), done = document.getElementById('done');
M.forEach((m, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tick'; b.style.setProperty('--c', `var(${WINGS[m.w][1]})`); b.style.left = (tOf(m.y) * 100) + '%'; b.title = m.t; b.setAttribute('aria-label', `${Math.floor(m.y)}: ${m.t}`); b.addEventListener('click', () => { stopTour(); mapMode = false; mapBtn.setAttribute('aria-pressed', 'false'); moved = true; focus(nodes[i]); }); track.appendChild(b); nodes[i].tick = b; });
for (let y = Y0; y <= 2026; y += 4) { const s = document.createElement('span'); s.className = 'yr'; s.style.left = (tOf(y) * 100) + '%'; s.textContent = y; track.appendChild(s); }

// Plaque (the short card shown while riding past).
const plaque = document.getElementById('plaque'); let activeNode = null;
function showPlaque(n) {
  if (activeNode === n) return; activeNode = n;
  if (!focused) nodes.forEach((x) => x.tick.classList.toggle('on', x === n));
  if (!n) { plaque.classList.remove('show'); return; }
  plaque.style.setProperty('--c', `var(${WINGS[n.m.w][1]})`);
  document.getElementById('pChip').textContent = `${Math.floor(n.m.y)} · ${WINGS[n.m.w][0]}`;
  document.getElementById('pTitle').textContent = n.m.t;
  document.getElementById('pFig').innerHTML = `${n.m.f}<small>${n.m.fl}</small>`;
  document.getElementById('pScope').textContent = n.m.s;
  document.getElementById('pSrc').href = n.m.u;
  plaque.classList.add('show');
}

// Resize.
function fit() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(fit).observe(stage); fit();

// Frame loop.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const yearEl = document.getElementById('year'), wingEl = document.getElementById('wing');
const camPos = new T.Vector3(), camLook = new T.Vector3(), tmp = new T.Vector3(), up = new T.Vector3(0, 1, 0), cardWorld = new T.Vector3();
const mapPos = curve.getPointAt(0.5).clone().add(new T.Vector3(-70, 90, 120)), mapLook = curve.getPointAt(0.5);
let last = performance.now(), clock = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
  if (touring) { target = clamp(target + dt * 0.016); if (target >= 1) stopTour(); }
  const ease = (k) => (reduce ? 1 : 1 - Math.exp(-dt * k));
  t += (target - t) * ease(3.6);
  const tt = Math.min(0.9999, Math.max(0, t));
  const p = curve.getPointAt(tt), ahead = curve.getPointAt(Math.min(0.9999, tt + 0.012)), tan = curve.getTangentAt(tt);
  const side = tmp.crossVectors(tan, up).normalize();
  if (mapMode) { camPos.lerp(mapPos, ease(3)); camLook.lerp(mapLook, ease(3)); }
  else if (focused) {
    // Frame the card: camera a little behind it on the ribbon, looking forward, the card held to one side
    // so the story (left) or the plaque (right) has room.
    const n = focused; n.card.getWorldPosition(cardWorld); const tn = curve.getTangentAt(Math.min(0.9999, n.t)); const sd = new T.Vector3().crossVectors(tn, up).normalize();
    const narrow = stage.clientWidth < 760; const shift = narrow ? 0 : -2.4;
    const want = cardWorld.clone().add(tn.clone().multiplyScalar(-10)).add(up.clone().multiplyScalar(0.3)).add(sd.clone().multiplyScalar(shift * 0.3));
    camPos.lerp(want, ease(4)); camLook.lerp(cardWorld.clone().add(sd.clone().multiplyScalar(shift)).add(up.clone().multiplyScalar(narrow ? 0.9 : 0.1)), ease(4.5));
  } else { const want = p.clone().add(up.clone().multiplyScalar(2.4)).add(side.clone().multiplyScalar(-1.6)).add(tan.clone().multiplyScalar(-6)); camPos.lerp(want, ease(24)); camLook.lerp(ahead.clone().add(up.clone().multiplyScalar(1.6)), ease(24)); }
  camera.position.copy(camPos); camera.lookAt(camLook);
  // Cards face the camera; the nearest milestone brightens; cards fade when too near or too far.
  let best = null, bd = 1;
  nodes.forEach((n) => {
    n.card.quaternion.copy(camera.quaternion); const d = Math.abs(n.t - tt); if (d < bd) { bd = d; best = n; }
    const k = Math.max(0, 1 - d / 0.02); n.halo.material.opacity = 0.12 + k * 0.2; n.core.scale.setScalar(1 + k * 0.35);
    const dist = n.g.position.distanceTo(camera.position); const vis = mapMode || focused === n ? 1 : Math.max(0, Math.min(1, (dist - 7) / 6)) * Math.max(0, Math.min(1, (90 - dist) / 30));
    // Cards already passed fade out at once, so nothing flies across the HUD; in focus, everything but the chosen card steps back.
    const passed = mapMode || focused ? 1 : Math.max(0, Math.min(1, (n.t - tt - 0.012) / 0.018));
    const near = (focused && focused !== n ? Math.max(0, Math.min(1, (dist - 16) / 10)) : 1) * passed;
    n.card.material.opacity = vis * near; n.card.scale.setScalar(1 + k * 0.15); n.stem.material.opacity = 0.6 * vis * near;
  });
  showPlaque(!mapMode && !focused && bd < 0.011 ? best : null);
  stage.classList.toggle('hover', !drag && !!pick());
  dust.rotation.y = Math.sin(clock * 0.02) * 0.02; dust.position.y = Math.sin(clock * 0.3) * 0.4;
  const year = Y0 + tt * (Y1 - Y0);
  yearEl.firstChild.nodeValue = String(Math.min(2026, Math.floor(year)));
  wingEl.textContent = best ? WINGS[best.m.w][0] : '';
  done.style.width = (tt * 100) + '%';
  hint.classList.toggle('off', moved);
  // Music eases toward its target; mute holds it silent without stopping the tour.
  const mv = muted ? 0 : musicTarget; music.volume = Math.max(0, Math.min(1, music.volume + (mv - music.volume) * Math.min(1, dt * 2)));
  if (musicTarget === 0 && music.volume < 0.01 && !music.paused) music.pause();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
camPos.copy(curve.getPointAt(0)).add(new T.Vector3(0, 2.2, 5)); camLook.copy(curve.getPointAt(0.01));
requestAnimationFrame(frame);
