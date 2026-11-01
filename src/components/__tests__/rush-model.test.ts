/// <reference types="jest" />
import { rushBoost, rushCombo, rushPill } from '../rush-model';

describe('rushCombo', () => {
  test('counts taps in the last 1.5 s and the taps per second over that window', () => {
    const c = rushCombo([0, 500, 900, 1400, 2000, 2400], 2500);
    expect(c.n).toBe(3); // 1400, 2000, 2400; 900 is 1.6 s old
    expect(c.perSec).toBeCloseTo(2, 9);
  });
  test('a tap exactly 1.5 s old still counts; older does not', () => {
    expect(rushCombo([1000], 2500).n).toBe(1);
    expect(rushCombo([999], 2500).n).toBe(0);
  });
  test('no taps is zero, not NaN', () => {
    expect(rushCombo([], 1000)).toEqual({ n: 0, perSec: 0 });
  });
});

describe('rushBoost', () => {
  test('the kitchen speeds up by 0.25 per tap/s while demand has room', () => {
    expect(rushBoost(2, 1, 100)).toBeCloseTo(0.5, 9);
    expect(rushBoost(1, 1, 100)).toBeCloseTo(0.25, 9);
  });
  test('counted up to 4 taps/s, so the boost stops at +100%', () => {
    expect(rushBoost(50, 1, 1e9)).toBeCloseTo(1, 9);
    expect(rushBoost(4, 1, 1e9)).toBeCloseTo(1, 9);
  });
  test('it can not sell past demand', () => {
    expect(rushBoost(3, 10, 15)).toBeCloseTo(0.5, 9); // headroom 15/10 − 1
    expect(rushBoost(3, 10, 10)).toBe(0);
    expect(rushBoost(3, 10, 4)).toBe(0); // demand below the kitchen: never negative
  });
  test('no taps, no boost; a dead kitchen is not a NaN', () => {
    expect(rushBoost(0, 5, 50)).toBe(0);
    expect(rushBoost(2, 0, 50)).toBe(0);
  });
});

describe('rushPill', () => {
  const base = { managed: true, kitchenRate: 1, demandRate: 100 };
  test('only a General Manager shop has a rush', () => {
    expect(rushPill({ ...base, managed: false, taps: [], now: 99_000 })).toBeNull();
    expect(rushPill({ ...base, managed: false, taps: [98_900, 98_950, 99_000], now: 99_000 })).toBeNull();
  });
  test('a managed shop with no rush tap in the last 8 s shows the hint', () => {
    expect(rushPill({ ...base, taps: [], now: 50_000 })).toEqual({ kind: 'hint', text: 'Tap to rush!' });
    expect(rushPill({ ...base, taps: [41_000], now: 50_000 })?.kind).toBe('hint');
  });
  test('the hint goes quiet for 8 s after a tap', () => {
    expect(rushPill({ ...base, taps: [42_500], now: 50_000 })).toBeNull();
    expect(rushPill({ ...base, taps: [49_500], now: 50_000 })).toBeNull(); // one slow tap: neither
  });
  test('2+ taps/s shows the combo with the tap count and the boost', () => {
    const taps = [48_900, 49_300, 49_700, 50_000]; // 4 in 1.5 s = 2.67 taps/s
    const p = rushPill({ ...base, taps, now: 50_000 });
    const pct = Math.round(rushBoost(4 / 1.5, 1, 100) * 100);
    expect(p).toEqual({ kind: 'combo', text: `RUSH ×4 · +${pct}%` });
  });
  test('three taps in the window is exactly 2 taps/s: a combo', () => {
    expect(rushPill({ ...base, taps: [49_000, 49_500, 50_000], now: 50_000 })).toEqual({ kind: 'combo', text: 'RUSH ×3 · +50%' });
  });
  test('two taps in the window are below 2 taps/s', () => {
    expect(rushPill({ ...base, taps: [49_500, 50_000], now: 50_000 })).toBeNull();
  });
  test('the percentage is capped by demand', () => {
    const p = rushPill({ ...base, kitchenRate: 10, demandRate: 12, taps: [49_000, 49_500, 50_000], now: 50_000 });
    expect(p).toEqual({ kind: 'combo', text: 'RUSH ×3 · +20%' });
  });
});
