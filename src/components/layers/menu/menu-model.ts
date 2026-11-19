// University's menu sheet as plain data: the three recipes with their price and time effects, the tap-only mix control (plus and minus in
// 10% steps; no sliders, no drags) and the mix's total effect. Text is the copy's, by key. Pure: unit-tested in node.
import { MENU } from '../../../content/layers';
import type { MenuView } from '../../../engine/features/layers/menu';
import { dressed } from '../../../content/copy';
import { COPY } from './copy';

export type RecipeId = 'cheese' | 'pepperoni' | 'knots';
/** The order the recipes are drawn in, and the tie-break of the mix control. */
export const RECIPE_ORDER: readonly RecipeId[] = ['cheese', 'pepperoni', 'knots'];
/** One tap of plus or minus moves this many percent. */
export const MIX_STEP = 10;

export interface Mix {
  cheese: number;
  pepperoni: number;
  knots: number;
}

export const mixOfView = (v: Pick<MenuView, 'cheese' | 'pepperoni' | 'knots'>): Mix => ({ cheese: v.cheese, pepperoni: v.pepperoni, knots: v.knots });

/**
 * One tap on a recipe's plus or minus. Plus takes a step from the largest of the other two (ties go in recipe order); minus gives a step to
 * Cheese (to Pepperoni when it is Cheese's own minus). The three always add to 100. Null when the tap does nothing (nothing to take, or the
 * recipe is at 0), so the button can draw itself disabled.
 */
export function stepMix(m: Mix, id: RecipeId, dir: 1 | -1): Mix | null {
  const others = RECIPE_ORDER.filter((r) => r !== id);
  if (dir === 1) {
    const donor = others.reduce((best, r) => (m[r] > m[best] ? r : best), others[0]);
    const take = Math.min(MIX_STEP, m[donor]);
    return take > 0 ? { ...m, [id]: m[id] + take, [donor]: m[donor] - take } : null;
  }
  const give = Math.min(MIX_STEP, m[id]);
  return give > 0 ? { ...m, [id]: m[id] - give, [others[0]]: m[others[0]] + give } : null;
}

/** "+30% prep" / "−50% oven time": what a recipe does to a station's time, or '' for the steady one. */
function timeEffect(factor: number, station: string): string {
  const pct = Math.round((factor - 1) * 100);
  return pct === 0 ? '' : `${pct > 0 ? '+' : '−'}${Math.abs(pct)}% ${station}`;
}

export interface RecipeRow {
  id: RecipeId;
  name: string;
  line: string;
  /** Percent of the pies. */
  pct: number;
  /** "Pays ×1.4" */
  price: string;
  /** "+30% prep" or "−50% oven time"; "Steady" for Cheese. */
  time: string;
  canPlus: boolean;
  canMinus: boolean;
}

export function recipeRows(m: Mix, city?: string): RecipeRow[] {
  return RECIPE_ORDER.map((id) => {
    const r = MENU.recipes.find((x) => x.id === id)!;
    const effects = [timeEffect(r.prep, 'prep time'), timeEffect(r.bake, 'oven time')].filter(Boolean);
    return {
      id,
      name: COPY[`menu.${id}.name` as const],
      line: dressed(city, `menu.${id}.line`, COPY[`menu.${id}.line` as const]),
      pct: m[id],
      price: `Pays ×${r.price}`,
      time: effects.length ? effects.join(' · ') : 'Steady',
      canPlus: stepMix(m, id, 1) !== null,
      canMinus: stepMix(m, id, -1) !== null,
    };
  });
}

const x2 = (n: number) => `×${(Math.round(n * 100) / 100).toString()}`;

/** The mix's total effect in one line: what a pizza pays, and the prep and oven speed. */
export function effectLine(v: Pick<MenuView, 'valueMult' | 'prepRate' | 'ovenRate'>): string {
  return `Pays ${x2(v.valueMult)} · Prep ${x2(v.prepRate)} · Oven ${x2(v.ovenRate)}`;
}

/** "50/30/20": the mix as the sheet's subtitle (Cheese / Pepperoni / Garlic Knots). */
export const mixText = (m: Mix): string => `${m.cheese}/${m.pepperoni}/${m.knots}`;
