import { HOME_SCENES } from '../../content/scenes/home';
import { goalAmount, money, rate } from '../format';
import * as G from '../game';

const rich = (s: G.GameState): G.GameState => ({ ...s, cash: 1e15 });

describe('formatting (playtest bug 6)', () => {
  it('rates never print "20000.0/s"', () => {
    expect(rate(20000)).not.toMatch(/\.0$/);
    expect(rate(20000)).toBe('20K');
    expect(rate(3.14)).toBe('3.1');
  });
  it('goal bar prints both amounts the same way', () => {
    expect(goalAmount(1500, 1500)).toBe(`${money(1500, true)} / ${money(1500, true)}`);
    expect(goalAmount(1500, 1500)).toBe('$1.50K / $1.50K');
  });
});

describe('drivers cap (playtest bug 6)', () => {
  it('drivers stop at the same cap as the other stations', () => {
    let s = rich(G.newGame(0));
    const cap = G.levelCap(s.shops.downtown);
    s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, drivers: cap } } };
    expect(G.upgradeLock(s, 'downtown', 'drivers')).not.toBeNull();
    expect(G.buyUpgrade(s, 'downtown', 'drivers').ok).toBe(false);
  });
  it('a save over the cap keeps its level', () => {
    let s = G.newGame(0);
    s = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, drivers: 500 } } };
    expect(G.migrate(JSON.parse(JSON.stringify(s)), 0).shops.downtown.drivers).toBe(500);
  });
});

describe('offline cap note (playtest bug 8)', () => {
  it('reports when time away exceeded the cap', () => {
    const s = { ...G.newGame(0), lastSavedAt: 0 };
    const r = G.applyOffline(s, 9 * 3600 * 1000);
    expect(r.capped).toBe(true);
    expect(r.awaySeconds).toBe(9 * 3600);
    expect(G.applyOffline(s, 3600 * 1000).capped).toBe(false);
  });
});

describe('frugal path (playtest UX)', () => {
  it('Suburbs stays locked until Nonna takes over Downtown, with a countdown', () => {
    const s = rich(G.newGame(0));
    expect(G.buildLock(s, 'suburbs')).toMatch(/Nonna takes over in 150 more pizzas/);
    expect(G.buildShop(s, 'suburbs').ok).toBe(false);
    const seen = { ...s, seenScenes: ['downtown-4'] };
    expect(G.buildLock(seen, 'suburbs')).toBeNull();
    expect(G.nonnaPizzasLeft({ ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, sold: 120 } } })).toBe(30);
  });
  it('the scripted scene data still has the 150-pizza takeover', () => {
    expect(HOME_SCENES.find((x) => x.id === 'downtown-4')?.trigger).toMatchObject({ count: 150 });
  });
});

describe('tied stations (playtest UX)', () => {
  it('bundleHint names both tied stations and its cost', () => {
    const s0 = G.newGame(0);
    const s = { ...s0, shops: { ...s0.shops, downtown: { ...s0.shops.downtown, managed: true, prep: 6, ovens: 8, counter: 20, drivers: 30 } } };
    const h = G.bundleHint(s, 'downtown');
    expect(h).not.toBeNull();
    expect(h!.label).toBe('Upgrade prep + ovens');
    expect(h!.cost).toBeGreaterThan(0);
  });
});
