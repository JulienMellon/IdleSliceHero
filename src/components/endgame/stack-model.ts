// The endgame notices at the top of the scene area, stacked under the order chip: the event banner, then the attack's banner or chip,
// then a toast. Fixed row heights.
// Pure: unit-tested in node.
import { ORDER_VIEW } from '../../content/hooks';
import type { GameState } from '../../engine/game';
import { chipPhase } from '../order-model';
import { attackLite } from './attack-model';

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
 * G95: the golden pizza waits while a card is up: the special-order chip (any face), the challenge chip (running or its result), or the
 * attack banner while it is open in full (`bannerOpen`: its first 10 s, or after a tap on its badge). The sky has no room for it beside
 * them, and it used to land on their words and on Defend. A collapsed banner is a 44 pt badge and a running event a thin strip: the pizza
 * flies over those (drawn above the BANNERS slot), so a week-long attack never starves it.
 */
export function holdsBonus(g: GameState, bannerOpen = false): boolean {
  const face = attackLite(g).face;
  return chipPhase(g) !== 'none' || face === 'running' || face === 'won' || face === 'lost' || (face === 'banner' && bannerOpen);
}
