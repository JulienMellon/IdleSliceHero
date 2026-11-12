/// <reference types="jest" />
import { NIGHT_OVEN } from '../../content/hooks';
import { TUNING } from '../../content/tuning';
import * as G from '../game';
import { buyNightOven, hoursText, nextTier, nightOvenChip, nightOvenLock, nightOvenPrice, nightOvenView } from '../night-oven';
import * as R from '../rewards';

const T0 = new Date(2026, 10, 11, 12, 0, 0).getTime();
const H = 3600;

/** Downtown (and optionally more) built and managed, so the city earns on its own. */
function city(built: G.GameState['active'][] = ['downtown'], patch: Partial<G.GameState> = {}): G.GameState {
  const base = G.newGame(T0);
  const shops = { ...base.shops };
  for (const id of built) shops[id] = { ...shops[id], built: true, managed: true, heads: G.allHeads(), prep: 12, ovens: 12, counter: 12, drivers: 8, tables: 6 };
  return { ...base, shops, lastSavedAt: T0, ...patch };
}

describe('Nonna’s night oven: the tiers', () => {
  test('4 h, 8 h and 12 h; the base is the old offline cap', () => {
    expect(NIGHT_OVEN.capSeconds).toEqual([TUNING.offlineCapSeconds, 8 * H, 12 * H]);
    expect(TUNING.offlineCapSeconds).toBe(4 * H);
    expect(NIGHT_OVEN.priceMinutes).toEqual([0, 20, 60]);
    expect(NIGHT_OVEN.needsBuilt).toEqual([null, 'waterfront', 'industrial']);
  });

  test('hoursText and the chip', () => {
    expect([4 * H, 8 * H, 11.5 * H, 1800].map(hoursText)).toEqual(['4 h', '8 h', '11.5 h', '30 min']);
    expect(nightOvenChip({ nightOven: 0 })).toBe('🌙 4 h');
    expect(nightOvenChip({ nightOven: 2 })).toBe('🌙 12 h');
  });

  test('a new game owns the base tier', () => {
    expect(G.newGame(T0).nightOven).toBe(0);
    expect(G.offlineCapOf(G.newGame(T0))).toBe(4 * H);
  });
});

describe('the lock and the price', () => {
  test('tier 2 needs Waterfront built, tier 3 needs Industrial built', () => {
    const s = city(['downtown']);
    expect(nightOvenLock(s, 1)).toBe('Unlocks when you build Waterfront');
    expect(nightOvenLock(city(['downtown', 'suburbs', 'waterfront']), 1)).toBeNull();
    const w = city(['downtown', 'suburbs', 'waterfront'], { nightOven: 1 });
    expect(nightOvenLock(w, 2)).toBe('Unlocks when you build Industrial');
    expect(nightOvenLock(city(['downtown', 'suburbs', 'waterfront', 'university', 'industrial'], { nightOven: 1 }), 2)).toBeNull();
  });

  test('the tiers come in order', () => {
    const s = city(['downtown', 'suburbs', 'waterfront', 'university', 'industrial']);
    expect(nightOvenLock(s, 2)).toBe('Needs the 8 h oven first');
    expect(buyNightOven({ ...s, cash: 1e12 }).ok).toBe(true);
  });

  test('the price is 20 / 60 minutes of the rewards’ boost-free income', () => {
    const s = city(['downtown', 'suburbs', 'waterfront']);
    expect(nightOvenPrice(s, 1)).toBe(Math.ceil(R.minutesToCash(s, 20)));
    expect(nightOvenPrice(s, 2)).toBe(Math.ceil(R.minutesToCash(s, 60)));
    // a running boost doesn't move it
    const boosted = { ...s, rewards: { ...s.rewards, boosts: [{ mult: 2, until: T0 + 1e9, source: 'booster' as const }] } };
    expect(nightOvenPrice(boosted, 1)).toBe(nightOvenPrice(s, 1));
  });

  test('a city with no income still pays the floor', () => {
    expect(nightOvenPrice(G.newGame(T0), 1)).toBe(NIGHT_OVEN.minPrice);
  });
});

describe('buying', () => {
  const s0 = city(['downtown', 'suburbs', 'waterfront', 'university', 'industrial']);

  test('spends the price and raises the tier, once per tier', () => {
    const price = nightOvenPrice(s0, 1);
    const r = buyNightOven({ ...s0, cash: price + 5 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.nightOven).toBe(1);
    expect(r.state.cash).toBe(5);
    expect(nextTier(r.state)).toBe(2);
  });

  test('refused without the cash, or while locked, or when maxed', () => {
    expect(buyNightOven({ ...s0, cash: 0 })).toEqual({ ok: false, reason: 'Not enough cash' });
    expect(buyNightOven({ ...city(['downtown']), cash: 1e12 })).toEqual({ ok: false, reason: 'Unlocks when you build Waterfront' });
    const maxed = { ...s0, nightOven: 2, cash: 1e12 };
    expect(nextTier(maxed)).toBeNull();
    expect(buyNightOven(maxed).ok).toBe(false);
  });

  test('the view: chip, info text, tiers and the next one', () => {
    const v = nightOvenView({ ...s0, cash: 1e12 });
    expect(v.chip).toBe('🌙 4 h');
    expect(v.body).toBe("While you're away, Nonna's night oven keeps baking for up to 4 h. Come back before it's full!");
    expect(v.leaveLine).toBe("Leave now and it's full in 4 h.");
    expect(v.tiers.map((t) => [t.hours, t.state])).toEqual([['4 h', 'owned'], ['8 h', 'next'], ['12 h', 'later']]);
    expect(v.next).toMatchObject({ tier: 1, title: 'Night oven: holds 8 h', lock: null, canBuy: true });
    const locked = nightOvenView(city(['downtown']));
    expect(locked.tiers[1].note).toBe('Unlocks when you build Waterfront');
    expect(locked.next?.canBuy).toBe(false);
    expect(nightOvenView({ ...s0, nightOven: 2 }).next).toBeNull();
  });
});

describe('the offline tick uses the owned cap', () => {
  const away = (tier: number, hours: number) => {
    const s = city(['downtown'], { nightOven: tier });
    return G.applyOffline(s, T0 + hours * H * 1000);
  };

  test('4 h at the base tier, 8 h and 12 h once bought', () => {
    expect(away(0, 20).seconds).toBe(4 * H);
    expect(away(1, 20).seconds).toBe(8 * H);
    expect(away(2, 20).seconds).toBe(12 * H);
    expect(away(2, 20).cap).toBe(12 * H);
  });

  test('a bigger oven pays proportionally more for the same long absence', () => {
    expect(away(1, 20).earned / away(0, 20).earned).toBeCloseTo(2, 3);
    expect(away(2, 20).earned / away(0, 20).earned).toBeCloseTo(3, 3);
  });

  test('capped depends on the owned cap', () => {
    expect(away(0, 6).capped).toBe(true);
    expect(away(1, 6).capped).toBe(false);
    expect(away(1, 6).seconds).toBe(6 * H);
  });

  test('the summary carries pies per shop and the shops that waited', () => {
    const s = city(['downtown', 'suburbs'], { nightOven: 0 });
    const un = { ...s, shops: { ...s.shops, suburbs: { ...s.shops.suburbs, managed: false, heads: G.noHeads() } } };
    const r = G.applyOffline(un, T0 + 2 * H * 1000);
    expect(r.byShop[0].id).toBe('downtown');
    expect(r.byShop[0].pies).toBeGreaterThan(0);
    expect(r.idle).toEqual(['suburbs']);
  });
});

describe('old saves load', () => {
  test('a save without the night-oven field migrates to the base tier', () => {
    const s = city(['downtown']);
    const { nightOven: _gone, ...old } = s;
    expect('nightOven' in old).toBe(false);
    const m = G.migrate(JSON.parse(JSON.stringify(old)), T0);
    expect(m.nightOven).toBe(0);
    expect(G.offlineCapOf(m)).toBe(4 * H);
  });

  test('a saved tier survives a round trip; junk is clamped', () => {
    const s = city(['downtown'], { nightOven: 2 });
    expect(G.migrate(JSON.parse(JSON.stringify(s)), T0).nightOven).toBe(2);
    expect(G.migrate({ nightOven: 9 }, T0).nightOven).toBe(2);
    expect(G.migrate({ nightOven: -3 }, T0).nightOven).toBe(0);
    expect(G.migrate({ nightOven: 'big' }, T0).nightOven).toBe(0);
    expect(G.migrate({ nightOven: 1.7 }, T0).nightOven).toBe(1);
  });
});
