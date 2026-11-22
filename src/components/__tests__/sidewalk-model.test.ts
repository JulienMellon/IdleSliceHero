/// <reference types="jest" />
import { money } from '../../engine/format';
import * as G from '../../engine/game';
import * as service from '../../engine/features/service';
import * as sidewalkApi from '../sidewalk-model';
import {
  amountCard,
  amountLabel,
  capacityFit,
  capacityText,
  expandGroup,
  footLine,
  headTakes,
  hireSidewalkLabel,
  nextAmount,
  perMinute,
  BUY_AMOUNTS,
  buyMany,
  buyPlan,
  AFFORDABLE_OUTLINE,
  buildChipHint,
  buttonOutline,
  cardLook,
  buildChipSub,
  buttonTone,
  capExpandCost,
  goalHidesOwnHire,
  hireOnSidewalk,
  type MergedSlot,
  needText,
  sidewalkSlots,
  stationModels,
  stationTitle,
  stationViews,
} from '../sidewalk-model';
import { cardTextWidths, fits } from '../endgame/fit-model';
import { BUTTON_H, SIDEWALK_ROW, TAP } from '../tap-targets';

import { HOME_CITY } from '../../content/cities/home';
import { NEIGHBORHOODS } from '../../content/cities/home/data';
const shopState = (patch: Partial<G.Shop>, cash = 0): G.GameState => {
  const s = G.newGame(0);
  return { ...s, cash, shops: { ...s.shops, downtown: { ...s.shops.downtown, managed: true, ...patch } } };
};
const view = (s: G.GameState, key: string) => stationViews(s, 'downtown').find((v) => v.key === key)!;

describe('sidewalk station model (T39, U4)', () => {
  test('a shop short on ovens: the ovens card differs from the others by its numbers alone', () => {
    const s = shopState({ prep: 20, ovens: 4, counter: 20, drivers: 8 }, 1e9);
    const views = stationViews(s, 'downtown');
    const [prep, ovens, counter] = views;
    for (const v of views) {
      expect(v).not.toHaveProperty('frame');
      expect(v).not.toHaveProperty('neck');
      expect(v).not.toHaveProperty('tied');
      expect(v).not.toHaveProperty('gain');
      expect(v).not.toHaveProperty('progress');
      expect(v.tone).toBe('normal');
      expect(v.affordable).toBe(true);
    }
    expect(Object.keys(ovens).sort()).toEqual(Object.keys(prep).sort());
    const shape = (f: string | null) => f?.replace(/\d[\d.,]*[KM]?/g, '#');
    expect(shape(ovens.foot)).toBe('#/min\u00A0→\u00A0#');
    expect(shape(ovens.foot)).toBe(shape(counter.foot));
    expect(ovens.foot).not.toBe(counter.foot);
  });
  test('a card that adds nothing is not flattened either: every unlocked station card has the same tone', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 1e9);
    expect(new Set(stationViews(s, 'downtown').map((v) => v.tone))).toEqual(new Set(['normal']));
  });
  test('MAX only when nothing can raise the cap: the last footprint, every level at its cap', () => {
    const top = shopState({ footprint: 4, prep: 125, ovens: 125, counter: 125, drivers: 125 }, 1e9);
    expect(G.levelCap(top.shops.downtown)).toBe(125);
    for (const k of ['prep', 'ovens', 'counter', 'drivers']) {
      expect(view(top, k).label).toBe('MAX');
      expect(view(top, k).tone).toBe('normal');
      expect(view(top, k).what).not.toBe('expand');
      expect(view(top, k).foot).toBeNull(); // nothing to show the next level of
    }
  });
});

describe('EXPAND at the level cap (B4)', () => {
  const capped = (cash: number) => shopState({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, cash);
  const expandCost = (s: G.GameState) => G.upgradeCostOf(s, 'downtown', 'expand')!;
  test("a station stuck at the cap, with a next footprint, says EXPAND with Expand's price and buys expand", () => {
    const s = capped(1e9);
    for (const k of ['prep', 'ovens', 'counter']) {
      const v = view(s, k);
      expect(v.expand).toBe(true);
      expect(v.what).toBe('expand');
      expect(v.name).toBe(k.toUpperCase()); // D407: the station's name stays
      expect(stationTitle(v)).toBe('EXPAND'); // G89: the title is short enough for the ~66 pt button; the station shows as its icon and badge
      expect(v.badge).toBe(`MAX ${v.level}`);
      expect(v.label).toBe(money(expandCost(s))); // the real price, alone
      expect(v.label.length).toBeLessThanOrEqual(7); // G89: "Expand $500" (11) and "DRIVERS MAX" were truncated in a ~66 pt button; a price and a 6-letter title fit
      expect(stationTitle(v).length).toBeLessThanOrEqual(7);
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
    expect(v.badge).toBe(v.level);
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
  test('v5.22: a caller that passes no gain (the station cards, the drawer) never gets "no gain"', () => {
    expect(buttonTone({ lock: null })).toBe('normal');
    expect(buttonTone({ lock: 'Max' })).toBe('normal');
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
  test('the foot is the capacity, or "need $X" where there is none to show (the Expand buy)', () => {
    const s = shopState({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 1);
    const prep = view(s, 'prep');
    expect(prep.need).not.toBeNull();
    expect(footLine(prep, null, 200)).toBe(prep.foot); // short of cash, a station card still shows its numbers
    expect(footLine(prep, { foot: '+10 lv' }, 200)).toBe('+10 lv'); // a ×10 / MAX plan comes first
    const capped = shopState({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, 5);
    expect(view(capped, 'prep').foot).toBeNull();
    expect(footLine(view(capped, 'prep'), null, 200)).toBe(view(capped, 'prep').need);
  });
});

describe('Pier 9 warning on the build chip', () => {
  const base = G.newGame(0);
  const open = (patch: Partial<G.Shop> = {}): G.GameState => ({
    ...base,
    seenScenes: [...base.seenScenes, 'waterfront-3', 'waterfront-3b'],
    shops: { ...base.shops, waterfront: { ...base.shops.waterfront, built: true, sold: 1e9, ...patch } },
  });
  test('shown only while the bid is on offer and not yet won', () => {
    expect(buildChipHint(base)).toBeNull();
    expect(G.bidAvailable(open())).toBe(true);
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
    expect(hireOnSidewalk(sh({}), 'suburbs', HOME_CITY)).toBe(true);
    expect(hireOnSidewalk(sh({ heads }), 'suburbs', HOME_CITY)).toBe(true); // all three heads: the GM is still on offer
    expect(hireOnSidewalk(sh({ managed: true, heads }), 'suburbs', HOME_CITY)).toBe(false);
    expect(hireOnSidewalk(sh({}), 'downtown', HOME_CITY)).toBe(false);
  });
  test('the goal bar steps aside for a head, but keeps the GM hire until it is bought', () => {
    expect(goalHidesOwnHire(sh({}), 'suburbs', HOME_CITY)).toBe(true);
    expect(goalHidesOwnHire(sh({ heads: { prep: true, oven: true, counter: false } }), 'suburbs', HOME_CITY)).toBe(true);
    expect(goalHidesOwnHire(sh({ heads }), 'suburbs', HOME_CITY)).toBe(false);
    expect(goalHidesOwnHire(sh({ managed: true, heads }), 'suburbs', HOME_CITY)).toBe(false);
  });
  test("Downtown's goal bar keeps its heads", () => {
    expect(goalHidesOwnHire(sh({}), 'downtown', HOME_CITY)).toBe(false);
  });
});

describe('capExpandCost: the one rule for "locked by the level cap alone" (D413)', () => {
  const capped = shopState({ prep: 25, ovens: 10, counter: 10, drivers: 25, footprint: 0 }, 0);
  test("a station at the cap with a next footprint offers Expand's price; below the cap or on a maxed shop it does not", () => {
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

// Levels that used to tie prep + ovens (6 / 8 / 5) and prep + counter (10 / 14 / 8): the row now shows one card a station, whatever the ties
const TIES = {
  prepOvens: { prep: 6, ovens: 8, counter: 5, drivers: 25 },
  prepCounter: { prep: 10, ovens: 14, counter: 8, drivers: 25 },
  twoCapped: { prep: 6, ovens: 8, counter: 25, drivers: 25 },
};
const slotsOf = (patch: Partial<G.Shop>, cash: number) => {
  const s = shopState(patch, cash);
  return { s, slots: sidewalkSlots(s, 'downtown') };
};
const merged = (slots: ReturnType<typeof sidewalkSlots>) => slots.filter((x): x is MergedSlot => x.kind !== 'station');

describe('tied stations stay apart: no bundle card (U4)', () => {
  test('every station keeps its own slot, whatever is tied, and no slot is a bundle', () => {
    for (const ties of [TIES.prepOvens, TIES.prepCounter, { prep: 3, ovens: 3, counter: 3, drivers: 3 }]) {
      const { slots } = slotsOf({ ...ties, drivers: 3 }, 1e9);
      expect(slots.map((x) => x.kind)).toEqual(['station', 'station', 'station', 'station']);
      expect(slots.map((x) => (x.kind === 'station' ? x.key : ''))).toEqual(['prep', 'ovens', 'counter', 'drivers']);
      expect(slots.reduce((t, x) => t + x.span, 0)).toBe(4);
    }
  });
  test('the model exports nothing that bundles or ranks', () => {
    const api = sidewalkApi as Record<string, unknown>;
    for (const gone of ['buyBundle', 'showBundlePill', 'mergeGroups', 'effectFoot', 'needLine', 'stationTone', 'gainText']) expect(api[gone]).toBeUndefined();
  });
  test("the card keeps the row's sizes: a 44 pt button in the same card height", () => {
    expect(BUTTON_H).toBeGreaterThanOrEqual(TAP.min);
    expect(SIDEWALK_ROW.cardHeight).toBeGreaterThanOrEqual(TAP.min);
  });
});

describe('EXPAND merges into one shop-wide card (D407)', () => {
  test('two or more capped stations: one wide card "EXPAND · <footprint>" (G102) with the price and the cap step', () => {
    const { s, slots } = slotsOf({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, 1e9);
    const m = merged(slots);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe('expand');
    expect(m[0].keys).toEqual(['prep', 'ovens', 'counter']);
    expect(m[0].span).toBe(3);
    expect(m[0].title).toBe('EXPAND \u00B7 Corner');
    expect(m[0].label).toBe(money(G.upgradeCostOf(s, 'downtown', 'expand')!));
    expect(m[0].foot).toBe('Lv cap 25 → 50');
    expect(m[0]).not.toHaveProperty('frame');
    expect(m[0].steps).toEqual(['expand']);
    expect(m[0].enabled).toBe(true);
    expect(slots.map((x) => x.kind)).toEqual(['expand', 'station']);
  });
  test('it is not enabled until the player can pay', () => {
    expect(merged(slotsOf({ prep: 25, ovens: 25, counter: 25, drivers: 1, footprint: 0 }, 0).slots)[0].enabled).toBe(false);
  });
  test('one capped station keeps its own card: EXPAND over the real price, "MAX 25" on its badge, and the amber button', () => {
    const { slots } = slotsOf({ prep: 25, ovens: 10, counter: 10, drivers: 10, footprint: 0 }, 1e9);
    expect(merged(slots)).toHaveLength(0);
    const prep = slots.find((x) => x.kind === 'station' && x.key === 'prep');
    expect(prep?.kind === 'station' && prep.view.tone).toBe('expand');
    expect(prep?.kind === 'station' && stationTitle(prep.view)).toBe('EXPAND');
    expect(prep?.kind === 'station' && prep.view.badge).toBe('MAX 25');
    expect(prep?.kind === 'station' && prep.view.label).toMatch(/^\$/);
    expect(prep?.kind === 'station' && prep.view.what).toBe('expand');
  });
  test('two Expand-capped pairs at once make one Expand card, and the row keeps its four slots of width', () => {
    const { slots } = slotsOf(TIES.twoCapped, 1e9);
    expect(slots.map((x) => x.kind)).toEqual(['station', 'station', 'expand']);
    expect(slots.reduce((t, x) => t + x.span, 0)).toBe(4);
  });
});

describe('which stations make the Expand card (D407)', () => {
  const v = (key: StationKeyT, expand: boolean) => ({ key, expand });
  type StationKeyT = 'prep' | 'ovens' | 'counter' | 'drivers';
  test('two or more capped stations make the group, one keeps its own amber card, none make nothing', () => {
    expect(expandGroup([v('prep', true), v('ovens', true), v('counter', false), v('drivers', false)])).toEqual(['prep', 'ovens']);
    expect(expandGroup([v('prep', false), v('ovens', true), v('counter', false), v('drivers', true)])).toEqual(['ovens', 'drivers']);
    expect(expandGroup([v('prep', true), v('ovens', false), v('counter', false), v('drivers', false)])).toBeNull();
    expect(expandGroup([v('prep', false), v('ovens', false), v('counter', false), v('drivers', false)])).toBeNull();
  });
});

describe('affordable cards are never washed out (D419, round 60)', () => {
  const frames = ['hot', 'waiting', null] as const;
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contrast = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  test('an affordable card, in every neighbourhood and every frame, has a 2 pt #3B1F14 outline on a solid face and a full-opacity label', () => {
    expect(AFFORDABLE_OUTLINE).toEqual({ color: '#3B1F14', width: 2 });
    for (const n of NEIGHBORHOODS)
      for (const frame of frames) {
        const look = cardLook(frame, true);
        expect([n.id, frame, look.borderColor, look.borderWidth, look.borderStyle, look.labelOpacity]).toEqual([n.id, frame, '#3B1F14', 2, 'solid', 1]);
        expect([n.id, frame, look.backgroundColor.startsWith('#')]).toEqual([n.id, frame, true]); // solid, not rgba
        // the outline reads against the face and against the neighbourhood's own colour (the Waterfront blue, the Uptown violet…)
        expect([n.id, frame, contrast(look.borderColor, look.backgroundColor) >= 7, contrast(look.borderColor, n.color) >= 2]).toEqual([
          n.id,
          frame,
          true,
          true,
        ]);
      }
  });
  test('the check can fail: the old affordable bottleneck card had a tomato outline on a pale pink face (under 3:1 against its face)', () => {
    expect(contrast('#E5483A', '#FFF4F0')).toBeLessThan(4);
    expect(cardLook('hot', true).borderColor).not.toBe('#E5483A');
    expect(contrast(cardLook('hot', true).borderColor, cardLook('hot', true).backgroundColor)).toBeGreaterThan(10);
  });
  test('a card you cannot buy keeps its quiet frame (the sidewalk and the drawer pass no frame at all)', () => {
    expect(cardLook(null, false)).toMatchObject({ borderStyle: 'solid', borderWidth: 2.5 });
  });
  test('the button face is outlined the same way whenever the buy can be made, whatever its tone, and not when it is flat or unaffordable', () => {
    for (const tone of ['normal', 'neutral', 'expand'] as const) expect(buttonOutline(true, tone)).toEqual({ borderColor: '#3B1F14', borderWidth: 2 });
    expect(buttonOutline(true, 'nogain')).toBeNull();
    for (const tone of ['normal', 'neutral', 'expand', 'nogain'] as const) expect(buttonOutline(false, tone)).toBeNull();
  });
});

describe('×1 / ×10 / MAX: one rule for how many levels a station tap buys (v5.15)', () => {
  const at = (cash: number, patch: Partial<G.Shop> = {}) => shopState({ prep: 10, ovens: 10, counter: 10, drivers: 5, footprint: 1, ...patch }, cash);
  /** What `n` single buys cost in all, bought one at a time through the engine. */
  const oneByOne = (s: G.GameState, what: G.Upgrade, n: number) => {
    let cur = { ...s, cash: Number.POSITIVE_INFINITY };
    let spent = 0;
    for (let i = 0; i < n; i++) {
      spent += G.upgradeCostOf(cur, 'downtown', what)!;
      const r = G.buyUpgrade(cur, 'downtown', what);
      if (!r.ok) throw new Error(r.reason);
      cur = r.state;
    }
    return { spent, level: cur.shops.downtown[what as 'prep'] };
  };

  test('the three amounts and their labels', () => {
    expect(BUY_AMOUNTS).toEqual([1, 10, 'max']);
    expect(BUY_AMOUNTS.map(amountLabel)).toEqual(['\u00D71', '\u00D710', 'MAX']);
  });

  test('D456: one chip cycles the three amounts', () => {
    expect(nextAmount(1)).toBe(10);
    expect(nextAmount(10)).toBe('max');
    expect(nextAmount('max')).toBe(1);
  });

  test("×1 is the station's own price", () => {
    const s = at(1e12);
    for (const what of ['prep', 'ovens', 'counter', 'drivers'] as const)
      expect(buyPlan(s, 'downtown', what, 1)).toEqual({ count: 1, total: G.upgradeCostOf(s, 'downtown', what), affordable: true });
  });

  test('×10 costs what ten single buys cost, for ten levels', () => {
    const s = at(1e12);
    const plan = buyPlan(s, 'downtown', 'prep', 10);
    expect(plan.count).toBe(10);
    expect(plan.total).toBe(oneByOne(s, 'prep', 10).spent);
    expect(plan.affordable).toBe(true);
    expect(amountCard(s, 'downtown', { what: 'prep', expand: false }, 10)).toEqual({ label: money(plan.total), foot: '+10 lv', enabled: true, count: 10 });
  });

  test('×10 without the cash is shown, unaffordable and disabled', () => {
    const s = at(10);
    const plan = buyPlan(s, 'downtown', 'prep', 10);
    expect(plan).toMatchObject({ count: 10, affordable: false });
    expect(amountCard(s, 'downtown', { what: 'prep', expand: false }, 10)?.enabled).toBe(false);
  });

  test('the level cap cuts ×10 short: 3 levels left under the cap shows "+3 lv"', () => {
    const s = at(1e12, { prep: 23, footprint: 0 });
    expect(G.levelCap(s.shops.downtown)).toBe(25);
    expect(buyPlan(s, 'downtown', 'prep', 10)).toMatchObject({ count: 2 });
    expect(amountCard(s, 'downtown', { what: 'prep', expand: false }, 10)?.foot).toBe('+2 lv');
  });

  test('MAX is every level the cash pays for, and the next one shown unaffordable when it pays for none', () => {
    const s = at(0);
    const costs = [1, 2, 3, 4, 5, 6].map((n) => oneByOne(s, 'prep', n).spent);
    // cash for exactly four levels, and a little over
    const four = buyPlan({ ...s, cash: costs[3] + 0.5 }, 'downtown', 'prep', 'max');
    expect(four).toMatchObject({ count: 4, total: costs[3], affordable: true });
    const none = buyPlan({ ...s, cash: 1 }, 'downtown', 'prep', 'max');
    expect(none).toMatchObject({ count: 1, total: costs[0], affordable: false });
    // exactly the cost of four is four, not three
    expect(buyPlan({ ...s, cash: costs[3] }, 'downtown', 'prep', 'max').count).toBe(4);
  });

  test('MAX stops at the level cap and never asks for more than the cap allows', () => {
    const s = at(1e30, { prep: 20, footprint: 0 });
    expect(buyPlan(s, 'downtown', 'prep', 'max').count).toBe(5);
  });

  test('a locked or maxed station, Expand, hires and every single buy are left as they are', () => {
    const maxed = shopState({ footprint: 4, prep: 125, ovens: 125, counter: 125, drivers: 125 }, 1e12);
    expect(buyPlan(maxed, 'downtown', 'prep', 10)).toEqual({ count: 0, total: 0, affordable: false });
    expect(amountCard(maxed, 'downtown', { what: 'prep', expand: false }, 'max')).toBeNull();
    expect(amountCard(at(1e12), 'downtown', { what: 'expand', expand: true }, 10)).toBeNull();
    expect(amountCard(at(1e12), 'downtown', { what: 'headPrep', expand: false }, 10)).toBeNull();
    expect(amountCard(at(1e12), 'downtown', { what: 'prep', expand: false }, 1)).toBeNull();
    const hire = buyPlan(at(1e12), 'downtown', 'headPrep', 10);
    expect(hire.count).toBe(1);
  });

  test('buyMany spends exactly the plan’s total and raises the level by the plan’s count: one new state', () => {
    const s = at(1e12);
    const plan = buyPlan(s, 'downtown', 'ovens', 10);
    const r = buyMany(s, 'downtown', 'ovens', plan.count);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.shops.downtown.ovens).toBe(s.shops.downtown.ovens + 10);
      expect(s.cash - r.state.cash).toBeCloseTo(plan.total, 0);
      expect(r.state.stats.upgrades - s.stats.upgrades).toBe(10);
    }
  });

  test('buyMany is all or nothing', () => {
    const s = at(5);
    expect(buyMany(s, 'downtown', 'prep', 10)).toMatchObject({ ok: false, reason: 'Not enough cash' });
    expect(s.shops.downtown.prep).toBe(10);
    expect(buyMany(s, 'downtown', 'prep', 0)).toMatchObject({ ok: false });
  });

  test('MAX on a rich save is a few taps: one buys a whole station to its cap', () => {
    const s = at(1e30, { prep: 1, ovens: 1, counter: 1, drivers: 1, footprint: 1 });
    const plan = buyPlan(s, 'downtown', 'prep', 'max');
    const r = buyMany(s, 'downtown', 'prep', plan.count);
    expect(r.ok && r.state.shops.downtown.prep).toBe(G.levelCap(s.shops.downtown));
  });
});

// ---------- v5.22 (card U4): the card says what the station handles, now and after ----------

describe('capacity on the cards (U4)', () => {
  const ready = (patch: Partial<G.Shop>, cash = 1e9) => shopState(patch, cash);

  test('the numbers: whole from 10 up, one decimal below, "18/min → 22"', () => {
    expect(perMinute(18.4)).toBe('18');
    expect(perMinute(4.46)).toBe('4.5');
    expect(perMinute(4)).toBe('4');
    expect(perMinute(0)).toBe('0');
    expect(perMinute(1234)).toBe('1.23K');
    expect(capacityText(18, 22)).toBe('18/min\u00A0→\u00A022');
  });
  test("a station card's foot is the engine's capacity now and after one more level", () => {
    const s = ready({ prep: 20, ovens: 4, counter: 20, drivers: 8 });
    const now = service.reportView(s, 'downtown', s.lastSavedAt).capacity;
    for (const k of ['prep', 'ovens', 'counter', 'drivers'] as const) {
      const after = service.capacityAfter(s, 'downtown', k, s.lastSavedAt);
      expect(after).toBeGreaterThan(now[k]);
      expect(view(s, k).foot).toBe(capacityText(now[k], after));
    }
  });
  test('the old readouts are gone: no gain, no payback, no "No gain", in the tutorial or after it', () => {
    const base = ready({ prep: 20, ovens: 20, counter: 20, drivers: 1 });
    for (const s of [base, { ...base, seenScenes: [...base.seenScenes, 'downtown-4'] }, { ...base, cash: 0 }])
      for (const v of stationViews(s, 'downtown')) expect(v.foot).toMatch(/^\d[\d.,]*[KM]?\/min\s→\s\d[\d.,]*[KM]?$/);
  });
  test('a narrow card drops "/min" to "/m", then the unit, then the space, rather than clip or go under 10 pt', () => {
    const c = { now: 446, after: 486 };
    expect(capacityFit(c, 200)).toBe(capacityText(446, 486));
    expect(capacityFit(c, 70)).toBe('446/m\u00A0→\u00A0486');
    expect(capacityFit(c, 60)).toBe('446\u00A0→\u00A0486');
    expect(capacityFit(c, 46)).toBe('446→486');
    expect(capacityFit({ now: 1234, after: 1500 }, 46)).toBe('→1.5K');
    // every phone from 375 pt wide up, with the amount chip: the line fits its card at 10 pt (the first build clipped "446/min →" there)
    for (const w of [375, 390, 414, 430]) {
      const [textW] = cardTextWidths(w, [1, 1, 1, 1], { chip: true, framed: true });
      for (const big of [{ now: 18, after: 22 }, c, { now: 1234, after: 1500 }]) expect(fits(capacityFit(big, textW), textW, 10)).toBe(true);
      expect(fits(capacityText(446, 486), textW, 10)).toBe(false); // the full line would not have
    }
  });
  test('the card is cached on the levels: cash moves nothing, a level does; what a hand-tapped station made also moves it', () => {
    const s = ready({ prep: 20, ovens: 20, counter: 20, drivers: 1 }, 0);
    const spy = jest.spyOn(service, 'capacityAfter');
    try {
      stationViews(s, 'downtown');
      spy.mockClear();
      stationViews({ ...s, cash: 5e6 }, 'downtown');
      expect(spy).not.toHaveBeenCalled();
      stationViews(ready({ prep: 21, ovens: 20, counter: 20, drivers: 1 }), 'downtown');
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
  test('the hire button says what the hire does in words, no number', () => {
    expect(headTakes('Marco', 'prep')).toBe('Marco takes the prep table');
    expect(hireSidewalkLabel('headPrep', 'Marco')).toBe('HIRE MARCO · TAKES THE PREP TABLE');
    expect(hireSidewalkLabel('headOven', 'Lucia')).toBe('HIRE LUCIA · TAKES THE OVENS');
    expect(hireSidewalkLabel('headCounter', 'Benny')).toBe('HIRE BENNY · TAKES THE COUNTER');
    expect(hireSidewalkLabel('manager', '')).toBe('HIRE A MANAGER · TAKES THE WHOLE SHOP');
    for (const h of ['headPrep', 'headOven', 'headCounter', 'manager'] as const) expect(hireSidewalkLabel(h, 'Marco')).not.toMatch(/\d|×|\$/);
  });
  test('chapter 1: the ovens card lights for the coach with no look of its own (same tone, same keys as the prep card)', () => {
    const s = G.newGame(0);
    const prep = stationViews(s, 'downtown')[0];
    const ovens = stationViews(s, 'downtown')[1];
    expect(ovens.tone).toBe(prep.tone);
    expect(Object.keys(ovens).sort()).toEqual(Object.keys(prep).sort());
    expect(ovens.foot).toMatch(/\/min\s→\s/);
  });
});
