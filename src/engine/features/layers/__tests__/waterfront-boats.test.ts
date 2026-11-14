// Waterfront, boats and the warming rack (v5.16): the schedule, the rack's fill and drain, its prices, the Pier 9 live auction and old saves.
import { AUCTION, BOATS, auctionMult } from '../../../../content/layers';
import { PIER9_BID } from '../../../../content/tuning';
import { getFeature, withFeatures } from '../../index';
import * as G from '../../../game';
import { freshTimed, gapOf, stepTimed, type Timed } from '../suburbs-gameday';
import { boatsView, buyRack, pier9AuctionMult, rackCapacity, rackLock, rackPrice, waterfrontBoats } from '../waterfront-boats';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const HOOD = BOATS.hood;
const patch = (g: G.GameState, p: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [HOOD]: { ...g.shops[HOOD], ...p } } });
const run = <T>(fn: () => T): T => withFeatures([waterfrontBoats], fn);
const state = (g: G.GameState) => getFeature(g, waterfrontBoats);
const withState = (g: G.GameState, p: object): G.GameState => ({ ...g, x: { ...g.x, [waterfrontBoats.key]: { ...state(g), ...p } } });
function play(g: G.GameState, seconds: number, now = NOW): G.GameState {
  for (let i = 0; i < seconds; i++) g = G.playTick(g, 1, now);
  return g;
}

/** Waterfront built and running, with demand the slow stage between boats and the oven the slow stage in a boat's rush (so the rack has spare to store and a gap to fill). */
function dock(tier = 0): G.GameState {
  let g = G.newGame(NOW);
  const base = { built: true, managed: true, heads: G.allHeads(), tables: 3, drivers: 2, counter: 200, ovens: 200, footprint: 4 };
  g = patch(g, base);
  // search the prep and seating levels for a kitchen 1.5 to 2.5 times the demand (the milestones' jumps make a single level too coarse)
  for (let prep = 1; prep <= 60; prep++) {
    for (let tables = 1; tables <= 60; tables++) {
      const shop = { ...g.shops[HOOD], prep, tables };
      const ratio = G.prepRate(shop) / G.demandRate(shop, g.vehicle);
      if (ratio > 1.5 && ratio < 2.5) return withState(patch(g, { prep, tables }), { tier });
    }
  }
  throw new Error('no levels fit the fixture');
}
const rates = (g: G.GameState) => ({ sold: G.shopRate(g.shops[HOOD], g.vehicle), demand: G.demandRate(g.shops[HOOD], g.vehicle), kitchen: G.prepRate(g.shops[HOOD]) });
/** Put a boat at the dock now. */
const boatIn = (g: G.GameState, left = BOATS.rushSeconds): G.GameState => withState(g, { nextAt: g.playSeconds + 1000, until: g.playSeconds + left, at: NOW });

describe('the schedule', () => {
  it('replays from the same seed, 3 minutes apart, and differs with another', () => {
    const starts = (seed: number) => {
      let t: Timed = { ...freshTimed(0), seed };
      const out: number[] = [];
      for (let p = 0; p < 3600; p++) {
        const n = t.n;
        t = stepTimed(t, p, NOW, BOATS);
        if (t.n > n) out.push(p);
      }
      return out;
    };
    expect(starts(9)).toEqual(starts(9));
    expect(starts(9)).not.toEqual(starts(10));
    const a = starts(9);
    expect(a.length).toBeGreaterThanOrEqual(15);
    for (let i = 1; i < a.length; i++) expect(Math.abs(a[i] - a[i - 1] - BOATS.everySeconds)).toBeLessThanOrEqual(BOATS.everySeconds * BOATS.jitter * 2 + 1);
  });

  it('is inactive until the Waterfront shop is built', () => {
    run(() => {
      const g = G.newGame(NOW);
      const after = play(g, 500);
      expect(state(after)).toMatchObject({ nextAt: -1, rack: 0, openedAt: -1 });
      expect(boatsView(after, NOW).active).toBe(false);
      expect(waterfrontBoats.shopDemandMult!(after, HOOD, NOW)).toBe(1);
      expect(buyRack(after)).toEqual({ ok: false, reason: 'Build this pizzeria first' });
    });
  });

  it('a boat docks for 30 s with demand x3, and only while the app is open', () => {
    run(() => {
      let g = play(dock(), 1);
      g = play({ ...g, playSeconds: state(g).nextAt - 1 }, 2);
      expect(boatsView(g, NOW)).toMatchObject({ active: true, boat: true });
      expect(G.featureMults(g, HOOD, NOW).demand).toBe(BOATS.demandMult);
      expect(G.featureMults(g, HOOD, NOW + 3600_000).demand).toBe(1);
      expect(G.featureMults(g, 'downtown', NOW).demand).toBe(1);
      expect(boatsView(play(g, BOATS.rushSeconds + 1), NOW).boat).toBe(false);
    });
  });

  it('does not re-roll when the clock changes', () => {
    run(() => {
      const steady = play(dock(), 600);
      let jumpy = dock();
      const clocks = [NOW, NOW - 4 * 86_400_000, NOW + 40 * 86_400_000];
      for (let i = 0; i < 600; i++) jumpy = G.playTick(jumpy, 1, clocks[i % 3]);
      expect({ n: state(jumpy).n, nextAt: state(jumpy).nextAt }).toEqual({ n: state(steady).n, nextAt: state(steady).nextAt });
    });
  });
});

describe('the warming rack', () => {
  it('has four tiers of 20 / 40 / 80 / 160 pies, priced 5 / 15 / 45 / 120 minutes of the shop’s income', () => {
    run(() => {
      let g = { ...dock(), cash: 1e15 };
      const income = G.shopRevenue(HOOD, g.shops[HOOD], g.vehicle);
      expect([1, 2, 3, 4].map(rackCapacity)).toEqual([20, 40, 80, 160]);
      for (const [i, minutes] of [5, 15, 45, 120].entries()) {
        expect(rackPrice(g)).toBe(Math.ceil(minutes * 60 * income));
        const before = g.cash;
        const r = buyRack(g);
        if (!r.ok) throw new Error(r.reason);
        g = r.state;
        expect(before - g.cash).toBe(Math.ceil(minutes * 60 * income));
        expect(state(g).tier).toBe(i + 1);
      }
      expect(rackPrice(g)).toBeNull();
      expect(rackLock(g)).toBe('Biggest rack there is');
      expect(buyRack(g).ok).toBe(false);
    });
  });

  it('prices at the shop’s income at purchase time, and needs the cash', () => {
    run(() => {
      const g = { ...dock(), cash: 0 };
      expect(buyRack(g)).toEqual({ ok: false, reason: 'Not enough cash' });
      const richer = patch(g, { tables: 30, drivers: 30 });
      expect(G.shopRevenue(HOOD, richer.shops[HOOD], g.vehicle)).toBeGreaterThan(G.shopRevenue(HOOD, g.shops[HOOD], g.vehicle));
      expect(rackPrice(richer)!).toBeGreaterThan(rackPrice(g)!);
    });
  });

  it('fills from the oven’s spare output between boats, up to its size', () => {
    run(() => {
      const g0 = withState(dock(2), { nextAt: 1e9 });
      const r = rates(g0);
      expect(r.kitchen).toBeGreaterThan(r.sold);
      const g = play(g0, 10);
      expect(state(g).rack).toBeCloseTo((r.kitchen - r.sold) * 10, 5);
      expect(boatsView(g, NOW).rackPies).toBe(Math.floor((r.kitchen - r.sold) * 10));
      const full = play(g0, 600);
      expect(state(full).rack).toBe(rackCapacity(2));
      // no rack, nothing stored
      expect(state(play(withState(dock(0), { nextAt: 1e9 }), 10)).rack).toBe(0);
    });
  });

  it('empties into the boat’s rush: whole pies sold, paid and counted', () => {
    run(() => {
      const g0 = boatIn(withState(dock(4), { rack: 100, nextAt: 1e9 }));
      const g = G.playTick(g0, 1, NOW);
      const fx = G.featureMults(g0, HOOD, NOW);
      const unmet = G.demandRate(g0.shops[HOOD], g0.vehicle, fx) - G.shopRate(g0.shops[HOOD], g0.vehicle, fx);
      expect(unmet).toBeGreaterThan(0);
      expect(100 - state(g).rack - state(g).carry).toBeGreaterThan(0);
      const drained = 100 - state(g).rack;
      // pies sold over the whole boat: every drained pie is counted once the carry is whole
      const done = play(g0, BOATS.rushSeconds - 1);
      const sold = done.shops[HOOD].sold - g0.shops[HOOD].sold;
      const gone = 100 - state(done).rack - state(done).carry;
      expect(drained).toBeGreaterThan(0);
      expect(sold).toBeGreaterThanOrEqual(Math.floor(gone) - 0); // the rack's pies plus the kitchen's own
      expect(gone).toBeGreaterThan(unmet * (BOATS.rushSeconds - 3));
      expect(state(done).rack).toBeLessThan(100);
      expect(done.cash).toBeGreaterThan(g0.cash);
    });
  });

  it('the rack’s pies pay: a boat with a full rack earns more than one with none', () => {
    run(() => {
      const withRack = play(boatIn(withState(dock(4), { rack: 160, nextAt: 1e9 })), BOATS.rushSeconds - 1);
      const without = play(boatIn(withState(dock(0), { nextAt: 1e9 })), BOATS.rushSeconds - 1);
      expect(withRack.shops[HOOD].sold).toBeGreaterThan(without.shops[HOOD].sold);
      expect(withRack.totalEarned).toBeGreaterThan(without.totalEarned);
      expect(state(withRack).rack).toBeLessThan(160);
    });
  });

  it('does not fill or drain while the app is closed (play time only)', () => {
    run(() => {
      const g = withState(dock(3), { rack: 30, nextAt: 1e9 });
      const r = G.applyOffline({ ...g, lastSavedAt: NOW }, NOW + 3600_000);
      expect(state(r.state).rack).toBe(30);
    });
  });
});

describe('the Pier 9 live auction', () => {
  it('is +5% of the base every 2 minutes of play, capped at +50%', () => {
    expect(auctionMult(-1, 5000)).toBe(1);
    expect(auctionMult(100, 100)).toBe(1);
    expect(auctionMult(100, 100 + 119)).toBe(1);
    expect(auctionMult(100, 100 + 120)).toBeCloseTo(1.05, 10);
    expect(auctionMult(100, 100 + 600)).toBeCloseTo(1.25, 10);
    expect(auctionMult(100, 100 + 20 * 60)).toBeCloseTo(1.5, 10);
    expect(auctionMult(100, 100 + 100 * 60)).toBeCloseTo(1 + AUCTION.maxShare, 10);
  });

  /** Waterfront with the bid on offer (beat 3 seen, enough pies sold, enough cash). */
  const bidding = () => {
    const g = patch(G.newGame(NOW), { built: true, sold: PIER9_BID.unlockPizzas });
    return { ...g, seenScenes: ['waterfront-3', 'waterfront-3b'], cash: PIER9_BID.cost * 2 };
  };

  it('opens when the bid does, runs on play seconds, and the bid price follows it', () => {
    run(() => {
      let g = bidding();
      expect(G.pier9Available(g)).toBe(true);
      expect(pier9AuctionMult(g)).toBe(1);
      expect(G.pier9Price(g)).toBe(PIER9_BID.cost);
      g = play(g, 1);
      expect(state(g).openedAt).toBe(g.playSeconds);
      // the clock changing changes nothing
      g = G.playTick(g, 1, NOW + 9 * 86_400_000);
      expect(pier9AuctionMult(g)).toBe(1);
      g = { ...g, playSeconds: g.playSeconds + 300 };
      expect(pier9AuctionMult(g)).toBeCloseTo(1.1, 10);
      expect(G.pier9Price(g)).toBe(Math.ceil(PIER9_BID.cost * 1.1));
      const paid = G.bidPier9(g);
      if (!paid.ok) throw new Error(paid.reason);
      expect(g.cash - paid.state.cash).toBe(Math.ceil(PIER9_BID.cost * 1.1));
      expect(paid.state.shops[HOOD].perk).toBe(true);
      // capped at +50%, and the bid needs the raised price
      const late = { ...g, playSeconds: g.playSeconds + 10_000 };
      expect(G.pier9Price(late)).toBe(Math.ceil(PIER9_BID.cost * 1.5));
      expect(G.bidPier9({ ...late, cash: PIER9_BID.cost * 1.2 }).ok).toBe(false);
    });
  });

  it('does not run before the bid opens or without the layer', () => {
    run(() => {
      const g = play(patch(G.newGame(NOW), { built: true, sold: 10 }), 3000);
      expect(state(g).openedAt).toBe(-1);
      expect(G.pier9Price(g)).toBe(PIER9_BID.cost);
    });
    // no feature registered at all: the plain bid
    withFeatures([], () => expect(G.pier9Price(bidding())).toBe(PIER9_BID.cost));
  });
});

describe('old saves', () => {
  it('a v5.15 save loads with no rack, an unopened auction and a schedule that starts now', () => {
    const saved = JSON.parse(JSON.stringify(patch(G.newGame(NOW), { built: true, sold: PIER9_BID.unlockPizzas })));
    delete saved.x;
    saved.seenScenes = ['waterfront-3', 'waterfront-3b'];
    saved.playSeconds = 7000;
    run(() => {
      const g = G.migrate(saved, NOW);
      expect(state(g)).toMatchObject({ tier: 0, rack: 0, nextAt: -1, until: 0, openedAt: -1 });
      expect(pier9AuctionMult(g)).toBe(1);
      const t = G.playTick(g, 1, NOW);
      expect(state(t).nextAt).toBeCloseTo(7001 + gapOf(state(t), 0, BOATS), 5);
      // a bid already open starts its auction now, not at some earlier time
      expect(state(t).openedAt).toBe(7001);
    });
  });

  it('keeps a saved rack and clamps it to its size', () => {
    const m = waterfrontBoats.migrate({ seed: 1, n: 2, nextAt: 500, until: 0, tier: 2, rack: 999, carry: 0.5, openedAt: 300 }, NOW);
    expect(m).toMatchObject({ tier: 2, rack: 40, carry: 0.5, openedAt: 300, nextAt: 500 });
    expect(waterfrontBoats.migrate({ tier: 9, rack: -4, openedAt: 'x' }, NOW)).toMatchObject({ tier: 4, rack: 0, openedAt: -1 });
  });
});
