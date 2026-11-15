// What the Scrapbook's story tab shows, as plain data (v5.16): each neighbourhood's scenes in story order, a tile's label ("1" to "4" for a main
// beat, "Interlude" for one of Todd's scenes or a manager's hire scene) and the header count. Pure, so node tests pin it.
import { HOME_SCENES } from '../../content/scenes/home';
import type { NeighborhoodId, Scene } from '../../content/types';

export const INTERLUDE_LABEL = 'Interlude';

/** A neighbourhood's scenes in the story's order (HOME_SCENES is written in story order, each interlude where it is told). */
export function chapterScenes(hood: NeighborhoodId, scenes: readonly Scene[] = HOME_SCENES): Scene[] {
  return scenes.filter((s) => s.neighborhood === hood);
}

/** The small label over a tile's title: the beat number, or "Interlude". */
export function tileLabel(s: Pick<Scene, 'beat'>): string {
  return s.beat === 'interlude' ? INTERLUDE_LABEL : String(s.beat);
}

/** The header's count: "Stories 12/40" (the total is every home scene, so a new scene moves it with no edit here). */
export function storiesCount(seen: number, scenes: readonly Scene[] = HOME_SCENES): string {
  return `Stories ${seen}/${scenes.length}`;
}
