// All balancing numbers live here so tuning never touches game logic.
import type { NeighborhoodId, VehicleId } from './types';

export const CITY_NAME = 'Port Marinara';

export const TUNING = {
  costGrowth: 1.15,
  /** Levels at which a station's output doubles. */
  milestones: [25, 50, 100] as const,
  /** Each footprint tier above the first speeds up prep and the counter by this factor (more room to work, bigger counter). */
  footprintBoost: 1.5,
  /** Each footprint tier lets prep, ovens and counter level up this much further. */
  levelsPerFootprint: 25,
  offlineCapSeconds: 4 * 60 * 60,
  /** Away at least this long shows the "While you were away" popup. */
  offlinePopupSeconds: 60,
  saveIntervalSeconds: 30,
  /** Each level after 1 adds this fraction of a station's base speed. */
  speedPerLevel: 0.5,
  /** Walk-ins pay this share of the order value (seated first, at full price). */
  walkInShare: 1.0,
  /** Pizzas added per tap when a pizzeria has no manager, and how many can be queued. */
  tapBatch: 4,
  tapQueueMax: 12,
  /** Round-trip blocks for a local delivery. */
  deliveryRoundTrip: 4,
  /** Rush tap on a managed pizzeria: this many seconds of that shop's earnings. */
  rushSeconds: 0.25,
} as const;

/**
 * Per-station base speed (pizzas/sec at level 1), base cost (× the shop's cost multiplier) and `growth`: what each level costs
 * more than the one before (a station without one uses TUNING.costGrowth). v5.16: the five differ, so the cheapest item on offer
 * is no longer always the best buy (the price of level n is cost × costMult × growth^(n-1)).
 */
export const STATIONS = {
  prep: { name: 'Prep Cooks', speed: 0.9, cost: 5.76, growth: 1.125 },
  ovens: { name: 'Ovens', speed: 0.7, cost: 11.7, growth: 1.171 },
  counter: { name: 'Counter', speed: 1.1, cost: 12.4, growth: 1.152 },
  drivers: { name: 'Drivers', cost: 6.27, growth: 1.168 },
  tables: { name: 'Seating', speed: 0.3, cost: 6.79, growth: 1.155 },
} as const;

export interface OvenGrade {
  name: string;
  /** Bake speed multiplier. */
  mult: number;
  /** Cost × the shop's cost multiplier. */
  cost: number;
  color: string;
}

// v5.15 refit (scripts/pacing-fit.ts fitstars): Golden (cost 12M before) and the Flagship below (15M before) are two of a shop's three
// mastery stars, the last ones the player earns. Both went up by the same factor, about 67x, so the check-in player has all 18 stars
// on about day 12 (target: day 10 to 14). The story days did not leave their targets.
export const OVEN_GRADES: OvenGrade[] = [
  { name: 'Brick', mult: 1, cost: 0, color: '#B85C38' },
  { name: 'Stone', mult: 2, cost: 400, color: '#8A8A8A' },
  { name: 'Wood-fired', mult: 4, cost: 12_000, color: '#7A4A26' },
  { name: 'Copper', mult: 8, cost: 400_000, color: '#C8763A' },
  { name: 'Golden', mult: 16, cost: 2_000_000_000, color: '#E0B000' },
];

/** Downtown's tutorial ends when Nonna takes over: scene `sceneId` plays after this many Downtown pizzas (matches downtown-4's trigger). */
export const NONNA_TAKEOVER = { sceneId: 'downtown-4', pizzas: 2217 } as const;

export interface FootprintTier {
  name: string;
  /** Cost × the shop's cost multiplier. */
  cost: number;
  /** Tables drawn in the cutaway. */
  maxTables: number;
  /** Oven slots drawn in the cutaway. */
  ovenSlots: number;
}

export const FOOTPRINTS: FootprintTier[] = [
  { name: 'Hole-in-the-wall', cost: 0, maxTables: 2, ovenSlots: 2 },
  { name: 'Corner shop', cost: 500, maxTables: 3, ovenSlots: 3 },
  { name: 'Double storefront', cost: 15_000, maxTables: 4, ovenSlots: 4 },
  { name: 'Restaurant', cost: 500_000, maxTables: 5, ovenSlots: 5 },
  { name: 'Flagship', cost: 2_500_000_000, maxTables: 6, ovenSlots: 6 },
];

export interface VehicleDef {
  id: VehicleId;
  name: string;
  emoji: string;
  /** Blocks per second. */
  speed: number;
  /** Pizzas per trip. */
  capacity: number;
  cost: number;
}

export const VEHICLES: VehicleDef[] = [
  { id: 'bike', name: 'Bike', emoji: '🚲', speed: 0.5, capacity: 2, cost: 0 },
  { id: 'scooter', name: 'Scooter', emoji: '🛵', speed: 0.9, capacity: 3, cost: 1_500 },
  { id: 'car', name: 'Car', emoji: '🚗', speed: 1.6, capacity: 6, cost: 80_000 },
  { id: 'van', name: 'Van', emoji: '🚐', speed: 2.6, capacity: 14, cost: 600_000 },
  { id: 'drone', name: 'Drone', emoji: '🛸', speed: 5, capacity: 10, cost: 25_000_000 },
];

/** Downtown has no manager price (Nonna is its GM via the story), so its heads have fixed prices. */
export const HEAD_COST_DOWNTOWN: Record<HeadKind, number> = { prep: 400, oven: 800, counter: 950 };

export interface NeighborhoodDef {
  id: NeighborhoodId;
  name: string;
  /** Cash per pizza delivered. */
  orderValue: number;
  /** Cost to build this neighborhood's pizzeria. */
  buildCost: number;
  /** Multiplies every upgrade cost in this pizzeria. */
  costMult: number;
  /** Cost to hire this pizzeria's General Manager (Downtown's is Nonna, via the story). */
  managerCost: number;
  /** The three station heads together, split by HEAD_SHARE (Downtown's have their own prices, HEAD_COST_DOWNTOWN; this is their sum). */
  headsCost: number;
  /** Map position in the 100×76 City viewBox. */
  x: number;
  y: number;
  color: string;
  /** Cutaway wall color. */
  wall: string;
}

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
  { id: 'downtown', name: 'Downtown', orderValue: 3, buildCost: 0, costMult: 1, managerCost: 0, headsCost: HEAD_COST_DOWNTOWN.prep + HEAD_COST_DOWNTOWN.oven + HEAD_COST_DOWNTOWN.counter, x: 22, y: 39, color: '#F2994A', wall: '#F7D9A8' },
  { id: 'suburbs', name: 'Suburbs', orderValue: 60, buildCost: 270_000, costMult: 18, managerCost: 4_600_000, headsCost: 400_000, x: 30, y: 67, color: '#6FCF97', wall: '#DDF2D2' },
  { id: 'waterfront', name: 'Waterfront', orderValue: 2_500, buildCost: 600_000_000, costMult: 2_500, managerCost: 8_000_000_000, headsCost: 2_000_000_000, x: 76, y: 67, color: '#56CCF2', wall: '#D6EEF8' },
  { id: 'university', name: 'University', orderValue: 200_000, buildCost: 8_000_000_000, costMult: 200_000, managerCost: 350_000_000_000, headsCost: 80_000_000_000, x: 18, y: 9, color: '#BB6BD9', wall: '#EADCF5' },
  { id: 'industrial', name: 'Industrial', orderValue: 6_000_000, buildCost: 1_200_000_000_000, costMult: 6_000_000, managerCost: 60_000_000_000_000, headsCost: 1_200_000_000_000, x: 50, y: 9, color: '#A0826D', wall: '#C4BCAE' },
  { id: 'uptown', name: 'Uptown', orderValue: 60_000_000, buildCost: 10_000_000_000_000, costMult: 60_000_000, managerCost: 2_600_000_000_000_000, headsCost: 80_000_000_000_000, x: 82, y: 9, color: '#EB5757', wall: '#F6D6D6' },
];

export const SHOP_POS = { x: 50, y: 36 };
export const MAP_VIEWBOX = { w: 100, h: 84 };

// ---------- Decor (per pizzeria) ----------
// Each tier owned makes the place nicer, so customers pay a little more: +decorBoost per tier.
export type DecorKind = 'plants' | 'flooring' | 'tables' | 'walls' | 'signage';
export const DECOR_KINDS: DecorKind[] = ['plants', 'flooring', 'tables', 'walls', 'signage'];
export const DECOR_BOOST = 0.04;
/** Base cost of tiers 1–3, × the pizzeria's cost multiplier. */
export const DECOR_TIER_COST = [150, 8_000, 400_000];

export interface DecorDef {
  name: string;
  icon: string;
  /** Names for tier 0 (starting look) through tier 3. */
  tiers: [string, string, string, string];
}

export const DECOR: Record<DecorKind, DecorDef> = {
  plants: { name: 'Plants', icon: '🪴', tiers: ['No plants', 'Potted plants', 'Hanging ferns', 'Indoor garden'] },
  flooring: { name: 'Flooring', icon: '🟫', tiers: ['Plain tile', 'Checkerboard', 'Wood parquet', 'Marble'] },
  tables: { name: 'Tables', icon: '🍽️', tiers: ['Plastic tables', 'Checked tablecloths', 'Wooden bistro', 'Marble & candles'] },
  walls: { name: 'Wall Decor', icon: '🖼️', tiers: ['Bare walls', 'Posters', 'Framed photos', 'Hand-painted mural'] },
  signage: { name: 'Signage', icon: '🪧', tiers: ['Painted board', 'Neon sign', 'Marquee bulbs', 'Giant rooftop pizza'] },
};

/**
 * Story pacing (v3.7). A launch or return plays at most one waiting story beat straight away; after that a beat
 * waits for `gapSeconds` of play since the last one ended. A finale (beat 4) also waits this long after its beat 3.
 * Scenes the player causes (a new pizzeria, the Pier 9 bid) are never held back.
 */
export const STORY_PACING = {
  gapSeconds: 90,
  beat4GapSeconds: 300,
  downtownBeat4GapSeconds: 60,
  /** Away at least this long counts as a return. iOS also fires "active" after Control Center, a banner or the app switcher. */
  returnSeconds: 60,
} as const;

/** Waterfront's finale is a purchase: bid on Pier 9 once "For Sale" has played and Waterfront has sold this many pizzas. ~4.4 min of income at that moment in the pacing sim (v5.13 retune). */
export const PIER9_BID = { cost: 120_000_000, unlockPizzas: 50_000 } as const;

/** A small permanent perk from each neighbourhood's finale. It only applies to that neighbourhood's pizzeria. */
export interface PerkDef {
  who: string;
  text: string;
  /** Walk-ins pay this share of the price (default TUNING.walkInShare). */
  walkInShare?: number;
  /** Multiplies the price of every pizza. */
  priceMult?: number;
  /** Multiplies the cost of Drivers upgrades. */
  driversCostMult?: number;
  /** Multiplies what the pizzeria earns while the app is closed. */
  offlineMult?: number;
  /** Price boost per decor tier (default DECOR_BOOST). */
  decorBoost?: number;
}

export const PERKS: Partial<Record<NeighborhoodId, PerkDef>> = {
  suburbs: { who: 'Coach Dale', text: 'Suburbs walk-ins pay 15% extra', walkInShare: 1.15 },
  waterfront: { who: 'Captain Marisol', text: 'Waterfront pizzas sell for 10% more', priceMult: 1.1 },
  university: { who: 'Priya', text: 'University driver upgrades cost 10% less', driversCostMult: 0.9 },
  industrial: { who: 'Big Sal', text: 'Industrial earns 25% more while you’re away', offlineMult: 1.25 },
  uptown: { who: 'Genevieve', text: 'Each Uptown decor tier adds 6% to prices (was 4%)', decorBoost: 0.06 },
};


// ---------- Station heads and the General Manager (playtest 2, Julien 2026-10-30) ----------
export type HeadKind = 'prep' | 'oven' | 'counter';
export const HEAD_KINDS: HeadKind[] = ['prep', 'oven', 'counter'];
/** A head's price as a share of the shop's manager price. */
export const HEAD_SHARE: Record<HeadKind, number> = { prep: 0.2, oven: 0.3, counter: 0.5 };
/** A General Manager multiplies the shop's income (the neighbourhood boost). */
export const GM_BOOST = 2;
/**
 * A shop with all three heads and no manager sells this share of its rate while the app is closed, without the manager's boost
 * (v5.16). With the manager a day away, the newest shop would otherwise earn nothing offline for that day. The fit may move it
 * within 0.3 to 0.6.
 */
export const HEADS_OFFLINE_SHARE = 0.5;
/** The tap batch grows by `step` pies every `every` prep levels (4 → 6 at Lv 20 …). */
export const BATCH_GROWTH = { base: 4, every: 20, step: 2 } as const;

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
export const HEAD_TITLE: Record<HeadKind, string> = { prep: 'Head Prep Cook', oven: 'Head Baker', counter: 'Head Cashier' };
/** One word for what a head runs (goal bar, sidewalk). */
export const HEAD_ROLE: Record<HeadKind, string> = { prep: 'prep', oven: 'ovens', counter: 'counter' };
