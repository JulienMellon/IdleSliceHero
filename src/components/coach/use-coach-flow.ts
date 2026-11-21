// The tutorial's flow on the game screen (card C1, review A42): what only the screen knows ends some steps (a look seen, the drawer opened, the drawer closed),
// a look step ends by itself when its overlay cannot be drawn, and the drawer step's look turns `free` once seen. The rules are `coach-view.ts`; this carries the state.
import { useCallback, useEffect, useRef, useState } from 'react';

import type { CoachStep, TutorialNote } from '../../engine/tutorial';
import { useGame } from '../../store/game-store';
import { coachView, fallbackStep, LOOK_FALLBACK_MS, type CoachView } from './coach-view';

/** Tell the tutorial what the screen saw (the store's action does the rest). */
const note = (n: TutorialNote) => useGame.getState().noteCoach(n);

/** The overlay's props for the current step, and the callback that ends a `look`. */
export function useCoachFlow(step: CoachStep | null, isFirst: boolean, drawerOpen: boolean): { view: CoachView | null; onDone: () => void } {
  const drawerWas = useRef(false);
  useEffect(() => {
    if (drawerOpen) note('drawer-open');
    else if (drawerWas.current) note('drawer-closed');
    drawerWas.current = drawerOpen;
  }, [drawerOpen]);
  const lookId = fallbackStep(step, { drawerOpen });
  useEffect(() => {
    if (!lookId) return;
    const timer = setTimeout(() => note('look'), LOOK_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [lookId]);
  const [lookedAt, setLookedAt] = useState(0);
  const onDone = useCallback(() => {
    note('look');
    setLookedAt(useGame.getState().game.tutorial);
  }, []);
  return { view: coachView(step, { isFirst, drawerOpen, lookedAt }), onDone };
}
