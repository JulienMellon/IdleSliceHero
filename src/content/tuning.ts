// All balancing numbers live here so tuning never touches game logic.
import type { NeighborhoodId, VehicleId } from './types';

export const CITY_NAME = 'Port Marinara';

export const TUNING = {
  costGrowth: 1.15,
  /** Levels at which an upgrade's output doubles. */
  milestones: [25, 50, 100] as const,
  offlineCapSeconds: 4 * 60 * 60,
  saveIntervalSeconds: 30,

  oven: {
    baseCost: 10,
    /** Pizzas per batch at level 1. */
    batchSize: 4,
    /** Seconds per batch at level 1. */
    bakeSeconds: 6,
    /** Each level after 1 adds this fraction of base speed. */
    speedPerLevel: 0.5,
    /** Finished pizzas the shelf can hold, in batches. */
    shelfBatches: 3,
  },

  drivers: {
    baseCost: 8,
    start: 1,
  },
} as const;

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
  /** Blocks from the shop, one way. */
  distance: number;
  /** Cash per pizza delivered. */
  orderValue: number;
  unlockCost: number;
  /** Minimum vehicle tier index (into VEHICLES) needed to unlock. */
  minVehicle: number;
  /** Map position in the 100×76 map viewBox (shop at SHOP_POS). */
  x: number;
  y: number;
  color: string;
}

export const NEIGHBORHOODS: NeighborhoodDef[] = [
  { id: 'downtown', name: 'Downtown', distance: 2, orderValue: 3, unlockCost: 0, minVehicle: 0, x: 22, y: 36, color: '#F2994A' },
  { id: 'suburbs', name: 'Suburbs', distance: 4, orderValue: 9, unlockCost: 250, minVehicle: 0, x: 24, y: 56, color: '#6FCF97' },
  { id: 'waterfront', name: 'Waterfront', distance: 6, orderValue: 24, unlockCost: 4_000, minVehicle: 1, x: 76, y: 56, color: '#56CCF2' },
  { id: 'university', name: 'University', distance: 8, orderValue: 60, unlockCost: 200_000, minVehicle: 1, x: 18, y: 11, color: '#BB6BD9' },
  { id: 'industrial', name: 'Industrial', distance: 11, orderValue: 150, unlockCost: 1_200_000, minVehicle: 2, x: 82, y: 11, color: '#A0826D' },
  { id: 'uptown', name: 'Uptown', distance: 15, orderValue: 400, unlockCost: 5_000_000, minVehicle: 3, x: 50, y: 8, color: '#EB5757' },
];

export const SHOP_POS = { x: 50, y: 36 };
export const MAP_VIEWBOX = { w: 100, h: 76 };
