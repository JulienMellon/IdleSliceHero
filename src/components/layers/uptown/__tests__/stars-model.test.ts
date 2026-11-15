/// <reference types="jest" />
import { STARS } from '../../../../content/layers';
import { getFeature, withFeatures } from '../../../../engine/features';
import { buyIngredients, ingredientsPrice, starsView, uptownStars, type StarsState } from '../../../../engine/features/layers/uptown-stars';
import { newGame, shopEarnings, type GameState, type Shop } from '../../../../engine/game';
import { chipPillWidth, twoRows } from '../../university/layer-model';
import { TAP } from '../../../tap-targets';
import { BUTTON_H } from '../../university/layer-model';
import { PAY_RULE, PAY_WORDS, chipText, decorNext, ingredientsCardModel, ovenNext, payTagOf, pointsForStar, starsSheet, tierName } from '../stars-model';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const run = <T>(fn: () => T): T => withFeatures([uptownStars], fn);
const DECOR = (n: number) => ({ plants: Math.min(3, n), flooring: Math.min(3, Math.max(0, n - 3)), tables: Math.min(3, Math.max(0, n - 6)), walls: Math.min(3, Math.max(0, n - 9)), signage: Math.min(3, Math.max(0, n - 12)) });
function uptown(p: Partial<Shop> & { tier?: number; cash?: number; tiers?: number }): GameState {
  return run(() => {
    const g = newGame(NOW);
    const { tier = 0, cash = 1e30, tiers = 0, ...shop } = p;
    const shops = { ...g.shops, uptown: { ...g.shops.uptown, built: true, managed: true, prep: 40, ovens: 40, counter: 40, drivers: 20, tables: 20, footprint: 2, decor: DECOR(tiers), ...shop } };
    const st: StarsState = { ...getFeature(g, uptownStars), tier, nextAt: 99999 };
    return { ...g, cash, shops, x: { ...g.x, [uptownStars.key]: st } };
  });
}

describe('the pay rule', () => {
  it('names half pay under 3 stars, full pay at 3 and 4, double pay at 5', () => {
    expect([1, 2, 3, 4, 5].map((n) => PAY_WORDS[payTagOf(n === 5 ? STARS.pay.top : n >= 3 ? STARS.pay.mid : STARS.pay.low)])).toEqual(['Half pay', 'Half pay', 'Full pay', 'Full pay', 'Double pay']);
    expect(PAY_RULE).toBe('Under 3★ half pay · 3–4★ full pay · 5★ double pay');
  });

  it('finds the points a star takes', () => {
    expect([1, 2, 3, 4, 5].map(pointsForStar)).toEqual([0, 2, 4, 6, 7]);
  });
});

describe('the chip', () => {
  it('reads "Rating 4★" on two rows that fit', () => {
    expect(chipText(4)).toBe('Rating 4★');
    expect(twoRows(chipText(4))).toEqual(['Rating', '4★']);
    expect(chipPillWidth(twoRows(chipText(5)))).toBeLessThanOrEqual(76);
  });
});

describe('the sheet at 2 stars', () => {
  const m = starsSheet(uptown({ grade: 1, tiers: 5, tier: 0 }));
  it('says 2 stars on half pay, and how far it is to the next', () => {
    expect(starsView(uptown({ grade: 1, tiers: 5 })).stars).toBe(2);
    expect(m).toMatchObject({ stars: 2, pay: 'half', payWord: 'Half pay', rating: 'Rating 2★' });
    expect(m.progress).toBe('2 of 7 points · next star at 4');
  });

  it('lists the three inputs with their points and what the next point costs', () => {
    expect(m.rows.map((r) => [r.key, r.points])).toEqual([['oven', '1/2'], ['decor', '1/2'], ['ingredients', '0/3']]);
    expect(m.rows[0].value).toBe('Stone');
    expect(m.rows[0].next).toMatch(/^Copper · \$/);
    expect(m.rows[0].next).toContain('(2 grades)');
    expect(m.rows[1].value).toBe('5 of 15 tiers');
    expect(m.rows[1].next).toMatch(/^5 more tiers · \$/);
    expect(m.rows[2].value).toBe('Store-brand');
    expect(m.rows[2].next).toMatch(/^Imported · \$/);
  });

  it('asks the engine for every price (the Ingredients price is the engine’s)', () => {
    const g = uptown({ grade: 1, tiers: 5, tier: 0 });
    expect(ingredientsPrice(g)).toBeGreaterThan(0);
    expect(m.ingredients).toMatchObject({ name: 'Imported', price: ingredientsPrice(g), canBuy: true, lock: null });
    expect(ovenNext(g)?.steps).toBe(2);
    expect(decorNext(g)?.tiers).toBe(5);
  });
});

describe('the sheet at 4 stars', () => {
  const g = uptown({ grade: 3, tiers: 10, tier: 2 });
  const m = starsSheet(g);
  it('is full pay at 6 of 7 points, one point from the sign', () => {
    expect(m).toMatchObject({ stars: 4, pay: 'full', payWord: 'Full pay' });
    expect(m.progress).toBe('6 of 7 points · next star at 7');
    expect(m.rows.map((r) => r.points)).toEqual(['2/2', '2/2', '2/3']);
    expect(m.rows[0].next).toBe('Maxed');
    expect(m.rows[1].next).toBe('Maxed');
    expect(m.rows[2].next).toMatch(/^Truffle · \$/);
  });

  it('names the critic: the time to the next visit and the target', () => {
    expect(m.criticNext).toMatch(/^Critic in \d+:\d\d$/);
    expect(m.criticTarget).toMatch(/^Target [2-5]★$/);
  });
});

describe('the sheet at 5 stars', () => {
  it('is double pay and everything is maxed', () => {
    const m = starsSheet(uptown({ grade: 4, tiers: 15, tier: 3 }));
    expect(m).toMatchObject({ stars: 5, pay: 'double', payWord: 'Double pay' });
    expect(m.progress).toBe('7 of 7 points');
    expect(m.rows.map((r) => r.next)).toEqual(['Maxed', 'Maxed', 'Maxed']);
    expect(m.ingredients).toMatchObject({ name: null, price: null, canBuy: false });
  });
});

describe('the Ingredients card', () => {
  it('names the tier, the next one and its price; the buy button follows the cash', () => {
    const rich = ingredientsCardModel(uptown({ tier: 1 }));
    expect(rich).toMatchObject({ title: 'Ingredients', level: 'Imported', canBuy: true, lock: null });
    expect(rich.detail).toMatch(/^Farm · \+1 point/);
    expect(rich.cost).toBeGreaterThan(0);
    const poor = ingredientsCardModel(uptown({ tier: 1, cash: 0 }));
    expect(poor.canBuy).toBe(false);
    expect(poor.cost).toBe(rich.cost);
  });

  it('is maxed at Truffle', () => {
    const m = ingredientsCardModel(uptown({ tier: 3 }));
    expect(m).toMatchObject({ level: 'Truffle', cost: null, canBuy: false });
    expect(m.lock).toBeTruthy();
  });

  it('buys through the engine: the price comes out of the cash and the tier moves up', () => {
    const g = uptown({ tier: 0 });
    const price = run(() => ingredientsPrice(g))!;
    const r = run(() => buyIngredients(g));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.cash).toBe(g.cash - price);
      expect(run(() => starsView(r.state).tier)).toBe(1);
    }
    expect(price).toBe(Math.ceil(STARS.ingredients[1].minutes * 60 * shopEarnings(g, 'uptown')));
  });

  it('names the four tiers from the copy', () => {
    expect([0, 1, 2, 3].map(tierName)).toEqual(['Store-brand', 'Imported', 'Farm', 'Truffle']);
  });

  it('draws its button at the tap minimum', () => {
    expect(BUTTON_H).toBeGreaterThanOrEqual(TAP.min);
  });
});
