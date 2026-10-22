// The field: a few thousand points of light on a canvas that travel between
// forms as the story moves. Canvas 2D, so it runs anywhere, with no WebGL.
// With motion off the current form is drawn once, still.
import { SHAPES, PALETTES } from './shapes.js';

const BG = [8, 8, 11];

export function createField(canvas, { count = 3200, motion = () => true } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let w = 0;
  let h = 0;
  let dpr = 1;
  let aspect = 1;
  let n = count;
  let px, py, vx, vy, tx, ty, size, tone, phase;
  let shape = 'strands';
  let palette = PALETTES.strands;
  let shift = 0; // horizontal offset of the form, as a share of the half width
  let visible = true;
  let running = false;
  let raf = 0;
  let last = 0;
  let morph = 0; // 1 right after a change, decays to 0
  let pointer = null;
  let bursts = [];
  let drift = 0;

  function allocate() {
    px = new Float32Array(n);
    py = new Float32Array(n);
    vx = new Float32Array(n);
    vy = new Float32Array(n);
    tx = new Float32Array(n);
    ty = new Float32Array(n);
    size = new Float32Array(n);
    tone = new Float32Array(n);
    phase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      px[i] = (Math.random() * 2 - 1) * aspect;
      py[i] = Math.random() * 2 - 1;
      size[i] = Math.random() < 0.035 ? 1.7 + Math.random() * 1.1 : 0.55 + Math.random() * 0.95;
      tone[i] = Math.random();
      phase[i] = Math.random() * Math.PI * 2;
    }
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    aspect = w / h;
    // Fewer points on small screens; they are smaller too.
    const want = w < 700 ? Math.round(count * 0.45) : w < 1100 ? Math.round(count * 0.7) : count;
    if (want !== n || !px) {
      n = want;
      allocate();
    }
    retarget(false);
    if (!motion()) drawStill();
  }

  function retarget(announce = true) {
    const gen = SHAPES[shape] || SHAPES.strands;
    const pts = gen(n, aspect);
    // A random permutation keeps the travel between forms from reading as one block sliding.
    const dx = shift * aspect;
    for (let i = 0; i < n; i++) {
      tx[i] = pts[i * 2] + dx;
      ty[i] = pts[i * 2 + 1];
    }
    if (announce) morph = 1;
  }

  const sx = (x) => ((x / aspect) * 0.5 + 0.5) * w;
  const sy = (y) => (y * 0.5 + 0.5) * h;

  function colour(i, alpha) {
    const c = tone[i] < palette.accentShare ? palette.accent : palette.light;
    return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
  }

  function step(dt) {
    const k = 0.028 + morph * 0.02;
    const damp = 0.86;
    drift += dt * 0.0006;
    const pr = pointer ? 0.16 * Math.min(aspect, 1) : 0;
    for (let i = 0; i < n; i++) {
      let ax = (tx[i] - px[i]) * k;
      let ay = (ty[i] - py[i]) * k;
      // A slow breath so the still forms never freeze
      ax += Math.sin(drift * 1.7 + phase[i]) * 0.00022;
      ay += Math.cos(drift * 1.3 + phase[i] * 1.1) * 0.00022;
      if (pointer) {
        const dx = px[i] - pointer[0];
        const dy = py[i] - pointer[1];
        const d2 = dx * dx + dy * dy;
        if (d2 < pr * pr && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const f = (1 - d / pr) * 0.0065;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }
      for (const b of bursts) {
        const dx = px[i] - b.x;
        const dy = py[i] - b.y;
        const d = Math.hypot(dx, dy) + 1e-4;
        const shell = Math.abs(d - b.r);
        if (shell < 0.06) {
          const f = (1 - shell / 0.06) * b.power;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }
      vx[i] = (vx[i] + ax) * damp;
      vy[i] = (vy[i] + ay) * damp;
      px[i] += vx[i];
      py[i] += vy[i];
    }
    for (const b of bursts) {
      b.r += dt * 0.0011;
      b.power *= 0.94;
    }
    bursts = bursts.filter((b) => b.power > 0.0002);
    morph = Math.max(0, morph - dt * 0.0011);
  }

  function draw(trail) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = trail ? `rgba(${BG[0]},${BG[1]},${BG[2]},${0.34 + morph * 0.1})` : `rgb(${BG[0]},${BG[1]},${BG[2]})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const scale = w < 700 ? 0.8 : 1;
    for (let i = 0; i < n; i++) {
      const x = sx(px[i]);
      const y = sy(py[i]);
      if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
      const s = size[i] * scale;
      const speed = Math.min(1, (Math.abs(vx[i]) + Math.abs(vy[i])) * 90);
      const alpha = 0.45 + speed * 0.4 + (s > 1.6 ? 0.25 : 0);
      ctx.fillStyle = colour(i, alpha);
      if (s > 1.6) {
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colour(i, 0.08);
        ctx.beginPath();
        ctx.arc(x, y, s * 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
  }

  function drawStill() {
    for (let i = 0; i < n; i++) {
      px[i] = tx[i];
      py[i] = ty[i];
      vx[i] = 0;
      vy[i] = 0;
    }
    draw(false);
  }

  function frame(t) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(48, last ? t - last : 16);
    last = t;
    step(dt);
    draw(true);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !motion() || !visible || document.hidden) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  resize();
  start();

  return {
    /** Move to a named form, optionally shifted sideways (share of the half width). */
    setShape(name, offset = 0) {
      if (!SHAPES[name] || (name === shape && offset === shift)) return;
      shape = name;
      shift = offset;
      palette = PALETTES[name];
      retarget(true);
      if (motion()) start();
      else drawStill();
    },
    get shape() {
      return shape;
    },
    setVisible(v) {
      visible = v;
      if (v) start();
      else stop();
    },
    /** Pointer in client pixels relative to the canvas, or null. */
    setPointer(clientX, clientY) {
      if (clientX == null) {
        pointer = null;
        return;
      }
      const r = canvas.getBoundingClientRect();
      pointer = [((clientX - r.left) / r.width - 0.5) * 2 * aspect, ((clientY - r.top) / r.height - 0.5) * 2];
    },
    /** A ring of pressure that passes through the field. */
    burst(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      bursts.push({ x: ((clientX - r.left) / r.width - 0.5) * 2 * aspect, y: ((clientY - r.top) / r.height - 0.5) * 2, r: 0.02, power: 0.03 });
      if (motion()) start();
    },
    /** Motion preference changed. */
    motionChanged() {
      if (motion()) start();
      else {
        stop();
        drawStill();
      }
    },
    resize,
    destroy() {
      stop();
    },
  };
}
