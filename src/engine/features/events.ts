// Weekly events (v5.15): "Friday Night Rush" (Friday 17:00-21:00 local, every shop's value x1.5) and "Big Game Day" (Sunday
// 13:00-16:00 local, Suburbs and Downtown x2). They apply only while the app is open and never to offline earnings.
// How: the feature stamps `at` (wall ms) on foreground ticks while an event runs; a multiplier is only given while the stamp is
// fresh, so an offline catch-up (a cold start, or a return after the app was away) finds none. An event adds with the boosts
// (docs/REWARDS.md: boosts add, 1 + sum of (mult - 1)): with a boost b running, the value hook returns (b + e - 1) / b, and the
// boost the pipeline applies on top makes b + e - 1 in all.
import { EVENT_FRESH_MS, EVENT_HEADS_UP_SECONDS, EVENT_STAMP_MS, EVENTS, type EventDef, type EventId } from '../../content/endgame';
import type { NeighborhoodId } from '../../content/types';
import { boostMult, type GameState } from '../game';
import type { Feature } from './types';

export interface EventsState {
  /** The event running at the last foreground tick (null = none). */
  id: EventId | null;
  /** Wall ms of that tick. */
  at: number;
}

export const KEY = 'events';

const startOf = (e: EventDef, d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), e.fromHour).getTime();
const endOf = (e: EventDef, d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), e.toHour).getTime();

/** The event running at `now` (local time; the start is inclusive, the end is not), or null. */
export function activeEvent(now: number): EventDef | null {
  const d = new Date(now);
  return EVENTS.find((e) => e.weekday === d.getDay() && now >= startOf(e, d) && now < endOf(e, d)) ?? null;
}

export interface EventView {
  def: EventDef;
  /** Running now; false = starts within the heads-up window. */
  active: boolean;
  /** Seconds until it starts (upcoming) or ends (active). */
  seconds: number;
}

/** The event running now, or the next one starting within 60 minutes with its countdown; null otherwise. Pure: for the banner. */
export function eventView(now: number): EventView | null {
  const on = activeEvent(now);
  if (on) return { def: on, active: true, seconds: Math.ceil((endOf(on, new Date(now)) - now) / 1000) };
  const d = new Date(now);
  let soon: EventView | null = null;
  for (const e of EVENTS) {
    if (e.weekday !== d.getDay()) continue;
    const seconds = Math.ceil((startOf(e, d) - now) / 1000);
    if (seconds > 0 && seconds <= EVENT_HEADS_UP_SECONDS && (!soon || seconds < soon.seconds)) soon = { def: e, active: false, seconds };
  }
  return soon;
}

const defOf = (id: EventId | null): EventDef | undefined => EVENTS.find((e) => e.id === id);
const hits = (e: EventDef, id: NeighborhoodId) => e.hoods === 'all' || e.hoods.includes(id);

const read = (g: GameState): EventsState => (g.x?.[KEY] as EventsState | undefined) ?? { id: null, at: 0 };

/** The event multiplying `id` at `now` as the game sees it (the stamp must be fresh), or null. */
function runningFor(g: GameState, id: NeighborhoodId, now: number): EventDef | null {
  const st = read(g);
  const e = defOf(st.id);
  // the stamp is of a past foreground tick: a `now` before it (a stale readout) or long after it (an offline catch-up) gets nothing (C111)
  const age = now - st.at;
  return e && age >= 0 && age <= EVENT_FRESH_MS && hits(e, id) ? e : null;
}

/** `g` with no event running (for a reward that must not be inflated by one). */
export const withoutEvent = (g: GameState): GameState => (read(g).id === null ? g : { ...g, x: { ...g.x, [KEY]: { id: null, at: 0 } } });

export const events: Feature<EventsState> = {
  key: KEY,
  init: () => ({ id: null, at: 0 }),
  // never carried over: a saved "running" event is stale by the time it loads
  migrate: () => ({ id: null, at: 0 }),
  tick(g, _dt, now) {
    const st = read(g);
    const e = activeEvent(now);
    if (!e) return st.id === null ? g : { ...g, x: { ...g.x, [KEY]: { id: null, at: 0 } } };
    if (st.id === e.id && now - st.at < EVENT_STAMP_MS && now >= st.at) return g;
    return { ...g, x: { ...g.x, [KEY]: { id: e.id, at: now } } };
  },
  shopKey(g, id) {
    const e = defOf(read(g).id);
    return e && hits(e, id) ? e.id : '';
  },
  shopValueMult(g, id, now) {
    const e = runningFor(g, id, now);
    if (!e) return 1;
    const b = boostMult(g, now);
    return (b + e.mult - 1) / b;
  },
};
