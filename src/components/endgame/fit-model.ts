// Does it fit an iPhone SE (320 pt)? Plain arithmetic for the HUD's top row and the sidewalk's cards (G101, G102). React Native Web
// does not shrink text to fit (adjustsFontSizeToFit is native only), so a long price or title would clip: every text that can be long
// gets its size from `fitFont` and the width its row really leaves it. Pure: unit-tested in node, at 320 and 393.
import { SIDEWALK_ROW, STATION_CARD } from '../tap-targets';

/** Bold text's width per em, padded (the Fredoka face runs ~0.52-0.58): the check errs wide, never narrow. */
export const FIT_EM = 0.6;

/** The largest size in half points, between `min` and `max`, at which `text` fits `width`. Below `min` it stays at `min` and the Text ellipsizes. */
export function fitFont(text: string, width: number, max: number, min: number): number {
  if (!text.length || !(width > 0)) return max;
  const fit = Math.floor((width / (text.length * FIT_EM)) * 2) / 2;
  return Math.max(min, Math.min(max, fit));
}

/** True when `text` fits `width` at `size` (by the same estimate). */
export const fits = (text: string, width: number, size: number): boolean => text.length * size * FIT_EM <= width;

// ---------- the sidewalk row ----------

/**
 * Width (pt) each slot's button text has, left to right. `spans` are the slots' flex weights (a merged card counts several);
 * `chip` is the amount chip at the row's left end. Framed cards (a managed shop) carry a card border and padding; the unframed chips of
 * an unmanaged shop share the stack beside it with 4 pt between them (sidewalk-row.tsx).
 */
export function cardTextWidths(screenW: number, spans: readonly number[], { chip, framed }: { chip: boolean; framed: boolean }): number[] {
  const { edge, gap, allWidth, amountWidth, buttonChrome } = SIDEWALK_ROW;
  const row = screenW - 2 * edge;
  const total = spans.reduce((t, s) => t + s, 0) || 1;
  if (framed) {
    const children = spans.length + 1 + (chip ? 1 : 0);
    const avail = row - allWidth - (chip ? amountWidth : 0) - gap * (children - 1);
    const chrome = 2 * (STATION_CARD.border + STATION_CARD.padding) + buttonChrome;
    return spans.map((s) => (avail * s) / total - chrome);
  }
  const stack = row - allWidth - (chip ? amountWidth : 0) - gap * (1 + (chip ? 1 : 0));
  const inner = stack - SIDEWALK_ROW.chipGap * (spans.length - 1);
  return spans.map((s) => (inner * s) / total - buttonChrome);
}

/** The station icon beside a card's title takes 14 pt of the line; a card narrower than this much text drops it (at 320 pt with the amount chip every card does). */
export const iconWidth = (textW: number): number => (textW >= 44 ? 14 : 0);

/** The sizes a station card's three lines take for the width it has: the price (15 pt at most), the small title and the foot line. */
export function cardFonts(textW: number, { label, sub, foot, iconW = 0 }: { label: string; sub?: string | null; foot?: string | null; iconW?: number }) {
  return {
    label: fitFont(label, textW, 15, 9),
    sub: sub ? fitFont(sub, textW - iconW, 10, 7) : 10,
    foot: foot ? fitFont(foot, textW, 9, 7) : 9,
  };
}

// ---------- the HUD's top row ----------

/** The HUD's round buttons are drawn this big (pt), with this gap between them. */
export const HUD_ICON = 40;
export const HUD_GAP = 6;
export const HUD_PAD = 12;

/** The width the cash pill gets: the row minus its round buttons (book and map always; the clipboard and gift once rewards unlock; the top-row chips). */
export function cashWidth(screenW: number, { tasks, gift, topChips }: { tasks: boolean; gift: boolean; topChips: number }): number {
  const icons = 2 + (tasks ? 1 : 0) + (gift ? 1 : 0) + topChips;
  return screenW - 2 * HUD_PAD - icons * HUD_ICON - icons * HUD_GAP;
}

/** The cash text's size: 34 pt, shrunk to fit its pill (never below 16). */
export const cashFont = (text: string, width: number): number => fitFont(text, width, 34, 16);

/** The line under the cash: "citywide" goes first when the pill is narrow, then the size shrinks (never below 10). */
export function rateLine(sub: string, width: number, extra = 0): { text: string; size: number } {
  // `extra` is the running boost's text after it ("· 2× 10m"): characters the line must also hold
  const room = (t: string) => t + ' '.repeat(extra);
  const short = sub.replace(/ citywide$/, '');
  const text = fits(room(sub), width, 11) ? sub : short;
  return { text, size: fitFont(room(text), width, 13, 10) };
}

// ---------- the Scrapbook's header ----------

/** Back (70) + the title + "Stories 12/24" share one row of 320 - 28 pt (the header's padding): sizes in pt. */
export const SCRAPBOOK_HEAD = { back: 70, title: 20, count: 13 } as const;
