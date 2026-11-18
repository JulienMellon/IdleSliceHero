// What the store's rewards and ad placements do to a game (A34): the claim double, the daily reroll, the streak repair, the free
// booster, the offline total's doubling and a paid-out grant, as pure functions of a game. They lived in components/store; the game store
// calls them from here, and ad-model.ts / store-model.ts re-export them for the screens and tests. The placements and their limits are
// described in components/store/ad-model.ts.
import { MAX_BOOSTERS, MAX_CONCURRENT_BOOSTS, STREAK_SAVE_DIAMONDS } from '../content/rewards';
import { DECOR_KINDS } from '../content/tuning';
import { cityOf, hoodIds } from '../content/cities';
import type { Grant } from '../services/grants';
import { nextHire, type Boost, type BuyResult, type GameState, type Task } from './game';
import * as R from './rewards';

// ---------- limits ----------

const gateOpen = (g: GameState, now: number): boolean => R.rewardsUnlocked(g) && !R.clockBehind(g, now);

/** Pay a reward patch: rewards.lastSeen moves up like every claim's. */
const withRewards = (g: GameState, patch: Partial<GameState['rewards']>, now: number): GameState => ({
  ...g,
  rewards: { ...g.rewards, ...patch, lastSeen: Math.max(g.rewards.lastSeen, now) },
});

// -- double a claim --

/** What a claim paid: cash and diamonds, the two things that can be paid again. */
export interface ClaimDelta {
  cash: number;
  diamonds: number;
}

export const claimDelta = (before: GameState, after: GameState): ClaimDelta => ({
  cash: Math.max(0, after.cash - before.cash),
  diamonds: Math.max(0, Math.floor(after.rewards.diamonds) - Math.floor(before.rewards.diamonds)),
});

export const hasDelta = (d: ClaimDelta): boolean => d.cash >= 1 || d.diamonds >= 1;

/** A claim worth doubling: it paid cash or diamonds (a booster or a cosmetic is not paid twice). */
export const claimOffer = (d: ClaimDelta | null): boolean => !!d && hasDelta(d);

/** Pay the claim again. */
export function applyDouble(g: GameState, d: ClaimDelta): GameState {
  const cash = d.cash >= 1 ? d.cash : 0;
  return { ...g, cash: g.cash + cash, totalEarned: g.totalEarned + cash, rewards: { ...g.rewards, diamonds: g.rewards.diamonds + d.diamonds } };
}

// -- reroll one daily task --

/** Replacements: fixed-target tasks only (their target needs no income maths), each with the check the engine's generator makes. */
const REROLL_POOL: readonly { kind: Task['kind']; target: number; ok: (g: GameState) => boolean }[] = [
  { kind: 'upgrades', target: 10, ok: (g) => R.upgradesAreQuick(g) },
  { kind: 'bonusTaps', target: 3, ok: () => true },
  { kind: 'booster', target: 1, ok: (g) => g.rewards.boosters.length > 0 },
  { kind: 'hire', target: 1, ok: (g) => hoodIds(cityOf(g)).some((id) => g.shops[id].built && nextHire(g.shops[id]) !== null) },
  { kind: 'decor', target: 1, ok: (g) => hoodIds(cityOf(g)).some((id) => g.shops[id].built && DECOR_KINDS.some((k) => g.shops[id].decor[k] < 3)) },
];

/** A small repeatable hash (FNV-1a), so the replacement is the same on every device for the same day and row. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The task that would replace daily task `i`, or null: the row can't be swapped (done, claimed, none), the day's reroll is used, or no other kind fits. */
export function rerollTask(g: GameState, i: number): Task | null {
  const r = g.rewards;
  const task = r.daily[i];
  if (r.rerollUsed || !task || task.claimed || R.taskDone(g, task)) return null;
  const taken = new Set(r.daily.map((t) => t.kind));
  const fits = REROLL_POOL.filter((p) => !taken.has(p.kind) && p.ok(g));
  if (!fits.length) return null;
  const pick = fits[hash(`reroll:${r.day}:${i}`) % fits.length];
  return { kind: pick.kind, target: pick.target, base: R.taskCounter(g, pick.kind), claimed: false };
}

/** Whether a daily row shows its swap button. */
export const canReroll = (g: GameState, i: number): boolean => rerollTask(g, i) !== null;

/** Swap daily task `i` for another kind, once a day. */
export function rerollDaily(g: GameState, i: number, now: number): BuyResult {
  if (!R.rewardsUnlocked(g)) return { ok: false, reason: 'Rewards unlock when Nonna takes over' };
  if (R.clockBehind(g, now)) return { ok: false, reason: R.CLOCK_REASON };
  if (g.rewards.rerollUsed) return { ok: false, reason: 'One swap a day' };
  const next = rerollTask(g, i);
  if (!next) return { ok: false, reason: 'No other task fits today' };
  return { ok: true, state: withRewards(g, { daily: g.rewards.daily.map((t, k) => (k === i ? next : t)), rerollUsed: true }, now) };
}

// -- save the streak --

/** The streak repair an ad pays for: the engine's own repair, with the 20 diamonds lent for the call and not spent. Only in the gift's `save` state, which the engine offers once per cycle. */
export function repairByAd(g: GameState, now: number): BuyResult {
  if (R.giftStatus(g, now).kind !== 'save') return { ok: false, reason: 'No streak to save' };
  const lent = withRewards(g, { diamonds: g.rewards.diamonds + STREAK_SAVE_DIAMONDS }, g.rewards.lastSeen);
  return R.claimGift(lent, now, { repair: true });
}

/** Whether the calendar's missed day can be saved by an ad now. */
export const streakSaveOffer = (g: GameState, now: number): boolean => gateOpen(g, now) && R.giftStatus(g, now).kind === 'save';

// -- one free booster a day --

/** The booster the shelf's ad gives. */
export const DAILY_BOOSTER = { mult: 2, seconds: 15 * 60 } as const;

/** The shelf's ad is on offer: rewards are unlocked, and none was taken today (`day` is the local date, `dayKey(now)`). */
export const boosterAdOffer = (g: GameState, now: number, takenDay: string): boolean =>
  gateOpen(g, now) && takenDay !== R.dayKey(now) && g.rewards.boosters.length < MAX_BOOSTERS;

export function grantDailyBooster(g: GameState, now: number): BuyResult {
  if (!gateOpen(g, now)) return { ok: false, reason: R.rewardsUnlocked(g) ? R.CLOCK_REASON : 'Rewards unlock when Nonna takes over' };
  if (g.rewards.boosters.length >= MAX_BOOSTERS) return { ok: false, reason: 'The shelf is full' };
  return { ok: true, state: withRewards(g, { boosters: [...g.rewards.boosters, { ...DAILY_BOOSTER }] }, now) };
}

// -- 2x offline earnings --

/**
 * The multiplier a timed boost gave an away window: each running boost adds (mult - 1) over the part of the window it covered
 * (the engine's own rule in `applyOffline`). 1 with none.
 */
export function offlineBoost(boosts: readonly { mult: number; until: number }[], lastSavedAt: number, seconds: number): number {
  if (!(seconds > 0)) return 1;
  const span = seconds * 1000;
  return boosts.reduce((m, b) => m + ((b.mult - 1) * Math.max(0, Math.min(b.until, lastSavedAt + span) - lastSavedAt)) / span, 1);
}

/**
 * What the offline ad does to the total: it makes the whole thing 2x. A timed boost already in the total is replaced, never stacked:
 * a total that a boost made 1.5x becomes 2x (a factor of 4/3), and one already 2x or more is not offered one.
 */
export const offlineFactor = (boost: number): number => (boost >= 2 || !(boost > 0) ? 1 : 2 / boost);

/** The ad is on offer: the factor is more than 1, and it hasn't been taken. */
export const offlineOffer = (boost: number | undefined, doubled: boolean | undefined): boolean => !doubled && offlineFactor(boost ?? 1) > 1;

/** The extra cash the ad adds to `earned`. */
export const offlineExtra = (earned: number, boost: number | undefined): number => earned * (offlineFactor(boost ?? 1) - 1);

// ---------- a paid-out grant ----------

/** What a grant does to the game: diamonds, a running boost (added like the engine adds one), a cosmetic (worn at once). `plus` is the store's own flag, not a field of the game. */
export function applyGrant(g: GameState, grant: Grant, now: number): GameState {
  const r = g.rewards;
  let boosts: Boost[] = r.boosts;
  if (grant.boost) {
    const b: Boost = { mult: grant.boost.mult, until: now + grant.boost.hours * 3_600_000, source: 'purchase' };
    boosts = [...boosts, b].sort((x, y) => y.until - x.until).slice(0, MAX_CONCURRENT_BOOSTS);
  }
  const dressed = grant.cosmetic ? R.grantCosmetic(r, grant.cosmetic) : { cosmetics: r.cosmetics, worn: r.worn };
  return { ...g, rewards: { ...r, diamonds: r.diamonds + Math.max(0, grant.diamonds), boosts, ...dressed } };
}
