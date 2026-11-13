// The goal bar's numbers and colours as plain data (D297). The label is drawn twice: dark ink over the cream track,
// and a cream copy clipped to the fill's width, so it stays readable at every fill fraction. Pure: unit-tested in node.
import { finaleSeen } from '../engine/features/counterattack';
import { MASTERY_MAX, masteryTotal, nextStar } from '../engine/features/mastery';
import { def, type GameState } from '../engine/game';
import { C } from '../theme';
import { copy } from './endgame/copy-text';
import { nextStarLine, starName } from './endgame/mastery-model';

export const GOAL_BAR = {
  /** The bar's own border (pt); the fill and the clipped copy live inside it. */
  border: 2,
  track: '#FFE7C2',
  /** A caramel fill: cream on it reads at 4.5:1 or better (the old cheese yellow gave cream 1.5:1). */
  fill: '#A8560F',
  onFill: '#FFF4E0',
  onTrack: C.ink,
} as const;

export interface GoalBarLayout {
  /** Fill fraction, 0–1 (0 when the target is 0 or not a number). */
  pct: number;
  /** Full and tappable: the bar turns basil and its label white, so there is nothing to split. */
  ready: boolean;
  /** Width inside the border (0 until measured). */
  innerW: number;
  /** The fill's width, and the width the cream copy of the label is clipped to (the same number). */
  fillW: number;
  /** Draw the cream copy at all: only while something is filled and the bar has been measured. */
  split: boolean;
}

/** One whole word, the amount or the icon of the goal line: x from the bar's inner left edge, and its width (pt). */
export interface GoalSpan {
  x: number;
  w: number;
}

/**
 * Where the two-tone seam really goes (G88). A seam inside a word or the amount cut a letter in two ("Hire" read "ire")
 * and split "$15.4M" into two colours. So when the fill's edge lands inside a span, the seam (and the fill's visible
 * edge with it) moves to the nearer end of that span, at most half a word. In a gap, in the padding, or past the last
 * span the seam stays exactly where the progress is, so a small fill never vanishes.
 */
export function snapSeam(fillW: number, spans: readonly GoalSpan[]): number {
  for (const s of spans) {
    if (s.w <= 0) continue;
    if (fillW > s.x && fillW < s.x + s.w) return fillW - s.x >= s.w / 2 ? s.x + s.w : s.x;
  }
  return fillW;
}

/** The label split into the words that are measured and coloured whole (blank runs dropped). */
export const goalWords = (label: string): string[] => label.split(/\s+/).filter(Boolean);

export function goalBarLayout(current: number, target: number, tappable: boolean, outerW: number, spans: readonly GoalSpan[] = []): GoalBarLayout {
  const raw = target > 0 ? current / target : 0;
  const pct = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 0;
  const ready = tappable && pct >= 1;
  const innerW = Math.max(0, outerW - 2 * GOAL_BAR.border);
  const fillW = pct >= 1 ? innerW : Math.min(innerW, snapSeam(pct * innerW, spans));
  return { pct, ready, innerW, fillW, split: !ready && fillW > 0 };
}

/** "a" or "an" from the word's first letter: "a Suburbs", "an Uptown", "an Industrial" (B5). */
export const aOrAn = (word: string): 'a' | 'an' => (/^[aeiou]/i.test(word.trim()) ? 'an' : 'a');

// ---------- the line's fit (C105, T81) ----------
/** Horizontal padding inside the bar (pt) and the gap kept between the words and the amount. */
export const GOAL_PAD = 12;
export const GOAL_GAP = 6;
/** Largest Dynamic Type scale the goal line follows: the bar is 30 pt tall, so past this the words would not fit it. */
export const GOAL_FONT_MAX_SCALE = 1.2;
export const GOAL_FONT = { label: 14, amount: 13 } as const;
/** The words keep at least this much room (or all of it, if the label is shorter): "Waterfront:" stays readable before the amount ever clips. */
export const GOAL_MIN_WORDS_W = 72;
/** The bar's layout contract: the words are one row that shrinks and clips, the amount sits outside it and never shrinks (C105). */
export const GOAL_LAYOUT = {
  words: { flexShrink: 1, overflow: 'hidden' },
  amount: { flexShrink: 0 },
} as const;

/** Bold text's width at `size` pt, estimated at 0.56 em a character (the Baloo-style face runs ~0.52–0.55; padded so the check errs wide). */
export const goalTextW = (text: string, size: number): number => Math.ceil(text.length * size * 0.56);

export interface GoalFit {
  amountW: number;
  labelW: number;
  /** Room the words get once the amount has its full width. */
  wordsRoom: number;
  /** The amount shows whole, with at least min(its words, GOAL_MIN_WORDS_W) left for the words. */
  fits: boolean;
}

/** Whether a goal line fits a bar `barW` wide (its outer width, border included): the amount is never clipped and the words keep a readable share. */
export function goalLabelFit(label: string, amount: string, barW: number): GoalFit {
  const inner = Math.max(0, barW - 2 * GOAL_BAR.border) - 2 * GOAL_PAD;
  const amountW = goalTextW(amount, GOAL_FONT.amount);
  const labelW = goalTextW(goalWords(label).join(' '), GOAL_FONT.label);
  const wordsRoom = inner - amountW - GOAL_GAP;
  return { amountW, labelW, wordsRoom, fits: amountW <= inner && wordsRoom >= Math.min(labelW, GOAL_MIN_WORDS_W) };
}
export const goalLabelFits = (label: string, amount: string, barW: number): boolean => goalLabelFit(label, amount, barW).fits;

// ---------- the post-story goal (v5.15, D427) ----------

/** The goal bar once the story is told: the stars of every shop, 0..18. */
export interface MasteryGoal {
  /** "Mastery 7/18 · Next: Flagship in Suburbs": the words clip at their end, so the count always shows. */
  label: string;
  /** G98: the same line short, "\u260510/18 \u00B7 Flagship: Waterfront", for a narrow bar (an event chip beside it): the star stands for "Mastery". */
  short: string;
  /** The amount beside the words: the next star's steps with their unit ("2/3 heads"), or a star when all 18 are earned. */
  text: string;
  /** The bar: stars earned of 18. */
  current: number;
  target: number;
}

/** D466: the unit after the next star's steps, so "3/4" is never bare: heads hired, footprint sizes, oven grades. */
export const STAR_UNIT = { heads: 'heads', flagship: 'sizes', golden: 'grades' } as const;

/** The goal bar's line after the last finale, or null while the story is still being told (then the ordinary goals show). */
export function masteryGoal(g: GameState): MasteryGoal | null {
  if (!finaleSeen(g)) return null;
  const n = masteryTotal(g);
  const next = nextStar(g);
  const count = copy('goal.mastery', { n });
  const short = next ? `\u2605${n}/18 \u00B7 ${starName(next.star)}: ${def(next.shopId).name}` : `\u2605${n}/18`;
  return { label: next ? `${count} \u00B7 ${nextStarLine(next)}` : count, short, text: next ? `${next.have}/${next.need} ${STAR_UNIT[next.star]}` : '\u2605', current: n, target: MASTERY_MAX };
}

/** The line and its amount both show whole in a bar `barW` wide (no word clipped): the strict form of `goalLabelFits`. */
export function goalFitsWhole(label: string, amount: string, barW: number): boolean {
  const f = goalLabelFit(label, amount, barW);
  return f.amountW <= Math.max(0, barW - 2 * GOAL_BAR.border) - 2 * GOAL_PAD && f.wordsRoom >= f.labelW;
}

/**
 * G98: which line the bar shows for the width it has, for a goal with a short form: the full line with its amount if both fit whole;
 * else the short one ("\u260510/18 \u00B7 Flagship: Waterfront") with the amount ("3/4 sizes"); else the short one alone, which gets all
 * the room. A goal with no short line is shown as it is (the ordinary rule, `goalLabelFit`, applies to it).
 */
export function goalLine(goal: { label: string; short?: string; text?: string }, barW: number): { label: string; text: string | undefined } {
  if (!goal.short || !(barW > 0)) return { label: goal.label, text: goal.text };
  const text = goal.text ?? '';
  if (goalFitsWhole(goal.label, text, barW)) return { label: goal.label, text: goal.text };
  if (goalFitsWhole(goal.short, text, barW)) return { label: goal.short, text: goal.text };
  return { label: goal.short, text: '' };
}
