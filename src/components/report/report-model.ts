// The shop report as plain data (card U3, v5.22): the strip above the sidewalk, its sheet, the cards' effect lines. Pure: unit-tested in node.
// One bar per station and one for the drivers, all the same colour, each as long as the pizzas a minute it can handle, with one dashed line
// across them at the customers a minute. Nothing here names a station as the limit and nothing is colour coded (the lamps are gone).
// Report words come from content/copy/home/report.ts by `t()`; the effect lines still read content/service.ts COPY.
import { COPY, SERVICE, type CopyKey } from '../../content/service';
import { cityOf } from '../../content/cities';
import { t } from '../../content/copy';
import type { NeighborhoodId } from '../../content/types';
import type { CoachTargetId } from '../../engine/coach-types';
import { count, duration, money } from '../../engine/format';
import type { GameState } from '../../engine/game';
import { reportActive, reportView, type K3, type ReportView } from '../../engine/features/service';
import { FIT_EM, fits } from '../endgame/fit-model';

/** Fill `{name}` slots of a copy line. An unknown slot stays as written (a test catches it). */
export const fill = (template: string, vars: Readonly<Record<string, string | number>>): string =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
export const copy = (key: CopyKey, vars: Readonly<Record<string, string | number>> = {}): string => fill(COPY[key], vars);

/** Orders a minute as the report writes them: a whole number, K/M past a thousand. */
const whole = (x: number): string => count(Math.max(0, Math.round(x)));
const perMin = (x: number) => `${whole(x)}/min`;
const pct = (x: number) => `${Math.round(x * 100)}%`;

// ---------- the coach's targets (card E4 points at these) ----------

/** The bars, in order: the three kitchen stations and the drivers. */
export type BarKey = K3 | 'drivers';
export const BAR_KEYS: readonly BarKey[] = ['prep', 'ovens', 'counter', 'drivers'];

/** The ids this card registers with the Coach: the strip, one per bar (`report:bar:ovens`), the dashed line's label and the sheet's Close. */
export const REPORT_TARGET = {
  strip: 'report:strip',
  demand: 'report:demand',
  close: 'report:close',
  bar: (k: BarKey) => `report:bar:${k}`,
} as const;
/** The registry's id type lists the ids the engine knows; these are ours until card E4 adds them there, so the one cast is here. */
export const asTarget = (id: string): CoachTargetId => id as unknown as CoachTargetId;
/** Every id above, as a list (a test pins that each one is drawn). */
export const REPORT_TARGETS: readonly string[] = [REPORT_TARGET.strip, REPORT_TARGET.demand, REPORT_TARGET.close, ...BAR_KEYS.map(REPORT_TARGET.bar)];

// ---------- the strip ----------

/** What a neutral state says: the pizzas tip, or the line has gone cold. Never a station. */
export type StripKind = 'tipping' | 'cold';

/** The state worth a word, or null (also null while the service score's money does not run yet). */
export function stripKind(v: ReportView): StripKind | null {
  if (v.state === 'tipping' || v.state === 'cold') return v.state;
  return null;
}

/** The strip's one line, for a view: "Served 41/min · Missed 7/min". */
export const reportLine = (v: Pick<ReportView, 'served' | 'missed'>): string => t('report.strip', { served: whole(v.served), missed: whole(v.missed) });

/** What the strip draws, as primitives only (the component selects this with a shallow compare, so it repaints when a word changes, never on a tick). */
export interface StripModel {
  show: boolean;
  text: string;
  /** The manager's id (their face badge), or '' without one. */
  manager: string;
}

export const HIDDEN_STRIP: StripModel = Object.freeze({ show: false, text: '', manager: '' }) as StripModel;

/** The strip: shown from the first head or manager (the report is live), with the served/missed line and, when a manager runs the shop, their face. */
export function stripModel(g: GameState, id: NeighborhoodId, now: number): StripModel {
  if (!reportActive(g, id)) return HIDDEN_STRIP;
  const managed = g.shops[id].managed;
  return { show: true, text: reportLine(reportView(g, id, now)), manager: managed ? (cityOf(g).managers[id]?.id ?? '') : '' };
}

/** The drawer's header: the report's line when the shop takes part in it, else null (the drawer keeps its own). */
export function drawerLine(g: GameState, id: NeighborhoodId): string | null {
  return reportActive(g, id) ? reportLine(reportView(g, id, g.lastSavedAt)) : null;
}

// ---------- fitting the strip's line ----------

/**
 * The strip (D479, D485). Its touch box is 44 pt, directly above the sidewalk row, but only the bottom `pill` pt are drawn: the rest is
 * clear, so the shop front and the WELCOME mat show above the pill. Inside the pill: the manager's face when one runs the shop, then the
 * line (two lines at 10 pt or more). The widths live here so the fit arithmetic and the layout share them.
 */
export const STRIP = {
  /** The touch box (the control's drawn size for the tap-target rule). */
  height: 44,
  /** The drawn pill, at the bottom of the box. */
  pill: 28,
  border: 2,
  margin: 8,
  padX: 6,
  gap: 6,
  /** The manager's face badge. */
  badge: 22,
  /** Gap between the strip and the sidewalk row below it. */
  above: 4,
  maxLines: 2,
  fonts: [12, 11, 10] as readonly number[],
} as const;

/** A line of the strip's text at `size` takes this much height. */
export const stripLineHeight = (size: number): number => size + 1;

/** The width of the strip's line on a screen `screenW` wide, with or without a manager's badge. */
export const stripTextWidth = (screenW: number, withBadge: boolean): number =>
  screenW - 2 * STRIP.margin - 2 * (STRIP.padX + STRIP.border) - (withBadge ? STRIP.badge + STRIP.gap : 0);

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

const BAR_NAME: Record<BarKey, string> = {
  prep: 'report.bar.prep',
  ovens: 'report.bar.oven',
  counter: 'report.bar.counter',
  drivers: 'report.bar.drivers',
};

export interface BarRow {
  key: BarKey;
  name: string;
  /** "18/min": what the station can handle. */
  value: string;
  /** The bar's length, 0..1 of the track. */
  frac: number;
  /** "You" on a bar the player makes by hand, else ''. */
  you: string;
  /** The coach's id for the bar (`report:bar:ovens`). */
  target: string;
}

export interface SheetModel {
  title: string;
  bars: BarRow[];
  /** The dashed line: "Customers 24/min", and where it crosses the bars (0..1 of the track). */
  demand: { label: string; frac: number };
  served: string;
  missed: string;
  /** "Service 85%". */
  service: string;
  /** A neutral word for the two states worth one ("Tips up", "Line’s gone cold"), else ''. */
  stateWord: string;
  tip: string;
  cold: string;
  /** "Cold in 40 s", "The line is cold: get service back to 60%", or null. */
  timer: string | null;
  state: ReportView['state'];
}

/** The bars and the line from one view: every length is a share of the longest of the bars and the line, so the longest one fills the track. */
export function barRows(v: Pick<ReportView, 'capacity' | 'wanted' | 'you'>): { bars: BarRow[]; demandFrac: number } {
  const top = Math.max(v.wanted, ...BAR_KEYS.map((k) => v.capacity[k]));
  const share = (x: number) => (top > 1e-9 ? Math.min(1, Math.max(0, x / top)) : 0);
  const bars = BAR_KEYS.map((k): BarRow => ({
    key: k,
    name: t(BAR_NAME[k]),
    value: perMin(v.capacity[k]),
    frac: share(v.capacity[k]),
    you: k !== 'drivers' && v.you[k] ? t('report.you') : '',
    target: REPORT_TARGET.bar(k),
  }));
  return { bars, demandFrac: share(v.wanted) };
}

export function sheetModel(g: GameState, id: NeighborhoodId, now: number): SheetModel {
  const v = reportView(g, id, now);
  const { bars, demandFrac } = barRows(v);
  const timer =
    v.state === 'cold'
      ? `The line is cold. Get service back to ${pct(SERVICE.coldBelow)}.`
      : v.coldIn !== null
        ? `Cold in ${duration(Math.ceil(v.coldIn))} if it stays under ${pct(SERVICE.coldBelow)}.`
        : null;
  return {
    title: t('report.sheet.title'),
    bars,
    demand: { label: `${t('report.demand')} ${perMin(v.wanted)}`, frac: demandFrac },
    served: t('report.served', { n: whole(v.served) }),
    missed: t('report.missed', { n: whole(v.missed) }),
    service: t('report.service', { n: Math.round(v.service * 100) }),
    stateWord: v.state === 'tipping' ? t('report.state.tipping') : v.state === 'cold' ? t('report.state.cold') : '',
    tip: copy('report.sheet.tip'),
    cold: copy('report.sheet.cold'),
    timer,
    state: v.state,
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
  const candidates =
    cost !== null && cost > 0 ? [`${g} · ${duration(Math.max(1, Math.ceil(cost / gain)))}`, g, `+${money(gain * 60)}/m`] : [g, `+${money(gain * 60)}/m`];
  return candidates.find((c) => fits(c, width, 10)) ?? candidates[candidates.length - 1];
}
