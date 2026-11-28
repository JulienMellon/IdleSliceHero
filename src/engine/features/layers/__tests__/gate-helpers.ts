// Test helpers for the layer gates (v5.25, card E9): give a neighbourhood of the home city a number of mastery stars (heads, Flagship, Golden oven, in that order).
import { cityOf, hoodIds } from '../../../../content/cities';
import * as G from '../../../game';
import { shopStars } from '../../mastery';

/** `g` with the shop at build position `at` built and holding exactly `stars` mastery stars (0 to 3). */
export function withStars(g: G.GameState, at: number, stars: number): G.GameState {
  const city = cityOf(g);
  const id = hoodIds(city)[at];
  const shop = g.shops[id];
  const next: G.Shop = {
    ...shop,
    built: true,
    heads: stars >= 1 ? G.allHeads() : shop.heads,
    footprint: stars >= 2 ? city.fit.footprints.length - 1 : shop.footprint,
    grade: stars >= 3 ? city.fit.ovenGrades.length - 1 : shop.grade,
  };
  if (shopStars(next, city) !== stars) throw new Error(`withStars: ${id} has ${shopStars(next, city)} stars, not ${stars}`);
  return { ...g, shops: { ...g.shops, [id]: next } };
}

/** The rival's gate met (Suburbs at two stars). */
export const withRivalGate = (g: G.GameState): G.GameState => withStars(g, 1, 2);
