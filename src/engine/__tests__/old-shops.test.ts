// v5.25 (card E10): the old shops stay worth visiting. At every hood opening after Suburbs, Downtown and Suburbs each earn at least OLD_SHOP_SHARE of the
// city's income for the renovating check-in player (scripts/review/sim2.ts), and the shops are renovated in the story. Refit with `npx tsx scripts/pacing-fit.ts check`.
import { OLD_SHOP_SHARE, oldShopShares } from '../../../scripts/pacing-fit';
import { run } from '../../../scripts/review/sim2';
import { renoLevel } from '../features/renovation';

jest.setTimeout(120_000);

describe('the old shops after the renovations', () => {
  const rows = oldShopShares();

  it('has a row for Waterfront, University, Industrial and Uptown', () => {
    expect(rows.map((r) => r.hood)).toEqual(['waterfront', 'university', 'industrial', 'uptown']);
  });
  for (const hood of ['waterfront', 'university', 'industrial', 'uptown']) {
    it(`at the ${hood} opening Downtown and Suburbs each earn at least ${OLD_SHOP_SHARE * 100}% of the city's income`, () => {
      const r = rows.find((x) => x.hood === hood)!;
      expect([hood, r.downtown >= OLD_SHOP_SHARE, r.suburbs >= OLD_SHOP_SHARE]).toEqual([hood, true, true]);
    });
  }

  it('the player renovates Downtown and Suburbs in the story, to level 3', () => {
    const story = run('checkin', 300, 4 * 3600);
    expect(story.s.cityComplete).toBe(true);
    expect(renoLevel(story.s, 'downtown')).toBe(3);
    expect(renoLevel(story.s, 'suburbs')).toBe(3);
    expect(story.buys.filter((b) => b.label.endsWith(':renovate')).length).toBeGreaterThanOrEqual(6);
  });
});
