// The vanity shop's rules (A30, v5.24 E7): what a look costs (its tier's price, content/catalog.ts), what buying one does, what the scene
// draws in a shop (`dressFor`), the weekly Featured four and the sets' progress. The store calls this; the Shop screen's views
// (components/endgame/shop-model.ts) only read the same constants and the helpers below.
import { lookOf, setLooks, showsIn, SOLD_LOOKS, type LookDef, type SetId } from '../content/catalog';
import { partOf, SOLD_SKIN_BASE, VANITY_IDS, VANITY_PRICE } from '../content/endgame';
import { payDiamonds, type BuyResult, type GameState } from './game';
import { dayKey, grantCosmetic } from './rewards';

export { SOLD_SKIN_BASE, VANITY_IDS, VANITY_PRICE };

/** A storefront skin id of any kind (gift cycle or bought). */
export const isSkin = (id: string) => /^storefront-skin-\d+$/.test(id);
/** A skin bought with diamonds (numbered past SOLD_SKIN_BASE, C115). */
export const isSoldSkin = (id: string) => isSkin(id) && Number(id.slice('storefront-skin-'.length)) > SOLD_SKIN_BASE;

/** The next storefront skin the player can buy: `storefront-skin-101`, `-102`, ... */
export function nextSkin(owned: readonly string[]): string {
  let n = SOLD_SKIN_BASE + 1;
  while (owned.includes(`storefront-skin-${n}`)) n++;
  return `storefront-skin-${n}`;
}

/** The catalog row an id buys: a numbered sold skin buys the `storefront-skin` row; the earned plaque and unknown ids buy nothing. */
function soldLook(id: string): LookDef | undefined {
  const l = lookOf(isSoldSkin(id) ? 'storefront-skin' : id);
  return l && l.sold ? l : undefined;
}

/** Does the player own this look? Any storefront skin (gift or bought) owns the `storefront-skin` row, as the Style tab counts it. */
const owns = (cosmetics: readonly string[], l: LookDef): boolean => (l.id === 'storefront-skin' ? cosmetics.some(isSkin) : cosmetics.includes(l.id));

/** A set's progress: the pieces owned of its total, and whether it is complete. */
export interface SetProgress {
  set: SetId;
  owned: number;
  total: number;
  done: boolean;
}

export function setProgress(g: Pick<GameState, 'rewards'>, set: SetId): SetProgress {
  const pieces = setLooks(set);
  const owned = pieces.filter((l) => owns(g.rewards.cosmetics, l)).length;
  return { set, owned, total: pieces.length, done: pieces.length > 0 && owned === pieces.length };
}

/** The event raised once when a purchase completes a set (for the scene's flourish and the Vanity tab). `at` is also saved in `rewards.setsDone`. */
export const SET_COMPLETE = 'set_complete';
export interface SetCompleteEvent {
  type: typeof SET_COMPLETE;
  set: string;
  at: number;
}

/** The set a step finished, or null: the new `rewards.setsDone` entry between two states. */
export function setCompleteEvent(before: Pick<GameState, 'rewards'>, after: Pick<GameState, 'rewards'>): SetCompleteEvent | null {
  const done = after.rewards.setsDone.find((d) => !before.rewards.setsDone.some((b) => b.set === d.set));
  return done ? { type: SET_COMPLETE, set: done.set, at: done.at } : null;
}

/**
 * Buy a look with diamonds at its tier's price: it is owned and, being new, worn at once (`grantCosmetic`). Only the looks for sale: the
 * plaque is earned. Not enough diamonds, or already owned: refused with the reason, nothing changes. When the purchase completes
 * its set, the set is pushed to `rewards.setsDone` (once: `setCompleteEvent` reads it).
 */
export function buyCosmetic(g: GameState, id: string, now: number = Date.now()): BuyResult {
  const item = soldLook(id);
  if (!item) return { ok: false, reason: 'Not for sale' };
  const r = g.rewards;
  if (r.cosmetics.includes(id)) return { ok: false, reason: 'Already yours' };
  const paid = payDiamonds(g, item.price);
  if (!paid.ok) return paid;
  const pr = paid.state.rewards;
  const bought = { ...pr, ...grantCosmetic(pr, id) };
  const set = item.set;
  const done = set !== null && !bought.setsDone.some((d) => d.set === set) && setProgress({ rewards: bought }, set).done;
  return { ok: true, state: { ...paid.state, rewards: done && set ? { ...bought, setsDone: [...bought.setsDone, { set, at: now }] } : bought } };
}

/**
 * The ids the scene draws in a shop: what is worn, minus the set pieces of other shops' sets, and a set piece of this shop beats a
 * generic look of the same part. Order is the worn order. `shopId` is the neighbourhood id.
 */
export function dressFor(g: Pick<GameState, 'rewards'>, shopId: string): string[] {
  const here = g.rewards.worn.filter((id) => {
    const l = lookOf(id);
    return !l || showsIn(l, shopId);
  });
  const setParts = new Set(here.filter((id) => lookOf(id)?.set).map(partOf));
  return here.filter((id) => lookOf(id)?.set || !setParts.has(partOf(id)));
}

/** How many looks the Featured row shows. */
export const FEATURED_COUNT = 4;

/** Whole weeks (Monday to Sunday, the player's local calendar) since the Monday of 1970-01-05 that `now` falls in. Continuous over New Year, unlike the ISO week number. */
export function weekIndex(now: number): number {
  const [y, m, d] = dayKey(now).split('-').map(Number);
  return Math.floor((Math.round(Date.UTC(y, m - 1, d) / 86_400_000) + 3) / 7);
}

/** Is this look one the player can see yet? A generic look always; a set piece once its neighbourhood's shop is built (D574: no looks for a shop that is not open). */
const opened = (g: Pick<GameState, 'shops'>, l: LookDef): boolean => l.shows === 'all' || !!g.shops[l.shows]?.built;

/**
 * Featured this week: four looks the player does not own, taken from the looks for sale in catalog order starting at this week's
 * place (four further on each week), skipping owned ones and the set pieces of shops that are not built yet. Stable all week for the
 * same wardrobe and shops; with every shop built and 41 looks each comes up within 11 weeks, sooner for a player who already owns
 * some. Never limited: every look stays buyable.
 */
export function featured(g: Pick<GameState, 'rewards' | 'shops'>, now: number): LookDef[] {
  const n = SOLD_LOOKS.length;
  const start = (weekIndex(now) * FEATURED_COUNT) % n;
  const out: LookDef[] = [];
  for (let k = 0; k < n && out.length < FEATURED_COUNT; k++) {
    const l = SOLD_LOOKS[(start + k) % n];
    if (!owns(g.rewards.cosmetics, l) && opened(g, l)) out.push(l);
  }
  return out;
}
