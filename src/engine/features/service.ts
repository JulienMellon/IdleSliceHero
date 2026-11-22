// Service (v5.16, card P1): how the shop is doing, in pizza-shop terms, and what it costs when it goes badly.
//   wanted  = the demand rate with every other feature's demand multipliers, before this feature's own effect (it has none: a cold line
//             "thins out the walk-ins" only in the picture, `queueShare`, because thinning demand changes nothing while the kitchen is the limit)
//   kitchen = the slowest of prep, ovens and counter;  sold = the smaller of the two;  service = sold ÷ wanted (1 when nothing is wanted)
//   Station load = sold ÷ that station's rate: Slammed from 95%, Busy from 60%. The floor's lamp reads wanted ÷ kitchen.
//   Tips: service of 90% or more makes the shop's pizzas worth x1.1. Cold line: service under 60% for 60 s of play in a row makes them
//   worth x0.9 until service is back at 60%. Both are pure functions of the shop's rates (plus, for the cold line, its flag), so
//   `upgradeGain` sees them. Service is measured against demand before the penalty, so it cannot recover by itself.
//   Only a shop that runs itself, after the tutorial, takes part. Away time: no tip, no penalty, and the timers start again on return
//   (the same foreground stamp as events.ts: a stale stamp gets nothing).
// The hook reads no value multiplier (no loop): only the rate functions and the other features' demand hooks.
import { SERVICE } from '../../content/service';
import type { NeighborhoodId } from '../../content/types';
import { bonusUnlocked } from '../bonus';
import type { Seen } from './types';
import {
  counterRate,
  deliveryRate,
  demandRate,
  featureMults,
  levelCap,
  ovenRate,
  prepRate,
  runsItself,
  stationMults,
  tapBatch,
  valuePerPizza,
  walkInRate,
  type GameState,
  type Shop,
} from '../game';
import { LINE } from '../pipeline';
import type { BarkAsk } from './heads';
import { FEATURES } from './registry';
import type { Feature } from './types';
import { cityOf, hoodIds, type CityDef } from '../../content/cities';

export const KEY = 'service';

export type ServiceState = 'inactive' | 'tipping' | 'normal' | 'cold';
export type KitchenStation = 'prep' | 'ovens' | 'counter';

/** The three kitchen stations the line runs, by the names the report uses (the ovens' head is `oven`). */
export type K3 = 'prep' | 'ovens' | 'counter';
const K3S: readonly K3[] = ['prep', 'ovens', 'counter'];
const HEAD_OF_K3: Record<K3, 'prep' | 'oven' | 'counter'> = { prep: 'prep', ovens: 'oven', counter: 'counter' };
/** Everything the report has a symptom for. */
export type Spot = K3 | 'drivers' | 'floor';
export type Symptom = 'piling' | 'idle' | 'line' | 'walkout';
const SPOTS: readonly Spot[] = ['prep', 'ovens', 'counter', 'drivers', 'floor'];

/**
 * One shop's saved part (never carried over a load): the seconds under 60% (capped at the cold line), the cold flag, whether it was tipping at the
 * last tick, and what the symptoms are made of: running averages of "backed up" and "waiting for input" per station, the seconds each spot's state
 * has held, what the player's own hands made per second (a station nobody runs) and the cumulative pies last seen out of each station.
 */
export interface ShopService {
  below: number;
  cold: boolean;
  tip: boolean;
  pile: Record<K3, number>;
  wait: Record<K3, number>;
  hold: Record<Spot, number>;
  made: Record<K3, number>;
  seen: Record<K3, number> | null;
}

export interface ServiceStateSlice {
  /** Wall ms of the last foreground tick; never saved (migrate zeroes it). */
  at: number;
  shops: Record<NeighborhoodId, ShopService>;
}

const k3 = (): Record<K3, number> => ({ prep: 0, ovens: 0, counter: 0 });
const zeroShop = (): ShopService => ({
  below: 0,
  cold: false,
  tip: false,
  pile: k3(),
  wait: k3(),
  hold: { ...k3(), drivers: 0, floor: 0 },
  made: k3(),
  seen: null,
});
/** A zeroed slice with a row for each of `city`'s shops (none without a city: every reader takes a missing row as zero, and `tick` adds it). */
const fresh = (city?: CityDef): ServiceStateSlice => ({
  at: 0,
  shops: Object.fromEntries((city ? hoodIds(city) : []).map((id) => [id, zeroShop()])) as Record<NeighborhoodId, ShopService>,
});
const read = (g: GameState): ServiceStateSlice => (g.x?.[KEY] as ServiceStateSlice | undefined) ?? fresh(cityOf(g));

// ---------- the numbers ----------

/** Round down to a 5% step (an epsilon so 0.9 stays 0.9), as a plain two-decimal number. */
export const quantise = (x: number): number => Math.round(Math.floor(x / SERVICE.step + 1e-9) * SERVICE.step * 100) / 100;

/** Pizzas per second at each point of the shop's flow. */
export interface Flow {
  prep: number;
  ovens: number;
  counter: number;
  kitchen: number;
  wanted: number;
  sold: number;
  /** What the drivers can carry (with the demand multipliers, as `wanted` has them). */
  drivers: number;
  /** The share of the fleet with nothing to carry, 0..1. */
  driversIdle: number;
}

/** The flow from demand and station multipliers somebody has already worked out (no hook runs here). */
function flowFrom(g: GameState, id: NeighborhoodId, seen: Seen): Flow {
  const shop = g.shops[id];
  const fx = { value: 1, demand: seen.demand, stations: seen.stations };
  const prep = prepRate(shop, fx);
  const fit = cityOf(g).fit;
  const ovens = ovenRate(shop, fit, fx);
  const counter = counterRate(shop, fx);
  const kitchen = Math.min(prep, ovens, counter);
  const wanted = demandRate(shop, g.vehicle, fit, fx);
  const sold = Math.min(wanted, kitchen);
  const drivers = deliveryRate(shop, g.vehicle, fit) * fx.demand;
  const delivered = Math.max(0, sold - Math.min(sold, walkInRate(shop) * fx.demand));
  return { prep, ovens, counter, kitchen, wanted, sold, drivers, driversIdle: drivers > 0 ? Math.max(0, Math.min(1, 1 - delivered / drivers)) : 0 };
}

/** The shop's flow right now. `now` only reaches the other features' demand hooks. */
export function flowOf(g: GameState, id: NeighborhoodId, now: number): Flow {
  const hit = flowCache.get(g)?.[id];
  if (hit && hit.now === now && sameRegistry(hit.list)) return hit.flow;
  let demand = 1;
  for (const f of FEATURES) if (f.key !== KEY && f.shopDemandMult) demand *= f.shopDemandMult(g, id, now);
  const flow = flowFrom(g, id, { demand, stations: stationMults(g, id, now) });
  let per = flowCache.get(g);
  if (!per) flowCache.set(g, (per = {}));
  per[id] = { now, list: FEATURES.slice(), flow };
  return flow;
}

// U17: the value hook (read by every `featureMults` pass) and the tick, the report and the heads' asks all want the same flow of one
// state: each state's flows are kept per shop, so the other features' demand hooks run once per state, not once per reader.
// (`featureMults` cannot hand its demand over: it is still building it when it calls the value hook.)
const flowCache = new WeakMap<GameState, Partial<Record<NeighborhoodId, { now: number; list: Feature<any>[]; flow: Flow }>>>(); // eslint-disable-line @typescript-eslint/no-explicit-any
const sameRegistry = (list: readonly unknown[]): boolean => list.length === FEATURES.length && list.every((f, i) => f === FEATURES[i]);

/** Service, 0..1, in 5% steps (rounded down). */
export const serviceOf = (f: Flow): number => (f.wanted > 0 ? quantise(f.sold / f.wanted) : 1);
/** A station's load, 0..1, in 5% steps. */
export const loadOf = (f: Flow, rate: number): number => (rate > 0 ? quantise(f.sold / rate) : 1);

/** The report is live from a shop's first head (a manager brings all three): the capacity bars, the served and missed numbers and the symptoms. */
export const reportActive = (g: GameState, id: NeighborhoodId): boolean => {
  const shop = g.shops[id];
  return !!shop?.built && (shop.managed || shop.heads.prep || shop.heads.oven || shop.heads.counter);
};

/** The tip and the cold line (the service score's money) still start at the takeover: a shop that runs itself, after the tutorial. */
const effectsActive = (g: GameState, id: NeighborhoodId): boolean => {
  const shop = g.shops[id];
  return !!shop?.built && runsItself(shop) && bonusUnlocked(g);
};

/** A station nobody runs: the player taps it by hand. */
const byHand = (shop: Pick<Shop, 'managed' | 'heads'>, st: K3): boolean => !shop.managed && !shop.heads[HEAD_OF_K3[st]];

/** The pies each station has put out since the game began, from what is on the line and what was sold (pies in flight downstream count as out). */
function cumulative(shop: Shop): Record<K3, number> {
  const l = shop.line;
  const counter = shop.sold + l.boxed + l.departures.reduce((t, d) => t + d.n, 0);
  const ovens = counter + l.baked + (l.counter?.n ?? 0);
  return { counter, ovens, prep: ovens + l.prepped + (l.oven?.n ?? 0) };
}

/** One batch of the automated line (pipeline.ts `batchFor`, with the flow's own steady rate). */
const batchOf = (shop: Shop, f: Flow): number => Math.max(tapBatch(shop), Math.ceil(f.sold * LINE.cycleSeconds));

/** What each station can handle now, in pizzas a second: its machine's rate, or for a hand-tapped one what the player made lately. */
function capacities(shop: Shop, f: Flow, made: Record<K3, number>): Record<K3, number> {
  return {
    prep: byHand(shop, 'prep') ? made.prep : f.prep,
    ovens: byHand(shop, 'ovens') ? made.ovens : f.ovens,
    counter: byHand(shop, 'counter') ? made.counter : f.counter,
  };
}
const kitchenOf = (c: Record<K3, number>): number => Math.min(c.prep, c.ovens, c.counter);

/** The app has been open lately: the stamp is not older than `freshMs` (a `now` before the stamp is a stale readout and counts as fresh). */
const stampFresh = (st: ServiceStateSlice, now: number): boolean => st.at > 0 && now - st.at <= SERVICE.freshMs;

/** The state and the multiplier on the shop's pizzas, from the rates alone (plus the cold flag). */
function effectOf(g: GameState, id: NeighborhoodId, now: number, f?: Flow, seen?: Seen): { state: ServiceState; mult: number } {
  if (!effectsActive(g, id)) return { state: 'inactive', mult: 1 };
  const st = read(g);
  if (!stampFresh(st, now)) return { state: 'normal', mult: 1 };
  const service = serviceOf(f ?? (seen ? flowFrom(g, id, seen) : flowOf(g, id, now)));
  if (st.shops[id]?.cold && service < SERVICE.coldBelow - 1e-9) return { state: 'cold', mult: SERVICE.coldMult };
  if (service >= SERVICE.tipAt - 1e-9) return { state: 'tipping', mult: SERVICE.tipMult };
  return { state: 'normal', mult: 1 };
}

// ---------- symptoms ----------

/** Whether customers outnumber what the kitchen puts out (the floor's raw ratio, as `floorOf`'s Packed). */
const crowded = (wanted: number, kitchen: number): boolean => (kitchen > 0 ? wanted / kitchen : 1) >= SERVICE.packedAt - 1e-9;

/** A station's symptom from its running averages: piled up wins over idle; a hand-tapped station is the player's own, so it is never `idle`. */
function stationSymptom(st: ShopService, shop: Shop, k: K3): Symptom | null {
  if (st.pile[k] >= SERVICE.pileOn - 1e-9) return 'piling';
  if (!byHand(shop, k) && st.wait[k] >= SERVICE.idleOn - 1e-9) return 'idle';
  return null;
}

/** The symptom at every spot, from the saved state alone (the floor and the drivers from how long their raw state has held). */
function symptomsOf(st: ShopService, shop: Shop, missed: number): Record<Spot, Symptom | null> {
  const floor = st.hold.floor >= SERVICE.walkoutSeconds && missed > 0 ? 'walkout' : st.hold.floor >= SERVICE.holdSeconds ? 'line' : null;
  return {
    prep: stationSymptom(st, shop, 'prep'),
    ovens: stationSymptom(st, shop, 'ovens'),
    counter: stationSymptom(st, shop, 'counter'),
    drivers: st.hold.drivers >= SERVICE.holdSeconds ? 'idle' : null,
    floor,
  };
}

/** The spots' state "on" right now, for the hold timers: the symptom's kind for a station, plain on/off for the drivers and the floor. */
function rawOn(st: ShopService, shop: Shop, f: Flow, eff: number): Record<Spot, string | null> {
  return {
    prep: stationSymptom(st, shop, 'prep'),
    ovens: stationSymptom(st, shop, 'ovens'),
    counter: stationSymptom(st, shop, 'counter'),
    drivers: f.driversIdle > SERVICE.driversIdleShare ? 'idle' : null,
    floor: crowded(f.wanted, eff) ? 'line' : null,
  };
}

// ---------- the report, for the strip and the sheet ----------

export interface ReportView {
  /** `inactive`: the service score's money does not run here yet (before the takeover, or while a head is still missing): no tip, no cold line. */
  state: ServiceState;
  /** Pizzas per minute. */
  perMin: { prep: number; ovens: number; counter: number; kitchen: number; wanted: number; sold: number };
  /** Pizzas a minute each station and the drivers can handle now (a hand-tapped station: what the player made over the last minute). */
  capacity: { prep: number; ovens: number; counter: number; drivers: number };
  /** The stations the player still taps by hand. */
  you: Record<K3, boolean>;
  /** Customers a minute who want a pizza, how many are served and how many are missed (rolling about 60 s). */
  wanted: number;
  served: number;
  missed: number;
  /** What each spot of the shop is showing: a pile-up, idle hands, a line at the door, a walk-out. Null: nothing to see. */
  symptoms: Record<Spot, Symptom | null>;
  /** Seconds each spot's symptom has held (0 with none): the barks wait for 10 s. */
  held: Record<Spot, number>;
  /** Station loads, 0..1 in 5% steps. */
  loads: Record<KitchenStation, number>;
  /** wanted ÷ kitchen. */
  floorRatio: number;
  /** Service, 0..1 in 5% steps. */
  service: number;
  /** Cash walking out the door each minute: (wanted − sold) × the shop's value per pizza × 60. */
  lostPerMinute: number;
  /** The share of its line the street draws: 1, or `coldQueueShare` while the line is cold. */
  queueShare: number;
  /** Seconds of play under 60% so far (0..coldSeconds), and how many are left before the line goes cold (null when not counting). */
  below: number;
  coldIn: number | null;
}

const NO_SYMPTOMS: Record<Spot, Symptom | null> = Object.freeze({ prep: null, ovens: null, counter: null, drivers: null, floor: null }) as Record<
  Spot,
  Symptom | null
>;
const NO_HELD: Record<Spot, number> = Object.freeze({ prep: 0, ovens: 0, counter: 0, drivers: 0, floor: 0 }) as Record<Spot, number>;

const INACTIVE_VIEW: ReportView = Object.freeze({
  state: 'inactive',
  perMin: { prep: 0, ovens: 0, counter: 0, kitchen: 0, wanted: 0, sold: 0 },
  capacity: { prep: 0, ovens: 0, counter: 0, drivers: 0 },
  you: { prep: false, ovens: false, counter: false },
  wanted: 0,
  served: 0,
  missed: 0,
  symptoms: NO_SYMPTOMS,
  held: NO_HELD,
  loads: { prep: 0, ovens: 0, counter: 0 },
  floorRatio: 1,
  service: 1,
  lostPerMinute: 0,
  queueShare: 1,
  below: 0,
  coldIn: null,
}) as ReportView;

/** Everything the strip and the sheet show for one shop. `now` is the game tick's wall ms (a stale stamp gives no tip and no penalty). */
export function reportView(g: GameState, id: NeighborhoodId, now: number): ReportView {
  if (!reportActive(g, id)) return INACTIVE_VIEW;
  const flow = flowOf(g, id, now);
  const { state } = effectOf(g, id, now, flow);
  const shop = g.shops[id];
  const st = read(g).shops[id] ?? zeroShop();
  const flowService = serviceOf(flow);
  const cap = capacities(shop, flow, st.made);
  const eff = kitchenOf(cap);
  const served = Math.min(flow.wanted, eff);
  // the score the sheet shows is served ÷ wanted, so it agrees with its own Served and Missed: a station the player taps by hand counts for what their hands made
  // (shot 185 read "Served 0, Missed 168" next to 75%). With every station on its own the two are the same number; the tip and the cold line keep `flowService`.
  const service = flow.wanted > 0 ? quantise(served / flow.wanted) : 1;
  const missedPs = Math.max(0, flow.wanted - served);
  const loads = { prep: loadOf(flow, flow.prep), ovens: loadOf(flow, flow.ovens), counter: loadOf(flow, flow.counter) };
  const floorRatio = flow.kitchen > 0 ? flow.wanted / flow.kitchen : 1;
  const lost = flow.wanted - flow.sold;
  const lostPerMinute = lost > 1e-12 ? lost * valuePerPizza(id, shop, g.vehicle, featureMults(g, id, now), cityOf(g)) * 60 : 0;
  const counting = flowService < SERVICE.coldBelow - 1e-9 && !st.cold && stampFresh(read(g), now);
  const symptoms = symptomsOf(st, shop, missedPs);
  return {
    state,
    perMin: {
      prep: flow.prep * 60,
      ovens: flow.ovens * 60,
      counter: flow.counter * 60,
      kitchen: flow.kitchen * 60,
      wanted: flow.wanted * 60,
      sold: flow.sold * 60,
    },
    capacity: { prep: cap.prep * 60, ovens: cap.ovens * 60, counter: cap.counter * 60, drivers: flow.drivers * 60 },
    you: { prep: byHand(shop, 'prep'), ovens: byHand(shop, 'ovens'), counter: byHand(shop, 'counter') },
    wanted: flow.wanted * 60,
    served: served * 60,
    missed: missedPs * 60,
    symptoms,
    held: st.hold,
    loads,
    floorRatio,
    service,
    lostPerMinute,
    queueShare: state === 'cold' ? SERVICE.coldQueueShare : 1,
    below: st.below,
    coldIn: counting ? Math.max(0, SERVICE.coldSeconds - st.below) : null,
  };
}

/**
 * Missed orders a minute (the chapters' `noMissed` reads this). A shop with a head or a manager: the report's own number; one still run by hand:
 * what its machines would leave unserved, as before the report was live.
 */
export function missedOf(g: GameState, id: NeighborhoodId, now: number): number {
  if (reportActive(g, id)) return reportView(g, id, now).missed;
  const f = flowOf(g, id, now);
  return Math.max(0, f.wanted - f.sold) * 60;
}

/** The station's capacity (pizzas a minute) after one more level of `what`, for the upgrade cards. A level past the cap, or a missing shop, changes nothing. A hand-tapped station keeps its own measure, scaled by what the level adds to its machine. */
export function capacityAfter(g: GameState, id: NeighborhoodId, what: K3 | 'drivers' | 'grade', now: number = g.lastSavedAt): number {
  const shop = g.shops[id];
  if (!shop) return 0;
  const f = flowOf(g, id, now);
  const k: K3 | 'drivers' = what === 'grade' ? 'ovens' : what;
  const nowRate = f[k];
  const next: Partial<Shop> = what === 'grade' ? { grade: shop.grade + 1 } : what === 'drivers' ? { drivers: shop.drivers + 1 } : { [what]: shop[what] + 1 };
  const capped = what === 'grade' ? shop.grade + 1 >= cityOf(g).fit.ovenGrades.length : shop[what === 'drivers' ? 'drivers' : what] >= levelCap(shop);
  const after = capped ? f : flowOf({ ...g, shops: { ...g.shops, [id]: { ...shop, ...next } } }, id, now);
  const rate = after[k];
  if (k === 'drivers' || !byHand(shop, k)) return rate * 60;
  const mine = read(g).shops[id]?.made[k] ?? 0;
  return (nowRate > 0 && mine > 0 ? mine * (rate / nowRate) : rate) * 60;
}

// ---------- the pulse: tipping starts, the line goes cold ----------

/** What the HUD and the audio hear: `service-up` when a shop starts tipping, `service-down` when its line goes cold. */
export interface ServicePulse {
  type: 'service-up' | 'service-down';
  shopId: NeighborhoodId;
}
const pulseListeners = new Set<(p: ServicePulse) => void>();
export function onServicePulse(fn: (p: ServicePulse) => void) {
  pulseListeners.add(fn);
  return () => {
    pulseListeners.delete(fn);
  };
}
const emitPulse = (p: ServicePulse) => pulseListeners.forEach((fn) => fn(p));

// ---------- heads that speak up ----------

/**
 * The asks of a shop's heads and manager: a station's head about a pile-up or idle hands at their station, the manager about the line at the door
 * and idle drivers (none without a manager). Each waits until its state has held `barkAfterSeconds`, and carries how long it has held so
 * `nextBark` can space the repeats. A hired head says nothing for a station that is not theirs, and nobody speaks before a hire.
 */
export function symptomAsks(g: GameState, id: NeighborhoodId): BarkAsk[] {
  if (!reportActive(g, id)) return [];
  const shop = g.shops[id];
  const st = read(g).shops[id];
  if (!st) return [];
  const asks: BarkAsk[] = [];
  for (const k of K3S) {
    const head = HEAD_OF_K3[k];
    const sym = stationSymptom(st, shop, k);
    if (sym && shop.heads[head] && st.hold[k] >= SERVICE.barkAfterSeconds)
      asks.push({ trigger: sym === 'piling' ? 'pile' : 'idle', station: head, held: st.hold[k] });
  }
  if (shop.managed) {
    if (st.hold.floor >= SERVICE.barkAfterSeconds) asks.push({ trigger: 'line', station: 'counter', by: 'manager', held: st.hold.floor });
    if (st.hold.drivers >= SERVICE.barkAfterSeconds) asks.push({ trigger: 'drivers-idle', station: 'counter', by: 'manager', held: st.hold.drivers });
  }
  return asks;
}

// ---------- the feature ----------

/** A running average of a reading over about `tau` seconds: it moves toward `value` by `dt`. */
const ease = (avg: number, value: number, dt: number, tau: number): number => avg + (1 - Math.exp(-dt / tau)) * (value - avg);
const isZero = (c: ShopService): boolean =>
  c.seen === null &&
  c.below === 0 &&
  !c.cold &&
  !c.tip &&
  K3S.every((k) => c.pile[k] === 0 && c.wait[k] === 0 && c.made[k] === 0) &&
  SPOTS.every((sp) => c.hold[sp] === 0);

/** The symptoms' part of one shop's tick: the running averages, what the player made by hand, and how long each spot's state has held. */
function senseShop(g: GameState, id: NeighborhoodId, f: Flow, cur: ShopService, dt: number): Pick<ShopService, 'pile' | 'wait' | 'made' | 'seen' | 'hold'> {
  const shop = g.shops[id];
  const l = shop.line;
  const b = batchOf(shop, f);
  const out: Record<K3, number> = { prep: l.prepped, ovens: l.baked, counter: l.boxed };
  const job: Record<K3, boolean> = { prep: !!l.prep, ovens: !!l.oven, counter: !!l.counter };
  // piles only mean something while customers outnumber the kitchen: otherwise the line backs up because it is paced by the door
  const full = f.wanted > f.kitchen + 1e-9;
  const pile = k3();
  const wait = k3();
  for (const k of K3S) {
    const backed = out[k] > SERVICE.pileBatches * b - 1e-9;
    pile[k] = ease(cur.pile[k], full && backed ? 1 : 0, dt, SERVICE.pileSeconds);
    wait[k] = ease(cur.wait[k], !job[k] && !backed ? 1 : 0, dt, SERVICE.idleSeconds);
  }
  // what the hands made: the pies out of each station since the last tick, averaged over about a minute
  const now = cumulative(shop);
  const made = { ...cur.made };
  let seen: Record<K3, number> | null = now;
  if (cur.seen) {
    for (const k of K3S) {
      const d = now[k] - cur.seen[k];
      if (d < 0)
        seen = null; // the line was replaced (a reset, a debug jump): start measuring again
      else made[k] = ease(cur.made[k], d / dt, dt, SERVICE.madeSeconds / 2);
    }
  }
  const mid: ShopService = { ...cur, pile, wait, made };
  const eff = kitchenOf(capacities(shop, f, made));
  const before = rawOn(cur, shop, f, eff);
  const after = rawOn(mid, shop, f, eff);
  const hold = {} as Record<Spot, number>;
  for (const sp of SPOTS) hold[sp] = after[sp] && after[sp] === before[sp] ? Math.min(SERVICE.holdCap, cur.hold[sp] + dt) : 0;
  return { pile, wait, made, seen, hold };
}

export const service: Feature<ServiceStateSlice> = {
  key: KEY,
  init: (_now, city) => fresh(city),
  // never carried over: a saved timer or cold flag is stale by the time it loads (away time: no penalty, and the timers start again)
  migrate: (_raw, _now, city) => fresh(city),
  tick(g, dt, now) {
    const st = read(g);
    const stale = !stampFresh(st, now);
    let shops = st.shops;
    for (const id of hoodIds(cityOf(g))) {
      const cur = st.shops[id] ?? zeroShop();
      let next: ShopService;
      if (!reportActive(g, id)) {
        if (st.shops[id] && isZero(cur)) continue;
        next = zeroShop();
      } else {
        const f = flowOf(g, id, now);
        const service = serviceOf(f);
        const money = effectsActive(g, id);
        const tip = money && service >= SERVICE.tipAt - 1e-9;
        if (stale) next = { ...zeroShop(), tip };
        else {
          const under = money && service < SERVICE.coldBelow - 1e-9;
          const below = under ? Math.min(SERVICE.coldSeconds, cur.below + dt) : 0;
          const cold = money && (cur.cold ? under : below >= SERVICE.coldSeconds);
          next = { below, cold, tip, ...senseShop(g, id, f, cur, dt) };
          if (next.tip && !cur.tip) emitPulse({ type: 'service-up', shopId: id });
          if (next.cold && !cur.cold) emitPulse({ type: 'service-down', shopId: id });
        }
      }
      if (shops === st.shops) shops = { ...st.shops };
      shops[id] = next;
    }
    const restamp = stale || now - st.at >= SERVICE.stampMs || now < st.at;
    if (shops === st.shops && !restamp) return g;
    return { ...g, x: { ...g.x, [KEY]: { at: restamp ? now : st.at, shops } } };
  },
  // coming back: no tip, no penalty, and the timers start again (the stamp is old, so the hooks already give nothing)
  onOffline(g) {
    return { ...g, x: { ...g.x, [KEY]: fresh(cityOf(g)) } };
  },
  // the caches of "+$X/s" readouts refresh when the app first ticks (the tip needs a fresh stamp) and when the cold flag moves (the tip follows the levels, which are in the key already)
  shopKey: (g, id) => `${read(g).at > 0 ? 'f' : ''}${read(g).shops[id]?.cold ? 'c' : ''}`,
  // `seen` is the demand and station multipliers `featureMults` has already collected: no other feature's hook runs again (U17)
  shopValueMult: (g, id, now, seen) => effectOf(g, id, now, undefined, seen).mult,
};

/**
 * `g` with no tip and no penalty (for a reward that must not move with how well the shop is served, as `withoutEvent` does for an
 * event). Clears the foreground stamp, so the hooks give nothing until the next tick stamps it again.
 */
export const withoutService = (g: GameState): GameState => (read(g).at === 0 ? g : { ...g, x: { ...g.x, [KEY]: { ...read(g), at: 0 } } });
