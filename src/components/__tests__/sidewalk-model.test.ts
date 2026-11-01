/// <reference types="jest" />
import { money } from '../../engine/format';
import * as G from '../../engine/game';
import { BUNDLE_PILL, buildChipHint, buildChipSub, bundleButton, bundlePillBottom, buttonTone, buyBundle, goalHidesOwnHire, hireOnSidewalk, needLine, needText, showBundlePill, stationModels, stationViews } from '../sidewalk-model';
import { BUTTON_H, SIDEWALK_ROW, TAP } from '../tap-targets';

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
  test('an unlocked station that adds nothing is "nogain"', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 1e9);
    expect(view(s, 'prep').tone).toBe('nogain');
  });
  test('MAX only when nothing can raise the cap: the last footprint, every level at its cap', () => {
    const top = shopState({ footprint: 4, prep: 125, ovens: 125, counter: 125, drivers: 125 }, 1e9);
    expect(G.levelCap(top.shops.downtown)).toBe(125);
    for (const k of ['prep', 'ovens', 'counter', 'drivers']) {
      expect(view(top, k).label).toBe('MAX');
      expect(view(top, k).tone).toBe('normal');
      expect(view(top, k).what).not.toBe('expand');
    }
  });
});

describe('EXPAND at the level cap (B4)', () => {
  const capped = (cash: number) => shopState({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, cash);
  const expandCost = (s: G.GameState) => G.upgradeCostOf(s, 'downtown', 'expand')!;
  test('a station stuck at the cap, with a next footprint, says EXPAND with Expand\'s price and buys expand', () => {
    const s = capped(1e9);
    for (const k of ['prep', 'ovens', 'counter']) {
      const v = view(s, k);
      expect(v.expand).toBe(true);
      expect(v.what).toBe('expand');
      expect(v.name).toBe('EXPAND');
      expect(v.label).toBe(money(expandCost(s)));
      expect(v.cost).toBe(expandCost(s));
      expect(v.lock).toBeNull();
      expect(v.tone).toBe('normal');
      expect(v.affordable).toBe(true);
    }
  });
  test('a station below the cap is untouched', () => {
    const v = view(capped(1e9), 'drivers');
    expect(v.expand).toBe(false);
    expect(v.what).toBe('drivers');
    expect(v.name).toBe('DRIVERS');
  });
  test('affordability and "need $X" follow Expand\'s cost', () => {
    const s = capped(0);
    const cost = expandCost(s);
    expect(view(s, 'prep').affordable).toBe(false);
    expect(view({ ...s, cash: cost - 10 }, 'prep').need).toBe(`need ${money(10)}`);
    expect(view({ ...s, cash: cost - 10 }, 'prep').affordable).toBe(false);
    expect(view({ ...s, cash: cost }, 'prep').affordable).toBe(true);
    expect(view({ ...s, cash: cost }, 'prep').need).toBeNull();
  });
  test('the button buys expand through the ordinary buy path, and the cap rises', () => {
    const s = capped(1e9);
    const r = G.buyUpgrade(s, 'downtown', view(s, 'prep').what);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.shops.downtown.footprint).toBe(1);
      expect(view(r.state, 'prep').expand).toBe(false);
      expect(view(r.state, 'prep').what).toBe('prep');
    }
  });
  test('the model is re-cached when the footprint changes', () => {
    const s = capped(0);
    const a = stationModels(s, 'downtown');
    expect(stationModels(shopState({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 1 }), 'downtown')).not.toBe(a);
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
  test('a station keeps its name; its need line shows only with some cash, and never at $0 (it would repeat the price)', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 0);
    for (const v of stationViews(s, 'downtown')) expect(v.need).toBeNull();
    const prep = view({ ...s, cash: 1 }, 'prep');
    expect(prep.need).toBe(`need ${money(prep.cost! - 1)}`);
    expect(prep.name).toBe('PREP');
    expect(view({ ...s, cash: 1e9 }, 'prep').need).toBeNull();
    const capped = shopState({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, 5);
    expect(view(capped, 'prep').need).toBe(`need ${money(G.upgradeCostOf(capped, 'downtown', 'expand')! - 5)}`); // EXPAND is short by Expand's price
  });
  test('the shortfall shrinks as cash arrives', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 0);
    const cost = view(s, 'prep').cost!;
    expect(view({ ...s, cash: cost - 3 }, 'prep').need).toBe('need $3');
  });
  test('a framed card saving for its bottleneck keeps its progress bar instead of the text', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 1);
    const d = view(s, 'drivers');
    expect(d.frame).toBe('waiting');
    expect(d.need).not.toBeNull();
    expect(needLine(d, true)).toBeNull();
    expect(needLine(d, false)).toBe(d.need); // an unframed chip has no bar
    expect(needLine(view(s, 'prep'), true)).toBe(view(s, 'prep').need);
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
    expect(buildChipHint(open())).toBe('uses bid cash'); // a cost, not a reward; never claims to reset progress
    expect(buildChipHint(open({ perk: true }))).toBeNull(); // won
  });
});

describe('the build chip keeps two lines (D404)', () => {
  test('the Pier 9 warning merges with the price on one line', () => {
    expect(buildChipSub(1_800_000, 'uses bid cash')).toBe('$1.8M · uses bid cash');
    expect(buildChipSub(1_800_000, null)).toBe('Build $1.8M');
  });
});

describe('who is offered the next hire (B1)', () => {
  const sh = (patch: Partial<G.Shop>): G.Shop => ({ ...G.newGame(0).shops.suburbs, built: true, managed: false, ...patch });
  const heads = { prep: true, oven: true, counter: true };
  test('the sidewalk offers hires on every shop without a GM except Downtown, whose GM is Nonna', () => {
    expect(hireOnSidewalk(sh({}), 'suburbs')).toBe(true);
    expect(hireOnSidewalk(sh({ heads }), 'suburbs')).toBe(true); // all three heads: the GM is still on offer
    expect(hireOnSidewalk(sh({ managed: true, heads }), 'suburbs')).toBe(false);
    expect(hireOnSidewalk(sh({}), 'downtown')).toBe(false);
  });
  test('the goal bar steps aside for a head, but keeps the GM hire until it is bought', () => {
    expect(goalHidesOwnHire(sh({}), 'suburbs')).toBe(true);
    expect(goalHidesOwnHire(sh({ heads: { prep: true, oven: true, counter: false } }), 'suburbs')).toBe(true);
    expect(goalHidesOwnHire(sh({ heads }), 'suburbs')).toBe(false);
    expect(goalHidesOwnHire(sh({ managed: true, heads }), 'suburbs')).toBe(false);
  });
  test('Downtown\'s goal bar keeps its heads', () => {
    expect(goalHidesOwnHire(sh({}), 'downtown')).toBe(false);
  });
});

describe('"Buy both" on the sidewalk', () => {
  test('the pill is at least 44 pt tall, sits above the row and its badges, and never over the buttons', () => {
    expect(BUNDLE_PILL.height).toBeGreaterThanOrEqual(TAP.min);
    expect(BUNDLE_PILL.height).toBe(BUTTON_H);
    expect(bundlePillBottom(20, false)).toBe(20 + SIDEWALK_ROW.cardHeight + BUNDLE_PILL.gapAboveRow);
    expect(bundlePillBottom(20, true)).toBe(20 + SIDEWALK_ROW.idleStackHeight + BUNDLE_PILL.gapAboveRow);
    expect(BUNDLE_PILL.gapAboveRow).toBeGreaterThanOrEqual(9); // the level badges stand 9 pt over the cards
  });
  test('it shows only when a bundle exists and the tutorial coach is down', () => {
    const s = shopState({ prep: 3, ovens: 3, counter: 3, drivers: 3 }, 0);
    const hint = G.bundleHint(s, 'downtown');
    expect(hint).not.toBeNull();
    expect(showBundlePill(hint, false)).toBe(true);
    expect(showBundlePill(hint, true)).toBe(false);
    expect(showBundlePill(null, false)).toBe(false);
  });
});
