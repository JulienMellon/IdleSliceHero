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
import { counterRate, featureMults, ovenRate, prepRate, runsItself, HOME_HOOD_IDS, demandRate, valuePerPizza, type GameState } from '../game';
import type { BarkAsk } from './heads';
import { FEATURES } from './registry';
import type { Feature } from './types';
import { cityOf, hoodIds } from '../../content/cities';

export const KEY = 'service';

export type Lamp = 'slammed' | 'busy' | 'idle';
export type FloorLamp = 'full' | 'steady' | 'quiet';
export type ServiceState = 'inactive' | 'tipping' | 'normal' | 'cold';
export type KitchenStation = 'prep' | 'ovens' | 'counter';

/** One shop's saved part: the seconds under 60% (capped at the cold line), the cold flag, whether it was tipping at the last tick and how long each station has been Slammed (capped). */
export interface ShopService {
  below: number;
  cold: boolean;
  tip: boolean;
  slam: { prep: number; oven: number; counter: number };
}

export interface ServiceStateSlice {
  /** Wall ms of the last foreground tick; never saved (migrate zeroes it). */
  at: number;
  shops: Record<NeighborhoodId, ShopService>;
}

const zeroShop = (): ShopService => ({ below: 0, cold: false, tip: false, slam: { prep: 0, oven: 0, counter: 0 } });
const fresh = (): ServiceStateSlice => ({ at: 0, shops: Object.fromEntries(HOME_HOOD_IDS.map((id) => [id, zeroShop()])) as Record<NeighborhoodId, ShopService> });
const read = (g: GameState): ServiceStateSlice => (g.x?.[KEY] as ServiceStateSlice | undefined) ?? fresh();

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
}

/** The shop's flow right now. `now` only reaches the other features' demand hooks. */
export function flowOf(g: GameState, id: NeighborhoodId, now: number): Flow {
  const hit = flowCache.get(g)?.[id];
  if (hit && hit.now === now && sameRegistry(hit.list)) return hit.flow;
  const shop = g.shops[id];
  let demand = 1;
  for (const f of FEATURES) if (f.key !== KEY && f.shopDemandMult) demand *= f.shopDemandMult(g, id, now);
  const prep = prepRate(shop);
  const ovens = ovenRate(shop);
  const counter = counterRate(shop);
  const kitchen = Math.min(prep, ovens, counter);
  const wanted = demandRate(shop, g.vehicle, { value: 1, demand });
  const flow = { prep, ovens, counter, kitchen, wanted, sold: Math.min(wanted, kitchen) };
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

export const lampOf = (load: number): Lamp => (load >= SERVICE.slammedAt - 1e-9 ? 'slammed' : load >= SERVICE.busyAt - 1e-9 ? 'busy' : 'idle');
/** The floor's lamp from wanted ÷ kitchen (the raw ratio: its thresholds are not 5% steps). */
export const floorOf = (f: Flow): FloorLamp => {
  const r = f.kitchen > 0 ? f.wanted / f.kitchen : 1;
  return r >= SERVICE.packedAt - 1e-9 ? 'full' : r >= SERVICE.steadyAt - 1e-9 ? 'steady' : 'quiet';
};

/** A shop that runs itself, after the tutorial: the only kind the report covers. */
export const reportActive = (g: GameState, id: NeighborhoodId): boolean => {
  const shop = g.shops[id];
  return shop.built && runsItself(shop) && bonusUnlocked(g);
};

/** The app has been open lately: the stamp is not older than `freshMs` (a `now` before the stamp is a stale readout and counts as fresh). */
const stampFresh = (st: ServiceStateSlice, now: number): boolean => st.at > 0 && now - st.at <= SERVICE.freshMs;

/** The state and the multiplier on the shop's pizzas, from the rates alone (plus the cold flag). */
function effectOf(g: GameState, id: NeighborhoodId, now: number, f?: Flow): { state: ServiceState; mult: number } {
  if (!reportActive(g, id)) return { state: 'inactive', mult: 1 };
  const st = read(g);
  if (!stampFresh(st, now)) return { state: 'normal', mult: 1 };
  const service = serviceOf(f ?? flowOf(g, id, now));
  if (st.shops[id]?.cold && service < SERVICE.coldBelow - 1e-9) return { state: 'cold', mult: SERVICE.coldMult };
  if (service >= SERVICE.tipAt - 1e-9) return { state: 'tipping', mult: SERVICE.tipMult };
  return { state: 'normal', mult: 1 };
}

// ---------- the report, for the strip and the sheet ----------

export interface ReportView {
  /** `inactive`: a shop still tapped by hand, or in the tutorial: nothing new to show. */
  state: ServiceState;
  /** Pizzas per minute. */
  perMin: { prep: number; ovens: number; counter: number; kitchen: number; wanted: number; sold: number };
  /** Station loads, 0..1 in 5% steps. */
  loads: Record<KitchenStation, number>;
  lamps: Record<KitchenStation, Lamp> & { floor: FloorLamp };
  /** wanted ÷ kitchen. */
  floorRatio: number;
  /** Service, 0..1 in 5% steps. */
  service: number;
  /** Cash walking out the door each minute: (wanted − sold) × the shop's value per pizza × 60. */
  lostPerMinute: number;
  /** The kitchen is the limit (it makes less than is wanted). */
  kitchenLimits: boolean;
  /** The lamp the strip names: the busiest station's when the kitchen is the limit, the floor's when it is Quiet, else null. */
  worst: { kind: KitchenStation | 'floor'; lamp: Lamp | FloorLamp } | null;
  /** The share of its line the street draws: 1, or `coldQueueShare` while the line is cold. */
  queueShare: number;
  /** Seconds of play under 60% so far (0..coldSeconds), and how many are left before the line goes cold (null when not counting). */
  below: number;
  coldIn: number | null;
}

const INACTIVE_VIEW: ReportView = Object.freeze({
  state: 'inactive',
  perMin: { prep: 0, ovens: 0, counter: 0, kitchen: 0, wanted: 0, sold: 0 },
  loads: { prep: 0, ovens: 0, counter: 0 },
  lamps: { prep: 'idle', ovens: 'idle', counter: 'idle', floor: 'steady' },
  floorRatio: 1,
  service: 1,
  lostPerMinute: 0,
  kitchenLimits: false,
  worst: null,
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
  const service = serviceOf(flow);
  const loads = { prep: loadOf(flow, flow.prep), ovens: loadOf(flow, flow.ovens), counter: loadOf(flow, flow.counter) };
  const lamps = { prep: lampOf(loads.prep), ovens: lampOf(loads.ovens), counter: lampOf(loads.counter), floor: floorOf(flow) };
  const floorRatio = flow.kitchen > 0 ? flow.wanted / flow.kitchen : 1;
  const lost = flow.wanted - flow.sold;
  const lostPerMinute = lost > 1e-12 ? lost * valuePerPizza(id, shop, g.vehicle, featureMults(g, id, now), cityOf(g)) * 60 : 0;
  const kitchenLimits = lamps.floor === 'full';
  // the worst lamp: the most loaded station (ties go to the pipeline's order) while the kitchen limits; the floor while it is Quiet
  let worst: ReportView['worst'] = null;
  if (kitchenLimits) {
    const order: KitchenStation[] = ['prep', 'ovens', 'counter'];
    const top = order.reduce((a, b) => (loads[b] > loads[a] ? b : a));
    worst = { kind: top, lamp: lamps[top] };
  } else if (lamps.floor === 'quiet') worst = { kind: 'floor', lamp: 'quiet' };
  const st = read(g).shops[id] ?? zeroShop();
  const counting = service < SERVICE.coldBelow - 1e-9 && !st.cold && stampFresh(read(g), now);
  return {
    state,
    perMin: { prep: flow.prep * 60, ovens: flow.ovens * 60, counter: flow.counter * 60, kitchen: flow.kitchen * 60, wanted: flow.wanted * 60, sold: flow.sold * 60 },
    loads,
    lamps,
    floorRatio,
    service,
    lostPerMinute,
    kitchenLimits,
    worst,
    queueShare: state === 'cold' ? SERVICE.coldQueueShare : 1,
    below: st.below,
    coldIn: counting ? Math.max(0, SERVICE.coldSeconds - st.below) : null,
  };
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

// ---------- heads that ask for help ----------

/** The asks of a shop's heads: each hired head whose station has been Slammed for `slammedBarkSeconds`, while the shop has no manager. Unkeyed moments: `nextBark`'s own gap and memory decide when one speaks. */
export function slammedAsks(g: GameState, id: NeighborhoodId): BarkAsk[] {
  const shop = g.shops[id];
  if (shop.managed || !reportActive(g, id)) return [];
  const slam = read(g).shops[id]?.slam;
  if (!slam) return [];
  return (['prep', 'oven', 'counter'] as const).filter((st) => shop.heads[st] && slam[st] >= SERVICE.slammedBarkSeconds).map((station) => ({ trigger: 'slammed' as const, station }));
}

// ---------- the feature ----------

const sameShop = (a: ShopService, b: ShopService) => a.below === b.below && a.cold === b.cold && a.tip === b.tip && a.slam.prep === b.slam.prep && a.slam.oven === b.slam.oven && a.slam.counter === b.slam.counter;

export const service: Feature<ServiceStateSlice> = {
  key: KEY,
  init: () => fresh(),
  // never carried over: a saved timer or cold flag is stale by the time it loads (away time: no penalty, and the timers start again)
  migrate: () => fresh(),
  tick(g, dt, now) {
    const st = read(g);
    const stale = !stampFresh(st, now);
    let shops = st.shops;
    for (const id of hoodIds(cityOf(g))) {
      const cur = st.shops[id] ?? zeroShop();
      let next: ShopService;
      if (!reportActive(g, id)) next = zeroShop();
      else {
        const f = flowOf(g, id, now);
        const service = serviceOf(f);
        const tip = service >= SERVICE.tipAt - 1e-9;
        if (stale) next = { ...zeroShop(), tip };
        else {
          const under = service < SERVICE.coldBelow - 1e-9;
          const below = under ? Math.min(SERVICE.coldSeconds, cur.below + dt) : 0;
          const cold = cur.cold ? under : below >= SERVICE.coldSeconds;
          const slam = (v: number, rate: number) => (loadOf(f, rate) >= SERVICE.slammedAt - 1e-9 ? Math.min(SERVICE.slammedBarkSeconds, v + dt) : 0);
          next = { below, cold, tip, slam: { prep: slam(cur.slam.prep, f.prep), oven: slam(cur.slam.oven, f.ovens), counter: slam(cur.slam.counter, f.counter) } };
          if (next.tip && !cur.tip) emitPulse({ type: 'service-up', shopId: id });
          if (next.cold && !cur.cold) emitPulse({ type: 'service-down', shopId: id });
        }
      }
      if (!sameShop(cur, next) || !st.shops[id]) {
        if (shops === st.shops) shops = { ...st.shops };
        shops[id] = next;
      }
    }
    const restamp = stale || now - st.at >= SERVICE.stampMs || now < st.at;
    if (shops === st.shops && !restamp) return g;
    return { ...g, x: { ...g.x, [KEY]: { at: restamp ? now : st.at, shops } } };
  },
  // coming back: no tip, no penalty, and the timers start again (the stamp is old, so the hooks already give nothing)
  onOffline(g) {
    return { ...g, x: { ...g.x, [KEY]: fresh() } };
  },
  // the caches of "+$X/s" readouts refresh when the app first ticks (the tip needs a fresh stamp) and when the cold flag moves (the tip follows the levels, which are in the key already)
  shopKey: (g, id) => `${read(g).at > 0 ? 'f' : ''}${read(g).shops[id]?.cold ? 'c' : ''}`,
  shopValueMult: (g, id, now) => effectOf(g, id, now).mult,
};

/**
 * `g` with no tip and no penalty (for a reward that must not move with how well the shop is served, as `withoutEvent` does for an
 * event). Clears the foreground stamp, so the hooks give nothing until the next tick stamps it again.
 */
export const withoutService = (g: GameState): GameState => (read(g).at === 0 ? g : { ...g, x: { ...g.x, [KEY]: { ...read(g), at: 0 } } });
