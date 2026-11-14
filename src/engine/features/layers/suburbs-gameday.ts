// Suburbs, Game Day (v5.16): after each Mudhens game, every 8 minutes of play, a 45-second rush of families. Walk-in demand x6, but
// only into the seats that are free, so seating (more tables, the sidewalk patio, a higher seating level) and Dale's perk (walk-ins
// pay 15% more) matter. Play time only: the schedule is a hash of the saved seed and a counter, so a save replays the same games,
// and it never re-rolls when the clock or the time zone changes. Inactive until the Suburbs shop is built. Old saves load as
// "inactive": the first game is one gap after the shop is first seen built.
//
// The rush multiplies through `shopDemandMult` (the one demand number the engine has), as a ratio that adds the extra walk-ins to
// the whole demand, so the drivers' share is not multiplied. It applies only while the app is open (a wall-clock stamp of the last
// foreground tick, as events.ts does), so an offline catch-up never earns it.
import { EVENT_FRESH_MS, EVENT_STAMP_MS } from '../../../content/endgame';
import { GAME_DAY, LAYER_KEYS } from '../../../content/layers';
import { seededUnit } from '../../bonus';
import { deliveryRate, patioTables, tablesShown, walkInRate, type GameState, type Shop } from '../../game';
import type { Feature } from '../types';

/** The schedule every timed layer keeps (boats use it too). Times are play seconds; `nextAt` below 0 = not scheduled yet. */
export interface Timed {
  seed: number;
  /** Rushes started so far: which gap comes next. */
  n: number;
  /** Play second of the next start; -1 until the layer is first seen active. */
  nextAt: number;
  /** Play second the running rush ends; 0 = none. */
  until: number;
  /** Wall ms of the last foreground tick while a rush ran (the freshness stamp). */
  at: number;
}

export interface TimedSpec {
  everySeconds: number;
  rushSeconds: number;
  jitter: number;
  seedSalt: number;
}

export const seedOf = (now: number): number => Math.abs(Math.floor(now)) % 2147483647;
export const freshTimed = (now: number): Timed => ({ seed: seedOf(now), n: 0, nextAt: -1, until: 0, at: 0 });

/** Play seconds from the start of rush number `n - 1` to the start of rush `n`: every ± jitter, seeded. */
export const gapOf = (t: Pick<Timed, 'seed'>, n: number, spec: TimedSpec): number =>
  Math.round(spec.everySeconds * (1 + spec.jitter * (2 * seededUnit(t.seed, n, spec.seedSalt) - 1)) * 10) / 10;

/** Load a saved schedule; anything missing or broken gives an unscheduled one. */
export function migrateTimed(raw: unknown, now: number): Timed {
  const fresh = freshTimed(now);
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, d: number, min: number) => (typeof v === 'number' && Number.isFinite(v) && v >= min ? v : d);
  return {
    seed: Math.floor(num(r.seed, fresh.seed, 0)),
    n: Math.floor(num(r.n, 0, 0)),
    nextAt: num(r.nextAt, -1, 0),
    until: num(r.until, 0, 0),
    at: 0, // a stamp is never carried over: it is stale by the time it loads
  };
}

/**
 * Advance a schedule to play second `play`: schedule the first start, start a rush when it is due (from its scheduled second, so
 * the result does not depend on the tick size), end it, and keep the freshness stamp. Returns `t` itself when nothing changed.
 */
export function stepTimed<T extends Timed>(t: T, play: number, now: number, spec: TimedSpec): T {
  if (t.nextAt < 0) return { ...t, nextAt: play + gapOf(t, 0, spec) };
  let s: T = t;
  if (s.until > 0 && play >= s.until) s = { ...s, until: 0 };
  for (let guard = 0; play >= s.nextAt && guard < 1000; guard++) {
    const start = s.nextAt;
    const n = s.n + 1;
    const nextAt = start + gapOf(s, n, spec);
    // a game that was over before this tick saw it (a huge step) is skipped, never replayed
    s = play < start + spec.rushSeconds ? { ...s, n, nextAt, until: start + spec.rushSeconds } : { ...s, n, nextAt };
  }
  if (s.until > play && (now < s.at || now - s.at >= EVENT_STAMP_MS)) s = { ...s, at: now };
  return s;
}

/** The rush is on: it has not ended and the app has been open (a fresh stamp). */
export const timedOn = (t: Timed, play: number, now: number): boolean => t.until > play && now - t.at >= 0 && now - t.at <= EVENT_FRESH_MS;

const spec: TimedSpec = GAME_DAY;
const read = (g: GameState): Timed => (g.x?.[LAYER_KEYS.gameDay] as Timed | undefined) ?? freshTimed(0);
const built = (g: GameState): boolean => !!g.shops[GAME_DAY.hood]?.built;

/** Seats in the shop: the tables drawn (and the sidewalk's) times the seats at each. */
export const seatsOf = (shop: Shop): number => GAME_DAY.seatsPerTable * (tablesShown(shop) + patioTables(shop));

/**
 * Seats the rush can fill: the ones the regulars don't hold. Regulars are the walk-in share of the shop's demand (a shop that
 * mostly delivers has empty chairs; one that is all seating has none to spare).
 */
export function seatsFree(shop: Shop, vehicle: number): number {
  const seats = seatsOf(shop);
  const walk = walkInRate(shop);
  const total = walk + deliveryRate(shop, vehicle);
  const held = total > 0 ? Math.min(seats, Math.ceil((seats * walk) / total)) : 0;
  return seats - held;
}

/** What the rush multiplies the walk-in demand by: 1 with no free seat, up to GAME_DAY.walkInMult with every seat free. */
export function walkInFactor(shop: Shop, vehicle: number): number {
  const seats = seatsOf(shop);
  return seats > 0 ? 1 + (GAME_DAY.walkInMult - 1) * (seatsFree(shop, vehicle) / seats) : 1;
}

/** The whole-demand multiplier that adds the rush's extra walk-ins and leaves the drivers alone. */
export function rushDemandMult(shop: Shop, vehicle: number): number {
  const walk = walkInRate(shop);
  const drive = deliveryRate(shop, vehicle);
  return walk + drive > 0 ? (drive + walk * walkInFactor(shop, vehicle)) / (drive + walk) : 1;
}

export interface GameDayView {
  /** The Suburbs shop is built (the layer is live). */
  active: boolean;
  /** A rush is running now. */
  rush: boolean;
  /** Seconds until the next game (a rush running now counts to the one after). */
  nextIn: number;
  /** Seconds of the rush left (0 when none). */
  left: number;
  /** Seats the rush can fill, of `seats`. */
  seatsFree: number;
  seats: number;
}

/** Everything the Game Day banner needs, pure. */
export function gameDayView(g: GameState, now: number): GameDayView {
  const shop = g.shops[GAME_DAY.hood];
  if (!shop?.built) return { active: false, rush: false, nextIn: 0, left: 0, seatsFree: 0, seats: 0 };
  const t = read(g);
  const rush = timedOn(t, g.playSeconds, now);
  return {
    active: true,
    rush,
    nextIn: t.nextAt < 0 ? GAME_DAY.everySeconds : Math.max(0, Math.ceil(t.nextAt - g.playSeconds)),
    left: rush ? Math.max(0, Math.ceil(t.until - g.playSeconds)) : 0,
    seatsFree: seatsFree(shop, g.vehicle),
    seats: seatsOf(shop),
  };
}

export const suburbsGameDay: Feature<Timed> = {
  key: LAYER_KEYS.gameDay,
  init: freshTimed,
  migrate: migrateTimed,
  tick(g, _dt, now) {
    if (!built(g)) return g;
    const t = read(g);
    const next = stepTimed(t, g.playSeconds, now, spec);
    return next === t ? g : { ...g, x: { ...g.x, [LAYER_KEYS.gameDay]: next } };
  },
  shopDemandMult(g, id, now) {
    if (id !== GAME_DAY.hood || !built(g) || !timedOn(read(g), g.playSeconds, now)) return 1;
    return rushDemandMult(g.shops[id], g.vehicle);
  },
  shopKey(g, id) {
    return id === GAME_DAY.hood && built(g) && read(g).until > g.playSeconds ? 'gameday' : '';
  },
};
