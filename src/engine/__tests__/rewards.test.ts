/**
 * @jest-environment <rootDir>/src/engine/__tests__/tz-env.js
 */
/// <reference types="jest" />
import * as G from '../game';
import * as R from '../rewards';
import { advanceLine, emptyLine, AUTOMATIC } from '../pipeline';
import {
  DAILY_CHESTS,
  DAILY_POOL,
  DAILY_TASK_COUNT,
  DAILY_TASK_REWARD,
  GIFT_DAYS,
  STREAK_SAVE_DIAMONDS,
  TASK_KINDS,
  VISITORS,
  WEEKLY_COSMETICS,
  WEEKLY_FALLBACK,
  CLOCK_RECOVER_MS,
  LAST_SEEN_STEP_MS,
  MAX_BOOSTERS,
  MAX_CONCURRENT_BOOSTS,
  BOOST_MAX_AHEAD_MS,
  VISITOR_LINES,
  WEEKLY_CHEST_DIAMONDS,
  WEEKLY_DIAMONDS,
  WEEKLY_POOL,
  WEEKLY_TASK_COUNT,
  WEEKLY_TASK_REWARD,
} from '../../content/rewards';
import { NEIGHBORHOODS, TUNING, VEHICLES } from '../../content/tuning';

// Local times, so the tests hold in any time zone.
const at = (y: number, m: number, d: number, h = 12, min = 0, sec = 0) => new Date(y, m - 1, d, h, min, sec).getTime();
const T = at(2026, 10, 30); // a Friday
const HOUR = 3600_000;

/** Downtown run by Nonna, scenes seen: rewards are unlocked and income is above zero. */
const unlocked = (): G.GameState => {
  const s = G.newGame(T);
  return { ...s, seenScenes: ['downtown-4'], shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, heads: G.allHeads() } } };
};
const ready = (now = T) => R.refreshRewards(unlocked(), now);
const ok = (r: G.BuyResult): G.GameState => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const finishDaily = (s: G.GameState, i: number): G.GameState => ({
  ...s,
  stats: { ...s.stats, upgrades: s.stats.upgrades + 1 },
  rewards: { ...s.rewards, daily: s.rewards.daily.map((t, k) => (k === i ? { kind: 'upgrades', target: 1, base: s.stats.upgrades, claimed: false } : t)) },
});
const everythingBuilt = (s: G.GameState): G.GameState => ({
  ...s,
  vehicle: VEHICLES.length - 1,
  shops: Object.fromEntries(NEIGHBORHOODS.map((n) => [n.id, { ...s.shops[n.id], built: true, managed: true, heads: G.allHeads(), decor: { plants: 3, flooring: 3, tables: 3, walls: 3, signage: 3 } }])) as G.GameState['shops'],
});

describe('dates', () => {
  test('dayKey is the local date and flips at midnight', () => {
    expect(R.dayKey(at(2026, 10, 30, 23, 59, 59))).toBe('2026-10-30');
    expect(R.dayKey(at(2026, 10, 31, 0, 0, 0))).toBe('2026-10-31');
    expect(R.dayKey(at(2027, 1, 1, 0, 0, 1))).toBe('2027-01-01');
  });
  test('weekKey is that week’s Monday, flipping at Monday 00:00', () => {
    expect(R.weekKey(at(2026, 10, 30))).toBe('2026-10-26'); // Friday
    expect(R.weekKey(at(2026, 10, 26, 0, 0, 0))).toBe('2026-10-26'); // Monday
    expect(R.weekKey(at(2026, 11, 1, 23, 59, 59))).toBe('2026-10-26'); // Sunday night
    expect(R.weekKey(at(2026, 11, 2, 0, 0, 0))).toBe('2026-11-02'); // Monday
    expect(R.weekKey(at(2027, 1, 1))).toBe('2026-12-28'); // across a year end
  });
  test('ISO week numbers and reset countdowns', () => {
    expect(R.isoWeek('2026-10-26')).toBe(44);
    expect(R.isoWeek('2026-12-28')).toBe(53);
    expect(R.isoWeek('2027-01-04')).toBe(1);
    expect(R.resetCountdown(at(2026, 10, 30, 23, 0, 0), 'day')).toBe(3600);
    expect(R.resetCountdown(at(2026, 11, 1, 23, 0, 0), 'week')).toBe(3600); // Sunday 23:00
    expect(R.resetCountdown(at(2026, 11, 2, 0, 0, 0), 'week')).toBe(7 * 24 * 3600);
  });
});

describe('unlock and refresh', () => {
  test('nothing happens before Nonna takes over', () => {
    const s = G.newGame(T);
    expect(R.rewardsUnlocked(s)).toBe(false);
    expect(R.refreshRewards(s, T)).toBe(s);
    expect(R.giftStatus(s, T).kind).toBe('locked');
    expect(R.claimGift(s, T).ok).toBe(false);
    expect(R.claimableCount(s, T)).toBe(0);
  });
  test('the first refresh rolls a daily and a weekly set and counts the day', () => {
    const s = ready();
    expect(s.rewards.day).toBe('2026-10-30');
    expect(s.rewards.week).toBe('2026-10-26');
    expect(s.rewards.daily).toHaveLength(DAILY_TASK_COUNT);
    expect(s.rewards.weekly).toHaveLength(WEEKLY_TASK_COUNT);
    expect(s.stats.days).toBe(1);
    expect(s.rewards.lastSeen).toBe(T);
  });
  test('a refresh with nothing to do returns the same state', () => {
    const s = ready();
    expect(R.refreshRewards(s, T + 1000)).toBe(s); // lastSeen moves only when 60 s stale
    expect(R.refreshRewards(s, T + 61_000)).not.toBe(s);
    const t = R.refreshRewards(s, T);
    expect(t).toBe(s);
  });
  test('generation is deterministic per day and differs between days', () => {
    expect(ready().rewards.daily).toEqual(ready().rewards.daily);
    const days = Array.from({ length: 6 }, (_, i) => ready(at(2026, 11, 2 + i)).rewards.daily.map((t) => t.kind).join());
    expect(new Set(days).size).toBeGreaterThan(1);
  });
  test('sets hold distinct kinds when enough qualify', () => {
    const s = ready();
    expect(new Set(s.rewards.daily.map((t) => t.kind)).size).toBe(DAILY_TASK_COUNT);
    expect(new Set(s.rewards.weekly.map((t) => t.kind)).size).toBe(WEEKLY_TASK_COUNT);
  });
  test('targets are frozen once generated and respect the minimums', () => {
    const s = ready();
    const before = JSON.stringify(s.rewards.daily.map((t) => [t.kind, t.target]));
    const richer = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep: 40, ovens: 40, counter: 40, drivers: 40 } } };
    expect(JSON.stringify(R.refreshRewards(richer, T + 5000).rewards.daily.map((t) => [t.kind, t.target]))).toBe(before);
    for (const t of s.rewards.daily) {
      expect(Number.isInteger(t.target) && t.target >= 1).toBe(true);
      if (t.kind === 'earn') expect(t.target).toBeGreaterThanOrEqual(100);
      if (['walkins', 'deliveries', 'baked'].includes(t.kind)) expect(t.target).toBeGreaterThanOrEqual(5);
    }
  });
  test('rate targets are rate × seconds to 2 significant figures', () => {
    // a rich shop so the 2-figure rounding is visible; walk across many days to meet an earn task
    let s = unlocked();
    s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep: 60, ovens: 60, counter: 60, drivers: 60, tables: 60, footprint: 3 } } };
    const eps = G.earningsPerSecond(s);
    const earn = Array.from({ length: 30 }, (_, i) => R.refreshRewards(s, at(2026, 11, 2 + i)).rewards.daily.find((t) => t.kind === 'earn')).find(Boolean)!;
    expect(earn.target).toBe(Number((eps * 1200).toPrecision(2)));
  });
  test('ineligible tasks are never generated', () => {
    const kinds = (s: G.GameState, n = 40) => {
      const out = new Set<string>();
      for (let i = 0; i < n; i++) {
        const r = R.refreshRewards({ ...s, rewards: { ...s.rewards, day: '', week: '' } }, at(2026, 11, 2 + i)).rewards;
        [...r.daily, ...r.weekly].forEach((t) => out.add(t.kind));
      }
      return out;
    };
    const base = unlocked();
    // no booster in the inventory: no "start a booster" task; with one, it shows up
    expect(kinds(base).has('booster')).toBe(false);
    expect(kinds({ ...base, rewards: { ...base.rewards, boosters: [{ mult: 2, seconds: 900 }] } }).has('booster')).toBe(true);
    // everything built, hired, decorated and bought: no hire / decor / build / fleet tasks, and no walk-ins when drivers take every pie
    const full = everythingBuilt(base);
    const none = kinds(full);
    for (const k of ['hire', 'decor', 'build', 'fleet']) expect(none.has(k)).toBe(false);
    const driversOnly = { ...base, shops: { ...base.shops, downtown: { ...base.shops.downtown, drivers: 60 } } };
    expect(R.cityRates(driversOnly).walkin).toBe(0);
    expect(kinds(driversOnly).has('walkins')).toBe(false);
    expect(kinds(base).has('walkins')).toBe(true);
    // with a second pizzeria still to staff, a hire task can come up; with only Nonna's Downtown it cannot
    expect(kinds(base).has('hire')).toBe(false);
    const staffed = { ...base, shops: { ...base.shops, suburbs: { ...base.shops.suburbs, built: true } } };
    expect(kinds(staffed, 60).has('hire')).toBe(true);
    expect(kinds(staffed, 60).has('decor')).toBe(true);
  });
  test('a short eligible pool is topped up so a set is never short', () => {
    const r = R.refreshRewards(everythingBuilt(unlocked()), T).rewards;
    expect(r.weekly).toHaveLength(WEEKLY_TASK_COUNT);
    expect(r.daily).toHaveLength(DAILY_TASK_COUNT);
  });
  test('a new day resets points, chests and the daily set; the weekly set stays', () => {
    let s = ready();
    s = { ...s, rewards: { ...s.rewards, points: 70, chests: [true, false, false], rerollUsed: true } };
    const weekly = s.rewards.weekly;
    const t = R.refreshRewards(s, at(2026, 10, 31));
    expect(t.rewards.day).toBe('2026-10-31');
    expect(t.rewards.points).toBe(0);
    expect(t.rewards.chests).toEqual([false, false, false]);
    expect(t.rewards.rerollUsed).toBe(false);
    expect(t.rewards.weekly).toBe(weekly);
    expect(t.stats.days).toBe(2);
  });
  test('Monday rolls the weekly set and its chest', () => {
    let s = ready(at(2026, 11, 1)); // Sunday
    s = { ...s, rewards: { ...s.rewards, weeklyChest: true } };
    const t = R.refreshRewards(s, at(2026, 11, 2));
    expect(t.rewards.week).toBe('2026-11-02');
    expect(t.rewards.weeklyChest).toBe(false);
    expect(t.rewards.weekly.every((x) => !x.claimed)).toBe(true);
  });
  test('"play on N days" counts the day the set was made', () => {
    const s = ready();
    const days = s.rewards.weekly.find((t) => t.kind === 'days');
    if (days) expect(R.taskProgress(s, days)).toBe(1);
    const forced = { ...s, rewards: { ...s.rewards, weekly: [{ kind: 'days' as const, target: 5, base: s.stats.days - 1, claimed: false }] } };
    expect(R.taskProgress(forced, forced.rewards.weekly[0])).toBe(1);
  });
});

describe('progress counters', () => {
  test('buying bumps the counters', () => {
    let s = { ...G.newGame(T), cash: 1e12 };
    s = ok(G.buyUpgrade(s, 'downtown', 'prep'));
    s = ok(G.buyUpgrade(s, 'downtown', 'ovens'));
    s = ok(G.buyUpgrade(s, 'downtown', 'grade'));
    expect(s.stats).toMatchObject({ upgrades: 3, ovens: 2, hires: 0 });
    s = ok(G.buyUpgrade(s, 'downtown', 'headPrep'));
    expect(s.stats).toMatchObject({ upgrades: 4, hires: 1 });
    s = ok(G.buildShop({ ...s, seenScenes: ['downtown-4'] }, 'suburbs'));
    for (const h of ['headPrep', 'headOven', 'headCounter'] as const) s = ok(G.buyUpgrade(s, 'suburbs', h));
    s = ok(G.buyUpgrade(s, 'suburbs', 'manager'));
    expect(s.stats.hires).toBe(5);
    s = ok(G.buyVehicle(s));
    s = ok(G.buyDecor(s, 'downtown', 'plants'));
    expect(s.stats).toMatchObject({ builds: 1, fleet: 1, decor: 1 });
  });
  test('a refused purchase counts nothing', () => {
    const s = G.newGame(T);
    expect(G.buyUpgrade(s, 'downtown', 'prep').ok).toBe(false);
    expect(s.stats.upgrades).toBe(0);
  });
  test('the line reports walk-ins, deliveries and pies out of the oven', () => {
    const rates = G.lineRates('downtown', { ...G.newShop(true), managed: true, tables: 20, drivers: 2 }, 0);
    let line = emptyLine();
    let w = 0;
    let d = 0;
    let b = 0;
    let sold = 0;
    for (let i = 0; i < 300; i++) {
      const a = advanceLine(line, 0.5, rates, AUTOMATIC);
      line = a.line;
      w += a.walkins;
      d += a.deliveries;
      b += a.baked;
      sold += a.sold;
    }
    expect(w + d).toBe(sold);
    expect(w).toBeGreaterThan(0);
    expect(d).toBeGreaterThan(0);
    expect(b).toBeGreaterThanOrEqual(sold);
  });
  test('lineTick and offlineTick feed the walk-in, delivery and bake counters', () => {
    let s = unlocked();
    s = G.lineTick(s, 60);
    s = G.lineTick(s, 60);
    expect(s.stats.baked).toBeGreaterThan(0);
    expect(s.stats.walkins + s.stats.deliveries).toBe(s.shops.downtown.sold);
    const o = G.offlineTick(unlocked(), 3600).state;
    expect(o.stats.baked).toBe(o.shops.downtown.sold);
    expect(o.stats.walkins + o.stats.deliveries).toBe(o.shops.downtown.sold);
  });
  test('progress is the counter minus the task’s base, clamped', () => {
    let s = ready();
    const task = { kind: 'upgrades' as const, target: 10, base: 4, claimed: false };
    expect(R.taskProgress(s, task)).toBe(0);
    s = { ...s, stats: { ...s.stats, upgrades: 9 } };
    expect(R.taskProgress(s, task)).toBe(5);
    s = { ...s, stats: { ...s.stats, upgrades: 99 } };
    expect(R.taskProgress(s, task)).toBe(10);
    s = { ...s, stats: { ...s.stats, upgrades: 0 } };
    expect(R.taskProgress(s, task)).toBe(0);
  });
  test('earn tasks measure totalEarned', () => {
    const s = { ...ready(), totalEarned: 5000 };
    expect(R.taskProgress(s, { kind: 'earn', target: 1000, base: 4500, claimed: false })).toBe(500);
  });
  test('every kind has a title with its target filled in', () => {
    const titles = new Set<string>();
    for (const p of [...DAILY_POOL, ...WEEKLY_POOL]) {
      const t = R.taskTitle({ kind: p.kind, target: 1250, base: 0, claimed: false });
      expect(t).not.toMatch(/[{}]/);
      titles.add(t);
    }
    expect(R.taskTitle({ kind: 'walkins', target: 40, base: 0, claimed: false })).toBe('Serve 40 walk-ins');
    expect(R.taskTitle({ kind: 'earn', target: 1500, base: 0, claimed: false })).toBe('Earn $1.5K');
    expect(TASK_KINDS.every((k) => R.taskTitle({ kind: k, target: 3, base: 0, claimed: false }).length > 0)).toBe(true);
  });
});

describe('claims', () => {
  test('a daily task pays minutes of income and points, once, only when complete', () => {
    let s = ready();
    expect(R.claimDaily(s, 0, T)).toEqual({ ok: false, reason: expect.any(String) });
    s = finishDaily(s, 0);
    const eps = R.rewardIncome(s);
    expect(eps).toBeGreaterThan(0);
    const c = ok(R.claimDaily(s, 0, T));
    expect(c.cash - s.cash).toBeCloseTo(eps * 60 * DAILY_TASK_REWARD.minutes);
    expect(c.rewards.points).toBe(DAILY_TASK_REWARD.points);
    expect(c.rewards.daily[0].claimed).toBe(true);
    expect(c.stats.dailyDone).toBe(1);
    expect(R.claimDaily(c, 0, T).ok).toBe(false);
    expect(R.claimDaily(c, 99, T).ok).toBe(false);
  });
  test('reward income ignores boosts', () => {
    let s = ready();
    const plain = R.rewardIncome(s);
    s = { ...s, rewards: { ...s.rewards, boosts: [{ mult: 5, until: T + HOUR, source: 'x' }] } };
    expect(R.rewardIncome(s)).toBe(plain);
  });
  test('points open the chests in order; each only once', () => {
    let s = ready();
    for (let i = 0; i < 3; i++) {
      expect(R.claimChest(s, 0, T).ok).toBe(i === 2); // 0, 20, then 40 points
      s = finishDaily(s, i);
      s = ok(R.claimDaily(s, i, T));
    }
    // 3 tasks = 60 points: first chest only
    expect(s.rewards.points).toBe(60);
    const cash = s.cash;
    s = ok(R.claimChest(s, 0, T));
    expect(s.cash - cash).toBeCloseTo(R.rewardIncome(s) * 60 * DAILY_CHESTS[0].minutes!);
    expect(R.claimChest(s, 0, T).ok).toBe(false);
    expect(R.claimChest(s, 1, T).ok).toBe(false);
    for (const i of [3, 4]) {
      s = finishDaily(s, i);
      s = ok(R.claimDaily(s, i, T));
    }
    expect(s.rewards.points).toBe(100);
    s = ok(R.claimChest(s, 1, T));
    s = ok(R.claimChest(s, 2, T));
    expect(s.rewards.diamonds).toBe(10);
    expect(s.rewards.boosters).toEqual([{ mult: 2, seconds: 900 }]);
    expect(R.claimableCount(s, T)).toBe(0);
  });
  test('the badge counts finished tasks and ready chests', () => {
    let s = ready();
    expect(R.claimableCount(s, T)).toBe(0);
    s = finishDaily(s, 0);
    expect(R.claimableCount(s, T)).toBe(1);
    s = ok(R.claimDaily(s, 0, T));
    expect(R.claimableCount(s, T)).toBe(0);
    s = { ...s, rewards: { ...s.rewards, points: 40 } };
    expect(R.claimableCount(s, T)).toBe(1);
  });
  test('weekly diamonds: 6 per task plus the final chest add up to 50', () => {
    expect(new Set(WEEKLY_DIAMONDS).size).toBe(1);
    expect(WEEKLY_DIAMONDS.reduce((a, b) => a + b, 0) + WEEKLY_CHEST_DIAMONDS).toBe(50);
    expect(WEEKLY_DIAMONDS).toHaveLength(WEEKLY_TASK_COUNT);
  });
  test('weekly tasks pay income and diamonds; the final chest needs all of them and gives this week’s cosmetic', () => {
    let s = ready();
    s = { ...s, rewards: { ...s.rewards, weekly: s.rewards.weekly.map((t) => ({ ...t, target: 1, base: 0 })) }, stats: { ...s.stats, upgrades: 1, hires: 1, builds: 1, boosters: 1, ovens: 1, fleet: 1, deliveries: 1, baked: 1, walkins: 1, decor: 1, offline: 1, dailyDone: 1, days: 1 }, totalEarned: 1 };
    s = { ...s, rewards: { ...s.rewards, weekly: s.rewards.weekly.map((t) => ({ ...t, target: 1, base: 0 })) } };
    expect(R.claimWeeklyChest(s, T).ok).toBe(false);
    const cash = s.cash;
    for (let i = 0; i < WEEKLY_TASK_COUNT; i++) {
      expect(R.weeklyChestReady(s)).toBe(false);
      s = ok(R.claimWeekly(s, i, T));
      expect(R.claimWeekly(s, i, T).ok).toBe(false);
    }
    expect(s.rewards.diamonds).toBe(42);
    expect(s.cash - cash).toBeCloseTo(R.rewardIncome(s) * 60 * WEEKLY_TASK_REWARD.minutes * WEEKLY_TASK_COUNT);
    const cosmetic = WEEKLY_COSMETICS[R.isoWeek('2026-10-26') % WEEKLY_COSMETICS.length];
    expect(R.weeklyCosmetic(s)).toBe(cosmetic);
    expect(R.claimableCount({ ...s, rewards: { ...s.rewards, daily: [] } }, T)).toBe(1);
    s = ok(R.claimWeeklyChest(s, T));
    expect(s.rewards.cosmetics).toEqual([cosmetic]);
    expect(s.rewards.diamonds).toBe(50); // the chest pays the last 8
    expect(R.claimWeeklyChest(s, T).ok).toBe(false);
  });
  test('boosters start from the inventory, run for their time and stack', () => {
    let s = ready();
    s = { ...s, rewards: { ...s.rewards, boosters: [{ mult: 2, seconds: 900 }, { mult: 2, seconds: 600 }] } };
    expect(R.startBooster(s, 5, T).ok).toBe(false);
    s = ok(R.startBooster(s, 0, T));
    expect(s.rewards.boosters).toEqual([{ mult: 2, seconds: 600 }]);
    expect(s.stats.boosters).toBe(1);
    expect(R.boostMult(s, T + 1000)).toBe(2);
    s = ok(R.startBooster(s, 0, T + 1000));
    expect(R.boostMult(s, T + 2000)).toBe(3); // 2× + 2× add up to 3×, not 4×
    expect(R.runningBoosts(s, T + 2000)).toHaveLength(2);
    expect(R.boostMult(s, T + 700_000)).toBe(2); // the 10 min one ended
    expect(R.boostMult(s, T + 901_000)).toBe(1);
    expect(R.refreshRewards(s, T + 2 * HOUR).rewards.boosts).toEqual([]);
  });
});

describe('boosts in the economy', () => {
  test('a boost raises the price of every pie', () => {
    const shop = unlocked().shops.downtown;
    expect(G.lineRates('downtown', shop, 0, 3).price).toBeCloseTo(3 * G.lineRates('downtown', shop, 0).price);
  });
  test('playTick pays boosted cash only while the boost runs, and old call signatures still work', () => {
    let s = ready();
    s = { ...s, rewards: { ...s.rewards, boosts: [{ mult: 2, until: T + 600_000, source: 'x' }] } };
    const plain = G.playTick(G.playTick(s, 60), 60);
    const boosted = G.playTick(G.playTick(s, 60, T + 1000), 60, T + 61_000);
    const after = G.playTick(G.playTick(s, 60, T + 700_000), 60, T + 760_000);
    expect(boosted.cash).toBeCloseTo(2 * plain.cash);
    expect(after.cash).toBeCloseTo(plain.cash);
  });
  test('offline: each boost pays (mult − 1) over the share of the window it covers', () => {
    const base = { ...unlocked(), lastSavedAt: T };
    const away = (s: G.GameState, hours = 1) => G.applyOffline(s, T + hours * HOUR);
    const plain = away(base).earned;
    expect(plain).toBeGreaterThan(0);
    const boostOf = (...b: [number, number][]) => ({ ...base, rewards: { ...base.rewards, boosts: b.map(([mult, secs]) => ({ mult, until: T + secs * 1000, source: 'x' })) } });
    expect(away(boostOf([2, 7200])).earned / plain).toBeCloseTo(2); // covers the whole hour
    expect(away(boostOf([2, 1800])).earned / plain).toBeCloseTo(1.5); // half of it
    expect(away(boostOf([2, 7200], [2, 7200])).earned / plain).toBeCloseTo(3); // stacking adds
    expect(away(boostOf([2, 1800], [4, 900])).earned / plain).toBeCloseTo(1 + 0.5 + 3 * 0.25);
    expect(away(boostOf([2, -600])).earned).toBe(plain); // ended before they left
    // the 4 h cap still applies: a 2 h boost covers half of the 4 h window
    const capSecs = TUNING.offlineCapSeconds;
    const long = away(boostOf([2, capSecs / 2]), 10).earned / away(base, 10).earned;
    expect(long).toBeCloseTo(1.5);
  });
});

describe('clock rollback', () => {
  test('claims, refreshes and boosts wait while the clock is behind lastSeen', () => {
    let s = ready();
    s = finishDaily(s, 0);
    s = { ...s, rewards: { ...s.rewards, boosts: [{ mult: 2, until: T + HOUR, source: 'x' }], boosters: [{ mult: 2, seconds: 60 }], lastSeen: T + 5 * HOUR } };
    const back = T + HOUR;
    expect(R.clockBehind(s, back)).toBe(true);
    for (const r of [R.claimDaily(s, 0, back), R.claimChest(s, 0, back), R.claimWeekly(s, 0, back), R.claimWeeklyChest(s, back), R.startBooster(s, 0, back), R.claimGift(s, back)]) {
      expect(r).toEqual({ ok: false, reason: R.CLOCK_REASON });
    }
    expect(R.refreshRewards(s, back)).toBe(s);
    expect(R.boostMult(s, back)).toBe(1);
    expect(R.claimableCount(s, back)).toBe(0);
    expect(R.shouldAutoOpenGift(s, back)).toBe(false);
    // once the clock catches up they work again
    expect(R.claimDaily(s, 0, T + 5 * HOUR).ok).toBe(true);
  });
  test('a rolled-back day does not roll a new set', () => {
    const s = ready(at(2026, 10, 30));
    expect(R.refreshRewards(s, at(2026, 10, 29))).toBe(s);
  });
});

describe('daily gift', () => {
  const day = (d: number, h = 12, m = 0) => at(2026, 11, d, h, m);
  /** Claim on each listed November day; returns the state after the last. */
  const claimOn = (s: G.GameState, days: number[], repairOn: number[] = []) => days.reduce((st, d) => ok(R.claimGift(R.refreshRewards(st, day(d)), day(d), { repair: repairOn.includes(d) })), s);

  test('has 30 days with the milestones in place', () => {
    expect(GIFT_DAYS).toHaveLength(30);
    expect(GIFT_DAYS[6].diamonds).toBe(50);
    expect(GIFT_DAYS[13].boosters).toHaveLength(3);
    expect(GIFT_DAYS[20].boostNow).toEqual({ mult: 2, minutes: 1440 });
    expect(GIFT_DAYS[27].cosmetic).toContain('storefront-skin');
    expect(GIFT_DAYS[29].visit).toBe(true);
    expect(GIFT_DAYS.slice(0, 3).map((g) => Object.keys(g).filter((k) => k !== 'label')[0])).toEqual(['minutes', 'boosters', 'diamonds']);
  });
  test('the first claim is day 1; one claim per day; the next day is day 2', () => {
    let s = unlocked();
    expect(R.giftStatus(s, day(2))).toMatchObject({ kind: 'ready', day: 1 });
    const cash = s.cash;
    s = ok(R.claimGift(s, day(2)));
    expect(s.cash).toBeGreaterThan(cash);
    expect(R.giftStatus(s, day(2))).toMatchObject({ kind: 'claimed', day: 1 });
    expect(R.claimGift(s, day(2)).ok).toBe(false);
    expect(R.giftStatus(s, day(2, 23, 59))).toMatchObject({ kind: 'claimed' });
    expect(R.giftStatus(s, day(3))).toMatchObject({ kind: 'ready', day: 2 });
    s = ok(R.claimGift(s, day(3)));
    expect(s.rewards.boosters).toEqual([{ mult: 2, seconds: 900 }]);
    s = ok(R.claimGift(s, day(4)));
    expect(s.rewards.diamonds).toBe(5);
    expect(s.rewards.gift.streak).toBe(3);
  });
  test('one missed day offers a save for 20 diamonds that keeps the streak', () => {
    let s = claimOn(unlocked(), [2, 3, 4]);
    s = { ...s, rewards: { ...s.rewards, diamonds: 25 } };
    expect(R.giftStatus(s, day(6))).toMatchObject({ kind: 'save', day: 4 });
    const t = ok(R.claimGift(s, day(6), { repair: true }));
    expect(t.rewards.diamonds).toBe(25 - STREAK_SAVE_DIAMONDS);
    expect(t.rewards.gift).toMatchObject({ streak: 4, saveUsed: true });
    // the save is used up for this cycle: another single miss just restarts
    expect(R.giftStatus(t, day(8))).toMatchObject({ kind: 'ready', day: 1 });
    expect(R.giftStatus(R.refreshRewards(t, day(7)), day(7))).toMatchObject({ kind: 'ready', day: 5 });
  });
  test('a save needs the diamonds', () => {
    const s = claimOn(unlocked(), [2, 3]);
    expect(R.claimGift(s, day(5), { repair: true })).toEqual({ ok: false, reason: 'Not enough diamonds' });
  });
  test('one missed day without the save starts over at day 1', () => {
    const s = claimOn(unlocked(), [2, 3, 4]);
    const t = ok(R.claimGift(s, day(6)));
    expect(t.rewards.gift).toMatchObject({ streak: 1, saveUsed: false });
    expect(t.rewards.diamonds).toBe(s.rewards.diamonds);
  });
  test('two missed days start over, whatever the diamonds', () => {
    let s = claimOn(unlocked(), [2, 3, 4]);
    s = { ...s, rewards: { ...s.rewards, diamonds: 100 } };
    expect(R.giftStatus(s, day(7))).toMatchObject({ kind: 'ready', day: 1 });
    expect(ok(R.claimGift(s, day(7), { repair: true })).rewards.diamonds).toBe(100 + 0); // day 1 is cash: no repair charge
  });
  test('day 7 pays 50 diamonds and day 14 three boosters', () => {
    const s7 = claimOn(unlocked(), [2, 3, 4, 5, 6, 7, 8]);
    expect(s7.rewards.gift.streak).toBe(7);
    expect(s7.rewards.diamonds).toBe(5 + 5 + 50); // days 3 and 6 are diamonds
    const s14 = claimOn(s7, [9, 10, 11, 12, 13, 14, 15]);
    expect(s14.rewards.gift.streak).toBe(14);
    expect(s14.rewards.boosters.slice(-3)).toEqual(Array(3).fill({ mult: 2, seconds: 1800 }));
  });
  test('day 21 starts a 24 h boost at once', () => {
    const days = Array.from({ length: 21 }, (_, i) => 2 + i);
    const s = claimOn(unlocked(), days);
    const now = R.refreshRewards(s, day(22)).rewards.lastSeen;
    expect(R.boostMult(s, now)).toBe(2);
    expect(R.runningBoosts(s, now)[0].until - now).toBeLessThanOrEqual(24 * HOUR);
  });
  test('day 28 gives the cycle’s storefront skin; day 30 the visit; then a new cycle with the next visitor', () => {
    const run = (s: G.GameState, from: number, n: number) => {
      let st = s;
      for (let i = 0; i < n; i++) {
        const now = at(2026, 11, 1) + (from + i) * 24 * HOUR;
        st = ok(R.claimGift(R.refreshRewards(st, now), now));
      }
      return st;
    };
    let s = run(unlocked(), 0, 28);
    expect(s.rewards.cosmetics).toEqual(['storefront-skin-1']);
    expect(s.rewards.gift.streak).toBe(28);
    s = run(s, 28, 2);
    expect(s.rewards.gift).toMatchObject({ streak: 30, cycle: 1, saveUsed: false });
    expect(s.rewards.diamonds).toBeGreaterThanOrEqual(300);
    expect(s.rewards.cosmetics).toContain('oven-gold');
    const now30 = at(2026, 11, 1) + 29 * 24 * HOUR;
    expect(R.runningBoosts(s, now30)[0]).toMatchObject({ mult: 2, source: `visit-${VISITORS[0]}` });
    expect(R.giftStatus(s, now30)).toMatchObject({ kind: 'claimed', day: 30, cycle: 0, visitor: VISITORS[0] });
    // the next claim is day 1 of cycle 2
    const next = now30 + 24 * HOUR;
    expect(R.giftStatus(s, next)).toMatchObject({ kind: 'ready', day: 1, cycle: 1 });
    s = run(s, 30, 28);
    expect(s.rewards.gift.streak).toBe(28);
    expect(s.rewards.cosmetics).toContain('storefront-skin-2');
    s = run(s, 58, 2);
    expect(R.runningBoosts(s, at(2026, 11, 1) + 59 * 24 * HOUR)[0].source).toBe(`visit-${VISITORS[1]}`);
  });
  test('the calendar opens by itself once a day', () => {
    let s = unlocked();
    expect(R.shouldAutoOpenGift(s, day(2))).toBe(true);
    s = R.markGiftShown(s, day(2));
    expect(R.shouldAutoOpenGift(s, day(2, 20))).toBe(false);
    expect(R.shouldAutoOpenGift(s, day(3))).toBe(true);
    s = ok(R.claimGift(s, day(3)));
    expect(R.shouldAutoOpenGift(s, day(3))).toBe(false); // claimed
    expect(R.shouldAutoOpenGift(G.newGame(T), T)).toBe(false); // locked
    const shown = R.markGiftShown(s, day(3));
    expect(R.markGiftShown(shown, day(3))).toBe(shown);
  });
});

describe('save v5', () => {
  test('a v4 save loads with empty rewards and zero stats', () => {
    const v4 = JSON.parse(JSON.stringify(G.newGame(0)));
    v4.saveVersion = 4;
    delete v4.rewards;
    delete v4.stats;
    const m = G.migrate(v4, 5);
    expect(G.SAVE_VERSION).toBe(5);
    expect(m.saveVersion).toBe(5);
    expect(m.rewards).toEqual(G.newRewards());
    expect(m.stats).toEqual(G.newStats());
  });
  test('a v5 save round-trips', () => {
    let s = ready();
    s = ok(R.claimGift(s, T));
    s = finishDaily(s, 0);
    s = ok(R.claimDaily(s, 0, T));
    expect(G.migrate(JSON.parse(JSON.stringify(s)), T)).toEqual(s);
  });
  test('corrupt reward fields are clamped or dropped', () => {
    const raw = JSON.parse(JSON.stringify(G.newGame(0)));
    raw.rewards = {
      day: 5,
      daily: 'nope',
      points: -50,
      chests: [1, 'a', true],
      week: '2026-10-26',
      weekly: [{ kind: 'bogus', target: 3 }, null, { kind: 'upgrades', target: 0 }, { kind: 'earn', target: 12.7, base: -4, claimed: 1 }],
      gift: { streak: 999, last: 'bad', saveUsed: 'yes', cycle: -3 },
      giftShownDay: 7,
      diamonds: -1,
      boosters: [{ mult: 'x', seconds: 5 }, { mult: 500, seconds: -1 }, { mult: 0.2, seconds: 1e12 }, 'x'],
      boosts: [{ mult: 500, until: 1e12, source: 3 }, { mult: 2 }, null],
      cosmetics: ['a', 'a', 5, '', 'x'.repeat(100)],
      lastSeen: 1e30,
    };
    raw.stats = { upgrades: -5, ovens: 'a', hires: 3.9, days: null };
    const m = G.migrate(raw, 1000);
    expect(m.rewards.day).toBe('');
    expect(m.rewards.daily).toEqual([]);
    expect(m.rewards.points).toBe(0);
    expect(m.rewards.chests).toEqual([false, false, true]);
    expect(m.rewards.week).toBe('2026-10-26');
    expect(m.rewards.weekly).toEqual([{ kind: 'earn', target: 12, base: 0, claimed: true }]);
    expect(m.rewards.gift).toEqual({ streak: 30, last: '', saveUsed: true, cycle: 0 });
    expect(m.rewards.giftShownDay).toBe('');
    expect(m.rewards.diamonds).toBe(0);
    expect(m.rewards.boosters).toEqual([{ mult: 1, seconds: 5 }, { mult: 1, seconds: 30 * 86400 }]);
    expect(m.rewards.boosts).toEqual([{ mult: 100, until: 1000 + BOOST_MAX_AHEAD_MS, source: 'boost' }]);
    expect(m.rewards.cosmetics).toEqual(['a']);
    expect(m.rewards.lastSeen).toBe(1000 + 400 * 86400_000);
    expect(m.stats).toMatchObject({ upgrades: 0, ovens: 0, hires: 3, days: 0 });
    // a dropped daily set re-rolls on the next refresh
    const unl = { ...m, seenScenes: ['downtown-4'], rewards: { ...m.rewards, lastSeen: 0 } };
    expect(R.refreshRewards(unl, T).rewards.daily).toHaveLength(DAILY_TASK_COUNT);
  });
  test('garbage rewards or stats fall back to empty', () => {
    for (const bad of [null, 5, 'x', [], { daily: {} }]) {
      const m = G.migrate({ ...JSON.parse(JSON.stringify(G.newGame(0))), rewards: bad, stats: bad }, 0);
      expect(m.stats).toEqual(G.newStats());
      expect(m.rewards.daily).toEqual([]);
      expect(m.rewards.chests).toHaveLength(DAILY_CHESTS.length);
    }
  });
});

/** Run `fn` with the process time zone set to `tz`, restoring it after. */
function inTZ<T>(tz: string, fn: () => T): T {
  const old = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
}
const NY = 'America/New_York';
const KIRI = 'Pacific/Kiritimati';

describe('C94 time-zone changes never re-roll', () => {
  test('NY -> Kiritimati -> NY keeps the set, the points and the day count', () => {
    const instant = Date.UTC(2026, 9, 30, 20, 0, 0); // 16:00 NY Fri, Sat 10:00 Kiritimati
    let s = inTZ(NY, () => ready(instant));
    expect(s.rewards.day).toBe('2026-10-30');
    s = { ...s, rewards: { ...s.rewards, points: 55, chests: [true, false, false] } };
    const there = inTZ(KIRI, () => R.refreshRewards(s, instant + 60_000));
    expect(there.rewards.day).toBe('2026-10-31'); // forward: a legitimate new day
    expect(there.stats.days).toBe(2);
    const back = inTZ(NY, () => R.refreshRewards(there, instant + 120_000));
    expect(back.rewards.day).toBe('2026-10-31'); // never backwards
    expect(back.rewards.points).toBe(0);
    expect(back.stats.days).toBe(2); // no double count
    // going back and forth again changes nothing
    const again = inTZ(KIRI, () => R.refreshRewards(back, instant + 180_000));
    expect(again.stats.days).toBe(2);
    expect(again.rewards.daily).toBe(back.rewards.daily);
  });
  test('a backwards zone jump after progress keeps points, chests and weekly diamonds', () => {
    const instant = Date.UTC(2026, 9, 30, 20, 0, 0);
    let s = inTZ(KIRI, () => ready(instant)); // 10-31
    s = { ...s, rewards: { ...s.rewards, points: 70, chests: [true, true, false], weeklyChest: true } };
    const back = inTZ(NY, () => R.refreshRewards(s, instant + 120_000)); // 10-30 in NY
    expect(back.rewards.points).toBe(70);
    expect(back.rewards.chests).toEqual([true, true, false]);
    expect(back.rewards.weeklyChest).toBe(true);
    expect(back.rewards.daily).toBe(s.rewards.daily);
    expect(back.stats.days).toBe(s.stats.days);
  });
  test('across a Monday: forward rolls the week once, back never does', () => {
    const instant = Date.UTC(2026, 10, 1, 12, 0, 0); // Sunday noon UTC: Sun 07:00 NY, Mon 02:00 Kiritimati
    let s = inTZ(NY, () => ready(instant));
    expect(s.rewards.week).toBe('2026-10-26');
    s = { ...s, rewards: { ...s.rewards, weeklyChest: true } };
    const mon = inTZ(KIRI, () => R.refreshRewards(s, instant + 60_000));
    expect(mon.rewards.week).toBe('2026-11-02');
    expect(mon.rewards.weeklyChest).toBe(false);
    const back = inTZ(NY, () => R.refreshRewards({ ...mon, rewards: { ...mon.rewards, weeklyChest: true } }, instant + 120_000));
    expect(back.rewards.week).toBe('2026-11-02');
    expect(back.rewards.weeklyChest).toBe(true);
    expect(back.rewards.weekly).toBe(mon.rewards.weekly);
  });
  test('a gift claimed on a later date reads as claimed from an earlier one', () => {
    let s = ready(at(2026, 10, 31));
    s = ok(R.claimGift(s, at(2026, 10, 31)));
    const back = at(2026, 10, 30, 13);
    expect(R.giftStatus({ ...s, rewards: { ...s.rewards, lastSeen: 0 } }, back).kind).toBe('claimed');
    expect(R.claimGift({ ...s, rewards: { ...s.rewards, lastSeen: 0 } }, back).ok).toBe(false);
  });
});

describe('T71 DST', () => {
  test('2026-11-01 in New York is a 25 h day; keys hold around 01:00-02:00', () => {
    inTZ(NY, () => {
      expect(R.resetCountdown(at(2026, 11, 1, 0, 0, 0), 'day')).toBe(25 * 3600);
      for (const ms of [Date.UTC(2026, 10, 1, 4, 30), Date.UTC(2026, 10, 1, 5, 30), Date.UTC(2026, 10, 1, 6, 30), Date.UTC(2026, 10, 1, 7, 30)]) {
        expect(R.dayKey(ms)).toBe('2026-11-01');
        expect(R.weekKey(ms)).toBe('2026-10-26');
      }
      expect(R.dayKey(Date.UTC(2026, 10, 1, 3, 59))).toBe('2026-10-31');
      expect(R.dayKey(Date.UTC(2026, 10, 2, 4, 59))).toBe('2026-11-01');
      expect(R.dayKey(Date.UTC(2026, 10, 2, 5, 0))).toBe('2026-11-02');
      expect(R.resetCountdown(Date.UTC(2026, 10, 1, 6, 30), 'day')).toBe(22 * 3600 + 30 * 60); // 01:30 EST -> midnight Nov 2 EST
    });
  });
});

describe('C95 a clock set far forward recovers', () => {
  test('lastSeen +3 days: refresh recovers, claims work, boosts clear, today is not re-rolled', () => {
    let s = finishDaily(ready(), 0);
    s = { ...s, rewards: { ...s.rewards, boosts: [{ mult: 2, until: T + 3 * 24 * HOUR, source: 'x' }], lastSeen: T + 3 * 24 * HOUR } };
    expect(R.claimDaily(s, 0, T).ok).toBe(false);
    const r = R.refreshRewards(s, T);
    expect(r.rewards.lastSeen).toBe(T);
    expect(r.rewards.boosts).toEqual([]);
    expect(r.rewards.daily).toBe(s.rewards.daily);
    expect(r.rewards.day).toBe(s.rewards.day);
    expect(r.stats.days).toBe(s.stats.days);
    expect(R.claimDaily(r, 0, T).ok).toBe(true);
  });
  test('T74: a refresh under a clock set 3 days ahead, then the clock fixed: day, week and gift go back to today, sets kept', () => {
    const s0 = ready();
    const future = T + 3 * 24 * HOUR;
    let s = R.refreshRewards(s0, future); // rolls to the future day and week
    expect(s.rewards.day).toBe(R.dayKey(future));
    expect(s.rewards.week).toBe(R.weekKey(future));
    s = ok(R.claimGift(s, future));
    expect(R.giftStatus(s, future).kind).toBe('claimed');
    const days = s.stats.days;
    const r = R.refreshRewards(s, T);
    expect(r.rewards.day).toBe(R.dayKey(T));
    expect(r.rewards.week).toBe(R.weekKey(T));
    expect(r.rewards.daily).toBe(s.rewards.daily); // kept, not regenerated
    expect(r.rewards.weekly).toBe(s.rewards.weekly);
    expect(r.rewards.points).toBe(s.rewards.points);
    expect(r.stats.days).toBe(days);
    expect(r.rewards.gift.last).toBe(R.dayKey(T));
    expect(R.giftStatus(r, T + 24 * HOUR).kind).toBe('ready'); // the next real day is claimable, not "claimed"
    // and the next real day rolls a fresh daily set
    const next = R.refreshRewards(r, T + 24 * HOUR);
    expect(next.rewards.day).toBe(R.dayKey(T + 24 * HOUR));
    expect(next.rewards.daily).not.toBe(r.rewards.daily);
    expect(next.stats.days).toBe(days + 1);
  });
  test('within 36 h the guard still waits', () => {
    const s = ready();
    const ahead = { ...s, rewards: { ...s.rewards, lastSeen: T + CLOCK_RECOVER_MS } };
    expect(R.refreshRewards(ahead, T)).toBe(ahead);
  });
});

describe('U4 lastSeen granularity', () => {
  test('rewards keep identity between ticks and move once 60 s stale', () => {
    const s = ready();
    expect(R.refreshRewards(s, T + LAST_SEEN_STEP_MS - 1000)).toBe(s);
    const t = R.refreshRewards(s, T + LAST_SEEN_STEP_MS);
    expect(t.rewards.lastSeen).toBe(T + LAST_SEEN_STEP_MS);
  });
});

describe('C96 limits', () => {
  test('a boost end is capped to 30 days ahead on load', () => {
    const base = G.migrate({}, T);
    const m = G.migrate({ ...base, rewards: { ...base.rewards, boosts: [{ mult: 2, until: T + 400 * 86400_000, source: 'x' }] } }, T);
    expect(m.rewards.boosts[0].until).toBe(T + BOOST_MAX_AHEAD_MS);
  });
  test('booster inventory is capped where granted', () => {
    let s = ready();
    s = { ...s, rewards: { ...s.rewards, boosters: Array.from({ length: MAX_BOOSTERS }, () => ({ mult: 2, seconds: 60 })), points: 100 } };
    s = ok(R.claimChest(s, 2, T));
    expect(s.rewards.boosters).toHaveLength(MAX_BOOSTERS);
  });
  test('concurrent boosts are capped', () => {
    let s = ready();
    s = {
      ...s,
      rewards: {
        ...s.rewards,
        boosts: Array.from({ length: MAX_CONCURRENT_BOOSTS }, (_, i) => ({ mult: 2, until: T + (i + 10) * HOUR, source: 'x' })),
        boosters: [{ mult: 2, seconds: 60 }],
      },
    };
    s = ok(R.startBooster(s, 0, T));
    expect(s.rewards.boosts).toHaveLength(MAX_CONCURRENT_BOOSTS);
  });
});

describe('G85 weekly chest prize', () => {
  const chestReady = (cosmetics: string[]) => {
    const s = ready();
    return { ...s, rewards: { ...s.rewards, cosmetics, weekly: s.rewards.weekly.map((t) => ({ ...t, claimed: true })) } };
  };
  const start = WEEKLY_COSMETICS[R.isoWeek('2026-10-26') % WEEKLY_COSMETICS.length];
  const order = (i: number) => WEEKLY_COSMETICS[(R.isoWeek('2026-10-26') + i) % WEEKLY_COSMETICS.length];
  test('unowned: this week\'s', () => {
    expect(R.weeklyChestPrize(chestReady([]))).toEqual({ kind: 'cosmetic', id: start, diamonds: WEEKLY_CHEST_DIAMONDS });
  });
  test('owned: the next unowned in rotation order', () => {
    const s = chestReady([start, order(1)]);
    expect(R.weeklyChestPrize(s)).toEqual({ kind: 'cosmetic', id: order(2), diamonds: WEEKLY_CHEST_DIAMONDS });
    const after = ok(R.claimWeeklyChest(s, T));
    expect(after.rewards.cosmetics).toEqual([start, order(1), order(2)]);
    expect(after.rewards.diamonds - s.rewards.diamonds).toBe(WEEKLY_CHEST_DIAMONDS);
  });
  test('all owned: 30 diamonds and 2 h of income', () => {
    const s = chestReady([...WEEKLY_COSMETICS]);
    expect(R.weeklyChestPrize(s)).toEqual({ kind: 'fallback', diamonds: WEEKLY_FALLBACK.diamonds, minutes: WEEKLY_FALLBACK.minutes });
    expect(WEEKLY_FALLBACK).toEqual({ diamonds: 30, minutes: 120 });
    const after = ok(R.claimWeeklyChest(s, T));
    expect(after.rewards.diamonds - s.rewards.diamonds).toBe(30);
    expect(after.cash - s.cash).toBeCloseTo(R.minutesToCash(s, 120));
    expect(after.rewards.cosmetics).toEqual(s.rewards.cosmetics);
    expect(after.rewards.weeklyChest).toBe(true);
  });
});

describe('S9/S10 copy', () => {
  test('every visitor has a line, and the clock reason reads as agreed', () => {
    for (const v of VISITORS) expect(VISITOR_LINES[v]).toMatch(/^Thirty days/);
    expect(R.CLOCK_REASON).toBe("Your phone's clock looks off. Rewards resume once it catches up.");
  });
});
