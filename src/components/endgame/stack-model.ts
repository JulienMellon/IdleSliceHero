// The endgame notices at the top of the scene area (the event banner, the attack banner or chip, a toast; fixed row heights) and the sky strip's
// queue: one of order / attack / offer / event / golden pizza shows at a time (v5.17).
// Pure: unit-tested in node.
import { BONUS_VIEW, ORDER_VIEW } from '../../content/hooks';
import { bonusUnlocked } from '../../engine/bonus';
import type { GameState } from '../../engine/game';
import { chipPhase } from '../order-model';
import { attackLite } from './attack-model';
import { eventViewNow } from './event-model';

export const STACK = {
  gap: 6,
  /** The event banner (one line). */
  event: 30,
  /** The attack banner with its 44 pt Defend button. */
  banner: 56,
  /** The banner collapsed to its badge (G95): a 44 pt round button at the right edge. */
  badge: 44,
  /** The challenge chip and the result chip: as tall as the order chip. */
  chip: ORDER_VIEW.height,
  /** A toast: a star earned, a recipe card, an event's start line (two lines). */
  toast: 52,
  /** A recipe card's reveal: the card's picture, a header, the name and the line. */
  recipe: 68,
} as const;

/** Where the stack starts: the order chip's spot, or just under it while an order is up. */
export const stackTop = (orderUp: boolean): number => ORDER_VIEW.top + (orderUp ? ORDER_VIEW.height + STACK.gap : 0);

/**
 * v5.17 (U4): the sky strip above the shop holds one thing at a time. These five compete, first in this order wins and the rest wait:
 *  order   a running order's chip (and its result flash)
 *  attack  the attack's banner while it is open in full, or the challenge chip and its result (a collapsed badge is a 44 pt dot that
 *          takes no room: it never holds anything, so a week-long attack cannot starve the rest)
 *  offer   an order offer
 *  event   the event banner
 *  golden  the golden pizza and its bubble
 * Waiting costs nothing owed: the golden pizza's lifetime and the schedule stop while it is held (`bonusTick`'s hold), and an offer's wait
 * is held by the store while `offerWaits` is true.
 */
export type SkyItem = 'order' | 'attack' | 'offer' | 'event' | 'golden';
export const SKY_PRIORITY: readonly SkyItem[] = ['order', 'attack', 'offer', 'event', 'golden'];

/** Which of the five want the strip now. */
export type SkyPresence = Record<SkyItem, boolean>;

/** The event banner holds the strip this long (seconds) after an event starts; after that a golden pizza that is due goes first. */
export const EVENT_STRIP_SECONDS = 15;

/** A golden pizza is on the way or on screen: unlocked and either flying or due (held back it stays due). */
export const goldenPending = (g: GameState): boolean => bonusUnlocked(g) && (g.bonus.until > g.playSeconds || g.playSeconds >= g.bonus.next);

/** Who wants the strip in this state. `bannerOpen`: the attack banner is open in full (banner-state.ts). `now`: wall ms (the event's clock). */
export function skyPresence(g: GameState, bannerOpen = false, now: number = Date.now()): SkyPresence {
  const phase = chipPhase(g);
  const face = attackLite(g).face;
  // an event runs for hours: its banner holds the strip for its first moments, then yields to a golden pizza that is due
  const ev = eventViewNow(now, g);
  const eventAge = ev && ev.active ? (ev.def.toHour - ev.def.fromHour) * 3600 - ev.seconds : -1;
  const golden = goldenPending(g);
  return {
    order: phase === 'active' || phase === 'done' || phase === 'failed',
    attack: face === 'running' || face === 'won' || face === 'lost' || (face === 'banner' && bannerOpen),
    // (the engine never has an offer beside a running order; read raw, the order simply wins)
    offer: !!g.order.offer,
    event: !!ev && ev.active && (eventAge < EVENT_STRIP_SECONDS || !golden),
    golden,
  };
}

/** The one item that shows: the first of `SKY_PRIORITY` that wants the strip, or null. */
export const skyFirst = (p: SkyPresence): SkyItem | null => SKY_PRIORITY.find((k) => p[k]) ?? null;

/** Which items draw now: exactly the first one (all false when none wants the strip). */
export function skyShown(p: SkyPresence): Record<SkyItem, boolean> {
  const first = skyFirst(p);
  return { order: first === 'order', attack: first === 'attack', offer: first === 'offer', event: first === 'event', golden: first === 'golden' };
}

/** The item showing in this state. */
export const skyOf = (g: GameState, bannerOpen = false, now: number = Date.now()): SkyItem | null => skyFirst(skyPresence(g, bannerOpen, now));

/**
 * G95: the golden pizza waits while anything ahead of it shows: the order chip (any face), the challenge chip, the open attack banner, an
 * offer, or the event banner in its first moments. A collapsed banner is a 44 pt badge and flies under the pizza, so it holds nothing.
 */
export function holdsBonus(g: GameState, bannerOpen = false, now: number = Date.now()): boolean {
  const first = skyOf(g, bannerOpen, now);
  return first !== null && first !== 'golden';
}

/** An order offer is on the table but something ahead of it shows: its 45 s wait must not run down unseen. */
export const offerWaits = (g: GameState, bannerOpen = false, now: number = Date.now()): boolean => {
  const p = skyPresence(g, bannerOpen, now);
  return p.offer && skyFirst(p) !== 'offer';
};

/**
 * D489 (v5.17 step 4): the golden box and the bubble over it stay fully inside the screen. The box's left edge flies from `from` to `to`
 * (both inside `edge` pt of the sides, with `labelW` of the label that rides over the box, the gift line or the LUCKY tag, kept inside too).
 * Only the end of the flight goes soft (see `flightFade`); no part of it is ever cut off by an edge.
 */
export function flightBounds(width: number, boxW: number, labelW = 0, edge: number = BONUS_VIEW.popEdge): { from: number; to: number } {
  const over = Math.max(0, (labelW - boxW) / 2);
  const from = edge + over;
  const to = Math.max(from, width - edge - boxW - over);
  return { from, to };
}

/** The box fades in over the first and out over the last of its flight (a share of the 0..1 flight), so it never pops at a stand-still. */
export const FLIGHT_FADE = 0.06;
