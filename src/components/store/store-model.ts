// The store's pure parts (card U3): the five products as rows with their price state, what a paid-out grant does to the game, the
// Starter Pack's one-time offer and the small saved prefs. The tab (store-tab.tsx), and Settings only draw this.
import { t } from '../../content/copy';
import { VANITY_IDS, VANITY_PRICE } from '../../content/endgame';
import { money } from '../../engine/format';
import { isSkin } from '../../engine/vanity';
import { GRANTS, isConsumable, PACK_SPLIT } from '../../services/grants';
import { PRODUCT_IDS, type BuyResult, type ProductId } from '../../services/types';

// ---------- products ----------

/** The prices the store gave, by product. `null`: still asking. `{}` after an answer: none came (offline, no key), so every pack is unpriced. */
export type Prices = Readonly<Partial<Record<ProductId, string>>> | null;
/** The same answer as numbers (the store's own, in its currency): only for comparing packs, never shown. `null` while asking. */
export type Amounts = Readonly<Partial<Record<ProductId, number>>> | null;

/** What a diamond pack's diamonds buy: whole looks at the vanity shop's price. */
export const looksFor = (diamonds: number, left: number = Infinity): number => Math.min(Math.floor(diamonds / VANITY_PRICE), left);

/** G121: the looks for sale the player does not own yet (the plaque is earned, not sold; any storefront skin owns the skin item, as the Style tab counts it). */
export const looksUnowned = (cosmetics: readonly string[]): number =>
  VANITY_IDS.filter((id) => id !== 'plaque-master' && !(id === 'storefront-skin' ? cosmetics.some(isSkin) : cosmetics.includes(id))).length;

export interface ProductInfo {
  title: string;
  /** What it gives, in one line ("" when there is nothing more to say). */
  blurb: string;
}

/** "Enough for 3 looks", or '' when the diamonds buy none (or none are left to buy). */
const looksLine = (diamonds: number, left?: number): string => (looksFor(diamonds, left) >= 1 ? t('store.looks', { n: looksFor(diamonds, left) }) : '');
const starterGrant = GRANTS.starter_pack;

export const PRODUCTS: Readonly<Record<ProductId, ProductInfo>> = {
  starter_pack: {
    title: t('store.starter.title'),
    blurb: t('store.starter.blurb', { n: starterGrant.diamonds, mult: starterGrant.boost?.mult ?? 1, hours: starterGrant.boost?.hours ?? 0 }),
  },
  nonnas_plus: { title: t('store.plus.title'), blurb: 'Every ad reward at one tap, no ad. Offline earnings 2×, built in.' },
  diamonds_80: { title: t('store.pack.diamonds_80.title'), blurb: '' },
  diamonds_500: { title: t('store.pack.diamonds_500.title'), blurb: '' },
  diamonds_1200: { title: t('store.pack.diamonds_1200.title'), blurb: '' },
};

/** The order the tab lists them in. */
export const PRODUCT_ORDER: readonly ProductId[] = ['starter_pack', 'nonnas_plus', 'diamonds_80', 'diamonds_500', 'diamonds_1200'];

/** What a pack holds, shown as a small card (D496): the numbers come from the grant itself, so the art can't drift from what is paid. */
export interface Chip {
  kind: 'diamonds' | 'boost' | 'awning';
  title: string;
  sub: string;
}

/**
 * The content chips of a bundle: one per thing it gives. A plain diamond pack or Plus has none (its card says it).
 * `income` is the player's cash per second (the rewards' income): the boost chip says what the boost earns at that pace, "about".
 */
export function productChips(id: ProductId, income = 0, looksLeft: number = Infinity): Chip[] {
  const g = GRANTS[id];
  if (!g.boost && !g.cosmetic) return [];
  const out: Chip[] = [];
  if (g.diamonds > 0)
    out.push({
      kind: 'diamonds',
      title: String(g.diamonds),
      sub: looksFor(g.diamonds, looksLeft) >= 1 ? t('store.chip.diamonds', { n: looksFor(g.diamonds, looksLeft) }) : 'diamonds',
    });
  if (g.boost) {
    const cash = income * g.boost.hours * 3600;
    out.push({
      kind: 'boost',
      title: `${g.boost.mult}× · ${g.boost.hours} h`,
      sub:
        cash > 0
          ? t('store.chip.boost', { cash: money(cash) })
          : t('store.chip.boost.plain', { span: g.boost.hours === 24 ? 'a full day' : `${g.boost.hours} hours` }),
    });
  }
  if (g.cosmetic) out.push({ kind: 'awning', title: 'Founder awning', sub: t('store.chip.awning') });
  return out;
}

/** The ribbon on the Starter card: one per owner (it leaves the tab once bought). */
export const PRODUCT_RIBBON: Readonly<Partial<Record<ProductId, string>>> = { starter_pack: t('store.starter.ribbon') };

/** C186: remembers which cards were counted as seen, so `pack_card_seen` is sent once per Shop opening, not each time the Store tab is switched to. */
export function createSeenOnce() {
  const seen = new Set<string>();
  return {
    /** True the first time `id` is asked since the last reset. */
    first(id: string): boolean {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    },
    reset: (): void => seen.clear(),
  };
}

// ---------- the best rate ----------

const CONSUMABLES = PRODUCT_ORDER.filter(isConsumable);
/** What the player gets today for a product: a pack's first buy pays double (until it is used), so the claim is about that amount, not the list one. */
const diamondsToday = (id: ProductId, firstUsed: readonly ProductId[]): number => GRANTS[id].diamonds * (isConsumable(id) && !firstUsed.includes(id) ? 2 : 1);
/** Diamonds per unit of the store's price for what the player gets today, or null when this product has no usable price. */
const rateOf = (id: ProductId, amounts: NonNullable<Amounts>, firstUsed: readonly ProductId[]): number | null => {
  const a = amounts[id];
  return typeof a === 'number' && a > 0 ? diamondsToday(id, firstUsed) / a : null;
};

/**
 * "Best rate" (PRICING §3): the diamond pack with the most diamonds per unit price, from the store's numbers, for what the player would get today:
 * a pack whose first buy is unused counts its doubled diamonds (G120, S99), so the claim is never false at the till. Null while the prices load, or
 * when any pack has no price (a rate over part of the list could name the wrong one). `firstUsed` is the packs whose first buy is used.
 */
export function bestRate(amounts: Amounts, firstUsed: readonly ProductId[] = []): ProductId | null {
  if (!amounts) return null;
  let best: ProductId | null = null;
  let top = 0;
  for (const id of CONSUMABLES) {
    const r = rateOf(id, amounts, firstUsed);
    if (r === null) return null;
    if (r > top) {
      top = r;
      best = id;
    }
  }
  return best;
}

/** The Starter card's "Most diamonds per dollar in the store": shown only when it is true today, the packs' first-buy 2× included (so only once those are used). */
export function starterBestRate(amounts: Amounts, firstUsed: readonly ProductId[] = []): boolean {
  if (!amounts || bestRate(amounts, firstUsed) === null) return false;
  const own = rateOf('starter_pack', amounts, firstUsed);
  return own !== null && CONSUMABLES.every((id) => own > (rateOf(id, amounts, firstUsed) as number));
}

export type RowState = 'owned' | 'buy' | 'loading' | 'unpriced';

/** What the cards need beyond the prices; every part has a quiet default (nothing known yet). */
export interface RowContext {
  amounts: Amounts;
  /** Packs whose first buy (paid double) has been used. */
  firstUsed: readonly ProductId[];
  /** Rewarded ads taken in the last 7 days. */
  adCount: number;
  /** Cash per second at the player's pace (the rewards' income). */
  income: number;
  /** Looks for sale the player does not own (G121): the most "Enough for N looks" may say. Infinity when unknown. */
  looksLeft: number;
}
export const NO_CONTEXT: RowContext = { amounts: null, firstUsed: [], adCount: 0, income: 0, looksLeft: Infinity };

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
  /** Small tags in one row under the title: the Starter's ribbon, "Best rate", "First buy: 2×". */
  tags: string[];
  /** What the first buy doubles, in diamonds: "First buy pays double: 160 diamonds" (null once used, and for the rest). */
  firstLine: string | null;
  /** Nonna's line on the Starter card. */
  nonna: string | null;
  /** A diamond pack's base diamonds and its "+N bonus" line. */
  base: number | null;
  bonus: string | null;
  chips: Chip[];
  /** The Starter's "Most diamonds per dollar in the store", when true. */
  rate: string | null;
  /** Plus: the 7-day ad line (when there is something to count) and "Pay once". */
  adLine: string | null;
  once: string | null;
}

/** Whether a purchase is a one-time product (it is hidden or "Owned" once bought) rather than a pack that can be bought again. */
const ONCE: ReadonlySet<ProductId> = new Set<ProductId>(['starter_pack', 'nonnas_plus']);

/**
 * The tab's rows. A price comes only from the store: while it loads the button says "Loading…" and after a failed answer "Price unavailable",
 * disabled both times. The Starter Pack leaves the tab once bought; Nonna's Plus stays, as "Owned".
 */
export function productRows(prices: Prices, owned: readonly ProductId[], ctx: RowContext = NO_CONTEXT): ProductRow[] {
  const rows: ProductRow[] = [];
  const best = bestRate(ctx.amounts, ctx.firstUsed);
  for (const id of PRODUCT_ORDER) {
    const has = ONCE.has(id) && owned.includes(id);
    if (has && id === 'starter_pack') continue;
    const price = prices?.[id] ?? null;
    const state: RowState = has ? 'owned' : price ? 'buy' : prices === null ? 'loading' : 'unpriced';
    const split = PACK_SPLIT[id];
    const tags: string[] = [];
    if (id === 'starter_pack') tags.push(PRODUCT_RIBBON.starter_pack as string);
    if (isConsumable(id) && best === id) tags.push(t('store.best'));
    const firstLive = isConsumable(id) && !ctx.firstUsed.includes(id);
    if (firstLive) tags.push(t('store.firstbuy'));
    rows.push({
      id,
      ...PRODUCTS[id],
      blurb: isConsumable(id) ? looksLine(GRANTS[id].diamonds, ctx.looksLeft) : PRODUCTS[id].blurb,
      price,
      state,
      label: state === 'owned' ? 'Owned' : state === 'buy' ? (price as string) : state === 'loading' ? 'Loading…' : 'Price unavailable',
      enabled: state === 'buy',
      tags: state === 'owned' ? [] : tags,
      firstLine: firstLive ? t('store.firstbuy.pays', { n: (GRANTS[id].diamonds * 2).toLocaleString('en-US') }) : null,
      nonna: id === 'starter_pack' ? t('store.starter.nonna') : null,
      base: split ? split.base : null,
      bonus: split && split.bonus > 0 ? t('store.bonus', { n: split.bonus }) : null,
      chips: productChips(id, ctx.income, ctx.looksLeft),
      rate: id === 'starter_pack' && starterBestRate(ctx.amounts, ctx.firstUsed) ? t('store.starter.rate') : null,
      adLine: id === 'nonnas_plus' && ctx.adCount >= 2 ? t('store.plus.ads', { n: ctx.adCount }) : null,
      once: id === 'nonnas_plus' ? t('store.plus.once') : null,
    });
  }
  return rows;
}

/** The prices as a map from the store's list. */
export function pricesFrom(list: readonly { id: ProductId; price: string }[]): Prices {
  const out: Partial<Record<ProductId, string>> = {};
  for (const p of list) if ((PRODUCT_IDS as readonly string[]).includes(p.id) && p.price) out[p.id] = p.price;
  return out;
}

/** The store's numeric prices as a map (a missing or non-positive amount is dropped). */
export function amountsFrom(list: readonly { id: ProductId; amount: number }[]): Amounts {
  const out: Partial<Record<ProductId, number>> = {};
  for (const p of list) if ((PRODUCT_IDS as readonly string[]).includes(p.id) && Number.isFinite(p.amount) && p.amount > 0) out[p.id] = p.amount;
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

// ---------- prefs ----------

/** Saved on their own (not in the game save), so Start over doesn't offer a bought pack again. */
export interface StorePrefs {
  starterOffered: boolean;
  /** The local day the shelf's free booster was last taken ('' = never). */
  boosterAdDay: string;
  /** Ms stamps of the rewarded ads that paid, the last 7 days of them (Plus's card counts them). */
  adGrants: number[];
}
export const PREFS_KEY = 'slice-empire/store/v1';
/** X1: the test build's prefs key (src/store/game-store.ts picks it when EXPO_PUBLIC_TEST_MODE is on). */
export const TEST_PREFS_KEY = 'slice-empire/store/test-v1';
/** The key the prefs are saved under in this build (game-store.ts picks the same). */
export const activePrefsKey = (): string => (process.env.EXPO_PUBLIC_TEST_MODE === '1' ? TEST_PREFS_KEY : PREFS_KEY);
export const NO_PREFS: StorePrefs = { starterOffered: false, boosterAdDay: '', adGrants: [] };

export function parsePrefs(raw: string | null): StorePrefs {
  try {
    const v = JSON.parse(raw ?? '') as Partial<StorePrefs>;
    return {
      starterOffered: v.starterOffered === true,
      boosterAdDay: typeof v.boosterAdDay === 'string' ? v.boosterAdDay : '',
      adGrants: Array.isArray(v.adGrants) ? v.adGrants.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)) : [],
    };
  } catch {
    return NO_PREFS;
  }
}

// ---------- the 7-day ad count ----------

export const AD_WINDOW_MS = 7 * 24 * 3600 * 1000;
/** The most stamps kept: a window can't hold more than this many ads a person watches. */
const AD_KEEP = 200;

/** Rewarded ads that paid in the 7 days up to `now` (a stamp from the future, a clock set back, counts as now). */
export const adCount7 = (stamps: readonly number[], now: number): number => stamps.filter((t0) => now - t0 < AD_WINDOW_MS).length;

/** The prefs with one more rewarded-ad grant at `now`; stamps older than the window are dropped. */
export const withAdGrant = (prefs: StorePrefs, now: number): StorePrefs => ({
  ...prefs,
  adGrants: [...prefs.adGrants.filter((t0) => now - t0 < AD_WINDOW_MS), now].slice(-AD_KEEP),
});
