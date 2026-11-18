/// <reference types="jest" />
// D511 / D512: on a wide shop the name plate and the bubbles stay inside the screen (12 pt in) while the shop scrolls.

import { layout } from '../layout';
import { toDrawSpace } from '../layout-space';
import { drawFrame, drawShift, sceneFrame, sceneToScreen, sceneView } from '../projection';
import { fasciaSignBox, overlaySpan, slideInto, visibleSpan, VIEW_MARGIN } from '../viewport';

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
