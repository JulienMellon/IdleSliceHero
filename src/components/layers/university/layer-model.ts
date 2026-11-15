import { CHAR_W, CHIP_H } from '../layer-model';

// What card S2b's three layers share beyond the layer folder's own helpers (../layer-model.ts: mmss, chip lines and width, where the
// notices start; ../layer-geometry.ts: scene to window; ../shop-layout.ts: the room). Pure: unit-tested in node.

/** How long a layer's notice stays up (ms). */
export const TOAST_MS = 4000;
/** A layer's notice is at least this tall (pt): two lines, like the endgame toast. */
export const TOAST_H = 52;

/** Every button of the layers' sheets is drawn at the tap minimum (44 pt): Close, the mix's plus and minus, the Ingredients buy. */
export const BUTTON_H = 44;

/** A key that changed from one real value to another is news; the first value seen, and a return to nothing, are not. */
export const isNews = (prev: string | null, next: string): boolean => prev !== null && next !== '' && prev !== next;

/** The widest a chip gets (S2a's cap). */
export const CHIP_MAX = 76;

/** A chip's text on two rows, split at the space that leaves the rows nearest in length ("3 out on campus" → "3 out on" / "campus"); one word stays on row one. */
export function twoRows(text: string): [string, string] {
  const words = text.split(' ').filter(Boolean);
  if (words.length < 2) return [text, ''];
  let best = 1;
  let gap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (d < gap) {
      gap = d;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** The width of a two-row chip (pt): its longest row at S2a's measured character width (../layer-model.ts CHAR_W) plus the border and padding, between 44 and the cap. */
export const chipPillWidth = (rows: readonly string[]): number => Math.min(CHIP_MAX, Math.max(CHIP_H, Math.ceil(Math.max(0, ...rows.map((r) => r.length)) * CHAR_W) + 12));
