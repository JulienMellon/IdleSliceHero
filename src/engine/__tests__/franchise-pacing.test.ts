// The franchise's pacing pins (v5.18, card E3). The check-in player (5 min every 4 h, scripts/pacing-fit.ts) finishes the home city, franchises, and
// plays Boston with the Franchise multiplier: its story must take about the days the home city's did. A retune of content/franchise.ts (the
// divisor, the growth, PRICE_FIT) that moves one of these has to say so here. Refit with `npx tsx scripts/pacing-fit.ts fitboston`.
import { FRANCHISE } from '../../content/franchise';
import { BOSTON_TOLERANCE, franchiseRun } from '../../../scripts/pacing-fit';

jest.setTimeout(180_000);

describe('the check-in player franchises and plays Boston', () => {
  const f = franchiseRun();
  const keys = Object.keys(f.home.days) as (keyof typeof f.home.days)[];

  it('is offered the franchise at the home finale and a clean clear pays about 10 Stars: 2.0x', () => {
    expect(f.home.offered).toBe(true);
    expect(f.home.stars).toBe(FRANCHISE.starsPerClear);
    expect(f.home.multiplier).toBe(2);
    expect(f.boston.startedWith).toEqual({ city: 'boston', cash: 0 });
  });

  for (const k of ['waterfront', 'university', 'industrial', 'uptown', 'finale'] as const) {
    it(`Boston's ${k} beat lands within ${BOSTON_TOLERANCE} days of the home city's`, () => {
      expect(keys).toContain(k);
      expect(Math.abs(f.boston.days[k] - f.home.days[k])).toBeLessThanOrEqual(BOSTON_TOLERANCE);
    });
  }

  it('Boston is finished', () => {
    expect(f.boston.done).toBe(true);
    // the finale is within 10% of the home city's, so the second run is not a slog and not a skip
    expect(f.boston.days.finale / f.home.days.finale).toBeGreaterThan(0.9);
    expect(f.boston.days.finale / f.home.days.finale).toBeLessThan(1.1);
  });
});
