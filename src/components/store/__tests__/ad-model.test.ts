/// <reference types="jest" />
import { MAX_BOOSTERS, STREAK_SAVE_DIAMONDS } from '../../../content/rewards';
import { NONNA_TAKEOVER } from '../../../content/tuning';
import * as G from '../../../engine/game';
import { claimDaily, dayKey, giftStatus, refreshRewards } from '../../../engine/rewards';
import type { AdPlacement, AdResult } from '../../../services/types';
import { adLabel, applyDouble, boosterAdOffer, buttonShown, canReroll, claimDelta, claimOffer, DAILY_BOOSTER, deltaText, doubleLabel, grantDailyBooster, gives, offlineBoost, offlineExtra, offlineFactor, offlineOffer, repairByAd, rerollDaily, rerollTask, runAd, streakSaveOffer } from '../ad-model';

const NOW = new Date(2026, 10, 11, 12, 0, 0).getTime(); // a Wednesday
const DAY = 86_400_000;

function base(): G.GameState {
  const s = G.newGame(NOW);
  const shops = { ...s.shops, downtown: { ...s.shops.downtown, prep: 22, ovens: 20, counter: 18, drivers: 14, managed: true } };
  return refreshRewards({ ...s, shops, seenScenes: [NONNA_TAKEOVER.sceneId], cash: 1000, totalEarned: 15000 }, NOW);
}
const withR = (s: G.GameState, p: Partial<G.Rewards>): G.GameState => ({ ...s, rewards: { ...s.rewards, ...p } });

function deps(plus: boolean, answer: AdResult) {
  const shown: AdPlacement[] = [];
  return {
    shown,
    d: {
      plus,
      show: async (p: AdPlacement) => {
        shown.push(p);
        return answer;
      },
    },
  };
}

describe('the one rule', () => {
  test('a Plus owner gets the benefit at once: no ad is shown or counted', async () => {
    const t = deps(true, 'rewarded');
    const o = await runAd('double_claim', t.d);
    expect(o).toBe('plus');
    expect(gives(o)).toBe(true);
    expect(t.shown).toEqual([]);
  });
  test('a finished ad gives the benefit (the services index counts ad_started and ad_completed, C128)', async () => {
    const t = deps(false, 'rewarded');
    const o = await runAd('reroll_task', t.d);
    expect(o).toBe('rewarded');
    expect(gives(o)).toBe(true);
    expect(t.shown).toEqual(['reroll_task']);
  });
  test.each<AdResult>(['dismissed', 'unavailable'])('%s: no benefit, no completion, nothing thrown', async (answer) => {
    const t = deps(false, answer);
    const o = await runAd('offline_2x', t.d);
    expect(o).toBe('skipped');
    expect(gives(o)).toBe(false);
    expect(t.shown).toEqual(['offline_2x']);
  });
  test('an ad service that throws is the same as no ad', async () => {
    const o = await runAd('streak_save', { plus: false, show: async () => Promise.reject(new Error('boom')) });
    expect(o).toBe('skipped');
  });
  test('the button shows for a Plus owner always and for anyone else only when an ad could play; its words follow', () => {
    expect(buttonShown(true, false)).toBe(true);
    expect(buttonShown(false, true)).toBe(true);
    expect(buttonShown(false, false)).toBe(false);
    expect(adLabel(true, 'Double it', 'Double it · Plus')).toBe('Double it · Plus');
    expect(adLabel(false, 'Double it', 'Double it · Plus')).toBe('Double it');
  });
});

describe("the double button's words (D497)", () => {
  const m = (n: number) => `$${n}`;
  test('it names what it adds; both cash and diamonds say ×2', () => {
    expect(doubleLabel({ cash: 81200, diamonds: 0 }, m)).toBe('Double it · +$81200');
    expect(doubleLabel({ cash: 0, diamonds: 20 }, m)).toBe('Double it · +20 diamonds');
    expect(doubleLabel({ cash: 0, diamonds: 1 }, m)).toBe('Double it · +1 diamond');
    expect(doubleLabel({ cash: 5, diamonds: 20 }, m)).toBe('Double it · ×2');
  });
});

describe('double a claim', () => {
  test('the delta is what the claim paid, and paying it again doubles the claim', () => {
    const g = base();
    const done = withR(g, { daily: g.rewards.daily.map((t, i) => (i === 0 ? { ...t, target: 0 } : t)) });
    const r = claimDaily(done, 0, NOW);
    if (!r.ok) throw new Error(r.reason);
    const d = claimDelta(done, r.state);
    expect(d.cash).toBeGreaterThan(0);
    expect(claimOffer(d)).toBe(true);
    const twice = applyDouble(r.state, d);
    expect(twice.cash - done.cash).toBeCloseTo(2 * d.cash, 6);
    expect(twice.totalEarned - done.totalEarned).toBeCloseTo(2 * d.cash, 6);
  });
  test('diamonds are paid again too; a claim that paid neither is not offered', () => {
    const g = withR(base(), { diamonds: 10 });
    const after = withR(g, { diamonds: 16 });
    const d = claimDelta(g, after);
    expect(d).toEqual({ cash: 0, diamonds: 6 });
    expect(applyDouble(after, d).rewards.diamonds).toBe(22);
    expect(claimOffer(claimDelta(g, g))).toBe(false);
    expect(claimOffer(null)).toBe(false);
  });
  test('the sheet words', () => {
    const m = (n: number) => `$${n}`;
    expect(deltaText({ cash: 120, diamonds: 6 }, m)).toBe('+$120 and 6 diamonds');
    expect(deltaText({ cash: 0, diamonds: 1 }, m)).toBe('1 diamond');
  });
});

describe('reroll one daily task a day', () => {
  test('swaps a row that is not done for a kind that is not in the set, once', () => {
    const g = base();
    expect(g.rewards.rerollUsed).toBe(false);
    const i = g.rewards.daily.findIndex((t) => !t.claimed);
    const next = rerollTask(g, i);
    expect(next).not.toBeNull();
    expect(g.rewards.daily.map((t) => t.kind)).not.toContain(next!.kind);
    const r = rerollDaily(g, i, NOW);
    if (!r.ok) throw new Error(r.reason);
    expect(r.state.rewards.daily[i].kind).toBe(next!.kind);
    expect(r.state.rewards.rerollUsed).toBe(true);
    expect(r.state.rewards.daily.filter((_, k) => k !== i)).toEqual(g.rewards.daily.filter((_, k) => k !== i));
    // the second try the same day is refused, and no row offers the swap
    const again = rerollDaily(r.state, i, NOW);
    expect(again.ok).toBe(false);
    expect(g.rewards.daily.every((_, k) => !canReroll(r.state, k))).toBe(true);
  });
  test('the same day and row always give the same task', () => {
    const g = base();
    expect(rerollTask(g, 1)).toEqual(rerollTask(structuredClone(g), 1));
  });
  test('a claimed or finished row is not swapped; the next day gives the swap back', () => {
    const g = base();
    expect(rerollTask(withR(g, { daily: g.rewards.daily.map((t, k) => (k === 0 ? { ...t, claimed: true } : t)) }), 0)).toBeNull();
    expect(rerollTask(withR(g, { daily: g.rewards.daily.map((t, k) => (k === 0 ? { ...t, target: 0 } : t)) }), 0)).toBeNull();
    const used = withR(g, { rerollUsed: true });
    expect(canReroll(used, 0)).toBe(false);
    const tomorrow = refreshRewards(used, NOW + DAY);
    expect(tomorrow.rewards.rerollUsed).toBe(false);
    expect(canReroll(tomorrow, 0)).toBe(true);
  });
  test('the clock guard and the unlock gate hold', () => {
    const g = base();
    expect(rerollDaily({ ...g, seenScenes: [] }, 0, NOW).ok).toBe(false);
    expect(rerollDaily(withR(g, { lastSeen: NOW + 1000 }), 0, NOW).ok).toBe(false);
  });
});

describe('save the streak with an ad, once per cycle', () => {
  // a 6-day streak, last claimed two days ago: the engine offers the repair
  const missed = (saveUsed = false): G.GameState => withR(base(), { gift: { streak: 6, last: dayKey(NOW - 2 * DAY), saveUsed, cycle: 0 }, diamonds: 3 });
  test('repairs the streak without spending diamonds (the 20 are only lent for the engine call)', () => {
    const g = missed();
    expect(giftStatus(g, NOW).kind).toBe('save');
    expect(streakSaveOffer(g, NOW)).toBe(true);
    const r = repairByAd(g, NOW);
    if (!r.ok) throw new Error(r.reason);
    expect(r.state.rewards.gift.streak).toBe(7);
    expect(r.state.rewards.gift.saveUsed).toBe(true);
    // 3 diamonds before; day 7 pays 50: never less than 3 + the gift, and the 20 lent are not kept
    expect(r.state.rewards.diamonds).toBe(3 + 50);
  });
  test('after the save is used the offer is gone until the cycle turns', () => {
    const used = missed(true);
    expect(giftStatus(used, NOW).kind).toBe('ready');
    expect(streakSaveOffer(used, NOW)).toBe(false);
    expect(repairByAd(used, NOW).ok).toBe(false);
    expect(STREAK_SAVE_DIAMONDS).toBe(20);
  });
  test('nothing to save when the gift is simply ready', () => {
    expect(streakSaveOffer(base(), NOW)).toBe(false);
  });
});

describe('one free booster a day', () => {
  test('offered when none was taken today; the day key is the local date', () => {
    const g = base();
    expect(boosterAdOffer(g, NOW, '')).toBe(true);
    expect(boosterAdOffer(g, NOW, dayKey(NOW))).toBe(false);
    expect(boosterAdOffer(g, NOW + DAY, dayKey(NOW))).toBe(true);
    expect(boosterAdOffer({ ...g, seenScenes: [] }, NOW, '')).toBe(false);
  });
  test('gives one 2x 15 min booster and stops at the shelf limit', () => {
    const g = base();
    const r = grantDailyBooster(g, NOW);
    if (!r.ok) throw new Error(r.reason);
    expect(r.state.rewards.boosters).toEqual([...g.rewards.boosters, { mult: 2, seconds: 900 }]);
    expect(DAILY_BOOSTER).toEqual({ mult: 2, seconds: 900 });
    const full = withR(g, { boosters: Array.from({ length: MAX_BOOSTERS }, () => ({ mult: 2, seconds: 900 })) });
    expect(grantDailyBooster(full, NOW).ok).toBe(false);
    expect(boosterAdOffer(full, NOW, '')).toBe(false);
  });
});

describe('2x offline earnings replaces a timed boost, never stacks with it', () => {
  test('no boost: the ad doubles the total', () => {
    expect(offlineFactor(1)).toBe(2);
    expect(offlineExtra(100, 1)).toBe(100);
    expect(offlineOffer(1, false)).toBe(true);
  });
  test('a partial boost is lifted to 2x, not to 2x on top', () => {
    expect(offlineFactor(1.5)).toBeCloseTo(4 / 3, 9);
    expect(100 + offlineExtra(100, 1.5)).toBeCloseTo(133.333, 2);
  });
  test('a boost that already makes it 2x or more leaves nothing to add', () => {
    expect(offlineFactor(2)).toBe(1);
    expect(offlineFactor(3)).toBe(1);
    expect(offlineOffer(2, false)).toBe(false);
    expect(offlineExtra(100, 3)).toBe(0);
  });
  test('taken once; an old summary without a boost counts as none', () => {
    expect(offlineOffer(1, true)).toBe(false);
    expect(offlineOffer(undefined, undefined)).toBe(true);
  });
  test('the boost over the window is the engine rule: each boost adds (mult - 1) for the part it covered', () => {
    const t0 = 1_000_000;
    expect(offlineBoost([], t0, 3600)).toBe(1);
    expect(offlineBoost([{ mult: 2, until: t0 + 3600_000 }], t0, 3600)).toBe(2);
    expect(offlineBoost([{ mult: 2, until: t0 + 1800_000 }], t0, 3600)).toBeCloseTo(1.5, 9);
    expect(offlineBoost([{ mult: 2, until: t0 - 1 }], t0, 3600)).toBe(1);
    expect(offlineBoost([{ mult: 2, until: t0 + 9e9 }], t0, 0)).toBe(1);
  });
  test('the rule matches the engine: the same boosts give the same factor as applyOffline', () => {
    const s0 = base();
    const away = 3600;
    const stamped = { ...s0, lastSavedAt: NOW - away * 1000 };
    const boosted = withR(stamped, { boosts: [{ mult: 2, until: NOW - (away / 2) * 1000, source: 'x' }] });
    const plain = G.applyOffline(stamped, NOW);
    const withBoost = G.applyOffline(boosted, NOW);
    const f = offlineBoost(boosted.rewards.boosts, boosted.lastSavedAt, withBoost.seconds);
    expect(f).toBeCloseTo(1.5, 6);
    expect(withBoost.earned / plain.earned).toBeGreaterThan(1.3);
    expect(withBoost.earned / plain.earned).toBeLessThan(1.51);
  });
});
