// Pure game logic: no React, no storage. Everything here is unit-testable.
//
// Every neighborhood has its own pizzeria. Each pizzeria is a pipeline:
//   Prep → Ovens → Counter → customers (delivery drivers + walk-ins at the tables)
// and sells pizzas at the rate of its slowest stage. City income is the sum of all pizzerias.
import { DECOR_BOOST, DECOR_KINDS, DECOR_TIER_COST, FOOTPRINTS, NEIGHBORHOODS, NONNA_TAKEOVER, OVEN_GRADES, STATIONS, TUNING, VEHICLES, type DecorKind, type NeighborhoodDef } from '../content/tuning';
import type { NeighborhoodId, Scene, SceneReward } from '../content/types';

export const SAVE_VERSION = 2;
export const SHOP_IDS = NEIGHBORHOODS.map((n) => n.id);

export interface Shop {
  built: boolean;
  /** With a manager the shop runs itself; without one it only bakes the batches you tap for. */
  managed: boolean;
  prep: number;
  ovens: number;
  /** Index into OVEN_GRADES. */
  grade: number;
  counter: number;
  drivers: number;
  tables: number;
  /** Index into FOOTPRINTS. */
  footprint: number;
  /** Tapped batches waiting to be made (unmanaged shops only). */
  queued: number;
  /** Lifetime pizzas sold here (drives story triggers). */
  sold: number;
  /** Decor tier (0–3) per category; each tier owned adds DECOR_BOOST to prices here. */
  decor: Record<DecorKind, number>;
}

export interface GameState {
  saveVersion: number;
  cash: number;
  totalEarned: number;
  /** City-wide fleet tier: index into VEHICLES. */
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
}

export const newDecor = (): Record<DecorKind, number> => ({ plants: 0, flooring: 0, tables: 0, walls: 0, signage: 0 });

export function newShop(built = false): Shop {
  return { built, managed: false, prep: 1, ovens: 1, grade: 0, counter: 1, drivers: 1, tables: 1, footprint: 0, queued: 0, sold: 0, decor: newDecor() };
}

export function newGame(now: number): GameState {
  const shops = Object.fromEntries(SHOP_IDS.map((id) => [id, newShop(id === 'downtown')])) as Record<NeighborhoodId, Shop>;
  return {
    saveVersion: SAVE_VERSION,
    cash: 0,
    totalEarned: 0,
    vehicle: 0,
    shops,
    active: 'downtown',
    dronesUnlocked: false,
    cityComplete: false,
    seenScenes: [],
    scrapbookViewed: 0,
    lastSavedAt: now,
  };
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const int = (v: unknown, d: number, min: number, max = Number.MAX_SAFE_INTEGER) => Math.min(max, Math.max(min, Math.floor(num(v, d))));

/** Load any save (v1 single-shop or v2) over a fresh game so missing fields get defaults. */
export function migrate(raw: unknown, now: number): GameState {
  const base = newGame(now);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const seen = Array.isArray(r.seenScenes) ? (r.seenScenes as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  const game: GameState = {
    ...base,
    cash: Math.max(0, num(r.cash, 0)),
    totalEarned: Math.max(0, num(r.totalEarned, 0)),
    vehicle: int(r.vehicle, 0, 0, VEHICLES.length - 1),
    active: SHOP_IDS.includes(r.active as NeighborhoodId) ? (r.active as NeighborhoodId) : 'downtown',
    dronesUnlocked: !!r.dronesUnlocked,
    cityComplete: !!r.cityComplete,
    seenScenes: seen,
    // Saves from before the badge existed: treat everything already seen as viewed.
    scrapbookViewed: int(r.scrapbookViewed, seen.length, 0),
    lastSavedAt: num(r.lastSavedAt, now),
  };
  if (r.shops && typeof r.shops === 'object') {
    for (const id of SHOP_IDS) {
      const s = (r.shops as Record<string, Record<string, unknown>>)[id];
      if (!s || typeof s !== 'object') continue;
      game.shops[id] = {
        built: id === 'downtown' || !!s.built,
        managed: !!s.managed,
        prep: int(s.prep, 1, 1),
        ovens: int(s.ovens, 1, 1),
        grade: int(s.grade, 0, 0, OVEN_GRADES.length - 1),
        counter: int(s.counter, 1, 1),
        drivers: int(s.drivers, 1, 1),
        tables: int(s.tables, 1, 1),
        footprint: int(s.footprint, 0, 0, FOOTPRINTS.length - 1),
        queued: Math.max(0, num(s.queued, 0)),
        decor: Object.fromEntries(DECOR_KINDS.map((k) => [k, int((s.decor as Record<string, unknown> | undefined)?.[k], 0, 0, 3)])) as Record<DecorKind, number>,
        sold: Math.max(0, num(s.sold, 0)),
      };
    }
  } else {
    // v1 save: one shop delivering to several neighborhoods. Its oven and drivers become Downtown's,
    // and every neighborhood it delivered to gets a starter pizzeria.
    const unlocked = Array.isArray(r.unlocked) ? (r.unlocked as string[]) : [];
    const delivered = (r.delivered ?? {}) as Record<string, number>;
    for (const id of SHOP_IDS) {
      if (id === 'downtown' || unlocked.includes(id)) game.shops[id] = { ...newShop(true), sold: Math.max(0, num(delivered[id], 0)) };
    }
    const d = game.shops.downtown;
    d.ovens = Math.min(levelCap(d), int(r.ovenLevel, 1, 1));
    d.drivers = int(r.drivers, 1, 1);
    d.managed = !!r.autoBake;
  }
  game.shops.downtown.built = true;
  if (!game.shops[game.active].built) game.active = 'downtown';
  return game;
}

// ---------- Formulas ----------

export function upgradeCost(baseCost: number, timesBought: number, growth: number = TUNING.costGrowth): number {
  return Math.ceil(baseCost * Math.pow(growth, timesBought));
}

export function milestoneMultiplier(level: number): number {
  return TUNING.milestones.reduce((m, at) => (level >= at ? m * 2 : m), 1);
}

/** Next milestone level above `level`, or null when all are passed. */
export function nextMilestone(level: number): number | null {
  return TUNING.milestones.find((at) => at > level) ?? null;
}

export const def = (id: NeighborhoodId): NeighborhoodDef => NEIGHBORHOODS.find((n) => n.id === id)!;

/** Prep, ovens and counter can't level past this until the footprint grows. */
export const levelCap = (shop: Shop) => TUNING.levelsPerFootprint * (shop.footprint + 1);

const levelSpeed = (base: number, level: number) => base * (1 + TUNING.speedPerLevel * (level - 1)) * milestoneMultiplier(level);

/** Room to work: each expansion speeds up prep and the counter. */
export const footprintMult = (shop: Shop) => Math.pow(TUNING.footprintBoost, shop.footprint);
export const prepRate = (shop: Shop) => levelSpeed(STATIONS.prep.speed, shop.prep) * footprintMult(shop);
export const ovenRate = (shop: Shop) => levelSpeed(STATIONS.ovens.speed, shop.ovens) * OVEN_GRADES[shop.grade].mult;
export const counterRate = (shop: Shop) => levelSpeed(STATIONS.counter.speed, shop.counter) * footprintMult(shop);
export const tripSeconds = (vehicle: number) => TUNING.deliveryRoundTrip / VEHICLES[vehicle].speed;
export const tripCapacity = (shop: Shop, vehicle: number) => VEHICLES[vehicle].capacity * milestoneMultiplier(shop.drivers);
export const deliveryRate = (shop: Shop, vehicle: number) => (shop.drivers * tripCapacity(shop, vehicle)) / tripSeconds(vehicle);
export const walkInRate = (shop: Shop) => levelSpeed(STATIONS.tables.speed, shop.tables);
/** Tables drawn in the cutaway: grows with seating level, limited by the footprint. */
export const tablesShown = (shop: Shop) => Math.min(FOOTPRINTS[shop.footprint].maxTables, 1 + Math.floor((shop.tables - 1) / 6));
export const demandRate = (shop: Shop, vehicle: number) => deliveryRate(shop, vehicle) + walkInRate(shop);

/** Pizzas per second this pizzeria sells when running. */
export function shopRate(shop: Shop, vehicle: number): number {
  return Math.min(prepRate(shop), ovenRate(shop), counterRate(shop), demandRate(shop, vehicle));
}

/**
 * Cash per second a running pizzeria makes. Drivers get first pick of what the kitchen makes
 * (full price); walk-ins buy whatever is left (walkInShare of the price). So adding seats can only
 * ever add sales, never dilute them.
 */
export function shopRevenue(id: NeighborhoodId, shop: Shop, vehicle: number): number {
  const sold = shopRate(shop, vehicle);
  const delivered = Math.min(sold, deliveryRate(shop, vehicle));
  const walkIns = sold - delivered;
  return def(id).orderValue * decorMult(shop) * (delivered + walkIns * TUNING.walkInShare);
}

/** Nicer places charge more: +DECOR_BOOST per decor tier owned. */
export const decorMult = (shop: Shop) => 1 + DECOR_BOOST * DECOR_KINDS.reduce((t, k) => t + (shop.decor?.[k] ?? 0), 0);

/** Average cash per pizza sold right now. */
export function valuePerPizza(id: NeighborhoodId, shop: Shop, vehicle: number): number {
  const sold = shopRate(shop, vehicle);
  return sold > 0 ? shopRevenue(id, shop, vehicle) / sold : def(id).orderValue * decorMult(shop);
}

/** Cash per second this pizzeria makes while running (managed, or while you keep tapping). */
export function shopEarnings(s: GameState, id: NeighborhoodId): number {
  const shop = s.shops[id];
  if (!shop.built) return 0;
  return shopRevenue(id, shop, s.vehicle);
}

/** Cash per second the city earns on its own (managed pizzerias only). */
export function earningsPerSecond(s: GameState): number {
  return SHOP_IDS.reduce((t, id) => t + (s.shops[id].built && s.shops[id].managed ? shopEarnings(s, id) : 0), 0);
}

export type Stage = 'prep' | 'ovens' | 'counter' | 'customers';

/** The slowest stage of a pizzeria's pipeline. */
export function bottleneck(shop: Shop, vehicle: number): Stage {
  const rates: [Stage, number][] = [
    ['prep', prepRate(shop)],
    ['ovens', ovenRate(shop)],
    ['counter', counterRate(shop)],
    ['customers', demandRate(shop, vehicle)],
  ];
  return rates.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
}

// ---------- Purchases ----------

export type Upgrade = 'prep' | 'ovens' | 'counter' | 'drivers' | 'tables' | 'grade' | 'expand' | 'manager';
export type BuyResult = { ok: true; state: GameState } | { ok: false; reason: string };

/** Cost of an upgrade in a pizzeria, or null when it's maxed/not available. */
export function upgradeCostOf(s: GameState, id: NeighborhoodId, what: Upgrade): number | null {
  const shop = s.shops[id];
  const m = def(id).costMult;
  switch (what) {
    case 'prep':
      return upgradeCost(STATIONS.prep.cost * m, shop.prep - 1);
    case 'ovens':
      return upgradeCost(STATIONS.ovens.cost * m, shop.ovens - 1);
    case 'counter':
      return upgradeCost(STATIONS.counter.cost * m, shop.counter - 1);
    case 'drivers':
      return upgradeCost(STATIONS.drivers.cost * m, shop.drivers - 1);
    case 'tables':
      return upgradeCost(STATIONS.tables.cost * m, shop.tables - 1);
    case 'grade':
      return shop.grade + 1 < OVEN_GRADES.length ? Math.ceil(OVEN_GRADES[shop.grade + 1].cost * m) : null;
    case 'expand':
      return shop.footprint + 1 < FOOTPRINTS.length ? Math.ceil(FOOTPRINTS[shop.footprint + 1].cost * m) : null;
    case 'manager':
      return shop.managed ? null : def(id).managerCost;
  }
}

/** Why an upgrade can't be bought right now (ignoring cash), or null if it can. */
export function upgradeLock(s: GameState, id: NeighborhoodId, what: Upgrade): string | null {
  const shop = s.shops[id];
  if (!shop.built) return 'Build this pizzeria first';
  const cap = levelCap(shop);
  switch (what) {
    case 'prep':
    case 'ovens':
    case 'counter':
    case 'tables':
      return shop[what] >= cap ? (shop.footprint + 1 < FOOTPRINTS.length ? `Expand to go past Lv ${cap}` : 'Max level') : null;
    case 'grade':
      return shop.grade + 1 >= OVEN_GRADES.length ? 'Finest ovens in town' : null;
    case 'expand':
      return shop.footprint + 1 >= FOOTPRINTS.length ? 'Biggest it gets' : null;
    case 'manager':
      if (shop.managed) return 'Hired';
      if (id === 'downtown') return nonnaCountdownText(s);
      return null;
    case 'drivers':
      // a save that already went past the cap (before the cap existed) quotes its own level, not the lower cap
      return shop.drivers >= cap ? (shop.footprint + 1 < FOOTPRINTS.length ? `Expand to go past Lv ${shop.drivers}` : 'Max drivers') : null;
  }
}

function spend(s: GameState, cost: number): BuyResult {
  if (s.cash < cost) return { ok: false, reason: 'Not enough cash' };
  return { ok: true, state: { ...s, cash: s.cash - cost } };
}

function withShop(s: GameState, id: NeighborhoodId, patch: Partial<Shop>): GameState {
  return { ...s, shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } } };
}

export function buyUpgrade(s: GameState, id: NeighborhoodId, what: Upgrade): BuyResult {
  const lock = upgradeLock(s, id, what);
  if (lock) return { ok: false, reason: lock };
  const cost = upgradeCostOf(s, id, what);
  if (cost === null) return { ok: false, reason: 'Maxed out' };
  const r = spend(s, cost);
  if (!r.ok) return r;
  const shop = s.shops[id];
  const patch: Partial<Shop> =
    what === 'grade'
      ? { grade: shop.grade + 1 }
      : what === 'expand'
        ? { footprint: shop.footprint + 1 }
        : what === 'manager'
          ? { managed: true, queued: 0 }
          : { [what]: shop[what] + 1 };
  return { ok: true, state: withShop(r.state, id, patch) };
}

export function nextToBuild(s: GameState): NeighborhoodDef | null {
  return NEIGHBORHOODS.find((n) => !s.shops[n.id].built) ?? null;
}

export function buildLock(s: GameState, id: NeighborhoodId): string | null {
  const idx = NEIGHBORHOODS.findIndex((n) => n.id === id);
  if (s.shops[id].built) return 'Built';
  if (idx > 0 && !s.shops[NEIGHBORHOODS[idx - 1].id].built) return `Build in ${NEIGHBORHOODS[idx - 1].name} first`;
  // Downtown stops earning once Nonna's tutorial is skipped past; keep the player here until she takes over.
  if (id === 'suburbs' && !s.seenScenes.includes(NONNA_SCENE_ID)) return nonnaCountdownText(s);
  return null;
}

const NONNA_SCENE_ID = NONNA_TAKEOVER.sceneId;

/** Pizzas Downtown still has to deliver before Nonna takes over the kitchen (0 once it's due or seen). */
export function nonnaPizzasLeft(s: GameState): number {
  if (s.seenScenes.includes(NONNA_SCENE_ID)) return 0;
  return Math.max(0, NONNA_TAKEOVER.pizzas - s.shops.downtown.sold);
}

export function nonnaCountdownText(s: GameState): string {
  const n = nonnaPizzasLeft(s);
  return n > 0 ? `Nonna takes over in ${n} more pizza${n === 1 ? '' : 's'}` : 'Nonna is about to take over';
}

export function buildShop(s: GameState, id: NeighborhoodId): BuyResult {
  const lock = buildLock(s, id);
  if (lock) return { ok: false, reason: lock };
  const r = spend(s, def(id).buildCost);
  if (!r.ok) return r;
  return { ok: true, state: { ...withShop(r.state, id, { built: true }), active: id } };
}

/** Why the next delivery vehicle can't be bought yet (other than cash), or null when it can. */
export type VehicleLock = { kind: 'maxed' } | { kind: 'story'; storyOf: 'priya' };

export function nextVehicleLock(s: GameState): VehicleLock | null {
  const next = s.vehicle + 1;
  if (next >= VEHICLES.length) return { kind: 'maxed' };
  if (VEHICLES[next].id === 'drone' && !s.dronesUnlocked) return { kind: 'story', storyOf: 'priya' };
  return null;
}

/** Player-facing text for a vehicle lock. */
export function vehicleLockLabel(lock: VehicleLock) {
  return lock.kind === 'maxed' ? 'Top tier' : 'Unlocks in Priya’s story';
}

export function buyVehicle(s: GameState): BuyResult {
  const lock = nextVehicleLock(s);
  if (lock) return { ok: false, reason: vehicleLockLabel(lock) };
  const r = spend(s, VEHICLES[s.vehicle + 1].cost);
  return r.ok ? { ok: true, state: { ...r.state, vehicle: s.vehicle + 1 } } : r;
}

// ---------- Simulation ----------

/**
 * Tap a pizzeria. Unmanaged: queues one batch for the kitchen to make.
 * Managed: a rush order that pays a moment of that shop's earnings straight away.
 */
export function tapShop(s: GameState, id: NeighborhoodId): GameState {
  const shop = s.shops[id];
  if (!shop.built) return s;
  if (!shop.managed) {
    if (shop.queued >= TUNING.tapQueueMax) return s;
    return withShop(s, id, { queued: Math.min(TUNING.tapQueueMax, shop.queued + TUNING.tapBatch) });
  }
  const bonus = shopEarnings(s, id) * TUNING.rushSeconds;
  return { ...s, cash: s.cash + bonus, totalEarned: s.totalEarned + bonus };
}

/** Advance every pizzeria by dt seconds. Continuous flows, so tick rate never caps output. */
export function tick(s: GameState, dt: number): GameState {
  if (!(dt > 0)) return s;
  let cash = s.cash;
  let earned = 0;
  const shops = { ...s.shops };
  for (const id of SHOP_IDS) {
    const shop = shops[id];
    if (!shop.built) continue;
    let made = shopRate(shop, s.vehicle) * dt;
    let queued = shop.queued;
    if (!shop.managed) {
      made = Math.min(made, queued);
      queued -= made;
    }
    if (made <= 0) continue;
    const pay = made * valuePerPizza(id, shop, s.vehicle);
    cash += pay;
    earned += pay;
    shops[id] = { ...shop, queued, sold: shop.sold + made };
  }
  return { ...s, cash, totalEarned: s.totalEarned + earned, shops };
}

export interface OfflineResult {
  state: GameState;
  seconds: number;
  /** True when the player was away longer than the offline cap. */
  capped: boolean;
  /** Real time away, before the cap. */
  awaySeconds: number;
  earned: number;
  /** Cash each pizzeria made while away (only those that made any). */
  byShop: { id: NeighborhoodId; earned: number; managed: boolean }[];
}

/** Catch up after the app was closed: managed shops run; unmanaged ones finish what was queued. */
export function applyOffline(s: GameState, now: number): OfflineResult {
  const elapsed = Math.max(0, (now - s.lastSavedAt) / 1000);
  const seconds = Math.min(elapsed, TUNING.offlineCapSeconds);
  const next = tick(s, seconds);
  const byShop = SHOP_IDS.map((id) => ({ id, managed: s.shops[id].managed, earned: (next.shops[id].sold - s.shops[id].sold) * valuePerPizza(id, s.shops[id], s.vehicle) })).filter((x) => x.earned > 0);
  return { state: { ...next, lastSavedAt: now }, seconds, capped: elapsed > TUNING.offlineCapSeconds, awaySeconds: elapsed, earned: next.cash - s.cash, byShop };
}

// ---------- Story ----------

export function sceneTriggered(s: GameState, scene: Scene): boolean {
  const tr = scene.trigger;
  const shop = s.shops[tr.neighborhood];
  if (!shop.built) return false;
  if (tr.kind === 'unlock') return true;
  return shop.sold >= tr.count;
}

/** Unseen scenes whose triggers pass, in story order (earliest first). */
export function pendingScenes(s: GameState, scenes: Scene[]): Scene[] {
  const seen = new Set(s.seenScenes);
  return scenes.filter((sc) => !seen.has(sc.id) && sceneTriggered(s, sc));
}

export function applyReward(s: GameState, reward: SceneReward | undefined): GameState {
  switch (reward) {
    case 'auto-bake':
      // Nonna becomes Downtown's manager.
      return withShop(s, 'downtown', { managed: true, queued: 0 });
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

// ---------- Advice ----------

/** Cash/sec this pizzeria gains from an upgrade (counting it as running), or null if unavailable. */
export function upgradeGain(s: GameState, id: NeighborhoodId, what: Upgrade): number | null {
  if (upgradeLock(s, id, what)) return null;
  const r = buyUpgrade({ ...s, cash: Number.MAX_SAFE_INTEGER }, id, what);
  if (!r.ok) return null;
  if (what === 'manager') return shopEarnings(s, id);
  return shopEarnings(r.state, id) - shopEarnings(s, id);
}

/** Cash/sec the whole city gains from the next fleet tier. */
export function vehicleGain(s: GameState): number | null {
  const r = buyVehicle({ ...s, cash: Number.MAX_SAFE_INTEGER });
  if (!r.ok) return null;
  return SHOP_IDS.reduce((t, id) => t + (s.shops[id].built ? shopEarnings(r.state, id) - shopEarnings(s, id) : 0), 0);
}

/** A starting pizzeria's earnings once running. */
export function buildGain(s: GameState, id: NeighborhoodId): number {
  const r = buildShop({ ...s, cash: Number.MAX_SAFE_INTEGER }, id);
  return r.ok ? shopEarnings(r.state, id) : 0;
}

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
  let st: GameState = { ...s, cash: Number.MAX_SAFE_INTEGER };
  const start = shopEarnings(s, id);
  const steps: Upgrade[] = [];
  let cost = 0;
  for (let i = 0; i < maxSteps; i++) {
    const shop = st.shops[id];
    const rates: [Upgrade, number][] = [
      ['prep', prepRate(shop)],
      ['ovens', ovenRate(shop)],
      ['counter', counterRate(shop)],
      ['drivers', demandRate(shop, st.vehicle)],
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
  cost: number;
  gain: number;
  affordable: boolean;
}

let hintKey = '';
let hintVal: Omit<BundleHint, 'affordable'> | null = null;

/** "Upgrade prep + ovens · $X": the tied-station bundle, ready to show in the UI. Cached on levels, decor and fleet (not cash or sales), so a render only pays for it when something was upgraded. */
export function bundleHint(s: GameState, id: NeighborhoodId): BundleHint | null {
  const sh = s.shops[id];
  const key = `${id}|${sh.built}|${sh.managed}|${sh.prep}|${sh.ovens}|${sh.counter}|${sh.drivers}|${sh.tables}|${sh.grade}|${sh.footprint}|${s.vehicle}|${Object.values(sh.decor).join(',')}`;
  if (key !== hintKey) {
    hintKey = key;
    const b = bottleneckBundle(s, id);
    const names = b ? [...new Set(b.steps.map((w) => STEP_LABEL[w] ?? w))] : [];
    hintVal = b ? { label: `Upgrade ${names.join(' + ')}`, cost: b.cost, gain: b.gain } : null;
  }
  return hintVal ? { ...hintVal, affordable: s.cash >= hintVal.cost } : null;
}

// ---------- Decor ----------

export function decorCost(s: GameState, id: NeighborhoodId, kind: DecorKind): number | null {
  const tier = s.shops[id].decor[kind];
  return tier >= 3 ? null : Math.ceil(DECOR_TIER_COST[tier] * def(id).costMult);
}

export function buyDecor(s: GameState, id: NeighborhoodId, kind: DecorKind): BuyResult {
  const shop = s.shops[id];
  if (!shop.built) return { ok: false, reason: 'Build this pizzeria first' };
  const cost = decorCost(s, id, kind);
  if (cost === null) return { ok: false, reason: 'Fully decorated' };
  const r = spend(s, cost);
  if (!r.ok) return r;
  return { ok: true, state: withShop(r.state, id, { decor: { ...shop.decor, [kind]: shop.decor[kind] + 1 } }) };
}

/** Cash/sec this pizzeria gains from the next decor tier (counting it as running). */
export function decorGain(s: GameState, id: NeighborhoodId, kind: DecorKind): number | null {
  const r = buyDecor({ ...s, cash: Number.MAX_SAFE_INTEGER }, id, kind);
  return r.ok ? shopEarnings(r.state, id) - shopEarnings(s, id) : null;
}
