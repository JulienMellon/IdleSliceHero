// The tutorial's flow on the game screen (card C1, review A42): what only the screen knows ends some steps (a look seen, the drawer opened, the drawer closed),
// a look step ends by itself when its overlay cannot be drawn, and the drawer step's look turns `free` once seen. The rules are `coach-view.ts`; this carries the state.
import { useCallback, useEffect, useRef, useState } from 'react';

import type { CoachStep, TutorialNote } from '../../engine/tutorial';
import { useGame } from '../../store/game-store';
import { coachView, fallbackStep, LOOK_FALLBACK_MS, type CoachView } from './coach-view';

/** Tell the tutorial what the screen saw (the store's action does the rest). */
const note = (n: TutorialNote) => useGame.getState().noteCoach(n);

/** The overlay's props for the current step, and the callback that ends a `look`. `tasksOpen`: the task list is open (it ends steps 7 and 8, A44). */
export function useCoachFlow(
  step: CoachStep | null,
  isFirst: boolean,
  drawerOpen: boolean,
  tasksOpen = false,
): { view: (CoachView & { onSkip: () => void }) | null; onDone: () => void } {
  const tasksWas = useRef(false);
  const stepId = step?.id ?? 0;
  useEffect(() => {
    if (tasksOpen) note('tasks-open');
    else if (tasksWas.current) note('tasks-closed');
    tasksWas.current = tasksOpen;
  }, [tasksOpen, stepId]);
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
  /** A tap outside the lit Store chip (step 16) ends the intro. */
  const onSkip = useCallback(() => note('store-skip'), []);
  const onDone = useCallback(() => {
    note('look');
    setLookedAt(useGame.getState().game.tutorial);
  }, []);
  const view = coachView(step, { isFirst, drawerOpen, lookedAt });
  return { view: view && { ...view, onSkip }, onDone };
}

/** The shop report's coach notes (v5.22, E4): the sheet opening under the lit strip is the strip step seen; its closing ends the sequence (also after a restart in the middle of it). */
export function useReportCoachNotes(sheetOpen: boolean, stripLit: boolean, live: boolean): void {
  const stripWas = useRef(false);
  useEffect(() => {
    if (sheetOpen && stripWas.current) note('report-open');
    else if (!sheetOpen && live) note('report-closed');
    stripWas.current = stripLit;
  }, [sheetOpen, stripLit, live]);
}
