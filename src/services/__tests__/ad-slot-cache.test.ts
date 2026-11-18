import { createSlotCache } from '../ad-slot-cache';

const STALE = 50 * 60_000;
const FLOOR = 30_000;

function make(o: { init?: () => Promise<void>; results?: (string | null)[] } = {}) {
  const clock = { t: 1_000_000 };
  const loads = { n: 0 };
  const results = o.results ?? [];
  const cache = createSlotCache<string>({
    init: o.init ?? (async () => {}),
    load: async () => {
      const r = loads.n < results.length ? results[loads.n] : `ad${loads.n}`;
      loads.n++;
      return r;
    },
    now: () => clock.t,
    staleMs: STALE,
    retryFloorMs: FLOOR,
  });
  const settle = () => new Promise((r) => setImmediate(r));
  return { cache, clock, loads, settle };
}

describe('T103: the one-ad cache', () => {
  it('preload fills the slot once, and does not load again while one is waiting', async () => {
    const { cache, loads, settle } = make();
    expect(cache.fresh()).toBe(false);
    cache.preload();
    cache.preload();
    await settle();
    expect(cache.fresh()).toBe(true);
    cache.preload();
    await settle();
    expect(loads.n).toBe(1);
  });

  it('a waiting ad goes stale after the stale time, and preload loads another', async () => {
    const { cache, clock, loads, settle } = make();
    cache.preload();
    await settle();
    clock.t += STALE - 1;
    expect(cache.fresh()).toBe(true);
    clock.t += 1;
    expect(cache.fresh()).toBe(false);
    cache.preload();
    await settle();
    expect(loads.n).toBe(2);
    expect(cache.fresh()).toBe(true);
  });

  it('an unfilled load is asked again only after the retry floor', async () => {
    const { cache, clock, loads, settle } = make({ results: [null] });
    cache.preload();
    await settle();
    expect(cache.fresh()).toBe(false);
    clock.t += FLOOR - 1;
    cache.preload();
    await settle();
    expect(loads.n).toBe(1);
    clock.t += 1;
    cache.preload();
    await settle();
    expect(loads.n).toBe(2);
    expect(cache.fresh()).toBe(true);
  });

  it('take spends the waiting ad and resets the floor, so the next one may load at once', async () => {
    const { cache, loads, settle } = make();
    cache.preload();
    await settle();
    expect(await cache.take()).toBe('ad0');
    expect(cache.fresh()).toBe(false);
    cache.preload();
    await settle();
    expect(loads.n).toBe(2);
  });

  it('take loads one when none is waiting or the waiting one is stale; a miss starts the floor', async () => {
    const { cache, clock, loads, settle } = make({ results: ['old', null, 'next'] });
    cache.preload();
    await settle();
    clock.t += STALE;
    expect(await cache.take()).toBeNull();
    expect(loads.n).toBe(2);
    cache.preload();
    await settle();
    expect(loads.n).toBe(2);
    clock.t += FLOOR;
    cache.preload();
    await settle();
    expect(loads.n).toBe(3);
    expect(await cache.take()).toBe('next');
  });

  it('a failed init loses nothing: preload swallows it, take rejects, and a later preload retries after the floor', async () => {
    let fail = true;
    const { cache, clock, loads, settle } = make({
      init: async () => {
        if (fail) throw new Error('sdk');
      },
    });
    cache.preload();
    await settle();
    expect(cache.fresh()).toBe(false);
    await expect(cache.take()).rejects.toThrow('sdk');
    fail = false;
    clock.t += FLOOR;
    cache.preload();
    await settle();
    expect(loads.n).toBe(1);
    expect(cache.fresh()).toBe(true);
  });
});
