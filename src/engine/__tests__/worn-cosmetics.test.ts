// Worn cosmetics (v5.15): a new cosmetic is worn at once, one per part, wear/unwear, and the safe default for old saves.
import { cosmeticPart } from '../../content/endgame';
import { NONNA_TAKEOVER } from '../../content/tuning';
import * as G from '../game';
import * as R from '../rewards';

const T0 = 1_700_000_000_000;
const ok = (r: G.BuyResult): G.GameState => {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const own = (g: G.GameState, cosmetics: string[], worn: string[]): G.GameState => ({ ...g, rewards: { ...g.rewards, cosmetics, worn } });

describe('parts', () => {
  it('two oven skins are one part; other cosmetics have their own', () => {
    expect(cosmeticPart('oven-woodfired')).toBe(cosmeticPart('oven-gold'));
    expect(cosmeticPart('storefront-skin-1')).toBe(cosmeticPart('storefront-skin-2'));
    const parts = ['oven-gold', 'scooter-mint', 'neon-counter', 'awning-gold', 'storefront-skin-1', 'plaque-master'].map(cosmeticPart);
    expect(new Set(parts).size).toBe(6);
  });
});

describe('grantCosmetic, wear and unwear', () => {
  const g0 = G.newGame(T0);

  it('a new cosmetic is owned and worn; one already owned changes nothing', () => {
    const r = R.grantCosmetic(g0.rewards, 'scooter-mint');
    expect(r).toEqual({ cosmetics: ['scooter-mint'], worn: ['scooter-mint'] });
    const again = R.grantCosmetic({ ...g0.rewards, ...r }, 'scooter-mint');
    expect(again.cosmetics).toBe(r.cosmetics);
    expect(again.worn).toBe(r.worn);
  });

  it('a second cosmetic for the same part replaces the first', () => {
    let rw = { ...g0.rewards, ...R.grantCosmetic(g0.rewards, 'oven-woodfired') };
    rw = { ...rw, ...R.grantCosmetic(rw, 'scooter-mint') };
    rw = { ...rw, ...R.grantCosmetic(rw, 'oven-gold') };
    expect(rw.cosmetics).toEqual(['oven-woodfired', 'scooter-mint', 'oven-gold']);
    expect(rw.worn).toEqual(['scooter-mint', 'oven-gold']);
  });

  it('wear puts an owned cosmetic on and takes the same part off; unwear takes it off', () => {
    let g = own(g0, ['oven-woodfired', 'oven-gold', 'awning-gold'], ['oven-gold', 'awning-gold']);
    g = R.wear(g, 'oven-woodfired');
    expect(g.rewards.worn).toEqual(['awning-gold', 'oven-woodfired']);
    expect(R.wear(g, 'oven-woodfired')).toBe(g);
    g = R.unwear(g, 'awning-gold');
    expect(g.rewards.worn).toEqual(['oven-woodfired']);
    expect(R.unwear(g, 'awning-gold')).toBe(g);
  });

  it('cannot wear what is not owned', () => {
    expect(R.wear(g0, 'oven-gold')).toBe(g0);
  });
});

describe('earning one wears it', () => {
  const ready = (): G.GameState => {
    const g = G.newGame(T0);
    return { ...g, seenScenes: [NONNA_TAKEOVER.sceneId], rewards: { ...g.rewards, lastSeen: 0 } };
  };

  it('the weekly chest', () => {
    let g = ready();
    g = { ...g, rewards: { ...g.rewards, week: '2026-11-09', weekly: [{ kind: 'upgrades', target: 1, base: 0, claimed: true }], weeklyChest: false, ...R.grantCosmetic(g.rewards, 'oven-woodfired') } };
    const prize = R.weeklyChestPrize(g);
    const done = ok(R.claimWeeklyChest(g, T0));
    expect(done.rewards.cosmetics).toContain(prize.kind === 'cosmetic' ? prize.id : 'oven-woodfired');
    if (prize.kind === 'cosmetic') expect(done.rewards.worn).toContain(prize.id);
  });

  it('the day-28 storefront skin of the gift calendar replaces the old one', () => {
    let g = ready();
    g = { ...g, rewards: { ...g.rewards, cosmetics: ['storefront-skin-1'], worn: ['storefront-skin-1'], gift: { streak: 27, last: R.dayKey(T0 - 86_400_000), saveUsed: false, cycle: 1 } } };
    const done = ok(R.claimGift(g, T0));
    expect(done.rewards.cosmetics).toEqual(['storefront-skin-1', 'storefront-skin-2']);
    expect(done.rewards.worn).toEqual(['storefront-skin-2']);
  });
});

describe('saves', () => {
  it('a new game wears nothing', () => {
    expect(G.newGame(T0).rewards.worn).toEqual([]);
  });

  it('a save from before worn cosmetics wears what it owned (the latest of each part)', () => {
    const raw = JSON.parse(JSON.stringify(G.newGame(T0)));
    raw.rewards.cosmetics = ['oven-woodfired', 'scooter-mint', 'oven-gold'];
    delete raw.rewards.worn;
    expect(G.migrate(raw, T0).rewards.worn).toEqual(['scooter-mint', 'oven-gold']);
  });

  it('a saved worn list is kept, filtered to what is owned and one per part', () => {
    const raw = JSON.parse(JSON.stringify(G.newGame(T0)));
    raw.rewards.cosmetics = ['oven-woodfired', 'oven-gold', 'awning-gold'];
    raw.rewards.worn = ['awning-gold', 'oven-woodfired', 'oven-gold', 'ghost', 7];
    expect(G.migrate(raw, T0).rewards.worn).toEqual(['awning-gold', 'oven-gold']);
    raw.rewards.worn = [];
    expect(G.migrate(raw, T0).rewards.worn).toEqual([]);
    raw.rewards.worn = 'junk';
    expect(G.migrate(raw, T0).rewards.worn).toEqual(['oven-gold', 'awning-gold']);
  });
});
