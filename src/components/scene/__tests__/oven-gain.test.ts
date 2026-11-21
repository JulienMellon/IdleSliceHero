/// <reference types="jest" />
// v5.20 D522: the oven wears its level and its gain while the tutorial looks at the ovens; the plaque stays on the oven the coach lights.
import { HOME_CITY } from '../../../content/cities/home';
import { newShop, ovenRate } from '../../../engine/game';
import { MIN_OVEN_W } from '../layout';
import { shopLayout } from '../shop-layout';
import { D, P, kAt } from '../projection';
import { GAIN_BAND_H, GAIN_PILL_H, GAIN_W, gainAnchor, ovenGain } from '../oven-gain';

const shop = (ovens: number, fp = 0) => ({ ...newShop(true), footprint: fp, ovens });

describe('ovenGain (D522)', () => {
  test('nothing at level 1; at level 2 the percent is the oven speed gained over the level before', () => {
    expect(ovenGain(shop(1), HOME_CITY.fit)).toBeNull();
    const g = ovenGain(shop(2), HOME_CITY.fit)!;
    expect(g.level).toBe(2);
    const a = ovenRate(shop(1), HOME_CITY.fit);
    const b = ovenRate(shop(2), HOME_CITY.fit);
    expect(g.pct).toBe(Math.round((b / a - 1) * 100));
    expect(g.pct).toBeGreaterThanOrEqual(1);
  });
});

describe('the plaque sits on the oven (D522)', () => {
  test('it is no wider than the thinnest oven and lies inside the highest oven’s face, at every footprint with one oven or two', () => {
    expect(GAIN_W).toBeLessThanOrEqual(MIN_OVEN_W * kAt(D)); // the back wall is drawn smaller than the room
    for (const fp of [0, 1, 2, 3, 4])
      for (const n of [1, 2]) {
        const lay = shopLayout('downtown', shop(1 + (n - 1) * 8, fp), HOME_CITY).draw;
        const at = gainAnchor(lay);
        const top = lay.ovens.reduce((a, o) => (o.z + o.h > a.z + a.h ? o : a), lay.ovens[0]);
        const a = P(top.x0, D, top.z);
        const b = P(top.x1, D, top.z + top.h);
        const x0 = Math.min(a[0], b[0]);
        const x1 = Math.max(a[0], b[0]);
        const y0 = Math.min(a[1], b[1]);
        const y1 = Math.max(a[1], b[1]);
        expect([fp, n, at.x - GAIN_W / 2 >= x0 - 1e-6, at.x + GAIN_W / 2 <= x1 + 1e-6]).toEqual([fp, n, true, true]);
        expect([fp, n, at.y - GAIN_BAND_H >= y0, at.y + 1 + GAIN_PILL_H <= y1]).toEqual([fp, n, true, true]);
      }
  });
});
