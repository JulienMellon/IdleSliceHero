// Shop renovation (v5.25, card E10; the list of looks is docs/build/v5.25/renovation.md). A shop at three mastery stars can be renovated up to
// three times: its stations go back to level 1, it keeps x2 / x3 / x4 income for good, and each level gives a plaque, one fixture upgrade and
// a tier of three cash decor items. Pure data and rules; the engine is engine/features/renovation.ts.
import { DECOR_TIER_COST } from './tuning';
import { findHood, hoodIds, type CityDef } from './cities';
import type { NeighborhoodId } from './types';

export const RENO_MAX = 3;
export type RenoLevel = 0 | 1 | 2 | 3;

/** The income multiplier of a shop by renovation level (index = level). */
export const RENO_MULT = [1, 2, 3, 4] as const;

/** What a shop has had done: its level and the decor items bought (ids from `RENO_ITEMS`). Saved per shop in `GameState.renovation`. */
export interface Renovated {
  level: RenoLevel;
  decor: string[];
}
export const noRenovation = (): Renovated => ({ level: 0, decor: [] });

/**
 * What a level costs, in units of the shop's cost multiplier (so Boston's prices, which the franchise scales, follow by themselves).
 * Fitted by scripts/pacing-fit.ts (card E10): the sim's player renovates as soon as it can.
 */
export const RENO_COST_UNITS = [250_000, 600_000, 1_000_000] as const;
/** One decor item of each level, in units of the shop's cost multiplier: the decor tiers' curve (DECOR_TIER_COST: x20 a tier) continued, at a flatter x4 a level. */
export const RENO_DECOR_UNITS = [DECOR_TIER_COST[1] * 20, DECOR_TIER_COST[1] * 80, DECOR_TIER_COST[1] * 320] as const;

/** The home city's six shops in order; a city with other ids takes the looks by position (Boston's first shop is Downtown's set). */
export const RENO_SHOPS = ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'] as const;
export type RenoShop = (typeof RENO_SHOPS)[number];

/** One level's looks: a plaque, a fixture upgrade and three decor items (ids `reno<level>-<shop>-<thing>`). */
export interface RenoItems {
  plaque: string;
  fixture: string;
  decor: [string, string, string];
}

// `fixture`, then the three decor things, for levels I, II, III (the same names as docs/build/v5.25/renovation.md).
const THINGS: Record<RenoShop, [string, [string, string, string]][]> = {
  downtown: [
    ['awning', ['espresso', 'wine-rack', 'chalkboard']],
    ['oven-arch', ['pendant-lamps', 'vespa', 'herb-box']],
    ['gold-sign', ['chandelier', 'medallion', 'bust']],
  ],
  suburbs: [
    ['neon-open', ['jukebox', 'stools', 'pie-case']],
    ['chrome-counter', ['booth', 'pennants', 'gumball']],
    ['roof-sign', ['cadillac', 'trophy-case', 'popcorn-cart']],
  ],
  waterfront: [
    ['rope-rail', ['crates', 'life-ring', 'anchor']],
    ['plank-deck', ['net-buoys', 'rowboat', 'lantern-post']],
    ['beacon', ['helm', 'mast', 'barrel-table']],
  ],
  university: [
    ['banner', ['bulletin-board', 'bean-bag', 'string-lights']],
    ['lounge-counter', ['couch', 'vending', 'bike-rack']],
    ['clock-tower', ['globe', 'library-ladder', 'telescope']],
  ],
  industrial: [
    ['steel-shutter', ['pipe-run', 'drums', 'pegboard']],
    ['chimney', ['flour-pallet', 'gear-clock', 'work-lamp']],
    ['gantry', ['boiler', 'conveyor', 'anvil-table']],
  ],
  uptown: [
    ['brass-door', ['velvet-rope', 'orchid', 'lectern']],
    ['marble-counter', ['columns', 'piano', 'portrait']],
    ['crown-sign', ['ice-swan', 'champagne-tower', 'deco-arch']],
  ],
};

const id = (level: number, shop: RenoShop, thing: string) => `reno${level}-${shop}-${thing}`;

/** Every shop's looks by level (index 0 = level I). */
export const RENO_ITEMS: Record<RenoShop, RenoItems[]> = Object.fromEntries(
  RENO_SHOPS.map((shop) => [
    shop,
    THINGS[shop].map(([fixture, decor], i) => ({
      plaque: id(i + 1, shop, 'plaque'),
      fixture: id(i + 1, shop, fixture),
      decor: decor.map((d) => id(i + 1, shop, d)) as [string, string, string],
    })),
  ]),
) as Record<RenoShop, RenoItems[]>;

/** Every id of the list: plaques, fixtures and decor (90). */
export const RENO_IDS: string[] = RENO_SHOPS.flatMap((shop) => RENO_ITEMS[shop].flatMap((l) => [l.plaque, l.fixture, ...l.decor]));

/** The set of looks a shop wears: its own in the home city, the same position's in another city; null for an id the city has not. */
export function renoShopOf(shop: NeighborhoodId, city: CityDef): RenoShop | null {
  const at = hoodIds(city).indexOf(shop);
  return at >= 0 ? (RENO_SHOPS[at] ?? null) : null;
}

/** The looks of one level (1 to 3) of a shop, or null. */
export function renoItems(shop: NeighborhoodId, level: number, city: CityDef): RenoItems | null {
  const set = renoShopOf(shop, city);
  return set && level >= 1 && level <= RENO_MAX ? RENO_ITEMS[set][level - 1] : null;
}

/** What renovation `level` (1 to 3) costs this shop: the level's units times the shop's cost multiplier. Null above the last level. */
export function renoCost(shop: NeighborhoodId, level: number, city: CityDef): number | null {
  const m = findHood(shop, city)?.costMult;
  if (m === undefined || level < 1 || level > RENO_MAX) return null;
  return Math.ceil(RENO_COST_UNITS[level - 1] * m);
}

/** What one decor item of renovation `level` costs this shop. */
export function renoDecorCost(shop: NeighborhoodId, level: number, city: CityDef): number | null {
  const m = findHood(shop, city)?.costMult;
  if (m === undefined || level < 1 || level > RENO_MAX) return null;
  return Math.ceil(RENO_DECOR_UNITS[level - 1] * m);
}

/** Load a saved `renovation` field: every shop of the city, level 0 to 3, decor ids that exist and belong to a level the shop has reached. */
export function migrateRenovation(raw: unknown, city: CityDef): Record<NeighborhoodId, Renovated> {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: Record<NeighborhoodId, Renovated> = {};
  for (const shop of hoodIds(city)) {
    const r = src[shop];
    const o = r && typeof r === 'object' ? (r as Record<string, unknown>) : {};
    const lv = typeof o.level === 'number' && Number.isFinite(o.level) ? Math.min(RENO_MAX, Math.max(0, Math.floor(o.level))) : 0;
    const owned = new Set<string>();
    for (let l = 1; l <= lv; l++) for (const d of renoItems(shop, l, city)?.decor ?? []) owned.add(d);
    const decor = Array.isArray(o.decor) ? [...new Set(o.decor.filter((x): x is string => typeof x === 'string' && owned.has(x)))] : [];
    out[shop] = { level: lv as RenoLevel, decor };
  }
  return out;
}
