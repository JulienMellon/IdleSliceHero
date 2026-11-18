/**
 * @jest-environment <rootDir>/src/engine/__tests__/tz-env.js
 */
// The franchise (v5.18, card E3): what it keeps and what it resets (every GameState field and every feature slice is in exactly one list),
// what the confirm sheet shows against what it gives, the Stars formula, the multiplier, the migration, and the counter-attack and the
// mastery stars after it.
import { CITIES, hoodIds } from '../../../content/cities';
import { BOSTON_CITY } from '../../../content/cities/boston';
import { HOME_CITY } from '../../../content/cities/home';
import { recipeId } from '../../../content/endgame';
import { CITY_ORDER, FRANCHISE, priceScale, starDivisor } from '../../../content/franchise';
import { FEATURES, getFeature } from '../index';
import * as G from '../../game';
import { counterattack, weekNumber } from '../counterattack';
import {
  canFranchise,
  franchise,
  franchiseCount,
  franchiseFeature,
  franchiseGain,
  KEPT_FEATURES,
  KEPT_FIELDS,
  multiplierNow,
  multiplierOf,
  nextCity,
  RESET_FEATURES,
  RESET_FIELDS,
  SET_FIELDS,
  starsFor,
  starsOf,
} from '../franchise';
import { masteryTotal, mastery } from '../mastery';
import { recipes } from '../recipes';

const at = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();
const WED = at(2026, 11, 11, 12);
const MON = at(2026, 11, 16);
const HOME = hoodIds(HOME_CITY);
const BOSTON = hoodIds(BOSTON_CITY);
const FINALE = G.finaleId(HOME[HOME.length - 1]);
const EARNED = 2.79e15;

/** A cleared home city: every shop built and running, the finale seen, an attack open, a night oven, a fleet, diamonds and cosmetics. */
function cleared(): G.GameState {
  let g = G.newGame(WED);
  for (const id of HOME)
    g = {
      ...g,
      shops: {
        ...g.shops,
        [id]: {
          ...g.shops[id],
          built: true,
          managed: true,
          heads: G.allHeads(),
          prep: 30,
          ovens: 30,
          counter: 30,
          tables: 30,
          drivers: 5,
          grade: 2,
          footprint: 1,
          sold: 1000,
          perk: true,
        },
      },
    };
  g = {
    ...g,
    cash: 5e9,
    totalEarned: EARNED,
    vehicle: 3,
    dronesUnlocked: true,
    cityComplete: true,
    nightOven: 2,
    seenScenes: ['downtown-1', 'downtown-4', FINALE],
    scrapbookViewed: 2,
    playSeconds: 5000,
    sceneAt: { 'downtown-1': 10 },
    tutorial: G.TUTORIAL_DONE,
    stats: { ...g.stats, upgrades: 99, baked: 1234 },
    rewards: { ...g.rewards, diamonds: 321, cosmetics: ['storefront-skin-1'], worn: ['storefront-skin-1'] },
    order: { ...g.order, made: 4, offer: { hood: 'suburbs', target: 50, left: 30, variant: 0 } },
  };
  // settle the features (mastery stars, recipe cards), then let the attack arm and open
  return G.playTick(G.playTick(G.playTick(g, 1, WED), 1, MON), 1, MON);
}

const after = (g = cleared()) => franchise(g, MON + 1000);

describe('what a franchise is offered on', () => {
  it('needs the last finale seen', () => {
    const g = cleared();
    expect(canFranchise(g)).toBe(true);
    expect(canFranchise({ ...g, seenScenes: g.seenScenes.filter((s) => s !== FINALE) })).toBe(false);
  });
  it('goes to the next city in the order, and nowhere from a city with no pack after it', () => {
    expect(nextCity({ city: 'home' })).toBe('boston');
    expect(CITIES.boston).toBeDefined();
    expect(nextCity({ city: 'boston' })).toBe(Object.prototype.hasOwnProperty.call(CITIES, 'chicago') ? 'chicago' : null);
  });
  it('does nothing (the same game back) when it is not on offer', () => {
    const g = G.newGame(WED);
    expect(franchise(g, WED)).toBe(g);
  });
});

describe('what a franchise keeps and resets', () => {
  it('puts every GameState field in exactly one list', () => {
    const all = [...KEPT_FIELDS, ...RESET_FIELDS, ...SET_FIELDS];
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(Object.keys(G.newGame(0)).sort());
  });
  it('puts every feature slice in exactly one list', () => {
    const all = [...KEPT_FEATURES, ...RESET_FEATURES];
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(FEATURES.map((f) => f.key).sort());
  });

  it('keeps the diamonds, the owned and worn cosmetics and the rewards', () => {
    const g = cleared();
    const n = after(g);
    expect(n.rewards).toEqual(g.rewards);
    expect(n.rewards.diamonds).toBe(g.rewards.diamonds);
    expect(g.rewards.diamonds).toBeGreaterThanOrEqual(321);
    expect(n.rewards.worn).toContain('storefront-skin-1');
  });
  it('keeps the Scrapbook and the story clock', () => {
    const g = cleared();
    const n = after(g);
    expect([n.seenScenes, n.scrapbookViewed, n.sceneAt, n.playSeconds]).toEqual([g.seenScenes, g.scrapbookViewed, g.sceneAt, g.playSeconds]);
  });
  it('keeps the lifetime stats and the economy it was made under', () => {
    const g = cleared();
    const n = after(g);
    expect([n.stats, n.totalEarned, n.economy, n.tutorial, n.bonus]).toEqual([g.stats, g.totalEarned, g.economy, g.tutorial, g.bonus]);
  });
  it('keeps the recipe cards and the mastery stars already earned', () => {
    const g = cleared();
    const n = after(g);
    expect(getFeature(g, recipes).owned.length).toBeGreaterThan(0);
    expect(getFeature(n, recipes)).toBe(getFeature(g, recipes));
    expect(getFeature(n, mastery)).toBe(getFeature(g, mastery));
    expect(getFeature(n, mastery).announced.length).toBeGreaterThan(0);
    // as a count too
    expect(masteryTotal(g)).toBeGreaterThan(0);
    expect(getFeature(n, franchiseFeature).masteryBanked).toBe(masteryTotal(g));
  });

  it('resets cash, the shops and their levels', () => {
    const n = after();
    expect(n.cash).toBe(0);
    expect(n.city).toBe('boston');
    expect(n.shops).toEqual(G.newGame(MON, 'boston').shops);
    expect(Object.keys(n.shops)).toEqual([...BOSTON]);
    expect(n.active).toBe(BOSTON[0]);
  });
  it('resets the fleet and the city flags', () => {
    const n = after();
    expect([n.vehicle, n.dronesUnlocked, n.cityComplete]).toEqual([0, false, false]);
  });
  it('resets the night oven and the open orders', () => {
    const g = cleared();
    expect(g.order.offer).not.toBeNull();
    const n = after(g);
    expect(n.nightOven).toBe(0);
    expect([n.order.offer, n.order.active, n.order.result, n.order.made]).toEqual([null, null, null, 0]);
    expect(n.order.nextAt).toBeGreaterThan(n.playSeconds);
  });
  it('resets the weekly counter-attack and every layer', () => {
    const g = cleared();
    expect(getFeature(g, counterattack).open).toBe(true);
    const n = after(g);
    const base = G.newGame(MON + 1000, 'boston');
    for (const key of RESET_FEATURES) expect(n.x[key]).toEqual(base.x[key]);
  });
});

describe('what the confirm sheet shows is what it gives', () => {
  it('franchiseGain equals what franchise gives', () => {
    const g = cleared();
    const gain = franchiseGain(g);
    const n = after(g);
    expect(gain.next).toBe(n.city);
    expect(gain.stars).toBeGreaterThan(0);
    expect(starsOf(n)).toBe(starsOf(g) + gain.stars);
    expect(starsOf(n)).toBe(gain.totalStars);
    expect(multiplierNow(g)).toBe(gain.multiplierBefore);
    expect(multiplierNow(n)).toBe(gain.multiplierAfter);
    expect(franchiseCount(n)).toBe(1);
  });
  it('a clean first clear pays about 10 Stars: 2.0x', () => {
    expect(franchiseGain(cleared()).stars).toBe(FRANCHISE.starsPerClear);
    expect(franchiseGain(cleared()).multiplierAfter).toBe(2);
  });
});

describe('the Stars formula', () => {
  it('is floor(sqrt(earnings / K)): 0 for a tiny run, known values at fixed earnings', () => {
    expect(starsFor(0, 0)).toBe(0);
    expect(starsFor(1e6, 0)).toBe(0);
    expect(starsFor(NaN, 0)).toBe(0);
    expect(starsFor(-5, 0)).toBe(0);
    const k = starDivisor(0);
    expect(starsFor(k * 100, 0)).toBe(10);
    expect(starsFor(k * 100 * 0.999, 0)).toBe(9);
    expect(starsFor(k * 2500, 0)).toBe(50);
  });
  it('a later city divides by more, in step with its prices', () => {
    expect(starDivisor(1)).toBeCloseTo(starDivisor(0) * priceScale(1), -3);
    expect(starsFor(starDivisor(1) * 100, 1)).toBe(10);
    expect(starsFor(starDivisor(1) * 100, 0)).toBeGreaterThan(10);
  });
  it('the multiplier is 1 + 10% a Star, summed', () => {
    expect([0, 3, 10, 25, 50, 100].map(multiplierOf)).toEqual([1, 1.3, 2, 3.5, 6, 11]);
    expect(CITY_ORDER[1]).toBe('boston');
  });
});

describe('the multiplier', () => {
  it('scales the value per pizza and nothing else', () => {
    const n = after();
    const id = BOSTON[0];
    const plain = { ...n, x: { ...n.x, franchise: { count: 0, stars: 0, cityStart: 0, masteryBanked: 0 } } };
    const e1 = G.shopEarnings(plain, id, MON);
    const e2 = G.shopEarnings(n, id, MON);
    expect(starsOf(n)).toBe(10);
    expect(e2).toBeCloseTo(e1 * 2, 6);
    // the kitchen's rate (pizzas per second) is the same
    const shop = n.shops[id];
    expect(G.shopRate(shop, n.vehicle, G.featureMults(n, id, MON))).toBe(G.shopRate(shop, plain.vehicle, G.featureMults(plain, id, MON)));
  });
  it('is 1 in a game that has never franchised', () => {
    expect(multiplierNow(G.newGame(WED))).toBe(1);
  });
});

describe('a save from before the franchise', () => {
  it('loads as the home city with no franchises', () => {
    const old = JSON.parse(JSON.stringify(G.newGame(WED)));
    delete old.x.franchise;
    const g = G.migrate(old, WED);
    expect(g.city).toBe('home');
    expect(getFeature(g, franchiseFeature)).toEqual({ count: 0, stars: 0, cityStart: 0, masteryBanked: 0 });
    expect(multiplierNow(g)).toBe(1);
  });
  it('a franchised save loads as it was saved, and garbage loads as none', () => {
    const n = after();
    const back = G.migrate(JSON.parse(JSON.stringify(n)), MON);
    expect(back.city).toBe('boston');
    expect(getFeature(back, franchiseFeature)).toEqual(getFeature(n, franchiseFeature));
    expect(franchiseFeature.migrate({ stars: -4, count: 'x', cityStart: NaN }, 0)).toEqual({ count: 0, stars: 0, cityStart: 0, masteryBanked: 0 });
  });
});

describe('the counter-attack and the mastery stars in the new city', () => {
  const tick = (g: G.GameState, now: number) => G.playTick(g, 1, now);
  it('the weekly attack waits for the new city’s finale, then targets the new city’s shops only', () => {
    let n = after();
    const built = BOSTON.slice(0, 3);
    for (const id of built)
      n = {
        ...n,
        shops: { ...n.shops, [id]: { ...n.shops[id], built: true, managed: true, heads: G.allHeads(), prep: 10, ovens: 10, counter: 10, tables: 10 } },
      };
    const week = 7 * 86_400_000;
    // the home finale is still in the Scrapbook, but it is not this city's
    expect(getFeature(tick(tick(n, MON + week), MON + 2 * week), counterattack).open).toBe(false);
    n = { ...n, seenScenes: [...n.seenScenes, G.finaleId(BOSTON[BOSTON.length - 1])] };
    n = tick(n, MON + 2 * week);
    n = tick(n, MON + 3 * week);
    const st = getFeature(n, counterattack);
    expect(weekNumber(MON + 3 * week)).toBeGreaterThan(st.armedWeek - 1);
    expect(st.open).toBe(true);
    expect(built).toContain(st.target);
  });
  it('stars already earned stay paid, and the new city’s shops earn their own', () => {
    const g = cleared();
    const n0 = after(g);
    const diamonds = n0.rewards.diamonds;
    const id = BOSTON[0];
    let n = { ...n0, shops: { ...n0.shops, [id]: { ...n0.shops[id], built: true, heads: G.allHeads() } } };
    n = tick(n, MON + 2000);
    // exactly one new star (the first shop's heads), 10 diamonds: the home stars are not paid twice
    expect(n.rewards.diamonds).toBe(diamonds + 10);
    expect(getFeature(n, mastery).announced).toEqual(expect.arrayContaining([...getFeature(g, mastery).announced, `${id}:heads`]));
    expect(masteryTotal(n)).toBe(1);
  });
});

describe('a second franchise', () => {
  it('adds its Stars to the first’s and counts the second city’s earnings from where it began', () => {
    const had = Object.prototype.hasOwnProperty.call(CITIES, 'chicago');
    if (!had) CITIES.chicago = { ...BOSTON_CITY, id: 'chicago' };
    try {
      const first = after();
      const stars1 = starsOf(first);
      const bost = {
        ...first,
        totalEarned: first.totalEarned + starDivisor(1) * 400,
        seenScenes: [...first.seenScenes, G.finaleId(BOSTON[BOSTON.length - 1])],
      };
      const gain = franchiseGain(bost);
      expect(gain.stars).toBe(20);
      const second = franchise(bost, MON + 5000);
      expect(second.city).toBe('chicago');
      expect(starsOf(second)).toBe(stars1 + 20);
      expect(franchiseCount(second)).toBe(2);
      expect(franchiseGain(second).earned).toBe(0);
    } finally {
      if (!had) delete CITIES.chicago;
    }
  });
});

describe('a Boston save keeps its own shops’ slices across a reload', () => {
  const id = BOSTON[3];
  const saved = (city: string): G.GameState => {
    const n = after();
    const g = {
      ...n,
      city,
      x: {
        ...n.x,
        counterattack: { ...getFeature(n, counterattack), armedWeek: 5, seenWeek: 5, target: id, open: true },
        recipes: { ...getFeature(n, recipes), owned: [recipeId(id, 1)] },
        heads: { week: 3, pick: { shopId: id, station: 'prep' } },
        rival: { won: [id], challenge: null, retryAt: { [id]: 77 } },
      },
    };
    return G.migrate(JSON.parse(JSON.stringify(g)), MON);
  };
  it('the attack target, recipe cards, Head of the Week and won rivals survive', () => {
    const g = saved('boston');
    expect(getFeature(g, counterattack)).toMatchObject({ target: id, open: true });
    expect(getFeature(g, recipes).owned).toContain(recipeId(id, 1));
    expect((g.x.heads as { pick: unknown }).pick).toEqual({ shopId: id, station: 'prep' });
    expect(g.x.rival).toMatchObject({ won: [id], retryAt: { [id]: 77 } });
  });
  it('a home save still drops a name that is not one of its own shops', () => {
    const g = saved('home');
    expect(getFeature(g, counterattack).target).toBeNull();
    expect(getFeature(g, recipes).owned).toEqual([]);
    expect((g.x.heads as { pick: unknown }).pick).toBeNull();
    expect((g.x.rival as { won: unknown[] }).won).toEqual([]);
  });
});

describe('Boston reads its own tables (A35, C141, T108)', () => {
  it('the founder countdown names Father Dom in Boston and Nonna at home', () => {
    const b = after();
    expect(b.city).toBe('boston');
    expect(G.founderCountdownText(b)).toMatch(/^Father Dom takes over/);
    expect(G.founderCountdownText(G.newGame(WED))).toMatch(/^Nonna takes over/);
  });
  it('def, perkOf and the price helpers find a Boston neighbourhood without a city argument', () => {
    for (const n of BOSTON_CITY.neighbourhoods) {
      expect(G.def(n.id)).toBe(n);
      expect(G.headCost(n.id, 'prep')).toBe(G.headCost(n.id, 'prep', BOSTON_CITY));
      expect(G.buildAllIn(n.id)).toBe(G.buildAllIn(n.id, BOSTON_CITY));
      expect(G.stationCost(n.id, 'prep', 3)).toBe(G.stationCost(n.id, 'prep', 3, BOSTON_CITY));
    }
    const shop = { ...G.newGame(WED).shops[HOME[0]], perk: true };
    expect(G.perkOf(BOSTON[1], shop)).toBe(BOSTON_CITY.perks[BOSTON[1]]);
    expect(G.def(HOME[1])).toBe(HOME_CITY.neighbourhoods[1]);
  });
});
