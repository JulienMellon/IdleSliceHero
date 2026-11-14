/// <reference types="jest" />
import { DECOR_KINDS } from '../../content/tuning';
import * as G from '../../engine/game';
import { drawerCards, drawerKey } from '../drawer-model';

const base = (cash = 0): G.GameState => ({ ...G.newGame(0), cash });
const withShop = (s: G.GameState, id: 'downtown' | 'suburbs', patch: Partial<G.Shop>): G.GameState => ({ ...s, shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } } });

describe('drawerCards', () => {
  it('lists heads and a manager for an unmanaged shop, then the stations and the fleet', () => {
    const v = drawerCards({ game: base(), id: 'downtown' });
    expect(v.cards.map((c) => c.key)).toEqual(['headPrep', 'headOven', 'headCounter', 'manager', 'prep', 'ovens', 'counter', 'drivers', 'tables', 'grade', 'expand', 'fleet']);
    expect(v.decor.map((c) => c.testID)).toEqual(DECOR_KINDS.map((k) => `decor-${k}`));
    expect(v.title).toBe('Rosa’s · Downtown');
    expect(v.bottleneck.startsWith('Bottleneck: ')).toBe(true);
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
    expect(prep.tone).toBe('expand');
    expect(prep.buy).toEqual({ t: 'upgrade', what: 'expand' });
    expect(prep.buyLabel).toMatch(/^Expand · /);
    expect(prep.canBuy).toBe(true);
  });

  it('only builds the bundle button when stations are tied, and prices it against cash', () => {
    const s = withShop(base(), 'downtown', { managed: true });
    const tied = drawerCards({ game: s, id: 'downtown' });
    const rich = drawerCards({ game: { ...s, cash: 1e12 }, id: 'downtown' });
    if (tied.bundle) {
      expect(tied.bundle.enabled).toBe(false);
      expect(rich.bundle!.enabled).toBe(true);
    } else {
      expect(rich.bundle).toBeNull();
    }
  });
});

describe('the drawer cache (M32)', () => {
  it('reruns no what-if simulation when only cash or sales move', () => {
    const s = withShop(base(), 'downtown', { managed: true });
    drawerCards({ game: s, id: 'downtown' });
    const gain = jest.spyOn(G, 'upgradeGain');
    const fleet = jest.spyOn(G, 'vehicleGain');
    const decor = jest.spyOn(G, 'decorGain');
    try {
      drawerCards({ game: { ...s, cash: 12345 }, id: 'downtown' });
      drawerCards({ game: { ...s, cash: 99999, shops: { ...s.shops, downtown: { ...s.shops.downtown, sold: 777 } } }, id: 'downtown' });
      expect(gain).not.toHaveBeenCalled();
      expect(fleet).not.toHaveBeenCalled();
      expect(decor).not.toHaveBeenCalled();
      // a level moves: it recomputes
      drawerCards({ game: withShop(s, 'downtown', { prep: 5 }), id: 'downtown' });
      expect(gain).toHaveBeenCalled();
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

// ---------- v5.16 (card P1): cards say what they do; the game stops choosing; the header is the report ----------

describe('the drawer after the tutorial (P1)', () => {
  const after = (cash = 1e9): G.GameState => {
    const s = base(cash);
    return withShop({ ...s, seenScenes: [...s.seenScenes, 'downtown-4'] }, 'downtown', { managed: true, prep: 20, ovens: 20, counter: 20, drivers: 1 });
  };
  const card = (s: G.GameState, key: string) => drawerCards({ game: s, id: 'downtown' }).cards.find((c) => c.key === key)!;

  test('no card is hot after the tutorial; during it the tied stations still are', () => {
    const during = { ...after(), seenScenes: [] };
    expect(drawerCards({ game: during, id: 'downtown' }).cards.some((c) => c.hot)).toBe(true);
    expect(drawerCards({ game: after(), id: 'downtown' }).cards.some((c) => c.hot)).toBe(false);
  });
  test('the bottleneck card gives its gain a minute and payback; a card that adds nothing names itself', () => {
    const s = after();
    expect(card(s, 'drivers').detail).toMatch(/\+\$[\d.]+[KMB]?\/min · pays back in \d+[smh]/);
    expect(card(s, 'prep').detail).toContain('Prep isn’t holding you back');
    expect(card(s, 'grade').detail).toMatch(/pays back in|Oven grade isn’t holding you back/);
    expect(drawerCards({ game: s, id: 'downtown' }).decor[0].detail).toMatch(/\/min · pays back in/);
  });
  test('during the tutorial the old readouts stay', () => {
    const during = { ...after(), seenScenes: [] };
    expect(card(during, 'drivers').detail).toMatch(/\+\$[\d.]+[KMB]?\/s/);
    expect(card(during, 'drivers').detail).not.toMatch(/\/min/);
  });
  test('heads and the manager say what they do, not a number', () => {
    const s = withShop({ ...after(), seenScenes: ['downtown-4'] }, 'suburbs', { built: true });
    const v = drawerCards({ game: { ...s, active: 'suburbs' }, id: 'suburbs' });
    expect(v.cards.find((c) => c.key === 'headPrep')!.detail).toBe('Runs this station for you, nonstop');
    expect(v.cards.find((c) => c.key === 'manager')!.detail).not.toMatch(/\+\$/);
  });
  test('the header line is the report for a shop that runs itself, and the tied stages before that', () => {
    const t = base();
    expect(drawerCards({ game: t, id: 'downtown' }).bottleneck.startsWith('Bottleneck: ')).toBe(true);
    // a fresh stamp from a ticked game gives the report line
    const g = after(0);
    const ticked = G.playTick(G.playTick(g, 1, g.lastSavedAt + 1000), 1, g.lastSavedAt + 2000);
    const line = drawerCards({ game: ticked, id: 'downtown' }).bottleneck;
    expect(line.startsWith('Bottleneck: ')).toBe(false);
    expect(line).toMatch(/bake|minute|tip|cold/i);
  });
  test('the cache key knows the tutorial has ended', () => {
    const s = after();
    expect(drawerKey({ game: s, id: 'downtown' })).not.toBe(drawerKey({ game: { ...s, seenScenes: [] }, id: 'downtown' }));
  });
});
