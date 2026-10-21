// Shared by both pages: toast, copy actions and the story dialog.
import { copyText, summaryText } from './clipboard.js';
import { getStory, sources } from './content/stories.js';
import { storyDetailHTML } from './content/render.js';
import { parseHash } from './router.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function createToast(el) {
  let timer = 0;
  return function notify(message, { error = false } = {}) {
    el.textContent = message;
    el.classList.toggle('is-error', error);
    el.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('is-visible'), 3200);
  };
}

function showManualCopy(button, text) {
  let box = button.parentElement.querySelector('.manual-copy');
  if (!box) {
    box = document.createElement('textarea');
    box.className = 'manual-copy';
    box.readOnly = true;
    box.rows = 4;
    box.setAttribute('aria-label', 'Text to copy');
    button.parentElement.appendChild(box);
  }
  box.value = text;
  box.focus();
  box.select();
}

/** Copy buttons anywhere on the page. `linkFor` builds the shareable story URL. */
export function setupCopy(notify, linkFor) {
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    const story = getStory(button.dataset.story);
    if (!story) return;
    const link = linkFor(story.id);
    const text = button.dataset.copy === 'link' ? link : summaryText(story, sources, link);
    if (await copyText(text)) notify(button.dataset.copy === 'link' ? 'Story link copied.' : 'Story summary copied, with its source.');
    else {
      notify('Could not copy automatically. The text is selected below for you to copy.', { error: true });
      showManualCopy(button, text);
    }
  });
}

/**
 * The story dialog: a modal with focus moved in on open and restored on close.
 * `fallbackHash` gives the hash to show when closing a story that was not
 * opened from inside the page (a direct link).
 */
export function createStoryDialog({ drawer, content, motion, fallbackHash, onOpen, onClose }) {
  let returnFocus = null;
  let openedByPush = false;

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-story-trigger]');
    if (trigger) {
      returnFocus = trigger;
      openedByPush = true;
    }
  });

  function open(id) {
    const story = getStory(id);
    if (!story) return;
    if (drawer.open && drawer.dataset.story === id) return;
    content.innerHTML = storyDetailHTML(story);
    drawer.dataset.story = id;
    content.scrollTop = 0;
    if (!drawer.open) {
      returnFocus ||= document.activeElement;
      drawer.showModal();
    }
    $('.drawer-close', drawer).focus();
    onOpen?.(story);
  }

  function finishClose() {
    drawer.classList.remove('is-closing');
    if (drawer.open) drawer.close();
    delete drawer.dataset.story;
    onClose?.();
    const target = returnFocus;
    returnFocus = null;
    if (target && target.isConnected) target.focus({ preventScroll: true });
  }

  function close() {
    if (!drawer.open) return;
    if (motion()) {
      drawer.classList.add('is-closing');
      setTimeout(finishClose, 190);
    } else finishClose();
  }

  /** Visitor asked to close: step back through history if we added the entry. */
  function requestClose() {
    if (openedByPush && parseHash(location.hash).story) {
      openedByPush = false;
      history.back();
    } else {
      history.replaceState(null, '', fallbackHash());
      close();
    }
  }

  drawer.addEventListener('cancel', (e) => {
    e.preventDefault();
    requestClose();
  });
  $('[data-drawer-close]', drawer).addEventListener('click', requestClose);
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) requestClose();
  });
  content.addEventListener(
    'scroll',
    () => {
      const max = content.scrollHeight - content.clientHeight;
      drawer.style.setProperty('--drawer-progress', `${max > 0 ? (content.scrollTop / max) * 100 : 100}%`);
    },
    { passive: true },
  );

  return {
    open,
    close,
    requestClose,
    get isOpen() {
      return drawer.open;
    },
  };
}

/** Motion preference shared by both pages; persists the visitor's choice. */
export function setupMotionToggle(button, { initial, onChange }) {
  const label = $('.motion-label', button);
  const render = (on) => {
    document.documentElement.dataset.motion = on ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(!on));
    label.textContent = on ? 'Pause motion' : 'Play motion';
  };
  let current = initial;
  render(current);
  const set = (on, persist) => {
    if (on === current) return;
    current = on;
    render(on);
    if (persist) {
      try {
        localStorage.setItem('impact-motion', on ? 'on' : 'off');
      } catch {
        /* storage unavailable: preference lasts for this visit */
      }
    }
    onChange(on);
  };
  button.addEventListener('click', () => set(!current, true));
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => set(!e.matches, false));
  return { get on() { return current; } };
}
