// The franchise (v5.18, card E3; docs/specs/PRESTIGE.md): once a city's last finale has been seen the player may sell it for Franchise Stars
// and start the next city. Each Star adds 10% of base earnings for good (summed: multiplier = 1 + 0.1 x Stars), in every later city, as one
// number on the value per pizza. Stars = floor(sqrt(the city's earnings / K)); K grows with the city (content/franchise.ts `starDivisor`).
//
// `franchise(g, now)` is one pure function and it is not undoable. What it keeps and what it resets are the two lists below, and the test
// pins them against GameState and the feature registry: a field added later fails it until someone puts it in a list.
import { CITIES } from '../../content/cities';
import { CITY_ORDER, FRANCHISE, cityIndex, starDivisor } from '../../content/franchise';
import { ORDER } from '../../content/hooks';
import { newGame, newOrders, SAVE_VERSION, type GameState } from '../game';
import { finaleSeen } from './counterattack';
import { masteryTotal } from './mastery';
import { FEATURES } from './registry';
import type { Feature } from './types';

export const KEY = 'franchise';

export interface FranchiseState {
  /** Franchises made: 0 is a game still in the home city. */
  count: number;
  /** Franchise Stars in all. Never spent, only counted. */
  stars: number;
  /** `totalEarned` when the current city began: the city's earnings are what has been earned since. */
  cityStart: number;
  /** Mastery stars earned in the cities left behind, as a count (the stars themselves stay paid in the mastery slice). */
  masteryBanked: number;
}

const fresh = (): FranchiseState => ({ count: 0, stars: 0, cityStart: 0, masteryBanked: 0 });
const read = (g: GameState): FranchiseState => (g.x?.[KEY] as FranchiseState | undefined) ?? fresh();

/** The multiplier of a number of Stars: 1 + 10% each (rounded to nine places so 3 Stars read 1.3 and not 1.3000000000000003). */
export const multiplierOf = (stars: number): number => Math.round((1 + stars * FRANCHISE.starPercent) * 1e9) / 1e9;

/** Franchise Stars the player holds. */
export const starsOf = (g: GameState): number => read(g).stars;

/** The multiplier on every pizza's value now (1 before the first franchise). */
export const multiplierNow = (g: GameState): number => multiplierOf(read(g).stars);

/** Franchises made so far. */
export const franchiseCount = (g: GameState): number => read(g).count;

/** Cash the current city has earned (what the Stars are paid on). */
export const cityEarned = (g: GameState): number => Math.max(0, g.totalEarned - read(g).cityStart);

/** The Stars `earned` cash pays in the city at `index` in CITY_ORDER. */
export function starsFor(earned: number, index: number): number {
  const k = starDivisor(index);
  if (!(earned > 0) || !Number.isFinite(earned) || !(k > 0)) return 0;
  return Math.floor(Math.sqrt(earned / k));
}

/** The city a franchise goes to: the next in the order that this build has a pack for, or null. */
export function nextCity(g: Pick<GameState, 'city'>): string | null {
  const next = CITY_ORDER[cityIndex(g.city) + 1];
  return next !== undefined && Object.prototype.hasOwnProperty.call(CITIES, next) ? next : null;
}

/** A franchise is on offer: the current city's last finale has been seen and there is a city to go to. */
export const canFranchise = (g: GameState): boolean => finaleSeen(g) && nextCity(g) !== null;

export interface FranchiseGain {
  /** The city the franchise starts (null: none this build has). */
  next: string | null;
  /** The city's earnings the Stars are paid on. */
  earned: number;
  /** Stars this franchise pays, and what the player would hold. */
  stars: number;
  totalStars: number;
  /** The multiplier now, and after. */
  multiplierBefore: number;
  multiplierAfter: number;
}

/** What the player would get, for the confirm sheet: `franchise` gives exactly this (the test pins it). */
export function franchiseGain(g: GameState): FranchiseGain {
  const st = read(g);
  const earned = cityEarned(g);
  const stars = starsFor(earned, cityIndex(g.city));
  return { next: nextCity(g), earned, stars, totalStars: st.stars + stars, multiplierBefore: multiplierOf(st.stars), multiplierAfter: multiplierOf(st.stars + stars) };
}

// ---------- the reset ----------

/** GameState fields a franchise keeps as they are: what the player earned or paid for, and the lifetime counters. */
export const KEPT_FIELDS = [
  'economy', // the rules this save was made under
  'totalEarned', // lifetime (the city's own earnings are totalEarned - franchise.cityStart)
  'seenScenes', // the Scrapbook
  'scrapbookViewed',
  'playSeconds', // paces the story
  'sceneAt',
  'tutorial', // Boston opens tutorial-free
  'rewards', // diamonds, owned and worn cosmetics, boosters, tasks, the gift calendar
  'stats', // lifetime stats
  'bonus', // the golden pizza's schedule runs on
] as const;

/** GameState fields a franchise starts over (the new city's own values). */
export const RESET_FIELDS = [
  'cash',
  'vehicle', // the fleet
  'shops', // shops and their upgrade levels
  'active',
  'dronesUnlocked',
  'cityComplete',
  'order', // open orders
  'nightOven', // the night-oven tier
] as const;

/** GameState fields a franchise sets itself: the version, the new city, the save time, and the feature slices (the lists below). */
export const SET_FIELDS = ['saveVersion', 'city', 'lastSavedAt', 'x'] as const;

/** Feature slices (GameState.x keys) a franchise keeps: mastery stars already paid, recipe cards owned, and the franchise's own. */
export const KEPT_FEATURES = ['mastery', 'recipes', KEY] as const;

/** Feature slices a franchise starts over: the weekly counter-attack, the shops' service, the heads' pick, a running event, every layer. */
export const RESET_FEATURES = ['counterattack', 'events', 'heads', 'service', 'suburbsGameDay', 'waterfrontBoats', 'rival', 'universityMenu', 'industrialShifts', 'uptownStars'] as const;

/**
 * Sell the current city and start the next, for the Stars its earnings pay. Cash, shops, upgrade levels, the fleet, layer state, the night
 * oven, open orders and the weekly attack start over in the new city; diamonds, cosmetics, recipe cards, mastery stars already earned, the
 * Scrapbook, purchases and the lifetime stats stay. `g` itself when a franchise is not on offer. Not undoable: the sheet confirms twice.
 */
export function franchise(g: GameState, now: number): GameState {
  const to = nextCity(g);
  if (to === null || !canFranchise(g)) return g;
  const gain = franchiseGain(g);
  const st = read(g);
  const base = newGame(now, to);
  const x: Record<string, unknown> = { ...base.x };
  for (const [key, value] of Object.entries(g.x)) {
    if ((KEPT_FEATURES as readonly string[]).includes(key)) x[key] = value;
    // a slice this build has no feature for (see `migrate`) is not ours to delete
    else if (!FEATURES.some((f) => f.key === key)) x[key] = value;
  }
  const next: FranchiseState = { count: st.count + 1, stars: gain.totalStars, cityStart: g.totalEarned, masteryBanked: st.masteryBanked + masteryTotal(g) };
  x[KEY] = next;
  return {
    ...base,
    economy: g.economy,
    totalEarned: g.totalEarned,
    seenScenes: g.seenScenes,
    scrapbookViewed: g.scrapbookViewed,
    playSeconds: g.playSeconds,
    sceneAt: g.sceneAt,
    tutorial: g.tutorial,
    rewards: g.rewards,
    stats: g.stats,
    bonus: g.bonus,
    // the first order of the new city comes a first-offer wait after now, in the play clock that was kept
    order: { ...newOrders(now), nextAt: g.playSeconds + ORDER.firstOfferAtPlay },
    saveVersion: SAVE_VERSION,
    x,
  };
}

export const franchiseFeature: Feature<FranchiseState> = {
  key: KEY,
  init: () => fresh(),
  // a save from before the franchise is a game in the home city with no franchises
  migrate(raw) {
    if (!raw || typeof raw !== 'object') return fresh();
    const r = raw as Record<string, unknown>;
    const nat = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
    return { count: nat(r.count), stars: nat(r.stars), cityStart: typeof r.cityStart === 'number' && Number.isFinite(r.cityStart) ? Math.max(0, r.cityStart) : 0, masteryBanked: nat(r.masteryBanked) };
  },
  /** The one place the multiplier reaches a pizza's value. */
  shopValueMult: (g) => multiplierNow(g),
  shopKey: (g) => (read(g).stars > 0 ? `fr${read(g).stars}` : ''),
};
