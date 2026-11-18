// C144, C148: a franchise asked for while a load is reading the save waits for it, and says no for now, so the flow stays on its screen.
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
jest.mock('../../services', () => ({
  analytics: { track: () => {} },
  EVENTS: {},
  onGrant: () => () => {},
  purchases: { owned: () => [] },
  startServices: async () => {},
}));

import { HOME_CITY } from '../../content/cities/home';
import { canFranchise } from '../../engine/features/franchise';
import { finaleId, newGame } from '../../engine/game';
import { useGame } from '../game-store';

const FINALE = finaleId(HOME_CITY.neighbourhoods[HOME_CITY.neighbourhoods.length - 1].id);

describe('franchise() during a load (C148)', () => {
  it('returns false while the load runs, then franchises once it has put the game in place', async () => {
    await useGame.getState().load();
    const g = useGame.getState().game;
    useGame.setState({ game: { ...g, seenScenes: [...g.seenScenes, FINALE] } });
    expect(canFranchise(useGame.getState().game)).toBe(true);
    await useGame.getState().save();
    let release = () => {};
    mem.gate = new Promise<void>((r) => (release = r));
    const loading = useGame.getState().load();
    expect(useGame.getState().franchise()).toBe(false); // held: the flow stays where it is
    expect(useGame.getState().game.city).toBe('home');
    mem.gate = null;
    release();
    await loading;
    expect(useGame.getState().game.city).not.toBe('home');
  });

  it('with no load running it franchises at once and says yes', async () => {
    const g = newGame(Date.now());
    useGame.setState({ game: { ...g, seenScenes: [...g.seenScenes, FINALE] } });
    expect(useGame.getState().franchise()).toBe(true);
    expect(useGame.getState().game.city).not.toBe('home');
  });
});
