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
  test('the save version is 7 and the tutorial ends at 16', () => {
    expect(G.SAVE_VERSION).toBe(7);
    expect(G.TUTORIAL_DONE).toBe(16);
    expect(G.migrate(old(3), 0).saveVersion).toBe(7);
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
  test('a save with no tutorial: new (0) when nothing was sold, done (16) once pizza was sold or the first shop is managed', () => {
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
    expect(coachStep(G.migrate(raw, 0))).toBeNull();
  });
  test('a v7 save keeps its own step (1..16), and one out of range is clamped', () => {
    for (const t of [0, 1, 6, 7, 8, 9, 10, 11, 13, 15, 16]) expect(G.migrate({ ...old(t), saveVersion: 7 }, 0).tutorial).toBe(t);
    expect(G.migrate({ ...old(99), saveVersion: 7 }, 0).tutorial).toBe(16);
    expect(G.migrate({ ...old(-4), saveVersion: 7 }, 0).tutorial).toBe(0);
  });
  test('a save with no version at all (before v1 tracked it) counts the old steps too', () => {
    const raw = old(8);
    delete raw.saveVersion;
    expect(G.migrate(raw, 0).tutorial).toBe(10);
  });
});
