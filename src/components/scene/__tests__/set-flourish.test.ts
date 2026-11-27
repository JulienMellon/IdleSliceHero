/// <reference types="jest" />
// The once-per-set flourish (card S5): which shop it plays in, that it plays once per completion, its 3 s, and the words of the bubble.
import { SETS } from '../../../content/catalog';
import { CONFETTI_STEPS } from '../ladder';
import { buildCast, type CastMember } from '../cast';
import { emptyCrew } from '../crew';
import { limbGeom } from '../geometry';
import { seatPalette } from '../palette';
import { layout } from './draw-layout';
import {
  FLOURISH_BUBBLE_DROP,
  FLOURISH_SECONDS,
  crestOpacity,
  crestScale,
  flourishAge,
  flourishConfetti,
  flourishDue,
  flourishKey,
  flourishLine,
  flourishOn,
  hoodOfSet,
  seedPlayed,
} from '../set-flourish';

const NOW = 1_700_000_000_000;

describe('which shop celebrates', () => {
  test('every set belongs to one shop, and only that shop starts its flourish', () => {
    for (const s of SETS) {
      expect(hoodOfSet(s.id)).toBe(s.hood);
      const done = [{ set: s.id, at: NOW }];
      expect(flourishDue(done, s.hood, new Set())).toEqual(done[0]);
      for (const other of SETS.filter((o) => o.hood !== s.hood)) expect(flourishDue(done, other.hood, new Set())).toBeNull();
    }
    expect(hoodOfSet('nonesuch')).toBeUndefined();
  });
  test('once per completion: a played entry starts nothing, and a distinct entry of the same shop does', () => {
    const a = { set: 'classic', at: NOW };
    const played = new Set([flourishKey(a)]);
    expect(flourishDue([a], 'downtown', played)).toBeNull();
    expect(flourishDue([a, { set: 'classic', at: NOW + 1 }], 'downtown', played)).toEqual({ set: 'classic', at: NOW + 1 });
  });
  test('a loaded save never replays: its sets are seeded as played, even when stamped after the process started, and only a later completion plays', () => {
    const loaded = SETS.map((s, i) => ({ set: s.id, at: NOW + 1000 * i }));
    const played = new Set<string>();
    seedPlayed(played, loaded);
    for (const s of SETS) expect(flourishDue(loaded, s.hood, played)).toBeNull();
    const bought = [...loaded, { set: 'classic', at: NOW + 90_000 }];
    expect(flourishDue(bought, 'downtown', played)).toEqual({ set: 'classic', at: NOW + 90_000 });
    expect(flourishDue(bought, 'suburbs', played)).toBeNull();
  });
  test('a completion stamped while the scene was covered (the Shop route open, the app in the background) plays once, on the first visible frame, in its own shop only', () => {
    // the scene asks only on frames where it is visible, so what "plays on the first visible frame" means is: no age limit, and the key is spent when it plays
    const done = [{ set: 'brick', at: NOW + 5_000 }];
    const played = new Set<string>();
    expect(flourishDue(done, 'suburbs', played)).toBeNull();
    const first = flourishDue(done, 'industrial', played);
    expect(first).toEqual(done[0]);
    played.add(flourishKey(first!));
    expect(flourishDue(done, 'industrial', played)).toBeNull();
  });
});

describe('the 3 seconds', () => {
  const f = { set: 'diner', key: 'diner@1', at: 10, text: 'Deb: Matching set.' };
  test('on from its start for exactly 3 s', () => {
    expect(FLOURISH_SECONDS).toBe(3);
    expect(flourishOn(flourishAge(null, 10))).toBe(false);
    expect(flourishOn(flourishAge(f, 9.9))).toBe(false);
    expect(flourishOn(flourishAge(f, 10))).toBe(true);
    expect(flourishOn(flourishAge(f, 12.99))).toBe(true);
    expect(flourishOn(flourishAge(f, 13))).toBe(false);
  });
  test('the confetti is two bursts of the milestone steps and is never bare while on', () => {
    const steps = Array.from({ length: 300 }, (_, i) => flourishConfetti(i * 0.01));
    expect(steps.every((s) => s >= 0 && s < CONFETTI_STEPS)).toBe(true);
    expect(steps.filter((s, i) => i > 0 && s < steps[i - 1])).toHaveLength(1);
    expect(flourishConfetti(3)).toBe(-1);
    expect(flourishConfetti(-1)).toBe(-1);
  });
  test("the line carries the manager's name only once they have been met", () => {
    expect(flourishLine('Deb', 'Matching set.')).toBe('Deb: Matching set.');
    expect(flourishLine(null, 'Matching set.')).toBe('Matching set.');
  });
});

describe('the payoff', () => {
  test('the crest pops in, holds, then fades out inside the 3 s', () => {
    expect(crestScale(-0.1)).toBe(0);
    expect(crestScale(0)).toBeLessThan(1);
    expect(Math.max(...Array.from({ length: 40 }, (_, i) => crestScale(i * 0.01)))).toBeGreaterThan(1);
    expect(crestScale(1.5)).toBe(1);
    expect(crestOpacity(1.5)).toBe(1);
    expect(crestOpacity(2.9)).toBeLessThan(1);
    expect(crestOpacity(3)).toBe(0);
    expect(crestScale(3)).toBe(0);
  });
  test('the bubble hangs 30 pt lower than the barks do, clear of the menu board', () => {
    expect(FLOURISH_BUBBLE_DROP).toBe(30);
  });
});

describe('the diners cheer', () => {
  const lay = layout(2, 3, 3, 2, 6, 3, 1);
  const input = (celebrate: boolean) => ({
    lay,
    shop: { drivers: 3, tables: 6, prep: 60 },
    running: true,
    pace: 1,
    clock: 4,
    shopSeed: 388,
    nIdx: 1,
    pal: seatPalette(2, 1, 8, 6, lay.tables.length),
    crew: emptyCrew(),
    celebrate,
  });
  test('every seated diner raises both arms and smiles; the others stay as they were', () => {
    const calm = buildCast(input(false)).cast;
    const party = buildCast(input(true)).cast;
    const seated = (c: CastMember) => c.props.kind === 'sit';
    expect(party.filter(seated).length).toBeGreaterThan(0);
    for (const c of party.filter(seated)) {
      expect(c.props.act).toBe('cheer');
      expect(c.props.mood).toBe('happy');
    }
    for (const c of calm.filter(seated)) expect(c.props.act).not.toBe('cheer');
  });
  test('nobody moves: the same people stand and sit in the same places', () => {
    const at = (cast: CastMember[]) => cast.map((c) => [c.key, c.props.x, c.props.y]);
    expect(at(buildCast(input(true)).cast)).toEqual(at(buildCast(input(false)).cast));
  });
  test('a seated cheer lifts the hand above the shoulder, like a standing one', () => {
    const seated = limbGeom({ kind: 'sit', act: 'cheer', carry: false, carryWalk: false, step: 0, arm: 0, tall: 0 });
    const eating = limbGeom({ kind: 'sit', act: 'none', carry: false, carryWalk: false, step: 0, arm: 0, tall: 0 });
    expect(seated.hand[1]).toBeLessThan(seated.by - 20);
    expect(seated.backHand[1]).toBe(seated.hand[1]);
    expect(seated.backHand[0]).toBe(-seated.hand[0]);
    expect(eating.hand[1]).toBeGreaterThan(eating.by);
  });
});
