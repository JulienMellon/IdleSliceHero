/// <reference types="jest" />
import { BUTTON_H, CLOSE_SLOP, DRAWER_HEAD, IDLE_STACK_GAP, SIDEWALK_ROW, STATION_CARD, TAP, hitSize } from '../tap-targets';

describe('tap targets', () => {
  test('every control reaches 44 pt', () => {
    expect(TAP.min).toBe(44);
    for (const [name, c] of Object.entries(TAP.controls)) expect([name, hitSize(c) >= TAP.min]).toEqual([name, true]);
  });
  test("a hit margin never reaches outside its parent (iOS doesn't deliver those touches) (T33)", () => {
    for (const [name, c] of Object.entries(TAP.controls)) {
      expect([name, c.slopTop <= c.roomTop]).toEqual([name, true]);
      expect([name, c.slopBottom <= c.roomBottom]).toEqual([name, true]);
    }
    expect(CLOSE_SLOP.left).toBeLessThanOrEqual(DRAWER_HEAD.padX);
    expect(CLOSE_SLOP.right).toBeLessThanOrEqual(DRAWER_HEAD.padX);
  });
  test('the sidewalk buttons are drawn at 44 pt, with no margin reaching into the scene (T34)', () => {
    expect(TAP.controls.compactButton.height).toBe(BUTTON_H);
    expect(TAP.controls.compactButton.slopTop + TAP.controls.compactButton.slopBottom).toBe(0);
  });
  test('row geometry is derived from the style constants (T36)', () => {
    expect(SIDEWALK_ROW.cardHeight).toBe(44 + 2 * (STATION_CARD.border + STATION_CARD.padding));
    expect(SIDEWALK_ROW.idleStackHeight).toBe(2 * BUTTON_H + IDLE_STACK_GAP);
    expect(TAP.controls.closeButton.roomTop).toBe(DRAWER_HEAD.padTop);
    expect(TAP.controls.closeButton.roomBottom).toBe(DRAWER_HEAD.padBottom);
  });
});
