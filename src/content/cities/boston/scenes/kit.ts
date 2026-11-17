// Compact builders for the Boston scenes (docs/story/BOSTON-SCRIPT.md): a panel is its backdrop, who is on stage, an optional caption and its bubbles.
// They return the same plain `Scene` data as the home pack's files; nothing here runs in the game.
import type { Backdrop, Cast, CharacterId, Mood, PanelCue, PropId, ScenePanel } from '../../../types';

export type Who = readonly [CharacterId, Mood];
export type Say = readonly [speaker: string, text: string];
export interface Extra {
  prop?: PropId;
  propText?: string;
  cue?: PanelCue;
}

/** One panel. `who` lists the cast left to right (0 to 2: the schema test checks the count); `caption` is the italic narration line, or null. */
export function panel(backdrop: Backdrop, who: readonly Who[], caption: string | null, lines: readonly Say[], extra: Extra = {}): ScenePanel {
  return {
    backdrop,
    cast: who.map(([id, mood]) => ({ id, mood })) as unknown as Cast,
    ...(caption ? { caption } : {}),
    ...extra,
    lines: lines.map(([speaker, text]) => ({ speaker, text })),
  };
}
