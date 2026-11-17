// The wide shop's scroll view, as pure rules (v5.18 card V1): when a touch is a tap, and where a shop opens.
import { openScroll } from './projection';

/** A touch that moved less than this (pt, either way) is a tap; at or past it the shop is being scrolled. */
export const TAP_SLOP = 8;

/** Whether a touch that went down at `from` and came up at `to` is a tap (a drag of TAP_SLOP or more is a scroll). */
export const isTap = (from: { x: number; y: number }, to: { x: number; y: number }): boolean => Math.hypot(to.x - from.x, to.y - from.y) < TAP_SLOP;

/**
 * Where a wide shop opens (px from the left edge of its drawing): where the player left it this session, otherwise with the counter
 * (scene x `counterX`) in the middle of the screen. Always inside the content; 0 when the shop does not scroll (`maxScroll` 0).
 */
export function shopOpenScroll(saved: number | undefined, counterX: number, s: number, screenW: number, maxScroll: number): number {
  if (saved !== undefined && Number.isFinite(saved)) return Math.max(0, Math.min(maxScroll, saved));
  return openScroll(counterX, s, screenW, maxScroll);
}
