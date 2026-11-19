// The game's wall clock (A37). Every place that asks "what time is it for the game" (the tick, a save's stamp, an event's or a rush's
// window, a banner's countdown) reads it here, so the whole game shares one seam. Animation timers (a fade, a walk, a wobble) keep
// `Date.now()`: they are not game time and never reach a save.

/**
 * X2 (v5.19-test): the test build's clock offset (ms ahead of the wall clock) and game speed. Module state set through the setters below,
 * which do nothing unless the test build's switch is on (the comparison is written out in full: the normal build folds it, so the offset
 * is always 0 and the speed always 1 there). The offset only moves forward: `rewards.clockBehind` treats a clock gone back as a rollback.
 */
let offsetMs = 0;
let speed = 1;

/** Move the game clock forward to `ms` ahead of the wall clock. Ignored outside the test build, and when it would move the clock back. */
export function setGameClockOffset(ms: number): void {
  if (process.env.EXPO_PUBLIC_TEST_MODE === '1' && Number.isFinite(ms) && ms >= offsetMs) offsetMs = ms;
}

/** How far ahead of the wall clock the game clock is (0 in the normal build). */
export const gameClockOffset = (): number => offsetMs;

/** Game speed: the foreground tick's `dt` is multiplied by it. Ignored outside the test build. */
export function setGameSpeed(x: number): void {
  if (process.env.EXPO_PUBLIC_TEST_MODE === '1' && Number.isFinite(x) && x > 0) speed = x;
}

/** The foreground tick's speed multiplier (1 in the normal build). */
export const gameSpeed = (): number => speed;

/** Wall-clock milliseconds, as the game counts them. */
export const gameNow = (): number => Date.now() + offsetMs;
