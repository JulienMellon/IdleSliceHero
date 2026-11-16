import { createAdFlow, type AdPorts } from '../ad-flow';
import { consentReduce, initialConsent, mayOfferAd, nextStep } from '../consent';
import type { AdResult } from '../types';

function ports(o: { loadedFn?: () => boolean; ump?: () => Promise<{ canRequestAds: boolean }>; tracking?: () => Promise<'granted' | 'denied' | 'unsupported'>; ad?: AdResult | (() => Promise<AdResult>); loaded?: boolean } = {}) {
  const calls: string[] = [];
  const preloads = { n: 0 };
  const p: AdPorts = {
    ump: async () => {
      calls.push('ump');
      return (o.ump ?? (async () => ({ canRequestAds: true })))();
    },
    tracking: async () => {
      calls.push('tracking');
      return (o.tracking ?? (async () => 'granted' as const))();
    },
    showAd: async () => {
      calls.push('ad');
      return typeof o.ad === 'function' ? o.ad() : (o.ad ?? 'rewarded');
    },
    loaded: () => (o.loadedFn ? o.loadedFn() : (o.loaded ?? false)),
    preload: () => {
      preloads.n++;
    },
  };
  return { p, calls, preloads };
}

describe('consent state machine', () => {
  it('waits for the tutorial before anything', () => {
    expect(nextStep(initialConsent())).toBe('wait');
  });

  it('goes ump -> tracking -> ad', () => {
    let s = consentReduce(initialConsent(), { type: 'tutorial_done' });
    expect(nextStep(s)).toBe('ump');
    s = consentReduce(s, { type: 'ump', canRequestAds: true });
    expect(nextStep(s)).toBe('tracking');
    s = consentReduce(s, { type: 'tracking', status: 'granted' });
    expect(nextStep(s)).toBe('ad');
  });

  it('a refused tracking prompt still ends in an ad; a refused UMP form ends clean', () => {
    let s = consentReduce(consentReduce(initialConsent(), { type: 'tutorial_done' }), { type: 'ump', canRequestAds: true });
    expect(nextStep(consentReduce(s, { type: 'tracking', status: 'denied' }))).toBe('ad');
    expect(nextStep(consentReduce(s, { type: 'tracking', status: 'unsupported' }))).toBe('ad');
    s = consentReduce(consentReduce(initialConsent(), { type: 'tutorial_done' }), { type: 'ump', canRequestAds: false });
    expect(nextStep(s)).toBe('unavailable');
    expect(mayOfferAd(s)).toBe(false);
  });
});

describe('ad flow', () => {
  it('asks for nothing before the tutorial is over, and the button stays hidden', async () => {
    const { p, calls } = ports();
    const f = createAdFlow(p);
    expect(f.ready()).toBe(false);
    expect(await f.show('double_claim')).toBe('unavailable');
    expect(calls).toEqual([]);
  });

  it('first ad: UMP, then the tracking prompt, then the ad', async () => {
    const { p, calls } = ports();
    const f = createAdFlow(p);
    f.setTutorialDone();
    expect(f.ready()).toBe(true);
    expect(await f.show('double_claim')).toBe('rewarded');
    expect(calls).toEqual(['ump', 'tracking', 'ad']);
    // consent is not asked for again
    await f.show('reroll_task');
    expect(calls).toEqual(['ump', 'tracking', 'ad', 'ad']);
  });

  it('tracking refused: the ad still shows', async () => {
    const { p, calls } = ports({ tracking: async () => 'denied' });
    const f = createAdFlow(p);
    f.setTutorialDone();
    expect(await f.show('boost_2x')).toBe('rewarded');
    expect(calls).toEqual(['ump', 'tracking', 'ad']);
  });

  it('tracking prompt that throws counts as refused, ad still shows', async () => {
    const { p } = ports({ tracking: async () => { throw new Error('x'); } });
    const f = createAdFlow(p);
    f.setTutorialDone();
    expect(await f.show('boost_2x')).toBe('rewarded');
  });

  it('UMP refused: no tracking prompt, no ad, a clean unavailable, and the button goes away', async () => {
    const { p, calls } = ports({ ump: async () => ({ canRequestAds: false }) });
    const f = createAdFlow(p);
    f.setTutorialDone();
    expect(await f.show('offline_2x')).toBe('unavailable');
    expect(calls).toEqual(['ump']);
    expect(f.ready()).toBe(false);
    expect(await f.show('offline_2x')).toBe('unavailable');
    expect(calls).toEqual(['ump']);
  });

  it('UMP that cannot be reached (offline) is unavailable now and asked again next time', async () => {
    let n = 0;
    const { p, calls } = ports({ ump: async () => { if (n++ === 0) throw new Error('offline'); return { canRequestAds: true }; } });
    const f = createAdFlow(p);
    f.setTutorialDone();
    expect(await f.show('streak_save')).toBe('unavailable');
    expect(f.ready()).toBe(true);
    expect(await f.show('streak_save')).toBe('rewarded');
    expect(calls).toEqual(['ump', 'ump', 'tracking', 'ad']);
  });

  it('an ad that fails or does not fill is unavailable, and one that throws too', async () => {
    const a = createAdFlow(ports({ ad: 'unavailable' }).p);
    a.setTutorialDone();
    expect(await a.show('daily_booster')).toBe('unavailable');
    const b = createAdFlow(ports({ ad: async () => { throw new Error('x'); } }).p);
    b.setTutorialDone();
    expect(await b.show('daily_booster')).toBe('unavailable');
  });

  it('a dismissed ad is dismissed', async () => {
    const f = createAdFlow(ports({ ad: 'dismissed' }).p);
    f.setTutorialDone();
    expect(await f.show('double_claim')).toBe('dismissed');
  });

  it('only one ad at a time', async () => {
    let release: (r: AdResult) => void = () => {};
    const { p } = ports({ ad: () => new Promise<AdResult>((r) => (release = r)) });
    const f = createAdFlow(p);
    f.setTutorialDone();
    const first = f.show('double_claim');
    expect(await f.show('double_claim')).toBe('unavailable');
    await new Promise((r) => setTimeout(r, 0));
    release('rewarded');
    expect(await first).toBe('rewarded');
  });

  it('after consent the button shows only while an ad is loaded', async () => {
    const o = { loaded: false };
    const { p } = ports(o);
    const f = createAdFlow({ ...p, loaded: () => o.loaded });
    f.setTutorialDone();
    await f.show('double_claim');
    expect(f.ready()).toBe(false);
    o.loaded = true;
    expect(f.ready()).toBe(true);
  });
});

describe('ad flow keeps an ad loading (K1)', () => {
  it('asks for the next ad on every exit of show: rewarded, dismissed and unfilled', async () => {
    for (const ad of ['rewarded', 'dismissed', 'unavailable'] as const) {
      const { p, preloads } = ports({ ad });
      const f = createAdFlow(p);
      f.setTutorialDone();
      expect(preloads.n).toBe(0); // consent not known yet: nothing may load
      await f.show('double_claim');
      expect(preloads.n).toBe(1);
    }
  });

  it('a button that went away (stale or unfilled ad) asks for a reload whenever it is checked', async () => {
    let loaded = true;
    const { p, preloads } = ports({ loadedFn: () => loaded });
    const f = createAdFlow(p);
    f.setTutorialDone();
    await f.show('double_claim');
    const after = preloads.n;
    expect(f.ready()).toBe(true);
    expect(preloads.n).toBe(after);
    loaded = false; // the ad went stale
    expect(f.ready()).toBe(false);
    expect(preloads.n).toBe(after + 1);
    loaded = true; // the retry filled
    expect(f.ready()).toBe(true);
  });

  it('never loads before consent says ads are allowed', async () => {
    const { p, preloads } = ports({ ump: async () => ({ canRequestAds: false }) });
    const f = createAdFlow(p);
    f.setTutorialDone();
    await f.show('double_claim');
    f.ready();
    expect(preloads.n).toBe(0);
  });

  it('a preload that throws does not break show or ready', async () => {
    const { p } = ports();
    p.preload = () => {
      throw new Error('x');
    };
    const f = createAdFlow(p);
    f.setTutorialDone();
    expect(await f.show('double_claim')).toBe('rewarded');
    expect(f.ready()).toBe(false);
  });
});
