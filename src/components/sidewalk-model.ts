// What each sidewalk station button shows, as plain data (A16). The level-dependent part (cost, lock, gain, which
// stations are tied for the bottleneck) is cached on the shop's levels, so the 200 ms tick doesn't rerun four
// upgrade simulations (M26); only `affordable` depends on cash. Pure: unit-tested in node.
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as G from '../engine/game';

/**
 * The one rule for a purchase button's tone, shared by the sidewalk and the drawer (C60/G75): a locked or maxed
 * upgrade is never "no gain" (it shows its reason or MAX), and a muted (unmanaged) card stays neutral.
 */
export function buttonTone({ lock, gain, muted = false }: { lock: string | null | boolean; gain: number | null; muted?: boolean }): 'normal' | 'neutral' | 'nogain' {
  if (muted) return 'neutral';
  if (lock) return 'normal';
  return (gain ?? 0) > 1e-9 ? 'normal' : 'nogain';
}

/** The unmuted case of `buttonTone` (sidewalk stations are never muted). */
export const stationTone = (lock: string | null, gain: number | null): 'normal' | 'nogain' => (lock || (gain ?? 0) > 1e-9 ? 'normal' : 'nogain');

/**
 * "need $X": what is still missing for a purchase, rounded up so it never reads "need $0" (D359). Null when the
 * player has enough, or there is nothing to buy (a locked or maxed upgrade has no cost).
 */
export function needText(cost: number | null, cash: number): string | null {
  if (cost === null || !Number.isFinite(cost) || cash >= cost) return null;
  return `need ${money(Math.max(1, Math.ceil(cost - cash - 1e-9)))}`;
}

export type StationKey = 'prep' | 'ovens' | 'counter' | 'drivers';
export const STATION_KEYS: StationKey[] = ['prep', 'ovens', 'counter', 'drivers'];
const STATION: Record<StationKey, { what: G.Upgrade; name: string; stage: G.Stage }> = {
  prep: { what: 'prep', name: 'PREP', stage: 'prep' },
  ovens: { what: 'ovens', name: 'OVENS', stage: 'ovens' },
  counter: { what: 'counter', name: 'COUNTER', stage: 'counter' },
  drivers: { what: 'drivers', name: 'DRIVERS', stage: 'customers' },
};

export interface StationModel {
  key: StationKey;
  what: G.Upgrade;
  name: string;
  level: string;
  cost: number | null;
  /** Why it can't be bought (ignoring cash), or null. */
  lock: string | null;
  label: string;
  /** `nogain` when an unlocked upgrade adds nothing right now. */
  tone: 'normal' | 'nogain';
  /** Tied for the bottleneck and adds income: the station to buy. */
  neck: boolean;
}

export interface StationView extends StationModel {
  affordable: boolean;
  /** "need $X" for the 9 pt line under the price: only while the player is short and has some cash (at $0 it would just repeat the price), else null. */
  need: string | null;
  /** Card frame: solid red when the bottleneck is affordable, dashed while the player saves for it. */
  frame: 'hot' | 'waiting' | null;
  /** How close the player is to the bottleneck they're saving for, 0–1 (0 unless `frame` is waiting). */
  progress: number;
}

let cacheKey = '';
let cacheVal: StationModel[] = [];

const levelKey = G.shopLevelKey;

/** The level-dependent part of every station button, cached on the shop's levels. */
export function stationModels(s: G.GameState, id: NeighborhoodId): StationModel[] {
  const key = levelKey(s, id);
  if (key === cacheKey) return cacheVal;
  const shop = s.shops[id];
  const rates: Record<G.Stage, number> = { prep: G.prepRate(shop), ovens: G.ovenRate(shop), counter: G.counterRate(shop), customers: G.demandRate(shop, s.vehicle) };
  const min = Math.min(...Object.values(rates));
  cacheVal = STATION_KEYS.map((k) => {
    const { what, name, stage } = STATION[k];
    const cost = G.upgradeCostOf(s, id, what);
    const lock = G.upgradeLock(s, id, what);
    const gain = G.upgradeGain(s, id, what);
    const useful = (gain ?? 0) > 1e-9;
    return {
      key: k,
      what,
      name,
      level: k === 'drivers' ? `×${shop.drivers}` : `${shop[k]}`,
      cost,
      lock,
      label: lock ? 'MAX' : money(cost ?? 0),
      tone: stationTone(lock, gain),
      neck: useful && rates[stage] <= min * (1 + 1e-9),
    };
  });
  cacheKey = key;
  return cacheVal;
}

/** Add the cash-dependent part. */
export function stationViews(s: G.GameState, id: NeighborhoodId): StationView[] {
  return stationModels(s, id).map((m) => {
    const affordable = !m.lock && m.cost !== null && s.cash >= m.cost;
    const frame = m.neck ? (affordable ? 'hot' : 'waiting') : null;
    const progress = frame === 'waiting' && m.cost ? Math.min(1, Math.max(0, s.cash / m.cost)) : 0;
    return { ...m, affordable, need: m.lock || s.cash <= 0 ? null : needText(m.cost, s.cash), frame, progress };
  });
}

/**
 * The need line a station button actually draws. A framed card that is saving for its bottleneck already shows a
 * progress bar in the same spot at the foot of the button, so it keeps the bar and skips the text (D402).
 */
export function needLine(v: StationView, framed: boolean): string | null {
  return framed && v.frame === 'waiting' ? null : v.need;
}

// ---------- the tied-stations bundle button (D304) ----------

export interface BundleButton {
  label: string;
  /** Small line above the label: what it buys, or what is missing. */
  sub: string;
  enabled: boolean;
  steps: G.Upgrade[];
}

/** "Buy both · $35": the drawer's tied-station banner as a button. Disabled with the "need $X" style when short. */
export function bundleButton(hint: G.BundleHint, cash: number): BundleButton {
  const kinds = new Set(hint.steps).size;
  const word = kinds <= 2 ? 'both' : `all ${kinds}`;
  const need = needText(hint.cost, cash);
  return {
    label: `Buy ${word} · ${money(hint.cost)}`,
    sub: need ? `${hint.label} · ${need}` : `${hint.label} · one alone adds $0/s`,
    enabled: need === null,
    steps: hint.steps,
  };
}

/** Buy each step through the ordinary buy path; stops at the first refusal. True when every step went through. */
export function buyBundle(steps: readonly G.Upgrade[], buy: (what: G.Upgrade) => boolean): boolean {
  for (const what of steps) if (!buy(what)) return false;
  return steps.length > 0;
}

// ---------- the Pier 9 warning on the build chip ----------

/** While the Pier 9 bid is on offer (and not yet won), building spends the cash saved for it: say so under the chip's price. */
export function buildChipHint(s: G.GameState): string | null {
  // reads as a cost, not a reward, and is short enough for the ~94 pt chip at 9 pt (D402)
  return G.pier9Available(s) ? 'uses bid cash' : null;
}
