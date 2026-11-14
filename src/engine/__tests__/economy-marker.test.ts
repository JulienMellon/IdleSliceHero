// C106: the economy marker. v5.16 bumps it from 2 to 3 (managers and heads priced apart, heads sell half speed away, cash rewards cut).
// Old saves load with their cash and hires untouched; a save from before the marker existed is economy 2.
import * as G from '../game';

const T0 = 1_700_000_000_000;

describe('T82 economy marker', () => {
  it('a new game is stamped with the current economy', () => {
    expect(G.ECONOMY).toBe(3);
    expect(G.newGame(T0).economy).toBe(3);
  });

  it('a pre-marker save loads as economy 2 with its cash untouched', () => {
    const raw = JSON.parse(JSON.stringify({ ...G.newGame(T0), cash: 123_456.5, totalEarned: 9e9 }));
    delete raw.economy;
    const g = G.migrate(raw, T0);
    expect(g.economy).toBe(2);
    expect(g.cash).toBe(123_456.5);
    expect(g.totalEarned).toBe(9e9);
  });

  it('a v5.15 save (economy 2) keeps its marker, its cash and its hires', () => {
    const old = G.newGame(T0);
    const shops = { ...old.shops, suburbs: { ...old.shops.suburbs, built: true, managed: true, heads: G.allHeads() } };
    const raw = JSON.parse(JSON.stringify({ ...old, economy: 2, cash: 42_000, shops }));
    const g = G.migrate(raw, T0);
    expect(g.economy).toBe(2);
    expect(g.cash).toBe(42_000);
    expect(g.shops.suburbs.managed).toBe(true);
    expect(g.shops.suburbs.heads).toEqual(G.allHeads());
  });

  it('a save keeps the marker it has (a later retune decides what an older number gets)', () => {
    const raw = JSON.parse(JSON.stringify(G.newGame(T0)));
    raw.economy = 1;
    expect(G.migrate(raw, T0).economy).toBe(1);
    raw.economy = 'junk';
    expect(G.migrate(raw, T0).economy).toBe(2);
  });

  it('survives a round trip', () => {
    expect(G.migrate(JSON.parse(JSON.stringify(G.newGame(T0))), T0).economy).toBe(3);
  });
});
