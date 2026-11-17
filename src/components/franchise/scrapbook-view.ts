// The header count of a city's Scrapbook ("Stories 12/40"): how many of its own scenes the save has seen. Pure.
import type { Scene } from '../../content/types';

export const seenCount = (seen: readonly string[], scenes: readonly Scene[]): string => `Stories ${scenes.filter((s) => seen.includes(s.id)).length}/${scenes.length}`;
