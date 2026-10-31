/// <reference types="jest" />
import { money } from '../../engine/format';
import * as G from '../../engine/game';
import { buildChipHint, bundleButton, buttonTone, buyBundle, needText, stationModels, stationViews } from '../sidewalk-model';

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

describe('"need $X" instead of a struck price (D359)', () => {
  test('the shortfall is cost minus cash, rounded up, and never "need $0"', () => {
    expect(needText(100, 40)).toBe('need $60');
    expect(needText(100, 99.2)).toBe('need $1');
    expect(needText(5180, 1180)).toBe('need $4K');
  });
  test('nothing is needed when the player has enough or there is nothing to buy', () => {
    expect(needText(100, 100)).toBeNull();
    expect(needText(100, 250)).toBeNull();
    expect(needText(null, 0)).toBeNull();
  });
  test('an unaffordable station carries its shortfall; an affordable or maxed one does not', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 0);
    const v = view(s, 'drivers');
    expect(v.need).toBe(`need ${money(v.cost!)}`);
    expect(view({ ...s, cash: 1e9 }, 'drivers').need).toBeNull();
    const capped = shopState({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, 0);
    expect(view(capped, 'prep').need).toBeNull(); // MAX has no price to be short of
  });
  test('the shortfall shrinks as cash arrives', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 0);
    const cost = view(s, 'drivers').cost!;
    expect(view({ ...s, cash: cost - 3 }, 'drivers').need).toBe('need $3');
  });
});

describe('the tied-station bundle as a button (D304)', () => {
  const tied = (cash: number) => {
    const s = shopState({ prep: 3, ovens: 3, counter: 3, drivers: 3 }, cash);
    const hint = G.bundleHint(s, 'downtown');
    return { s, hint };
  };
  test('names its price and what it buys; enabled only when affordable', () => {
    const { hint } = tied(0);
    expect(hint).not.toBeNull();
    const poor = bundleButton(hint!, 0);
    expect(poor.label).toMatch(/^Buy (both|all \d) · \$/);
    expect(poor.label).toContain(money(hint!.cost));
    expect(poor.enabled).toBe(false);
    expect(poor.sub).toContain('need ');
    const rich = bundleButton(hint!, hint!.cost);
    expect(rich.enabled).toBe(true);
    expect(rich.sub).toContain(hint!.label);
  });
  test('buyBundle runs every step through the buy path and stops at the first refusal', () => {
    const bought: G.Upgrade[] = [];
    expect(buyBundle(['prep', 'ovens'], (w) => (bought.push(w), true))).toBe(true);
    expect(bought).toEqual(['prep', 'ovens']);
    const seen: G.Upgrade[] = [];
    expect(buyBundle(['prep', 'ovens'], (w) => (seen.push(w), false))).toBe(false);
    expect(seen).toEqual(['prep']);
    expect(buyBundle([], () => true)).toBe(false);
  });
  test('buying the hint\'s steps one by one costs exactly the hint\'s price and lifts income', () => {
    const { s, hint } = tied(1e9);
    let g = s;
    for (const what of hint!.steps) {
      const r = G.buyUpgrade(g, 'downtown', what);
      expect(r.ok).toBe(true);
      if (r.ok) g = r.state;
    }
    expect(s.cash - g.cash).toBe(hint!.cost);
    expect(G.shopEarnings(g, 'downtown')).toBeGreaterThan(G.shopEarnings(s, 'downtown'));
  });
});

describe('Pier 9 warning on the build chip', () => {
  const base = G.newGame(0);
  const open = (patch: Partial<G.Shop> = {}): G.GameState => ({ ...base, seenScenes: [...base.seenScenes, 'waterfront-3'], shops: { ...base.shops, waterfront: { ...base.shops.waterfront, built: true, sold: 1e9, ...patch } } });
  test('shown only while the bid is on offer and not yet won', () => {
    expect(buildChipHint(base)).toBeNull();
    expect(G.pier9Available(open())).toBe(true);
    expect(buildChipHint(open())).toMatch(/Pier 9/);
    expect(buildChipHint(open({ perk: true }))).toBeNull(); // won
  });
});
