/**
 * @jest-environment <rootDir>/src/engine/__tests__/tz-env.js
 */
// Station heads (v5.15): barks (one bubble per shop, 2.5 s, 20 s apart, never in a cut-scene), the copy for every line, rank pins and
// the Head of the Week (seeded by the week number, rolled only when it rises, no income effect).
import { BARKS, CAMEO_NONNA_LINES, HEAD_BARKS, STATION_TASKS, type BarkTrigger } from '../../../content/heads';
import { HEADS, NEIGHBORHOODS } from '../../../content/tuning';
import type { NeighborhoodId } from '../../../content/types';
import * as G from '../../game';
import { FEATURES, getFeature, withFeatures } from '..';
import { weekNumber } from '../counterattack';
import { barkShowing, barkText, headOfWeek, heads, hiredHeads, isStarredTask, newBarkMem, nextBark, pickHead, rankOf, speakerFor, stationLevel, starredKinds, weekStation, type BarkAsk } from '../heads';

const IDS = NEIGHBORHOODS.map((n) => n.id);
const at = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).getTime();
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } } });
const WEEK = 7 * 86_400_000;
const MON = at(2026, 11, 16);

function city(): G.GameState {
  let g = G.newGame(MON);
  for (const id of IDS) g = withShop(g, id, { built: true, managed: true, heads: G.allHeads(), prep: 10, ovens: 10, counter: 10 });
  return g;
}
const tick = (g: G.GameState, now: number) => G.playTick(g, 1, now);

describe('the copy', () => {
  test('every shop, station and trigger has a line, and every line fits the narrowest room', () => {
    const triggers: BarkTrigger[] = ['milestone', 'rush', 'attack', 'week'];
    for (const id of IDS) for (const st of ['prep', 'oven', 'counter'] as const) for (const t of triggers) {
      const text = BARKS[id][st][t];
      expect(text.length).toBeGreaterThan(5);
      expect(barkText(id, st, t)).toBe(text);
      expect(text.length * 5.6 + 16).toBeLessThanOrEqual(240);
    }
  });
  test('the copy names the heads the game has (the first line of each station is theirs)', () => {
    expect(BARKS.downtown.prep.week).toMatch(/Nonna/);
    expect(HEADS.downtown.prep).toBe('Marco');
    expect(CAMEO_NONNA_LINES).toHaveLength(6);
  });
});

describe('barks', () => {
  const ask = (trigger: BarkTrigger, station: 'prep' | 'oven' | 'counter' = 'prep', key?: string): BarkAsk => ({ trigger, station, key });

  test('a bubble speaks the copy line for its shop, station and trigger', () => {
    const r = nextBark(newBarkMem(), 'suburbs', [ask('milestone', 'oven')], 100, false);
    expect(r.bark?.text).toBe(BARKS.suburbs.oven.milestone);
  });
  test('never during a cut-scene', () => {
    const r = nextBark(newBarkMem(), 'suburbs', [ask('rush')], 100, true);
    expect(r.bark).toBeNull();
    expect(r.mem.at).toBe(Number.NEGATIVE_INFINITY);
  });
  test('at least 20 s apart, and only one at a time', () => {
    let mem = newBarkMem();
    const first = nextBark(mem, 'downtown', [ask('rush')], 100, false);
    mem = first.mem;
    expect(first.bark).not.toBeNull();
    expect(barkShowing(mem, 101)).toBe(true);
    expect(barkShowing(mem, 100 + HEAD_BARKS.seconds + 0.01)).toBe(false);
    expect(nextBark(mem, 'downtown', [ask('rush')], 100 + HEAD_BARKS.gap - 0.1, false).bark).toBeNull();
    expect(nextBark(mem, 'downtown', [ask('rush')], 100 + HEAD_BARKS.gap, false).bark).not.toBeNull();
  });
  test('a bubble is shorter than the gap, so two never show together', () => {
    expect(HEAD_BARKS.seconds).toBe(2.5);
    expect(HEAD_BARKS.gap).toBeGreaterThanOrEqual(20);
    expect(HEAD_BARKS.seconds).toBeLessThan(HEAD_BARKS.gap);
  });
  test('an attack outranks a milestone, which outranks the week and a rush', () => {
    const asks = [ask('rush', 'prep'), ask('week', 'oven'), ask('milestone', 'counter'), ask('attack', 'prep')];
    expect(nextBark(newBarkMem(), 'uptown', asks, 50, false).bark?.trigger).toBe('attack');
    expect(nextBark(newBarkMem(), 'uptown', asks.filter((a) => a.trigger !== 'attack'), 50, false).bark?.trigger).toBe('milestone');
    expect(nextBark(newBarkMem(), 'uptown', [ask('rush'), ask('week')], 50, false).bark?.trigger).toBe('week');
  });
  test('a keyed ask is spoken once; one that waited its turn still speaks', () => {
    let mem = newBarkMem();
    const w = ask('week', 'prep', 'week-3');
    const blocked = nextBark(mem, 'uptown', [w], 10, true);
    expect(blocked.mem).toBe(mem);
    const spoken = nextBark(mem, 'uptown', [w], 11, false);
    expect(spoken.bark).not.toBeNull();
    mem = spoken.mem;
    expect(nextBark(mem, 'uptown', [w], 500, false).bark).toBeNull();
    expect(nextBark(mem, 'uptown', [ask('week', 'prep', 'week-4')], 500, false).bark).not.toBeNull();
  });
  test('rush and attack speak with a hired head, rotated', () => {
    const shop = G.newShop(true);
    expect(speakerFor(shop, 3)).toBeNull();
    expect(speakerFor({ heads: { prep: false, oven: true, counter: false } }, 7)).toBe('oven');
    expect(new Set([0, 1, 2].map((n) => speakerFor({ heads: G.allHeads() }, n))).size).toBe(3);
  });
});

describe('rank pins', () => {
  test('25, 50 and 100 earn a pin', () => {
    expect([1, 24, 25, 49, 50, 99, 100, 5000].map(rankOf)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(stationLevel({ prep: 3, ovens: 30, counter: 60 }, 'oven')).toBe(30);
  });
});

describe('Head of the Week', () => {
  const run = <T>(fn: () => T) => withFeatures([heads], fn);

  test('is rolled on a new week from the hired heads, and keeps its pick all week', () => {
    run(() => {
      let g = tick(city(), MON);
      const p = headOfWeek(g)!;
      expect(p).not.toBeNull();
      expect(g.shops[p.shopId].heads[p.station]).toBe(true);
      expect(headOfWeek(tick(g, MON + 3 * 86_400_000))).toEqual(p);
      g = tick(g, MON + 6.9 * 86_400_000);
      expect(headOfWeek(g)).toEqual(p);
    });
  });
  test('is seeded by the week number: the same week gives the same head, and weeks differ', () => {
    run(() => {
      const g = city();
      const w = weekNumber(MON);
      expect(pickHead(g, w)).toEqual(pickHead(g, w));
      const seen = new Set(Array.from({ length: 30 }, (_, i) => JSON.stringify(pickHead(g, w + i))));
      expect(seen.size).toBeGreaterThan(5);
    });
  });
  test('rolls only when the week number rises, never because the clock moved back', () => {
    run(() => {
      let g = tick(city(), MON + WEEK);
      const p = headOfWeek(g)!;
      // a hire that would change the pool does not re-roll this week
      g = withShop(g, 'downtown', { heads: { prep: false, oven: false, counter: false } });
      expect(headOfWeek(tick(g, MON + WEEK + 1000))).toEqual(p);
      // the clock goes back a week: the pick stays
      expect(headOfWeek(tick(g, MON))).toEqual(p);
      // and rises a week: a new roll
      expect(getFeature(tick(g, MON + 2 * WEEK), heads).week).toBe(weekNumber(MON + 2 * WEEK));
    });
  });
  test('nobody hired: no pick, and the first hire that week becomes it', () => {
    run(() => {
      let g = tick(G.newGame(MON), MON);
      expect(headOfWeek(g)).toBeNull();
      g = withShop(g, 'downtown', { built: true, heads: { prep: true, oven: false, counter: false } });
      g = tick(g, MON + 1000);
      expect(headOfWeek(g)).toEqual({ shopId: 'downtown', station: 'prep' });
      expect(weekStation(g, 'downtown')).toBe('prep');
      expect(weekStation(g, 'suburbs')).toBeNull();
    });
  });
  test('stars the daily tasks of its station', () => {
    run(() => {
      const g = tick(withShop(G.newGame(MON), 'downtown', { built: true, heads: { prep: false, oven: true, counter: false } }), MON);
      expect(starredKinds(g)).toEqual(STATION_TASKS.oven);
      expect(isStarredTask(g, 'baked')).toBe(true);
      expect(isStarredTask(g, 'walkins')).toBe(false);
      expect(starredKinds(G.newGame(MON))).toEqual([]);
    });
  });
  test('migrate accepts nothing, junk and a good save', () => {
    expect(heads.migrate(undefined, 0)).toEqual({ week: 0, pick: null });
    expect(heads.migrate({ week: 'x', pick: { shopId: 'mars', station: 'prep' } }, 0)).toEqual({ week: 0, pick: null });
    expect(heads.migrate({ week: 4.7, pick: { shopId: 'uptown', station: 'oven' } }, 0)).toEqual({ week: 4, pick: { shopId: 'uptown', station: 'oven' } });
  });
  test('has no effect on income: it registers no value or demand hook', () => {
    expect(heads.shopValueMult).toBeUndefined();
    expect(heads.shopDemandMult).toBeUndefined();
    const g = city();
    const without = withFeatures([], () => G.shopEarnings(g, 'downtown', MON));
    const picked = withFeatures([heads], () => G.shopEarnings(tick(g, MON), 'downtown', MON));
    const plain = withFeatures([], () => G.shopEarnings(G.playTick(g, 1, MON), 'downtown', MON));
    expect(picked).toBe(plain);
    expect(without).toBeGreaterThan(0);
  });
  test('is registered with the game', () => {
    expect(FEATURES).toContain(heads);
    expect(hiredHeads(city())).toHaveLength(18);
  });
});
