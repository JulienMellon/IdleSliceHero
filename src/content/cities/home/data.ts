// The home city, Port Marinara: its neighbourhoods, perks, heads and managers, and the Pier 9 bid (card K1: moved out of tuning.ts, which
// re-exports them for the call sites that read the home city directly). The story is in ./scenes/, the fitted tables in ./fit.ts.
import type { HeadKind } from '../../tuning';
import type { CityBid, LayerKind, NeighborhoodDef, PerkDef } from '../types';
import type { HomeNeighborhoodId, NeighborhoodId } from '../../types';
import { HEAD_COST_DOWNTOWN } from './fit';

export const CITY_NAME = 'Port Marinara';

/**
 * v5.13 pacing: a check-in player (5 min every 4 h, offline cap 4 h) finishes the story in about 4.8 days, roughly one
 * neighbourhood a day. Unlock days in `npx tsx scripts/review/sim2.ts checkin`: Waterfront 1.0, University 2.0, Industrial 3.1,
 * Uptown 4.4, finale 4.8. From Waterfront on every pizzeria keeps costMult = orderValue (the original game had about 0.45x; 1.0x is the
 * top of the allowed 0.3x-1.0x band, it makes a level cost what a pizza pays). Build costs are what the day targets fit; they stay far
 * above a Lv 1 station. The engine's what-if gains (upgradeGain, buildGain) test a purchase with 2^53 cash, so no price may pass 9.0e15.
 *
 * v5.16 (card E0, playtest 3): session 1 lasts about 40 minutes (heads at 2, 5 and 8 min, Nonna at 10, Suburbs at 16, its manager at 28,
 * its finale at 40; `npx tsx scripts/pacing-fit.ts session1`), and from Waterfront on a shop's heads come within two check-ins of its
 * build and its manager about a day after, just before the next neighbourhood (`... pacing-fit.ts managers`). So a pizzeria has two prices
 * for its staff: `headsCost` (the three heads together, split by HEAD_SHARE) and `managerCost`, each fitted on its own, not a share of the
 * build. The first shop's numbers were fitted with the rewards in the sim (scripts/review/sim2.ts plays them). Refit with
 * scripts/pacing-fit.ts (never edit one number alone).
 *
 * v5.16 final refit (card E2b), with the six layers, the service tip, the rival (x0.8) and the interludes in: Downtown's heads 400 / 800 / 950,
 * Suburbs' build 270K and manager 4.6M, Waterfront's manager 8B, University's build 8B, Uptown's build 10T and manager 2.6Q, the Golden oven 2B
 * and the Flagship 2.5B (all 18 stars on day 11.7). The finale comes 0.006 days past its band: see STORY_TOLERANCES in scripts/pacing-fit.ts.
 */
export const NEIGHBORHOODS: NeighborhoodDef[] = [
  {
    id: 'downtown',
    name: 'Downtown',
    orderValue: 3,
    buildCost: 0,
    costMult: 1,
    managerCost: 0,
    headsCost: HEAD_COST_DOWNTOWN.prep + HEAD_COST_DOWNTOWN.oven + HEAD_COST_DOWNTOWN.counter,
    x: 22,
    y: 39,
    color: '#F2994A',
    wall: '#F7D9A8',
  },
  {
    id: 'suburbs',
    name: 'Suburbs',
    orderValue: 60,
    buildCost: 270_000,
    costMult: 18,
    managerCost: 4_600_000,
    headsCost: 400_000,
    x: 30,
    y: 67,
    color: '#6FCF97',
    wall: '#DDF2D2',
  },
  {
    id: 'waterfront',
    name: 'Waterfront',
    orderValue: 2_500,
    buildCost: 600_000_000,
    costMult: 2_500,
    managerCost: 8_000_000_000,
    headsCost: 2_000_000_000,
    x: 76,
    y: 67,
    color: '#56CCF2',
    wall: '#D6EEF8',
    plan: 'mirrored',
  },
  {
    id: 'university',
    name: 'University',
    orderValue: 200_000,
    buildCost: 8_000_000_000,
    costMult: 200_000,
    managerCost: 350_000_000_000,
    headsCost: 80_000_000_000,
    x: 18,
    y: 9,
    color: '#BB6BD9',
    wall: '#EADCF5',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    orderValue: 6_000_000,
    buildCost: 1_200_000_000_000,
    costMult: 6_000_000,
    managerCost: 60_000_000_000_000,
    headsCost: 1_200_000_000_000,
    x: 50,
    y: 9,
    color: '#A0826D',
    wall: '#C4BCAE',
    plan: 'mirrored',
  },
  {
    id: 'uptown',
    name: 'Uptown',
    orderValue: 60_000_000,
    buildCost: 10_000_000_000_000,
    costMult: 60_000_000,
    managerCost: 2_600_000_000_000_000,
    headsCost: 80_000_000_000_000,
    x: 82,
    y: 9,
    color: '#EB5757',
    wall: '#F6D6D6',
  },
];

/** Waterfront's finale is a purchase: bid on Pier 9 once "For Sale" has played and Waterfront has sold this many pizzas. ~4.4 min of income at that moment in the pacing sim (v5.13 retune). */
export const PIER9_BID = { cost: 120_000_000, unlockPizzas: 50_000 } as const;

/** The bid as the city schema has it: Waterfront's finale is the Pier 9 purchase, open once "Man Overboard" (waterfront-3b) has played. */
export const HOME_BID: CityBid = {
  hood: 'waterfront',
  name: 'Pier 9',
  cost: PIER9_BID.cost,
  unlockPizzas: PIER9_BID.unlockPizzas,
  afterScene: 'waterfront-3b',
};

export const PERKS: Partial<Record<NeighborhoodId, PerkDef>> = {
  suburbs: { who: 'Coach Dale', text: 'Suburbs walk-ins pay 15% extra', walkInShare: 1.15 },
  waterfront: { who: 'Captain Marisol', text: 'Waterfront pizzas sell for 10% more', priceMult: 1.1 },
  university: { who: 'Priya', text: 'University driver upgrades cost 10% less', driversCostMult: 0.9 },
  industrial: { who: 'Big Sal', text: 'Industrial earns 25% more while you’re away', offlineMult: 1.25 },
  uptown: { who: 'Genevieve', text: 'Each Uptown decor tier adds 6% to prices (was 4%)', decorBoost: 0.06 },
};

/** The heads are supporting characters (docs/story/CAST.md). */
export const HEADS: Record<NeighborhoodId, Record<HeadKind, string>> = {
  downtown: { prep: 'Marco', oven: 'Lucia', counter: 'Benny' },
  suburbs: { prep: 'Patty', oven: 'Hank', counter: 'Kayla' },
  waterfront: { prep: 'Finn', oven: 'Gus', counter: 'Coral' },
  university: { prep: 'Raj', oven: 'Mei', counter: 'Tyler' },
  industrial: { prep: 'Stan', oven: 'Ox', counter: 'Rita' },
  uptown: { prep: 'Pierre', oven: 'Margot', counter: 'Sterling' },
};
/** The General Manager of each neighbourhood (cards read the names from here). Downtown's is Nonna, by the story; the rest are hired. */
export const MANAGERS: Record<NeighborhoodId, { id: string; name: string; title: 'General Manager' }> = {
  downtown: { id: 'nonna-rosa', name: 'Nonna Rosa', title: 'General Manager' },
  suburbs: { id: 'deb', name: 'Deb', title: 'General Manager' },
  waterfront: { id: 'skip', name: 'Skip', title: 'General Manager' },
  university: { id: 'noor', name: 'Noor', title: 'General Manager' },
  industrial: { id: 'dee', name: 'Dee', title: 'General Manager' },
  uptown: { id: 'anton', name: 'Anton', title: 'General Manager' },
};

/** Which layer each neighbourhood plays (v5.16): the layer modules read this, not a neighbourhood id. */
export const HOME_LAYERS: Record<HomeNeighborhoodId, LayerKind | null> = {
  downtown: null,
  suburbs: 'gameDay',
  waterfront: 'boats',
  university: 'menu',
  industrial: 'shifts',
  uptown: 'stars',
};
