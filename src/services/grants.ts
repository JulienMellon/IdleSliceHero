// What each product gives, and the rule that a purchase pays once. Pure: the game applies a Grant, this decides when there is one.
import type { ProductId } from './types';

export interface Grant {
  diamonds: number;
  /** A running boost, started when the grant lands. */
  boost?: { mult: number; hours: number };
  /** A cosmetic id (src/content/rewards.ts COSMETIC_NAMES). */
  cosmetic?: string;
  /** The Nonna's Plus entitlement. */
  plus?: boolean;
  /** This grant is a pack's first buy, paid double (the diamonds above already are). */
  firstBuy?: true;
}

export const FOUNDER_COSMETIC = 'awning-founder';

/** Starter pack ($2.99): 400 diamonds, a 24 h 2x boost and the founder awning (VERSION.md). */
export const GRANTS: Readonly<Record<ProductId, Grant>> = {
  starter_pack: { diamonds: 400, boost: { mult: 2, hours: 24 }, cosmetic: FOUNDER_COSMETIC },
  nonnas_plus: { diamonds: 0, plus: true },
  diamonds_80: { diamonds: 80 },
  diamonds_500: { diamonds: 500 },
  diamonds_1200: { diamonds: 1200 },
  diamonds_2600: { diamonds: 2600 },
};

/** Bought again and again: each purchase pays, keyed by its transaction. The rest are bought once. */
export const CONSUMABLE: ReadonlySet<ProductId> = new Set<ProductId>(['diamonds_80', 'diamonds_500', 'diamonds_1200', 'diamonds_2600']);

/** What a diamond pack's total is made of, for the card: the base and the bonus on top (PRICING-STRATEGY §3). `base + bonus` is the grant's diamonds. */
export const PACK_SPLIT: Readonly<Partial<Record<ProductId, { base: number; bonus: number }>>> = {
  diamonds_80: { base: 80, bonus: 0 },
  diamonds_500: { base: 400, bonus: 100 },
  diamonds_1200: { base: 800, bonus: 400 },
  diamonds_2600: { base: 1600, bonus: 1000 },
};

export const isConsumable = (id: ProductId): boolean => CONSUMABLE.has(id);

/** What the ledger holds: transaction ids of consumables (`tx:`), non-consumables paid out (`product:`) and the first paid-out buy of each pack (`first:`). */
export interface Ledger {
  keys: string[];
}
export const emptyLedger = (): Ledger => ({ keys: [] });

export function parseLedger(raw: string | null): Ledger {
  try {
    const v = JSON.parse(raw ?? '') as { keys?: unknown };
    return { keys: Array.isArray(v.keys) ? v.keys.filter((k): k is string => typeof k === 'string') : [] };
  } catch {
    return emptyLedger();
  }
}

/** The ledger key that says a pack's first buy has been paid out. */
export const firstKey = (id: ProductId): string => `first:${id}`;

/** The ledger key of a purchase: a consumable by its transaction, a non-consumable by its product (a restore carries a new transaction id). */
export function grantKey(id: ProductId, transactionId: string): string | null {
  if (!isConsumable(id)) return `product:${id}`;
  return transactionId ? `tx:${transactionId}` : null;
}

/** The part of a one-time grant that is a standing entitlement: all a restore gives back (diamonds and a boost are spent, not owned). */
export function restoredPart(g: Grant): Grant {
  const out: Grant = { diamonds: 0 };
  if (g.cosmetic) out.cosmetic = g.cosmetic;
  if (g.plus) out.plus = true;
  return out;
}

export interface Redeemed {
  ledger: Ledger;
  /** What to pay now, or null when this purchase has been paid before (or has no usable id). */
  grant: Grant | null;
}

/** Pay a purchase once. `via: 'restore'` pays only the standing entitlements of a non-consumable. */
export function redeem(ledger: Ledger, id: ProductId, transactionId: string, via: 'buy' | 'restore' = 'buy'): Redeemed {
  const key = grantKey(id, transactionId);
  if (key === null || ledger.keys.includes(key)) return { ledger, grant: null };
  const full = GRANTS[id];
  let grant: Grant = { ...(via === 'restore' && !isConsumable(id) ? restoredPart(full) : full) };
  const keys = [...ledger.keys, key];
  // the first paid-out purchase of a pack is recorded whichever way it came, but only a buy pays it double: a restore never does
  if (isConsumable(id) && !ledger.keys.includes(firstKey(id))) {
    keys.push(firstKey(id));
    if (via === 'buy') grant = { ...grant, diamonds: grant.diamonds * 2, firstBuy: true };
  }
  return { ledger: { keys }, grant };
}

/** The packs whose first buy has been paid out (the card stops saying "First buy: 2×"). */
export const firstBuysUsed = (ledger: Ledger): ProductId[] =>
  (Object.keys(GRANTS) as ProductId[]).filter((id) => isConsumable(id) && ledger.keys.includes(firstKey(id)));

/** Non-consumables the ledger has paid out: what the player owns. */
export function ownedFrom(ledger: Ledger): ProductId[] {
  return (Object.keys(GRANTS) as ProductId[]).filter((id) => !isConsumable(id) && ledger.keys.includes(`product:${id}`));
}
