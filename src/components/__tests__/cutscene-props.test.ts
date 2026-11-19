/// <reference types="jest" />
// v5.16 (T1b): the three Todd props (order slip, name tag, phone footage). Every propText in the scenes fits its field, the props sit under
// the caption zone and above the cast's heads on every window, and the text on them is never under 9 art units (10 pt on the smallest phone).
import { HOME_SCENES } from '../../content/scenes/home';
import { CAPTION_ZONE_PT, NAME_TAG_FIELD, ORDER_SLIP, PROP_BOXES, SIGN_BOXES, SIGN_INSET_PT, backdropView } from '../cutscene/backdrop-art';
import { PROP_CHAR_W, PROP_FONT, PROP_LINE_H, fitPropText, lineFont } from '../cutscene/prop-text';
import { FACE_BOX, LIMB_CLEARANCE, boxInPanel, panelSize, stageLayout } from '../cutscene/staging';

const WINDOWS: [number, number, number][] = [
  [320, 568, 20],
  [375, 812, 47],
  [393, 852, 59],
  [430, 932, 59],
  [744, 1133, 24],
  [900, 600, 0],
];

const tagTexts = HOME_SCENES.flatMap((s) => s.panels)
  .filter((p) => p.prop === 'name-tag')
  .map((p) => p.propText);

describe('propText fit', () => {
  test('the scenes have name tags, each with text, and no other prop carries text', () => {
    expect(tagTexts.length).toBeGreaterThanOrEqual(3);
    for (const t of tagTexts) expect(typeof t === 'string' && t.length > 0).toBe(true);
    for (const p of HOME_SCENES.flatMap((s) => s.panels)) if (p.prop !== 'name-tag') expect(p.propText).toBeUndefined();
  });

  test('every propText in the scenes fits the name tag: at most two lines, each inside the field, the font at least 9 units', () => {
    const { w, h } = NAME_TAG_FIELD;
    for (const text of tagTexts as string[]) {
      const f = fitPropText(text, w, h);
      expect([text, f.fits]).toEqual([text, true]);
      expect(f.lines.length).toBeLessThanOrEqual(2);
      expect(f.lines.join(' ').replace(/\s+/g, ' ')).toBe(text);
      expect([text, f.fontSize >= PROP_FONT.min && f.fontSize <= PROP_FONT.max]).toEqual([text, true]);
      for (const line of f.lines) expect([text, line, line.length * PROP_CHAR_W * f.fontSize <= w + 1e-9]).toEqual([text, line, true]);
      expect([text, f.lines.length * PROP_LINE_H * f.fontSize <= h + 1e-9]).toEqual([text, true]);
    }
  });

  test('the fit is honest: text too long for the field is reported as not fitting, never shrunk below the minimum', () => {
    const f = fitPropText('SENIOR ASSOCIATE OF THE WHOLE EASTERN REGION', NAME_TAG_FIELD.w, NAME_TAG_FIELD.h);
    expect(f.fits).toBe(false);
  });

  test('one short line stays on one line; a long name takes two', () => {
    expect(fitPropText('UNPAID INTERN', NAME_TAG_FIELD.w, NAME_TAG_FIELD.h).lines).toHaveLength(1);
    expect(fitPropText('SENIOR ASSOCIATE', NAME_TAG_FIELD.w, NAME_TAG_FIELD.h).lines).toEqual(['SENIOR', 'ASSOCIATE']);
  });

  test("the order slip's printed lines fit their room at 9 units or more", () => {
    for (const line of ORDER_SLIP.lines) expect([line, lineFont(line, ORDER_SLIP.w, 13) >= PROP_FONT.min]).toEqual([line, true]);
  });
});

describe('prop placement', () => {
  test('the three props are signs the layout test covers, and each sits wholly in the slip of the panel every window shows', () => {
    for (const k of ['prop/order-slip', 'prop/name-tag', 'prop/phone-footage']) expect(SIGN_BOXES[k]).toBeDefined();
    for (const [w, h, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(w, h, top);
      const v = backdropView(innerW, innerH);
      for (const [name, b] of Object.entries(PROP_BOXES)) {
        // rotated a few degrees on the panel: allow 4 units of swing
        expect([w, name, b.y - 4 >= v.y0 + CAPTION_ZONE_PT / v.scale]).toEqual([w, name, true]);
        expect([w, name, b.x - 4 >= v.x0 + SIGN_INSET_PT / v.scale && b.x + b.w + 4 <= v.x1 - SIGN_INSET_PT / v.scale]).toEqual([w, name, true]);
      }
    }
  });

  test('a prop stays 8 pt above the heads of one or two figures on every window', () => {
    for (const [w, h, top] of WINDOWS) {
      const { innerW, innerH } = panelSize(w, h, top);
      const v = backdropView(innerW, innerH);
      for (const count of [1, 2] as const) {
        for (const speaker of [0, count - 1]) {
          for (const p of stageLayout(count, innerW, innerH, speaker)) {
            const face = boxInPanel(p, FACE_BOX, innerH);
            for (const [name, b] of Object.entries(PROP_BOXES)) {
              const footPt = (b.y + b.h + 4 - v.y0) * v.scale;
              expect([w, count, name, footPt + LIMB_CLEARANCE <= face.y0]).toEqual([w, count, name, true]);
            }
          }
        }
      }
    }
  });
});
