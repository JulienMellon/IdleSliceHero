/**
 * @jest-environment <rootDir>/src/engine/__tests__/tz-env.js
 */
// Friday Night Rush and Big Game Day (v5.15): on and off at the boundaries, who they apply to, never offline, and how they
// combine with boosts (docs/REWARDS.md: boosts add).
import { EVENTS } from '../../content/endgame';
import { NEIGHBORHOODS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { getFeature } from '../features';
import { activeEvent, events, eventView } from '../features/events';
import * as G from '../game';
import * as R from '../rewards';

const IDS = NEIGHBORHOODS.map((n) => n.id);
const at = (y: number, m: number, d: number, h = 0, mi = 0, s = 0) => new Date(y, m - 1, d, h, mi, s).getTime();
// 2026-11-13 is a Friday, 11-14 a Saturday, 11-15 a Sunday
const FRI = (h: number, mi = 0, s = 0) => at(2026, 11, 13, h, mi, s);
const SUN = (h: number, mi = 0, s = 0) => at(2026, 11, 15, h, mi, s);
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } } });

/** Every shop built, kitchens far ahead of demand so the demand side decides, and a full set of heads. */
function city(now: number): G.GameState {
  let g = G.newGame(now);
  for (const id of IDS) g = withShop(g, id, { built: true, managed: true, heads: G.allHeads(), prep: 40, ovens: 40, counter: 40, footprint: 3, tables: 5, drivers: 2 });
  return { ...g, lastSavedAt: now };
}
const base = (now: number) => G.playTick(city(now), 1, now - 60_000); // an ordinary tick well before: nothing running
const running = (now: number) => G.playTick(city(now), 1, now);
/** What the event alone does to a shop's value (the managed shops' recipe cards are in both). */
const eventMult = (g: G.GameState, id: NeighborhoodId, now: number) => G.featureMults(g, id, now).value / G.featureMults(base(now), id, now).value;

describe('the schedule', () => {
  it('Friday Night Rush: on at 17:00:00, off at 21:00:00, never the other days', () => {
    expect(activeEvent(FRI(16, 59, 59))).toBeNull();
    expect(activeEvent(FRI(17))?.id).toBe('friday-rush');
    expect(activeEvent(FRI(20, 59, 59))?.id).toBe('friday-rush');
    expect(activeEvent(FRI(21))).toBeNull();
    expect(activeEvent(at(2026, 11, 12, 18))).toBeNull(); // Thursday
    expect(activeEvent(at(2026, 11, 14, 18))).toBeNull(); // Saturday
  });

  it('Big Game Day: on at 13:00:00, off at 16:00:00, Sunday only', () => {
    expect(activeEvent(SUN(12, 59, 59))).toBeNull();
    expect(activeEvent(SUN(13))?.id).toBe('game-day');
    expect(activeEvent(SUN(15, 59, 59))?.id).toBe('game-day');
    expect(activeEvent(SUN(16))).toBeNull();
    expect(activeEvent(at(2026, 11, 16, 14))).toBeNull(); // Monday
    expect(activeEvent(FRI(14))).toBeNull(); // Friday afternoon is not game day
  });

  it('is local time, so a time-zone change moves it', () => {
    const old = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      const instant = FRI(18);
      expect(activeEvent(instant)?.id).toBe('friday-rush');
      process.env.TZ = 'Pacific/Auckland';
      expect(activeEvent(instant)).toBeNull();
    } finally {
      if (old === undefined) delete process.env.TZ;
      else process.env.TZ = old;
    }
  });

  it('eventView: the running event with its time left, or the next one inside 60 minutes with a countdown', () => {
    expect(eventView(FRI(18))).toMatchObject({ active: true, seconds: 3 * 3600, def: { id: 'friday-rush' } });
    expect(eventView(FRI(16, 0, 0))).toMatchObject({ active: false, seconds: 3600, def: { id: 'friday-rush' } }); // exactly 60 min
    expect(eventView(FRI(16, 30))).toMatchObject({ active: false, seconds: 1800 });
    expect(eventView(FRI(15, 59, 59))).toBeNull(); // 60 min and a second
    expect(eventView(FRI(21))).toBeNull();
    expect(eventView(SUN(12, 15))).toMatchObject({ active: false, seconds: 45 * 60, def: { id: 'game-day' } });
    expect(eventView(at(2026, 11, 14, 12))).toBeNull();
    expect(eventView(SUN(15, 59, 59))).toMatchObject({ active: true, seconds: 1 });
  });
});

describe('while the app is open', () => {
  it("Friday Night Rush multiplies every shop's value by 1.5", () => {
    const g = running(FRI(18));
    for (const id of IDS) expect(eventMult(g, id, FRI(18))).toBeCloseTo(1.5, 12);
    expect(G.shopEarnings(g, 'uptown', FRI(18)) / G.shopEarnings(base(FRI(18)), 'uptown', FRI(18))).toBeCloseTo(1.5, 9);
  });

  it('Big Game Day doubles Suburbs and Downtown only', () => {
    const g = running(SUN(14));
    for (const id of IDS) expect(eventMult(g, id, SUN(14))).toBeCloseTo(id === 'suburbs' || id === 'downtown' ? 2 : 1, 12);
  });

  it('it is off again at the boundary on the next tick', () => {
    let g = running(FRI(20, 59, 58));
    expect(eventMult(g, 'uptown', FRI(20, 59, 58))).toBeCloseTo(1.5, 12);
    g = G.playTick(g, 1, FRI(21));
    expect(getFeature(g, events).id).toBeNull();
    expect(eventMult(g, 'uptown', FRI(21))).toBe(1);
  });

  it('a running line pays the event price', () => {
    const paid = (start: number) => {
      let g = city(start);
      for (let i = 0; i < 120; i++) g = G.playTick(g, 1, start + i * 1000);
      return g.totalEarned;
    };
    const ratio = paid(FRI(18)) / paid(at(2026, 11, 12, 18));
    expect(ratio).toBeGreaterThan(1.4);
    expect(ratio).toBeLessThan(1.6);
  });

  it('adds with boosts instead of multiplying: 2x boost + 1.5x event = 2.5x', () => {
    const now = FRI(18);
    const boosted = (g: G.GameState): G.GameState => ({ ...g, rewards: { ...g.rewards, boosts: [{ mult: 2, until: now + 3_600_000, source: 't' }], lastSeen: now } });
    const withEvent = boosted(running(now));
    const plain = boosted(base(now));
    const perSecond = (g: G.GameState) => G.shopEarnings(g, 'uptown', now) * G.boostMult(g, now);
    expect(perSecond(withEvent) / perSecond(plain)).toBeCloseTo((1 + 1 + 0.5) / 2, 9); // (1 + (2-1) + (1.5-1)) / (1 + (2-1))
    expect(perSecond(withEvent)).toBeCloseTo(G.shopEarnings(base(now), 'uptown', now) * 2.5, 6);
  });

  it('the line pays the added price too, through the pipeline', () => {
    const earn = (start: number) => {
      let g = city(start);
      g = { ...g, rewards: { ...g.rewards, boosts: [{ mult: 2, until: start + 9e6, source: 't' }], lastSeen: start } };
      const c = g.totalEarned;
      for (let i = 0; i < 90; i++) g = G.playTick(g, 1, start + i * 1000);
      return g.totalEarned - c;
    };
    const ratio = earn(FRI(18)) / earn(at(2026, 11, 12, 18));
    expect(ratio).toBeGreaterThan(1.2);
    expect(ratio).toBeLessThan(1.3); // 2.5 / 2, not 1.5
  });
});

describe('T86 cash rewards are not inflated by an event (C111)', () => {
  const now = FRI(18);
  it('rewardIncome during an event equals the off-event value, with and without a 2x boost', () => {
    const boosted = (g: G.GameState): G.GameState => ({ ...g, rewards: { ...g.rewards, boosts: [{ mult: 2, until: now + 3_600_000, source: 't' }], lastSeen: now } });
    const on = running(now);
    expect(G.earningsPerSecond(on)).toBeCloseTo(G.earningsPerSecond(base(now)) * 1.5, 6); // the readout at the stamp does show the event
    expect(R.rewardIncome(on)).toBeCloseTo(R.rewardIncome(base(now)), 6);
    expect(R.rewardIncome(boosted(on))).toBeCloseTo(R.rewardIncome(boosted(base(now))), 6);
    expect(R.minutesToCash(boosted(on), 30)).toBeCloseTo(R.minutesToCash(base(now), 30), 3);
  });

  it('a daily-task claim pays the same in and out of an event', () => {
    const claim = (g: G.GameState) => {
      const s = { ...g, seenScenes: ['downtown-4'], rewards: { ...g.rewards, lastSeen: 0, daily: [{ kind: 'upgrades' as const, target: 1, base: 0, claimed: false }], day: R.dayKey(now) }, stats: { ...g.stats, upgrades: 5 } };
      const r = R.claimDaily(s, 0, now);
      if (!r.ok) throw new Error(r.reason);
      return r.state.cash - s.cash;
    };
    expect(claim(running(now))).toBeCloseTo(claim(base(now)), 3);
  });
});

describe('freshness is 0 <= now - stamp <= 5 s (C111)', () => {
  it('a readout dated before the stamp gets no event', () => {
    const g = running(FRI(18));
    expect(eventMult(g, 'uptown', FRI(18) - 1)).toBe(1);
    expect(eventMult(g, 'uptown', FRI(18))).toBeCloseTo(1.5, 12);
    expect(eventMult(g, 'uptown', FRI(18, 0, 5))).toBeCloseTo(1.5, 12);
    expect(eventMult(g, 'uptown', FRI(18, 0, 5) + 1)).toBe(1);
  });
});

describe('never offline', () => {
  const away = (g: G.GameState, from: number, to: number) => G.applyOffline({ ...g, lastSavedAt: from }, to);

  it('earnings while the app was closed match a day with no event', () => {
    const from = FRI(17, 30);
    const open = running(from); // the app was open and the event running when it closed
    const calm = G.playTick(city(at(2026, 11, 12, 17, 30)), 1, at(2026, 11, 12, 17, 30));
    const inEvent = away(open, from, FRI(19, 30));
    const noEvent = away(calm, at(2026, 11, 12, 17, 30), at(2026, 11, 12, 19, 30));
    expect(inEvent.earned).toBeCloseTo(noEvent.earned, 4);
    expect(inEvent.earned).toBeGreaterThan(0);
  });

  it('a cold start inside the window gets no event until the first foreground tick', () => {
    const saved = JSON.parse(JSON.stringify(running(FRI(18))));
    const loaded = G.migrate(saved, FRI(18, 10));
    expect(getFeature(loaded, events)).toEqual({ id: null, at: 0 });
    expect(eventMult(loaded, 'uptown', FRI(18, 10))).toBe(1);
    const back = G.playTick(loaded, 1, FRI(18, 10));
    expect(eventMult(back, 'uptown', FRI(18, 10))).toBeCloseTo(1.5, 12);
  });

  it('an in-memory return after the app was away is not boosted either', () => {
    const open = running(FRI(18));
    expect(eventMult(open, 'uptown', FRI(18, 0, 4))).toBeCloseTo(1.5, 12);
    expect(eventMult(open, 'uptown', FRI(18, 0, 30))).toBe(1); // the foreground tick is stale
  });
});

describe('the state', () => {
  it('stays still between stamps and while no event runs', () => {
    const a = running(FRI(18));
    expect(G.playTick(a, 1, FRI(18) + 500).x).toBe(a.x);
    expect(G.playTick(a, 1, FRI(18) + 2500).x).not.toBe(a.x);
    const calm = G.playTick(city(at(2026, 11, 12, 18)), 1, at(2026, 11, 12, 18));
    expect(G.playTick(calm, 1, at(2026, 11, 12, 18) + 5000).x).toBe(calm.x);
  });

  it('is never saved as running', () => {
    expect(events.migrate({ id: 'friday-rush', at: FRI(18) }, 0)).toEqual({ id: null, at: 0 });
  });

  it('the schedule is data: two events', () => {
    expect(EVENTS.map((e) => e.id)).toEqual(['friday-rush', 'game-day']);
  });
});
