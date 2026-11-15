/// <reference types="jest" />
import { ORDER_VIEW } from '../../../content/hooks';
import * as G from '../../../engine/game';
import { TAP } from '../../tap-targets';
import { BONUS_VIEW } from '../../../content/hooks';
import { bonusScale } from '../../../engine/bonus';
import { EVENT_STRIP_SECONDS, flightBounds, holdsBonus, offerWaits, SKY_PRIORITY, type SkyItem, skyFirst, skyOf, skyPresence, skyShown, STACK, stackTop } from '../stack-model';

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

  test('the stack starts at the order chip’s top, or under the chip while an order is up', () => {
    expect(stackTop(false)).toBe(ORDER_VIEW.top);
    expect(stackTop(true)).toBe(ORDER_VIEW.top + ORDER_VIEW.height + STACK.gap);
  });

  test('G95: the golden pizza waits while an order card or the challenge chip is up, never for a banner', () => {
    expect(holdsBonus(base())).toBe(false);
    // a week-long open attack is a banner: the pizza flies over it
    expect(holdsBonus(withAttack({}))).toBe(false);
    // ...while it is open in full (its first 10 s, or after a tap on its badge) the pizza waits, so it never covers Defend; collapsed it flies over the badge
    expect(holdsBonus(withAttack({}), true)).toBe(true);
    expect(holdsBonus(base(), true)).toBe(false);
    expect(STACK.badge).toBeGreaterThanOrEqual(44);
    const ch = { target: 40, startSold: 0, left: 100 };
    expect(holdsBonus(withAttack({ challenge: ch }))).toBe(true);
    expect(holdsBonus(withAttack({ news: { kind: 'won', shopId: 'downtown', cash: 5, diamonds: 15 } }))).toBe(true);
    expect(holdsBonus(withAttack({ news: { kind: 'lost', shopId: 'downtown' } }))).toBe(true);
    expect(holdsBonus(withAttack({ news: { kind: 'expired', shopId: 'downtown' } }))).toBe(false);
    const order = { ...base(), order: { ...base().order, offer: { hood: 'suburbs' as const, target: 40, left: 45, variant: 0 as const } } };
    expect(holdsBonus(order)).toBe(true);
  });
});

// ---- v5.17 (U4): one sky event at a time ----
const FRIDAY_6PM = new Date(2026, 10, 13, 18).getTime();
const SHOPS_BUILT = (g: G.GameState): G.GameState => ({ ...g, shops: { ...g.shops, waterfront: { ...g.shops.waterfront, built: true }, suburbs: { ...g.shops.suburbs, built: true } } });
/** A state in which exactly the given items want the strip. */
function stateWith(items: SkyItem[]): { g: G.GameState; open: boolean } {
  let g = SHOPS_BUILT(base());
  let open = false;
  if (items.includes('order')) g = { ...g, order: { ...g.order, active: { hood: 'suburbs', target: 40, startSold: 0, left: 100, variant: 0 } } };
  if (items.includes('offer')) g = { ...g, order: { ...g.order, offer: { hood: 'suburbs', target: 40, left: 45, variant: 0 } } };
  if (items.includes('attack')) {
    g = { ...g, x: { ...g.x, counterattack: { armedWeek: 1, seenWeek: 1, target: 'downtown', open: true, defended: [], challenge: null, retryAt: 0, news: null } } };
    open = true;
  }
  if (items.includes('golden')) g = { ...g, seenScenes: ['downtown-2', ...g.seenScenes], bonus: { ...g.bonus, next: 0, until: 0 } };
  return { g, open };
}
// a golden pizza that is due takes the strip from an event banner after its first moments, so a pair with both is taken inside them
const NOW = (items: SkyItem[]) => (items.includes('event') ? (items.includes('golden') ? new Date(2026, 10, 13, 17).getTime() + 5_000 : FRIDAY_6PM) : new Date(2026, 10, 11, 12).getTime());

describe('U4: one sky event at a time', () => {
  test('the fixed priority is the running order, the attack, an offer, the event, the golden pizza', () => {
    expect(SKY_PRIORITY).toEqual(['order', 'attack', 'offer', 'event', 'golden']);
  });

  test('states built for the fixture really have each item present (so the pair test is not vacuous)', () => {
    for (const k of SKY_PRIORITY) {
      const { g, open } = stateWith([k]);
      const p = skyPresence(g, open, NOW([k]));
      // the golden pizza is only present when rewards are unlocked: the takeover scene id is checked below
      if (k === 'golden') continue;
      expect(p[k]).toBe(true);
    }
  });

  test('for every pair of the five, exactly one is visible and it is the one first in priority', () => {
    const takeover = require('../../../content/tuning').NONNA_TAKEOVER.sceneId as string;
    let pairs = 0;
    for (let i = 0; i < SKY_PRIORITY.length; i++) {
      for (let j = i + 1; j < SKY_PRIORITY.length; j++) {
        const items = [SKY_PRIORITY[i], SKY_PRIORITY[j]];
        const { g, open } = stateWith(items);
        const g2 = items.includes('golden') ? { ...g, seenScenes: [takeover, ...g.seenScenes] } : g;
        const now = NOW(items);
        const p = skyPresence(g2, open, now);
        for (const k of items) expect([k, p[k]]).toEqual([k, true]);
        const shown = skyShown(p);
        expect(Object.values(shown).filter(Boolean)).toHaveLength(1);
        expect(skyOf(g2, open, now)).toBe(items[0]);
        // everything behind the front item waits: the golden pizza is held, and an offer's wait is held while something is in front of it
        expect(holdsBonus(g2, open, now)).toBe(items[0] !== 'golden');
        pairs++;
      }
    }
    expect(pairs).toBe(10);
  });

  test('nothing wants the strip: nothing shows, nothing holds', () => {
    expect(skyFirst(skyPresence(base(), false, NOW([])))).toBeNull();
    expect(Object.values(skyShown(skyPresence(base(), false, NOW([])))).some(Boolean)).toBe(false);
  });

  test('an offer behind the attack banner keeps its wait; an offer in front does not need holding', () => {
    const a = stateWith(['attack', 'offer']);
    expect(offerWaits(a.g, a.open, NOW([]))).toBe(true);
    const o = stateWith(['offer']);
    expect(offerWaits(o.g, false, NOW([]))).toBe(false);
    // a collapsed badge holds nothing
    expect(offerWaits(a.g, false, NOW([]))).toBe(false);
  });

  test('an event runs for hours: after its first moments a golden pizza that is due goes first, and the banner returns after it', () => {
    const takeover = require('../../../content/tuning').NONNA_TAKEOVER.sceneId as string;
    const { g } = stateWith(['golden']);
    const due = { ...g, seenScenes: [takeover, ...g.seenScenes] };
    const start = new Date(2026, 10, 13, 17).getTime();
    expect(skyOf(due, false, start + 5_000)).toBe('event');
    expect(holdsBonus(due, false, start + 5_000)).toBe(true);
    expect(skyOf(due, false, start + (EVENT_STRIP_SECONDS + 1) * 1000)).toBe('golden');
    expect(holdsBonus(due, false, start + (EVENT_STRIP_SECONDS + 1) * 1000)).toBe(false);
    // no pizza due: the banner has the strip all evening
    expect(skyOf(SHOPS_BUILT(base()), false, start + 3600_000)).toBe('event');
  });

  test('the golden box and its label stay fully inside the screen at 375 and 393 pt, every flight, normal and lucky', () => {
    const edge = BONUS_VIEW.popEdge;
    for (const width of [375, 393]) {
      for (const [lucky, labelW] of [[false, 0], [false, BONUS_VIEW.giftWidth], [true, BONUS_VIEW.tagWidth]] as const) {
        const bw = BONUS_VIEW.width * bonusScale(lucky);
        const { from, to } = flightBounds(width, bw, labelW);
        expect(from).toBeGreaterThanOrEqual(edge);
        expect(to + bw).toBeLessThanOrEqual(width - edge);
        expect(to).toBeGreaterThan(from);
        // the label is centred on the box: its sides are inside too, at both ends of the flight
        const side = (x: number) => [x + (bw - labelW) / 2, x + (bw + labelW) / 2];
        expect(side(from)[0]).toBeGreaterThanOrEqual(edge);
        expect(side(to)[1]).toBeLessThanOrEqual(width - edge);
      }
    }
  });
});
