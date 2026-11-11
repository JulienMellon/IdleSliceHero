/// <reference types="jest" />
import { DAILY_POOL, DAILY_TASK_REWARD, TASK_KINDS, TASK_TEXT } from '../../content/rewards';
import { BONUS, ORDER } from '../../content/hooks';
import { TUNING } from '../../content/tuning';
import * as G from '../game';
import * as R from '../rewards';

const T0 = new Date(2026, 10, 11, 12, 0, 0).getTime();

describe('G92: "Capped at 4h (away 4h)" on an uncapped return', () => {
  const away = (seconds: number) => {
    const s = { ...G.newGame(T0), lastSavedAt: T0 };
    return G.applyOffline(s, T0 + seconds * 1000);
  };
  const cap = TUNING.offlineCapSeconds;

  test('not capped when away exactly the cap, or a few seconds over', () => {
    expect(away(cap).capped).toBe(false);
    expect(away(cap + 5).capped).toBe(false);
    expect(away(cap + 59).capped).toBe(false);
    expect(away(cap - 1).capped).toBe(false);
  });

  test('capped once away exceeds the cap by a minute or more; the time paid is still the cap', () => {
    expect(away(cap + 60).capped).toBe(true);
    const long = away(cap + 3600);
    expect(long.capped).toBe(true);
    expect(long.seconds).toBe(cap);
    expect(long.awaySeconds).toBe(cap + 3600);
    // a few seconds over is still paid at the cap and no more
    expect(away(cap + 5).seconds).toBe(cap);
  });
});

describe('saves from before v5.13', () => {
  test('load with safe defaults: no bonus due early, no order, zero counters', () => {
    const old = JSON.parse(JSON.stringify(G.newGame(T0)));
    delete old.bonus;
    delete old.order;
    delete old.stats.bonusTaps;
    delete old.stats.ordersDone;
    old.playSeconds = 500;
    const m = G.migrate(old, T0);
    expect(m.saveVersion).toBe(G.SAVE_VERSION);
    expect(m.stats.bonusTaps).toBe(0);
    expect(m.stats.ordersDone).toBe(0);
    expect(m.bonus).toMatchObject({ spawned: 0, next: 500 + BONUS.firstAtPlay, until: 0 });
    expect(m.order).toMatchObject({ made: 0, nextAt: 500 + ORDER.firstOfferAtPlay, offer: null, active: null, result: null });
    // a save with no stats at all, and a v1-style save, still load
    expect(G.migrate({ cash: 5 }, T0).bonus.until).toBe(0);
    expect(G.migrate(null, T0).order.active).toBeNull();
  });

  test('garbage in the new fields is dropped', () => {
    const s = JSON.parse(JSON.stringify(G.newGame(T0)));
    s.bonus = { seed: 'x', spawned: -3, next: 'soon', until: 1e12 };
    s.order = { seed: null, made: 'many', nextAt: -5, offer: { hood: 'atlantis', target: 10, left: 30 }, active: { hood: 'suburbs', target: 40, startSold: 9e9, left: 90 } };
    const m = G.migrate(s, T0);
    expect(m.bonus.seed).toBeGreaterThanOrEqual(0);
    expect(m.bonus.spawned).toBe(0);
    expect(m.bonus.next).toBe(BONUS.firstAtPlay);
    expect(m.bonus.until).toBe(BONUS.visibleSeconds); // clamped to one flight, not 1e12 s
    expect(m.order.made).toBe(0);
    expect(m.order.offer).toBeNull(); // unknown neighbourhood
    expect(m.order.active).toBeNull(); // Suburbs is not built in this save
    // built, an active order is kept but never ahead of the shop's own pie count
    s.shops.suburbs.built = true;
    s.shops.suburbs.sold = 100;
    const built = G.migrate(s, T0);
    expect(built.order.active).toEqual({ hood: 'suburbs', target: 40, startSold: 100, left: 90, variant: 0 });
  });
});

describe('the daily task "Tap 3 golden pizzas"', () => {
  test('is in the daily pool again, scaled to 3 taps, and is a task kind', () => {
    const e = DAILY_POOL.find((p) => p.kind === 'bonusTaps')!;
    expect(e.scale).toEqual({ fixed: 3 });
    expect(e.eligible).toBe('always');
    expect(TASK_KINDS).toContain('bonusTaps');
    expect(R.taskTitle({ kind: 'bonusTaps', target: 3, base: 0, claimed: false })).toBe('Tap 3 golden pizzas');
    expect(TASK_TEXT.bonusTaps.unit).toBe('count');
  });

  test('is rolled into some days’ sets', () => {
    let s = G.newGame(T0);
    s = { ...s, seenScenes: ['downtown-4'], shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, heads: G.allHeads() } } };
    let seen = 0;
    for (let d = 1; d <= 60; d++) {
      const r = R.refreshRewards({ ...s, rewards: { ...s.rewards, day: '', week: '' } }, new Date(2026, 10, d, 12).getTime());
      if (r.rewards.daily.some((t) => t.kind === 'bonusTaps')) seen++;
    }
    expect(seen).toBeGreaterThan(8);
    expect(seen).toBeLessThan(60);
  });

  test('progress follows stats.bonusTaps, and it pays like every other daily task', () => {
    let s = G.newGame(T0);
    s = { ...s, seenScenes: ['downtown-4'], shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, heads: G.allHeads(), prep: 10, ovens: 10, counter: 10, drivers: 8, tables: 6 } } };
    s = R.refreshRewards(s, T0);
    const task = { kind: 'bonusTaps' as const, target: 3, base: s.stats.bonusTaps, claimed: false };
    s = { ...s, rewards: { ...s.rewards, daily: [task, ...s.rewards.daily.slice(1)] } };
    expect(R.taskProgress(s, task)).toBe(0);
    s = { ...s, stats: { ...s.stats, bonusTaps: s.stats.bonusTaps + 2 } };
    expect(R.taskDone(s, task)).toBe(false);
    s = { ...s, stats: { ...s.stats, bonusTaps: s.stats.bonusTaps + 1 } };
    expect(R.taskProgress(s, task)).toBe(3);
    const r = R.claimDaily(s, 0, T0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.cash).toBeCloseTo(s.cash + R.minutesToCash(s, DAILY_TASK_REWARD.minutes), 6);
      expect(r.state.rewards.points).toBe(s.rewards.points + DAILY_TASK_REWARD.points);
      expect(r.state.stats.dailyDone).toBe(s.stats.dailyDone + 1);
    }
  });
});
