import { analyticsLog, clearAnalyticsLog } from '../analytics';
import { readFileSync } from 'fs';
import { join } from 'path';

import { ads, analytics, isOptedOut, purchases, startServices } from '../index';

const setSearch = (s: string) => ((globalThis as { location?: unknown }).location = { search: s });
afterEach(() => {
  delete (globalThis as { location?: unknown }).location;
});

describe('service wiring', () => {
  beforeAll(async () => {
    await startServices();
    clearAnalyticsLog();
  });

  it('a rewarded ad sends ad_started then ad_completed; an unfilled one only ad_started', async () => {
    await ads.show('double_claim');
    setSearch('?ads=rewarded');
    await ads.show('reroll_task');
    expect(analyticsLog().map((e) => [e.event, e.props?.placement])).toEqual([
      ['ad_started', 'double_claim'],
      ['ad_started', 'reroll_task'],
      ['ad_completed', 'reroll_task'],
    ]);
  });

  it('a purchase sends iap_purchased; a cancelled one sends nothing', async () => {
    clearAnalyticsLog();
    await purchases.buy('diamonds_80');
    expect(analyticsLog()).toEqual([]);
    setSearch('?buy=purchased');
    await purchases.buy('diamonds_80');
    expect(analyticsLog().map((e) => e.event)).toEqual(['iap_purchased']);
  });
});

describe('C133: the opt-out is read through the services index', () => {
  it('isOptedOut follows setOptOut', () => {
    expect(isOptedOut()).toBe(false);
    analytics.setOptOut(true);
    expect(isOptedOut()).toBe(true);
    analytics.setOptOut(false);
    expect(isOptedOut()).toBe(false);
  });
  it('the settings screen does not reach into services/runtime', () => {
    const src = readFileSync(join(__dirname, '../../app/settings.tsx'), 'utf8');
    expect(src).not.toMatch(/services\/runtime/);
    expect(src).toMatch(/isOptedOut\(\)/);
  });
});
