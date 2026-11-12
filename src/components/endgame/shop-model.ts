// The Shop screen as plain data (v5.15): tab 1 is the vanity shop (the seven cosmetics), tab 2 the booster shelf.
// Cosmetics cost diamonds; boosters are never sold (the shelf only shows the inventory and starts a booster). The rules for
// wearing are engine/rewards.ts (`wear`, `unwear`, `grantCosmetic`); the names and lines are the copy table. Pure: unit-tested in node.
import { MASTERY } from '../../content/endgame';
import type { BuyResult, GameState } from '../../engine/game';
import { grantCosmetic } from '../../engine/rewards';
import { boosterLabel } from '../rewards-model';
import { copy } from './copy-text';

/** What a cosmetic costs, in diamonds. */
export const VANITY_PRICE = 150;

/** The seven cosmetics, in the order the shop lists them. `plaque-master` is earned at 18 stars and never sold. */
export const VANITY_IDS = ['oven-gold', 'storefront-skin', 'oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold', 'plaque-master'] as const;
export type VanityId = (typeof VANITY_IDS)[number];

const isSkin = (id: string) => /^storefront-skin-\d+$/.test(id);
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

/** The next storefront skin the player doesn't own: `storefront-skin-1`, `-2`, ... */
function nextSkin(owned: readonly string[]): string {
  let n = 1;
  while (owned.includes(`storefront-skin-${n}`)) n++;
  return `storefront-skin-${n}`;
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

/**
 * Buy a cosmetic with diamonds: it is owned and, being new, worn at once (`grantCosmetic`). Only the six for sale: the plaque
 * is earned. Not enough diamonds, or already owned: refused with the reason, nothing changes.
 */
export function buyCosmetic(g: GameState, id: string): BuyResult {
  const item = VANITY_IDS.find((v) => v === id || (v === 'storefront-skin' && isSkin(id)));
  if (!item || item === 'plaque-master') return { ok: false, reason: 'Not for sale' };
  const r = g.rewards;
  if (r.cosmetics.includes(id)) return { ok: false, reason: 'Already yours' };
  if (r.diamonds < VANITY_PRICE) return { ok: false, reason: 'Not enough diamonds' };
  return { ok: true, state: { ...g, rewards: { ...r, ...grantCosmetic(r, id), diamonds: r.diamonds - VANITY_PRICE } } };
}

export interface ShelfRow {
  /** Index in `rewards.boosters`: what `startBooster(i)` takes. */
  index: number;
  /** "2× 15m". */
  label: string;
}

/** The booster shelf: the inventory, one row each. Empty = the empty-shelf line. */
export const boosterShelf = (g: GameState): ShelfRow[] => g.rewards.boosters.map((b, index) => ({ index, label: boosterLabel(b) }));

export const SHELF_EMPTY = (): string => copy('shop.boosters.empty');

/** Both tabs' titles. */
export const SHOP_TABS = () => [copy('shop.vanity.title'), copy('shop.boosters.title')] as const;
