// Test helper (v5.21): a state whose every chapter task is done, for the tests that are about a scene's trigger and the pacing around it, not the
// chapters' teaching tasks (`chapters.test.ts` is about those).
import { HOME_CHAPTERS } from '../../content/cities/home/chapters';
import { CHAPTERS_KEY, newChapterSave } from '../chapters';
import { KEY as SERVICE_KEY } from '../features/service';
import type { GameState } from '../game';

export const ALL_TASK_KEYS: string[] = HOME_CHAPTERS.flatMap((c) => c.tasks.map((t) => t.key));

/** `g` with every home chapter task marked done: a beat then waits for its trigger and the pacing alone, as before chapters. */
export const withTasksDone = (g: GameState): GameState => ({ ...g, x: { ...g.x, [CHAPTERS_KEY]: { ...newChapterSave(), done: ALL_TASK_KEYS } } });

/** Every slice of `x` is the same object in `a` and `b`, but the chapters' (which counts held tasks on every tick of a state that has chapters open) and the service's (which senses every live shop on every tick, v5.22): the "nothing owed, nothing changed" check. */
export const sameSlices = (a: Record<string, unknown>, b: Record<string, unknown>): boolean =>
  Object.keys({ ...a, ...b }).every((k) => k === CHAPTERS_KEY || k === SERVICE_KEY || a[k] === b[k]);
