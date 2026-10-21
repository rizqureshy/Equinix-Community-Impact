import { describe, it, expect, vi } from 'vitest';
import { parseHash, hashFor, storyURL, anchorFor } from '../../impact/scripts/router.js';
import { createStore, deriveFocus } from '../../impact/scripts/state.js';
import { summaryText, copyText } from '../../impact/scripts/clipboard.js';
import { getStory, sources } from '../../impact/scripts/content/stories.js';

describe('router', () => {
  it('parses every route shape', () => {
    expect(parseHash('')).toEqual({ section: 'top' });
    expect(parseHash('#/')).toEqual({ section: 'top' });
    expect(parseHash('#/community')).toEqual({ section: 'journey' });
    expect(parseHash('#/promises')).toEqual({ section: 'promises' });
    // Older links keep working
    expect(parseHash('#/explore')).toEqual({ section: 'journey' });
    expect(parseHash('#/explore/discovery')).toEqual({ section: 'journey', topic: 'discovery' });
    expect(parseHash('#/principles')).toEqual({ section: 'promises' });
    expect(parseHash('#/chapter/care')).toEqual({ section: 'care', topic: 'care' });
    expect(parseHash('#/story/pa10-heat')).toEqual({ story: 'pa10-heat', section: 'resources', topic: 'resources' });
    expect(parseHash('#/people')).toEqual({ section: 'people' });
  });

  it('falls back safely for unknown routes', () => {
    expect(parseHash('#/story/not-a-story')).toEqual({ section: 'top' });
    expect(parseHash('#/chapter/unknown')).toEqual({ section: 'top' });
    expect(parseHash('#/explore/unknown')).toEqual({ section: 'journey' });
  });

  it('round-trips hashes', () => {
    for (const h of ['#/', '#/community', '#/promises', '#/chapter/community', '#/story/3verest', '#/sources']) {
      expect(hashFor(parseHash(h))).toBe(h);
    }
  });

  it('builds story links that keep the deployed base path', () => {
    const loc = { origin: 'https://example.github.io', pathname: '/Equinix-Community-Impact/', search: '' };
    expect(storyURL('3verest', loc)).toBe('https://example.github.io/Equinix-Community-Impact/#/story/3verest');
    const root = { origin: 'https://impact.pages.dev', pathname: '/', search: '' };
    expect(storyURL('pa10-heat', root)).toBe('https://impact.pages.dev/#/story/pa10-heat');
  });

  it('maps sections to anchors', () => {
    expect(anchorFor('care')).toBe('chapter-care');
    expect(anchorFor('people')).toBe('people');
    expect(anchorFor('journey')).toBe('community');
  });
});

describe('state', () => {
  it('derives scene focus from section, topic and story', () => {
    expect(deriveFocus({ section: 'top' })).toBe('overview');
    expect(deriveFocus({ section: 'journey', topic: 'discovery' })).toBe('research');
    expect(deriveFocus({ section: 'resources' })).toBe('aquatic');
    expect(deriveFocus({ section: 'share', story: 'efficient-operations' })).toBe('datacenter');
  });

  it('notifies subscribers with previous state and honours explicit focus', () => {
    const store = createStore();
    const seen = [];
    store.subscribe((s, prev) => seen.push([prev.focus, s.focus]));
    store.set({ section: 'care' });
    store.set({ focus: 'overview' });
    store.set({ story: 'childrens-cancer-institute' });
    expect(seen).toEqual([
      ['overview', 'hospital'],
      ['hospital', 'overview'],
      ['overview', 'research'],
    ]);
  });
});

describe('sharing', () => {
  it('builds an attributed summary with the source and story link', () => {
    const story = getStory('3verest');
    const text = summaryText(story, sources, 'https://x.test/#/story/3verest');
    expect(text).toContain(story.shareSummary);
    expect(text).toContain(sources.S1.url);
    expect(text).toContain('https://x.test/#/story/3verest');
  });

  it('reports failure when no clipboard path works', async () => {
    const doc = { createElement: () => { throw new Error('blocked'); } };
    vi.stubGlobal('navigator', {});
    expect(await copyText('x', doc)).toBe(false);
    vi.unstubAllGlobals();
  });
});
