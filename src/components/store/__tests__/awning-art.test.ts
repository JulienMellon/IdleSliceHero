/// <reference types="jest" />
import { AWNING_COLORS, AWNING_STRIPES, AWNING_VIEW, awningStripes } from '../awning-art';
import { createBuyGuard, guardedBuy } from '../buy-guard';

describe('the Founder awning hero (D496)', () => {
  const stripes = awningStripes();
  test('red and white stripes that fill the width, red at both edges', () => {
    expect(stripes).toHaveLength(AWNING_STRIPES);
    expect(AWNING_STRIPES % 2).toBe(1);
    expect(stripes[0].fill).toBe(AWNING_COLORS.main);
    expect(stripes[stripes.length - 1].fill).toBe(AWNING_COLORS.main);
    expect(stripes[1].fill).toBe(AWNING_COLORS.alt);
    expect(stripes.reduce((a, s) => a + s.w, 0)).toBeCloseTo(AWNING_VIEW.w, 6);
    stripes.slice(1).forEach((s, i) => expect(s.x).toBeCloseTo(stripes[i].x + stripes[i].w, 6));
  });
  test('every scallop stays inside the box', () => {
    expect(AWNING_VIEW.run + stripes[0].w / 2).toBeLessThanOrEqual(AWNING_VIEW.h + 0.001);
  });
});

describe('one purchase at a time (C130)', () => {
  test('a second press while one runs starts nothing; the guard opens again after', async () => {
    const guard = createBuyGuard();
    let calls = 0;
    let finish: (r: 'purchased') => void = () => {};
    const buy = () =>
      new Promise<'purchased'>((res) => {
        calls++;
        finish = res;
      });
    const first = guardedBuy(guard, buy, 'diamonds_80');
    expect(guard.busy()).toBe(true);
    expect(await guardedBuy(guard, buy, 'diamonds_80')).toBeNull();
    expect(calls).toBe(1);
    finish('purchased');
    expect(await first).toBe('purchased');
    expect(guard.busy()).toBe(false);
    void guardedBuy(guard, buy, 'diamonds_80');
    expect(calls).toBe(2);
  });
  test('a store that throws is a failed purchase and frees the guard', async () => {
    const guard = createBuyGuard();
    expect(await guardedBuy(guard, () => Promise.reject(new Error('x')), 'nonnas_plus')).toBe('failed');
    expect(guard.busy()).toBe(false);
  });
});
