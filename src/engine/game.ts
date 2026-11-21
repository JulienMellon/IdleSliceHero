// Pure game logic: no React, no storage. Everything here is unit-testable.
//
// Every neighborhood has its own pizzeria. Each pizzeria is a pipeline:
//   Prep → Ovens → Counter → customers (delivery drivers + walk-ins at the tables)
// and sells pizzas at the rate of its slowest stage. City income is the sum of all pizzerias.
import {
  BATCH_GROWTH,
  DECOR_BOOST,
  DECOR_KINDS,
  DECOR_TIER_COST,
  GM_BOOST,
  HEADS_OFFLINE_SHARE,
  HEAD_KINDS,
  HEAD_SHARE,
  STATIONS,
  TUNING,
  type DecorKind,
  type HeadKind,
  type NeighborhoodDef,
} from '../content/tuning';
import { t } from '../content/copy';
import { CITIES, cityHolding, cityOf, findHood, hoodIds, HOME_ID, type CityDef, type CityFit } from '../content/cities';
import {
  BOOST_MAX_AHEAD_MS,
  DAILY_CHESTS,
  DAILY_TASK_COUNT,
  MAX_BOOSTERS,
  MAX_CONCURRENT_BOOSTS,
  TASK_KINDS,
  WEEKLY_TASK_COUNT,
  type TaskKind,
} from '../content/rewards';
import { BONUS, NIGHT_OVEN, ORDER } from '../content/hooks';
import { auctionMult, LAYER_KEYS } from '../content/layers';
import { cosmeticPart } from '../content/endgame';
import type { NeighborhoodId, Scene, SceneReward } from '../content/types';
import { pizzasLeft } from './format';
import { migrateStory } from './story';
import { CHAPTERS_KEY, chaptersTick, migrateChapters, migrateChapterSave } from './chapters';
import { FEATURES } from './features/registry';
import {
  advanceLine,
  clampWalkInDebt,
  emptyLine,
  LINE,
  nextTap,
  piesInFlight,
  rushLine,
  tapStation as lineTap,
  type Automation,
  type Line,
  type LineRates,
  type Station,
} from './pipeline';

/** v8 (v5.21): the chapters' progress is saved (`x.chapters`, engine/chapters.ts); a v7 save's open chapters are read from its counters on load. v7 (v5.20): the Chapter 1 tutorial has 15 steps (`tutorial` 1..15, done = 16), so a v6 save's step is renumbered on load (`legacyTutorial`). v6 (Todd's story): 40 scenes, interludes that hold main beats back, manager hire scenes; the migration marks skipped scenes seen. v5 was rewards: daily/weekly tasks, the gift calendar, boosts, lifetime `stats`. */
export const SAVE_VERSION = 8;
/**
 * C106: the economy marker. 2 = the v5.13 retune (costMult = orderValue, 4 h offline cap, Pier 9 $120M); 3 = the v5.16 rules
 * (managers and heads priced apart, three heads sell half speed while you are away, station prices grow at their own rates,
 * cash rewards cut). A save without the marker is from before the marker existed and loads as 2; one that has it keeps its own.
 * Old saves keep their cash and hires untouched (nothing is refunded or repriced: they simply buy at the new prices from now on).
 * Any later retune that changes prices or income must bump this number and decide in the same change what a save with the old
 * number gets (a refund, a bonus, nothing); it must never silently reprice a save.
 */
export const ECONOMY = 3;
/** The economy of a save that carries no marker. */
const ECONOMY_BEFORE_MARKER = 2;

export interface Shop {
  built: boolean;
  /** Has a General Manager: every station runs itself, income ×GM_BOOST, and it earns at full rate while you're away (three heads alone earn HEADS_OFFLINE_SHARE of it away, without the boost). */
  managed: boolean;
  /** Station heads hired here: each runs its station on its own. */
  heads: Record<HeadKind, boolean>;
  prep: number;
  ovens: number;
  /** Index into the city's `fit.ovenGrades`. */
  grade: number;
  counter: number;
  drivers: number;
  tables: number;
  /** Index into the city's `fit.footprints`. */
  footprint: number;
  /** The kitchen line: jobs at each station, pies between them and carriers walking out (pipeline.ts). */
  line: Line;
  /** Lifetime pizzas sold here, a whole number (drives story triggers). */
  sold: number;
  /** Decor tier (0–3) per category; each tier owned adds DECOR_BOOST to prices here. */
  decor: Record<DecorKind, number>;
  /** This neighbourhood's finale perk (CityDef.perks) has been earned. */
  perk: boolean;
}

export interface GameState {
  saveVersion: number;
  /** Which city this save is in (CityDef.id, src/content/cities): every engine function reads its tables with `cityOf(g)`. Saves from before cities are 'home'. */
  city: string;
  /** C106: which economy this save was made under (ECONOMY). */
  economy: number;
  cash: number;
  totalEarned: number;
  /** City-wide fleet tier: index into the city's `fit.vehicles`. */
  vehicle: number;
  shops: Record<NeighborhoodId, Shop>;
  /** Pizzeria shown on the main screen. */
  active: NeighborhoodId;
  dronesUnlocked: boolean;
  cityComplete: boolean;
  seenScenes: string[];
  /** How many scenes had been seen when the Scrapbook was last opened (drives the badge). */
  scrapbookViewed: number;
  lastSavedAt: number;
  /** Seconds of foreground play (offline time doesn't count). Paces the story. */
  playSeconds: number;
  /** playSeconds when each scene was seen. */
  sceneAt: Record<string, number>;
  /** Nonna's guided tutorial step (tutorial.ts): 0 = not started, TUTORIAL_DONE = finished. */
  tutorial: number;
  /** Daily and weekly tasks, the gift calendar, boosts and diamonds (rules in rewards.ts). */
  rewards: Rewards;
  /** Lifetime counters that task progress is measured against (progress = counter − the task's base). */
  stats: Stats;
  /** The golden pizza's schedule (rules in bonus.ts). */
  bonus: BonusState;
  /** Special orders from the cast (rules in orders.ts). */
  order: OrderState;
  /** Nonna's night oven: the tier owned (index into NIGHT_OVEN.capSeconds, 0 = the base cap). Rules in night-oven.ts. */
  nightOven: number;
  /** Feature slices (features/): each registered feature keeps its state at `x[feature.key]`. */
  x: Record<string, unknown>;
}

/** The golden pizza. Times are play seconds, so the schedule only runs while the game is open. */
export interface BonusState {
  /** Fixes every gap and flight path (hashed with `spawned`), so the schedule is the same on every replay. */
  seed: number;
  /** Golden pizzas that have appeared; the one on screen is number `spawned`. */
  spawned: number;
  /** playSeconds when the next one appears. */
  next: number;
  /** playSeconds when the one on screen leaves; 0 = none on screen. */
  until: number;
}

/** An order on the table, not yet accepted. */
export interface OrderOffer {
  hood: NeighborhoodId;
  /** Pies to sell. */
  target: number;
  /** Seconds the offer still waits. */
  left: number;
  /** Which of the character's two lines. */
  variant: 0 | 1;
}

/** An accepted order: sell `target` pies in `hood`'s shop before `left` runs out. */
export interface ActiveOrder {
  hood: NeighborhoodId;
  target: number;
  /** The shop's lifetime `sold` when it was accepted: progress = sold − startSold. */
  startSold: number;
  /** Seconds left. */
  left: number;
  variant: 0 | 1;
}

/** How the last order ended, shown on the chip for `left` more seconds (not saved). */
export interface OrderResult {
  kind: 'done' | 'failed';
  hood: NeighborhoodId;
  /** Cash paid (0 when failed). */
  reward: number;
  left: number;
  variant: 0 | 1;
}

export interface OrderState {
  seed: number;
  /** Orders offered so far: who asks next and which line they use. */
  made: number;
  /** playSeconds when the next offer appears. */
  nextAt: number;
  offer: OrderOffer | null;
  active: ActiveOrder | null;
  result: OrderResult | null;
}

/** One daily or weekly task. The target is fixed when it is generated. */
export interface Task {
  kind: TaskKind;
  target: number;
  /** The kind's counter when the task was generated. */
  base: number;
  claimed: boolean;
}

export interface Booster {
  mult: number;
  seconds: number;
}

export interface Boost {
  mult: number;
  /** Wall-clock ms when it ends. */
  until: number;
  source: string;
}

export interface Rewards {
  /** Local YYYY-MM-DD of the current daily set ('' = none yet). */
  day: string;
  daily: Task[];
  points: number;
  chests: boolean[];
  rerollUsed: boolean;
  /** The Monday's YYYY-MM-DD of the current weekly set. */
  week: string;
  weekly: Task[];
  weeklyChest: boolean;
  gift: { streak: number; last: string; saveUsed: boolean; cycle: number };
  /** The day the gift calendar last opened by itself. */
  giftShownDay: string;
  diamonds: number;
  /** Boosters waiting to be started. */
  boosters: Booster[];
  /** Boosts running now. */
  boosts: Boost[];
  cosmetics: string[];
  /** The owned cosmetics currently worn (rewards.ts `wear`); at most one per part (`cosmeticPart`). */
  worn: string[];
  /** Highest device time (ms) seen: the clock-rollback guard. */
  lastSeen: number;
}

export interface Stats {
  upgrades: number;
  ovens: number;
  hires: number;
  builds: number;
  fleet: number;
  decor: number;
  walkins: number;
  deliveries: number;
  baked: number;
  offline: number;
  boosters: number;
  dailyDone: number;
  days: number;
  /** Golden pizzas tapped (every 5th is the lucky slice). */
  bonusTaps: number;
  /** Special orders finished in time. */
  ordersDone: number;
}
export const STAT_KEYS: readonly (keyof Stats)[] = [
  'upgrades',
  'ovens',
  'hires',
  'builds',
  'fleet',
  'decor',
  'walkins',
  'deliveries',
  'baked',
  'offline',
  'boosters',
  'dailyDone',
  'days',
  'bonusTaps',
  'ordersDone',
];

export const newStats = (): Stats => ({
  upgrades: 0,
  ovens: 0,
  hires: 0,
  builds: 0,
  fleet: 0,
  decor: 0,
  walkins: 0,
  deliveries: 0,
  baked: 0,
  offline: 0,
  boosters: 0,
  dailyDone: 0,
  days: 0,
  bonusTaps: 0,
  ordersDone: 0,
});

/** A starting seed from the clock (a save keeps its own). */
const seedOf = (now: number) => Math.abs(Math.floor(now)) % 2147483647;
export const newBonus = (now: number): BonusState => ({ seed: seedOf(now), spawned: 0, next: BONUS.firstAtPlay, until: 0 });
export const newOrders = (now: number): OrderState => ({
  seed: seedOf(now + 7919),
  made: 0,
  nextAt: ORDER.firstOfferAtPlay,
  offer: null,
  active: null,
  result: null,
});
export const newRewards = (): Rewards => ({
  day: '',
  daily: [],
  points: 0,
  chests: DAILY_CHESTS.map(() => false),
  rerollUsed: false,
  week: '',
  weekly: [],
  weeklyChest: false,
  gift: { streak: 0, last: '', saveUsed: false, cycle: 0 },
  giftShownDay: '',
  diamonds: 0,
  boosters: [],
  boosts: [],
  cosmetics: [],
  worn: [],
  lastSeen: 0,
});

/**
 * 1 + Σ(mult − 1) over the boosts running at `now` (boosts add, they don't multiply).
 * A clock behind `lastSeen` gets no boost, so winding it back can't stretch one.
 */
export function boostMult(s: GameState, now: number): number {
  const r = s.rewards;
  if (!r.boosts.length || now < r.lastSeen) return 1;
  return r.boosts.reduce((m, b) => (b.until > now ? m + (b.mult - 1) : m), 1);
}

/** The tutorial's step after its last (tutorial.ts reads it from here to avoid an import cycle). */
export const TUTORIAL_DONE = 16;

/** A tutorial step of a save from before v7 (nine steps, done = 10) as the step of the same moment in the 15-step script: 1..6 keep, 7 (again) → 9, 8 (buy the ovens) → 10, 9 (hire Marco) → 14, 10 (done) → 16. */
export const legacyTutorial = (t: number): number => (t <= 6 ? t : ([9, 10, 14, 16] as const)[Math.min(t, 10) - 7]);

export const newDecor = (): Record<DecorKind, number> => ({ plants: 0, flooring: 0, tables: 0, walls: 0, signage: 0 });

export const noHeads = (): Record<HeadKind, boolean> => ({ prep: false, oven: false, counter: false });
export const allHeads = (): Record<HeadKind, boolean> => ({ prep: true, oven: true, counter: true });

export function newShop(built = false): Shop {
  return {
    built,
    managed: false,
    heads: noHeads(),
    prep: 1,
    ovens: 1,
    grade: 0,
    counter: 1,
    drivers: 1,
    tables: 1,
    footprint: 0,
    line: emptyLine(),
    sold: 0,
    decor: newDecor(),
    perk: false,
  };
}

/** The first neighbourhood of a city: built from the start, its founder takes over in the tutorial. */
export const firstHood = (city: CityDef): NeighborhoodId => city.neighbourhoods[0].id;

export function newGame(now: number, cityId: string = HOME_ID): GameState {
  const city = cityOf({ city: cityId });
  const first = firstHood(city);
  const shops = Object.fromEntries(hoodIds(city).map((id) => [id, newShop(id === first)])) as Record<NeighborhoodId, Shop>;
  return {
    saveVersion: SAVE_VERSION,
    city: city.id,
    economy: ECONOMY,
    cash: 0,
    totalEarned: 0,
    vehicle: 0,
    shops,
    active: first,
    dronesUnlocked: false,
    cityComplete: false,
    seenScenes: [],
    scrapbookViewed: 0,
    lastSavedAt: now,
    playSeconds: 0,
    sceneAt: {},
    tutorial: 0,
    rewards: newRewards(),
    stats: newStats(),
    bonus: newBonus(now),
    order: newOrders(now),
    nightOven: 0,
    x: Object.fromEntries(FEATURES.map((f) => [f.key, f.init(now, city)])),
  };
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const int = (v: unknown, d: number, min: number, max = Number.MAX_SAFE_INTEGER) => Math.min(max, Math.max(min, Math.floor(num(v, d))));
/** Cash for "what would this purchase add?" checks: above any price in the game (MAX_SAFE_INTEGER was not: Uptown prices pass 9e15). */
const WHAT_IF_CASH = 1e300;

/** A saved line, checked field by field; anything malformed starts empty (keeping the id counter moving). */
function migrateLine(raw: unknown, queued: number): Line {
  const base = emptyLine();
  const nat = (v: unknown) => Math.max(0, Math.floor(num(v, 0)));
  const jobOf = (v: unknown) => {
    if (!v || typeof v !== 'object') return null;
    const j = v as Record<string, unknown>;
    const n = nat(j.n);
    const total = num(j.total, 0);
    return n > 0 && total > 0 ? { n, total, left: Math.min(total, Math.max(0, num(j.left, 0))) } : null;
  };
  // v3: queued tap batches become pies on the bench
  if (!raw || typeof raw !== 'object') return { ...base, prepped: Math.min(LINE.prepBuffer, Math.ceil(queued)) };
  const l = raw as Record<string, unknown>;
  const deps = Array.isArray(l.departures) ? (l.departures as Record<string, unknown>[]) : [];
  const departures = deps
    .filter((d) => d && typeof d === 'object' && nat(d.n) > 0)
    .slice(0, LINE.maxDepartures)
    .map((d) => {
      const kind = d.kind === 'walkin' ? ('walkin' as const) : ('driver' as const);
      const max = kind === 'walkin' ? LINE.handoffSeconds : LINE.departSeconds;
      return { id: nat(d.id), kind, n: nat(d.n), cash: Math.max(0, num(d.cash, 0)), left: Math.min(max, Math.max(0, num(d.left, 0))) };
    });
  return {
    prep: jobOf(l.prep),
    oven: jobOf(l.oven),
    counter: jobOf(l.counter),
    prepped: nat(l.prepped),
    baked: nat(l.baked),
    boxed: nat(l.boxed),
    driverBusy: Math.min(LINE.driverLap, Math.max(0, num(l.driverBusy, 0))),
    walkinBusy: Math.min(LINE.walkinLap, Math.max(0, num(l.walkinBusy, 0))),
    departures,
    walkInDebt: clampWalkInDebt(num(l.walkInDebt, 0)),
    // ids only grow, so the scene's "highest id seen" never misses a pop (C69)
    nextId: Math.max(1, nat(l.nextId), ...departures.map((d) => d.id + 1)),
  };
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const dateKey = (v: unknown) => (typeof v === 'string' && DATE_KEY.test(v) ? v : '');
const MAX_MULT = 100;

function migrateTasks(v: unknown, max: number): Task[] {
  if (!Array.isArray(v)) return [];
  const out: Task[] = [];
  for (const x of v.slice(0, max)) {
    if (!x || typeof x !== 'object') continue;
    const t = x as Record<string, unknown>;
    if (!TASK_KINDS.includes(t.kind as TaskKind)) continue;
    const target = int(t.target, 0, 0);
    if (target < 1) continue;
    out.push({ kind: t.kind as TaskKind, target, base: Math.max(0, num(t.base, 0)), claimed: !!t.claimed });
  }
  return out;
}

/** Saved rewards, checked field by field; anything malformed falls back to its empty value (v4 saves have none). */
function migrateRewards(raw: unknown, now: number): Rewards {
  const base = newRewards();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const daily = migrateTasks(r.daily, DAILY_TASK_COUNT);
  const weekly = migrateTasks(r.weekly, WEEKLY_TASK_COUNT);
  const g = (r.gift && typeof r.gift === 'object' ? r.gift : {}) as Record<string, unknown>;
  const chests = Array.isArray(r.chests) ? (r.chests as unknown[]) : [];
  const boosters = (Array.isArray(r.boosters) ? (r.boosters as unknown[]) : []).slice(0, MAX_BOOSTERS).flatMap((x) => {
    const b = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const seconds = num(b.seconds, 0);
    return seconds > 0 ? [{ mult: Math.min(MAX_MULT, Math.max(1, num(b.mult, 1))), seconds: Math.min(30 * 86400, seconds) }] : [];
  });
  const boosts = (Array.isArray(r.boosts) ? (r.boosts as unknown[]) : []).slice(0, MAX_CONCURRENT_BOOSTS).flatMap((x) => {
    const b = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const until = num(b.until, 0);
    return until > 0
      ? [
          {
            mult: Math.min(MAX_MULT, Math.max(1, num(b.mult, 1))),
            until: Math.min(until, now + BOOST_MAX_AHEAD_MS),
            source: typeof b.source === 'string' ? b.source.slice(0, 40) : 'boost',
          },
        ]
      : [];
  });
  const cosmetics = Array.isArray(r.cosmetics)
    ? [...new Set((r.cosmetics as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 40))].slice(0, 200)
    : [];
  // worn: a save from before worn cosmetics wore everything it owned, so it keeps doing so (the latest of each part)
  const savedWorn = Array.isArray(r.worn) ? (r.worn as unknown[]).filter((x): x is string => typeof x === 'string' && cosmetics.includes(x)) : cosmetics;
  const worn: string[] = [];
  for (const id of savedWorn) if (!worn.includes(id)) worn.splice(0, worn.length, ...worn.filter((w) => cosmeticPart(w) !== cosmeticPart(id)), id);
  return {
    // a set with no usable tasks is dropped with its day, so the next refresh rolls a fresh one
    day: daily.length ? dateKey(r.day) : '',
    daily: dateKey(r.day) ? daily : [],
    points: int(r.points, 0, 0, 1000),
    chests: DAILY_CHESTS.map((_, i) => chests[i] === true),
    rerollUsed: !!r.rerollUsed,
    week: weekly.length ? dateKey(r.week) : '',
    weekly: dateKey(r.week) ? weekly : [],
    weeklyChest: !!r.weeklyChest,
    gift: { streak: int(g.streak, 0, 0, 30), last: dateKey(g.last), saveUsed: !!g.saveUsed, cycle: int(g.cycle, 0, 0, 100000) },
    giftShownDay: dateKey(r.giftShownDay),
    diamonds: int(r.diamonds, 0, 0, 1e9),
    boosters,
    boosts,
    cosmetics,
    worn,
    // a corrupt far-future value would lock rewards for good; a year of rollback headroom is plenty
    lastSeen: Math.min(now + 400 * 86400_000, Math.max(0, num(r.lastSeen, 0))),
  };
}

function migrateStats(raw: unknown): Stats {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return Object.fromEntries(STAT_KEYS.map((k) => [k, int(r[k], 0, 0)])) as unknown as Stats;
}

/**
 * The golden pizza's saved schedule. A new session starts its first pizza BONUS.firstAtPlay seconds in (never sooner,
 * and a saved value far in the future is pulled back to the longest gap). The one on screen when the game closed is
 * kept for its remaining flight; bonus.ts `bonusAway` takes the time away off it.
 */
function migrateBonus(raw: unknown, play: number, now: number): BonusState {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const until = num(b.until, 0);
  return {
    seed: int(b.seed, seedOf(now), 0, 2147483647),
    spawned: int(b.spawned, 0, 0, 1e9),
    next: Math.min(play + Math.max(BONUS.gapMax, BONUS.firstAtPlay), Math.max(play + BONUS.firstAtPlay, num(b.next, 0))),
    until: until > play ? Math.min(until, play + BONUS.visibleSeconds) : 0,
  };
}

/**
 * The saved orders: the next-offer time (a new session waits ORDER.firstOfferAtPlay), the order in progress and the
 * offer on the table, each with the seconds it has left. Anything malformed is dropped; orders.ts `returnFromAway`
 * takes the time away off them. The result flash is never saved.
 */
function migrateOrders(raw: unknown, play: number, now: number, shops: Record<NeighborhoodId, Shop>): OrderState {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null);
  const hoodOf = (v: unknown) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(shops, v) ? v : null);
  const variantOf = (v: unknown): 0 | 1 => (v === 1 ? 1 : 0);
  const offerRaw = obj(o.offer);
  const activeRaw = obj(o.active);
  const offerHood = offerRaw ? hoodOf(offerRaw.hood) : null;
  const activeHood = activeRaw ? hoodOf(activeRaw.hood) : null;
  const offer: OrderOffer | null =
    offerRaw && offerHood && shops[offerHood].built && num(offerRaw.left, 0) > 0 && int(offerRaw.target, 0, 0) >= 1
      ? {
          hood: offerHood,
          target: int(offerRaw.target, 0, 0, 1e15),
          left: Math.min(ORDER.offerWaitSeconds, num(offerRaw.left, 0)),
          variant: variantOf(offerRaw.variant),
        }
      : null;
  const active: ActiveOrder | null =
    activeRaw && activeHood && shops[activeHood].built && num(activeRaw.left, 0) > 0 && int(activeRaw.target, 0, 0) >= 1
      ? {
          hood: activeHood,
          target: int(activeRaw.target, 0, 0, 1e15),
          // never ahead of the shop's own count, so a corrupt value can't finish the order for free
          startSold: Math.min(shops[activeHood].sold, int(activeRaw.startSold, 0, 0)),
          left: Math.min(ORDER.windowSeconds, num(activeRaw.left, 0)),
          variant: variantOf(activeRaw.variant),
        }
      : null;
  return {
    seed: int(o.seed, seedOf(now + 7919), 0, 2147483647),
    made: int(o.made, 0, 0, 1e9),
    nextAt: Math.min(play + Math.max(ORDER.gapSeconds, ORDER.firstOfferAtPlay), Math.max(play + ORDER.firstOfferAtPlay, num(o.nextAt, 0))),
    // one thing at a time: an order in progress wins over an offer
    offer: active ? null : offer,
    active,
    result: null,
  };
}

/** Load any save (v1 single-shop, v2, v3, v4, v5 or v6) over a fresh game so missing fields get defaults. */
export function migrate(raw: unknown, now: number): GameState {
  if (!raw || typeof raw !== 'object') return newGame(now);
  const r = raw as Record<string, unknown>;
  // a save from before cities has no `city`: it is the home city's. An id this build does not know loads as home too.
  const city = cityOf({ city: typeof r.city === 'string' && Object.prototype.hasOwnProperty.call(CITIES, r.city) ? r.city : HOME_ID });
  const base = newGame(now, city.id);
  const ids = hoodIds(city);
  const first = firstHood(city);
  const seen = Array.isArray(r.seenScenes) ? (r.seenScenes as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  const game: GameState = {
    ...base,
    // C106: a save without the marker is from before it existed (economy 2); one that has it keeps its own
    economy: int(r.economy, ECONOMY_BEFORE_MARKER, 0),
    cash: Math.max(0, num(r.cash, 0)),
    totalEarned: Math.max(0, num(r.totalEarned, 0)),
    vehicle: int(r.vehicle, 0, 0, city.fit.vehicles.length - 1),
    active: ids.includes(r.active as NeighborhoodId) ? (r.active as NeighborhoodId) : first,
    dronesUnlocked: !!r.dronesUnlocked,
    cityComplete: !!r.cityComplete,
    seenScenes: seen,
    // Saves from before the badge existed: treat everything already seen as viewed.
    scrapbookViewed: int(r.scrapbookViewed, seen.length, 0),
    lastSavedAt: num(r.lastSavedAt, now),
    playSeconds: Math.max(0, num(r.playSeconds, 0)),
    sceneAt:
      r.sceneAt && typeof r.sceneAt === 'object'
        ? Object.fromEntries(
            Object.entries(r.sceneAt as Record<string, unknown>).filter((e): e is [string, number] => typeof e[1] === 'number' && Number.isFinite(e[1])),
          )
        : {},
    rewards: migrateRewards(r.rewards, now),
    stats: migrateStats(r.stats),
  };
  if (r.shops && typeof r.shops === 'object') {
    for (const id of ids) {
      const s = (r.shops as Record<string, Record<string, unknown>>)[id];
      if (!s || typeof s !== 'object') continue;
      const managed = !!s.managed;
      const h = (s.heads ?? {}) as Record<string, unknown>;
      game.shops[id] = {
        built: id === first || !!s.built,
        managed,
        // v3 saves: a managed shop already ran every station, so it keeps all three heads
        heads: managed ? allHeads() : { prep: !!h.prep, oven: !!h.oven, counter: !!h.counter },
        prep: int(s.prep, 1, 1),
        ovens: int(s.ovens, 1, 1),
        grade: int(s.grade, 0, 0, city.fit.ovenGrades.length - 1),
        counter: int(s.counter, 1, 1),
        drivers: int(s.drivers, 1, 1),
        tables: int(s.tables, 1, 1),
        footprint: int(s.footprint, 0, 0, city.fit.footprints.length - 1),
        line: migrateLine(s.line, Math.max(0, num(s.queued, 0))),
        decor: Object.fromEntries(DECOR_KINDS.map((k) => [k, int((s.decor as Record<string, unknown> | undefined)?.[k], 0, 0, 3)])) as Record<
          DecorKind,
          number
        >,
        sold: Math.floor(Math.max(0, num(s.sold, 0))),
        // v2 saves: a finale already seen earns its perk (v3.7)
        perk: !!s.perk || (!!city.perks[id] && seen.includes(finaleId(id))),
      };
    }
  } else {
    // v1 save: one shop delivering to several neighborhoods. Its oven and drivers become Downtown's,
    // and every neighborhood it delivered to gets a starter pizzeria.
    const unlocked = Array.isArray(r.unlocked) ? (r.unlocked as string[]) : [];
    const delivered = (r.delivered ?? {}) as Record<string, number>;
    for (const id of ids) {
      if (id === first || unlocked.includes(id)) game.shops[id] = { ...newShop(true), sold: Math.floor(Math.max(0, num(delivered[id], 0))) };
    }
    const d = game.shops[first];
    d.ovens = Math.min(levelCap(d), int(r.ovenLevel, 1, 1));
    d.drivers = int(r.drivers, 1, 1);
    d.managed = !!r.autoBake;
    if (d.managed) d.heads = allHeads();
  }
  game.shops[first].built = true;
  if (!game.shops[game.active].built) game.active = first;
  // saves from before the tutorial: anyone who has sold pizza (or has Nonna running Downtown) skips it
  const veteran = game.shops[first].sold > 0 || game.shops[first].managed;
  // a save from before v7 counts the old nine steps: renumber it; a v7 save keeps its own
  const oldSteps = num(r.saveVersion, 0) < 7;
  game.tutorial = oldSteps ? legacyTutorial(int(r.tutorial, veteran ? 10 : 0, 0, 10)) : int(r.tutorial, veteran ? TUTORIAL_DONE : 0, 0, TUTORIAL_DONE);
  // a first shop that runs itself is past the tutorial, whatever step the save was at (no overlay is drawn on it, so a look step could never end)
  if (game.tutorial >= 1 && game.shops[first].managed) game.tutorial = TUTORIAL_DONE;
  game.bonus = migrateBonus(r.bonus, game.playSeconds, now);
  game.order = migrateOrders(r.order, game.playSeconds, now, game.shops);
  // saves from before the night oven have none: the base cap
  game.nightOven = int(r.nightOven, 0, 0, NIGHT_OVEN.capSeconds.length - 1);
  // feature slices: a save without `x` (or without a feature's key) gets that feature's defaults. A key no feature owns is kept as it
  // was (C117): a registry that is empty or short (a module loaded in the wrong order, a feature behind a flag) must not delete a
  // player's saved layer state at the next save.
  const savedX = (r.x && typeof r.x === 'object' && !Array.isArray(r.x) ? r.x : {}) as Record<string, unknown>;
  if (!FEATURES.length && typeof __DEV__ !== 'undefined' && __DEV__)
    console.warn('migrate: no features are registered (import engine/features before loading a game)');
  game.x = { ...savedX, ...Object.fromEntries(FEATURES.map((f) => [f.key, f.migrate(savedX[f.key], now, city)])) };
  // the chapters' progress (v5.21) is no feature's slice: it is there once there is something to keep, checked field by field
  const chapters = migrateChapterSave(savedX[CHAPTERS_KEY]);
  if (chapters) game.x[CHAPTERS_KEY] = chapters;
  else delete game.x[CHAPTERS_KEY];
  const fromVersion = num(r.saveVersion, 0);
  return migrateChapters(migrateStory(game, fromVersion), fromVersion);
}

/** Scene ids are `<neighbourhood>-<beat>` (pinned by a test); a neighbourhood's finale is beat 4. */
export const sceneId = (id: NeighborhoodId, beat: 1 | 2 | 3 | 4) => `${id}-${beat}`;
export const finaleId = (id: NeighborhoodId) => sceneId(id, 4);

// ---------- Formulas ----------

export function upgradeCost(baseCost: number, timesBought: number, growth: number = TUNING.costGrowth): number {
  return Math.ceil(baseCost * Math.pow(growth, timesBought));
}

/** A station's price for its next level: its base cost × the shop's cost multiplier, growing by the station's own `growth` per level bought (STATIONS; else TUNING.costGrowth). */
export const stationCost = (id: NeighborhoodId, key: keyof typeof STATIONS, timesBought: number, city: CityDef = cityOfHood(id)): number =>
  upgradeCost(STATIONS[key].cost * def(id, city).costMult, timesBought, STATIONS[key].growth ?? TUNING.costGrowth);

export function milestoneMultiplier(level: number): number {
  return TUNING.milestones.reduce((m, at) => (level >= at ? m * 2 : m), 1);
}

/** Next milestone level above `level`, or null when all are passed. */
export function nextMilestone(level: number): number | null {
  return TUNING.milestones.find((at) => at > level) ?? null;
}

/** The city whose neighbourhood `id` is (A35): a Boston id never reads the home city's tables. Throws for an id no pack has (`findHood` is the lookup that returns undefined). */
export const cityOfHood = (id: NeighborhoodId): CityDef => {
  const city = cityHolding(id);
  if (!city) throw new Error(`Unknown neighbourhood "${id}": no city has it`);
  return city;
};

/** A neighbourhood's tables: in `city` when one is passed (`def(id, cityOf(g))`), else in the city that has the id. Total over the ids a city has; throws for one it has not. */
export const def = (id: NeighborhoodId, city: CityDef = cityOfHood(id)): NeighborhoodDef => {
  const found = findHood(id, city);
  if (!found) throw new Error(`Unknown neighbourhood "${id}" in ${city.id}`);
  return found;
};

/** Prep, ovens and counter can't level past this until the footprint grows. */
export const levelCap = (shop: Shop) => TUNING.levelsPerFootprint * (shop.footprint + 1);

/** What the registered features multiply in one shop right now (features/types.ts `shopValueMult`, `shopDemandMult`). */
export interface FeatureMults {
  /** × the value per pizza. */
  value: number;
  /** × the demand rate (drivers and walk-ins). */
  demand: number;
  /** × each station's own rate (features/types.ts `stationMult`: a jammed oven, a slower recipe). Absent when no feature touches a station. */
  stations?: StationMults;
}
/** A multiplier per kitchen station (1 = untouched). */
export interface StationMults {
  prep: number;
  oven: number;
  counter: number;
}
const NO_FX: FeatureMults = Object.freeze({ value: 1, demand: 1 });

/**
 * The product of every feature's multipliers for one shop (1 and 1 with no features). `now` is wall ms and is required (C111): a
 * hook such as the events' decides by it whether the app has been open. The readouts that have no clock (`shopEarnings(s, id)`)
 * pass `readoutNow`: the event's stamp while one runs (so they show it steadily), else the save time; a screen that wants a later
 * clock in its number passes the store's `tickAt`.
 */
export function featureMults(s: GameState, id: NeighborhoodId, now: number): FeatureMults {
  if (!FEATURES.length) return NO_FX;
  let demand = 1;
  for (const f of FEATURES) if (f.shopDemandMult) demand *= f.shopDemandMult(s, id, now);
  const stations = stationMults(s, id, now);
  // the value hooks come last and see the demand and stations (U17): the service feature prices the flow from them, with no hook run twice
  const seen = { demand, stations };
  let value = 1;
  for (const f of FEATURES) if (f.shopValueMult) value *= f.shopValueMult(s, id, now, seen);
  return stations ? { value, demand, stations } : { value, demand };
}

/** The product of every feature's `stationMult` for one shop, or undefined when none of them changes a station (A32). */
export function stationMults(s: GameState, id: NeighborhoodId, now: number): StationMults | undefined {
  let out: StationMults | undefined;
  for (const f of FEATURES) {
    const m = f.stationMult?.(s, id, now);
    if (!m) continue;
    out ??= { prep: 1, oven: 1, counter: 1 };
    out = { prep: out.prep * (m.prep ?? 1), oven: out.oven * (m.oven ?? 1), counter: out.counter * (m.counter ?? 1) };
  }
  return out;
}

const levelSpeed = (base: number, level: number) => base * (1 + TUNING.speedPerLevel * (level - 1)) * milestoneMultiplier(level);

/** Room to work: each expansion speeds up prep and the counter. */
export const footprintMult = (shop: Shop) => Math.pow(TUNING.footprintBoost, shop.footprint);
export const prepRate = (shop: Shop, fx: FeatureMults = NO_FX) => levelSpeed(STATIONS.prep.speed, shop.prep) * footprintMult(shop) * (fx.stations?.prep ?? 1);
export const ovenRate = (shop: Shop, fit: CityFit, fx: FeatureMults = NO_FX) =>
  levelSpeed(STATIONS.ovens.speed, shop.ovens) * fit.ovenGrades[shop.grade].mult * (fx.stations?.oven ?? 1);
export const counterRate = (shop: Shop, fx: FeatureMults = NO_FX) =>
  levelSpeed(STATIONS.counter.speed, shop.counter) * footprintMult(shop) * (fx.stations?.counter ?? 1);
// R1: the rates that read a city's tables take its `CityFit` (`cityOf(s).fit`), right after the shop and the fleet tier and before the optional `fx`.
export const tripSeconds = (vehicle: number, fit: CityFit) => TUNING.deliveryRoundTrip / fit.vehicles[vehicle].speed;
export const tripCapacity = (shop: Shop, vehicle: number, fit: CityFit) => fit.vehicles[vehicle].capacity * milestoneMultiplier(shop.drivers);
export const deliveryRate = (shop: Shop, vehicle: number, fit: CityFit) => (shop.drivers * tripCapacity(shop, vehicle, fit)) / tripSeconds(vehicle, fit);
export const walkInRate = (shop: Shop) => levelSpeed(STATIONS.tables.speed, shop.tables);
/** Tables drawn in the cutaway: grows with seating level, limited by the footprint. */
export const tablesShown = (shop: Shop, fit: CityFit) => Math.min(fit.footprints[shop.footprint].maxTables, 1 + Math.floor((shop.tables - 1) / 6));
export const demandRate = (shop: Shop, vehicle: number, fit: CityFit, fx: FeatureMults = NO_FX) =>
  (deliveryRate(shop, vehicle, fit) + walkInRate(shop)) * fx.demand;

/** Pizzas per second this pizzeria sells when running. */
export function shopRate(shop: Shop, vehicle: number, fit: CityFit, fx: FeatureMults = NO_FX): number {
  return Math.min(prepRate(shop, fx), ovenRate(shop, fit, fx), counterRate(shop, fx), demandRate(shop, vehicle, fit, fx));
}

/**
 * How the kitchen's pies split at the steady state: walk-ins are seated first, up to the seating rate
 * (walkInRate); the drivers deliver the rest. One rule for revenue, value per pizza and the walk-in fraction.
 */
function pieSplit(shop: Shop, vehicle: number, fit: CityFit, fx: FeatureMults = NO_FX): { sold: number; walkIns: number; delivered: number } {
  const sold = shopRate(shop, vehicle, fit, fx);
  const walkIns = Math.min(sold, walkInRate(shop) * fx.demand);
  return { sold, walkIns, delivered: sold - walkIns };
}

/**
 * Who is left waiting at the steady state, for the street scene (v5.11). Both counts come from the same `pieSplit`:
 *   - diners: walk-ins who want a seat but the kitchen can't feed (the seating rate minus the walk-ins served), as
 *     quarters of a full line, 0..4; 0 when the kitchen keeps up with the seats;
 *   - drivers: drivers with nothing to carry (the delivered share of the fleet's capacity left over). Not capped: the
 *     scene draws up to 3 and a "×N waiting" tag for the rest.
 */
export function queueSizes(shop: Shop, vehicle: number, fit: CityFit): { diners: number; drivers: number } {
  const { walkIns, delivered } = pieSplit(shop, vehicle, fit);
  const seats = walkInRate(shop);
  const fleet = deliveryRate(shop, vehicle, fit);
  const unmet = seats > 0 ? (seats - walkIns) / seats : 0;
  const idle = fleet > 0 ? shop.drivers * (1 - delivered / fleet) : 0;
  return { diners: Math.max(0, Math.min(4, Math.ceil(4 * unmet))), drivers: Math.max(0, Math.round(idle)) };
}

/**
 * Seating levels past the footprint's indoor cap put tables out on the sidewalk, up to two (v5.11). Purely visual:
 * it never changes `walkInRate`.
 */
export const patioTables = (shop: Shop, fit: CityFit) =>
  Math.max(0, Math.min(2, 1 + Math.floor((shop.tables - 1) / 6) - fit.footprints[shop.footprint].maxTables));

/**
 * Cash per second a running pizzeria makes. Walk-ins get the kitchen's pies first, up to the seating rate
 * (they pay walkInShare of the price, 1.0 by default); drivers deliver the rest at full price.
 */
export function shopRevenue(id: NeighborhoodId, shop: Shop, vehicle: number, fx: FeatureMults = NO_FX, city: CityDef = cityOfHood(id)): number {
  const { walkIns, delivered } = pieSplit(shop, vehicle, city.fit, fx);
  const perk = perkOf(id, shop, city);
  return (
    def(id, city).orderValue *
    (perk?.priceMult ?? 1) *
    decorMult(shop, id, city) *
    gmMult(shop) *
    fx.value *
    (delivered + walkIns * (perk?.walkInShare ?? TUNING.walkInShare))
  );
}

/** The General Manager's neighbourhood boost. */
export const gmMult = (shop: Shop) => (shop.managed ? GM_BOOST : 1);

/** This pizzeria's finale perk, once earned. */
export const perkOf = (id: NeighborhoodId, shop: Shop, city: CityDef = cityOfHood(id)) => (shop.perk ? city.perks[id] : undefined);

/** Nicer places charge more: +DECOR_BOOST per decor tier owned (Genevieve's perk raises it in Uptown). */
export const decorMult = (shop: Shop, id: NeighborhoodId, city: CityDef = cityOfHood(id)) =>
  1 + (perkOf(id, shop, city)?.decorBoost ?? DECOR_BOOST) * DECOR_KINDS.reduce((t, k) => t + (shop.decor?.[k] ?? 0), 0);

/** Average cash per pizza sold right now. */
export function valuePerPizza(id: NeighborhoodId, shop: Shop, vehicle: number, fx: FeatureMults = NO_FX, city: CityDef = cityOfHood(id)): number {
  const sold = shopRate(shop, vehicle, city.fit, fx);
  return sold > 0
    ? shopRevenue(id, shop, vehicle, fx, city) / sold
    : def(id, city).orderValue * (perkOf(id, shop, city)?.priceMult ?? 1) * decorMult(shop, id, city) * gmMult(shop) * fx.value;
}

/**
 * The clock of a readout that has none (C116): a feature's stamp (an event running: the last foreground tick) or else the save time.
 * It used to be the save time alone, which jumps ahead of the stamp at every save, so an event's x1.5 showed after each save and
 * went again a moment later.
 */
function readoutNow(s: GameState): number {
  for (const f of FEATURES) {
    const at = f.readoutNow?.(s);
    if (at != null) return at;
  }
  return s.lastSavedAt;
}

/** Cash per second this pizzeria makes while running (managed, or while you keep tapping). */
export function shopEarnings(s: GameState, id: NeighborhoodId, now: number = readoutNow(s)): number {
  const shop = s.shops[id];
  if (!shop.built) return 0;
  return shopRevenue(id, shop, s.vehicle, featureMults(s, id, now), cityOf(s));
}

/** Every station runs on its own (a GM, or all three heads): the shop earns in the foreground without taps. */
export const runsItself = (shop: Shop) => shop.managed || allHeadsHired(shop);

/** Cash per second the city earns on its own in the foreground (pizzerias with a GM or all three heads, C68). */
export function earningsPerSecond(s: GameState): number {
  return hoodIds(cityOf(s)).reduce((t, id) => t + (s.shops[id].built && runsItself(s.shops[id]) ? shopEarnings(s, id) : 0), 0);
}

export type Stage = 'prep' | 'ovens' | 'counter' | 'customers';

/** Each stage's rate (one table for `bottleneck` and `tiedStages`, A21). */
export function stageRates(shop: Shop, vehicle: number, fit: CityFit): [Stage, number][] {
  return [
    ['prep', prepRate(shop)],
    ['ovens', ovenRate(shop, fit)],
    ['counter', counterRate(shop)],
    ['customers', demandRate(shop, vehicle, fit)],
  ];
}

/** Every stage tied for the slowest (an upgrade to one of them alone adds nothing). */
export function tiedStages(shop: Shop, vehicle: number, fit: CityFit): Stage[] {
  const rates = stageRates(shop, vehicle, fit);
  const min = Math.min(...rates.map((r) => r[1]));
  return rates.filter((r) => r[1] <= min * (1 + 1e-9)).map((r) => r[0]);
}

/** The slowest stage of a pizzeria's pipeline. */
export function bottleneck(shop: Shop, vehicle: number, fit: CityFit): Stage {
  return stageRates(shop, vehicle, fit).reduce((a, b) => (b[1] < a[1] ? b : a))[0];
}

// ---------- Purchases ----------

export type HeadUpgrade = 'headPrep' | 'headOven' | 'headCounter';
export type Upgrade = 'prep' | 'ovens' | 'counter' | 'drivers' | 'tables' | 'grade' | 'expand' | 'manager' | HeadUpgrade;
export const HEAD_UPGRADE: Record<HeadKind, HeadUpgrade> = { prep: 'headPrep', oven: 'headOven', counter: 'headCounter' };
const HEAD_OF: Record<HeadUpgrade, HeadKind> = { headPrep: 'prep', headOven: 'oven', headCounter: 'counter' };
export const isHeadUpgrade = (u: Upgrade): u is HeadUpgrade => u in HEAD_OF;
export const headOf = (u: HeadUpgrade): HeadKind => HEAD_OF[u];

/** What hiring a station head costs in this pizzeria. */
export const headCost = (id: NeighborhoodId, k: HeadKind, city: CityDef = cityOfHood(id)) =>
  id === firstHood(city) ? city.fit.headCostFirst[k] : Math.ceil(def(id, city).headsCost * HEAD_SHARE[k]);
export const allHeadsHired = (shop: Shop) => HEAD_KINDS.every((k) => shop.heads[k]);
export type BuyResult = { ok: true; state: GameState } | { ok: false; reason: string };

/** Cost of an upgrade in a pizzeria, or null when it's maxed/not available. */
export function upgradeCostOf(s: GameState, id: NeighborhoodId, what: Upgrade): number | null {
  const shop = s.shops[id];
  const city = cityOf(s);
  const m = def(id, city).costMult;
  const { ovenGrades, footprints } = city.fit;
  switch (what) {
    case 'prep':
      return stationCost(id, 'prep', shop.prep - 1, city);
    case 'ovens':
      return stationCost(id, 'ovens', shop.ovens - 1, city);
    case 'counter':
      return stationCost(id, 'counter', shop.counter - 1, city);
    case 'drivers':
      return Math.ceil(stationCost(id, 'drivers', shop.drivers - 1, city) * (perkOf(id, shop, city)?.driversCostMult ?? 1));
    case 'tables':
      return stationCost(id, 'tables', shop.tables - 1, city);
    case 'grade':
      return shop.grade + 1 < ovenGrades.length ? Math.ceil(ovenGrades[shop.grade + 1].cost * m) : null;
    case 'expand':
      return shop.footprint + 1 < footprints.length ? Math.ceil(footprints[shop.footprint + 1].cost * m) : null;
    case 'manager':
      return shop.managed ? null : def(id, city).managerCost;
    case 'headPrep':
    case 'headOven':
    case 'headCounter':
      return shop.heads[HEAD_OF[what]] ? null : headCost(id, HEAD_OF[what], city);
  }
}

/** Why an upgrade can't be bought right now (ignoring cash), or null if it can. */
export function upgradeLock(s: GameState, id: NeighborhoodId, what: Upgrade): string | null {
  const shop = s.shops[id];
  if (!shop.built) return 'Build this pizzeria first';
  const cap = levelCap(shop);
  const city = cityOf(s);
  const { ovenGrades, footprints } = city.fit;
  switch (what) {
    case 'prep':
    case 'ovens':
    case 'counter':
    case 'tables':
      return shop[what] >= cap ? (shop.footprint + 1 < footprints.length ? `Expand to go past Lv\u00A0${cap}` : 'Max level') : null;
    case 'grade':
      return shop.grade + 1 >= ovenGrades.length ? 'Finest ovens in town' : null;
    case 'expand':
      return shop.footprint + 1 >= footprints.length ? 'Biggest it gets' : null;
    case 'manager':
      if (shop.managed) return 'Hired';
      if (id === firstHood(city)) return founderCountdownText(s);
      return allHeadsHired(shop) ? null : 'Hire all three heads first';
    case 'headPrep':
    case 'headOven':
    case 'headCounter':
      return shop.heads[HEAD_OF[what]] ? 'Hired' : null;
    case 'drivers':
      // a save that already went past the cap (before the cap existed) quotes its own level, not the lower cap
      return shop.drivers >= cap ? (shop.footprint + 1 < footprints.length ? `Expand to hire past\u00A0${shop.drivers}` : 'Max drivers') : null;
  }
}

/**
 * X2 (v5.19-test): free buys. Module state like the clock offset: `setFreeBuys` does nothing unless the test build's switch is on (written out in
 * full so the normal build folds it to a no-op), so in the normal build the flag is always false and `canAfford`/`pay` are exactly the A36 rule.
 */
let freeBuys = false;
export function setFreeBuys(on: boolean): void {
  if (process.env.EXPO_PUBLIC_TEST_MODE === '1') freeBuys = on;
}
/** Whether free buys are on (the test panel's toggle reads it; always false in the normal build). */
export const freeBuysOn = (): boolean => freeBuys;

/** A36: the one affordability rule, for every model and view. A null cost (maxed, locked, nothing to buy) is never affordable. With free buys on (test build) any cost is. */
export const canAfford = (s: Pick<GameState, 'cash'>, cost: number | null | undefined): boolean => cost != null && (freeBuys || s.cash >= cost);

/** A36: the one way cash is spent: the state with the price taken out, or the refusal. With free buys on, the state comes back as it was (`totalEarned` and `stats` are never touched either way). */
export function pay(s: GameState, cost: number): BuyResult {
  if (!canAfford(s, cost)) return { ok: false, reason: 'Not enough cash' };
  if (freeBuys) return { ok: true, state: s };
  return { ok: true, state: { ...s, cash: s.cash - cost } };
}

/** X2: the diamonds' affordability rule, beside the cash one (diamonds live at `rewards.diamonds`); free buys apply to it too. */
export const canAffordDiamonds = (s: Pick<GameState, 'rewards'>, n: number | null | undefined): boolean => n != null && (freeBuys || s.rewards.diamonds >= n);

/** X2: spend `n` diamonds: the state with them taken out, or the refusal. With free buys on, the state comes back as it was. */
export function payDiamonds(s: GameState, n: number): BuyResult {
  if (!canAffordDiamonds(s, n)) return { ok: false, reason: 'Not enough diamonds' };
  if (freeBuys) return { ok: true, state: s };
  return { ok: true, state: { ...s, rewards: { ...s.rewards, diamonds: s.rewards.diamonds - n } } };
}

/** Add to the lifetime counters. When every count is 0 the `stats` object is kept as is (a quiet tick must not look like a change). */
const bump = (s: GameState, patch: Partial<Stats>): GameState => {
  const keys = (Object.keys(patch) as (keyof Stats)[]).filter((k) => (patch[k] ?? 0) !== 0);
  if (!keys.length) return s;
  const stats = { ...s.stats };
  for (const k of keys) stats[k] += patch[k] ?? 0;
  return { ...s, stats };
};

function withShop(s: GameState, id: NeighborhoodId, patch: Partial<Shop>): GameState {
  return { ...s, shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } } };
}

export function buyUpgrade(s: GameState, id: NeighborhoodId, what: Upgrade): BuyResult {
  const lock = upgradeLock(s, id, what);
  if (lock) return { ok: false, reason: lock };
  const cost = upgradeCostOf(s, id, what);
  if (cost === null) return { ok: false, reason: 'Maxed out' };
  const r = pay(s, cost);
  if (!r.ok) return r;
  const shop = s.shops[id];
  const patch: Partial<Shop> =
    what === 'grade'
      ? { grade: shop.grade + 1 }
      : what === 'expand'
        ? { footprint: shop.footprint + 1 }
        : what === 'manager'
          ? { managed: true, heads: allHeads() }
          : isHeadUpgrade(what)
            ? { heads: { ...shop.heads, [HEAD_OF[what]]: true } }
            : { [what]: shop[what] + 1 };
  const hired = what === 'manager' || isHeadUpgrade(what);
  return { ok: true, state: bump(withShop(r.state, id, patch), { upgrades: 1, ovens: what === 'ovens' || what === 'grade' ? 1 : 0, hires: hired ? 1 : 0 }) };
}

export function nextToBuild(s: GameState): NeighborhoodDef | null {
  return cityOf(s).neighbourhoods.find((n) => !s.shops[n.id].built) ?? null;
}

export function buildLock(s: GameState, id: NeighborhoodId): string | null {
  const hoods = cityOf(s).neighbourhoods;
  const idx = hoods.findIndex((n) => n.id === id);
  // an id from another city (a caller that walks the home list with a Boston save in hand) has no shop here: it is not buildable, and must not throw
  if (idx < 0) return 'Not in this city';
  if (s.shops[id].built) return 'Built';
  if (idx > 0 && !s.shops[hoods[idx - 1].id].built) return `Build in ${hoods[idx - 1].name} first`;
  // The first shop stops earning once the founder's tutorial is skipped past; keep the player there until she takes over (the second shop is the one that waits).
  if (idx === 1 && !s.seenScenes.includes(cityOf(s).fit.takeover.sceneId)) return founderCountdownText(s);
  return null;
}

/** Pizzas the first shop still has to deliver before Nonna takes over the kitchen (0 once it's due or seen). */
export function founderPizzasLeft(s: GameState): number {
  const city = cityOf(s);
  const { sceneId: scene, pizzas } = city.fit.takeover;
  if (s.seenScenes.includes(scene)) return 0;
  return Math.max(0, pizzas - s.shops[firstHood(city)].sold);
}

/** The first shop's founder by the name the countdown uses: the city's `founder` (Nonna at home), else its first manager ("Father Dom" in Boston) (C141). */
export function founderName(s: GameState): string {
  const city = cityOf(s);
  return city.founder?.name ?? city.managers[firstHood(city)]?.name ?? 'The founder';
}

export function founderCountdownText(s: GameState): string {
  const n = founderPizzasLeft(s);
  const who = founderName(s);
  // the scene can wait out the story gap after the count is reached, so the copy doesn't promise "now" (C43)
  return n > 0 ? `${who} takes over in ${pizzasLeft(n)} more pizza${n === 1 ? '' : 's'}` : `${who} takes over soon — keep baking`;
}

export function buildShop(s: GameState, id: NeighborhoodId): BuyResult {
  const lock = buildLock(s, id);
  if (lock) return { ok: false, reason: lock };
  const r = pay(s, def(id, cityOf(s)).buildCost);
  if (!r.ok) return r;
  return { ok: true, state: bump({ ...withShop(r.state, id, { built: true }), active: id }, { builds: 1 }) };
}

// ---------- The bid (the city's finale that is a purchase: Pier 9 at home, `CityDef.bid`) ----------

/** The bid is on offer once "Man Overboard" (waterfront-3b, which plays at the same pizza count) has played and Waterfront has sold enough pizzas. */
export function bidAvailable(s: GameState): boolean {
  const bid = cityOf(s).bid;
  if (!bid) return false;
  const w = s.shops[bid.hood];
  return w.built && !w.perk && s.seenScenes.includes(bid.afterScene) && w.sold >= bid.unlockPizzas;
}

/** What the bid costs now: the base bid times the live auction's multiplier (features/layers/waterfront-boats.ts `pier9AuctionMult`, the same number from the saved state: content/layers.ts). */
export const bidPrice = (s: GameState): number =>
  Math.ceil((cityOf(s).bid?.cost ?? 0) * auctionMult((s.x?.[LAYER_KEYS.boats] as { openedAt?: number } | undefined)?.openedAt ?? -1, s.playSeconds));

/** Place the bid (Pier 9: win the dock for Marisol): spends it and earns the bid shop's perk, which plays the finale. */
export function placeBid(s: GameState): BuyResult {
  const bid = cityOf(s).bid;
  if (!bid) return { ok: false, reason: t('bid.refused.none', {}, cityOf(s).id) };
  const vars = { bid: bid.name };
  if (s.shops[bid.hood].perk) return { ok: false, reason: t('bid.refused.saved', vars, cityOf(s).id) };
  if (!bidAvailable(s)) return { ok: false, reason: t('bid.refused.closed', vars, cityOf(s).id) };
  const r = pay(s, bidPrice(s));
  return r.ok ? { ok: true, state: withShop(r.state, bid.hood, { perk: true }) } : r;
}

/** Why the next delivery vehicle can't be bought yet (other than cash), or null when it can. */
export type VehicleLock = { kind: 'maxed' } | { kind: 'story'; storyOf: 'priya' };

export function nextVehicleLock(s: GameState): VehicleLock | null {
  const next = s.vehicle + 1;
  const vehicles = cityOf(s).fit.vehicles;
  if (next >= vehicles.length) return { kind: 'maxed' };
  if (vehicles[next].id === 'drone' && !s.dronesUnlocked) return { kind: 'story', storyOf: 'priya' };
  return null;
}

/** Player-facing text for a vehicle lock. */
export function vehicleLockLabel(lock: VehicleLock) {
  return lock.kind === 'maxed' ? 'Top tier' : 'Unlocks in Priya’s story';
}

export function buyVehicle(s: GameState): BuyResult {
  const lock = nextVehicleLock(s);
  if (lock) return { ok: false, reason: vehicleLockLabel(lock) };
  const r = pay(s, cityOf(s).fit.vehicles[s.vehicle + 1].cost);
  return r.ok ? { ok: true, state: bump({ ...r.state, vehicle: s.vehicle + 1 }, { fleet: 1 }) } : r;
}

// ---------- Simulation ----------

/** Pies per tapped prep batch: +BATCH_GROWTH.step every BATCH_GROWTH.every prep levels (4 → 6 at Lv 20 …). */
export const tapBatch = (shop: Shop) => BATCH_GROWTH.base + BATCH_GROWTH.step * Math.floor(shop.prep / BATCH_GROWTH.every);
/** Prep level at which the batch next grows. */
export const nextBatchLevel = (shop: Shop) => (Math.floor(shop.prep / BATCH_GROWTH.every) + 1) * BATCH_GROWTH.every;

/** The next hire for a pizzeria without a GM: the first head not hired, then the GM; null with a GM. */
export function nextHire(shop: Shop): Upgrade | null {
  if (shop.managed) return null;
  const k = HEAD_KINDS.find((h) => !shop.heads[h]);
  return k ? HEAD_UPGRADE[k] : 'manager';
}

/** The line has something happening: a job running or a carrier walking out. */
export const lineBusy = (l: Line) => !!(l.prep || l.oven || l.counter || l.departures.length || l.boxed);

/** Which stations run on their own: the GM runs all of them, otherwise each hired head runs theirs. */
const ALL_AUTOMATIC: Automation = Object.freeze({ prep: true, oven: true, counter: true });
/** One frozen object for GM shops, so the scene doesn't allocate it every frame (M44). */
export const automationOf = (shop: Shop): Automation => (shop.managed ? ALL_AUTOMATIC : shop.heads);

/** Share of pies that go to walk-ins at the steady state (walk-ins are seated first, up to walkInRate). */
export function walkInFraction(shop: Shop, vehicle: number, fit: CityFit, fx: FeatureMults = NO_FX): number {
  const { sold, walkIns } = pieSplit(shop, vehicle, fit, fx);
  return sold > 0 ? walkIns / sold : 0;
}

/** The first Downtown batch runs this much faster (tutorial pacing). */
export const FIRST_BATCH_SPEED = 2.5;

/**
 * Everything the kitchen line needs from one pizzeria. An automated counter serves at min(counter, demand), so
 * the steady state matches `shopRate`; a tapped counter hands over at the counter's own speed (the player is
 * already the slow part of a serial prep → bake → serve).
 */
export function lineRates(id: NeighborhoodId, shop: Shop, vehicle: number, mult = 1, fx: FeatureMults = NO_FX, city: CityDef = cityOfHood(id)): LineRates {
  // the very first batch Downtown is quick, so Nonna's "watch the timer" step lasts seconds, not half a minute
  const first = id === firstHood(city) && shop.sold === 0 && !shop.managed ? FIRST_BATCH_SPEED : 1;
  return {
    prep: prepRate(shop, fx) * first,
    oven: ovenRate(shop, city.fit, fx) * first,
    serve: (automationOf(shop).counter ? Math.min(counterRate(shop, fx), demandRate(shop, vehicle, city.fit, fx)) : counterRate(shop, fx)) * first,
    shop: shopRate(shop, vehicle, city.fit, fx),
    // a running boost raises what every pie pays, so departures, pops and revenue agree
    price: valuePerPizza(id, shop, vehicle, fx, city) * mult,
    walkInFraction: walkInFraction(shop, vehicle, city.fit, fx),
    tapBatch: tapBatch(shop),
  };
}

export type TapOutcome = { ok: true; state: GameState } | { ok: false; reason: string };

/** Tap one station of a pizzeria (prep → oven → counter). */
export function tapStation(s: GameState, id: NeighborhoodId, st: Station): TapOutcome {
  const shop = s.shops[id];
  if (!shop.built) return { ok: false, reason: 'Build this pizzeria first' };
  const city = cityOf(s);
  if (automationOf(shop)[st]) return { ok: false, reason: shop.managed ? 'Your manager has it covered' : `${city.heads[id][st]} has it covered` };
  const r = lineTap(shop.line, st, lineRates(id, shop, s.vehicle, 1, featureMults(s, id, s.lastSavedAt), city), automationOf(shop));
  return r.ok ? { ok: true, state: withShop(s, id, { line: r.line }) } : r;
}

/** The station a tap on the shop should run next (null when nothing can start). */
export const nextStation = (shop: Shop): Station | null => nextTap(shop.line, automationOf(shop));

/**
 * A tap on the whole pizzeria. With a GM it's a rush (every running job finishes a little sooner; cash still
 * only arrives with departures). Without one it taps the next station that can start.
 */
export function tapShop(s: GameState, id: NeighborhoodId): GameState {
  const shop = s.shops[id];
  if (!shop.built) return s;
  if (shop.managed) return withShop(s, id, { line: rushLine(shop.line) });
  const st = nextStation(shop);
  if (!st) return s;
  const r = tapStation(s, id, st);
  return r.ok ? r.state : s;
}

/** Foreground play: run every kitchen line and count the seconds toward story pacing. `now` (wall ms) turns running boosts on. */
export function playTick(s: GameState, dt: number, now?: number): GameState {
  if (!(dt > 0)) return s;
  let next: GameState = { ...lineTick(s, dt, now), playSeconds: s.playSeconds + dt };
  // feature slices tick after the ordinary body, in registry order
  for (const f of FEATURES) if (f.tick) next = f.tick(next, dt, now ?? s.lastSavedAt);
  // the chapters' held tasks (rate, no missed orders) count while the app is open
  return chaptersTick(next, dt, now ?? s.lastSavedAt);
}

/**
 * Advance every pizzeria's kitchen line by dt seconds (foreground). Cash only arrives when a departure reaches
 * the door (a driver) or the register (a walk-in).
 */
export function lineTick(s: GameState, dt: number, now?: number): GameState {
  if (!(dt > 0)) return s;
  const mult = now === undefined ? 1 : boostMult(s, now);
  let cash = s.cash;
  let earned = 0;
  const add = { walkins: 0, deliveries: 0, baked: 0 };
  let shops: Record<NeighborhoodId, Shop> | null = null;
  const city = cityOf(s);
  for (const id of hoodIds(city)) {
    const shop = s.shops[id];
    if (!shop.built) continue;
    const auto = automationOf(shop);
    const l = shop.line;
    // an idle manual line with nobody walking can't change: skip the allocation
    // (carrier laps keep counting down while pies wait or a carrier is still out)
    if (
      !auto.prep &&
      !auto.oven &&
      !auto.counter &&
      !l.prep &&
      !l.oven &&
      !l.counter &&
      l.departures.length === 0 &&
      l.boxed === 0 &&
      l.driverBusy <= 0 &&
      l.walkinBusy <= 0
    )
      continue;
    const a = advanceLine(l, dt, lineRates(id, shop, s.vehicle, mult, featureMults(s, id, now ?? s.lastSavedAt), city), auto);
    shops ??= { ...s.shops };
    shops[id] = { ...shop, line: a.line, sold: shop.sold + a.sold };
    cash += a.paid;
    earned += a.paid;
    add.walkins += a.walkins;
    add.deliveries += a.deliveries;
    add.baked += a.baked;
  }
  return shops ? bump({ ...s, cash, totalEarned: s.totalEarned + earned, shops }, add) : s;
}

/** How many seconds away the player is paid for: the night oven's owned cap. */
export const offlineCapOf = (s: Pick<GameState, 'nightOven'>): number =>
  NIGHT_OVEN.capSeconds[Math.min(NIGHT_OVEN.capSeconds.length - 1, Math.max(0, s.nightOven | 0))];

export interface OfflineResult {
  state: GameState;
  seconds: number;
  /** The cap that applied (the night oven's size), in seconds. */
  cap: number;
  /** True when the player was away longer than the offline cap. */
  capped: boolean;
  /** Real time away, before the cap. */
  awaySeconds: number;
  earned: number;
  /** Cash each pizzeria made while away (only those that made any), and the pies it sold. `headsOnly`: no GM, all three heads: it sold at HEADS_OFFLINE_SHARE of its rate (S33). */
  byShop: { id: NeighborhoodId; earned: number; managed: boolean; headsOnly: boolean; pies: number }[];
  /** Built pizzerias (not Downtown) missing a GM and a head: they only finish what was already on the line while you're away. A shop with all three heads and no GM is not idle: it sells HEADS_OFFLINE_SHARE of its rate. */
  idle: NeighborhoodId[];
}

/**
 * Closed-form catch-up for time away. A pizzeria with a GM sells at its rate (whole pies) and everything on its line. One with
 * all three heads and no GM sells HEADS_OFFLINE_SHARE of that rate, without the GM's boost (v5.16: the heads keep it going,
 * at half speed). One missing a head only finishes the jobs already running and pays the carriers already walking out.
 * Each line is settled, so nothing is paid twice.
 */
export function offlineTick(
  s: GameState,
  seconds: number,
  boost = 1,
  now?: number,
): { state: GameState; byShop: { id: NeighborhoodId; pies: number; base: number; extra: number }[] } {
  const shops = { ...s.shops };
  const add = { walkins: 0, deliveries: 0, baked: 0 };
  const rows: { id: NeighborhoodId; pies: number; base: number; extra: number }[] = [];
  let cash = s.cash;
  let earned = 0;
  const city = cityOf(s);
  for (const id of hoodIds(city)) {
    const shop = s.shops[id];
    if (!shop.built) continue;
    let pies: number;
    let paid: number;
    let line: Line;
    const fx = featureMults(s, id, now ?? s.lastSavedAt);
    if (runsItself(shop)) {
      // a GM sells at the full rate; three heads alone sell their share of it (and `valuePerPizza` has no GM boost without one)
      const share = shop.managed ? 1 : HEADS_OFFLINE_SHARE;
      const inFlight = piesInFlight(shop.line);
      const carried = shop.line.departures.reduce((t, d) => t + d.cash, 0);
      const carriedPies = shop.line.departures.reduce((t, d) => t + d.n, 0);
      const rest = Math.floor(shopRate(shop, s.vehicle, city.fit, fx) * share * seconds) + inFlight - carriedPies;
      pies = carriedPies + rest;
      // `carried` was already boosted when it left the shop: only the rest takes the boost
      paid = carried + rest * valuePerPizza(id, shop, s.vehicle, fx, city) * boost;
      // closed form: the walk-in share of the steady state decides the split
      const walk = Math.round(pies * walkInFraction(shop, s.vehicle, city.fit, fx));
      add.walkins += walk;
      add.deliveries += pies - walk;
      add.baked += pies;
      line = { ...emptyLine(), walkInDebt: shop.line.walkInDebt, nextId: shop.line.nextId };
    } else {
      const a = advanceLine(shop.line, seconds, lineRates(id, shop, s.vehicle, 1, fx, city), { prep: false, oven: false, counter: false });
      pies = a.sold;
      paid = a.paid * boost;
      line = a.line;
      add.walkins += a.walkins;
      add.deliveries += a.deliveries;
      add.baked += a.baked;
    }
    // a perk can raise what a pizzeria earns while away (Big Sal's, in Industrial)
    const extra = paid * ((perkOf(id, shop, city)?.offlineMult ?? 1) - 1);
    shops[id] = { ...shop, line, sold: shop.sold + pies };
    cash += paid + extra;
    earned += paid + extra;
    if (pies > 0) rows.push({ id, pies, base: paid, extra });
  }
  return { state: bump({ ...s, cash, totalEarned: s.totalEarned + earned, shops }, add), byShop: rows };
}

/** Away longer than the offline cap by less than this is not "capped": the popup would say "Capped at 4h (away 4h)" (G92). */
export const CAPPED_SLACK_SECONDS = 60;

/** Catch up after the app was closed: GM shops run, three-head shops run at half speed, the others finish what was already on the line. */
export function applyOffline(s: GameState, now: number): OfflineResult {
  const elapsed = Math.max(0, (now - s.lastSavedAt) / 1000);
  const cap = offlineCapOf(s);
  const seconds = Math.min(elapsed, cap);
  // each running boost adds (mult − 1) over the part of the offline window it covers
  const from = s.lastSavedAt;
  const boost =
    seconds > 0
      ? s.rewards.boosts.reduce((m, b) => m + ((b.mult - 1) * Math.max(0, Math.min(b.until, from + seconds * 1000) - from)) / (seconds * 1000), 1)
      : 1;
  const { state: ticked, byShop } = offlineTick(s, seconds, boost, now);
  let state = ticked;
  // feature slices settle after the ordinary catch-up, in registry order
  for (const f of FEATURES) if (f.onOffline) state = f.onOffline(state, seconds, now, s);
  const rows = byShop
    .map((r) => ({
      id: r.id,
      managed: s.shops[r.id].managed,
      headsOnly: !s.shops[r.id].managed && runsItself(s.shops[r.id]),
      earned: r.base + r.extra,
      pies: r.pies,
    }))
    .filter((x) => x.earned > 0);
  // Downtown's manager is Nonna's story beat, not a hire the player can make, so it is never named as idle
  const idle = hoodIds(cityOf(s)).filter((id) => id !== firstHood(cityOf(s)) && s.shops[id].built && !runsItself(s.shops[id]));
  return {
    state: { ...state, lastSavedAt: now },
    seconds,
    cap,
    capped: elapsed - cap >= CAPPED_SLACK_SECONDS,
    awaySeconds: elapsed,
    earned: state.cash - s.cash,
    byShop: rows,
    idle,
  };
}

// ---------- Story ----------
// The story's rules (triggers, the finale waits, the load-time migration) are engine/story.ts (A33); re-exported here for the callers that read them from the game.
export { challengeOffered, pendingScenes, prerequisites, sceneTriggered } from './story';

export function applyReward(s: GameState, reward: SceneReward | undefined): GameState {
  switch (reward) {
    case 'auto-bake':
      // Nonna becomes Downtown's General Manager and brings any heads not yet hired.
      return withShop(s, firstHood(cityOf(s)), { managed: true, heads: allHeads() });
    case 'drones':
      return { ...s, dronesUnlocked: true };
    case 'city-complete':
      return { ...s, cityComplete: true };
    default:
      return s;
  }
}

export function markSceneSeen(s: GameState, scene: Scene): GameState {
  if (s.seenScenes.includes(scene.id)) return s;
  let next: GameState = { ...s, seenScenes: [...s.seenScenes, scene.id], sceneAt: { ...s.sceneAt, [scene.id]: s.playSeconds } };
  if (scene.perk) next = withShop(next, scene.neighborhood, { perk: true });
  return applyReward(next, scene.reward);
}

// ---------- Advice ----------

/** Cash/sec this pizzeria gains from an upgrade (counting it as running), or null if unavailable. */
export function upgradeGain(s: GameState, id: NeighborhoodId, what: Upgrade): number | null {
  if (upgradeLock(s, id, what)) return null;
  const r = buyUpgrade({ ...s, cash: WHAT_IF_CASH }, id, what);
  if (!r.ok) return null;
  // a head adds no steady-state rate (the shop is counted as running); it's worth the shop's earnings in time saved
  if (isHeadUpgrade(what)) return shopEarnings(s, id);
  return shopEarnings(r.state, id) - shopEarnings(s, id);
}

/** Cash/sec the whole city gains from the next fleet tier. */
export function vehicleGain(s: GameState): number | null {
  const r = buyVehicle({ ...s, cash: WHAT_IF_CASH });
  if (!r.ok) return null;
  return hoodIds(cityOf(s)).reduce((t, id) => t + (s.shops[id].built ? shopEarnings(r.state, id) - shopEarnings(s, id) : 0), 0);
}

/** A starting pizzeria's earnings once it runs itself (heads + a GM, so with the GM boost). */
export function buildGain(s: GameState, id: NeighborhoodId): number {
  const r = buildShop({ ...s, cash: WHAT_IF_CASH }, id);
  return r.ok ? shopEarnings(withShop(r.state, id, { managed: true, heads: allHeads() }), id) : 0;
}

/** Everything it takes to get a new pizzeria running itself: the build, three heads and a GM. */
export const buildAllIn = (id: NeighborhoodId, city: CityDef = cityOfHood(id)) => def(id, city).buildCost + def(id, city).headsCost + def(id, city).managerCost;

export interface Bundle {
  /** Upgrades to buy, in order (may repeat, may include an expansion). */
  steps: Upgrade[];
  cost: number;
  gain: number;
}

/**
 * The cheapest set of upgrades that actually raises a pizzeria's output. When stages are tied
 * (e.g. prep and ovens both at 3.1/sec), upgrading one alone gains nothing, so this upgrades every
 * stage at the minimum, expanding the footprint first if a station is capped.
 */
export function bottleneckBundle(s: GameState, id: NeighborhoodId, maxSteps = 8): Bundle | null {
  if (!s.shops[id].built) return null;
  let st: GameState = { ...s, cash: WHAT_IF_CASH };
  const fit = cityOf(s).fit;
  const start = shopEarnings(s, id);
  const steps: Upgrade[] = [];
  let cost = 0;
  for (let i = 0; i < maxSteps; i++) {
    const shop = st.shops[id];
    const rates: [Upgrade, number][] = [
      ['prep', prepRate(shop)],
      ['ovens', ovenRate(shop, fit)],
      ['counter', counterRate(shop)],
      ['drivers', demandRate(shop, st.vehicle, fit)],
    ];
    const min = Math.min(...rates.map((r) => r[1]));
    const tied = rates.filter((r) => r[1] <= min * (1 + 1e-9)).map((r) => r[0]);
    let progressed = false;
    for (let what of tied) {
      // Ovens are cheapest to speed up via a grade when one is available and the level is capped.
      if (what === 'ovens' && upgradeLock(st, id, 'ovens') && !upgradeLock(st, id, 'grade')) what = 'grade';
      if (upgradeLock(st, id, what)) {
        if (upgradeLock(st, id, 'expand')) return null; // fully maxed
        const ex = buyUpgrade(st, id, 'expand');
        if (!ex.ok) return null;
        cost += upgradeCostOf(st, id, 'expand')!;
        steps.push('expand');
        st = ex.state;
      }
      const c = upgradeCostOf(st, id, what);
      const r = buyUpgrade(st, id, what);
      if (!r.ok || c === null) return null;
      cost += c;
      steps.push(what);
      st = r.state;
      progressed = true;
    }
    if (!progressed) return null;
    const gain = shopEarnings(st, id) - start;
    if (gain > start * 1e-9 + 1e-12) return { steps, cost, gain };
  }
  return null;
}

const STEP_LABEL: Record<string, string> = { prep: 'prep', ovens: 'ovens', grade: 'oven grade', counter: 'counter', drivers: 'drivers', expand: 'expansion' };

export interface BundleHint {
  label: string;
  /** The upgrades to buy, in order: the UI's "Buy both" runs them through the ordinary buy path. */
  steps: Upgrade[];
  cost: number;
  gain: number;
  affordable: boolean;
}

/** One key for what a shop's levels, fleet and decor decide, and nothing a feature adds: a price ladder keys on it (M65). */
export function shopBuildKey(s: GameState, id: NeighborhoodId): string {
  const sh = s.shops[id];
  return `${id}|${sh.built}|${sh.managed}|${sh.heads.prep}${sh.heads.oven}${sh.heads.counter}|${sh.prep}|${sh.ovens}|${sh.counter}|${sh.drivers}|${sh.tables}|${sh.grade}|${sh.footprint}|${sh.perk}|${s.vehicle}|${Object.values(sh.decor).join(',')}`;
}

/** One key for everything a shop's upgrade levels decide (not cash, sales or the line): shared caches key on it (A18). */
export function shopLevelKey(s: GameState, id: NeighborhoodId): string {
  // the features' part (an event running, an attack on this shop, recipe cards owned) moves every "+$X/s" without a purchase (C112)
  const fx = FEATURES.map((f) => f.shopKey?.(s, id) ?? '').join(',');
  return `${shopBuildKey(s, id)}|${fx}`;
}

let hintKey = '';
let hintVal: Omit<BundleHint, 'affordable'> | null = null;

/** "Upgrade prep + ovens · $X": the tied-station bundle, ready to show in the UI. Cached on levels, decor and fleet (not cash or sales), so a render only pays for it when something was upgraded. */
export function bundleHint(s: GameState, id: NeighborhoodId): BundleHint | null {
  const key = shopLevelKey(s, id);
  if (key !== hintKey) {
    hintKey = key;
    const b = bottleneckBundle(s, id);
    const names = b ? [...new Set(b.steps.map((w) => STEP_LABEL[w] ?? w))] : [];
    hintVal = b ? { label: `Upgrade ${names.join(' + ')}`, steps: b.steps, cost: b.cost, gain: b.gain } : null;
  }
  return hintVal ? { ...hintVal, affordable: canAfford(s, hintVal.cost) } : null;
}

// ---------- Decor ----------

export function decorCost(s: GameState, id: NeighborhoodId, kind: DecorKind): number | null {
  const tier = s.shops[id].decor[kind];
  return tier >= 3 ? null : Math.ceil(DECOR_TIER_COST[tier] * def(id, cityOf(s)).costMult);
}

export function buyDecor(s: GameState, id: NeighborhoodId, kind: DecorKind): BuyResult {
  const shop = s.shops[id];
  if (!shop.built) return { ok: false, reason: 'Build this pizzeria first' };
  const cost = decorCost(s, id, kind);
  if (cost === null) return { ok: false, reason: 'Fully decorated' };
  const r = pay(s, cost);
  if (!r.ok) return r;
  return { ok: true, state: bump(withShop(r.state, id, { decor: { ...shop.decor, [kind]: shop.decor[kind] + 1 } }), { decor: 1 }) };
}

/** Cash/sec this pizzeria gains from the next decor tier (counting it as running). */
export function decorGain(s: GameState, id: NeighborhoodId, kind: DecorKind): number | null {
  const r = buyDecor({ ...s, cash: WHAT_IF_CASH }, id, kind);
  return r.ok ? shopEarnings(r.state, id) - shopEarnings(s, id) : null;
}
