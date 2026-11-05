// The Carry the Story index on the page: ten resources in four groups, each row a disclosure that opens in
// place with what the file is, who it is from, where it lives and when to reach for it, and the Open button.
// One row open at a time. Markup is pre-rendered by carryHTML (content/resources.js).

/**
 * @param {HTMLElement} section
 * @param {object} opts
 * @param {() => boolean} [opts.motion]
 */
export function createCarry(section, { motion = () => true } = {}) {
  if (!section) return null;
  const rows = [...section.querySelectorAll('.carry-row')];
  const heads = rows.map((r) => r.querySelector('.carry-head'));
  const still = () => !motion() || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let openRow = null;

  function setOpen(row, on) {
    const head = row.querySelector('.carry-head');
    const body = row.querySelector('.carry-body');
    head.setAttribute('aria-expanded', String(on));
    row.classList.toggle('is-open', on);
    if (on) {
      body.hidden = false;
      if (still()) {
        body.style.height = 'auto';
      } else {
        // measure, then let it grow to its height; `auto` once it has arrived so it can reflow freely
        body.style.height = '0px';
        const h = body.scrollHeight;
        requestAnimationFrame(() => {
          body.style.height = `${h}px`;
        });
        body.addEventListener('transitionend', function done(e) {
          if (e.propertyName !== 'height') return;
          body.removeEventListener('transitionend', done);
          if (row.classList.contains('is-open')) body.style.height = 'auto';
        });
      }
    } else if (still()) {
      body.hidden = true;
      body.style.height = '';
    } else {
      body.style.height = `${body.scrollHeight}px`;
      requestAnimationFrame(() => {
        body.style.height = '0px';
      });
      body.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'height') return;
        body.removeEventListener('transitionend', done);
        if (!row.classList.contains('is-open')) {
          body.hidden = true;
          body.style.height = '';
        }
      });
    }
  }
  /** Open one row (by element or resource id), closing the one before it. */
  function open(target) {
    const row = typeof target === 'string' ? rows.find((r) => r.dataset.resource === target) : target;
    if (!row) return;
    if (openRow && openRow !== row) setOpen(openRow, false);
    if (openRow === row) return;
    openRow = row;
    setOpen(row, true);
  }
  function close() {
    if (!openRow) return;
    setOpen(openRow, false);
    openRow = null;
  }
  function toggle(row) {
    if (openRow === row) close();
    else open(row);
  }

  heads.forEach((head, i) => {
    head.addEventListener('click', () => toggle(rows[i]));
    head.addEventListener('keydown', (e) => {
      // Arrow keys walk the rows; Home and End jump
      const k = e.key;
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(k)) return;
      e.preventDefault();
      const j = k === 'ArrowDown' ? Math.min(heads.length - 1, i + 1) : k === 'ArrowUp' ? Math.max(0, i - 1) : k === 'Home' ? 0 : heads.length - 1;
      heads[j].focus();
    });
  });
  // Escape closes the open row when the reader is in the index, or when nothing else on the page has the keys
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !openRow) return;
    const active = document.activeElement;
    const here = section.contains(active) || active === document.body || active === null;
    const busy = document.body.classList.contains('room-open') || document.body.classList.contains('curtain-open') || document.querySelector('#story-drawer')?.open;
    if (!here || busy) return;
    const head = openRow.querySelector('.carry-head');
    close();
    if (section.contains(active)) head.focus();
  });
  // Links elsewhere on the page can ask for a row (the hero's "Practise the conversation")
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-carry-row]');
    if (!a) return;
    const id = a.dataset.carryRow;
    // after the route has scrolled, open the row
    setTimeout(() => open(id), 350);
  });

  return {
    open,
    close,
    get openId() {
      return openRow?.dataset.resource || null;
    },
    rows: rows.length,
  };
}
