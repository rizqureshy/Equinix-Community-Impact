// A single state model coordinates the active topic, chapter, scene focus and
// open story. Views subscribe and render from it; nothing else holds this state.
import { topics, getStory } from './content/stories.js';

const topicTarget = Object.fromEntries(topics.map((t) => [t.id, t.sceneTarget]));

export function createStore(initial = {}) {
  let state = {
    topic: topics[0].id,
    section: 'top', // top | explore | <chapter id> | principles | people | share | sources
    focus: 'overview', // scene focus: overview or a place id
    story: null, // open story id
    motion: true,
    ...initial,
  };
  const listeners = new Set();

  function set(patch) {
    const prev = state;
    state = { ...state, ...patch };
    // Scene focus follows from section/topic/story unless set explicitly.
    if (!('focus' in patch)) state.focus = deriveFocus(state);
    for (const fn of listeners) fn(state, prev);
    return state;
  }

  return {
    get: () => state,
    set,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** Which place the scene should show for a given state. */
export function deriveFocus({ section, topic, story }) {
  if (story) return getStory(story)?.sceneTarget || 'overview';
  if (section === 'explore') return topicTarget[topic] || 'overview';
  if (topicTarget[section]) return topicTarget[section];
  return 'overview';
}

export { topicTarget };
