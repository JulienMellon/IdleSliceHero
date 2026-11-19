// The story's rules, as pure functions of a game (A33): when a scene's trigger has passed, which scenes are pending, the goal bar's wait hint,
// when a rival challenge is offered and the load-time story migration. They were in game.ts, which then had to import the rival layer and the
// scene lists; game.ts re-exports the readers for the callers that still say `G.pendingScenes`.
import { cityOf, findHood } from '../content/cities';
import { STORY_PACING } from '../content/tuning';
import type { NeighborhoodId, Scene } from '../content/types';
import { challengeWon, rivalOpen } from './features/layers/rival';
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

/** The scene's trigger has passed and every scene it requires has been seen. */
export function sceneTriggered(s: GameState, scene: Scene): boolean {
  if (scene.requires?.some((id) => !s.seenScenes.includes(id))) return false;
  return triggerPasses(s, scene);
}

/** Unseen scenes whose triggers pass, in story order (earliest first); main beats come before interludes when both are ready. */
export function pendingScenes(s: GameState, scenes: Scene[]): Scene[] {
  const seen = new Set(s.seenScenes);
  const main: Scene[] = [];
  const interludes: Scene[] = [];
  for (const sc of scenes) if (!seen.has(sc.id) && sceneTriggered(s, sc)) (sc.beat === 'interlude' ? interludes : main).push(sc);
  return interludes.length ? main.concat(interludes) : main;
}

/** A story's scenes by id, built once per list (M66): the goal bar asks `storyWaitHint` often. */
const BY_ID = new WeakMap<readonly Scene[], ReadonlyMap<string, Scene>>();
export const scenesById = (scenes: readonly Scene[]): ReadonlyMap<string, Scene> => {
  let m = BY_ID.get(scenes);
  if (!m) BY_ID.set(scenes, (m = new Map(scenes.map((sc) => [sc.id, sc]))));
  return m;
};

const capital = (id: string) => findHood(id)?.name ?? id.charAt(0).toUpperCase() + id.slice(1);

/**
 * A line for the goal bar when a main beat has triggered but is held behind a finale the player still has to earn (Uptown behind
 * Industrial's, University behind the Pier 9 bid). Holds that clear with play time return null: they clear on their own.
 */
export function storyWaitHint(s: GameState, scenes: readonly Scene[] = cityOf(s).scenes): string | null {
  const seen = new Set(s.seenScenes);
  const byId = scenesById(scenes);
  const unseenBehind = (sc: Scene, out: Set<string> = new Set()): Set<string> => {
    for (const id of prerequisites(sc)) {
      const p = byId.get(id);
      if (seen.has(id) || out.has(id) || !p) continue;
      out.add(id);
      unseenBehind(p, out);
    }
    return out;
  };
  for (const sc of scenes) {
    if (seen.has(sc.id) || sc.beat === 'interlude' || !triggerPasses(s, sc) || sceneTriggered(s, sc)) continue;
    for (const id of unseenBehind(sc)) {
      const f = byId.get(id)!;
      // a finale of its own that nobody has earned yet (a finale that has been earned is only waiting its turn)
      if (f.beat !== 4 || triggerPasses(s, f)) continue;
      return f.trigger.kind === 'bid'
        ? `Save Marisol’s dock to continue ${capital(sc.neighborhood)}’s story`
        : `Win over ${capital(f.neighborhood)} to continue ${capital(sc.neighborhood)}’s story`;
    }
  }
  return null;
}

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
