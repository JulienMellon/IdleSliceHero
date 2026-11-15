// Industrial's shift clock, tint and whistle as plain data. Text is the copy's, by key. Pure: unit-tested in node.
import type { ShiftView } from '../../../engine/features/layers/industrial-shifts';
import { fill } from '../../report/report-model';
import { mmss } from '../layer-model';
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
export function whistle(shift: string): { text: string; line: string | null; speaker: string | null } | null {
  if (!(shift in NAME)) return null;
  const text = fill(COPY['layer.industrial.shift.banner'], { shift: NAME[shift as ShiftId] });
  return shift === 'night' ? { text, line: COPY['layer.industrial.shift.night.line'], speaker: 'Big Sal' } : { text, line: null, speaker: null };
}

export interface ShiftRow {
  id: ShiftId;
  name: string;
  /** "demand ×1.2 · pays ×2" */
  effect: string;
  now: boolean;
}

const x = (n: number) => `×${Math.round(n * 100) / 100}`;

/** The sheet's three shift rows in order, the one on the clock marked. */
export function shiftRows(current: string, shifts: readonly { id: ShiftId; demand: number; value: number }[]): ShiftRow[] {
  return shifts.map((s) => ({ id: s.id, name: NAME[s.id], effect: `demand ${x(s.demand)} · pays ${x(s.value)}`, now: s.id === current }));
}
