/// <reference types="jest" />
// The free gift's box (v5.25, card S7): one fixed free place in every shop (never on a head, the badges, the doorway, the WELCOME mat, a station or a decor thing), a size that reads at
// 1x, a tap that reaches 44 pt, a bob and a glint that stop under Reduce Motion, and a drawing with no lettering (a node test cannot import the .tsx, so it reads the source).
import * as fs from 'fs';
import * as path from 'path';

import { CITIES, hoodIds } from '../../../content/cities';
import { RENO_SHOPS } from '../../../content/renovation';
import * as G from '../../../engine/game';
import { badgeBand, doorRect, fixedPeople, hits, matRect } from '../ladder';
import { COVER_MAX, coveredShare } from '../protected';
import { GIFT_BOB_AMP, GIFT_GLINT_EVERY, GIFT_GLINT_LEN, giftHit, giftPose } from '../gift';
import { giftSpot, renoSpots } from '../renovation-art';
import { shopLayout } from '../shop-layout';
import { stationRects } from '../stations';

const lv = (fp: number, n: number): G.Shop => ({ ...G.newShop(true), footprint: fp, ovens: n, prep: n, counter: n, tables: n });

describe('the gift box has one clear place in every shop', () => {
  for (const city of Object.values(CITIES))
    hoodIds(city).forEach((id, i) => {
      const set = RENO_SHOPS[i];
      test.each([0, 1, 2, 3, 4].filter((fp) => fp < city.fit.footprints.length).flatMap((fp) => [1, 30, 100].map((n) => [fp, n] as const)))(
        `${city.id} ${id}: footprint %i, stations at level %i`,
        (fp, n) => {
          const { draw } = shopLayout(id, lv(fp, n), city);
          const people = fixedPeople(draw);
          const st = stationRects(draw, 44);
          for (const vehicle of [0, 2, 3])
            for (const idle of [false, true]) {
              const g = giftSpot(draw, id, vehicle, idle);
              expect(g).not.toBeNull();
              const r = g!.rect;
              const bad: string[] = [];
              if (r.x1 - r.x0 < 10 || r.y1 - r.y0 < 10) bad.push('under 10 pt at 1x');
              if (hits(r, badgeBand(draw))) bad.push('over the badges');
              if (hits(r, doorRect(draw))) bad.push('over the doorway');
              if (coveredShare(matRect(draw), r) > COVER_MAX) bad.push('over the mat');
              if (r.x0 < draw.frame.x0 || r.x1 > draw.frame.x0 + draw.frame.width) bad.push('off the frame');
              for (const p of people) if (hits(r, p.head)) bad.push('over a head');
              for (const k of ['prep', 'oven', 'counter'] as const) if (coveredShare(st[k], r) > COVER_MAX) bad.push(`over the ${k} station`);
              // the decor goes round it, whether or not the shop is renovated
              for (const d of renoSpots(draw, set, id, vehicle, idle)) if (hits(r, d.rect)) bad.push(`over the ${d.thing}`);
              expect(bad).toEqual([]);
            }
        },
      );
    });
  test('the place is fixed: the same every time, and the same whatever the shop wears', () => {
    const { draw } = shopLayout('downtown', lv(1, 30), CITIES.home);
    expect(giftSpot(draw, 'downtown', 1)).toEqual(giftSpot(draw, 'downtown', 1));
    expect(giftSpot(draw, 'downtown', 1)?.thing).toBe('gift');
  });
  test('the mirrored plan flips it with the room', () => {
    const mirrored = Object.values(CITIES)
      .flatMap((c) => hoodIds(c).map((id) => ({ c, id })))
      .map(({ c, id }) => ({ id, ...shopLayout(id, lv(1, 30), c) }))
      .find((x) => x.draw.mirrored);
    expect(mirrored).toBeDefined();
    const g = giftSpot(mirrored!.draw, mirrored!.id, 1)!;
    expect(g.rect.x1).toBeGreaterThan(g.rect.x0);
    expect(g.ax).toBeGreaterThan(g.rect.x0);
    expect(g.ax).toBeLessThan(g.rect.x1);
  });
});

describe('the tap', () => {
  const rect = { x0: 100, y0: 300, x1: 118, y1: 317 };
  test('lands on the box and on the 44 pt around its middle, not beyond', () => {
    for (const s of [0.95, 1, 1.11]) {
      const reach = 22 / s;
      expect(giftHit(rect, 109, 308, s)).toBe(true);
      expect(giftHit(rect, 109 + reach - 0.5, 308, s)).toBe(true);
      expect(giftHit(rect, 109, 308 - reach + 0.5, s)).toBe(true);
      expect(giftHit(rect, 109 + reach + 1, 308, s)).toBe(false);
      expect(giftHit(rect, 109, 308 + reach + 1, s)).toBe(false);
    }
  });
});

describe('while it waits', () => {
  test('it bobs gently, in steps, and comes back to rest each cycle', () => {
    const bobs = Array.from({ length: 200 }, (_, i) => giftPose(i * 0.05).bob);
    expect(Math.min(...bobs)).toBe(0);
    expect(Math.max(...bobs)).toBeGreaterThan(GIFT_BOB_AMP * 0.8);
    expect(Math.max(...bobs)).toBeLessThanOrEqual(GIFT_BOB_AMP + 0.2);
    expect(new Set(bobs).size).toBeLessThanOrEqual(8);
  });
  test('a glint sweeps for under a second every few seconds, and not between', () => {
    expect(giftPose(0.1).glint).toBeGreaterThan(0);
    expect(giftPose(GIFT_GLINT_LEN + 0.1).glint).toBe(0);
    expect(giftPose(GIFT_GLINT_EVERY - 0.1).glint).toBe(0);
    expect(giftPose(GIFT_GLINT_EVERY + 0.1).glint).toBeGreaterThan(0);
    expect(giftPose(GIFT_GLINT_EVERY * 5 + GIFT_GLINT_LEN - 0.01).glint).toBe(1);
  });
  test('under Reduce Motion it stands still: no bob, no glint', () => {
    for (const t of [0, 0.3, 1.1, 4.1, 99]) expect(giftPose(t, true)).toEqual({ bob: 0, glint: 0 });
  });
  test('the drawing has no text', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../gift-box.tsx'), 'utf8');
    expect(src).not.toMatch(/SvgText|<Text|fontSize/);
  });
});
