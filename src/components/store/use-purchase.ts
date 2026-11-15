// One purchase at a time, shared by the store tab and the Starter Pack sheet: buy, count it, say how it went.
import { useCallback, useState } from 'react';

import { analytics, EVENTS, purchases, type ProductId } from '../../services';
import { buyLine } from './store-model';

export interface PurchaseState {
  /** The product being bought now, or null. */
  busy: ProductId | null;
  /** The line under the cards after the last try ("" when none or cancelled). */
  line: string;
  /** What the account owns, read again after every purchase. */
  owned: ProductId[];
  buy: (id: ProductId) => void;
}

export function usePurchase(): PurchaseState {
  const [busy, setBusy] = useState<ProductId | null>(null);
  const [line, setLine] = useState('');
  const [owned, setOwned] = useState<ProductId[]>(() => purchases.owned());
  const buy = useCallback((id: ProductId) => {
    setBusy((b) => {
      if (b) return b;
      setLine('');
      void purchases.buy(id).then((r) => {
        if (r === 'purchased') analytics.track(EVENTS.iapPurchased, { product: id });
        setOwned(purchases.owned());
        setLine(buyLine(r));
        setBusy(null);
      });
      return id;
    });
  }, []);
  return { busy, line, owned, buy };
}
