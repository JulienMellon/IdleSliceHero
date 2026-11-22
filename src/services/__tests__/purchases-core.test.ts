import { createGrantBus } from '../grant-bus';
import { memoryKV } from '../kv';
import { LEDGER_KEY, TEST_LEDGER_KEY, createPurchases, type PurchaseBackend, type PurchaseOutcome } from '../purchases-core';
import { PRODUCT_IDS, type ProductId } from '../types';

function setup(opts: { outcome?: () => PurchaseOutcome; entitled?: ProductId[]; throwOnRestore?: boolean } = {}) {
  const kv = memoryKV();
  const bus = createGrantBus();
  const got: { diamonds: number; plus?: boolean; cosmetic?: string }[] = [];
  bus.subscribe((g) => got.push(g));
  const backend: PurchaseBackend = {
    products: async (ids) => ids.map((id) => ({ id, price: '$1', amount: 1 })),
    purchase: async () => (opts.outcome ?? (() => ({ status: 'purchased', transactionId: 'tx1' }) as PurchaseOutcome))(),
    restore: async () => {
      if (opts.throwOnRestore) throw new Error('offline');
      return opts.entitled ?? [];
    },
    entitled: async () => opts.entitled ?? [],
  };
  const p = createPurchases({ kv, backend, bus, ids: PRODUCT_IDS });
  return { kv, p, got };
}

describe('purchases core', () => {
  it('a purchase pays once and a replay of the same transaction pays nothing', async () => {
    const { p, got } = setup();
    expect(await p.buy('diamonds_80')).toBe('purchased');
    expect(await p.buy('diamonds_80')).toBe('purchased'); // the store hands back tx1 again
    expect(got.map((g) => g.diamonds)).toEqual([160]); // the first buy of a pack pays double
  });

  it('the first buy doubles, the second does not, and the card learns the first is used', async () => {
    let n = 0;
    const { p, got } = setup({ outcome: () => ({ status: 'purchased', transactionId: `t${n++}` }) });
    expect(p.firstBuysUsed()).toEqual([]);
    await p.buy('diamonds_500');
    await p.buy('diamonds_500');
    expect(got.map((g) => g.diamonds)).toEqual([1000, 500]);
    expect(p.firstBuysUsed()).toEqual(['diamonds_500']);
  });

  it('a restore never pays a pack double, and the first buy survives a restart', async () => {
    let n = 0;
    const { p, kv } = setup({ entitled: ['nonnas_plus'], outcome: () => ({ status: 'purchased', transactionId: `t${n++}` }) });
    await p.buy('diamonds_80');
    await p.restore();
    const again = createPurchases({
      kv,
      bus: createGrantBus(),
      ids: PRODUCT_IDS,
      backend: { products: async () => [], purchase: async () => ({ status: 'failed' }), restore: async () => [], entitled: async () => [] },
    });
    await again.start();
    expect(again.firstBuysUsed()).toEqual(['diamonds_80']);
  });

  it('the test build keeps its own ledger key, and a normal build its own (C158, T116, C184)', () => {
    expect(LEDGER_KEY).toBe('se.purchases.ledger');
    expect(TEST_LEDGER_KEY).toBe('se.purchases.ledger.test');
    const before = process.env.EXPO_PUBLIC_TEST_MODE;
    process.env.EXPO_PUBLIC_TEST_MODE = '1';
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        expect((require('../purchases-core') as { LEDGER_KEY: string }).LEDGER_KEY).toBe(TEST_LEDGER_KEY);
      });
    } finally {
      if (before === undefined) delete process.env.EXPO_PUBLIC_TEST_MODE;
      else process.env.EXPO_PUBLIC_TEST_MODE = before;
    }
  });

  it('an unreadable store is an empty ledger: loaded() still resolves (C189)', async () => {
    const kv = { get: async () => Promise.reject(new Error('disk')), set: async () => {} };
    const backend: PurchaseBackend = {
      products: async () => [],
      purchase: async () => ({ status: 'failed' }),
      restore: async () => [],
      entitled: async () => [],
    };
    const p = createPurchases({ kv, bus: createGrantBus(), ids: PRODUCT_IDS, backend });
    await expect(p.loaded()).resolves.toBeUndefined();
    expect(p.firstBuysUsed()).toEqual([]);
  });

  it('until the saved ledger is read nothing looks bought; loaded() says when it is (T135)', async () => {
    const kv = memoryKV({ [LEDGER_KEY]: JSON.stringify({ keys: ['first:diamonds_500', 'tx:a', 'product:nonnas_plus'] }) });
    const backend: PurchaseBackend = {
      products: async () => [],
      purchase: async () => ({ status: 'failed' }),
      restore: async () => [],
      entitled: async () => [],
    };
    const p = createPurchases({ kv, bus: createGrantBus(), ids: PRODUCT_IDS, backend });
    expect(p.firstBuysUsed()).toEqual([]);
    expect(p.owned()).toEqual([]);
    await p.loaded();
    expect(p.firstBuysUsed()).toEqual(['diamonds_500']);
    expect(p.owned()).toEqual(['nonnas_plus']);
  });

  it('two buys at the same moment still pay once', async () => {
    const { p, got } = setup();
    await Promise.all([p.buy('diamonds_500'), p.buy('diamonds_500')]);
    expect(got).toHaveLength(1);
  });

  it('cancelled and failed pay nothing', async () => {
    for (const status of ['cancelled', 'failed'] as const) {
      const { p, got } = setup({ outcome: () => ({ status }) });
      expect(await p.buy('diamonds_80')).toBe(status);
      expect(got).toEqual([]);
    }
  });

  it('a backend that throws is a failed buy', async () => {
    const { p } = setup({
      outcome: () => {
        throw new Error('boom');
      },
    });
    expect(await p.buy('diamonds_80')).toBe('failed');
  });

  it('owned() is kept on the device and read back by a new session without the store', async () => {
    const a = setup();
    await a.p.buy('nonnas_plus');
    expect(a.p.owned()).toEqual(['nonnas_plus']);
    const bus = createGrantBus();
    const again = createPurchases({
      kv: a.kv,
      bus,
      ids: PRODUCT_IDS,
      backend: {
        products: async () => [],
        purchase: async () => ({ status: 'failed' }),
        restore: async () => {
          throw new Error('offline');
        },
        entitled: async () => {
          throw new Error('offline');
        },
      },
    });
    await again.start();
    expect(again.owned()).toEqual(['nonnas_plus']);
    expect(bus.waiting()).toBe(0);
  });

  it('restore pays the standing entitlements once, even called twice', async () => {
    const { p, got } = setup({ entitled: ['starter_pack', 'nonnas_plus'] });
    expect(await p.restore()).toEqual(['starter_pack', 'nonnas_plus']);
    await p.restore();
    expect(got).toEqual([
      { diamonds: 0, cosmetic: 'awning-founder' },
      { diamonds: 0, plus: true },
    ]);
  });

  it('a restore that fails offline keeps what is cached', async () => {
    const { p } = setup({ throwOnRestore: true });
    await p.buy('starter_pack');
    expect(await p.restore()).toEqual(['starter_pack']);
  });

  it('buying a non-consumable, then restoring it, pays diamonds only at the purchase', async () => {
    const { p, got } = setup({ entitled: ['starter_pack'] });
    await p.buy('starter_pack');
    await p.restore();
    expect(got).toHaveLength(1);
    expect(got[0].diamonds).toBe(400);
  });

  it('writes the ledger before it announces the grant', async () => {
    const { p, kv } = setup();
    let seen = '';
    const bus = createGrantBus();
    const q = createPurchases({
      kv,
      bus,
      ids: PRODUCT_IDS,
      backend: {
        products: async () => [],
        purchase: async () => ({ status: 'purchased', transactionId: 'z' }),
        restore: async () => [],
        entitled: async () => [],
      },
    });
    bus.subscribe(() => void kv.get(LEDGER_KEY).then((v) => (seen = v ?? '')));
    await q.buy('diamonds_80');
    await Promise.resolve();
    expect(seen).toContain('tx:z');
    void p;
  });

  it('lists the products it is given', async () => {
    const { p } = setup();
    expect((await p.products()).map((x) => x.id)).toEqual([...PRODUCT_IDS]);
  });
});
