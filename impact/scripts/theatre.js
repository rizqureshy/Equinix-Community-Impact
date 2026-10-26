// The Stories theatre: five chapters on one screen. The chosen chapter's film plays with its headline;
// every few seconds the next chapter takes over, until the visitor chooses one, which stops the rotation.
const DWELL = 5000;

export function createTheatre(section, { motion = () => true, onSelect = () => {} } = {}) {
  if (!section) return null;
  const rows = [...section.querySelectorAll('.theatre-row')];
  const films = [...section.querySelectorAll('.theatre-film')];
  const leads = [...section.querySelectorAll('.theatre-lead')];
  const topics = rows.map((r) => r.dataset.topic);
  let active = null, auto = true, visible = false, raf = 0, since = performance.now();
  const videoOf = (t) => films.find((f) => f.dataset.topic === t)?.querySelector('video');
  const canPlay = () => motion() && visible && !document.hidden;
  const nextOf = (t) => topics[(topics.indexOf(t) + 1) % topics.length];

  function sync() {
    for (const f of films) {
      const v = f.querySelector('video'); if (!v) continue;
      if (f.dataset.topic === active && canPlay()) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); }
      else v.pause();
    }
  }
  function select(topic, { user = false } = {}) {
    if (!topics.includes(topic)) return;
    if (user && auto) { auto = false; section.dataset.auto = 'off'; }
    since = performance.now();
    if (topic !== active) {
      active = topic;
      rows.forEach((r) => { const on = r.dataset.topic === topic; r.setAttribute('aria-pressed', String(on)); r.classList.toggle('on', on); });
      films.forEach((f) => f.classList.toggle('on', f.dataset.topic === topic));
      leads.forEach((l) => { const on = l.dataset.topic === topic; l.classList.toggle('on', on); l.hidden = !on; });
      sync();
      const next = videoOf(nextOf(topic)); if (next && next.preload === 'none' && motion()) next.preload = 'auto'; // warm the next film
    }
    onSelect(topic, { user });
    tick();
  }
  // The dwell: a bar under the chosen chapter fills over five seconds, then the next chapter takes over
  function frame(now) {
    raf = 0;
    const bar = section.querySelector('.theatre-row.on .bar i');
    if (auto && canPlay()) {
      const p = Math.min(1, (now - since) / DWELL);
      if (bar) bar.style.transform = `scaleX(${p.toFixed(3)})`;
      if (p >= 1) select(nextOf(active)); else raf = requestAnimationFrame(frame);
    } else if (bar) bar.style.transform = 'scaleX(0)';
  }
  function tick() { if (!raf) raf = requestAnimationFrame(frame); }
  rows.forEach((r) => r.addEventListener('click', () => select(r.dataset.topic, { user: true })));
  // Pointer resting on the stage holds the current chapter
  const stage = section.querySelector('.theatre-stage');
  let held = false;
  stage?.addEventListener('mouseenter', () => { held = true; });
  stage?.addEventListener('mouseleave', () => { held = false; since = performance.now(); tick(); });
  const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) since = performance.now(); sync(); tick(); }, { threshold: 0.3 });
  io.observe(section);
  document.addEventListener('visibilitychange', () => { sync(); tick(); });
  const origFrame = frame;
  select(topics[0]);
  return {
    select, sync,
    get active() { return active; },
    get auto() { return auto; },
    get held() { return held; },
    resume() { auto = true; section.dataset.auto = 'on'; since = performance.now(); tick(); },
    motionChanged() { since = performance.now(); sync(); tick(); },
  };
}
