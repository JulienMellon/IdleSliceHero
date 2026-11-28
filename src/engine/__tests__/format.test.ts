/// <reference types="jest" />
import { count, money, rate, shownValue } from '../format';

describe('money', () => {
  test('ordinary values', () => {
    expect([0, 5, 9.5, 999, 1000, 1234, 15_000, 9.5e6].map((n) => money(n))).toEqual(['$0', '$5', '$9', '$999', '$1K', '$1.23K', '$15K', '$9.5M']);
    expect(money(3900, true)).toBe('$3.90K');
    expect(money(-1234)).toBe('-$1.23K');
  });

  test('v5.25: every amount is a whole number rounded down, the only decimal point is inside a K/M suffix form', () => {
    expect([0.4, 0.6, 12.5, 999.9, 1500, 1.5e6].map((n) => money(n))).toEqual(['$0', '$0', '$12', '$999', '$1.5K', '$1.5M']);
    expect([0.4, 0.6, 12.5, 999.9, 1500, 1.5e6].map((n) => count(n))).toEqual(['0', '0', '12', '999', '1.5K', '1.5M']);
    expect(money(-0.6)).toBe('$0');
    expect(money(-12.5)).toBe('-$12');
    expect(money(NaN)).toBe('$0');
    // no amount under 1000 ever prints a decimal point, however fractional it is
    for (let n = 0; n < 1000; n += 0.37) expect(money(n)).toMatch(/^\$\d+$/);
  });

  test('v5.25: a rate under $1/s is $N/min, under $1/min is <$1/min, the rest is $N/s', () => {
    expect([0.4, 0.6, 12.5, 999.9, 1500, 1.5e6].map((n) => rate(n))).toEqual(['$24/min', '$36/min', '$12/s', '$999/s', '$1.5K/s', '$1.5M/s']);
    expect(rate(1)).toBe('$1/s');
    expect(rate(0.99)).toBe('$59/min');
    expect(rate(1 / 60)).toBe('$1/min');
    expect(rate(0.01)).toBe('<$1/min');
    expect(rate(0)).toBe('<$1/min');
    expect(rate(NaN)).toBe('<$1/min');
    expect(rate(-3)).toBe('<$1/min');
    for (const n of [0.004, 0.4, 0.99, 1, 7.77, 12.5, 999.9]) expect(rate(n)).not.toMatch(/\./);
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
    expect(shownValue(7.26)).toBe(7);
    expect(shownValue(-999_999)).toBe(-1_000_000);
  });
});
