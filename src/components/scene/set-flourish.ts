// The once-per-set flourish (v5.24, card S5): when the player buys the last piece of a set, the shop that set dresses celebrates for 3 s. The diners cheer (the cheer pose the cooks
// already have), confetti bursts from the shop's sign (the milestone confetti, twice over the 3 s) and the shop's manager says the set's `set.<set>.done` line as a bubble. Pure, so
// the timing, the "which shop" rule and the once-only rule are tested in node. The scene starts it from `rewards.setsDone` (engine/vanity.ts: the same entry `setCompleteEvent` reads
// between two states), so it plays whether the purchase happened with the scene on screen or a moment before it opened, and never twice for one entry.
import { SETS } from '../../content/catalog';
import { CONFETTI_SECONDS, confettiStep } from './ladder';

/** How long the flourish lasts: the cheer, the confetti and the line. */
export const FLOURISH_SECONDS = 3;

/** A flourish that is playing: its set, the entry's key (`flourishKey`) and the scene clock second it began. */
export interface Flourish {
  set: string;
  key: string;
  at: number;
}

/** One `rewards.setsDone` entry. */
export interface SetDone {
  set: string;
  at: number;
}

/** What identifies one completed set for the once-only rule. */
export const flourishKey = (d: SetDone): string => `${d.set}@${d.at}`;

/** The shop (neighbourhood id) a set dresses, or undefined for an unknown set. */
export const hoodOfSet = (set: string): string | undefined => SETS.find((s) => s.id === set)?.hood;

/** Game ms either side of the completion in which the scene still plays it: 3 s after, and a little before for a clock that runs slightly behind the purchase's. */
const LATE_MS = FLOURISH_SECONDS * 1000;
const EARLY_MS = 2000;

/**
 * The completion that should start a flourish in shop `hood` at game time `nowMs`: the first entry of that shop's set that is under 3 s old and not in `played`. A set of another shop
 * never starts one here, and an entry already played (or old, like every set a save loads with) starts nothing.
 */
export function flourishDue(setsDone: readonly SetDone[], hood: string, nowMs: number, played: ReadonlySet<string>): SetDone | null {
  for (const d of setsDone) {
    const age = nowMs - d.at;
    if (hoodOfSet(d.set) === hood && !played.has(flourishKey(d)) && age > -EARLY_MS && age < LATE_MS) return d;
  }
  return null;
}

/** Seconds into the flourish at scene clock `clock` (negative before it, no flourish: -1). */
export const flourishAge = (f: Flourish | null, clock: number): number => (f ? clock - f.at : -1);

/** Is the flourish playing at this age (0 to 3 s)? */
export const flourishOn = (age: number): boolean => age >= 0 && age < FLOURISH_SECONDS;

/** The confetti step at this age: two bursts of the milestone's, back to back, so the 3 s are never bare (-1 outside them). */
export const flourishConfetti = (age: number): number => (flourishOn(age) ? confettiStep(age % CONFETTI_SECONDS) : -1);

/** The bubble's words: "Name: line" when the manager has been met, the bare line when not (no name to spoil their hire). */
export const flourishLine = (speaker: string | null, line: string): string => (speaker ? `${speaker}: ${line}` : line);
