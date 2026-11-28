// C135 (T104): the welcome-back popup that is still open when the app goes to the background and comes back soon is kept, with the
// same `earned`, and its cash is neither lost nor counted twice (the save carries it; the load holds it back again).
const mem: { save: string | null } = { save: null };
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (k: string) => (k.includes('save') ? mem.save : null),
    setItem: async (k: string, v: string) => {
      if (k.includes('save')) mem.save = v;
    },
    removeItem: async (k: string) => {
      if (k.includes('save')) mem.save = null;
    },
  },
}));
jest.mock('../../services', () => ({
  analytics: { track: () => {} },
  EVENTS: {},
  onGrant: () => () => {},
  purchases: { owned: () => [] },
  startServices: async () => {},
}));

import * as G from '../../engine/game';
import { offlineOffer } from '../../engine/offers';
import { useGame } from '../game-store';

/** A save written an hour ago with Downtown running itself. */
const awayAnHour = (paidUntilAhead = 0): string => {
  const now = Date.now();
  const g = G.newGame(now - 3_600_000);
  const downtown = { ...g.shops.downtown, built: true, managed: true, heads: G.allHeads(), prep: 5, ovens: 5, counter: 5, drivers: 3, tables: 5, sold: 50 };
  const saved = {
    ...g,
    cash: 1000,
    totalEarned: 1000,
    tutorial: G.TUTORIAL_DONE,
    seenScenes: ['downtown-1', 'downtown-4'],
    shops: { ...g.shops, downtown },
    lastSavedAt: now - 3_600_000,
    rewards: { ...g.rewards, paidUntil: paidUntilAhead > 0 ? now + paidUntilAhead : 0 },
  };
  return JSON.stringify(saved);
};

describe('a short background with the welcome-back popup open (C135)', () => {
  it('keeps the popup and its earned amount, and the cash is held back once, not twice', async () => {
    mem.save = awayAnHour();
    await useGame.getState().load();
    const popup = useGame.getState().offline;
    expect(popup).not.toBeNull();
    expect(popup!.earned).toBeGreaterThan(1);
    const held = useGame.getState().game.cash;

    // to the background and back, within a moment: the save carries the held-back cash
    await useGame.getState().save();
    const savedCash = (JSON.parse(mem.save as string) as { cash: number }).cash;
    expect(savedCash).toBeCloseTo(held + popup!.earned, 6);
    await useGame.getState().load();

    const after = useGame.getState();
    expect(after.offline).not.toBeNull();
    expect(after.offline!.earned).toBe(popup!.earned);
    // held back again: no more than a moment of income away from where it was, never short by `earned` and never over by it
    expect(Math.abs(after.game.cash - held)).toBeLessThan(popup!.earned / 100);

    // collecting pays it once
    after.dismissOffline();
    expect(useGame.getState().offline).toBeNull();
    expect(Math.abs(useGame.getState().game.cash - (held + popup!.earned))).toBeLessThan(popup!.earned / 100);
  });
});

describe('the popup carries the engine’s boost (v5.25, card E9)', () => {
  it('a diamond booster that covered the whole hour makes it 2x, so the 2x ad is not offered on top', async () => {
    mem.save = awayAnHour();
    await useGame.getState().load();
    const plain = useGame.getState().offline!;
    expect(plain.boost).toBe(1);
    mem.save = awayAnHour(5 * 3_600_000);
    await useGame.getState().load();
    const paid = useGame.getState().offline!;
    expect(paid.boost).toBeCloseTo(2, 9);
    expect(paid.earned).toBeCloseTo(plain.earned * 2, 4);
    expect(offlineOffer(paid.boost, paid.doubled)).toBe(false);
    expect(offlineOffer(plain.boost, plain.doubled)).toBe(true);
  });
});
