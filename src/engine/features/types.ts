import { CITIES, hoodIds, type CityDef } from '../../content/cities';
import type { NeighborhoodId } from '../../content/types';
import type { GameState, StationMults } from '../game';

/**
 * A gameplay feature as one file: its own saved state under `GameState.x[key]` plus optional hooks into the
 * tick, the price and demand of a pizza, and the offline catch-up. Add one to `FEATURES` (features/index.ts)
 * and `game.ts` calls it; nothing else in the engine changes.
 */
export interface Feature<S> {
  /** State lives at GameState.x[key]. */
  key: string;
  init(now: number): S;
  /** Load a saved value; must accept undefined (saves from before the feature). */
  migrate(raw: unknown, now: number, city?: CityDef): S;
  /** Runs after the ordinary one-second tick body, in registry order. `dtPlay` is foreground seconds. */
  tick?(g: GameState, dtPlay: number, now: number): GameState;
  /** Multiplies the value per pizza in this shop. `seen` is what the other hooks have given for this shop in the same `featureMults` pass (their demand and station multipliers), so a value that depends on the flow doesn't run them again (U17); absent when called on its own. */
  shopValueMult?(g: GameState, id: NeighborhoodId, now: number, seen?: Seen): number;
  /** What this feature changes about one shop's value (an event running, an attack on, cards owned), as a short string. `shopLevelKey` appends it, so the caches of "+$X/s" readouts refresh when it changes (C112). Empty = nothing. */
  shopKey?(g: GameState, id: NeighborhoodId): string;
  /** The wall ms a readout with no clock (`shopEarnings(s, id)`) should price at, or null for none: the events give the stamp of the last foreground tick, so a readout shows the event for as long as it runs, not only after a save (C116). */
  readoutNow?(g: GameState): number | null;
  /** Multiplies the demand rate (drivers + walk-ins) in this shop. */
  shopDemandMult?(g: GameState, id: NeighborhoodId, now: number): number;
  /** Multiplies one station's own rate in this shop (a jammed oven: `{ oven: 0.5 }`; a slower recipe: `{ prep: 1 / 1.3 }`). Leave a station out for 1. Not a demand number: the shop sells at min(prep, oven, counter, demand) with these applied (A32). */
  stationMult?(g: GameState, id: NeighborhoodId, now: number): Partial<StationMults> | undefined;
  /** Runs after the offline catch-up has been applied; `seconds` is the paid time away. */
  /** `before` is the game as it was before the catch-up (so a feature can see what the time away changed, C110). */
  onOffline?(g: GameState, seconds: number, now: number, before: GameState): GameState;
}

/** The demand and station multipliers the registry's other hooks gave one shop (see `shopValueMult`). */
export interface Seen {
  demand: number;
  stations?: StationMults;
}

/** The neighbourhood ids a saved slice may name: the save's own city's (`migrate`'s third argument), or, called without one, every city's (ids are unique across cities). */
export const savedHoods = (city?: CityDef): readonly NeighborhoodId[] =>
  city ? hoodIds(city) : [...new Set(Object.values(CITIES).flatMap((c) => hoodIds(c)))];
