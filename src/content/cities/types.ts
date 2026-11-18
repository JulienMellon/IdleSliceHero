// The shape of a city (v5.18, card K1). Everything that is specific to one city (its neighbourhoods, story, perks, heads and managers, the layer
// each neighbourhood plays, the Pier 9-style bid, the lieutenant, the theme and the fitted numbers) is one `CityDef`, one folder under
// src/content/cities/. The engine reads the current city with `cityOf(game)` (./index.ts), so a second city is a second folder.
import type { CharacterId, NeighborhoodId, Scene, VehicleId } from '../types';
import type { HeadKind } from '../tuning';
import type { BarkStation, BarkTrigger } from '../heads';

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
  /** The shop's floor plan (content/shop-layout.ts): 'standard' (kitchen left, door right; the default) or 'mirrored' (kitchen right, door left). Home Waterfront and Industrial are mirrored. */
  plan?: 'standard' | 'mirrored';
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

/** What each neighbourhood's three heads say, by station and trigger (content/heads.ts `BarkTrigger`): the lines a head's bubble shows. */
export type BarkTable = Record<NeighborhoodId, Record<BarkStation, Record<BarkTrigger, string>>>;

/** A character who asks for special orders in a neighbourhood's shop (v5.13). */
export interface OrderCast {
  who: CharacterId;
  /** As the HUD and the Scrapbook name them. */
  name: string;
  /** Two offers; `{n}` is the number of pies. At most 60 characters once `{n}` is filled in. */
  offers: readonly [string, string];
  /** Two thank-yous for a finished order. */
  thanks: readonly [string, string];
}

/** The night oven's words: its name and the info sheet's line, in which `{hours}` is how long the away meter holds. */
export interface NightOvenLines {
  name: string;
  body: string;
}

/** What the city before this one says about it (the "Coming soon" card of the city ahead): a title, two lines, a sign-off and who signs it. Read by `teaserFor` (./index.ts). */
export interface CityTeaser {
  title: string;
  lines: [string, string];
  signoff: string;
  from: string;
}

export interface CityDef {
  id: string;
  name: string;
  /** The characters this city adds (its pack's cast.ts, one line in content/cast.ts). Its scenes may also use the home cast, the returning characters. */
  cast: readonly CharacterId[];
  /** What the next-scene teaser calls this city's own characters (cast.ts, `<ID>_NAMES`); the home cast's names are the home pack's. A character with no name is called by its id. */
  names?: Readonly<Partial<Record<CharacterId, string>>>;
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
  /** What the city before this one says about it: the next city's card reads it (`teaserFor`). Absent for a city nobody announces. */
  teaser?: CityTeaser;
  /**
   * The city's voice (card R1). Every field is optional: a city without one is silent or generic, never the home city's, and the readers
   * take `cityOf(g).barks ?? {}`. A city pack fills them in (the home city's are in home/voice.ts).
   */
  /** What the heads say, per neighbourhood, station and trigger. A neighbourhood with no entry has silent heads. */
  barks?: Partial<BarkTable>;
  /** Heads' lines as a script gives them, numbered per station and not tied to a trigger (Boston's `bark.<hood>.<station>.<n>`); a writer maps them onto `barks`. The engine does not read them yet. */
  headBarks?: Partial<Record<NeighborhoodId, Record<BarkStation, readonly string[]>>>;
  /** Who asks for special orders, by neighbourhood. */
  orderCast?: Partial<Record<NeighborhoodId, OrderCast>>;
  /** The night oven's name and sheet line; a city without them gets the generic ones. */
  nightOvenLines?: NightOvenLines;
  /** The first neighbourhood's founder, by the name the takeover countdown uses; without it the first manager's name is used. */
  founder?: { id: CharacterId; name: string };
  /**
   * v5.18 behaviour a pack can keep while the engine is generic (card R1 is behaviour-preserving). Each is absent for a new city, and each Boston value
   * below is a known bug carried over on purpose (see the card report); a later version deletes the field and the Boston value.
   */
  /** The scene whose being seen unlocks the rewards (default: the takeover scene, `fit.takeover.sceneId`). */
  rewardsScene?: string;
  /** The neighbourhood whose shop shows its stations on the sidewalk instead of a hire stack, and whose moments speak as the founder's (default: the first; `null`: none). */
  founderHood?: NeighborhoodId | null;
  /** The prep head the tutorial's last step names (default: the first neighbourhood's prep head). */
  tutorialHead?: string;
  /** The shops the shop-service slice starts with a row for (default: this city's own). */
  serviceRows?: readonly NeighborhoodId[];
  /** The city's own lines, by the home copy keys (content/copy/home): `t(key, vars, city)` says this line when the city has one and the home line otherwise. Keep a city's words here, in its own folder. */
  copy?: Readonly<Record<string, string>>;
  /** The story-music key of the city theme (src/audio/manifest.ts `story` table). */
  theme: string;
  fit: CityFit;
}

/** Every key a `CityFit` must have (the schema test checks a pack against this). */
export const FIT_KEYS: readonly (keyof CityFit)[] = ['ovenGrades', 'footprints', 'vehicles', 'headCostFirst', 'takeover'];
