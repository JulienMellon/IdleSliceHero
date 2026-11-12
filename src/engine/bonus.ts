// The golden pizza (v5.13): a floating bonus that drifts across the sky while the game is open. Pure rules: when the next
// one appears, how it flies, whether it is the lucky slice and what a tap pays. The drawing is components/floating-bonus.tsx.
// All times are play seconds (`GameState.playSeconds`); the schedule is a hash of the saved seed, so it replays the same.
import { BONUS, BONUS_VIEW } from '../content/hooks';
import type { GameState } from './game';
import { minutesToCash, rewardsUnlocked } from './rewards';

/** A repeatable number in [0, 1) from a seed and two small integers (a hash, not a generator: no state to keep). */
export function seededUnit(seed: number, a: number, salt = 0): number {
  let h = (seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Play seconds between the end of golden pizza number `n` (tapped or flown away) and the next: BONUS.gapMin..gapMax. */
export function bonusGap(seed: number, n: number): number {
  return Math.round((BONUS.gapMin + seededUnit(seed, n, 1) * (BONUS.gapMax - BONUS.gapMin)) * 10) / 10;
}

export interface BonusPath {
  /** 1 = left to right, −1 = right to left. */
  dir: 1 | -1;
  /** Where in the sky band it flies: 0 = the top of the band, 1 = the bottom. */
  lane: number;
  /** Where in its bob it starts, 0..1 of a full cycle. */
  phase: number;
}

/** How golden pizza number `n` flies. */
export function bonusPath(seed: number, n: number): BonusPath {
  return { dir: seededUnit(seed, n, 2) < 0.5 ? 1 : -1, lane: seededUnit(seed, n, 3), phase: seededUnit(seed, n, 4) };
}

/** Which way across the screen, as a position 0..1 of the flight (0 = where it comes in, 1 = where it leaves). */
export const flightX = (path: BonusPath, progress: number): number => (path.dir === 1 ? progress : 1 - progress);

/** The lucky slice is every BONUS.luckyEvery-th golden pizza tapped: the next tap is lucky after four in a run of five. */
export const isLucky = (bonusTaps: number): boolean => (bonusTaps + 1) % BONUS.luckyEvery === 0;

/** The streak pips by the pizza: how many are filled and whether the one on screen is the lucky slice. */
export function streakPips(bonusTaps: number): { filled: number; total: number; lucky: boolean } {
  return { filled: bonusTaps % BONUS.luckyEvery, total: BONUS.luckyEvery, lucky: isLucky(bonusTaps) };
}

/** The streak's label by the pips: "4/5". */
export const pipsLabel = (bonusTaps: number): string => {
  const p = streakPips(bonusTaps);
  return `${p.filled}/${p.total}`;
};

/** D445: golden pizza number 1 with no tap made yet is the scripted gift: it gets Nonna's label. */
export const isFirstGift = (n: number, bonusTaps: number): boolean => n === 1 && bonusTaps === 0;

/** D446: what a tap's income is worth in time, as the pop's second line: "+45 s of sales", "+3 min of sales". */
export function salesLine(lucky: boolean): string {
  const s = lucky ? BONUS.luckyIncomeSeconds : BONUS.incomeSeconds;
  return s >= 120 && s % 60 === 0 ? `+${s / 60} min of sales` : `+${s} s of sales`;
}

/**
 * G93: where the "+$X" pop sits, in the scene area's own coordinates, for a tap at (x, y) on a box `boxHeight` tall.
 * Left is clamped so the pop's whole width stays on screen (its "+" was cut at the left edge); top is under the box, so the
 * lane at the top of the scene (under the tab strip) never pushes it out of sight.
 */
export function popPlace(x: number, y: number, width: number, boxHeight: number): { left: number; top: number } {
  const lo = BONUS_VIEW.popEdge;
  const hi = Math.max(lo, width - BONUS_VIEW.popWidth - BONUS_VIEW.popEdge);
  return { left: Math.min(hi, Math.max(lo, x - BONUS_VIEW.popWidth / 2)), top: Math.max(0, y + boxHeight / 2 + BONUS_VIEW.popGap) };
}

/** The box is drawn at this scale: bigger than the 60 × 44 art, the lucky slice biggest. */
export const bonusScale = (lucky: boolean): number => (lucky ? BONUS_VIEW.luckyScale : BONUS_VIEW.scale);

/** D437: the trailing sparkles, in the 60 × 44 art's units relative to its centre, behind the way it flies (dir 1 = to the right). */
export function sparkleTrail(dir: 1 | -1): { x: number; y: number; r: number }[] {
  return Array.from({ length: BONUS_VIEW.sparkles }, (_, i) => ({ x: -dir * (38 + i * 15), y: [-9, 7, -3][i % 3], r: 5 - i * 1 }));
}

/** Golden pizzas unlock with the rewards: when Nonna manages Downtown and the tutorial is over. */
export const bonusUnlocked = (s: GameState): boolean => rewardsUnlocked(s);

/** A golden pizza is on screen and can be tapped. */
export const bonusVisible = (s: GameState): boolean => bonusUnlocked(s) && s.bonus.until > s.playSeconds;

/**
 * What a tap pays: 45 s of citywide income (the rewards' income, which ignores boosts), the lucky slice 3 min; never less
 * than BONUS.minPayout.
 */
export function bonusPayout(s: GameState, lucky: boolean): number {
  const seconds = lucky ? BONUS.luckyIncomeSeconds : BONUS.incomeSeconds;
  return Math.max(BONUS.minPayout, minutesToCash(s, seconds / 60));
}

/**
 * Advance the schedule after a game tick (`playSeconds` has already moved by `dt`). One pizza at a time:
 *  - it appears once `next` is reached and nothing holds it back, and stays BONUS.visibleSeconds;
 *  - while held back (a scene, a popup or a drawer is open) the one on screen keeps its time and none appears;
 *  - when it flies away untapped, the next is a gap later.
 * Returns `s` itself when nothing changed.
 */
export function bonusTick(s: GameState, dt: number, hold: boolean): GameState {
  if (!(dt > 0) || !bonusUnlocked(s)) return s;
  const b = s.bonus;
  if (b.until > 0) {
    if (hold) return { ...s, bonus: { ...b, until: b.until + dt } };
    if (s.playSeconds >= b.until) return { ...s, bonus: { ...b, until: 0, next: s.playSeconds + bonusGap(b.seed, b.spawned) } };
    return s;
  }
  // D445: the very first one comes right after the unlock (a save loaded after the takeover scene would otherwise wait 20 s)
  if (!hold && b.spawned === 0 && b.next > s.playSeconds + BONUS.firstAfterUnlock) s = { ...s, bonus: { ...b, next: s.playSeconds + BONUS.firstAfterUnlock } };
  if (!hold && s.playSeconds >= s.bonus.next) return { ...s, bonus: { ...s.bonus, spawned: s.bonus.spawned + 1, until: s.playSeconds + BONUS.visibleSeconds } };
  return s;
}

export interface BonusCollected {
  state: GameState;
  paid: number;
  lucky: boolean;
}

/** Tap the golden pizza: pays, counts `stats.bonusTaps` and sets the next one. Null when none is on screen. */
export function collectBonus(s: GameState): BonusCollected | null {
  if (!bonusVisible(s)) return null;
  const lucky = isLucky(s.stats.bonusTaps);
  const paid = bonusPayout(s, lucky);
  const b = s.bonus;
  return {
    state: {
      ...s,
      cash: s.cash + paid,
      totalEarned: s.totalEarned + paid,
      stats: { ...s.stats, bonusTaps: s.stats.bonusTaps + 1 },
      bonus: { ...b, until: 0, next: s.playSeconds + bonusGap(b.seed, b.spawned) },
    },
    paid,
    lucky,
  };
}

/**
 * Time spent away takes the same off the pizza that was on screen when the game closed: gone if it would have flown away
 * (the next one is a gap later). Called once on a load, with the real seconds away.
 */
export function bonusAway(s: GameState, awaySeconds: number): GameState {
  const b = s.bonus;
  if (b.until <= 0 || !(awaySeconds > 0)) return s;
  const left = b.until - s.playSeconds - awaySeconds;
  if (left > 0) return { ...s, bonus: { ...b, until: s.playSeconds + left } };
  return { ...s, bonus: { ...b, until: 0, next: Math.max(b.next, s.playSeconds + bonusGap(b.seed, b.spawned)) } };
}
