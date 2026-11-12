// Shop mastery (v5.15): star rules, one-time pay, the milestone cosmetics and the catch-up on a v5.14 save.
import { MASTERY } from '../../content/endgame';
import { WEEKLY_COSMETICS } from '../../content/rewards';
import { FOOTPRINTS, NEIGHBORHOODS, OVEN_GRADES } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { getFeature } from '../features';
import { ackMastery, mastery, masteryStars, masteryTotal, nextStar, shopStars } from '../features/mastery';
import * as G from '../game';

const T0 = 1_700_000_000_000;
const IDS = NEIGHBORHOODS.map((n) => n.id);
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } } });
const allBuilt = (): G.GameState => IDS.reduce((g, id) => withShop(g, id, { built: true }), G.newGame(T0));
const topFootprint = FOOTPRINTS.length - 1;
const topGrade = OVEN_GRADES.length - 1;
/** Give `n` shops (city order) all three stars. */
const mastered = (g: G.GameState, n: number): G.GameState => IDS.slice(0, n).reduce((s, id) => withShop(s, id, { heads: G.allHeads(), footprint: topFootprint, grade: topGrade }), g);
const tick = (g: G.GameState) => G.playTick(g, 1, T0);
const state = (g: G.GameState) => getFeature(g, mastery);

describe('star rules', () => {
  it('a star each for three heads, the top footprint and the top oven grade', () => {
    const shop = G.newShop(true);
    expect(masteryStars(shop)).toEqual({ heads: false, flagship: false, golden: false });
    expect(masteryStars({ ...shop, heads: { ...G.allHeads(), counter: false } }).heads).toBe(false);
    expect(masteryStars({ ...shop, heads: G.allHeads() }).heads).toBe(true);
    expect(masteryStars({ ...shop, footprint: topFootprint - 1 }).flagship).toBe(false);
    expect(masteryStars({ ...shop, footprint: topFootprint }).flagship).toBe(true);
    expect(masteryStars({ ...shop, grade: topGrade - 1 }).golden).toBe(false);
    expect(masteryStars({ ...shop, grade: topGrade }).golden).toBe(true);
    expect(shopStars({ ...shop, heads: G.allHeads(), footprint: topFootprint, grade: topGrade })).toBe(3);
  });

  it('the city total runs 0..18', () => {
    expect(masteryTotal(allBuilt())).toBe(0);
    expect(masteryTotal(mastered(allBuilt(), 1))).toBe(3);
    expect(masteryTotal(mastered(allBuilt(), 6))).toBe(18);
  });

  it('nextStar is the star closest to done, with the inputs for its progress line', () => {
    expect(nextStar(G.newGame(T0))).toMatchObject({ shopId: 'downtown', star: 'heads', have: 0, need: 3 });
    const g = withShop(withShop(G.newGame(T0), 'downtown', { heads: { prep: true, oven: true, counter: false } }), 'downtown', { grade: topGrade });
    expect(nextStar(g)).toMatchObject({ shopId: 'downtown', star: 'heads', have: 2, need: 3 });
    expect(nextStar(mastered(allBuilt(), 6))).toBeNull();
  });
});

describe('one-time pay', () => {
  it('each new star pays 10 diamonds and shows once, never again', () => {
    let g = tick(allBuilt()); // the first tick is the silent catch-up
    expect(state(g).synced).toBe(true);
    g = withShop(g, 'suburbs', { heads: G.allHeads() });
    const a = tick(g);
    expect(a.rewards.diamonds).toBe(MASTERY.starDiamonds);
    expect(state(a).fresh).toEqual([{ kind: 'star', shopId: 'suburbs', star: 'heads' }]);
    expect(state(a).announced).toEqual(['suburbs:heads']);
    // nothing owed: the same object comes back, and the diamonds stay
    expect(tick(a).x).toBe(a.x);
    const b = tick(withShop(a, 'downtown', { footprint: topFootprint }));
    expect(b.rewards.diamonds).toBe(2 * MASTERY.starDiamonds);
    // a star lost and earned again does not pay twice
    const c = tick(withShop(withShop(b, 'suburbs', { heads: G.noHeads() }), 'suburbs', { heads: G.allHeads() }));
    expect(c.rewards.diamonds).toBe(2 * MASTERY.starDiamonds);
  });

  it('ackMastery clears the news and keeps what was paid', () => {
    const a = tick(withShop(tick(allBuilt()), 'suburbs', { grade: topGrade }));
    expect(state(a).fresh).toHaveLength(1);
    const b = ackMastery(a);
    expect(state(b).fresh).toEqual([]);
    expect(b.rewards.diamonds).toBe(a.rewards.diamonds);
    expect(ackMastery(b)).toBe(b);
  });

  it('survives a save and load', () => {
    const a = tick(withShop(tick(allBuilt()), 'suburbs', { grade: topGrade }));
    const back = G.migrate(JSON.parse(JSON.stringify(a)), T0);
    expect(state(back).announced).toEqual(['suburbs:golden']);
    expect(tick(back).rewards.diamonds).toBe(a.rewards.diamonds);
  });
});

describe('milestone cosmetics', () => {
  it('6 and 12 stars give the next weekly cosmetic not owned, 18 gives the plaque; each is worn and given once', () => {
    let g = tick(allBuilt());
    g = tick(mastered(g, 2));
    expect(g.rewards.cosmetics).toEqual([WEEKLY_COSMETICS[0]]);
    expect(g.rewards.worn).toEqual([WEEKLY_COSMETICS[0]]);
    expect(state(g).fresh.filter((n) => n.kind === 'cosmetic')).toEqual([{ kind: 'cosmetic', id: WEEKLY_COSMETICS[0] }]);
    g = tick(mastered(g, 4));
    expect(g.rewards.cosmetics).toEqual([WEEKLY_COSMETICS[0], WEEKLY_COSMETICS[1]]);
    g = tick(mastered(g, 6));
    expect(g.rewards.cosmetics).toEqual([WEEKLY_COSMETICS[0], WEEKLY_COSMETICS[1], MASTERY.masterCosmetic]);
    expect(g.rewards.diamonds).toBe(18 * MASTERY.starDiamonds);
    expect(tick(g).x).toBe(g.x);
  });

  it('skips a weekly cosmetic the player already owns', () => {
    let g = tick(allBuilt());
    g = { ...g, rewards: { ...g.rewards, cosmetics: [WEEKLY_COSMETICS[0]], worn: [WEEKLY_COSMETICS[0]] } };
    g = tick(mastered(g, 2));
    expect(g.rewards.cosmetics).toEqual([WEEKLY_COSMETICS[0], WEEKLY_COSMETICS[1]]);
  });
});

describe('a v5.14 save', () => {
  const v514 = (shops: number) => {
    const g = mastered(allBuilt(), shops);
    const raw = JSON.parse(JSON.stringify(g));
    delete raw.x; // v5.14 had no feature slices
    return raw;
  };

  it('has no stars paid yet after migrate, and the first tick grants what it earned silently, in one summary', () => {
    const g = G.migrate(v514(2), T0);
    expect(state(g)).toMatchObject({ synced: false, announced: [], summary: null });
    const a = tick(g);
    expect(a.rewards.diamonds).toBe(6 * MASTERY.starDiamonds);
    expect(state(a).summary).toEqual({ stars: 6, diamonds: 60, cosmetics: [WEEKLY_COSMETICS[0]] });
    expect(state(a).fresh).toEqual([]); // no toast flood
    expect(a.rewards.worn).toEqual([WEEKLY_COSMETICS[0]]);
    expect(tick(a).x).toBe(a.x);
    expect(state(ackMastery(a)).summary).toBeNull();
  });

  it('the offline catch-up on load does the same, once', () => {
    const g = G.migrate(v514(1), T0);
    const r = G.applyOffline({ ...g, lastSavedAt: T0 - 60_000 }, T0).state;
    expect(r.rewards.diamonds).toBe(3 * MASTERY.starDiamonds);
    expect(tick(r).rewards.diamonds).toBe(3 * MASTERY.starDiamonds);
  });

  it('a save with no stars gets no summary', () => {
    const a = tick(G.migrate(v514(0), T0));
    expect(state(a).summary).toBeNull();
    expect(a.rewards.diamonds).toBe(0);
  });

  it('migrate tolerates junk', () => {
    expect(mastery.migrate('junk', T0).announced).toEqual([]);
    expect(mastery.migrate({ announced: [1, 'a:heads'], granted: [6, 7], synced: 'yes' }, T0)).toMatchObject({ announced: ['a:heads'], granted: [6], synced: false });
  });
});
