// Nonna's guided tutorial (playtest 2, P2: "tap here to bake your first pizza, tap here to upgrade the oven").
// Pure: one step at a time, each with a line from Nonna, a target to point at and a condition that ends it.
// The step number is saved (GameState.tutorial); an existing player who has already sold pizza starts at "done".
import { HEADS } from '../content/tuning';
import * as G from './game';

export type CoachTarget = 'prep' | 'oven' | 'counter' | 'cash' | 'walk-ovens' | 'goal';

export interface CoachStep {
  id: number;
  text: string;
  target: CoachTarget;
  /** Scene targets get the card docked low; sidewalk/HUD targets get it high, so it never covers what it points at. */
  dock: 'low' | 'high';
}

export const TUTORIAL_DONE = G.TUTORIAL_DONE;

const marco = HEADS.downtown.prep;

/** Every step, in order (1-based ids; 0 = not started, before the opening scene ends). */
export const STEPS: readonly CoachStep[] = [
  { id: 1, text: 'Tap the prep table to roll your first pizzas!', target: 'prep', dock: 'low' },
  { id: 2, text: 'Into the oven, caro! Tap the oven.', target: 'oven', dock: 'low' },
  { id: 3, text: 'Watch the timer… good ovens take time.', target: 'oven', dock: 'low' },
  { id: 4, text: 'Now tap the counter to serve!', target: 'counter', dock: 'low' },
  { id: 5, text: 'Every pizza out the door is money in the register!', target: 'cash', dock: 'low' },
  { id: 6, text: 'Again! Prep, bake, serve. Save up for a better oven.', target: 'prep', dock: 'low' },
  { id: 7, text: 'Tap Ovens to bake faster.', target: 'walk-ovens', dock: 'high' },
  { id: 8, text: `See? The timer’s shorter now. Next, hire ${marco}, my head prep cook.`, target: 'goal', dock: 'low' },
];

/** The current step, or null when the tutorial isn't running (not started, done, or a GM already runs Downtown). */
export function coachStep(s: G.GameState): CoachStep | null {
  if (s.tutorial < 1 || s.tutorial >= TUTORIAL_DONE || s.shops.downtown.managed) return null;
  const step = STEPS[s.tutorial - 1];
  // step 6: point at whichever station is next, so the hand follows the rhythm
  if (step.id === 6) {
    const next = G.nextStation(s.shops.downtown);
    return { ...step, target: next ?? 'prep' };
  }
  return step;
}

/** Whether step `id` is finished in this state. */
function done(s: G.GameState, id: number): boolean {
  const d = s.shops.downtown;
  const l = d.line;
  switch (id) {
    case 1:
      return !!l.prep || l.prepped > 0 || !!l.oven;
    case 2:
      return !!l.oven || l.baked > 0 || !!l.counter;
    case 3:
      return !l.oven && (l.baked > 0 || !!l.counter);
    case 4:
      return !!l.counter || l.boxed > 0 || l.departures.length > 0 || d.sold > 0;
    case 5:
      return d.sold > 0;
    case 6: {
      const cost = G.upgradeCostOf(s, 'downtown', 'ovens');
      return d.ovens > 1 || (cost !== null && s.cash >= cost);
    }
    case 7:
      return d.ovens > 1;
    case 8:
      return d.heads.prep;
    default:
      return true;
  }
}

/** Move past every finished step (several can finish at once). Starts once the opening scene has played. */
export function tutorialAdvance(s: G.GameState): G.GameState {
  let t = s.tutorial;
  if (t === 0 && s.seenScenes.includes('downtown-1')) t = 1;
  while (t >= 1 && t < TUTORIAL_DONE && done(s, t)) t++;
  return t === s.tutorial ? s : { ...s, tutorial: t };
}

/** Story scenes wait while Nonna is showing the first batch (steps 1–5). */
export const tutorialHoldsStory = (s: G.GameState) => s.tutorial >= 1 && s.tutorial <= 5 && !s.shops.downtown.managed;
