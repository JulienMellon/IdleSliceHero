// Web, tests and the screenshot run: a fake store. `?owned=nonnas_plus,starter_pack` owns products from the start;
// `?buy=purchased|cancelled|failed` is the answer to buy (default cancelled).
import { grantBus } from './runtime';
import { createPurchases, type PurchaseBackend } from './purchases-core';
import { queryFlag } from './query';
import { store } from './store';
import { PRODUCT_IDS, type ProductId, type Purchases } from './types';

const PRICES: Record<ProductId, string> = { starter_pack: '$2.99', nonnas_plus: '$4.99', diamonds_80: '$0.99', diamonds_500: '$4.99', diamonds_1200: '$9.99' };

const flagOwned = (): ProductId[] =>
  queryFlag('owned')
    .split(',')
    .filter((s): s is ProductId => (PRODUCT_IDS as readonly string[]).includes(s));

let n = 0;
const backend: PurchaseBackend = {
  products: async (ids) => ids.map((id) => ({ id, price: PRICES[id] })),
  purchase: async () => {
    const v = queryFlag('buy');
    return v === 'purchased' ? { status: 'purchased', transactionId: `web-${Date.now()}-${n++}` } : { status: v === 'failed' ? 'failed' : 'cancelled' };
  },
  restore: async () => flagOwned(),
  entitled: async () => flagOwned(),
};

const core = createPurchases({ kv: store, backend, bus: grantBus, ids: PRODUCT_IDS });

export const purchases: Purchases = {
  products: core.products,
  buy: core.buy,
  restore: core.restore,
  owned: () => [...new Set([...flagOwned(), ...core.owned()])],
};
export const startPurchases = core.start;
