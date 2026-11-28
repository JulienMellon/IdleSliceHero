// C106: the economy marker. v5.16 bumped it from 2 to 3; v5.25 (card E8) bumps it to 4 with a FULL reset: a save with a lower marker, or none, loads as a new game
// (pre-launch, Julien 2026-11-28): no cash, hires, diamonds, looks or standing IAP grants carry over.
import * as G from '../game';

const T0 = 1_700_000_000_000;

describe('T82 economy marker', () => {
  it('a new game is stamped with the current economy', () => {
    expect(G.ECONOMY).toBe(4);
    expect(G.newGame(T0).economy).toBe(4);
  });

  it('a v3 save (the v5.16 economy) loads as a new game: nothing carries over', () => {
    const old = G.newGame(T0);
    const shops = { ...old.shops, suburbs: { ...old.shops.suburbs, built: true, managed: true, heads: G.allHeads() } };
    const raw = JSON.parse(
      JSON.stringify({
        ...old,
        economy: 3,
        cash: 42_000,
        totalEarned: 9e9,
        shops,
        rewards: { ...old.rewards, diamonds: 777, cosmetics: ['awning-founder'] },
        tutorial: 99,
      }),
    );
    const g = G.migrate(raw, T0);
    expect(g).toEqual(G.newGame(T0));
    expect(g.economy).toBe(4);
    expect(g.cash).toBe(0);
    expect(g.shops.suburbs.built).toBe(false);
    expect(g.rewards.diamonds).toBe(G.newGame(T0).rewards.diamonds);
  });

  it('a save with no marker, an older one or a junk one is a new game too', () => {
    const raw = JSON.parse(JSON.stringify({ ...G.newGame(T0), cash: 123_456.5, totalEarned: 9e9 }));
    delete raw.economy;
    expect(G.migrate(raw, T0)).toEqual(G.newGame(T0));
    for (const economy of [0, 1, 2, 'junk', null]) expect(G.migrate({ ...raw, economy }, T0)).toEqual(G.newGame(T0));
  });

  it('a Boston save of an older economy resets to the home city as well', () => {
    const raw = JSON.parse(JSON.stringify({ ...G.newGame(T0, 'boston'), economy: 3, cash: 5 }));
    expect(G.migrate(raw, T0).city).toBe('home');
  });

  it('a save of the current economy keeps its cash and hires, and its marker', () => {
    const old = G.newGame(T0);
    const shops = { ...old.shops, suburbs: { ...old.shops.suburbs, built: true, managed: true, heads: G.allHeads() } };
    const raw = JSON.parse(JSON.stringify({ ...old, cash: 42_000, shops }));
    const g = G.migrate(raw, T0);
    expect(g.economy).toBe(4);
    expect(g.cash).toBe(42_000);
    expect(g.shops.suburbs.managed).toBe(true);
    expect(g.shops.suburbs.heads).toEqual(G.allHeads());
  });

  it('survives a round trip', () => {
    expect(G.migrate(JSON.parse(JSON.stringify(G.newGame(T0))), T0).economy).toBe(4);
  });
});
