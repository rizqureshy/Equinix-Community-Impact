// Prototype: the Spine of Impact ride. Placeholder art; milestones from the research doc.
import * as T from 'three';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/fraunces';

  const root = document.documentElement;
  const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
  const col = (n) => new T.Color(css(n));
  const dark = () => matchMedia('(prefers-color-scheme: dark)').matches ? root.dataset.theme !== 'light' : root.dataset.theme === 'dark';

  // Impact milestones only. Every entry is dated, scoped and sourced in the research doc.
  const Y0 = 2010, Y1 = 2027;
  const WINGS = { planet: ['Energy and heat', '--planet'], connect: ['Connection', '--connect'], community: ['Community', '--community'], alwayson: ['Always on', '--alwayson'] };
  const M = [
    { y: 2010.4, w: 'planet', t: 'The first data center to heat homes', f: 'since 2010', fl: 'Helsinki Kanavaranta, with Helen', s: 'Named by Equinix as the world’s first data centre heating project; homes have been warmed from it since 2010.', u: 'https://newsroom.equinix.com/2023-07-13-Repurposing-Heat-for-Community-Use-Heat-Export-Project-Powered-by-Equinix-Sets-Stage-for-Further-Cooperation' },
    { y: 2011.2, w: 'alwayson', t: 'Tokyo stays up through the Tohoku earthquake', f: 'free ports', fl: 'so carriers could rebuild capacity', s: 'TY1 and TY2 undamaged; Equinix Japan offered free exchange VLANs and ports after subsea cables were cut. March 2011.', u: 'https://equinix.mediaroom.com/2011-03-15-Equinix-To-Offer-Free-Internet-Exchange-Service-In-Japan-For-Networks-Restoration' },
    { y: 2012.8, w: 'alwayson', t: 'Hurricane Sandy: New York and New Jersey hold', f: '48 h', fl: 'of generator fuel at every site', s: 'All NY and NJ sites ran on generators; staff slept on site. One NY9 generator failed and was restored in 1 h 15 min. Trade press account, October 2012.', u: 'https://www.datacenterknowledge.com/business/generators-keep-nj-data-centers-humming' },
    { y: 2015.4, w: 'planet', t: 'First data center company to aim for 100% clean energy', f: '100%', fl: 'goal for the whole portfolio', s: 'Set in 2015, with a 1 MW biogas fuel cell at SV5 and a 105 MW solar agreement covering California.', u: 'https://newsroom.equinix.com/2015-10-26-Equinix-Recognized-by-EPA-for-Leading-Green-Power-Use' },
    { y: 2015.8, w: 'community', t: 'The Community Impact programme begins', f: '2015', fl: 'employee giving and volunteering, organised', s: 'Equinix dates its Community Impact programme to 2015, the base the Foundation later built on.', u: 'https://newsroom.equinix.com/2022-09-28-Equinix-Commits-50-Million-to-Global-Foundation-to-Advance-Digital-Inclusion' },
    { y: 2017.6, w: 'alwayson', t: 'Hurricane Harvey: Houston never loses service', f: '0', fl: 'minutes of lost power at HO1', s: 'Streets flooded so customers could not reach the site; the site itself never lost utility power or service. August 2017, trade press.', u: 'https://www.datacenterknowledge.com/uptime/four-providers-houston-data-centers-online-but-access-roads-flooded' },
    { y: 2019.1, w: 'connect', t: 'Curie: the first new cable to Chile in twenty years', f: '20 yrs', fl: 'since the last cable to Chile', s: 'Google chose LA4 as the landing station. One cable; Equinix was then in 25+ cable projects.', u: 'https://investor.equinix.com/news-events/press-releases/detail/183/google-selects-equinix-for-curie-subsea-cable-landing' },
    { y: 2021.1, w: 'alwayson', t: 'Texas winter storm: all nine sites stay on', f: '9 of 9', fl: 'Texas data centers operational', s: 'On utility power where available, generators elsewhere, during the February 2021 grid emergency.', u: 'https://www.datacenterfrontier.com/energy/article/11428394/texas-data-centers-rely-on-generators-amid-power-emergency' },
    { y: 2021.45, w: 'planet', t: 'First in the industry to pledge climate neutral by 2030', f: '2030', fl: 'science-based, 50% cut from 2019', s: 'Global operations and supply chain; founding signatory of the EU Climate Neutral Data Centre Pact the same year.', u: 'https://newsroom.equinix.com/2021-06-16-Equinix-Sets-2030-Global-Climate-Neutral-Target' },
    { y: 2022.3, w: 'connect', t: '2Africa makes its first landing, in Genoa', f: '1st', fl: 'landing of the 2Africa cable', s: 'The GN1 data center received the first landing of the cable that rings Africa. April 2022.', u: 'https://www.structureresearch.net/2022/04/22/2africa-lands-in-equinix-data-centre-in-genoa-italy/' },
    { y: 2022.7, w: 'community', t: 'The Equinix Foundation is born', f: '$50M', fl: 'to advance digital inclusion', s: 'Launched September 2022. Its grants, not Equinix, do the training and connecting.', u: 'https://newsroom.equinix.com/2022-09-28-Equinix-Commits-50-Million-to-Global-Foundation-to-Advance-Digital-Inclusion' },
    { y: 2023.4, w: 'planet', t: 'Espoo: recovered heat for a town’s homes', f: '2,000', fl: 'homes a year, up to', s: 'Two Espoo data centers feed Fortum’s district heating, 4 MW rising to 6 MW. May 2023.', u: 'https://newsroom.equinix.com/2023-05-12-Fortum-and-Equinix-team-up-Recycled-heat-from-Equinix-data-centers-to-be-utilized-in-Fortums-district-heating-network' },
    { y: 2023.7, w: 'planet', t: 'Frankfurt: heat for a neighbourhood, free of charge', f: '1,000', fl: 'Griesheim households, from 2025', s: 'FR4, FR6 and FR8 with Vonovia and partners. Announced July 2023; go-live still to be verified.', u: 'https://newsroom.equinix.com/2023-07-13-Repurposing-Heat-for-Community-Use-Heat-Export-Project-Powered-by-Equinix-Sets-Stage-for-Further-Cooperation' },
    { y: 2024.1, w: 'connect', t: 'Nigeria’s first international cable outside Lagos', f: '250 km', fl: 'of new fibre to Port Harcourt', s: '2Africa lands at Qua Iboe Beach, facilitated by MainOne, an Equinix company. February 2024.', u: 'https://techcabal.com/2026/02/09/equinix-opens-first-south-south-data-centre/' },
    { y: 2024.45, w: 'planet', t: 'Help us heat our neighbours', f: '6', fl: 'countries with heat export projects', s: 'An open call to utilities and towns to take recovered heat: France, Finland, Germany, Ireland, Switzerland, Canada. June 2024.', u: 'https://newsroom.equinix.com/2024-06-05-Help-Us-Heat-Our-Neighbors-Equinix-Makes-Data-Center-Heat-Available-to-Warm-Nearby-Buildings-and-Swimming-Pools' },
    { y: 2024.8, w: 'planet', t: 'Helsinki: a second data center warms the city', f: '1,500', fl: 'one-bedroom flats, about', s: 'HE5 excess heat through heat pumps into Helen’s network. October 2024.', u: 'https://newsroom.equinix.com/2024-10-17-More-Helsinki-homes-to-be-heated-using-excess-heat-from-Equinix-data-center' },
    { y: 2025.2, w: 'community', t: 'Mapping every school’s connection with Giga', f: '3 yrs', fl: 'with UNICEF and ITU', s: 'The Foundation supports school connectivity mapping and a latency pilot on Equinix infrastructure. March 2025.', u: 'https://giga.global/giga-and-equinix-foundation-join-forces-to-help-bridge-the-digital-divide-connect-every-school-in-the-world-to-the-internet-by-2030/' },
    { y: 2025.5, w: 'community', t: 'Spending with the businesses next door', f: '$95M+', fl: 'with small, veteran-owned and HUBZone firms', s: 'Inclusive procurement in calendar 2025, as reported in the 2025 Sustainability Report.', u: 'https://d1io3yog0oux5.cloudfront.net/_6111a4f0545388396ff7e7a9f1006ce4/equinix/db/2251/27036/file/Equinix-Inc_2025_Sustainability-Report.pdf' },
    { y: 2025.7, w: 'connect', t: 'SMAP lands in Perth and Sydney', f: '400 Tbps', fl: 'cable landing directly in the buildings', s: '5,000 km, 16 fibre pairs. One cable system. September 2025.', u: 'https://newsroom.equinix.com/2025-09-22-Equinix-Selected-for-SMAP-Cable-Landing-in-Perth-and-Sydney' },
    { y: 2025.85, w: 'community', t: 'Colleagues give their time where they live', f: '54,400+', fl: 'volunteer hours in 2025, up 45%', s: 'All employees, calendar 2025, 2025 Sustainability Report.', u: 'https://d1io3yog0oux5.cloudfront.net/_6111a4f0545388396ff7e7a9f1006ce4/equinix/db/2251/27036/file/Equinix-Inc_2025_Sustainability-Report.pdf' },
    { y: 2025.97, w: 'planet', t: 'A year of heat given back', f: '19 GWh', fl: 'exported to communities in 2025', s: 'Global, calendar 2025; up from 14.5 GWh in 2024. Coverage 96% renewable, PUE 1.37.', u: 'https://investor.equinix.com/sec-filings/all-sec-filings/content/0001101239-26-000075/EQIXAnnualRpt2025PRINT.pdf' },
    { y: 2026.2, w: 'community', t: 'Learning Labs for the next technicians', f: '3', fl: 'labs: Dallas, Paris, Singapore', s: 'Apprenticeships and early-career programmes relaunched globally. March 2026, trade press.', u: 'https://datacentrereview.com/2026/03/equinix-expands-global-skills-push-as-ai-drives-data-centre-hiring-pressure/' },
    { y: 2026.45, w: 'planet', t: 'Dublin: the first hydrogen power trial', f: '< 1.3', fl: 'site PUE during the trial', s: 'Two green-hydrogen units supporting cooling at DB3 for 12 weeks. June 2026.', u: 'https://newsroom.equinix.com/2026-06-19-Equinix-Trials-Landmark-Hydrogen-Power-Solution-at-Dublin-Data-Centre' },
    { y: 2026.62, w: 'community', t: 'Georgia: neighbours’ bills will not rise', f: '100%', fl: 'of grid costs paid, for 20 years', s: 'Hampton: Equinix funds a substation and two lines and pays all costs for its demand. August 2026.', u: 'https://investor.equinix.com/news-events/press-releases/detail/1118/equinix-partners-with-central-georgia-electric-membership' },
    { y: 2026.8, w: 'community', t: 'Skills that travel further than the buildings', f: '1.6M', fl: 'people trained in digital skills in 2025', s: 'By Foundation grantees, calendar 2025, reported August 2026 with a further $50M commitment.', u: 'https://investor.equinix.com/news-events/press-releases/detail/1120/equinix-commits-additional-50-million-to-the-equinix' },
    { y: 2027, w: 'community', t: 'The five promises', f: '5', fl: 'commitments to the places we call home', s: 'Where the spine ends: the promises, each hung beside the exhibit that proves it.', u: 'https://equinixtogether.com/community-principles/', end: true }
  ];
  const tOf = (y) => (y - Y0) / (Y1 - Y0);

  // Scene.
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
  const ribbonMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0 });
  const ribbon = new T.Mesh(new T.TubeGeometry(curve, 600, 0.22, 12, false), ribbonMat); scene.add(ribbon);
  const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new T.CanvasTexture(c); return t; })();
  const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(16, 16, 14, 0, Math.PI * 2); g.fill(); return new T.CanvasTexture(c); })();

  // Dust: thousands of drifting points around the path.
  const DUST = 4200; const dustPos = new Float32Array(DUST * 3); const dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) { const p = curve.getPointAt(Math.random()); const r = 6 + Math.random() * 40; const a = Math.random() * Math.PI * 2; dustPos[i * 3] = p.x + Math.cos(a) * r; dustPos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 30; dustPos[i * 3 + 2] = p.z + Math.sin(a) * r; dustSeed[i] = Math.random(); }
  const dustGeo = new T.BufferGeometry(); dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
  const dustMat = new T.PointsMaterial({ size: 0.35, map: dotTex, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true });
  const dust = new T.Points(dustGeo, dustMat); scene.add(dust);

  // Nebulae: big soft sprites tinted by the wing of the nearest milestones.
  const nebulae = [];
  M.forEach((m) => { for (let k = 0; k < 3; k++) { const p = curve.getPointAt(Math.min(0.999, tOf(m.y) + (Math.random() - 0.5) * 0.03)); const s = new T.Sprite(new T.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.18 })); const r = 14 + Math.random() * 26; s.scale.set(r, r, 1); s.position.set(p.x + (Math.random() - 0.5) * 30, p.y + (Math.random() - 0.5) * 18, p.z + (Math.random() - 0.5) * 16); s.userData.w = m.w; scene.add(s); nebulae.push(s); } });

  // Labels.
  function textSprite(text, { size = 28, weight = 500, color, box, scale = 0.012, maxW = 0 } = {}) {
    const c = document.createElement('canvas'); const g = c.getContext('2d'); const pad = 16;
    g.font = `${weight} ${size}px 'Inter Tight Variable', Arial, sans-serif`;
    let lines = [text];
    if (maxW) { lines = []; let cur = ''; for (const word of text.split(' ')) { const test = cur ? cur + ' ' + word : word; if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = word; } else cur = test; } if (cur) lines.push(cur); }
    const w = Math.ceil(Math.max(...lines.map((l) => g.measureText(l).width))) + pad * 2, lh = size * 1.25, h = lh * lines.length + pad * 1.2;
    c.width = w * 2; c.height = h * 2; g.scale(2, 2);
    if (box) { g.fillStyle = box; g.beginPath(); g.roundRect(0, 0, w, h, 10); g.fill(); }
    g.font = `${weight} ${size}px 'Inter Tight Variable', Arial, sans-serif`; g.fillStyle = color; g.textBaseline = 'top';
    lines.forEach((l, i) => g.fillText(l, pad, pad * 0.6 + i * lh));
    const tex = new T.CanvasTexture(c); tex.minFilter = T.LinearFilter;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); sp.scale.set(w * scale, h * scale, 1); return sp;
  }

  // Milestone nodes.
  const nodes = M.map((m, i) => {
    const t = tOf(m.y); const p = curve.getPointAt(Math.min(0.9999, t)); const tan = curve.getTangentAt(Math.min(0.9999, t));
    const side = new T.Vector3().crossVectors(tan, new T.Vector3(0, 1, 0)).normalize().multiplyScalar(i % 2 ? 3.6 : -3.6);
    const lift = i % 4 < 2 ? 2.4 : 4.6;
    const g = new T.Group(); g.position.copy(p);
    const core = new T.Mesh(new T.SphereGeometry(m.end ? 0.9 : 0.42, 24, 24), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.3 }));
    const halo = new T.Sprite(new T.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.8 })); halo.scale.set(m.end ? 9 : 4.5, m.end ? 9 : 4.5, 1);
    const stem = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    const reach = side.clone().add(new T.Vector3(0, lift - 0.3, 0));
    stem.position.copy(reach.clone().multiplyScalar(0.5)); stem.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), reach.clone().normalize()); stem.scale.y = reach.length();
    const card = new T.Group(); card.position.copy(side).add(new T.Vector3(0, lift, 0));
    g.add(core, halo, stem, card); scene.add(g);
    return { m, t, g, core, halo, stem, card, sprites: [], p };
  });

  // Year beacons along the ribbon.
  const beacons = []; for (let y = Y0; y <= 2026; y++) { const p = curve.getPointAt(tOf(y)); const s = new T.Sprite(new T.SpriteMaterial({ map: dotTex, transparent: true, opacity: 0.5, depthWrite: false })); s.scale.set(0.25, 0.25, 1); s.position.copy(p).add(new T.Vector3(0, -0.6, 0)); scene.add(s); beacons.push({ s, y }); }

  // Theme application (colours, labels).
  let fg, muted, panel;
  function applyTheme() {
    fg = css('--fg'); muted = css('--muted'); panel = dark() ? 'rgba(16,20,30,0.86)' : 'rgba(255,255,255,0.9)';
    const bg = col('--bg'); scene.background = bg; scene.fog = new T.FogExp2(bg.getHex(), dark() ? 0.011 : 0.013);
    const rib = dark() ? new T.Color('#aeb6c8') : new T.Color('#b9b4a8'); ribbonMat.color.copy(rib); ribbonMat.emissive.copy(rib); ribbonMat.emissiveIntensity = dark() ? 0.35 : 0;
    dustMat.color = dark() ? new T.Color('#9fb0d8') : new T.Color('#8f8a7e'); dustMat.opacity = dark() ? 0.7 : 0.5;
    nebulae.forEach((s) => { s.material.color = col(WINGS[s.userData.w][1]); s.material.opacity = dark() ? 0.16 : 0.1; });
    beacons.forEach((b) => { b.s.material.color = col('--muted'); });
    nodes.forEach((n) => {
      const c = col(WINGS[n.m.w][1]); n.core.material.color.copy(c); n.core.material.emissive.copy(c); n.halo.material.color.copy(c); n.stem.material.color.copy(c);
      n.sprites.forEach((s) => { n.card.remove(s); s.material.map.dispose(); s.material.dispose(); }); n.sprites = [];
      const yr = textSprite(String(Math.floor(n.m.y)), { size: 22, weight: 600, color: muted, scale: 0.0095 });
      const title = textSprite(n.m.t, { size: 30, weight: 500, color: fg, box: panel, scale: 0.0095, maxW: 400 });
      const fig = textSprite(n.m.f + '  ' + n.m.fl, { size: 22, weight: 400, color: muted, scale: 0.0095, maxW: 400 });
      const th = title.scale.y; title.position.set(0, 0, 0); yr.position.set(0, th / 2 + 0.45, 0.01); fig.position.set(0, -th / 2 - 0.5, 0.01);
      n.card.add(yr, title, fig); n.sprites.push(yr, title, fig);
    });
    document.getElementById('theme').textContent = dark() ? 'Day' : 'Night';
  }
  if (!root.dataset.theme) root.dataset.theme = 'dark'; // The universe opens at night; Day is one tap away.
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  document.getElementById('theme').addEventListener('click', () => { root.dataset.theme = dark() ? 'light' : 'dark'; applyTheme(); });

  // Travel state.
  let t = 0, target = 0.004, riding = false, mapMode = false, dwell = 0, visited = new Set();
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const stage = document.getElementById('stage');
  const hint = document.getElementById('hint');
  let moved = false;
  stage.addEventListener('wheel', (e) => { e.preventDefault(); target = clamp(target + e.deltaY * 0.00012); stopRide(); moved = true; }, { passive: false });
  let drag = null;
  stage.addEventListener('pointerdown', (e) => { drag = { y: e.clientY, t: target }; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => { if (!drag) return; target = clamp(drag.t + (drag.y - e.clientY) * 0.0009); stopRide(); moved = true; });
  const endDrag = () => { drag = null; };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  window.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') { target = clamp(target + 0.02); stopRide(); moved = true; e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { target = clamp(target - 0.02); stopRide(); e.preventDefault(); } if (e.key === 'Home') target = 0; if (e.key === 'End') target = 1; });

  // Ride and map.
  const rideBtn = document.getElementById('ride'), mapBtn = document.getElementById('map');
  function stopRide() { if (!riding) return; riding = false; rideBtn.setAttribute('aria-pressed', 'false'); rideBtn.textContent = 'Ride'; }
  rideBtn.addEventListener('click', () => { riding = !riding; if (riding && target > 0.995) { target = 0; t = 0; visited.clear(); } rideBtn.setAttribute('aria-pressed', String(riding)); rideBtn.textContent = riding ? 'Pause' : 'Ride'; if (riding) { mapMode = false; mapBtn.setAttribute('aria-pressed', 'false'); } moved = true; });
  mapBtn.addEventListener('click', () => { mapMode = !mapMode; mapBtn.setAttribute('aria-pressed', String(mapMode)); if (mapMode) stopRide(); });

  // Track with ticks.
  const track = document.getElementById('track'), done = document.getElementById('done');
  M.forEach((m, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tick'; b.style.setProperty('--c', `var(${WINGS[m.w][1]})`); b.style.left = (tOf(m.y) * 100) + '%'; b.title = m.t; b.setAttribute('aria-label', `${Math.floor(m.y)}: ${m.t}`); b.addEventListener('click', () => { target = tOf(m.y); stopRide(); mapMode = false; mapBtn.setAttribute('aria-pressed', 'false'); moved = true; }); track.appendChild(b); nodes[i].tick = b; });
  for (let y = Y0; y <= 2026; y += 4) { const s = document.createElement('span'); s.className = 'yr'; s.style.left = (tOf(y) * 100) + '%'; s.textContent = y; track.appendChild(s); }

  // Plaque.
  const plaque = document.getElementById('plaque'); let activeNode = null;
  function showPlaque(n) {
    if (activeNode === n) return; activeNode = n;
    nodes.forEach((x) => x.tick.classList.toggle('on', x === n));
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
  const camPos = new T.Vector3(), camLook = new T.Vector3(), tmp = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  const mapPos = curve.getPointAt(0.5).clone().add(new T.Vector3(-70, 90, 120)), mapLook = curve.getPointAt(0.5);
  let last = performance.now(), clock = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
    if (riding) {
      if (dwell > 0) dwell -= dt; else { target = clamp(target + dt * 0.022); const near = nodes.find((n) => !visited.has(n) && Math.abs(n.t - target) < 0.004); if (near) { visited.add(near); dwell = 3.2; target = near.t; } if (target >= 1) stopRide(); }
    }
    t += (target - t) * (reduce ? 1 : 0.06);
    const tt = Math.min(0.9999, Math.max(0, t));
    const p = curve.getPointAt(tt), ahead = curve.getPointAt(Math.min(0.9999, tt + 0.012)), tan = curve.getTangentAt(tt);
    const side = tmp.crossVectors(tan, up).normalize();
    if (mapMode) { camPos.lerp(mapPos, 0.05); camLook.lerp(mapLook, 0.05); }
    else { const want = p.clone().add(up.clone().multiplyScalar(2.4)).add(side.clone().multiplyScalar(-1.6)).add(tan.clone().multiplyScalar(-6)); camPos.lerp(want, reduce ? 1 : 0.35); camLook.lerp(ahead.clone().add(up.clone().multiplyScalar(1.6)), reduce ? 1 : 0.35); }
    camera.position.copy(camPos); camera.lookAt(camLook);
    // Nodes face the camera; the nearest one brightens; cards fade when too near or too far.
    let best = null, bd = 1;
    nodes.forEach((n) => {
      n.card.quaternion.copy(camera.quaternion); const d = Math.abs(n.t - tt); if (d < bd) { bd = d; best = n; }
      const k = Math.max(0, 1 - d / 0.02); n.halo.material.opacity = 0.5 + k * 0.5; n.card.scale.setScalar(1 + k * 0.3); n.core.scale.setScalar(1 + k * 0.6);
      const dist = n.g.position.distanceTo(camera.position); const vis = mapMode ? 1 : Math.max(0, Math.min(1, (dist - 4) / 5)) * Math.max(0, Math.min(1, (90 - dist) / 30));
      n.sprites.forEach((s) => { s.material.opacity = vis; }); n.stem.material.opacity = 0.6 * vis;
    });
    showPlaque(!mapMode && bd < 0.011 ? best : null);
    document.body.classList.toggle('has-plaque', !!activeNode);
    // Dust drifts.
    dust.rotation.y = Math.sin(clock * 0.02) * 0.02; dust.position.y = Math.sin(clock * 0.3) * 0.4;
    const year = Y0 + tt * (Y1 - Y0);
    yearEl.firstChild.nodeValue = String(Math.min(2026, Math.floor(year)));
    wingEl.textContent = best ? WINGS[best.m.w][0] : '';
    done.style.width = (tt * 100) + '%';
    hint.classList.toggle('off', moved);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  camPos.copy(curve.getPointAt(0)).add(new T.Vector3(0, 2.2, 5)); camLook.copy(curve.getPointAt(0.01));
  requestAnimationFrame(frame);
