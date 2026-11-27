/// <reference types="jest" />
import { MASTERY } from '../../../content/endgame';
import * as G from '../../../engine/game';
import { grantCosmetic, wear } from '../../../engine/rewards';
import { LOOKS, SETS, setLooks, SOLD_LOOKS, TIER_PRICE } from '../../../content/catalog';
import { featured } from '../../../engine/vanity';
import { boosterShelf, buyCosmetic, lookName, SHELF_EMPTY, SHOP_TABS, VANITY_IDS, VANITY_PRICE, vanitySections, vanityViews } from '../shop-model';

const base = (): G.GameState => G.newGame(1_700_000_000_000);
const rich = (n = 500): G.GameState => ({ ...base(), rewards: { ...base().rewards, diamonds: n } });
const ok = (r: G.BuyResult): G.GameState => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};

describe('tab 1: Shop Style, the seven cosmetics', () => {
  test('the seven, first and in order, with their copy', () => {
    const v = vanityViews(base());
    expect(v.slice(0, 7).map((x) => x.id)).toEqual([...VANITY_IDS]);
    expect(v.slice(0, 7).map((x) => x.name)).toEqual([
      'Golden Oven',
      'Fresh Storefront',
      'Wood-Fired Oven',
      'Mint Scooter',
      'Neon Counter',
      'Golden Awning',
      'Master’s Plaque',
    ]);
    expect(v[0].desc).toBe('Gold-trimmed bricks. The pizza notices.');
  });

  test('150 diamonds each; short of them the button is off', () => {
    expect(VANITY_PRICE).toBe(150);
    const poor = vanityViews(base());
    expect(poor.slice(0, 6).every((x) => x.state === 'poor' && x.label === '150 \u{1F48E}')).toBe(true);
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

  test('T89 / C115: a sold skin is numbered from 101, so it never collides with the day-28 gift storefront-skin-{cycle}', () => {
    const first = vanityViews(rich(500))[1];
    expect(first).toMatchObject({ id: 'storefront-skin', buyId: 'storefront-skin-101', state: 'buy' });
    const g = ok(buyCosmetic(rich(500), first.buyId!));
    expect(vanityViews(g)[1]).toMatchObject({ state: 'worn', wearId: 'storefront-skin-101', buyId: null });
    // the gift of cycle 1 still lands: it is a different id, and is worn on arrival
    const gifted = { ...g, rewards: { ...g.rewards, ...grantCosmetic(g.rewards, 'storefront-skin-1') } };
    expect(gifted.rewards.cosmetics).toEqual(['storefront-skin-101', 'storefront-skin-1']);
    expect(gifted.rewards.worn).toEqual(['storefront-skin-1']);
    // an id a gift could give is not for sale
    expect(buyCosmetic(rich(500), 'storefront-skin-1')).toEqual({ ok: false, reason: 'Not for sale' });
    expect(buyCosmetic(rich(500), 'storefront-skin-28')).toEqual({ ok: false, reason: 'Not for sale' });
  });

  test('a gifted skin shows the item as owned: Wear', () => {
    const gifted: G.GameState = { ...base(), rewards: { ...base().rewards, cosmetics: ['storefront-skin-1'], worn: [], diamonds: 500 } };
    expect(vanityViews(gifted)[1]).toMatchObject({ state: 'owned', label: 'Wear', wearId: 'storefront-skin-1' });
  });

  test('earned cosmetics show as owned too (a gift, or the plaque)', () => {
    const g: G.GameState = { ...base(), rewards: { ...base().rewards, cosmetics: ['plaque-master'], worn: [] } };
    expect(vanityViews(g)[6]).toMatchObject({ state: 'owned', owned: true, label: 'Wear', wearId: 'plaque-master' });
  });
});

describe('tab 2: the booster shelf', () => {
  test('empty: the empty-shelf line', () => {
    expect(boosterShelf(base())).toEqual([]);
    expect(SHELF_EMPTY()).toBe('Shelf’s empty. Check back later!');
  });

  test('the inventory, one row each, with the index startBooster takes; no price anywhere', () => {
    const g: G.GameState = {
      ...base(),
      rewards: {
        ...base().rewards,
        boosters: [
          { mult: 2, seconds: 900 },
          { mult: 3, seconds: 1800 },
        ],
      },
    };
    const rows = boosterShelf(g);
    expect(rows.map((r) => r.index)).toEqual([0, 1]);
    expect(rows.map((r) => r.label)).toEqual(['2× income · 15 m', '3× income · 30 m']);
    const hour: G.GameState = {
      ...g,
      rewards: {
        ...g.rewards,
        boosters: [
          { mult: 2, seconds: 3600 },
          { mult: 2, seconds: 86400 },
          { mult: 1.5, seconds: 5400 },
        ],
      },
    };
    expect(boosterShelf(hour).map((r) => r.label)).toEqual(['2× income · 1 h', '2× income · 1 d', '1.5× income · 1 h 30 m']);
    expect(Object.keys(rows[0])).toEqual(['index', 'label']);
  });

  test('both tab titles are the copy', () => {
    expect(SHOP_TABS()).toEqual(['Shop Style', 'Booster Shelf']);
  });
});

const NOW = 1_700_000_000_000;
const section = (g: G.GameState, key: string) => vanitySections(g, NOW).find((x) => x.key === key)!;
const own = (g: G.GameState, ids: string[], diamonds = 0): G.GameState => ({
  ...g,
  rewards: { ...g.rewards, diamonds, cosmetics: [...g.rewards.cosmetics, ...ids], worn: [...g.rewards.worn] },
});

describe('the Vanity tab (v5.24, card U6)', () => {
  test('a fresh tab: Featured four first, then the six sets, then small and medium looks (no large generic look)', () => {
    const secs = vanitySections(base(), NOW);
    expect(secs.map((x) => x.key)).toEqual(['featured', ...SETS.map((x) => `set:${x.id}`), 'tier:small', 'tier:medium']);
    expect(secs[0].title).toBe('This week’s picks');
    expect(secs[0].cards).toHaveLength(4);
    expect(secs[0].cards.map((c) => c.id)).toEqual(featured(base(), NOW).map((l) => l.id));
    expect(secs[0]).toMatchObject({ progress: '', done: false });
  });

  test('every look for sale is on the tab, with a name, and the tab lists no look twice outside Featured', () => {
    const ids = vanitySections(base(), NOW)
      .filter((x) => x.kind !== 'featured')
      .flatMap((x) => x.cards.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(LOOKS.map((l) => l.id).sort());
    for (const l of LOOKS) expect(lookName(l.id)).not.toMatch(/^(look|shop\.item)\./);
    expect(lookName('facade-classic')).toBe('Nonna-approved front');
    expect(lookName('awning-marble')).toBe('Velvet-rope awning');
  });

  test('a card reads the tier price on its button: "60 \u{1F48E}", "150 \u{1F48E}", "400 \u{1F48E}"', () => {
    const g = base();
    const pick = (id: string) =>
      vanitySections(g, NOW)
        .flatMap((x) => x.cards)
        .find((c) => c.id === id)!;
    expect(pick('menu-chalkboard')).toMatchObject({ label: `${TIER_PRICE.small} \u{1F48E}`, price: 60, state: 'poor' });
    expect(pick('awning-candy')).toMatchObject({ label: '150 \u{1F48E}', price: 150 });
    expect(pick('facade-marble')).toMatchObject({ label: '400 \u{1F48E}', price: 400 });
  });

  test('short of diamonds the button reads the price and is "poor"; with them it is "buy", and a buy owns and wears the look', () => {
    expect(vanityViews(base()).find((v) => v.id === 'facade-diner')).toMatchObject({ state: 'poor', buyId: 'facade-diner', label: '400 \u{1F48E}' });
    const flush = rich(400);
    expect(vanityViews(flush).find((v) => v.id === 'facade-diner')?.state).toBe('buy');
    const g = ok(buyCosmetic(flush, 'facade-diner'));
    expect(g.rewards.diamonds).toBe(0);
    expect(vanityViews(g).find((v) => v.id === 'facade-diner')).toMatchObject({
      state: 'worn',
      owned: true,
      label: 'Worn',
      wearId: 'facade-diner',
      buyId: null,
    });
  });

  test('a set piece says which shop it shows in; a generic look does not', () => {
    const v = vanityViews(base());
    expect(v.find((x) => x.id === 'facade-dockside')?.desc).toBe('Shows in Waterfront');
    expect(v.find((x) => x.id === 'oven-brick')?.desc).toBe('Shows in Industrial');
    expect(v.find((x) => x.id === 'chime-bell')?.desc).toBe('');
  });

  test('a half set: its progress reads "2/4 pieces", no check, no done line', () => {
    const g = own(base(), ['facade-classic', 'menu-classic']);
    expect(section(g, 'set:classic')).toMatchObject({ progress: '2/4 pieces', done: false, doneLine: '', speaker: null });
    expect(section(g, 'set:classic').cards.filter((c) => c.owned)).toHaveLength(2);
    expect(section(g, 'set:diner').progress).toBe('0/4 pieces');
  });

  test('a complete set: the check, its done line and the manager who says it (Nonna always; the rest only after their hire scene)', () => {
    const classic = own(
      base(),
      setLooks('classic').map((l) => l.id),
    );
    expect(section(classic, 'set:classic')).toMatchObject({
      progress: '4/4 pieces',
      done: true,
      doneLine: 'Now it looks like Rosa’s. Good, eh?',
      speaker: 'Nonna Rosa',
    });
    const diner = own(
      base(),
      setLooks('diner').map((l) => l.id),
    );
    // Deb's hire scene has not played: the line is shown nameless, so the hire is not spoiled
    expect(section(diner, 'set:diner')).toMatchObject({ done: true, doneLine: 'Matching set. Coach cried. I didn’t.', speaker: null });
    expect(section({ ...diner, seenScenes: ['suburbs-hire'] }, 'set:diner').speaker).toBe('Deb');
  });

  test('all owned: Featured is gone, every set is done, every button is Wear or Worn (the plaque stays earned)', () => {
    const g = own(
      base(),
      SOLD_LOOKS.map((l) => (l.id === 'storefront-skin' ? 'storefront-skin-101' : l.id)),
    );
    const secs = vanitySections(g, NOW);
    expect(secs.some((x) => x.kind === 'featured')).toBe(false);
    expect(secs.filter((x) => x.kind === 'set').every((x) => x.done && x.doneLine !== '')).toBe(true);
    const cards = secs.flatMap((x) => x.cards);
    expect(cards.filter((c) => c.state === 'earn').map((c) => c.id)).toEqual(['plaque-master']);
    expect(cards.filter((c) => c.id !== 'plaque-master').every((c) => c.owned && (c.label === 'Wear' || c.label === 'Worn'))).toBe(true);
  });

  test('the founder awning joins the medium looks once owned', () => {
    const g = own(base(), ['awning-founder']);
    expect(section(g, 'tier:medium').cards.map((c) => c.id)).toContain('awning-founder');
    expect(section(base(), 'tier:medium').cards.map((c) => c.id)).not.toContain('awning-founder');
  });
});
