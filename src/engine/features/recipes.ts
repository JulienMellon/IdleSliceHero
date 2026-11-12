// Recipe cards (v5.15): 24 cards, four per shop, ids `recipe.<hood>.<1-4>`. They drop from play only (never from diamonds, ads or
// purchases): (1) any kitchen station in that shop reaches Lv 50; (2) its General Manager is hired; (3) its finale is seen;
// (4) a counter-attack is defended there. Each card owned multiplies that shop's value per pizza by 1.01. The conditions are read
// off the game every tick, so a save from before the feature gets every card it already deserves in one silent catch-up with one
// summary, and play after that shows each card as it drops (`fresh`, drained by `ackRecipes`).
import { RECIPE, recipeId } from '../../content/endgame';
import type { NeighborhoodId } from '../../content/types';
import { finaleId, SHOP_IDS, type GameState, type Shop } from '../game';
import { defendedHoods } from './counterattack';
import type { Feature } from './types';

export interface RecipesState {
  /** Card ids owned. */
  owned: string[];
  /** Dropped but not yet shown. */
  fresh: string[];
  /** False until the first tick or catch-up after the feature first loads: it grants what is already earned silently. */
  synced: boolean;
  /** The silent catch-up's one summary: how many cards were granted. */
  summary: { cards: number } | null;
}

export const KEY = 'recipes';

type CardNo = 1 | 2 | 3 | 4;
export const CARDS: readonly CardNo[] = [1, 2, 3, 4];

const station50 = (shop: Shop) => Math.max(shop.prep, shop.ovens, shop.counter) >= RECIPE.stationLevel;

/** Whether card `n` of a shop has been earned right now. */
export function cardEarned(g: GameState, id: NeighborhoodId, n: CardNo): boolean {
  const shop = g.shops[id];
  switch (n) {
    case 1:
      return shop.built && station50(shop);
    case 2:
      return shop.built && shop.managed;
    case 3:
      return g.seenScenes.includes(finaleId(id));
    case 4:
      return defendedHoods(g).includes(id);
  }
}

const empty = (): RecipesState => ({ owned: [], fresh: [], synced: false, summary: null });
const read = (g: GameState): RecipesState => (g.x?.[KEY] as RecipesState | undefined) ?? empty();
const write = (g: GameState, s: RecipesState): GameState => ({ ...g, x: { ...g.x, [KEY]: s } });

/** Cards owned in one shop, 0..4. */
export const ownedIn = (g: GameState, id: NeighborhoodId): number => {
  const have = read(g).owned;
  return CARDS.reduce((n, c) => n + (have.includes(recipeId(id, c)) ? 1 : 0), 0);
};

export interface Collection {
  owned: number;
  total: number;
  /** Per shop, in city order. */
  shops: { id: NeighborhoodId; owned: number; total: number; cards: { id: string; n: CardNo; owned: boolean }[] }[];
}

/** Owned and total cards, overall and per shop, for the scrapbook. */
export function collectionView(g: GameState): Collection {
  const have = read(g).owned;
  const shops = SHOP_IDS.map((id) => {
    const cards = CARDS.map((n) => ({ id: recipeId(id, n), n, owned: have.includes(recipeId(id, n)) }));
    return { id, owned: cards.filter((c) => c.owned).length, total: RECIPE.perShop, cards };
  });
  return { owned: shops.reduce((t, s) => t + s.owned, 0), total: SHOP_IDS.length * RECIPE.perShop, shops };
}

function settle(g: GameState): GameState {
  const st = read(g);
  const due: string[] = [];
  for (const id of SHOP_IDS) for (const n of CARDS) if (!st.owned.includes(recipeId(id, n)) && cardEarned(g, id, n)) due.push(recipeId(id, n));
  if (st.synced && !due.length) return g;
  const silent = !st.synced;
  return write(g, {
    owned: [...st.owned, ...due],
    fresh: silent ? st.fresh : [...st.fresh, ...due],
    synced: true,
    summary: silent && due.length ? { cards: due.length } : st.summary,
  });
}

/** The UI has shown the new cards (and the catch-up summary). */
export function ackRecipes(g: GameState): GameState {
  const st = read(g);
  return st.fresh.length || st.summary ? write(g, { ...st, fresh: [], summary: null }) : g;
}

export const recipes: Feature<RecipesState> = {
  key: KEY,
  init: () => empty(),
  migrate(raw) {
    if (!raw || typeof raw !== 'object') return empty();
    const r = raw as Record<string, unknown>;
    const valid = new Set(SHOP_IDS.flatMap((id) => CARDS.map((n) => recipeId(id, n))));
    const owned = Array.isArray(r.owned) ? [...new Set((r.owned as unknown[]).filter((x): x is string => typeof x === 'string' && valid.has(x)))] : [];
    const sum = r.summary && typeof r.summary === 'object' ? (r.summary as Record<string, unknown>) : null;
    return { owned, fresh: [], synced: r.synced === true, summary: sum && typeof sum.cards === 'number' ? { cards: Math.max(0, Math.floor(sum.cards)) } : null };
  },
  tick: (g) => settle(g),
  onOffline: (g) => settle(g),
  shopValueMult: (g, id) => Math.pow(RECIPE.valueMult, ownedIn(g, id)),
};
