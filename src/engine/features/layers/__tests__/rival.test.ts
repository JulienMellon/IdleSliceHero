// The rival (v5.16): it opens after beat 3 (x0.8 on the shop), the challenge's target, win / lose / retry, and old saves.
import { STORY_PACING } from '../../../../content/tuning';
import { RIVAL } from '../../../../content/layers';
import type { NeighborhoodId } from '../../../../content/types';
import { getFeature, withFeatures } from '../../index';
import * as G from '../../../game';
import { challengeWon, rival, rivalOpen, rivalTarget, rivalView, startRivalChallenge } from '../rival';

const NOW = new Date(2026, 10, 9, 9, 0, 0).getTime();
const ID: NeighborhoodId = 'university';
const run = <T>(fn: () => T): T => withFeatures([rival], fn);
const state = (g: G.GameState) => getFeature(g, rival);
const shopOf = (g: G.GameState, id: NeighborhoodId, p: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...p } } });
const ok = (r: G.BuyResult): G.GameState => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
/** University built and running, beat 3 seen: the rival is open. */
const open = (seen: string[] = ['university-3']): G.GameState => ({
  ...shopOf(G.newGame(NOW), ID, { built: true, managed: true, heads: G.allHeads(), prep: 10, ovens: 10, counter: 10, tables: 10, drivers: 5 }),
  seenScenes: seen,
});
/** Sell `n` pies in the shop at once (what the line would have done). */
const sell = (g: G.GameState, n: number): G.GameState => shopOf(g, ID, { sold: g.shops[ID].sold + n });
function play(g: G.GameState, seconds: number): G.GameState {
  for (let i = 0; i < seconds; i++) g = G.playTick(g, 1, NOW);
  return g;
}

describe('opening and the x0.8', () => {
  it('is inactive before the shop is built, and before beat 3', () => {
    run(() => {
      expect(rivalOpen(shopOf(open(), ID, { built: false }), ID)).toBe(false);
      expect(rivalOpen(open([]), ID)).toBe(false);
      expect(rivalOpen(open(['university-2']), ID)).toBe(false);
      expect(rivalOpen(open(), ID)).toBe(true);
      expect(rivalView(open([]), ID, NOW).phase).toBe('none');
    });
  });

  it('takes 20% off that shop’s value while open, and nothing from the others', () => {
    run(() => {
      const on = open();
      const off = open([]);
      const withRival = G.shopEarnings(on, ID);
      expect(withRival).toBeCloseTo(G.shopEarnings(off, ID) * RIVAL.valueMult, 9);
      expect(G.featureMults(on, ID, NOW).value).toBeCloseTo(0.8, 9);
      expect(G.featureMults(on, 'downtown', NOW).value).toBe(1);
      expect(rivalView(on, ID, NOW)).toMatchObject({ open: true, valueMult: 0.8 });
      expect(rivalView(off, ID, NOW).valueMult).toBe(1);
    });
  });

  it('opens in every neighbourhood once its own beat 3 is seen', () => {
    run(() => {
      let g = G.newGame(NOW);
      for (const id of G.HOME_HOOD_IDS) g = shopOf(g, id, { built: true });
      for (const id of G.HOME_HOOD_IDS) {
        expect(rivalOpen(g, id)).toBe(false);
        g = { ...g, seenScenes: [...g.seenScenes, `${id}-3`] };
        expect(rivalOpen(g, id)).toBe(true);
      }
    });
  });
});

describe('the challenge', () => {
  it('asks ceil(5 min x the shop’s current pizza rate x 1.2)', () => {
    run(() => {
      const g = open();
      const rate = G.shopRate(g.shops[ID], g.vehicle);
      expect(rivalTarget(g, ID, NOW)).toBe(Math.ceil(300 * rate * 1.2));
      expect(rivalView(g, ID, NOW)).toMatchObject({ phase: 'available', target: Math.ceil(300 * rate * 1.2) });
      // a faster shop asks for more
      expect(rivalTarget(shopOf(g, ID, { prep: 30, ovens: 30, counter: 30, tables: 30, drivers: 30 }), ID, NOW)).toBeGreaterThan(rivalTarget(g, ID, NOW));
      // at least one pie, even for a shop that sells nothing
      expect(rivalTarget(shopOf(g, ID, { built: true, prep: 1, ovens: 1, counter: 1, tables: 1, drivers: 1, managed: false }), ID, NOW)).toBeGreaterThanOrEqual(
        1,
      );
    });
  });

  it('wins: the rival closes for good and challengeWon is true', () => {
    run(() => {
      let g = ok(startRivalChallenge(open(), ID, NOW));
      const target = state(g).challenge!.target;
      g = sell(g, target);
      g = G.playTick(g, 1, NOW);
      expect(state(g).challenge).toBeNull();
      expect(challengeWon(g, ID)).toBe(true);
      expect(rivalOpen(g, ID)).toBe(false);
      expect(G.featureMults(g, ID, NOW).value).toBe(1);
      expect(G.shopEarnings(g, ID)).toBeCloseTo(G.shopEarnings(open([]), ID), 9);
      expect(rivalView(g, ID, NOW)).toMatchObject({ open: false, won: true, phase: 'none' });
      expect(startRivalChallenge(g, ID, NOW).ok).toBe(false);
      // it stays won
      expect(challengeWon(play(g, 600), ID)).toBe(true);
    });
  });

  it('counts the pies sold since it started, not before', () => {
    run(() => {
      const g = ok(startRivalChallenge(sell(open(), 5000), ID, NOW));
      expect(rivalView(g, ID, NOW).progress).toBe(0);
      const t = state(g).challenge!.target;
      expect(rivalView(sell(g, Math.floor(t / 2)), ID, NOW).progress).toBe(Math.floor(t / 2));
      expect(rivalView(sell(g, t * 2), ID, NOW).progress).toBe(t);
    });
  });

  it('loses when the 5 minutes run out: no cost, rival still open, retry after 2 minutes', () => {
    run(() => {
      let g = ok(startRivalChallenge(open(), ID, NOW));
      const cash = g.cash;
      g = play(g, RIVAL.challengeSeconds - 1);
      expect(rivalView(g, ID, NOW)).toMatchObject({ phase: 'running', secondsLeft: 1 });
      g = play(g, 1);
      expect(state(g).challenge).toBeNull();
      expect(challengeWon(g, ID)).toBe(false);
      expect(rivalOpen(g, ID)).toBe(true);
      expect(g.cash).toBeGreaterThanOrEqual(cash); // nothing was taken
      expect(rivalView(g, ID, NOW)).toMatchObject({ phase: 'retry', retryIn: RIVAL.retrySeconds });
      expect(startRivalChallenge(g, ID, NOW)).toEqual({ ok: false, reason: 'Try again later' });
      // 119 s later still waiting, at 120 s it may start again
      const near = play(g, RIVAL.retrySeconds - 1);
      expect(startRivalChallenge(near, ID, NOW).ok).toBe(false);
      const again = play(near, 1);
      expect(rivalView(again, ID, NOW).phase).toBe('available');
      expect(startRivalChallenge(again, ID, NOW).ok).toBe(true);
    });
  });

  it('waits for the beat-4 gap after beat 3 (C120): a "waiting" phase, and no start before it is over', () => {
    run(() => {
      const gap = STORY_PACING.beat4GapSeconds;
      const at = (play: number): G.GameState => ({ ...open(), sceneAt: { 'university-3': 100 }, playSeconds: play });
      const early = at(100 + gap - 1);
      expect(rivalOpen(early, ID)).toBe(true); // the x0.8 is on from beat 3
      expect(rivalView(early, ID, NOW)).toMatchObject({ open: true, phase: 'waiting' });
      // C125: the waiting view carries the real target, the one the card will ask
      expect(rivalView(early, ID, NOW).target).toBe(rivalTarget(early, ID, NOW));
      expect(rivalView(early, ID, NOW).target).toBeGreaterThan(0);
      expect(startRivalChallenge(early, ID, NOW).ok).toBe(false);
      expect(rivalView(at(100 + gap), ID, NOW).phase).toBe('available');
      expect(startRivalChallenge(at(100 + gap), ID, NOW).ok).toBe(true);
      // Downtown's wait is shorter
      const dt: G.GameState = {
        ...shopOf(open(['downtown-3']), 'downtown', { built: true }),
        sceneAt: { 'downtown-3': 100 },
        playSeconds: 100 + STORY_PACING.downtownBeat4GapSeconds - 1,
      };
      expect(rivalView(dt, 'downtown', NOW).phase).toBe('waiting');
      expect(rivalView({ ...dt, playSeconds: dt.playSeconds + 1 }, 'downtown', NOW).phase).toBe('available');
    });
  });

  it('runs one at a time, and only while the rival is open', () => {
    run(() => {
      const g = ok(startRivalChallenge(open(['university-3', 'downtown-3']), ID, NOW));
      expect(startRivalChallenge(shopOf(g, 'downtown', { built: true }), 'downtown', NOW)).toEqual({ ok: false, reason: 'Already outselling a rival' });
      expect(startRivalChallenge(open([]), ID, NOW).ok).toBe(false);
    });
  });

  it('is play time only: an absence does not run its clock nor count the pies sold meanwhile', () => {
    run(() => {
      const g0 = ok(startRivalChallenge(open(), ID, NOW));
      const g = play(g0, 10);
      const left = state(g).challenge!.left;
      const r = G.applyOffline({ ...g, lastSavedAt: NOW }, NOW + 3600_000);
      expect(r.state.shops[ID].sold).toBeGreaterThan(g.shops[ID].sold);
      expect(state(r.state).challenge!.left).toBe(left);
      expect(rivalView(r.state, ID, NOW).progress).toBe(rivalView(g, ID, NOW).progress);
    });
  });
});

describe('old saves', () => {
  const saved = (seen: string[]) => {
    const g = JSON.parse(JSON.stringify(shopOf(G.newGame(NOW), ID, { built: true })));
    delete g.x;
    g.seenScenes = seen;
    return g;
  };

  it('a v5.15 save with beat 3 seen has the rival open and the challenge to take', () => {
    run(() => {
      const g = G.migrate(saved(['university-1', 'university-2', 'university-3']), NOW);
      expect(state(g)).toEqual({ won: [], challenge: null, retryAt: {} });
      expect(rivalOpen(g, ID)).toBe(true);
      expect(challengeWon(g, ID)).toBe(false);
    });
  });

  it('a v5.15 save with beat 4 seen has the rival closed and the challenge won', () => {
    run(() => {
      const g = G.migrate(saved(['university-1', 'university-2', 'university-3', 'university-4']), NOW);
      expect(challengeWon(g, ID)).toBe(true);
      expect(rivalOpen(g, ID)).toBe(false);
      expect(G.featureMults(g, ID, NOW).value).toBe(1);
      expect(rivalView(g, ID, NOW)).toMatchObject({ open: false, won: true });
      // another neighbourhood in the same save is untouched
      expect(challengeWon(g, 'industrial')).toBe(false);
    });
  });

  it('keeps what a save holds and drops garbage', () => {
    const m = rival.migrate(
      { won: ['uptown', 'nowhere', 'uptown'], challenge: { hood: ID, target: 40, startSold: 7, left: 9999 }, retryAt: { [ID]: 800, downtown: 'x' } },
      NOW,
    );
    expect(m).toEqual({ won: ['uptown'], challenge: { hood: ID, target: 40, startSold: 7, left: RIVAL.challengeSeconds }, retryAt: { [ID]: 800 } });
    expect(rival.migrate({ challenge: { hood: 'x', target: 5, left: 3 } }, NOW).challenge).toBeNull();
    expect(rival.migrate(undefined, NOW)).toEqual({ won: [], challenge: null, retryAt: {} });
  });
});
