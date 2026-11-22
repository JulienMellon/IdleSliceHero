// iOS: RevenueCat over StoreKit. The ledger and the one-payout rule are purchases-core.ts and grants.ts.
import Purchases from 'react-native-purchases';

import { grantBus } from './runtime';
import { createPurchases, type PurchaseBackend } from './purchases-core';
import { isConsumable } from './grants';
import { store } from './store';
import { PRODUCT_IDS, type ProductId, type Purchases as PurchasesApi } from './types';

/** From the environment; empty means purchases are off (every call answers empty or failed). */
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

const isProduct = (s: string): s is ProductId => (PRODUCT_IDS as readonly string[]).includes(s);
let configured = false;
const configure = (): boolean => {
  if (!API_KEY) return false;
  if (!configured) {
    Purchases.configure({ apiKey: API_KEY });
    configured = true;
  }
  return true;
};

const ownedNonConsumables = async (): Promise<ProductId[]> => {
  if (!configure()) return [];
  const info = await Purchases.getCustomerInfo();
  return info.allPurchasedProductIdentifiers.filter(isProduct).filter((id) => !isConsumable(id));
};

const backend: PurchaseBackend = {
  async products(ids) {
    if (!configure()) return [];
    const list = await Purchases.getProducts([...ids], Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
    return list.filter((p) => isProduct(p.identifier)).map((p) => ({ id: p.identifier as ProductId, price: p.priceString, amount: p.price }));
  },
  async purchase(id) {
    if (!configure()) return { status: 'failed' };
    try {
      const [product] = await Purchases.getProducts([id], Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
      if (!product) return { status: 'failed' };
      const r = await Purchases.purchaseStoreProduct(product);
      return { status: 'purchased', transactionId: r.transaction.transactionIdentifier };
    } catch (e) {
      const err = e as { code?: unknown; userCancelled?: boolean | null };
      const cancelled = err.userCancelled === true || err.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
      return { status: cancelled ? 'cancelled' : 'failed' };
    }
  },
  async restore() {
    if (!configure()) return [];
    const info = await Purchases.restorePurchases();
    return info.allPurchasedProductIdentifiers.filter(isProduct).filter((id) => !isConsumable(id));
  },
  entitled: ownedNonConsumables,
};

const core = createPurchases({ kv: store, backend, bus: grantBus, ids: PRODUCT_IDS });

export const purchases: PurchasesApi = {
  products: core.products,
  buy: core.buy,
  restore: core.restore,
  owned: core.owned,
  firstBuysUsed: core.firstBuysUsed,
  loaded: core.loaded,
};
export const startPurchases = core.start;
