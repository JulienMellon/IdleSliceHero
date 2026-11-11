// The scene's big moments as plain data (D415, D418): where the milestone badge and the rising "Lv N" chip go, and how
// long the chip row dims. Pure, so the budgets are tested in node (the drawing lives in kitchen-hud.tsx).
import type { Station } from '../../engine/pipeline';
import type { Rect } from './stations';

/** A station reaches Lv 25 / 50 / 100: a gold badge 72 pt across, centred over the station's furniture. */
export const MILE_R = 36;
export const MILE_SECONDS = 1.6;
/** The chip row (rail, rings, count pills) dims while the badge is up, so the badge is the only thing to read. */
export const HUD_DIM_SECONDS = 1.2;
export const HUD_DIM_OPACITY = 0.3;
/** The chip row's half-height on screen: the rail is 30 tall; the rings' count pills reach a little lower. */
export const CHIP_ROW_HALF = 15;
/** Air between the chip row and anything that rises or pops under it. */
export const ROW_AIR = 4;

export const STATION_LABEL: Record<Station, string> = { prep: 'PREP', oven: 'OVENS', counter: 'COUNTER' };

/** Where the badge's centre goes: the middle of the station's furniture, pushed down if need be so its top clears the chip row. */
export function mileAnchor(rect: Rect, rowY: number): { cx: number; cy: number } {
  return { cx: (rect.x0 + rect.x1) / 2, cy: Math.max((rect.y0 + rect.y1) / 2, rowY + CHIP_ROW_HALF + ROW_AIR + MILE_R) };
}
/** The head's speech pill hangs directly under the badge: its tail tip touches the disc's lower edge. */
export const mileSpeechY = (cy: number) => cy + MILE_R + 20;

/** Pop-in scale by age (s): 0.5 → 1.12 → 1 over the first 0.3 s, snapped to tenths so the memoised badge re-renders only ~4 times. */
export function mileScale(age: number): number {
  if (age < 0 || age >= MILE_SECONDS) return 0;
  if (age >= 0.3) return 1;
  const k = age / 0.3;
  return Math.round((k < 0.6 ? 0.5 + (k / 0.6) * 0.62 : 1.12 - ((k - 0.6) / 0.4) * 0.12) * 10) / 10;
}
/** Badge opacity: full, then fading over its last 0.3 s (in fifths). */
export const mileOpacity = (age: number) => (age < 0 || age >= MILE_SECONDS ? 0 : age > MILE_SECONDS - 0.3 ? Math.round(((MILE_SECONDS - age) / 0.3) * 5) / 5 : 1);
/** The chip row's opacity `age` seconds after a milestone began (1 outside the dim). */
export const hudOpacity = (age: number) => (age >= 0 && age < HUD_DIM_SECONDS ? HUD_DIM_OPACITY : 1);
/** Font size of "Lv 25" / "Lv 100" so the level fits the disc's chord. */
export const mileLevelSize = (text: string) => (text.length > 5 ? 20 : 24);
/** "+108% faster" → "+108%": the speed-up rides in the badge instead of a second pill. */
export const mileSub = (flash: string | null) => (flash ? flash.replace(/\s*faster$/, '') : null);

/**
 * The "Lv N" chip's centre `k` (0..1) of the way through its rise: it starts on the station's furniture and floats
 * `rise` up, but never into the chip row (D418: it used to start on the badge and cross the Ovens count). `r` is the chip's radius.
 */
export function chipAt(rect: Rect, rowY: number, r: number, k: number, rise: number): { x: number; y: number } {
  const start = (rect.y0 + rect.y1) / 2;
  return { x: (rect.x0 + rect.x1) / 2, y: Math.max(rowY + CHIP_ROW_HALF + ROW_AIR + r, start - k * rise) };
}
