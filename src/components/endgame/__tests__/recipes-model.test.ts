/// <reference types="jest" />
import { RECIPE_DROPS, recipeId } from '../../../content/endgame';
import { NEIGHBORHOODS } from '../../../content/tuning';
import * as G from '../../../engine/game';
import { collectionLine, recipeGroups } from '../recipes-model';

const NINE = ['downtown', 'suburbs'].flatMap((h) => [1, 2, 3, 4].map((n) => recipeId(h as 'downtown', n as 1))).concat([recipeId('waterfront', 1)]);
const withOwned = (owned: string[]): G.GameState => {
  const g = G.newGame(1_700_000_000_000);
  return { ...g, x: { ...g.x, recipes: { owned, fresh: [], synced: true, summary: null } } };
};

describe('the recipe collection', () => {
  test('24 tiles in six shops of four, in city order', () => {
    const groups = recipeGroups(withOwned([]));
    expect(groups.map((g) => g.id)).toEqual(NEIGHBORHOODS.map((n) => n.id));
    for (const g of groups) expect(g.tiles.map((t) => t.n)).toEqual([1, 2, 3, 4]);
    expect(groups.reduce((t, g) => t + g.tiles.length, 0)).toBe(24);
  });

  test('unowned cards are silhouettes with their drop condition', () => {
    const t = recipeGroups(withOwned([]))[0].tiles;
    expect(t.map((x) => x.name)).toEqual(['???', '???', '???', '???']);
    expect(t.map((x) => x.line)).toEqual(['', '', '', '']);
    expect(t.map((x) => x.drop)).toEqual([...RECIPE_DROPS]);
    expect(t.every((x) => !x.owned)).toBe(true);
  });

  test('9 of 24 owned: the names and lines of the nine, silhouettes for the rest', () => {
    const groups = recipeGroups(withOwned(NINE));
    expect(groups.reduce((t, g) => t + g.owned, 0)).toBe(9);
    expect(groups[0].tiles[0]).toMatchObject({ owned: true, name: 'Rosa’s Margherita', line: 'Basil on top, never under. Nonna checks.' });
    expect(groups[1].owned).toBe(4);
    expect(groups[2]).toMatchObject({ owned: 1, total: 4 });
    expect(groups[2].tiles[1]).toMatchObject({ owned: false, name: '???' });
    expect(groups[5].owned).toBe(0);
  });

  test('the tasks drawer line', () => {
    expect(collectionLine({ owned: 9, total: 24 })).toBe('Collection: 9/24 recipes');
  });
});
