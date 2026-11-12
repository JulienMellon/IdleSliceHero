import * as G from '../game';
import { FEATURES, getFeature, setFeature, withFeatures } from '../features';
import type { Feature } from '../features/types';

const T0 = 1_700_000_000_000;
const calls: string[] = [];

interface Fake {
  n: number;
  offline: number;
}
const fakeA: Feature<Fake> = {
  key: 'fakeA',
  init: () => ({ n: 0, offline: 0 }),
  migrate: (raw) => {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return { n: typeof r.n === 'number' ? r.n : 5, offline: typeof r.offline === 'number' ? r.offline : 0 };
  },
  tick: (g, dt) => {
    calls.push('a');
    const f = getFeature(g, fakeA);
    return setFeature(g, fakeA, { ...f, n: f.n + dt });
  },
  shopValueMult: () => 2,
  shopDemandMult: () => 1.5,
  onOffline: (g, seconds) => {
    const f = getFeature(g, fakeA);
    return setFeature(g, fakeA, { ...f, offline: f.offline + seconds });
  },
};
const fakeB: Feature<{ seen: boolean }> = {
  key: 'fakeB',
  init: () => ({ seen: false }),
  migrate: (raw) => ({ seen: !!(raw as { seen?: unknown } | null)?.seen }),
  tick: (g) => {
    calls.push('b');
    return setFeature(g, fakeB, { seen: true });
  },
  shopValueMult: () => 3,
  shopDemandMult: () => 0.5,
};

/** A kitchen that out-runs its customers, so demand decides the rate. */
const demandBound = (g: G.GameState): G.GameState => ({ ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, prep: 40, ovens: 40, counter: 40, footprint: 3 } } });

beforeEach(() => {
  calls.length = 0;
});

describe('feature registry', () => {
  it('ships empty, so nothing changes until a feature is added', () => {
    expect(FEATURES).toHaveLength(0);
    expect(G.newGame(T0).x).toEqual({});
    expect(G.featureMults(G.newGame(T0), 'downtown')).toEqual({ value: 1, demand: 1 });
  });

  it('withFeatures swaps the registry for the call and puts it back, even on a throw', () => {
    withFeatures([fakeA], () => expect(FEATURES).toHaveLength(1));
    expect(() => withFeatures([fakeA], () => { throw new Error('boom'); })).toThrow('boom');
    expect(FEATURES).toHaveLength(0);
  });

  it('init: newGame fills x from every feature', () => {
    withFeatures([fakeA, fakeB], () => {
      expect(G.newGame(T0).x).toEqual({ fakeA: { n: 0, offline: 0 }, fakeB: { seen: false } });
    });
  });

  it('migrate: a save without x loads with defaults, and a saved value is kept', () => {
    withFeatures([fakeA, fakeB], () => {
      const old = JSON.parse(JSON.stringify(G.newGame(T0)));
      delete old.x;
      expect(G.migrate(old, T0).x).toEqual({ fakeA: { n: 5, offline: 0 }, fakeB: { seen: false } });
      expect(G.migrate({ ...old, x: { fakeA: { n: 42 } } }, T0).x.fakeA).toEqual({ n: 42, offline: 0 });
      expect(G.migrate({ ...old, x: 'junk' }, T0).x.fakeA).toEqual({ n: 5, offline: 0 });
    });
  });

  it('migrate: a save from a feature that is no longer registered drops its slice', () => {
    const saved = { ...G.newGame(T0), x: { gone: { n: 1 } } };
    expect(G.migrate(JSON.parse(JSON.stringify(saved)), T0).x).toEqual({});
  });

  it('tick: runs after the ordinary body, once per playTick, in registry order', () => {
    withFeatures([fakeB, fakeA], () => {
      const g = G.playTick(G.newGame(T0), 2, T0);
      expect(calls).toEqual(['b', 'a']);
      expect(g.playSeconds).toBe(2);
      expect(getFeature(g, fakeA).n).toBe(2);
      expect(getFeature(g, fakeB).seen).toBe(true);
    });
    withFeatures([fakeA, fakeB], () => {
      G.playTick(G.newGame(T0), 1, T0);
      expect(calls.slice(2)).toEqual(['a', 'b']);
      calls.length = 0;
      G.playTick(G.newGame(T0), 0, T0);
      expect(calls).toEqual([]);
    });
  });

  it('multipliers: value and demand hooks multiply, and the products reach earnings', () => {
    const base = demandBound(G.newGame(T0));
    const plain = G.shopEarnings(base, 'downtown');
    expect(plain).toBeGreaterThan(0);
    withFeatures([fakeA], () => {
      const g = demandBound(G.newGame(T0));
      expect(G.featureMults(g, 'downtown', T0)).toEqual({ value: 2, demand: 1.5 });
      expect(G.shopEarnings(g, 'downtown')).toBeCloseTo(plain * 2 * 1.5, 9);
    });
    withFeatures([fakeA, fakeB], () => {
      const g = demandBound(G.newGame(T0));
      expect(G.featureMults(g, 'downtown', T0)).toEqual({ value: 6, demand: 0.75 });
      expect(G.shopEarnings(g, 'downtown')).toBeCloseTo(plain * 6 * 0.75, 9);
      const shop = g.shops.downtown;
      expect(G.valuePerPizza('downtown', shop, g.vehicle, G.featureMults(g, 'downtown', T0))).toBeCloseTo(G.valuePerPizza('downtown', shop, g.vehicle) * 6, 9);
    });
  });

  it('multipliers: a running line pays the multiplied price', () => {
    const run = () => {
      let g = demandBound(G.newGame(T0));
      g = { ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, managed: true, heads: G.allHeads() } } };
      for (let i = 0; i < 60; i++) g = G.playTick(g, 1, T0 + i * 1000);
      return g;
    };
    const plain = run().totalEarned;
    withFeatures([fakeA], () => {
      expect(run().totalEarned).toBeGreaterThan(plain * 2);
    });
  });

  it('offline: onOffline gets the paid seconds, and the demand hook raises what a managed shop makes away', () => {
    const managed = (g: G.GameState): G.GameState => {
      const d = demandBound(g);
      return { ...d, shops: { ...d.shops, downtown: { ...d.shops.downtown, managed: true, heads: G.allHeads() } }, lastSavedAt: T0 };
    };
    const plain = G.applyOffline(managed(G.newGame(T0)), T0 + 3600_000);
    withFeatures([fakeA], () => {
      const r = G.applyOffline(managed(G.newGame(T0)), T0 + 3600_000);
      expect(getFeature(r.state, fakeA).offline).toBe(3600);
      expect(r.earned).toBeGreaterThan(plain.earned * 2.9);
      expect(r.earned).toBeLessThan(plain.earned * 3.1);
    });
  });

  it('save/load: x survives a JSON round trip', () => {
    withFeatures([fakeA, fakeB], () => {
      let g = G.playTick(G.newGame(T0), 3, T0);
      g = G.applyOffline({ ...g, lastSavedAt: T0 }, T0 + 60_000).state;
      const back = G.migrate(JSON.parse(JSON.stringify(g)), T0 + 60_000);
      expect(back.x).toEqual(g.x);
      expect(getFeature(back, fakeA)).toEqual({ n: 3, offline: 60 });
    });
  });
});
