// What the screen shows of Nonna's tutorial step (card C1, review A42): a pure function of the step and three facts about the screen, so the rules that were
// spread over the game screen live in one place and are tested. The hook that feeds it (use-coach-flow.ts) only carries state and timers.
import type { CoachStep } from '../../engine/tutorial';
import type { CoachMode } from './steps';
import type { CoachTargetId } from './targets';

/** The step that is about the drawer's own hire card: it is the one step shown while the drawer is open. */
export const DRAWER_STEP = 13;
/** The last step: her closing line, with no hand (the ring carries it). */
export const LAST_STEP = 15;
/** A look step ends by itself after this long even when its overlay cannot be drawn: later than the overlay's own `LOOK_MS`, so that one comes first. */
export const LOOK_FALLBACK_MS = 8000;

export interface CoachScreen {
  /** The first shop is the one on screen (Nonna points only there). */
  isFirst: boolean;
  drawerOpen: boolean;
  /** The step whose `look` was seen while it was the current one (0 = none): the drawer step turns `free` then, so its hire card and Close can be tapped. */
  lookedAt: number;
}

export interface CoachView {
  targets: readonly CoachTargetId[];
  mode: CoachMode;
  text: string;
  hand: boolean;
}

/** What the overlay draws: null when it shows nothing (no step, another shop on screen, or the drawer covering the shop except at its own step). */
export function coachView(step: CoachStep | null, screen: CoachScreen): CoachView | null {
  if (!step || !screen.isFirst) return null;
  if (screen.drawerOpen && step.id !== DRAWER_STEP) return null;
  const seen = step.mode === 'look' && step.id === DRAWER_STEP && screen.lookedAt === DRAWER_STEP;
  return { targets: step.targets, mode: seen ? 'free' : step.mode, text: step.text, hand: step.id !== LAST_STEP };
}

/**
 * The id of the look step the fallback timer must end, or 0 for none. Not at the drawer step (the player's close ends that one), and not while the drawer is open:
 * hiring from it moves 13 to 15, whose closing line must be seen after it closes (C161).
 */
export function fallbackStep(step: CoachStep | null, screen: Pick<CoachScreen, 'drawerOpen'>): number {
  return step && step.mode === 'look' && step.id !== DRAWER_STEP && !screen.drawerOpen ? step.id : 0;
}
