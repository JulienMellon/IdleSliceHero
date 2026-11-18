// Industrial's shift clock, tint and whistle as plain data. Text is the copy's, by key. Pure: unit-tested in node.
import type { ShiftView } from '../../../engine/features/layers/industrial-shifts';
import { fill } from '../../report/report-model';
import { mmss } from '../layer-model';
import { dressed } from '../city-dress';
import { COPY } from './copy';

type ShiftId = 'day' | 'swing' | 'night';
const NAME = { day: COPY['layer.industrial.shift.day'], swing: COPY['layer.industrial.shift.swing'], night: COPY['layer.industrial.shift.night'] } as const;

/** "×2": what the shift pays on top of the demand, or '' when it pays the plain price. */
export const payTag = (valueMult: number): string => (valueMult > 1 ? `×${Math.round(valueMult * 10) / 10}` : '');

/** The HUD chip: the shift on the clock over the time to the next ("Night ×2" / "6:40"). */
export function shiftChip(v: Pick<ShiftView, 'name' | 'valueMult' | 'left'>): { rows: [string, string]; label: string } {
  const tag = payTag(v.valueMult);
  const time = mmss(v.left);
  return { rows: [tag ? `${v.name} ${tag}` : v.name, time], label: `${fill(COPY['layer.industrial.shift.chip'], { time })}. ${v.name} shift${tag ? `, pays ${tag}` : ''}` };
}

/** The scene's tint for a shift: the night is a deep blue wash; the swing a faint amber; the day none. */
export function shiftTint(shift: string): { color: string; opacity: number } | null {
  if (shift === 'night') return { color: '#0B1E4A', opacity: 0.42 };
  if (shift === 'swing') return { color: '#E8843D', opacity: 0.1 };
  return null;
}

/** The whistle's banner: "Whistle! Night Shift is on", and Big Sal's line on the night. */
export function whistle(shift: string, city?: string): { text: string; line: string | null; speaker: string | null } | null {
  if (!(shift in NAME)) return null;
  const text = fill(COPY['layer.industrial.shift.banner'], { shift: shiftName(shift as ShiftId, city) });
  return shift === 'night' ? { text, line: COPY['layer.industrial.shift.night.line'], speaker: 'Big Sal' } : { text, line: null, speaker: null };
}

/** A shift's name in a city (Cambridge: Morning, Afternoon and Night Lab). */
export const shiftName = (id: ShiftId, city?: string): string => dressed(city, `layer.industrial.shift.${id}`, NAME[id]);

export interface ShiftRow {
  id: ShiftId;
  name: string;
  /** "demand ×1.2 · pays ×2" */
  effect: string;
  now: boolean;
}

const x = (n: number) => `×${Math.round(n * 100) / 100}`;

/** The sheet's three shift rows in order, the one on the clock marked. */
export function shiftRows(current: string, shifts: readonly { id: ShiftId; demand: number; value: number }[], city?: string): ShiftRow[] {
  return shifts.map((s) => ({ id: s.id, name: shiftName(s.id, city), effect: `demand ${x(s.demand)} · pays ${x(s.value)}`, now: s.id === current }));
}

// ---------- the tint's shape (D484) ----------

/** A box in scene units. */
export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Where the night falls: the sky and the skyline are tinted, the pizzeria is not (a flat wash over the whole scene greyed every face). The
 * building's box is the front wall's width at the front line (`frontY`) up to the roof; the tint covers the scene's width down to the front line
 * except that box. `roofY` is the roof's top edge in scene units. The street below the front line keeps its colours (street lamps).
 */
export function nightShape(lay: { L: number; R: number }, sceneW: number, frontY: number, roofY: number): { sky: Box; house: Box; path: string } {
  const house: Box = { x0: Math.max(0, lay.L - 12), y0: roofY, x1: Math.min(sceneW, lay.R + 12), y1: frontY };
  const sky: Box = { x0: 0, y0: 0, x1: sceneW, y1: frontY };
  const r = (b: Box) => `M${b.x0} ${b.y0} H${b.x1} V${b.y1} H${b.x0} Z`;
  return { sky, house, path: `${r(sky)} ${r(house)}` };
}

/** The moon in the sky, in scene units: a crescent (a disc and a smaller disc of the sky's colour biting it). */
export const MOON = { cx: 60, cy: 36, r: 11, bite: { dx: 5, dy: -3, r: 9.5 } } as const;
/** The warm light of the shop's windows at night: an amber wash over the building, so the interior reads lit against the blue sky. */
export const WARM = { color: '#FFB347', opacity: 0.1 } as const;
