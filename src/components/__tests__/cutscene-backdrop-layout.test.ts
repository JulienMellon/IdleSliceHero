/// <reference types="jest" />
// D391 / D394 / D395 / D396: where the signs, string lights, sun and oak sit in the backdrops, measured against what each
// panel actually shows of the 400-wide art (backdropView) and against the player's caption box.
import {
  BULB_INSET_PT,
  CAPTION_ZONE_PT,
  INDUSTRIAL_BILLBOARD,
  OAK,
  SHOP_SIGNS,
  SIGN_BOXES,
  SIGN_INSET_PT,
  SOLD_SIGN,
  STRING_LIGHTS,
  SUN,
  VENDING_HEAD,
  backdropView,
  boxOf,
  type Box,
} from '../cutscene/backdrop-art';
import { CAPTION, FACE_BOX, boxInPanel, captionBottom, panelSize, stageLayout } from '../cutscene/staging';

// iPhone SE, 13 mini, 15, 15 Pro Max, iPad mini portrait, a landscape-ish web window
const WINDOWS: [number, number, number][] = [
  [320, 568, 20],
  [375, 812, 47],
  [393, 852, 59],
  [430, 932, 59],
  [744, 1133, 24],
  [900, 600, 0],
];
const views = WINDOWS.map(([w, h, top]) => {
  const { innerW, innerH } = panelSize(w, h, top);
  return { w, innerW, innerH, v: backdropView(innerW, innerH) };
});
const overlap = (a: Box, b: Box, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;

describe('backdrop layout', () => {
  test('the caption box really is shorter than the zone the signs keep clear', () => {
    expect(CAPTION_ZONE_PT).toBe(captionBottom(2));
    expect(CAPTION_ZONE_PT).toBeLessThanOrEqual(62);
    expect(CAPTION.top + CAPTION.lineHeight * 2).toBeLessThan(CAPTION_ZONE_PT);
  });

  test('D391: no sign sits under a two-line caption, or is cut by the left/right edge, on any window', () => {
    expect(Object.keys(SIGN_BOXES).length).toBeGreaterThanOrEqual(9);
    for (const { w, v } of views) {
      for (const [name, b] of Object.entries(SIGN_BOXES)) {
        const label = `${w}px ${name}`;
        expect([label, b.y0 >= v.y0 + CAPTION_ZONE_PT / v.scale]).toEqual([label, true]);
        expect([label, b.x0 >= v.x0 + SIGN_INSET_PT / v.scale, b.x1 <= v.x1 - SIGN_INSET_PT / v.scale]).toEqual([label, true, true]);
      }
    }
  });

  test('D391: the PIZZA sign, menu board and EST. 1974 frame do not overlap, and the frame hangs above the rail', () => {
    const { menu, pizza, frame } = SHOP_SIGNS;
    expect(overlap(boxOf(pizza), boxOf(frame), 2)).toBe(false);
    expect(overlap(boxOf(pizza), boxOf(menu), 2)).toBe(false);
    expect(overlap(boxOf(menu), boxOf(frame), 2)).toBe(false);
    expect(boxOf(frame).y1).toBeLessThanOrEqual(36); // the wooden rail
    expect(pizza.k).toBeLessThanOrEqual(0.8);
  });

  test('D391: the industrial billboard clears the vending machine header it stands over', () => {
    expect(overlap({ x0: INDUSTRIAL_BILLBOARD.x, y0: INDUSTRIAL_BILLBOARD.y, x1: INDUSTRIAL_BILLBOARD.x + INDUSTRIAL_BILLBOARD.w, y1: INDUSTRIAL_BILLBOARD.y + INDUSTRIAL_BILLBOARD.h }, { x0: VENDING_HEAD.x, y0: VENDING_HEAD.y, x1: VENDING_HEAD.x + VENDING_HEAD.w, y1: VENDING_HEAD.y + VENDING_HEAD.h })).toBe(false);
  });

  test('D394: string-light bulbs are wholly outside the panel or 10 pt in from its edges', () => {
    for (const { w, v } of views) {
      for (const [x] of STRING_LIGHTS.bulbs) {
        const r = STRING_LIGHTS.radius;
        const outside = x + r <= v.x0 || x - r >= v.x1;
        const inside = x - r >= v.x0 + BULB_INSET_PT / v.scale && x + r <= v.x1 - BULB_INSET_PT / v.scale;
        expect([w, x, outside || inside]).toEqual([w, x, true]);
      }
    }
  });

  test('D394: the sunset sun sits below the caption zone', () => {
    for (const { v } of views) expect(SUN.cy - SUN.r).toBeGreaterThanOrEqual(v.y0 + CAPTION_ZONE_PT / v.scale);
    // and is not hidden behind the SOLD SOON board
    expect(overlap({ x0: SUN.cx - SUN.r, y0: SUN.cy - SUN.r, x1: SUN.cx + SUN.r, y1: SUN.cy + SUN.r }, { x0: SOLD_SIGN.x, y0: SOLD_SIGN.y, x1: SOLD_SIGN.x + SOLD_SIGN.w, y1: SOLD_SIGN.y + SOLD_SIGN.h })).toBe(false);
  });

  test('D395: the oak trunk stands clear of a centred figure, and its canopy stays above the head', () => {
    for (const { w, innerW, innerH, v } of views) {
      const [p] = stageLayout(1, innerW, innerH, 0);
      const face = boxInPanel(p, FACE_BOX, innerH);
      const trunkRight = (OAK.trunkX1 - v.x0) * v.scale;
      const canopyBottom = (OAK.canopyBottom - v.y0) * v.scale;
      expect([w, face.x0 - trunkRight >= 8]).toEqual([w, true]);
      expect([w, canopyBottom <= face.y0]).toEqual([w, true]);
    }
  });
});
