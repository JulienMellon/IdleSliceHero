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
  /** Card frame: solid red when the bottleneck is affordable, dashed while the player saves for it. */
  frame: 'hot' | 'waiting' | null;
}

let cacheKey = '';
let cacheVal: StationModel[] = [];

function levelKey(s: G.GameState, id: NeighborhoodId) {
  const sh = s.shops[id];
  return `${id}|${sh.built}|${sh.managed}|${sh.prep}|${sh.ovens}|${sh.counter}|${sh.drivers}|${sh.tables}|${sh.grade}|${sh.footprint}|${sh.perk}|${s.vehicle}|${Object.values(sh.decor).join(',')}`;
}

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
      tone: buttonTone({ lock, gain }) === 'nogain' ? 'nogain' : 'normal',
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
    return { ...m, affordable, frame: m.neck ? (affordable ? 'hot' : 'waiting') : null };
  });
}
