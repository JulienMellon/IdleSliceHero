// Shop renovation (v5.25, card E10). A shop at three mastery stars can be renovated up to three times (content/renovation.ts has the numbers and
// the looks, docs/build/v5.25/renovation.md the list). `renovate` charges the price, sends the shop's five stations back to level 1 (cash,
// the manager, the heads, the footprint, the oven grade, decor tiers and every unlocked shop stay), raises its level and returns a
// `renovated { shop, level }` event for the scene and the sheet. The shop then earns x2 / x3 / x4 for good (this feature's `shopValueMult`, so
// every readout, offline and reward income sees it), and the level's three decor items can be bought with cash; each is a decor tier to the
// price (+DECOR_BOOST) and to Uptown's rating (layers/stars.ts). The save is `GameState.renovation`; a franchise starts it over (RESET_FIELDS).
import { cityOf } from '../../content/cities';
import { RENO_MAX, RENO_MULT, noRenovation, renoCost, renoDecorCost, renoItems, type RenoLevel, type Renovated } from '../../content/renovation';
import { DECOR_BOOST } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { pay, perkOf, type BuyResult, type GameState } from '../game';
import { shopStars } from './mastery';
import type { Feature } from './types';

export const KEY = 'renovationFx';

/** The mastery stars a shop needs to be renovated. */
export const RENO_STARS_NEEDED = 3;

/** What `renovate` emits for the scene and the UI. */
export interface RenovatedEvent {
  type: 'renovated';
  shop: NeighborhoodId;
  level: 1 | 2 | 3;
}
export type RenovateResult = { ok: true; state: GameState; event: RenovatedEvent } | { ok: false; reason: string };

/** A shop's renovation (level 0 and no decor when it has had none). */
export const renoOf = (g: Pick<GameState, 'renovation'>, shop: NeighborhoodId): Renovated => g.renovation?.[shop] ?? noRenovation();
export const renoLevel = (g: Pick<GameState, 'renovation'>, shop: NeighborhoodId): RenoLevel => renoOf(g, shop).level;
/** The income multiplier of a shop's renovation level. */
export const renoMult = (g: Pick<GameState, 'renovation'>, shop: NeighborhoodId): number => RENO_MULT[renoLevel(g, shop)];
/** Decor items a shop has bought. */
export const renoDecorCount = (g: Pick<GameState, 'renovation'>, shop: NeighborhoodId): number => renoOf(g, shop).decor.length;

/** The next level's price for this shop, or null when it is at the last level (or is not in the city). */
export const nextRenoCost = (g: GameState, shop: NeighborhoodId): number | null => {
  const level = renoLevel(g, shop);
  return level >= RENO_MAX ? null : renoCost(shop, level + 1, cityOf(g));
};

/** Why a shop cannot be renovated now (null: it can). The price is checked last, so a sheet can show "not enough cash" apart from the rest. */
export function renovateLock(g: GameState, shop: NeighborhoodId): string | null {
  const sh = g.shops[shop];
  if (!sh?.built) return 'Build this pizzeria first';
  if (shopStars(sh, cityOf(g)) < RENO_STARS_NEEDED) return 'Earn all three stars first';
  if (renoLevel(g, shop) >= RENO_MAX) return 'Fully renovated';
  const cost = nextRenoCost(g, shop);
  if (cost === null) return 'Not available';
  return g.cash < cost ? 'Not enough cash' : null;
}

/** The offer: the shop is at three stars, below level 3, and the player can pay. */
export const canRenovate = (g: GameState, shop: NeighborhoodId): boolean => renovateLock(g, shop) === null;

/** Renovate a shop: pay, stations to level 1, level up. */
export function renovate(g: GameState, shop: NeighborhoodId): RenovateResult {
  const why = renovateLock(g, shop);
  if (why !== null) return { ok: false, reason: why };
  const paid = pay(g, nextRenoCost(g, shop) as number);
  if (!paid.ok) return paid;
  const level = (renoLevel(g, shop) + 1) as 1 | 2 | 3;
  const sh = paid.state.shops[shop];
  const state: GameState = {
    ...paid.state,
    shops: { ...paid.state.shops, [shop]: { ...sh, prep: 1, ovens: 1, counter: 1, drivers: 1, tables: 1 } },
    renovation: { ...paid.state.renovation, [shop]: { ...renoOf(paid.state, shop), level } },
  };
  return { ok: true, state, event: { type: 'renovated', shop, level } };
}

// ---------- decor ----------

/** The decor items a shop can buy now: those of the levels it has reached, in order. */
export function renoDecorOffer(g: GameState, shop: NeighborhoodId): string[] {
  const out: string[] = [];
  for (let l = 1; l <= renoLevel(g, shop); l++) out.push(...(renoItems(shop, l, cityOf(g))?.decor ?? []));
  return out;
}

/** The level (1 to 3) a decor item belongs to in this shop, or 0 for an id it has not. */
export function renoDecorLevel(g: GameState, shop: NeighborhoodId, item: string): number {
  for (let l = 1; l <= RENO_MAX; l++) if (renoItems(shop, l, cityOf(g))?.decor.includes(item)) return l;
  return 0;
}

/** What a decor item costs, or null when the shop has not reached its level, already has it, or it is not a decor id. */
export function renoDecorPrice(g: GameState, shop: NeighborhoodId, item: string): number | null {
  const l = renoDecorLevel(g, shop, item);
  if (l === 0 || l > renoLevel(g, shop) || renoOf(g, shop).decor.includes(item)) return null;
  return renoDecorCost(shop, l, cityOf(g));
}

export function buyRenoDecor(g: GameState, shop: NeighborhoodId, item: string): BuyResult {
  if (!g.shops[shop]?.built) return { ok: false, reason: 'Build this pizzeria first' };
  const cost = renoDecorPrice(g, shop, item);
  if (cost === null) return { ok: false, reason: renoOf(g, shop).decor.includes(item) ? 'Already bought' : 'Not available yet' };
  const paid = pay(g, cost);
  if (!paid.ok) return paid;
  const cur = renoOf(paid.state, shop);
  return { ok: true, state: { ...paid.state, renovation: { ...paid.state.renovation, [shop]: { ...cur, decor: [...cur.decor, item] } } } };
}

// ---------- income ----------

/** The multiplier a shop's renovation puts on its pizzas: the level's x2 / x3 / x4 and +DECOR_BOOST (the shop's perk may raise it) per decor item. */
export function renoValueMult(g: GameState, shop: NeighborhoodId): number {
  const r = renoOf(g, shop);
  if (r.level === 0) return 1;
  const sh = g.shops[shop];
  const boost = (sh ? perkOf(shop, sh, cityOf(g))?.decorBoost : undefined) ?? DECOR_BOOST;
  return RENO_MULT[r.level] * (1 + boost * r.decor.length);
}

export const renovationFeature: Feature<Record<string, never>> = {
  key: KEY,
  // no state of its own: the save is GameState.renovation
  init: () => ({}),
  migrate: () => ({}),
  shopValueMult: (g, id) => renoValueMult(g, id),
  shopKey: (g, id) => {
    const r = g.renovation?.[id];
    return r && r.level > 0 ? `rn${r.level}.${r.decor.length}` : '';
  },
};
