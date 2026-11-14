// Uptown, stars (v5.16): the rating's formula at every boundary, what each rating pays, the Ingredients track, the critic's schedule and old saves.
import { CRITIC, STARS } from '../../../../content/layers';
import { DECOR_KINDS } from '../../../../content/tuning';
import { getFeature, withFeatures } from '../../index';
import * as G from '../../../game';
import * as R from '../../../rewards';
import { ackCritic, buyIngredients, criticTarget, criticView, ingredientsLock, ingredientsPrice, payMult, pointsOf, starsNow, starsOf, starsView, uptownStars, type StarsState } from '../uptown-stars';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const HOOD = STARS.hood;
const run = <T>(fn: () => T): T => withFeatures([uptownStars], fn);
const state = (g: G.GameState) => getFeature(g, uptownStars);
const withState = (g: G.GameState, p: Partial<StarsState>): G.GameState => ({ ...g, x: { ...g.x, [uptownStars.key]: { ...state(g), ...p } } });
const patch = (g: G.GameState, p: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [HOOD]: { ...g.shops[HOOD], ...p } } });
const decorAll = (tier: number) => Object.fromEntries(DECOR_KINDS.map((k) => [k, tier])) as G.Shop['decor'];

/** Uptown built and running with a given oven grade, decor tier on every kind and Ingredients tier. */
function uptown(grade = 0, decor = 0, tier = 0): G.GameState {
  return run(() => withState(patch(G.newGame(NOW), { built: true, managed: true, heads: G.allHeads(), grade, decor: decorAll(decor), prep: 40, ovens: 40, counter: 40, tables: 20, drivers: 20 }), { tier }));
}
/** Move the play clock and run the layer's own tick (no kitchen: the cash change is only the layer's). */
const visitAt = (g: G.GameState, play: number): G.GameState => uptownStars.tick!({ ...g, playSeconds: play }, 1, NOW);

describe('the rating', () => {
  it('stars = 1 + floor(points x 4 / 7), at every boundary', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(starsOf)).toEqual([1, 1, 2, 2, 3, 3, 4, 5]);
    // never below 1 or above 5, whatever it is given
    expect(starsOf(-3)).toBe(1);
    expect(starsOf(99)).toBe(5);
    for (let p = 0; p <= 7; p++) expect(starsOf(p)).toBe(1 + Math.floor((p * 4) / 7));
  });

  it('under 3 stars pays 50%, 3 and 4 pay 100%, 5 pays 200%', () => {
    expect([1, 2, 3, 4, 5].map(payMult)).toEqual([0.5, 0.5, 1, 1, 2]);
    run(() => {
      const mult = (g: G.GameState) => G.featureMults(g, HOOD, NOW).value;
      expect(mult(uptown(0, 0, 0))).toBe(0.5); // 0 points
      expect(mult(uptown(2, 0, 0))).toBe(0.5); // 1 point: 1 star
      expect(mult(uptown(3, 0, 1))).toBe(0.5); // 3 points: 2 stars
      expect(mult(uptown(3, 0, 2))).toBe(1); // 4 points: 3 stars
      expect(mult(uptown(3, 2, 1))).toBe(1); // 5 points
      expect(mult(uptown(3, 2, 2))).toBe(1); // 6 points: 4 stars
      expect(mult(uptown(3, 3, 3))).toBe(2); // 7 points: 5 stars
      expect(G.featureMults(uptown(3, 3, 3), 'downtown', NOW).value).toBe(1);
    });
  });

  it('the pay reaches the shop’s income: the same shop, only the Ingredients differ', () => {
    run(() => {
      const income = (tier: number) => G.shopEarnings(uptown(3, 0, tier), HOOD, NOW);
      expect(income(1) / income(0)).toBe(1); // 3 points: 2 stars, 2 stars
      expect(income(2) / income(1)).toBeCloseTo(2, 12); // 4 points: 3 stars pays 100% where 2 paid 50%
      expect(income(3) / income(2)).toBe(1); // 5 points: still 3 stars
      const rich = (tier: number) => G.shopEarnings(uptown(3, 3, tier), HOOD, NOW);
      expect(rich(3) / rich(2)).toBeCloseTo(2, 12); // 7 points: 5 stars pays 200% where 4 paid 100%
    });
  });

  it('points: the oven grade 0 to 2, the decor tiers 0 to 2, the Ingredients tier 0 to 3', () => {
    const p = (grade: number, decor: number, tier: number) => pointsOf({ grade, decor: decorAll(decor) }, tier);
    expect([0, 1, 2, 3, 4].map((g) => p(g, 0, 0).oven)).toEqual([0, 1, 1, 2, 2]);
    // 5 kinds: a tier on every kind is 5 tiers owned, 10, 15
    expect([0, 1, 2, 3].map((d) => p(0, d, 0).decor)).toEqual([0, 1, 2, 2]);
    expect(pointsOf({ grade: 0, decor: { ...decorAll(0), plants: 3, walls: 1 } }, 0).decor).toBe(0); // 4 tiers
    expect(pointsOf({ grade: 0, decor: { ...decorAll(0), plants: 3, walls: 2 } }, 0).decor).toBe(1); // 5 tiers
    expect([0, 1, 2, 3, 4, 9].map((t) => p(0, 0, t).ingredients)).toEqual([0, 1, 2, 3, 3, 3]);
    expect(p(4, 3, 3).total).toBe(STARS.maxPoints);
    expect(starsNow(uptown(4, 3, 3))).toBe(5);
    expect(starsNow(G.newGame(NOW))).toBe(1);
  });
});

describe('the Ingredients track', () => {
  it('four tiers, the first the starting stock; the others 30 / 120 / 480 minutes of Uptown’s income', () => {
    expect(STARS.ingredients.map((t) => [t.name, t.minutes])).toEqual([['Store-brand', 0], ['Imported', 30], ['Farm', 120], ['Truffle', 480]]);
    run(() => {
      let g = uptown();
      for (const [i, minutes] of [30, 120, 480].entries()) {
        const income = G.shopEarnings(g, HOOD);
        expect(ingredientsPrice(g)).toBe(Math.ceil(minutes * 60 * income));
        const r = buyIngredients({ ...g, cash: 1e30 });
        expect(r.ok).toBe(true);
        g = (r as { state: G.GameState }).state;
        expect(state(g).tier).toBe(i + 1);
        expect(g.cash).toBe(0 + (r as { state: G.GameState }).state.cash);
      }
      expect(ingredientsPrice(g)).toBeNull();
      expect(buyIngredients(g)).toEqual({ ok: false, reason: 'The best ingredients there are' });
    });
  });

  it('spends the price, needs the cash and a built shop', () => {
    run(() => {
      const g = uptown();
      const price = ingredientsPrice(g)!;
      expect(buyIngredients({ ...g, cash: price - 1 })).toEqual({ ok: false, reason: 'Not enough cash' });
      const r = buyIngredients({ ...g, cash: price + 7 });
      expect(r.ok && r.state.cash).toBe(7);
      expect(ingredientsLock(G.newGame(NOW))).toBe('Build this pizzeria first');
      expect(buyIngredients(G.newGame(NOW))).toEqual({ ok: false, reason: 'Build this pizzeria first' });
    });
  });

  it('a tier is a point of the rating', () => {
    run(() => {
      const g = uptown(3, 0, 1);
      expect(starsNow(g)).toBe(2);
      const r = buyIngredients({ ...g, cash: 1e30 });
      expect(r.ok && starsNow(r.state)).toBe(3);
    });
  });

  it('the rating card has the numbers', () => {
    run(() => {
      const g = uptown(3, 0, 2);
      expect(starsView(g)).toMatchObject({ active: true, stars: 3, payMult: 1, tier: 2, tierName: 'Farm', nextTierName: 'Truffle', sign: 0, maxPoints: 7, points: { oven: 2, decor: 0, ingredients: 2, total: 4 } });
      expect(starsView(g).nextPrice).toBe(ingredientsPrice(g));
      expect(starsView(uptown(0, 0, 3))).toMatchObject({ nextTierName: null, nextPrice: null });
      expect(starsView(G.newGame(NOW))).toMatchObject({ active: false, nextPrice: null });
    });
  });
});

describe('the critic', () => {
  const seedFor = (n: number, target: number): number => {
    for (let seed = 1; seed < 500; seed++) if (criticTarget(seed, n) === target) return seed;
    throw new Error('no seed');
  };

  it('targets: 2 to 4 by the seed, 5 on every fifth visit, and the same every time', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (let n = 1; n <= 12; n++) {
        const t = criticTarget(seed, n);
        expect(t).toBe(criticTarget(seed, n));
        expect(t).toBe(n % CRITIC.fiveEvery === 0 ? 5 : t);
        expect(t).toBeGreaterThanOrEqual(2);
        expect(t).toBeLessThanOrEqual(5);
      }
    }
    expect(new Set([1, 2, 3, 4, 6, 7].flatMap((n) => Array.from({ length: 30 }, (_, s) => criticTarget(s + 1, n))))).toEqual(new Set([2, 3, 4]));
  });

  it('visits every 15 minutes of play on a schedule that replays from the seed', () => {
    const visits = (seed: number) => {
      let g = withState(uptown(), { seed });
      const out: { at: number; target: number }[] = [];
      for (let p = 1; p <= 4 * 3600; p++) {
        const n = state(g).n;
        g = visitAt(g, p);
        if (state(g).n > n) out.push({ at: p, target: state(g).result!.target });
      }
      return out;
    };
    const a = visits(9);
    expect(visits(9)).toEqual(a);
    expect(visits(10)).not.toEqual(a);
    expect(a.length).toBeGreaterThanOrEqual(14);
    for (let i = 1; i < a.length; i++) expect(Math.abs(a[i].at - a[i - 1].at - CRITIC.everySeconds)).toBeLessThanOrEqual(CRITIC.everySeconds * CRITIC.jitter * 2 + 1);
    expect(a.map((v) => v.target)).toEqual(a.map((_, i) => criticTarget(9, i + 1)));
  });

  it('is inactive until Uptown is built, and the first visit is one gap after it is first seen', () => {
    run(() => {
      const g = visitAt(G.newGame(NOW), 5000);
      expect(state(g)).toMatchObject({ nextAt: -1, n: 0 });
      expect(criticView(g).active).toBe(false);
      const t = visitAt({ ...uptown(), playSeconds: 5000 }, 5000);
      expect(state(t).nextAt).toBeGreaterThan(5000 + CRITIC.everySeconds * 0.85);
      expect(state(t).n).toBe(0);
    });
  });

  it('meeting the target pays 3 minutes of citywide income and adds a star to the sign', () => {
    run(() => {
      const g0 = uptown(4, 3, 3); // 5 stars: meets any target
      const g = withState(g0, { seed: seedFor(1, 4), nextAt: 100 });
      const reward = R.minutesToCash(g, 3);
      expect(reward).toBeGreaterThan(0);
      const after = visitAt(g, 100);
      expect(after.cash - g.cash).toBeCloseTo(reward, 6);
      expect(after.totalEarned - g.totalEarned).toBeCloseTo(reward, 6);
      expect(state(after)).toMatchObject({ n: 1, sign: 1, result: { target: 4, stars: 5, hit: true } });
      expect(state(after).result!.cash).toBeCloseTo(reward, 6);
      expect(state(after).nextAt).toBeGreaterThan(100 + CRITIC.everySeconds * 0.85);
      expect(criticView(after)).toMatchObject({ sign: 1, last: { hit: true } });
      // the next target is the next visit's
      expect(criticView(after).target).toBe(criticTarget(state(after).seed, 2));
    });
  });

  it('missing it does nothing: no cash, no star, and the schedule goes on', () => {
    run(() => {
      const g0 = uptown(0, 0, 0); // 1 star
      const g = withState(g0, { seed: seedFor(1, 3), nextAt: 100 });
      const after = visitAt(g, 100);
      expect(after.cash).toBe(g.cash);
      expect(after.totalEarned).toBe(g.totalEarned);
      expect(state(after)).toMatchObject({ n: 1, sign: 0, result: { target: 3, stars: 1, hit: false, cash: 0 } });
      expect(state(after).nextAt).toBeGreaterThan(100);
    });
  });

  it('a rating exactly at the target meets it', () => {
    run(() => {
      const g = withState(uptown(3, 0, 2), { seed: seedFor(1, 3), nextAt: 10 }); // 4 points: 3 stars
      expect(state(visitAt(g, 10)).result).toMatchObject({ target: 3, stars: 3, hit: true });
    });
  });

  it('every fifth visit asks for five stars', () => {
    run(() => {
      const g = withState(uptown(3, 2, 2), { n: 4, nextAt: 10 }); // 4 stars
      expect(criticView(g).target).toBe(5);
      expect(state(visitAt(g, 10)).result).toMatchObject({ target: 5, stars: 4, hit: false });
    });
  });

  it('the UI acknowledges the result', () => {
    run(() => {
      const after = visitAt(withState(uptown(), { nextAt: 10 }), 10);
      expect(state(after).result).not.toBeNull();
      expect(state(ackCritic(after)).result).toBeNull();
      expect(ackCritic(ackCritic(after))).toEqual(ackCritic(after));
    });
  });
});

describe('old saves', () => {
  it('a v5.15 save (no layer state) loads with no Ingredients, a bare sign and a schedule that starts now', () => {
    const saved = JSON.parse(JSON.stringify(patch(G.newGame(NOW), { built: true, managed: true, heads: G.allHeads() })));
    delete saved.x;
    saved.playSeconds = 5000;
    run(() => {
      const g = G.migrate(saved, NOW + 1);
      expect(state(g)).toMatchObject({ n: 0, nextAt: -1, tier: 0, sign: 0, result: null });
      const t = G.playTick(g, 1, NOW + 1);
      expect(state(t).nextAt).toBeGreaterThan(5001 + CRITIC.everySeconds * 0.85);
      expect(starsNow(t)).toBe(1);
    });
  });

  it('keeps a saved track, sign and schedule and drops garbage', () => {
    const saved = { seed: 7, n: 3, nextAt: 2000.5, tier: 2, sign: 1, result: { target: 3, stars: 4, hit: true, cash: 12 } };
    expect(uptownStars.migrate(saved, NOW)).toEqual(saved);
    expect(uptownStars.migrate({ seed: 'x', n: -2, nextAt: NaN, tier: 9, sign: -1, result: { hit: 'yes' } }, NOW)).toMatchObject({ n: 0, nextAt: -1, tier: 3, sign: 0, result: null });
    expect(uptownStars.migrate(undefined, NOW)).toMatchObject({ nextAt: -1, tier: 0, sign: 0, result: null });
  });
});
