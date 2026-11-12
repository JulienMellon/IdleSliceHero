// The toasts of the endgame, as plain data: a star earned (the `mastery` pulse), a recipe card dropped, a cosmetic a milestone gave,
// the master plaque (Nonna's line), and an event's start line. The engine keeps this news until the UI acknowledges it
// (`ackMastery`, `ackRecipes`); the toast takes the whole batch at once and shows it one by one. Pure: unit-tested in node.
import { MASTERY } from '../../content/endgame';
import { cosmeticName } from '../../content/rewards';
import type { NeighborhoodId } from '../../content/types';
import type { EventBannerView } from './event-model';
// the engine's game module first: game -> features -> game is a cycle, and it only resolves when game loads before a feature
import '../../engine/game';
import type { GameState } from '../../engine/game';
import { KEY as MASTERY_KEY, type MasteryState } from '../../engine/features/mastery';
import { KEY as RECIPES_KEY, type RecipesState } from '../../engine/features/recipes';
import { copy, recipeLine, recipeName, speakerOf } from './copy-text';
import { masteryNewsText } from './mastery-model';
import { VANITY_IDS } from './shop-model';

export type NewsItem =
  | { key: string; kind: 'star'; text: string; sub: string; shopId: NeighborhoodId }
  | { key: string; kind: 'recipe'; text: string; sub: string }
  | { key: string; kind: 'cosmetic'; text: string; sub: string }
  | { key: string; kind: 'all'; text: string; sub: string }
  | { key: string; kind: 'event'; text: string; sub: string };

/** How long one toast stays up (ms). */
export const NEWS_MS = 3200;

/** A cosmetic's name: the shop's copy for the seven it sells, the rewards name for the rest. */
export function cosmeticTitle(id: string): string {
  if (id.startsWith('storefront-skin')) return copy('shop.item.storefront-skin.name');
  return (VANITY_IDS as readonly string[]).includes(id) ? copy(`shop.item.${id as (typeof VANITY_IDS)[number]}.name`) : cosmeticName(id);
}

/** Everything the engine is waiting for the UI to show, in the order it happened (stars and cosmetics, then recipe cards). */
export function newsItems(g: GameState): NewsItem[] {
  const m = g.x?.[MASTERY_KEY] as MasteryState | undefined;
  const r = g.x?.[RECIPES_KEY] as RecipesState | undefined;
  const out: NewsItem[] = [];
  for (const n of m?.fresh ?? []) {
    if (n.kind === 'star') out.push({ key: `star:${n.shopId}:${n.star}`, kind: 'star', text: masteryNewsText(n) ?? '', sub: '', shopId: n.shopId });
    else if (n.id === MASTERY.masterCosmetic) out.push({ key: `all:${n.id}`, kind: 'all', text: copy('mastery.all'), sub: speakerOf('mastery.all') ?? '' });
    else out.push({ key: `cos:${n.id}`, kind: 'cosmetic', text: cosmeticTitle(n.id), sub: '' });
  }
  for (const id of r?.fresh ?? []) out.push({ key: `recipe:${id}`, kind: 'recipe', text: recipeName(id), sub: recipeLine(id) });
  return out;
}

/** One primitive for "something is waiting": '' when nothing is (what the toast subscribes to). */
export function newsKey(g: GameState): string {
  const m = g.x?.[MASTERY_KEY] as MasteryState | undefined;
  const r = g.x?.[RECIPES_KEY] as RecipesState | undefined;
  const a = m?.fresh.length ?? 0;
  const b = r?.fresh.length ?? 0;
  return a + b === 0 ? '' : `${a}:${b}:${m?.fresh[0] ? JSON.stringify(m.fresh[0]) : ''}:${r?.fresh[0] ?? ''}`;
}

/** An event's start line as a toast: the character's name, then what they say. */
export const eventNews = (b: Pick<EventBannerView, 'id' | 'start' | 'speaker'>): NewsItem => ({ key: `event:${b.id}`, kind: 'event', text: b.start, sub: b.speaker });
