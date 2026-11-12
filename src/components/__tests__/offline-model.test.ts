/// <reference types="jest" />
import { NIGHT_OVEN } from '../../content/hooks';
import { clock, countUpValue, offlineGiftView, offlineNews, type GiftSummary } from '../offline-model';

const H = 3600;
const summary = (patch: Partial<GiftSummary> = {}): GiftSummary => ({
  seconds: 3.2 * H,
  capped: false,
  awaySeconds: 3.2 * H,
  earned: 15000,
  byShop: [
    { name: 'Downtown', earned: 9000, managed: true, pies: 3000 },
    { name: 'Suburbs', earned: 6000, managed: true, pies: 12400 },
  ],
  idle: [],
  ...patch,
});

describe('the clock', () => {
  test('hours and minutes', () => {
    expect([3.2 * H, 4 * H, 45 * 60, 0, 59].map(clock)).toEqual(['3 h 12 m', '4 h', '45 m', '0 m', '0 m']);
  });
});

describe('offlineGiftView: before opening', () => {
  test('welcome, the fill meter and its text', () => {
    const v = offlineGiftView(summary(), 0);
    expect(v.title).toBe('Welcome back!');
    expect(v.fill).toBeCloseTo(0.8);
    expect(v.step).toBe(16);
    expect(v.fillText).toBe('3 h 12 m of 4 h');
    expect(v.full).toBe(false);
    expect(v.fullLine).toBeNull();
    expect(v.upgradeLine).toBeNull();
  });

  test('the glow changes in 5% steps, not continuously', () => {
    const a = offlineGiftView(summary({ seconds: 3.2 * H }), 0).step;
    const b = offlineGiftView(summary({ seconds: 3.2 * H + 60 }), 0).step;
    expect(b).toBe(a);
  });
});

describe('offlineGiftView: a full oven', () => {
  const full = summary({ seconds: 4 * H, capped: true, awaySeconds: 9 * H });

  test('says it was full and what it holds, and offers the bigger tier', () => {
    const v = offlineGiftView(full, 0);
    expect(v.full).toBe(true);
    expect(v.step).toBe(20);
    expect(v.fullLine).toBe('The night oven was full — it holds 4 h');
    expect(v.upgradeLine).toBe('Upgrade it to hold 8 h');
  });

  test('the next tier up offers the one after; the biggest offers nothing', () => {
    expect(offlineGiftView({ ...full, seconds: 8 * H }, 1).upgradeLine).toBe('Upgrade it to hold 12 h');
    const top = offlineGiftView({ ...full, seconds: 12 * H }, 2);
    expect(top.fullLine).toBe('The night oven was full — it holds 12 h');
    expect(top.upgradeLine).toBeNull();
  });

  test('never the word "Capped"', () => {
    for (const tier of [0, 1, 2]) {
      const v = offlineGiftView({ ...full, seconds: NIGHT_OVEN.capSeconds[tier] }, tier);
      expect(JSON.stringify(v)).not.toMatch(/capped/i);
    }
  });

  test('exactly the cap, not "capped" by the engine, still reads as full', () => {
    expect(offlineGiftView(summary({ seconds: 4 * H, capped: false }), 0).full).toBe(true);
  });
});

describe('the total, the rows and the count-up', () => {
  test('the total is the sum of the lines as shown', () => {
    const v = offlineGiftView(summary(), 0);
    expect(v.total).toBe(15000);
    expect(v.rows.map((r) => r.name)).toEqual(['Downtown', 'Suburbs']);
    expect(offlineGiftView(summary({ byShop: [], earned: 77 }), 0).total).toBe(77);
  });

  test('an unmanaged shop’s row says its orders were already in the oven', () => {
    const v = offlineGiftView(summary({ byShop: [{ name: 'Suburbs', earned: 40, managed: false, pies: 4 }] }), 0);
    expect(v.rows[0].note).toBe(' (orders already in the oven)');
  });

  test('countUpValue starts at 0, eases out, lands exactly on the total', () => {
    expect(countUpValue(1000, 0, 800)).toBe(0);
    const mid = countUpValue(1000, 400, 800);
    expect(mid).toBeGreaterThan(500);
    expect(mid).toBeLessThan(1000);
    expect(countUpValue(1000, 800, 800)).toBe(1000);
    expect(countUpValue(1000, 5000, 800)).toBe(1000);
    let last = -1;
    for (let t = 0; t <= 800; t += 50) {
      const v = countUpValue(1000, t, 800);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });
});

describe('the news line', () => {
  test('the best-selling managed shop', () => {
    expect(offlineNews(summary().byShop, [])).toBe('Suburbs sold 12,400 pies while you were out');
    expect(offlineNews([{ name: 'Suburbs', earned: 5, managed: true, pies: 1 }], [])).toBe('Suburbs sold 1 pie while you were out');
  });

  test('a shop that waited for a manager', () => {
    const idle = offlineNews([{ name: 'Downtown', earned: 5, managed: false, pies: 2 }], ['Waterfront']);
    expect(idle).toBe("Waterfront waited for you: hire a manager and it bakes while you're away");
  });

  test('otherwise what the kitchens finished', () => {
    expect(offlineNews([{ name: 'Downtown', earned: 5, managed: false, pies: 2 }], [])).toBe('Your kitchens finished the pizzas already in the oven');
  });
});
