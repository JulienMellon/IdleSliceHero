// The goal bar's numbers and colours as plain data (D297). The label is drawn twice: dark ink over the cream track,
// and a cream copy clipped to the fill's width, so it stays readable at every fill fraction. Pure: unit-tested in node.
import { C } from '../theme';

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
