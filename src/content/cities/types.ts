// The shape of a city (v5.18, card K1). Everything that is specific to one city (its neighbourhoods, story, perks, heads and managers, the layer
// each neighbourhood plays, the Pier 9-style bid, the lieutenant, the theme and the fitted numbers) is one `CityDef`, one folder under
// src/content/cities/. The engine reads the current city with `cityOf(game)` (./index.ts), so a second city is a second folder.
import type { CharacterId, NeighborhoodId, Scene, VehicleId } from '../types';
import type { HeadKind } from '../tuning';

export interface NeighborhoodDef {
  id: NeighborhoodId;
  name: string;
  /** Cash per pizza delivered. */
  orderValue: number;
  /** Cost to build this neighborhood's pizzeria. */
  buildCost: number;
  /** Multiplies every upgrade cost in this pizzeria. */
  costMult: number;
  /** Cost to hire this pizzeria's General Manager (the first neighbourhood's is the founder, via the story). */
  managerCost: number;
  /** The three station heads together, split by HEAD_SHARE (the first neighbourhood's have their own prices, `CityFit.headCostFirst`; this is their sum). */
  headsCost: number;
  /** Map position in the 100×76 City viewBox. */
  x: number;
  y: number;
  color: string;
  /** Cutaway wall color. */
  wall: string;
}

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

export interface OvenGrade {
  name: string;
  /** Bake speed multiplier. */
  mult: number;
  /** Cost × the shop's cost multiplier. */
  cost: number;
  color: string;
}

export interface FootprintTier {
  name: string;
  /** Cost × the shop's cost multiplier. */
  cost: number;
  /** Tables drawn in the cutaway. */
  maxTables: number;
  /** Oven slots drawn in the cutaway. */
  ovenSlots: number;
}

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

/** The layers a neighbourhood can play (card K1: the layer modules key off this, not a neighbourhood id). The rival is not one of them: every neighbourhood from beat 3 has it. */
export const LAYER_KINDS = ['gameDay', 'boats', 'menu', 'shifts', 'stars'] as const;
export type LayerKind = (typeof LAYER_KINDS)[number];

/** The numbers the pacing fit decides for a city (scripts/pacing-fit.ts). Neighbourhood prices are in `neighbourhoods`; these are the shared tables around them. */
export interface CityFit {
  ovenGrades: OvenGrade[];
  footprints: FootprintTier[];
  vehicles: VehicleDef[];
  /** The first neighbourhood's three heads have fixed prices (the founder is its manager, by the story). */
  headCostFirst: Record<HeadKind, number>;
  /** The first neighbourhood's tutorial ends when the founder takes over: scene `sceneId` plays after this many pizzas there. */
  takeover: { sceneId: string; pizzas: number };
}

/** A neighbourhood's finale that is a purchase (Pier 9): bid once `sceneId` has been seen and the shop has sold `unlockPizzas`. */
export interface CityBid {
  hood: NeighborhoodId;
  /** The bid's name in the goal bar and teaser ("Pier 9"). */
  name: string;
  cost: number;
  unlockPizzas: number;
  /** The scene that must have been seen before the bid opens. */
  afterScene: string;
}

export interface Lieutenant {
  id: CharacterId;
  name: string;
}

export interface CityDef {
  id: string;
  name: string;
  /** In build order: the first is built from the start, each next one after the one before. */
  neighbourhoods: NeighborhoodDef[];
  /** The whole story in play order. */
  scenes: Scene[];
  /** One perk per finale. */
  perks: Partial<Record<NeighborhoodId, PerkDef>>;
  /** The layer each neighbourhood plays (null: none). */
  layers: Record<NeighborhoodId, LayerKind | null>;
  /** The station heads' names and the General Manager of each neighbourhood. */
  heads: Record<NeighborhoodId, Record<HeadKind, string>>;
  managers: Record<NeighborhoodId, { id: string; name: string; title: 'General Manager' }>;
  /** The local MegaSlice lieutenant, defeated in the city's finale. */
  lieutenant: Lieutenant;
  bid?: CityBid;
  /** The story-music key of the city theme (src/audio/manifest.ts `story` table). */
  theme: string;
  fit: CityFit;
}

/** Every key a `CityFit` must have (the schema test checks a pack against this). */
export const FIT_KEYS: readonly (keyof CityFit)[] = ['ovenGrades', 'footprints', 'vehicles', 'headCostFirst', 'takeover'];
