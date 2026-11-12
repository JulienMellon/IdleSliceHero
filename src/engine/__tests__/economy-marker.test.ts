// C106: the economy marker. A save from before the marker loads as economy 2 with its cash untouched.
import * as G from '../game';

const T0 = 1_700_000_000_000;

describe('T82 economy marker', () => {
  it('a new game is stamped with the current economy', () => {
    expect(G.ECONOMY).toBe(2);
    expect(G.newGame(T0).economy).toBe(2);
  });

  it('a pre-marker save loads with economy === 2 and the same cash', () => {
    const raw = JSON.parse(JSON.stringify({ ...G.newGame(T0), cash: 123_456.5, totalEarned: 9e9 }));
    delete raw.economy;
    const g = G.migrate(raw, T0);
    expect(g.economy).toBe(2);
    expect(g.cash).toBe(123_456.5);
    expect(g.totalEarned).toBe(9e9);
  });

  it('a save keeps the marker it has (a later retune decides what an older number gets)', () => {
    const raw = JSON.parse(JSON.stringify(G.newGame(T0)));
    raw.economy = 1;
    expect(G.migrate(raw, T0).economy).toBe(1);
    raw.economy = 'junk';
    expect(G.migrate(raw, T0).economy).toBe(2);
  });

  it('survives a round trip', () => {
    expect(G.migrate(JSON.parse(JSON.stringify(G.newGame(T0))), T0).economy).toBe(2);
  });
});
