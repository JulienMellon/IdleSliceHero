// Purchases over a backend port (RevenueCat on iOS, a flag-driven fake on the web): the ledger makes every grant pay once.
import type { GrantBus } from './grant-bus';
import { emptyLedger, firstBuysUsed, ownedFrom, parseLedger, redeem, type Ledger } from './grants';
import type { BuyResult, KV, ProductId, Purchases } from './types';

/**
 * C158: the test build keeps its own ledger, so a test reset never touches a real one. The test key is only a string: it is in every bundle (the dev reset
 * imports it, src/dev/story-save.ts), and only the literal env check decides which key a build reads and writes (C184).
 */
export const TEST_LEDGER_KEY = 'se.purchases.ledger.test';
export const LEDGER_KEY = process.env.EXPO_PUBLIC_TEST_MODE === '1' ? TEST_LEDGER_KEY : 'se.purchases.ledger';

export type PurchaseOutcome = { status: 'purchased'; transactionId: string } | { status: 'cancelled' | 'failed' };

export interface PurchaseBackend {
  products(ids: readonly ProductId[]): Promise<{ id: ProductId; price: string; amount: number }[]>;
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

  // C189: an unreadable store is an empty ledger, so `loaded` always resolves (a card waiting on it never hangs on a rejection)
  const load = () =>
    (loaded ??= kv.get(LEDGER_KEY).then(
      (raw) => void (ledger = parseLedger(raw)),
      () => void (ledger = emptyLedger()),
    ));

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
    firstBuysUsed: () => firstBuysUsed(ledger),
    loaded: load,
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
