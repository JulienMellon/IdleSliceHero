// The recipe collection as plain data (v5.15): 24 cards, four per shop. The rules are engine/features/recipes.ts
// (`collectionView`); the names and lines are the copy table, the drop conditions are content/endgame.ts. Pure: unit-tested in node.
import { RECIPE_DROPS } from '../../content/endgame';
import { NEIGHBORHOODS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import type { GameState } from '../../engine/game';
import { collectionView, type Collection } from '../../engine/features/recipes';
import { recipeLine, recipeName } from './copy-text';

export interface RecipeTile {
  id: string;
  n: 1 | 2 | 3 | 4;
  owned: boolean;
  /** The card's name; "???" while it is not owned (a silhouette). */
  name: string;
  /** The flavour line; '' while it is not owned. */
  line: string;
  /** What earns it: shown on a silhouette ("Any station reaches Lv 50"). */
  drop: string;
}

export interface RecipeGroup {
  id: NeighborhoodId;
  shop: string;
  color: string;
  owned: number;
  total: number;
  tiles: RecipeTile[];
}

/** "Collection: 9/24 recipes": the tasks drawer's line. */
export const collectionLine = (c: Pick<Collection, 'owned' | 'total'>): string => `Collection: ${c.owned}/${c.total} recipes`;

/** The scrapbook's recipe section: every shop's four cards in city order, unowned ones as silhouettes with their drop condition. */
export function recipeGroups(g: GameState): RecipeGroup[] {
  const view = collectionView(g);
  return view.shops.map((s) => {
    const n = NEIGHBORHOODS.find((x) => x.id === s.id)!;
    return {
      id: s.id,
      shop: n.name,
      color: n.color,
      owned: s.owned,
      total: s.total,
      tiles: s.cards.map((c) => ({ id: c.id, n: c.n, owned: c.owned, name: c.owned ? recipeName(c.id) : '???', line: c.owned ? recipeLine(c.id) : '', drop: RECIPE_DROPS[c.n - 1] })),
    };
  });
}
