// The store's pure parts (card U3): the five products as rows with their price state, what a paid-out grant does to the game, the
// Starter Pack's one-time offer and the small saved prefs. The tab (store-tab.tsx), the sheet (starter-sheet.tsx) and Settings only draw this.
import { GRANTS } from '../../services/grants';
import { PRODUCT_IDS, type BuyResult, type ProductId } from '../../services/types';

// ---------- products ----------

/** The prices the store gave, by product. `null`: still asking. `{}` after an answer: none came (offline, no key), so every pack is unpriced. */
export type Prices = Readonly<Partial<Record<ProductId, string>>> | null;

export interface ProductInfo {
  title: string;
  /** What it gives, in one line. */
  blurb: string;
}

export const PRODUCTS: Readonly<Record<ProductId, ProductInfo>> = {
  starter_pack: { title: 'Starter Pack', blurb: '150 diamonds, 2× income for 24 hours and the Founder awning' },
  nonnas_plus: { title: 'Nonna’s Plus', blurb: 'Every ad reward at one tap, no ad. Offline earnings 2×, built in.' },
  diamonds_80: { title: '80 diamonds', blurb: 'A pinch of diamonds' },
  diamonds_500: { title: '500 diamonds', blurb: 'A box of diamonds' },
  diamonds_1200: { title: '1,200 diamonds', blurb: 'A crate of diamonds' },
};

/** The order the tab lists them in. */
export const PRODUCT_ORDER: readonly ProductId[] = ['starter_pack', 'nonnas_plus', 'diamonds_80', 'diamonds_500', 'diamonds_1200'];

/** What a pack holds, shown as a small card (D496): the numbers come from the grant itself, so the art can't drift from what is paid. */
export interface Chip {
  kind: 'diamonds' | 'boost' | 'awning';
  title: string;
  sub: string;
}

/** The content chips of a bundle: one per thing it gives. A plain diamond pack or Plus has none (its title already says it). */
export function productChips(id: ProductId): Chip[] {
  const g = GRANTS[id];
  if (!g.boost && !g.cosmetic) return [];
  const out: Chip[] = [];
  if (g.diamonds > 0) out.push({ kind: 'diamonds', title: String(g.diamonds), sub: 'diamonds' });
  if (g.boost) out.push({ kind: 'boost', title: `${g.boost.mult}×`, sub: `income ${g.boost.hours} h` });
  if (g.cosmetic) out.push({ kind: 'awning', title: 'Founder', sub: 'awning' });
  return out;
}

/** The ribbon on a card, if it has one: the Starter Pack is a one-time deal (it leaves the tab once bought). */
export const PRODUCT_RIBBON: Readonly<Partial<Record<ProductId, string>>> = { starter_pack: 'ONE-TIME DEAL' };

export type RowState = 'owned' | 'buy' | 'loading' | 'unpriced';

export interface ProductRow {
  id: ProductId;
  title: string;
  blurb: string;
  /** The store's own price text; null until it arrives. Never a placeholder price. */
  price: string | null;
  state: RowState;
  /** The button's words: the price, "Owned", or why there is no price. */
  label: string;
  enabled: boolean;
}

/** Whether a purchase is a one-time product (it is hidden or "Owned" once bought) rather than a pack that can be bought again. */
const ONCE: ReadonlySet<ProductId> = new Set<ProductId>(['starter_pack', 'nonnas_plus']);

/**
 * The tab's rows. A price comes only from the store: while it loads the button says "Loading…" and after a failed answer "Price unavailable",
 * disabled both times. The Starter Pack leaves the tab once bought; Nonna's Plus stays, as "Owned".
 */
export function productRows(prices: Prices, owned: readonly ProductId[]): ProductRow[] {
  const rows: ProductRow[] = [];
  for (const id of PRODUCT_ORDER) {
    const has = ONCE.has(id) && owned.includes(id);
    if (has && id === 'starter_pack') continue;
    const price = prices?.[id] ?? null;
    const state: RowState = has ? 'owned' : price ? 'buy' : prices === null ? 'loading' : 'unpriced';
    rows.push({ id, ...PRODUCTS[id], price, state, label: state === 'owned' ? 'Owned' : state === 'buy' ? (price as string) : state === 'loading' ? 'Loading…' : 'Price unavailable', enabled: state === 'buy' });
  }
  return rows;
}

/** The prices as a map from the store's list. */
export function pricesFrom(list: readonly { id: ProductId; price: string }[]): Prices {
  const out: Partial<Record<ProductId, string>> = {};
  for (const p of list) if ((PRODUCT_IDS as readonly string[]).includes(p.id) && p.price) out[p.id] = p.price;
  return out;
}

/** The line under a purchase: nothing when the player cancelled. */
export function buyLine(r: BuyResult): string {
  return r === 'purchased' ? 'Thank you! It’s yours.' : r === 'failed' ? 'The purchase didn’t go through. You weren’t charged.' : '';
}

/** The line after Restore Purchases: names what the account owns, or says there was nothing. */
export function restoreLine(ids: readonly ProductId[]): string {
  const names = PRODUCT_ORDER.filter((id) => ONCE.has(id) && ids.includes(id)).map((id) => PRODUCTS[id].title);
  return names.length ? `Restored: ${names.join(', ')}.` : 'No earlier purchases found for this account.';
}

// ---------- a paid-out grant ----------

// Moved to engine/offers.ts (A34); re-exported for the screens and tests.
export { applyGrant } from '../../engine/offers';

// ---------- the Starter Pack's offer ----------

/** Play seconds after the tutorial ends before the sheet may show: the first story beat and the first look at the shop come first. */
export const STARTER_DELAY = 30;

export interface StarterInput {
  /** Play seconds when the tutorial ended this session; null if it didn't. */
  at: number | null;
  playSeconds: number;
  offered: boolean;
  owned: boolean;
  /** A scene, the offline popup, a drawer or another screen is up. */
  covered: boolean;
}

/** The sheet shows once, after the tutorial, when nothing else is up and the pack isn't owned. */
export const starterShows = (i: StarterInput): boolean => i.at !== null && !i.offered && !i.owned && !i.covered && i.playSeconds >= i.at + STARTER_DELAY;

// ---------- prefs ----------

/** Saved on their own (not in the game save), so Start over doesn't offer a bought pack again. */
export interface StorePrefs {
  starterOffered: boolean;
  /** The local day the shelf's free booster was last taken ('' = never). */
  boosterAdDay: string;
}
export const PREFS_KEY = 'slice-empire/store/v1';
export const NO_PREFS: StorePrefs = { starterOffered: false, boosterAdDay: '' };

export function parsePrefs(raw: string | null): StorePrefs {
  try {
    const v = JSON.parse(raw ?? '') as Partial<StorePrefs>;
    return { starterOffered: v.starterOffered === true, boosterAdDay: typeof v.boosterAdDay === 'string' ? v.boosterAdDay : '' };
  } catch {
    return NO_PREFS;
  }
}
