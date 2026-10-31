/// <reference types="jest" />
import { GOAL_BAR, goalBarLayout } from '../goal-model';

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

describe('goal bar two-tone label (D297)', () => {
  test('both halves of the label read at 4.5:1 or better: cream on the fill, ink on the track', () => {
    expect(contrast(GOAL_BAR.onFill, GOAL_BAR.fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(GOAL_BAR.onTrack, GOAL_BAR.track)).toBeGreaterThanOrEqual(4.5);
  });
  test('the cream copy is clipped to exactly the fill width, at every fraction', () => {
    for (const f of [0.01, 0.1, 0.25, 0.5, 0.74, 0.99]) {
      const b = goalBarLayout(f * 80, 80, false, 354);
      expect(b.split).toBe(true);
      expect(b.fillW).toBeCloseTo(f * (354 - 2 * GOAL_BAR.border), 6);
      expect(b.fillW).toBeLessThan(b.innerW);
    }
  });
  test('nothing to split when empty, unmeasured, or ready to tap (all white on basil)', () => {
    expect(goalBarLayout(0, 80, false, 354).split).toBe(false);
    expect(goalBarLayout(40, 80, false, 0).split).toBe(false);
    const ready = goalBarLayout(80, 80, true, 354);
    expect(ready.ready).toBe(true);
    expect(ready.split).toBe(false);
  });
  test('a full bar with nothing to tap is all fill, so the whole label is cream', () => {
    const b = goalBarLayout(24, 24, false, 354);
    expect(b.ready).toBe(false);
    expect(b.fillW).toBe(b.innerW);
    expect(b.split).toBe(true);
  });
  test('a zero or broken target never gives NaN', () => {
    for (const [c, t] of [[0, 0], [5, 0], [Number.NaN, 10], [10, Number.NaN]]) {
      const b = goalBarLayout(c, t, true, 354);
      expect(Number.isNaN(b.pct)).toBe(false);
      expect(Number.isNaN(b.fillW)).toBe(false);
    }
  });
});
