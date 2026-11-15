/// <reference types="jest" />
import { AUCTION, BOATS, LAYER_KEYS } from '../../../../content/layers';
import { PIER9_BID } from '../../../../content/tuning';
import '../../../../engine/features';
import * as G from '../../../../engine/game';
import type { BoatsView } from '../../../../engine/features/layers/waterfront-boats';
import { layout } from '../../../scene/layout';
import { P } from '../../../scene/projection';
import {
  BOAT, BOAT_ART, RACK_STEPS, auctionCard, auctionStatus, boatBanner, boatDock, boatPose, harbourChip, rackBox, rackCard, rackStep, raiseNotice, tierName, untilNextBoat,
} from '../boats-model';

const view = (o: Partial<BoatsView> = {}): BoatsView => ({ active: true, boat: false, nextIn: 130, left: 0, rackTier: 0, rackPies: 0, rackCapacity: 0, rackPrice: 5000, auctionMult: 1, ...o });

/** A Waterfront shop with the Pier 9 bid on offer, the auction opened at play second 100. */
function auctionGame(playSeconds: number, openedAt = 100, cash = 0): G.GameState {
  const g = G.newGame(1);
  const wf = { ...g.shops.waterfront, built: true, perk: false, sold: PIER9_BID.unlockPizzas + 10 };
  return { ...g, cash, playSeconds, seenScenes: [...g.seenScenes, 'waterfront-3b'], shops: { ...g.shops, waterfront: wf }, x: { ...g.x, [LAYER_KEYS.boats]: { seed: 1, n: 0, nextAt: 400, until: 0, at: 0, tier: 0, rack: 0, carry: 0, openedAt } } };
}

describe('the warming rack in four steps', () => {
  test('empty is 0, a full rack is 4, and only those', () => {
    expect(rackStep(0, 80)).toBe(0);
    expect(rackStep(0.4, 80)).toBe(1);
    expect(rackStep(79, 80)).toBe(RACK_STEPS - 1);
    expect(rackStep(80, 80)).toBe(RACK_STEPS);
    expect(rackStep(10, 0)).toBe(0);
  });
  test('half full shows two trays; every step 0 to 4 is reachable', () => {
    expect(rackStep(40, 80)).toBe(2);
    const seen = new Set<number>();
    for (let p = 0; p <= 80; p++) seen.add(rackStep(p, 80));
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
  });
  test('it stands on the back wall at the counter\u2019s right end, clear of the front window\u2019s PIZZERIA sign, inside the room', () => {
    for (let fp = 0; fp < 5; fp++) {
      const lay = layout(fp, 2, 2, 2, 4, 3, 1);
      const b = rackBox(lay);
      const half = (30 * 1.2 * b.k) / 2;
      expect(b.k).toBeGreaterThan(0.5);
      // right of the counter's left end, left of the door's left jamb (the front window with the sign stands right of it)
      expect(b.x - half).toBeGreaterThan(P(lay.counter.x0, 100)[0]);
      expect(b.x + half).toBeLessThanOrEqual(P(lay.door.x0 + 12, 0)[0]);
      expect(b.x + half).toBeLessThan(P(lay.R, 100)[0]);
    }
  });
  test('the card names the tier, what the next holds and its price', () => {
    expect(tierName(3)).toBe('Ferry Rack');
    const c = rackCard(view({ rackTier: 2, rackCapacity: 40, rackPrice: 99_000 }));
    expect(c.title).toBe('Warming Rack');
    expect(c.detail).toBe('Trawler Rack: holds 40 · next Ferry Rack: 80');
    expect(c.cost).toBe(99_000);
    expect(rackCard(view({ rackTier: 4, rackCapacity: 160, rackPrice: null })).cost).toBeNull();
    expect(rackCard(view()).detail).toContain('No rack yet');
  });
});

describe('the boat', () => {
  test('away, then sailing in over the last seconds, docked while the crew orders, then sailing out', () => {
    expect(boatPose({ active: true, docked: false, untilNext: 100 }).phase).toBe('away');
    expect(boatPose({ active: true, docked: false, untilNext: BOAT.sailIn + 0.5 }).phase).toBe('away');
    const arriving = boatPose({ active: true, docked: false, untilNext: BOAT.sailIn / 2 });
    expect(arriving.phase).toBe('arriving');
    expect(arriving.along).toBeCloseTo(0.5, 5);
    expect(boatPose({ active: true, docked: true, untilNext: 170 })).toEqual({ phase: 'docked', along: 1 });
    expect(boatPose({ active: true, docked: false, untilNext: 170 }, 1).phase).toBe('leaving');
    expect(boatPose({ active: true, docked: false, untilNext: 170 }, BOAT.sailOut + 0.1).phase).toBe('away');
    expect(boatPose({ active: false, docked: true, untilNext: 0 }).phase).toBe('away');
  });
  test('it stays as long as the engine rush does', () => {
    expect(BOAT.stay).toBe(BOATS.rushSeconds);
    expect(BOATS.rushSeconds).toBe(30);
  });
  test('the pose moves smoothly from the edge to the dock', () => {
    let last = -1;
    for (let u = BOAT.sailIn; u > 0; u -= 0.25) {
      const a = boatPose({ active: true, docked: false, untilNext: u }).along;
      expect(a).toBeGreaterThanOrEqual(last);
      last = a;
    }
    expect(last).toBeGreaterThan(0.95);
  });
  test('the dock is at the left pier and the shop wall clips what lies behind it', () => {
    const wide = boatDock(58);
    expect(wide.x - BOAT_ART.half * BOAT_ART.scale).toBeGreaterThanOrEqual(0);
    expect(wide.visible).toBeGreaterThan(40);
    // at the flagship the margin is 21 pt: the wall hides the rest, but the stern still shows
    const narrow = boatDock(21);
    expect(narrow.visible).toBeGreaterThanOrEqual(20);
    expect(narrow.visible).toBeLessThan(wide.visible);
    // every footprint leaves at least half the boat showing
    for (let fp = 0; fp < 5; fp++) {
      const lay = layout(fp, 2, 2, 2, 4, 3, 1);
      expect(boatDock(P(lay.L, 0)[0]).visible).toBeGreaterThanOrEqual(20);
    }
  });
  test('the seconds to the next boat come from the saved schedule', () => {
    const g = auctionGame(380);
    expect(untilNextBoat(g, 0)).toBe(20);
    expect(untilNextBoat(g, 0.5)).toBe(19.5);
    expect(untilNextBoat(G.newGame(1), 0)).toBe(Infinity);
  });
  test('the banner is only for a docked boat', () => {
    expect(boatBanner(view())).toBe('');
    expect(boatBanner(view({ boat: true, left: 20 }))).toBe('Boat in! All hands on deck!');
  });
});

describe('the Pier 9 auction', () => {
  test('before the first raise the price is the bid; after two raises it is 10% up', () => {
    const none = auctionStatus(auctionGame(100 + AUCTION.stepSeconds - 1));
    expect(none).toMatchObject({ live: true, raises: 0, price: PIER9_BID.cost, maxed: false });
    expect(none.nextIn).toBe(1);
    const two = auctionStatus(auctionGame(100 + 2 * AUCTION.stepSeconds + 10));
    expect(two.raises).toBe(2);
    expect(two.price).toBe(Math.ceil(PIER9_BID.cost * 1.1));
    expect(two.nextIn).toBe(AUCTION.stepSeconds - 10);
    expect(two.cap).toBe(Math.ceil(PIER9_BID.cost * 1.5));
  });
  test('it stops at the cap', () => {
    const top = auctionStatus(auctionGame(100 + 20 * AUCTION.stepSeconds));
    expect(top.maxed).toBe(true);
    expect(top.price).toBe(top.cap);
    expect(top.raises).toBe(10);
    expect(top.nextIn).toBe(0);
  });
  test('not live before the bid is on offer', () => {
    const g = auctionGame(500);
    const off = { ...g, shops: { ...g.shops, waterfront: { ...g.shops.waterfront, sold: 0 } } };
    expect(auctionStatus(off).live).toBe(false);
    expect(auctionStatus(auctionGame(500, -1)).live).toBe(false);
  });
  test('the bid card shows the price, the raise with the time to the next, and the cap', () => {
    const g = auctionGame(100 + 2 * AUCTION.stepSeconds + 10, 100, 135_000_000);
    const c = auctionCard(auctionStatus(g), g.cash);
    expect(c.raised).toBe('MegaSlice raised it. $132M wins Pier 9');
    expect(c.next).toBe('Next raise 1:50');
    expect(c.cap).toBe('Bid cap $180M');
    expect(c.canBuy).toBe(true);
    expect(auctionCard(auctionStatus(g), 1e6).canBuy).toBe(false);
    expect(auctionCard(auctionStatus(auctionGame(120)), 0).raised).toBe('');
    expect(auctionCard(auctionStatus(auctionGame(100 + 20 * AUCTION.stepSeconds)), 0).next).toBe('');
  });
  test('a raise that puts the bid out of reach says "Outbid!"', () => {
    expect(raiseNotice(120e6, 126e6, 125e6)).toBe('Outbid! You need $126M for Pier 9');
    expect(raiseNotice(120e6, 126e6, 10e6)).toBe('MegaSlice raised it. $126M wins Pier 9');
    expect(raiseNotice(120e6, 126e6, 130e6)).toBe('MegaSlice raised it. $126M wins Pier 9');
    expect(raiseNotice(126e6, 126e6, 0)).toBe('');
  });
});

describe('the harbour chip', () => {
  const idle = auctionStatus(G.newGame(1));
  const live = auctionStatus(auctionGame(100 + 2 * AUCTION.stepSeconds + 10));
  test('a docked boat shows anywhere, hot', () => {
    expect(harbourChip(view({ boat: true, left: 22 }), idle, 'downtown')).toEqual({ text: 'Boat docked 0:22', hot: true, sheet: 'boat' });
  });
  test('otherwise only beside the Waterfront shop: the auction clock, else the next boat', () => {
    expect(harbourChip(view(), idle, 'downtown')).toBeNull();
    expect(harbourChip(view(), live, 'waterfront')).toEqual({ text: 'Next raise 1:50', hot: false, sheet: 'auction' });
    expect(harbourChip(view({ nextIn: 125 }), idle, 'waterfront')).toEqual({ text: 'Next boat 2:05', hot: false, sheet: 'boat' });
    expect(harbourChip(view({ active: false }), idle, 'waterfront')).toBeNull();
  });
});
