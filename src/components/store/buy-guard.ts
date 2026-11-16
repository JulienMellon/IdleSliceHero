// One purchase at a time (C130): the guard is a plain flag outside React state, so a second tap in the same frame can't start a second buy.
import type { BuyResult, ProductId } from '../../services/types';

export interface BuyGuard {
  /** True the first time; false while a buy is still running. */
  enter(): boolean;
  leave(): void;
  /** A buy is running. */
  busy(): boolean;
}

export function createBuyGuard(): BuyGuard {
  let on = false;
  return {
    enter() {
      if (on) return false;
      on = true;
      return true;
    },
    leave() {
      on = false;
    },
    busy: () => on,
  };
}

/**
 * Run one buy under the guard: `null` when another is running (nothing is started); otherwise the store's answer, `failed` if it threw.
 * The services index counts `iap_purchased` itself (C128), so nothing is tracked here.
 */
export async function guardedBuy(guard: BuyGuard, buy: (id: ProductId) => Promise<BuyResult>, id: ProductId): Promise<BuyResult | null> {
  if (!guard.enter()) return null;
  try {
    return await buy(id);
  } catch {
    return 'failed';
  } finally {
    guard.leave();
  }
}
