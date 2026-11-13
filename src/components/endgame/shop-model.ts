// The Shop screen as plain data (v5.15): tab 1 is the vanity shop (the seven cosmetics), tab 2 the booster shelf.
// Cosmetics cost diamonds; boosters are never sold (the shelf only shows the inventory and starts a booster). The rules for
// wearing are engine/rewards.ts (`wear`, `unwear`, `grantCosmetic`); the names and lines are the copy table. Pure: unit-tested in node.
import { MASTERY, VANITY_IDS, VANITY_PRICE, type VanityId } from '../../content/endgame';
import type { GameState } from '../../engine/game';
import { isSkin, nextSkin } from '../../engine/vanity';
import { spanText } from '../rewards-model';
import { copy } from './copy-text';

// The price, the ids and the buy rule are the engine's (A30: engine/vanity.ts); this file is the views.
export { buyCosmetic, SOLD_SKIN_BASE } from '../../engine/vanity';
export { VANITY_IDS, VANITY_PRICE, type VanityId };

/** The owned ids a shop item stands for: the storefront skins are numbered by gift cycle, so "Fresh Storefront" is any of them. */
const idsOf = (item: VanityId, owned: readonly string[]): string[] => (item === 'storefront-skin' ? owned.filter(isSkin) : owned.filter((o) => o === item));

/** `owned` (not worn), `worn`, `buy` (enough diamonds), `poor` (not enough), `earn` (the plaque: never sold). */
export type VanityState = 'worn' | 'owned' | 'buy' | 'poor' | 'earn';

export interface VanityView {
  id: VanityId;
  name: string;
  desc: string;
  state: VanityState;
  /** The button: "Worn", "Wear", "150 diamonds", "earn 18 stars". */
  label: string;
  /** The cosmetic id a tap wears or takes off (the storefront item: the skin the player owns); null when not owned. */
  wearId: string | null;
  /** The cosmetic id a tap buys (the next storefront skin number); null when not for sale. */
  buyId: string | null;
}

export function vanityViews(g: GameState): VanityView[] {
  const { cosmetics, worn, diamonds } = g.rewards;
  return VANITY_IDS.map((id) => {
    const have = idsOf(id, cosmetics);
    const wornId = have.find((h) => worn.includes(h)) ?? null;
    const base = { id, name: copy(`shop.item.${id}.name`), desc: copy(`shop.item.${id}.desc`) };
    if (have.length) return { ...base, state: wornId ? 'worn' : 'owned', label: wornId ? 'Worn' : 'Wear', wearId: wornId ?? have[have.length - 1], buyId: null } satisfies VanityView;
    if (id === 'plaque-master') return { ...base, state: 'earn', label: `earn ${MASTERY.masterTotal} stars`, wearId: null, buyId: null } satisfies VanityView;
    return { ...base, state: diamonds >= VANITY_PRICE ? 'buy' : 'poor', label: `${VANITY_PRICE} diamonds`, wearId: null, buyId: id === 'storefront-skin' ? nextSkin(cosmetics) : id } satisfies VanityView;
  });
}

export interface ShelfRow {
  /** Index in `rewards.boosters`: what `startBooster(i)` takes. */
  index: number;
  /** D462: "2× income · 15 m", "2× income · 1 h" (never "1h0m"). */
  label: string;
}

/** The booster shelf: the inventory, one row each. Empty = the empty-shelf line. */
export const boosterShelf = (g: GameState): ShelfRow[] => g.rewards.boosters.map((b, index) => ({ index, label: shelfLabel(b.mult, b.seconds) }));

/** "2× income · 1 h": the shelf's own wording; whole hours and days drop their zero minutes and hours. */
export const shelfLabel = (mult: number, seconds: number): string => `${Number.isInteger(mult) ? mult : Math.round(mult * 10) / 10}\u00D7 income \u00B7 ${spanText(seconds).replace(/ 0 m$/, '').replace(/ 0 h$/, '')}`;

export const SHELF_EMPTY = (): string => copy('shop.boosters.empty');

/** Both tabs' titles. */
export const SHOP_TABS = () => [copy('shop.vanity.title'), copy('shop.boosters.title')] as const;
