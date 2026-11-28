// v5.25 (card T3): the store plays each due ambient beat once: a bark is set for the scene to draw over the head, a banner is a toast, and the beat is stamped in the save.
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

import { COPY } from '../../content/copy/home/ambient';
import { HOME_AMBIENT } from '../../content/cities/home/scenes/ambient';
import { HOME_SCENES } from '../../content/scenes/home';
import * as G from '../../engine/game';
import { useGame } from '../game-store';

/** Every scene seen (so none queues), Waterfront's first at play second 0, and `played` ambient beats already stamped. */
const game = (playSeconds: number, played: string[] = []): G.GameState => {
  const g = G.newGame(Date.now());
  const seen = HOME_SCENES.map((s) => s.id);
  return {
    ...g,
    tutorial: G.TUTORIAL_DONE,
    playSeconds,
    seenScenes: seen,
    sceneAt: { ...Object.fromEntries(seen.map((id) => [id, 0])), ...Object.fromEntries(played.map((k) => [k, 1])) },
  };
};
let clock = Date.now();
/** A head's bubble gap has passed since the last test's beat (the store keeps it in the module). */
const start = (g: G.GameState) => {
  clock += 60_000;
  jest.setSystemTime(clock);
  useGame.setState({ game: g, loaded: true, titleDone: true, playing: null, offline: null, toast: null, ambientBark: null });
};
const stamped = () => HOME_AMBIENT.filter((b) => useGame.getState().game.sceneAt[b.key] !== undefined).map((b) => b.key);

beforeEach(() => {
  jest.useFakeTimers();
  mem.save = null;
});
afterEach(() => jest.useRealTimers());

describe('ambient beats in the store', () => {
  it('a due bark is set once for the scene, with its words and speaker, and stamped in the save', async () => {
    start(game(200));
    useGame.getState().tick(0.1);
    const bark = useGame.getState().ambientBark;
    expect(bark).toMatchObject({ key: 'ambient.wf.1', text: COPY['ambient.wf.1'], speaker: 'Captain Marisol', shop: 'waterfront' });
    expect(stamped()).toEqual(['ambient.wf.1']);
    // not played again, and the next waits a head's bubble gap
    for (let i = 0; i < 10; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().ambientBark).toBe(bark);
    expect(stamped()).toEqual(['ambient.wf.1']);
    // the bark clears itself
    jest.advanceTimersByTime(3000);
    expect(useGame.getState().ambientBark).toBeNull();
    await Promise.resolve();
    await Promise.resolve();
    expect(JSON.parse(mem.save ?? '{}').sceneAt?.['ambient.wf.1']).toBeDefined();
  });

  it('a banner is a toast, and a beat not yet due plays nothing', () => {
    start(game(100));
    useGame.getState().tick(0.1);
    expect(useGame.getState().ambientBark).toBeNull();
    expect(useGame.getState().toast).toBeNull();
    // waterfront-1b's second beat (wf.4) is the banner; the ones before it are stamped
    const before = HOME_AMBIENT.slice(0, 3).map((b) => b.key);
    start(game(400, before));
    useGame.getState().tick(0.1);
    expect(useGame.getState().toast).toMatchObject({ text: COPY['ambient.wf.4'] });
    expect(useGame.getState().ambientBark).toBeNull();
    expect(stamped()).toContain('ambient.wf.4');
    jest.advanceTimersByTime(4000);
    expect(useGame.getState().toast).toBeNull();
  });

  it('waits while a scene plays, the title card is up or the welcome-back popup is open', () => {
    start(game(200));
    useGame.setState({ titleDone: false });
    useGame.getState().tick(0.1);
    expect(useGame.getState().ambientBark).toBeNull();
    useGame.setState({ titleDone: true, offline: { earned: 1 } as never });
    useGame.getState().tick(0.1);
    expect(useGame.getState().ambientBark).toBeNull();
    useGame.setState({ offline: null });
    useGame.getState().tick(0.1);
    expect(useGame.getState().ambientBark).not.toBeNull();
  });
});
