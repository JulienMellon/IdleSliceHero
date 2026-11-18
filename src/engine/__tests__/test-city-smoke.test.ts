// R0: the refactor's safety net. A synthetic city (content/cities/__fixtures__/test-city.ts) with a fit that differs from the home city's everywhere
// is played the way boston-smoke.test.ts plays Boston. The first block passes today. The second block asserts that the rates come from THE CITY'S fit;
// they fail today (game.ts reads the home tables OVEN_GRADES, VEHICLES and FOOTPRINTS from tuning.ts), so they are `it.failing`: card R1 makes the
// engine read `cityOf(s).fit` and flips each one to `it`. Until then a green run of this file means the engine is still home-bound, on purpose.
import '../features';
import * as G from '../game';
import { withFeatures } from '../features';
import { CITIES, cityOf, hoodIds, layerHood } from '../../content/cities';
import { LAYER_KINDS } from '../../content/cities/types';
import { TEST_CITY, TEST_FIT, TEST_IDS } from '../../content/cities/__fixtures__/test-city';
import { STATIONS, TUNING } from '../../content/tuning';
import { HOME_FIT } from '../../content/cities/home/fit';

// the test registers the city locally: it is never in CITIES for the app
CITIES[TEST_CITY.id] = TEST_CITY;
afterAll(() => {
  delete CITIES[TEST_CITY.id];
});

const NOW = new Date(2026, 10, 11, 12, 0, 0).getTime();
const IDS = [...TEST_IDS];

type Levels = Partial<G.Shop>;
/** A game in the test city with the first `built` shops built (all running themselves), and `levels` on the shop `id`. */
function game(built: number, id?: string, levels?: Levels): G.GameState {
  const g = G.newGame(NOW, TEST_CITY.id);
  const shops = { ...g.shops };
  IDS.slice(0, built).forEach((h) => (shops[h] = { ...shops[h], built: true, managed: true, heads: G.allHeads(), prep: 5, ovens: 5, counter: 5, drivers: 4, tables: 4 }));
  if (id && levels) shops[id] = { ...shops[id], built: true, ...levels };
  return { ...g, shops, cash: 1e15, active: IDS[0], tutorial: G.TUTORIAL_DONE, seenScenes: [...g.seenScenes, cityOf(g).fit.takeover.sceneId] };
}

describe('the test city is a city the engine can play', () => {
  test('it is registered here only, with six neighbourhoods, one layer of each kind and a bid', () => {
    expect(cityOf({ city: TEST_CITY.id })).toBe(TEST_CITY);
    expect(hoodIds(TEST_CITY)).toEqual(IDS);
    expect(IDS).toHaveLength(6);
    for (const k of LAYER_KINDS) expect(layerHood(TEST_CITY, k)).not.toBeNull();
    expect(TEST_CITY.layers[IDS[0]]).toBeNull();
    expect(TEST_CITY.bid?.hood).toBe(layerHood(TEST_CITY, 'boats'));
  });

  test('its fit differs from the home city\'s in the numbers the rates read', () => {
    expect(TEST_FIT.ovenGrades.map((o) => o.mult)).not.toEqual(HOME_FIT.ovenGrades.map((o) => o.mult));
    expect(TEST_FIT.vehicles.map((v) => [v.speed, v.capacity])).not.toEqual(HOME_FIT.vehicles.map((v) => [v.speed, v.capacity]));
    expect(TEST_FIT.footprints.map((f) => f.maxTables)).not.toEqual(HOME_FIT.footprints.map((f) => f.maxTables));
    for (let i = 0; i < 5; i++) {
      expect(TEST_FIT.ovenGrades[i].mult === HOME_FIT.ovenGrades[i].mult && i > 0).toBe(false);
      expect(TEST_FIT.footprints[i].maxTables).not.toBe(HOME_FIT.footprints[i].maxTables);
    }
  });

  for (const n of [1, 3, 6]) {
    test(`${n} shops: ticks, offline, save round trip and the city's own prices`, () => {
      const g = game(n);
      expect(g.city).toBe(TEST_CITY.id);
      expect(Object.keys(g.shops)).toEqual(IDS);
      let s = g;
      for (let i = 0; i < 20; i++) s = G.playTick(s, 1, NOW + i * 1000);
      expect(Number.isFinite(s.cash)).toBe(true);
      expect(s.cash).toBeGreaterThanOrEqual(g.cash);
      expect(() => G.applyOffline({ ...s, lastSavedAt: NOW }, NOW + 3 * 3600_000)).not.toThrow();
      const back = G.migrate(JSON.parse(JSON.stringify(s)), NOW);
      expect(back.city).toBe(TEST_CITY.id);
      expect(Object.keys(back.shops)).toEqual(IDS);
      // prices read the city's own tables (these already do)
      expect(G.upgradeCostOf(g, IDS[0], 'grade')).toBe(Math.ceil(TEST_FIT.ovenGrades[1].cost * TEST_CITY.neighbourhoods[0].costMult));
      expect(G.upgradeCostOf(g, IDS[0], 'expand')).toBe(Math.ceil(TEST_FIT.footprints[1].cost * TEST_CITY.neighbourhoods[0].costMult));
      expect(G.headCost(IDS[0], 'oven')).toBe(TEST_FIT.headCostFirst.oven);
    });
  }

  test('building the next shop, the next vehicle and the bid use the city', () => {
    const g = game(1);
    expect(G.nextToBuild(g)?.id).toBe(IDS[1]);
    const built = G.buildShop({ ...g, shops: { ...g.shops, [IDS[0]]: { ...g.shops[IDS[0]], managed: true } } }, IDS[1]);
    expect(built.ok).toBe(true);
    const v = G.buyVehicle(g);
    expect(v.ok && v.state.vehicle).toBe(1);
    expect(v.ok && g.cash - v.state.cash).toBe(TEST_FIT.vehicles[1].cost);
    // the bid opens in the bid's shop once its scene was seen and the shop sold enough
    const bid = TEST_CITY.bid!;
    const open = { ...g, shops: { ...g.shops, [bid.hood]: { ...g.shops[bid.hood], built: true, sold: bid.unlockPizzas } }, seenScenes: [...g.seenScenes, bid.afterScene] };
    expect(G.pier9Available(g)).toBe(false);
    expect(G.pier9Available(open)).toBe(true);
  });
});

// ---------- the rates must come from the city's fit: they do not yet (R1 flips these to `it`) ----------

const levelSpeed1 = (base: number) => base * G.milestoneMultiplier(1);
const HOOD = IDS[1];

describe('the rates read the city\'s fit (R1)', () => {
  // card R1: when the rate helpers take the city, the two direct calls below (`G.tablesShown`, `G.patioTables`) take it too
  it.failing('the oven rate of a shop at grade 1 is the level speed times the test fit\'s grade-1 mult', () => {
    const g = game(2, HOOD, { ovens: 1, grade: 1 });
    const rates = G.lineRates(HOOD, g.shops[HOOD], g.vehicle, 1, undefined, TEST_CITY);
    expect(rates.oven).toBeCloseTo(levelSpeed1(STATIONS.ovens.speed) * TEST_FIT.ovenGrades[1].mult, 9);
  });

  it.failing('the oven grade sets what the shop earns when the oven is the slowest station', () => {
    const g = game(2, HOOD, { ovens: 1, grade: 2, prep: 60, counter: 60, drivers: 60, tables: 60 });
    const expected = TEST_CITY.neighbourhoods[1].orderValue * levelSpeed1(STATIONS.ovens.speed) * TEST_FIT.ovenGrades[2].mult;
    withFeatures([], () => expect(G.shopEarnings({ ...g, shops: { ...g.shops, [HOOD]: { ...g.shops[HOOD], managed: false } } }, HOOD)).toBeCloseTo(expected, 6));
  });

  it.failing('the fleet\'s speed and capacity decide the delivery rate and so the earnings', () => {
    // kitchen far faster than demand: the pies sold are walk-ins plus what the fleet carries
    const g = game(2, HOOD, { prep: 90, ovens: 90, counter: 90, drivers: 1, tables: 1, managed: false });
    const v = TEST_FIT.vehicles[g.vehicle];
    const fleet = (1 * v.capacity * G.milestoneMultiplier(1)) / (TUNING.deliveryRoundTrip / v.speed);
    const walkIns = levelSpeed1(STATIONS.tables.speed);
    const expected = TEST_CITY.neighbourhoods[1].orderValue * (fleet + walkIns * TUNING.walkInShare);
    withFeatures([], () => expect(G.shopEarnings(g, HOOD)).toBeCloseTo(expected, 6));
  });

  it.failing('the footprint\'s maxTables decides the tables drawn', () => {
    const shop = game(2, HOOD, { footprint: 0, tables: 30 }).shops[HOOD];
    expect(G.tablesShown(shop)).toBe(Math.min(TEST_FIT.footprints[0].maxTables, 1 + Math.floor((shop.tables - 1) / 6)));
  });

  it.failing('the footprint\'s maxTables decides the tables out on the sidewalk', () => {
    const shop = game(2, HOOD, { footprint: 0, tables: 13 }).shops[HOOD];
    expect(G.patioTables(shop)).toBe(1 + Math.floor((shop.tables - 1) / 6) - TEST_FIT.footprints[0].maxTables);
  });
});
