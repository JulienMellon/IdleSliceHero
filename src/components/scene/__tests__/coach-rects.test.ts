/// <reference types="jest" />
// v5.20 card C2: the shop tells the Coach where its stations, their dials and the oven bank are on the screen, so the overlay can light a station with its dial.
import { HOME_CITY } from '../../../content/cities/home';
import { newShop } from '../../../engine/game';
import type { Rect } from '../../coach/targets';
import { coachReporter, coachRects, DIAL_PILL, OVEN_HEAD_PT, DIAL_R, SCENE_TARGETS } from '../coach-rects';
import { D, P, openScroll, sceneToScreen, sceneView } from '../projection';
import { shopLayout } from '../shop-layout';
import { BADGE_R, badgeXs } from '../stations';

const SCREENS = [
  { w: 393, h: 852 },
  { w: 375, h: 667 },
  { w: 430, h: 932 },
];
const origin = { x: 0, y: 59 };

/** Downtown with `ovens` ovens bought at footprint `fp` (an oven slot opens every 8 levels). */
function shopAt(fp: number, ovens: number) {
  const shop = { ...newShop(true), footprint: fp, ovens: 1 + (ovens - 1) * 8 };
  return shopLayout('downtown', shop, HOME_CITY).draw;
}
const inside = (r: Rect, w: number, h: number) => r.x0 >= 0 && r.y0 >= 0 && r.x1 <= w && r.y1 <= h;
const holds = (a: Rect, b: Rect) => a.x0 <= b.x0 + 1e-6 && a.y0 <= b.y0 + 1e-6 && a.x1 >= b.x1 - 1e-6 && a.y1 >= b.y1 - 1e-6;
const union = (a: Rect, b: Rect): Rect => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) });
/** The lowest edge of the oven faces drawn, in screen points (origin as the tests use it). */
const bottomOf = (lay: ReturnType<typeof shopAt>, fit: ReturnType<typeof sceneView>['fit']) =>
  origin.y + fit.oy + Math.max(...lay.ovens.map((o) => P(o.x0, D, o.z)[1])) * fit.s;
const area = (r: Rect) => (r.x1 - r.x0) * (r.y1 - r.y0);
const mid = (r: Rect) => (r.x0 + r.x1) / 2;

// every footprint, one oven and two (two slots are open from the first footprint)
const CASES = [0, 1, 2, 3, 4].flatMap((fp) => [1, 2].map((ovens) => ({ fp, ovens })));

describe('coachRects (v5.20 C2)', () => {
  test('reports every scene target, each a real rect', () => {
    const lay = shopAt(0, 1);
    const view = sceneView(393, 852, lay.frame);
    const r = coachRects(lay, view.fit, 0, origin);
    expect(Object.keys(r).sort()).toEqual([...SCENE_TARGETS].sort());
    for (const t of SCENE_TARGETS) {
      expect(r[t].x1).toBeGreaterThan(r[t].x0);
      expect(r[t].y1).toBeGreaterThan(r[t].y0);
    }
  });

  test('a dial is the badge circle (BADGE_R + 4) in points plus its count pill on the right, whatever the screen', () => {
    for (const { w, h } of SCREENS)
      for (const { fp, ovens } of CASES) {
        const lay = shopAt(fp, ovens);
        const { fit } = sceneView(w, h, lay.frame);
        const r = coachRects(lay, fit, 0, origin);
        const xs = badgeXs(lay);
        for (const st of ['prep', 'oven', 'counter'] as const) {
          const d = r[`dial:${st}`];
          expect(DIAL_R).toBe(BADGE_R + 4);
          const cx = origin.x + sceneToScreen(xs[st] - lay.frame.x0, 0, fit);
          expect(d.y1 - d.y0).toBeCloseTo(2 * DIAL_R * fit.s, 6);
          expect(cx - d.x0).toBeCloseTo(DIAL_R * fit.s, 6);
          // G112: the pill of a one- or two-character count ("0", "×4", "12": 6.2 a character + 10, at least 18) lies inside the dial
          for (const chars of [1, 2]) expect(cx + (BADGE_R + 3 + Math.max(18, chars * 6.2 + 10)) * fit.s).toBeLessThanOrEqual(d.x1 + 1e-6);
          // …and it stops short of the next dial's ring
          const next = st === 'prep' ? 'oven' : st === 'oven' ? 'counter' : null;
          if (next) {
            const gap = Math.abs(xs[next] - xs[st]);
            if (!lay.mirrored) expect(BADGE_R + 3 + DIAL_PILL).toBeLessThanOrEqual(gap - DIAL_R + 1e-6);
          }
        }
      }
  });

  test('each dial lies inside the screen: at once in a one-screen shop, once scrolled to it in a wide one', () => {
    const bad: string[] = [];
    for (const { w, h } of SCREENS)
      for (const { fp, ovens } of CASES) {
        const lay = shopAt(fp, ovens);
        const view = sceneView(w, h, lay.frame);
        const xs = badgeXs(lay);
        for (const st of ['prep', 'oven', 'counter'] as const) {
          const at = view.scrolls ? openScroll(xs[st] - lay.frame.x0, view.fit.s, w, view.maxScroll) : 0;
          const d = coachRects(lay, view.fit, at, { x: 0, y: 0 })[`dial:${st}`];
          if (!inside(d, w, h)) bad.push(`${w}x${h} fp${fp} ${ovens} ovens ${st}: ${JSON.stringify(d)}`);
        }
      }
    expect(bad).toEqual([]);
  });

  test('the oven step lights the station and its dial together: the union holds both, on the screen, at the scroll the oven is centred on', () => {
    const bad: string[] = [];
    for (const { w, h } of SCREENS)
      for (const { fp, ovens } of CASES) {
        const lay = shopAt(fp, ovens);
        const view = sceneView(w, h, lay.frame);
        const probe = coachRects(lay, view.fit, 0, { x: 0, y: 0 });
        const u0 = union(probe['station:oven'], probe['dial:oven']);
        const at = view.scrolls ? Math.max(0, Math.min(view.maxScroll, mid(u0) - w / 2)) : 0;
        const r = coachRects(lay, view.fit, at, { x: 0, y: 0 });
        const u = union(r['station:oven'], r['dial:oven']);
        if (!holds(u, r['station:oven']) || !holds(u, r['dial:oven']) || !inside(u, w, h)) bad.push(`${w}x${h} fp${fp} ${ovens} ovens: ${JSON.stringify(u)}`);
      }
    expect(bad).toEqual([]);
  });

  test('the oven bank (ovens:all) is the union of the ovens drawn: inside the oven station, bigger with more ovens', () => {
    for (const { w, h } of SCREENS)
      for (const fp of [0, 2, 4]) {
        const one = shopAt(fp, 1);
        const two = shopAt(fp, 2);
        const fit = sceneView(w, h, one.frame).fit;
        const a = coachRects(one, fit, 0, origin);
        const b = coachRects(two, fit, 0, origin);
        expect(holds(a['station:oven'], a['ovens:all'])).toBe(true);
        // D531: it reaches OVEN_HEAD_PT below the oven faces, to take in the baker's head and hat
        expect(a['ovens:all'].y1 - bottomOf(one, fit)).toBeCloseTo(OVEN_HEAD_PT, 6);
        expect(holds(b['station:oven'], b['ovens:all'])).toBe(true);
        // a second oven is stacked (taller) or stands beside the first (wider): the bank only grows
        expect(area(b['ovens:all'])).toBeGreaterThan(area(a['ovens:all']));
      }
  });

  test('ovens:all holds the face of every oven drawn: two ovens (level 9, the second slot) are both inside it, level 2 draws one', () => {
    expect(shopAt(0, 1).ovens).toHaveLength(1);
    for (const { w, h } of SCREENS)
      for (const fp of [0, 1, 2, 3, 4]) {
        const lay = shopAt(fp, 2);
        expect(lay.ovens).toHaveLength(2);
        const fit = sceneView(w, h, lay.frame).fit;
        const all = coachRects(lay, fit, 0, origin)['ovens:all'];
        for (const o of lay.ovens) {
          const a = P(o.x0, D, o.z);
          const b = P(o.x1, D, o.z + o.h);
          const face: Rect = {
            x0: origin.x + sceneToScreen(Math.min(a[0], b[0]) - lay.frame.x0, 0, fit),
            x1: origin.x + sceneToScreen(Math.max(a[0], b[0]) - lay.frame.x0, 0, fit),
            y0: origin.y + fit.oy + Math.min(a[1], b[1]) * fit.s,
            y1: origin.y + fit.oy + Math.max(a[1], b[1]) * fit.s,
          };
          expect(holds(all, face)).toBe(true);
        }
      }
  });

  test('scrolling moves every rect by exactly the scroll, and the screen origin moves them as it moves', () => {
    const lay = shopAt(4, 2);
    const view = sceneView(393, 852, lay.frame);
    expect(lay.frame.x0).toBeLessThan(0); // the wide shop's drawing is moved right by its shift
    const a = coachRects(lay, view.fit, 0, { x: 0, y: 0 });
    const b = coachRects(lay, view.fit, 120, { x: 0, y: 0 });
    const c = coachRects(lay, view.fit, 0, { x: 7, y: 11 });
    for (const t of SCENE_TARGETS) {
      expect(b[t].x0).toBeCloseTo(a[t].x0 - 120, 9);
      expect(b[t].x1).toBeCloseTo(a[t].x1 - 120, 9);
      expect(b[t].y0).toBeCloseTo(a[t].y0, 9);
      expect(c[t].x0).toBeCloseTo(a[t].x0 + 7, 9);
      expect(c[t].y1).toBeCloseTo(a[t].y1 + 11, 9);
    }
  });

  test('the reporter registers nothing until the origin is known, and nothing after the scene is gone (T120: a late measureInWindow)', () => {
    const lay = shopAt(0, 1);
    const { fit } = sceneView(393, 852, lay.frame);
    const calls: [string, Rect | null][] = [];
    const rep = coachReporter(
      () => ({ lay, fit, scrollX: 0 }),
      (id, r) => calls.push([id, r]),
    );
    rep.report(); // no origin yet
    expect(calls).toEqual([]);
    rep.setOrigin(0, 59);
    expect(calls.map(([id]) => id)).toEqual([...SCENE_TARGETS]);
    expect(calls.every(([, r]) => r !== null)).toBe(true);
    calls.length = 0;
    rep.stop(); // the scene unmounts: every target is dropped…
    expect(calls.map(([id]) => id)).toEqual([...SCENE_TARGETS]);
    expect(calls.every(([, r]) => r === null)).toBe(true);
    calls.length = 0;
    rep.setOrigin(0, 60); // …and a measureInWindow answer that lands afterwards, or a scroll event, puts nothing back
    rep.report();
    expect(calls).toEqual([]);
    rep.start(); // a remount that keeps the instance reports again
    rep.report();
    expect(calls).toHaveLength(SCENE_TARGETS.length);
  });
});
