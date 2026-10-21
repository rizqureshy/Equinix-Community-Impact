// Season and weather: a diffused light over the page, a few drifting leaves,
// petals or flakes, and fine rain. Kept almost subliminal: nothing moves
// over text for long, counts stay tiny, and everything stops with motion
// off. The choice is remembered per visitor.

export const WEATHERS = {
  'autumn-sun': { label: 'Autumn sun', season: 'autumn', particle: 'leaf', rain: false },
  'autumn-rain': { label: 'Autumn rain', season: 'autumn', particle: 'leaf', rain: true },
  winter: { label: 'Winter light', season: 'winter', particle: 'flake', rain: false },
  spring: { label: 'Spring', season: 'spring', particle: 'petal', rain: false },
};

/** The weather a date suggests (northern hemisphere, where most readers are). */
export function weatherFor(date = new Date()) {
  const m = date.getMonth();
  if (m >= 8 && m <= 10) return 'autumn-sun';
  if (m === 11 || m <= 1) return 'winter';
  if (m >= 2 && m <= 4) return 'spring';
  return 'autumn-sun';
}

const LEAF_PATHS = [
  'M12 1 C 4 6, 1 13, 7 22 C 10 19, 18 17, 20 9 C 21 5, 17 2, 12 1 Z M12 1 L 9 20',
  'M11 2 C 2 8, 2 16, 10 22 C 16 19, 21 13, 19 4 C 17 1, 13 1, 11 2 Z M11 2 L 10 21',
];
const PETAL_PATH = 'M10 1 C 4 4, 2 12, 10 21 C 18 12, 16 4, 10 1 Z';
const COLOURS = {
  leaf: ['#c9a46c', '#b8763d', '#9a5a2e', '#d9b36f'],
  petal: ['#f3c9d2', '#efd7dd', '#f7e3e7'],
  flake: ['#ffffff'],
};

function sprite(kind) {
  const colour = COLOURS[kind][Math.floor(Math.random() * COLOURS[kind].length)];
  if (kind === 'flake') return `<svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true"><circle cx="5" cy="5" r="4" fill="${colour}" opacity="0.9"/></svg>`;
  const d = kind === 'petal' ? PETAL_PATH : LEAF_PATHS[Math.floor(Math.random() * LEAF_PATHS.length)];
  return `<svg viewBox="0 0 22 24" width="24" height="26" aria-hidden="true"><path d="${d}" fill="${colour}" stroke="${colour}" stroke-width="0.8" stroke-linejoin="round" fill-opacity="0.92"/></svg>`;
}

/**
 * @param {object} opts
 * @param {HTMLElement} opts.light     fixed layer that carries the sun wash
 * @param {HTMLElement} opts.particles fixed layer the leaves fall through
 * @param {HTMLElement} opts.rain      fixed layer with the rain streaks
 * @param {() => boolean} opts.motion  whether motion is on
 * @param {(kind: string) => void} [opts.onChange]
 */
export function createWeather({ light, particles, rain, motion, onChange }) {
  const root = document.documentElement;
  let kind = root.dataset.weather || weatherFor();
  let spawnTimer = 0;
  let alive = 0;
  const MAX_ALIVE = 4;

  function apply(next, { silent = false } = {}) {
    kind = WEATHERS[next] ? next : weatherFor();
    const w = WEATHERS[kind];
    root.dataset.weather = kind;
    root.dataset.season = w.season;
    rain.hidden = !w.rain;
    try {
      if (!silent) localStorage.setItem('impact-weather', kind);
    } catch {}
    restartSpawning();
    onChange?.(kind);
  }

  // The light drifts a few pixels with the cursor and the scroll
  let lx = 0;
  let ly = 0;
  function placeLight() {
    light.style.setProperty('--lx', `${lx.toFixed(1)}px`);
    light.style.setProperty('--ly', `${ly.toFixed(1)}px`);
  }
  addEventListener(
    'pointermove',
    (e) => {
      if (!motion()) return;
      lx = (e.clientX / innerWidth - 0.5) * 24;
      ly = (e.clientY / innerHeight - 0.5) * 16;
      placeLight();
    },
    { passive: true },
  );
  addEventListener(
    'scroll',
    () => {
      if (!motion()) return;
      light.style.setProperty('--ls', `${(-scrollY * 0.03).toFixed(1)}px`);
    },
    { passive: true },
  );

  // Particles: one at a time, now and then
  function spawn() {
    if (!motion() || document.hidden || alive >= MAX_ALIVE) return;
    const w = WEATHERS[kind];
    const el = document.createElement('span');
    el.className = `weather-particle weather-particle--${w.particle}`;
    const duration = w.particle === 'flake' ? 14 + Math.random() * 8 : 10 + Math.random() * 6;
    el.style.setProperty('--x', `${(8 + Math.random() * 84).toFixed(1)}vw`);
    el.style.setProperty('--sway', `${(18 + Math.random() * 40).toFixed(0)}px`);
    el.style.setProperty('--spin', `${Math.round(Math.random() * 360)}deg`);
    el.style.setProperty('--dur', `${duration.toFixed(1)}s`);
    el.style.setProperty('--size', `${(0.8 + Math.random() * 0.5).toFixed(2)}`);
    el.innerHTML = `<i>${sprite(w.particle)}</i>`;
    particles.appendChild(el);
    alive++;
    el.addEventListener('animationend', () => {
      el.remove();
      alive--;
    });
  }
  function restartSpawning() {
    clearTimeout(spawnTimer);
    particles.replaceChildren();
    alive = 0;
    const schedule = () => {
      const w = WEATHERS[kind];
      const gap = w.particle === 'flake' ? 2500 + Math.random() * 3500 : 7000 + Math.random() * 12000;
      spawnTimer = setTimeout(() => {
        spawn();
        schedule();
      }, gap);
    };
    if (motion()) {
      spawnTimer = setTimeout(() => {
        spawn();
        schedule();
      }, 1800);
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) restartSpawning();
  });

  let stored = null;
  try {
    stored = localStorage.getItem('impact-weather');
  } catch {}
  apply(stored || weatherFor(), { silent: true });

  return {
    get kind() {
      return kind;
    },
    set: (next) => apply(next),
    /** Called when motion is switched on or off. */
    motionChanged() {
      if (!motion()) {
        light.style.removeProperty('--lx');
        light.style.removeProperty('--ly');
        light.style.removeProperty('--ls');
      }
      restartSpawning();
    },
  };
}
