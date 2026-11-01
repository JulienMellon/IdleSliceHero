/// <reference types="jest" />
import { money } from '../../engine/format';
import * as G from '../../engine/game';
import { buildChipHint, buildChipSub, bundleButton, buttonTone, buyBundle, capExpandCost, goalHidesOwnHire, hireOnSidewalk, type MergedSlot, mergeGroups, needLine, needText, showBundlePill, sidewalkSlots, stationModels, stationTitle, stationViews } from '../sidewalk-model';
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
      expect(v.name).toBe(k.toUpperCase()); // D407: the station's name stays
      expect(stationTitle(v)).toBe(`${k.toUpperCase()} MAX`);
      expect(v.label).toBe(`Expand ${money(expandCost(s))}`);
      expect(v.cost).toBe(expandCost(s));
      expect(v.lock).toBeNull();
      expect(v.tone).toBe('expand'); // amber, so it never reads as a station buy
      expect(v.affordable).toBe(true);
    }
  });
  test('a station below the cap is untouched', () => {
    const v = view(capped(1e9), 'drivers');
    expect(v.expand).toBe(false);
    expect(v.what).toBe('drivers');
    expect(v.name).toBe('DRIVERS');
    expect(stationTitle(v)).toBe('DRIVERS');
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
    expect(poor.label).toMatch(/^Buy (both|all \d) \$/);
    expect(poor.label).toContain(money(hint!.cost));
    expect(poor.enabled).toBe(false);
    expect(poor.sub).toContain('need ');
    const rich = bundleButton(hint!, hint!.cost);
    expect(rich.enabled).toBe(true);
    // D412: the payoff, never "one alone adds $0/s"
    expect(rich.sub).toBe(`Tied: buy both · ${money(hint!.cost)} · +${money(hint!.gain)}/s`);
    expect(poor.sub).toContain(`+${money(hint!.gain)}/s`);
    expect(`${rich.sub} ${poor.sub}`).not.toContain('$0/s');
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

describe('capExpandCost: the one rule for "locked by the level cap alone" (D413)', () => {
  const capped = shopState({ prep: 25, ovens: 10, counter: 10, drivers: 25, footprint: 0 }, 0);
  test('a station at the cap with a next footprint offers Expand\'s price; below the cap or on a maxed shop it does not', () => {
    const cost = G.upgradeCostOf(capped, 'downtown', 'expand');
    expect(capExpandCost(capped, 'downtown', 'prep')).toBe(cost);
    expect(capExpandCost(capped, 'downtown', 'drivers')).toBe(cost);
    expect(capExpandCost(capped, 'downtown', 'ovens')).toBeNull();
    expect(capExpandCost(capped, 'downtown', 'grade')).toBeNull();
    expect(capExpandCost(capped, 'downtown', 'expand')).toBeNull();
    const top = shopState({ footprint: 4, prep: 125, drivers: 125 }, 0);
    expect(capExpandCost(top, 'downtown', 'prep')).toBeNull();
    expect(capExpandCost(top, 'downtown', 'drivers')).toBeNull();
  });
  test('the sidewalk model agrees with it', () => {
    expect(view(capped, 'prep').expand).toBe(true);
    expect(view(capped, 'ovens').expand).toBe(false);
  });
});

// Levels found by search: prep 6 / ovens 8 / counter 5 tie prep+ovens; 10 / 14 / 8 tie prep+counter (not adjacent); 6 / 10 / 8 tie ovens+counter
const TIES = {
  prepOvens: { prep: 6, ovens: 8, counter: 5, drivers: 25 },
  prepCounter: { prep: 10, ovens: 14, counter: 8, drivers: 25 },
  twoCapped: { prep: 6, ovens: 8, counter: 25, drivers: 25 },
};
const slotsOf = (patch: Partial<G.Shop>, cash: number) => {
  const s = shopState(patch, cash);
  return { s, slots: sidewalkSlots(s, 'downtown', G.bundleHint(s, 'downtown')) };
};
const merged = (slots: ReturnType<typeof sidewalkSlots>) => slots.filter((x): x is MergedSlot => x.kind !== 'station');

describe('tied stations merge into one card in their slots (D405)', () => {
  test('adjacent tied stations: one wider card, the others unchanged, the floating pill is gone', () => {
    const { s, slots } = slotsOf(TIES.prepOvens, 0);
    expect(stationViews(s, 'downtown').filter((v) => v.tied).map((v) => v.key)).toEqual(['prep', 'ovens']);
    const m = merged(slots);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe('bundle');
    expect(m[0].keys).toEqual(['prep', 'ovens']);
    expect(m[0].span).toBe(2);
    expect(m[0].title).toBe('PREP + OVENS');
    const hint = G.bundleHint(s, 'downtown')!;
    expect(m[0].label).toBe(`Buy both ${money(hint.cost)}`);
    expect(m[0].foot).toContain(`+${money(hint.gain)}/s`);
    expect(m[0].steps).toEqual(hint.steps);
    // the row still has four slots' width: the merged card's 2 + counter + drivers
    expect(slots.map((x) => x.kind)).toEqual(['bundle', 'station', 'station']); // counter, and drivers (capped: its own amber card)
    expect(slots.reduce((t, x) => t + x.span, 0)).toBe(4);
  });
  test('non-adjacent tied stations: the card sits in the first tied slot, the other slot collapses into it', () => {
    const { s, slots } = slotsOf(TIES.prepCounter, 0);
    expect(stationViews(s, 'downtown').filter((v) => v.tied).map((v) => v.key)).toEqual(['prep', 'counter']);
    expect(slots.map((x) => (x.kind === 'station' ? x.key : x.keys.join('+')))).toEqual(['prep+counter', 'ovens', 'drivers']);
    expect(slots.reduce((t, x) => t + x.span, 0)).toBe(4);
  });
  test('the card shows "need $X" while short (not at $0), is dashed while saving and solid when affordable', () => {
    const poor = merged(slotsOf(TIES.prepOvens, 0).slots)[0];
    expect(poor.enabled).toBe(false);
    expect(poor.frame).toBe('waiting');
    expect(poor.foot).not.toContain('need');
    const some = slotsOf(TIES.prepOvens, 1);
    const short = merged(some.slots)[0];
    expect(short.foot).toContain('need ');
    const rich = merged(slotsOf(TIES.prepOvens, 1e9).slots)[0];
    expect(rich.enabled).toBe(true);
    expect(rich.frame).toBe('hot');
    expect(rich.foot).not.toContain('need');
  });
  test('without a bundle (coach up, or none) the stations stay apart', () => {
    const s = shopState(TIES.prepOvens, 0);
    expect(sidewalkSlots(s, 'downtown', null).every((x) => x.kind === 'station')).toBe(true);
    expect(showBundlePill(G.bundleHint(s, 'downtown'), true)).toBe(false);
    expect(showBundlePill(G.bundleHint(s, 'downtown'), false)).toBe(true);
    expect(showBundlePill(null, false)).toBe(false);
  });
  test('one tied station is not a bundle', () => {
    const s = shopState({ prep: 3, ovens: 3, counter: 3, drivers: 3 }, 0);
    expect(stationViews(s, 'downtown').filter((v) => v.tied)).toHaveLength(1);
    expect(sidewalkSlots(s, 'downtown', G.bundleHint(s, 'downtown')).every((x) => x.kind === 'station')).toBe(true);
  });
  test('the merged card keeps the row\'s sizes: a 44 pt button in the same card height', () => {
    expect(BUTTON_H).toBeGreaterThanOrEqual(TAP.min);
    expect(SIDEWALK_ROW.cardHeight).toBeGreaterThanOrEqual(TAP.min);
  });
});

describe('EXPAND merges into one shop-wide card (D407)', () => {
  test('two or more capped stations: one wide card "EXPAND to <footprint>" with the price and the cap step', () => {
    const { s, slots } = slotsOf({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, 1e9);
    const m = merged(slots);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe('expand');
    expect(m[0].keys).toEqual(['prep', 'ovens', 'counter']);
    expect(m[0].span).toBe(3);
    expect(m[0].title).toBe('EXPAND to Corner shop');
    expect(m[0].label).toBe(money(G.upgradeCostOf(s, 'downtown', 'expand')!));
    expect(m[0].foot).toBe('Lv cap 25 → 50');
    expect(m[0].steps).toEqual(['expand']);
    expect(m[0].enabled).toBe(true);
    expect(slots.map((x) => x.kind)).toEqual(['expand', 'station']);
  });
  test('it is not enabled until the player can pay', () => {
    expect(merged(slotsOf({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, 0).slots)[0].enabled).toBe(false);
  });
  test('one capped station keeps its own card: its name, "MAX", and the amber Expand button', () => {
    const { slots } = slotsOf({ prep: 25, ovens: 10, counter: 10, drivers: 10, footprint: 0 }, 1e9);
    expect(merged(slots)).toHaveLength(0);
    const prep = slots.find((x) => x.kind === 'station' && x.key === 'prep');
    expect(prep?.kind === 'station' && prep.view.tone).toBe('expand');
    expect(prep?.kind === 'station' && stationTitle(prep.view)).toBe('PREP MAX');
    expect(prep?.kind === 'station' && prep.view.label).toMatch(/^Expand \$/);
    expect(prep?.kind === 'station' && prep.view.what).toBe('expand');
  });
  test('both merges can stand in one row: the bundle in the first slots, the capped stations in theirs', () => {
    const { slots } = slotsOf(TIES.twoCapped, 1e9);
    expect(slots.map((x) => x.kind)).toEqual(['bundle', 'expand']);
    expect(merged(slots).map((m) => m.keys)).toEqual([['prep', 'ovens'], ['counter', 'drivers']]);
  });
});

describe('merge priority: Expand first (D405 meets D407)', () => {
  const v = (key: StationKeyT, expand: boolean, tied: boolean) => ({ key, expand, tied });
  type StationKeyT = 'prep' | 'ovens' | 'counter' | 'drivers';
  test('a tied station that is capped holds the bundle back; the Expand card takes it first', () => {
    const g = mergeGroups([v('prep', true, true), v('ovens', true, true), v('counter', false, false), v('drivers', false, false)], true);
    expect(g.expand).toEqual(['prep', 'ovens']);
    expect(g.bundle).toBeNull();
    const one = mergeGroups([v('prep', true, true), v('ovens', false, true), v('counter', false, false), v('drivers', false, false)], true);
    expect(one.expand).toBeNull(); // a single capped station keeps its own amber card
    expect(one.bundle).toBeNull();
  });
  test('tied stations that are not capped bundle as usual, beside a capped station\'s Expand', () => {
    const g = mergeGroups([v('prep', false, true), v('ovens', false, true), v('counter', true, false), v('drivers', true, false)], true);
    expect(g.bundle).toEqual(['prep', 'ovens']);
    expect(g.expand).toEqual(['counter', 'drivers']);
    expect(g.expand!.some((k) => g.bundle!.includes(k))).toBe(false);
  });
  test('no bundle, no merge', () => {
    expect(mergeGroups([v('prep', false, true), v('ovens', false, true), v('counter', false, false), v('drivers', false, false)], false).bundle).toBeNull();
  });
});
