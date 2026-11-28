/// <reference types="jest" />
// v5.25 (card E9): offline earnings honour every paid boost for the time it still covers. Each kind is active for the first 10 minutes of a 60-minute absence:
// the time away pays boosted for 10 minutes and base for 50. The kinds: a timed boost of the rewards (a booster, a gift, the day-30 visit), the Starter Pack's
// (a timed boost the grant starts), the diamond boosters' slot, and the General Manager's boost (not timed: in every managed pizza's value).
import { GM_BOOST, HEADS_OFFLINE_SHARE } from '../../content/tuning';
import { PAID_BOOST_MULT } from '../../content/rewards';
import { STARTER_CASH } from '../../services/grants';
import * as G from '../game';
import { applyGrant, offlineBoost, offlineFactor } from '../offers';
import { buyBooster } from '../paid-boost';
import * as R from '../rewards';

const T = new Date(2026, 10, 30, 12).getTime();
const MIN = 60_000;
const ABSENCE = 60;
const COVERED = 10;
/** What a boost of `mult` over 10 of the 60 minutes makes of the total. */
const share = (mult: number) => 1 + ((mult - 1) * COVERED) / ABSENCE;

/** Downtown runs itself (a manager and three heads), last saved at T. */
const running = (managed = true): G.GameState => {
  const s = G.newGame(T);
  const g = { ...s, seenScenes: ['downtown-4'], shops: { ...s.shops, downtown: { ...s.shops.downtown, managed, heads: G.allHeads() } } };
  return { ...g, lastSavedAt: T, rewards: { ...g.rewards, diamonds: 1000, lastSeen: T - ABSENCE * MIN } };
};
const away = (s: G.GameState) => G.applyOffline(s, T + ABSENCE * MIN);
const base = () => away(running());
const ok = (r: G.BuyResult): G.GameState => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const withBoost = (s: G.GameState, boost: G.Boost): G.GameState => ({ ...s, rewards: { ...s.rewards, boosts: [...s.rewards.boosts, boost] } });

describe('offline pays every paid boost for the time it still covers', () => {
  test('the base run earns something, and a boost that ended before the absence adds nothing', () => {
    const b = base();
    expect(b.earned).toBeGreaterThan(0);
    expect(b.boost).toBe(1);
    expect(away(withBoost(running(), { mult: 2, until: T - 1, source: 'booster' })).earned).toBe(b.earned);
  });

  test.each(['booster', 'gift-day-21', 'visit-nonna', 'daily-ad'])('a timed boost of the rewards (%s): boosted for 10 min, base for 50', (source) => {
    const b = base();
    const r = away(withBoost(running(), { mult: 2, until: T + COVERED * MIN, source }));
    expect(r.earned / b.earned).toBeCloseTo(share(2), 9);
    expect(r.boost).toBeCloseTo(share(2), 9);
  });

  test('a booster started from the shelf (the engine’s own start): 1 h at 2x, started 50 minutes before the save', () => {
    const shelf = { ...running(), rewards: { ...running().rewards, boosters: [{ mult: 2, seconds: 3600 }] } };
    const started = ok(R.startBooster(shelf, 0, T - 50 * MIN));
    expect(started.rewards.boosts[0].until).toBe(T + COVERED * MIN);
    expect(away(started).earned / base().earned).toBeCloseTo(share(2), 9);
  });

  test('the Starter Pack’s boost (a timed boost the grant starts): 2x, boosted for the 10 min it still has', () => {
    const grant = { cash: STARTER_CASH, diamonds: 400, boost: { mult: 2, hours: 0.5 } };
    // bought 20 minutes before the save: the 30 min it runs have 10 left at T
    const bought = applyGrant(running(), grant, T - 20 * MIN);
    expect(bought.rewards.boosts[0].until).toBe(T + COVERED * MIN);
    const r = away({ ...bought, cash: running().cash });
    expect(r.earned / base().earned).toBeCloseTo(share(2), 9);
  });

  test('the diamond boosters’ slot (paidUntil): 2x for the 10 min it still has', () => {
    // rush-hour (1 h) bought 50 minutes before the save
    const bought = ok(buyBooster(running(), 'rush-hour', T - 50 * MIN));
    expect(bought.rewards.paidUntil).toBe(T + COVERED * MIN);
    const r = away(bought);
    expect(r.earned / base().earned).toBeCloseTo(share(PAID_BOOST_MULT), 9);
    expect(r.boost).toBeCloseTo(share(PAID_BOOST_MULT), 9);
  });

  test('a slot that ended before the save adds nothing; one that outlasts the absence pays all of it', () => {
    expect(away({ ...running(), rewards: { ...running().rewards, paidUntil: T - 1 } }).earned).toBe(base().earned);
    expect(away({ ...running(), rewards: { ...running().rewards, paidUntil: T + 5 * 3600_000 } }).earned / base().earned).toBeCloseTo(PAID_BOOST_MULT, 9);
  });

  test('the slot and a timed boost add (mult - 1) each over their own cover, never multiply', () => {
    const s = withBoost({ ...running(), rewards: { ...running().rewards, paidUntil: T + COVERED * MIN } }, { mult: 3, until: T + 20 * MIN, source: 'booster' });
    const expected = 1 + (PAID_BOOST_MULT - 1) * (COVERED / ABSENCE) + (3 - 1) * (20 / ABSENCE);
    expect(away(s).earned / base().earned).toBeCloseTo(expected, 9);
  });

  test('the General Manager’s boost is in every managed pizza’s value for the whole absence; three heads alone pay half and have no boost', () => {
    const managed = away(running(true));
    const heads = away(running(false));
    expect(heads.earned).toBeGreaterThan(0);
    expect(managed.earned / heads.earned).toBeCloseTo(GM_BOOST / HEADS_OFFLINE_SHARE, 1);
  });

  test('the number the 2x ad starts from is the engine’s: offlineBoost with the slot gives applyOffline’s boost, and the ad replaces it, never stacks', () => {
    const s = withBoost(
      { ...running(), rewards: { ...running().rewards, paidUntil: T + COVERED * MIN } },
      { mult: 2, until: T + COVERED * MIN, source: 'booster' },
    );
    const r = away(s);
    expect(offlineBoost(s.rewards.boosts, s.lastSavedAt, r.seconds, s.rewards.paidUntil)).toBeCloseTo(r.boost, 12);
    expect(r.boost).toBeCloseTo(1 + 2 * (COVERED / ABSENCE), 12);
    // the ad turns this total into 2x, not 2x on top
    expect(r.earned * offlineFactor(r.boost)).toBeCloseTo(base().earned * 2, 5);
    // a slot that covers the whole absence is already 2x: no ad is offered a further 2x
    expect(offlineFactor(away({ ...running(), rewards: { ...running().rewards, paidUntil: T + 5 * 3600_000 } }).boost)).toBe(1);
  });
});
