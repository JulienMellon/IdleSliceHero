import type { Grant } from './grants';

/** Delivers paid-out grants to the game once, holding any that arrive before the game is listening. */
export function createGrantBus() {
  const pending: Grant[] = [];
  let listener: ((g: Grant) => void) | null = null;
  return {
    emit(g: Grant): void {
      if (listener) listener(g);
      else pending.push(g);
    },
    /** One listener; grants waiting are delivered at once. Returns the unsubscribe. */
    subscribe(fn: (g: Grant) => void): () => void {
      listener = fn;
      while (pending.length) fn(pending.shift() as Grant);
      return () => {
        if (listener === fn) listener = null;
      };
    },
    waiting: () => pending.length,
  };
}
export type GrantBus = ReturnType<typeof createGrantBus>;
