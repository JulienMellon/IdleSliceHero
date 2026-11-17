// The number ceiling (v5.18, card E3): five cities, each with bigger numbers, and a permanent multiplier on top. Doubles go to 1.8e308 and
// the engine's what-if cash is 1e300, so no cash, price or income a player can reach may come near 1e300: below 1e280, a factor of 1e20 to
// spare. A city that has a pack is measured on its own numbers and on the planned ones (content/franchise.ts `cityNumbers`: the spec's
// "bigger numbers" as the growth rule); one that has no pack yet on the planned ones alone. The player has every upgrade bought, the best
// fleet and ovens, the biggest footprint, the finale perks, and 30 days of offline earnings in the bank.
import { CITIES, hoodIds, type CityDef } from '../../content/cities';
import { HOME_CITY } from '../../content/cities/home';
import { CITY_ORDER, cityNumbers } from '../../content/franchise';
import { DECOR_KINDS, DECOR_TIER_COST, STATIONS, TUNING } from '../../content/tuning';
import { NEIGHBORHOODS } from '../../content/tuning';
import { starsFor, multiplierOf } from '../features/franchise';
import { count, money, shownValue } from '../format';
import * as G from '../game';

const CEILING = 1e300;
const SPARE = 1e20;
const LIMIT = CEILING / SPARE;
const OFFLINE_DAYS = 30;
/** What boosts (x100 at the very most), events (x2), recipe cards, Uptown's rating and the other layers can add on top of a shop's value, all at once: far more than they can. */
const FEATURE_HEADROOM = 1e3;

type Reach = { cash: number; cost: number; everything: number; income: number };

/** City `index` from the planned numbers: the home pack with prices and values scaled by the growth rule. */
function planned(index: number): CityDef {
  if (index === 0) return HOME_CITY;
  const n = cityNumbers(index);
  return {
    ...HOME_CITY,
    id: CITY_ORDER[index],
    neighbourhoods: HOME_CITY.neighbourhoods.map((h, i) => ({ ...h, ...n.hoods[i] })),
    fit: { ...HOME_CITY.fit, vehicles: HOME_CITY.fit.vehicles.map((v, i) => (i === 0 ? v : { ...v, cost: n.vehicleCosts[i - 1] })), headCostFirst: n.headCostFirst },
    bid: HOME_CITY.bid ? { ...HOME_CITY.bid, cost: n.bid.cost } : undefined,
  };
}

/** The most a player can reach in one city: its dearest price, every price added up, its best income, and 30 days of that income in cash. `mult`: the Franchise multiplier carried in. */
function reach(city: CityDef, mult: number): Reach {
  const top = city.fit.footprints.length - 1;
  const cap = TUNING.levelsPerFootprint * (top + 1);
  const prices: number[] = [];
  let income = 0;
  for (const h of city.neighbourhoods) {
    prices.push(h.buildCost, h.managerCost, h.headsCost);
    for (const k of Object.keys(STATIONS) as (keyof typeof STATIONS)[]) for (let lv = 0; lv < cap; lv++) prices.push(G.stationCost(h.id, k, lv, city));
    for (const g of city.fit.ovenGrades) prices.push(g.cost * h.costMult);
    for (const f of city.fit.footprints) prices.push(f.cost * h.costMult);
    for (const c of DECOR_TIER_COST) prices.push(c * h.costMult * DECOR_KINDS.length);
    const shop: G.Shop = { ...G.newShop(true), managed: true, heads: G.allHeads(), prep: cap, ovens: cap, counter: cap, tables: cap, drivers: cap, grade: city.fit.ovenGrades.length - 1, footprint: top, perk: true, decor: Object.fromEntries(DECOR_KINDS.map((k) => [k, 3])) as G.Shop['decor'] };
    income += G.shopRevenue(h.id, shop, city.fit.vehicles.length - 1, { value: FEATURE_HEADROOM * mult, demand: 1 }, city);
  }
  for (const v of city.fit.vehicles) prices.push(v.cost);
  prices.push(...Object.values(city.fit.headCostFirst), city.bid?.cost ?? 0);
  // the rewards' prices (the night oven) are minutes of income
  prices.push(income * 60 * 60);
  return { cash: income * OFFLINE_DAYS * 86400, cost: Math.max(...prices), everything: prices.reduce((t, x) => t + x, 0), income };
}

/** All five cities in order, the Stars of each one's richest clear carried into the next. */
function allCities() {
  const rows: { id: string; source: string; mult: number; r: Reach }[] = [];
  let stars = 0;
  CITY_ORDER.forEach((id, i) => {
    const mult = multiplierOf(stars);
    const packs: [string, CityDef][] = [['planned', planned(i)]];
    if (i > 0 && Object.prototype.hasOwnProperty.call(CITIES, id)) packs.push(['pack', CITIES[id]]);
    let richest = 0;
    for (const [source, pack] of packs) {
      const r = reach(pack, mult);
      rows.push({ id, source, mult, r });
      richest = Math.max(richest, r.cash);
    }
    stars += starsFor(richest, i);
  });
  return rows;
}

const ROWS = allCities();
const ALL = ROWS.flatMap((x) => [x.r.cash, x.r.cost, x.r.everything, x.r.income]);
export const LARGEST = Math.max(...ALL);

describe('the number ceiling', () => {
  it('measures the five cities', () => {
    expect(new Set(ROWS.map((x) => x.id))).toEqual(new Set(CITY_ORDER));
    expect(ROWS.length).toBeGreaterThanOrEqual(5);
  });

  test.each(ROWS.map((x) => [`${x.id} (${x.source})`, x] as const))('%s: cash, price and income are below 1e280', (_n, x) => {
    for (const [what, v] of Object.entries(x.r)) {
      expect(Number.isFinite(v)).toBe(true);
      expect({ what, below: v < LIMIT }).toEqual({ what, below: true });
    }
  });

  it('every city is bigger than the one before (the planned growth)', () => {
    const p = ROWS.filter((x) => x.source === 'planned');
    for (let i = 1; i < p.length; i++) expect(p[i].r.cost).toBeGreaterThan(p[i - 1].r.cost);
  });

  it('every magnitude below the last named suffix (1e36) has a readable name', () => {
    // report: the largest number any city reaches, for the card's report
    // eslint-disable-next-line no-console
    console.info(`number ceiling: largest magnitude ${LARGEST.toExponential(2)} (${money(LARGEST)}); limit ${LIMIT.toExponential(0)}`);
    for (const v of ALL.filter((x) => x < 1e36)) {
      const text = money(v);
      expect(text).not.toMatch(/NaN|Infinity|e\+|1000/);
      if (v >= 1000) expect(text).toMatch(/^\$\d+(\.\d+)?[A-Za-z]+$/);
    }
  });

  // The later cities (with the x1e3 headroom for boosts and layers) reach past Dc: format.ts writes those as "$2.4e38".
  it('every magnitude past the last suffix prints in a short scientific form', () => {
    for (const v of ALL.filter((x) => x >= 1e36)) expect(money(v)).toMatch(/^\$\d(\.\d+)?e\d+$/);
  });
});

describe('format at the top of its range', () => {
  it('goes scientific where the last suffix would need four digits', () => {
    expect(money(999.4e33)).toBe('$999Dc');
    expect(money(999.5e33)).toBe('$1e36');
    expect(money(1e36)).toBe('$1e36');
    expect(money(2.4036e38)).toBe('$2.4e38');
    expect(money(2.4036e38, true)).toBe('$2.40e38');
    expect(money(9.996e38)).toBe('$1e39');
    expect(money(-2.4e38)).toBe('-$2.4e38');
    expect(money(1.5e300)).toBe('$1.5e300');
    expect(count(3e40)).toBe('3e40');
    expect(shownValue(2.4036e38)).toBe(2.4e38);
  });
  it('each suffix prints at its boundary', () => {
    expect(money(999)).toBe('$999');
    expect(money(1e3)).toBe('$1K');
    expect(money(1e30)).toBe('$1No');
    expect(money(1e33)).toBe('$1Dc');
    expect(money(999e33)).toBe('$999Dc');
    expect(count(1.5e33)).toBe('1.5Dc');
    expect(money(1.234e32)).toBe('$123Oc'.replace('Oc', 'No'));
  });
  it('the home city’s own largest price still fits the names', () => {
    const top = Math.max(...NEIGHBORHOODS.map((n) => n.managerCost));
    expect(money(top)).toMatch(/Q/i);
  });
});
