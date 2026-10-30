/// <reference types="jest" />
// Nonna's guided tutorial (P2).
import * as G from '../game';
import { coachStep, STEPS, TUTORIAL_DONE, tutorialAdvance, tutorialHoldsStory } from '../tutorial';

const opened = () => tutorialAdvance({ ...G.newGame(0), seenScenes: ['downtown-1'] });
const tap = (s: G.GameState, st: 'prep' | 'oven' | 'counter') => {
  const r = G.tapStation(s, 'downtown', st);
  return r.ok ? tutorialAdvance(r.state) : s;
};
const run = (s: G.GameState, seconds: number) => {
  for (let i = 0; i < seconds * 5; i++) s = tutorialAdvance(G.playTick(s, 0.2));
  return s;
};

describe('tutorial', () => {
  test('starts once the opening scene has played', () => {
    expect(tutorialAdvance(G.newGame(0)).tutorial).toBe(0);
    expect(coachStep(opened())?.target).toBe('prep');
  });
  test('walks prep → oven → watch → counter → cash → again → buy ovens → hire Marco, then ends', () => {
    let s = opened();
    const seen: number[] = [s.tutorial];
    const note = () => {
      if (seen[seen.length - 1] !== s.tutorial) seen.push(s.tutorial);
    };
    s = tap(s, 'prep');
    note();
    s = run(s, 3);
    s = tap(s, 'oven');
    note();
    s = run(s, 1);
    note();
    s = run(s, 4);
    note();
    s = tap(s, 'counter');
    note();
    s = run(s, 5);
    note();
    // play until the ovens are affordable, then buy them
    for (let k = 0; k < 400 && s.tutorial < 7; k++) {
      for (const st of ['counter', 'oven', 'prep'] as const) s = tap(s, st);
      s = run(s, 1);
    }
    note();
    expect(s.tutorial).toBe(7);
    expect(coachStep(s)?.target).toBe('walk-ovens');
    const b = G.buyUpgrade(s, 'downtown', 'ovens');
    expect(b.ok).toBe(true);
    if (b.ok) s = tutorialAdvance(b.state);
    note();
    expect(coachStep(s)?.target).toBe('goal');
    for (let k = 0; k < 400 && s.cash < G.headCost('downtown', 'prep'); k++) {
      for (const st of ['counter', 'oven', 'prep'] as const) s = tap(s, st);
      s = run(s, 1);
    }
    const h = G.buyUpgrade(s, 'downtown', 'headPrep');
    expect(h.ok).toBe(true);
    if (h.ok) s = tutorialAdvance(h.state);
    note();
    expect(s.tutorial).toBe(TUTORIAL_DONE);
    expect(coachStep(s)).toBeNull();
    // step 6 ("Again! Save up…") is skipped when the first sale already pays for the ovens
    expect(seen.filter((x) => x !== 6)).toEqual([1, 2, 3, 4, 5, 7, 8, TUTORIAL_DONE]);
  });
  test('the first batch is quick (≤ 3 s in the oven)', () => {
    const s = tap(run(tap(opened(), 'prep'), 3), 'oven');
    expect(s.shops.downtown.line.oven!.total).toBeLessThanOrEqual(3);
  });
  test('story scenes wait during steps 1–5 only', () => {
    expect(tutorialHoldsStory({ ...opened(), tutorial: 3 })).toBe(true);
    expect(tutorialHoldsStory({ ...opened(), tutorial: 6 })).toBe(false);
  });
  test('saves from before the tutorial skip it once pizza has been sold; new saves start it', () => {
    const v3 = JSON.parse(JSON.stringify(G.newGame(0)));
    delete v3.tutorial;
    v3.shops.downtown.sold = 12;
    expect(G.migrate(v3, 0).tutorial).toBe(TUTORIAL_DONE);
    const fresh = JSON.parse(JSON.stringify(G.newGame(0)));
    delete fresh.tutorial;
    expect(G.migrate(fresh, 0).tutorial).toBe(0);
  });
  test('Nonna taking over ends the tutorial', () => {
    expect(coachStep({ ...opened(), shops: { ...opened().shops, downtown: { ...opened().shops.downtown, managed: true } } })).toBeNull();
  });
  test('every step has short text and a docking side', () => {
    for (const st of STEPS) {
      expect(st.text.length).toBeLessThanOrEqual(90);
      expect(['low', 'high']).toContain(st.dock);
    }
  });
});
