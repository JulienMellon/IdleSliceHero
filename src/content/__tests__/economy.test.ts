// T83: the economy tables stay proportional (D434, D435). Prices are readable, and a pizzeria's prices scale with what it pays.
import * as G from '../../engine/game';
import { costLadder } from '../../engine/buy-many';
import { stationCost } from '../../engine/game';
import { money } from '../../engine/format';
import { DECOR_TIER_COST, STATIONS, TUNING } from '../tuning';
import { FOOTPRINTS, HEAD_COST_DOWNTOWN, OVEN_GRADES, VEHICLES } from '../cities/home/fit';
import { NEIGHBORHOODS, PIER9_BID } from '../cities/home/data';
import { HOME_CITY } from '../cities/home';
import { renoCost, renoDecorCost } from '../renovation';

const READABLE = /^\$\d+(\.\d+)?[A-Za-z]*$/;
const STATION_KEYS = ['prep', 'ovens', 'counter', 'drivers', 'tables'] as const;
/** The middle one of the five stations' first-level prices, in units of the shop's cost multiplier (prep 6, ovens 8, counter 7, drivers 8, tables 12). */
const TYPICAL_STATION = [...STATION_KEYS].map((k) => STATIONS[k].cost).sort((a, b) => a - b)[2];
/** Prep, ovens and counter can't level past this once every footprint is bought. */
const LEVEL_CAP = TUNING.levelsPerFootprint * FOOTPRINTS.length;

/** v5.25: the engine's what-if cash is 1e300 (game.ts WHAT_IF_CASH); no price may come near it (number-ceiling.test.ts holds the whole ladder to 1e280). */
const PRICE_CEILING = 1e280;
/** The Home ladder (Julien, 2026-11-28): the builds. */
const LADDER = { downtown: 0, suburbs: 20_000, waterfront: 80_000, university: 200_000, industrial: 500_000, uptown: 1_500_000 } as const;

/**
 * costMult / orderValue: Downtown and Suburbs keep the original ratio (about 1/3). v5.25 (card E10): from Waterfront on the stations follow the build ladder
 * (costMult 800 to 8000, so a kitchen is a long, cash-limited climb and the chapters' "no missed orders" tasks have a shop that is still growing) while the order
 * values stay flat (10 to 16: Downtown and Suburbs must earn 10% of the city at every later opening), so the ratio only has a floor.
 */
const COST_PER_ORDER = { min: 0.3 };
/** No Home price passes this (Julien, 2026-11-28: about 1e10). */
const HOME_PRICE_CEILING = 1.5e10;
/**
 * v5.16: a manager and the three heads are priced by the pacing fit (scripts/pacing-fit.ts: heads within two check-ins of the build,
 * the manager about a day on, just before the next neighbourhood), not by a ratio to the build. They stay real purchases: dearer than a
 * Lv 1 station by this many times at least, and the heads together cost less than the manager.
 */
const MANAGER_OVER_STATION = 50;

describe('T83 economy tables', () => {
  test('costMult is never under 0.3 of the order value, follows the build ladder from Waterfront on, and the order values stay flat after Suburbs', () => {
    for (const n of NEIGHBORHOODS) expect([n.id, n.costMult / n.orderValue >= COST_PER_ORDER.min]).toEqual([n.id, true]);
    const hoods = NEIGHBORHOODS.slice(2);
    for (let i = 1; i < hoods.length; i++) {
      expect(hoods[i].costMult / hoods[i - 1].costMult).toBeLessThanOrEqual(4);
      expect(hoods[i].orderValue / hoods[i - 1].orderValue).toBeLessThanOrEqual(1.5);
    }
  });

  test('v5.25: no Home price passes about 1e10: stations at the cap, heads, managers, the bid, the Golden oven, the Flagship, decor, renovation and its decor', () => {
    for (const n of NEIGHBORHOODS) {
      const prices = [
        n.managerCost,
        n.headsCost,
        OVEN_GRADES[OVEN_GRADES.length - 1].cost * n.costMult,
        FOOTPRINTS[FOOTPRINTS.length - 1].cost * n.costMult,
        DECOR_TIER_COST[2] * n.costMult,
        renoCost(n.id, 3, HOME_CITY) ?? 0,
        renoDecorCost(n.id, 3, HOME_CITY) ?? 0,
        ...STATION_KEYS.map((k) => stationCost(n.id, k, LEVEL_CAP - 1)),
      ];
      expect([n.id, Math.max(...prices) <= HOME_PRICE_CEILING]).toEqual([n.id, true]);
    }
    expect(PIER9_BID.cost).toBeLessThanOrEqual(HOME_PRICE_CEILING);
  });

  test('heads and managers are real purchases: well over a Lv 1 station, heads cheaper than the manager, all under the engine’s 2^53', () => {
    for (const n of NEIGHBORHOODS.slice(1)) {
      const station = TYPICAL_STATION * n.costMult;
      expect([n.id, n.managerCost / station >= MANAGER_OVER_STATION]).toEqual([n.id, true]);
      expect([n.id, n.headsCost / station >= MANAGER_OVER_STATION / 10]).toEqual([n.id, true]);
      // v5.25: Industrial's and Uptown's heads are the story's waits (2e9 and more, the Pier 9 bid's company), and the manager follows them for less
      if (n.costMult < 1000) expect([n.id, n.headsCost < n.managerCost]).toEqual([n.id, true]);
      expect([n.id, n.managerCost < PRICE_CEILING]).toEqual([n.id, true]);
    }
    // Downtown's heads keep their own prices; headsCost is their sum (its manager is Nonna, by the story)
    expect(NEIGHBORHOODS[0].managerCost).toBe(0);
  });

  test('v5.25: the build prices are the flat ladder, $0 / 20K / 80K / 200K / 500K / 1.5M', () => {
    expect(Object.fromEntries(NEIGHBORHOODS.map((n) => [n.id, n.buildCost]))).toEqual(LADDER);
    expect(NEIGHBORHOODS.map((n) => money(n.buildCost))).toEqual(['$0', '$20K', '$80K', '$200K', '$500K', '$1.5M']);
  });

  test('v5.25: Downtown’s own upgrades top out at about $10M to $30M: every station at the last footprint’s cap, the decor, the ovens up to Copper, the footprints up to the Restaurant and the fleet (the Golden oven and the Flagship are the stars’ late sinks, fitted apart by `fitstars`)', () => {
    const cap = LEVEL_CAP - 1;
    let total = 0;
    for (const k of STATION_KEYS) for (let i = 0; i < cap; i++) total += stationCost('downtown', k, i);
    total += DECOR_TIER_COST.reduce((a, b) => a + b, 0) * 5 * NEIGHBORHOODS[0].costMult;
    total +=
      FOOTPRINTS.slice(0, -1).reduce((a, f) => a + f.cost, 0) +
      OVEN_GRADES.slice(0, -1).reduce((a, g) => a + g.cost, 0) +
      VEHICLES.reduce((a, v) => a + v.cost, 0);
    expect(total).toBeGreaterThan(1e7);
    expect(total).toBeLessThan(3e7);
    // v5.25: the two star sinks (Golden oven, Flagship) are a tenth of that, in the shop's cost multiplier like the rest: Downtown's stars are among its first renovation's needs
    expect(OVEN_GRADES[OVEN_GRADES.length - 1].cost).toBeGreaterThanOrEqual(1e6);
    expect(FOOTPRINTS[FOOTPRINTS.length - 1].cost).toBeGreaterThanOrEqual(1e6);
    expect(OVEN_GRADES[OVEN_GRADES.length - 1].cost + FOOTPRINTS[FOOTPRINTS.length - 1].cost).toBeLessThan(total);
  });

  test('v5.25: the first priced goals are cheap: the first oven level is under $50 and Marco costs under $300', () => {
    expect(stationCost('downtown', 'ovens', 0)).toBeLessThan(50);
    for (const k of STATION_KEYS) expect(stationCost('downtown', k, 0)).toBeLessThan(50);
    expect(HEAD_COST_DOWNTOWN.prep).toBeLessThanOrEqual(300);
  });

  test('orders and costs grow from one neighbourhood to the next', () => {
    for (let i = 1; i < NEIGHBORHOODS.length; i++) {
      expect(NEIGHBORHOODS[i].orderValue).toBeGreaterThan(NEIGHBORHOODS[i - 1].orderValue);
      expect(NEIGHBORHOODS[i].buildCost).toBeGreaterThan(NEIGHBORHOODS[i - 1].buildCost);
      expect(NEIGHBORHOODS[i].costMult).toBeGreaterThan(NEIGHBORHOODS[i - 1].costMult);
    }
  });

  test('every station price, at Lv 1 and at the level cap, prints as a plain amount ($12.3K, never 1e+21)', () => {
    for (const n of NEIGHBORHOODS) {
      for (const k of STATION_KEYS) {
        for (const timesBought of [0, LEVEL_CAP - 1]) {
          const cost = stationCost(n.id, k, timesBought);
          expect([n.id, k, timesBought, money(cost)]).toEqual([n.id, k, timesBought, expect.stringMatching(READABLE)]);
        }
      }
    }
  });

  test('build and manager prices print as plain amounts, and stay under the 2^53 the engine can test a purchase at', () => {
    for (const n of NEIGHBORHOODS) {
      expect(money(n.buildCost)).toMatch(READABLE);
      expect(money(n.managerCost)).toMatch(READABLE);
      expect(money(n.headsCost)).toMatch(READABLE);
      expect(n.buildCost).toBeLessThan(PRICE_CEILING);
      expect(n.managerCost).toBeLessThan(PRICE_CEILING);
      // buildGain / upgradeGain / vehicleGain try a purchase with 1e300 cash (game.ts WHAT_IF_CASH): a dearer price has no gain, so no goal-bar ratio and the sim never buys it
    }
  });

  test('v5.16: the five stations grow at their own rates, so the cheapest level is not always the best buy; the ladder prices the same', () => {
    const growths = STATION_KEYS.map((k) => STATIONS[k].growth);
    expect(new Set(growths).size).toBeGreaterThan(2);
    for (const g of growths) expect(g).toBeGreaterThan(1);
    const s = { ...G.newGame(0), cash: 1e15 };
    const shop = { ...s.shops.suburbs, built: true, footprint: 4 };
    const t = { ...s, shops: { ...s.shops, suburbs: shop } };
    for (const k of ['prep', 'ovens', 'counter', 'drivers'] as const) {
      const ladder = costLadder(t, 'suburbs', k);
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += stationCost('suburbs', k, shop[k] - 1 + i);
        expect(ladder[i]).toBe(sum);
      }
    }
  });

  test('the offline cap covers the 4 h check-in the pacing is tuned for (D433)', () => {
    expect(TUNING.offlineCapSeconds).toBeGreaterThanOrEqual(4 * 60 * 60);
  });
});
