// The home city's fitted tables (card K1: moved out of tuning.ts, which re-exports them for the call sites that read the home city directly).
// scripts/pacing-fit.ts fits these; never edit one number alone.
import type { CityFit, FootprintTier, OvenGrade, VehicleDef } from '../types';
import type { HeadKind } from '../../tuning';

// v5.15 refit (scripts/pacing-fit.ts fitstars): Golden (cost 12M before) and the Flagship below (15M before) are two of a shop's three
// mastery stars, the last ones the player earns. Both went up by the same factor, about 67x, so the check-in player has all 18 stars
// on about day 12 (target: day 10 to 14). The story days did not leave their targets.
// v5.25 (card E10): Golden and the Flagship are 1M each (x costMult, so 8B at Uptown); the car, van and drone cost 250K / 1M / 4M, so a fleet tier past the scooter is a
// wait of its own for the check-in player (the kitchens top out at about 166 pies a second, which the scooter's demand already meets).
export const OVEN_GRADES: OvenGrade[] = [
  { name: 'Brick', mult: 1, cost: 0, color: '#B85C38' },
  { name: 'Stone', mult: 2, cost: 400, color: '#8A8A8A' },
  { name: 'Wood-fired', mult: 4, cost: 8_000, color: '#7A4A26' },
  { name: 'Copper', mult: 8, cost: 80_000, color: '#C8763A' },
  { name: 'Golden', mult: 16, cost: 1_000_000, color: '#E0B000' },
];

/** Downtown's tutorial ends when Nonna takes over: scene `sceneId` plays after this many Downtown pizzas (matches downtown-4's trigger). */
export const NONNA_TAKEOVER = { sceneId: 'downtown-4', pizzas: 2217 } as const;

export const FOOTPRINTS: FootprintTier[] = [
  { name: 'Hole-in-the-wall', cost: 0, maxTables: 2, ovenSlots: 2 },
  { name: 'Corner shop', cost: 500, maxTables: 3, ovenSlots: 3 },
  { name: 'Double storefront', cost: 8_000, maxTables: 4, ovenSlots: 4 },
  { name: 'Restaurant', cost: 100_000, maxTables: 5, ovenSlots: 5 },
  { name: 'Flagship', cost: 1_000_000, maxTables: 6, ovenSlots: 6 },
];

export const VEHICLES: VehicleDef[] = [
  { id: 'bike', name: 'Bike', emoji: '🚲', speed: 0.5, capacity: 2, cost: 0 },
  { id: 'scooter', name: 'Scooter', emoji: '🛵', speed: 0.9, capacity: 3, cost: 1_500 },
  { id: 'car', name: 'Car', emoji: '🚗', speed: 1.6, capacity: 6, cost: 250_000 },
  { id: 'van', name: 'Van', emoji: '🚐', speed: 2.6, capacity: 14, cost: 1_000_000 },
  { id: 'drone', name: 'Drone', emoji: '🛸', speed: 5, capacity: 10, cost: 4_000_000 },
];

/** Downtown has no manager price (Nonna is its GM via the story), so its heads have fixed prices. */
export const HEAD_COST_DOWNTOWN: Record<HeadKind, number> = { prep: 150, oven: 1_100, counter: 4_000 };

export const HOME_FIT: CityFit = {
  ovenGrades: OVEN_GRADES,
  footprints: FOOTPRINTS,
  vehicles: VEHICLES,
  headCostFirst: HEAD_COST_DOWNTOWN,
  takeover: NONNA_TAKEOVER,
};
