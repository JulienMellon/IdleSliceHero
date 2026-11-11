/// <reference types="jest" />
import { count, money, shownValue } from '../format';

describe('money', () => {
  test('ordinary values', () => {
    expect([0, 5, 9.5, 999, 1000, 1234, 15_000, 9.5e6].map((n) => money(n))).toEqual(['$0', '$5', '$9.5', '$999', '$1K', '$1.23K', '$15K', '$9.5M']);
    expect(money(3900, true)).toBe('$3.90K');
    expect(money(-1234)).toBe('-$1.23K');
  });

  test('C109: rounding up to 1000 in a tier moves to the next tier, never "$1000K"', () => {
    expect(money(999_499)).toBe('$999K');
    expect(money(999_500)).toBe('$1M');
    expect(money(999_999)).toBe('$1M');
    expect(money(999_999, true)).toBe('$1.00M');
    expect(money(999_999_999)).toBe('$1B');
    expect(money(999_500_000_000)).toBe('$1T');
    expect(money(-999_999)).toBe('-$1M');
    expect(count(999_999)).toBe('1M');
    // every tier, across the rounding edge
    for (let tier = 1; tier < 11; tier++) {
      const edge = 999.6 * Math.pow(1000, tier);
      expect(money(edge)).not.toMatch(/1000/);
      expect(money(edge)).toMatch(/^\$1[A-Za-z]+$/);
    }
  });

  test('shownValue agrees with what money() prints, so summed rows match', () => {
    expect(shownValue(999_999)).toBe(1_000_000);
    expect(shownValue(999_499)).toBe(999_000);
    expect(shownValue(1234)).toBeCloseTo(1230, 6);
    expect(shownValue(7.26)).toBe(7.3);
    expect(shownValue(-999_999)).toBe(-1_000_000);
  });
});
