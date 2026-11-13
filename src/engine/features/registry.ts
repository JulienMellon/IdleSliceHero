// The feature registry's array, on its own so that game.ts can read it without importing any feature (A31): game.ts -> registry
// is a leaf, and features/index.ts fills it. Before this, game -> features -> game was a module-evaluation cycle that threw
// ("Cannot access 'recipes' before initialization") when a feature was imported before game.
import type { Feature } from './types';

/** Every feature, in the order their hooks run. Empty until `features/index.ts` has been imported (the store does it). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FEATURES: Feature<any>[] = [];
