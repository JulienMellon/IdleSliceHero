/// <reference types="jest" />
import { MAX_CONCURRENT_BOOSTS } from '../../../content/rewards';
import * as G from '../../../engine/game';
import { GRANTS } from '../../../services/grants';
import { PRODUCT_IDS } from '../../../services/types';
import { ANALYTICS_LABEL, analyticsNote, analyticsSwitchText, copyLine, installIdText, restoreResult } from '../settings-model';
import { applyGrant, buyLine, NO_PREFS, parsePrefs, PRODUCT_ORDER, PRODUCTS, pricesFrom, productRows, restoreLine, STARTER_DELAY, starterShows } from '../store-model';

const NOW = 1_800_000_000_000;

describe('the products tab', () => {
  const prices = { starter_pack: '$2.99', nonnas_plus: '$4.99', diamonds_80: '$0.99', diamonds_500: '$4.99', diamonds_1200: '$9.99' } as const;
  test('sells the five products, and the order and the copy cover every id', () => {
    expect([...PRODUCT_ORDER].sort()).toEqual([...PRODUCT_IDS].sort());
    expect(Object.keys(PRODUCTS).sort()).toEqual([...PRODUCT_IDS].sort());
    expect(productRows(prices, []).map((r) => r.id)).toEqual(['starter_pack', 'nonnas_plus', 'diamonds_80', 'diamonds_500', 'diamonds_1200']);
  });
  test('prices are the store\'s own text, and a buyable button needs one', () => {
    const rows = productRows(prices, []);
    expect(rows.map((r) => r.price)).toEqual(['$2.99', '$4.99', '$0.99', '$4.99', '$9.99']);
    expect(rows.every((r) => r.enabled && r.state === 'buy' && r.label === r.price)).toBe(true);
  });
  test('while the prices load: no price, a disabled button, never a placeholder price', () => {
    const rows = productRows(null, []);
    expect(rows.every((r) => r.price === null && !r.enabled && r.state === 'loading')).toBe(true);
    expect(rows.map((r) => r.label).join(' ')).not.toMatch(/\$|\d\.\d\d/);
  });
  test('when the prices fail: the pack stays, unpriced and disabled', () => {
    const rows = productRows({}, []);
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.price === null && !r.enabled && r.state === 'unpriced' && r.label === 'Price unavailable')).toBe(true);
    // one pack missing from the answer is unpriced alone
    const part = productRows({ diamonds_80: '$0.99' }, []);
    expect(part.find((r) => r.id === 'diamonds_80')!.enabled).toBe(true);
    expect(part.find((r) => r.id === 'diamonds_500')!.enabled).toBe(false);
  });
  test('the Starter Pack leaves once bought; Plus stays as Owned; packs can be bought again', () => {
    const rows = productRows(prices, ['starter_pack', 'nonnas_plus']);
    expect(rows.map((r) => r.id)).toEqual(['nonnas_plus', 'diamonds_80', 'diamonds_500', 'diamonds_1200']);
    const plus = rows[0];
    expect(plus.state).toBe('owned');
    expect(plus.label).toBe('Owned');
    expect(plus.enabled).toBe(false);
    expect(rows.slice(1).every((r) => r.enabled)).toBe(true);
  });
  test('the store list becomes a price map; unknown ids and empty prices are dropped', () => {
    expect(pricesFrom([{ id: 'diamonds_80', price: '$0.99' }, { id: 'nonnas_plus', price: '' }, { id: 'bogus' as never, price: '$1' }])).toEqual({ diamonds_80: '$0.99' });
  });
  test('nothing in the tab is a random reward', () => {
    const words = Object.values(PRODUCTS).flatMap((p) => [p.title, p.blurb]).join(' ');
    expect(words).not.toMatch(/random|chance|mystery|spin|lucky|loot/i);
    // and the grants are fixed amounts
    for (const id of PRODUCT_IDS) expect(Number.isInteger(GRANTS[id].diamonds)).toBe(true);
  });
  test('result lines', () => {
    expect(buyLine('purchased')).toMatch(/Thank you/);
    expect(buyLine('failed')).toMatch(/didn’t go through/);
    expect(buyLine('cancelled')).toBe('');
    expect(restoreLine(['nonnas_plus'])).toBe('Restored: Nonna’s Plus.');
    expect(restoreLine([])).toMatch(/No earlier purchases/);
    expect(restoreResult(['starter_pack', 'nonnas_plus'])).toBe('Restored: Starter Pack, Nonna’s Plus.');
  });
});

describe('a paid-out grant', () => {
  const g0 = (): G.GameState => G.newGame(NOW);
  test('the Starter Pack: 150 diamonds, a 24 h 2x boost and the founder awning, worn', () => {
    const g = applyGrant({ ...g0(), rewards: { ...g0().rewards, diamonds: 10, worn: ['awning-gold'] } }, GRANTS.starter_pack, NOW);
    expect(g.rewards.diamonds).toBe(160);
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

describe('the Starter Pack offer', () => {
  const ok = { at: 100, playSeconds: 100 + STARTER_DELAY, offered: false, owned: false, covered: false };
  test('shows once, after the tutorial and a short wait, when nothing else is up', () => {
    expect(starterShows(ok)).toBe(true);
    expect(starterShows({ ...ok, playSeconds: 100 + STARTER_DELAY - 1 })).toBe(false);
  });
  test.each([
    ['the tutorial did not end in this session', { at: null }],
    ['it was offered already', { offered: true }],
    ['it is owned', { owned: true }],
    ['a scene or popup is up', { covered: true }],
  ])('not when %s', (_, patch) => expect(starterShows({ ...ok, ...patch })).toBe(false));
});

describe('saved prefs', () => {
  test('read back, and a damaged value is the default', () => {
    expect(parsePrefs(JSON.stringify({ starterOffered: true, boosterAdDay: '2026-11-11' }))).toEqual({ starterOffered: true, boosterAdDay: '2026-11-11' });
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
