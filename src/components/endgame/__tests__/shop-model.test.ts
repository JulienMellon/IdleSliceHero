/// <reference types="jest" />
import { MASTERY } from '../../../content/endgame';
import * as G from '../../../engine/game';
import { wear } from '../../../engine/rewards';
import { boosterShelf, buyCosmetic, SHELF_EMPTY, SHOP_TABS, VANITY_IDS, VANITY_PRICE, vanityViews } from '../shop-model';

const base = (): G.GameState => G.newGame(1_700_000_000_000);
const rich = (n = 500): G.GameState => ({ ...base(), rewards: { ...base().rewards, diamonds: n } });
const ok = (r: G.BuyResult): G.GameState => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};

describe('tab 1: Shop Style, the seven cosmetics', () => {
  test('the seven, in order, with their copy', () => {
    const v = vanityViews(base());
    expect(v.map((x) => x.id)).toEqual([...VANITY_IDS]);
    expect(v.map((x) => x.name)).toEqual(['Golden Oven', 'Fresh Storefront', 'Wood-Fired Oven', 'Mint Scooter', 'Neon Counter', 'Golden Awning', 'Master’s Plaque']);
    expect(v[0].desc).toBe('Gold-trimmed bricks. The pizza notices.');
  });

  test('150 diamonds each; short of them the button is off', () => {
    expect(VANITY_PRICE).toBe(150);
    const poor = vanityViews(base());
    expect(poor.slice(0, 6).every((x) => x.state === 'poor' && x.label === '150 diamonds')).toBe(true);
    const flush = vanityViews(rich(150));
    expect(flush.slice(0, 6).every((x) => x.state === 'buy')).toBe(true);
  });

  test('the master plaque says "earn 18 stars" and is never sold, however many diamonds', () => {
    const v = vanityViews(rich(100_000)).find((x) => x.id === 'plaque-master')!;
    expect(v).toMatchObject({ state: 'earn', label: 'earn 18 stars', buyId: null, wearId: null });
    expect(MASTERY.masterTotal).toBe(18);
    expect(buyCosmetic(rich(100_000), 'plaque-master')).toEqual({ ok: false, reason: 'Not for sale' });
    expect(buyCosmetic(rich(), 'hamster-wheel')).toEqual({ ok: false, reason: 'Not for sale' });
  });

  test('buying spends 150 diamonds, owns the cosmetic and wears it at once', () => {
    const g = ok(buyCosmetic(rich(200), 'oven-gold'));
    expect(g.rewards.diamonds).toBe(50);
    expect(g.rewards.cosmetics).toContain('oven-gold');
    expect(g.rewards.worn).toContain('oven-gold');
    expect(vanityViews(g)[0]).toMatchObject({ state: 'worn', label: 'Worn', wearId: 'oven-gold' });
  });

  test('refused with no change: not enough diamonds, or already owned', () => {
    expect(buyCosmetic(rich(149), 'oven-gold')).toEqual({ ok: false, reason: 'Not enough diamonds' });
    const g = ok(buyCosmetic(rich(500), 'scooter-mint'));
    expect(buyCosmetic(g, 'scooter-mint')).toEqual({ ok: false, reason: 'Already yours' });
  });

  test('owned and not worn is "Wear"; wearing a second oven skin takes the first off', () => {
    let g = ok(buyCosmetic(rich(500), 'oven-gold'));
    g = ok(buyCosmetic(g, 'oven-woodfired'));
    const v = vanityViews(g);
    expect(v[0]).toMatchObject({ state: 'owned', label: 'Wear' });
    expect(v[2]).toMatchObject({ state: 'worn' });
    const back = vanityViews(wear(g, 'oven-gold'));
    expect(back[0].state).toBe('worn');
    expect(back[2].state).toBe('owned');
  });

  test('the storefront item is any numbered skin: buy skin 1, then the next one is skin 2', () => {
    const first = vanityViews(rich(500))[1];
    expect(first).toMatchObject({ id: 'storefront-skin', buyId: 'storefront-skin-1', state: 'buy' });
    const g = ok(buyCosmetic(rich(500), first.buyId!));
    const own = vanityViews(g)[1];
    expect(own).toMatchObject({ state: 'worn', wearId: 'storefront-skin-1', buyId: null });
    const gifted: G.GameState = { ...base(), rewards: { ...base().rewards, cosmetics: ['storefront-skin-1'], worn: [], diamonds: 500 } };
    expect(vanityViews(gifted)[1]).toMatchObject({ state: 'owned', label: 'Wear' });
    const two = ok(buyCosmetic({ ...rich(500), rewards: { ...rich(500).rewards, cosmetics: ['storefront-skin-1'] } }, 'storefront-skin-2'));
    expect(two.rewards.cosmetics).toEqual(['storefront-skin-1', 'storefront-skin-2']);
  });

  test('earned cosmetics show as owned too (a gift, or the plaque)', () => {
    const g: G.GameState = { ...base(), rewards: { ...base().rewards, cosmetics: ['plaque-master'], worn: [] } };
    expect(vanityViews(g)[6]).toMatchObject({ state: 'owned', label: 'Wear', wearId: 'plaque-master' });
  });
});

describe('tab 2: the booster shelf', () => {
  test('empty: the empty-shelf line', () => {
    expect(boosterShelf(base())).toEqual([]);
    expect(SHELF_EMPTY()).toBe('Shelf’s empty. Check back later!');
  });

  test('the inventory, one row each, with the index startBooster takes; no price anywhere', () => {
    const g: G.GameState = { ...base(), rewards: { ...base().rewards, boosters: [{ mult: 2, seconds: 900 }, { mult: 3, seconds: 1800 }] } };
    const rows = boosterShelf(g);
    expect(rows.map((r) => r.index)).toEqual([0, 1]);
    expect(rows.map((r) => r.label)).toEqual(['2× 15m', '3× 30m']);
    expect(Object.keys(rows[0])).toEqual(['index', 'label']);
  });

  test('both tab titles are the copy', () => {
    expect(SHOP_TABS()).toEqual(['Shop Style', 'Booster Shelf']);
  });
});
