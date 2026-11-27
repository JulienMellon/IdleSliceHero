/// <reference types="jest" />
import * as G from '../game';
import * as R from '../rewards';
import { withFeatures } from '../features';
import { boosterFits, boosterPace, buyBooster, paidBoostLeft } from '../paid-boost';
import { PAID_BOOSTERS, PAID_BOOST_MULT, PAID_SLOT_CAP } from '../../content/rewards';

const T = new Date(2026, 10, 30, 12).getTime();
const HOUR = 3600_000;

const unlocked = (diamonds = 1000): G.GameState => {
  const s = G.newGame(T);
  const g = { ...s, seenScenes: ['downtown-4'], shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, heads: G.allHeads() } } };
  return { ...g, rewards: { ...g.rewards, diamonds, lastSeen: T } };
};
const ok = (r: G.BuyResult): G.GameState => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};

describe('paid boosters: the table', () => {
  test('three boosters at the approved times and prices, in one 2× slot capped at 24 h', () => {
    expect(PAID_BOOSTERS.map((b) => [b.id, b.seconds, b.diamonds])).toEqual([
      ['rush-hour', 3600, 30],
      ['dinner-service', 14400, 90],
      ['big-night', 43200, 220],
    ]);
    expect(PAID_BOOST_MULT).toBe(2);
    expect(PAID_SLOT_CAP).toBe(86400);
  });
});

describe('buyBooster', () => {
  test('buying takes the diamonds and starts the slot', () => {
    const s = ok(buyBooster(unlocked(), 'rush-hour', T));
    expect(s.rewards.diamonds).toBe(970);
    expect(s.rewards.paidUntil).toBe(T + HOUR);
    expect(paidBoostLeft(s, T)).toBe(3600);
    expect(paidBoostLeft(s, T + HOUR)).toBe(0);
  });
  test('buying while it runs adds the time, and the multiplier stays one 2×', () => {
    let s = ok(buyBooster(unlocked(), 'rush-hour', T));
    s = ok(buyBooster(s, 'dinner-service', T + 1800_000));
    expect(s.rewards.paidUntil).toBe(T + HOUR + 4 * HOUR);
    expect(s.rewards.diamonds).toBe(1000 - 30 - 90);
    expect(G.boostMult(s, T + 1800_000)).toBe(2);
  });
  test('after it ended a new one starts from now, not from the old end', () => {
    let s = ok(buyBooster(unlocked(), 'rush-hour', T));
    s = ok(buyBooster(s, 'rush-hour', T + 5 * HOUR));
    expect(s.rewards.paidUntil).toBe(T + 6 * HOUR);
  });
  test('the cap: 24 h is allowed, one second more is refused and nothing is charged', () => {
    let s = ok(buyBooster(unlocked(), 'big-night', T));
    s = ok(buyBooster(s, 'big-night', T)); // exactly 24 h
    expect(paidBoostLeft(s, T)).toBe(PAID_SLOT_CAP);
    const full = buyBooster(s, 'rush-hour', T);
    expect(full.ok).toBe(false);
    expect(boosterFits(s, 'rush-hour', T)).toBe(false);
    // 23 h left: an hour fits, 4 h does not
    expect(boosterFits(s, 'rush-hour', T + HOUR)).toBe(true);
    const refused = buyBooster(s, 'dinner-service', T + HOUR);
    expect(refused.ok).toBe(false);
    expect(s.rewards.diamonds).toBe(1000 - 440);
  });
  test('short of diamonds: refused, the state is untouched', () => {
    const s = unlocked(29);
    const r = buyBooster(s, 'rush-hour', T);
    expect(r).toEqual({ ok: false, reason: 'Not enough diamonds' });
    expect(s.rewards.paidUntil).toBe(0);
  });
  test('an unknown id, locked rewards and a clock that is behind are refused', () => {
    expect(buyBooster(unlocked(), 'nope', T).ok).toBe(false);
    expect(buyBooster({ ...unlocked(), seenScenes: [] }, 'rush-hour', T).ok).toBe(false);
    expect(buyBooster(unlocked(), 'rush-hour', T - 1)).toEqual({ ok: false, reason: R.CLOCK_REASON });
  });
});

describe('boostMult with the paid slot', () => {
  const withSlot = (s: G.GameState, paidUntil: number): G.GameState => ({ ...s, rewards: { ...s.rewards, paidUntil } });
  test('adds one while the slot runs, none after', () => {
    const s = withSlot(unlocked(), T + HOUR);
    expect(G.boostMult(s, T)).toBe(2);
    expect(G.boostMult(s, T + HOUR)).toBe(1);
  });
  test('a free 2× running with the slot makes 3×; two free boosts and the slot add up', () => {
    const s = withSlot(unlocked(), T + HOUR);
    const free = { ...s, rewards: { ...s.rewards, boosts: [{ mult: 2, until: T + HOUR, source: 'x' }] } };
    expect(G.boostMult(free, T)).toBe(3);
    const two = { ...s, rewards: { ...s.rewards, boosts: [free.rewards.boosts[0], { mult: 2, until: T + HOUR, source: 'y' }] } };
    expect(G.boostMult(two, T)).toBe(4);
  });
  test('the clock-behind rule: a clock behind lastSeen gets no paid boost either', () => {
    const s = withSlot(unlocked(), T + HOUR);
    expect(G.boostMult(s, T - 1)).toBe(1);
  });
  test('foreground play earns 2× while it runs', () =>
    withFeatures([], () => {
      const s = unlocked();
      const paid = withSlot(s, T + 600_000);
      const plain = G.playTick(s, 60);
      expect(G.playTick(paid, 60, T + 1000).cash).toBeCloseTo(2 * plain.cash);
      expect(G.playTick(paid, 60, T + 700_000).cash).toBeCloseTo(plain.cash);
    }));
  test('offline earnings ignore the paid slot, as they ignore the 2× ad and Plus stacking', () => {
    const base = { ...unlocked(), lastSavedAt: T };
    const paid = withSlot(base, T + 10 * HOUR);
    expect(G.applyOffline(paid, T + HOUR).earned).toBeGreaterThan(0);
    expect(G.applyOffline(paid, T + HOUR).earned).toBe(G.applyOffline(base, T + HOUR).earned);
  });
  test('cash rewards ignore the slot', () => {
    const s = unlocked();
    expect(R.minutesToCash(withSlot(s, T + HOUR), 5)).toBe(R.minutesToCash(s, 5));
  });
});

describe('selectors and save', () => {
  test('boosterPace is the rewards income × the booster seconds', () => {
    const s = unlocked();
    expect(R.rewardIncome(s)).toBeGreaterThan(0);
    expect(boosterPace(s, 'rush-hour')).toBeCloseTo(R.rewardIncome(s) * 3600);
    expect(boosterPace(s, 'big-night')).toBeCloseTo(R.rewardIncome(s) * 43200);
    expect(boosterPace(s, 'nope')).toBe(0);
    // a running free boost doesn't inflate it
    const boosted = { ...s, rewards: { ...s.rewards, boosts: [{ mult: 4, until: T + HOUR, source: 'x' }] } };
    expect(boosterPace(boosted, 'rush-hour')).toBeCloseTo(boosterPace(s, 'rush-hour'));
  });
  test('an older save loads with paidUntil 0; a saved slot round-trips; a far-future one is capped', () => {
    const old = JSON.parse(JSON.stringify(G.newGame(0)));
    old.saveVersion = 8;
    delete old.rewards.paidUntil;
    expect(G.migrate(old, T).rewards.paidUntil).toBe(0);
    expect(G.SAVE_VERSION).toBe(10);
    const s = ok(buyBooster(unlocked(), 'rush-hour', T));
    const back = G.migrate(JSON.parse(JSON.stringify(s)), T);
    expect(back.rewards.paidUntil).toBe(T + HOUR);
    const bad = JSON.parse(JSON.stringify(s));
    bad.rewards.paidUntil = T + 400 * 86400_000;
    expect(G.migrate(bad, T).rewards.paidUntil).toBe(T + PAID_SLOT_CAP * 1000);
    bad.rewards.paidUntil = 'soon';
    expect(G.migrate(bad, T).rewards.paidUntil).toBe(0);
  });
});
