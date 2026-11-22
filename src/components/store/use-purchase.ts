// One purchase at a time, shared by the store tab and the Starter Pack sheet: buy, say how it went. The services index counts iap_purchased.
import { useCallback, useEffect, useState } from 'react';

import { purchases, type ProductId } from '../../services';
import { createBuyGuard, guardedBuy } from './buy-guard';
import { buyLine } from './store-model';

export interface PurchaseState {
  /** The product being bought now, or null. */
  busy: ProductId | null;
  /** The line under the cards after the last try ("" when none or cancelled). */
  line: string;
  /** What the account owns, read again after every purchase. */
  owned: ProductId[];
  /** The diamond packs whose first buy (paid double) has been used, read again after every purchase. */
  firstUsed: ProductId[];
  buy: (id: ProductId) => void;
}

export function usePurchase(): PurchaseState {
  const [busy, setBusy] = useState<ProductId | null>(null);
  const [line, setLine] = useState('');
  const [owned, setOwned] = useState<ProductId[]>(() => purchases.owned());
  const [firstUsed, setFirstUsed] = useState<ProductId[]>(() => purchases.firstBuysUsed());
  const [guard] = useState(createBuyGuard);
  // the saved ledger is read a moment after start-up: until then nothing looks bought, so ask again when it is in (T135)
  useEffect(() => {
    let live = true;
    void purchases
      .loaded()
      .then(() => {
        if (!live) return;
        setOwned(purchases.owned());
        setFirstUsed(purchases.firstBuysUsed());
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const buy = useCallback(
    (id: ProductId) => {
      // purchases.buy is called here, outside any state updater (an updater may run twice), and only when the guard lets it
      if (guard.busy()) return;
      setBusy(id);
      setLine('');
      void guardedBuy(guard, (p) => purchases.buy(p), id).then((r) => {
        if (r === null) return;
        setOwned(purchases.owned());
        setFirstUsed(purchases.firstBuysUsed());
        setLine(buyLine(r));
        setBusy(null);
      });
    },
    [guard],
  );
  return { busy, line, owned, firstUsed, buy };
}
