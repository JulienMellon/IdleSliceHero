/// <reference types="jest" />
import * as G from '../../engine/game';
import { stationModels, stationViews } from '../sidewalk-model';

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
