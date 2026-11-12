/// <reference types="jest" />
import { BONUS, BONUS_VIEW, LUCKY_MULT } from '../../content/hooks';
import * as B from '../bonus';
import * as G from '../game';
import * as R from '../rewards';

const T0 = 1_700_000_000_000;

/** Downtown run by Nonna with the takeover scene seen: the golden pizza is unlocked and income is above zero. */
const unlocked = (seed = 12345): G.GameState => {
  const s = G.newGame(T0);
  return {
    ...s,
    tutorial: G.TUTORIAL_DONE,
    seenScenes: ['downtown-1', 'downtown-4'],
    shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, heads: G.allHeads() } },
    bonus: { ...s.bonus, seed },
  };
};

/** Play `seconds` in steps of `dt`, as the store's tick does (playSeconds first, then the schedule). */
function run(s: G.GameState, seconds: number, opts: { hold?: boolean; dt?: number; onStep?: (s: G.GameState) => void } = {}): G.GameState {
  const dt = opts.dt ?? 0.2;
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    s = B.bonusTick({ ...s, playSeconds: s.playSeconds + dt }, dt, !!opts.hold);
    opts.onStep?.(s);
  }
  return s;
}

/** Play until a golden pizza is up; returns the state and the play seconds it took. */
function untilVisible(s: G.GameState, limit = 400): G.GameState {
  const start = s.playSeconds;
  let out = s;
  for (let t = 0; t < limit && !B.bonusVisible(out); t += 0.2) out = run(out, 0.2);
  if (!B.bonusVisible(out)) throw new Error(`no golden pizza within ${limit}s of ${start}`);
  return out;
}

describe('the golden pizza schedule', () => {
  test('it unlocks with the rewards: nothing flies before Nonna takes over', () => {
    const s = { ...G.newGame(T0), shops: { ...G.newGame(T0).shops } };
    expect(B.bonusUnlocked(s)).toBe(false);
    const after = run(s, 600);
    expect(after.bonus.spawned).toBe(0);
    expect(B.bonusVisible(after)).toBe(false);
  });

  test('D445: the first is scripted for right after the unlock (2 s), not 20 s in, and stays 12 s', () => {
    const s = unlocked();
    const before = run(s, 1.4);
    expect(B.bonusVisible(before)).toBe(false);
    const up = untilVisible(before);
    expect(up.playSeconds).toBeGreaterThanOrEqual(BONUS.firstAfterUnlock);
    expect(up.playSeconds).toBeLessThan(BONUS.firstAfterUnlock + 0.5);
    expect(up.bonus.spawned).toBe(1);
    expect(up.bonus.until - up.playSeconds).toBeCloseTo(BONUS.visibleSeconds, 5);
    // still there 11.5 s on, gone a moment after 12 s
    expect(B.bonusVisible(run(up, 11.4))).toBe(true);
    expect(B.bonusVisible(run(up, 12.4))).toBe(false);
  });

  test('then one every 75–120 s of play, from when the last one left', () => {
    let s = unlocked();
    const appearances: number[] = [];
    let was = false;
    let leftAt: number | null = null;
    const gaps: number[] = [];
    s = run(s, 2400, {
      onStep: (st) => {
        const v = B.bonusVisible(st);
        if (v && !was) {
          appearances.push(st.playSeconds);
          if (leftAt !== null) gaps.push(st.playSeconds - leftAt);
        }
        if (!v && was) leftAt = st.playSeconds;
        was = v;
      },
    });
    expect(appearances.length).toBeGreaterThanOrEqual(15);
    for (const g of gaps) {
      expect(g).toBeGreaterThanOrEqual(BONUS.gapMin - 0.3);
      expect(g).toBeLessThanOrEqual(BONUS.gapMax + 0.3);
    }
    expect(s.bonus.spawned).toBe(appearances.length);
  });

  test('it is deterministic from the seed', () => {
    const times = (seed: number) => {
      const out: number[] = [];
      let was = false;
      run(unlocked(seed), 900, { onStep: (st) => { const v = B.bonusVisible(st); if (v && !was) out.push(st.playSeconds); was = v; } });
      return out;
    };
    expect(times(7)).toEqual(times(7));
    expect(times(7)).not.toEqual(times(8));
    // the gaps and the flight paths are pure functions of (seed, n)
    expect(B.bonusGap(7, 3)).toBe(B.bonusGap(7, 3));
    expect(B.bonusPath(7, 3)).toEqual(B.bonusPath(7, 3));
  });

  test('gaps stay in range and paths use both directions and the whole band', () => {
    const dirs = new Set<number>();
    let minLane = 1;
    let maxLane = 0;
    for (let n = 1; n <= 200; n++) {
      const g = B.bonusGap(99, n);
      expect(g).toBeGreaterThanOrEqual(BONUS.gapMin);
      expect(g).toBeLessThanOrEqual(BONUS.gapMax);
      const p = B.bonusPath(99, n);
      dirs.add(p.dir);
      minLane = Math.min(minLane, p.lane);
      maxLane = Math.max(maxLane, p.lane);
      expect(p.phase).toBeGreaterThanOrEqual(0);
      expect(p.phase).toBeLessThan(1);
    }
    expect([...dirs].sort()).toEqual([-1, 1]);
    expect(minLane).toBeLessThan(0.1);
    expect(maxLane).toBeGreaterThan(0.9);
    // left to right enters on the left, right to left on the right
    expect(B.flightX({ dir: 1, lane: 0, phase: 0 }, 0)).toBe(0);
    expect(B.flightX({ dir: -1, lane: 0, phase: 0 }, 0)).toBe(1);
  });

  test('a quiet tick returns the very same state (identity), and a spawn keeps stats and rewards identity', () => {
    const s = unlocked();
    const quiet = { ...s, playSeconds: 3, bonus: { ...s.bonus, next: 3 + BONUS.firstAfterUnlock } };
    expect(B.bonusTick(quiet, 0.2, false)).toBe(quiet);
    const due = { ...s, playSeconds: BONUS.firstAtPlay };
    const up = B.bonusTick(due, 0.2, false);
    expect(up).not.toBe(due);
    expect(up.stats).toBe(due.stats);
    expect(up.rewards).toBe(due.rewards);
    expect(B.bonusTick(due, 0, false)).toBe(due);
  });

  test('nothing appears while a scene, popup or drawer holds it, and the one on screen keeps its time', () => {
    const s = unlocked();
    const held = run(s, 300, { hold: true });
    expect(held.bonus.spawned).toBe(0);
    // released, it comes at once (it was due long ago)
    const out = run(held, 0.2);
    expect(B.bonusVisible(out)).toBe(true);
    // a hold on the one that is up freezes its clock
    const remaining = out.bonus.until - out.playSeconds;
    const frozen = run(out, 60, { hold: true });
    expect(B.bonusVisible(frozen)).toBe(true);
    expect(frozen.bonus.until - frozen.playSeconds).toBeCloseTo(remaining, 5);
    expect(B.bonusVisible(run(frozen, remaining + 0.4))).toBe(false);
  });
});

describe('what a tap pays', () => {
  const rich = (): G.GameState => {
    const s = unlocked();
    return untilVisible({ ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep: 20, ovens: 20, counter: 20, drivers: 12, tables: 8 } } });
  };

  test('45 s of citywide income, in cash and totalEarned, counted in stats.bonusTaps', () => {
    const s = rich();
    const income = R.rewardIncome(s);
    expect(income).toBeGreaterThan(1);
    const r = B.collectBonus(s)!;
    expect(r.lucky).toBe(false);
    expect(r.paid).toBeCloseTo(income * BONUS.incomeSeconds, 6);
    expect(r.paid).toBeCloseTo(R.minutesToCash(s, 0.75), 6);
    expect(r.state.cash).toBeCloseTo(s.cash + r.paid, 6);
    expect(r.state.totalEarned).toBeCloseTo(s.totalEarned + r.paid, 6);
    expect(r.state.stats.bonusTaps).toBe(1);
    expect(B.bonusVisible(r.state)).toBe(false);
    // the next one is a gap away
    expect(r.state.bonus.next - r.state.playSeconds).toBe(B.bonusGap(s.bonus.seed, s.bonus.spawned));
  });

  test('never less than $5, and a boost does not inflate it', () => {
    let s = untilVisible(unlocked());
    s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: false, heads: G.noHeads() } } }; // nothing runs itself: no income
    expect(R.rewardIncome(s)).toBe(0);
    expect(B.collectBonus(s)!.paid).toBe(BONUS.minPayout);
    const plain = rich();
    const boosted = { ...plain, rewards: { ...plain.rewards, boosts: [{ mult: 5, until: Date.now() + 3600_000, source: 'booster' }], lastSeen: 0 } };
    expect(B.collectBonus(boosted)!.paid).toBeCloseTo(B.collectBonus(plain)!.paid, 9);
  });

  test('every 5th is the lucky slice: 3 min of income, ×4 a normal one', () => {
    expect(LUCKY_MULT).toBe(4);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14].map(B.isLucky)).toEqual([false, false, false, false, true, false, false, false, false, true, true]);
    let s = rich();
    const normal = B.collectBonus(s)!.paid;
    const paid: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      s = untilVisible({ ...s, bonus: { ...s.bonus, until: 0, next: s.playSeconds } });
      const r = B.collectBonus(s)!;
      paid.push(r.lucky);
      if (r.lucky) expect(r.paid).toBeCloseTo(normal * LUCKY_MULT, 4);
      s = r.state;
    }
    expect(paid).toEqual([false, false, false, false, true, false, false, false, false, true]);
    expect(s.stats.bonusTaps).toBe(10);
  });

  test('the pips count the run of five', () => {
    expect([0, 1, 2, 3, 4, 5].map((t) => B.streakPips(t).filled)).toEqual([0, 1, 2, 3, 4, 0]);
    expect(B.streakPips(4)).toEqual({ filled: 4, total: 5, lucky: true });
    expect(B.streakPips(2).lucky).toBe(false);
  });

  test('a tap with nothing on screen does nothing', () => {
    expect(B.collectBonus(unlocked())).toBeNull();
    const up = untilVisible(unlocked());
    const gone = B.collectBonus(up)!.state;
    expect(B.collectBonus(gone)).toBeNull();
  });
});

describe('time away', () => {
  test('the pizza on screen when the game closed loses the time away, and is gone when it would have left', () => {
    const up = untilVisible(unlocked());
    const left = up.bonus.until - up.playSeconds;
    const brief = B.bonusAway(up, 3);
    expect(B.bonusVisible(brief)).toBe(true);
    expect(brief.bonus.until - brief.playSeconds).toBeCloseTo(left - 3, 6);
    const long = B.bonusAway(up, 600);
    expect(B.bonusVisible(long)).toBe(false);
    expect(long.bonus.until).toBe(0);
    // with none on screen there is nothing to change
    const idle = unlocked();
    expect(B.bonusAway(idle, 600)).toBe(idle);
  });
});

describe('v5.14 fix round (G93, D437, D438, D445, D446)', () => {
  const WIDTH = 390;
  const BOX_H = BONUS_VIEW.height * BONUS_VIEW.scale;

  test('G93: the pop keeps its whole width on screen, so "+" and "LUCKY" are never cut', () => {
    const lo = BONUS_VIEW.popEdge;
    const hi = WIDTH - BONUS_VIEW.popWidth - BONUS_VIEW.popEdge;
    // the old placement was x - 90 with no clamp: a tap at x = 20 started at -70
    expect(B.popPlace(20, 40, WIDTH, BOX_H).left).toBe(lo);
    expect(B.popPlace(WIDTH - 5, 40, WIDTH, BOX_H).left).toBe(hi);
    expect(B.popPlace(195, 40, WIDTH, BOX_H).left).toBe(195 - BONUS_VIEW.popWidth / 2);
    for (let x = -50; x <= WIDTH + 50; x += 7) {
      const { left } = B.popPlace(x, 40, WIDTH, BOX_H);
      expect(left).toBeGreaterThanOrEqual(lo);
      expect(left + BONUS_VIEW.popWidth).toBeLessThanOrEqual(WIDTH - BONUS_VIEW.popEdge);
    }
  });

  test('G93: in the top lane the pop drops below the box instead of rising out of the scene', () => {
    const p = B.popPlace(200, 30, WIDTH, BOX_H);
    expect(p.top).toBeGreaterThan(30 + BOX_H / 2);
    expect(p.top).toBeGreaterThanOrEqual(0);
    // a very narrow scene still gives a sane left
    expect(B.popPlace(10, 10, 150, BOX_H).left).toBe(BONUS_VIEW.popEdge);
  });

  test('D437: 1.3x for every pizza, 1.6x for the lucky slice; the drawn box stays at least 44 pt', () => {
    expect(B.bonusScale(false)).toBe(1.3);
    expect(B.bonusScale(true)).toBe(1.6);
    expect(BONUS_VIEW.height * B.bonusScale(false)).toBeGreaterThanOrEqual(44);
    expect(BONUS_VIEW.width * B.bonusScale(false)).toBeGreaterThanOrEqual(44);
    expect(BONUS_VIEW.glowPx).toBe(10);
  });

  test('D437: three sparkles trail behind the flight, on the side it came from', () => {
    const right = B.sparkleTrail(1);
    const left = B.sparkleTrail(-1);
    expect(right).toHaveLength(3);
    expect(right.every((p) => p.x < 0)).toBe(true);
    expect(left.every((p) => p.x > 0)).toBe(true);
    expect(right.map((p) => p.x)).toEqual([...right.map((p) => p.x)].sort((a, b) => b - a));
  });

  test('D438: the streak label reads "4/5" with four taps made', () => {
    expect([0, 1, 4, 5, 9].map(B.pipsLabel)).toEqual(['0/5', '1/5', '4/5', '0/5', '4/5']);
  });

  test('D446: the pop says what the payout is worth in time', () => {
    expect(B.salesLine(false)).toBe('+45 s of sales');
    expect(B.salesLine(true)).toBe('+3 min of sales');
  });

  test('D445: only the very first pizza, with no tap yet, is the gift', () => {
    expect(B.isFirstGift(1, 0)).toBe(true);
    expect(B.isFirstGift(2, 0)).toBe(false);
    expect(B.isFirstGift(1, 1)).toBe(false);
  });

  test('D445: a save loaded after the takeover with the first still unsent gets it 2 s in, not 20 s; later ones keep their gaps', () => {
    const s = { ...unlocked(), playSeconds: 500 };
    const loaded = { ...s, bonus: { ...s.bonus, next: 520 } };
    const t1 = B.bonusTick({ ...loaded, playSeconds: 500.2 }, 0.2, false);
    expect(t1.bonus.next).toBeCloseTo(500.2 + BONUS.firstAfterUnlock, 6);
    const up = untilVisible(loaded);
    expect(up.playSeconds - 500).toBeLessThan(BONUS.firstAfterUnlock + 0.5);
    // held back by a scene: no pull-in, nothing appears
    expect(B.bonusTick({ ...loaded, playSeconds: 500.2 }, 0.2, true).bonus.next).toBe(520);
    // not the first: the schedule is the gap it was given
    const second = { ...loaded, bonus: { ...loaded.bonus, spawned: 1, next: 600 } };
    expect(B.bonusTick({ ...second, playSeconds: 500.2 }, 0.2, false).bonus.next).toBe(600);
  });
});
