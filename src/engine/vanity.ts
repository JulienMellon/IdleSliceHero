// The vanity shop's rules (A30): what a cosmetic costs and what buying one does. The store calls this; the Shop screen's
// views (components/endgame/shop-model.ts) only read the same constants and the helpers below.
import { SOLD_SKIN_BASE, VANITY_IDS, VANITY_PRICE } from '../content/endgame';
import type { BuyResult, GameState } from './game';
import { grantCosmetic } from './rewards';

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

/**
 * Buy a cosmetic with diamonds: it is owned and, being new, worn at once (`grantCosmetic`). Only the six for sale: the plaque
 * is earned. Not enough diamonds, or already owned: refused with the reason, nothing changes.
 */
export function buyCosmetic(g: GameState, id: string): BuyResult {
  const item = VANITY_IDS.find((v) => v === id || (v === 'storefront-skin' && isSoldSkin(id)));
  if (!item || item === 'plaque-master') return { ok: false, reason: 'Not for sale' };
  const r = g.rewards;
  if (r.cosmetics.includes(id)) return { ok: false, reason: 'Already yours' };
  if (r.diamonds < VANITY_PRICE) return { ok: false, reason: 'Not enough diamonds' };
  return { ok: true, state: { ...g, rewards: { ...r, ...grantCosmetic(r, id), diamonds: r.diamonds - VANITY_PRICE } } };
}
