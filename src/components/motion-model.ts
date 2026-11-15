// One rule for "may it move?" (pure, so a test pins it): the animations ask this instead of each deciding for itself.
export interface MotionPlan {
  /** Coins fly from the carrier to the cash; with Reduce Motion they fade where they are. */
  fly: boolean;
  /** Confetti bursts out of a buy button. */
  burst: boolean;
  /** A refused buy shakes the button, a full oven rattles. */
  shake: boolean;
  /** Something that turns or bobs for as long as it is on screen: the golden pizza's rays, the title card's rays, the breathing ring. */
  loops: boolean;
  /** A panel or a bubble slides, zooms or pops in; with Reduce Motion it is simply there. */
  slide: boolean;
}

/**
 * `reduced`: the player's Reduce Motion setting. `active`: the app is in the foreground. Looping animations also stop in the background
 * (nothing is drawn there, and a loop that runs on is battery spent for nothing); the one-shot ones only care about Reduce Motion.
 */
export function motionPlan(reduced: boolean, active = true): MotionPlan {
  return { fly: !reduced, burst: !reduced, shake: !reduced, loops: !reduced && active, slide: !reduced };
}
