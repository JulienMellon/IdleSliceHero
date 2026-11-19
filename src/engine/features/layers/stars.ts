// Uptown, stars (v5.16, Genevieve's rating).
//
// A rating of 1 to 5 stars from points: the oven grade (0 to 2), the decor tiers owned (0 to 2) and a new Ingredients track (Store-brand,
// Imported, Farm, Truffle: 0 to 3). Stars = 1 + floor(points x 4 / 7). Below 3 stars Uptown's pizzas pay 50%; 3 and 4 stars pay 100%;
// 5 stars pay 200% (`shopValueMult`, so every readout and upgrade gain sees it). Ingredients tiers cost 30 / 120 / 480 minutes of
// Uptown's income at purchase time.
//
// The critic: every 15 minutes of play (seeded gaps, the same save replays the same visits) a critic comes with a target rating. Meeting
// it pays CRITIC.rewardMinutes of citywide income (45 s: the card's 3 minutes on Julien's reduced reward scale; the rewards' income, which ignores boosts and events) and adds a star to the sign, a cosmetic
// count; missing it does nothing. Play time only; inactive until Uptown is built; old saves load as "inactive, the first visit is one gap
// after the shop is first seen built".
import { seededUnit } from '../../bonus';
import { CRITIC, LAYER_KEYS, STARS } from '../../../content/layers';
import { DECOR_KINDS } from '../../../content/tuning';
import { pay, shopRevenue, type BuyResult, type GameState, type Shop } from '../../game';
import { minutesToCash } from '../../rewards';
import type { Feature } from '../types';
import { cityOf, layerHood } from '../../../content/cities';
import type { NeighborhoodId } from '../../../content/types';
import { freshTimed, gapOf, type TimedSpec } from './game-day';

/** How the last visit went; the UI shows it until `ackCritic`. */
export interface CriticResult {
  target: number;
  stars: number;
  hit: boolean;
  /** Cash paid (0 on a miss). */
  cash: number;
}

export interface StarsState {
  seed: number;
  /** Visits so far: which visit (and gap) comes next. */
  n: number;
  /** Play second of the next visit; -1 until the layer is first seen active. */
  nextAt: number;
  /** Ingredients tier owned, 0 (Store-brand) to 3 (Truffle). */
  tier: number;
  /** Stars on the sign: one for every visit passed (cosmetic). */
  sign: number;
  /** The last visit, until the UI has shown it. */
  result: CriticResult | null;
}

const hoodOf = (g: GameState): NeighborhoodId => layerHood(cityOf(g), 'stars') ?? '';
const MAX_TIER = STARS.ingredients.length - 1;
const spec: TimedSpec = { ...CRITIC, rushSeconds: 0 };
const fresh = (now: number): StarsState => ({ seed: freshTimed(now).seed, n: 0, nextAt: -1, tier: 0, sign: 0, result: null });
const read = (g: GameState): StarsState => (g.x?.[LAYER_KEYS.stars] as StarsState | undefined) ?? fresh(0);
const write = (g: GameState, s: StarsState): GameState => ({ ...g, x: { ...g.x, [LAYER_KEYS.stars]: s } });
const built = (g: GameState): boolean => !!g.shops[hoodOf(g)]?.built;

// ---------- the rating ----------

export interface Points {
  oven: number;
  decor: number;
  ingredients: number;
  total: number;
}

/** The points a shop and an Ingredients tier give. */
export function pointsOf(shop: Pick<Shop, 'grade' | 'decor'>, tier: number): Points {
  const oven = STARS.ovenPoints[Math.min(STARS.ovenPoints.length - 1, Math.max(0, shop.grade))] ?? 0;
  const tiers = DECOR_KINDS.reduce((t, k) => t + (shop.decor?.[k] ?? 0), 0);
  const decor = STARS.decorTiersForPoint.filter((need) => tiers >= need).length;
  const ingredients = Math.min(MAX_TIER, Math.max(0, tier));
  return { oven, decor, ingredients, total: oven + decor + ingredients };
}

/** Stars from points: 1 + floor(points x 4 / 7), 1 to 5. */
export const starsOf = (points: number): number => 1 + Math.floor((Math.max(0, Math.min(STARS.maxPoints, points)) * (STARS.maxStars - 1)) / STARS.maxPoints);

/** What Uptown's pizzas are worth at a star rating: 50% under 3 stars, 100% at 3 and 4, 200% at 5. */
export const payMult = (stars: number): number => (stars >= STARS.maxStars ? STARS.pay.top : stars >= 3 ? STARS.pay.mid : STARS.pay.low);

/** Uptown's stars right now (1 for a game that has no Uptown yet). */
export const starsNow = (g: GameState): number => starsOf(pointsOf(g.shops[hoodOf(g)], read(g).tier).total);

// ---------- Ingredients ----------

/** The Ingredients tier owned, 0 (Store-brand) to 3 (Truffle). */
export const ingredientsTier = (g: GameState): number => read(g).tier;

/** What the next Ingredients tier costs now: its minutes of Uptown's income (shopRevenue: no boost, no event), or null at the top. */
export function ingredientsPrice(g: GameState): number | null {
  const tier = read(g).tier;
  if (tier >= MAX_TIER) return null;
  return Math.max(1, Math.ceil(STARS.ingredients[tier + 1].minutes * 60 * shopRevenue(hoodOf(g), g.shops[hoodOf(g)], g.vehicle, undefined, cityOf(g))));
}

/** Why the next tier can't be bought yet (other than cash), or null. */
export function ingredientsLock(g: GameState): string | null {
  if (!built(g)) return 'Build this pizzeria first';
  return read(g).tier >= MAX_TIER ? 'The best ingredients there are' : null;
}

/** Buy the next Ingredients tier: spends its price and earns a point. */
export function buyIngredients(g: GameState): BuyResult {
  const lock = ingredientsLock(g);
  if (lock) return { ok: false, reason: lock };
  const price = ingredientsPrice(g);
  if (price === null) return { ok: false, reason: 'The best ingredients there are' };
  const paid = pay(g, price);
  if (!paid.ok) return paid;
  const st = read(g);
  return { ok: true, state: write(paid.state, { ...st, tier: st.tier + 1 }) };
}

// ---------- the critic ----------

/** The rating visit number `n` (1, 2, ...) asks for: 2 to 4 by the seed, and 5 on every fifth visit. */
export function criticTarget(seed: number, n: number): number {
  if (n > 0 && n % CRITIC.fiveEvery === 0) return STARS.maxStars;
  return 2 + Math.floor(seededUnit(seed, n, CRITIC.seedSalt) * 3);
}

/** The UI has shown how the last visit went. */
export function ackCritic(g: GameState): GameState {
  const st = read(g);
  return st.result ? write(g, { ...st, result: null }) : g;
}

export interface StarsView {
  active: boolean;
  stars: number;
  points: Points;
  maxPoints: number;
  /** What Uptown's pizzas are worth now. */
  payMult: number;
  /** The Ingredients tier owned (0 to 3), its name, and the next tier's name and price (null at the top). */
  tier: number;
  tierName: string;
  nextTierName: string | null;
  nextPrice: number | null;
  /** Stars on the sign. */
  sign: number;
}

/** What the rating card needs, pure. */
export function starsView(g: GameState): StarsView {
  const st = read(g);
  const points = pointsOf(g.shops[hoodOf(g)], st.tier);
  const stars = starsOf(points.total);
  return {
    active: built(g),
    stars,
    points,
    maxPoints: STARS.maxPoints,
    payMult: payMult(stars),
    tier: st.tier,
    tierName: STARS.ingredients[st.tier].name,
    nextTierName: st.tier < MAX_TIER ? STARS.ingredients[st.tier + 1].name : null,
    nextPrice: built(g) ? ingredientsPrice(g) : null,
    sign: st.sign,
  };
}

export interface CriticView {
  active: boolean;
  /** Seconds until the critic comes. */
  nextIn: number;
  /** The rating the next visit asks for. */
  target: number;
  stars: number;
  /** Stars on the sign. */
  sign: number;
  /** The last visit's result until acknowledged. */
  last: CriticResult | null;
}

/** The cash a passed visit pays right now (the rewards' income, so it costs a full earnings pass: ask for it where it is shown, not in a store selector). */
export const criticReward = (g: GameState): number => (built(g) ? minutesToCash(g, CRITIC.rewardMinutes) : 0);

/** What the critic's banner needs, pure and cheap (no income pass; `criticReward` is the cash). */
export function criticView(g: GameState): CriticView {
  const st = read(g);
  return {
    active: built(g),
    nextIn: st.nextAt < 0 ? CRITIC.everySeconds : Math.max(0, Math.ceil(st.nextAt - g.playSeconds)),
    target: criticTarget(st.seed, st.n + 1),
    stars: starsNow(g),
    sign: st.sign,
    last: st.result,
  };
}

/** One visit: the critic compares the rating with the target and pays on a hit. */
function visit(g: GameState, st: StarsState): GameState {
  const n = st.n + 1;
  const target = criticTarget(st.seed, n);
  const stars = starsOf(pointsOf(g.shops[hoodOf(g)], st.tier).total);
  const hit = stars >= target;
  const cash = hit ? minutesToCash(g, CRITIC.rewardMinutes) : 0;
  const next: StarsState = { ...st, n, sign: st.sign + (hit ? 1 : 0), result: { target, stars, hit, cash } };
  return write(hit && cash > 0 ? { ...g, cash: g.cash + cash, totalEarned: g.totalEarned + cash } : g, next);
}

export const starsLayer: Feature<StarsState> = {
  key: LAYER_KEYS.stars,
  init: fresh,
  migrate(raw, now) {
    const f = fresh(now);
    if (!raw || typeof raw !== 'object') return f;
    const r = raw as Record<string, unknown>;
    const num = (v: unknown, d: number, min: number) => (typeof v === 'number' && Number.isFinite(v) && v >= min ? v : d);
    const res = r.result && typeof r.result === 'object' ? (r.result as Record<string, unknown>) : null;
    const result: CriticResult | null =
      res && typeof res.hit === 'boolean'
        ? { target: Math.floor(num(res.target, 2, 1)), stars: Math.floor(num(res.stars, 1, 1)), hit: res.hit, cash: num(res.cash, 0, 0) }
        : null;
    return {
      seed: Math.floor(num(r.seed, f.seed, 0)),
      n: Math.floor(num(r.n, 0, 0)),
      nextAt: num(r.nextAt, -1, 0),
      tier: Math.min(MAX_TIER, Math.floor(num(r.tier, 0, 0))),
      sign: Math.floor(num(r.sign, 0, 0)),
      result,
    };
  },
  tick(g, _dt) {
    if (!built(g)) return g;
    const st = read(g);
    if (st.nextAt < 0) return write(g, { ...st, nextAt: g.playSeconds + gapOf(st, 0, spec) });
    if (g.playSeconds < st.nextAt) return g;
    // a visit that came due while a huge step passed is judged on the shop as it is now; its schedule keeps the gaps
    let out = g;
    let s = st;
    for (let guard = 0; g.playSeconds >= s.nextAt && guard < 1000; guard++) {
      const due = s.nextAt;
      out = visit(out, s);
      s = { ...read(out), nextAt: due + gapOf(s, s.n + 1, spec) };
      out = write(out, s);
    }
    return out;
  },
  shopValueMult(g, id) {
    return id === hoodOf(g) && built(g) ? payMult(starsNow(g)) : 1;
  },
  shopKey(g, id) {
    return id === hoodOf(g) && built(g) ? `stars${starsNow(g)}` : '';
  },
};
