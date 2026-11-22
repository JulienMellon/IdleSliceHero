/**
 * @jest-environment <rootDir>/src/engine/__tests__/tz-env.js
 */
/* eslint-disable @typescript-eslint/no-require-imports, expo/no-dynamic-env-var */
/// <reference types="jest" />
// Card X2 (v5.19-test), money: free buys, the diamond rule, need-text, and the Money section's actions.
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

import { VANITY_PRICE } from '../../content/endgame';
import { STREAK_SAVE_DIAMONDS } from '../../content/rewards';
import { vanityViews } from '../../components/endgame/shop-model';
import { stationViews } from '../../components/sidewalk-model';
import * as G from '../../engine/game';
import { nightOvenView } from '../../engine/night-oven';
import * as R from '../../engine/rewards';
import { buyCosmetic } from '../../engine/vanity';
import { parseCheats, DEFAULT_CHEATS } from '../cheat-prefs';

const SWITCH = 'EXPO_PUBLIC_TEST_MODE';
const before = process.env[SWITCH];
beforeEach(() => {
  process.env[SWITCH] = '1';
});
afterEach(() => {
  G.setFreeBuys(false);
  if (before === undefined) delete process.env[SWITCH];
  else process.env[SWITCH] = before;
});

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const T = at(2026, 11, 11);

/** Downtown running itself, `cash` in the till. */
const shopState = (cash = 0, patch: Partial<G.Shop> = {}): G.GameState => {
  const s = G.newGame(T);
  return {
    ...s,
    cash,
    tutorial: G.TUTORIAL_DONE,
    seenScenes: ['downtown-4'],
    shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, ...patch } },
  };
};
const withDiamonds = (s: G.GameState, n: number): G.GameState => ({ ...s, rewards: { ...s.rewards, diamonds: n } });

describe('free buys (step 1)', () => {
  it('on: every cost is affordable, a null cost is not', () => {
    const s = shopState(0);
    G.setFreeBuys(true);
    expect(G.freeBuysOn()).toBe(true);
    for (const cost of [0, 1, 1e3, 1e12, Number.MAX_SAFE_INTEGER]) expect(G.canAfford(s, cost)).toBe(true);
    expect(G.canAfford(s, null)).toBe(false);
    expect(G.canAfford(s, undefined)).toBe(false);
  });
  it('on: pay leaves the state as it was (cash, totalEarned, stats)', () => {
    const s = shopState(5);
    G.setFreeBuys(true);
    const r = G.pay(s, 1e9);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state).toBe(s);
      expect(r.state.cash).toBe(5);
    }
  });
  it('on: a buy goes through with no cash and counts like a buy, but moves no cash; locks still refuse; no cost is still unaffordable', () => {
    const s = shopState(0);
    G.setFreeBuys(true);
    const r = G.buyUpgrade(s, 'downtown', 'prep');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.shops.downtown.prep).toBe(s.shops.downtown.prep + 1);
      expect(r.state.cash).toBe(0);
      expect(r.state.totalEarned).toBe(s.totalEarned);
    }
    // the manager is locked until the three heads are hired: free buys do not open it
    expect(G.upgradeLock(s, 'downtown', 'manager')).toBeTruthy();
    expect(G.buyUpgrade(s, 'downtown', 'manager')).toEqual({ ok: false, reason: G.upgradeLock(s, 'downtown', 'manager') });
    // a shop's levels past the cap are locked too
    const top = shopState(0, { footprint: 4, prep: 125, ovens: 125, counter: 125, drivers: 125 });
    expect(G.upgradeLock(top, 'downtown', 'prep')).toBeTruthy();
    expect(G.buyUpgrade(top, 'downtown', 'prep').ok).toBe(false);
    // nothing to buy (a head already hired) has no cost, and no cost is never affordable
    const hired = shopState(0, { heads: G.allHeads() });
    expect(G.upgradeCostOf(hired, 'downtown', 'headPrep')).toBeNull();
    expect(G.canAfford(hired, G.upgradeCostOf(hired, 'downtown', 'headPrep'))).toBe(false);
  });
  it('off: exactly the A36 rule', () => {
    const s = shopState(5);
    expect(G.freeBuysOn()).toBe(false);
    expect(G.canAfford(s, 5)).toBe(true);
    expect(G.canAfford(s, 5.01)).toBe(false);
    expect(G.canAfford(s, null)).toBe(false);
    expect(G.pay(s, 6)).toEqual({ ok: false, reason: 'Not enough cash' });
    const r = G.pay(s, 2);
    expect(r.ok && r.state.cash).toBe(3);
  });
  it('the night oven button and the hire button read the one rule', () => {
    const s = shopState(0);
    const next = () => nightOvenView(s).next;
    const off = next();
    G.setFreeBuys(true);
    const on = next();
    expect(off && on).toBeTruthy();
    if (on && off && !on.lock) {
      expect(off.canBuy).toBe(false);
      expect(on.canBuy).toBe(true);
    }
    const bought = G.freeBuysOn() && G.pay(s, on ? on.price : 1);
    expect(bought && bought.ok && bought.state.cash).toBe(0);
  });
});

describe('diamonds (step 3)', () => {
  it('on: every price is affordable, nothing is taken, a null price is refused', () => {
    const s = withDiamonds(shopState(), 0);
    G.setFreeBuys(true);
    expect(G.canAffordDiamonds(s, 10_000)).toBe(true);
    expect(G.canAffordDiamonds(s, null)).toBe(false);
    const r = G.payDiamonds(s, 500);
    expect(r.ok && r.state).toBe(s);
  });
  it('off: the plain rule', () => {
    const s = withDiamonds(shopState(), 25);
    expect(G.canAffordDiamonds(s, 25)).toBe(true);
    expect(G.canAffordDiamonds(s, 26)).toBe(false);
    expect(G.payDiamonds(s, 26)).toEqual({ ok: false, reason: 'Not enough diamonds' });
    const r = G.payDiamonds(s, 20);
    expect(r.ok && r.state.rewards.diamonds).toBe(5);
    expect(r.ok && r.state.cash).toBe(s.cash);
  });
  it('the vanity shop: buy and the row state follow the rule', () => {
    const s = withDiamonds(shopState(), 0);
    const id = vanityViews(s).find((v) => v.state === 'poor')!.buyId!;
    expect(vanityViews(s).some((v) => v.state === 'buy')).toBe(false);
    expect(buyCosmetic(s, id)).toEqual({ ok: false, reason: 'Not enough diamonds' });
    G.setFreeBuys(true);
    expect(vanityViews(s).filter((v) => v.state === 'buy').length).toBeGreaterThan(0);
    const r = buyCosmetic(s, id);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.rewards.diamonds).toBe(0);
      expect(r.state.rewards.cosmetics).toContain(id);
    }
    G.setFreeBuys(false);
    const paid = buyCosmetic(withDiamonds(s, VANITY_PRICE + 5), id);
    expect(paid.ok && paid.state.rewards.diamonds).toBe(5);
  });
  it('the streak repair: refused without diamonds, free with free buys, 20 charged otherwise', () => {
    const day = (d: number) => at(2026, 11, d);
    let s = shopState();
    s = { ...s, seenScenes: ['downtown-4'], shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, heads: G.allHeads() } } };
    for (const d of [2, 3, 4]) {
      const r = R.claimGift(R.refreshRewards(s, day(d)), day(d));
      if (!r.ok) throw new Error(r.reason);
      s = r.state;
    }
    s = withDiamonds(s, 0);
    expect(R.giftStatus(s, day(6)).kind).toBe('save');
    expect(R.claimGift(s, day(6), { repair: true })).toEqual({ ok: false, reason: 'Not enough diamonds' });
    G.setFreeBuys(true);
    const free = R.claimGift(s, day(6), { repair: true });
    expect(free.ok && free.state.rewards.diamonds).toBe(0);
    expect(free.ok && free.state.rewards.gift.saveUsed).toBe(true);
    G.setFreeBuys(false);
    const paid = R.claimGift(withDiamonds(s, STREAK_SAVE_DIAMONDS + 3), day(6), { repair: true });
    expect(paid.ok && paid.state.rewards.diamonds).toBe(3);
  });
});

describe('need-text (step 4)', () => {
  it('is null with free buys on, "need $X" with them off', () => {
    const s = shopState(5);
    const short = stationViews(s, 'downtown').filter((v) => v.cost !== null && !v.lock && v.cost > 5);
    expect(short.length).toBeGreaterThan(0);
    expect(short.every((v) => v.need !== null)).toBe(true);
    G.setFreeBuys(true);
    for (const v of stationViews(s, 'downtown')) expect(v.need).toBeNull();
    expect(stationViews(s, 'downtown').every((v) => v.affordable || v.lock !== null)).toBe(true);
    G.setFreeBuys(false);
    expect(stationViews(s, 'downtown').some((v) => !v.affordable && v.lock === null)).toBe(true);
  });
});

describe('the normal build (switch unset)', () => {
  it('setFreeBuys(true) changes nothing', () => {
    delete process.env[SWITCH];
    G.setFreeBuys(true);
    expect(G.freeBuysOn()).toBe(false);
    expect(G.canAfford(shopState(0), 10)).toBe(false);
    expect(G.canAffordDiamonds(withDiamonds(shopState(), 0), 1)).toBe(false);
    expect(G.pay(shopState(0), 10).ok).toBe(false);
  });
  it('setGameClockOffset(1e9) and setGameSpeed(16) change nothing', () => {
    delete process.env[SWITCH];
    jest.isolateModules(() => {
      const clock = require('../../engine/clock');
      const now = Date.now();
      clock.setGameClockOffset(1e9);
      clock.setGameSpeed(16);
      expect(clock.gameClockOffset()).toBe(0);
      expect(clock.gameSpeed()).toBe(1);
      expect(Math.abs(clock.gameNow() - now)).toBeLessThan(1000);
    });
  });
  it('the web store stub keeps asking its query string', () => {
    delete process.env[SWITCH];
    jest.isolateModules(() => {
      const p = require('../../services/purchases.web');
      p.setTestBuyAnswer('purchased');
      expect(p.testBuyAnswerOn()).toBe(false);
    });
  });
});

describe('the saved cheats', () => {
  it('start with free buys ON, nothing else', () => {
    expect(parseCheats(null)).toEqual(DEFAULT_CHEATS);
    expect(DEFAULT_CHEATS.freeBuys).toBe(true);
  });
  it('read back what was saved, and ignore nonsense', () => {
    expect(parseCheats(JSON.stringify({ freeBuys: false, purchaseOk: true, clockOffset: 5e6, speed: 16 }))).toEqual({
      freeBuys: false,
      purchaseOk: true,
      clockOffset: 5e6,
      speed: 16,
    });
    expect(parseCheats(JSON.stringify({ clockOffset: -5, speed: 7 }))).toMatchObject({ clockOffset: 0, speed: 1, freeBuys: true });
    expect(parseCheats('{oops')).toEqual(DEFAULT_CHEATS);
  });
});

describe('the Money rows', () => {
  const load = () => {
    const m: { store?: typeof import('../../store/game-store'); money?: typeof import('../money') } = {};
    jest.isolateModules(() => {
      m.store = require('../../store/game-store');
      m.money = require('../money');
    });
    return m as { store: typeof import('../../store/game-store'); money: typeof import('../money') };
  };
  const rich = (): G.GameState => {
    const s = shopState(100);
    return {
      ...s,
      totalEarned: 100,
      shops: { ...s.shops, downtown: { ...s.shops.downtown, heads: G.allHeads(), prep: 10, ovens: 10, counter: 10, drivers: 5, tables: 5 } },
    };
  };
  it('+10 min and +1 h add $/s x seconds to cash and totalEarned', () => {
    const { store, money } = load();
    store.useGame.setState({ game: rich(), loaded: true });
    const g = store.useGame.getState().game;
    const rate = G.earningsPerSecond(g);
    expect(rate).toBeGreaterThan(0);
    expect(money.addIncome(600)).toBeCloseTo(rate * 600, 6);
    const a = store.useGame.getState().game;
    expect(a.cash).toBeCloseTo(100 + rate * 600, 6);
    expect(a.totalEarned).toBeCloseTo(100 + rate * 600, 6);
    money.addIncome(3600);
    expect(store.useGame.getState().game.cash).toBeCloseTo(100 + rate * 4200, 4);
  });
  it('Cash -> $0 keeps totalEarned; Diamonds +100 adds', () => {
    const { store, money } = load();
    store.useGame.setState({ game: rich(), loaded: true });
    money.cashToZero();
    expect(store.useGame.getState().game.cash).toBe(0);
    expect(store.useGame.getState().game.totalEarned).toBe(100);
    const d = store.useGame.getState().game.rewards.diamonds;
    money.addDiamonds();
    expect(store.useGame.getState().game.rewards.diamonds).toBe(d + 100);
  });
  it('the toggles write the test cheats key and nothing under a v1 key', async () => {
    for (const k of Object.keys(mem)) delete mem[k];
    const { money } = load();
    // the toggles call the engine setters of the module registry they were loaded with
    money.toggleFreeBuys(false);
    money.toggleStoreSucceeds(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(Object.keys(mem).filter((k) => k.endsWith('/v1'))).toEqual([]);
    expect(JSON.parse(mem['slice-empire/store/test-cheats-v1'])).toMatchObject({ freeBuys: false, purchaseOk: true });
  });
});
