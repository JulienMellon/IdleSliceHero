/// <reference types="jest" />
import { BONUS, BONUS_VIEW, LUCKY_MULT, ORDER, ORDER_VIEW } from '../hooks';

describe('session hook constants (the v5.13 spec)', () => {
  test('golden pizza', () => {
    expect(BONUS).toMatchObject({ firstAtPlay: 20, gapMin: 75, gapMax: 120, visibleSeconds: 12, incomeSeconds: 45, minPayout: 5, luckyEvery: 5, luckyIncomeSeconds: 180 });
    expect(LUCKY_MULT).toBe(4);
  });
  test('special orders', () => {
    expect(ORDER).toMatchObject({ firstOfferAtPlay: 60, gapSeconds: 240, offerWaitSeconds: 45, windowSeconds: 120, targetMargin: 1.2, minTarget: 20, unmanagedTarget: 24, rewardMinutes: 5, doneShowSeconds: 2.5, failShowSeconds: 2 });
  });
  test('tap targets are drawn at 44 pt or more', () => {
    expect(BONUS_VIEW.height).toBeGreaterThanOrEqual(44);
    expect(BONUS_VIEW.width).toBeGreaterThanOrEqual(44);
    expect(ORDER_VIEW.height).toBeGreaterThanOrEqual(44 + 2 * 2);
    // the drawn golden pizza is bigger than the art, never smaller
    expect(BONUS_VIEW.height * BONUS_VIEW.scale).toBeGreaterThanOrEqual(44);
    expect(BONUS_VIEW.height * BONUS_VIEW.luckyScale).toBeGreaterThan(BONUS_VIEW.height * BONUS_VIEW.scale);
  });
  test('v5.14 fix round numbers (D436, D437, D444, D445)', () => {
    expect(BONUS_VIEW).toMatchObject({ scale: 1.3, luckyScale: 1.6, glowPx: 10, sparkles: 3, bannerMs: 1200, luckyCoins: 10 });
    expect(ORDER_VIEW).toMatchObject({ coins: 5, bounce: 1.15 });
    expect(BONUS.firstAfterUnlock).toBeLessThanOrEqual(5);
  });
});
