/// <reference types="jest" />
// v5.16 (T1b): each neighbourhood's shop interior. The five other shops have a palette, a window and one signature object of their own;
// none hangs in the caption zone, runs off the panel edge or comes within 8 pt of a figure's head.
import { HOME_SCENES } from '../../content/scenes/home';
import { NEIGHBORHOODS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { BULB_INSET_PT, CAPTION_GAP_PT, CAPTION_ZONE_PT, SHOP_LOOKS, SHOP_OBJECT, SHOP_WINDOW, SIGN_INSET_PT, UNI_LIGHTS, backdropView, boxOf, shopLookFor } from '../cutscene/backdrop-art';
import { FACE_BOX, LIMB_CLEARANCE, boxInPanel, panelSize, stageLayout } from '../cutscene/staging';

const WINDOWS: [number, number, number][] = [
  [320, 568, 20],
  [375, 812, 47],
  [393, 852, 59],
  [430, 932, 59],
  [744, 1133, 24],
  [900, 600, 0],
];
const HOODS = NEIGHBORHOODS.map((n) => n.id) as NeighborhoodId[];
const OTHERS = HOODS.filter((h) => h !== 'downtown');

describe('shop interiors per neighbourhood', () => {
  test('every neighbourhood with a shop scene has a room, and the five others differ from Downtown in their wall, band and floor', () => {
    const shopHoods = new Set(HOME_SCENES.filter((s) => s.panels.some((p) => p.backdrop === 'shop')).map((s) => s.neighborhood));
    for (const h of shopHoods) expect([h, SHOP_LOOKS[h]]).toEqual([h, expect.anything()]);
    expect(shopHoods.size).toBeGreaterThanOrEqual(5);
    const d = SHOP_LOOKS.downtown;
    for (const h of OTHERS) {
      const l = SHOP_LOOKS[h];
      expect([h, l.wall[0] !== d.wall[0], l.band !== d.band, l.floor !== d.floor, l.rail !== d.rail]).toEqual([h, true, true, true, true]);
    }
    // and no two of the five share a wall or a floor
    expect(new Set(OTHERS.map((h) => SHOP_LOOKS[h].wall[0])).size).toBe(OTHERS.length);
    expect(new Set(OTHERS.map((h) => SHOP_LOOKS[h].floor)).size).toBe(OTHERS.length);
  });

  test('a panel with no neighbourhood draws Downtown\'s room, as before', () => {
    expect(shopLookFor(undefined)).toBe(SHOP_LOOKS.downtown);
  });

  test('the signature object and the window sit under the caption zone and inside the panel edges on every window', () => {
    for (const [w, h, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(w, h, top);
      const v = backdropView(innerW, innerH);
      for (const [name, b] of [['object', SHOP_OBJECT], ['window', boxOf(SHOP_WINDOW)]] as const) {
        expect([w, name, b.y0 >= v.y0 + CAPTION_ZONE_PT / v.scale]).toEqual([w, name, true]);
        expect([w, name, b.x0 >= v.x0 + SIGN_INSET_PT / v.scale, b.x1 <= v.x1 - SIGN_INSET_PT / v.scale]).toEqual([w, name, true, true]);
      }
    }
  });

  test('neither the object nor the window comes within 8 pt of a head (one or two figures), nor does the object touch the window', () => {
    for (const [w, h, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(w, h, top);
      const v = backdropView(innerW, innerH);
      for (const count of [1, 2] as const) {
        for (const p of stageLayout(count, innerW, innerH, 0)) {
          const face = boxInPanel(p, FACE_BOX, innerH);
          for (const [name, b] of [['object', SHOP_OBJECT], ['window', boxOf(SHOP_WINDOW)]] as const) {
            expect([w, count, name, (b.y1 - v.y0) * v.scale + LIMB_CLEARANCE <= face.y0]).toEqual([w, count, name, true]);
          }
        }
      }
    }
    expect(SHOP_OBJECT.x1).toBeLessThan(boxOf(SHOP_WINDOW).x0);
  });

  test("University's string lights hang under the caption bar (even with a caption) and 10 pt in from the panel edges", () => {
    for (const [w, h, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(w, h, top);
      const v = backdropView(innerW, innerH);
      for (const [x, y] of UNI_LIGHTS.bulbs) {
        const r = UNI_LIGHTS.radius;
        expect([w, x, y - r >= v.y0 + (CAPTION_ZONE_PT + CAPTION_GAP_PT) / v.scale]).toEqual([w, x, true]);
        expect([w, x, x - r >= v.x0 + BULB_INSET_PT / v.scale && x + r <= v.x1 - BULB_INSET_PT / v.scale]).toEqual([w, x, true]);
      }
    }
  });
});
