/// <reference types="jest" />
import { quantArm, quantStep, STEP_FRAMES } from '../quantise';
import { shade, shadeRaw } from '../projection';

describe('scene caches (T10)', () => {
  test('cached shade matches the uncached result for every colour and amount', () => {
    const hexes = ['#000000', '#FFFFFF', '#2F80ED', '#B23A48', '#7B1E3A', '#C9A04A', '#3E3A5C'];
    for (const h of hexes)
      for (const k of [-0.4, -0.35, -0.3, -0.25, 0.1, 0.3, 0.5]) {
        expect(shade(h, k)).toBe(shadeRaw(h, k));
        expect(shade(h, k)).toBe(shadeRaw(h, k)); // second call hits the cache
      }
  });
  test('quantised walk phases never read as standing and take at most STEP_FRAMES values', () => {
    const seen = new Set<number>();
    for (let s = 0.01; s < 200; s += 0.37) {
      const q = quantStep(s);
      expect(q).not.toBe(0);
      seen.add(Number(q.toFixed(4)));
    }
    expect(seen.size).toBe(STEP_FRAMES);
    expect(quantStep(0)).toBe(0);
    // sin/cos of the snapped phase stays within one frame of the real one
    expect(Math.abs(Math.sin(quantStep(1.0)) - Math.sin(1.0))).toBeLessThan(0.4);
  });
  test('quantised arm swing takes few values over its range', () => {
    const vals = new Set(Array.from({ length: 301 }, (_, i) => quantArm(i / 100)));
    expect(vals.size).toBeLessThanOrEqual(9);
    expect(quantArm(0)).toBe(0);
  });
});
