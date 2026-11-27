// The once-per-set flourish (v5.24, card S5): when the player buys the last piece of a set, the shop that set dresses celebrates for 3 s. The diners cheer (the cheer pose the cooks
// already have), confetti bursts from the shop's sign (the milestone confetti, twice over the 3 s) and the shop's manager says the set's `set.<set>.done` line as a bubble. Pure, so
// the timing, the "which shop" rule and the once-only rule are tested in node. The scene starts it from `rewards.setsDone` (engine/vanity.ts: the entry a purchase pushes), on the
// first frame its shop is VISIBLE after the purchase (a purchase made on the Shop route, or with the app in the background, plays when the shop is next seen, not unseen), and
// never twice for one entry; the entries a save loaded with (older than the session) never play.
import { SETS } from '../../content/catalog';
import type { SetDone } from '../../engine/game';
import { CONFETTI_SECONDS, confettiStep } from './ladder';

/** How long the flourish lasts: the cheer, the confetti and the line. */
export const FLOURISH_SECONDS = 3;

/** A flourish that is playing: its set, the entry's key (`flourishKey`), the scene clock second it began, and the bubble's words (resolved once, when it starts). */
export interface Flourish {
  set: string;
  key: string;
  at: number;
  text: string;
}

/** What identifies one completed set for the once-only rule. */
export const flourishKey = (d: SetDone): string => `${d.set}@${d.at}`;

/** The shop (neighbourhood id) a set dresses, or undefined for an unknown set. */
export const hoodOfSet = (set: string): string | undefined => SETS.find((s) => s.id === set)?.hood;

/**
 * The completion that should start a flourish in shop `hood`: the first entry of that shop's set that was stamped at or after `since` (game ms: when this session began, so the
 * sets a save loaded with never play) and is not in `played`. It has no age limit: the caller asks only on frames where the shop is visible, so a purchase made while the scene was
 * covered plays on the first frame it is seen. A set of another shop never starts one here.
 */
export function flourishDue(setsDone: readonly SetDone[], hood: string, since: number, played: ReadonlySet<string>): SetDone | null {
  for (const d of setsDone) if (hoodOfSet(d.set) === hood && d.at >= since && !played.has(flourishKey(d))) return d;
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

/** How far (pt) the flourish's bubble hangs below the counter badge's usual bark spot: lower, so it clears the menu board on the wall behind the chip row. */
export const FLOURISH_BUBBLE_DROP = 30;

/** The crest on the sign pops in over the first 0.4 s (0.4 to 1.25 to 1, in tenths so the memoised crest re-renders a handful of times) and fades over the last 0.5 s. */
export function crestScale(age: number): number {
  if (!flourishOn(age)) return 0;
  if (age >= 0.4) return 1;
  const k = age / 0.4;
  return Math.round((k < 0.65 ? 0.4 + (k / 0.65) * 0.85 : 1.25 - ((k - 0.65) / 0.35) * 0.25) * 10) / 10;
}
export const crestOpacity = (age: number): number =>
  !flourishOn(age) ? 0 : age > FLOURISH_SECONDS - 0.5 ? Math.round(((FLOURISH_SECONDS - age) / 0.5) * 5) / 5 : 1;
/** The crest's radius (pt, before its pop). */
export const CREST_R = 14;
