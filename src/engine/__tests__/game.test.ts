/// <reference types="jest" />
import * as G from '../game';
import { DECOR_BOOST, DECOR_TIER_COST, NEIGHBORHOODS, TUNING } from '../../content/tuning';
import { duration, money } from '../format';
import { piesInFlight } from '../pipeline';

const fresh = () => G.newGame(1_000_000);
const managed = (s: G.GameState, id: G.GameState['active'] = 'downtown') => ({ ...s, shops: { ...s.shops, [id]: { ...s.shops[id], built: true, managed: true, heads: G.allHeads() } } });

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
  test('seating never lowers income, even when the kitchen is the limit', () => {
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
  test('expanding speeds up prep and the counter', () => {
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

describe('managers, heads and tapping', () => {
  const tapAll = (s: G.GameState) => {
    for (let k = 0; k < 3; k++) {
      const st = G.nextStation(s.shops.downtown);
      if (!st) break;
      const r = G.tapStation(s, 'downtown', st);
      if (r.ok) s = r.state;
    }
    return s;
  };
  test('a pizzeria with nobody to run it only makes what you tap for, and pays when pies leave', () => {
    let s = fresh();
    s = G.lineTick(s, 30);
    expect(s.cash).toBe(0);
    s = G.tapShop(s, 'downtown'); // prep
    expect(s.shops.downtown.line.prep?.n).toBe(G.tapBatch(s.shops.downtown));
    s = G.lineTick(s, 60);
    expect(s.cash).toBe(0); // prepped, but nobody baked or served it
    s = G.tapShop(s, 'downtown'); // oven
    s = G.lineTick(s, 60);
    expect(s.cash).toBe(0);
    s = G.tapShop(s, 'downtown'); // counter
    s = G.lineTick(s, 60);
    expect(s.shops.downtown.sold).toBe(4);
    expect(s.cash).toBeGreaterThan(0);
  });
  test('a station refuses a tap it cannot start, with a reason', () => {
    const r = G.tapStation(fresh(), 'downtown', 'oven');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/prep/i);
  });
  test('a GM pizzeria earns its rate (with the boost), at any tick size', () => {
    for (const dt of [0.05, 0.2, 1]) {
      let s = managed({ ...fresh() });
      s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep: 60, ovens: 60, counter: 60, drivers: 60, footprint: 2 } } };
      const eps = G.earningsPerSecond(s);
      for (let i = 0; i < Math.round(10 / dt); i++) s = G.lineTick(s, dt); // fill the line
      const c0 = s.cash;
      // cash comes in stacks every carrier lap (~5 s), so measure over two minutes
      for (let i = 0; i < Math.round(120 / dt); i++) s = G.lineTick(s, dt);
      expect((s.cash - c0) / 120 / eps).toBeGreaterThan(0.96);
      expect((s.cash - c0) / 120 / eps).toBeLessThan(1.04);
    }
  });
  test('the GM doubles a pizzeria’s income', () => {
    const shop = { ...G.newShop(true), prep: 10, ovens: 10, counter: 10, drivers: 10 };
    expect(G.shopRevenue('suburbs', { ...shop, managed: true }, 0) / G.shopRevenue('suburbs', shop, 0)).toBeCloseTo(2);
  });
  test('a rush tap on a GM pizzeria speeds the line up but pays nothing by itself', () => {
    let s = managed(fresh());
    s = G.lineTick(s, 0.5);
    const r = G.tapShop(s, 'downtown');
    expect(r.cash).toBe(s.cash);
    expect(r.shops.downtown.line.prep!.left).toBeLessThan(s.shops.downtown.line.prep!.left);
  });
  test('T75: a GM tick with no sale keeps the stats identity; a tick that sells replaces it', () => {
    const s = managed(fresh());
    const quiet = G.lineTick(s, 0.05);
    expect(quiet.shops.downtown.line).not.toBe(s.shops.downtown.line); // the line did advance
    expect(quiet.stats).toBe(s.stats);
    let t = s;
    for (let i = 0; i < 300; i++) t = G.lineTick(t, 0.2);
    expect(t.stats).not.toBe(s.stats);
    expect(t.stats.baked).toBeGreaterThan(0);
  });
  test('heads: each one automates its station; the GM needs all three', () => {
    let s = { ...fresh(), cash: 1e9 };
    s = { ...s, shops: { ...s.shops, suburbs: { ...G.newShop(true) } } };
    expect(G.upgradeLock(s, 'suburbs', 'manager')).toMatch(/heads/);
    expect(G.headCost('suburbs', 'prep')).toBe(Math.ceil(NEIGHBORHOODS[1].managerCost * 0.2));
    expect(G.headCost('downtown', 'counter')).toBe(120);
    for (const u of ['headPrep', 'headOven', 'headCounter'] as const) {
      const r = G.buyUpgrade(s, 'suburbs', u);
      expect(r.ok).toBe(true);
      if (r.ok) s = r.state;
    }
    expect(G.automationOf(s.shops.suburbs)).toEqual({ prep: true, oven: true, counter: true });
    expect(G.upgradeLock(s, 'suburbs', 'manager')).toBeNull();
    // all three heads run the shop in the foreground without any taps
    for (let i = 0; i < 300; i++) s = G.lineTick(s, 0.2);
    expect(s.shops.suburbs.sold).toBeGreaterThan(0);
  });
  test('one head only: its station runs, the others wait for taps', () => {
    let s = fresh();
    s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, heads: { prep: true, oven: false, counter: false } } } };
    for (let i = 0; i < 100; i++) s = G.lineTick(s, 0.2);
    expect(s.shops.downtown.line.prepped).toBeGreaterThan(0);
    expect(s.shops.downtown.line.oven).toBeNull();
    expect(s.cash).toBe(0);
  });
  test('Nonna’s recipe scene makes her Downtown’s GM and brings every head', () => {
    const s = G.applyReward(fresh(), 'auto-bake');
    expect(s.shops.downtown.managed).toBe(true);
    expect(s.shops.downtown.heads).toEqual({ prep: true, oven: true, counter: true });
  });
  test('the batch grows by 2 pies every 20 prep levels', () => {
    const at = (prep: number) => G.tapBatch({ ...G.newShop(true), prep });
    expect([1, 19, 20, 39, 40, 100].map(at)).toEqual([4, 4, 6, 6, 8, 14]);
    expect(G.nextBatchLevel({ ...G.newShop(true), prep: 7 })).toBe(20);
  });
  test('the first head is affordable within ~40 s of tapping', () => {
    let s = fresh();
    let t = 0;
    while (s.cash < G.headCost('downtown', 'prep') && t < 120) {
      s = tapAll(s);
      s = G.lineTick(s, 0.5);
      t += 0.5;
    }
    expect(t).toBeLessThanOrEqual(40);
  });
});

describe('building and upgrading', () => {
  test('pizzerias are built in order and become the active shop', () => {
    // Suburbs opens once Nonna has taken over Downtown (the frugal-path lock)
    const s = { ...fresh(), cash: 1e12, seenScenes: ['downtown-4'] };
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

describe('decor', () => {
  test('each decor tier raises prices by DECOR_BOOST and is bought in order', () => {
    let s = managed({ ...fresh(), cash: 1e9 });
    const base = G.shopEarnings(s, 'downtown');
    for (let i = 0; i < 3; i++) {
      const r = G.buyDecor(s, 'downtown', 'plants');
      expect(r.ok).toBe(true);
      if (r.ok) s = r.state;
    }
    expect(G.buyDecor(s, 'downtown', 'plants').ok).toBe(false);
    expect(s.shops.downtown.decor.plants).toBe(3);
    expect(G.shopEarnings(s, 'downtown') / base).toBeCloseTo(1 + 3 * DECOR_BOOST);
  });
  test('decor costs scale with the neighborhood', () => {
    const s = fresh();
    expect(G.decorCost(s, 'downtown', 'walls')).toBe(DECOR_TIER_COST[0]);
    expect(G.decorCost(s, 'suburbs', 'walls')).toBe(DECOR_TIER_COST[0] * NEIGHBORHOODS[1].costMult);
  });
  test('saves without decor load with bare decor', () => {
    const m = G.migrate({ shops: { downtown: { built: true, prep: 3 } } }, 5);
    expect(m.shops.downtown.decor).toEqual(G.newDecor());
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
  test('C97: a GM shop boosts only the rest, not the cash already carried by departures', () => {
    const base = managed(fresh());
    const line = { ...base.shops.downtown.line, boxed: 0, departures: [{ id: 1, kind: 'driver' as const, n: 2, cash: 500, left: 5 }, { id: 2, kind: 'walkin' as const, n: 1, cash: 100, left: 3 }], nextId: 3 };
    const s = { ...base, cash: 0, shops: { ...base.shops, downtown: { ...base.shops.downtown, line } } };
    const shop = s.shops.downtown;
    const seconds = 1000;
    const mult = 3;
    const now = s.lastSavedAt + seconds * 1000;
    const boosted = { ...s, rewards: { ...s.rewards, boosts: [{ mult, until: now + 1e6, source: 'x' }] } };
    const inFlight = piesInFlight(shop.line);
    const rest = Math.floor(G.shopRate(shop, s.vehicle) * seconds) + inFlight - 3;
    const value = G.valuePerPizza('downtown', shop, s.vehicle);
    const plain = G.applyOffline(s, now).state.cash;
    expect(plain).toBeCloseTo(600 + rest * value, 3);
    expect(G.applyOffline(boosted, now).state.cash).toBeCloseTo(600 + rest * value * mult, 3);
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
