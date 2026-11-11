// Special orders from the cast (v5.13): once the Suburbs shop is built, a character the player has met now and then asks for
// N pies from their shop within two minutes. Pure rules: when an offer comes, how big the order is, progress, and how it ends.
// The chip is components/order-chip.tsx. Times are play seconds; one order at a time; a failure costs nothing.
import { ORDER, ORDER_CAST, type OrderCast } from '../content/hooks';
import type { NeighborhoodId } from '../content/types';
import { seededUnit } from './bonus';
import { pizzas } from './format';
import { sceneId, runsItself, shopRate, SHOP_IDS, type ActiveOrder, type GameState, type OrderOffer, type OrderState, type Shop } from './game';
import { minutesToCash, rewardsUnlocked } from './rewards';

/** Orders start when the Suburbs shop is built (which needs Nonna's takeover, so never during the tutorial). */
export const ordersUnlocked = (s: GameState): boolean => rewardsUnlocked(s) && s.shops.suburbs.built;

/** Neighbourhoods whose character may ask: the shop is built and the character's first scene has been seen. */
export function metHoods(s: GameState): NeighborhoodId[] {
  return SHOP_IDS.filter((id) => s.shops[id].built && s.seenScenes.includes(sceneId(id, 1)));
}

/** A round number to ask for: whole fives under 100, then two significant figures (144 → 140, 1,234 → 1,200). */
export function friendlyTarget(raw: number): number {
  if (!Number.isFinite(raw) || raw <= ORDER.minTarget) return ORDER.minTarget;
  const n = raw < 100 ? Math.round(raw / 5) * 5 : Number(raw.toPrecision(2));
  return Math.max(ORDER.minTarget, n);
}

/**
 * Pies to sell: the shop's pies per second × the window × the margin, so waiting alone falls a fifth short and a rush or an
 * upgrade made during the order closes the gap. A shop that doesn't run itself asks for a fixed number of taps' worth.
 */
export function orderTarget(s: GameState, hood: NeighborhoodId): number {
  const shop: Shop = s.shops[hood];
  if (!runsItself(shop)) return ORDER.unmanagedTarget;
  return friendlyTarget(shopRate(shop, s.vehicle) * ORDER.windowSeconds * ORDER.targetMargin);
}

/** Pies sold toward an order so far, 0..target. */
export const orderProgress = (s: GameState, a: ActiveOrder): number => Math.max(0, Math.min(a.target, Math.floor(s.shops[a.hood].sold - a.startSold)));

/** What finishing pays right now: 5 minutes of citywide income (the rewards' income, which ignores boosts). */
export const orderReward = (s: GameState): number => minutesToCash(s, ORDER.rewardMinutes);

/** A character's offer line with the pie count filled in. */
export const offerLine = (cast: OrderCast, variant: 0 | 1, target: number): string => cast.offers[variant].replace('{n}', pizzas(target));

export const castOf = (hood: NeighborhoodId): OrderCast => ORDER_CAST[hood];

const end = (o: OrderState, play: number, patch: Partial<OrderState>): OrderState => ({ ...o, ...patch, nextAt: play + ORDER.gapSeconds });

/**
 * Advance the orders after a game tick (`playSeconds` has already moved by `dt`).
 *  - an order in progress finishes the moment its pies are sold, or fails when its time runs out;
 *  - an offer waits ORDER.offerWaitSeconds, then leaves quietly;
 *  - a new offer comes once `nextAt` is reached, from a character the player has met; never while an order or an offer
 *    is up, never before the Suburbs shop is built;
 *  - `covered` (a scene, the return popup or the title card is up): clocks stop and no offer appears.
 * Returns `s` itself when nothing changed.
 */
export function orderTick(s: GameState, dt: number, covered: boolean): GameState {
  if (!(dt > 0) || !ordersUnlocked(s)) return s;
  const o = s.order;
  const play = s.playSeconds;
  // the result flash runs its own clock
  if (o.result && !covered) {
    const left = o.result.left - dt;
    s = { ...s, order: { ...o, result: left > 0 ? { ...o.result, left } : null } };
  }
  const cur = s.order;
  const a = cur.active;
  if (a) {
    if (orderProgress(s, a) >= a.target) {
      const reward = orderReward(s);
      return {
        ...s,
        cash: s.cash + reward,
        totalEarned: s.totalEarned + reward,
        stats: { ...s.stats, ordersDone: s.stats.ordersDone + 1 },
        order: end(cur, play, { active: null, result: { kind: 'done', hood: a.hood, reward, left: ORDER.doneShowSeconds, variant: a.variant } }),
      };
    }
    if (covered) return s;
    const left = a.left - dt;
    if (left <= 0) return { ...s, order: end(cur, play, { active: null, result: { kind: 'failed', hood: a.hood, reward: 0, left: ORDER.failShowSeconds, variant: a.variant } }) };
    return { ...s, order: { ...cur, active: { ...a, left } } };
  }
  if (covered) return s;
  const offer = cur.offer;
  if (offer) {
    const left = offer.left - dt;
    if (left <= 0) return { ...s, order: end(cur, play, { offer: null }) };
    return { ...s, order: { ...cur, offer: { ...offer, left } } };
  }
  if (play < cur.nextAt) return s;
  const hoods = metHoods(s);
  if (!hoods.length) return s;
  // the cast takes turns; the seed only decides where in the rotation this save starts
  const hood = hoods[(cur.made + Math.floor(seededUnit(cur.seed, 0, 9) * hoods.length)) % hoods.length];
  const fresh: OrderOffer = { hood, target: orderTarget(s, hood), left: ORDER.offerWaitSeconds, variant: seededUnit(cur.seed, cur.made, 5) < 0.5 ? 0 : 1 };
  return { ...s, order: { ...cur, made: cur.made + 1, offer: fresh } };
}

/** Accept the offer on the table: the clock starts and the shop's pies are counted from now. */
export function acceptOrder(s: GameState): GameState {
  const o = s.order;
  if (!o.offer || o.active) return s;
  const f = o.offer;
  const active: ActiveOrder = { hood: f.hood, target: f.target, startSold: s.shops[f.hood].sold, left: ORDER.windowSeconds, variant: f.variant };
  return { ...s, order: { ...o, offer: null, active } };
}

/** Say no: the offer goes and the next one is a gap away. */
export function declineOrder(s: GameState): GameState {
  const o = s.order;
  if (!o.offer) return s;
  return { ...s, order: end(o, s.playSeconds, { offer: null }) };
}

/**
 * Coming back after time away (`before` is the loaded save, `after` the same game once the offline earnings were applied).
 *  - an order whose time ran out while away fails silently: no result, no penalty;
 *  - one with time left keeps it, minus the time away, and the pies the shop sold while you were away don't count toward it;
 *  - an offer that would have left by now is gone.
 */
export function returnFromAway(before: GameState, after: GameState, awaySeconds: number): GameState {
  if (!(awaySeconds > 0)) return after;
  const o = after.order;
  const play = after.playSeconds;
  if (o.active) {
    const a = o.active;
    const left = a.left - awaySeconds;
    if (left <= 0) return { ...after, order: end(o, play, { active: null }) };
    const offline = Math.max(0, after.shops[a.hood].sold - before.shops[a.hood].sold);
    return { ...after, order: { ...o, active: { ...a, left, startSold: a.startSold + offline } } };
  }
  if (o.offer) {
    const left = o.offer.left - awaySeconds;
    if (left <= 0) return { ...after, order: end(o, play, { offer: null }) };
    return { ...after, order: { ...o, offer: { ...o.offer, left } } };
  }
  return after;
}
