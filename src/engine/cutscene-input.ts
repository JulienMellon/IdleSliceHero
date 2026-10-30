// Pure helpers for the cut-scene player and the store's scene gate (kept in .ts so they are unit-testable in node).
import type { Scene } from '../content/types';
import { pendingScenes, type GameState } from './game';

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

/** The scene to open now, or null while one is playing or the player is still tapping the kitchen. */
export function pickScene(game: GameState, scenes: Scene[], nowMs: number, lastKitchenTapMs: number, playing: boolean): Scene | null {
  if (playing || !sceneMayOpen(nowMs, lastKitchenTapMs)) return null;
  return pendingScenes(game, scenes)[0] ?? null;
}
