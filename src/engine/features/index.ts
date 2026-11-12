// The feature registry. A new gameplay feature is a new file in this folder plus one line in FEATURES.
import type { GameState } from '../game';
import { counterattack } from './counterattack';
import { events } from './events';
import { heads } from './heads';
import { mastery } from './mastery';
import { recipes } from './recipes';
import type { Feature } from './types';

export type { Feature } from './types';

/** Every feature, in the order their hooks run. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FEATURES: Feature<any>[] = [mastery, counterattack, events, recipes, heads];

/** A feature's state. Before the feature has ever saved, this is whatever `init`/`migrate` gave it. */
export function getFeature<S>(g: GameState, f: Feature<S>): S {
  return g.x[f.key] as S;
}

/** A copy of `g` with the feature's state replaced. */
export function setFeature<S>(g: GameState, f: Feature<S>, s: S): GameState {
  return { ...g, x: { ...g.x, [f.key]: s } };
}

/** Test helper: run `fn` with `list` as the registry, then put the real one back (even if `fn` throws). */
export function withFeatures<T>(list: Feature<any>[], fn: () => T): T { // eslint-disable-line @typescript-eslint/no-explicit-any
  const saved = FEATURES.slice();
  FEATURES.splice(0, FEATURES.length, ...list);
  try {
    return fn();
  } finally {
    FEATURES.splice(0, FEATURES.length, ...saved);
  }
}
