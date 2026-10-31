/// <reference types="jest" />
// D391 / D394 / D395 / D396: where the signs, string lights, sun and oak sit in the backdrops, measured against what each
// panel actually shows of the 400-wide art (backdropView) and against the player's caption box.
import { HOME_SCENES } from '../../content/scenes/home';
import {
  BULB_INSET_PT,
  CAPTION_GAP_PT,
  CAPTION_ZONE_PT,
  INDUSTRIAL_BILLBOARD,
  INDUSTRIAL_POSTS,
  LEFT_HOUSE,
  OAK,
  OAK_FIT,
  SHOP_SIGNS,
  SIGN_BOXES,
  SIGN_INSET_PT,
  SOLD_SIGN,
  STRING_LIGHTS,
  SUN,
  backdropView,
  boxOf,
  lightsFor,
  type Box,
} from '../cutscene/backdrop-art';
import { CAPTION, FACE_BOX, boxInPanel, captionBottom, hasCaptionBar, panelSize, stageLayout } from '../cutscene/staging';

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
    expect(Object.keys(SIGN_BOXES).length).toBeGreaterThanOrEqual(8);
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

  test('D399: the industrial billboard stands on two posts that reach the roof ridges, under the caption zone, and nothing sits on its header', () => {
    const b = INDUSTRIAL_BILLBOARD;
    expect(INDUSTRIAL_POSTS.xs).toHaveLength(2);
    for (const x of INDUSTRIAL_POSTS.xs) {
      // each post sits under the board, and the board's bottom is above the ridge it stands on (the posts have height)
      expect([x, x > b.x && x < b.x + b.w]).toEqual([x, true]);
    }
    expect(INDUSTRIAL_POSTS.baseY).toBeGreaterThan(b.y + b.h);
    expect(INDUSTRIAL_POSTS.color).toBe('#3a2a20');
    // the post bases are the sawtooth's ridges (x 60 + 36 i, y -6), so the board rests on the roof and not on a sign
    for (const x of INDUSTRIAL_POSTS.xs) expect([x, (x - 60) % 36]).toEqual([x, 0]);
    // the left chimney's steam (circles up to x 174, y -63 to -37) is drawn over the sky beside the board, not behind it
    expect(b.x).toBeGreaterThanOrEqual(170);
    for (const { w, v } of views) expect([w, b.y >= v.y0 + CAPTION_ZONE_PT / v.scale]).toEqual([w, true]);
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

  test('D394: no string-light bulb touches a caption bar or the 6 pt below it: a captioned panel hangs none', () => {
    expect(CAPTION_GAP_PT).toBe(6);
    for (const { w, v } of views) {
      const zone = v.y0 + (CAPTION_ZONE_PT + CAPTION_GAP_PT) / v.scale;
      for (const [x, y] of lightsFor(true).bulbs) {
        const r = lightsFor(true).radius;
        expect([w, x, y - r >= zone]).toEqual([w, x, true]);
      }
    }
    expect(lightsFor(true).bulbs).toHaveLength(0);
    expect(lightsFor(true).wire).toBe('');
    // an uncaptioned panel keeps the string, and the string would run under the bar on the smallest phone (that is why it goes)
    expect(lightsFor(false).bulbs.length).toBeGreaterThan(0);
    const small = views[0];
    const zoneSmall = small.v.y0 + (CAPTION_ZONE_PT + CAPTION_GAP_PT) / small.v.scale;
    expect(lightsFor(false).bulbs.some(([, y]) => y - lightsFor(false).radius < zoneSmall)).toBe(true);
  });

  test('D394: the player and the backdrop agree on which panels carry a caption bar, and every captioned shop panel draws no string', () => {
    const panels = HOME_SCENES.flatMap((sc) => sc.panels);
    const captioned = panels.filter((p) => hasCaptionBar(p));
    expect(captioned.length).toBeGreaterThan(20);
    expect(captioned.some((p) => p.backdrop === 'shop')).toBe(true);
    for (const p of panels) expect(hasCaptionBar(p)).toBe(!!p.caption && p.lines.length > 0);
    expect(hasCaptionBar({ caption: 'narration', lines: [] })).toBe(false);
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

  const inCanopy = (x: number, y: number, pad: number) => OAK.canopy.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) < r + OAK_FIT.outline / 2 + pad);

  test('D398: the canopy is 15 % smaller, clear of the caption zone on every window, and leaves the left roof ridge and chimney showing', () => {
    expect(OAK_FIT.k).toBe(0.85);
    for (const { w, v } of views) {
      // outline included, the top stays 4 pt under the caption bar on every tall phone panel (scale >= 1.5; the squat SE and web
      // panels show less sky, and there the bar overlaps the treetop a little, which reads as a tree behind a caption, not crowding)
      if (v.scale >= 1.5) expect([w, OAK.canopyTop >= v.y0 + (CAPTION_ZONE_PT + 4) / v.scale]).toEqual([w, true]);
    }
    const [rx, ry] = LEFT_HOUSE.ridge;
    expect(inCanopy(rx, ry, 0)).toBe(false);
    // the chimney's top edge stands above the canopy and is wide enough to read
    const c = LEFT_HOUSE.chimney;
    for (const x of [c.x + 1, c.x + c.w / 2, c.x + c.w - 1]) expect([x, inCanopy(x, c.top + 6, 0)]).toEqual([x, false]);
    expect(c.top).toBeLessThan(-60);
    // the chimney starts below the roof line at its foot, so the roof (drawn over it) holds it
    expect(c.base).toBeGreaterThan(ry + (c.x - rx) * (62 / 70));
  });

  test('D398: shading and highlight puffs are all centred inside the canopy (the clip trims their edges)', () => {
    for (const [cx, cy] of [...OAK.shade, ...OAK.light]) expect([cx, cy, inCanopy(cx, cy, -OAK_FIT.outline / 2)]).toEqual([cx, cy, true]);
  });

  test('D398: the shaded puffs would have spilled without the clip (the old art put them past the outline)', () => {
    // the clip is what keeps them in: at least one shading puff reaches past the canopy's union
    const spill = OAK.shade.some(([cx, cy, r]) => [0, 1, 2, 3, 4, 5, 6, 7].some((i) => !inCanopy(cx + r * Math.cos((i * Math.PI) / 4), cy + r * Math.sin((i * Math.PI) / 4), -OAK_FIT.outline / 2)));
    expect(spill).toBe(true);
  });
});
