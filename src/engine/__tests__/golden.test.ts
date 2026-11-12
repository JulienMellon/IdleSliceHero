// Golden run: a fixed script of purchases and ticks, then an offline catch-up. The hash pins the whole state,
// so any refactor that changes what the player sees or earns fails here. Do not edit the constant to make a
// refactor pass; change it only for an intended balance change.
import { createHash } from 'crypto';
import * as G from '../game';
import { NONNA_TAKEOVER } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';

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
    const b = G.buildShop({ ...g, cash: 1e12 }, id);
    if (!b.ok) throw new Error(`${id}: ${b.reason}`);
    g = { ...b.state, cash: g.cash };
  }
  const script: [NeighborhoodId, G.Upgrade][] = [
    ['downtown', 'prep'], ['downtown', 'ovens'], ['downtown', 'counter'], ['downtown', 'drivers'], ['downtown', 'tables'],
    ['downtown', 'prep'], ['downtown', 'ovens'], ['downtown', 'counter'], ['downtown', 'headPrep'], ['downtown', 'headOven'],
    ['suburbs', 'prep'], ['suburbs', 'ovens'], ['suburbs', 'counter'], ['suburbs', 'drivers'], ['suburbs', 'tables'],
    ['suburbs', 'prep'], ['suburbs', 'ovens'], ['suburbs', 'counter'], ['suburbs', 'headPrep'], ['suburbs', 'headOven'],
    ['suburbs', 'headCounter'], ['suburbs', 'manager'], ['downtown', 'headCounter'], ['downtown', 'grade'], ['suburbs', 'grade'],
    ['waterfront', 'prep'], ['waterfront', 'ovens'], ['waterfront', 'counter'], ['waterfront', 'drivers'], ['waterfront', 'tables'],
    ['waterfront', 'headPrep'], ['waterfront', 'headOven'], ['downtown', 'expand'], ['suburbs', 'expand'], ['downtown', 'drivers'],
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
    const json = JSON.stringify(rest, (k, v) => (k === 'x' ? undefined : v));
    expect(sha1(json)).toBe('cff4162945b6c57433d314ba1b4c61ee7fb236da');
  });

  it('golden: the run really earned something (guards against an empty script)', () => {
    const { state, offline } = goldenRun();
    expect(state.stats.upgrades).toBeGreaterThanOrEqual(30);
    expect(offline.seconds).toBe(3 * 3600);
    expect(state.shops.suburbs.sold).toBeGreaterThan(0);
  });
});
