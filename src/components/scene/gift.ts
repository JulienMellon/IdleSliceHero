// The free gift's box in the shop (v5.25, card S7): where it is tapped and how it moves while it waits. Pure (no React): the drawing is gift-box.tsx, the place is
// renovation-art.ts `giftSpot`, the claim is E9's `claimFreeGift` (the store runs it and passes the `free_gift_claimed` event on for U7's moment).
import { MIN_TAP_PT, type Rect } from './stations';

/** One bob cycle, in seconds: slow and small, so it reads as "waiting" and not as an alarm. */
export const GIFT_BOB_PERIOD = 1.8;
/** The bob's height, in scene units (the box rises this far above its resting place at the top of the cycle). */
export const GIFT_BOB_AMP = 1.8;
/** The glint comes round every this many seconds and sweeps across the lid for `GIFT_GLINT_LEN` of them. */
export const GIFT_GLINT_EVERY = 4;
export const GIFT_GLINT_LEN = 0.7;
/** The glint's steps: the sweep takes this many poses (a memoised drawing re-renders only when the pose changes). */
const GLINT_STEPS = 6;
/** The bob is drawn in steps of this many scene units (under a pixel at scene scale). */
const BOB_STEP = 0.4;

export interface GiftPose {
  /** How far above its place the box is (scene units, 0 to `GIFT_BOB_AMP`), snapped to steps. */
  bob: number;
  /** The glint's progress along the lid, 0 when there is none (then 1/6 to 1 while it sweeps). */
  glint: number;
}

/**
 * The box's pose at clock time `t` (seconds). With Reduce Motion (`still`) it neither bobs nor glints: the halo, the bow and the sparkle on the lid are drawn all the time, so
 * the ready state reads without movement.
 */
export function giftPose(t: number, still = false): GiftPose {
  if (still || !Number.isFinite(t)) return { bob: 0, glint: 0 };
  const bob = ((1 - Math.cos((2 * Math.PI * t) / GIFT_BOB_PERIOD)) / 2) * GIFT_BOB_AMP;
  const into = t % GIFT_GLINT_EVERY;
  const glint = into < GIFT_GLINT_LEN ? Math.ceil((into / GIFT_GLINT_LEN) * GLINT_STEPS) / GLINT_STEPS : 0;
  return { bob: Math.round(bob / BOB_STEP) * BOB_STEP, glint };
}

/**
 * The box's tap target in scene units: its own rect, grown to `MIN_TAP_PT` points on each axis where the rect is smaller, around its middle (`s` is the scene's scale, points per
 * scene unit). The storefront lays an invisible button over it.
 */
export function giftTapRect(rect: Rect, s: number): Rect {
  const reach = MIN_TAP_PT / s / 2;
  const cx = (rect.x0 + rect.x1) / 2;
  const cy = (rect.y0 + rect.y1) / 2;
  const hw = Math.max(reach, (rect.x1 - rect.x0) / 2);
  const hh = Math.max(reach, (rect.y1 - rect.y0) / 2);
  return { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh };
}

/** Whether a tap at scene point (`x`, `y`) lands on the box's tap target. */
export function giftHit(rect: Rect, x: number, y: number, s: number): boolean {
  const t = giftTapRect(rect, s);
  return x >= t.x0 && x <= t.x1 && y >= t.y0 && y <= t.y1;
}
