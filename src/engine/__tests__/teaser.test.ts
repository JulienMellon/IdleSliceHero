/// <reference types="jest" />
import { HOME_SCENES } from '../../content/scenes/home';
import { PIER9_BID } from '../../content/tuning';
import * as G from '../game';
import { commas, nextSceneTeaser, ringStep, TEASER_COMPLETE } from '../teaser';

const T0 = new Date(2026, 10, 11, 12, 0, 0).getTime();

/** A game that has seen every scene before `id`. */
function before(id: string, patch: Partial<G.GameState> = {}): G.GameState {
  const idx = HOME_SCENES.findIndex((s) => s.id === id);
  return { ...G.newGame(T0), seenScenes: HOME_SCENES.slice(0, idx).map((s) => s.id), ...patch };
}
const withShop = (s: G.GameState, id: G.GameState['active'], patch: Partial<G.Shop>): G.GameState => ({ ...s, shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } } });

describe('nextSceneTeaser: one test per trigger kind', () => {
  test('deliveries: the character and the pies to go, never the scene', () => {
    // suburbs-2 waits for 300 Suburbs pies
    const s = withShop(before('suburbs-2'), 'suburbs', { built: true, sold: 100 });
    const t = nextSceneTeaser(s);
    expect(t.kind).toBe('deliveries');
    expect(t.text).toBe("Next: Dale's story continues after 200 more Suburbs pies");
    expect(t.progress).toBeCloseTo(100 / 300);
    expect(t.step).toBe(6);
  });

  test('deliveries: thousands get a comma; the last pie is singular', () => {
    const s = withShop(before('suburbs-3'), 'suburbs', { built: true, sold: 800 });
    expect(nextSceneTeaser(s).text).toBe("Next: Dale's story continues after 1,200 more Suburbs pies");
    const one = withShop(before('suburbs-3'), 'suburbs', { built: true, sold: 1999 });
    expect(nextSceneTeaser(one).text).toBe("Next: Dale's story continues after 1 more Suburbs pie");
  });

  test('unlock: the shop is not built yet', () => {
    const s = before('waterfront-1', { cash: 0 });
    const t = nextSceneTeaser(s);
    expect(t.kind).toBe('unlock');
    expect(t.text).toBe("Next: Marisol's story continues when you build Waterfront");
  });

  test('unlock: progress is the cash toward the build once nothing else locks it', () => {
    const s = withShop(before('waterfront-1'), 'suburbs', { built: true });
    expect(G.buildLock(s, 'waterfront')).toBeNull();
    const t = nextSceneTeaser({ ...s, cash: G.def('waterfront').buildCost / 2 });
    expect(t.progress).toBeCloseTo(0.5);
    expect(t.step).toBe(10);
    // locked behind the shop before it: no progress to show
    expect(nextSceneTeaser(before('waterfront-1', { cash: 1e15 })).progress).toBe(0);
  });

  test('bid: Marisol waits for the Pier 9 bid', () => {
    const s = withShop(before('waterfront-4'), 'waterfront', { built: true, sold: PIER9_BID.unlockPizzas / 2, perk: false });
    const t = nextSceneTeaser(s);
    expect(t.kind).toBe('bid');
    expect(t.text).toBe("Next: Marisol's story continues when you bid on Pier 9");
    expect(t.progress).toBeCloseTo(0.5);
  });

  test('a scene already due is "in a moment" at a full ring', () => {
    const s = withShop(before('suburbs-2'), 'suburbs', { built: true, sold: 5000 });
    const t = nextSceneTeaser(s);
    expect(t.kind).toBe('soon');
    expect(t.text).toBe("Next: Dale's story continues in a moment");
    expect(t.step).toBe(20);
  });

  test('nothing left', () => {
    const s = { ...G.newGame(T0), seenScenes: HOME_SCENES.map((x) => x.id) };
    expect(nextSceneTeaser(s)).toEqual({ kind: 'complete', text: TEASER_COMPLETE, progress: 1, step: 0 });
    expect(TEASER_COMPLETE).toBe('The story is complete (for now)');
  });

  test('the line never contains scene content: only the character’s name and the condition', () => {
    for (const sc of HOME_SCENES) {
      const idx = HOME_SCENES.indexOf(sc);
      const s = { ...G.newGame(T0), seenScenes: HOME_SCENES.slice(0, idx).map((x) => x.id) };
      const text = nextSceneTeaser(s).text;
      expect(text.startsWith('Next: ')).toBe(true);
      expect(text).not.toContain(sc.title);
    }
  });
});

describe('the ring', () => {
  test('whole 5% steps, rounded down; full only at 100%', () => {
    expect([0, 0.04, 0.05, 0.249, 0.5, 0.999, 1, 2, -1, NaN].map(ringStep)).toEqual([0, 0, 1, 4, 10, 19, 20, 20, 0, 0]);
  });
  test('commas', () => {
    expect([5, 999, 1200, 12400, 999999, 2500000].map(commas)).toEqual(['5', '999', '1,200', '12,400', '999,999', '2.5M']);
  });
});
