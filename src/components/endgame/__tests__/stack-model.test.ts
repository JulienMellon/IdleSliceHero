/// <reference types="jest" />
import { ORDER_VIEW } from '../../../content/hooks';
import * as G from '../../../engine/game';
import { TAP } from '../../tap-targets';
import { bonusLaneTop, STACK, stackHeight, stackTop } from '../stack-model';

const at = (y: number, m: number, d: number, h = 0, mi = 0) => new Date(y, m - 1, d, h, mi).getTime();
const base = (): G.GameState => G.newGame(1_700_000_000_000);
const withAttack = (patch: Record<string, unknown>): G.GameState => {
  const g = base();
  return { ...g, x: { ...g.x, counterattack: { armedWeek: 1, seenWeek: 1, target: 'downtown', open: true, defended: [], challenge: null, retryAt: 0, news: null, ...patch } } };
};

describe('the notices at the top of the scene area', () => {
  test('every control in them is drawn at 44 pt or more inside its fixed row', () => {
    // the banner's Defend button is 44 pt inside the 2 pt borders
    expect(STACK.banner - 2 * 2).toBeGreaterThanOrEqual(TAP.min);
    expect(STACK.chip).toBe(ORDER_VIEW.height);
    expect(STACK.chip - 2 * 2).toBeGreaterThanOrEqual(TAP.min);
  });

  test('heights add up with a gap between rows', () => {
    expect(stackHeight({ event: false, attack: 'none' })).toBe(0);
    expect(stackHeight({ event: true, attack: 'none' })).toBe(STACK.event);
    expect(stackHeight({ event: false, attack: 'banner' })).toBe(STACK.banner);
    expect(stackHeight({ event: false, attack: 'running' })).toBe(STACK.chip);
    expect(stackHeight({ event: false, attack: 'won' })).toBe(STACK.chip);
    expect(stackHeight({ event: true, attack: 'banner' })).toBe(STACK.event + STACK.gap + STACK.banner);
  });

  test('the stack starts at the order chip’s top, or under the chip while an order is up', () => {
    expect(stackTop(false)).toBe(ORDER_VIEW.top);
    expect(stackTop(true)).toBe(ORDER_VIEW.top + ORDER_VIEW.height + STACK.gap);
  });

  test('the golden pizza’s lane starts below the notices: it never flies behind a banner', () => {
    const lane = 8;
    const quiet = base();
    expect(bonusLaneTop(quiet, at(2026, 11, 12, 12), lane)).toBe(lane);
    const banner = withAttack({});
    const top = bonusLaneTop(banner, at(2026, 11, 12, 12), lane);
    expect(top).toBeGreaterThanOrEqual(ORDER_VIEW.top + STACK.banner + STACK.gap);
    // the old lane (8) is inside the banner's rows [6, 62): the pizza would be hidden behind it
    expect(lane).toBeLessThan(ORDER_VIEW.top + STACK.banner);
    // an event adds its row on a Friday evening
    const withEvent = bonusLaneTop(banner, at(2026, 11, 13, 18), lane);
    expect(withEvent).toBe(top + STACK.event + STACK.gap);
  });

  test('with an order chip up the lane starts under it and the notices', () => {
    const g = { ...withAttack({}), order: { ...base().order, offer: { hood: 'suburbs' as const, target: 40, left: 45, variant: 0 as const } } };
    const base0 = ORDER_VIEW.top + ORDER_VIEW.height + STACK.gap;
    expect(bonusLaneTop(g, at(2026, 11, 12, 12), base0)).toBe(base0 + STACK.banner + STACK.gap);
  });
});
