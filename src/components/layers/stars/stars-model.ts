// Uptown's stars as plain data: the chip, the pay tag, the sheet's three inputs with what the next point costs, and the Ingredients card.
// Every cost is asked of the engine (buyUpgrade / buyDecor on a copy of the game with cash to spare), never re-derived. Text is the copy's, by
// key. Pure: unit-tested in node.
import { STARS } from '../../../content/layers';
import { DECOR_KINDS, type DecorKind } from '../../../content/tuning';
import { cityOf } from '../../../content/cities';
import { money } from '../../../engine/format';
import { buyDecor, buyUpgrade, canAfford, decorCost, upgradeCostOf, type GameState } from '../../../engine/game';
import { criticView, ingredientsLock, pointsOf, starsOf, starsView, type StarsView } from '../../../engine/features/layers/stars';
import { fill } from '../../report/report-model';
import { dressed } from '../city-dress';
import { hoodOf } from '../city-layers';
import { mmss } from '../layer-model';
import { COPY } from './copy';

/** A game with cash to spare: asking the engine what a purchase costs does not need the player to afford it. */
const RICH = 1e300;

// ---------- the pay rule ----------

export type PayTag = 'half' | 'full' | 'double';
export const payTagOf = (payMult: number): PayTag => (payMult < 1 ? 'half' : payMult > 1 ? 'double' : 'full');
export const PAY_WORDS: Readonly<Record<PayTag, string>> = {
  half: COPY['layer.uptown.stars.pay.half'],
  full: COPY['layer.uptown.stars.pay.full'],
  double: COPY['layer.uptown.stars.pay.double'],
};
/** The rule in one line: "Below 3★: half pay. 3–4★: full pay. 5★: double pay." */
export const PAY_RULE = COPY['layer.uptown.stars.payrule'];

/** The fewest points that earn `stars` stars (1 star at 0 points). */
export function pointsForStar(stars: number): number {
  for (let p = 0; p <= STARS.maxPoints; p++) if (starsOf(p) >= stars) return p;
  return STARS.maxPoints;
}

// ---------- the chip ----------

/** "Rating 4★" split over the chip's two rows. */
export const chipText = (stars: number, city?: string): string =>
  dressed(city, `rating.${Math.max(1, Math.min(5, Math.round(stars)))}`, fill(COPY['layer.uptown.stars.chip'], { n: stars }));

// ---------- the next point of each input ----------

const rich = (g: GameState): GameState => ({ ...g, cash: RICH });

/** The cheapest way to the next oven-grade point: the grades to buy and what they cost together, or null at the top. */
export function ovenNext(g: GameState): { to: string; cost: number; steps: number } | null {
  let s = rich(g);
  const HOOD = hoodOf(g, 'stars');
  const start = pointsOf(s.shops[HOOD], 0).oven;
  let cost = 0;
  const grades = cityOf(g).fit.ovenGrades;
  for (let steps = 1; steps <= grades.length; steps++) {
    const c = upgradeCostOf(s, HOOD, 'grade');
    const r = c === null ? null : buyUpgrade(s, HOOD, 'grade');
    if (c === null || !r || !r.ok) return null;
    cost += c;
    s = r.state;
    if (pointsOf(s.shops[HOOD], 0).oven > start) return { to: grades[s.shops[HOOD].grade].name, cost, steps };
  }
  return null;
}

/** The cheapest way to the next decor point: how many tiers, and what the cheapest ones cost together, or null at the top. */
export function decorNext(g: GameState): { tiers: number; cost: number } | null {
  let s = rich(g);
  const HOOD = hoodOf(g, 'stars');
  const tiersOwned = (st: GameState) => DECOR_KINDS.reduce((t, k) => t + st.shops[HOOD].decor[k], 0);
  const start = pointsOf(s.shops[HOOD], 0).decor;
  const first = tiersOwned(s);
  let cost = 0;
  for (let n = 1; n <= DECOR_KINDS.length * 3; n++) {
    let pick: { kind: DecorKind; c: number } | null = null;
    for (const kind of DECOR_KINDS) {
      const c = decorCost(s, HOOD, kind);
      if (c !== null && (pick === null || c < pick.c)) pick = { kind, c };
    }
    if (!pick) return null;
    const r = buyDecor(s, HOOD, pick.kind);
    if (!r.ok) return null;
    cost += pick.c;
    s = r.state;
    if (pointsOf(s.shops[HOOD], 0).decor > start) return { tiers: tiersOwned(s) - first, cost };
  }
  return null;
}

// ---------- the sheet ----------

export interface InputRow {
  key: 'oven' | 'decor' | 'ingredients';
  title: string;
  /** What the shop has now: the oven's name, "9 of 15 tiers", the Ingredients tier's name. */
  value: string;
  /** "1/2" */
  points: string;
  /** What the next point costs, or "Maxed". */
  next: string;
}

export interface StarsSheet {
  stars: number;
  pay: PayTag;
  payWord: string;
  /** "Rating 4★" */
  rating: string;
  /** "6 of 7 points · next star at 7" */
  progress: string;
  rows: InputRow[];
  /** "Critic in 4:10" and "Target 3★". */
  criticNext: string;
  criticTarget: string;
  /** The Ingredients button: its price, whether the player can pay, and why not. */
  ingredients: { name: string | null; price: number | null; canBuy: boolean; lock: string | null };
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function starsSheet(g: GameState): StarsSheet {
  const v = starsView(g);
  const c = criticView(g);
  const shop = g.shops[hoodOf(g, 'stars')];
  const oven = ovenNext(g);
  const decor = decorNext(g);
  const tiers = DECOR_KINDS.reduce((t, k) => t + shop.decor[k], 0);
  const nextStar = v.stars < STARS.maxStars ? pointsForStar(v.stars + 1) : null;
  return {
    stars: v.stars,
    pay: payTagOf(v.payMult),
    payWord: PAY_WORDS[payTagOf(v.payMult)],
    rating: chipText(v.stars),
    progress: `${v.points.total} of ${v.maxPoints} points${nextStar !== null ? ` · next star at ${nextStar}` : ''}`,
    rows: [
      {
        key: 'oven',
        title: 'Oven grade',
        value: cityOf(g).fit.ovenGrades[shop.grade].name,
        points: `${v.points.oven}/${STARS.ovenPoints[STARS.ovenPoints.length - 1]}`,
        next: oven ? `${oven.to} · ${money(oven.cost)}${oven.steps > 1 ? ` (${oven.steps} grades)` : ''}` : 'Maxed',
      },
      {
        key: 'decor',
        title: 'Decor',
        value: `${tiers} of ${DECOR_KINDS.length * 3} tiers`,
        points: `${v.points.decor}/${STARS.decorTiersForPoint.length}`,
        next: decor ? `${decor.tiers} more ${plural(decor.tiers, 'tier', 'tiers')} · ${money(decor.cost)}` : 'Maxed',
      },
      {
        key: 'ingredients',
        title: COPY['upgrade.uptown.ingredients.name'],
        value: tierName(v.tier),
        points: `${v.points.ingredients}/${STARS.ingredients.length - 1}`,
        next: v.nextTierName !== null && v.nextPrice !== null ? `${tierName(v.tier + 1)} · ${money(v.nextPrice)}` : 'Maxed',
      },
    ],
    criticNext: fill(COPY['layer.uptown.critic.chip.next'], { time: mmss(c.nextIn) }),
    criticTarget: fill(COPY['layer.uptown.critic.chip.target'], { n: c.target }),
    ingredients: ingredientsCard(g, v),
  };
}

/** The Ingredients tier's name, 0 = Store-brand … 3 = Truffle (copy tier.1 … tier.4). */
export const tierName = (tier: number): string =>
  COPY[`upgrade.uptown.ingredients.tier.${Math.min(4, Math.max(1, tier + 1))}` as 'upgrade.uptown.ingredients.tier.1'];

function ingredientsCard(g: GameState, v: StarsView): StarsSheet['ingredients'] {
  const lock = ingredientsLock(g);
  return { name: v.nextTierName === null ? null : tierName(v.tier + 1), price: v.nextPrice, canBuy: !lock && canAfford(g, v.nextPrice), lock };
}

// ---------- the drawer card ----------

export interface IngredientsCardModel {
  title: string;
  level: string;
  detail: string;
  cost: number | null;
  canBuy: boolean;
  /** The button's tone input: a lock, or the gain (a point is always +1). */
  lock: string | null;
}

export function ingredientsCardModel(g: GameState): IngredientsCardModel {
  const v = starsView(g);
  const card = ingredientsCard(g, v);
  const nextStar = v.stars < STARS.maxStars ? pointsForStar(v.stars + 1) - v.points.total : null;
  const detail =
    card.name === null
      ? `Truffle on everything · ${PAY_WORDS[payTagOf(v.payMult)]}`
      : `${card.name} · +1 point${nextStar === 1 ? ' · earns the next star' : ''}`;
  return { title: COPY['upgrade.uptown.ingredients.name'], level: tierName(v.tier), detail, cost: card.price, canBuy: card.canBuy, lock: card.lock };
}
