// Nonna's Chapter 1 script (v5.20, card C3): 15 steps (then, v5.23 card E6, the two-step Store intro: 16 and 17), each with her line (a copy key, content/copy/home/tutorial.ts), the spots of the screen it
// lights (coach targets, components/coach/targets.ts), a mode (what the player can do meanwhile) and a condition that ends it.
// Pure: the step number is saved (GameState.tutorial); an existing player who has already sold pizza starts at "done".
// Most steps end on the game's own state. Some end on something only the screen knows, which it tells us through `tutorialNote`:
// a `look` step (6, 11, 15) once it has been seen (a tap, or the overlay's `LOOK_MS`; `LOOK_FALLBACK_MS` when it cannot be drawn), the task list opening (7) and closing (8),
// the upgrades drawer opening (12) and closing (13). The Store intro: the Shop opening (16, the Store chip is lit) and the Shop closing (17, the Starter card is lit);
// owning the Starter Pack ends either.
import { cityOf, type CityDef } from '../content/cities';
import { t } from '../content/copy';
import { currentChapter, markCoachDone, nextTask, saveOf } from './chapters';
import type { CoachMode, CoachTargetId } from './coach-types';
import { reportActive } from './features/service';
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
  /** tap: the player taps the lit spot; wait: nothing to tap (the ring breathes); look: a moment to see it (a tap or the overlay's `LOOK_MS` ends it); free: play on. */
  mode: CoachMode;
}

export const TUTORIAL_DONE = G.TUTORIAL_DONE;

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
  { targets: ['hud:goal'], mode: 'tap' }, // 7: Nonna keeps a list; the goal bar opens it (v5.21)
  { targets: ['tasks:story'], mode: 'look' }, // 8: the list's Story tab; ends when the list is closed
  { targets: [], mode: 'free' }, // 9: save up for the oven upgrade
  { targets: ['walk:ovens'], mode: 'tap' }, // 10
  { targets: ['ovens:all', 'dial:oven'], mode: 'look' }, // 11: the oven bakes faster (its gain tag) and the dial shows it
  { targets: ['walk:all'], mode: 'tap' }, // 12
  { targets: ['drawer:hire:prep'], mode: 'look' }, // 13
  { targets: [], mode: 'free' }, // 14: Marco won't hire himself
  { targets: ['station:prep', 'dial:prep'], mode: 'look' }, // 15
  { targets: ['hud:store'], mode: 'tap' }, // 16: the Store chip opens the Shop on its Store tab (v5.23)
  { targets: ['store:starter'], mode: 'look' }, // 17: the Starter card; ends on "Not now", Buy or leaving the Shop
];

/** The Store intro's two steps. A first shop that runs itself does not end them: their overlays are the HUD's and the Shop's, not the shop's. */
export const STORE_STEP = G.STORE_INTRO_START;
export const STARTER_STEP = STORE_STEP + 1;

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

/** The step as it stands, without its line: which step, its copy key and mode. Cheap (no copy lookup, no money text): the per-frame questions ask this. */
function current(s: G.GameState): { step: CoachStep; key: string; mode: CoachMode; ovens: number | null } | null {
  if (s.tutorial < 1 || s.tutorial >= TUTORIAL_DONE || (s.tutorial < STORE_STEP && s.shops[first(s)].managed)) return null;
  const city = cityOf(s);
  const steps = stepsFor(city);
  let step = steps[s.tutorial - 1];
  let key = step.key;
  const ovens = G.upgradeCostOf(s, first(s), 'ovens');
  // D374: the Ovens cash went elsewhere (drivers, say): back to "save up" until it's there again
  if (step.id === 10 && ovens !== null && !G.canAfford(s, ovens)) {
    step = steps[8];
    key = 'tutorial.alt.9';
  }
  // Marco is already affordable: Nonna says so
  if (step.id === 13 && G.canAfford(s, G.headCost(first(s), 'prep', city))) key = 'tutorial.alt.13';
  // the first pizza is still on its way out: nothing to look at yet, so the cash waits with the ring breathing
  const mode = step.id === 6 && s.shops[first(s)].sold === 0 ? 'wait' : step.mode;
  return { step, key, mode, ovens };
}

/** The mode of the current step, or null when the tutorial isn't running (for the hints and the screen's "tutorial on": no line is built). */
export const coachMode = (s: G.GameState): CoachMode | null => current(s)?.mode ?? null;

/** The spots the current step lights (none when the tutorial isn't running): the one place that knows, so no screen keeps its own step-range check (C167). */
export const coachTargets = (s: G.GameState): readonly CoachTargetId[] => current(s)?.step.targets ?? NO_TARGETS;
const NO_TARGETS: readonly CoachTargetId[] = [];

/** The current step, or null when the tutorial isn't running (not started, done, or a GM already runs Downtown). */
export function coachStep(s: G.GameState): CoachStep | null {
  const c = current(s);
  if (!c) return null;
  const city = cityOf(s);
  const text = t(c.key, { marco: city.heads[first(s)].prep, cost: money(c.ovens ?? 0) }, city.id);
  return { ...c.step, key: c.key, text, mode: c.mode };
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
    case 9:
      return d.ovens > 1 || G.canAfford(s, G.upgradeCostOf(s, first(s), 'ovens'));
    case 10:
      return d.ovens > 1;
    // the Store intro: whoever owns the Starter Pack has nothing to be shown
    case 16:
    case 17:
      return G.starterOwned(s);
    // Marco hired ends 12 to 14 whatever the player did with the drawer
    case 12:
    case 13:
    case 14:
      return d.heads.prep;
    default:
      // 6, 7, 8, 11, 15: the screen says
      return false;
  }
}

/** Move past every finished step (several can finish at once). Starts once the opening scene has played. */
export function tutorialAdvance(s: G.GameState): G.GameState {
  let t = s.tutorial;
  // a first shop that runs itself has no coach (no overlay is drawn there), so a step only the overlay can end must not hold the tutorial open: it goes on to the Store intro
  if (t >= 1 && t < STORE_STEP && s.shops[first(s)].managed) t = STORE_STEP;
  if (t === 0 && s.seenScenes.includes(G.sceneId(first(s), 1))) t = 1;
  while (t >= 1 && t < TUTORIAL_DONE && done(s, t)) t++;
  return t === s.tutorial ? s : { ...s, tutorial: t };
}

/** What the screen can tell the tutorial: a `look` step was seen (a tap, or the overlay's `LOOK_MS`; `LOOK_FALLBACK_MS` when it cannot be drawn), the task list opened or closed, the upgrades drawer opened or closed. */
export type TutorialNote = 'look' | 'store-open' | 'store-left' | 'tasks-open' | 'tasks-closed' | 'drawer-open' | 'drawer-closed' | 'report-open' | 'report-look' | 'report-closed';
const ENDED_BY: Readonly<Record<number, TutorialNote>> = {
  6: 'look',
  7: 'tasks-open',
  8: 'tasks-closed',
  11: 'look',
  12: 'drawer-open',
  13: 'drawer-closed',
  15: 'look',
  16: 'store-open',
  17: 'store-left',
};

/** The screen's say-so: ends the current step when it is the one waiting for this note, and moves on over any step that is already finished. Anything else changes nothing. */
export function tutorialNote(s: G.GameState, note: TutorialNote): G.GameState {
  if (note === 'report-open' || note === 'report-look' || note === 'report-closed') return reportNote(s, note);
  const step = coachStep(s);
  if (!step || ENDED_BY[step.id] !== note) return s;
  // step 6 waits for the first sale: the cash has nothing to show before it
  if (step.id === 6 && s.shops[first(s)].sold === 0) return s;
  return tutorialAdvance({ ...s, tutorial: step.id + 1 });
}

/** Story scenes wait while Nonna walks the player through the first shop (steps 1-11) and through the Store intro (16-17: nothing else may cover the Shop or the chip). */
export const tutorialHoldsStory = (s: G.GameState) => (s.tutorial >= 1 && s.tutorial <= 11 && !s.shops[first(s)].managed) || (s.tutorial >= STORE_STEP && s.tutorial < TUTORIAL_DONE);

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
  const mode = coachMode(s);
  const on = mode !== null && mode !== 'free';
  return { refusal: !on, waiting: !on, more: !on, toast: !on };
}

/**
 * v5.17 (U4): the padlocked tabs of neighbourhoods that cannot be built yet only mean something once the player is past the first
 * hire: until a head (or a manager) is hired anywhere, the tab strip shows the shops that are built plus the next one to build.
 */
export const showLockedTabs = (s: G.GameState): boolean => Object.values(s.shops).some((sh) => sh.managed || Object.values(sh.heads).some(Boolean));

// ---------- the shop report's coach (v5.22, card E4) ----------
// A second, short sequence: the first time the chapter task "Open the shop report" is the next task, Nonna lights the strip (tap), then the Ovens bar
// and the dashed line (look) once the sheet is open, and stops when the sheet closes. Its progress is saved in `coachDone` (chapters.ts), so a save that
// has been through it, or that opened the report on its own, never sees it. The sheet itself is the screen's: it tells us (`report-open` / `-look` / `-closed`).

/** The id the finished sequence is saved under in `coachDone`; each step saves its own mark (`ReportCoachStep.mark`) as it is seen. */
export const REPORT_COACH = 'report';

export type ReportStepId = 'strip' | 'bar' | 'demand';
export interface ReportCoachStep {
  id: ReportStepId;
  /** The copy key of the line: `tutorial.report.<n>`. */
  key: string;
  text: string;
  targets: CoachTargetId[];
  mode: CoachMode;
  /** What `coachDone` gets when the step has been seen. */
  mark: string;
}

/** The steps in order. The bar is always the ovens', whatever the shop's state, so the tutorial never singles out the limit. */
const REPORT_DEFS: readonly Omit<ReportCoachStep, 'text'>[] = [
  { id: 'strip', key: 'tutorial.report.1', targets: ['report:strip'], mode: 'tap', mark: 'report:strip' },
  { id: 'bar', key: 'tutorial.report.2', targets: ['report:bar:ovens'], mode: 'look', mark: 'report:bar:ovens' },
  { id: 'demand', key: 'tutorial.report.3', targets: ['report:demand'], mode: 'look', mark: 'report:demand' },
];

/** What the screen knows: the sheet is open, and nothing else is up (no cut-scene, other sheet, drawer, task list or Chapter 1 step). */
export interface ReportCoachScreen {
  sheetOpen: boolean;
  clear: boolean;
}

const marks = (s: G.GameState) => saveOf(s).coachDone;

/** The sequence has begun (the player tapped the lit strip) and has not ended: it ends when the sheet closes. */
export const reportCoachLive = (s: G.GameState): boolean => marks(s).includes(REPORT_DEFS[0].mark) && !marks(s).includes(REPORT_COACH);

/** The sequence may begin: the chapter task `report` is the next task and open, Chapter 1's coach is over, the sequence never ran and the strip is there to light. */
function reportCoachStarts(s: G.GameState): boolean {
  // the cheap answers first: this runs on every render of the game screen, and a save that has opened the report (nearly all of them, for good) stops here (U36, C180)
  if (saveOf(s).report || marks(s).includes(REPORT_COACH) || coachMode(s) !== null) return false;
  const row = nextTask(s);
  // the strip is the active shop's: the coach points at it only while the task's shop is the one on screen
  return !!row && row.task.kind === 'report' && !row.done && s.active === row.task.shop && reportActive(s, row.task.shop);
}

/** The step to show now, or null (nothing to say). Cheap: no copy is built unless a step shows. */
export function reportCoachStep(s: G.GameState, ui: ReportCoachScreen): ReportCoachStep | null {
  const seen = marks(s);
  let def: Omit<ReportCoachStep, 'text'> | undefined;
  if (!ui.clear) return null;
  if (reportCoachLive(s)) def = ui.sheetOpen ? REPORT_DEFS.slice(1).find((d) => !seen.includes(d.mark)) : undefined;
  else if (!ui.sheetOpen && reportCoachStarts(s)) def = REPORT_DEFS[0];
  return def ? { ...def, text: t(def.key, {}, cityOf(s).id) } : null;
}

/** The sheet's notes. `report-open` is the screen's, sent only when the strip step was up; the other two are checked here. */
function reportNote(s: G.GameState, note: 'report-open' | 'report-look' | 'report-closed'): G.GameState {
  const seen = marks(s);
  if (seen.includes(REPORT_COACH)) return s;
  if (note === 'report-open') {
    // the task may already read done (the sheet's own `reportOpened` can land first), so only the chapter and Chapter 1's coach are asked
    const has = currentChapter(s)?.tasks.some((t) => t.kind === 'report');
    return has && coachMode(s) === null && !seen.includes(REPORT_DEFS[0].mark) ? markCoachDone(s, REPORT_DEFS[0].mark) : s;
  }
  if (!reportCoachLive(s)) return s;
  if (note === 'report-closed') return markCoachDone(s, REPORT_COACH);
  const next = REPORT_DEFS.slice(1).find((d) => !seen.includes(d.mark));
  return next ? markCoachDone(s, next.mark) : s;
}
