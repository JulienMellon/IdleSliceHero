// A recipe card's reveal is a centred card, not a strip in the notice column: the toast (news-toast.tsx) hands the cards of a batch to the
// reveal (recipe-reveal.tsx) through this tiny bus. Pure TS: unit-tested in node.
import type { NewsItem } from './news-model';

export type RecipeNews = Extract<NewsItem, { kind: 'recipe' }>;
type Listener = (item: RecipeNews) => void;
const listeners = new Set<Listener>();

/** The reveal listens here; returns the unsubscribe. */
export function onReveal(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Show one recipe card. Returns false when nothing is listening (the card is then shown by the toast column instead). */
export function emitReveal(item: RecipeNews): boolean {
  if (!listeners.size) return false;
  listeners.forEach((fn) => fn(item));
  return true;
}

/** The card is at most this wide (pt) and always leaves 24 pt either side: 220 pt on an iPhone SE (320). */
export const REVEAL_W = 220;
export const revealWidth = (screenW: number): number => Math.min(REVEAL_W, Math.max(0, screenW - 48));
