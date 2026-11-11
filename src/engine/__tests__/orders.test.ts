/// <reference types="jest" />
import { ORDER, ORDER_CAST, ORDER_FAIL_LINE } from '../../content/hooks';
import { NEIGHBORHOODS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import * as G from '../game';
import * as O from '../orders';
import * as R from '../rewards';

const T0 = 1_700_000_000_000;

/** The Suburbs shop built and run by its heads, Nonna in charge Downtown, both characters met. */
const ready = (): G.GameState => {
  const s = G.newGame(T0);
  const run = (id: NeighborhoodId, lv: number) => ({ ...s.shops[id], built: true, managed: true, heads: G.allHeads(), prep: lv, ovens: lv, counter: lv, drivers: lv + 2, tables: lv });
  return {
    ...s,
    tutorial: G.TUTORIAL_DONE,
    seenScenes: ['downtown-1', 'downtown-4', 'suburbs-1'],
    shops: { ...s.shops, downtown: run('downtown', 15), suburbs: run('suburbs', 10) },
    order: { ...s.order, seed: 4242 },
  };
};

/** One game tick the way the store does it: playSeconds first, then the orders. */
const step = (s: G.GameState, dt = 0.2, covered = false) => O.orderTick({ ...s, playSeconds: s.playSeconds + dt }, dt, covered);
function run(s: G.GameState, seconds: number, covered = false, onStep?: (s: G.GameState) => void): G.GameState {
  for (let t = 0; t < seconds - 1e-9; t += 0.2) {
    s = step(s, 0.2, covered);
    onStep?.(s);
  }
  return s;
}
const untilOffer = (s: G.GameState, limit = 900): G.GameState => {
  for (let t = 0; t < limit && !s.order.offer; t += 0.2) s = step(s);
  if (!s.order.offer) throw new Error('no offer');
  return s;
};
/** The same shop having sold `n` more pies. */
const sold = (s: G.GameState, id: NeighborhoodId, n: number): G.GameState => ({ ...s, shops: { ...s.shops, [id]: { ...s.shops[id], sold: s.shops[id].sold + n } } });

describe('when an offer comes', () => {
  test('never before the Suburbs shop is built, and never during the tutorial', () => {
    const noShop = { ...ready(), shops: { ...ready().shops, suburbs: G.newShop(false) } };
    expect(O.ordersUnlocked(noShop)).toBe(false);
    expect(run(noShop, 900).order.offer).toBeNull();
    // Suburbs built by a hand-edited save, but Nonna has not taken over: still the tutorial
    const tutorial = { ...ready(), seenScenes: ['downtown-1'], tutorial: 4, shops: { ...ready().shops, downtown: { ...ready().shops.downtown, managed: false, heads: G.noHeads() } } };
    expect(O.ordersUnlocked(tutorial)).toBe(false);
    expect(run(tutorial, 900).order.offer).toBeNull();
    expect(run(tutorial, 900).order.made).toBe(0);
  });

  test('the first is 60 s into the session', () => {
    const s = ready();
    expect(run(s, 59.4).order.offer).toBeNull();
    const up = untilOffer(s);
    expect(up.playSeconds).toBeGreaterThanOrEqual(ORDER.firstOfferAtPlay);
    expect(up.playSeconds).toBeLessThan(ORDER.firstOfferAtPlay + 0.5);
    expect(up.order.offer!.left).toBe(ORDER.offerWaitSeconds);
  });

  test('it comes from a character whose first scene has been seen, in a shop that is built', () => {
    const s = ready();
    const met = O.metHoods(s);
    expect(met).toEqual(['downtown', 'suburbs']);
    const seen = new Set<NeighborhoodId>();
    let cur = s;
    for (let i = 0; i < 12; i++) {
      cur = untilOffer({ ...cur, order: { ...cur.order, nextAt: cur.playSeconds } });
      seen.add(cur.order.offer!.hood);
      expect(met).toContain(cur.order.offer!.hood);
      cur = O.declineOrder(cur);
    }
    expect(seen.size).toBe(2);
    // Waterfront is built but its story has not started: not asked
    const wf = { ...s, shops: { ...s.shops, waterfront: { ...G.newShop(true) } } };
    expect(O.metHoods(wf)).not.toContain('waterfront');
    // no scenes seen for any built shop: no offer at all
    const nobody = { ...s, seenScenes: ['downtown-4'] };
    expect(run(nobody, 300).order.offer).toBeNull();
  });

  test('the cast takes turns and the line varies', () => {
    let cur = ready();
    const who: NeighborhoodId[] = [];
    for (let i = 0; i < 4; i++) {
      cur = untilOffer({ ...cur, order: { ...cur.order, nextAt: cur.playSeconds } });
      who.push(cur.order.offer!.hood);
      cur = O.declineOrder(cur);
    }
    expect(who[0]).not.toBe(who[1]);
    expect(who[0]).toBe(who[2]);
  });

  test('declined or expired: the next is 4 min of play later', () => {
    const offered = untilOffer(ready());
    const declined = O.declineOrder(offered);
    expect(declined.order.offer).toBeNull();
    expect(declined.order.nextAt).toBe(offered.playSeconds + ORDER.gapSeconds);
    expect(run(declined, ORDER.gapSeconds - 1).order.offer).toBeNull();
    const again = untilOffer(declined);
    expect(again.playSeconds - declined.playSeconds).toBeGreaterThanOrEqual(ORDER.gapSeconds - 0.01);
    expect(again.playSeconds - declined.playSeconds).toBeLessThan(ORDER.gapSeconds + 0.5);

    // an offer waits 45 s, then leaves quietly
    const waited = run(offered, ORDER.offerWaitSeconds - 1);
    expect(waited.order.offer).not.toBeNull();
    let left = waited;
    while (left.order.offer) left = step(left); // the tick it leaves on
    expect(left.order.result).toBeNull();
    expect(left.order.nextAt).toBeCloseTo(left.playSeconds + ORDER.gapSeconds, 6);
    expect(left.stats).toBe(offered.stats);
  });

  test('a scene (or any cover) stops the clocks and holds back new offers', () => {
    const s = ready();
    expect(run(s, 600, true).order.offer).toBeNull();
    const offered = untilOffer(s);
    const covered = run(offered, 300, true);
    expect(covered.order.offer!.left).toBe(offered.order.offer!.left);
    const taken = O.acceptOrder(offered);
    const frozen = run(taken, 300, true);
    expect(frozen.order.active!.left).toBe(ORDER.windowSeconds);
  });

  test('never two at once, over a long session of accepting, declining and ignoring', () => {
    let cur = ready();
    let accepted = 0;
    let declined = 0;
    let ignored = 0;
    let finished = 0;
    for (let t = 0; t < 3 * 3600; t += 0.2) {
      cur = step(cur);
      expect(cur.order.offer !== null && cur.order.active !== null).toBe(false);
      if (cur.order.active) {
        // half the accepted orders get their pies (a rush), the rest run out
        if (cur.order.made % 2 === 0 && cur.order.active.left < 100) {
          cur = sold(cur, cur.order.active.hood, cur.order.active.target);
          finished++;
        }
      } else if (cur.order.offer && cur.order.offer.left > ORDER.offerWaitSeconds - 0.3) {
        const k = cur.order.made % 3;
        if (k === 0) { cur = O.acceptOrder(cur); accepted++; }
        else if (k === 1) { cur = O.declineOrder(cur); declined++; }
        else ignored++;
      }
      expect(cur.order.offer !== null && cur.order.active !== null).toBe(false);
    }
    expect(accepted).toBeGreaterThan(5);
    expect(declined).toBeGreaterThan(5);
    expect(ignored).toBeGreaterThan(5);
    expect(finished).toBeGreaterThan(0);
    expect(cur.stats.ordersDone).toBe(finished);
    // every order, however it ended, was followed by a full gap
    expect(cur.order.made).toBeLessThanOrEqual(Math.ceil((3 * 3600 - ORDER.firstOfferAtPlay) / ORDER.gapSeconds) + 1);
  });
});

describe('how big an order is', () => {
  test('friendly numbers, never under 20', () => {
    expect([0, 3, 19, 20, 22, 24, 38.4, 97, 99.9].map(O.friendlyTarget)).toEqual([20, 20, 20, 20, 20, 25, 40, 95, 100]);
    expect(O.friendlyTarget(144)).toBe(140);
    expect(O.friendlyTarget(1234)).toBe(1200);
    expect(O.friendlyTarget(15678)).toBe(16000);
    expect(O.friendlyTarget(NaN)).toBe(20);
  });

  test('the shop’s pies a second × 120 s × 1.2, so it scales with the shop', () => {
    const s = ready();
    const rate = (lv: number) => {
      const t = { ...s, shops: { ...s.shops, suburbs: { ...s.shops.suburbs, prep: lv, ovens: lv, counter: lv, drivers: lv + 2, tables: lv } } };
      return { t, target: O.orderTarget(t, 'suburbs'), pps: G.shopRate(t.shops.suburbs, t.vehicle) };
    };
    const lo = rate(5);
    const mid = rate(12);
    const hi = rate(30);
    for (const r of [lo, mid, hi]) expect(r.target).toBe(O.friendlyTarget(r.pps * ORDER.windowSeconds * ORDER.targetMargin));
    expect(hi.pps).toBeGreaterThan(mid.pps);
    expect(mid.pps).toBeGreaterThan(lo.pps);
    expect(hi.target).toBeGreaterThan(mid.target);
    expect(mid.target).toBeGreaterThan(lo.target);
    // waiting alone is a fifth short: the pies at the steady rate in 120 s are under the target
    expect(hi.pps * ORDER.windowSeconds).toBeLessThan(hi.target);
    // and an upgrade made during the order raises the rate enough to catch up
    expect(rate(31).pps * ORDER.windowSeconds).toBeGreaterThan(rate(30).pps * ORDER.windowSeconds);
  });

  test('a shop that does not run itself asks for 24', () => {
    const s = ready();
    const hand = { ...s, shops: { ...s.shops, suburbs: { ...s.shops.suburbs, managed: false, heads: G.noHeads(), prep: 40, ovens: 40 } } };
    expect(O.orderTarget(hand, 'suburbs')).toBe(ORDER.unmanagedTarget);
    expect(ORDER.unmanagedTarget).toBe(24);
  });
});

describe('an order from accept to the end', () => {
  const accepted = () => O.acceptOrder(untilOffer(ready()));

  test('accepting starts the clock and counts pies from now', () => {
    const offered = untilOffer({ ...ready(), shops: { ...ready().shops, suburbs: { ...ready().shops.suburbs, sold: 500 } } });
    const s = O.acceptOrder(offered);
    expect(s.order.offer).toBeNull();
    expect(s.order.active).toMatchObject({ hood: offered.order.offer!.hood, target: offered.order.offer!.target, left: ORDER.windowSeconds });
    expect(O.acceptOrder(s)).toBe(s); // nothing to accept; never two at once
    const a = s.order.active!;
    const mine = sold(s, a.hood, 7);
    expect(O.orderProgress(mine, a)).toBe(7);
    expect(O.orderProgress(sold(s, a.hood, a.target + 99), a)).toBe(a.target);
    // pies sold before accepting do not count
    expect(O.orderProgress(s, a)).toBe(0);
  });

  test('success pays 5 min of income at that moment, counts, flashes and sets the next offer 4 min out', () => {
    const s = accepted();
    const a = s.order.active!;
    const partway = run(sold(s, a.hood, a.target - 1), 10);
    expect(partway.order.active).not.toBeNull();
    const done = step(sold(partway, a.hood, 1));
    expect(done.order.active).toBeNull();
    expect(done.stats.ordersDone).toBe(1);
    const reward = R.minutesToCash(partway, 5);
    expect(reward).toBeGreaterThan(0);
    expect(done.cash).toBeCloseTo(partway.cash + reward, 6);
    expect(done.totalEarned).toBeCloseTo(partway.totalEarned + reward, 6);
    expect(done.order.result).toMatchObject({ kind: 'done', hood: a.hood, left: ORDER.doneShowSeconds });
    expect(done.order.result!.reward).toBeCloseTo(reward, 6);
    expect(done.order.nextAt).toBeCloseTo(done.playSeconds + ORDER.gapSeconds, 6);
    // paid on the income of the day (a better shop pays more), not the one at accept time
    const richer = { ...partway, shops: { ...partway.shops, downtown: { ...partway.shops.downtown, prep: 60, ovens: 60, counter: 60, drivers: 60, tables: 60 } } };
    expect(step(sold(richer, a.hood, 1)).cash - richer.cash).toBeGreaterThan(reward);
    // the flash lasts 2.5 s
    expect(run(done, 2.3).order.result).not.toBeNull();
    expect(run(done, 2.8).order.result).toBeNull();
  });

  test('a boost does not inflate the reward', () => {
    const s = accepted();
    const a = s.order.active!;
    const boosted = { ...s, rewards: { ...s.rewards, boosts: [{ mult: 4, until: Date.now() + 3600_000, source: 'booster' }], lastSeen: 0 } };
    const plain = step(sold(s, a.hood, a.target));
    const withBoost = step(sold(boosted, a.hood, a.target));
    expect(withBoost.cash - boosted.cash).toBeCloseTo(plain.cash - s.cash, 6);
  });

  test('failure after 120 s: a quiet message, no penalty, next offer 4 min out', () => {
    const s = accepted();
    const almost = run(s, ORDER.windowSeconds - 1);
    expect(almost.order.active).not.toBeNull();
    let failed = almost;
    while (failed.order.active) failed = step(failed); // the tick it runs out on
    expect(failed.order.active).toBeNull();
    expect(failed.order.result).toMatchObject({ kind: 'failed', reward: 0, left: ORDER.failShowSeconds });
    expect(failed.cash).toBe(s.cash);
    expect(failed.totalEarned).toBe(s.totalEarned);
    expect(failed.stats.ordersDone).toBe(0);
    expect(failed.order.nextAt).toBeCloseTo(failed.playSeconds + ORDER.gapSeconds, 6);
    expect(ORDER_FAIL_LINE).toBe('So close — next time!');
    expect(run(failed, 2.4).order.result).toBeNull();
  });

  test('the last pie on the last tick still counts', () => {
    const s = accepted();
    const a = s.order.active!;
    const late = { ...sold(s, a.hood, a.target), order: { ...s.order, active: { ...a, left: 0.1 } } };
    expect(step(late).stats.ordersDone).toBe(1);
  });

  test('a quiet tick returns the same state, so memoised panels keep their props', () => {
    const quiet = { ...ready(), playSeconds: 5 };
    expect(O.orderTick(quiet, 0.2, false)).toBe(quiet);
    expect(O.orderTick(quiet, 0.2, true)).toBe(quiet);
  });
});

describe('leaving mid-order', () => {
  const accepted = () => O.acceptOrder(untilOffer(ready()));
  /** What the offline catch-up does to the game: the managed shop sells pies while you are away. */
  const away = (s: G.GameState, pies: number) => sold(s, s.order.active?.hood ?? 'suburbs', pies);

  test('an order whose deadline passed while away is failed silently on return', () => {
    const s = run(accepted(), 30);
    const back = O.returnFromAway(s, away(s, 5000), ORDER.windowSeconds); // away longer than it had left
    expect(back.order.active).toBeNull();
    expect(back.order.result).toBeNull(); // silent
    expect(back.stats.ordersDone).toBe(0);
    expect(back.cash).toBe(s.cash);
    expect(back.order.nextAt).toBe(back.playSeconds + ORDER.gapSeconds);
    // 5000 pies sold while away did not finish it for free
    expect(O.orderProgress(away(s, 5000), s.order.active!)).toBe(s.order.active!.target);
  });

  test('one with time left keeps it minus the time away, and the pies sold meanwhile do not count', () => {
    const s = run(accepted(), 20);
    const a = s.order.active!;
    const after = away(s, 400);
    const back = O.returnFromAway(s, after, 30);
    expect(back.order.active!.left).toBeCloseTo(a.left - 30, 6);
    expect(O.orderProgress(back, back.order.active!)).toBe(O.orderProgress(s, a));
    expect(back.order.active!.target).toBe(a.target);
  });

  test('an offer that would have left by now is gone; one that would not still waits', () => {
    const offered = untilOffer(ready());
    const gone = O.returnFromAway(offered, offered, 60);
    expect(gone.order.offer).toBeNull();
    expect(gone.order.nextAt).toBe(gone.playSeconds + ORDER.gapSeconds);
    const kept = O.returnFromAway(offered, offered, 10);
    expect(kept.order.offer!.left).toBeCloseTo(ORDER.offerWaitSeconds - 10, 6);
    expect(O.returnFromAway(offered, offered, 0)).toBe(offered);
  });

  test('the order survives a save and load; a new session waits a minute for the next offer', () => {
    const s = run(accepted(), 20);
    const back = G.migrate(JSON.parse(JSON.stringify({ ...s, lastSavedAt: T0 })), T0);
    expect(back.order.active).toEqual(s.order.active);
    expect(back.order.offer).toBeNull();
    expect(back.order.result).toBeNull();
    expect(back.order.made).toBe(s.order.made);
    // an offer on the table at save time comes back too, still waiting
    const offered = untilOffer(ready());
    const again = G.migrate(JSON.parse(JSON.stringify(offered)), T0);
    expect(again.order.offer).toEqual(offered.order.offer);
    // next-offer time is never sooner than 60 s into the new session
    const soon = G.migrate(JSON.parse(JSON.stringify({ ...ready(), playSeconds: 1000, order: { ...ready().order, nextAt: 10 } })), T0);
    expect(soon.order.nextAt).toBe(1000 + ORDER.firstOfferAtPlay);
    // …nor absurdly far out
    const far = G.migrate(JSON.parse(JSON.stringify({ ...ready(), playSeconds: 1000, order: { ...ready().order, nextAt: 9e9 } })), T0);
    expect(far.order.nextAt).toBe(1000 + ORDER.gapSeconds);
  });
});

describe('the cast', () => {
  const FILLED = '99.9K';
  test('every neighbourhood has a character, two offers and two thank-yous, each a short curly-quoted line', () => {
    expect(Object.keys(ORDER_CAST).sort()).toEqual(NEIGHBORHOODS.map((n) => n.id).sort());
    const names = Object.values(ORDER_CAST).map((c) => c.who);
    expect(new Set(names).size).toBe(6);
    for (const c of Object.values(ORDER_CAST)) {
      for (const line of [...c.offers.map((l) => l.replace('{n}', FILLED)), ...c.thanks]) {
        expect(line.length).toBeLessThanOrEqual(60);
        expect(line.startsWith('“') && line.endsWith('”')).toBe(true);
        expect(line).not.toMatch(/[‘"']/);
      }
      for (const o of c.offers) expect(o).toContain('{n}');
    }
    expect(ORDER_CAST.suburbs.offers[0]).toBe('“{n} pies for the Mudhens. Two minutes. Go!”');
  });

  test('the offer line carries the real count', () => {
    expect(O.offerLine(ORDER_CAST.suburbs, 0, 40)).toBe('“40 pies for the Mudhens. Two minutes. Go!”');
    expect(O.offerLine(ORDER_CAST.suburbs, 1, 1500)).toContain('1.5K');
  });
});
