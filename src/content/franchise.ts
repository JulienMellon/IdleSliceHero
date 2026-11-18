// The franchise's numbers (v5.18, card E3; the design is docs/specs/PRESTIGE.md). Nothing here is logic but the scaling rule, so a retune
// is one file: the engine (engine/features/franchise.ts) and the pacing fit (scripts/pacing-fit.ts) read these and own no number.
//
// The rule in one line: city n's prices are the home city's x priceScale(n) and its pizza values x valueScale(n). The Franchise Stars
// (multiplier M, +10% each) make up the difference between the two, so a player who enters city n with the stars a clean clear of each
// city before it pays (STARS_PER_CLEAR) finds the same economy as the home city: the same days to the same milestones.
import type { HeadKind } from './tuning';
import { HEAD_COST_DOWNTOWN, VEHICLES } from './cities/home/fit';
import { NEIGHBORHOODS, PIER9_BID } from './cities/home/data';

/** The cities in play order (spec: after the home city, Boston, Chicago, New York, Los Angeles). A city is a folder under cities/; one that has no folder yet cannot be franchised to. */
export const CITY_ORDER = ['home', 'boston', 'chicago', 'newyork', 'la'] as const;
export type CityId = (typeof CITY_ORDER)[number];

export const FRANCHISE = {
  /** Each Franchise Star adds this share of base earnings, summed not compounded (spec: "multiplier = 1 + 0.10 x total Stars"). */
  starPercent: 0.1,
  /**
   * Spec default: a clean clear of a city pays about this many Stars. The divisor below is fitted to it
   * (`npx tsx scripts/pacing-fit.ts franchise`: the check-in player's earnings at the home finale, 2.79e15 on day 5.1, over STARS_PER_CLEAR squared, rounded down: 10 Stars).
   */
  starsPerClear: 10,
  /** K of the spec's Stars = floor(sqrt(city earnings / K)) for the home city. Later cities' K is this x priceScale (their earnings are that much bigger). */
  homeDivisor: 2.7e13,
  /** Spec: "each new city has bigger numbers". Default where the spec names no factor: every city's pizza values are this many times the one before's. */
  cityGrowth: 1000,
} as const;

/** A city's place in the order (an id this build has no place for counts as the home city, like `cityOf`). */
export const cityIndex = (id: string | undefined): number => Math.max(0, CITY_ORDER.indexOf((id ?? 'home') as CityId));

/** The multiplier a player is expected to carry into city `index`: the stars of a clean clear of each city before it. */
export const expectedMult = (index: number): number => 1 + FRANCHISE.starPercent * FRANCHISE.starsPerClear * index;

/** What city `index`'s pizza values are, against the home city's. */
export const valueScale = (index: number): number => Math.pow(FRANCHISE.cityGrowth, index);

/** What city `index`'s prices are, against the home city's: bigger by the growth and by the multiplier the player brings. */
export const priceScale = (index: number): number => valueScale(index) * expectedMult(index);

/** The K of a city: its earnings are `priceScale` times the home city's, so is its divisor. */
export const starDivisor = (index: number): number => FRANCHISE.homeDivisor * priceScale(index);

/** Three significant figures, so a fitted number reads as a price ("$2.7M") and not as a product. */
const round3 = (x: number): number => (x === 0 || !Number.isFinite(x) ? x : Number(x.toPrecision(3)));

/**
 * The numbers a city pack (cities/<id>/, card T2 for Boston) takes from the fit: its neighbourhoods' prices and values, the fleet's
 * prices and the first neighbourhood's heads, in the home city's order. Oven grades, footprints and decor are priced
 * as a multiple of the shop's cost multiplier, so they scale by themselves and are not here.
 */
export interface CityNumbers {
  hoods: { orderValue: number; buildCost: number; costMult: number; managerCost: number; headsCost: number }[];
  /** Prices of fleet tiers 1.. (the first, the bike, is free). */
  vehicleCosts: number[];
  headCostFirst: Record<HeadKind, number>;
  /** The city's bid (its finale that is a purchase), in the home city's neighbourhood order position. */
  bid: { cost: number; unlockPizzas: number };
}

/**
 * What the pacing fit moved after the plain scaling (`npx tsx scripts/pacing-fit.ts fitboston`): one factor on every price of a city (builds,
 * managers, heads, cost multipliers, fleet, bid). The scaling keeps the home city's economy but not its rounding (a Lv 1 price of $5.76 is $6
 * at home) or the waits that no price moves (the story's interludes), so the check-in player's beats drift by a fraction of a day; this puts
 * them back. Absent = no change. Order values are not moved: they are the city's "bigger numbers", and the Stars carry the rest.
 */
export const PRICE_FIT: Partial<Record<number, number>> = { 1: 1.09 };

/** City `index`'s numbers: the home city's, scaled, then moved by the fit (`adjust` false: the plain scaling, what the fit starts from). */
export function cityNumbers(index: number, adjust = true): CityNumbers {
  const p = priceScale(index) * (adjust ? (PRICE_FIT[index] ?? 1) : 1);
  const v = valueScale(index);
  const heads = Object.fromEntries((Object.keys(HEAD_COST_DOWNTOWN) as HeadKind[]).map((k) => [k, round3(HEAD_COST_DOWNTOWN[k] * p)])) as Record<
    HeadKind,
    number
  >;
  return {
    hoods: NEIGHBORHOODS.map((n) => ({
      orderValue: round3(n.orderValue * v),
      buildCost: round3(n.buildCost * p),
      costMult: round3(n.costMult * p),
      managerCost: round3(n.managerCost * p),
      headsCost: round3(n.headsCost * p),
    })),
    vehicleCosts: VEHICLES.slice(1).map((vh) => round3(vh.cost * p)),
    headCostFirst: heads,
    bid: { cost: round3(PIER9_BID.cost * p), unlockPizzas: PIER9_BID.unlockPizzas },
  };
}
