/// <reference types="jest" />
import { TAP, hitSize } from '../tap-targets';

describe('tap targets (v3.8)', () => {
  test('every control on the sidewalk row and drawer reaches 44 pt with its hit margin', () => {
    expect(TAP.min).toBe(44);
    for (const [name, c] of Object.entries(TAP.controls)) expect([name, hitSize(c) >= TAP.min]).toEqual([name, true]);
  });
  test('the drawer label strip and the buy button below it never share a tap', () => {
    // the strip only reaches upward; a dead gap sits between it and the button
    expect(TAP.controls.stationStrip.slopBottom).toBe(0);
    expect(TAP.stripButtonGap).toBeGreaterThanOrEqual(4);
  });
  test('the main buy button is 44 pt drawn, not just in its hit area', () => {
    expect(TAP.controls.buyButton.height).toBeGreaterThanOrEqual(44);
    expect(TAP.controls.buyButton.slopTop + TAP.controls.buyButton.slopBottom).toBe(0);
  });
});
