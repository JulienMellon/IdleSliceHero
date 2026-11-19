// Suburbs, Game Day (v5.16): the schedule (seeded, play time, inactive until built), the rush (free seats only), and old saves.
import { GAME_DAY } from '../../../../content/layers';
import { HOME_CITY } from '../../../../content/cities/home';
import { layerHood } from '../../../../content/cities';
import { getFeature, withFeatures } from '../../index';
import * as G from '../../../game';
import { freshTimed, gameDayView, gapOf, rushDemandMult, seatsFree, seatsOf, stepTimed, gameDayLayer, walkInFactor, type Timed } from '../game-day';

import { HOME_FIT } from '../../../../content/cities/home/fit';
const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const HOOD = layerHood(HOME_CITY, 'gameDay')!;
const patch = (g: G.GameState, p: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [HOOD]: { ...g.shops[HOOD], ...p } } });
const run = <T>(fn: () => T): T => withFeatures([gameDayLayer], fn);
const state = (g: G.GameState) => getFeature(g, gameDayLayer);
/** A game with Suburbs built and running itself, the clock at play second `play`. */
const game = (play = 0, p: Partial<G.Shop> = {}): G.GameState => ({
  ...patch(G.newGame(NOW), { built: true, managed: true, heads: G.allHeads(), prep: 30, ovens: 30, counter: 30, tables: 6, drivers: 3, footprint: 2, ...p }),
  playSeconds: play,
});
/** Play `seconds` one second at a time from `g`. */
function play(g: G.GameState, seconds: number, now = NOW): G.GameState {
  for (let i = 0; i < seconds; i++) g = G.playTick(g, 1, now);
  return g;
}

describe('the schedule', () => {
  it('replays from the same seed and differs with another', () => {
    const starts = (seed: number) => {
      let t: Timed = { ...freshTimed(0), seed };
      const out: number[] = [];
      for (let p = 0; p < 3600; p++) {
        const n = t.n;
        t = stepTimed(t, p, NOW, GAME_DAY);
        if (t.n > n) out.push(p);
      }
      return out;
    };
    expect(starts(123)).toEqual(starts(123));
    expect(starts(123)).not.toEqual(starts(456));
    // 8 minutes apart, within the jitter, and a first game one gap after the start
    const a = starts(123);
    expect(a.length).toBeGreaterThanOrEqual(6);
    for (let i = 1; i < a.length; i++)
      expect(Math.abs(a[i] - a[i - 1] - GAME_DAY.everySeconds)).toBeLessThanOrEqual(GAME_DAY.everySeconds * GAME_DAY.jitter * 2 + 1);
    expect(a[0]).toBeGreaterThanOrEqual(GAME_DAY.everySeconds * (1 - GAME_DAY.jitter) - 1);
  });

  it('is the same however big the ticks are', () => {
    run(() => {
      const fine = play(game(), 1501);
      let coarse = play(game(), 1);
      for (let i = 0; i < 300; i++) coarse = G.playTick(coarse, 5, NOW);
      expect({ n: state(coarse).n, nextAt: state(coarse).nextAt }).toEqual({ n: state(fine).n, nextAt: state(fine).nextAt });
    });
  });

  it('is inactive until the Suburbs shop is built', () => {
    run(() => {
      const g = patch(G.newGame(NOW), { built: false });
      const after = play(g, 600);
      expect(state(after).nextAt).toBe(-1);
      expect(gameDayView(after, NOW).active).toBe(false);
      expect(gameDayLayer.shopDemandMult!(after, HOOD, NOW)).toBe(1);
      // built: it starts scheduling, one gap from then
      const built = play(patch(after, { built: true }), 1);
      expect(state(built).nextAt).toBeCloseTo(built.playSeconds + gapOf(state(built), 0, GAME_DAY), 5);
      expect(gameDayView(built, NOW).nextIn).toBeGreaterThan(GAME_DAY.everySeconds * 0.8);
    });
  });

  it('does not re-roll when the clock or the time zone changes (it runs on play seconds)', () => {
    run(() => {
      const steady = play(game(), 700, NOW);
      let jumpy = game();
      const DAY = 86_400_000;
      const clocks = [NOW, NOW - 5 * DAY, NOW + 90 * DAY, NOW - 3600_000, NOW + 7 * DAY];
      for (let i = 0; i < 700; i++) jumpy = G.playTick(jumpy, 1, clocks[i % clocks.length]);
      expect({ n: state(jumpy).n, nextAt: state(jumpy).nextAt, seed: state(jumpy).seed }).toEqual({
        n: state(steady).n,
        nextAt: state(steady).nextAt,
        seed: state(steady).seed,
      });
    });
  });
});

describe('the rush', () => {
  /** A game one second before the first game, and then a second into it. */
  const onRush = () => {
    let g = play(game(), 1);
    g = { ...g, playSeconds: state(g).nextAt - 1 };
    return play(g, 2);
  };

  it('runs 45 seconds, then ends', () => {
    run(() => {
      const g = onRush();
      expect(gameDayView(g, NOW)).toMatchObject({ active: true, rush: true });
      expect(gameDayView(g, NOW).left).toBeLessThanOrEqual(GAME_DAY.rushSeconds);
      expect(gameDayView(g, NOW).left).toBeGreaterThan(GAME_DAY.rushSeconds - 3);
      expect(gameDayView(g, NOW).nextIn).toBeGreaterThan(GAME_DAY.everySeconds * 0.8);
      const over = play(g, GAME_DAY.rushSeconds + 1);
      expect(gameDayView(over, NOW).rush).toBe(false);
    });
  });

  it('multiplies only the walk-ins, and only into the free seats', () => {
    run(() => {
      const g = onRush();
      const shop = g.shops[HOOD];
      const w = G.walkInRate(shop);
      const d = G.deliveryRate(shop, g.vehicle, HOME_FIT);
      const m = gameDayLayer.shopDemandMult!(g, HOOD, NOW);
      const demand = G.demandRate(shop, g.vehicle, HOME_FIT, { value: 1, demand: m });
      // demand = drivers + walk-ins x the factor: the drivers are not multiplied
      expect(demand).toBeCloseTo(d + w * walkInFactor(shop, g.vehicle, HOME_FIT), 6);
      expect(walkInFactor(shop, g.vehicle, HOME_FIT)).toBeLessThanOrEqual(GAME_DAY.walkInMult);
      expect(walkInFactor(shop, g.vehicle, HOME_FIT)).toBeGreaterThan(1);
      // the extra walk-ins never exceed 6x, and a rush fills at most the share of seats that are free
      const extra = w * (walkInFactor(shop, g.vehicle, HOME_FIT) - 1);
      expect(extra).toBeLessThanOrEqual(w * (GAME_DAY.walkInMult - 1) * (seatsFree(shop, g.vehicle, HOME_FIT) / seatsOf(shop, HOME_FIT)) + 1e-9);
      // the other shops are untouched
      expect(gameDayLayer.shopDemandMult!(g, 'downtown', NOW)).toBe(1);
    });
  });

  it('gives more with more free seats: a shop that is all seating has no room for the rush', () => {
    const roomy = game(0, { drivers: 60, tables: 2 });
    const packed = game(0, { drivers: 1, tables: 60 });
    expect(seatsFree(roomy.shops[HOOD], 0, HOME_FIT) / seatsOf(roomy.shops[HOOD], HOME_FIT)).toBeGreaterThan(
      seatsFree(packed.shops[HOOD], 0, HOME_FIT) / seatsOf(packed.shops[HOOD], HOME_FIT),
    );
    expect(walkInFactor(roomy.shops[HOOD], 0, HOME_FIT)).toBeGreaterThan(walkInFactor(packed.shops[HOOD], 0, HOME_FIT));
    // more tables and the patio mean more seats
    expect(seatsOf(game(0, { footprint: 4, tables: 40 }).shops[HOOD], HOME_FIT)).toBeGreaterThan(
      seatsOf(game(0, { footprint: 0, tables: 1 }).shops[HOOD], HOME_FIT),
    );
  });

  it('raises what a demand-limited shop sells, and Dale’s perk pays more for the walk-ins in it', () => {
    run(() => {
      const g = onRush();
      const fx = G.featureMults(g, HOOD, NOW);
      expect(fx.demand).toBeGreaterThan(1);
      const calm = G.shopRevenue(HOOD, g.shops[HOOD], g.vehicle);
      const rush = G.shopRevenue(HOOD, g.shops[HOOD], g.vehicle, fx);
      expect(rush).toBeGreaterThan(calm);
      const dale = { ...g.shops[HOOD], perk: true };
      expect(G.shopRevenue(HOOD, dale, g.vehicle, fx) / G.shopRevenue(HOOD, dale, g.vehicle)).toBeGreaterThan(1);
      expect(G.shopRevenue(HOOD, dale, g.vehicle, fx)).toBeGreaterThan(rush);
    });
  });

  it('is never earned by an offline catch-up (the stamp is stale)', () => {
    run(() => {
      const g = onRush();
      expect(G.featureMults(g, HOOD, NOW).demand).toBeGreaterThan(1);
      expect(G.featureMults(g, HOOD, NOW + 3600_000).demand).toBe(1);
      expect(G.featureMults(g, HOOD, NOW - 1000).demand).toBe(1);
    });
  });
});

describe('old saves', () => {
  it('a v5.15 save (no layer state) loads inactive and its schedule starts now', () => {
    const saved = JSON.parse(JSON.stringify(patch(G.newGame(NOW), { built: true, managed: true, heads: G.allHeads() })));
    delete saved.x;
    saved.playSeconds = 5000;
    run(() => {
      const g = G.migrate(saved, NOW + 1);
      expect(state(g)).toMatchObject({ n: 0, nextAt: -1, until: 0 });
      const t = G.playTick(g, 1, NOW + 1);
      // one gap after the save's own play clock, not an overdue game
      expect(state(t).nextAt).toBeGreaterThan(5001 + GAME_DAY.everySeconds * 0.85);
      expect(gameDayView(t, NOW + 1).rush).toBe(false);
    });
  });

  it('keeps a saved schedule and drops garbage', () => {
    expect(gameDayLayer.migrate({ seed: 7, n: 3, nextAt: 2000.5, until: 0, at: 99 }, NOW)).toEqual({ seed: 7, n: 3, nextAt: 2000.5, until: 0, at: 0 });
    expect(gameDayLayer.migrate({ seed: 'x', n: -2, nextAt: NaN }, NOW)).toMatchObject({ n: 0, nextAt: -1 });
    expect(gameDayLayer.migrate(undefined, NOW).nextAt).toBe(-1);
  });
});

it('a rush never lowers demand', () => {
  expect(rushDemandMult(G.newShop(true), 0, HOME_FIT)).toBeGreaterThanOrEqual(1);
});
