/// <reference types="jest" />
// v5.20 (card C3): a save from before v7 counts the old nine tutorial steps; it lands on the same moment in the 15-step script.
import * as G from '../game';
import { coachStep } from '../tutorial';

const old = (tutorial: number | undefined, patch: Record<string, unknown> = {}) => {
  const raw = JSON.parse(JSON.stringify(G.newGame(0)));
  raw.saveVersion = 6;
  if (tutorial === undefined) delete raw.tutorial;
  else raw.tutorial = tutorial;
  return { ...raw, ...patch };
};

describe('the tutorial in a v6 save', () => {
  test('the save version is 10 and the tutorial ends at 18', () => {
    expect(G.SAVE_VERSION).toBe(10);
    expect(G.TUTORIAL_DONE).toBe(18);
    expect(G.migrate(old(3), 0).saveVersion).toBe(10);
  });
  // the table: old step → new step
  test.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 6],
    [7, 9],
    [8, 10],
    [9, 14],
    [10, 16],
  ])('old step %i lands on step %i', (before, after) => {
    expect(G.migrate(old(before), 0).tutorial).toBe(after);
    expect(G.legacyTutorial(before)).toBe(after);
  });
  test('an old save mid-tutorial lands on a step that can be shown', () => {
    for (const t of [1, 2, 3, 4, 5, 6, 7, 8, 9]) expect(coachStep(G.migrate(old(t, { seenScenes: ['downtown-1'] }), 0))).not.toBeNull();
  });
  test('a save with no tutorial: new (0) when nothing was sold, at the Store intro (16) once pizza was sold or the first shop is managed', () => {
    expect(G.migrate(old(undefined), 0).tutorial).toBe(0);
    const sold = old(undefined);
    sold.shops.downtown.sold = 12;
    expect(G.migrate(sold, 0).tutorial).toBe(16);
    const managed = old(undefined);
    managed.shops.downtown.managed = true;
    expect(G.migrate(managed, 0).tutorial).toBe(16);
  });
  test('a managed first shop is done (no coach), whatever step the save was at', () => {
    const raw = old(5);
    raw.shops.downtown.managed = true;
    expect(coachStep(G.migrate(raw, 0))?.id).toBe(16); // the Store intro, not a shop step
  });
  test('a v7 save keeps its own step (1..16; 17 is not kept: the Shop is shut on a load), and one out of range is clamped', () => {
    for (const t of [0, 1, 6, 7, 8, 9, 10, 11, 13, 15, 16]) expect(G.migrate({ ...old(t), saveVersion: 7 }, 0).tutorial).toBe(t);
    expect(G.migrate({ ...old(17), saveVersion: 8 }, 0).tutorial).toBe(16);
    expect(G.migrate({ ...old(99), saveVersion: 7 }, 0).tutorial).toBe(18);
    expect(G.migrate({ ...old(-4), saveVersion: 7 }, 0).tutorial).toBe(0);
  });
  test('a save with no version at all (before v1 tracked it) counts the old steps too', () => {
    const raw = old(8);
    delete raw.saveVersion;
    expect(G.migrate(raw, 0).tutorial).toBe(10);
  });
});

describe('a first shop that runs itself ends the tutorial (no overlay is drawn on it, so a look step could never end)', () => {
  test.each([1, 5, 6, 7, 8, 9, 10])('a managed v6 save at old step %i loads on the Store intro (the shop steps are over)', (before) => {
    const raw = old(before);
    raw.shops.downtown.managed = true;
    expect(G.migrate(raw, 0).tutorial).toBe(16);
  });
  test('a managed v7 save at any shop step loads on the Store intro', () => {
    for (const t of [6, 11, 12, 13, 15]) {
      const raw = { ...old(t), saveVersion: 7 };
      raw.shops.downtown.managed = true;
      expect(G.migrate(raw, 0).tutorial).toBe(16);
    }
  });
});

// v5.23 (card E6): a save that finished the 15 steps before the Store intro existed sees it once, unless it owns the Starter Pack
describe('the Store intro in an older save', () => {
  const at = (t: number, owned: boolean) => {
    const raw = { ...old(t), saveVersion: 9 };
    if (owned) raw.rewards.cosmetics = [...raw.rewards.cosmetics, 'awning-founder'];
    return raw;
  };
  test.each([16, 17])('a save at %i that does not own the pack lands on 16', (t) => expect(G.migrate(at(t, false), 0).tutorial).toBe(16));
  test.each([16, 17, 18])('a save at %i that owns the pack lands on 18', (t) => expect(G.migrate(at(t, true), 0).tutorial).toBe(18));
  test('a save at 18 stays done', () => expect(G.migrate(at(18, false), 0).tutorial).toBe(18));
});
