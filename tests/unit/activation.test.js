import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { program, audiences, weeks, activities, materials, keyDates, paths, heard } from '../../impact/public/activation/program.js';

const REQUIRED = ['id', 'week', 'date', 'title', 'hook', 'brief', 'skill', 'share', 'why', 'steps', 'prompt', 'lenses', 'shareTemplate', 'check'];
const text = (a) => [a.title, a.hook, a.brief, a.skill, a.share, a.why, a.prompt, a.shareTemplate, a.check, a.note, a.carry, a.scope, ...a.steps.map((s) => s.text), ...Object.values(a.lenses), ...Object.values(a.byPath || {})];
const dow = (s) => new Date(`${s}T12:00:00`).getDay();

describe('public sector activation program', () => {
  it('has four weeks of five weekday activities, twenty in all, in date order', () => {
    expect(weeks.map((w) => w.num)).toEqual([1, 2, 3, 4]);
    expect(activities.length).toBe(20);
    for (const w of weeks) expect(activities.filter((a) => a.week === w.num).length).toBe(5);
    const dates = activities.map((a) => a.date);
    expect(new Set(dates).size).toBe(20);
    expect([...dates].sort()).toEqual(dates);
    for (const a of activities) {
      const w = weeks.find((x) => x.num === a.week);
      expect(a.date >= w.start && a.date <= w.end, `${a.id} inside its week`).toBe(true);
      expect([1, 2, 3, 4, 5]).toContain(dow(a.date));
    }
    expect(activities[0].date).toBe(program.start);
    expect(activities[19].date).toBe(program.end);
  });

  it('keeps Thanksgiving week free', () => {
    for (const a of activities) expect(a.date < program.breakStart || a.date > program.breakEnd, a.id).toBe(true);
    expect(dow(program.breakStart)).toBe(1);
    expect(dow(program.breakEnd)).toBe(5);
  });

  it('gives every activity its full guide: why, timed steps, prompt, four lenses, share template and check', () => {
    expect(new Set(activities.map((a) => a.id)).size).toBe(20);
    for (const a of activities) {
      for (const f of REQUIRED) expect(a[f], `${a.id}.${f}`).toBeTruthy();
      const minutes = a.steps.reduce((s, x) => s + x.min, 0);
      expect(minutes, `${a.id} takes ${minutes} minutes`).toBeGreaterThanOrEqual(15);
      expect(minutes, `${a.id} takes ${minutes} minutes`).toBeLessThanOrEqual(20);
      expect(a.steps.length).toBeGreaterThanOrEqual(4);
      for (const aud of audiences) expect(a.lenses[aud.id], `${a.id} lens ${aud.id}`).toBeTruthy();
      expect(a.prompt).toMatch(/\{[^}]+\}/);
      expect(a.shareTemplate).toMatch(/\{[^}]+\}/);
    }
  });

  it('gives Week 3 activities all three build paths', () => {
    for (const a of activities.filter((x) => x.week === 3)) {
      expect(a.paths, a.id).toBe(true);
      for (const p of paths) expect(a.byPath[p.id], `${a.id} path ${p.id}`).toBeTruthy();
      expect(a.prompt).toContain('{agent / app / dashboard}');
    }
    for (const a of activities.filter((x) => x.week !== 3)) expect(a.paths, a.id).toBeFalsy();
  });

  it('keeps the copy free of em dashes', () => {
    const all = [
      ...activities.flatMap(text),
      ...weeks.flatMap((w) => [w.name, w.outcome, w.coaching, w.note, w.carry, w.scope, ...w.verbs, ...w.videos.flatMap((v) => [v.title, v.about])]),
      ...materials.flatMap((m) => [m.name, m.meta]),
      ...keyDates.flatMap((k) => [k.label, k.detail]),
      ...heard.flatMap((h) => [h.heard, h.response]),
      program.summary, program.cohort, program.dataRule,
    ];
    for (const t of all) if (t) expect(t).not.toMatch(/—/);
  });

  it('lists videos per week with a title, a length and a link slot', () => {
    for (const w of weeks) {
      expect(w.videos.length, `week ${w.num}`).toBeGreaterThan(0);
      for (const v of w.videos) {
        expect(v.title && v.about).toBeTruthy();
        expect(v.minutes).toBeGreaterThan(0);
        expect('youtubeId' in v).toBe(true);
        if (v.youtubeId) expect(v.youtubeId).toMatch(/^[\w-]{11}$/);
      }
    }
  });

  it('maps every material and every key date onto the program', () => {
    for (const m of materials) for (const n of m.weeks) expect([1, 2, 3, 4]).toContain(n);
    for (const k of keyDates) expect(k.date >= program.start && k.date <= program.end, k.label).toBe(true);
    for (const h of heard) for (const n of h.weeks) expect([1, 2, 3, 4]).toContain(n);
  });

  it('ships the page, its stylesheet, script and font', () => {
    for (const f of ['index.html', 'activation.css', 'app.js', 'program.js', 'fonts/inter-tight-latin-wght-normal.woff2']) {
      expect(existsSync(resolve('impact/public/activation', f)), f).toBe(true);
    }
  });
});
