/// <reference types="jest" />
import { MENU } from '../../../../content/layers';
import { effectLine, MIX_STEP, mixText, RECIPE_ORDER, recipeRows, stepMix, type Mix, type RecipeId } from '../menu-model';

const cheese: Mix = { cheese: 100, pepperoni: 0, knots: 0 };
const total = (m: Mix) => m.cheese + m.pepperoni + m.knots;
const tap = (m: Mix, id: RecipeId, dir: 1 | -1): Mix => stepMix(m, id, dir) ?? m;

describe('the mix control is taps in 10% steps', () => {
  it('moves 10 points at a time and always adds to 100', () => {
    let m = cheese;
    for (const [id, dir] of [['pepperoni', 1], ['pepperoni', 1], ['knots', 1], ['knots', -1], ['cheese', 1], ['pepperoni', -1], ['knots', 1]] as const) {
      const next = stepMix(m, id, dir);
      if (next) {
        for (const r of RECIPE_ORDER) expect(Math.abs(next[r] - m[r])).toBeLessThanOrEqual(MIX_STEP);
        m = next;
      }
      expect(total(m)).toBe(100);
      for (const r of RECIPE_ORDER) expect(m[r]).toBeGreaterThanOrEqual(0);
    }
  });

  it('reaches 50/30/20 from the plain menu in five taps', () => {
    let m = cheese;
    for (const id of ['pepperoni', 'pepperoni', 'pepperoni', 'knots', 'knots'] as const) m = tap(m, id, 1);
    expect(m).toEqual({ cheese: 50, pepperoni: 30, knots: 20 });
    expect(mixText(m)).toBe('50/30/20');
  });

  it('plus takes from the largest of the other two (ties in recipe order); minus gives to Cheese, or to Pepperoni from Cheese', () => {
    expect(stepMix({ cheese: 50, pepperoni: 30, knots: 20 }, 'knots', 1)).toEqual({ cheese: 40, pepperoni: 30, knots: 30 });
    expect(stepMix({ cheese: 20, pepperoni: 30, knots: 50 }, 'cheese', 1)).toEqual({ cheese: 30, pepperoni: 30, knots: 40 });
    expect(stepMix({ cheese: 40, pepperoni: 30, knots: 30 }, 'cheese', -1)).toEqual({ cheese: 30, pepperoni: 40, knots: 30 });
    expect(stepMix({ cheese: 40, pepperoni: 30, knots: 30 }, 'knots', -1)).toEqual({ cheese: 50, pepperoni: 30, knots: 20 });
  });

  it('does nothing (null) when there is nothing to take or give', () => {
    expect(stepMix(cheese, 'cheese', 1)).toBeNull();
    expect(stepMix(cheese, 'pepperoni', -1)).toBeNull();
    expect(stepMix({ cheese: 0, pepperoni: 100, knots: 0 }, 'pepperoni', 1)).toBeNull();
    // a share under a step moves what it has
    expect(stepMix({ cheese: 4, pepperoni: 96, knots: 0 }, 'knots', 1)).toEqual({ cheese: 4, pepperoni: 86, knots: 10 });
    expect(stepMix({ cheese: 100, pepperoni: 0, knots: 0 }, 'cheese', -1)).toEqual({ cheese: 90, pepperoni: 10, knots: 0 });
  });
});

describe('the recipe rows', () => {
  it('say what each recipe does to the price and the times, and which buttons work', () => {
    const rows = recipeRows({ cheese: 50, pepperoni: 30, knots: 20 });
    expect(rows.map((r) => r.id)).toEqual(['cheese', 'pepperoni', 'knots']);
    expect(rows.map((r) => r.pct)).toEqual([50, 30, 20]);
    expect(rows[0]).toMatchObject({ name: 'Cheese', price: 'Pays ×1', time: 'Steady' });
    expect(rows[1]).toMatchObject({ name: 'Pepperoni', price: 'Pays ×1.4', time: '+30% prep time' });
    expect(rows[2]).toMatchObject({ name: 'Garlic Knots', price: 'Pays ×0.6', time: '−50% oven time' });
    expect(rows.every((r) => r.canPlus && r.canMinus)).toBe(true);
    expect(recipeRows(cheese).map((r) => [r.canPlus, r.canMinus])).toEqual([[false, true], [true, false], [true, false]]);
  });

  it('uses the content table: one row per recipe, in the copy words', () => {
    expect(MENU.recipes.map((r) => r.id)).toEqual([...RECIPE_ORDER]);
    for (const r of recipeRows(cheese)) expect(r.line.length).toBeGreaterThan(10);
  });

  it('sums the mix in one line', () => {
    expect(effectLine({ valueMult: 1.12, prepRate: 0.9615384615, ovenRate: 1.1428571 })).toBe('Pays ×1.12 · Prep ×0.96 · Oven ×1.14');
  });
});
