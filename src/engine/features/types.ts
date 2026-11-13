import type { NeighborhoodId } from '../../content/types';
import type { GameState } from '../game';

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
  migrate(raw: unknown, now: number): S;
  /** Runs after the ordinary one-second tick body, in registry order. `dtPlay` is foreground seconds. */
  tick?(g: GameState, dtPlay: number, now: number): GameState;
  /** Multiplies the value per pizza in this shop. */
  shopValueMult?(g: GameState, id: NeighborhoodId, now: number): number;
  /** What this feature changes about one shop's value (an event running, an attack on, cards owned), as a short string. `shopLevelKey` appends it, so the caches of "+$X/s" readouts refresh when it changes (C112). Empty = nothing. */
  shopKey?(g: GameState, id: NeighborhoodId): string;
  /** Multiplies the demand rate (drivers + walk-ins) in this shop. */
  shopDemandMult?(g: GameState, id: NeighborhoodId, now: number): number;
  /** Runs after the offline catch-up has been applied; `seconds` is the paid time away. */
  /** `before` is the game as it was before the catch-up (so a feature can see what the time away changed, C110). */
  onOffline?(g: GameState, seconds: number, now: number, before: GameState): GameState;
}
