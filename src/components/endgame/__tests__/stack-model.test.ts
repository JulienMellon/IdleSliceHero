/// <reference types="jest" />
import { ORDER_VIEW } from '../../../content/hooks';
import * as G from '../../../engine/game';
import { TAP } from '../../tap-targets';
import { holdsBonus, STACK, stackHeight, stackTop } from '../stack-model';

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

  test('G95: the golden pizza waits while an order card or the challenge chip is up, never for a banner', () => {
    expect(holdsBonus(base())).toBe(false);
    // a week-long open attack is a banner: the pizza flies over it
    expect(holdsBonus(withAttack({}))).toBe(false);
    const ch = { target: 40, startSold: 0, left: 100 };
    expect(holdsBonus(withAttack({ challenge: ch }))).toBe(true);
    expect(holdsBonus(withAttack({ news: { kind: 'won', shopId: 'downtown', cash: 5, diamonds: 15 } }))).toBe(true);
    expect(holdsBonus(withAttack({ news: { kind: 'lost', shopId: 'downtown' } }))).toBe(true);
    expect(holdsBonus(withAttack({ news: { kind: 'expired', shopId: 'downtown' } }))).toBe(false);
    const order = { ...base(), order: { ...base().order, offer: { hood: 'suburbs' as const, target: 40, left: 45, variant: 0 as const } } };
    expect(holdsBonus(order)).toBe(true);
  });
});
