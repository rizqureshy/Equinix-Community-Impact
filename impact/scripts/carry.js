// The Carry the Story index on the page: the team's resources in four groups. Each group label is a disclosure;
// the rows inside are the links themselves, opening the file in a new tab. The first group starts open, the
// rest closed, so the index reads as four lines until you ask for more. Markup from carryHTML (content/resources.js).

/**
 * @param {HTMLElement} section
 * @param {object} opts
 * @param {() => boolean} [opts.motion]
 */
export function createCarry(section, { motion = () => true } = {}) {
  if (!section) return null;
  const groups = [...section.querySelectorAll('.carry-group')];
  const heads = groups.map((g) => g.querySelector('.carry-group-head'));
  const still = () => !motion() || matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setOpen(group, on) {
    const head = group.querySelector('.carry-group-head');
    const body = group.querySelector('.carry-group-body');
    if (group.classList.contains('is-open') === on) return;
    head.setAttribute('aria-expanded', String(on));
    group.classList.toggle('is-open', on);
    if (still()) {
      body.hidden = !on;
      body.style.height = '';
      return;
    }
    // the start height is committed with a forced reflow rather than a frame, so the move begins at once
    if (on) {
      body.hidden = false;
      body.style.height = '0px';
      const h = body.scrollHeight;
      void body.offsetHeight;
      body.style.height = `${h}px`;
    } else {
      body.style.height = `${body.scrollHeight}px`;
      void body.offsetHeight;
      body.style.height = '0px';
    }
    body.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'height') return;
      body.removeEventListener('transitionend', done);
      const isOpen = group.classList.contains('is-open');
      body.hidden = !isOpen;
      body.style.height = isOpen ? 'auto' : '';
    });
  }
  const find = (id) => groups.find((g) => g.dataset.group === id);
  const open = (id) => setOpen(find(id), true);
  const close = (id) => setOpen(find(id), false);
  const toggle = (group) => setOpen(group, !group.classList.contains('is-open'));

  heads.forEach((head, i) => {
    head.addEventListener('click', () => toggle(groups[i]));
    head.addEventListener('keydown', (e) => {
      const k = e.key;
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(k)) return;
      e.preventDefault();
      const j = k === 'ArrowDown' ? Math.min(heads.length - 1, i + 1) : k === 'ArrowUp' ? Math.max(0, i - 1) : k === 'Home' ? 0 : heads.length - 1;
      heads[j].focus();
    });
  });
  // Links elsewhere on the page can ask for a group (the hero's "Practise the conversation")
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-carry-group]');
    if (!a) return;
    const id = a.dataset.carryGroup;
    setTimeout(() => open(id), 350);
  });

  return {
    open,
    close,
    get openIds() {
      return groups.filter((g) => g.classList.contains('is-open')).map((g) => g.dataset.group);
    },
    groups: groups.length,
    rows: section.querySelectorAll('.carry-row').length,
  };
}
