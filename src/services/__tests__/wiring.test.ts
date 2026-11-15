import { analyticsLog, clearAnalyticsLog } from '../analytics';
import { ads, purchases, startServices } from '../index';

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
