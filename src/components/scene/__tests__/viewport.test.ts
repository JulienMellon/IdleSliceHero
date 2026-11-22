/// <reference types="jest" />
// D511 / D512: on a wide shop the name plate and the bubbles stay inside the screen (12 pt in) while the shop scrolls.

import { FOOTPRINTS } from '../../../content/cities/home/fit';
import { isMirrored } from '../../../content/shop-layout';
import { NEIGHBORHOODS } from '../../../content/cities/home/data';
import { RIVAL_SHOP, rivalRect } from '../../layers/rival/rival-model';
import { layout } from '../layout';
import { toDrawSpace } from '../layout-space';
import { SCENE_H, drawFrame, drawShift, sceneFrame, sceneToScreen, sceneView } from '../projection';
import { FOOT_SAFE, WIDE_MIN_SCALE, fasciaSignBox, overlaySpan, rivalPlace, roomSpan, slideInto, visibleSpan, wideFit, VIEW_MARGIN } from '../viewport';

const W = 393;
const frame = sceneFrame(4);
const view = sceneView(W, 852, frame);
const shift = drawShift(frame);
const dframe = drawFrame(frame);
const bounds = { x0: dframe.x0, x1: dframe.x0 + dframe.width };
const lay = toDrawSpace(layout(4, 6, 3, 2, 6, 4, 0));

describe('the sign stays on screen while a wide shop scrolls', () => {
  const box = fasciaSignBox(lay, 'Industrial');
  const place = (scrollX: number) => {
    const span = visibleSpan(true, scrollX, W, view.fit, shift, bounds);
    const dx = slideInto(box.fcx, box.signW, span, { x0: box.fx0, x1: box.fx1 });
    const left = sceneToScreen(box.fcx + dx - box.signW / 2 + shift, scrollX, view.fit);
    const right = sceneToScreen(box.fcx + dx + box.signW / 2 + shift, scrollX, view.fit);
    return { dx, left, right };
  };
  test('at every scroll position the whole plate is on screen, 12 pt in (the old plate, fixed on the beam, was cut off at the ends)', () => {
    let cutOffBefore = 0;
    for (let x = 0; x <= view.maxScroll; x += 20) {
      const { left, right } = place(x);
      expect(left).toBeGreaterThanOrEqual(VIEW_MARGIN - 1);
      expect(right).toBeLessThanOrEqual(W - VIEW_MARGIN + 1);
      const l0 = sceneToScreen(box.fcx - box.signW / 2 + shift, x, view.fit);
      const r0 = sceneToScreen(box.fcx + box.signW / 2 + shift, x, view.fit);
      if (l0 < 0 || r0 > W) cutOffBefore++;
    }
    expect(cutOffBefore).toBeGreaterThan(0);
  });
  test('it stays on its beam, and a shop that does not scroll never moves it', () => {
    for (let x = 0; x <= view.maxScroll; x += 20) {
      const { dx } = place(x);
      expect(box.fcx + dx - box.signW / 2).toBeGreaterThanOrEqual(box.fx0 - 1);
      expect(box.fcx + dx + box.signW / 2).toBeLessThanOrEqual(box.fx1 + 1);
    }
    expect(visibleSpan(false, 123, W, view.fit, 0, { x0: 0, x1: 393 })).toEqual({ x0: 0, x1: 393 });
    expect(slideInto(196, 100, { x0: 0, x1: 393 }, { x0: 0, x1: 393 })).toBe(0);
  });
  test('a plate wider than the screen is centred on it', () => {
    expect(slideInto(0, 500, { x0: 100, x1: 300 }, { x0: -1000, x1: 1000 })).toBe(200);
  });
});

describe('overlaySpan: what the scene overlays may use of a scrolled shop (T110, C149)', () => {
  const cw = view.contentW;
  test('null when the shop does not scroll: the overlay keeps its whole width', () => {
    expect(overlaySpan(false, 120, W, cw)).toBeNull();
    expect(overlaySpan(false, 0, W, W)).toBeNull();
  });
  test('12 pt in from each screen edge, in the overlay own pt', () => {
    const s = overlaySpan(true, 100, W, cw)!;
    expect(s).toEqual({ x0: 100 + VIEW_MARGIN, x1: 100 + W - VIEW_MARGIN });
    expect(s.x1 - s.x0).toBe(W - 2 * VIEW_MARGIN);
  });
  test('inside [0, contentW] at both ends, and it only moves by whole points', () => {
    const lo = overlaySpan(true, 0, W, cw)!;
    const hi = overlaySpan(true, view.maxScroll, W, cw)!;
    expect(lo.x0).toBeGreaterThanOrEqual(0);
    expect(hi.x1).toBeLessThanOrEqual(cw);
    expect(hi.x1).toBeCloseTo(cw - VIEW_MARGIN, 0);
    // a rubber-band overshoot is held inside as well
    expect(overlaySpan(true, -40, W, cw)!.x0).toBeGreaterThanOrEqual(0);
    expect(overlaySpan(true, view.maxScroll + 40, W, cw)!.x1).toBe(cw);
    expect(overlaySpan(true, 10.4, W, cw)).toEqual(overlaySpan(true, 10.2, W, cw));
  });
});

describe('the rival shop stays on screen (D481)', () => {
  const hoods = NEIGHBORHOODS.map((n) => n.id);
  const phones = [
    { w: 393, h: 650 },
    { w: 375, h: 470 },
    { w: 430, h: 760 },
  ];
  test('every neighbourhood, footprint and phone: the shop, its kerb and its slab are inside the view and 34 pt above its foot, at every scroll position', () => {
    const bad: string[] = [];
    let checked = 0;
    for (const hood of hoods)
      for (let fp = 0; fp < 5; fp++)
        for (const ph of phones) {
          const v = sceneView(ph.w, ph.h, sceneFrame(fp));
          for (let x = 0; x <= v.maxScroll; x += 25) {
            const span = overlaySpan(v.scrolls, x, ph.w, v.contentW);
            const r = rivalRect(rivalPlace(v.fit, SCENE_H, span, RIVAL_SHOP));
            // in the pt of the overlay (the content's), less how far the view has scrolled
            const left = v.fit.ox + r.x0 * v.fit.s - (span ? Math.round(x) : 0);
            const right = v.fit.ox + r.x1 * v.fit.s - (span ? Math.round(x) : 0);
            const foot = ph.h - (v.fit.oy + r.y1 * v.fit.s);
            checked++;
            if (left < 0 || right > ph.w || foot < FOOT_SAFE - 1e-6 - 2)
              bad.push(`${hood} fp${fp} ${ph.w}x${ph.h} scroll ${x}: ${left.toFixed(1)}..${right.toFixed(1)}, ${foot.toFixed(1)} above the foot`);
          }
        }
    expect(checked).toBeGreaterThan(300);
    expect(bad.slice(0, 5)).toEqual([]);
  });
  test('the old place (the drawing’s left edge, 6 units above its foot) was off screen once a wide shop was scrolled, and under the home indicator', () => {
    const v = sceneView(393, 650, sceneFrame(3));
    const oldRight = v.fit.ox + (12 + RIVAL_SHOP.w) * v.fit.s - 120;
    expect(oldRight).toBeLessThan(0);
    expect((SCENE_H - (668 + RIVAL_SHOP.kerb)) * v.fit.s).toBeLessThan(34);
  });
});

describe('wide shops fit the screen or scroll (D519)', () => {
  const hoods = NEIGHBORHOODS.map((n) => n.id);
  test('every neighbourhood and footprint: the room is inside [12, 381] at scroll 0 at the scale it is drawn at, or it is a wide shop and scrolls', () => {
    const bad: string[] = [];
    for (const hood of hoods)
      for (let fp = 0; fp < 5; fp++) {
        const lay = layout(fp, Math.min(fp + 1, 6), 3, 2, FOOTPRINTS[fp].maxTables, 3, 1, undefined, isMirrored(hood));
        const v = sceneView(W, 650, lay.frame);
        const room = roomSpan(lay);
        const fit = wideFit({ x0: room.x0 * v.fit.s, x1: room.x1 * v.fit.s }, W);
        const x0 = v.fit.ox + room.x0 * v.fit.s * fit.scale;
        const x1 = v.fit.ox + room.x1 * v.fit.s * fit.scale;
        const inside = x0 >= VIEW_MARGIN - 1e-6 && x1 <= W - VIEW_MARGIN + 1e-6;
        if (!inside && !v.scrolls) bad.push(`${hood} fp${fp}: room ${x0.toFixed(0)}..${x1.toFixed(0)} on a shop that does not scroll`);
        // a shop that does not scroll fits at its own scale; one that scrolls is wider than the screen even at the smallest scale
        expect([hood, fp, fit.scrolls, v.scrolls]).toEqual([hood, fp, !inside, v.scrolls && !inside]);
      }
    expect(bad).toEqual([]);
  });
  test('wideFit: a room that fits keeps its scale, a slightly wide one is scaled down to fit, a wide one stops at 0.88 and scrolls', () => {
    expect(wideFit({ x0: 30, x1: 360 }, 393)).toEqual({ scale: 1, scrolls: false });
    const slight = wideFit({ x0: 0, x1: 400 }, 393);
    expect(slight.scale).toBeCloseTo(369 / 400, 9);
    expect(slight.scrolls).toBe(false);
    expect(wideFit({ x0: 0, x1: 453 }, 393)).toEqual({ scale: WIDE_MIN_SCALE, scrolls: true });
    expect(wideFit({ x0: 0, x1: 570 }, 393).scale).toBe(WIDE_MIN_SCALE);
  });
});
