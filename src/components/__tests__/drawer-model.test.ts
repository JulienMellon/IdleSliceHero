/// <reference types="jest" />
import { DECOR_KINDS } from '../../content/tuning';
import * as G from '../../engine/game';
import * as service from '../../engine/features/service';
import { buyKeyOf, drawerCards, drawerKey, parseBuyKey, type DrawerBuy } from '../drawer-model';

const base = (cash = 0): G.GameState => ({ ...G.newGame(0), cash });
const withShop = (s: G.GameState, id: 'downtown' | 'suburbs', patch: Partial<G.Shop>): G.GameState => ({
  ...s,
  shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } },
});

describe('drawerCards', () => {
  it('lists heads and a manager for an unmanaged shop, then the stations and the fleet', () => {
    const v = drawerCards({ game: base(), id: 'downtown' });
    expect(v.cards.map((c) => c.key)).toEqual([
      'headPrep',
      'headOven',
      'headCounter',
      'manager',
      'prep',
      'ovens',
      'counter',
      'drivers',
      'tables',
      'grade',
      'expand',
      'fleet',
    ]);
    expect(v.decor.map((c) => c.testID)).toEqual(DECOR_KINDS.map((k) => `decor-${k}`));
    expect(v.title).toBe('Rosa’s · Downtown');
    expect(v.line).toBeNull(); // no head yet: the header is the shop's title alone
    expect(v.built).toBe(1);
  });

  it('drops the hire cards once a GM runs the shop, and stops muting stations', () => {
    const v = drawerCards({ game: withShop(base(), 'downtown', { managed: true }), id: 'downtown' });
    expect(v.cards.map((c) => c.key)).toEqual(['prep', 'ovens', 'counter', 'drivers', 'tables', 'grade', 'expand', 'fleet']);
    expect(v.idleBanner).toBe(false);
  });

  it('mutes upgrades (but not the hires) in an unmanaged shop that is not Downtown', () => {
    const s = withShop(base(), 'suburbs', { built: true });
    const v = drawerCards({ game: s, id: 'suburbs' });
    expect(v.idleBanner).toBe(true);
    expect(v.cards.find((c) => c.key === 'prep')!.tone).toBe('neutral');
    expect(v.cards.find((c) => c.key === 'headPrep')!.muted).toBe(false);
    expect(v.cards.find((c) => c.key === 'manager')!.detail).toContain('Hire all three heads first');
  });

  it('affordability follows cash alone; the price and tone do not', () => {
    const poor = drawerCards({ game: base(0), id: 'downtown' });
    const rich = drawerCards({ game: base(1e12), id: 'downtown' });
    const prepP = poor.cards.find((c) => c.key === 'prep')!;
    const prepR = rich.cards.find((c) => c.key === 'prep')!;
    expect(prepP.cost).toBe(prepR.cost);
    expect(prepP.canBuy).toBe(false);
    expect(prepR.canBuy).toBe(true);
    expect(prepP.tone).toBe(prepR.tone);
    expect(prepP.detail).toBe(prepR.detail);
  });

  it('shows a locked card with no price and its reason', () => {
    const v = drawerCards({ game: base(1e12), id: 'downtown' });
    const mgr = v.cards.find((c) => c.key === 'manager')!;
    expect(mgr.cost).toBeNull();
    expect(mgr.canBuy).toBe(false);
    expect(mgr.detail).toContain('Keep baking');
  });

  it('offers the Expand buy on a station the level cap alone locks (D413)', () => {
    const s = withShop(base(1e12), 'downtown', { managed: true, prep: G.levelCap(base().shops.downtown) });
    const prep = drawerCards({ game: s, id: 'downtown' }).cards.find((c) => c.key === 'prep')!;
    expect(prep.tone).toBe('normal'); // D550: basil like the other buys, the word is on its label
    expect(prep.buy).toEqual({ t: 'upgrade', what: 'expand' });
    expect(prep.buyLabel).toMatch(/^Expand · /);
    expect(prep.canBuy).toBe(true);
  });

  it('has no bundle button and no hot card, tied stations or not', () => {
    const tied = withShop(base(1e12), 'downtown', { managed: true, prep: 3, ovens: 3, counter: 3, drivers: 3 });
    const v = drawerCards({ game: tied, id: 'downtown' });
    expect(v).not.toHaveProperty('bundle');
    expect(v).not.toHaveProperty('bottleneck');
    for (const c of v.cards) expect(c).not.toHaveProperty('hot');
    const tones = v.cards.filter((c) => ['prep', 'ovens', 'counter', 'drivers'].includes(c.key)).map((c) => c.tone);
    expect(new Set(tones).size).toBe(1);
  });
});

describe('the drawer cache (M32)', () => {
  it('reruns no what-if when only cash or sales move, and never asks the gain simulations at all', () => {
    const s = withShop(base(), 'downtown', { managed: true });
    drawerCards({ game: s, id: 'downtown' });
    const cap = jest.spyOn(service, 'capacityAfter');
    const gain = jest.spyOn(G, 'upgradeGain');
    const fleet = jest.spyOn(G, 'vehicleGain');
    const decor = jest.spyOn(G, 'decorGain');
    try {
      drawerCards({ game: { ...s, cash: 12345 }, id: 'downtown' });
      drawerCards({ game: { ...s, cash: 99999, shops: { ...s.shops, downtown: { ...s.shops.downtown, sold: 777 } } }, id: 'downtown' });
      expect(cap).not.toHaveBeenCalled();
      // a level moves: it recomputes
      drawerCards({ game: withShop(s, 'downtown', { prep: 5 }), id: 'downtown' });
      expect(cap).toHaveBeenCalled();
      expect(gain).not.toHaveBeenCalled();
      expect(fleet).not.toHaveBeenCalled();
      expect(decor).not.toHaveBeenCalled();
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('keys on every shop, the fleet and Nonna’s countdown, never on cash', () => {
    const s = base();
    expect(drawerKey({ game: { ...s, cash: 5 }, id: 'downtown' })).toBe(drawerKey({ game: s, id: 'downtown' }));
    expect(drawerKey({ game: withShop(s, 'suburbs', { built: true }), id: 'downtown' })).not.toBe(drawerKey({ game: s, id: 'downtown' }));
    expect(drawerKey({ game: { ...s, vehicle: 1 }, id: 'downtown' })).not.toBe(drawerKey({ game: s, id: 'downtown' }));
    expect(drawerKey({ game: withShop(s, 'downtown', { sold: 10 }), id: 'downtown' })).not.toBe(drawerKey({ game: s, id: 'downtown' }));
    // a managed Downtown has no Nonna card, so its sales are not part of the key
    const m = withShop(s, 'downtown', { managed: true });
    expect(drawerKey({ game: withShop(m, 'downtown', { sold: 10 }), id: 'downtown' })).toBe(drawerKey({ game: m, id: 'downtown' }));
  });
});

// ---------- v5.22 (card U4): cards say what the station can handle, now and after the buy; nothing ranks them ----------

describe('the drawer says capacity, never a gain or a pointer (U4)', () => {
  /** A managed Downtown short on ovens: prep and counter far ahead, a few drivers. */
  const shortOvens = (cash = 1e9): G.GameState => {
    const s = base(cash);
    return withShop({ ...s, seenScenes: [...s.seenScenes, 'downtown-4'] }, 'downtown', { managed: true, prep: 20, ovens: 4, counter: 20, drivers: 8 });
  };
  const card = (s: G.GameState, key: string) => drawerCards({ game: s, id: 'downtown' }).cards.find((c) => c.key === key)!;
  /** The detail with its numbers taken out: what is left is the card's shape. */
  const shape = (d: string) => d.replace(/\d[\d.,]*[KM]?/g, '#');

  test('a station card ends in "<n>/min → <m>" and the ovens card differs from the others by its numbers alone', () => {
    const s = shortOvens();
    const ovens = card(s, 'ovens');
    const counter = card(s, 'counter');
    expect(ovens.detail).toMatch(/^\d[\d.,]*[KM]?\/min\s→\s\d[\d.,]*[KM]?$/);
    expect(shape(ovens.detail)).toBe(shape(counter.detail));
    expect(ovens.detail).not.toBe(counter.detail); // its numbers are its own
    expect(Object.keys(ovens).sort()).toEqual(Object.keys(counter).sort());
    for (const k of ['tone', 'muted', 'wide', 'buyLabel', 'costLabel'] as const) expect(ovens[k]).toEqual(counter[k]);
    expect(ovens).not.toHaveProperty('hot');
    expect(card(s, 'prep').detail).toMatch(/^\d[\d.,]*[KM]?\/min\s→\s\d[\d.,]*[KM]? · batch /);
  });
  test("the numbers are the engine's: capacity now, and capacity after one more level", () => {
    const s = shortOvens();
    const now = service.reportView(s, 'downtown', s.lastSavedAt).capacity.ovens;
    const after = service.capacityAfter(s, 'downtown', 'ovens', s.lastSavedAt);
    expect(after).toBeGreaterThan(now);
    const [a, b] = card(s, 'ovens')
      .detail.split(/\s→\s/)
      .map((x) => parseFloat(x));
    expect(Math.round(now)).toBe(Math.round(a));
    expect(Math.round(after)).toBe(Math.round(b));
  });
  test('drivers and the fleet speak in deliveries a minute; no card carries a "+$" gain, a payback or "holding you back"', () => {
    const s = shortOvens();
    const v = drawerCards({ game: s, id: 'downtown' });
    expect(card(s, 'drivers').detail).toMatch(/^Deliveries \d[\d.,]*[KM]?\/min\s→\s\d/);
    expect(card(s, 'fleet').detail).toMatch(/Deliveries \d[\d.,]*[KM]?\/min\s→\s\d/);
    for (const c of [...v.cards, ...v.decor]) expect(c.detail).not.toMatch(/\+\$|\/s\b|pays back|holding you back|tied|Bottleneck/i);
  });
  test('the same for an unmanaged shop that is not Downtown and for one that is tied', () => {
    const s = withShop(base(), 'suburbs', { built: true });
    const v = drawerCards({ game: s, id: 'suburbs' });
    expect(v.cards.find((c) => c.key === 'ovens')!.detail).toMatch(/\/min\s→\s/);
    const tied = withShop(shortOvens(), 'downtown', { prep: 3, ovens: 3, counter: 3, drivers: 3 });
    const t = drawerCards({ game: tied, id: 'downtown' });
    expect(t.cards.map((c) => c.key)).not.toContain('bundle');
    expect(t.cards.find((c) => c.key === 'ovens')!.detail).toMatch(/\/min\s→\s/);
  });
  test('heads and the manager say what they do in words, no number', () => {
    const s = withShop(shortOvens(), 'suburbs', { built: true });
    const v = drawerCards({ game: { ...s, active: 'suburbs' }, id: 'suburbs' });
    expect(v.cards.find((c) => c.key === 'headPrep')!.detail).toMatch(/^\S+ takes the prep table$/);
    expect(v.cards.find((c) => c.key === 'headOven')!.detail).toMatch(/ takes the ovens$/);
    expect(v.cards.find((c) => c.key === 'headCounter')!.detail).toMatch(/ takes the counter$/);
    for (const k of ['headPrep', 'headOven', 'headCounter', 'manager']) expect(v.cards.find((c) => c.key === k)!.detail).not.toMatch(/\d|\+\$|×/);
  });
  test("grade, expand and decor keep their own effect lines, in the shop's words and never a +$/min", () => {
    const v = drawerCards({ game: shortOvens(), id: 'downtown' });
    expect(v.cards.find((c) => c.key === 'grade')!.detail).toMatch(/×2 · Ovens \d[\d.,]*[KM]?\/min\s→\s/);
    expect(v.cards.find((c) => c.key === 'expand')!.detail).toMatch(/^×1\.5 prep & counter · Lv cap \d+ → \d+$/);
    expect(v.decor[0].detail).toMatch(/^→ .+ · \+\d+% pizza price$/);
  });
  test('the header line is the report for a shop that runs itself, null before that', () => {
    expect(drawerCards({ game: base(), id: 'downtown' }).line).toBeNull();
    const g = shortOvens(0);
    const ticked = G.playTick(G.playTick(g, 1, g.lastSavedAt + 1000), 1, g.lastSavedAt + 2000);
    expect(drawerCards({ game: ticked, id: 'downtown' }).line).toMatch(/^Served \d+\/min · Missed \d+\/min$/);
  });
  test('the cache key follows what a hand-tapped station made, and no longer the tutorial', () => {
    const s = shortOvens();
    expect(drawerKey({ game: s, id: 'downtown' })).toBe(drawerKey({ game: { ...s, seenScenes: [] }, id: 'downtown' }));
  });
});

describe('C137: the card buy key round-trips to the typed buy', () => {
  test('every card the drawer lists parses back to its own buy', () => {
    const v = drawerCards({ game: base(), id: 'downtown' });
    for (const c of [...v.cards, ...v.decor]) expect(parseBuyKey(buyKeyOf(c.buy))).toEqual(c.buy);
  });
  test('the three shapes, and keys that were never written', () => {
    const fleet: DrawerBuy = { t: 'fleet' };
    expect(buyKeyOf(fleet)).toBe('fleet');
    expect(parseBuyKey('up:expand')).toEqual({ t: 'upgrade', what: 'expand' });
    expect(parseBuyKey('decor:nope')).toBeNull();
    expect(parseBuyKey('decor:')).toBeNull();
    expect(parseBuyKey('prep')).toBeNull();
    expect(parseBuyKey('')).toBeNull();
  });
});
