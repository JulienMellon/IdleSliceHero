// University, the menu and the campus zones (v5.16, Priya's app).
//
// Menu: three recipes (content/layers.ts MENU). Cheese pays x1.0; Pepperoni pays x1.4 but takes 30% longer to prep; Garlic Knots pay x0.6 and
// bake in half the time. The player sets a mix (whole percents of the pies; Cheese is the rest). The mix's value is the share-weighted
// price; its prep and bake times are the share-weighted times, so a station's effective rate is 1 / that time (a slow pizza and a fast
// one in a row average their times, not their rates).
//
// Zones: Dorms, Library and Stadium at distances 1 / 2 / 3, taking 50 / 30 / 20 percent of the deliveries; Library opens at footprint 1
// and Stadium at footprint 2. A trip to a zone takes distance x the normal round trip, so the fleet's deliveries per second are the
// nominal rate divided by the average distance (the share-weighted distance of the zones that are open). Drones ignore distance.
//
// How it reaches the engine: through the two hooks the registry has. The value is `shopValueMult`. Everything about speed is one
// number in `shopDemandMult`: the whole-demand ratio that makes the engine's demand equal the walk-ins plus the delivery rate with the
// zones' longer trips, and, when the mix makes prep slower, no more than the slower prep rate. A faster oven (Garlic Knots) can only
// help where the oven is the lone slowest stage, and the engine's min() has no hook to lift a station's own rate: the menu view
// still shows it, the shop's rate does not (see the report of card E2b).
import { LAYER_KEYS, MENU, ZONES } from '../../../content/layers';
import { VEHICLES } from '../../../content/tuning';
import {
  deliveryRate,
  featureMults,
  prepRate,
  shopRevenue,
  tripSeconds,
  walkInRate,
  type BuyResult,
  type GameState,
  type Shop,
} from '../../game';
import type { Feature } from '../types';
import { cityOf, layerHood } from '../../../content/cities';
import type { NeighborhoodId } from '../../../content/types';

export interface MenuState {
  /** Percent of the pies that are Pepperoni, a whole number 0..100. */
  pepperoni: number;
  /** Percent that are Garlic Knots, a whole number; pepperoni + knots <= 100 and Cheese is the rest. */
  knots: number;
}

const hoodOf = (g: GameState): NeighborhoodId => layerHood(cityOf(g), 'menu') ?? '';
const fresh = (): MenuState => ({ pepperoni: 0, knots: 0 });
const read = (g: GameState): MenuState => (g.x?.[LAYER_KEYS.menu] as MenuState | undefined) ?? fresh();
const write = (g: GameState, s: MenuState): GameState => ({ ...g, x: { ...g.x, [LAYER_KEYS.menu]: s } });
const built = (g: GameState): boolean => !!g.shops[hoodOf(g)]?.built;
const recipe = (id: 'cheese' | 'pepperoni' | 'knots') => MENU.recipes.find((r) => r.id === id)!;

// ---------- the menu ----------

/** The three shares of a mix as fractions of the pies. */
export function shares(m: MenuState): { cheese: number; pepperoni: number; knots: number } {
  return { cheese: (100 - m.pepperoni - m.knots) / 100, pepperoni: m.pepperoni / 100, knots: m.knots / 100 };
}

export interface MenuFactors {
  /** x the value per pizza: the share-weighted price. */
  value: number;
  /** x the time a pizza takes at prep (1 = Cheese). */
  prepTime: number;
  /** x the time a pizza takes in the oven. */
  bakeTime: number;
}

/** What a mix does to price and to the two stations' times. */
export function menuFactors(m: MenuState): MenuFactors {
  const s = shares(m);
  const mix = (pick: (r: (typeof MENU.recipes)[number]) => number) => s.cheese * pick(recipe('cheese')) + s.pepperoni * pick(recipe('pepperoni')) + s.knots * pick(recipe('knots'));
  return { value: mix((r) => r.price), prepTime: mix((r) => r.prep), bakeTime: mix((r) => r.bake) };
}

/** The mix the shop sells now. */
export const mixOf = (g: GameState): MenuState => read(g);

/** Set the mix: whole percents of Pepperoni and Garlic Knots, the rest Cheese. */
export function setMenu(g: GameState, pepperoni: number, knots: number): BuyResult {
  if (!built(g)) return { ok: false, reason: 'Build this pizzeria first' };
  if (![pepperoni, knots].every((x) => Number.isFinite(x) && x >= 0)) return { ok: false, reason: 'A share can’t be below 0' };
  const p = Math.round(pepperoni);
  const k = Math.round(knots);
  if (p + k > 100) return { ok: false, reason: 'The mix is over 100%' };
  return { ok: true, state: write(g, { pepperoni: p, knots: k }) };
}

// ---------- the zones ----------

/** Drones fly: a trip takes the same time wherever it goes. */
export const isDrones = (vehicle: number): boolean => VEHICLES[vehicle]?.id === ZONES.droneId;

/** The zones open at a footprint. */
export const openZones = (shop: Pick<Shop, 'footprint'>) => ZONES.zones.filter((z) => z.footprint <= shop.footprint);

/** The average distance of a delivery: the open zones' distances weighted by their demand shares (1 for drones). */
export function averageDistance(shop: Pick<Shop, 'footprint'>, vehicle: number): number {
  if (isDrones(vehicle)) return 1;
  const open = openZones(shop);
  const total = open.reduce((t, z) => t + z.share, 0);
  return total > 0 ? open.reduce((t, z) => t + z.share * z.distance, 0) / total : 1;
}

/** Deliveries per second with the zones' trips: the fleet's nominal rate over the average distance. */
export const zoneDeliveryRate = (shop: Shop, vehicle: number): number => deliveryRate(shop, vehicle) / averageDistance(shop, vehicle);

/**
 * The demand ratio the engine multiplies by: (walk-ins + the zones' delivery rate) / (walk-ins + the nominal delivery rate), and no more
 * than the prep rate when the mix slows prep. 1 for a mix of Cheese with drones (or the first zone only).
 */
export function demandFactor(shop: Shop, vehicle: number, m: MenuState): number {
  const walk = walkInRate(shop);
  const total = walk + deliveryRate(shop, vehicle);
  if (!(total > 0)) return 1;
  const f = menuFactors(m);
  let wanted = walk + zoneDeliveryRate(shop, vehicle);
  if (f.prepTime > 1) wanted = Math.min(wanted, prepRate(shop) / f.prepTime);
  return Math.min(1, wanted / total);
}

// ---------- views ----------

export interface MenuView {
  active: boolean;
  /** The mix in whole percents (they add to 100). */
  cheese: number;
  pepperoni: number;
  knots: number;
  /** x the value per pizza. */
  valueMult: number;
  /** x the prep rate (1 / the prep time factor). */
  prepRate: number;
  /** x the oven rate. */
  ovenRate: number;
}

/** What the menu card shows, pure. */
export function menuView(g: GameState): MenuView {
  const m = read(g);
  const f = menuFactors(m);
  return { active: built(g), cheese: 100 - m.pepperoni - m.knots, pepperoni: m.pepperoni, knots: m.knots, valueMult: f.value, prepRate: 1 / f.prepTime, ovenRate: 1 / f.bakeTime };
}

export interface ZoneRow {
  id: string;
  name: string;
  distance: number;
  /** The zone's share of the deliveries among the open zones, in percent. */
  share: number;
  open: boolean;
  /** The footprint it opens at. */
  opensAt: number;
  /** Seconds a round trip to it takes with the fleet now (drones: the same for every zone). */
  tripSeconds: number;
  /** Pies per second delivered to it (0 while closed). */
  perSecond: number;
}

export interface ZonesView {
  active: boolean;
  drones: boolean;
  /** The average distance of a delivery now. */
  averageDistance: number;
  /** Deliveries per second with the zones' trips. */
  deliveryRate: number;
  zones: ZoneRow[];
}

/** What the campus map shows, pure. */
export function zonesView(g: GameState): ZonesView {
  const shop = g.shops[hoodOf(g)];
  const drones = isDrones(g.vehicle);
  const open = openZones(shop);
  const openShare = open.reduce((t, z) => t + z.share, 0);
  const rate = zoneDeliveryRate(shop, g.vehicle);
  return {
    active: !!shop?.built,
    drones,
    averageDistance: averageDistance(shop, g.vehicle),
    deliveryRate: rate,
    zones: ZONES.zones.map((z) => {
      const isOpen = z.footprint <= shop.footprint;
      return {
        id: z.id,
        name: z.name,
        distance: z.distance,
        share: isOpen && openShare > 0 ? Math.round((100 * z.share) / openShare) : 0,
        open: isOpen,
        opensAt: z.footprint,
        tripSeconds: tripSeconds(g.vehicle) * (drones ? 1 : z.distance),
        perSecond: isOpen && openShare > 0 ? (rate * z.share) / openShare : 0,
      };
    }),
  };
}

/**
 * The mix that makes the most cash per second right now (a search over the mixes in steps of MENU.searchStep, Cheese first so a tie
 * keeps the plain menu). Pure; the sim's player sets it, and the menu card can offer it.
 */
export function bestMix(g: GameState, now: number = g.lastSavedAt): MenuState {
  const shop = g.shops[hoodOf(g)];
  let best = fresh();
  let bestRate = -1;
  for (let p = 0; p <= 100; p += MENU.searchStep) {
    for (let k = 0; p + k <= 100; k += MENU.searchStep) {
      const t = write(g, { pepperoni: p, knots: k });
      const rate = shopRevenue(hoodOf(g), shop, g.vehicle, featureMults(t, hoodOf(g), now), cityOf(g));
      if (rate > bestRate + 1e-9) {
        best = { pepperoni: p, knots: k };
        bestRate = rate;
      }
    }
  }
  return best;
}

export const universityMenu: Feature<MenuState> = {
  key: LAYER_KEYS.menu,
  init: fresh,
  migrate(raw) {
    if (!raw || typeof raw !== 'object') return fresh();
    const r = raw as Record<string, unknown>;
    const pct = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : 0);
    const pepperoni = pct(r.pepperoni);
    return { pepperoni, knots: Math.min(100 - pepperoni, pct(r.knots)) };
  },
  shopValueMult(g, id) {
    return id === hoodOf(g) && built(g) ? menuFactors(read(g)).value : 1;
  },
  shopDemandMult(g, id) {
    return id === hoodOf(g) && built(g) ? demandFactor(g.shops[id], g.vehicle, read(g)) : 1;
  },
  shopKey(g, id) {
    if (id !== hoodOf(g) || !built(g)) return '';
    const m = read(g);
    return `menu${m.pepperoni}-${m.knots}`;
  },
};
