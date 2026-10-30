// Pure helpers for the cut-scene player and the store's scene gate (kept in .ts so they are unit-testable in node).
import type { Scene } from '../content/types';
import { STORY_PACING } from '../content/tuning';
import { pendingScenes, sceneId, type GameState } from './game';

/** Taps are ignored for this long after a line appears, so a tapping player can't blow past it. */
export const LINE_LOCKOUT_MS = 450;
/** …and for this long after a scene opens. */
export const SCENE_LOCKOUT_MS = 700;
/** A new scene waits until the player has stopped tapping the kitchen for this long. */
export const SCENE_GATE_AFTER_TAP_MS = 1500;

export function canAdvance(msSinceLineShown: number, msSinceSceneOpen: number): boolean {
  return msSinceLineShown >= LINE_LOCKOUT_MS && msSinceSceneOpen >= SCENE_LOCKOUT_MS;
}

/** True when a pending scene may open now (the last kitchen tap was long enough ago). */
export function sceneMayOpen(nowMs: number, lastKitchenTapMs: number): boolean {
  return nowMs - lastKitchenTapMs >= SCENE_GATE_AFTER_TAP_MS;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The heading shown while a scene plays. Titles such as "Brother Sal" or "Dock Saved" give the twist
 * away, so a neutral "Industrial · Part 4" shows until the last panel (or the reward card).
 */
export function sceneHeading(scene: Pick<Scene, 'title' | 'neighborhood' | 'beat' | 'panels'>, panel: number, showReward: boolean): string {
  if (showReward || panel >= scene.panels.length - 1) return scene.title;
  return `${cap(scene.neighborhood)} · Act ${scene.beat}`;
}

/**
 * Whether a waiting scene may play now (v3.7 pacing). `lastSceneEndPlay` is the play time the last scene ended
 * this session, or null right after a launch or return, when one waiting beat may play straight away.
 */
export function sceneReady(game: GameState, scene: Scene, lastSceneEndPlay: number | null): boolean {
  const kind = scene.trigger.kind;
  if (kind === 'unlock' || kind === 'bid') return true; // the player caused it
  if (lastSceneEndPlay !== null && game.playSeconds - lastSceneEndPlay < STORY_PACING.gapSeconds) return false;
  if (scene.beat === 4) {
    const beat3 = game.sceneAt[sceneId(scene.neighborhood, 3)];
    const gap = scene.neighborhood === 'downtown' ? STORY_PACING.downtownBeat4GapSeconds : STORY_PACING.beat4GapSeconds;
    if (beat3 !== undefined && game.playSeconds - beat3 < gap) return false;
  }
  return true;
}

/** The scene to open now, or null while one is playing, the player is still tapping the kitchen, or pacing holds it back. */
export function pickScene(game: GameState, scenes: Scene[], nowMs: number, lastKitchenTapMs: number, playing: boolean, lastSceneEndPlay: number | null): Scene | null {
  if (playing || !sceneMayOpen(nowMs, lastKitchenTapMs)) return null;
  return pendingScenes(game, scenes).find((sc) => sceneReady(game, sc, lastSceneEndPlay)) ?? null;
}

/**
 * The story gap to keep when the app comes back to the foreground. A short interruption (Control Center, a call
 * banner, the app switcher) keeps it; a real absence, or a cold launch, clears it so one waiting beat may play.
 */
export function resumeSceneEnd(prev: number | null, awaySeconds: number): number | null {
  return prev === null || awaySeconds >= STORY_PACING.returnSeconds ? null : prev;
}
