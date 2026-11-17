// Industrial, shifts and breakdowns (v5.16, Big Sal's and Ox's plant).
//
// Shifts: the demand follows three shifts on a 20-minute play cycle, in order from the moment the shop is first seen built: day (demand
// x1.0), swing (x0.8), night (x1.2, and the night pays x2 value). Time away is paid at the night's rate: Big Sal's perk ("Industrial earns
// 25% more while you're away") multiplies that, so the text still reads true. How the offline catch-up is told from play: this feature
// stamps the wall time of the last foreground tick (`at`, saved, unlike the Game Day stamp) and a stamp that is stale when the hooks are
// asked means the app was closed. A shop that has never ticked has no stamp and reads as play, so a what-if (`buildGain`) never shows the
// night.
//
// Breakdowns: every 5 minutes of play (seeded gaps) one oven jams and the shop's oven rate falls by one oven's share (1 / the footprint's
// oven slots) until the player taps the wrench (`fixJam`), or after 30 seconds if the Head Baker (the oven head) is hired. The jam
// reaches the engine as a cap on the demand ratio (the engine's min() has no hook for a station's own rate); play time only, so
// a jam never happens while the app is closed.
import { EVENT_FRESH_MS, EVENT_STAMP_MS } from '../../../content/endgame';
import { JAMS, LAYER_KEYS, SHIFTS } from '../../../content/layers';
import { FOOTPRINTS } from '../../../content/tuning';
import { deliveryRate, ovenRate, walkInRate, type BuyResult, type GameState, type Shop } from '../../game';
import type { Feature } from '../types';
import { cityOf, layerHood } from '../../../content/cities';
import type { NeighborhoodId } from '../../../content/types';
import { freshTimed, gapOf, type TimedSpec } from './suburbs-gameday';

export interface ShiftsState {
  seed: number;
  /** Jams so far: which gap comes next. */
  n: number;
  /** Play second of the next jam; -1 until the layer is first seen active. */
  nextAt: number;
  /** Play second the running jam began; -1 = no jam. */
  jam: number;
  /** Play second the shift cycle started (the first tick that saw the shop built); -1 = not yet. */
  startAt: number;
  /** Wall ms of the last foreground tick (saved: a stale one on load is what marks the catch-up). */
  at: number;
}

const hoodOf = (g: GameState): NeighborhoodId => layerHood(cityOf(g), 'shifts') ?? '';
const spec: TimedSpec = { ...JAMS, rushSeconds: 0 };
const fresh = (now: number): ShiftsState => ({ seed: freshTimed(now).seed, n: 0, nextAt: -1, jam: -1, startAt: -1, at: 0 });
const read = (g: GameState): ShiftsState => (g.x?.[LAYER_KEYS.shifts] as ShiftsState | undefined) ?? fresh(0);
const write = (g: GameState, s: ShiftsState): GameState => ({ ...g, x: { ...g.x, [LAYER_KEYS.shifts]: s } });
const built = (g: GameState): boolean => !!g.shops[hoodOf(g)]?.built;
const SHIFT_SECONDS = SHIFTS.cycleSeconds / SHIFTS.shifts.length;
const night = SHIFTS.shifts.find((s) => s.id === SHIFTS.offlineShift)!;

/** The time away is being settled: the layer has run before and its last foreground stamp is stale. */
export const awayNow = (st: Pick<ShiftsState, 'startAt' | 'at'>, now: number): boolean => st.startAt >= 0 && now - st.at > EVENT_FRESH_MS;

export type ShiftDef = (typeof SHIFTS.shifts)[number];

/** The shift at a play second: the index in the cycle and the seconds left in it. Before the cycle starts it is the first shift. */
export function shiftAt(st: Pick<ShiftsState, 'startAt'>, play: number): { index: number; left: number } {
  if (st.startAt < 0) return { index: 0, left: SHIFT_SECONDS };
  const phase = (((play - st.startAt) % SHIFTS.cycleSeconds) + SHIFTS.cycleSeconds) % SHIFTS.cycleSeconds;
  const index = Math.min(SHIFTS.shifts.length - 1, Math.floor(phase / SHIFT_SECONDS));
  return { index, left: (index + 1) * SHIFT_SECONDS - phase };
}

/** The shift that sets the rate right now: the one on the clock, or the night's while time away is settled. */
function ruling(g: GameState, now: number): ShiftDef {
  const st = read(g);
  return awayNow(st, now) ? night : SHIFTS.shifts[shiftAt(st, g.playSeconds).index];
}

/** The share of the oven rate one jammed oven takes: 1 / the footprint's oven slots. */
export const jamShare = (shop: Pick<Shop, 'footprint'>): number => 1 / FOOTPRINTS[shop.footprint].ovenSlots;

const jammed = (st: ShiftsState): boolean => st.jam >= 0;
/** Whether a jam fixes itself: the Head Baker (or the General Manager, who has them all) is there. */
const hasBaker = (shop: Shop): boolean => shop.heads.oven || shop.managed;

/** Tap the wrench: the jam is fixed. */
export function fixJam(g: GameState): BuyResult {
  if (!built(g)) return { ok: false, reason: 'Build this pizzeria first' };
  const st = read(g);
  if (!jammed(st)) return { ok: false, reason: 'No oven is jammed' };
  return { ok: true, state: write(g, { ...st, jam: -1 }) };
}

/** Seconds until a jam fixes itself, or null when there is no Head Baker (or no jam). */
export function autoFixIn(g: GameState): number | null {
  const st = read(g);
  if (!jammed(st) || !hasBaker(g.shops[hoodOf(g)])) return null;
  return Math.max(0, Math.ceil(st.jam + JAMS.autoFixSeconds - g.playSeconds));
}

export interface ShiftView {
  active: boolean;
  /** The shift on the clock: 'day' | 'swing' | 'night'. */
  shift: string;
  name: string;
  demandMult: number;
  valueMult: number;
  /** Seconds until the next shift starts. */
  left: number;
  next: string;
  nextDemandMult: number;
  nextValueMult: number;
  /** What time away is paid at: the night's demand x value. */
  awayMult: number;
}

/** What the shift readout needs, pure. */
export function shiftView(g: GameState): ShiftView {
  const { index, left } = shiftAt(read(g), g.playSeconds);
  const cur = SHIFTS.shifts[index];
  const nxt = SHIFTS.shifts[(index + 1) % SHIFTS.shifts.length];
  return { active: built(g), shift: cur.id, name: cur.name, demandMult: cur.demand, valueMult: cur.value, left: Math.ceil(left), next: nxt.id, nextDemandMult: nxt.demand, nextValueMult: nxt.value, awayMult: night.demand * night.value };
}

export interface JamView {
  active: boolean;
  jammed: boolean;
  /** The share of the oven rate the jam takes (0 with no jam). */
  lost: number;
  /** x the oven rate now. */
  ovenMult: number;
  /** Seconds until the next jam. */
  nextIn: number;
  /** Seconds until the Head Baker fixes it; null with no jam or no Head Baker. */
  autoFixIn: number | null;
}

/** What the wrench button needs, pure. */
export function jamView(g: GameState): JamView {
  const st = read(g);
  const on = built(g) && jammed(st);
  const lost = on ? jamShare(g.shops[hoodOf(g)]) : 0;
  return { active: built(g), jammed: on, lost, ovenMult: 1 - lost, nextIn: st.nextAt < 0 ? JAMS.everySeconds : Math.max(0, Math.ceil(st.nextAt - g.playSeconds)), autoFixIn: on ? autoFixIn(g) : null };
}

/** The whole-demand ratio: the shift's demand, and no more than the jammed oven's rate. */
function demandFactor(g: GameState, now: number): number {
  const shop = g.shops[hoodOf(g)];
  const st = read(g);
  const shift = ruling(g, now);
  if (awayNow(st, now) || !jammed(st)) return shift.demand;
  const total = walkInRate(shop) + deliveryRate(shop, g.vehicle);
  return total > 0 ? Math.min(shift.demand, (ovenRate(shop) * (1 - jamShare(shop))) / total) : shift.demand;
}

export const industrialShifts: Feature<ShiftsState> = {
  key: LAYER_KEYS.shifts,
  init: fresh,
  migrate(raw, now) {
    const f = fresh(now);
    if (!raw || typeof raw !== 'object') return f;
    const r = raw as Record<string, unknown>;
    const num = (v: unknown, d: number, min: number) => (typeof v === 'number' && Number.isFinite(v) && v >= min ? v : d);
    return { seed: Math.floor(num(r.seed, f.seed, 0)), n: Math.floor(num(r.n, 0, 0)), nextAt: num(r.nextAt, -1, 0), jam: num(r.jam, -1, 0), startAt: num(r.startAt, -1, 0), at: num(r.at, 0, 0) };
  },
  tick(g, _dt, now) {
    if (!built(g)) return g;
    const st = read(g);
    const play = g.playSeconds;
    let s: ShiftsState = st;
    if (s.startAt < 0) s = { ...s, startAt: play };
    if (s.nextAt < 0) s = { ...s, nextAt: play + gapOf(s, 0, spec) };
    // jams start from their scheduled second (so the tick size does not matter); one at a time
    for (let guard = 0; play >= s.nextAt && guard < 1000; guard++) {
      const start = s.nextAt;
      const n = s.n + 1;
      s = { ...s, n, nextAt: start + gapOf(s, n, spec), jam: jammed(s) ? s.jam : start };
    }
    if (jammed(s) && hasBaker(g.shops[hoodOf(g)]) && play >= s.jam + JAMS.autoFixSeconds) s = { ...s, jam: -1 };
    if (now < s.at || now - s.at >= EVENT_STAMP_MS) s = { ...s, at: now };
    return s === st ? g : write(g, s);
  },
  shopValueMult(g, id, now) {
    return id === hoodOf(g) && built(g) ? ruling(g, now).value : 1;
  },
  shopDemandMult(g, id, now) {
    return id === hoodOf(g) && built(g) ? demandFactor(g, now) : 1;
  },
  shopKey(g, id) {
    if (id !== hoodOf(g) || !built(g)) return '';
    const st = read(g);
    return `${SHIFTS.shifts[shiftAt(st, g.playSeconds).index].id}${jammed(st) ? '-jam' : ''}`;
  },
};
