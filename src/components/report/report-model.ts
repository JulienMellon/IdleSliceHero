// The shop report as plain data (card U3, v5.22): the strip above the sidewalk, its sheet, the cards' effect lines. Pure: unit-tested in node.
// One bar per station and one for the drivers, all the same colour, each as long as the pizzas a minute it can handle, with one dashed line
// across them at the customers a minute. Nothing here names a station as the limit and nothing is colour coded (the lamps are gone).
// Report words come from content/copy/home/report.ts by `t()`; the effect lines still read content/service.ts COPY.
import { COPY, SERVICE, type CopyKey } from '../../content/service';
import { cityOf } from '../../content/cities';
import { t } from '../../content/copy';
import type { NeighborhoodId } from '../../content/types';
import type { CoachTargetId } from '../../engine/coach-types';
import { count, duration } from '../../engine/format';
import type { GameState } from '../../engine/game';
import { reportActive, reportView, type K3, type ReportView } from '../../engine/features/service';
import { FIT_EM } from '../endgame/fit-model';
import { hireOnSidewalk } from '../sidewalk-model';
import { BONUS_VIEW, ORDER_VIEW } from '../../content/hooks';

/** Fill `{name}` slots of a copy line. An unknown slot stays as written (a test catches it). */
export const fill = (template: string, vars: Readonly<Record<string, string | number>>): string =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
export const copy = (key: CopyKey, vars: Readonly<Record<string, string | number>> = {}): string => fill(COPY[key], vars);

/** Orders a minute as the report writes them: a whole number, K/M past a thousand. */
const whole = (x: number): string => count(Math.max(0, Math.round(x)));
const perMin = (x: number) => `${whole(x)}/min`;
const pct = (x: number) => `${Math.round(x * 100)}%`;

// ---------- the coach's targets (card E4 points at these) ----------

/** The bars, in order: the three kitchen stations. (The customers' row is not a station: it is the stacked deliveries and seats, ending at the line.) */
export type BarKey = K3;
export const BAR_KEYS: readonly BarKey[] = ['prep', 'ovens', 'counter'];

/** The ids this card registers with the Coach: the strip, one per bar (`report:bar:ovens`), the dashed line's label and the sheet's Close. */
export const REPORT_TARGET = {
  strip: 'report:strip',
  demand: 'report:demand',
  close: 'report:close',
  bar: (k: BarKey): CoachTargetId => `report:bar:${k}`,
} as const satisfies Record<string, CoachTargetId | ((k: BarKey) => CoachTargetId)>;
/** Every id above, as a list (a test pins that each one is drawn). */
export const REPORT_TARGETS: readonly CoachTargetId[] = [REPORT_TARGET.strip, REPORT_TARGET.demand, REPORT_TARGET.close, ...BAR_KEYS.map(REPORT_TARGET.bar)];

// ---------- the strip ----------

/** What a neutral state says: the pizzas tip, or the line has gone cold. Never a station. */
export type StripKind = 'tipping' | 'cold';

/** The state worth a word, or null (also null while the service score's money does not run yet). */
export function stripKind(v: Pick<ReportView, 'state'>): StripKind | null {
  if (v.state === 'tipping' || v.state === 'cold') return v.state;
  return null;
}

/** The neutral words each state adds: the strip's suffix (D554) and the sheet's state word. One table, so a state never has a word in one place and none in the other. */
const STRIP_WORDS: Record<StripKind, { suffix: string; word: string }> = {
  tipping: { suffix: 'report.strip.cold.tips', word: 'report.state.tipping' },
  cold: { suffix: 'report.strip.cold.word', word: 'report.state.cold' },
};

/** The strip's one line, for a view: "Served 41/min · Missed 7/min". */
export const reportLine = (v: Pick<ReportView, 'served' | 'missed'> & Partial<Pick<ReportView, 'state'>>): string => {
  const line = t('report.strip', { served: whole(v.served), missed: whole(v.missed) });
  // D554: the tip and the cold line change the shop's money, so the strip says so in a neutral word ("· Tips up", "· Word's spreading")
  const kind = v.state === undefined ? null : stripKind({ state: v.state });
  return kind ? `${line} ${t(STRIP_WORDS[kind].suffix)}` : line;
};

/** What the strip draws, as primitives only (the component selects this with a shallow compare, so it repaints when a word changes, never on a tick). */
export interface StripModel {
  show: boolean;
  text: string;
  /** The manager's id (their face badge), or '' without one. */
  manager: string;
  /** Missed rounds to 0 while customers want pizzas (D556): the payoff's condition, before its 10 s hold and its once-a-session gate. */
  zero: boolean;
  /** An unmanaged shop (the sidewalk's hire stack): the strip stands at the top of the area, its pill at the top of its touch box (C194). */
  idle: boolean;
}

export const HIDDEN_STRIP: StripModel = Object.freeze({ show: false, text: '', manager: '', zero: false, idle: false }) as StripModel;

/** Missed rounds to 0 while customers want pizzas (D556). */
export const isMissedZero = (v: Pick<ReportView, 'wanted' | 'missed'>): boolean => v.wanted >= 0.5 && Math.round(v.missed) === 0;

/** The strip: shown from the first head or manager (the report is live), with the served/missed line and, when a manager runs the shop, their face. */
export function stripModel(g: GameState, id: NeighborhoodId, now: number): StripModel {
  if (!reportActive(g, id)) return HIDDEN_STRIP;
  const managed = g.shops[id].managed;
  const v = reportView(g, id, now);
  return {
    show: true,
    text: reportLine(v),
    manager: managed ? (cityOf(g).managers[id]?.id ?? '') : '',
    zero: isMissedZero(v),
    idle: hireOnSidewalk(g.shops[id], id, cityOf(g)),
  };
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
  /**
   * Gap between the strip and the sidewalk row below it, in a shop with a manager. D479/Q8: 1 pt, so the pill's top clears the WELCOME mat on the narrowest phone (fit 0.95: with 4 it
   * covered 23% of the mat); the cards' own 2 pt outline is the visible gap.
   */
  above: 1,
  /**
   * An unmanaged shop's strip stands at the top of the scene area instead (Q8): its hire stack is two buttons tall, so no strip fits between the mat and the stack, and the mat and the door
   * are never covered. The distance (pt) from the area's top to the pill's top: there the pill is drawn at the top of its 44 pt touch box (the box reaches 16 pt below it), so the box lies wholly inside the area.
   */
  top: 8,
  maxLines: 2,
  fonts: [12, 11, 10] as readonly number[],
} as const;

/**
 * Where an unmanaged shop's pill starts, pt from the scene area's top (C194): at `STRIP.top`, or, while the special-order chip is up (it stands from `ORDER_VIEW.top`, `ORDER_VIEW.height` tall, over the
 * top of the area), under it (the pill is at the top of its box, so the box starts clear of the chip). The golden pizza's lane then starts under the pill (`bonusLaneTop`).
 */
export const idleStripTop = (chipUp: boolean): number => (chipUp ? ORDER_VIEW.top + ORDER_VIEW.height + 6 : STRIP.top);

/** The golden pizza's lane top (pt from the area's top): the sky's lane, under the order chip, or under an unmanaged shop's pill (and the chip above it). */
export const bonusLaneTop = (chipUp: boolean, idleShop: boolean): number =>
  idleShop ? idleStripTop(chipUp) + STRIP.pill + 6 : chipUp ? ORDER_VIEW.top + ORDER_VIEW.height + 6 : BONUS_VIEW.laneTop;

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
};

export interface BarRow {
  key: BarKey;
  name: string;
  /** "18/min": what the station can handle. */
  value: string;
  /** The bar's length, 0..1 of the track. */
  frac: number;
  /** "You tap" on a bar the player makes by hand, else ''. */
  you: string;
  /** The coach's id for the bar (`report:bar:ovens`). */
  target: CoachTargetId;
}

/**
 * The customers' row (G119, S90): one stacked bar, the deliveries the drivers carry and then the walk-ins the seats take, ending exactly at the dashed
 * line (the line IS their sum). The drivers have no bar of their own to hold against the line: they are only part of what the line asks for.
 */
export interface CustomersRow {
  name: string;
  /** "168/min": every customer a minute. */
  value: string;
  /** The deliveries' and the seats' lengths, 0..1 of the track; together they end at the line. */
  deliveries: number;
  seats: number;
  /** "Drivers 90/min · Seats 78/min". */
  split: string;
}

export interface SheetModel {
  title: string;
  /** Missed rounds to 0 while customers want pizzas (D556): the payoff's condition, before the "plays once, ever" gate. */
  zero: boolean;
  bars: BarRow[];
  customers: CustomersRow;
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

/** The bars, the customers' stacked row and the line from one view: every length is a share of the longest of the bars and the line, so the longest one fills the track. */
export function barRows(v: Pick<ReportView, 'capacity' | 'wanted' | 'walkIns' | 'you'>): { bars: BarRow[]; customers: CustomersRow; demandFrac: number } {
  const top = Math.max(v.wanted, ...BAR_KEYS.map((k) => v.capacity[k]));
  const share = (x: number) => (top > 1e-9 ? Math.min(1, Math.max(0, x / top)) : 0);
  const bars = BAR_KEYS.map((k): BarRow => ({
    key: k,
    name: t(BAR_NAME[k]),
    value: perMin(v.capacity[k]),
    frac: share(v.capacity[k]),
    you: v.you[k] ? t('report.you') : '',
    target: REPORT_TARGET.bar(k),
  }));
  const deliveries = share(v.capacity.drivers);
  const customers: CustomersRow = {
    name: t('report.customers.row'),
    value: perMin(v.wanted),
    deliveries,
    // the seats take the rest of the way to the line, so the stack always ends at it
    seats: Math.max(0, share(v.wanted) - deliveries),
    split: t('report.customers.split', { drivers: whole(v.capacity.drivers), seats: whole(v.walkIns) }),
  };
  return { bars, customers, demandFrac: share(v.wanted) };
}

/** Seconds Missed must stay at 0, with the sheet open, before the payoff plays. */
export const MISSED_ZERO_HOLD_S = 10;

/** The shops whose payoff has played in this session (D556: once per shop per session). */
const payoffShown = new Set<string>();
export const missedZeroSeen = (id: NeighborhoodId): boolean => payoffShown.has(id);
export const markMissedZeroSeen = (id: NeighborhoodId): void => void payoffShown.add(id);
/** Forget the session (tests; a new save should call it too: game-store's `newGame`/load, not wired here). */
export const resetMissedZeroSeen = (): void => payoffShown.clear();

/** D556: the strip's "Missed reached 0" payoff plays while Missed is 0 and this shop has not had it this session; the strip then also calls the store's `missedZeroShown`, which records it in the save (`saveOf(game).missedZero`). The save flag is write-only: nothing reads it, the session set above decides (once per shop per session, VERSION.md). */
export const missedZeroPlays = (zero: boolean, seenThisSession: boolean): boolean => zero && !seenThisSession;

/** How long the payoff's line replaces the strip's numbers, and how long the basil flash lasts, in ms; and how many coins fly from the strip to the cash. */
export const PAYOFF = { lineMs: 3500, flashMs: 600, coins: 6 } as const;

export function sheetModel(g: GameState, id: NeighborhoodId, now: number): SheetModel {
  const v = reportView(g, id, now);
  const { bars, customers, demandFrac } = barRows(v);
  const kind = stripKind(v);
  const timer =
    v.state === 'cold'
      ? `The line is cold. Get service back to ${pct(SERVICE.coldBelow)}.`
      : v.coldIn !== null
        ? `Cold in ${duration(Math.ceil(v.coldIn))} if it stays under ${pct(SERVICE.coldBelow)}.`
        : null;
  return {
    title: t('report.sheet.title'),
    zero: isMissedZero(v),
    bars,
    customers,
    demand: { label: `${t('report.demand')} ${perMin(v.wanted)}`, frac: demandFrac },
    served: t('report.served', { n: whole(v.served) }),
    missed: t('report.missed', { n: whole(v.missed) }),
    service: t('report.service', { n: Math.round(v.service * 100) }),
    stateWord: kind ? t(STRIP_WORDS[kind].word) : '',
    tip: copy('report.sheet.tip'),
    cold: copy('report.sheet.cold'),
    timer,
    state: v.state,
  };
}
