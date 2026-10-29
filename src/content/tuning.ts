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
  saveIntervalSeconds: 30,
  /** Each level after 1 adds this fraction of a station's base speed. */
  speedPerLevel: 0.5,
  /** Walk-ins pay this share of the order value (no delivery). */
  walkInShare: 0.7,
  /** Pizzas added per tap when a pizzeria has no manager, and how many can be queued. */
  tapBatch: 4,
  tapQueueMax: 12,
  /** Round-trip blocks for a local delivery. */
  deliveryRoundTrip: 4,
  /** Rush tap on a managed pizzeria: this many seconds of that shop's earnings. */
  rushSeconds: 0.25,
} as const;

/** Per-station base speed (pizzas/sec at level 1) and base cost (× the shop's cost multiplier). */
export const STATIONS = {
  prep: { name: 'Prep Cooks', speed: 0.9, cost: 6 },
  ovens: { name: 'Ovens', speed: 0.7, cost: 8 },
  counter: { name: 'Counter', speed: 1.1, cost: 7 },
  drivers: { name: 'Drivers', cost: 8 },
  tables: { name: 'Seating', speed: 0.3, cost: 12 },
} as const;

export interface OvenGrade {
  name: string;
  /** Bake speed multiplier. */
  mult: number;
  /** Cost × the shop's cost multiplier. */
  cost: number;
  color: string;
}

export const OVEN_GRADES: OvenGrade[] = [
  { name: 'Brick', mult: 1, cost: 0, color: '#B85C38' },
  { name: 'Stone', mult: 2, cost: 400, color: '#8A8A8A' },
  { name: 'Wood-fired', mult: 4, cost: 12_000, color: '#7A4A26' },
  { name: 'Copper', mult: 8, cost: 400_000, color: '#C8763A' },
  { name: 'Golden', mult: 16, cost: 12_000_000, color: '#E0B000' },
];

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
  { name: 'Flagship', cost: 15_000_000, maxTables: 6, ovenSlots: 6 },
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

export interface NeighborhoodDef {
  id: NeighborhoodId;
  name: string;
  /** Cash per pizza delivered. */
  orderValue: number;
  /** Cost to build this neighborhood's pizzeria. */
  buildCost: number;
  /** Multiplies every upgrade cost in this pizzeria. */
  costMult: number;
  /** Cost to hire this pizzeria's manager (Downtown's is Nonna, via the story). */
  managerCost: number;
  /** Map position in the 100×76 City viewBox. */
  x: number;
  y: number;
  color: string;
  /** Cutaway wall color. */
  wall: string;
}

export const NEIGHBORHOODS: NeighborhoodDef[] = [
  { id: 'downtown', name: 'Downtown', orderValue: 3, buildCost: 0, costMult: 1, managerCost: 0, x: 22, y: 39, color: '#F2994A', wall: '#F7D9A8' },
  { id: 'suburbs', name: 'Suburbs', orderValue: 10, buildCost: 300, costMult: 3, managerCost: 600, x: 30, y: 67, color: '#6FCF97', wall: '#DDF2D2' },
  { id: 'waterfront', name: 'Waterfront', orderValue: 32, buildCost: 20_000, costMult: 10, managerCost: 30_000, x: 76, y: 67, color: '#56CCF2', wall: '#D6EEF8' },
  { id: 'university', name: 'University', orderValue: 100, buildCost: 1_200_000, costMult: 30, managerCost: 1_800_000, x: 18, y: 9, color: '#BB6BD9', wall: '#EADCF5' },
  { id: 'industrial', name: 'Industrial', orderValue: 320, buildCost: 20_000_000, costMult: 100, managerCost: 12_000_000, x: 50, y: 9, color: '#A0826D', wall: '#E5DCD3' },
  { id: 'uptown', name: 'Uptown', orderValue: 1_000, buildCost: 200_000_000, costMult: 300, managerCost: 100_000_000, x: 82, y: 9, color: '#EB5757', wall: '#F6D6D6' },
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
