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

import { badgeModels, popModels, ringSteps, COIN_FLIGHT } from '../stations';
import { emptyLine } from '../../../engine/pipeline';
import { SCENE_W } from '../projection';

describe('codecritic round 16', () => {
  const base = { auto: { prep: false, oven: false, counter: false }, managed: false, neck: new Set<'prep' | 'oven' | 'counter'>(), tapBatch: 4, since: 0 };
  test('T53: a GM shop shows its runner on every station; a tapped shop has exactly one ready station', () => {
    const gm = badgeModels({ ...base, line: emptyLine(), auto: { prep: true, oven: true, counter: true }, managed: true, next: null });
    expect(gm.map((b) => b.runner)).toEqual(['gm', 'gm', 'gm']);
    const tapped = badgeModels({ ...base, line: { ...emptyLine(), prepped: 4 }, next: 'oven' });
    expect(tapped.filter((b) => b.ready).map((b) => b.st)).toEqual(['oven']);
    expect(tapped[0].count).toBe('×4'); // D350: the idle prep table shows its next batch
    expect(tapped[1].count).toBe('4');
  });
  test('T53: step is never NaN, even for a zero-length job, and changes at most ~8 times a second', () => {
    const z = badgeModels({ ...base, line: { ...emptyLine(), oven: { n: 4, left: 0, total: 0 } }, next: null });
    expect(Number.isNaN(z[1].step)).toBe(false);
    expect(ringSteps(1.6)).toBe(13);
    expect(ringSteps(30)).toBe(24);
  });
  test('G80: every tied station is tomato', () => {
    const t = badgeModels({ ...base, line: emptyLine(), neck: new Set(['prep', 'oven'] as const), next: 'prep' });
    expect(t.map((b) => b.tone)).toEqual(['tomato', 'tomato', 'basil']);
  });
  test('T52: a fresh walk-in and a fresh driver both pop; at most 2 pops; merged cash adds up', () => {
    const deps = [
      { kind: 'driver' as const, n: 4, cash: 12, left: 1.2 },
      { kind: 'walkin' as const, n: 4, cash: 12, left: 0.5 },
      { kind: 'driver' as const, n: 6, cash: 18, left: 1.1 },
      { kind: 'driver' as const, n: 6, cash: 18, left: COIN_FLIGHT - 0.1 },
    ];
    const p = popModels(deps, (d) => d.left);
    expect(p.length).toBe(2);
    expect(p.some((x) => x.dep.kind === 'walkin')).toBe(true);
    expect(p.reduce((t, x) => t + x.cash, 0)).toBe(12 + 12 + 18);
  });
  test('T54: where station rects overlap, the front-most wins (synthetic overlap), and real layouts never put the oven over the counter', () => {
    const r = { counter: { x0: 0, y0: 0, x1: 50, y1: 50 }, prep: { x0: 100, y0: 0, x1: 150, y1: 50 }, oven: { x0: 25, y0: 25, x1: 75, y1: 75 } };
    expect(stationAt(r, 40, 40)).toBe('counter');
    expect(stationAt(r, 60, 60)).toBe('oven');
    for (const lay of shops)
      for (const s of [0.86, 1, 1.12]) {
        const rr = stationRects(lay, MIN_TAP_PT / s);
        const x0 = Math.max(rr.oven.x0, rr.counter.x0);
        const x1 = Math.min(rr.oven.x1, rr.counter.x1);
        const y0 = Math.max(rr.oven.y0, rr.counter.y0);
        const y1 = Math.min(rr.oven.y1, rr.counter.y1);
        if (x0 < x1 && y0 < y1) expect(stationAt(rr, (x0 + x1) / 2, (y0 + y1) / 2)).toBe('counter');
      }
  });
  test('T55: every badge and the counter pill stay on screen', () => {
    for (const lay of shops) {
      const x = badgeXs(lay);
      expect(x.prep - BADGE_R).toBeGreaterThanOrEqual(0);
      expect(x.counter + BADGE_R + 3 + 40).toBeLessThanOrEqual(SCENE_W);
    }
  });
});
