import { readFileSync } from 'fs';
import { join } from 'path';

import { emitRivalGlow, onRivalGlow, resetRivalGlow, rivalGlowLeft, rivalGlowLevel, RIVAL_GLOW_MS } from '../rival-glow';

beforeEach(resetRivalGlow);

describe('the rival band glow (D547)', () => {
  it('runs 2 s on the shop it was asked for and nowhere else', () => {
    expect(RIVAL_GLOW_MS).toBe(2000);
    emitRivalGlow('suburbs', 10_000);
    expect(rivalGlowLeft('suburbs', 10_000)).toBe(2000);
    expect(rivalGlowLeft('suburbs', 11_200)).toBe(800);
    expect(rivalGlowLeft('suburbs', 12_000)).toBe(0);
    expect(rivalGlowLeft('suburbs', 99_000)).toBe(0);
    expect(rivalGlowLeft('downtown', 10_000)).toBe(0);
  });
  it('tells a listener, and a scene that mounts a moment later still reads what is left', () => {
    const fn = jest.fn();
    const off = onRivalGlow(fn);
    emitRivalGlow('suburbs', 0);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(rivalGlowLeft('suburbs', 500)).toBe(1500);
    off();
    emitRivalGlow('suburbs', 0);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('is bright while it runs and dark once it is over', () => {
    for (const left of [2000, 1500, 1000, 600]) {
      const level = rivalGlowLevel(left);
      expect(level).toBeGreaterThan(0);
      expect(level).toBeLessThanOrEqual(1);
    }
    expect(rivalGlowLevel(20)).toBeLessThan(0.1);
    expect(rivalGlowLevel(0)).toBe(0);
    expect(rivalGlowLevel(-5)).toBe(0);
    expect(rivalGlowLevel(Number.NaN)).toBe(0);
  });
});

describe('the glow over 2 s of game time (T138, C195)', () => {
  afterEach(() => jest.useRealTimers());
  it('changes level as the clock moves, never leaves 0..1, and is dark at exactly 2000 ms', () => {
    jest.useFakeTimers({ now: 50_000 });
    emitRivalGlow('suburbs');
    const levels: number[] = [];
    for (let ms = 0; ms <= 2000; ms += 100) {
      jest.setSystemTime(50_000 + ms);
      const left = rivalGlowLeft('suburbs');
      levels.push(rivalGlowLevel(left));
    }
    expect(new Set(levels.map((l) => l.toFixed(3))).size).toBeGreaterThan(8);
    for (const l of levels) {
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(1);
    }
    expect(levels[0]).toBeGreaterThan(0.2);
    // it fades out over the last half second and is gone at 2000 ms
    expect(levels[levels.length - 2]).toBeLessThan(0.2);
    expect(levels[levels.length - 1]).toBe(0);
  });
  it('the scene keeps its clock running while it glows, or the pulse would never repaint (C195)', () => {
    const src = readFileSync(join(__dirname, '..', 'rival-scene.tsx'), 'utf8');
    expect(src).toMatch(/useClock\(15, closedAt === null && glowEnd === null\)/);
  });
});
