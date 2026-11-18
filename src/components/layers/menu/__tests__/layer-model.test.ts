/// <reference types="jest" />
import { CHAR_W, CHIP_H, layerTop } from '../../layer-model';
import { TAP } from '../../../tap-targets';
import { BUTTON_H, CHIP_MAX, chipPillWidth, isNews, TOAST_H, TOAST_MS, twoRows } from '../layer-model';
import { createSheetState } from '../sheet-state';

describe('a notice is news only when a real value changes to another', () => {
  it('ignores the first value and a return to nothing', () => {
    expect(isNews(null, 'night')).toBe(false);
    expect(isNews('day', 'night')).toBe(true);
    expect(isNews('night', 'night')).toBe(false);
    expect(isNews('night', '')).toBe(false);
    expect(isNews('', 'day')).toBe(true);
  });
  it('lasts a few seconds and is two lines tall', () => {
    expect(TOAST_MS).toBeGreaterThanOrEqual(3000);
    expect(TOAST_H).toBeGreaterThanOrEqual(44);
  });
});

describe('the shared sizes', () => {
  it('draws every HUD chip at the tap minimum', () => {
    expect(CHIP_H).toBeGreaterThanOrEqual(TAP.min);
    expect(BUTTON_H).toBeGreaterThanOrEqual(TAP.min);
  });
  it('splits a chip on two rows and gives the longer one room (S2a\u2019s measured character width), never past the cap', () => {
    expect(twoRows('3 out on campus')).toEqual(['3 out on', 'campus']);
    expect(twoRows('3 drones up')).toEqual(['3 drones', 'up']);
    expect(twoRows('Rating 4\u2605')).toEqual(['Rating', '4\u2605']);
    expect(twoRows('Day')).toEqual(['Day', '']);
    for (const rows of [
      ['Night \u00D72', '6:40'],
      ['Swing', '0:01'],
      ['Rating', '4\u2605'],
      ['3 out on', 'campus'],
    ]) {
      const w = chipPillWidth(rows);
      expect(w).toBeLessThanOrEqual(CHIP_MAX);
      expect(w).toBeGreaterThanOrEqual(CHIP_H);
      expect(Math.max(...rows.map((r) => r.length)) * CHAR_W).toBeLessThanOrEqual(w - 12 + 1);
    }
  });
  it('puts the notice where the layer column starts', () => {
    expect(layerTop({ orderUp: false, eventUp: false, attack: 'none' })).toBeLessThan(layerTop({ orderUp: true, eventUp: false, attack: 'none' }));
    expect(layerTop({ orderUp: false, eventUp: true, attack: 'none' })).toBeGreaterThan(layerTop({ orderUp: false, eventUp: false, attack: 'none' }));
  });
});

describe('the sheet flag', () => {
  it('opens, closes and tells its listeners once per change', () => {
    const s = createSheetState();
    const seen: boolean[] = [];
    const off = s.subscribe(() => seen.push(s.isOpen()));
    s.open();
    s.open();
    s.close();
    off();
    s.open();
    expect(seen).toEqual([true, false]);
    expect(s.isOpen()).toBe(true);
  });
});
