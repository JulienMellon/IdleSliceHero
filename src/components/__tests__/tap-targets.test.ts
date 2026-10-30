/// <reference types="jest" />
import { CLOSE_SLOP, SIDEWALK_ROW, TAP, hitSize } from '../tap-targets';

describe('tap targets (v3.9)', () => {
  test('every control reaches 44 pt', () => {
    expect(TAP.min).toBe(44);
    for (const [name, c] of Object.entries(TAP.controls)) expect([name, hitSize(c) >= TAP.min]).toEqual([name, true]);
  });
  test("a hit margin never reaches outside its parent (iOS doesn't deliver those touches) (T33)", () => {
    for (const [name, c] of Object.entries(TAP.controls)) {
      expect([name, c.slopTop <= c.roomTop]).toEqual([name, true]);
      expect([name, c.slopBottom <= c.roomBottom]).toEqual([name, true]);
    }
  });
  test('the sidewalk buttons are drawn at 44 pt, with no margin reaching into the scene (T34)', () => {
    for (const k of ['stationButton', 'miniChip', 'managerButton'] as const) {
      expect(TAP.controls[k].height).toBeGreaterThanOrEqual(44);
      expect(TAP.controls[k].slopTop + TAP.controls[k].slopBottom).toBe(0);
    }
  });
  test('Close uses the hoisted margin, and the station card fits around its button', () => {
    expect(CLOSE_SLOP.top).toBe(TAP.controls.closeButton.slopTop);
    expect(SIDEWALK_ROW.cardHeight).toBe(TAP.controls.stationButton.height + 2 * SIDEWALK_ROW.cardInset);
  });
});
