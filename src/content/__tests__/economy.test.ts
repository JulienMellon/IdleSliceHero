// T83: the economy tables stay proportional (D434, D435). Prices are readable, and a pizzeria's prices scale with what it pays.
import * as G from '../../engine/game';
import { costLadder } from '../../engine/buy-many';
import { stationCost } from '../../engine/game';
import { money } from '../../engine/format';
import { STATIONS, TUNING } from '../tuning';
import { FOOTPRINTS } from '../cities/home/fit';
import { NEIGHBORHOODS } from '../cities/home/data';

const READABLE = /^\$\d+(\.\d+)?[A-Za-z]*$/;
const STATION_KEYS = ['prep', 'ovens', 'counter', 'drivers', 'tables'] as const;
/** The middle one of the five stations' first-level prices, in units of the shop's cost multiplier (prep 6, ovens 8, counter 7, drivers 8, tables 12). */
const TYPICAL_STATION = [...STATION_KEYS].map((k) => STATIONS[k].cost).sort((a, b) => a - b)[2];
/** Prep, ovens and counter can't level past this once every footprint is bought. */
const LEVEL_CAP = TUNING.levelsPerFootprint * FOOTPRINTS.length;

/** costMult / orderValue: the original game used about 0.45 everywhere except Downtown (1/3). */
const COST_PER_ORDER = { min: 0.3, max: 1.0 };
/**
 * v5.16: a manager and the three heads are priced by the pacing fit (scripts/pacing-fit.ts: heads within two check-ins of the build,
 * the manager about a day on, just before the next neighbourhood), not by a ratio to the build. They stay real purchases: dearer than a
 * Lv 1 station by this many times at least, and the heads together cost less than the manager.
 */
const MANAGER_OVER_STATION = 50;

describe('T83 economy tables', () => {
  test('costMult stays in proportion to orderValue in every neighbourhood (no outliers)', () => {
    for (const n of NEIGHBORHOODS) {
      const ratio = n.costMult / n.orderValue;
      expect([n.id, ratio >= COST_PER_ORDER.min && ratio <= COST_PER_ORDER.max]).toEqual([n.id, true]);
    }
  });

  test('heads and managers are real purchases: well over a Lv 1 station, heads cheaper than the manager, all under the engine’s 2^53', () => {
    for (const n of NEIGHBORHOODS.slice(1)) {
      const station = TYPICAL_STATION * n.costMult;
      expect([n.id, n.managerCost / station >= MANAGER_OVER_STATION]).toEqual([n.id, true]);
      expect([n.id, n.headsCost / station >= MANAGER_OVER_STATION / 10]).toEqual([n.id, true]);
      expect([n.id, n.headsCost < n.managerCost]).toEqual([n.id, true]);
      expect([n.id, n.managerCost < Number.MAX_SAFE_INTEGER]).toEqual([n.id, true]);
    }
    // Downtown's heads keep their own prices; headsCost is their sum (its manager is Nonna, by the story)
    expect(NEIGHBORHOODS[0].managerCost).toBe(0);
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
      expect(n.buildCost).toBeLessThan(Number.MAX_SAFE_INTEGER);
      expect(n.managerCost).toBeLessThan(Number.MAX_SAFE_INTEGER);
      // buildGain / upgradeGain / vehicleGain try a purchase with MAX_SAFE_INTEGER cash: a dearer build has no gain, so no goal-bar ratio and the sim never builds it
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
