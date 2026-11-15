// Purchases over a backend port (RevenueCat on iOS, a flag-driven fake on the web): the ledger makes every grant pay once.
import type { GrantBus } from './grant-bus';
import { emptyLedger, ownedFrom, parseLedger, redeem, type Ledger } from './grants';
import type { BuyResult, KV, ProductId, Purchases } from './types';

export const LEDGER_KEY = 'se.purchases.ledger';

export type PurchaseOutcome = { status: 'purchased'; transactionId: string } | { status: 'cancelled' | 'failed' };

export interface PurchaseBackend {
  products(ids: readonly ProductId[]): Promise<{ id: ProductId; price: string }[]>;
  purchase(id: ProductId): Promise<PurchaseOutcome>;
  /** Ask the store which non-consumables this account owns (a restore). */
  restore(): Promise<ProductId[]>;
  /** The same, quietly, at start-up (no store prompt). */
  entitled(): Promise<ProductId[]>;
}

export function createPurchases(deps: { kv: KV; backend: PurchaseBackend; bus: GrantBus; ids: readonly ProductId[] }): Purchases & { start(): Promise<void> } {
  const { kv, backend, bus, ids } = deps;
  let ledger: Ledger = emptyLedger();
  let loaded: Promise<void> | null = null;
  // one at a time, so two replays of one transaction can't both pass the ledger check
  let chain: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = chain.then(fn);
    chain = run.catch(() => {});
    return run;
  };

  const load = () => (loaded ??= kv.get(LEDGER_KEY).then((raw) => void (ledger = parseLedger(raw))));

  /** Ledger first, grant second: a crash between them loses a grant, never doubles one. */
  const pay = async (id: ProductId, tx: string, via: 'buy' | 'restore') => {
    const r = redeem(ledger, id, tx, via);
    if (!r.grant) return;
    ledger = r.ledger;
    await kv.set(LEDGER_KEY, JSON.stringify(ledger));
    bus.emit(r.grant);
  };

  const sync = async (list: ProductId[]) => {
    for (const id of list) await pay(id, '', 'restore');
  };

  return {
    start: () =>
      load().then(() =>
        serial(async () => {
          try {
            await sync(await backend.entitled());
          } catch {
            /* offline: the cached ledger is the answer */
          }
        }),
      ),
    products: () => backend.products(ids).catch(() => []),
    owned: () => ownedFrom(ledger),
    buy(id): Promise<BuyResult> {
      return serial(async () => {
        await load();
        let out: PurchaseOutcome;
        try {
          out = await backend.purchase(id);
        } catch {
          return 'failed';
        }
        if (out.status !== 'purchased') return out.status;
        await pay(id, out.transactionId, 'buy');
        return 'purchased';
      });
    },
    restore(): Promise<ProductId[]> {
      return serial(async () => {
        await load();
        try {
          await sync(await backend.restore());
        } catch {
          /* keep what is cached */
        }
        return ownedFrom(ledger);
      });
    },
  };
}
