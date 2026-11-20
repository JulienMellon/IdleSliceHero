/// <reference types="jest" />
import * as G from '../../../engine/game';
import { rewardsUnlocked } from '../../../engine/rewards';
import { diamondChipText } from '../diamond-chip-model';

const fresh = (): G.GameState => G.newGame(1_700_000_000_000);
const takenOver = (): G.GameState => {
  const g = fresh();
  return { ...g, seenScenes: [...g.seenScenes, 'downtown-4'] };
};

describe('the diamond chip (DECISIONS #47)', () => {
  test('hidden on a fresh save: no takeover, no Starter Pack offered', () => {
    expect(rewardsUnlocked(fresh())).toBe(false);
    expect(diamondChipText(fresh(), false)).toBe('');
  });

  test('shown once the Starter Pack has been offered, bought or "Not now", with 0 diamonds', () => {
    expect(diamondChipText(fresh(), true)).toBe('0');
  });

  test('shown after the takeover on an old save that never saw the sheet', () => {
    expect(rewardsUnlocked(takenOver())).toBe(true);
    expect(diamondChipText(takenOver(), false)).toBe('0');
  });

  test('it reads the diamond count', () => {
    const g = fresh();
    expect(diamondChipText({ ...g, rewards: { ...g.rewards, diamonds: 42.9 } }, true)).toBe('42');
  });
});
