/// <reference types="jest" />
import { HINT_PERIOD_MS, HINT_VISIT_MS, inHintWindow, rushBoost, rushCombo, rushHeadroom, rushPill } from '../rush-model';

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

describe('rushHeadroom', () => {
  test('how much more customers want than the kitchen makes; a dead kitchen is 0, not Infinity', () => {
    expect(rushHeadroom(10, 12)).toBeCloseTo(0.2, 9);
    expect(rushHeadroom(10, 10)).toBe(0);
    expect(rushHeadroom(0, 50)).toBe(0);
  });
});

describe('inHintWindow (D406)', () => {
  test('3 s from the visit, then 3 s every 60 s', () => {
    const v = 10_000;
    expect(inHintWindow(v, v)).toBe(true);
    expect(inHintWindow(v + HINT_VISIT_MS - 1, v)).toBe(true);
    expect(inHintWindow(v + HINT_VISIT_MS, v)).toBe(false);
    expect(inHintWindow(v + 30_000, v)).toBe(false);
    expect(inHintWindow(v + HINT_PERIOD_MS - 1, v)).toBe(false);
    expect(inHintWindow(v + HINT_PERIOD_MS, v)).toBe(true);
    expect(inHintWindow(v + HINT_PERIOD_MS + HINT_VISIT_MS, v)).toBe(false);
    expect(inHintWindow(v + 5 * HINT_PERIOD_MS + 2_999, v)).toBe(true);
  });
  test('a clock step back counts as the start of the visit', () => {
    expect(inHintWindow(5_000, 10_000)).toBe(true);
  });
  test('over a visit the hint is up for about 5% of the time, not always', () => {
    let up = 0;
    for (let t = 0; t < 600_000; t += 200) if (inHintWindow(t, 0)) up++;
    expect(up / 3000).toBeLessThan(0.07);
    expect(up / 3000).toBeGreaterThan(0.04);
  });
});

describe('rushPill', () => {
  // a visit that opened at 50 s; "now" 50 s is the first second of it
  const base = { managed: true, kitchenRate: 1, demandRate: 100, visitAt: 50_000 };
  const NOW = 50_000;
  test('only a General Manager shop has a rush', () => {
    expect(rushPill({ ...base, managed: false, taps: [], now: NOW })).toBeNull();
    expect(rushPill({ ...base, managed: false, taps: [NOW - 100, NOW - 50, NOW], now: NOW })).toBeNull();
  });
  test('a managed shop with no rush tap in the last 8 s shows the pulsing hint at the start of the visit', () => {
    expect(rushPill({ ...base, taps: [], now: NOW })).toEqual({ kind: 'hint', text: 'Tap to rush!', pulse: true });
    expect(rushPill({ ...base, taps: [NOW - 9_000], now: NOW + 1_000 })?.kind).toBe('hint');
  });
  test('the hint goes quiet for 8 s after a tap', () => {
    expect(rushPill({ ...base, taps: [NOW - 7_500], now: NOW })).toBeNull();
    expect(rushPill({ ...base, taps: [NOW - 500], now: NOW })).toBeNull(); // one slow tap: neither
  });
  test('D406: the hint is up 3 s per visit and 3 s every minute, not all the time', () => {
    expect(rushPill({ ...base, taps: [], now: NOW + 2_999 })?.kind).toBe('hint');
    expect(rushPill({ ...base, taps: [], now: NOW + 3_000 })).toBeNull();
    expect(rushPill({ ...base, taps: [], now: NOW + 30_000 })).toBeNull();
    expect(rushPill({ ...base, taps: [], now: NOW + 60_000 })?.kind).toBe('hint');
    expect(rushPill({ ...base, taps: [], now: NOW + 63_000 })).toBeNull();
  });
  test('G86: no hint when demand is the limit (under 10% headroom)', () => {
    expect(rushPill({ ...base, kitchenRate: 10, demandRate: 10, taps: [], now: NOW })).toBeNull();
    expect(rushPill({ ...base, kitchenRate: 10, demandRate: 10.9, taps: [], now: NOW })).toBeNull();
    expect(rushPill({ ...base, kitchenRate: 10, demandRate: 5, taps: [], now: NOW })).toBeNull();
    expect(rushPill({ ...base, kitchenRate: 10, demandRate: 11, taps: [], now: NOW })?.kind).toBe('hint');
    expect(rushPill({ ...base, kitchenRate: 0, demandRate: 11, taps: [], now: NOW })).toBeNull();
  });
  test('2+ taps/s shows the combo with the tap count and the boost', () => {
    const taps = [NOW - 1_100, NOW - 700, NOW - 300, NOW]; // 4 in 1.5 s = 2.67 taps/s
    const p = rushPill({ ...base, taps, now: NOW });
    const pct = Math.round(rushBoost(4 / 1.5, 1, 100) * 100);
    expect(p).toEqual({ kind: 'combo', text: `RUSH ×4 · +${pct}%`, pulse: false });
  });
  test('the combo shows outside the hint window too', () => {
    expect(rushPill({ ...base, taps: [NOW + 29_000, NOW + 29_500, NOW + 30_000], now: NOW + 30_000 })?.kind).toBe('combo');
  });
  test('three taps in the window is exactly 2 taps/s: a combo', () => {
    expect(rushPill({ ...base, taps: [NOW - 1_000, NOW - 500, NOW], now: NOW })).toEqual({ kind: 'combo', text: 'RUSH ×3 · +50%', pulse: false });
  });
  test('two taps in the window are below 2 taps/s', () => {
    expect(rushPill({ ...base, taps: [NOW - 500, NOW], now: NOW })).toBeNull();
  });
  test('the percentage is capped by demand', () => {
    const p = rushPill({ ...base, kitchenRate: 10, demandRate: 12, taps: [NOW - 1_000, NOW - 500, NOW], now: NOW });
    expect(p).toEqual({ kind: 'combo', text: 'RUSH ×3 · +20%', pulse: false });
  });
  test('G86: a combo with no boost left says what is missing, not "+0%"', () => {
    const taps = [NOW - 1_000, NOW - 500, NOW];
    expect(rushPill({ ...base, kitchenRate: 10, demandRate: 10, taps, now: NOW })).toEqual({ kind: 'combo', text: 'RUSH ×3 · need drivers', pulse: false });
    expect(rushPill({ ...base, kitchenRate: 10, demandRate: 4, taps, now: NOW })?.text).toBe('RUSH ×3 · need drivers');
  });
});
