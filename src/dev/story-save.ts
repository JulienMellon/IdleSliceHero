// The Test panel's Story & save block (card X4): play the next story beat now, skip the tutorial, copy the save out, paste one in and reset the
// test save. Pure TypeScript with the store and the storage passed in (`JumpHost`, `ResetHost`), so jest runs it in node; story-save-section.tsx
// wires the real ones. Nothing here may write the real save (slice-empire/save/v1).
import { cityOf } from '../content/cities';
import { STORY_PACING } from '../content/tuning';
import { TEST_PREFS_KEY } from '../components/store/store-model';
import {
  challengeOffered,
  firstHood,
  markSceneSeen,
  migrate,
  sceneId,
  TUTORIAL_DONE,
  type GameState,
} from '../engine/game';
import { rivalOpen } from '../engine/features/layers/rival';
import { sceneTriggered } from '../engine/story';
import { CHEATS_KEY } from './cheat-prefs';
import { BACKUP_KEY, REAL_SAVE_KEY, TEST_SAVE_KEY, type JumpHost, type KeyValue } from './jumps';

export { BACKUP_KEY, TEST_SAVE_KEY };

/** Every key the reset clears: the test save, its backup slot, the test cheats (free buys, speed, clock offset) and the store's test prefs. */
export const RESET_KEYS = [TEST_SAVE_KEY, BACKUP_KEY, CHEATS_KEY, TEST_PREFS_KEY] as const;

function assertTestKey(saveKey: string): void {
  if (saveKey === REAL_SAVE_KEY || !saveKey.startsWith('slice-empire/save/test-')) throw new Error(`the test panel writes only test saves, not ${saveKey}`);
}

// ---------- Play next story beat now ----------

export type NextBeat =
  | { ok: true; state: GameState; kind: 'scene' | 'challenge'; /** The scene that is due now, or the shop whose challenge is on offer. */ id: string; label: string }
  | { ok: false; reason: string };

/**
 * Make the next beat that waits on a play-time gap due now, by moving the beat stamp the gap counts from (`sceneAt`), never the tuning. Two kinds of wait:
 * an `after` scene (an interlude: its trigger is `sceneAt[scene] + seconds <= playSeconds`), and a rival challenge held by the finale gap
 * (`challengeOffered`: beat 4 plays when it is won, so the stamp that moves is the shop's beat 3). The soonest one goes first.
 * Refused, with the reason, when nothing waits on a gap. The state that comes back plays its scene through the store's own path (`queueScene`).
 */
export function nextBeatNow(g: GameState): NextBeat {
  const city = cityOf(g);
  const seen = new Set(g.seenScenes);
  let best: { due: number; sceneId: string; label: string; stamp: string; at: number } | null = null;
  for (const sc of city.scenes) {
    const tr = sc.trigger;
    if (tr.kind !== 'after' || seen.has(sc.id)) continue;
    if (sc.requires?.some((id) => !seen.has(id)) || !seen.has(tr.scene) || !g.shops[tr.neighborhood]?.built) continue;
    if (sceneTriggered(g, sc)) continue; // already due: nothing waits
    const due = (g.sceneAt[tr.scene] ?? 0) + tr.seconds;
    // one second past the line, so a float sum can never land a hair short of it
    if (!best || due < best.due) best = { due, sceneId: sc.id, label: sc.title, stamp: tr.scene, at: g.playSeconds - tr.seconds - 1 };
  }
  if (best) {
    const state = { ...g, sceneAt: { ...g.sceneAt, [best.stamp]: Math.min(g.sceneAt[best.stamp] ?? best.at, best.at) } };
    return { ok: true, state, kind: 'scene', id: best.sceneId, label: best.label };
  }
  const first = firstHood(city);
  for (const hood of city.neighbourhoods) {
    if (!rivalOpen(g, hood.id) || challengeOffered(g, hood.id)) continue;
    const gap = hood.id === first ? STORY_PACING.firstHoodBeat4GapSeconds : STORY_PACING.beat4GapSeconds;
    const stamp = sceneId(hood.id, 3);
    const state = { ...g, sceneAt: { ...g.sceneAt, [stamp]: g.playSeconds - gap - 1 } };
    return { ok: true, state, kind: 'challenge', id: hood.id, label: hood.name };
  }
  return { ok: false, reason: 'No story beat is waiting on a gap' };
}

/** Why the "Play next story beat now" row is off (the row's caption), or null when it can run. */
export function nextBeatReason(g: GameState): string | null {
  const r = nextBeatNow(g);
  return r.ok ? null : r.reason;
}

// ---------- Skip tutorial ----------

/**
 * The game of a player who has finished the tutorial. The coach grants nothing itself: it ends when the first shop has a second oven and its prep head
 * (`done` in engine/tutorial.ts), after a batch has sold and the opening scene has played. So those are put in place (never lowered), and the step is
 * `TUTORIAL_DONE`. Nothing is charged: this is a way to stand where the tutorial ends, not a purchase.
 */
export function skipTutorial(g: GameState): GameState {
  if (g.tutorial >= TUTORIAL_DONE) return g;
  const city = cityOf(g);
  const id = firstHood(city);
  const shop = g.shops[id];
  let next: GameState = {
    ...g,
    tutorial: TUTORIAL_DONE,
    shops: { ...g.shops, [id]: { ...shop, ovens: Math.max(shop.ovens, 2), sold: Math.max(shop.sold, 1), heads: { ...shop.heads, prep: true } } },
  };
  const opening = city.scenes.find((sc) => sc.id === sceneId(id, 1));
  if (opening) next = markSceneSeen(next, opening);
  return next;
}

/** Why the "Skip tutorial" row is off, or null. */
export const skipTutorialReason = (g: GameState): string | null => (g.tutorial >= TUTORIAL_DONE ? 'The tutorial is already done' : null);

// ---------- Export and import ----------

/** The current test save as JSON text: the pending save lands first, then the slot is read (the game itself when the slot is empty). */
export async function exportSave(host: JumpHost): Promise<string> {
  assertTestKey(host.saveKey);
  await host.flush();
  return (await host.storage.getItem(host.saveKey)) ?? JSON.stringify(host.current());
}

/** The web clipboard, as far as copying needs it. */
export interface Clipboard {
  writeText(text: string): Promise<void>;
}

/** Copy `text`; false when there is no clipboard or it refuses (the section then shows the text in a box to select). */
export async function copyText(text: string, clipboard: Clipboard | null | undefined): Promise<boolean> {
  if (!clipboard) return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** How long "Copied" stays up (ms). */
export const COPIED_MS = 2000;

/** Read pasted text as a save: the parse error as it is, or a refusal for JSON that is not a save at all. Loads nothing. */
export function parseSave(text: string, now: number): { ok: true; state: GameState } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Not a save: expected a JSON object' };
  const o = raw as Record<string, unknown>;
  // `migrate` turns anything into a game (`{}` is a fresh one); a paste with neither mark of a save is a mistake, not a save
  if (typeof o.saveVersion !== 'number' && (!o.shops || typeof o.shops !== 'object')) return { ok: false, error: 'Not a save: no saveVersion and no shops' };
  try {
    return { ok: true, state: migrate(raw, now) };
  } catch (e) {
    return { ok: false, error: `Could not load it: ${(e as Error).message}` };
  }
}

/**
 * Paste a save in: parse and `migrate` first (a bad paste returns its error and touches nothing: no write, no flush), then the current test save goes
 * to the backup slot (the one the jumps use, so "Undo last jump" brings it back), then the pasted game becomes the test save and the game in memory.
 */
export async function importSave(host: JumpHost, text: string): Promise<{ ok: true; state: GameState } | { ok: false; error: string }> {
  assertTestKey(host.saveKey);
  const parsed = parseSave(text, host.now());
  if (!parsed.ok) return parsed;
  await host.flush();
  const saved = await host.storage.getItem(host.saveKey);
  await host.storage.setItem(BACKUP_KEY, saved ?? JSON.stringify(host.current()));
  await host.storage.setItem(host.saveKey, JSON.stringify(parsed.state));
  host.set(parsed.state);
  return parsed;
}

// ---------- Reset test save ----------

/** What a reset needs from the app. */
export interface ResetHost {
  storage: KeyValue;
  saveKey: string;
  /** Wait for the store's pending save, so it cannot land after the keys are cleared. */
  flush(): Promise<void>;
  /** The cheats back to what a test build starts with: free buys ON, speed 1x, no store answer, clock offset 0. */
  defaults(): void;
  /** The clock offset now: the setter only moves forward, so it can still be above 0 after `defaults`. */
  clockOffset(): number;
  /** Reload the page: the cleared cheats key then puts the offset at 0. */
  reload(): void;
  /** Start a new game in the store (it saves under the test key). */
  newGame(): Promise<void>;
}

/**
 * Clear the test save, the backup slot, the test cheats and the store's test prefs, put the cheats back to their defaults and start a new game.
 * Never touches the real save. When the clock offset cannot be put back from here (it only moves forward), the page reloads on the cleared keys
 * instead of starting a game stamped with a clock the next launch will not have.
 */
export async function resetTestSave(host: ResetHost): Promise<{ reloaded: boolean }> {
  assertTestKey(host.saveKey);
  await host.flush();
  for (const key of RESET_KEYS) await host.storage.removeItem(key);
  host.defaults();
  if (host.clockOffset() > 0) {
    host.reload();
    return { reloaded: true };
  }
  await host.newGame();
  return { reloaded: false };
}
