// University, the menu and the campus zones (v5.16): the mix's arithmetic, the zones' trips with and without drones, and old saves.
import { MENU, ZONES } from '../../../../content/layers';
import { TUNING, VEHICLES } from '../../../../content/tuning';
import { getFeature, withFeatures } from '../../index';
import * as G from '../../../game';
import { averageDistance, bestMix, demandFactor, menuFactors, menuView, mixOf, setMenu, universityMenu, zoneDeliveryRate, zonesView } from '../university-menu';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const HOOD = MENU.hood;
const DRONE = VEHICLES.findIndex((v) => v.id === 'drone');
const CAR = VEHICLES.findIndex((v) => v.id === 'car');
const VAN = VEHICLES.findIndex((v) => v.id === 'van');
const run = <T>(fn: () => T): T => withFeatures([universityMenu], fn);
const patch = (g: G.GameState, p: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [HOOD]: { ...g.shops[HOOD], ...p } } });
const mix = (g: G.GameState, pepperoni: number, knots: number): G.GameState => {
  const r = setMenu(g, pepperoni, knots);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const fxOf = (g: G.GameState) => G.featureMults(g, HOOD, NOW);
const rateOf = (g: G.GameState) => G.shopRate(g.shops[HOOD], g.vehicle, fxOf(g));
const cashOf = (g: G.GameState) => G.shopEarnings(g, HOOD, NOW);

/** University built; the kitchen far faster than the deliveries (so the fleet is the slow stage), few seats. */
function campus(vehicle = CAR, footprint = 2): G.GameState {
  return run(() => patch({ ...G.newGame(NOW), vehicle }, { built: true, footprint, prep: 200, ovens: 200, counter: 200, tables: 1, drivers: 6 }));
}
/** The same, with the kitchen the slow stage: prep alone is the slowest. */
function kitchenBound(): G.GameState {
  return patch(campus(DRONE, 0), { prep: 6, ovens: 200, counter: 200, tables: 40, drivers: 40 });
}

describe('the menu', () => {
  it('starts all Cheese: nothing changes', () => {
    run(() => {
      const g = campus(DRONE, 0);
      expect(menuView(g)).toMatchObject({ active: true, cheese: 100, pepperoni: 0, knots: 0, valueMult: 1, prepRate: 1, ovenRate: 1 });
      expect(fxOf(g)).toEqual({ value: 1, demand: 1 });
    });
  });

  it('the mix is share-weighted: price, prep time and bake time', () => {
    expect(menuFactors({ pepperoni: 100, knots: 0 })).toEqual({ value: 1.4, prepTime: 1.3, bakeTime: 1 });
    expect(menuFactors({ pepperoni: 0, knots: 100 })).toEqual({ value: 0.6, prepTime: 1, bakeTime: 0.5 });
    const m = menuFactors({ pepperoni: 50, knots: 25 });
    expect(m.value).toBeCloseTo(0.25 * 1 + 0.5 * 1.4 + 0.25 * 0.6, 12);
    expect(m.prepTime).toBeCloseTo(0.25 + 0.5 * 1.3 + 0.25, 12);
    expect(m.bakeTime).toBeCloseTo(0.25 + 0.5 + 0.25 * 0.5, 12);
    expect(menuView(run(() => mix(campus(), 50, 25)))).toMatchObject({ cheese: 25, pepperoni: 50, knots: 25, valueMult: m.value });
  });

  it('the recipes are the card’s: x1.0, x1.4 with +30% prep, x0.6 with half the bake', () => {
    expect(MENU.recipes.map((r) => [r.id, r.price, r.prep, r.bake])).toEqual([['cheese', 1, 1, 1], ['pepperoni', 1.4, 1.3, 1], ['knots', 0.6, 1, 0.5]]);
  });

  it('the mix changes the value per pizza', () => {
    run(() => {
      const g = campus(DRONE, 0);
      const pep = mix(g, 100, 0);
      expect(fxOf(pep).value).toBe(1.4);
      expect(G.valuePerPizza(HOOD, pep.shops[HOOD], pep.vehicle, fxOf(pep)) / G.valuePerPizza(HOOD, g.shops[HOOD], g.vehicle, fxOf(g))).toBeCloseTo(1.4, 12);
      expect(fxOf(mix(g, 0, 100)).value).toBe(0.6);
      expect(G.featureMults(pep, 'downtown', NOW).value).toBe(1);
    });
  });

  it('slower prep slows the shop when prep is the slow stage, and pays for it only where it pays more', () => {
    run(() => {
      const g = kitchenBound();
      const prep = G.prepRate(g.shops[HOOD]);
      expect(prep).toBeLessThan(G.demandRate(g.shops[HOOD], g.vehicle));
      expect(rateOf(g)).toBeCloseTo(prep, 9);
      const pep = mix(g, 100, 0);
      expect(rateOf(pep)).toBeCloseTo(prep / 1.3, 9);
      // x1.4 the price at 1/1.3 the pies: a little more cash, never less
      expect(cashOf(pep) / cashOf(g)).toBeCloseTo(1.4 / 1.3, 9);
      const half = mix(g, 50, 0);
      expect(rateOf(half)).toBeCloseTo(prep / 1.15, 9);
    });
  });

  it('with the kitchen faster than the demand, Pepperoni costs no pies', () => {
    run(() => {
      const g = campus(DRONE, 0);
      expect(rateOf(mix(g, 100, 0))).toBeCloseTo(rateOf(g), 9);
      expect(cashOf(mix(g, 100, 0)) / cashOf(g)).toBeCloseTo(1.4, 9);
    });
  });

  it('setMenu takes whole percents that add to at most 100, and a built shop', () => {
    run(() => {
      const g = campus();
      expect(setMenu(g, 60, 50)).toEqual({ ok: false, reason: 'The mix is over 100%' });
      expect(setMenu(g, -1, 0).ok).toBe(false);
      expect(setMenu(g, NaN, 0).ok).toBe(false);
      expect(mixOf(mix(g, 33.4, 10.6))).toEqual({ pepperoni: 33, knots: 11 });
      expect(setMenu(G.newGame(NOW), 10, 10)).toEqual({ ok: false, reason: 'Build this pizzeria first' });
      expect(universityMenu.shopValueMult!(G.newGame(NOW), HOOD, NOW)).toBe(1);
    });
  });

  it('the best mix is Pepperoni where it pays and never over-spends the prep', () => {
    run(() => {
      expect(bestMix(campus(DRONE, 0), NOW)).toEqual({ pepperoni: 100, knots: 0 });
      expect(bestMix(kitchenBound(), NOW)).toEqual({ pepperoni: 100, knots: 0 });
    });
  });
});

describe('the zones', () => {
  it('Dorms, Library and Stadium at distances 1 / 2 / 3 with shares 50 / 30 / 20', () => {
    expect(ZONES.zones.map((z) => [z.id, z.distance, z.share])).toEqual([['dorms', 1, 50], ['library', 2, 30], ['stadium', 3, 20]]);
  });

  it('the Library opens at footprint 1 and the Stadium at footprint 2', () => {
    run(() => {
      const open = (fp: number) => zonesView(campus(CAR, fp)).zones.filter((z) => z.open).map((z) => z.id);
      expect(open(0)).toEqual(['dorms']);
      expect(open(1)).toEqual(['dorms', 'library']);
      expect(open(2)).toEqual(['dorms', 'library', 'stadium']);
      expect(zonesView(campus(CAR, 1)).zones.map((z) => z.share)).toEqual([63, 38, 0]); // 50/80 and 30/80, rounded
    });
  });

  it('a trip to a zone takes distance x the normal round trip; drones ignore distance', () => {
    run(() => {
      const normal = (v: number) => TUNING.deliveryRoundTrip / VEHICLES[v].speed;
      const car = zonesView(campus(CAR, 2));
      expect(car.zones.map((z) => z.tripSeconds)).toEqual([normal(CAR), 2 * normal(CAR), 3 * normal(CAR)]);
      const bike = zonesView(campus(0, 2));
      expect(bike.zones.map((z) => z.tripSeconds)).toEqual([normal(0), 2 * normal(0), 3 * normal(0)]);
      const drone = zonesView(campus(DRONE, 2));
      expect(drone.drones).toBe(true);
      expect(drone.zones.map((z) => z.tripSeconds)).toEqual([normal(DRONE), normal(DRONE), normal(DRONE)]);
    });
  });

  it('the average distance is the share-weighted one: 1, 1.375, 1.7, and 1 with drones', () => {
    const shop = (fp: number) => ({ footprint: fp });
    expect(averageDistance(shop(0), CAR)).toBe(1);
    expect(averageDistance(shop(1), CAR)).toBeCloseTo(1.375, 12);
    expect(averageDistance(shop(2), CAR)).toBeCloseTo(1.7, 12);
    for (const fp of [0, 1, 2]) expect(averageDistance(shop(fp), DRONE)).toBe(1);
  });

  it('with drones the far zones cost nothing; without them every far zone slows the fleet', () => {
    run(() => {
      const rate = (v: number, fp: number) => rateOf(campus(v, fp));
      // the kitchen is far faster than the fleet, so the fleet sets the rate: fixtures differ only in the footprint
      expect(rate(DRONE, 2) / rate(DRONE, 0)).toBeCloseTo(1, 9);
      expect(rate(CAR, 1) / rate(CAR, 0)).toBeLessThan(1);
      expect(rate(CAR, 2) / rate(CAR, 1)).toBeLessThan(1);
      const g = campus(CAR, 2);
      expect(zoneDeliveryRate(g.shops[HOOD], CAR)).toBeCloseTo(G.deliveryRate(g.shops[HOOD], CAR) / 1.7, 9);
      expect(demandFactor(g.shops[HOOD], CAR, mixOf(g))).toBeLessThan(1);
      expect(demandFactor(campus(DRONE, 2).shops[HOOD], DRONE, mixOf(g))).toBe(1);
    });
  });

  it('without drones the fleet tier matters: a faster vehicle buys back the trip time', () => {
    run(() => {
      const gain = (fp: number) => rateOf(campus(VAN, fp)) / rateOf(campus(CAR, fp));
      // a van is faster than a car everywhere; the far zones do not change that
      expect(gain(2)).toBeGreaterThan(1);
      // the far zones leave a car this far behind its own Dorms-only rate, a van a similar way: only drones are free of it
      const loss = (v: number) => rateOf(campus(v, 2)) / rateOf(campus(v, 0));
      // (a little above 1/1.7: the walk-ins' seats do not travel)
      for (const v of [CAR, VAN]) {
        expect(loss(v)).toBeGreaterThan(1 / 1.7);
        expect(loss(v)).toBeLessThan(0.65);
      }
      expect(loss(DRONE)).toBeCloseTo(1, 9);
      // and so a van is what gets back the time the far zones cost: a van at the Stadium beats a car at the Dorms
      expect(rateOf(campus(VAN, 2))).toBeGreaterThan(rateOf(campus(CAR, 0)));
    });
  });

  it('the far zones are worth serving with drones: they add pies per second only there', () => {
    run(() => {
      const perSecond = (v: number, fp: number) => zonesView(campus(v, fp)).zones.reduce((t, z) => t + z.perSecond, 0);
      expect(perSecond(DRONE, 2)).toBeCloseTo(G.deliveryRate(campus(DRONE, 2).shops[HOOD], DRONE), 9);
      expect(perSecond(CAR, 2)).toBeLessThan(G.deliveryRate(campus(CAR, 2).shops[HOOD], CAR));
      const view = zonesView(campus(DRONE, 2));
      expect(view.zones.map((z) => Math.round((100 * z.perSecond) / view.deliveryRate))).toEqual([50, 30, 20]);
    });
  });

  it('only University feels the menu and the zones', () => {
    run(() => {
      const g = patch(campus(CAR, 2), { prep: 6 });
      expect(G.featureMults(mix(g, 100, 0), 'downtown', NOW)).toEqual({ value: 1, demand: 1 });
    });
  });
});

describe('old saves', () => {
  it('a v5.15 save (no layer state) loads with the plain menu', () => {
    const saved = JSON.parse(JSON.stringify(patch(G.newGame(NOW), { built: true, managed: true, heads: G.allHeads() })));
    delete saved.x;
    run(() => {
      const g = G.migrate(saved, NOW + 1);
      expect(getFeature(g, universityMenu)).toEqual({ pepperoni: 0, knots: 0 });
      expect(fxOf(g)).toEqual({ value: 1, demand: 1 });
    });
  });

  it('keeps a saved mix and drops garbage', () => {
    expect(universityMenu.migrate({ pepperoni: 40, knots: 30 }, NOW)).toEqual({ pepperoni: 40, knots: 30 });
    expect(universityMenu.migrate({ pepperoni: 90, knots: 90 }, NOW)).toEqual({ pepperoni: 90, knots: 10 });
    expect(universityMenu.migrate({ pepperoni: 'x', knots: -5 }, NOW)).toEqual({ pepperoni: 0, knots: 0 });
    expect(universityMenu.migrate(undefined, NOW)).toEqual({ pepperoni: 0, knots: 0 });
  });
});
