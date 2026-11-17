// Waterfront, boats and the warming rack (v5.16). A boat docks every 3 minutes of play: 30 seconds of demand x3. The warming rack
// (four tiers: 20 / 40 / 80 / 160 pies) fills from the oven's spare output between boats and empties into the boat's rush, selling
// pies the kitchen could not make in time. Its tiers are bought here (`buyRack`), priced at 5 / 15 / 45 / 120 minutes of the
// shop's income at purchase time.
//
// Live auction: while the Pier 9 bid is open and unpaid, MegaSlice raises its price by 5% of the base every 2 minutes of play, to
// +50% (`pier9AuctionMult`; game.ts's `pier9Price` reads the same number from the saved `openedAt`, content/layers.ts).
// Play time only; the schedule replays from the saved seed; inactive until the Waterfront shop is built; old saves load as
// "inactive, the schedule starts now". The rack and the rush earn only while the app is open.
import { BOATS, LAYER_KEYS, auctionMult } from '../../../content/layers';
import {
  boostMult,
  counterRate,
  demandRate,
  featureMults,
  ovenRate,
  pier9Available,
  prepRate,
  runsItself,
  shopRate,
  shopRevenue,
  valuePerPizza,
  type BuyResult,
  type GameState,
} from '../../game';
import type { Feature } from '../types';
import { cityOf, layerHood } from '../../../content/cities';
import type { NeighborhoodId } from '../../../content/types';
import { freshTimed, migrateTimed, stepTimed, timedOn, type Timed, type TimedSpec } from './suburbs-gameday';

export interface BoatsState extends Timed {
  /** Warming rack tier owned, 0 (none) to 4. */
  tier: number;
  /** Pies on the rack. */
  rack: number;
  /** Pies drained from the rack that have not yet been counted as whole sales. */
  carry: number;
  /** Play second the Pier 9 auction opened (below 0 = not yet). */
  openedAt: number;
}

const spec: TimedSpec = BOATS;
const hoodOf = (g: GameState): NeighborhoodId => layerHood(cityOf(g), 'boats') ?? '';
const MAX_TIER = BOATS.rack.capacity.length;
const fresh = (now: number): BoatsState => ({ ...freshTimed(now), tier: 0, rack: 0, carry: 0, openedAt: -1 });
const read = (g: GameState): BoatsState => (g.x?.[LAYER_KEYS.boats] as BoatsState | undefined) ?? fresh(0);
const write = (g: GameState, s: BoatsState): GameState => ({ ...g, x: { ...g.x, [LAYER_KEYS.boats]: s } });
const built = (g: GameState): boolean => !!g.shops[hoodOf(g)]?.built;

/** The Pier 9 price multiplier right now (1 while the bid is not open). Export for game.ts's bid price and the UI. */
export const pier9AuctionMult = (g: GameState): number => auctionMult(read(g).openedAt, g.playSeconds);

/** The warming rack tier owned, 0 (none) to 4. */
export const rackTier = (g: GameState): number => read(g).tier;

/** Pies the rack holds at a tier (0 with none). */
export const rackCapacity = (tier: number): number => (tier > 0 ? BOATS.rack.capacity[Math.min(MAX_TIER, tier) - 1] : 0);

/** What the next rack tier costs now: its minutes of the Waterfront shop's income (no boost, no event), or null at the top. */
export function rackPrice(g: GameState): number | null {
  const tier = read(g).tier;
  if (tier >= MAX_TIER) return null;
  return Math.max(1, Math.ceil(BOATS.rack.minutes[tier] * 60 * shopRevenue(hoodOf(g), g.shops[hoodOf(g)], g.vehicle, undefined, cityOf(g))));
}

/** Why the next tier can't be bought yet (other than cash), or null. */
export function rackLock(g: GameState): string | null {
  if (!built(g)) return 'Build this pizzeria first';
  return read(g).tier >= MAX_TIER ? 'Biggest rack there is' : null;
}

/** Buy the next warming-rack tier: spends its price and raises the rack's size. */
export function buyRack(g: GameState): BuyResult {
  const lock = rackLock(g);
  if (lock) return { ok: false, reason: lock };
  const price = rackPrice(g);
  if (price === null) return { ok: false, reason: 'Biggest rack there is' };
  if (g.cash < price) return { ok: false, reason: 'Not enough cash' };
  const st = read(g);
  return { ok: true, state: write({ ...g, cash: g.cash - price }, { ...st, tier: st.tier + 1 }) };
}

export interface BoatsView {
  /** The Waterfront shop is built (the layer is live). */
  active: boolean;
  /** A boat is docked now. */
  boat: boolean;
  /** Seconds until the next boat docks. */
  nextIn: number;
  /** Seconds the docked boat stays (0 when none). */
  left: number;
  rackTier: number;
  /** Whole pies on the rack, of `rackCapacity`. */
  rackPies: number;
  rackCapacity: number;
  /** The next tier's price, or null at the top. */
  rackPrice: number | null;
  /** The Pier 9 auction's price multiplier now. */
  auctionMult: number;
}

/** Everything the harbour readout and the rack's card need, pure. */
export function boatsView(g: GameState, now: number): BoatsView {
  const st = read(g);
  if (!built(g)) return { active: false, boat: false, nextIn: 0, left: 0, rackTier: st.tier, rackPies: 0, rackCapacity: rackCapacity(st.tier), rackPrice: null, auctionMult: 1 };
  const boat = timedOn(st, g.playSeconds, now);
  return {
    active: true,
    boat,
    nextIn: st.nextAt < 0 ? BOATS.everySeconds : Math.max(0, Math.ceil(st.nextAt - g.playSeconds)),
    left: boat ? Math.max(0, Math.ceil(st.until - g.playSeconds)) : 0,
    rackTier: st.tier,
    rackPies: Math.floor(st.rack),
    rackCapacity: rackCapacity(st.tier),
    rackPrice: rackPrice(g),
    auctionMult: pier9AuctionMult(g),
  };
}

/**
 * The rack for `dt` seconds. Between boats it takes the oven's spare output (what prep and the oven could make beyond what is
 * sold). While a boat is docked it sells to the unmet part of the boat's demand, as far as the counter can serve it.
 */
function rackStep(g: GameState, st: BoatsState, dt: number, now: number): BoatsState {
  const cap = rackCapacity(st.tier);
  const shop = g.shops[hoodOf(g)];
  if (cap <= 0 || !runsItself(shop)) return st;
  const fx = featureMults(g, hoodOf(g), now);
  const sold = shopRate(shop, g.vehicle, fx);
  if (!timedOn(st, g.playSeconds, now)) {
    const spare = Math.max(0, Math.min(prepRate(shop), ovenRate(shop)) - sold);
    const rack = Math.min(cap, st.rack + spare * dt);
    return rack === st.rack ? st : { ...st, rack };
  }
  const unmet = Math.max(0, demandRate(shop, g.vehicle, fx) - sold);
  const room = Math.max(0, counterRate(shop) - sold);
  const drained = Math.min(st.rack, Math.min(unmet, room) * dt);
  return drained > 0 ? { ...st, rack: st.rack - drained, carry: st.carry + drained } : st;
}

export const waterfrontBoats: Feature<BoatsState> = {
  key: LAYER_KEYS.boats,
  init: fresh,
  migrate(raw, now) {
    const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const num = (v: unknown, d: number, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d);
    const tier = Math.floor(num(r.tier, 0, 0, MAX_TIER));
    return {
      ...migrateTimed(raw, now),
      tier,
      rack: num(r.rack, 0, 0, rackCapacity(tier)),
      carry: num(r.carry, 0, 0, 1),
      openedAt: typeof r.openedAt === 'number' && Number.isFinite(r.openedAt) && r.openedAt >= 0 ? r.openedAt : -1,
    };
  },
  tick(g, dt, now) {
    if (!built(g)) return g;
    const st = read(g);
    let next = stepTimed(st, g.playSeconds, now, spec);
    // the auction opens the first time a tick sees the bid on offer; the clock runs in play seconds from then
    if (next.openedAt < 0 && pier9Available(g)) next = { ...next, openedAt: g.playSeconds };
    next = rackStep(g, next, dt, now);
    let out = g;
    const whole = Math.floor(next.carry);
    if (whole > 0) {
      // the pies the rack sold pay like any other of the shop's pies (at the boosted price while a boost runs)
      const shop = g.shops[hoodOf(g)];
      const cash = whole * valuePerPizza(hoodOf(g), shop, g.vehicle, featureMults(g, hoodOf(g), now), cityOf(g)) * boostMult(g, now);
      out = { ...g, cash: g.cash + cash, totalEarned: g.totalEarned + cash, shops: { ...g.shops, [hoodOf(g)]: { ...shop, sold: shop.sold + whole } } };
      next = { ...next, carry: next.carry - whole };
    }
    const same = (Object.keys(next) as (keyof BoatsState)[]).every((k) => next[k] === st[k]);
    return same ? out : write(out, next);
  },
  shopDemandMult(g, id, now) {
    return id === hoodOf(g) && built(g) && timedOn(read(g), g.playSeconds, now) ? BOATS.demandMult : 1;
  },
  shopKey(g, id) {
    return id === hoodOf(g) && built(g) && read(g).until > g.playSeconds ? 'boat' : '';
  },
};
