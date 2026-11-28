/// <reference types="jest" />
import { AUCTION, BOATS, LAYER_KEYS } from '../../../../content/layers';
import '../../../../engine/features';
import * as G from '../../../../engine/game';
import type { BoatsView } from '../../../../engine/features/layers/boats';
import { layout } from '../../../scene/layout';
import { toDrawSpace } from '../../../scene/layout-space';
import { P } from '../../../scene/projection';
import {
  BOAT,
  BOAT_ART,
  BOAT_PAD,
  RACK_STEPS,
  auctionCard,
  auctionStatus,
  boatBanner,
  boatDock,
  boatPose,
  harbourChip,
  rackBox,
  rackCard,
  rackStep,
  raiseNotice,
  tierName,
  untilNextBoat,
} from '../boats-model';

import { PIER9_BID } from '../../../../content/cities/home/data';
const view = (o: Partial<BoatsView> = {}): BoatsView => ({
  active: true,
  boat: false,
  nextIn: 130,
  left: 0,
  rackTier: 0,
  rackPies: 0,
  rackCapacity: 0,
  rackPrice: 5000,
  auctionMult: 1,
  ...o,
});

/** A Waterfront shop with the Pier 9 bid on offer, the auction opened at play second 100. */
function auctionGame(playSeconds: number, openedAt = 100, cash = 0): G.GameState {
  const g = G.newGame(1);
  const wf = { ...g.shops.waterfront, built: true, perk: false, sold: PIER9_BID.unlockPizzas + 10 };
  return {
    ...g,
    cash,
    playSeconds,
    seenScenes: [...g.seenScenes, 'waterfront-3b'],
    shops: { ...g.shops, waterfront: wf },
    x: { ...g.x, [LAYER_KEYS.boats]: { seed: 1, n: 0, nextAt: 400, until: 0, at: 0, tier: 0, rack: 0, carry: 0, openedAt } },
  };
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
  test('it stands on the back wall at the counter\u2019s right end, off the glazed front\u2019s window frame and sign, inside the room', () => {
    for (let fp = 0; fp < 5; fp++) {
      const lay = layout(fp, 2, 2, 2, 4, 3, 1);
      const b = rackBox(lay);
      const half = (30 * 1.2 * b.k) / 2;
      expect(b.k).toBeGreaterThan(0.5);
      // right of the counter's left end; left of where the front window's frame starts (facade.tsx: door.x0 - 8), even at the widest tier (D482)
      expect(b.x - half).toBeGreaterThan(P(lay.counter.x0, 100)[0]);
      expect(b.x + half).toBeLessThanOrEqual(P(lay.door.x0 - 8, 0)[0] - 2);
      expect(b.x + half).toBeLessThan(P(lay.R, 100)[0]);
    }
  });
  test('in the mirrored plan the rack is the plain one reflected: between the door and the counter, off the jamb', () => {
    for (let fp = 0; fp < 5; fp++) {
      // the draw space, where the default `P` is right (shopLayout(...).draw)
      const plain = toDrawSpace(layout(fp, 2, 2, 2, 4, 3, 1));
      const lay = toDrawSpace(layout(fp, 2, 2, 2, 4, 3, 1, undefined, true));
      const b = rackBox(lay);
      expect(b.x).toBeCloseTo(2 * lay.frame.vanishX - rackBox(plain).x, 6);
      const half = (30 * 1.2 * b.k) / 2;
      // left of the counter's right end, right of the front window's frame (the jamb's right side: door.x1 + 8 on the front plane)
      expect(b.x + half).toBeLessThan(P(lay.counter.x1, 100)[0]);
      expect(b.x - half).toBeGreaterThanOrEqual(P(lay.door.x1 + 8, 0)[0] + 2);
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
  test('docked, the whole hull is on screen and clear of the shop wall at every footprint (D482)', () => {
    for (let fp = 0; fp < 5; fp++) {
      const lay = layout(fp, 2, 2, 2, 4, 3, 1);
      const wall = P(lay.L, 0)[0];
      const d = boatDock(wall);
      expect(d.left).toBeGreaterThanOrEqual(2.4 - 1e-9);
      expect(d.right).toBeLessThanOrEqual(wall - 2.4 + 1e-9);
      expect(d.scale).toBeGreaterThanOrEqual(BOAT_ART.minScale);
      // still a boat, not a speck
      expect(d.right - d.left).toBeGreaterThanOrEqual(16);
    }
    // D482: it floats on the sea band: hull and wake end above the beach, the waterline is below the horizon, and a gap is left to the wall
    for (const wall of [21, 40, 64, 120]) {
      const d = boatDock(wall);
      expect(BOAT_ART.waterline + BOAT_ART.wake * d.scale).toBeLessThan(BOAT_ART.sandTop);
      expect(BOAT_ART.waterline).toBeGreaterThan(BOAT_ART.seaTop);
      if (wall >= 40) expect(wall - d.right).toBeGreaterThanOrEqual(BOAT_PAD - 1e-9);
    }
    // a wide margin gets the full-size boat; a narrow one a smaller boat in the middle of the strip
    expect(boatDock(120).scale).toBe(BOAT_ART.scale);
    expect(boatDock(40).scale).toBeLessThan(boatDock(64).scale);
    expect(boatDock(40).x).toBe(20);
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
    const g = auctionGame(100 + 2 * AUCTION.stepSeconds + 10, 100, 5_400_000_000);
    const c = auctionCard(auctionStatus(g), g.cash);
    expect(c.raised).toBe('MegaSlice raised it. $1.65B wins Pier 9');
    expect(c.next).toBe('Next raise 1:50');
    expect(c.cap).toBe('Bid cap $7.05B');
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
    expect(harbourChip(view({ boat: true, left: 22 }), idle, 'downtown', undefined, 'waterfront')).toEqual({
      text: 'Boat docked 0:22',
      hot: true,
      sheet: 'boat',
    });
  });
  test('otherwise only beside the Waterfront shop: the auction clock, else the next boat', () => {
    expect(harbourChip(view(), idle, 'downtown', undefined, 'waterfront')).toBeNull();
    expect(harbourChip(view(), live, 'waterfront', undefined, 'waterfront')).toEqual({ text: 'Next raise 1:50', hot: false, sheet: 'auction' });
    expect(harbourChip(view({ nextIn: 125 }), idle, 'waterfront', undefined, 'waterfront')).toEqual({ text: 'Next boat 2:05', hot: false, sheet: 'boat' });
    expect(harbourChip(view({ active: false }), idle, 'waterfront', undefined, 'waterfront')).toBeNull();
  });
});
