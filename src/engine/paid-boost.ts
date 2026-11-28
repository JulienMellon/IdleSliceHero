// The paid-boost slot (v5.23, card E5): three boosters sold for diamonds. They share one slot that runs at PAID_BOOST_MULT;
// buying another while it runs adds its time (up to PAID_SLOT_CAP seconds left) and never a second multiplier.
// `boostMult` (game.ts) reads the slot, and so does `applyOffline` (v5.25, card E9: `offlineBoostOf`): the slot pays boosted for the part of the time away
// it still covers, then base. The 2× offline ad replaces a boost already in the total, it never stacks with it (offers.ts `offlineFactor`).

import { PAID_BOOSTERS, PAID_SLOT_CAP, type PaidBooster } from '../content/rewards';
import { payDiamonds, type BuyResult, type GameState } from './game';
import { CLOCK_REASON, clockBehind, rewardIncome, rewardsUnlocked } from './rewards';

export const paidBooster = (id: string): PaidBooster | undefined => PAID_BOOSTERS.find((b) => b.id === id);

/** Seconds the paid slot has left at `now` (0 when it is empty or ended). */
export const paidBoostLeft = (s: GameState, now: number): number => Math.max(0, Math.ceil((s.rewards.paidUntil - now) / 1000));

/** Cash a booster earns at the player's pace, "about": the rewards' income (no boost, event or tip) × its seconds. 0 for an unknown id. */
export function boosterPace(s: GameState, id: string): number {
  const b = paidBooster(id);
  return b ? rewardIncome(s) * b.seconds : 0;
}

/** Whether `id` still fits in the slot at `now`: what is left plus its time stays within PAID_SLOT_CAP. */
export const boosterFits = (s: GameState, id: string, now: number): boolean => {
  const b = paidBooster(id);
  return !!b && Math.max(s.rewards.paidUntil, now) + b.seconds * 1000 - now <= PAID_SLOT_CAP * 1000;
};

/** Buy booster `id` with diamonds at `now`. A refusal (no such booster, rewards locked, clock behind, slot full, short of diamonds) takes nothing. */
export function buyBooster(s: GameState, id: string, now: number): BuyResult {
  const b = paidBooster(id);
  if (!b) return { ok: false, reason: 'No such booster' };
  if (!rewardsUnlocked(s)) return { ok: false, reason: 'Rewards unlock when Nonna takes over' };
  if (clockBehind(s, now)) return { ok: false, reason: CLOCK_REASON };
  if (!boosterFits(s, id, now)) return { ok: false, reason: 'The booster slot holds 24 h at most' };
  const paid = payDiamonds(s, b.diamonds);
  if (!paid.ok) return paid;
  const r = paid.state.rewards;
  const paidUntil = Math.max(r.paidUntil, now) + b.seconds * 1000;
  return { ok: true, state: { ...paid.state, rewards: { ...r, paidUntil, lastSeen: Math.max(r.lastSeen, now) } } };
}
