// ×1 / ×10 / MAX (v5.15; A30): the one rule for how many levels a station buy takes, and the all-or-nothing buy of that many.
// The store calls these; the sidewalk's views (components/sidewalk-model.ts) only read `buyPlan` to label a card.
import type { NeighborhoodId } from '../content/types';
import { buyUpgrade, shopLevelKey, upgradeCostOf, upgradeLock, type BuyResult, type GameState, type Upgrade } from './game';

/** How many levels one tap on a station card buys: one, ten, or as many as the cash pays for. */
export type BuyAmount = 1 | 10 | 'max';
export const BUY_AMOUNTS: readonly BuyAmount[] = [1, 10, 'max'];

/** The upgrades that are bought a level at a time (hires, Expand and the oven grade are single buys, whatever the amount). */
export type LevelUpgrade = 'prep' | 'ovens' | 'counter' | 'drivers';
export const isLevelUpgrade = (what: Upgrade): what is LevelUpgrade => what === 'prep' || what === 'ovens' || what === 'counter' || what === 'drivers';

/** A station can't take more levels than this at once (the level cap stops it far sooner). */
const LADDER_MAX = 400;
const ladders = new Map<string, number[]>();

/**
 * What the next levels cost in all: entry i is the price of i+1 levels. It ends where the upgrade is locked (the level cap).
 * Cached on the shop's levels, like the station models: cash is not part of it.
 */
export function costLadder(s: GameState, id: NeighborhoodId, what: LevelUpgrade): number[] {
  const key = `${id}|${shopLevelKey(s, id)}|${what}`;
  const hit = ladders.get(key);
  if (hit) return hit;
  // an endless purse, so the engine's own buy rule (cost, cap, perks) walks the levels and nothing here repeats it
  let cur: GameState = { ...s, cash: Number.POSITIVE_INFINITY };
  const out: number[] = [];
  let total = 0;
  while (out.length < LADDER_MAX && upgradeLock(cur, id, what) === null) {
    const cost = upgradeCostOf(cur, id, what);
    const r = buyUpgrade(cur, id, what);
    if (cost === null || !r.ok) break;
    total += cost;
    out.push(total);
    cur = r.state;
  }
  if (ladders.size >= 48) ladders.clear();
  ladders.set(key, out);
  return out;
}

export interface BuyPlan {
  /** Levels the tap buys (0 when nothing can be bought: locked or maxed). MAX with no cash shows the next level, unaffordable. */
  count: number;
  /** What they cost in all. */
  total: number;
  affordable: boolean;
}

/** The one rule: ×1 is one level, ×10 is ten (fewer when the level cap stops it), MAX is every level the cash pays for (at least the next one, shown unaffordable). */
export function buyPlan(s: GameState, id: NeighborhoodId, what: Upgrade, amount: BuyAmount): BuyPlan {
  if (!isLevelUpgrade(what)) {
    const cost = upgradeCostOf(s, id, what);
    return cost === null ? { count: 0, total: 0, affordable: false } : { count: 1, total: cost, affordable: s.cash >= cost };
  }
  const ladder = costLadder(s, id, what);
  if (!ladder.length) return { count: 0, total: 0, affordable: false };
  let count: number;
  if (amount === 'max') {
    count = 0;
    while (count < ladder.length && ladder[count] <= s.cash) count++;
    count = Math.max(1, count);
  } else count = Math.min(amount, ladder.length);
  return { count, total: ladder[count - 1], affordable: s.cash >= ladder[count - 1] };
}

/** Buy `count` levels of one upgrade through the engine's own buy, all or nothing: one new state, so one save and one sound. */
export function buyMany(s: GameState, id: NeighborhoodId, what: Upgrade, count: number): BuyResult {
  if (!(count >= 1)) return { ok: false, reason: 'Nothing to buy' };
  let cur = s;
  for (let i = 0; i < count; i++) {
    const r = buyUpgrade(cur, id, what);
    if (!r.ok) return r;
    cur = r.state;
  }
  return { ok: true, state: cur };
}
