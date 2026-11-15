// The store's U3 actions on the real game store: what a claim leaves for the sheet, the double, a grant, the offline 2x, the shelf's booster.
jest.mock('@react-native-async-storage/async-storage', () => {
  const mem: Record<string, string> = {};
  return { __esModule: true, default: { getItem: async (k: string) => mem[k] ?? null, setItem: async (k: string, v: string) => void (mem[k] = v), removeItem: async (k: string) => void delete mem[k] } };
});

jest.useFakeTimers();

import { NONNA_TAKEOVER } from '../../../content/tuning';
import * as G from '../../../engine/game';
import { dayKey, refreshRewards } from '../../../engine/rewards';
import { GRANTS } from '../../../services/grants';
import { useGame } from '../../../store/game-store';
import { boosterAdOffer } from '../ad-model';

function fresh(): G.GameState {
  const now = Date.now();
  const s = G.newGame(now);
  const shops = { ...s.shops, downtown: { ...s.shops.downtown, prep: 22, ovens: 20, counter: 18, drivers: 14, managed: true } };
  return refreshRewards({ ...s, shops, seenScenes: [NONNA_TAKEOVER.sceneId], cash: 1000, totalEarned: 15000, tutorial: G.TUTORIAL_DONE }, now);
}
const done = (g: G.GameState, i = 0): G.GameState => ({ ...g, rewards: { ...g.rewards, daily: g.rewards.daily.map((t, k) => (k === i ? { ...t, target: 0 } : t)) } });
const st = () => useGame.getState();

beforeEach(() => {
  useGame.setState({ game: fresh(), loaded: true, titleDone: true, offline: null, claimed: null, plus: false, starterAt: null, prefs: { starterOffered: false, boosterAdDay: '' }, toast: null });
});

describe('a claim and its double', () => {
  test('a daily claim leaves what it paid for the sheet; doubling pays it again, once', () => {
    useGame.setState({ game: done(st().game) });
    const before = st().game.cash;
    expect(st().claimDaily(0)).toBe(true);
    const c = st().claimed!;
    expect(c.kind).toBe('daily');
    expect(c.doubled).toBe(false);
    const paid = st().game.cash - before;
    expect(paid).toBeGreaterThan(0);
    expect(c.delta.cash).toBeCloseTo(paid, 6);
    expect(st().doubleClaim()).toBe(true);
    expect(st().game.cash - before).toBeCloseTo(2 * paid, 6);
    expect(st().claimed!.doubled).toBe(true);
    // a second double is refused
    expect(st().doubleClaim()).toBe(false);
    expect(st().game.cash - before).toBeCloseTo(2 * paid, 6);
  });
  test('a refused claim leaves no sheet; dismissing clears it; a new claim replaces the old', () => {
    expect(st().claimDaily(0)).toBe(false);
    expect(st().claimed).toBeNull();
    useGame.setState({ game: done(done(st().game, 0), 1) });
    st().claimDaily(0);
    const first = st().claimed!;
    st().claimDaily(1);
    expect(st().claimed!.at).toBeGreaterThanOrEqual(first.at);
    st().dismissClaim();
    expect(st().claimed).toBeNull();
    expect(st().doubleClaim()).toBe(false);
  });
});

describe('a paid-out grant', () => {
  test('the Starter Pack lands in the game; Plus sets the flag', () => {
    const d0 = st().game.rewards.diamonds;
    st().receiveGrant(GRANTS.starter_pack);
    expect(st().game.rewards.diamonds).toBe(d0 + 150);
    expect(st().game.rewards.cosmetics).toContain('awning-founder');
    expect(st().game.rewards.boosts.some((b) => b.mult === 2 && b.source === 'purchase')).toBe(true);
    expect(st().plus).toBe(false);
    st().receiveGrant(GRANTS.nonnas_plus);
    expect(st().plus).toBe(true);
  });
});

describe('the shelf booster', () => {
  test('one a day: the booster is added, today is marked, the offer closes', () => {
    const n = st().game.rewards.boosters.length;
    expect(boosterAdOffer(st().game, Date.now(), st().prefs.boosterAdDay)).toBe(true);
    expect(st().freeBooster()).toBe(true);
    expect(st().game.rewards.boosters).toHaveLength(n + 1);
    expect(st().prefs.boosterAdDay).toBe(dayKey(Date.now()));
    expect(boosterAdOffer(st().game, Date.now(), st().prefs.boosterAdDay)).toBe(false);
  });
});

describe('the daily swap', () => {
  test('swaps one row and uses the day\'s swap', () => {
    const kinds = st().game.rewards.daily.map((t) => t.kind);
    expect(st().rerollDaily(0)).toBe(true);
    expect(st().game.rewards.rerollUsed).toBe(true);
    expect(st().game.rewards.daily[0].kind).not.toBe(kinds[0]);
    expect(st().rerollDaily(1)).toBe(false);
  });
});

describe('2x offline earnings', () => {
  const summary = (boost: number) => ({ seconds: 3600, capped: false, awaySeconds: 3600, earned: 100, byShop: [{ name: 'Downtown', earned: 100, managed: true, headsOnly: false, pies: 10 }], idle: [], boost });
  test('doubles the held-back total once', () => {
    useGame.setState({ offline: summary(1) });
    expect(st().doubleOffline()).toBe(true);
    expect(st().offline!.earned).toBe(200);
    expect(st().offline!.byShop[0].earned).toBe(200);
    expect(st().offline!.doubled).toBe(true);
    expect(st().doubleOffline()).toBe(false);
    expect(st().offline!.earned).toBe(200);
  });
  test('replaces a boost: a 1.5x window becomes 2x, a 2x window gets nothing', () => {
    useGame.setState({ offline: summary(1.5) });
    st().doubleOffline();
    expect(st().offline!.earned).toBeCloseTo(133.333, 2);
    useGame.setState({ offline: summary(2) });
    expect(st().doubleOffline()).toBe(false);
    expect(st().offline!.earned).toBe(100);
  });
  test('collecting pays the doubled total into cash and lifetime earnings', () => {
    const g = st().game;
    useGame.setState({ offline: summary(1), game: { ...g, cash: g.cash - 100, totalEarned: g.totalEarned - 100 } });
    const cash0 = st().game.cash;
    st().doubleOffline();
    st().dismissOffline();
    expect(st().game.cash - cash0).toBeCloseTo(200, 6);
    expect(st().offline).toBeNull();
  });
});

describe("the Starter Pack's cue", () => {
  test('the tutorial ending in play sets it; a save that is already done does not', () => {
    const g = fresh();
    useGame.setState({ game: { ...g, tutorial: 9, playSeconds: 77 } });
    expect(st().starterAt).toBeNull();
    useGame.setState({ game: { ...st().game, tutorial: G.TUTORIAL_DONE } });
    expect(st().starterAt).toBe(77);
  });
  test('marking it offered is saved with the prefs', () => {
    st().markStarterOffered();
    expect(st().prefs.starterOffered).toBe(true);
  });
});
