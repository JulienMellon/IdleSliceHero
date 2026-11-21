// Nonna's Chapter 1 script (v5.20, card C3): 15 steps, each with her line (a copy key, content/copy/home/tutorial.ts), the spots of the screen it
// lights (coach targets, components/coach/targets.ts), a mode (what the player can do meanwhile) and a condition that ends it.
// Pure: the step number is saved (GameState.tutorial); an existing player who has already sold pizza starts at "done".
// Most steps end on the game's own state. Three kinds end on something only the screen knows, which it tells us through `tutorialNote`:
// a `look` step (6, 11, 15) once it has been seen (a tap or 2.5 s), the drawer opening (12) and the drawer closing (13).
import { cityOf, type CityDef } from '../content/cities';
import { t } from '../content/copy';
import type { CoachMode } from '../components/coach/steps';
import type { CoachTargetId } from '../components/coach/targets';
import { money } from './format';
import * as G from './game';

export interface CoachStep {
  id: number;
  /** The copy key of the step's line: `tutorial.<id>`. */
  key: string;
  /** The line, for the first shop's prep head `{marco}` (`{cost}` is filled by `coachStep`, which knows the cash). */
  text: string;
  /** What the overlay cuts out: none for a free step (only Nonna's card shows). */
  targets: CoachTargetId[];
  /** tap: the player taps the lit spot; wait: nothing to tap (the ring breathes); look: a moment to see it (a tap or 2.5 s ends it); free: play on. */
  mode: CoachMode;
}

export const TUTORIAL_DONE = G.TUTORIAL_DONE;

/** The task-list steps (7 and 8) wait for the chapters (v5.21): until then they are skipped. */
export const CHAPTERS_ON = false;

/** The neighbourhood the tutorial is played in: the city's first (card K1). */
const first = (s: G.GameState) => G.firstHood(cityOf(s));

type Def = { targets: CoachTargetId[]; mode: CoachMode };
/** Every step's targets and mode, by step id - 1. */
const DEFS: readonly Def[] = [
  { targets: ['station:prep'], mode: 'tap' }, // 1
  { targets: ['station:prep', 'dial:prep'], mode: 'wait' }, // 2: the dial fills while the dough rolls (G82)
  { targets: ['station:oven'], mode: 'tap' }, // 3
  { targets: ['station:oven', 'dial:oven'], mode: 'wait' }, // 4
  { targets: ['station:counter'], mode: 'tap' }, // 5
  { targets: ['hud:cash'], mode: 'look' }, // 6
  { targets: ['hud:goal'], mode: 'tap' }, // 7 (v5.21)
  { targets: [], mode: 'look' }, // 8: the task list (v5.21)
  { targets: [], mode: 'free' }, // 9: save up for the oven upgrade
  { targets: ['walk:ovens'], mode: 'tap' }, // 10
  { targets: ['ovens:all'], mode: 'look' }, // 11
  { targets: ['walk:all'], mode: 'tap' }, // 12
  { targets: ['drawer:hire:prep'], mode: 'look' }, // 13
  { targets: [], mode: 'free' }, // 14: Marco won't hire himself
  { targets: ['station:prep', 'dial:prep'], mode: 'look' }, // 15
];

/** Every step of a city's tutorial, in order (1-based ids; 0 = not started, before the opening scene ends). The hire steps name the first shop's prep head. */
const buildSteps = (city: CityDef): readonly CoachStep[] => {
  const marco = city.heads[G.firstHood(city)].prep;
  return DEFS.map((d, i) => ({ id: i + 1, key: `tutorial.${i + 1}`, text: t(`tutorial.${i + 1}`, { marco }, city.id), targets: d.targets, mode: d.mode }));
};
const STEP_CACHE = new WeakMap<CityDef, readonly CoachStep[]>();
export function stepsFor(city: CityDef): readonly CoachStep[] {
  let steps = STEP_CACHE.get(city);
  if (!steps) STEP_CACHE.set(city, (steps = buildSteps(city)));
  return steps;
}

/** The step the saved number stands for: 7 and 8 are skipped while the chapters are off. */
const effective = (n: number) => (!CHAPTERS_ON && (n === 7 || n === 8) ? 9 : n);

/** The current step, or null when the tutorial isn't running (not started, done, or a GM already runs Downtown). */
export function coachStep(s: G.GameState): CoachStep | null {
  if (s.tutorial < 1 || s.tutorial >= TUTORIAL_DONE || s.shops[first(s)].managed) return null;
  const city = cityOf(s);
  const steps = stepsFor(city);
  const d = s.shops[first(s)];
  const marco = city.heads[first(s)].prep;
  let step = steps[effective(s.tutorial) - 1];
  let key = step.key;
  const ovens = G.upgradeCostOf(s, first(s), 'ovens');
  // D374: the Ovens cash went elsewhere (drivers, say): back to "save up" until it's there again
  if (step.id === 10 && ovens !== null && !G.canAfford(s, ovens)) {
    step = steps[8];
    key = 'tutorial.alt.9';
  }
  // Marco is already affordable: Nonna says so
  if (step.id === 13 && G.canAfford(s, G.headCost(first(s), 'prep', city))) key = 'tutorial.alt.13';
  const text = t(key, { marco, cost: money(ovens ?? 0) }, city.id);
  // the first pizza is still on its way out: nothing to look at yet, so the cash waits with the ring breathing
  const mode = step.id === 6 && d.sold === 0 ? 'wait' : step.mode;
  return { ...step, key, text, mode };
}

/** Whether step `id` is finished in this state (the steps that end on the screen's say-so are never finished here: see `tutorialNote`). */
function done(s: G.GameState, id: number): boolean {
  const d = s.shops[first(s)];
  const l = d.line;
  switch (id) {
    case 1:
      return !!l.prep || l.prepped > 0 || !!l.oven;
    case 2:
      return (!l.prep && l.prepped > 0) || !!l.oven;
    case 3:
      return !!l.oven || l.baked > 0 || !!l.counter;
    case 4:
      return !l.oven && (l.baked > 0 || !!l.counter);
    case 5:
      return !!l.counter || l.boxed > 0 || l.departures.length > 0 || d.sold > 0;
    case 7:
    case 8:
      return !CHAPTERS_ON;
    case 9:
      return d.ovens > 1 || G.canAfford(s, G.upgradeCostOf(s, first(s), 'ovens'));
    case 10:
      return d.ovens > 1;
    // Marco hired ends 12 to 14 whatever the player did with the drawer
    case 12:
    case 13:
    case 14:
      return d.heads.prep;
    default:
      // 6, 11, 15: the screen says
      return false;
  }
}

/** Move past every finished step (several can finish at once). Starts once the opening scene has played. */
export function tutorialAdvance(s: G.GameState): G.GameState {
  let t = s.tutorial;
  if (t === 0 && s.seenScenes.includes(G.sceneId(first(s), 1))) t = 1;
  while (t >= 1 && t < TUTORIAL_DONE && done(s, t)) t++;
  return t === s.tutorial ? s : { ...s, tutorial: t };
}

/** What the screen can tell the tutorial: a `look` step was seen (a tap or 2.5 s), the upgrades drawer opened, the drawer closed. */
export type TutorialNote = 'look' | 'drawer-open' | 'drawer-closed';
const ENDED_BY: Readonly<Record<number, TutorialNote>> = { 6: 'look', 11: 'look', 12: 'drawer-open', 13: 'drawer-closed', 15: 'look' };

/** The screen's say-so: ends the current step when it is the one waiting for this note, and moves on over any step that is already finished. Anything else changes nothing. */
export function tutorialNote(s: G.GameState, note: TutorialNote): G.GameState {
  const step = coachStep(s);
  if (!step || ENDED_BY[step.id] !== note) return s;
  // step 6 waits for the first sale: the cash has nothing to show before it
  if (step.id === 6 && s.shops[first(s)].sold === 0) return s;
  return tutorialAdvance({ ...s, tutorial: step.id + 1 });
}

/** Story scenes wait while Nonna walks the player through the first shop (steps 1-11). */
export const tutorialHoldsStory = (s: G.GameState) => s.tutorial >= 1 && s.tutorial <= 11 && !s.shops[first(s)].managed;

/** The small notes the screen can show besides Nonna's card: a refused tap's reason, the idle-drivers pill, the queue count, a refused buy's toast. */
export type Hint = 'refusal' | 'waiting' | 'more' | 'toast';
export const HINTS: readonly Hint[] = ['refusal', 'waiting', 'more', 'toast'];

/**
 * v5.17 (U4): one instruction at a time. While the coach has a step, that step is the only thing the screen says: no "Still baking" bubble, no
 * "drivers idle" pill, no queue count, no refusal toast (every purchase stays one tap away on the sidewalk row; only the words wait).
 * Outside the tutorial every hint may show. Components ask this, none keeps its own tutorial test.
 */
export function hintsAllowed(s: G.GameState): Record<Hint, boolean> {
  // the free steps (9 and 14: play on) are the one place the hints show, so the player sees what is holding the shop back
  const step = coachStep(s);
  const on = step !== null && step.mode !== 'free';
  return { refusal: !on, waiting: !on, more: !on, toast: !on };
}

/**
 * v5.17 (U4): the padlocked tabs of neighbourhoods that cannot be built yet only mean something once the player is past the first
 * hire: until a head (or a manager) is hired anywhere, the tab strip shows the shops that are built plus the next one to build.
 */
export const showLockedTabs = (s: G.GameState): boolean => Object.values(s.shops).some((sh) => sh.managed || Object.values(sh.heads).some(Boolean));
