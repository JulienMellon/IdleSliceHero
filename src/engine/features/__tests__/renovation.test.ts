/**
 * @jest-environment <rootDir>/src/engine/__tests__/tz-env.js
 */
// Shop renovation (v5.25, card E10): the three-star gate, the station reset, x2 / x3 / x4 income, decor and Uptown's stars, the franchise reset,
// the save round trip, and the list in docs/build/v5.25/renovation.md against content/renovation.ts.
import * as fs from 'fs';
import * as path from 'path';
import { hoodIds } from '../../../content/cities';
import { BOSTON_CITY } from '../../../content/cities/boston';
import { HOME_CITY } from '../../../content/cities/home';
import { FOOTPRINTS, OVEN_GRADES } from '../../../content/cities/home/fit';
import { DECOR_BOOST } from '../../../content/tuning';
import { RENO_IDS, RENO_ITEMS, RENO_MAX, RENO_MULT, RENO_SHOPS, migrateRenovation, renoCost, renoDecorCost, renoItems } from '../../../content/renovation';
import { STARS } from '../../../content/layers';
import '../index';
import * as G from '../../game';
import { canFranchise, franchise, RESET_FIELDS } from '../franchise';
import { pointsOf } from '../layers/stars';
import { masteryStars, shopStars } from '../mastery';
import {
  buyRenoDecor,
  canRenovate,
  nextRenoCost,
  renoDecorCount,
  renoDecorOffer,
  renoDecorPrice,
  renoLevel,
  renoValueMult,
  renovate,
  renovateLock,
} from '../renovation';

const T0 = 1_700_000_000_000;
const HOME = hoodIds(HOME_CITY);
const RICH = 1e30;

/** A home game with every shop built; `n` shops (city order) have all three stars; cash is plentiful. */
function game(n: number, cash = RICH): G.GameState {
  let g = G.newGame(T0);
  for (const [i, id] of HOME.entries())
    g = {
      ...g,
      shops: {
        ...g.shops,
        [id]: {
          ...g.shops[id],
          built: true,
          managed: true,
          prep: 40,
          ovens: 40,
          counter: 40,
          drivers: 40,
          tables: 40,
          ...(i < n ? { heads: G.allHeads(), footprint: FOOTPRINTS.length - 1, grade: OVEN_GRADES.length - 1 } : {}),
        },
      },
    };
  return { ...g, cash };
}
const ok = <T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> => {
  expect(r.ok).toBe(true);
  return r as Extract<T, { ok: true }>;
};

describe('the three-star gate', () => {
  it('needs all three stars, a built shop and the price', () => {
    const g = game(1);
    expect(shopStars(g.shops.downtown, HOME_CITY)).toBe(3);
    expect(canRenovate(g, 'downtown')).toBe(true);
    expect(canRenovate(g, 'suburbs')).toBe(false);
    expect(renovateLock(g, 'suburbs')).toBe('Earn all three stars first');
    const two = { ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, grade: 0 } } };
    expect(masteryStars(two.shops.downtown, HOME_CITY).golden).toBe(false);
    expect(canRenovate(two, 'downtown')).toBe(false);
    const unbuilt = { ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, built: false } } };
    expect(canRenovate(unbuilt, 'downtown')).toBe(false);
    const poor = { ...g, cash: nextRenoCost(g, 'downtown')! - 1 };
    expect(canRenovate(poor, 'downtown')).toBe(false);
    expect(renovateLock(poor, 'downtown')).toBe('Not enough cash');
    expect(renovate(poor, 'downtown').ok).toBe(false);
    expect(canRenovate({ ...poor, cash: nextRenoCost(g, 'downtown')! }, 'downtown')).toBe(true);
  });
  it('stops at level 3', () => {
    let g = game(1);
    for (let i = 1; i <= RENO_MAX; i++) g = ok(renovate(g, 'downtown')).state;
    expect(renoLevel(g, 'downtown')).toBe(3);
    expect(canRenovate(g, 'downtown')).toBe(false);
    expect(renovateLock(g, 'downtown')).toBe('Fully renovated');
    expect(nextRenoCost(g, 'downtown')).toBeNull();
    expect(renovate(g, 'downtown').ok).toBe(false);
  });
  it('costs more at every level and scales with the shop', () => {
    for (const id of HOME) {
      const c = [1, 2, 3].map((l) => renoCost(id, l, HOME_CITY)!);
      expect(c[0]).toBeLessThan(c[1]);
      expect(c[1]).toBeLessThan(c[2]);
      expect(renoCost(id, 4, HOME_CITY)).toBeNull();
      expect(renoCost(id, 0, HOME_CITY)).toBeNull();
    }
    expect(renoCost('uptown', 1, HOME_CITY)!).toBeGreaterThan(renoCost('downtown', 1, HOME_CITY)!);
    expect(renoCost('north-end', 1, BOSTON_CITY)!).toBeGreaterThan(renoCost('downtown', 1, HOME_CITY)!);
  });
});

describe('what renovating does', () => {
  it('sets the five stations to level 1 and keeps the rest', () => {
    const g = game(2);
    const before = g.shops.downtown;
    const r = ok(renovate(g, 'downtown'));
    const after = r.state.shops.downtown;
    expect([after.prep, after.ovens, after.counter, after.drivers, after.tables]).toEqual([1, 1, 1, 1, 1]);
    expect(after.managed).toBe(true);
    expect(after.heads).toEqual(before.heads);
    expect(after.footprint).toBe(before.footprint);
    expect(after.grade).toBe(before.grade);
    expect(after.decor).toEqual(before.decor);
    expect(after.built).toBe(true);
    expect(after.sold).toBe(before.sold);
    // other shops are untouched, and still unlocked
    expect(r.state.shops.suburbs).toBe(g.shops.suburbs);
    expect(r.state.vehicle).toBe(g.vehicle);
    expect(r.state.cash).toBe(g.cash - nextRenoCost(g, 'downtown')!);
    expect(renoLevel(r.state, 'downtown')).toBe(1);
    expect(renoLevel(r.state, 'suburbs')).toBe(0);
    // still three stars: it can be renovated again
    expect(shopStars(after, HOME_CITY)).toBe(3);
    expect(canRenovate(r.state, 'downtown')).toBe(true);
  });
  it('emits renovated { shop, level }', () => {
    let g = game(1);
    const a = ok(renovate(g, 'downtown'));
    expect(a.event).toEqual({ type: 'renovated', shop: 'downtown', level: 1 });
    g = a.state;
    expect(ok(renovate(g, 'downtown')).event.level).toBe(2);
  });
  it('pays x2, x3, x4 on a shop at the same levels', () => {
    let g = game(1);
    const base = G.shopEarnings(g, 'downtown', T0);
    expect(base).toBeGreaterThan(0);
    for (const level of [1, 2, 3] as const) {
      // the same levels back again, so only the multiplier differs
      g = ok(renovate(g, 'downtown')).state;
      g = { ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, prep: 40, ovens: 40, counter: 40, drivers: 40, tables: 40 } } };
      expect(renoValueMult(g, 'downtown')).toBe(RENO_MULT[level]);
      expect(G.shopEarnings(g, 'downtown', T0) / base).toBeCloseTo(RENO_MULT[level], 9);
    }
    // the other shops are not multiplied
    expect(G.shopEarnings(g, 'suburbs', T0) / G.shopEarnings(game(1), 'suburbs', T0)).toBeCloseTo(1, 9);
  });
  it('a readout key changes with the level and the decor, so price ladders refresh', () => {
    const g = game(1);
    const a = G.shopLevelKey(g, 'downtown');
    const b = ok(renovate(g, 'downtown')).state;
    expect(G.shopLevelKey(b, 'downtown')).not.toBe(a);
  });
});

describe('decor', () => {
  it('offers only the levels the shop has reached, and charges the cost', () => {
    let g = game(1);
    expect(renoDecorOffer(g, 'downtown')).toEqual([]);
    expect(buyRenoDecor(g, 'downtown', RENO_ITEMS.downtown[0].decor[0]).ok).toBe(false);
    g = ok(renovate(g, 'downtown')).state;
    expect(renoDecorOffer(g, 'downtown')).toEqual(RENO_ITEMS.downtown[0].decor);
    const [a, b] = RENO_ITEMS.downtown[0].decor;
    expect(renoDecorPrice(g, 'downtown', a)).toBe(renoDecorCost('downtown', 1, HOME_CITY));
    const bought = ok(buyRenoDecor(g, 'downtown', a)).state;
    expect(bought.cash).toBe(g.cash - renoDecorCost('downtown', 1, HOME_CITY)!);
    expect(renoDecorCount(bought, 'downtown')).toBe(1);
    expect(buyRenoDecor(bought, 'downtown', a).ok).toBe(false); // already bought
    expect(buyRenoDecor(bought, 'downtown', RENO_ITEMS.downtown[1].decor[0]).ok).toBe(false); // level II not reached
    expect(buyRenoDecor(bought, 'downtown', RENO_ITEMS.suburbs[0].decor[0]).ok).toBe(false); // another shop's
    expect(buyRenoDecor({ ...g, cash: 0 }, 'downtown', b).ok).toBe(false);
    // a renovation keeps what was bought, and the next level's three open
    const again = ok(renovate(bought, 'downtown')).state;
    expect(renoDecorCount(again, 'downtown')).toBe(1);
    expect(renoDecorOffer(again, 'downtown')).toHaveLength(6);
  });
  it('each item is a decor tier in the price', () => {
    let g = ok(renovate(game(1), 'downtown')).state;
    const level1 = renoValueMult(g, 'downtown');
    expect(level1).toBe(RENO_MULT[1]);
    for (const [i, item] of RENO_ITEMS.downtown[0].decor.entries()) {
      g = ok(buyRenoDecor(g, 'downtown', item)).state;
      expect(renoValueMult(g, 'downtown')).toBeCloseTo(RENO_MULT[1] * (1 + DECOR_BOOST * (i + 1)), 12);
    }
  });
  it('each item adds a decor tier to Uptown’s rating', () => {
    const shop = G.newShop(true);
    expect(pointsOf(shop, 0).decor).toBe(0);
    const need = STARS.decorTiersForPoint[0];
    expect(pointsOf(shop, 0, need - 1).decor).toBe(0);
    expect(pointsOf(shop, 0, need).decor).toBe(1);
    expect(pointsOf(shop, 0, need * 2).decor).toBe(2);
  });
});

describe('franchise and the save', () => {
  it('RESET_FIELDS has renovation, and a franchise starts it over', () => {
    expect(RESET_FIELDS).toContain('renovation');
    let g = game(6);
    g = ok(renovate(g, 'downtown')).state;
    g = ok(buyRenoDecor(g, 'downtown', RENO_ITEMS.downtown[0].decor[0])).state;
    g = { ...g, cityComplete: true, seenScenes: [...g.seenScenes, G.finaleId(HOME[HOME.length - 1])] };
    expect(canFranchise(g)).toBe(true);
    const next = franchise(g, T0);
    expect(next.city).toBe('boston');
    for (const id of hoodIds(BOSTON_CITY)) expect(next.renovation[id]).toEqual({ level: 0, decor: [] });
    expect(Object.keys(next.renovation).sort()).toEqual([...hoodIds(BOSTON_CITY)].sort());
  });
  it('round-trips through the save', () => {
    let g = game(3);
    g = ok(renovate(g, 'downtown')).state;
    g = ok(renovate(g, 'downtown')).state;
    g = ok(buyRenoDecor(g, 'downtown', RENO_ITEMS.downtown[0].decor[1])).state;
    g = ok(buyRenoDecor(g, 'downtown', RENO_ITEMS.downtown[1].decor[2])).state;
    g = ok(renovate(g, 'suburbs')).state;
    const back = G.migrate(JSON.parse(JSON.stringify(g)), T0);
    expect(back.renovation).toEqual(g.renovation);
    expect(back.renovation.downtown).toEqual({ level: 2, decor: [RENO_ITEMS.downtown[0].decor[1], RENO_ITEMS.downtown[1].decor[2]] });
    expect(G.shopEarnings(back, 'downtown', T0)).toBeCloseTo(G.shopEarnings(g, 'downtown', T0), 6);
  });
  it('an old save has none, and a corrupt one is cleaned', () => {
    const g = game(1);
    const { renovation: _gone, ...old } = JSON.parse(JSON.stringify(g)) as Record<string, unknown>;
    const back = G.migrate(old, T0);
    for (const id of HOME) expect(back.renovation[id]).toEqual({ level: 0, decor: [] });
    const bad = migrateRenovation(
      {
        downtown: { level: 9, decor: [RENO_ITEMS.downtown[0].decor[0], RENO_ITEMS.suburbs[0].decor[0], 5, RENO_ITEMS.downtown[0].decor[0]] },
        suburbs: { level: 0, decor: [RENO_ITEMS.suburbs[0].decor[0]] },
        nowhere: { level: 3 },
        uptown: 'x',
      },
      HOME_CITY,
    );
    expect(bad.downtown).toEqual({ level: 3, decor: [RENO_ITEMS.downtown[0].decor[0]] });
    expect(bad.suburbs).toEqual({ level: 0, decor: [] });
    expect(bad.uptown).toEqual({ level: 0, decor: [] });
    expect(bad.nowhere).toBeUndefined();
  });
  it('Boston wears the same looks by position', () => {
    const north = hoodIds(BOSTON_CITY)[0];
    expect(renoItems(north, 1, BOSTON_CITY)).toBe(RENO_ITEMS.downtown[0]);
    expect(renoItems(north, 1, HOME_CITY)).toBeNull();
  });
});

describe('the list', () => {
  const md = fs.readFileSync(path.join(__dirname, '../../../../docs/build/v5.25/renovation.md'), 'utf8');
  const listed = [...md.matchAll(/^\| `(reno[1-3]-[a-z]+-[a-z-]+)` \|/gm)].map((m) => m[1]);
  it('has 18 plaques, 18 fixtures and 54 decor items, all different', () => {
    expect(listed).toHaveLength(90);
    expect(new Set(listed).size).toBe(90);
    expect(listed.filter((x) => x.endsWith('-plaque'))).toHaveLength(18);
  });
  it('every id in renovation.md is in renovation.ts, and the reverse', () => {
    expect([...listed].sort()).toEqual([...RENO_IDS].sort());
  });
  it('names ids as reno<level>-<shop>-<thing>, three decor and one fixture a level', () => {
    for (const shop of RENO_SHOPS)
      for (const [i, l] of RENO_ITEMS[shop].entries()) {
        for (const x of [l.plaque, l.fixture, ...l.decor]) expect(x.startsWith(`reno${i + 1}-${shop}-`)).toBe(true);
        expect(new Set(l.decor).size).toBe(3);
      }
    expect(RENO_SHOPS).toEqual(HOME);
  });
});
