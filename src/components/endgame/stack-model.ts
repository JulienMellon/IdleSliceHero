// The endgame notices at the top of the scene area, stacked under the order chip: the event banner, then the attack's banner or chip,
// then a toast. Fixed heights, so the stack's height is plain arithmetic the screen can use to keep the golden pizza's lane clear.
// Pure: unit-tested in node.
import { ORDER_VIEW } from '../../content/hooks';
import type { GameState } from '../../engine/game';
import { chipPhase } from '../order-model';
import { attackLite, type AttackFace } from './attack-model';

export const STACK = {
  gap: 6,
  /** The event banner (one line). */
  event: 30,
  /** The attack banner with its 44 pt Defend button. */
  banner: 56,
  /** The challenge chip and the result chip: as tall as the order chip. */
  chip: ORDER_VIEW.height,
  /** A toast: a star earned, a recipe card, an event's start line (two lines). */
  toast: 52,
  /** A recipe card's reveal: the card's picture, a header, the name and the line. */
  recipe: 68,
} as const;

/** Where the stack starts: the order chip's spot, or just under it while an order is up. */
export const stackTop = (orderUp: boolean): number => ORDER_VIEW.top + (orderUp ? ORDER_VIEW.height + STACK.gap : 0);

export interface StackParts {
  event: boolean;
  attack: AttackFace;
}

/** The height of the notices (not counting the order chip or the transient toast), 0 when there are none. */
export function stackHeight({ event, attack }: StackParts): number {
  const rows = [event ? STACK.event : 0, attack === 'banner' ? STACK.banner : attack === 'none' ? 0 : STACK.chip].filter((h) => h > 0);
  return rows.reduce((t, h) => t + h, 0) + Math.max(0, rows.length - 1) * STACK.gap;
}

/**
 * G95: the golden pizza waits while a card is up: the special-order chip (any face) or the challenge chip (running or its result).
 * The sky has no room for it beside those cards, and it used to land on their text. The persistent banners (an open attack, a running
 * event) don't hold it: the pizza flies over them, drawn above the BANNERS slot, so a week-long attack never starves it.
 */
export function holdsBonus(g: GameState): boolean {
  const face = attackLite(g).face;
  return chipPhase(g) !== 'none' || face === 'running' || face === 'won' || face === 'lost';
}
