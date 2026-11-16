// App-state transitions that count as leaving and coming back. A system prompt (the iOS tracking prompt, a permission sheet,
// Control Centre) only makes the app `inactive` and then `active` again; that is not a return and must not reload the game.

export type AppStateName = 'active' | 'inactive' | 'background' | 'unknown' | 'extension';
export type Transition = 'left' | 'returned' | null;

/** One tracker per app: feed it every AppState change. `left` fires on entering the background, `returned` on the first `active` after one. */
export function createLifecycle() {
  let away = false;
  return {
    next(state: AppStateName): Transition {
      if (state === 'background') {
        if (away) return null;
        away = true;
        return 'left';
      }
      if (state === 'active' && away) {
        away = false;
        return 'returned';
      }
      return null;
    },
  };
}
