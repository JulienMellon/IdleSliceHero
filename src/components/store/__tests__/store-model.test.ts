/// <reference types="jest" />
import { MAX_CONCURRENT_BOOSTS } from '../../../content/rewards';
import * as G from '../../../engine/game';
import { GRANTS } from '../../../services/grants';
import { PRODUCT_IDS, type ProductId } from '../../../services/types';
import { ANALYTICS_LABEL, analyticsNote, analyticsSwitchText, copyLine, installIdText, restoreResult } from '../settings-model';
import {
  applyGrant,
  buyLine,
  productChips,
  PRODUCT_RIBBON,
  AD_WINDOW_MS,
  adCount7,
  amountsFrom,
  bestRate,
  looksFor,
  looksUnowned,
  createSeenOnce,
  type RowContext,
  type StorePrefs,
  starterBestRate,
  withAdGrant,
  NO_PREFS,
  parsePrefs,
  PRODUCT_ORDER,
  PRODUCTS,
  pricesFrom,
  productRows,
  restoreLine,
} from '../store-model';

const NOW = 1_800_000_000_000;

describe('the products tab', () => {
  const prices = {
    starter_pack: '$2.99',
    nonnas_plus: '$4.99',
    diamonds_80: '$0.99',
    diamonds_500: '$4.99',
    diamonds_1200: '$9.99',
    diamonds_2600: '$19.99',
  } as const;
  test('sells the six products, and the order and the copy cover every id', () => {
    expect([...PRODUCT_ORDER].sort()).toEqual([...PRODUCT_IDS].sort());
    expect(Object.keys(PRODUCTS).sort()).toEqual([...PRODUCT_IDS].sort());
    expect(productRows(prices, []).map((r) => r.id)).toEqual(['starter_pack', 'nonnas_plus', 'diamonds_80', 'diamonds_500', 'diamonds_1200', 'diamonds_2600']);
  });
  test("prices are the store's own text, and a buyable button needs one", () => {
    const rows = productRows(prices, []);
    expect(rows.map((r) => r.price)).toEqual(['$2.99', '$4.99', '$0.99', '$4.99', '$9.99', '$19.99']);
    expect(rows.every((r) => r.enabled && r.state === 'buy' && r.label === r.price)).toBe(true);
  });
  test('while the prices load: no price, a disabled button, never a placeholder price', () => {
    const rows = productRows(null, []);
    expect(rows.every((r) => r.price === null && !r.enabled && r.state === 'loading')).toBe(true);
    expect(rows.map((r) => r.label).join(' ')).not.toMatch(/\$|\d\.\d\d/);
  });
  test('when the prices fail: the pack stays, unpriced and disabled', () => {
    const rows = productRows({}, []);
    expect(rows).toHaveLength(6);
    expect(rows.every((r) => r.price === null && !r.enabled && r.state === 'unpriced' && r.label === 'Price unavailable')).toBe(true);
    // one pack missing from the answer is unpriced alone
    const part = productRows({ diamonds_80: '$0.99' }, []);
    expect(part.find((r) => r.id === 'diamonds_80')!.enabled).toBe(true);
    expect(part.find((r) => r.id === 'diamonds_500')!.enabled).toBe(false);
  });
  test('the Starter Pack leaves once bought; Plus stays as Owned; packs can be bought again', () => {
    const rows = productRows(prices, ['starter_pack', 'nonnas_plus']);
    expect(rows.map((r) => r.id)).toEqual(['nonnas_plus', 'diamonds_80', 'diamonds_500', 'diamonds_1200', 'diamonds_2600']);
    const plus = rows[0];
    expect(plus.state).toBe('owned');
    expect(plus.label).toBe('Owned');
    expect(plus.enabled).toBe(false);
    expect(rows.slice(1).every((r) => r.enabled)).toBe(true);
  });
  test('the store list becomes a price map; unknown ids and empty prices are dropped', () => {
    expect(
      pricesFrom([
        { id: 'diamonds_80', price: '$0.99' },
        { id: 'nonnas_plus', price: '' },
        { id: 'bogus' as never, price: '$1' },
      ]),
    ).toEqual({ diamonds_80: '$0.99' });
  });
  test('nothing in the tab is a random reward', () => {
    const words = Object.values(PRODUCTS)
      .flatMap((p) => [p.title, p.blurb])
      .join(' ');
    expect(words).not.toMatch(/random|chance|mystery|spin|lucky|loot/i);
    // and the grants are fixed amounts
    for (const id of PRODUCT_IDS) expect(Number.isInteger(GRANTS[id].diamonds)).toBe(true);
  });
  test('result lines', () => {
    expect(buyLine('purchased')).toMatch(/Thank you/);
    expect(buyLine('failed')).toMatch(/didn’t go through/);
    expect(buyLine('cancelled')).toBe('');
    expect(restoreLine(['nonnas_plus'])).toBe("Restored: Nonna's Plus.");
    expect(restoreLine([])).toMatch(/No earlier purchases/);
    expect(restoreResult(['starter_pack', 'nonnas_plus'])).toBe("Restored: Nonna's Starter Pack, Nonna's Plus.");
  });
});

describe('a paid-out grant', () => {
  const g0 = (): G.GameState => G.newGame(NOW);
  test('the Starter Pack: 400 diamonds, a 24 h 2x boost and the founder awning, worn', () => {
    const g = applyGrant({ ...g0(), rewards: { ...g0().rewards, diamonds: 10, worn: ['awning-gold'] } }, GRANTS.starter_pack, NOW);
    expect(g.rewards.diamonds).toBe(410);
    expect(g.rewards.boosts).toEqual([{ mult: 2, until: NOW + 24 * 3_600_000, source: 'purchase' }]);
    expect(g.rewards.cosmetics).toContain('awning-founder');
    // it replaces the gold awning (same part)
    expect(g.rewards.worn).toEqual(['awning-founder']);
  });
  test('a diamond pack only adds diamonds; Plus changes nothing in the game', () => {
    const base = g0();
    expect(applyGrant(base, GRANTS.diamonds_500, NOW).rewards.diamonds).toBe(base.rewards.diamonds + 500);
    const plus = applyGrant(base, GRANTS.nonnas_plus, NOW);
    expect(plus.rewards).toEqual(base.rewards);
  });
  test('the boost list stays inside its limit and a second pack of the same kind is not paid twice by this function (the ledger does that)', () => {
    let g = g0();
    for (let i = 0; i < MAX_CONCURRENT_BOOSTS + 3; i++) g = applyGrant(g, GRANTS.starter_pack, NOW + i);
    expect(g.rewards.boosts).toHaveLength(MAX_CONCURRENT_BOOSTS);
  });
});

describe('saved prefs', () => {
  test('read back, and a damaged value is the default', () => {
    expect(parsePrefs(JSON.stringify({ starterOffered: true, boosterAdDay: '2026-11-11', adGrants: [5, 'x', 7] }))).toEqual({
      starterOffered: true,
      boosterAdDay: '2026-11-11',
      adGrants: [5, 7],
    });
    expect(parsePrefs(null)).toEqual(NO_PREFS);
    expect(parsePrefs('{"starterOffered":"yes","boosterAdDay":5}')).toEqual(NO_PREFS);
    expect(parsePrefs('nope')).toEqual(NO_PREFS);
  });
});

describe('Settings words', () => {
  test('the analytics switch says what it is and what it does', () => {
    expect(ANALYTICS_LABEL).toBe('Share anonymous analytics');
    expect(analyticsSwitchText(true)).toBe('Share anonymous analytics: On');
    expect(analyticsSwitchText(false)).toBe('Share anonymous analytics: Off');
    expect(analyticsNote(false)).toMatch(/Nothing is sent/);
    expect(analyticsNote(true)).not.toMatch(/Nothing is sent/);
  });
  test('the install ID is never blank, and a copy has three answers', () => {
    expect(installIdText('')).toBe('Not ready yet');
    expect(installIdText('abc')).toBe('abc');
    expect(copyLine('copied')).toBe('Copied.');
    expect(copyLine('shared')).toMatch(/Copy/);
    expect(copyLine('failed')).toMatch(/Couldn/);
  });
});

describe('the pack art (D496)', () => {
  test('the Starter Pack shows three chips taken from its grant; the others show none', () => {
    const chips = productChips('starter_pack');
    expect(chips.map((c) => c.kind)).toEqual(['diamonds', 'boost', 'awning']);
    expect(chips[0].title).toBe(String(GRANTS.starter_pack.diamonds));
    expect(chips[1].title).toBe(`${GRANTS.starter_pack.boost!.mult}× · ${GRANTS.starter_pack.boost!.hours} h`);
    expect(productChips('nonnas_plus')).toEqual([]);
    expect(productChips('diamonds_500')).toEqual([]);
  });
  test('the ribbon is on the Starter Pack only', () => {
    expect(Object.keys(PRODUCT_RIBBON)).toEqual(['starter_pack']);
  });
});

describe('the store cards (card N1)', () => {
  const prices = {
    starter_pack: '$2.99',
    nonnas_plus: '$4.99',
    diamonds_80: '$0.99',
    diamonds_500: '$4.99',
    diamonds_1200: '$9.99',
    diamonds_2600: '$19.99',
  } as const;
  const amounts = amountsFrom([
    { id: 'starter_pack', amount: 2.99 },
    { id: 'nonnas_plus', amount: 4.99 },
    { id: 'diamonds_80', amount: 0.99 },
    { id: 'diamonds_500', amount: 4.99 },
    { id: 'diamonds_1200', amount: 9.99 },
    { id: 'diamonds_2600', amount: 19.99 },
  ]);
  const ctx: RowContext = { amounts, firstUsed: [], adCount: 0, income: 1000, looksLeft: Infinity };
  const ALL: ProductId[] = ['diamonds_80', 'diamonds_500', 'diamonds_1200', 'diamonds_2600'];
  const row = (id: string, c = ctx) => productRows(prices, [], c).find((r) => r.id === id)!;

  test('the best rate is computed from the store numbers: today the 2,600 pack', () => {
    expect(bestRate(amounts)).toBe('diamonds_2600');
    expect(bestRate(amounts, ALL)).toBe('diamonds_2600');
    // a different set of prices moves it
    expect(bestRate({ ...amounts, diamonds_500: 3 })).toBe('diamonds_500');
  });
  test('the best rate counts what the player gets today: a pack whose first buy is unused pays double (G120)', () => {
    // the 2,600 pack's first buy used: 130 a dollar, but the 1,200 pack still pays 2,400 per $9.99 = 240
    expect(bestRate(amounts, ['diamonds_2600'])).toBe('diamonds_1200');
    // both used: the 500 pack's first buy, 1,000 per $4.99 = 200, is the best left
    expect(bestRate(amounts, ['diamonds_1200', 'diamonds_2600'])).toBe('diamonds_500');
    expect(productRows(prices, [], { ...ctx, firstUsed: ['diamonds_1200', 'diamonds_2600'] }).find((r) => r.id === 'diamonds_500')!.tags).toContain(
      'Best diamond-pack rate',
    );
  });
  test('the best rate is hidden while prices load, or when no pack has a price; a pack with no price is left out', () => {
    expect(bestRate(null)).toBeNull();
    expect(bestRate({})).toBeNull();
    // the 2,600 pack missing on the device: the claim moves to the 1,200 pack, and its card has no price and no tag
    const { diamonds_2600: _gone, ...without } = amounts!;
    expect(bestRate(without)).toBe('diamonds_1200');
    const rows = productRows(
      pricesFrom([
        { id: 'diamonds_2600', price: '' },
        { id: 'diamonds_1200', price: '$9.99' },
      ]),
      [],
      { ...ctx, amounts: without },
    );
    expect(rows.find((r) => r.id === 'diamonds_1200')!.tags).toContain('Best diamond-pack rate');
    expect(rows.find((r) => r.id === 'diamonds_2600')).toMatchObject({ price: null, enabled: false, state: 'unpriced', tags: ['First buy: 2×'] });
    expect(productRows(prices, [], { ...ctx, amounts: null }).flatMap((r) => r.tags)).not.toContain('Best diamond-pack rate');
    expect(row('diamonds_2600').tags).toContain('Best diamond-pack rate');
    expect(row('diamonds_1200').tags).not.toContain('Best diamond-pack rate');
    expect(row('diamonds_500').tags).not.toContain('Best diamond-pack rate');
  });
  test('"Most diamonds per dollar" shows only when it is true at the till: not while a first buy 2× is live (G120, S99)', () => {
    // 400 for $2.99 is 134 a dollar; a first buy of the 80 pack is 160 for $0.99
    expect(starterBestRate(amounts)).toBe(false);
    expect(row('starter_pack').rate).toBeNull();
    expect(starterBestRate(amounts, ['diamonds_80', 'diamonds_500'])).toBe(false); // the 2,600 pack's first buy is 260 a dollar
    expect(starterBestRate(amounts, ALL)).toBe(true);
    expect(row('starter_pack', { ...ctx, firstUsed: ALL }).rate).toBe('Most diamonds per dollar in the store');
    // D569: and then no pack says "Best rate" beside it; with the Starter bought, the card is gone and the pack may
    const used = { ...ctx, firstUsed: ALL };
    expect(productRows(prices, [], used).flatMap((r) => r.tags)).not.toContain('Best diamond-pack rate');
    expect(productRows(prices, ['starter_pack'], used).find((r) => r.id === 'diamonds_2600')!.tags).toContain('Best diamond-pack rate');
    // at $4.99 it is 80 per dollar: no longer the most
    const dear = { ...amounts, starter_pack: 4.99 };
    expect(starterBestRate(dear, ALL)).toBe(false);
    expect(starterBestRate(null, ALL)).toBe(false);
  });
  test('"First buy: 2×" says what doubles, in diamonds, until it is used', () => {
    expect(row('diamonds_80').firstLine).toBe('First buy pays double: 160 diamonds');
    expect(row('diamonds_1200').firstLine).toBe('First buy pays double: 2,400 diamonds');
    expect(row('diamonds_2600').firstLine).toBe('First buy pays double: 5,200 diamonds');
    expect(row('diamonds_500', { ...ctx, firstUsed: ['diamonds_500'] }).firstLine).toBeNull();
    expect(row('starter_pack').firstLine).toBeNull();
    expect(row('nonnas_plus').firstLine).toBeNull();
  });
  test('"Enough for N looks" never promises more than the looks still for sale (G121)', () => {
    expect(row('diamonds_1200').blurb).toBe('Enough for 8 looks');
    expect(row('diamonds_1200', { ...ctx, looksLeft: 3 }).blurb).toBe('Enough for 3 looks');
    expect(row('diamonds_1200', { ...ctx, looksLeft: 0 }).blurb).toBe('');
    expect(row('starter_pack', { ...ctx, looksLeft: 0 }).chips[0].sub).toBe('diamonds');
    expect(looksUnowned([])).toBe(6);
    expect(looksUnowned(['oven-gold', 'storefront-skin-3', 'awning-founder'])).toBe(4);
    expect(looksUnowned(['oven-gold', 'storefront-skin-101', 'oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold'])).toBe(0);
  });
  test('the boost chip with no pace still says what it is', () => {
    expect(productChips('starter_pack', 0)[1].sub).toBe('Double income for a full day');
  });
  test('pack_card_seen is counted once until the count is reset', () => {
    const seen = createSeenOnce();
    expect([seen.first('diamonds_80'), seen.first('diamonds_80'), seen.first('diamonds_500')]).toEqual([true, false, true]);
    seen.reset();
    expect(seen.first('diamonds_80')).toBe(true);
  });
  test('the Starter card: Nonna, the ribbon, three chips with game units and no struck-through price', () => {
    const r = row('starter_pack');
    expect(r.nonna).toBe('I pack it myself. Like a lunch, cara.');
    expect(r.tags).toEqual(['ONE PER OWNER']);
    expect(r.blurb).toBe('400 diamonds, 2× income for 24 hours and the Founder awning');
    expect(r.chips.map((c) => c.sub)).toEqual(['Enough for 2 shop looks', "≈ $86.4M at your shop's pace", 'Only in this pack']);
    expect(JSON.stringify(r)).not.toMatch(/ONE-TIME|worth|value|save \d|limited|left/i);
  });
  test('diamond packs: base, "+N bonus", looks, and "First buy: 2×" until it is used', () => {
    const r = row('diamonds_500');
    expect([r.base, r.bonus, r.blurb]).toEqual([400, '+100 bonus', 'Enough for 3 looks']);
    expect(r.tags).toEqual(['First buy: 2×']);
    expect(row('diamonds_500', { ...ctx, firstUsed: ['diamonds_500'] }).tags).toEqual([]);
    expect(row('diamonds_1200').tags).toEqual(['First buy: 2×']);
    expect(row('diamonds_2600').tags).toEqual(['Best diamond-pack rate', 'First buy: 2×']);
    expect([row('diamonds_2600').base, row('diamonds_2600').bonus]).toEqual([1600, '+1000 bonus']);
    expect([row('diamonds_80').bonus, row('diamonds_80').blurb]).toEqual([null, '']); // 80 diamonds is under one look
    expect(row('starter_pack').tags).not.toContain('First buy: 2×');
    expect(row('nonnas_plus').tags).toEqual([]);
  });
  test('Plus: the 7-day ad line when there is something to count, and "Pay once"', () => {
    expect(row('nonnas_plus').adLine).toBeNull();
    expect(row('nonnas_plus', { ...ctx, adCount: 5 }).adLine).toBe('You watched 5 ads this week. Plus skips all 5.');
    expect(row('nonnas_plus').once).toBe('Pay once. Yours forever.');
  });
  test('looks are whole looks at the vanity price', () => {
    expect([looksFor(149), looksFor(150), looksFor(400)]).toEqual([0, 1, 2]);
  });
  test('the rolling 7-day ad count', () => {
    const now = 10 * AD_WINDOW_MS;
    // the grants of 8, 6 and 3 days ago and now: the first is outside the window when the last comes in
    const day = 86_400_000;
    let p: StorePrefs = { ...NO_PREFS, adGrants: [now - 8 * day] };
    for (const ago of [6, 3, 0]) p = withAdGrant(p, now - ago * day);
    // the 8-day-old stamp was dropped when a later grant came in
    expect(p.adGrants).toHaveLength(3);
    expect(adCount7(p.adGrants, now)).toBe(3);
    expect(adCount7([now - AD_WINDOW_MS], now)).toBe(0);
    expect(adCount7([now - AD_WINDOW_MS + 1], now)).toBe(1);
    expect(withAdGrant(NO_PREFS, now).adGrants).toEqual([now]);
  });
  test('the ad stamps are a window and a cap, and a stamp from the future counts (T134)', () => {
    const now = 10 * AD_WINDOW_MS;
    // the window is dropped on write: only stamps inside it survive, the new one last
    expect(withAdGrant({ ...NO_PREFS, adGrants: [now - AD_WINDOW_MS - 1, now - AD_WINDOW_MS + 5] }, now).adGrants).toEqual([now - AD_WINDOW_MS + 5, now]);
    // the cap: 200 kept, the newest
    const many = Array.from({ length: 250 }, (_, i) => now - 1000 + i);
    const capped = withAdGrant({ ...NO_PREFS, adGrants: many }, now).adGrants;
    expect(capped).toHaveLength(200);
    expect(capped[capped.length - 1]).toBe(now);
    // a clock set back leaves stamps ahead of now: they still count
    expect(adCount7([now + 3 * 86_400_000], now)).toBe(1);
  });
});
