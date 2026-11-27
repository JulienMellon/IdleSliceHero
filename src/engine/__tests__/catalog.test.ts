// The looks catalog (v5.24, card E7): every look is a row, priced by its tier; wearing rules; Featured by week; a set completes once.
import { CATALOG_TOTAL, LOOKS, PARTS, SETS, setLooks, SOLD_LOOKS, TIER_PRICE } from '../../content/catalog';
import { cosmeticPart, partOf, VANITY_IDS, VANITY_PRICE } from '../../content/endgame';
import * as G from '../game';
import { buyCosmetic, dressFor, featured, FEATURED_COUNT, setCompleteEvent, setProgress, weekIndex } from '../vanity';
import * as R from '../rewards';

const T0 = new Date(2026, 10, 23, 12).getTime(); // a Monday, local noon
const DAY = 86_400_000;
const rich = (n = 1_000_000): G.GameState => {
  const g = G.newGame(T0);
  return { ...g, rewards: { ...g.rewards, diamonds: n } };
};
const ok = (r: G.BuyResult): G.GameState => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const buyAll = (g: G.GameState, ids: readonly string[], now = T0): G.GameState => ids.reduce((s, id) => ok(buyCosmetic(s, id, now)), g);

describe('the catalog is data', () => {
  it('ids are unique, parts are known, every price is its tier price (the plaque is earned: 0)', () => {
    expect(new Set(LOOKS.map((l) => l.id)).size).toBe(LOOKS.length);
    for (const l of LOOKS) {
      expect(PARTS).toContain(l.part);
      expect(l.price).toBe(l.sold ? TIER_PRICE[l.tier] : 0);
      expect(Object.values(TIER_PRICE)).toContain(l.sold ? l.price : TIER_PRICE.medium);
    }
    expect(LOOKS.filter((l) => !l.sold).map((l) => l.id)).toEqual(['plaque-master']);
  });

  it('the total is within 5,500 to 6,500 diamonds', () => {
    expect(CATALOG_TOTAL).toBe(SOLD_LOOKS.reduce((n, l) => n + l.price, 0));
    expect(CATALOG_TOTAL).toBeGreaterThanOrEqual(5500);
    expect(CATALOG_TOTAL).toBeLessThanOrEqual(6500);
  });

  it('six sets of four: one large, one medium, two small; each shows only in its own neighbourhood; no part twice in a set', () => {
    expect(SETS).toHaveLength(6);
    for (const s of SETS) {
      const pieces = setLooks(s.id);
      expect(pieces.map((l) => l.tier).sort()).toEqual(['large', 'medium', 'small', 'small']);
      expect(pieces.every((l) => l.shows === s.hood)).toBe(true);
      expect(new Set(pieces.map((l) => l.part)).size).toBe(4);
      expect(pieces.find((l) => l.tier === 'large')?.part).toBe('facade');
    }
  });

  it("today's seven keep their ids, order and 150 price; VANITY_IDS and VANITY_PRICE are derived", () => {
    expect([...VANITY_IDS]).toEqual(['oven-gold', 'storefront-skin', 'oven-woodfired', 'scooter-mint', 'neon-counter', 'awning-gold', 'plaque-master']);
    expect(VANITY_PRICE).toBe(TIER_PRICE.medium);
    for (const id of VANITY_IDS) if (id !== 'plaque-master') expect(LOOKS.find((l) => l.id === id)?.price).toBe(150);
  });

  it('the part of an id: skins are on the facade; set pieces have their own slot', () => {
    expect(partOf('storefront-skin-3')).toBe('facade');
    expect(partOf('facade-dockside')).toBe('facade');
    expect(cosmeticPart('storefront-skin-3')).toBe(cosmeticPart('storefront-skin-101'));
    expect(cosmeticPart('awning-classic')).not.toBe(cosmeticPart('awning-gold'));
    expect(cosmeticPart('awning-founder')).toBe(cosmeticPart('awning-gold'));
  });
});

describe('buying charges the tier price', () => {
  it.each(SOLD_LOOKS.map((l) => [l.id, l.price] as const))('%s costs %i', (id, price) => {
    const g = rich(1000);
    const after = ok(buyCosmetic(g, id, T0));
    expect(g.rewards.diamonds - after.rewards.diamonds).toBe(price);
    expect(after.rewards.cosmetics).toEqual([id]);
    expect(after.rewards.worn).toEqual([id]);
  });

  it('short of the price: refused; a bought skin number still buys the storefront row at 150', () => {
    expect(buyCosmetic(rich(399), 'facade-classic')).toEqual({ ok: false, reason: 'Not enough diamonds' });
    expect(buyCosmetic(rich(400), 'facade-classic').ok).toBe(true);
    const skin = ok(buyCosmetic(rich(1000), 'storefront-skin-101', T0));
    expect(skin.rewards.diamonds).toBe(850);
    expect(buyCosmetic(rich(), 'plaque-master')).toEqual({ ok: false, reason: 'Not for sale' });
  });
});

describe('wearing', () => {
  it('one generic look per part: the second replaces the first', () => {
    const g = buyAll(rich(), ['tipjar-glass', 'tipjar-brass', 'chime-bell']);
    expect(g.rewards.worn).toEqual(['tipjar-brass', 'chime-bell']);
  });

  it('a set piece is worn beside the generic look of its part, and only in its own shop', () => {
    const g = buyAll(rich(), ['awning-gold', 'awning-classic', 'apron-checkered']);
    expect(g.rewards.worn).toEqual(['awning-gold', 'awning-classic', 'apron-checkered']);
    expect(dressFor(g, 'downtown')).toEqual(['awning-classic', 'apron-checkered']); // the set piece beats the generic awning here
    expect(dressFor(g, 'suburbs')).toEqual(['awning-gold', 'apron-checkered']); // other shops never wear it
  });

  it('a set facade beats a bought skin in its own shop; the skin shows elsewhere', () => {
    const g = buyAll(rich(), ['storefront-skin-101', 'facade-dockside']);
    expect(dressFor(g, 'waterfront')).toEqual(['facade-dockside']);
    expect(dressFor(g, 'downtown')).toEqual(['storefront-skin-101']);
  });

  it('two pieces of the same set and part cannot both be worn; pieces of different sets can', () => {
    const g = buyAll(rich(), ['awning-classic', 'awning-marble']);
    expect(g.rewards.worn).toEqual(['awning-classic', 'awning-marble']);
    expect(dressFor(g, 'uptown')).toEqual(['awning-marble']);
    expect(dressFor(g, 'downtown')).toEqual(['awning-classic']);
  });

  it('the earned plaque and the founder awning show everywhere', () => {
    const g = R.wear({ ...rich(), rewards: { ...rich().rewards, cosmetics: ['plaque-master', 'awning-founder'], worn: [] } }, 'plaque-master');
    const w = R.wear(g, 'awning-founder');
    expect(dressFor(w, 'uptown')).toEqual(['plaque-master', 'awning-founder']);
  });

  it('an old save keeps what it wore, with one per part', () => {
    const old = JSON.parse(JSON.stringify(G.newGame(T0)));
    old.saveVersion = 9;
    delete old.rewards.setsDone;
    old.rewards.cosmetics = ['oven-gold', 'scooter-mint', 'awning-founder', 'storefront-skin-1'];
    old.rewards.worn = ['oven-gold', 'scooter-mint', 'awning-founder', 'storefront-skin-1'];
    const g = G.migrate(old, T0);
    expect(g.rewards.worn).toEqual(['oven-gold', 'scooter-mint', 'awning-founder', 'storefront-skin-1']);
    expect(g.rewards.setsDone).toEqual([]);
    expect(g.saveVersion).toBe(G.SAVE_VERSION);
  });
});

describe('Featured', () => {
  const g = rich();

  it('four unowned looks, the same all week, and the next set the week after', () => {
    const mon = featured(g, T0);
    expect(mon).toHaveLength(FEATURED_COUNT);
    for (let d = 0; d < 7; d++) expect(featured(g, T0 + d * DAY).map((l) => l.id)).toEqual(mon.map((l) => l.id));
    expect(featured(g, T0 + 7 * DAY).map((l) => l.id)).not.toEqual(mon.map((l) => l.id));
    expect(weekIndex(T0 + 6 * DAY)).toBe(weekIndex(T0));
    expect(weekIndex(T0 + 7 * DAY)).toBe(weekIndex(T0) + 1);
  });

  it('every look for sale comes up within 11 weeks, and never the plaque', () => {
    const seen = new Set<string>();
    for (let w = 0; w < 11; w++) for (const l of featured(g, T0 + w * 7 * DAY)) seen.add(l.id);
    expect(seen.size).toBe(SOLD_LOOKS.length);
    expect(seen.has('plaque-master')).toBe(false);
  });

  it('owned looks are skipped and the row stays four; a skin of any kind owns the skin row', () => {
    const own = buyAll(
      rich(),
      featured(g, T0).map((l) => l.id),
    );
    const next = featured(own, T0).map((l) => l.id);
    expect(next).toHaveLength(4);
    for (const l of featured(g, T0)) expect(next).not.toContain(l.id);
    const gift = { ...g, rewards: { ...g.rewards, cosmetics: ['storefront-skin-2'] } };
    for (let w = 0; w < 11; w++) expect(featured(gift, T0 + w * 7 * DAY).map((l) => l.id)).not.toContain('storefront-skin');
  });
});

describe('sets', () => {
  const pieces = (set: (typeof SETS)[number]['id']) => setLooks(set).map((l) => l.id);

  it('progress counts the pieces owned', () => {
    let g = rich();
    expect(setProgress(g, 'dockside')).toEqual({ set: 'dockside', owned: 0, total: 4, done: false });
    g = buyAll(g, pieces('dockside').slice(0, 2));
    expect(setProgress(g, 'dockside')).toMatchObject({ owned: 2, done: false });
  });

  it('the last piece pushes the set to rewards.setsDone and raises set_complete once', () => {
    const ids = pieces('classic');
    const before = buyAll(rich(), ids.slice(0, 3));
    expect(before.rewards.setsDone).toEqual([]);
    const after = ok(buyCosmetic(before, ids[3], T0 + 5));
    expect(after.rewards.setsDone).toEqual([{ set: 'classic', at: T0 + 5 }]);
    expect(setProgress(after, 'classic').done).toBe(true);
    expect(setCompleteEvent(before, after)).toEqual({ type: 'set_complete', set: 'classic', at: T0 + 5 });
    // no second event: the next purchase (any look) leaves the list alone
    const more = ok(buyCosmetic(after, 'tipjar-glass', T0 + 9));
    expect(more.rewards.setsDone).toHaveLength(1);
    expect(setCompleteEvent(after, more)).toBeNull();
    // a refused buy raises nothing
    expect(buyCosmetic(more, ids[3], T0 + 9)).toEqual({ ok: false, reason: 'Already yours' });
  });

  it('a set that is complete in an old save is not announced late; setsDone survives a save round trip and drops junk', () => {
    const g = G.migrate(JSON.parse(JSON.stringify(buyAll(rich(), pieces('brick'), T0))), T0);
    expect(g.rewards.setsDone).toEqual([{ set: 'brick', at: T0 }]);
    const raw = JSON.parse(JSON.stringify(g));
    raw.rewards.setsDone = [{ set: 'brick', at: 5 }, { set: 'brick', at: 6 }, { set: 'nope', at: 1 }, 'x', null];
    expect(G.migrate(raw, T0).rewards.setsDone).toEqual([{ set: 'brick', at: 5 }]);
    raw.rewards.setsDone = 'no';
    expect(G.migrate(raw, T0).rewards.setsDone).toEqual([]);
  });
});
