// C127 (T100): a grant or an ad benefit that arrives while a load is reading the save lands after it, never under it.
// C129 (T102): Start over keeps what the player paid for.
const mem: { save: string | null; gate: Promise<void> | null } = { save: null, gate: null };
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (k: string) => {
      if (mem.gate) await mem.gate;
      return k.includes('save') ? mem.save : null;
    },
    setItem: async (k: string, v: string) => {
      if (k.includes('save')) mem.save = v;
    },
    removeItem: async (k: string) => {
      if (k.includes('save')) mem.save = null;
    },
  },
}));
const owned: string[] = [];
jest.mock('../../services', () => ({
  analytics: { track: () => {} },
  EVENTS: {},
  onGrant: () => () => {},
  purchases: { owned: () => owned },
  startServices: async () => {},
}));

import { GRANTS } from '../../services/grants';
import { applyGrant } from '../../components/store/store-model';
import { bonusBlocked as blocked, useGame } from '../game-store';
import { standingGrants } from '../standing';

const at = Date.now();

describe('a grant during a load (C127)', () => {
  it('lands after the load, on top of the older save', async () => {
    await useGame.getState().load(); // wires the store
    await useGame.getState().save();
    const older = JSON.parse(mem.save as string) as { rewards: { diamonds: number } };
    expect(older.rewards.diamonds).toBe(0);
    let release = () => {};
    mem.gate = new Promise<void>((r) => (release = r));
    const loading = useGame.getState().load();
    useGame.getState().receiveGrant(GRANTS.diamonds_500);
    expect(useGame.getState().game.rewards.diamonds).toBe(0); // held, not applied under the load
    mem.gate = null;
    release();
    await loading;
    expect(useGame.getState().game.rewards.diamonds).toBe(500);
    await useGame.getState().save();
    expect((JSON.parse(mem.save as string) as { rewards: { diamonds: number } }).rewards.diamonds).toBe(500);
  });

  it('with no load running, a grant lands at once', () => {
    const before = useGame.getState().game.rewards.diamonds;
    useGame.getState().receiveGrant(GRANTS.diamonds_80);
    expect(useGame.getState().game.rewards.diamonds).toBe(before + 80);
  });
});

describe('Start over keeps what was paid for (C129)', () => {
  it('standing grants hold only the awning and Plus, never diamonds or the boost', () => {
    expect(standingGrants(['starter_pack', 'nonnas_plus'])).toEqual([
      { diamonds: 0, cosmetic: 'awning-founder' },
      { diamonds: 0, plus: true },
    ]);
    expect(standingGrants([])).toEqual([]);
  });

  it('a reset after the Starter Pack still wears the Founder awning', async () => {
    owned.splice(0, owned.length, 'starter_pack');
    useGame.setState({ game: applyGrant(useGame.getState().game, GRANTS.starter_pack, at) });
    expect(useGame.getState().game.rewards.cosmetics).toContain('awning-founder');
    await useGame.getState().resetGame();
    const r = useGame.getState().game.rewards;
    expect(r.cosmetics).toContain('awning-founder');
    expect(r.worn).toContain('awning-founder');
    expect(r.diamonds).toBe(0);
    expect(r.boosts).toEqual([]);
  });

  it('a reset with nothing owned starts bare', async () => {
    owned.splice(0, owned.length);
    await useGame.getState().resetGame();
    expect(useGame.getState().game.rewards.cosmetics).not.toContain('awning-founder');
  });
});

describe('bonusBlocked (C124, T96)', () => {
  const calm = { playing: null, offline: null, titleDone: true, bonusHold: false, layerHold: false };
  it('holds for a layer card, a drawer, a scene, the popup and the title card; passes when none is up', () => {
    const bonusBlocked = blocked;
    expect(bonusBlocked(calm)).toBe(false);
    expect(bonusBlocked({ ...calm, layerHold: true })).toBe(true);
    expect(bonusBlocked({ ...calm, bonusHold: true })).toBe(true);
    expect(bonusBlocked({ ...calm, titleDone: false })).toBe(true);
  });
});
