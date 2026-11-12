// The endgame notices at the top of the scene area, stacked under the order chip: the event banner, then the attack's banner or chip,
// then a toast. Fixed heights, so the stack's height is plain arithmetic the screen can use to keep the golden pizza's lane clear.
// Pure: unit-tested in node.
import { ORDER_VIEW } from '../../content/hooks';
// the engine's game module first: game -> features -> game is a cycle, and it only resolves when game loads before a feature
import '../../engine/game';
import type { GameState } from '../../engine/game';
import { eventView } from '../../engine/features/events';
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
 * Where the golden pizza's lane starts (pt from the scene's top) so it flies below the notices: `base` is what the screen uses
 * without them (the order chip's bottom, or the lane's own top). Unchanged when there are no notices.
 */
export function bonusLaneTop(g: GameState, now: number, base: number): number {
  const h = stackHeight({ event: eventView(now)?.active === true, attack: attackLite(g).face });
  return h > 0 ? Math.max(base, stackTop(chipPhase(g) !== 'none') + h + STACK.gap) : base;
}
