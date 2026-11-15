import { clearAnalyticsLog, analytics, analyticsLog, startAnalytics } from '../analytics';
import { createAnalytics, INSTALL_ID_KEY } from '../analytics-core';
import { clearCrashLog, crash, crashLog } from '../crash';
import { createCrash } from '../crash-core';
import { EVENTS, cleanProps } from '../events';
import { memoryKV } from '../kv';
import { createPrivacy, OPT_OUT_KEY } from '../privacy';
import { purchases } from '../purchases';
import { queryFlag } from '../query';
import { ads } from '../ads';
import { privacy } from '../runtime';

const setSearch = (s: string) => ((globalThis as { location?: unknown }).location = { search: s });
afterEach(() => {
  delete (globalThis as { location?: unknown }).location;
});

describe('web stubs', () => {
  it('ads answer by the ?ads flag and default to unavailable', async () => {
    expect(await ads.show('double_claim')).toBe('unavailable');
    expect(ads.ready('double_claim')).toBe(false);
    setSearch('?ads=rewarded');
    expect(await ads.show('double_claim')).toBe('rewarded');
    expect(ads.ready('double_claim')).toBe(true);
    setSearch('?ads=dismissed');
    expect(await ads.show('reroll_task')).toBe('dismissed');
    setSearch('?ads=garbage');
    expect(await ads.show('reroll_task')).toBe('unavailable');
  });

  it('purchases read ?owned and ignore unknown ids', () => {
    expect(purchases.owned()).toEqual([]);
    setSearch('?owned=nonnas_plus,nope,starter_pack');
    expect(purchases.owned().sort()).toEqual(['nonnas_plus', 'starter_pack']);
  });

  it('purchases list five products and cancel a buy by default', async () => {
    expect((await purchases.products()).map((p) => p.id)).toHaveLength(5);
    expect(await purchases.buy('diamonds_80')).toBe('cancelled');
    setSearch('?buy=failed');
    expect(await purchases.buy('diamonds_80')).toBe('failed');
  });

  it('analytics records events a test can read, and an opted-out one records nothing', async () => {
    clearAnalyticsLog();
    await startAnalytics();
    analytics.track(EVENTS.sessionStart);
    analytics.track(EVENTS.adOffered, { placement: 'double_claim' });
    expect(analyticsLog().map((e) => e.event)).toEqual(['session_start', 'ad_offered']);
    analytics.setOptOut(true);
    analytics.track(EVENTS.sessionEnd);
    expect(analyticsLog()).toHaveLength(2);
    analytics.setOptOut(false);
    analytics.track(EVENTS.sessionEnd);
    expect(analyticsLog()).toHaveLength(3);
  });

  it('crash records, and stops when opted out', () => {
    clearCrashLog();
    crash.capture(new Error('a'), 'ctx');
    expect(crashLog()).toHaveLength(1);
    privacy.set(true);
    crash.capture(new Error('b'));
    expect(crashLog()).toHaveLength(1);
    privacy.set(false);
  });

  it('reads query flags', () => {
    expect(queryFlag('a', '?a=1&b=2')).toBe('1');
    expect(queryFlag('c', '?a=1')).toBe('');
  });
});

describe('opt-out', () => {
  const make = (seed: Record<string, string> = {}) => {
    const kv = memoryKV(seed);
    const privacy = createPrivacy(kv);
    const sent: string[] = [];
    const opt: boolean[] = [];
    const a = createAnalytics({ kv, privacy, sink: { capture: (e) => void sent.push(e), optOut: (v) => void opt.push(v) } });
    return { kv, privacy, sent, opt, a };
  };

  it('an opt-out saved from last time stops events queued before start finished', async () => {
    const { a, sent, privacy } = make({ [OPT_OUT_KEY]: '1' });
    a.track('session_start'); // before anything loaded
    await privacy.load();
    await a.start();
    a.track('scene_seen');
    expect(sent).toEqual([]);
  });

  it('events queued before start go out once start is done, when not opted out', async () => {
    const { a, sent, privacy } = make();
    a.track('session_start');
    await privacy.load();
    await a.start();
    a.track('scene_seen');
    expect(sent).toEqual(['session_start', 'scene_seen']);
  });

  it('opting out mid-session stops the next event, tells the sink, and is remembered', async () => {
    const { a, sent, opt, kv, privacy } = make();
    await privacy.load();
    await a.start();
    a.track('shop_built');
    a.setOptOut(true);
    a.track('shop_built');
    expect(sent).toEqual(['shop_built']);
    expect(opt.at(-1)).toBe(true);
    expect(await kv.get(OPT_OUT_KEY)).toBe('1');
  });

  it('makes one install id, keeps it, and never changes it', async () => {
    const { a, kv } = make();
    await a.start();
    const id = a.installId();
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(await kv.get(INSTALL_ID_KEY)).toBe(id);
    const b = createAnalytics({ kv, privacy: createPrivacy(kv), sink: { capture() {}, optOut() {} } });
    await b.start();
    expect(b.installId()).toBe(id);
  });

  it('crash reporting follows the same switch', () => {
    const privacy = createPrivacy(memoryKV());
    const seen: unknown[] = [];
    const c = createCrash(privacy, { capture: (e) => void seen.push(e) });
    c.capture('a');
    privacy.set(true);
    c.capture('b');
    expect(seen).toEqual(['a']);
  });

  it('a sink that throws never reaches the game', async () => {
    const kv = memoryKV();
    const a = createAnalytics({ kv, privacy: createPrivacy(kv), sink: { capture: () => { throw new Error('x'); }, optOut() {} } });
    await a.start();
    expect(() => a.track('session_start')).not.toThrow();
  });
});

describe('props carry no personal data', () => {
  it('drops banned keys and odd values, and cuts long strings', () => {
    expect(cleanProps({ email: 'a@b.c', placement: 'x', n: 3, ok: true, bad: NaN, IDFA: 'z' })).toEqual({ placement: 'x', n: 3, ok: true });
    expect((cleanProps({ s: 'x'.repeat(300) })!.s as string).length).toBe(100);
    expect(cleanProps(undefined)).toBeUndefined();
  });

  it('defines the nine events', () => {
    expect(Object.values(EVENTS).sort()).toEqual(['ad_completed', 'ad_offered', 'ad_started', 'iap_purchased', 'iap_viewed', 'scene_seen', 'session_end', 'session_start', 'shop_built']);
  });
});
