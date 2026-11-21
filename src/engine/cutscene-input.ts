// Pure helpers for the cut-scene player and the store's scene gate (kept in .ts so they are unit-testable in node).
import type { Scene, SceneLine } from '../content/types';
import { STORY_PACING } from '../content/tuning';
import { findHood } from '../content/cities';
import { pendingScenes, type GameState } from './game';
import { sceneWaitSeconds } from './story';

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
/** The neighbourhood's display name ("North End", "Back Bay"); an id no city has falls back to the capitalised slug. */
const hoodName = (id: string): string => findHood(id)?.name ?? cap(id);

/**
 * The heading shown while a scene plays. Titles such as "Brother Sal" or "Dock Saved" give the twist
 * away, so a neutral "Industrial · Part 4" shows until the last panel (or the reward card).
 */
export function sceneHeading(scene: Pick<Scene, 'title' | 'neighborhood' | 'beat' | 'panels'>, panel: number, showReward: boolean): string {
  if (showReward || panel >= scene.panels.length - 1) return scene.title;
  return `${hoodName(scene.neighborhood)} · ${scene.beat === 'interlude' ? 'Interlude' : `Act ${scene.beat}`}`;
}

/** The scene as it plays for this save: a line that waits on another scene (`ifSeen`: a manager speaking before their hire scene) is left out until that scene has been seen. */
export function resolveScene(scene: Scene, seenScenes: readonly string[]): Scene {
  const gone = (l: SceneLine) => l.ifSeen !== undefined && !seenScenes.includes(l.ifSeen);
  if (!scene.panels.some((p) => p.lines.some(gone))) return scene;
  return { ...scene, panels: scene.panels.map((p) => (p.lines.some(gone) ? { ...p, lines: p.lines.filter((l) => !gone(l)) } : p)) };
}

/** Whether the scene's end restarts the 90 s story gap. A hire scene is something the player did (like a build or the bid): it never holds the next main beat back. */
export const scenePacesGap = (scene: Pick<Scene, 'trigger'>): boolean => scene.trigger.kind !== 'manager';

/**
 * Whether a waiting scene may play now (v3.7 pacing). `lastSceneEndPlay` is the play time the last scene ended
 * this session, or null right after a launch or return, when one waiting beat may play straight away.
 */
export function sceneReady(game: GameState, scene: Scene, lastSceneEndPlay: number | null): boolean {
  // the one rule is story.ts's `sceneWaitSeconds` (the goal bar's countdown reads it too)
  return sceneWaitSeconds(game, scene, lastSceneEndPlay) === 0;
}

/** The scene to open now, or null while one is playing, the player is still tapping the kitchen, or pacing holds it back. */
export function pickScene(
  game: GameState,
  scenes: Scene[],
  nowMs: number,
  lastKitchenTapMs: number,
  playing: boolean,
  lastSceneEndPlay: number | null,
): Scene | null {
  if (playing || !sceneMayOpen(nowMs, lastKitchenTapMs)) return null;
  const next = pendingScenes(game, scenes).find((sc) => sceneReady(game, sc, lastSceneEndPlay));
  return next ? resolveScene(next, game.seenScenes) : null;
}

/**
 * The story gap to keep when the app comes back to the foreground. A short interruption (Control Center, a call
 * banner, the app switcher) keeps it; a real absence, or a cold launch, clears it so one waiting beat may play.
 */
export function resumeSceneEnd(prev: number | null, awaySeconds: number, playSeconds: number): number | null {
  if (prev === null || awaySeconds >= STORY_PACING.returnSeconds) return null;
  // a reload can bring back a save older than the gap's start (a failed write); never wait past the full gap (C47)
  return Math.min(prev, playSeconds);
}
