// Rewarded-ad placements (card U3): the one rule for an ad button and the limits of each placement, as pure functions.
// The component (ad-button.tsx) and the store (game-store.ts) only call these; the tests are in __tests__/ad-model.test.ts.
//
//   placement       where                               limit                                   what a reward gives
//   double_claim    claim sheet (daily, weekly, gift)   once per claim                          the claim's cash and diamonds again
//   reroll_task     a daily task's row                  once a day (`rewards.rerollUsed`)       another daily task in its place
//   streak_save     the gift calendar's missed day      once per 30-day cycle (`gift.saveUsed`) the streak repair, without the 20 diamonds
//   offline_2x      the welcome-back gift               once per return                         the offline total doubled (replaces a timed boost, never stacks)
//   daily_booster   the booster shelf                   once a day (`StorePrefs.boosterAdDay`)  one 2x 15 min booster
import { MAX_BOOSTERS, STREAK_SAVE_DIAMONDS } from '../../content/rewards';
import { DECOR_KINDS } from '../../content/tuning';
import type { BuyResult, GameState, Task } from '../../engine/game';
import { nextHire, SHOP_IDS } from '../../engine/game';
import * as R from '../../engine/rewards';
import type { AdPlacement, AdResult } from '../../services/types';

// ---------- the one rule ----------

export type AdOutcome = 'plus' | 'rewarded' | 'skipped';

export interface AdDeps {
  /** The player owns Nonna's Plus. */
  plus: boolean;
  show: (p: AdPlacement) => Promise<AdResult>;
}

/**
 * The one rule behind every ad button. Nonna's Plus: the benefit is given at once and no ad is shown or counted. Otherwise the ad is
 * shown: `rewarded` gives the benefit; `dismissed` and `unavailable` give nothing and are not an error, the player just goes on.
 * Events: none here. The services index sends `ad_started` and `ad_completed` from `ads.show` (C128); the button sends `ad_offered` when it appears.
 */
export async function runAd(placement: AdPlacement, deps: AdDeps): Promise<AdOutcome> {
  if (deps.plus) return 'plus';
  let result: AdResult = 'unavailable';
  try {
    result = await deps.show(placement);
  } catch {
    /* `show` never throws; if a stub does, it is the same as no ad */
  }
  if (result !== 'rewarded') return 'skipped';
  return 'rewarded';
}

/** How often a mounted ad button asks the service whether an ad could be shown now, so it comes back after a stale or unfilled ad with no app restart. */
export const READY_CHECK_MS = 4000;

/** The benefit is given for these outcomes. */
export const gives = (o: AdOutcome): boolean => o !== 'skipped';

/** Whether the button is on show: a Plus owner always has it; anyone else when an ad could be shown. */
export const buttonShown = (plus: boolean, adReady: boolean): boolean => plus || adReady;

/** `ad_offered` is tracked each time this becomes true: an ad is ready and the player has no Plus (a Plus owner is never offered an ad). */
export const adOffering = (plus: boolean, adReady: boolean): boolean => adReady && !plus;

/** What the button says: the Plus line when the benefit is free, the ad line otherwise. */
export const adLabel = (plus: boolean, ad: string, plusLine: string): string => (plus ? plusLine : ad);

// ---------- limits ----------

const gateOpen = (g: GameState, now: number): boolean => R.rewardsUnlocked(g) && !R.clockBehind(g, now);

/** Pay a reward patch: rewards.lastSeen moves up like every claim's. */
const withRewards = (g: GameState, patch: Partial<GameState['rewards']>, now: number): GameState => ({ ...g, rewards: { ...g.rewards, ...patch, lastSeen: Math.max(g.rewards.lastSeen, now) } });

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
  { kind: 'upgrades', target: 10, ok: () => true },
  { kind: 'bonusTaps', target: 3, ok: () => true },
  { kind: 'booster', target: 1, ok: (g) => g.rewards.boosters.length > 0 },
  { kind: 'hire', target: 1, ok: (g) => SHOP_IDS.some((id) => g.shops[id].built && nextHire(g.shops[id]) !== null) },
  { kind: 'decor', target: 1, ok: (g) => SHOP_IDS.some((id) => g.shops[id].built && DECOR_KINDS.some((k) => g.shops[id].decor[k] < 3)) },
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
export const boosterAdOffer = (g: GameState, now: number, takenDay: string): boolean => gateOpen(g, now) && takenDay !== R.dayKey(now) && g.rewards.boosters.length < MAX_BOOSTERS;

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

// ---------- the claim the sheet is about ----------

export type ClaimKind = 'daily' | 'weekly' | 'gift';

export interface ClaimInfo {
  kind: ClaimKind;
  /** What the claim paid (once). */
  delta: ClaimDelta;
  /** The claim has been doubled (by an ad or by Nonna's Plus). */
  doubled: boolean;
  /** Ms; the sheet's key. */
  at: number;
}

/** The double button's words (D497): what it adds when that is one thing ("Double it · +$81.2K"), "×2" when the claim paid cash and diamonds. */
export function doubleLabel(d: ClaimDelta, money: (n: number) => string): string {
  const cash = d.cash >= 1;
  const dia = d.diamonds >= 1;
  if (cash && dia) return 'Double it · ×2';
  if (cash) return `Double it · +${money(d.cash)}`;
  if (dia) return `Double it · +${d.diamonds} ${d.diamonds === 1 ? 'diamond' : 'diamonds'}`;
  return 'Double it';
}

/** "+$1.2K and 20 diamonds": the claim's size in words (`money` formats the cash). */
export function deltaText(d: ClaimDelta, money: (n: number) => string): string {
  const parts: string[] = [];
  if (d.cash >= 1) parts.push(`+${money(d.cash)}`);
  if (d.diamonds >= 1) parts.push(`${d.diamonds} ${d.diamonds === 1 ? 'diamond' : 'diamonds'}`);
  return parts.join(' and ');
}
