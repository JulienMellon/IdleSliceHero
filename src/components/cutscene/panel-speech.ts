// What a screen reader says for a cut-scene panel: the drawing is decoration, the words are the panel (pure, so a test can walk every scene).
import type { Scene, ScenePanel } from '../../content/types';

/** The text of one beat of a panel: its caption and prop text, then the line on screen ("Nonna Rosa: ..."). Never empty for a panel that has words. */
export function panelSpeech(p: Pick<ScenePanel, 'caption' | 'propText' | 'lines'>, line: number): string {
  const parts: string[] = [];
  if (p.caption) parts.push(p.caption);
  if (p.propText && !p.caption) parts.push(`Sign: ${p.propText}`);
  const l = p.lines[line];
  if (l) parts.push(`${l.speaker}: ${l.text}`);
  return parts.join('. ');
}

/** The whole panel as one text: every line in order (what the Scrapbook or a test reads). */
export function panelText(p: Pick<ScenePanel, 'caption' | 'propText' | 'lines'>): string {
  const lines = p.lines.map((_, i) => panelSpeech({ ...p, caption: undefined, propText: undefined }, i));
  return [panelSpeech({ ...p, lines: [] }, 0), ...lines].filter(Boolean).join('. ');
}

/** The spoken label of the cut-scene's tap area: the heading, then the beat, then what a tap does. */
export function sceneLabel(heading: string, beat: string): string {
  return [heading, beat].filter(Boolean).join('. ');
}

/** Every panel of a scene as text, in order: a scene with a panel that says nothing is a scene a screen-reader player cannot follow. */
export const sceneTexts = (scene: Pick<Scene, 'panels'>): string[] => scene.panels.map(panelText);
