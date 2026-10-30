/// <reference types="jest" />
import * as G from '../../engine/game';
import { buttonTone, stationModels, stationViews } from '../sidewalk-model';

const shopState = (patch: Partial<G.Shop>, cash = 0): G.GameState => {
  const s = G.newGame(0);
  return { ...s, cash, shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, ...patch } } };
};
const view = (s: G.GameState, key: string) => stationViews(s, 'downtown').find((v) => v.key === key)!;

describe('sidewalk station model (T39)', () => {
  test('a useful bottleneck you cannot afford yet is dashed; affordable, it is solid', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 0);
    expect(view(s, 'drivers').neck).toBe(true);
    expect(view(s, 'drivers').frame).toBe('waiting');
    expect(view({ ...s, cash: 1e9 }, 'drivers').frame).toBe('hot');
  });
  test('an unlocked station that adds nothing is "nogain"; a locked one says MAX and stays normal', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 1e9);
    expect(view(s, 'prep').tone).toBe('nogain');
    const capped = shopState({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, 1e9);
    expect(view(capped, 'prep').label).toBe('MAX');
    expect(view(capped, 'prep').tone).toBe('normal');
  });
  test('cash changes only affordability: the level part is cached and reused', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 0);
    const a = stationModels(s, 'downtown');
    expect(stationModels({ ...s, cash: 5e6 }, 'downtown')).toBe(a);
    expect(stationModels(shopState({ prep: 21, ovens: 20, counter: 20, drivers: 1 }), 'downtown')).not.toBe(a);
  });
});

describe('saving progress (T46)', () => {
  test('only the bottleneck being saved for has progress, between 0 and 1, never NaN', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 0);
    const cost = view(s, 'drivers').cost!;
    expect(view({ ...s, cash: cost / 2 }, 'drivers').progress).toBeCloseTo(0.5, 6);
    expect(view({ ...s, cash: cost / 2 }, 'prep').progress).toBe(0);
    expect(view({ ...s, cash: cost * 3 }, 'drivers').progress).toBe(0); // affordable: solid, not saving
    for (const v of stationViews(s, 'downtown')) expect(Number.isNaN(v.progress)).toBe(false);
  });
});

describe('one button-tone rule for the sidewalk and the drawer (T42)', () => {
  test('a locked or maxed upgrade is never "no gain"', () => {
    expect(buttonTone({ lock: 'Expand to go past Lv 25', gain: null })).toBe('normal');
    expect(buttonTone({ lock: true, gain: 0 })).toBe('normal');
  });
  test('an unlocked upgrade that adds nothing is "no gain"; one that adds income is normal', () => {
    expect(buttonTone({ lock: null, gain: 0 })).toBe('nogain');
    expect(buttonTone({ lock: null, gain: null })).toBe('nogain');
    expect(buttonTone({ lock: null, gain: 2 })).toBe('normal');
  });
  test('a muted card (no manager yet) stays neutral', () => {
    expect(buttonTone({ lock: null, gain: 0, muted: true })).toBe('neutral');
  });
});
