// Fitting a prop's text (a name tag's "SENIOR ASSOCIATE") into the room its prop has. Pure, so every `propText` in the scenes is tested in node.
// Sizes are in backdrop art units (the panel shows 1.16 to 2.4 pt per unit), so a font of 9 units is never under 10 pt.

/** The widest an upper-case bold letter runs, as a share of the font size (a little over the true average, so a line never overruns). */
export const PROP_CHAR_W = 0.66;
/** Line height as a share of the font size. */
export const PROP_LINE_H = 1.18;
/** The smallest and the biggest font a prop's text takes, in art units. */
export const PROP_FONT = { min: 9, max: 16 } as const;
/** A one-line fit at least this big is kept on one line; a smaller one tries two. */
export const ONE_LINE_FONT = 12;

export interface FittedText {
  lines: string[];
  /** Art units, to a half unit. */
  fontSize: number;
  /** Whether it reaches PROP_FONT.min inside the box. */
  fits: boolean;
}

const sizeFor = (lines: readonly string[], w: number, h: number) => {
  const widest = Math.max(...lines.map((l) => l.length), 1);
  const raw = Math.min(PROP_FONT.max, w / (widest * PROP_CHAR_W), h / (lines.length * PROP_LINE_H));
  return Math.floor(raw * 2) / 2;
};

/** The ways to break `text` onto two lines: at every space (the best split is the one with the shortest longer line). */
function twoLines(text: string): string[] | null {
  let best: string[] | null = null;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== ' ') continue;
    const a = text.slice(0, i).trim();
    const b = text.slice(i + 1).trim();
    if (!a || !b) continue;
    if (!best || Math.max(a.length, b.length) < Math.max(best[0].length, best[1].length)) best = [a, b];
  }
  return best;
}

/** `text` in a w by h box: one line if it reads at ONE_LINE_FONT or more, else the better of one and two lines. */
export function fitPropText(text: string, w: number, h: number): FittedText {
  const one = [text];
  const fsOne = sizeFor(one, w, h);
  if (fsOne >= ONE_LINE_FONT) return { lines: one, fontSize: fsOne, fits: true };
  const two = twoLines(text);
  const fsTwo = two ? sizeFor(two, w, h) : 0;
  const useTwo = fsTwo > fsOne;
  const lines = useTwo && two ? two : one;
  const fontSize = useTwo ? fsTwo : fsOne;
  return { lines, fontSize, fits: fontSize >= PROP_FONT.min };
}

/** The font for one line that must stay on one line in `w` (a receipt's printed line), to a half unit, capped at `max`. */
export function lineFont(text: string, w: number, max: number = PROP_FONT.max): number {
  return Math.floor(Math.min(max, w / (Math.max(text.length, 1) * PROP_CHAR_W)) * 2) / 2;
}
