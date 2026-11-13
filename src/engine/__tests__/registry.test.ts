// T87 (C112): the "+$X/s" caches refresh when an event, an attack or a recipe card moves a shop's value.
// T88 (A31): a feature can be imported before the game, and only importing the features registers them.
import { NEIGHBORHOODS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { getFeature } from '../features';
import { counterattack } from '../features/counterattack';
import { recipes } from '../features/recipes';
import * as G from '../game';

const IDS = NEIGHBORHOODS.map((n) => n.id);
const at = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();
const FRI = at(2026, 11, 13, 18);
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } } });
/** A running Downtown whose stations are tied, so the bundle hint exists. */
const city = (now: number): G.GameState => {
  let g = G.newGame(now);
  for (const id of IDS) g = withShop(g, id, { built: true, managed: true, heads: G.allHeads(), prep: 10, ovens: 10, counter: 10, tables: 10, drivers: 5 });
  return { ...g, lastSavedAt: now };
};

describe('T87 shopLevelKey follows the features', () => {
  it('an event stamp, an attack and a new recipe card each change the key, and only of the shop they touch', () => {
    const calm = G.playTick(city(at(2026, 11, 12, 18)), 1, at(2026, 11, 12, 18));
    const key = (g: G.GameState, id: NeighborhoodId) => G.shopLevelKey(g, id);
    const rush = G.playTick(city(FRI), 1, FRI);
    expect(key(rush, 'uptown')).not.toBe(key(calm, 'uptown'));
    // game day: suburbs and downtown only
    const SUN = at(2026, 11, 15, 14);
    const game = G.playTick(city(SUN), 1, SUN);
    const calmSun = G.playTick(city(at(2026, 11, 14, 14)), 1, at(2026, 11, 14, 14));
    expect(key(game, 'suburbs')).not.toBe(key(calmSun, 'suburbs'));
    expect(key(game, 'uptown')).toBe(key(calmSun, 'uptown'));
    // an attack on one shop
    const attacked = { ...calm, x: { ...calm.x, counterattack: { ...getFeature(calm, counterattack), open: true, target: 'waterfront' as const } } };
    expect(key(attacked, 'waterfront')).not.toBe(key(calm, 'waterfront'));
    expect(key(attacked, 'uptown')).toBe(key(calm, 'uptown'));
    // a card
    const card = { ...calm, x: { ...calm.x, recipes: { ...getFeature(calm, recipes), owned: [...getFeature(calm, recipes).owned, 'recipe.suburbs.1'] } } };
    expect(key(card, 'suburbs')).not.toBe(key(calm, 'suburbs'));
    expect(key(card, 'downtown')).toBe(key(calm, 'downtown'));
  });

  it("bundleHint and the shop's gain are recomputed when a recipe card drops (no purchase)", () => {
    const g0 = G.playTick(city(at(2026, 11, 12, 18)), 1, at(2026, 11, 12, 18));
    const tied = withShop(g0, 'downtown', { prep: 10, ovens: 10, counter: 10, tables: 1, drivers: 1 });
    const before = G.bundleHint(tied, 'downtown');
    expect(before).not.toBeNull();
    const withCard = { ...tied, x: { ...tied.x, recipes: { ...getFeature(tied, recipes), owned: ['recipe.downtown.1', 'recipe.downtown.2'] } } };
    const after = G.bundleHint(withCard, 'downtown');
    expect(after!.gain).toBeCloseTo(before!.gain * 1.01, 9); // the managed shop already owns card 2; the test adds card 1
  });
});

describe('T88 module order', () => {
  const features = ['recipes', 'mastery', 'counterattack', 'events', 'heads'];
  for (const f of features) {
    it(`importing features/${f} before the game does not throw`, () => {
      jest.isolateModules(() => {
        expect(() => require(`../features/${f}`)).not.toThrow();
      });
    });
  }

  it('the game alone has no features; importing the features registers them once, in order', () => {
    jest.isolateModules(() => {
      const game = require('../game');
      expect(game.newGame(0).x).toEqual({});
      require('../features');
      expect(Object.keys(game.newGame(0).x)).toEqual(['mastery', 'counterattack', 'events', 'recipes', 'heads']);
      require('../features');
      expect(Object.keys(game.newGame(0).x)).toHaveLength(5);
    });
  });

  it('importing the features first works too', () => {
    jest.isolateModules(() => {
      const f = require('../features');
      const game = require('../game');
      expect(f.FEATURES).toHaveLength(5);
      expect(Object.keys(game.newGame(0).x)).toHaveLength(5);
    });
  });
});
