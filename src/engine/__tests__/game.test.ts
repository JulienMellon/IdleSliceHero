/// <reference types="jest" />
import * as G from '../game';
import { NEIGHBORHOODS, TUNING } from '../../content/tuning';
import { duration, money } from '../format';

const fresh = () => G.newGame(1_000_000);
const managed = (s: G.GameState, id: G.GameState['active'] = 'downtown') => ({ ...s, shops: { ...s.shops, [id]: { ...s.shops[id], built: true, managed: true } } });

describe('formulas', () => {
  test('cost grows 15% per level', () => {
    expect(G.upgradeCost(100, 1)).toBe(115);
    expect(G.upgradeCost(100, 10)).toBe(Math.ceil(100 * 1.15 ** 10));
  });
  test('milestones double output at 25/50/100', () => {
    expect([24, 25, 50, 100].map(G.milestoneMultiplier)).toEqual([1, 2, 4, 8]);
    expect(G.nextMilestone(30)).toBe(50);
  });
  test('a pizzeria sells at the rate of its slowest stage', () => {
    const shop = G.newShop(true);
    const expected = Math.min(G.prepRate(shop), G.ovenRate(shop), G.counterRate(shop), G.demandRate(shop, 0));
    expect(G.shopRate(shop, 0)).toBeCloseTo(expected);
    expect(G.bottleneck(shop, 0)).toBe('customers'); // one bike driver + one table at the start
  });
  test('walk-ins pay less than deliveries', () => {
    const shop = { ...G.newShop(true), drivers: 1, tables: 1 };
    expect(G.valuePerPizza('downtown', shop, 0)).toBeLessThan(3);
    expect(G.valuePerPizza('downtown', shop, 0)).toBeGreaterThan(3 * TUNING.walkInShare);
  });
  test('seating never lowers income, even when the kitchen is the limit (critic G18)', () => {
    for (const prep of [1, 10, 40, 104]) {
      for (const drivers of [1, 5, 30]) {
        for (const tables of [1, 20, 70]) {
          let s = managed(fresh());
          s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep, ovens: 100, counter: 100, drivers, tables, footprint: 4, grade: 4 } } };
          expect(G.upgradeGain(s, 'downtown', 'tables') ?? 0).toBeGreaterThanOrEqual(-1e-9);
        }
      }
    }
  });
  test('expanding speeds up prep and the counter (critic D41)', () => {
    const shop = G.newShop(true);
    const big = { ...shop, footprint: 2 };
    expect(G.prepRate(big) / G.prepRate(shop)).toBeCloseTo(TUNING.footprintBoost ** 2);
    expect(G.counterRate(big) / G.counterRate(shop)).toBeCloseTo(TUNING.footprintBoost ** 2);
    expect(G.ovenRate(big)).toBeCloseTo(G.ovenRate(shop));
  });
  test('oven grades multiply bake speed', () => {
    const shop = G.newShop(true);
    expect(G.ovenRate({ ...shop, grade: 2 }) / G.ovenRate(shop)).toBeCloseTo(4);
  });
});

describe('managers and tapping', () => {
  test('an unmanaged pizzeria only makes what you tap for', () => {
    let s = fresh();
    s = G.tick(s, 30);
    expect(s.cash).toBe(0);
    s = G.tapShop(s, 'downtown');
    expect(s.shops.downtown.queued).toBe(TUNING.tapBatch);
    s = G.tick(s, 60);
    expect(s.shops.downtown.sold).toBeCloseTo(TUNING.tapBatch);
    expect(s.cash).toBeGreaterThan(0);
  });
  test('the tap queue is capped', () => {
    let s = fresh();
    for (let i = 0; i < 10; i++) s = G.tapShop(s, 'downtown');
    expect(s.shops.downtown.queued).toBe(TUNING.tapQueueMax);
  });
  test('a managed pizzeria earns its rate continuously, at any tick size', () => {
    for (const dt of [0.05, 0.2, 1]) {
      let s = managed({ ...fresh() });
      s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep: 60, ovens: 60, counter: 60, drivers: 60, footprint: 2 } } };
      const eps = G.earningsPerSecond(s);
      const steps = Math.round(20 / dt);
      for (let i = 0; i < steps; i++) s = G.tick(s, dt);
      expect(s.cash / 20 / eps).toBeCloseTo(1, 3);
    }
  });
  test('a rush tap on a managed shop pays a quarter-second of its earnings', () => {
    const s = managed(fresh());
    expect(G.tapShop(s, 'downtown').cash).toBeCloseTo(G.shopEarnings(s, 'downtown') * TUNING.rushSeconds);
  });
  test('Nonna’s recipe scene makes her Downtown’s manager', () => {
    const s = G.applyReward(fresh(), 'auto-bake');
    expect(s.shops.downtown.managed).toBe(true);
  });
  test('the first worker is affordable within ~15s of tapping', () => {
    let s = fresh();
    let t = 0;
    while (s.cash < G.upgradeCostOf(s, 'downtown', 'drivers')! && t < 60) {
      if (s.shops.downtown.queued < 1) s = G.tapShop(s, 'downtown');
      s = G.tick(s, 0.5);
      t += 0.5;
    }
    expect(t).toBeLessThanOrEqual(15);
  });
});

describe('building and upgrading', () => {
  test('pizzerias are built in order and become the active shop', () => {
    const s = { ...fresh(), cash: 1e12 };
    expect(G.buildShop(s, 'waterfront').ok).toBe(false);
    const r = G.buildShop(s, 'suburbs');
    expect(r.ok && r.state.shops.suburbs.built).toBe(true);
    expect(r.ok && r.state.active).toBe('suburbs');
  });
  test('footprint caps station levels and tables until you expand', () => {
    let s = { ...fresh(), cash: 1e12 };
    s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, ovens: 25, tables: 25 } } };
    expect(G.upgradeLock(s, 'downtown', 'ovens')).toMatch(/Expand/);
    expect(G.upgradeLock(s, 'downtown', 'tables')).toMatch(/Expand/);
    const r = G.buyUpgrade(s, 'downtown', 'expand');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(G.upgradeLock(r.state, 'downtown', 'ovens')).toBeNull();
      expect(G.buyUpgrade(r.state, 'downtown', 'ovens').ok).toBe(true);
    }
  });
  test('later pizzerias cost more to upgrade and pay more', () => {
    for (let i = 1; i < NEIGHBORHOODS.length; i++) {
      expect(NEIGHBORHOODS[i].costMult).toBeGreaterThan(NEIGHBORHOODS[i - 1].costMult);
      expect(NEIGHBORHOODS[i].orderValue).toBeGreaterThan(NEIGHBORHOODS[i - 1].orderValue);
    }
  });
  test('Downtown’s manager comes from the story, not the shop', () => {
    expect(G.upgradeLock(fresh(), 'downtown', 'manager')).toMatch(/Nonna/);
  });
  test('drones need Priya’s story', () => {
    const s = { ...fresh(), cash: 1e12, vehicle: 3 };
    expect(G.buyVehicle(s).ok).toBe(false);
    expect(G.buyVehicle({ ...s, dronesUnlocked: true }).ok).toBe(true);
  });
  test('advice: tied stages are upgraded together so the bundle always gains', () => {
    let s = managed({ ...fresh(), cash: 0 });
    // prep 0.9*3.5 = 3.15 and ovens 0.7*4.5 = 3.15: an exact tie
    s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep: 6, ovens: 8, counter: 20, drivers: 30 } } };
    expect(G.upgradeGain(s, 'downtown', 'prep')!).toBeCloseTo(0);
    const b = G.bottleneckBundle(s, 'downtown')!;
    expect(b.steps.sort()).toEqual(['ovens', 'prep']);
    expect(b.gain).toBeGreaterThan(0);
  });
  test('advice: a capped bottleneck bundles an expansion', () => {
    let s = managed(fresh());
    s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep: 25, ovens: 25, counter: 25, drivers: 100, grade: 4 } } };
    const b = G.bottleneckBundle(s, 'downtown')!;
    expect(b.steps).toContain('expand');
    expect(b.gain).toBeGreaterThan(0);
  });
  test('advice: an upgrade on the bottleneck gains, others gain nothing', () => {
    const s = managed(fresh());
    expect(G.upgradeGain(s, 'downtown', 'drivers')!).toBeGreaterThan(0);
    expect(G.upgradeGain(s, 'downtown', 'ovens')!).toBeCloseTo(0);
  });
});

describe('offline and saves', () => {
  test('managed shops earn offline, capped at 4 hours; unmanaged only finish their queue', () => {
    let s = managed(fresh());
    s = G.buildShop({ ...s, cash: 1e9 }, 'suburbs').ok ? (G.buildShop({ ...s, cash: 1e9 }, 'suburbs') as { state: G.GameState }).state : s;
    s = { ...s, cash: 0 };
    const eps = G.earningsPerSecond(s);
    const r = G.applyOffline(s, s.lastSavedAt + 10 * 3600_000);
    expect(r.seconds).toBe(TUNING.offlineCapSeconds);
    expect(r.earned).toBeCloseTo(eps * TUNING.offlineCapSeconds, 0);
    expect(r.state.shops.suburbs.sold).toBe(0);
    expect(r.byShop.map((b) => b.id)).toEqual(['downtown']);
    expect(r.byShop[0].managed).toBe(true);
    expect(r.byShop[0].earned).toBeCloseTo(r.earned, 0);
  });
  test('clock going backwards earns nothing', () => {
    const s = managed(fresh());
    expect(G.applyOffline(s, s.lastSavedAt - 5000).earned).toBe(0);
  });
  test('v1 saves migrate into Downtown plus starter pizzerias', () => {
    const v1 = { cash: 500, ovenLevel: 18, drivers: 9, vehicle: 1, autoBake: true, unlocked: ['downtown', 'suburbs', 'atlantis'], delivered: { suburbs: 620 }, seenScenes: ['a', 'b'] };
    const m = G.migrate(v1, 5);
    expect(m.cash).toBe(500);
    expect(m.shops.downtown.ovens).toBe(18);
    expect(m.shops.downtown.drivers).toBe(9);
    expect(m.shops.downtown.managed).toBe(true);
    expect(m.shops.suburbs.built).toBe(true);
    expect(m.shops.suburbs.sold).toBe(620);
    expect(m.shops.waterfront.built).toBe(false);
    expect(m.scrapbookViewed).toBe(2);
  });
  test('v2 saves round-trip and reject junk', () => {
    const s = managed({ ...fresh(), cash: 42 });
    expect(G.migrate(JSON.parse(JSON.stringify(s)), 5)).toEqual({ ...s });
    expect(G.migrate(null, 5).cash).toBe(0);
    expect(G.migrate({ cash: 'lots' }, 5).cash).toBe(0);
  });
});

describe('format', () => {
  test('money', () => {
    expect(money(0)).toBe('$0');
    expect(money(7.5)).toBe('$7.5');
    expect(money(1234)).toBe('$1.23K');
    expect(money(60_000)).toBe('$60K');
    expect(money(3_900, true)).toBe('$3.90K');
    expect(money(NaN)).toBe('$0');
  });
  test('duration', () => {
    expect(duration(4 * 3600 + 120)).toBe('4h 2m');
  });
});
