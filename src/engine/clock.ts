// The game's wall clock (A37). Every place that asks "what time is it for the game" (the tick, a save's stamp, an event's or a rush's
// window, a banner's countdown) reads it here, so the whole game shares one seam. Animation timers (a fade, a walk, a wobble) keep
// `Date.now()`: they are not game time and never reach a save.

/** Wall-clock milliseconds, as the game counts them. */
export const gameNow = (): number => Date.now();
