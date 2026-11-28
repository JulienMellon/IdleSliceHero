/// <reference types="jest" />
// The free gift (v5.25, card E9): ready at 120 s of play, then every 4 h of real time (it counts while away, one waits at most); 5 minutes of the
// shop's income in whole dollars, and 10 diamonds on every third claim; `free_gift_claimed { cash, diamonds }`; a save that round-trips.
import { FREE_GIFT } from '../../../content/free-gift';
import * as G from '../../game';
import * as R from '../../rewards';
import { FEATURES, getFeature } from '../index';
import { claimFreeGift, freeGiftCash, freeGiftDiamonds, freeGiftFeature, freeGiftIn, freeGiftReady, type FreeGiftState } from '../free-gift';

const T = new Date(2026, 10, 30, 12).getTime();
const HOUR = 3_600_000;
const state = (g: G.GameState): FreeGiftState => getFeature(g, freeGiftFeature);
const withState = (g: G.GameState, p: Partial<FreeGiftState>): G.GameState => ({ ...g, x: { ...g.x, [freeGiftFeature.key]: { ...state(g), ...p } } });
/** Downtown runs itself, so there is an income to take minutes of. */
const shop = (): G.GameState => {
  const s = G.newGame(T);
  return { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, heads: G.allHeads() } }, rewards: { ...s.rewards, lastSeen: T } };
};
const ok = (r: ReturnType<typeof claimFreeGift>) => {
  if (!r.ok) throw new Error(r.reason);
  return r;
};
/** Play `seconds` of foreground time one second at a time, the wall clock moving with it. */
function play(g: G.GameState, seconds: number, now: number): G.GameState {
  for (let i = 0; i < seconds; i++) g = G.playTick(g, 1, now + (i + 1) * 1000);
  return g;
}

describe('the feature is registered and starts empty', () => {
  it('a new game has the slice, nothing waiting', () => {
    expect(FEATURES.map((f) => f.key)).toContain('freeGift');
    expect(state(G.newGame(T))).toEqual({ nextAt: 0, count: 0, ready: false });
    expect(freeGiftReady(G.newGame(T), T)).toBe(false);
  });
});

describe('timing', () => {
  it('the first gift is ready at 120 s of active play, not before', () => {
    let g = shop();
    g = play(g, FREE_GIFT.firstAtPlaySeconds - 1, T);
    expect(g.playSeconds).toBe(119);
    expect(freeGiftReady(g, T)).toBe(false);
    expect(state(g).ready).toBe(false);
    expect(freeGiftIn(g, T)).toBe(1);
    g = play(g, 1, T);
    expect(state(g).ready).toBe(true);
    expect(freeGiftReady(g, T)).toBe(true);
    expect(freeGiftIn(g, T)).toBe(0);
  });

  it('the wall clock does not matter for the first gift, and an hour of the clock alone does not make one', () => {
    const g = shop();
    expect(freeGiftReady(g, T + 100 * HOUR)).toBe(false);
    expect(freeGiftReady({ ...g, playSeconds: 120 }, T)).toBe(true);
  });

  it('after a claim the next one is 4 h of real time later, to the millisecond', () => {
    let g = withState({ ...shop(), playSeconds: 200 }, { ready: true });
    g = ok(claimFreeGift(g, T)).state;
    expect(state(g)).toEqual({ nextAt: T + 4 * HOUR, count: 1, ready: false });
    expect(freeGiftReady(g, T + 4 * HOUR - 1)).toBe(false);
    expect(freeGiftReady(g, T + 4 * HOUR)).toBe(true);
    // the tick sets it ready the moment the time comes
    expect(state(G.playTick(g, 1, T + 4 * HOUR - 1)).ready).toBe(false);
    expect(state(G.playTick(g, 1, T + 4 * HOUR)).ready).toBe(true);
    expect(freeGiftIn(g, T + HOUR)).toBe(3 * 3600);
  });

  it('it counts while the app is closed, and never more than one waits', () => {
    let g = withState({ ...shop(), playSeconds: 200, lastSavedAt: T }, { ready: true });
    g = ok(claimFreeGift(g, T)).state;
    // 30 hours away: seven 4-hour waits have passed, one gift waits
    const back = G.applyOffline({ ...g, lastSavedAt: T }, T + 30 * HOUR).state;
    expect(state(back).ready).toBe(true);
    expect(state(back).count).toBe(1);
    // ticking on does not add another
    const on = play(back, 5, T + 30 * HOUR);
    expect(state(on)).toEqual(state(back));
    // one claim empties it, and the next is 4 h after the claim, not 4 h after the missed ones
    const next = ok(claimFreeGift(on, T + 30 * HOUR)).state;
    expect(state(next)).toEqual({ nextAt: T + 34 * HOUR, count: 2, ready: false });
  });

  it('a gift that was ready when the app closed is still one gift on return', () => {
    const g = withState({ ...shop(), lastSavedAt: T }, { ready: true, nextAt: T - HOUR, count: 4 });
    const back = G.applyOffline(g, T + 100 * HOUR).state;
    expect(state(back)).toEqual({ nextAt: T - HOUR, count: 4, ready: true });
  });

  it('a clock wound back after a claim does not hold the gift for more than 4 h', () => {
    const g = withState(shop(), { nextAt: T + 400 * HOUR, count: 2 });
    expect(state(G.playTick(g, 1, T)).nextAt).toBe(T + 4 * HOUR);
  });
});

describe('what a claim gives', () => {
  const ready = (count = 0): G.GameState => withState({ ...shop(), playSeconds: 500 }, { ready: true, nextAt: T - 1, count });

  it('cash worth 5 minutes of the shop’s income at the claim, in whole dollars', () => {
    const g = ready();
    const income = R.rewardIncome(g);
    expect(income).toBeGreaterThan(0);
    const r = ok(claimFreeGift(g, T));
    expect(r.event.cash).toBe(Math.floor(income * 300));
    expect(Number.isInteger(r.event.cash)).toBe(true);
    expect(r.state.cash - g.cash).toBe(r.event.cash);
    expect(r.state.totalEarned - g.totalEarned).toBe(r.event.cash);
    expect(freeGiftCash(g)).toBe(r.event.cash);
  });

  it('is worth more from a bigger shop, priced at the claim and not at the ready time', () => {
    const small = ready();
    const big = { ...small, shops: { ...small.shops, downtown: { ...small.shops.downtown, prep: 30, ovens: 30, counter: 30, tables: 30, drivers: 10 } } };
    expect(freeGiftCash(big)).toBeGreaterThan(freeGiftCash(small));
    expect(ok(claimFreeGift(big, T)).event.cash).toBeGreaterThan(ok(claimFreeGift(small, T)).event.cash);
  });

  it('is at least $1 even from a shop that earns nothing', () => {
    const g = withState({ ...G.newGame(T), playSeconds: 500, rewards: { ...G.newGame(T).rewards, lastSeen: T } }, { ready: true });
    expect(ok(claimFreeGift(g, T)).event.cash).toBeGreaterThanOrEqual(1);
  });

  it('every third claim also holds 10 diamonds', () => {
    let g = ready();
    const seen: number[] = [];
    for (let i = 0; i < 6; i++) {
      const before = g.rewards.diamonds;
      const r = ok(claimFreeGift(withState(g, { ready: true, nextAt: T - 1 }), T));
      seen.push(r.event.diamonds);
      expect(r.state.rewards.diamonds - before).toBe(r.event.diamonds);
      g = r.state;
    }
    expect(seen).toEqual([0, 0, 10, 0, 0, 10]);
    expect(freeGiftDiamonds(ready(2))).toBe(FREE_GIFT.diamonds);
    expect(freeGiftDiamonds(ready(3))).toBe(0);
  });

  it('emits free_gift_claimed with what it paid', () => {
    const r = ok(claimFreeGift(ready(2), T));
    expect(r.event).toEqual({ type: 'free_gift_claimed', cash: r.event.cash, diamonds: 10 });
  });

  it('is refused when none waits, and when the clock is behind the last claim; a refusal changes nothing', () => {
    const none = shop();
    expect(claimFreeGift(none, T)).toEqual({ ok: false, reason: 'No gift waiting' });
    const behind = { ...ready(), rewards: { ...ready().rewards, lastSeen: T + HOUR } };
    expect(claimFreeGift(behind, T).ok).toBe(false);
    // a second claim at once finds none waiting
    const once = ok(claimFreeGift(ready(), T)).state;
    expect(claimFreeGift(once, T).ok).toBe(false);
  });

  it('pays whether or not the rewards have unlocked (the first gift comes 2 minutes in)', () => {
    const g = ready();
    expect(R.rewardsUnlocked(g)).toBe(false);
    expect(claimFreeGift(g, T).ok).toBe(true);
  });
});

describe('the save', () => {
  it('round-trips through the saved form and the load', () => {
    const g = withState({ ...shop(), playSeconds: 500 }, { ready: true, nextAt: T + 2 * HOUR, count: 5 });
    const loaded = G.migrate(JSON.parse(JSON.stringify(g)), T);
    expect(state(loaded)).toEqual({ nextAt: T + 2 * HOUR, count: 5, ready: true });
  });

  it('an older save, or a broken one, loads as a new game’s: the first gift 120 s into play', () => {
    const old = JSON.parse(JSON.stringify(G.newGame(T)));
    delete old.x.freeGift;
    expect(state(G.migrate(old, T))).toEqual({ nextAt: 0, count: 0, ready: false });
    expect(freeGiftFeature.migrate('x', T)).toEqual({ nextAt: 0, count: 0, ready: false });
    expect(freeGiftFeature.migrate({ nextAt: -5, count: 'a', ready: 1 }, T)).toEqual({ nextAt: 0, count: 0, ready: false });
    expect(freeGiftFeature.migrate({ nextAt: 12.7, count: 3.9, ready: true }, T)).toEqual({ nextAt: 12, count: 3, ready: true });
  });
});
