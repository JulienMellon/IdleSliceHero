// All balancing numbers live here so tuning never touches game logic.
// v5.18 (card K1): everything that is specific to the home city now lives in ./cities/home/ (a city is a folder; the engine reads the
// current one with `cityOf(game)`). The names below are thin re-exports of the HOME city's tables, kept because dozens of call sites (components,
// tests, scripts) read the home city directly; engine code that has a game in hand reads `cityOf(g)` instead.
export type { FootprintTier, NeighborhoodDef, OvenGrade, PerkDef, VehicleDef } from './cities/types';
export { HEAD_COST_DOWNTOWN, NONNA_TAKEOVER, FOOTPRINTS, OVEN_GRADES, VEHICLES } from './cities/home/fit';
export { CITY_NAME, HEADS, MANAGERS, NEIGHBORHOODS, PERKS, PIER9_BID } from './cities/home/data';

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
  downtownBeat4GapSeconds: 120,
  /** Away at least this long counts as a return. iOS also fires "active" after Control Center, a banner or the app switcher. */
  returnSeconds: 60,
} as const;

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

export const HEAD_TITLE: Record<HeadKind, string> = { prep: 'Head Prep Cook', oven: 'Head Baker', counter: 'Head Cashier' };
/** One word for what a head runs (goal bar, sidewalk). */
export const HEAD_ROLE: Record<HeadKind, string> = { prep: 'prep', oven: 'ovens', counter: 'counter' };
