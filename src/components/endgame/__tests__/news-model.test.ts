/// <reference types="jest" />
import * as G from '../../../engine/game';
import { cosmeticTitle, eventNews, newsItems, newsKey, NEWS_MS } from '../news-model';

const base = (): G.GameState => G.newGame(1_700_000_000_000);
const withNews = (mastery: unknown[], recipes: string[]): G.GameState => {
  const g = base();
  return {
    ...g,
    x: { ...g.x, mastery: { announced: [], granted: [], fresh: mastery, synced: true, summary: null }, recipes: { owned: [], fresh: recipes, synced: true, summary: null } },
  };
};

describe('the endgame toasts', () => {
  test('nothing waiting: no key, no items', () => {
    expect(newsKey(withNews([], []))).toBe('');
    expect(newsItems(withNews([], []))).toEqual([]);
    expect(newsKey(base())).toBe('');
  });

  test('a star is the mastery pulse: its copy toast, with the shop', () => {
    const g = withNews([{ kind: 'star', shopId: 'uptown', star: 'golden' }], []);
    expect(newsKey(g)).not.toBe('');
    expect(newsItems(g)).toEqual([{ key: 'star:uptown:golden', kind: 'star', text: 'Golden ovens glow in Uptown!', sub: '', shopId: 'uptown' }]);
  });

  test('a recipe card: its name and flavour line', () => {
    const [i] = newsItems(withNews([], ['recipe.waterfront.3']));
    expect(i).toMatchObject({ kind: 'recipe', text: 'Bell-Ringer Pie', sub: 'Baked the night the pier stayed a pier. Ring the bell!' });
  });

  test('18 stars: Nonna’s line for the plaque; other cosmetics by their shop name', () => {
    const all = newsItems(withNews([{ kind: 'cosmetic', id: 'plaque-master' }], []));
    expect(all[0]).toMatchObject({ kind: 'all', sub: 'Nonna Rosa' });
    expect(all[0].text).toMatch(/^Eighteen stars, cara mia/);
    expect(newsItems(withNews([{ kind: 'cosmetic', id: 'neon-counter' }], []))[0]).toMatchObject({ kind: 'cosmetic', text: 'Neon Counter' });
    expect(cosmeticTitle('storefront-skin-3')).toBe('Fresh Storefront');
  });

  test('stars first, then recipe cards, in the order they came', () => {
    const items = newsItems(withNews([{ kind: 'star', shopId: 'downtown', star: 'heads' }, { kind: 'star', shopId: 'downtown', star: 'golden' }], ['recipe.downtown.2']));
    expect(items.map((i) => i.key)).toEqual(['star:downtown:heads', 'star:downtown:golden', 'recipe:recipe.downtown.2']);
  });

  test('the key changes when something new waits (so the toast takes the batch again)', () => {
    const a = newsKey(withNews([{ kind: 'star', shopId: 'downtown', star: 'heads' }], []));
    const b = newsKey(withNews([{ kind: 'star', shopId: 'downtown', star: 'heads' }, { kind: 'star', shopId: 'suburbs', star: 'heads' }], []));
    expect(a).not.toBe(b);
  });

  test('an event’s start line is a toast from its character', () => {
    expect(eventNews({ id: 'game-day', start: 'Big game today, pal!', speaker: 'Dale' })).toEqual({ key: 'event:game-day', kind: 'event', text: 'Big game today, pal!', sub: 'Dale' });
    expect(NEWS_MS).toBeGreaterThanOrEqual(2500);
  });
});
