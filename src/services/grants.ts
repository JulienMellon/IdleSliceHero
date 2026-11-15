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
}

export const FOUNDER_COSMETIC = 'awning-founder';

/** Starter pack ($2.99): 150 diamonds, a 24 h 2x boost and the founder awning (VERSION.md). */
export const GRANTS: Readonly<Record<ProductId, Grant>> = {
  starter_pack: { diamonds: 150, boost: { mult: 2, hours: 24 }, cosmetic: FOUNDER_COSMETIC },
  nonnas_plus: { diamonds: 0, plus: true },
  diamonds_80: { diamonds: 80 },
  diamonds_500: { diamonds: 500 },
  diamonds_1200: { diamonds: 1200 },
};

/** Bought again and again: each purchase pays, keyed by its transaction. The rest are bought once. */
export const CONSUMABLE: ReadonlySet<ProductId> = new Set<ProductId>(['diamonds_80', 'diamonds_500', 'diamonds_1200']);
export const isConsumable = (id: ProductId): boolean => CONSUMABLE.has(id);

/** Transaction ids of consumables and ids of non-consumables that have been paid out. */
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
  const grant = via === 'restore' && !isConsumable(id) ? restoredPart(full) : full;
  return { ledger: { keys: [...ledger.keys, key] }, grant: { ...grant } };
}

/** Non-consumables the ledger has paid out: what the player owns. */
export function ownedFrom(ledger: Ledger): ProductId[] {
  return (Object.keys(GRANTS) as ProductId[]).filter((id) => !isConsumable(id) && ledger.keys.includes(`product:${id}`));
}
