// The Carry the Story curtain: press the keystone in the header and the red
// satin flying behind the page comes forward over it, straightens and drapes
// into a curtain with the resources on it. Close, Escape, the keystone or a
// press on the page beside it lets it take flight again. The cloth itself lives in fabric.js, one length of satin in two
// states; this module runs the overlay, the choreography and the keyboard.
// Without WebGL, or with motion off, the curtain is a plain red panel that
// appears at once.

/**
 * @param {HTMLElement} overlay   the .curtain element
 * @param {object} opts
 * @param {() => boolean} opts.motion
 * @param {boolean} opts.webgl
 * @param {() => object | null} opts.cloth  the shared fabric, when it exists
 * @param {HTMLElement} opts.layer  the fixed layer the fabric draws in (it steps in front of the page while the curtain is down)
 * @param {HTMLElement[]} opts.triggers  the buttons that open and close it (the keystone)
 * @param {() => void} [opts.onOpen]
 * @param {() => void} [opts.onClose]
 */
export function createCurtain(overlay, { motion = () => true, webgl = true, cloth = () => null, layer = null, triggers = [], onOpen, onClose } = {}) {
  const panel = overlay.querySelector('.curtain-panel');
  const closeBtn = overlay.querySelector('[data-curtain-close]');
  let state = 'closed'; // closed | falling | open | rising
  let returnFocus = null;

  function setState(s) {
    state = s;
    overlay.dataset.state = s;
    for (const t of triggers) t.setAttribute('aria-expanded', String(s === 'open' || s === 'falling'));
  }
  const live = () => webgl && motion() && !!cloth();

  /** Tell the cloth where the curtain hangs: under the keystone, the panel's width. */
  function place() {
    const c = cloth();
    if (!c) return;
    const rod = document.querySelector('.nav-keystone') || document.querySelector('.site-header');
    const key = rod ? rod.getBoundingClientRect() : { left: innerWidth / 2 - 100, width: 200, bottom: 70 };
    const top = Math.max(0, Math.round(key.bottom - 8));
    overlay.style.setProperty('--curtain-top', `${top}px`);
    const r = overlay.getBoundingClientRect();
    c.setHang({ left: r.left, width: r.width, top, bottom: innerHeight, keyLeft: key.left, keyWidth: key.width, keyBottom: key.bottom });
  }
  const ro = new ResizeObserver(() => {
    if (state !== 'closed') place();
  });
  ro.observe(overlay);

  async function open({ trigger = null } = {}) {
    if (state !== 'closed') return;
    returnFocus = trigger || document.activeElement;
    const rod = document.querySelector('.nav-keystone') || document.querySelector('.site-header');
    const top = rod ? Math.max(0, Math.round(rod.getBoundingClientRect().bottom - 8)) : 0;
    overlay.style.setProperty('--curtain-top', `${top}px`);
    overlay.hidden = false;
    overlay.classList.toggle('is-plain', !live());
    document.body.classList.add('curtain-open');
    onOpen?.();
    if (live()) {
      const c = cloth();
      place();
      setState('falling');
      // The page steps back, the flying cloth comes forward over it, straightens and drapes into the curtain
      layer?.classList.add('is-front');
      await c.settle();
      if (state !== 'falling') return;
    }
    setState('open');
    closeBtn.focus();
  }
  async function close() {
    if (state !== 'open' && state !== 'falling') return;
    setState('rising');
    const c = cloth();
    if (c && live() && (c.state === 'hanging' || c.state === 'draping')) {
      await c.takeFlight();
      if (state !== 'rising') return;
      layer?.classList.remove('is-front');
    } else {
      layer?.classList.remove('is-front');
    }
    overlay.hidden = true;
    document.body.classList.remove('curtain-open');
    setState('closed');
    onClose?.();
    returnFocus?.focus?.();
    returnFocus = null;
  }
  const toggle = (opts) => (state === 'closed' ? open(opts) : close());

  for (const t of triggers) t.addEventListener('click', () => toggle({ trigger: t }));
  closeBtn.addEventListener('click', () => close());
  document.addEventListener('pointerdown', (e) => {
    // A press on the page beside the curtain lifts it; the header's own controls keep working
    if (state !== 'open' || overlay.contains(e.target) || e.target.closest('.site-header')) return;
    close();
  });
  overlay.addEventListener('click', (e) => {
    // A link to somewhere on this page lifts the curtain first, then goes there
    const go = e.target.closest('[data-curtain-go]');
    if (go) {
      e.preventDefault();
      const href = go.getAttribute('href');
      close().then(() => {
        location.hash = href;
      });
    }
  });
  // A hand over the hanging cloth brushes it: a faint ripple runs the way the hand moved
  let lastX = null;
  let lastY = null;
  overlay.addEventListener('pointermove', (e) => {
    if (state !== 'open' || !live()) {
      lastX = lastY = null;
      return;
    }
    if (lastX !== null) cloth()?.brush(e.clientX, e.clientY, e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
  });
  overlay.addEventListener('pointerleave', () => {
    lastX = lastY = null;
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    // Focus stays on the curtain while it is down
    const items = [...panel.querySelectorAll('a[href], button:not([disabled])')].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  return {
    open,
    close,
    toggle,
    get state() {
      return state;
    },
    get live() {
      return live();
    },
  };
}
