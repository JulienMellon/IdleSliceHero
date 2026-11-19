// Industrial, shifts and breakdowns (v5.16): the shift cycle, the night rate for time away, the jam, the wrench and the Head Baker.
import { JAMS, SHIFTS } from '../../../../content/layers';
import { HOME_CITY } from '../../../../content/cities/home';
import { layerHood } from '../../../../content/cities';
import { getFeature, withFeatures } from '../../index';
import * as G from '../../../game';
import { autoFixIn, awayNow, fixJam, shiftsLayer, jamShare, jamView, shiftAt, shiftView, type ShiftsState } from '../shifts';
import { freshTimed, gapOf } from '../game-day';

import { HOME_FIT } from '../../../../content/cities/home/fit';
import { FOOTPRINTS } from '../../../../content/cities/home/fit';
import { PERKS } from '../../../../content/cities/home/data';
const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const HOOD = layerHood(HOME_CITY, 'shifts')!;
const SHIFT = SHIFTS.cycleSeconds / 3;
const run = <T>(fn: () => T): T => withFeatures([shiftsLayer], fn);
const state = (g: G.GameState) => getFeature(g, shiftsLayer);
const withState = (g: G.GameState, p: Partial<ShiftsState>): G.GameState => ({ ...g, x: { ...g.x, [shiftsLayer.key]: { ...state(g), ...p } } });
const patch = (g: G.GameState, p: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [HOOD]: { ...g.shops[HOOD], ...p } } });
function play(g: G.GameState, seconds: number, now = NOW): G.GameState {
  for (let i = 0; i < seconds; i++) g = G.playTick(g, 1, now);
  return g;
}
const fx = (g: G.GameState, now = NOW) => G.featureMults(g, HOOD, now);

/** Industrial built and running, demand the slow stage (so a shift's demand moves the sales) and a Double storefront (4 oven slots). */
function plant(): G.GameState {
  return run(() =>
    patch(G.newGame(NOW), { built: true, managed: true, heads: G.allHeads(), footprint: 2, prep: 200, ovens: 200, counter: 200, tables: 4, drivers: 4 }),
  );
}
/** The oven the slow stage, the rest far faster than the demand: a jam shows in the sales. */
function ovenBound(g = plant()): G.GameState {
  return patch(g, { prep: 200, ovens: 10, counter: 200, tables: 60, drivers: 60 });
}
/** The shift on the clock, set by moving the cycle's start. */
const onShift = (g: G.GameState, index: number, startedAt = 0): G.GameState =>
  withState({ ...g, playSeconds: startedAt + index * SHIFT + 5 }, { startAt: startedAt, at: NOW });

describe('the shifts', () => {
  it('a 20-minute cycle of day, swing and night, each a third of it', () => {
    expect(SHIFTS.cycleSeconds).toBe(1200);
    expect(SHIFTS.shifts.map((s) => [s.id, s.demand, s.value])).toEqual([
      ['day', 1, 1],
      ['swing', 0.8, 1],
      ['night', 1.2, 2],
    ]);
    const at = (play: number) => SHIFTS.shifts[shiftAt({ startAt: 0 }, play).index].id;
    expect([0, 399, 400, 799, 800, 1199, 1200, 1599, 1600, 2399, 2400].map(at)).toEqual([
      'day',
      'day',
      'swing',
      'swing',
      'night',
      'night',
      'day',
      'day',
      'swing',
      'night',
      'day',
    ]);
    expect(shiftAt({ startAt: 0 }, 100).left).toBe(300);
    expect(shiftAt({ startAt: 50 }, 50).index).toBe(0);
    expect(shiftAt({ startAt: -1 }, 99999).index).toBe(0);
  });

  it('starts the cycle at the first tick that sees the shop built, with the day shift', () => {
    run(() => {
      const g = patch(G.newGame(NOW), { built: true });
      expect(state(g).startAt).toBe(-1);
      const t = play({ ...g, playSeconds: 700 }, 1);
      expect(state(t).startAt).toBe(701);
      expect(shiftView(t)).toMatchObject({ active: true, shift: 'day', demandMult: 1, valueMult: 1, next: 'swing', awayMult: 2.4 });
    });
  });

  it('is inactive until the Industrial shop is built', () => {
    run(() => {
      const g = play(G.newGame(NOW), 400);
      expect(state(g)).toMatchObject({ startAt: -1, nextAt: -1 });
      expect(shiftView(g).active).toBe(false);
      expect(jamView(g).active).toBe(false);
      expect(fx(g)).toEqual({ value: 1, demand: 1 });
      expect(fixJam(g)).toEqual({ ok: false, reason: 'Build this pizzeria first' });
    });
  });

  it('demand x1.0 / x0.8 / x1.2 and value x1 / x1 / x2 by shift, in play', () => {
    run(() => {
      const g = plant();
      const mults = [0, 1, 2].map((i) => fx(onShift(g, i)));
      expect(mults).toEqual([
        { value: 1, demand: 1 },
        { value: 1, demand: 0.8 },
        { value: 2, demand: 1.2 },
      ]);
      const sales = [0, 1, 2].map((i) => G.shopRate(g.shops[HOOD], g.vehicle, HOME_FIT, fx(onShift(g, i))));
      expect(sales[1] / sales[0]).toBeCloseTo(0.8, 12);
      expect(sales[2] / sales[0]).toBeCloseTo(1.2, 12);
      const cash = [0, 1, 2].map((i) => G.shopEarnings(onShift(g, i), HOOD, NOW));
      expect(cash[2] / cash[0]).toBeCloseTo(2.4, 12);
      expect(shiftView(onShift(g, 1)).shift).toBe('swing');
      expect(shiftView(onShift(g, 2)).left).toBe(SHIFT - 5);
    });
  });

  it('moves with play seconds: the shift changes as the clock runs', () => {
    run(() => {
      let g = play(plant(), 1);
      const start = state(g).startAt;
      g = play({ ...g, playSeconds: start + SHIFT - 2 }, 3);
      expect(shiftView(g).shift).toBe('swing');
      expect(G.featureMults(g, 'downtown', NOW)).toEqual({ value: 1, demand: 1 });
    });
  });
});

describe('time away is paid at the night rate', () => {
  it('a stale stamp means the app was closed: the hooks give the night, a fresh one gives the shift', () => {
    run(() => {
      const g = onShift(plant(), 0);
      expect(awayNow(state(g), NOW)).toBe(false);
      expect(fx(g, NOW)).toEqual({ value: 1, demand: 1 });
      expect(fx(g, NOW + 3600_000)).toEqual({ value: 2, demand: 1.2 });
      // a readout that has no clock of its own (the save time is behind the stamp) is a readout of play
      expect(fx(g, NOW - 1000)).toEqual({ value: 1, demand: 1 });
      // a shop that never ticked has no stamp: a what-if of it is play too
      expect(fx(withState(plant(), { startAt: -1, at: 0 }), NOW + 9e9)).toEqual({ value: 1, demand: 1 });
    });
  });

  it('the offline catch-up pays the night rate whatever shift the app closed in, and Big Sal’s 25% on top', () => {
    run(() => {
      const away = 3600;
      const earned = (g: G.GameState) => {
        const r = G.applyOffline({ ...g, lastSavedAt: NOW }, NOW + away * 1000);
        return r.byShop.find((b) => b.id === HOOD)!.earned;
      };
      for (const i of [0, 1, 2]) {
        const g = onShift(plant(), i);
        const nightPerSecond = G.shopRevenue(HOOD, g.shops[HOOD], g.vehicle, { value: 2, demand: 1.2 });
        expect(earned(g) / (nightPerSecond * away)).toBeCloseTo(1, 3);
      }
      const base = onShift(plant(), 0);
      const withPerk = patch(base, { perk: true });
      expect(PERKS.industrial?.offlineMult).toBe(1.25);
      expect(earned(withPerk) / earned(base)).toBeCloseTo(1.25 * (PERKS.industrial?.priceMult ?? 1), 2);
      // played in the foreground the same shop earns the shift's rate, well under the night's
      expect(G.shopEarnings(base, HOOD, NOW) * 2.4).toBeCloseTo(G.shopRevenue(HOOD, base.shops[HOOD], base.vehicle, { value: 2, demand: 1.2 }), 6);
    });
  });

  it('never starts a jam while the app is closed (play seconds only)', () => {
    run(() => {
      const g = play(plant(), 5);
      const after = G.applyOffline({ ...g, lastSavedAt: NOW }, NOW + 4 * 3600_000).state;
      expect(state(after)).toEqual(state(g));
    });
  });
});

describe('breakdowns', () => {
  const starts = (seed: number, seconds = 3600) => {
    let g = withState(plant(), { seed });
    const out: number[] = [];
    run(() => {
      for (let i = 0; i < seconds; i++) {
        const n = state(g).n;
        const fixed = fixJam(g); // a player who taps the wrench at once
        g = G.playTick(fixed.ok ? fixed.state : g, 1, NOW);
        if (state(g).n > n) out.push(g.playSeconds);
      }
    });
    return out;
  };

  it('one oven jams every 5 minutes of play, on a seeded schedule that replays', () => {
    const a = starts(9);
    expect(starts(9)).toEqual(a);
    expect(starts(10)).not.toEqual(a);
    expect(a.length).toBeGreaterThanOrEqual(10);
    for (let i = 1; i < a.length; i++) expect(Math.abs(a[i] - a[i - 1] - JAMS.everySeconds)).toBeLessThanOrEqual(JAMS.everySeconds * JAMS.jitter * 2 + 1);
    // gapOf is the schedule
    expect(Math.abs(gapOf(freshTimed(9), 3, { ...JAMS, rushSeconds: 0 }) - JAMS.everySeconds)).toBeLessThanOrEqual(JAMS.everySeconds * JAMS.jitter);
  });

  it('a jam takes one oven’s share of the oven rate', () => {
    run(() => {
      const g = ovenBound();
      expect(jamShare(g.shops[HOOD], HOME_CITY)).toBe(1 / FOOTPRINTS[2].ovenSlots);
      const sound = G.shopRate(g.shops[HOOD], g.vehicle, HOME_FIT, fx(g));
      expect(sound).toBeCloseTo(G.ovenRate(g.shops[HOOD], HOME_FIT), 9);
      const jammed = withState(g, { jam: 0 });
      expect(G.shopRate(g.shops[HOOD], g.vehicle, HOME_FIT, fx(jammed))).toBeCloseTo(sound * 0.75, 9);
      expect(jamView(jammed)).toMatchObject({ jammed: true, lost: 0.25, ovenMult: 0.75 });
      expect(jamView(g)).toMatchObject({ jammed: false, lost: 0, ovenMult: 1 });
    });
  });

  it('shows in play: the first jam lands one gap after the shop is seen, and the sales drop', () => {
    run(() => {
      let g = play(ovenBound(), 1);
      const due = state(g).nextAt;
      expect(jamView(g).nextIn).toBeGreaterThan(JAMS.everySeconds * 0.85);
      g = play({ ...g, playSeconds: due - 1 }, 3);
      expect(jamView(g).jammed).toBe(true);
      expect(G.shopRate(g.shops[HOOD], g.vehicle, HOME_FIT, fx(g))).toBeLessThan(G.ovenRate(g.shops[HOOD], HOME_FIT));
    });
  });

  it('the wrench fixes it at once; there is nothing to fix without a jam', () => {
    run(() => {
      const jammed = withState(ovenBound(), { jam: 0, at: NOW });
      const r = fixJam(jammed);
      expect(r.ok).toBe(true);
      const fixed = (r as { state: G.GameState }).state;
      expect(jamView(fixed).jammed).toBe(false);
      expect(G.shopRate(fixed.shops[HOOD], fixed.vehicle, HOME_FIT, fx(fixed))).toBeCloseTo(G.ovenRate(fixed.shops[HOOD], HOME_FIT), 9);
      expect(fixJam(fixed)).toEqual({ ok: false, reason: 'No oven is jammed' });
    });
  });

  it('without the Head Baker a jam stays until the wrench; with him it fixes itself after 30 seconds', () => {
    run(() => {
      const bare = patch(ovenBound(), { managed: false, heads: G.noHeads() });
      let g = withState({ ...bare, playSeconds: 100 }, { jam: 100, nextAt: 1e9, startAt: 0, at: NOW });
      expect(autoFixIn(g)).toBeNull();
      g = play(g, 120);
      expect(jamView(g).jammed).toBe(true);

      const baker = patch(ovenBound(), { managed: false, heads: { ...G.noHeads(), oven: true } });
      let h = withState({ ...baker, playSeconds: 100 }, { jam: 100, nextAt: 1e9, startAt: 0, at: NOW });
      expect(autoFixIn(h)).toBe(JAMS.autoFixSeconds);
      h = play(h, JAMS.autoFixSeconds - 2);
      expect(jamView(h)).toMatchObject({ jammed: true, autoFixIn: 2 });
      h = play(h, 2);
      expect(jamView(h).jammed).toBe(false);

      // the General Manager has every head
      const gm = withState({ ...ovenBound(), playSeconds: 100 }, { jam: 100, nextAt: 1e9, startAt: 0, at: NOW });
      expect(autoFixIn(gm)).toBe(JAMS.autoFixSeconds);
    });
  });

  it('a jam that is still up when the next is due does not stack', () => {
    run(() => {
      const bare = patch(ovenBound(), { managed: false, heads: G.noHeads() });
      let g = withState({ ...bare, playSeconds: 100 }, { jam: 100, nextAt: 130, n: 4, startAt: 0, at: NOW });
      g = play(g, 40);
      expect(state(g).n).toBe(5);
      expect(state(g).jam).toBe(100);
      expect(G.shopRate(g.shops[HOOD], g.vehicle, HOME_FIT, fx(g))).toBeCloseTo(G.ovenRate(g.shops[HOOD], HOME_FIT) * 0.75, 9);
    });
  });
});

describe('old saves', () => {
  it('a v5.15 save (no layer state) loads inactive, the first jam one gap after it is seen, the night rate not yet on', () => {
    const saved = JSON.parse(JSON.stringify(patch(G.newGame(NOW), { built: true, managed: true, heads: G.allHeads() })));
    delete saved.x;
    saved.playSeconds = 5000;
    run(() => {
      const g = G.migrate(saved, NOW + 1);
      expect(state(g)).toMatchObject({ n: 0, nextAt: -1, jam: -1, startAt: -1, at: 0 });
      // no stamp yet: the catch-up that loads it is not mistaken for time away it never ran
      expect(fx(g, NOW + 86_400_000)).toEqual({ value: 1, demand: 1 });
      const t = G.playTick(g, 1, NOW + 1);
      expect(state(t).startAt).toBe(5001);
      expect(state(t).nextAt).toBeGreaterThan(5001 + JAMS.everySeconds * 0.85);
      expect(jamView(t).jammed).toBe(false);
    });
  });

  it('keeps a saved schedule, jam and stamp and drops garbage', () => {
    const saved = { seed: 7, n: 3, nextAt: 2000.5, jam: 1990, startAt: 12, at: 99 };
    expect(shiftsLayer.migrate(saved, NOW)).toEqual(saved);
    expect(shiftsLayer.migrate({ seed: 'x', n: -2, nextAt: NaN, jam: -4, startAt: 'a', at: Infinity }, NOW)).toMatchObject({
      n: 0,
      nextAt: -1,
      jam: -1,
      startAt: -1,
      at: 0,
    });
    expect(shiftsLayer.migrate(undefined, NOW)).toMatchObject({ nextAt: -1, jam: -1, startAt: -1 });
  });
});
