/// <reference types="jest" />
import { STACK, stackTop } from '../../endgame/stack-model';
import { TAP } from '../../tap-targets';
import { CHAR_W, CHIP_H, chipLines, chipWidth, layerTop, mmss, pct5, step5 } from '../layer-model';
import { lc } from '../layer-text';

describe('layer-model', () => {
  test('mmss rounds up and never goes negative', () => {
    expect(mmss(187)).toBe('3:07');
    expect(mmss(0.2)).toBe('0:01');
    expect(mmss(-4)).toBe('0:00');
    expect(mmss(NaN)).toBe('0:00');
  });

  test('progress moves in 5% steps', () => {
    expect(step5(0)).toBe(0);
    expect(step5(0.024)).toBe(0);
    expect(step5(0.026)).toBe(1);
    expect(step5(1.4)).toBe(20);
    expect(pct5(step5(0.5))).toBe(50);
    expect(step5(0.5)).toBe(step5(0.52));
  });

  test('a chip is a 44 pt target and its two lines fit its width', () => {
    expect(CHIP_H).toBeGreaterThanOrEqual(TAP.min);
    const texts = [
      lc('layer.suburbs.gameday.chip', { time: '12:59' }),
      lc('layer.waterfront.boat.chip', { time: '0:30' }),
      lc('layer.waterfront.auction.chip', { time: '1:59' }),
      'Next boat 2:59',
      '−20% sales',
    ];
    for (const t of texts) {
      const lines = chipLines(t);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.length).toBeLessThanOrEqual(3);
      expect(chipWidth(t)).toBeGreaterThanOrEqual(CHIP_H);
      expect(chipWidth(t)).toBeLessThanOrEqual(64);
      // the longest line fits inside the chip's border and padding, and three lines fit its height
      expect(Math.max(...lines.map((l) => l.length)) * CHAR_W).toBeLessThanOrEqual(chipWidth(t) - 12 + 0.01);
      expect(lines.length * 12 + 4).toBeLessThanOrEqual(CHIP_H);
    }
  });

  test('the layer column starts under whatever the endgame stack shows', () => {
    const none = { orderUp: false, eventUp: false, attack: 'none' as const };
    expect(layerTop(none)).toBe(stackTop(false));
    expect(layerTop({ ...none, orderUp: true })).toBe(stackTop(true));
    expect(layerTop({ ...none, eventUp: true })).toBe(stackTop(false) + STACK.event + STACK.gap);
    expect(layerTop({ ...none, attack: 'banner' })).toBe(stackTop(false) + STACK.banner + STACK.gap);
    expect(layerTop({ ...none, attack: 'banner', collapsed: true })).toBe(stackTop(false) + STACK.badge + STACK.gap);
    expect(layerTop({ ...none, attack: 'running' })).toBe(stackTop(false) + STACK.chip + STACK.gap);
    expect(layerTop({ orderUp: true, eventUp: true, attack: 'won' })).toBe(stackTop(true) + STACK.event + STACK.gap + STACK.chip + STACK.gap);
  });
});
