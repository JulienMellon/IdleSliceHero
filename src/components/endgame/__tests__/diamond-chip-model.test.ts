/// <reference types="jest" />
import * as G from '../../../engine/game';
import { rewardsUnlocked } from '../../../engine/rewards';
import { chipDot, chipShows, diamondChipText, shopHref, storeFrom, tabFromParam } from '../diamond-chip-model';

const STORE_INTRO_START = G.STORE_INTRO_START;
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

describe('the chip from the Store intro (v5.23, card U5)', () => {
  const at = (tutorial: number): G.GameState => ({ ...fresh(), tutorial });

  test('hidden before the Store intro, shown from step 16 on with the Starter Pack never offered', () => {
    expect(STORE_INTRO_START).toBe(16);
    expect(chipShows(at(15), false)).toBe(false);
    expect(diamondChipText(at(15), false)).toBe('');
    expect(chipShows(at(STORE_INTRO_START), false)).toBe(true);
    expect(diamondChipText(at(STORE_INTRO_START), false)).toBe('0');
    // later steps (E6 moves TUTORIAL_DONE to 18) keep it
    expect(chipShows(at(18), false)).toBe(true);
  });

  test('a save that saw the old pop-up (starterOffered) or took over keeps its chip whatever the step', () => {
    expect(chipShows(at(3), true)).toBe(true);
    expect(chipShows({ ...takenOver(), tutorial: 3 }, false)).toBe(true);
  });

  test('the dot: at the takeover, with no Starter Pack, until the Shop has been opened after it', () => {
    expect(chipDot(takenOver(), false)).toBe(true);
    expect(chipDot(takenOver(), true)).toBe(false);
    expect(chipDot(at(STORE_INTRO_START), false)).toBe(false); // the intro has the coach's hand, not a dot
    const owned = takenOver();
    expect(chipDot({ ...owned, rewards: { ...owned.rewards, cosmetics: [...owned.rewards.cosmetics, 'awning-founder'] } }, false)).toBe(false);
  });

  test('the chip opens the Store tab while the intro is up and while the Starter Pack is unowned (D558: after "Not now", one tap to the pack)', () => {
    expect(shopHref(at(STORE_INTRO_START))).toBe('/shop?tab=store&from=intro');
    expect(shopHref(at(18))).toBe('/shop?tab=store&from=chip');
    expect(shopHref(takenOver())).toBe('/shop?tab=store&from=chip');
  });

  test('an owner of the Starter Pack gets the Shop on its first tab', () => {
    const g = at(18);
    const owned = { ...g, rewards: { ...g.rewards, cosmetics: [...g.rewards.cosmetics, 'awning-founder'] } };
    expect(shopHref(owned)).toBe('/shop?from=chip');
  });

  test('route params: tab=store opens tab 2, from says how, anything else is the first tab and the chip', () => {
    expect(tabFromParam('store')).toBe(2);
    expect(tabFromParam('boosters')).toBe(1);
    expect(tabFromParam(undefined)).toBe(0);
    expect(tabFromParam('nonsense')).toBe(0);
    expect(storeFrom('intro')).toBe('intro');
    expect(storeFrom('nudge')).toBe('nudge');
    expect(storeFrom('?')).toBe('chip');
    expect(storeFrom(undefined)).toBe('chip');
  });
});
