// The shop report as plain data (card P1): the strip above the sidewalk, its sheet, the cards' effect lines. Pure: unit-tested in node.
// All text is the copy's, by key (content/service.ts COPY); nothing here is drawn. The strip and the sheet pass the primitives they need.
import { COPY, FIX_ROWS, MANAGER_COPY_KEY, SERVICE, type CopyKey } from '../../content/service';
import { MANAGERS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { count, duration, money } from '../../engine/format';
import type { GameState } from '../../engine/game';
import { reportView, type FloorLamp, type KitchenStation, type Lamp, type ReportView } from '../../engine/features/service';
import { FIT_EM, fits } from '../endgame/fit-model';

/** Fill `{name}` slots of a copy line. An unknown slot stays as written (a test catches it). */
export const fill = (template: string, vars: Readonly<Record<string, string | number>>): string => template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
export const copy = (key: CopyKey, vars: Readonly<Record<string, string | number>> = {}): string => fill(COPY[key], vars);

// ---------- the lamps ----------

export type LampTone = 'slammed' | 'busy' | 'idle' | 'full' | 'steady' | 'quiet';
/** The dots' colours: red where it is jammed, amber where it is busy, green where it has room, blue-grey where it is quiet. */
export const LAMP_COLOR: Record<LampTone, string> = {
  slammed: '#D9443A',
  full: '#D9443A',
  busy: '#E8A33D',
  steady: '#4FA05B',
  idle: '#4FA05B',
  quiet: '#8AA4B8',
};
export const lampWord = (kind: KitchenStation | 'floor', lamp: Lamp | FloorLamp): string => copy(`lamp.${kind === 'floor' ? 'floor' : 'station'}.${lamp}` as CopyKey);

// ---------- the strip ----------

export type StripKind = 'kitchen' | 'quiet' | 'tipping' | 'cold';

/** Which line the strip shows. Cold first (it says what ends it), then a Quiet floor (go find customers), then the kitchen as the limit, then the tip. Null: nothing to say. */
export function stripKind(v: ReportView): StripKind | null {
  if (v.state === 'inactive') return null;
  if (v.state === 'cold') return 'cold';
  if (v.lamps.floor === 'quiet') return 'quiet';
  if (v.kitchenLimits && v.state !== 'tipping') return 'kitchen';
  return v.state === 'tipping' ? 'tipping' : null;
}

/** The strip's line for a shop: the manager's when one is hired (their `report.<id>.*` copy), else the neutral copy. */
export function stripLine(v: ReportView, id: NeighborhoodId, managed: boolean): { kind: StripKind; text: string } | null {
  const kind = stripKind(v);
  if (!kind) return null;
  const key = (managed ? `report.${MANAGER_COPY_KEY[id]}.${kind}` : `report.${kind}`) as CopyKey;
  const vars = {
    served: count(Math.max(0, Math.round(v.perMin.sold))),
    wanted: count(Math.max(0, Math.round(v.perMin.wanted))),
    could: count(Math.max(0, Math.round(v.perMin.kitchen))),
    lost: `${money(v.lostPerMinute)}/min`,
  };
  return { kind, text: copy(key, vars) };
}

/** What the strip draws, as primitives only (the component selects this with a shallow compare, so it repaints when a word changes, never on a tick). */
export interface StripModel {
  show: boolean;
  kind: StripKind | '';
  text: string;
  /** The manager's id (their face badge), or '' without one. */
  manager: string;
  prep: LampTone;
  ovens: LampTone;
  counter: LampTone;
  floor: LampTone;
  /** The worst lamp's dot ('prep' ... 'floor') and its one word, or ''. */
  worstDot: string;
  word: string;
}

export const HIDDEN_STRIP: StripModel = Object.freeze({ show: false, kind: '', text: '', manager: '', prep: 'idle', ovens: 'idle', counter: 'idle', floor: 'steady', worstDot: '', word: '' }) as StripModel;

export function stripModel(g: GameState, id: NeighborhoodId, now: number): StripModel {
  const v = reportView(g, id, now);
  const managed = g.shops[id].managed;
  const line = stripLine(v, id, managed);
  if (!line) return HIDDEN_STRIP;
  return {
    show: true,
    kind: line.kind,
    text: line.text,
    manager: managed ? MANAGERS[id].id : '',
    prep: v.lamps.prep,
    ovens: v.lamps.ovens,
    counter: v.lamps.counter,
    floor: v.lamps.floor,
    worstDot: v.worst?.kind ?? '',
    word: v.worst ? lampWord(v.worst.kind, v.worst.lamp) : '',
  };
}

/** The drawer's header: the report's line when the shop takes part in it, else null (the drawer keeps its own). */
export function drawerLine(g: GameState, id: NeighborhoodId): string | null {
  const line = stripLine(reportView(g, id, g.lastSavedAt), id, g.shops[id].managed);
  return line ? line.text : null;
}

// ---------- fitting the strip's line ----------

/** The strip: one row, 44 pt, directly above the sidewalk row. Its pieces' widths are here so the fit arithmetic and the layout share them. */
export const STRIP = {
  height: 44,
  margin: 8,
  padX: 8,
  dot: 10,
  dotGap: 5,
  /** Four dots with their gaps, and the lamp block's width (the one-word label under them needs about as much). */
  lampsWidth: 4 * 10 + 3 * 5 + 4,
  gap: 8,
  /** The manager's face badge. */
  badge: 28,
  /** Gap between the strip and the sidewalk row below it. */
  above: 4,
  maxLines: 3,
  fonts: [11, 10] as readonly number[],
} as const;

/** The width of the strip's line on a screen `screenW` wide, with or without a manager's badge. */
export const stripTextWidth = (screenW: number, withBadge: boolean): number =>
  screenW - 2 * STRIP.margin - 2 * STRIP.padX - STRIP.lampsWidth - STRIP.gap - (withBadge ? STRIP.badge + STRIP.gap : 0);

/** How many lines `text` takes at `size` in `width` pt (greedy word wrap by the same per-character estimate as `fitFont`). */
export function wrapLines(text: string, width: number, size: number): number {
  const perLine = Math.max(1, Math.floor(width / (size * FIT_EM)));
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const need = used === 0 ? word.length : used + 1 + word.length;
    if (need <= perLine) used = need;
    else {
      lines += 1;
      used = word.length;
    }
  }
  return lines;
}

/** The largest font of `STRIP.fonts` at which the line takes at most `STRIP.maxLines` lines; the smallest when none does. */
export function stripFont(text: string, width: number): { size: number; lines: number } {
  for (const size of STRIP.fonts) {
    const lines = wrapLines(text, width, size);
    if (lines <= STRIP.maxLines) return { size, lines };
  }
  const size = STRIP.fonts[STRIP.fonts.length - 1];
  return { size, lines: wrapLines(text, width, size) };
}

// ---------- the sheet ----------

const perMin = (x: number) => `${count(Math.max(0, Math.round(x)))}/min`;
const pct = (x: number) => `${Math.round(x * 100)}%`;

export interface SheetRow {
  key: KitchenStation | 'floor';
  name: string;
  /** Pizzas a minute: what the station can make, or what is coming in. */
  rate: string;
  /** Load for a station, wanted ÷ kitchen for the floor. */
  load: string;
  tone: LampTone;
  word: string;
}

export interface SheetModel {
  title: string;
  rows: SheetRow[];
  service: string;
  tip: string;
  cold: string;
  /** "Cold in 40 s", "The line is cold: get service back to 60%", or null. */
  timer: string | null;
  state: ReportView['state'];
  fixes: { key: string; title: string; line: string; buys: string }[];
}

const STATION_NAME: Record<KitchenStation | 'floor', string> = { prep: 'Prep', ovens: 'Ovens', counter: 'Counter', floor: 'Orders coming in' };

export function sheetModel(g: GameState, id: NeighborhoodId, now: number): SheetModel {
  const v = reportView(g, id, now);
  const rows: SheetRow[] = (['prep', 'ovens', 'counter'] as const).map((k) => ({ key: k, name: STATION_NAME[k], rate: perMin(v.perMin[k]), load: pct(v.loads[k]), tone: v.lamps[k], word: lampWord(k, v.lamps[k]) }));
  rows.push({ key: 'floor', name: STATION_NAME.floor, rate: perMin(v.perMin.wanted), load: pct(v.floorRatio), tone: v.lamps.floor, word: lampWord('floor', v.lamps.floor) });
  const timer = v.state === 'cold' ? `The line is cold. Get service back to ${pct(SERVICE.coldBelow)}.` : v.coldIn !== null ? `Cold in ${duration(Math.ceil(v.coldIn))} if it stays under ${pct(SERVICE.coldBelow)}.` : null;
  return {
    title: copy('report.sheet.title'),
    rows,
    service: pct(v.service),
    tip: copy('report.sheet.tip'),
    cold: copy('report.sheet.cold'),
    timer,
    state: v.state,
    fixes: FIX_ROWS.map((f) => ({ key: f.key, title: copy(`report.sheet.fix.${f.key}.title` as CopyKey), line: copy(`report.sheet.fix.${f.key}.line` as CopyKey), buys: f.buys })),
  };
}

// ---------- cards say what they do ----------

/** "+$250/min · pays back in 12m": the gain a minute and the payback time (cost ÷ gain). `gain` is cash a second. Null when it adds nothing. */
export function effectLine(gain: number | null, cost: number | null): string | null {
  if (gain === null || !(gain > 1e-9)) return null;
  return copy('effect.gain', { gain: money(gain * 60), time: cost !== null && cost > 0 ? duration(Math.max(1, Math.ceil(cost / gain))) : 'now' });
}
/** The no-gain line: "Prep isn't holding you back". */
export const noGainLine = (station: string): string => copy('effect.nogain', { station });
export const headEffect = (): string => copy('effect.head');
export const managerEffect = (): string => copy('effect.manager');

/** A sidewalk card's foot line: the longest of the gain with its payback, the gain alone, or a shorter gain that fits `width` (the card's text width). */
export function compactEffect(gain: number | null, cost: number | null, width: number): string | null {
  if (gain === null || !(gain > 1e-9)) return null;
  const g = `+${money(gain * 60)}/min`;
  const candidates = cost !== null && cost > 0 ? [`${g} · ${duration(Math.max(1, Math.ceil(cost / gain)))}`, g, `+${money(gain * 60)}/m`] : [g, `+${money(gain * 60)}/m`];
  return candidates.find((c) => fits(c, width, 10)) ?? candidates[candidates.length - 1];
}
