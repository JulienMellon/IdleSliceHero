// Daily tasks, weekly tasks and the daily gift: pure rules (docs/PLAN-v5.4-rewards.md §3). Data is in content/rewards.ts.
// Task progress reads lifetime counters (`stats`, or `totalEarned`) against a base stored per task.
import {
  CLOCK_RECOVER_MS,
  DAILY_CHESTS,
  DAILY_POOL,
  DAILY_TASK_COUNT,
  DAILY_TASK_REWARD,
  GIFT_DAYS,
  GIFT_LENGTH,
  LAST_SEEN_STEP_MS,
  MAX_BOOSTERS,
  MAX_CONCURRENT_BOOSTS,
  MIN_CASH_TARGET,
  MIN_COUNT_TARGET,
  STREAK_SAVE_DIAMONDS,
  TASK_TEXT,
  VISITORS,
  WEEKLY_FALLBACK,
  WEEKLY_COSMETICS,
  WEEKLY_DIAMONDS,
  WEEKLY_POOL,
  WEEKLY_TASK_COUNT,
  WEEKLY_TASK_REWARD,
  type BoosterDef,
  type Chest,
  type Eligibility,
  type GiftDef,
  type PoolEntry,
  type TaskKind,
} from '../content/rewards';
import { NONNA_TAKEOVER } from '../content/tuning';
import { count, money } from './format';
import {
  boostMult,
  buildLock,
  earningsPerSecond,
  nextHire,
  nextToBuild,
  nextVehicleLock,
  runsItself,
  shopRate,
  SHOP_IDS,
  walkInFraction,
  type Boost,
  type BuyResult,
  type GameState,
  type Rewards,
  type Task,
} from './game';
import { DECOR_KINDS } from '../content/tuning';

export { boostMult };

export const CLOCK_REASON = "Your phone's clock looks off. Rewards resume once it catches up.";
const LOCKED_REASON = 'Rewards unlock when Nonna takes over';

// ---------- Dates ----------

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The device's local date, `YYYY-MM-DD`. */
export const dayKey = (ms: number): string => keyOf(new Date(ms));

/** The Monday (local) of the week `ms` falls in, `YYYY-MM-DD`. */
export function weekKey(ms: number): string {
  const d = new Date(ms);
  return keyOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
}

const DAY_MS = 86_400_000;
const dayNumber = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
};

/** ISO week number of a `YYYY-MM-DD` date. */
export function isoWeek(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3); // that week's Thursday
  const jan4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t.getTime() - jan4.getTime()) / DAY_MS - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}

/** Seconds until the next local midnight ('day') or the next Monday midnight ('week'). */
export function resetCountdown(now: number, kind: 'day' | 'week'): number {
  const d = new Date(now);
  const add = kind === 'day' ? 1 : 7 - ((d.getDay() + 6) % 7);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + add);
  return Math.max(0, Math.ceil((next.getTime() - now) / 1000));
}

// ---------- Gates ----------

/** Rewards unlock once Nonna's takeover scene has been seen (the tutorial is done). */
export const rewardsUnlocked = (s: GameState): boolean => s.seenScenes.includes(NONNA_TAKEOVER.sceneId);

/** The device clock is behind the highest time seen: claims and resets wait. */
export const clockBehind = (s: GameState, now: number): boolean => now < s.rewards.lastSeen;

/** `lastSeen` is further ahead than a plausible rollback: the clock was set forward by mistake (see refreshRewards). */
const clockWayBehind = (s: GameState, now: number): boolean => s.rewards.lastSeen - now > CLOCK_RECOVER_MS;

/** Add granted boosters, dropping any past MAX_BOOSTERS (capped where granted, never silently on load). */
const addBoosters = (have: Rewards['boosters'], more: Rewards['boosters']): Rewards['boosters'] => [...have, ...more].slice(0, MAX_BOOSTERS);

/** Add a running boost; past MAX_CONCURRENT_BOOSTS the soonest-ending one goes. */
const addBoost = (have: Boost[], b: Boost): Boost[] => [...have, b].sort((x, y) => y.until - x.until).slice(0, MAX_CONCURRENT_BOOSTS);

/** What a claim must pass first, or null. */
function gate(s: GameState, now: number): string | null {
  if (!rewardsUnlocked(s)) return LOCKED_REASON;
  return clockBehind(s, now) ? CLOCK_REASON : null;
}

const withRewards = (s: GameState, patch: Partial<Rewards>, now: number): GameState => ({ ...s, rewards: { ...s.rewards, ...patch, lastSeen: Math.max(s.rewards.lastSeen, now) } });

// ---------- Seeded generation ----------

function seeded(key: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pies per second the city sells on its own: all, by walk-ins, by drivers. */
export function cityRates(s: GameState): { city: number; walkin: number; driver: number } {
  let city = 0;
  let walkin = 0;
  for (const id of SHOP_IDS) {
    const shop = s.shops[id];
    if (!shop.built || !runsItself(shop)) continue;
    const rate = shopRate(shop, s.vehicle);
    city += rate;
    walkin += rate * walkInFraction(shop, s.vehicle);
  }
  return { city, walkin, driver: city - walkin };
}

const ELIGIBLE: Record<Eligibility, (s: GameState) => boolean> = {
  always: () => true,
  walkins: (s) => cityRates(s).walkin > 0,
  booster: (s) => s.rewards.boosters.length > 0,
  hire: (s) => SHOP_IDS.some((id) => s.shops[id].built && nextHire(s.shops[id]) !== null),
  decor: (s) => SHOP_IDS.some((id) => s.shops[id].built && DECOR_KINDS.some((k) => s.shops[id].decor[k] < 3)),
  build: (s) => {
    const n = nextToBuild(s);
    return !!n && buildLock(s, n.id) === null;
  },
  fleet: (s) => nextVehicleLock(s) === null,
};

/** The counter a kind's progress is measured on. */
export function taskCounter(s: GameState, kind: TaskKind): number {
  const st = s.stats;
  switch (kind) {
    case 'earn':
      return s.totalEarned;
    case 'hire':
      return st.hires;
    case 'build':
      return st.builds;
    case 'booster':
      return st.boosters;
    default:
      return st[kind];
  }
}

const sig2 = (x: number) => (x > 0 && Number.isFinite(x) ? Number(x.toPrecision(2)) : 0);

function targetOf(s: GameState, p: PoolEntry, mult: number): number {
  if ('fixed' in p.scale) return Math.max(1, Math.round(p.scale.fixed * mult));
  const rates = cityRates(s);
  const perSecond = p.scale.rate === 'income' ? earningsPerSecond(s) : rates[p.scale.rate];
  const raw = sig2(perSecond * p.scale.seconds * mult);
  return TASK_TEXT[p.kind].unit === 'cash' ? Math.max(MIN_CASH_TARGET, raw) : Math.max(MIN_COUNT_TARGET, Math.round(raw));
}

/**
 * Pick `n` tasks from a pool: seeded shuffle of the eligible entries. If fewer than `n` qualify, the set is filled
 * with doubled-target repeats of always-eligible entries that have a `{n}`, so a set is never short.
 */
function generate(s: GameState, pool: readonly PoolEntry[], n: number, key: string, baseFor: (kind: TaskKind) => number): Task[] {
  const rand = seeded(key);
  const eligible = pool.filter((p) => ELIGIBLE[p.eligible](s));
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  const picks = eligible.slice(0, n).map((p) => ({ p, mult: 1 }));
  const fill = pool.filter((p) => p.eligible === 'always' && TASK_TEXT[p.kind].title.includes('{n}'));
  for (let i = 0; picks.length < n && fill.length; i++) picks.push({ p: fill[i % fill.length], mult: 2 });
  return picks.map(({ p, mult }) => ({ kind: p.kind, target: targetOf(s, p, mult), base: baseFor(p.kind), claimed: false }));
}

// ---------- Refresh ----------

/**
 * Keep rewards current: raise `lastSeen`, drop ended boosts, roll a new daily set when the local day moved FORWARD and a
 * new weekly set when the week did (a day key that goes backwards, e.g. a time-zone change, never re-rolls).
 * No-op before unlock and while the clock is slightly behind `lastSeen`. A clock more than CLOCK_RECOVER_MS behind
 * (set forward by mistake, then fixed) recovers: `lastSeen` = now and boosts are cleared. Returns `s` itself when
 * nothing changed.
 *
 * `lastSeen` is raised only when it is LAST_SEEN_STEP_MS stale (and on every claim, via withRewards), so
 * `game.rewards` keeps its identity between ticks. 60 s is safe for the rollback guard: a rollback shorter than
 * that goes unnoticed and gains at most a minute of one boost, and day/week keys can't move backwards anyway.
 */
export function refreshRewards(s: GameState, now: number): GameState {
  if (!rewardsUnlocked(s)) return s;
  const recovering = clockWayBehind(s, now);
  if (!recovering && clockBehind(s, now)) return s;
  let g = s;
  let r = s.rewards;
  const patch: Partial<Rewards> = {};
  if (recovering) {
    patch.lastSeen = now;
    if (r.boosts.length) patch.boosts = [];
  } else {
    if (now - r.lastSeen >= LAST_SEEN_STEP_MS) patch.lastSeen = now;
    if (r.boosts.some((b) => b.until <= now)) patch.boosts = r.boosts.filter((b) => b.until > now);
  }
  const today = dayKey(now);
  if (r.day === '' || dayNumber(today) > dayNumber(r.day)) {
    // the day counter moves first, so a weekly "play on N days" counts today
    g = { ...g, stats: { ...g.stats, days: g.stats.days + 1 } };
    patch.day = today;
    patch.daily = generate(g, DAILY_POOL, DAILY_TASK_COUNT, `daily:${today}`, (k) => taskCounter(g, k));
    patch.points = 0;
    patch.chests = DAILY_CHESTS.map(() => false);
    patch.rerollUsed = false;
  }
  const monday = weekKey(now);
  if (r.week === '' || dayNumber(monday) > dayNumber(r.week)) {
    patch.week = monday;
    patch.weekly = generate(g, WEEKLY_POOL, WEEKLY_TASK_COUNT, `weekly:${monday}`, (k) => (k === 'days' && patch.day ? g.stats.days - 1 : taskCounter(g, k)));
    patch.weeklyChest = false;
  }
  if (!Object.keys(patch).length) return s;
  r = { ...r, ...patch };
  return { ...g, rewards: r };
}

// ---------- Tasks ----------

/** "Serve 40 walk-ins": the pool's title with `{n}` filled in. */
export function taskTitle(task: Task): string {
  const t = TASK_TEXT[task.kind];
  return t.title.replace('{n}', t.unit === 'cash' ? money(task.target) : count(task.target));
}

/** Progress toward a task, clamped to 0..target. */
export function taskProgress(s: GameState, task: Task): number {
  return Math.min(task.target, Math.max(0, taskCounter(s, task.kind) - task.base));
}

export const taskDone = (s: GameState, task: Task): boolean => taskProgress(s, task) >= task.target;

/** Reward income: cash per second with no boosts, so a boost can't inflate a cash reward. */
export const rewardIncome = (s: GameState): number => earningsPerSecond(s);

/** Cash a "N minutes of income" reward pays right now. */
export const minutesToCash = (s: GameState, minutes: number): number => rewardIncome(s) * 60 * minutes;

function pay(s: GameState, cash: number): GameState {
  return cash > 0 ? { ...s, cash: s.cash + cash, totalEarned: s.totalEarned + cash } : s;
}

export function claimDaily(s: GameState, i: number, now: number): BuyResult {
  const bad = gate(s, now);
  if (bad) return { ok: false, reason: bad };
  const task = s.rewards.daily[i];
  if (!task) return { ok: false, reason: 'No such task' };
  if (task.claimed) return { ok: false, reason: 'Already claimed' };
  if (!taskDone(s, task)) return { ok: false, reason: 'Not done yet' };
  const daily = s.rewards.daily.map((t, k) => (k === i ? { ...t, claimed: true } : t));
  const paid = pay(s, minutesToCash(s, DAILY_TASK_REWARD.minutes));
  const next = withRewards(paid, { daily, points: s.rewards.points + DAILY_TASK_REWARD.points }, now);
  return { ok: true, state: { ...next, stats: { ...next.stats, dailyDone: next.stats.dailyDone + 1 } } };
}

export const chestReady = (s: GameState, i: number): boolean => {
  const c = DAILY_CHESTS[i];
  return !!c && !s.rewards.chests[i] && s.rewards.points >= c.points;
};

const boosterOf = (b: BoosterDef) => ({ mult: b.mult, seconds: b.minutes * 60 });

export function claimChest(s: GameState, i: number, now: number): BuyResult {
  const bad = gate(s, now);
  if (bad) return { ok: false, reason: bad };
  const c: Chest | undefined = DAILY_CHESTS[i];
  if (!c) return { ok: false, reason: 'No such chest' };
  if (s.rewards.chests[i]) return { ok: false, reason: 'Already opened' };
  if (s.rewards.points < c.points) return { ok: false, reason: `Needs ${c.points} Slice Points` };
  const chests = s.rewards.chests.map((x, k) => x || k === i);
  const paid = pay(s, c.minutes ? minutesToCash(s, c.minutes) : 0);
  return {
    ok: true,
    state: withRewards(paid, { chests, diamonds: s.rewards.diamonds + (c.diamonds ?? 0), boosters: c.booster ? addBoosters(s.rewards.boosters, [boosterOf(c.booster)]) : s.rewards.boosters }, now),
  };
}

export function claimWeekly(s: GameState, i: number, now: number): BuyResult {
  const bad = gate(s, now);
  if (bad) return { ok: false, reason: bad };
  const task = s.rewards.weekly[i];
  if (!task) return { ok: false, reason: 'No such task' };
  if (task.claimed) return { ok: false, reason: 'Already claimed' };
  if (!taskDone(s, task)) return { ok: false, reason: 'Not done yet' };
  const weekly = s.rewards.weekly.map((t, k) => (k === i ? { ...t, claimed: true } : t));
  return { ok: true, state: withRewards(pay(s, minutesToCash(s, WEEKLY_TASK_REWARD.minutes)), { weekly, diamonds: s.rewards.diamonds + (WEEKLY_DIAMONDS[i] ?? 0) }, now) };
}

/** This week's place in the cosmetic rotation (by ISO week number). */
const rotationStart = (s: GameState): number => isoWeek(s.rewards.week || dayKey(s.lastSavedAt)) % WEEKLY_COSMETICS.length;

export type WeeklyChestPrize = { kind: 'cosmetic'; id: string } | { kind: 'fallback'; diamonds: number; minutes: number };

/**
 * What the weekly chest gives: the first cosmetic the player doesn't own, in rotation order from this week's;
 * once all are owned, WEEKLY_FALLBACK diamonds and minutes of income.
 */
export function weeklyChestPrize(s: GameState): WeeklyChestPrize {
  const start = rotationStart(s);
  for (let k = 0; k < WEEKLY_COSMETICS.length; k++) {
    const id = WEEKLY_COSMETICS[(start + k) % WEEKLY_COSMETICS.length];
    if (!s.rewards.cosmetics.includes(id)) return { kind: 'cosmetic', id };
  }
  return { kind: 'fallback', diamonds: WEEKLY_FALLBACK.diamonds, minutes: WEEKLY_FALLBACK.minutes };
}

/** This week's rotation cosmetic, or the next unowned one (see weeklyChestPrize). */
export function weeklyCosmetic(s: GameState): string {
  const p = weeklyChestPrize(s);
  return p.kind === 'cosmetic' ? p.id : WEEKLY_COSMETICS[rotationStart(s)];
}

export const weeklyChestReady = (s: GameState): boolean => !s.rewards.weeklyChest && s.rewards.weekly.length > 0 && s.rewards.weekly.every((t) => t.claimed);

export function claimWeeklyChest(s: GameState, now: number): BuyResult {
  const bad = gate(s, now);
  if (bad) return { ok: false, reason: bad };
  if (s.rewards.weeklyChest) return { ok: false, reason: 'Already opened' };
  if (!weeklyChestReady(s)) return { ok: false, reason: 'Claim every weekly task first' };
  const prize = weeklyChestPrize(s);
  if (prize.kind === 'cosmetic') return { ok: true, state: withRewards(s, { weeklyChest: true, cosmetics: [...s.rewards.cosmetics, prize.id] }, now) };
  return { ok: true, state: withRewards(pay(s, minutesToCash(s, prize.minutes)), { weeklyChest: true, diamonds: s.rewards.diamonds + prize.diamonds }, now) };
}

// ---------- Boosters and boosts ----------

/** Boosts running at `now`, soonest to end first. */
export const runningBoosts = (s: GameState, now: number): Boost[] => s.rewards.boosts.filter((b) => b.until > now).sort((a, b) => a.until - b.until);

/** Start a booster from the inventory; it adds to any boost already running. */
export function startBooster(s: GameState, i: number, now: number): BuyResult {
  const bad = gate(s, now);
  if (bad) return { ok: false, reason: bad };
  const b = s.rewards.boosters[i];
  if (!b) return { ok: false, reason: 'No such booster' };
  const next = withRewards(s, { boosters: s.rewards.boosters.filter((_, k) => k !== i), boosts: addBoost(s.rewards.boosts, { mult: b.mult, until: now + b.seconds * 1000, source: 'booster' }) }, now);
  return { ok: true, state: { ...next, stats: { ...next.stats, boosters: next.stats.boosters + 1 } } };
}

// ---------- Daily gift ----------

export interface GiftStatus {
  /** locked: not unlocked yet · claimed: today's is taken · ready: claim now · save: a day was missed, the streak can be repaired. */
  kind: 'locked' | 'claimed' | 'ready' | 'save';
  /** The calendar day (1–30) in play: today's claimed day, the day a claim gives, or (save) the day a repair continues with. A claim that starts over gives day 1. */
  day: number;
  gift: GiftDef;
  /** The cycle `day` belongs to (0-based). */
  cycle: number;
  /** Day 30's visitor id (VISITORS) for this cycle. */
  visitor: string;
}

export function giftStatus(s: GameState, now: number): GiftStatus {
  const g = s.rewards.gift;
  const out = (kind: GiftStatus['kind'], day: number, cycle = g.cycle): GiftStatus => ({ kind, day, gift: GIFT_DAYS[day - 1], cycle, visitor: VISITORS[cycle % VISITORS.length] });
  if (!rewardsUnlocked(s)) return out('locked', Math.min(GIFT_LENGTH, g.streak + 1));
  const today = dayKey(now);
  const gap = g.last ? dayNumber(today) - dayNumber(g.last) : Infinity;
  if (g.last && gap <= 0 && g.streak > 0) return out('claimed', g.streak, g.streak >= GIFT_LENGTH ? g.cycle - 1 : g.cycle);
  // a finished cycle, a first claim or a long gap (2+ missed days) starts at day 1
  if (g.streak >= GIFT_LENGTH || g.streak === 0 || !g.last || gap > 2) return out('ready', 1);
  if (gap === 1) return out('ready', g.streak + 1);
  return g.saveUsed ? out('ready', 1) : out('save', g.streak + 1);
}

/** Claim today's gift. `repair` pays STREAK_SAVE_DIAMONDS to continue after one missed day; without it a missed day starts over at day 1. */
export function claimGift(s: GameState, now: number, opts: { repair?: boolean } = {}): BuyResult {
  const bad = gate(s, now);
  if (bad) return { ok: false, reason: bad };
  const st = giftStatus(s, now);
  if (st.kind === 'claimed') return { ok: false, reason: 'Come back tomorrow' };
  const repairing = st.kind === 'save' && !!opts.repair;
  if (repairing && s.rewards.diamonds < STREAK_SAVE_DIAMONDS) return { ok: false, reason: 'Not enough diamonds' };
  const day = st.kind === 'save' && !repairing ? 1 : st.day;
  const gift = GIFT_DAYS[day - 1];
  const r = s.rewards;
  const cycle = r.gift.cycle;
  const diamonds = Math.max(0, r.diamonds - (repairing ? STREAK_SAVE_DIAMONDS : 0) + (gift.diamonds ?? 0));
  const boosters = addBoosters(r.boosters, (gift.boosters ?? []).map(boosterOf));
  let boosts = r.boosts;
  if (gift.boostNow) boosts = addBoost(boosts, { mult: gift.boostNow.mult, until: now + gift.boostNow.minutes * 60_000, source: gift.visit ? `visit-${VISITORS[cycle % VISITORS.length]}` : `gift-day-${day}` });
  const cosmetics = [...r.cosmetics];
  if (gift.cosmetic) {
    const id = gift.cosmetic.replace('{cycle}', String(cycle + 1));
    if (!cosmetics.includes(id)) cosmetics.push(id);
  }
  // the day-30 claim closes the cycle: the next claim is day 1 of the next one, with a fresh streak save
  // (starting over at day 1 is a fresh run too, with its own save)
  const done = day >= GIFT_LENGTH;
  const saveUsed = done ? false : repairing ? true : day === 1 ? false : r.gift.saveUsed;
  const streakGift = { streak: day, last: dayKey(now), saveUsed, cycle: done ? cycle + 1 : cycle };
  return { ok: true, state: withRewards(pay(s, gift.minutes ? minutesToCash(s, gift.minutes) : 0), { gift: streakGift, diamonds, boosters, boosts, cosmetics }, now) };
}

/** The gift calendar should pop open by itself: unlocked, something to claim, and not shown yet today. */
export function shouldAutoOpenGift(s: GameState, now: number): boolean {
  if (!rewardsUnlocked(s) || clockBehind(s, now)) return false;
  const k = giftStatus(s, now).kind;
  return (k === 'ready' || k === 'save') && s.rewards.giftShownDay !== dayKey(now);
}

/** Remember the calendar has opened today. */
export const markGiftShown = (s: GameState, now: number): GameState => {
  const today = dayKey(now);
  return s.rewards.giftShownDay === today ? s : { ...s, rewards: { ...s.rewards, giftShownDay: today } };
};

// ---------- Badge ----------

/** Things to claim in the tasks drawer (finished tasks, ready chests): the clipboard's badge. The gift has its own dot (`giftStatus`). */
export function claimableCount(s: GameState, now: number): number {
  if (!rewardsUnlocked(s)) return 0;
  const r = s.rewards;
  let n = 0;
  for (const t of r.daily) if (!t.claimed && taskDone(s, t)) n++;
  for (let i = 0; i < DAILY_CHESTS.length; i++) if (chestReady(s, i)) n++;
  for (const t of r.weekly) if (!t.claimed && taskDone(s, t)) n++;
  if (weeklyChestReady(s)) n++;
  return clockBehind(s, now) ? 0 : n;
}
