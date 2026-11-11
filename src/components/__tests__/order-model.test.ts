/// <reference types="jest" />
import { ORDER, ORDER_FAIL_LINE } from '../../content/hooks';
import { money } from '../../engine/format';
import * as G from '../../engine/game';
import * as O from '../../engine/orders';
import { chipPhase, chipView, clockText, progressText } from '../order-model';

const T0 = 1_700_000_000_000;
const ready = (): G.GameState => {
  const s = G.newGame(T0);
  const run = (lv: number) => ({ ...s.shops.suburbs, built: true, managed: true, heads: G.allHeads(), prep: lv, ovens: lv, counter: lv, drivers: lv + 2, tables: lv });
  return { ...s, tutorial: G.TUTORIAL_DONE, seenScenes: ['downtown-1', 'downtown-4', 'suburbs-1'], shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, heads: G.allHeads() }, suburbs: run(10) } };
};
const withOffer = (): G.GameState => ({ ...ready(), order: { ...ready().order, offer: { hood: 'suburbs', target: 40, left: 45, variant: 0 } } });

describe('the order chip', () => {
  test('nothing to show with no order', () => {
    expect(chipPhase(ready())).toBe('none');
    expect(chipView(ready())).toBeNull();
  });

  test('offer: the character, their line with the real count, and what finishing pays', () => {
    const v = chipView(withOffer())!;
    expect(v).toMatchObject({ phase: 'offer', hood: 'suburbs', who: 'dale', name: 'Coach Dale', line: '“40 pies for the Mudhens. Two minutes. Go!”' });
    expect(v.reward).toMatch(/^\+\$/);
  });

  test('active: "23 / 40 pies", a fill, the clock and the reward; urgent in the last 15 s', () => {
    let s = O.acceptOrder(withOffer());
    s = { ...s, shops: { ...s.shops, suburbs: { ...s.shops.suburbs, sold: s.shops.suburbs.sold + 23 } } };
    const v = chipView(s)!;
    expect(v.phase).toBe('active');
    expect(v.progress).toBe('23 / 40 pies');
    expect(v.fill).toBeCloseTo(23 / 40, 6);
    expect(v.clock).toBe('2:00');
    expect(v.urgent).toBe(false);
    expect(v.reward).toBe(`+${money(O.orderReward(s))}`);
    const late = chipView({ ...s, order: { ...s.order, active: { ...s.order.active!, left: 14.2 } } })!;
    expect(late.clock).toBe('0:15');
    expect(late.urgent).toBe(true);
    expect(progressText(1500, 4000)).toBe('1.5K / 4K pies');
  });

  test('done: the thanks and the reward; failed: the quiet line; the active chip wins over a result', () => {
    const s = O.acceptOrder(withOffer());
    const done = O.orderTick({ ...s, playSeconds: 1, shops: { ...s.shops, suburbs: { ...s.shops.suburbs, sold: s.shops.suburbs.sold + 40 } } }, 0.2, false);
    const d = chipView(done)!;
    expect(d.phase).toBe('done');
    expect(d.line).toBe('“That’s a W! The Mudhens owe you big.”');
    expect(d.reward).toMatch(/^\+\$/);
    expect(done.order.result!.left).toBe(ORDER.doneShowSeconds);
    const failed = chipView({ ...ready(), order: { ...ready().order, result: { kind: 'failed', hood: 'suburbs', reward: 0, left: 1, variant: 0 } } })!;
    expect(failed).toMatchObject({ phase: 'failed', line: ORDER_FAIL_LINE, reward: '' });
    expect(chipPhase({ ...s, order: { ...s.order, result: { kind: 'failed', hood: 'suburbs', reward: 0, left: 1, variant: 0 } } })).toBe('active');
  });

  test('the clock reads m:ss and rounds up', () => {
    expect([120, 119.2, 61, 59.01, 0.2, 0, -3].map(clockText)).toEqual(['2:00', '2:00', '1:01', '1:00', '0:01', '0:00', '0:00']);
  });
});
