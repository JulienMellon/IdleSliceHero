/// <reference types="jest" />
import { emitReveal, onReveal, revealWidth, type RecipeNews } from '../reveal-bus';

const item: RecipeNews = { key: 'recipe:recipe.suburbs.4', kind: 'recipe', text: 'Home Field Deep Dish', sub: 'Nobody beats the Mudhens at home. Not anymore.', hood: 'suburbs', n: 4 };

describe('D469: the recipe reveal', () => {
  test('nothing listening: the toast column shows the card instead', () => {
    expect(emitReveal(item)).toBe(false);
  });

  test('a listener gets the card, and stops getting them when it unsubscribes', () => {
    const got: RecipeNews[] = [];
    const off = onReveal((i) => got.push(i));
    expect(emitReveal(item)).toBe(true);
    expect(got).toEqual([item]);
    off();
    expect(emitReveal(item)).toBe(false);
    expect(got).toHaveLength(1);
  });

  test('the card leaves 24 pt either side on an iPhone SE', () => {
    expect(revealWidth(320)).toBe(220);
    expect(revealWidth(393)).toBe(220);
    expect(revealWidth(240)).toBe(192);
    expect(320 - revealWidth(320)).toBeGreaterThanOrEqual(48);
  });
});
