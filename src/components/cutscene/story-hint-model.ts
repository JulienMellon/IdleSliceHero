// The story wait hint as a one-line banner in the waiting neighbourhood's drawer (v5.16). `storyWaitHint` (engine/game.ts) names the
// neighbourhood whose story is held: "Win over Industrial to continue Uptown’s story". This picks the drawer it belongs to and sizes the
// text to one line. Pure, so node tests pin both.
import type { NeighborhoodId } from '../../content/types';
import { findHood } from '../../content/cities';

/** The same display name `storyWaitHint` prints ("North End", not "North-end"). */
const capital = (id: string) => findHood(id)?.name ?? id.charAt(0).toUpperCase() + id.slice(1);

/** The hint when it is about `hood` (the neighbourhood whose story waits), else null: only that shop's drawer shows it. */
export function hintForHood(hint: string | null, hood: NeighborhoodId): string | null {
  return hint !== null && hint.endsWith(`to continue ${capital(hood)}’s story`) ? hint : null;
}

/** The banner's room beside the drawer's edge padding (10 each side) and its own (10 each side, 1.5 border). */
export const HINT_SIDE_PAD = 10 * 2 + 10 * 2 + 3;
/** The banner's font: the drawer's banner size (12.5) while the line fits, shrinking to 10 pt, the floor. A semibold letter runs about 0.54 of its size. */
export const HINT_FONT = { max: 12.5, min: 10, charW: 0.54 } as const;

export interface HintFit {
  fontSize: number;
  /** The whole line fits on one line at that size. */
  fits: boolean;
}

/** The font that keeps `text` on one line in a drawer `screenW` pt wide. */
export function hintFit(text: string, screenW: number): HintFit {
  const room = screenW - HINT_SIDE_PAD;
  const raw = Math.floor((room / (Math.max(text.length, 1) * HINT_FONT.charW)) * 2) / 2;
  const fontSize = Math.max(HINT_FONT.min, Math.min(HINT_FONT.max, raw));
  return { fontSize, fits: text.length * HINT_FONT.charW * fontSize <= room };
}
