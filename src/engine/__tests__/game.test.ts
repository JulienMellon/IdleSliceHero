/// <reference types="jest" />
import * as G from '../game';
import { NEIGHBORHOODS, TUNING, VEHICLES } from '../../content/tuning';

const fresh = () => G.newGame(1_000_000);

describe('economy formulas', () => {
  test('cost grows 15% per level', () => {
    expect(G.upgradeCost(100, 0)).toBe(100);
    expect(G.upgradeCost(100, 1)).toBe(115);
    expect(G.upgradeCost(100, 10)).toBe(Math.ceil(100 * 1.15 ** 10));
  });
  test('milestones double output at 25/50/100', () => {
    expect(G.milestoneMultiplier(24)).toBe(1);
    expect(G.milestoneMultiplier(25)).toBe(2);
    expect(G.milestoneMultiplier(50)).toBe(4);
    expect(G.milestoneMultiplier(100)).toBe(8);
    expect(G.nextMilestone(30)).toBe(50);
    expect(G.nextMilestone(100)).toBeNull();
  });
  test('farther neighborhoods always pay more per second of driving', () => {
    for (let i = 1; i < NEIGHBORHOODS.length; i++) {
      const a = NEIGHBORHOODS[i - 1], b = NEIGHBORHOODS[i];
      expect(b.orderValue / b.distance).toBeGreaterThan(a.orderValue / a.distance);
    }
  });
});

describe('baking and delivering', () => {
  test('oven is idle until tapped, then bakes one batch', () => {
    let s = fresh();
    s = G.tick(s, 10);
    expect(s.stock).toBe(0);
    s = G.tapOven(s);
    s = G.tick(s, G.bakeSeconds(1) + 0.01);
    expect(s.batchProgress).toBe(-1);
    expect(s.cash).toBeGreaterThan(0);
  });
  test('tapping a baking oven rushes it', () => {
    let s = G.tapOven(fresh());
    s = G.tapOven(s);
    expect(s.batchProgress).toBeGreaterThan(0);
  });
  test('auto-bake keeps producing and earns at steady state', () => {
    let s = { ...fresh(), autoBake: true };
    for (let i = 0; i < 600; i++) s = G.tick(s, 1);
    const eps = G.earningsPerSecond(s);
    const before = s.cash;
    for (let i = 0; i < 100; i++) s = G.tick(s, 1);
    expect((s.cash - before) / 100).toBeCloseTo(eps, 1);
  });
  test('fast ovens are not capped by the tick rate (Lv 72, 5 Hz ticks)', () => {
    let s = { ...fresh(), autoBake: true, ovenLevel: 72, drivers: 41, vehicle: 3, unlocked: NEIGHBORHOODS.map((n) => n.id) };
    for (let i = 0; i < 50; i++) s = G.tick(s, 0.2);
    const before = s.cash;
    for (let i = 0; i < 500; i++) s = G.tick(s, 0.2);
    const actual = (s.cash - before) / 100;
    expect(actual / G.earningsPerSecond(s)).toBeGreaterThan(0.98);
    expect(actual / G.earningsPerSecond(s)).toBeLessThan(1.02);
  });
  test('throughput matches the formula across oven levels', () => {
    for (const ovenLevel of [1, 10, 25, 50, 100, 150]) {
      let s = { ...fresh(), autoBake: true, ovenLevel, drivers: 300, vehicle: 4, unlocked: NEIGHBORHOODS.map((n) => n.id) };
      for (let i = 0; i < 100; i++) s = G.tick(s, 0.2);
      const before = s.cash;
      for (let i = 0; i < 500; i++) s = G.tick(s, 0.2);
      expect(((s.cash - before) / 100) / G.earningsPerSecond(s)).toBeGreaterThan(0.95);
    }
  });
  test('shelf never overfills', () => {
    let s = { ...fresh(), autoBake: true, ovenLevel: 200, drivers: 1 };
    for (let i = 0; i < 100; i++) s = G.tick(s, 1);
    expect(s.stock).toBeLessThanOrEqual(G.shelfCapacity());
  });
  test('no pizzas are wasted when the shelf is nearly full', () => {
    // Batch finishes with 10 on the shelf: 2 go on the shelf, 2 wait in the oven.
    let s = { ...fresh(), drivers: 0, stock: 10, batchProgress: G.bakeSeconds(1) - 0.01 };
    s = G.tick(s, 0.02);
    expect(s.stock + s.ovenHeld).toBeCloseTo(14);
    expect(G.shelfFull(s)).toBe(true);
    expect(G.tapOven(s).batchProgress).toBe(-1); // can't start while pizzas wait in the oven
    // Drivers free up space and the held pizzas drop onto the shelf.
    s = { ...s, drivers: 50 };
    for (let i = 0; i < 20; i++) s = G.tick(s, 0.1);
    expect(s.ovenHeld).toBe(0);
  });
  test('a batch can start whenever the shelf has room', () => {
    expect(G.tapOven({ ...fresh(), stock: 9 }).batchProgress).toBe(0);
  });
  test('cash is never NaN with every neighborhood unlocked', () => {
    let s = { ...fresh(), autoBake: true, unlocked: NEIGHBORHOODS.map((n) => n.id), vehicle: VEHICLES.length - 1 };
    for (let i = 0; i < 50; i++) s = G.tick(s, 0.5);
    expect(Number.isFinite(s.cash)).toBe(true);
  });
});

describe('offline earnings', () => {
  test('manual oven only delivers what is on the shelf', () => {
    const s = { ...fresh(), stock: 4 };
    const r = G.applyOffline(s, s.lastSavedAt + 3600_000);
    expect(r.earned).toBeCloseTo(4 * 3);
  });
  test('auto oven earns rate × time, capped at 4 hours', () => {
    const s = { ...fresh(), autoBake: true };
    const eps = G.earningsPerSecond(s);
    const r = G.applyOffline(s, s.lastSavedAt + 10 * 3600_000);
    expect(r.seconds).toBe(TUNING.offlineCapSeconds);
    expect(r.earned).toBeCloseTo(eps * TUNING.offlineCapSeconds, 0);
  });
  test('clock going backwards earns nothing', () => {
    const s = { ...fresh(), autoBake: true };
    expect(G.applyOffline(s, s.lastSavedAt - 5000).earned).toBe(0);
  });
});

describe('purchases', () => {
  test('cannot buy without cash', () => {
    expect(G.buyOven(fresh()).ok).toBe(false);
  });
  test('buying deducts cost and levels up', () => {
    const s = { ...fresh(), cash: 1000 };
    const r = G.buyDriver(s);
    expect(r.ok && r.state.drivers).toBe(2);
    expect(r.ok && r.state.cash).toBe(1000 - TUNING.drivers.baseCost);
  });
  test('first driver is affordable within ~15s of tapping', () => {
    let s = fresh();
    let t = 0;
    while (s.cash < G.driverCost(s) && t < 60) { s = G.tick(G.tapOven(s), 0.5); t += 0.5; }
    expect(t).toBeLessThanOrEqual(15);
  });
  test('neighborhoods unlock in order and respect vehicle tier', () => {
    const s = { ...fresh(), cash: 1e9 };
    expect(G.unlockNeighborhood(s, 'waterfront').ok).toBe(false);
    const sub = G.unlockNeighborhood(s, 'suburbs');
    expect(sub.ok).toBe(true);
    if (sub.ok) expect(G.neighborhoodLock(sub.state, 'waterfront')).toMatch(/Scooter/);
  });
  test('drones need Priya’s story', () => {
    const s = { ...fresh(), cash: 1e12, vehicle: 3 };
    expect(G.buyVehicle(s).ok).toBe(false);
    expect(G.buyVehicle({ ...s, dronesUnlocked: true }).ok).toBe(true);
  });
});

describe('saves', () => {
  test('migrate fills defaults and rejects junk', () => {
    expect(G.migrate(null, 5).cash).toBe(0);
    const m = G.migrate({ cash: 'lots', ovenLevel: 7, unlocked: ['suburbs', 'atlantis'] }, 5);
    expect(m.cash).toBe(0);
    expect(m.ovenLevel).toBe(7);
    expect(m.unlocked).toEqual(['downtown', 'suburbs']);
    expect(G.migrate({ seenScenes: ['a', 'b', 'c'] }, 5).scrapbookViewed).toBe(3);
    expect(G.migrate({ seenScenes: ['a', 'b', 'c'], scrapbookViewed: 1 }, 5).scrapbookViewed).toBe(1);
  });
});

import { duration, money } from '../format';
describe('format', () => {
  test('money', () => {
    expect(money(0)).toBe('$0');
    expect(money(7.5)).toBe('$7.5');
    expect(money(999)).toBe('$999');
    expect(money(1234)).toBe('$1.23K');
    expect(money(9_500_000)).toBe('$9.5M');
    expect(money(60_000)).toBe('$60K');
    expect(money(3_900, true)).toBe('$3.90K');
    expect(money(NaN)).toBe('$0');
  });
  test('duration', () => {
    expect(duration(4 * 3600 + 120)).toBe('4h 2m');
    expect(duration(45)).toBe('45s');
  });
});
