// The story's rules, as pure functions of a game (A33): when a scene's trigger has passed, which scenes are pending, the goal bar's wait hint,
// when a rival challenge is offered and the load-time story migration. They were in game.ts, which then had to import the rival layer and the
// scene lists; game.ts re-exports the readers for the callers that still say `G.pendingScenes`.
import { cityOf } from '../content/cities';
import { STORY_PACING } from '../content/tuning';
import type { NeighborhoodId, Scene } from '../content/types';
import { challengeWon, rivalOpen } from './features/layers/rival';
import { chapterDone, chapterOf } from './chapters';
import { firstHood, sceneId, type GameState } from './game';

/** Every scene a scene waits for: its `requires`, and the scene an `after` trigger counts from. */
export function prerequisites(scene: Scene): string[] {
  const tr = scene.trigger;
  return tr.kind === 'after' ? [...(scene.requires ?? []), tr.scene] : (scene.requires ?? []);
}

/** The scene's own trigger, ignoring `requires`. */
export function triggerPasses(s: GameState, scene: Scene): boolean {
  const tr = scene.trigger;
  const shop = s.shops[tr.neighborhood];
  if (!shop.built) return false;
  switch (tr.kind) {
    case 'unlock':
      return true;
    case 'bid':
      return shop.perk;
    case 'after': {
      if (!s.seenScenes.includes(tr.scene)) return false;
      // seen with no time on record (a save from before play time existed, or a scene the migration marked): counted from the start of play
      return (s.sceneAt[tr.scene] ?? 0) + tr.seconds <= s.playSeconds;
    }
    case 'challenge':
      return challengeWon(s, tr.neighborhood);
    case 'manager':
      return shop.managed;
    default:
      return shop.sold >= tr.count;
  }
}

/**
 * The scene may play: every scene it requires has been seen and its trigger has passed (the day's pacing is `sceneReady`'s). A main beat with a
 * chapter (v5.21) also waits for every task of the chapter, whose first task is the trigger made visible, so the chapter only ever adds to the
 * wait. A scene with no chapter (an interlude, a hire scene, Boston's story) and a chapter marked `free` (the opening) keep the trigger alone.
 */
export function sceneTriggered(s: GameState, scene: Scene): boolean {
  if (scene.requires?.some((id) => !s.seenScenes.includes(id))) return false;
  if (!triggerPasses(s, scene)) return false;
  const chapter = chapterOf(s, scene.id);
  return !chapter || !!chapter.free || chapterDone(s, chapter);
}

/**
 * Play seconds a scene whose trigger has passed still waits on the story's pacing: 0 when it may play now. The one rule behind `sceneReady`
 * (cutscene-input.ts) and the goal bar's countdown (`chapterReady`): a scene the player caused (a new pizzeria, the bid, a won challenge, a hired
 * manager) never waits; the others wait for the 90 s after the last scene (`lastSceneEndPlay`, null right after a launch: none), and a beat 4 for
 * the gap after beat 3. Whole seconds, rounded up, so 0 is exactly "ready".
 */
export function sceneWaitSeconds(s: GameState, scene: Scene, lastSceneEndPlay: number | null): number {
  const kind = scene.trigger.kind;
  if (kind === 'unlock' || kind === 'bid' || kind === 'challenge' || kind === 'manager') return 0;
  let left = lastSceneEndPlay === null ? 0 : STORY_PACING.gapSeconds - (s.playSeconds - lastSceneEndPlay);
  if (scene.beat === 4) {
    const beat3 = s.sceneAt[sceneId(scene.neighborhood, 3)];
    const gap = scene.neighborhood === firstHood(cityOf(s)) ? STORY_PACING.firstHoodBeat4GapSeconds : STORY_PACING.beat4GapSeconds;
    if (beat3 !== undefined) left = Math.max(left, gap - (s.playSeconds - beat3));
  }
  return Math.max(0, Math.ceil(left));
}

/** Unseen scenes whose triggers pass, in story order (earliest first); main beats come before interludes when both are ready. */
export function pendingScenes(s: GameState, scenes: Scene[]): Scene[] {
  const seen = new Set(s.seenScenes);
  const main: Scene[] = [];
  const interludes: Scene[] = [];
  for (const sc of scenes) if (!seen.has(sc.id) && sceneTriggered(s, sc)) (sc.beat === 'interlude' ? interludes : main).push(sc);
  return interludes.length ? main.concat(interludes) : main;
}

/** A story's scenes by id, built once per list (M66): the chapter code asks it often. */
const BY_ID = new WeakMap<readonly Scene[], ReadonlyMap<string, Scene>>();
export const scenesById = (scenes: readonly Scene[]): ReadonlyMap<string, Scene> => {
  let m = BY_ID.get(scenes);
  if (!m) BY_ID.set(scenes, (m = new Map(scenes.map((sc) => [sc.id, sc]))));
  return m;
};

/**
 * The rival challenge in `id` may be taken now: the MegaSlice shop is open there and the finale wait is over (300 s of play after beat 3,
 * Downtown's shorter). This wait gates when the challenge is offered, not when beat 4 plays: beat 4 plays the moment it is won.
 */
export function challengeOffered(s: GameState, id: NeighborhoodId): boolean {
  if (!rivalOpen(s, id)) return false;
  const beat3 = s.sceneAt[sceneId(id, 3)];
  const gap = id === firstHood(cityOf(s)) ? STORY_PACING.firstHoodBeat4GapSeconds : STORY_PACING.beat4GapSeconds;
  return beat3 === undefined || s.playSeconds - beat3 >= gap;
}

/**
 * The story part of `migrate` (idempotent, so it runs on every load). Every scene a seen scene waits for is seen too, however far back the
 * chain goes (a save that has played University's beat 3 never meets "Sorry in advance about the university" afterwards), stamped with
 * the time of the scene that needed it. A shop that already has its manager in a save from before v6 (when the hire scenes came) has met
 * them: its hire scene is seen. A v6 save keeps a hire scene pending until it plays (C121: it used to be marked seen on the next load).
 */
export function migrateStory(game: GameState, fromVersion: number): GameState {
  const scenes = cityOf(game).scenes;
  const byId = scenesById(scenes);
  const seen = new Set(game.seenScenes);
  const sceneAt = { ...game.sceneAt };
  const mark = (id: string, at: number | undefined) => {
    const sc = byId.get(id);
    if (!sc) return;
    for (const pre of prerequisites(sc)) {
      if (!seen.has(pre)) {
        seen.add(pre);
        if (at !== undefined && sceneAt[pre] === undefined) sceneAt[pre] = at;
      }
      mark(pre, at);
    }
  };
  if (fromVersion < 6) for (const sc of scenes) if (sc.trigger.kind === 'manager' && game.shops[sc.trigger.neighborhood].managed) seen.add(sc.id);
  for (const id of [...seen]) mark(id, sceneAt[id]);
  if (seen.size === game.seenScenes.length) return game;
  const seenScenes = [...game.seenScenes, ...[...seen].filter((id) => !game.seenScenes.includes(id))];
  return { ...game, seenScenes, sceneAt };
}
