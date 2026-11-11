/// <reference types="jest" />
// The milestone badge and the rising level chip (D415, D418): budgets against the chip row, in scene units.
import { layout } from '../layout';
import { CHIP_ROW_HALF, HUD_DIM_OPACITY, HUD_DIM_SECONDS, MILE_R, MILE_SECONDS, ROW_AIR, STATION_LABEL, chipAt, hudOpacity, mileAnchor, mileLevelSize, mileOpacity, mileScale, mileSpeechY, mileSub } from '../moments';
import { CHIP_RISE, CONFETTI_SECONDS } from '../ladder';
import { SCENE_W } from '../projection';
import { badgeRowY, stationRects } from '../stations';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];
const STATIONS = ['prep', 'oven', 'counter'] as const;
const shops = () => [0, 1, 2, 3, 4].map((fp) => ({ fp, lay: layout(fp, Math.min(fp + 1, 6), Math.min(3, fp + 1), 2, 6, DRIVER_SLOTS[fp], 1) }));

describe('the milestone badge (D415)', () => {
  test('it is a 72 pt disc, centred over the station\'s furniture, wholly on screen and wholly below the chip row, at every footprint', () => {
    expect(MILE_R * 2).toBe(72);
    const by = badgeRowY();
    for (const { fp, lay } of shops())
      for (const scale of [1.6, 1, 0.9]) {
        const rects = stationRects(lay, 44 / scale);
        for (const st of STATIONS) {
          const { cx, cy } = mileAnchor(rects[st], by);
          expect([fp, st, cx - MILE_R >= 0, cx + MILE_R <= SCENE_W]).toEqual([fp, st, true, true]);
          expect([fp, st, cy - MILE_R >= by + CHIP_ROW_HALF + ROW_AIR]).toEqual([fp, st, true]);
          // centred on the furniture whenever the furniture is low enough to take it
          const mid = (rects[st].y0 + rects[st].y1) / 2;
          if (mid >= by + CHIP_ROW_HALF + ROW_AIR + MILE_R) expect(cy).toBeCloseTo(mid, 6);
          expect(cx).toBeCloseTo((rects[st].x0 + rects[st].x1) / 2, 6);
        }
      }
  });
  test('the head\'s line hangs directly under the badge: its tail tip is the disc\'s lower edge, and it is nowhere near the chip row', () => {
    const by = badgeRowY();
    for (const { lay } of shops())
      for (const st of STATIONS) {
        const { cy } = mileAnchor(stationRects(lay, 44)[st], by);
        const y = mileSpeechY(cy);
        expect(y - 20).toBe(cy + MILE_R); // the HireBubble's tail tip sits 20 above its y
        expect(y - 20 - by).toBeGreaterThan(CHIP_ROW_HALF);
      }
  });
  test('the chip row dims to 30% for 1.2 s and is back at full strength after', () => {
    expect(HUD_DIM_SECONDS).toBe(1.2);
    expect([-0.1, 0, 0.6, 1.19, 1.2, 2].map(hudOpacity)).toEqual([1, HUD_DIM_OPACITY, HUD_DIM_OPACITY, HUD_DIM_OPACITY, 1, 1]);
    expect(HUD_DIM_OPACITY).toBeLessThan(0.5);
  });
  test('the badge pops in, holds and fades inside the confetti\'s life; the level fits the disc', () => {
    expect(MILE_SECONDS).toBeGreaterThanOrEqual(CONFETTI_SECONDS);
    expect(mileScale(0)).toBeLessThan(1);
    expect(Math.max(...[0.05, 0.1, 0.15, 0.2].map(mileScale))).toBeGreaterThan(1);
    expect(mileScale(0.5)).toBe(1);
    expect(mileScale(MILE_SECONDS)).toBe(0);
    expect([0.2, 1, 1.4, MILE_SECONDS].map(mileOpacity)).toEqual([1, 1, 0.6, 0]);
    expect(mileLevelSize('Lv 25')).toBe(24);
    expect(mileLevelSize('Lv 100')).toBe(20);
    expect(STATION_LABEL.oven).toBe('OVENS');
    expect(mileSub('+108% faster')).toBe('+108%');
    expect(mileSub(null)).toBeNull();
  });
});

describe('the rising "Lv N" chip (D418)', () => {
  const by = badgeRowY();
  test('it starts on the station\'s furniture and never goes up into the chip row, at every footprint and every chip size', () => {
    for (const { fp, lay } of shops())
      for (const scale of [1.6, 1, 0.9]) {
        const rects = stationRects(lay, 44 / scale);
        for (const st of STATIONS)
          for (const r of [13, 21]) {
            const start = chipAt(rects[st], by, r, 0, CHIP_RISE);
            expect([fp, st, start.y]).toEqual([fp, st, Math.max(by + CHIP_ROW_HALF + ROW_AIR + r, (rects[st].y0 + rects[st].y1) / 2)]);
            for (let k = 0; k <= 1.0001; k += 0.1) expect([fp, st, r, k, chipAt(rects[st], by, r, k, CHIP_RISE).y - r >= by + CHIP_ROW_HALF + ROW_AIR]).toEqual([fp, st, r, k, true]);
          }
      }
  });
  test('the check can fail: the v5.11 chip started on the badge (y = row) and rose through the Ovens count', () => {
    const oldY = (k: number) => by - k * CHIP_RISE;
    expect(oldY(0) - 21 >= by + CHIP_ROW_HALF + ROW_AIR).toBe(false);
  });
});
