// Daily tasks, weekly tasks and the 30-day gift calendar: data only (docs/PLAN-v5.4-rewards.md §1).
// Balancing is an edit to this file; the rules live in src/engine/rewards.ts.

/** Every kind of task. Progress reads a lifetime counter (`stats`, or `totalEarned` for 'earn'). */
export type TaskKind = 'upgrades' | 'walkins' | 'deliveries' | 'baked' | 'earn' | 'offline' | 'booster' | 'hire' | 'decor' | 'dailyDone' | 'days' | 'build' | 'ovens' | 'fleet';
export const TASK_KINDS: readonly TaskKind[] = ['upgrades', 'walkins', 'deliveries', 'baked', 'earn', 'offline', 'booster', 'hire', 'decor', 'dailyDone', 'days', 'build', 'ovens', 'fleet'];

/** When a task may be generated. The engine maps each key to a check on the game state. */
export type Eligibility = 'always' | 'walkins' | 'booster' | 'hire' | 'decor' | 'build' | 'fleet';

/** How a target is set: a fixed number, or a rate (pies or cash per second) × seconds, rounded to 2 significant figures. */
export type TaskScale = { fixed: number } | { rate: 'walkin' | 'driver' | 'city' | 'income'; seconds: number };

export interface PoolEntry {
  kind: TaskKind;
  scale: TaskScale;
  eligible: Eligibility;
}

/** `{n}` is the target (a count, or money for cash tasks). */
export const TASK_TEXT: Record<TaskKind, { title: string; unit: 'count' | 'cash' }> = {
  upgrades: { title: 'Buy {n} upgrades', unit: 'count' },
  walkins: { title: 'Serve {n} walk-ins', unit: 'count' },
  deliveries: { title: 'Deliver {n} pizzas', unit: 'count' },
  baked: { title: 'Bake {n} pizzas', unit: 'count' },
  earn: { title: 'Earn {n}', unit: 'cash' },
  offline: { title: 'Collect your offline earnings', unit: 'count' },
  booster: { title: 'Start a booster', unit: 'count' },
  hire: { title: 'Hire a head or manager', unit: 'count' },
  decor: { title: 'Buy a decor upgrade', unit: 'count' },
  dailyDone: { title: 'Complete {n} daily tasks', unit: 'count' },
  days: { title: 'Show up on {n} different days', unit: 'count' },
  build: { title: 'Open a pizzeria in a new neighbourhood', unit: 'count' },
  ovens: { title: 'Buy {n} oven upgrades', unit: 'count' },
  fleet: { title: 'Upgrade the fleet', unit: 'count' },
};

/** Rate-scaled targets never go below these. */
export const MIN_COUNT_TARGET = 5;
export const MIN_CASH_TARGET = 100;

export const DAILY_TASK_COUNT = 5;
export const WEEKLY_TASK_COUNT = 7;

/** Cash is minutes of income (earnings per second × 60 × minutes, at claim time). */
export const DAILY_TASK_REWARD = { minutes: 15, points: 20 } as const;
export const WEEKLY_TASK_REWARD = { minutes: 120 } as const;

export interface BoosterDef {
  mult: number;
  minutes: number;
}

export interface Chest {
  /** Slice Points needed to open it. */
  points: number;
  minutes?: number;
  diamonds?: number;
  booster?: BoosterDef;
}
export const DAILY_CHESTS: readonly Chest[] = [
  { points: 40, minutes: 30 },
  { points: 70, minutes: 60 },
  { points: 100, diamonds: 10, booster: { mult: 2, minutes: 15 } },
];

/** Diamonds paid with each weekly task (by position); 50 in all. */
export const WEEKLY_DIAMONDS: readonly number[] = [8, 7, 7, 7, 7, 7, 7];
/** The final weekly chest's cosmetic, rotating by ISO week number. */
export const WEEKLY_COSMETICS: readonly string[] = ['oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold'];

export const DAILY_POOL: readonly PoolEntry[] = [
  { kind: 'upgrades', scale: { fixed: 10 }, eligible: 'always' },
  { kind: 'walkins', scale: { rate: 'walkin', seconds: 600 }, eligible: 'walkins' },
  { kind: 'deliveries', scale: { rate: 'driver', seconds: 600 }, eligible: 'always' },
  { kind: 'baked', scale: { rate: 'city', seconds: 600 }, eligible: 'always' },
  { kind: 'earn', scale: { rate: 'income', seconds: 1200 }, eligible: 'always' },
  { kind: 'offline', scale: { fixed: 1 }, eligible: 'always' },
  { kind: 'booster', scale: { fixed: 1 }, eligible: 'booster' },
  { kind: 'hire', scale: { fixed: 1 }, eligible: 'hire' },
  { kind: 'decor', scale: { fixed: 1 }, eligible: 'decor' },
];

export const WEEKLY_POOL: readonly PoolEntry[] = [
  { kind: 'dailyDone', scale: { fixed: 20 }, eligible: 'always' },
  { kind: 'days', scale: { fixed: 5 }, eligible: 'always' },
  { kind: 'hire', scale: { fixed: 1 }, eligible: 'hire' },
  { kind: 'build', scale: { fixed: 1 }, eligible: 'build' },
  { kind: 'ovens', scale: { fixed: 5 }, eligible: 'always' },
  { kind: 'earn', scale: { rate: 'income', seconds: 3 * 3600 }, eligible: 'always' },
  { kind: 'fleet', scale: { fixed: 1 }, eligible: 'fleet' },
  { kind: 'upgrades', scale: { fixed: 60 }, eligible: 'always' },
  { kind: 'deliveries', scale: { rate: 'driver', seconds: 3600 }, eligible: 'always' },
];

// ---------- Daily gift calendar ----------

export interface GiftDef {
  /** Shown on the calendar tile. */
  label: string;
  /** Cash: minutes of income, paid at claim time. */
  minutes?: number;
  diamonds?: number;
  /** Added to the booster inventory. */
  boosters?: BoosterDef[];
  /** Starts running at once. */
  boostNow?: BoosterDef;
  /** Cosmetic id; `{cycle}` becomes the 1-based cycle number. */
  cosmetic?: string;
  /** Day 30: the cycle's visitor (VISITORS) comes by. */
  visit?: boolean;
}

export const GIFT_LENGTH = 30;
/** Small gifts, in order, on the days that are not milestones. */
export const GIFT_SMALL: readonly GiftDef[] = [
  { label: '30 min of income', minutes: 30 },
  { label: '2× booster · 15 min', boosters: [{ mult: 2, minutes: 15 }] },
  { label: '5 diamonds', diamonds: 5 },
];
/** Milestone days (1-based). */
export const GIFT_MILESTONES: Readonly<Record<number, GiftDef>> = {
  7: { label: '50 diamonds', diamonds: 50 },
  14: { label: '3 boosters · 2× · 30 min', boosters: [{ mult: 2, minutes: 30 }, { mult: 2, minutes: 30 }, { mult: 2, minutes: 30 }] },
  21: { label: '2× income for 24 h', boostNow: { mult: 2, minutes: 24 * 60 } },
  28: { label: 'Storefront skin', cosmetic: 'storefront-skin-{cycle}' },
  30: { label: 'Visit: 2× for 7 days', boostNow: { mult: 2, minutes: 7 * 24 * 60 }, diamonds: 300, cosmetic: 'oven-gold', visit: true },
};

/** The 30 gifts, day 1 first. */
export const GIFT_DAYS: readonly GiftDef[] = (() => {
  let small = 0;
  return Array.from({ length: GIFT_LENGTH }, (_, i) => GIFT_MILESTONES[i + 1] ?? GIFT_SMALL[small++ % GIFT_SMALL.length]);
})();

/** Who visits on day 30, by cycle (then repeats). */
export const VISITORS: readonly string[] = ['nonna', 'big-sal', 'genevieve'];

/** Repairing a one-day gap in the streak. */
export const STREAK_SAVE_DIAMONDS = 20;

// ---------- Cosmetics ----------

export const COSMETIC_NAMES: Readonly<Record<string, string>> = {
  'oven-woodfired': 'Wood-fired oven',
  'scooter-mint': 'Mint scooter',
  'neon-counter': 'Neon counter sign',
  'awning-gold': 'Gold awning',
  'oven-gold': 'Gold oven',
};

/** Display name of a cosmetic id (storefront skins are numbered by cycle). */
export function cosmeticName(id: string): string {
  const skin = /^storefront-skin-(\d+)$/.exec(id);
  if (skin) return `Storefront skin ${skin[1]}`;
  return COSMETIC_NAMES[id] ?? id;
}

export const VISITOR_NAMES: Readonly<Record<string, string>> = { nonna: 'Nonna Rosa', 'big-sal': 'Big Sal', genevieve: 'Genevieve' };

/** What the day-30 visitor says on the gift card, by visitor id. */
export const VISITOR_LINES: Readonly<Record<string, string>> = {
  nonna: 'Thirty days. You eat, you come back. Good, eh?',
  'big-sal': "Thirty days, no sick days. Union'd be proud, kid.",
  genevieve: 'Thirty days, darling. Do try to keep up.',
};

// ---------- Limits ----------

/** A boost's `until` is never more than this far past now (a load cap against a corrupt save). */
export const BOOST_MAX_AHEAD_MS = 30 * 86_400_000;
/** Boosters waiting in the inventory; grants past this are dropped. */
export const MAX_BOOSTERS = 99;
/** Boosts running at once; starting or gaining one past this drops the soonest-ending. */
export const MAX_CONCURRENT_BOOSTS = 20;
/** A clock this far ahead of the real time is treated as a mistake and recovered from (lastSeen = now, boosts cleared). */
export const CLOCK_RECOVER_MS = 36 * 3_600_000;
/** `lastSeen` is raised only when this stale (and on claims): it keeps `game.rewards` stable between ticks. */
export const LAST_SEEN_STEP_MS = 60_000;
/** The weekly chest's prize once every rotation cosmetic is owned. */
export const WEEKLY_FALLBACK = { diamonds: 30, minutes: 120 } as const;
