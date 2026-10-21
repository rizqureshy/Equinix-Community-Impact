import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stories, sources, topics, chapterLead, principles } from '../../impact/scripts/content/stories.js';

const REQUIRED = [
  'id', 'topic', 'title', 'summary', 'organisation', 'location', 'humanContext',
  'equinixContribution', 'partnerContribution', 'outcome', 'sources',
  'verificationStatus', 'lastChecked', 'media', 'sceneTarget', 'shareSummary',
];
const textFields = (s) => [s.title, s.summary, s.humanContext, s.challenge, s.equinixContribution, s.partnerContribution, s.outcome, s.connection, s.shareSummary, s.conversationStarter];

describe('story content model', () => {
  it('has unique ids and every required field', () => {
    expect(new Set(stories.map((s) => s.id)).size).toBe(stories.length);
    for (const s of stories) for (const f of REQUIRED) expect(s[f], `${s.id}.${f}`).toBeDefined();
  });

  it('cites only registered sources, each with title, publisher and https URL', () => {
    for (const s of stories) {
      expect(s.sources.length, s.id).toBeGreaterThan(0);
      for (const id of s.sources) {
        const src = sources[id];
        expect(src, `${s.id} cites ${id}`).toBeDefined();
        expect(src.url).toMatch(/^https:\/\//);
        expect(src.title && src.publisher && src.supports).toBeTruthy();
      }
    }
  });

  it('never shows a metric without its scope and period', () => {
    for (const s of stories) {
      if (!s.metric) continue;
      expect(s.metricScope, s.id).toBeTruthy();
      expect(s.reportingPeriod, s.id).toBeTruthy();
    }
  });

  it('keeps original copy free of em dashes', () => {
    for (const s of stories) for (const t of textFields(s)) if (t) expect(t, s.id).not.toMatch(/—/);
  });

  it('marks generated media as illustrative and ships every file', () => {
    for (const s of stories) {
      for (const m of s.media) {
        expect(m.usage).toBe('illustrative');
        expect(m.alt.length).toBeGreaterThan(20);
        expect(m.provenance).toMatch(/Higgsfield/);
        const file = resolve('impact/public', m.path);
        expect(existsSync(file), file).toBe(true);
        expect(existsSync(file.replace('-1200.webp', '-640.webp'))).toBe(true);
      }
    }
  });

  it('leads every chapter with a story from that topic that has a scene target', () => {
    for (const t of topics) {
      const lead = stories.find((s) => s.id === chapterLead[t.id]);
      expect(lead?.topic).toBe(t.id);
      expect(lead.media.length).toBeGreaterThan(0);
    }
  });

  it('summarises five community principles', () => {
    expect(principles).toHaveLength(5);
  });

  it('does not use the phrase "powering hospitals"', () => {
    const all = JSON.stringify(stories) + readFileSync('impact/index.html', 'utf8');
    expect(all.toLowerCase()).not.toContain('powering hospitals');
  });
});
