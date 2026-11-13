// Everything a player does after the story ends (v5.15): shop mastery, Victor's weekly counter-attack, the Friday and Sunday
// events, the 24 recipe cards and the worn cosmetics. Every number of those features is here; the rules are in
// src/engine/features/{mastery,counterattack,events,recipes}.ts. Types only come from ./types, so the engine and the scripts
// can both read this file.
import type { NeighborhoodId } from './types';

// ---------- Shop mastery ----------

/** The three stars of a shop, in the order they are shown. */
export const MASTERY_STARS = ['heads', 'flagship', 'golden'] as const;
export type MasteryStar = (typeof MASTERY_STARS)[number];

export const MASTERY = {
  /** Diamonds each star pays, once. */
  starDiamonds: 10,
  /** At these totals (of 18) the player is given the next weekly-rotation cosmetic they don't own. */
  cosmeticTotals: [6, 12],
  /** At this total (every star in every shop) the player is given `masterCosmetic`. */
  masterTotal: 18,
  masterCosmetic: 'plaque-master',
} as const;

/** What a star asks for, as the progress line shows it ("Hire all three heads"). */
export const MASTERY_TEXT: Record<MasteryStar, { title: string; short: string }> = {
  heads: { title: 'Hire all three station heads', short: 'Heads' },
  flagship: { title: 'Grow to a Flagship', short: 'Flagship' },
  golden: { title: 'Install the Golden oven', short: 'Golden oven' },
};

// ---------- Counter-attack ----------

export const COUNTERATTACK = {
  /** While the attack is open the target shop's value per pizza is multiplied by this. */
  valueMult: 0.8,
  /** The defence is a rush challenge this long (play seconds: it pauses while the app is closed). */
  challengeSeconds: 5 * 60,
  /** The challenge asks for challengeSeconds × the shop's current pizza rate × this. */
  targetMargin: 1.25,
  /** A win pays this many minutes of boost-free citywide income… */
  rewardMinutes: 30,
  /** …and these diamonds. */
  rewardDiamonds: 15,
  /** A lost challenge may be tried again this long after (real milliseconds). */
  retryMs: 60 * 60_000,
  /** The seed's salt, so the target is not the same shuffle as another weekly roll. */
  seedSalt: 4207,
} as const;

// ---------- Events ----------

export type EventId = 'friday-rush' | 'game-day';

export interface EventDef {
  id: EventId;
  name: string;
  /** Local weekday, Sunday = 0. */
  weekday: number;
  /** Local hours: the event runs from `fromHour`:00 up to (not including) `toHour`:00. */
  fromHour: number;
  toHour: number;
  /** Shops it applies to; 'all' = every shop. */
  hoods: 'all' | readonly NeighborhoodId[];
  /** × the value per pizza (it adds with boosts, as docs/REWARDS.md says). */
  mult: number;
}

export const EVENTS: readonly EventDef[] = [
  { id: 'friday-rush', name: 'Friday Night Rush', weekday: 5, fromHour: 17, toHour: 21, hoods: 'all', mult: 1.5 },
  { id: 'game-day', name: 'Big Game Day', weekday: 0, fromHour: 13, toHour: 16, hoods: ['suburbs', 'downtown'], mult: 2 },
];

/** An upcoming event shows once it is this close, with a countdown. */
export const EVENT_HEADS_UP_SECONDS = 60 * 60;
/**
 * An event multiplies only while the app is open: the feature stamps the time of each foreground tick, and a stamp older than this
 * (the app was closed or in the background) means the clock is an offline catch-up and the event does not apply.
 */
export const EVENT_FRESH_MS = 5_000;
/** The stamp is refreshed this often while an event runs (keeps the saved state still between refreshes). */
export const EVENT_STAMP_MS = 2_000;

// ---------- Recipe cards ----------

export const RECIPE = {
  /** Each owned card multiplies its shop's value per pizza by this. */
  valueMult: 1.01,
  /** Card 1: any of the three kitchen stations (prep, ovens, counter) at this level. */
  stationLevel: 50,
  perShop: 4,
} as const;

/** What each card of a shop is earned by, card 1 to 4. */
export const RECIPE_DROPS = ['Any station reaches Lv 50', 'Hire the General Manager', 'See the finale', 'Defend against a counter-attack'] as const;

export const recipeId = (hood: NeighborhoodId, n: 1 | 2 | 3 | 4) => `recipe.${hood}.${n}`;

export const RECIPE_TITLES: Record<NeighborhoodId, readonly [string, string, string, string]> = {
  downtown: ['Marco’s Margherita', 'Benny’s Deep Dish', 'Nonna’s Sunday Pie', 'Downtown Double Pepperoni'],
  suburbs: ['Patty’s Pan Pizza', 'Hank’s Game-Day Wings Pie', 'Dale’s Team Special', 'Cul-de-sac Combo'],
  waterfront: ['Finn’s Clam Pie', 'Gus’s Smoked Anchovy', 'Marisol’s Pier 9 Pie', 'Coral’s Harbour White'],
  university: ['Raj’s Midnight Masala', 'Mei’s Study-Break Slice', 'Priya’s Thesis Pizza', 'Tyler’s Dorm Dozen'],
  industrial: ['Stan’s Shift Slice', 'Ox’s Forge-Fired Pie', 'Big Sal’s Union Special', 'Rita’s Foreman Feast'],
  uptown: ['Pierre’s Truffle Pie', 'Margot’s Gold-Leaf Slice', 'Genevieve’s Gala Pizza', 'Sterling’s Penthouse Pie'],
};

// ---------- Worn cosmetics ----------

/**
 * Which part of the scene a cosmetic dresses. Two cosmetics of the same part can't both be worn (two oven skins).
 * Ids not listed use the text before their first dash ('oven-gold' → 'oven', 'storefront-skin-3' → 'storefront').
 */
const PART_OVERRIDES: Readonly<Record<string, string>> = { 'neon-counter': 'counter' };

export function cosmeticPart(id: string): string {
  return PART_OVERRIDES[id] ?? id.split('-')[0];
}

// ---------- The vanity shop (diamonds) ----------

/** What a cosmetic costs, in diamonds. */
export const VANITY_PRICE = 150;

/** The seven cosmetics, in the order the shop lists them. `plaque-master` is earned at 18 stars and never sold. */
export const VANITY_IDS = ['oven-gold', 'storefront-skin', 'oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold', 'plaque-master'] as const;
export type VanityId = (typeof VANITY_IDS)[number];

/**
 * C115: skins bought with diamonds are numbered from 101, so they never collide with the day-28 gift's `storefront-skin-{cycle}`
 * (cycles 1, 2, 3 ...): a bought skin can't swallow a later gift. The scene wears skin N as `SKINS[(N - 1) % SKINS.length]`.
 */
export const SOLD_SKIN_BASE = 100;
