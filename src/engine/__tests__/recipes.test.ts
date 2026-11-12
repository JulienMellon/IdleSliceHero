// Recipe cards (v5.15): each drop, the 1.01 multiplier, play-only sources and the catch-up on a v5.14 save.
import { RECIPE, recipeId } from '../../content/endgame';
import { NEIGHBORHOODS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { getFeature } from '../features';
import { ackRecipes, cardEarned, collectionView, ownedIn, recipes } from '../features/recipes';
import * as G from '../game';

const T0 = 1_700_000_000_000;
const IDS = NEIGHBORHOODS.map((n) => n.id);
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } } });
const built = (): G.GameState => IDS.reduce((g, id) => withShop(g, id, { built: true }), G.newGame(T0));
const tick = (g: G.GameState) => G.playTick(g, 1, T0);
const state = (g: G.GameState) => getFeature(g, recipes);
/** A game that has had its silent first tick: from here on a card is a drop. */
const synced = (): G.GameState => tick(built());
const owned = (g: G.GameState) => state(g).owned;

describe('the cards', () => {
  it('24 cards: four per shop, ids recipe.<hood>.<1-4>', () => {
    const c = collectionView(synced());
    expect(c.total).toBe(24);
    expect(c.shops.map((s) => s.total)).toEqual([4, 4, 4, 4, 4, 4]);
    expect(c.shops[0].cards.map((x) => x.id)).toEqual(['recipe.downtown.1', 'recipe.downtown.2', 'recipe.downtown.3', 'recipe.downtown.4']);
    expect(recipeId('uptown', 3)).toBe('recipe.uptown.3');
  });

  it('card 1: any station in that shop reaches Lv 50', () => {
    let g = synced();
    g = tick(withShop(g, 'suburbs', { prep: 49, ovens: 49, counter: 49 }));
    expect(owned(g)).toEqual([]);
    for (const k of ['prep', 'ovens', 'counter'] as const) {
      const a = tick(withShop(synced(), 'suburbs', { [k]: 50 }));
      expect(owned(a)).toEqual(['recipe.suburbs.1']);
      expect(state(a).fresh).toEqual(['recipe.suburbs.1']);
    }
    // seating and drivers are not kitchen stations
    expect(owned(tick(withShop(synced(), 'suburbs', { tables: 80, drivers: 80 })))).toEqual([]);
  });

  it('card 2: the General Manager is hired', () => {
    const g = tick(withShop(synced(), 'waterfront', { managed: true, heads: G.allHeads() }));
    expect(owned(g)).toEqual(['recipe.waterfront.2']);
  });

  it('card 3: the finale is seen', () => {
    const g = tick({ ...synced(), seenScenes: ['university-4'] });
    expect(owned(g)).toEqual(['recipe.university.3']);
    expect(cardEarned(g, 'university', 3)).toBe(true);
    expect(cardEarned(g, 'uptown', 3)).toBe(false);
  });

  it('card 4: a counter-attack is defended there (the attack itself is in counterattack.test.ts)', () => {
    const g0 = synced();
    const g = tick({ ...g0, x: { ...g0.x, counterattack: { ...(g0.x.counterattack as object), defended: ['industrial'] } } });
    expect(owned(g)).toEqual(['recipe.industrial.4']);
  });

  it('a card drops once, and keeps its place if the condition lapses', () => {
    let g = tick(withShop(synced(), 'suburbs', { prep: 50 }));
    const x = g.x;
    expect(tick(g).x).toBe(x);
    g = tick(withShop(g, 'suburbs', { prep: 10 }));
    expect(owned(g)).toEqual(['recipe.suburbs.1']);
  });

  it('cards come only from play: diamonds, boosters and cosmetics do not move them', () => {
    const g0 = synced();
    const g = tick({ ...g0, rewards: { ...g0.rewards, diamonds: 1e6, boosters: [{ mult: 2, seconds: 60 }], cosmetics: ['oven-gold'], worn: ['oven-gold'] } });
    expect(owned(g)).toEqual([]);
    expect(g.x).toBe(g0.x);
  });
});

describe('the 1.01 multiplier', () => {
  it("each owned card multiplies that shop's value by 1.01, and only that shop", () => {
    const g0 = synced();
    const none = (id: NeighborhoodId) => G.featureMults(g0, id, T0).value;
    expect(none('suburbs')).toBe(1);
    let g = tick(withShop(g0, 'suburbs', { prep: 50, managed: true, heads: G.allHeads() }));
    expect(ownedIn(g, 'suburbs')).toBe(2);
    expect(G.featureMults(g, 'suburbs', T0).value).toBeCloseTo(1.01 ** 2, 12);
    expect(G.featureMults(g, 'downtown', T0).value).toBe(1);
    g = tick({ ...g, seenScenes: ['suburbs-4'] });
    expect(G.featureMults(g, 'suburbs', T0).value).toBeCloseTo(RECIPE.valueMult ** 3, 12);
  });

  it('reaches earnings and the price per pizza', () => {
    const g0 = withShop(synced(), 'suburbs', { prep: 40, ovens: 40, counter: 40, footprint: 3, tables: 5 });
    const g = tick({ ...g0, seenScenes: ['suburbs-4'] });
    expect(G.shopEarnings(g, 'suburbs') / G.shopEarnings(g0, 'suburbs')).toBeCloseTo(1.01, 9);
    // a shop's perk (granted by the finale at migrate, not by this test's scene list) is separate: this checks only the card
    expect(G.shopEarnings(g, 'downtown')).toBe(G.shopEarnings(g0, 'downtown'));
  });

  it('works offline too (a card is a permanent value)', () => {
    let g = withShop(synced(), 'downtown', { managed: true, heads: G.allHeads(), prep: 30, ovens: 30, counter: 30, footprint: 2 });
    g = tick(g);
    const away = (s: G.GameState) => G.applyOffline({ ...s, lastSavedAt: T0 }, T0 + 3_600_000).earned;
    const without = { ...g, x: { ...g.x, recipes: { ...state(g), owned: [] } } };
    expect(away(g) / away(without)).toBeCloseTo(1.01, 6);
  });
});

describe('a v5.14 save', () => {
  const old = () => {
    let g = built();
    g = withShop(g, 'downtown', { prep: 60, managed: true, heads: G.allHeads() });
    g = withShop(g, 'uptown', { managed: true, heads: G.allHeads() });
    g = { ...g, seenScenes: ['downtown-4', 'uptown-4'] };
    const raw = JSON.parse(JSON.stringify(g));
    delete raw.x;
    return raw;
  };

  it('gets every card whose condition is already met, with one summary and no toast flood', () => {
    const g = G.migrate(old(), T0);
    expect(state(g)).toEqual({ owned: [], fresh: [], synced: false, summary: null });
    const a = tick(g);
    // downtown 1, 2; uptown 2, 3 (downtown's finale is not a card-3 flood: downtown-4 is seen, so downtown 3 too); the others have a GM only if set
    expect(owned(a).sort()).toEqual(['recipe.downtown.1', 'recipe.downtown.2', 'recipe.downtown.3', 'recipe.uptown.2', 'recipe.uptown.3'].sort());
    expect(state(a).summary).toEqual({ cards: 5 });
    expect(state(a).fresh).toEqual([]);
    expect(collectionView(a).owned).toBe(5);
    expect(state(ackRecipes(a)).summary).toBeNull();
    expect(tick(a).x).toBe(a.x);
  });

  it('applies the multiplier from the first tick', () => {
    const a = tick(G.migrate(old(), T0));
    expect(G.featureMults(a, 'downtown', T0).value).toBeCloseTo(1.01 ** 3, 12);
  });

  it('migrate tolerates junk and unknown ids', () => {
    expect(recipes.migrate('x', T0).owned).toEqual([]);
    expect(recipes.migrate({ owned: ['recipe.uptown.1', 'recipe.mars.1', 5], synced: true }, T0)).toMatchObject({ owned: ['recipe.uptown.1'], synced: true });
  });

  it('survives a save and load', () => {
    const a = tick(withShop(synced(), 'suburbs', { prep: 50 }));
    const back = G.migrate(JSON.parse(JSON.stringify(a)), T0);
    expect(state(back).owned).toEqual(['recipe.suburbs.1']);
    expect(tick(back).x.recipes).toBe(back.x.recipes);
  });
});
