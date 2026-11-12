// Nonna's night oven (v5.14): the away meter and its upgrades. The oven holds 4 h of away time at first (the base cap), then
// 8 h and 12 h; each tier is bought once, city-wide. Tier 2 opens when Waterfront is built, tier 3 when Industrial is. The price
// is minutes of citywide income, using the same boost-free income the rewards pay (rewards.ts), so a booster can't inflate it.
// The numbers are NIGHT_OVEN in content/hooks.ts; the owned tier is `GameState.nightOven` and the offline tick reads it
// (game.ts `offlineCapOf`).
import { NIGHT_OVEN } from '../content/hooks';
import { def, offlineCapOf, type BuyResult, type GameState } from './game';
import { money } from './format';
import { minutesToCash } from './rewards';

/** The highest tier index. */
export const MAX_TIER = NIGHT_OVEN.capSeconds.length - 1;

/** 14400 → "4 h", 41400 → "11.5 h", 1800 → "30 min". */
export function hoursText(seconds: number): string {
  if (seconds < 3600) return `${Math.max(0, Math.round(seconds / 60))} min`;
  const h = Math.round((seconds / 3600) * 10) / 10;
  return `${h} h`;
}

/** The HUD chip: "🌙 4 h". */
export const nightOvenChip = (s: Pick<GameState, 'nightOven'>): string => `🌙 ${hoursText(offlineCapOf(s))}`;

/** The next tier to buy, or null when the oven is as big as it gets. */
export const nextTier = (s: Pick<GameState, 'nightOven'>): number | null => (s.nightOven < MAX_TIER ? s.nightOven + 1 : null);

/** What a tier costs now: its minutes of citywide income, never less than NIGHT_OVEN.minPrice. */
export const nightOvenPrice = (s: GameState, tier: number): number => Math.max(NIGHT_OVEN.minPrice, Math.ceil(minutesToCash(s, NIGHT_OVEN.priceMinutes[tier] ?? 0)));

/** Why a tier can't be bought yet (other than cash), or null. */
export function nightOvenLock(s: GameState, tier: number): string | null {
  const hood = NIGHT_OVEN.needsBuilt[tier];
  if (hood && !s.shops[hood].built) return `Unlocks when you build ${def(hood).name}`;
  if (tier > s.nightOven + 1) return `Needs the ${hoursText(NIGHT_OVEN.capSeconds[tier - 1])} oven first`;
  return null;
}

export interface NightOvenTier {
  tier: number;
  /** "8 h" */
  hours: string;
  state: 'owned' | 'next' | 'later';
  /** "Owned", the price, or the reason it is locked. */
  note: string;
}

export interface NightOvenView {
  chip: string;
  /** The oven's size now: "4 h". */
  hours: string;
  /** The info sheet's text. */
  body: string;
  /** "Leave now and it's full in 4 h." */
  leaveLine: string;
  tiers: NightOvenTier[];
  /** The next tier on offer (the drawer card and the sheet's buy button), or null when maxed. */
  next: null | { tier: number; title: string; hours: string; price: number; lock: string | null; canBuy: boolean };
}

export function nightOvenView(s: GameState): NightOvenView {
  const hours = hoursText(offlineCapOf(s));
  const nt = nextTier(s);
  const tiers: NightOvenTier[] = NIGHT_OVEN.capSeconds.map((cap, tier) => {
    const lock = tier > s.nightOven ? nightOvenLock(s, tier) : null;
    const state = tier <= s.nightOven ? 'owned' : tier === nt ? 'next' : 'later';
    const note = state === 'owned' ? 'Owned' : lock ?? money(nightOvenPrice(s, tier));
    return { tier, hours: hoursText(cap), state, note };
  });
  const next =
    nt === null
      ? null
      : (() => {
          const price = nightOvenPrice(s, nt);
          const lock = nightOvenLock(s, nt);
          return { tier: nt, title: `Night oven: holds ${hoursText(NIGHT_OVEN.capSeconds[nt])}`, hours: hoursText(NIGHT_OVEN.capSeconds[nt]), price, lock, canBuy: !lock && s.cash >= price };
        })();
  return {
    chip: nightOvenChip(s),
    hours,
    body: `While you're away, Nonna's night oven keeps baking for up to ${hours}. Come back before it's full!`,
    leaveLine: `Leave now and it's full in ${hours}.`,
    tiers,
    next,
  };
}

/** Buy the next tier: spends its price and raises the cap. */
export function buyNightOven(s: GameState): BuyResult {
  const tier = nextTier(s);
  if (tier === null) return { ok: false, reason: 'The night oven is as big as it gets' };
  const lock = nightOvenLock(s, tier);
  if (lock) return { ok: false, reason: lock };
  const price = nightOvenPrice(s, tier);
  if (s.cash < price) return { ok: false, reason: 'Not enough cash' };
  return { ok: true, state: { ...s, cash: s.cash - price, nightOven: tier } };
}
