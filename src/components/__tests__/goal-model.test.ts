/// <reference types="jest" />
import { aOrAn, GOAL_BAR, goalBarLayout, goalWords, snapSeam } from '../goal-model';

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

describe('a / an (B5)', () => {
  test('picked from the name\'s first letter', () => {
    expect(aOrAn('Uptown')).toBe('an');
    expect(aOrAn('Industrial')).toBe('an');
    expect(aOrAn('Suburbs')).toBe('a');
    expect(aOrAn('Waterfront')).toBe('a');
    expect(aOrAn('Downtown')).toBe('a');
    expect(aOrAn('university')).toBe('an');
  });
});

describe('goal bar seam snaps to a word edge (G88)', () => {
  // "Downtown:" "Hire" "Marco" and the amount "$15.4M", as the bar lays them out at 14 pt in a 350 pt inner width
  const spans = [
    { x: 12, w: 70 },
    { x: 86, w: 30 },
    { x: 120, w: 46 },
    { x: 290, w: 48 },
  ];
  const inside = (x: number) => spans.some((s) => x > s.x && x < s.x + s.w);
  test('the old code put the seam inside a word at these fractions; the new seam never lands inside any span', () => {
    let hitOld = 0;
    for (let f = 0.01; f < 1; f += 0.01) {
      const raw = f * 350;
      if (inside(raw)) hitOld += 1;
      const b = goalBarLayout(f * 100, 100, false, 354, spans);
      expect(inside(b.fillW)).toBe(false);
    }
    expect(hitOld).toBeGreaterThan(20);
  });
  test('inside a word the seam goes to the nearer end, at most half a word away', () => {
    expect(snapSeam(100, spans)).toBe(86); // 14 of 30 in: back to the start of "Hire"
    expect(snapSeam(105, spans)).toBe(116); // 19 of 30 in: on to its end
    expect(snapSeam(300, spans)).toBe(290); // inside "$15.4M": the amount is never two colours
    expect(snapSeam(330, spans)).toBe(338);
  });
  test('in a gap, the padding, or past the last span the seam stays exactly on the progress', () => {
    for (const x of [3, 10, 84, 118, 200, 340]) expect(snapSeam(x, spans)).toBe(x);
  });
  test('a small fill never vanishes and a full bar stays full', () => {
    expect(goalBarLayout(1, 100, false, 354, spans).fillW).toBeCloseTo(3.5, 6);
    expect(goalBarLayout(100, 100, false, 354, spans).fillW).toBe(350);
    expect(goalBarLayout(100, 100, false, 354, spans).split).toBe(true);
  });
  test('words are split on blanks and the label order is kept', () => {
    expect(goalWords('Downtown:  Hire Marco')).toEqual(['Downtown:', 'Hire', 'Marco']);
    expect(goalWords('')).toEqual([]);
  });
});
