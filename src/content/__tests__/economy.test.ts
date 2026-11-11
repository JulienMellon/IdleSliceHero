// T83: the economy tables stay proportional (D434, D435). Prices are readable, and a pizzeria's prices scale with what it pays.
import { upgradeCost } from '../../engine/game';
import { money } from '../../engine/format';
import { FOOTPRINTS, NEIGHBORHOODS, STATIONS, TUNING } from '../tuning';

const READABLE = /^\$\d+(\.\d+)?[A-Za-z]*$/;
const STATION_KEYS = ['prep', 'ovens', 'counter', 'drivers', 'tables'] as const;
/** The middle one of the five stations' first-level prices, in units of the shop's cost multiplier (prep 6, ovens 8, counter 7, drivers 8, tables 12). */
const TYPICAL_STATION = [...STATION_KEYS].map((k) => STATIONS[k].cost).sort((a, b) => a - b)[2];
/** Prep, ovens and counter can't level past this once every footprint is bought. */
const LEVEL_CAP = TUNING.levelsPerFootprint * FOOTPRINTS.length;

/** costMult / orderValue: the original game used about 0.45 everywhere except Downtown (1/3). */
const COST_PER_ORDER = { min: 0.3, max: 1.0 };
/** Manager price / the typical Lv 1 station price, Waterfront onward (Suburbs keeps its v1 numbers). */
const MANAGER_PER_STATION = { min: 50, max: 500 };

describe('T83 economy tables', () => {
  test('costMult stays in proportion to orderValue in every neighbourhood (no outliers)', () => {
    for (const n of NEIGHBORHOODS) {
      const ratio = n.costMult / n.orderValue;
      expect([n.id, ratio >= COST_PER_ORDER.min && ratio <= COST_PER_ORDER.max]).toEqual([n.id, true]);
    }
  });

  test('a manager costs 50–500x a typical station price, and no more than the pizzeria itself', () => {
    for (const n of NEIGHBORHOODS.slice(2)) {
      const ratio = n.managerCost / (TYPICAL_STATION * n.costMult);
      expect([n.id, ratio >= MANAGER_PER_STATION.min && ratio <= MANAGER_PER_STATION.max]).toEqual([n.id, true]);
      expect([n.id, n.managerCost <= n.buildCost]).toEqual([n.id, true]);
    }
    // Suburbs is the untouched first expansion: its manager is still a real purchase
    const suburbs = NEIGHBORHOODS[1];
    expect(suburbs.managerCost / (TYPICAL_STATION * suburbs.costMult)).toBeGreaterThan(10);
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
          const cost = upgradeCost(STATIONS[k].cost * n.costMult, timesBought);
          expect([n.id, k, timesBought, money(cost)]).toEqual([n.id, k, timesBought, expect.stringMatching(READABLE)]);
        }
      }
    }
  });

  test('build and manager prices print as plain amounts, and stay under the 2^53 the engine can test a purchase at', () => {
    for (const n of NEIGHBORHOODS) {
      expect(money(n.buildCost)).toMatch(READABLE);
      expect(money(n.managerCost)).toMatch(READABLE);
      expect(n.buildCost).toBeLessThan(Number.MAX_SAFE_INTEGER);
      expect(n.managerCost).toBeLessThan(Number.MAX_SAFE_INTEGER);
      // buildGain / upgradeGain / vehicleGain try a purchase with MAX_SAFE_INTEGER cash: a dearer build has no gain, so no goal-bar ratio and the sim never builds it
    }
  });

  test('the offline cap covers the 4 h check-in the pacing is tuned for (D433)', () => {
    expect(TUNING.offlineCapSeconds).toBeGreaterThanOrEqual(4 * 60 * 60);
  });
});
