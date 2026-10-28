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
  test('shelf never overfills', () => {
    let s = { ...fresh(), autoBake: true, ovenLevel: 200, drivers: 1 };
    for (let i = 0; i < 100; i++) s = G.tick(s, 1);
    expect(s.stock).toBeLessThanOrEqual(G.shelfCapacity());
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
  });
});

import { duration, money } from '../format';
describe('format', () => {
  test('money', () => {
    expect(money(0)).toBe('$0');
    expect(money(7.5)).toBe('$7.5');
    expect(money(999)).toBe('$999');
    expect(money(1234)).toBe('$1.23K');
    expect(money(9_500_000)).toBe('$9.50M');
    expect(money(NaN)).toBe('$0');
  });
  test('duration', () => {
    expect(duration(4 * 3600 + 120)).toBe('4h 2m');
    expect(duration(45)).toBe('45s');
  });
});
