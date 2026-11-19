/**
 * @jest-environment <rootDir>/src/engine/__tests__/tz-env.js
 */
/* eslint-disable @typescript-eslint/no-require-imports, expo/no-dynamic-env-var */
/// <reference types="jest" />
// Card X2 (v5.19-test), time: the clock offset, Away for, Next day / Monday (the store's real return path), Play forward and the speed.
// Every scenario loads its own copy of the modules (jest.isolateModules), because the offset only moves forward.
const mem: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (k: string) => mem[k] ?? null,
    setItem: async (k: string, v: string) => void (mem[k] = v),
    removeItem: async (k: string) => void delete mem[k],
  },
}));
jest.mock('../../services', () => ({
  analytics: { track: () => {} },
  EVENTS: {},
  onGrant: () => () => {},
  purchases: { owned: () => [] },
  startServices: async () => {},
}));

import type * as GameModule from '../../engine/game';
import type * as ClockModule from '../../engine/clock';
import type * as RewardsModule from '../../engine/rewards';
import type * as TimeModule from '../time';

type Modules = {
  G: typeof GameModule;
  clock: typeof ClockModule;
  R: typeof RewardsModule;
  time: typeof TimeModule;
  store: typeof import('../../store/game-store');
};

const SWITCH = 'EXPO_PUBLIC_TEST_MODE';
const SAVE = 'slice-empire/save/test-v1';
const before = process.env[SWITCH];
const HOUR = 3_600_000;
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const T = at(2026, 11, 11); // a Wednesday noon
let nowMs = T;

beforeEach(() => {
  process.env[SWITCH] = '1';
  for (const k of Object.keys(mem)) delete mem[k];
  nowMs = T;
  jest.spyOn(Date, 'now').mockImplementation(() => nowMs);
});
afterEach(() => {
  jest.restoreAllMocks();
  if (before === undefined) delete process.env[SWITCH];
  else process.env[SWITCH] = before;
});

/** A fresh registry: the game, the clock, the rewards, time.ts and the store, all of one copy. */
function modules(): Modules {
  const m: Partial<Modules> = {};
  jest.isolateModules(() => {
    m.G = require('../../engine/game');
    m.clock = require('../../engine/clock');
    m.R = require('../../engine/rewards');
    m.store = require('../../store/game-store');
    m.time = require('../time');
  });
  return m as Modules;
}

/** Downtown running itself, rewards open, a few things built: a save that earns while away. */
function baseGame(m: Modules, stamp: number) {
  const { G } = m;
  const g = G.newGame(stamp);
  const downtown = { ...g.shops.downtown, built: true, managed: true, heads: G.allHeads(), prep: 8, ovens: 8, counter: 8, drivers: 4, tables: 5, sold: 50 };
  return { ...g, cash: 1000, totalEarned: 1000, tutorial: G.TUTORIAL_DONE, seenScenes: ['downtown-1', 'downtown-4'], shops: { ...g.shops, downtown }, lastSavedAt: stamp };
}
const claimedToday = (m: Modules, stamp: number) => {
  const g = m.R.refreshRewards(baseGame(m, stamp), stamp);
  const r = m.R.claimGift(g, stamp);
  if (!r.ok) throw new Error(r.reason);
  return { ...r.state, rewards: { ...r.state.rewards, weeklyChest: true }, lastSavedAt: stamp };
};

describe('the pure helpers', () => {
  const { nextDayAt, nextMondayAt, clockReadout } = modules().time;
  it('Next day is 00:01 local tomorrow', () => {
    for (const h of [0, 0.5, 12, 23.9]) {
      const now = at(2026, 11, 11, 0) + h * HOUR;
      expect(nextDayAt(now)).toBe(at(2026, 11, 12, 0, 1));
    }
    expect(nextDayAt(at(2026, 12, 31, 23, 59))).toBe(at(2027, 1, 1, 0, 1));
  });
  it('Next Monday is 00:01 local on a Monday, 1 to 7 days on', () => {
    for (let d = 9; d <= 15; d++) {
      const now = at(2026, 11, d, 15);
      const t = new Date(nextMondayAt(now));
      expect(t.getDay()).toBe(1);
      expect([t.getHours(), t.getMinutes()]).toEqual([0, 1]);
      const days = Math.round((nextMondayAt(now) - now) / (24 * HOUR));
      expect(days).toBeGreaterThanOrEqual(0);
      expect(nextMondayAt(now)).toBeGreaterThan(now);
      expect(nextMondayAt(now) - now).toBeLessThanOrEqual(7 * 24 * HOUR);
    }
    expect(nextMondayAt(at(2026, 11, 11))).toBe(at(2026, 11, 16, 0, 1)); // Wednesday
    expect(nextMondayAt(at(2026, 11, 16, 9))).toBe(at(2026, 11, 23, 0, 1)); // a Monday asks for the next one
    expect(nextMondayAt(at(2026, 11, 15, 22))).toBe(at(2026, 11, 16, 0, 1)); // Sunday night
  });
  it('the readout shows the two largest units', () => {
    expect(clockReadout(0)).toBe('Test clock +0 min');
    expect(clockReadout(32 * HOUR)).toBe('Test clock +1 d 8 h');
    expect(clockReadout(15 * 60_000)).toBe('Test clock +15 min');
    expect(clockReadout(72 * HOUR)).toBe('Test clock +3 d');
    expect(clockReadout(HOUR + 15 * 60_000)).toBe('Test clock +1 h 15 min');
  });
});

describe('the clock (step 6)', () => {
  it('gameNow is Date.now plus the offset, and the offset only moves forward', () => {
    const { clock } = modules();
    expect(clock.gameNow()).toBe(T);
    clock.setGameClockOffset(5 * HOUR);
    expect(clock.gameNow()).toBe(T + 5 * HOUR);
    clock.setGameClockOffset(HOUR); // back: ignored
    clock.setGameClockOffset(Number.NaN);
    expect(clock.gameClockOffset()).toBe(5 * HOUR);
  });
  it('is saved with the test cheats and restored before the save loads', async () => {
    const a = modules();
    mem[SAVE] = JSON.stringify(baseGame(a, T));
    await a.store.useGame.getState().load();
    await a.time.awayFor(3 * HOUR);
    expect(JSON.parse(mem['slice-empire/store/test-cheats-v1']).clockOffset).toBe(3 * HOUR);
    a.time.setSpeed(4);
    // a new launch: the offset is back before the save is read
    mem[SAVE] = JSON.stringify(baseGame(a, T));
    const b = modules();
    expect(b.clock.gameClockOffset()).toBe(0);
    await b.store.useGame.getState().load();
    expect(b.clock.gameClockOffset()).toBe(3 * HOUR);
    expect(b.clock.gameSpeed()).toBe(4);
    expect(b.G.freeBuysOn()).toBe(true);
  });
});

describe('Away for (step 7)', () => {
  it('8 h gives the same welcome-back result as a save stamped 8 h ago loaded normally', async () => {
    // normally: the app was open at T, goes away, and comes back 8 h later (the store's own resume load)
    const n = modules();
    mem[SAVE] = JSON.stringify(baseGame(n, T));
    await n.store.useGame.getState().load();
    await n.store.useGame.getState().save();
    nowMs = T + 8 * HOUR;
    await n.store.useGame.getState().load();
    const normal = n.store.useGame.getState();
    expect(normal.offline).not.toBeNull();

    // the panel: the app is open at T and the clock jumps 8 h
    for (const k of Object.keys(mem)) delete mem[k];
    nowMs = T;
    const a = modules();
    mem[SAVE] = JSON.stringify(baseGame(a, T));
    await a.store.useGame.getState().load();
    expect(a.store.useGame.getState().offline).toBeNull();
    expect(await a.time.awayFor(8 * HOUR)).toBe(true);
    const away = a.store.useGame.getState();

    expect(a.clock.gameClockOffset()).toBe(8 * HOUR);
    expect(away.offline).toEqual(normal.offline);
    expect(away.game.cash).toBeCloseTo(normal.game.cash, 6);
    expect(away.game.totalEarned).toBeCloseTo(normal.game.totalEarned, 6);
    expect(away.game.shops).toEqual(normal.game.shops);
    expect(away.game.rewards.day).toBe(normal.game.rewards.day);
  });
  it('the offline cap and boost expiry come from the same path (3 days: capped, a boost that ended is gone)', async () => {
    const a = modules();
    const g = baseGame(a, T);
    mem[SAVE] = JSON.stringify({ ...g, rewards: { ...g.rewards, boosts: [{ mult: 2, until: T + HOUR, source: 'test' }] } });
    await a.store.useGame.getState().load();
    await a.time.awayFor(72 * HOUR);
    const s = a.store.useGame.getState();
    expect(s.offline).not.toBeNull();
    expect(s.offline!.capped).toBe(true);
    expect(s.offline!.seconds).toBe(a.G.offlineCapOf(g));
    expect(s.offline!.awaySeconds).toBe(72 * 3600);
    expect(s.game.rewards.boosts).toEqual([]);
    expect(s.offline!.boost).toBeGreaterThan(1);
  });
  it('refuses a move that is not forward, and a second move while one runs', async () => {
    const a = modules();
    mem[SAVE] = JSON.stringify(baseGame(a, T));
    await a.store.useGame.getState().load();
    expect(await a.time.awayFor(0)).toBe(false);
    expect(await a.time.awayFor(-HOUR)).toBe(false);
    const first = a.time.awayFor(HOUR);
    expect(await a.time.awayFor(HOUR)).toBe(false);
    expect(await first).toBe(true);
    expect(a.clock.gameClockOffset()).toBe(HOUR);
  });
});

describe('Next day and Next Monday (step 8)', () => {
  it('Next day: a new daily gift is ready, claiming it advances the streak, and the daily tasks roll', async () => {
    const a = modules();
    mem[SAVE] = JSON.stringify(claimedToday(a, T));
    await a.store.useGame.getState().load();
    const g0 = a.store.useGame.getState().game;
    expect(g0.rewards.gift.streak).toBe(1);
    expect(a.R.giftStatus(g0, T).kind).toBe('claimed');
    await a.time.awayToNextDay();
    const now = a.clock.gameNow();
    expect(now).toBe(at(2026, 11, 12, 0, 1));
    const g1 = a.store.useGame.getState().game;
    expect(a.R.giftStatus(g1, now)).toMatchObject({ kind: 'ready', day: 2 });
    expect(g1.rewards.day).toBe(a.R.dayKey(now));
    expect(g1.rewards.daily.every((t) => !t.claimed)).toBe(true);
    a.store.useGame.getState().dismissOffline();
    expect(a.store.useGame.getState().claimGift(false)).toBe(true);
    expect(a.store.useGame.getState().game.rewards.gift.streak).toBe(2);
  });
  it('Next Monday: the weekly tasks and their chest reset', async () => {
    const a = modules();
    mem[SAVE] = JSON.stringify(claimedToday(a, T));
    await a.store.useGame.getState().load();
    const g0 = a.store.useGame.getState().game;
    expect(g0.rewards.week).toBe('2026-11-09');
    expect(g0.rewards.weeklyChest).toBe(true);
    await a.time.awayToNextMonday();
    expect(a.clock.gameNow()).toBe(at(2026, 11, 16, 0, 1));
    const g1 = a.store.useGame.getState().game;
    expect(g1.rewards.week).toBe('2026-11-16');
    expect(g1.rewards.weeklyChest).toBe(false);
    expect(g1.rewards.weekly.every((t) => !t.claimed)).toBe(true);
  });
});

describe('Play forward (step 9)', () => {
  /** The store with the base game loaded and the title card gone. */
  const ready = (m: Modules) => {
    m.store.useGame.setState({ game: baseGame(m, T), loaded: true, titleDone: true });
    return m.store.useGame;
  };
  const settled = (g: GameModule.GameState): GameModule.GameState => ({ ...g, lastSavedAt: 0 });

  it('10 min equals 600 calls of the store tick, each with the clock a second on', async () => {
    const a = modules();
    const useA = ready(a);
    expect(await a.time.playForward(600, { frame: async () => {} })).toBe(true);

    const b = modules();
    const useB = ready(b);
    for (let i = 0; i < 600; i++) {
      b.clock.setGameClockOffset(b.clock.gameClockOffset() + 1000);
      useB.getState().tick(1);
    }
    expect(a.clock.gameClockOffset()).toBe(600_000);
    expect(useA.getState().game.playSeconds).toBe(600);
    expect(useA.getState().game.cash).toBeGreaterThan(1000);
    expect(settled(useA.getState().game)).toEqual(settled(useB.getState().game));
  });
  it('gives the page a frame every 60 steps', async () => {
    const a = modules();
    ready(a);
    let frames = 0;
    await a.time.playForward(600, { frame: async () => void frames++ });
    expect(frames).toBe(9); // after steps 60..540; none after the last
  });
  it('is one second a step at 4x and 16x too (the tick is given 1 / speed)', async () => {
    const a = modules();
    const useA = ready(a);
    await a.time.playForward(60, { frame: async () => {} });
    const base = settled(useA.getState().game);
    for (const x of [4, 16] as const) {
      const b = modules();
      const useB = ready(b);
      b.time.setSpeed(x);
      await b.time.playForward(60, { frame: async () => {} });
      expect(b.clock.gameClockOffset()).toBe(60_000);
      expect(settled(useB.getState().game)).toEqual(base);
    }
  });
});

describe('Speed (step 10)', () => {
  it('multiplies the tick dt before playTick; 1x is the plain tick', () => {
    const a = modules();
    a.store.useGame.setState({ game: baseGame(a, T), loaded: true, titleDone: true });
    const play = () => a.store.useGame.getState().game.playSeconds;
    a.store.useGame.getState().tick(0.5);
    expect(play()).toBeCloseTo(0.5, 9);
    a.time.setSpeed(4);
    a.store.useGame.getState().tick(0.5);
    expect(play()).toBeCloseTo(2.5, 9);
    a.time.setSpeed(16);
    a.store.useGame.getState().tick(0.5);
    expect(play()).toBeCloseTo(10.5, 9);
    expect(JSON.parse(mem['slice-empire/store/test-cheats-v1']).speed).toBe(16);
  });
});
