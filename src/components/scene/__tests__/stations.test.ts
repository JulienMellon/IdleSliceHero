/// <reference types="jest" />
// Station tap targets and the badge row (playtest 2, v4.8).
import { layout } from '../layout';
import { badgeRowY, badgeXs, BADGE_R, HIT_ORDER, MIN_TAP_PT, progressStep, stationAt, stationRects } from '../stations';
import { P, FRONT_TOP, D } from '../projection';

const shops = [
  layout(0, 1, 1, 1, 1, 2),
  layout(1, 2, 2, 1, 3, 2),
  layout(2, 3, 2, 2, 4, 3),
  layout(3, 4, 3, 2, 5, 3),
  layout(4, 6, 3, 2, 6, 4),
];
// iPhone SE-ish (smallest fit) through Pro Max
const fits = [0.86, 1, 1.12];

describe('station tap targets', () => {
  test('every station target is at least 44 pt on every screen', () => {
    for (const lay of shops)
      for (const s of fits) {
        const r = stationRects(lay, MIN_TAP_PT / s);
        for (const st of HIT_ORDER) {
          expect((r[st].x1 - r[st].x0) * s).toBeGreaterThanOrEqual(MIN_TAP_PT - 1e-6);
          expect((r[st].y1 - r[st].y0) * s).toBeGreaterThanOrEqual(MIN_TAP_PT - 1e-6);
        }
      }
  });
  test('a tap on each station’s furniture lands on that station', () => {
    for (const lay of shops) {
      const r = stationRects(lay, MIN_TAP_PT);
      const ov = lay.ovenCols;
      expect(stationAt(r, ...P((lay.prep.x0 + lay.prep.x1) / 2, 75, 20))).toBe('prep');
      expect(stationAt(r, ...P((lay.counter.x0 + lay.counter.x1) / 2, 74, 30))).toBe('counter');
      expect(stationAt(r, ...P((ov[0].x0 + ov[ov.length - 1].x1) / 2, D, 50))).toBe('oven');
    }
  });
  test('the counter wins where it overlaps the oven bank (front-most first)', () => {
    expect(HIT_ORDER[0]).toBe('counter');
    const lay = shops[4];
    const r = stationRects(lay, MIN_TAP_PT);
    const x = Math.max(r.oven.x0, r.counter.x0) + 1;
    const y = Math.max(r.oven.y0, r.counter.y0) + 1;
    if (x < Math.min(r.oven.x1, r.counter.x1) && y < Math.min(r.oven.y1, r.counter.y1)) expect(stationAt(r, x, y)).toBe('counter');
  });
  test('a tap on the sky or the sidewalk lands nowhere', () => {
    const r = stationRects(shops[0], MIN_TAP_PT);
    expect(stationAt(r, 20, 20)).toBeNull();
    expect(stationAt(r, 200, 560)).toBeNull();
  });
});

describe('badge row', () => {
  test('sits under the name plank and above the back-wall props in every footprint', () => {
    const plank = P(0, 0, FRONT_TOP - 20)[1];
    const shelfTop = P(0, D, 104)[1] - 19; // flour sacks
    const menuTop = P(0, D, 180)[1]; // the menu board's top edge (room.tsx, fp ≥ 1)
    expect(badgeRowY() - BADGE_R - 2).toBeGreaterThan(plank);
    expect(badgeRowY() + BADGE_R).toBeLessThan(Math.min(shelfTop, menuTop));
  });
  test('badges and their count pills never overlap each other', () => {
    for (const lay of shops) {
      const x = badgeXs(lay);
      expect(x.oven - x.prep).toBeGreaterThanOrEqual(BADGE_R * 4.6 - 1e-6);
      expect(x.counter - x.oven).toBeGreaterThanOrEqual(BADGE_R * 4.6 - 1e-6);
    }
  });
  test('progress snaps to 24 steps', () => {
    expect([0, 0.04, 0.5, 0.999, 1, 2].map(progressStep)).toEqual([0, 0, 12, 23, 24, 24]);
  });
});
