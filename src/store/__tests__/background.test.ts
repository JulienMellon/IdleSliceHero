// 4a: while the app is in the background the game tick does nothing; it plays again when the app is back.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

import { isForeground } from '../../components/app-state-model';
import { useGame } from '../game-store';

describe('background tick', () => {
  beforeEach(() => {
    useGame.setState({ loaded: true, background: false });
  });

  it('plays game time in the foreground and none in the background', () => {
    const t0 = useGame.getState().game.playSeconds;
    useGame.getState().tick(0.2);
    const t1 = useGame.getState().game.playSeconds;
    expect(t1).toBeGreaterThan(t0);

    useGame.getState().setBackground(true);
    useGame.getState().tick(0.2);
    useGame.getState().tick(0.2);
    expect(useGame.getState().game.playSeconds).toBe(t1);

    useGame.getState().setBackground(false);
    useGame.getState().tick(0.2);
    expect(useGame.getState().game.playSeconds).toBeGreaterThan(t1);
  });

  it('only "background" counts as background: inactive (Control Center) keeps the game going', () => {
    expect(isForeground('active')).toBe(true);
    expect(isForeground('inactive')).toBe(true);
    expect(isForeground('background')).toBe(false);
  });
});
