import { describe, it, expect } from 'vitest';
import { figures, pitchBeats, leaveBehind, buildDrill, scoreTeachBack, scenarios, debrief, GRADE_POINTS } from '../../impact/scripts/prototypes/learn-core.js';
import { stories, topics } from '../../impact/scripts/content/stories.js';

const seeded = (seed) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const text = (...parts) => parts.join(' ');

describe('learner sketches: figures', () => {
  it('lists every story that carries a figure, each with scope, period and a source', () => {
    const fs = figures();
    expect(fs.length).toBe(stories.filter((s) => s.metric).length);
    for (const f of fs) expect(f.scope && f.period && f.source, f.id).toBeTruthy();
  });
});

describe('pitch mode', () => {
  it('gives five beats of ninety seconds for each chapter and for all five', () => {
    for (const t of [...topics.map((t) => t.id), 'all']) {
      const beats = pitchBeats(t);
      expect(beats.length, t).toBe(5);
      expect(beats.reduce((a, b) => a + b.seconds, 0), t).toBe(90);
      for (const b of beats) expect(b.say && b.kind && b.sourceIds.length, `${t} ${b.kind}`).toBeTruthy();
    }
  });
  it('says the caveat with every spoken figure', () => {
    for (const t of topics.map((t) => t.id)) {
      const fig = pitchBeats(t).find((b) => b.kind === 'Figure');
      if (fig) expect(fig.caveat, t).toMatch(/Period:/);
    }
  });
  it('writes a leave-behind with sources and the house rule, free of em dashes', () => {
    const lb = leaveBehind('resources');
    expect(lb.refs.length).toBeGreaterThan(0);
    expect(lb.text).toMatch(/Sources/);
    expect(lb.text).toMatch(/scope and period/);
    expect(lb.text).not.toMatch(/—/);
    for (const r of lb.refs) expect(r.url).toMatch(/^https:\/\//);
  });
});

describe('scope check', () => {
  it('deals cards whose options always include the true answer and two real distractors', () => {
    const deck = buildDrill(seeded(7), 9);
    expect(deck.length).toBe(9);
    for (const card of deck) {
      expect(card.steps.length).toBe(3);
      for (const st of card.steps) {
        expect(st.options.length, `${card.id} ${st.key}`).toBe(3);
        expect(st.options).toContain(st.answer);
        expect(new Set(st.options).size).toBe(3);
      }
    }
  });
  it('is reproducible from a seed', () => {
    expect(buildDrill(seeded(3), 5).map((c) => c.id)).toEqual(buildDrill(seeded(3), 5).map((c) => c.id));
  });
});

describe('teach-back scoring', () => {
  it('gives full marks to a teach-back that carries who, figure, scope, source and role', () => {
    const r = scoreTeachBack('pa10-heat', text(
      'In Saint-Denis, Equinix PA10 recovers heat from customer servers and exports it to the heat network that supplies the Olympic Aquatics Centre.',
      'Equinix expects more than 1,000 homes to be warmed, free of charge for 15 years. That is from the Equinix blog in April 2025.',
      'The network operator distributes the heat; Equinix provides it.',
    ), 48);
    expect(r.score).toBe(5);
    expect(r.flags).toEqual([]);
    expect(r.feedback.caveat).toMatch(/carried scope, period and source/);
    expect(r.pace).toBeGreaterThan(0);
  });
  it('flags "powering hospitals" and a figure that lost its caveat', () => {
    const r = scoreTeachBack('pa10-heat', 'We heat the Olympic pool and a thousand homes in Paris. Equinix is powering hospitals too.', 20);
    expect(r.flags.some((f) => /powering hospitals/i.test(f))).toBe(true);
    expect(r.flags.some((f) => /expected/.test(f))).toBe(true);
    expect(r.checks.find((c) => c.key === 'scope').ok).toBe(false);
    expect(r.feedback.tighten).toBe(r.flags[0]);
  });
  it('asks for scope and source when the figure travels alone', () => {
    const r = scoreTeachBack('community-principles', 'Equinix spent 95 million dollars with small businesses. Local leaders set the priorities.', 15);
    expect(r.checks.find((c) => c.key === 'figure').ok).toBe(true);
    expect(r.checks.find((c) => c.key === 'source').ok).toBe(false);
    expect(r.feedback.caveat).toMatch(/needs/);
  });
  it('rewards restraint on a story with no headline figure', () => {
    const r = scoreTeachBack('childrens-cancer-institute', "Children's Cancer Institute in Sydney compares genomic data with Philadelphia, Memphis and Heidelberg over Equinix Fabric. The customer story says the science is theirs; Equinix provides the private connection.", 30);
    expect(r.checks.find((c) => c.key === 'figure').ok).toBe(true);
    expect(r.score).toBe(5);
    expect(r.feedback.caveat).toMatch(/No figure/);
  });
  it('catches the renewable coverage definition', () => {
    const r = scoreTeachBack('efficient-operations', 'Equinix is 96 percent renewable.', 5);
    expect(r.flags.some((f) => /coverage/.test(f))).toBe(true);
  });
  it('handles an empty transcript', () => {
    const r = scoreTeachBack('3verest', '', 0);
    expect(r.score).toBe(0);
    expect(r.feedback.landed).toMatch(/Nothing heard/);
  });
});

describe('choose the reply', () => {
  it('has four conversations of three turns with one best, one ok and one weak reply each', () => {
    expect(scenarios.length).toBe(4);
    for (const sc of scenarios) {
      expect(sc.turns.length).toBe(3);
      for (const t of sc.turns) {
        expect(t.replies.map((r) => r.grade).sort()).toEqual(['best', 'ok', 'weak']);
        for (const r of t.replies) expect(r.text && r.reaction && r.note, sc.id).toBeTruthy();
      }
    }
  });
  it('keeps every reply and note free of em dashes and never says "powering hospitals" except to forbid it', () => {
    for (const sc of scenarios) for (const t of sc.turns) {
      expect(t.line).not.toMatch(/—/);
      for (const r of t.replies) {
        expect(r.text + r.reaction + r.note).not.toMatch(/—/);
        if (r.grade === 'best') expect(r.text).not.toMatch(/power(ing)? hospitals/i);
      }
    }
  });
  it('debriefs with points and the note for each turn', () => {
    const best = scenarios[0].turns.map((t) => t.replies.findIndex((r) => r.grade === 'best'));
    const d = debrief('customer', best);
    expect(d.points).toBe(6);
    expect(d.max).toBe(6);
    expect(d.rows.every((r) => r.points === GRADE_POINTS.best)).toBe(true);
    const weak = scenarios[0].turns.map((t) => t.replies.findIndex((r) => r.grade === 'weak'));
    expect(debrief('customer', weak).points).toBe(0);
  });
});
