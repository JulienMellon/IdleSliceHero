// Golden run: a fixed script of purchases and ticks, then an offline catch-up. The hash pins the whole state,
// so any refactor that changes what the player sees or earns fails here. Do not edit the constant to make a
// refactor pass; change it only for an intended balance change.
import { createHash } from 'crypto';
import '../features'; // the registry is filled by importing it (A31): the recorded hash is with the shipped features
import * as G from '../game';
import type { NeighborhoodId } from '../../content/types';

import { NONNA_TAKEOVER } from '../../content/cities/home/fit';
const T0 = 1_700_000_000_000;
const THREE_HOURS_MS = 3 * 3600 * 1000;

function buy(s: G.GameState, id: NeighborhoodId, what: G.Upgrade): G.GameState {
  const r = G.buyUpgrade({ ...s, cash: s.cash + 1e12 }, id, what);
  if (!r.ok) throw new Error(`${id}/${what}: ${r.reason}`);
  return { ...r.state, cash: s.cash };
}

export function goldenRun(): { state: G.GameState; offline: G.OfflineResult } {
  let g = G.newGame(T0);
  // Nonna's takeover is out of the way, so Suburbs can be built right away
  g = { ...g, cash: 1e12, seenScenes: [NONNA_TAKEOVER.sceneId] };
  for (const id of ['suburbs', 'waterfront'] as const) {
    // the next shop waits for the story of the one before it (v5.21, E1b): its beat 3 is out of the way for the build only, so the recorded state is as it was
    const b = G.buildShop({ ...g, cash: 1e12, seenScenes: [...g.seenScenes, 'suburbs-3'] }, id);
    if (!b.ok) throw new Error(`${id}: ${b.reason}`);
    g = { ...b.state, cash: g.cash, seenScenes: g.seenScenes };
  }
  const script: [NeighborhoodId, G.Upgrade][] = [
    ['downtown', 'prep'],
    ['downtown', 'ovens'],
    ['downtown', 'counter'],
    ['downtown', 'drivers'],
    ['downtown', 'tables'],
    ['downtown', 'prep'],
    ['downtown', 'ovens'],
    ['downtown', 'counter'],
    ['downtown', 'headPrep'],
    ['downtown', 'headOven'],
    ['suburbs', 'prep'],
    ['suburbs', 'ovens'],
    ['suburbs', 'counter'],
    ['suburbs', 'drivers'],
    ['suburbs', 'tables'],
    ['suburbs', 'prep'],
    ['suburbs', 'ovens'],
    ['suburbs', 'counter'],
    ['suburbs', 'headPrep'],
    ['suburbs', 'headOven'],
    ['suburbs', 'headCounter'],
    ['suburbs', 'manager'],
    ['downtown', 'headCounter'],
    ['downtown', 'grade'],
    ['suburbs', 'grade'],
    ['waterfront', 'prep'],
    ['waterfront', 'ovens'],
    ['waterfront', 'counter'],
    ['waterfront', 'drivers'],
    ['waterfront', 'tables'],
    ['waterfront', 'headPrep'],
    ['waterfront', 'headOven'],
    ['downtown', 'expand'],
    ['suburbs', 'expand'],
    ['downtown', 'drivers'],
  ];
  for (const [id, what] of script) g = buy(g, id, what);
  const v = G.buyVehicle({ ...g, cash: 1e12 });
  if (v.ok) g = { ...v.state, cash: g.cash };
  const d = G.buyDecor({ ...g, cash: 1e12 }, 'downtown', 'plants');
  if (d.ok) g = { ...d.state, cash: g.cash };
  for (let i = 0; i < 900; i++) {
    if (i % 7 === 0) g = G.tapShop(g, 'downtown');
    g = G.playTick(g, 1, T0 + i * 1000);
  }
  const offline = G.applyOffline({ ...g, lastSavedAt: T0 }, T0 + THREE_HOURS_MS);
  return { state: offline.state, offline };
}

const sha1 = (s: string) => createHash('sha1').update(s).digest('hex');

describe('golden run', () => {
  it('golden: 30 purchases, 900 ticks and a 3 h offline catch-up hash to the recorded state', () => {
    const { state } = goldenRun();
    // the timestamps we set ourselves are not part of the state hash; the run touches nothing else of wall time
    const { lastSavedAt: _t, ...rest } = state;
    void _t;
    // v5.18 (card K1): `city` ('home') is new on GameState and, like `x`, not part of the recorded hash; the constant below is unchanged.
    const json = JSON.stringify(rest, (k, v) => (k === 'x' || k === 'city' ? undefined : v));
    // v5.25 re-record 2 (card E10): `renovation` (every shop at level 0, no decor) is new on GameState, milestone [25] and room x1.1, the stars' prices, the Home tables: the same 30 purchases, 900 ticks and 3 h away.
    // v5.25 re-record (card E8): ECONOMY 4 (the new curve: station prices, one pizza per tap, Marco $150, the ladder); the run is the same 30 purchases, 900 ticks and 3 h away.
    // v5.24 re-record (card E7): SAVE_VERSION 9 → 10 and `rewards.setsDone` ([]) is new; nothing else moved (the same run hashes to the old constant with `saveVersion` set back to 9 and `setsDone` removed).
    // v5.23 re-record (card E5): SAVE_VERSION 8 → 9 and `rewards.paidUntil` (0) is new; nothing else moved (the same run hashes to the old constant with `saveVersion` set back to 8 and `paidUntil` removed).
    // v5.21 re-record (card E1): SAVE_VERSION 7 → 8 (the chapters' slice, which `x` leaves out of the hash); nothing else moved (the same run hashes to the old constant with `saveVersion` set back to 7).
    // v5.20 re-record (card C3): SAVE_VERSION 6 → 7 (the 15-step tutorial); nothing else moved (the same run hashes to the old constant with `saveVersion` set back to 6).
    // v5.16 re-record 2 (card E2b's refit): Downtown's head prices, Suburbs' build and manager, Waterfront's manager, University's build, Uptown's build and manager, and the Golden oven and Flagship prices changed. v5.16 re-record: ECONOMY 3, the heads/manager/station prices and the offline share changed the run. (v5.15 re-record: the save gained `economy` (C106) and `rewards.worn` (worn cosmetics). The golden run itself earns the same cash and buys the same things.)
    expect(sha1(json)).toBe('bfaae3551973b57c79295d0fe77a536dc8be9d0e');
  });

  it('golden: the run really earned something (guards against an empty script)', () => {
    const { state, offline } = goldenRun();
    expect(state.stats.upgrades).toBeGreaterThanOrEqual(30);
    expect(offline.seconds).toBe(3 * 3600);
    expect(state.shops.suburbs.sold).toBeGreaterThan(0);
  });
});
