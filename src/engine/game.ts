// Pure game logic: no React, no storage. Everything here is unit-testable.
import { NEIGHBORHOODS, TUNING, VEHICLES } from '../content/tuning';
import type { NeighborhoodId, Scene, SceneReward } from '../content/types';

export const SAVE_VERSION = 1;

export interface GameState {
  saveVersion: number;
  cash: number;
  totalEarned: number;
  ovenLevel: number;
  drivers: number;
  /** Index into VEHICLES. */
  vehicle: number;
  unlocked: NeighborhoodId[];
  /** Pizzas delivered per neighborhood (fractional while in transit). */
  delivered: Record<NeighborhoodId, number>;
  /** Finished pizzas waiting on the shelf. */
  stock: number;
  /** Finished pizzas still in the oven because the shelf had no room (moved over as space frees up). */
  ovenHeld: number;
  /** Seconds into the current batch; -1 when the oven is idle. */
  batchProgress: number;
  autoBake: boolean;
  dronesUnlocked: boolean;
  cityComplete: boolean;
  seenScenes: string[];
  /** How many scenes had been seen when the Scrapbook was last opened (drives the badge). */
  scrapbookViewed: number;
  lastSavedAt: number;
}

export function newGame(now: number): GameState {
  return {
    saveVersion: SAVE_VERSION,
    cash: 0,
    totalEarned: 0,
    ovenLevel: 1,
    drivers: TUNING.drivers.start,
    vehicle: 0,
    unlocked: ['downtown'],
    delivered: { downtown: 0, suburbs: 0, waterfront: 0, university: 0, industrial: 0, uptown: 0 },
    stock: 0,
    ovenHeld: 0,
    batchProgress: -1,
    autoBake: false,
    dronesUnlocked: false,
    cityComplete: false,
    seenScenes: [],
    scrapbookViewed: 0,
    lastSavedAt: now,
  };
}

/** Merge a loaded save over a fresh game so missing/new fields get defaults. */
export function migrate(raw: unknown, now: number): GameState {
  const base = newGame(now);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<GameState>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const validIds = new Set(NEIGHBORHOODS.map((n) => n.id));
  const unlocked = Array.isArray(r.unlocked)
    ? (r.unlocked.filter((id) => validIds.has(id)) as NeighborhoodId[])
    : base.unlocked;
  return {
    ...base,
    cash: Math.max(0, num(r.cash, 0)),
    totalEarned: Math.max(0, num(r.totalEarned, 0)),
    ovenLevel: Math.max(1, Math.floor(num(r.ovenLevel, 1))),
    drivers: Math.max(1, Math.floor(num(r.drivers, 1))),
    vehicle: Math.min(VEHICLES.length - 1, Math.max(0, Math.floor(num(r.vehicle, 0)))),
    unlocked: unlocked.includes('downtown') ? unlocked : ['downtown', ...unlocked],
    delivered: { ...base.delivered, ...(r.delivered ?? {}) },
    stock: Math.max(0, num(r.stock, 0)),
    ovenHeld: Math.max(0, num(r.ovenHeld, 0)),
    batchProgress: num(r.batchProgress, -1),
    autoBake: !!r.autoBake,
    dronesUnlocked: !!r.dronesUnlocked,
    cityComplete: !!r.cityComplete,
    seenScenes: Array.isArray(r.seenScenes) ? r.seenScenes.filter((s) => typeof s === 'string') : [],
    // Saves from before the badge existed: treat everything already seen as viewed.
    scrapbookViewed: Math.max(0, Math.floor(num(r.scrapbookViewed, Array.isArray(r.seenScenes) ? r.seenScenes.length : 0))),
    lastSavedAt: num(r.lastSavedAt, now),
  };
}

// ---------- Formulas ----------

export function upgradeCost(baseCost: number, timesBought: number): number {
  return Math.ceil(baseCost * Math.pow(TUNING.costGrowth, timesBought));
}

export function milestoneMultiplier(level: number): number {
  return TUNING.milestones.reduce((m, at) => (level >= at ? m * 2 : m), 1);
}

/** Next milestone level at or above `level`, or null when all are passed. */
export function nextMilestone(level: number): number | null {
  return TUNING.milestones.find((at) => at > level) ?? null;
}

export const ovenCost = (s: GameState) => upgradeCost(TUNING.oven.baseCost, s.ovenLevel - 1);
export const driverCost = (s: GameState) => upgradeCost(TUNING.drivers.baseCost, s.drivers - TUNING.drivers.start);

export function bakeSeconds(ovenLevel: number): number {
  const o = TUNING.oven;
  return o.bakeSeconds / (1 + o.speedPerLevel * (ovenLevel - 1)) / milestoneMultiplier(ovenLevel);
}

export const batchSize = () => TUNING.oven.batchSize;
export const shelfCapacity = () => TUNING.oven.batchSize * TUNING.oven.shelfBatches;
/** A new batch can start once the oven is empty and the shelf has any room. Nothing is ever thrown away. */
export const canStartBatch = (s: GameState) => s.ovenHeld <= 1e-9 && s.stock < shelfCapacity() - 1e-9;
/** Shelf (and oven) can't take more pizzas right now. */
export const shelfFull = (s: GameState) => s.stock >= shelfCapacity() - 1e-9 || s.ovenHeld > 1e-9;

/** Pizzas per second the oven makes while baking continuously. */
export function bakeRate(s: GameState): number {
  return batchSize() / bakeSeconds(s.ovenLevel);
}

export function unlockedDefs(s: GameState) {
  return NEIGHBORHOODS.filter((n) => s.unlocked.includes(n.id));
}

/** Round-trip seconds to a neighborhood with the current vehicle. */
export function tripSeconds(distance: number, vehicleIndex: number): number {
  return (2 * distance) / VEHICLES[vehicleIndex].speed;
}

export function tripCapacity(s: GameState): number {
  return VEHICLES[s.vehicle].capacity * milestoneMultiplier(s.drivers);
}

/**
 * Pizzas per second the fleet can deliver. Drivers rotate through unlocked
 * neighborhoods in turn, so each neighborhood gets an equal share of trips.
 */
export function deliveryRate(s: GameState): number {
  const hoods = unlockedDefs(s);
  const totalTrip = hoods.reduce((t, n) => t + tripSeconds(n.distance, s.vehicle), 0);
  return (s.drivers * tripCapacity(s) * hoods.length) / totalTrip;
}

/** Average cash per pizza across the rotation. */
export function valuePerPizza(s: GameState): number {
  const hoods = unlockedDefs(s);
  return hoods.reduce((t, n) => t + n.orderValue, 0) / hoods.length;
}

/** Steady-state cash per second with the oven running continuously. */
export function earningsPerSecond(s: GameState): number {
  return Math.min(bakeRate(s), deliveryRate(s)) * valuePerPizza(s);
}

/** Which side is the bottleneck, for UI hints. */
export function bottleneck(s: GameState): 'oven' | 'drivers' {
  return bakeRate(s) < deliveryRate(s) ? 'oven' : 'drivers';
}

// ---------- Actions ----------

/** Tap the oven: starts a batch when idle, otherwise rushes the current one. */
export function tapOven(s: GameState): GameState {
  if (s.batchProgress < 0) {
    if (!canStartBatch(s)) return s;
    return { ...s, batchProgress: 0 };
  }
  const t = bakeSeconds(s.ovenLevel);
  return { ...s, batchProgress: Math.min(t, s.batchProgress + t * 0.12) };
}

function credit(s: GameState, pizzas: number, perHoodShare: boolean): GameState {
  if (pizzas <= 0) return s;
  const hoods = unlockedDefs(s);
  const delivered = { ...s.delivered };
  if (perHoodShare) for (const n of hoods) delivered[n.id] += pizzas / hoods.length;
  const earned = pizzas * valuePerPizza(s);
  return { ...s, delivered, cash: s.cash + earned, totalEarned: s.totalEarned + earned };
}

/** Advance the simulation by dt seconds (meant for small dt, ≤ a few seconds). */
export function tick(s: GameState, dt: number): GameState {
  if (!(dt > 0)) return s;
  let next = { ...s };
  const shelf = shelfCapacity();
  const t = bakeSeconds(next.ovenLevel);

  // Fast automated oven (batches quicker than the tick): model baking and delivering as continuous
  // flows so output isn't capped at one shelf per tick.
  if (next.autoBake && t < dt * 2) {
    const available = next.stock + next.ovenHeld + bakeRate(next) * dt;
    const out = Math.min(available, deliveryRate(next) * dt);
    next.stock = Math.min(shelf, available - out);
    next.ovenHeld = 0;
    next.batchProgress = ((Math.max(0, next.batchProgress) + dt) % t + t) % t; // keeps the ring spinning
    return credit(next, out, true);
  }

  const settle = () => {
    // Move held pizzas from the oven onto the shelf as space frees up.
    const room = Math.max(0, shelf - next.stock);
    const move = Math.min(room, next.ovenHeld);
    next.stock += move;
    next.ovenHeld -= move;
  };
  settle();
  if (next.autoBake && next.batchProgress < 0 && canStartBatch(next)) next.batchProgress = 0;

  if (next.batchProgress >= 0) {
    next.batchProgress += dt;
    while (next.batchProgress >= t) {
      if (next.ovenHeld > 1e-9) {
        next.batchProgress = t; // previous batch still waiting for shelf space
        break;
      }
      next.ovenHeld += batchSize();
      settle();
      next.batchProgress -= t;
      if (!next.autoBake) {
        next.batchProgress = -1;
        break;
      }
      if (!canStartBatch(next)) {
        next.batchProgress = -1; // wait for room, restart next tick
        break;
      }
    }
  }

  const out = Math.min(next.stock, deliveryRate(next) * dt);
  next.stock -= out;
  settle();
  next = credit(next, out, true);
  return next;
}

export interface OfflineResult {
  state: GameState;
  seconds: number;
  earned: number;
}

/** Catch up after the app was closed. Only an automated oven keeps baking. */
export function applyOffline(s: GameState, now: number): OfflineResult {
  const elapsed = Math.max(0, (now - s.lastSavedAt) / 1000);
  const seconds = Math.min(elapsed, TUNING.offlineCapSeconds);
  const before = s.cash;
  let next = { ...s, lastSavedAt: now, stock: s.stock + s.ovenHeld, ovenHeld: 0 };
  const fromStock = Math.min(next.stock, deliveryRate(next) * seconds);
  next.stock -= fromStock;
  let pizzas = fromStock;
  if (next.autoBake) {
    pizzas += Math.min(bakeRate(next), deliveryRate(next)) * Math.max(0, seconds - fromStock / deliveryRate(next));
  }
  next = credit(next, pizzas, true);
  return { state: next, seconds, earned: next.cash - before };
}

export type BuyResult = { ok: true; state: GameState } | { ok: false; reason: string };

function spend(s: GameState, cost: number): BuyResult {
  if (s.cash < cost) return { ok: false, reason: 'Not enough cash' };
  return { ok: true, state: { ...s, cash: s.cash - cost } };
}

export function buyOven(s: GameState): BuyResult {
  const r = spend(s, ovenCost(s));
  return r.ok ? { ok: true, state: { ...r.state, ovenLevel: s.ovenLevel + 1 } } : r;
}

export function buyDriver(s: GameState): BuyResult {
  const r = spend(s, driverCost(s));
  return r.ok ? { ok: true, state: { ...r.state, drivers: s.drivers + 1 } } : r;
}

export function nextVehicleLock(s: GameState): string | null {
  const next = s.vehicle + 1;
  if (next >= VEHICLES.length) return 'Top tier';
  if (VEHICLES[next].id === 'drone' && !s.dronesUnlocked) return 'Unlocks in Priya’s story';
  return null;
}

export function buyVehicle(s: GameState): BuyResult {
  const lock = nextVehicleLock(s);
  if (lock) return { ok: false, reason: lock };
  const r = spend(s, VEHICLES[s.vehicle + 1].cost);
  return r.ok ? { ok: true, state: { ...r.state, vehicle: s.vehicle + 1 } } : r;
}

export function neighborhoodLock(s: GameState, id: NeighborhoodId): string | null {
  const idx = NEIGHBORHOODS.findIndex((n) => n.id === id);
  const def = NEIGHBORHOODS[idx];
  if (s.unlocked.includes(id)) return 'Unlocked';
  if (idx > 0 && !s.unlocked.includes(NEIGHBORHOODS[idx - 1].id)) return `Unlock ${NEIGHBORHOODS[idx - 1].name} first`;
  if (s.vehicle < def.minVehicle) return `Needs a ${VEHICLES[def.minVehicle].name}`;
  return null;
}

export function unlockNeighborhood(s: GameState, id: NeighborhoodId): BuyResult {
  const lock = neighborhoodLock(s, id);
  if (lock) return { ok: false, reason: lock };
  const def = NEIGHBORHOODS.find((n) => n.id === id)!;
  const r = spend(s, def.unlockCost);
  return r.ok ? { ok: true, state: { ...r.state, unlocked: [...s.unlocked, id] } } : r;
}

// ---------- Story ----------

export function sceneTriggered(s: GameState, scene: Scene): boolean {
  const tr = scene.trigger;
  if (!s.unlocked.includes(tr.neighborhood)) return false;
  if (tr.kind === 'unlock') return true;
  return s.delivered[tr.neighborhood] >= tr.count;
}

/** Unseen scenes whose triggers pass, in story order (earliest first). */
export function pendingScenes(s: GameState, scenes: Scene[]): Scene[] {
  const seen = new Set(s.seenScenes);
  return scenes.filter((sc) => !seen.has(sc.id) && sceneTriggered(s, sc));
}

export function applyReward(s: GameState, reward: SceneReward | undefined): GameState {
  switch (reward) {
    case 'auto-bake':
      return { ...s, autoBake: true, batchProgress: s.batchProgress < 0 ? 0 : s.batchProgress };
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
  return applyReward({ ...s, seenScenes: [...s.seenScenes, scene.id] }, scene.reward);
}
