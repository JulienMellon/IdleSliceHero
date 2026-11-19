/// <reference types="jest" />
// v5.18 (T2): Boston's art. Every panel of the Boston story has a backdrop and a prop the player can draw, each exterior's signature object and
// the small-prop box sit under the caption zone and inside the panel edges on every window, the props stay clear of the heads, every name tag
// fits its field, and the six shop rooms differ from each other and from the home city's.
import { BOSTON_CITY } from '../../content/cities/boston';
import { BOSTON_IDS } from '../../content/cities/boston/data';
import { PROP_IDS } from '../../content/types';
import { BOSTON_LOOKS, BOSTON_SIGNS } from '../cities/boston/shop';
import { CAPTION_ZONE_PT, ICON_PROP_BOX, ICON_PROP_IDS, NAME_TAG_FIELD, SHOP_LOOKS, SHOP_OBJECT, SIGN_INSET_PT, backdropView } from '../cutscene/backdrop-art';
import { PROP_FONT, fitPropText } from '../cutscene/prop-text';
import { FACE_BOX, LIMB_CLEARANCE, boxInPanel, panelSize, stageLayout } from '../cutscene/staging';

const WINDOWS: [number, number, number][] = [
  [320, 568, 20],
  [375, 812, 47],
  [393, 852, 59],
  [430, 932, 59],
  [744, 1133, 24],
  [900, 600, 0],
];
const panels = BOSTON_CITY.scenes.flatMap((s) => s.panels);

describe('Boston backdrops and props', () => {
  test('every neighbourhood has an exterior and a shop room of its own, and every panel is drawable', () => {
    for (const id of BOSTON_IDS) {
      expect([id, BOSTON_LOOKS[id]]).toEqual([id, expect.anything()]);
      expect([id, SHOP_LOOKS[id]]).toEqual([id, expect.anything()]);
    }
    const drawable = new Set<string>([...BOSTON_IDS, 'shop', 'megaslice-hq', 'downtown-rain']);
    for (const p of panels) expect([p.backdrop, drawable.has(p.backdrop)]).toEqual([p.backdrop, true]);
    const props = new Set<string>(['name-tag', ...ICON_PROP_IDS]);
    for (const p of panels) if (p.prop) expect([p.prop, props.has(p.prop)]).toEqual([p.prop, true]);
    for (const id of ICON_PROP_IDS) expect(PROP_IDS as readonly string[]).toContain(id);
  });

  test('the six exteriors have different skies, and the six rooms differ from each other and from the home city', () => {
    expect(new Set(BOSTON_IDS.map((h) => BOSTON_LOOKS[h].sky[0])).size).toBe(BOSTON_IDS.length);
    expect(new Set(BOSTON_IDS.map((h) => BOSTON_LOOKS[h].sig)).size).toBe(BOSTON_IDS.length);
    const all = [...BOSTON_IDS, 'downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'];
    expect(new Set(all.map((h) => SHOP_LOOKS[h].wall[0])).size).toBe(all.length);
    expect(new Set(all.map((h) => SHOP_LOOKS[h].floor)).size).toBe(all.length);
  });

  test('the signature objects stay under the caption zone and 12 pt in from the panel edges on every window', () => {
    for (const [w, h, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(w, h, top);
      const v = backdropView(innerW, innerH);
      for (const [name, b] of Object.entries(BOSTON_SIGNS)) {
        expect([w, name, b.y0 >= v.y0 + CAPTION_ZONE_PT / v.scale]).toEqual([w, name, true]);
        expect([w, name, b.x0 >= v.x0 + SIGN_INSET_PT / v.scale, b.x1 <= v.x1 - SIGN_INSET_PT / v.scale]).toEqual([w, name, true, true]);
      }
    }
  });

  test('a Boston prop sits under the caption zone, inside the panel and 8 pt above the heads of one or two figures', () => {
    const b = ICON_PROP_BOX;
    for (const [w, h, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(w, h, top);
      const v = backdropView(innerW, innerH);
      expect([w, b.y - 4 >= v.y0 + CAPTION_ZONE_PT / v.scale]).toEqual([w, true]);
      expect([w, b.x - 4 >= v.x0 + SIGN_INSET_PT / v.scale, b.x + b.w + 4 <= v.x1 - SIGN_INSET_PT / v.scale]).toEqual([w, true, true]);
      for (const count of [1, 2] as const) {
        for (const speaker of [0, count - 1]) {
          for (const p of stageLayout(count, innerW, innerH, speaker)) {
            const face = boxInPanel(p, FACE_BOX, innerH);
            expect([w, count, (b.y + b.h + 4 - v.y0) * v.scale + LIMB_CLEARANCE <= face.y0]).toEqual([w, count, true]);
          }
        }
      }
    }
  });

  test('the shop object box is still the one the signature objects were drawn in', () => {
    expect(SHOP_OBJECT).toEqual({ x0: 102, y0: -10, x1: 200, y1: 36 });
  });

  test('every Boston name tag fits its field at 9 units or more, in at most two lines', () => {
    const tags = panels.filter((p) => p.prop === 'name-tag');
    expect(tags.length).toBeGreaterThanOrEqual(8);
    for (const p of tags) {
      const text = p.propText ?? '';
      const f = fitPropText(text, NAME_TAG_FIELD.w, NAME_TAG_FIELD.h);
      expect([text, f.fits, f.lines.length <= 2, f.fontSize >= PROP_FONT.min]).toEqual([text, true, true, true]);
    }
    for (const p of panels) if (p.prop !== 'name-tag') expect(p.propText).toBeUndefined();
  });
});
