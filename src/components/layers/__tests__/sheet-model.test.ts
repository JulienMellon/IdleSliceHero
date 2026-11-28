/// <reference types="jest" />
import { AUCTION, LAYER_KEYS } from '../../../content/layers';
import '../../../engine/features';
import * as G from '../../../engine/game';
import { auctionSheet, boatSheet, gameDaySheet, rivalSheet, sheetModel } from '../sheet-model';

import { PIER9_BID } from '../../../content/cities/home/data';
const NOW = new Date(2026, 10, 11, 12, 0, 0).getTime();
const base = (): G.GameState => {
  const g = G.newGame(NOW);
  const shop = (id: 'suburbs' | 'waterfront') => ({
    ...g.shops[id],
    built: true,
    managed: true,
    prep: 20,
    ovens: 20,
    counter: 20,
    drivers: 10,
    tables: 10,
    grade: 1,
  });
  return {
    ...g,
    cash: 1e9,
    playSeconds: 400,
    seenScenes: [...g.seenScenes, 'suburbs-3', 'waterfront-3b'],
    shops: { ...g.shops, suburbs: shop('suburbs'), waterfront: { ...shop('waterfront'), sold: PIER9_BID.unlockPizzas + 5 } },
  };
};

describe('the info sheets say what it is, the numbers and what to buy', () => {
  test('Game Day: the copy body, the next game and the seats, two things to buy', () => {
    const m = gameDaySheet(base(), NOW);
    expect(m.title).toBe('Game Day');
    expect(m.body).toMatch(/families pour in/);
    expect(m.rows.map((r) => r.key)).toEqual(['next', 'seats']);
    expect(m.rows[1].value).toMatch(/^\d+ \/ \d+$/);
    expect(m.buys.map((b) => b.key)).toEqual(['tables', 'counter']);
    expect(m.buys[0].title).toMatch(/^Seating · \$/);
  });
  test('boats and the rack: the rack tier and the next tier with its price', () => {
    const g = base();
    const m = boatSheet(g, NOW);
    expect(m.title).toBe('Boats');
    expect(m.body).toMatch(/Keeps finished pies hot/);
    expect(m.rows.find((r) => r.key === 'rack')?.value).toBe('No rack yet');
    expect(m.buys[0].title).toMatch(/^Dinghy Rack · \$/);
    expect(m.buys[0].line).toBe('Holds 20 pies between boats.');
  });
  test('the auction: the bid, the start, the cap, the raises and the next raise', () => {
    const g = base();
    const live = {
      ...g,
      playSeconds: 100 + 2 * AUCTION.stepSeconds + 10,
      x: { ...g.x, [LAYER_KEYS.boats]: { seed: 1, n: 0, nextAt: 900, until: 0, at: 0, tier: 0, rack: 0, carry: 0, openedAt: 100 } },
    };
    const m = auctionSheet(live);
    expect(m.title).toBe('The Pier 9 Auction');
    expect(m.rows.map((r) => r.key)).toEqual(['now', 'base', 'cap', 'raises', 'next']);
    expect(m.rows[0].value).toBe('$1.65B');
    expect(m.rows[2].value).toBe('$7.05B');
    expect(m.rows[3].value).toBe('2');
    expect(m.buys[0].line).toBe('They topped us, kid. Sell faster. Pier 9 won’t save itself.');
  });
  test('the rival: its title with the pies, the opener, the cut and the time', () => {
    const m = rivalSheet({ ...base(), active: 'suburbs' }, 'suburbs', NOW);
    expect(m.title).toBe('The MegaSlice Next Door');
    expect(m.body).toMatch(/takes 20% of your sales/);
    expect(m.rows[0]).toMatchObject({ key: 'sales', value: '−20%' });
    expect(m.rows[2].value).toBe('5:00');
    // D480: the offer lives in the sheet: a Start button while the challenge may begin
    expect(m.action).toEqual({ label: 'Start', enabled: true });
    expect(gameDaySheet(base(), NOW).action).toBeNull();
  });
  test('sheetModel picks by kind', () => {
    const g = { ...base(), active: 'suburbs' as const };
    expect(sheetModel('gameday', g, NOW).kind).toBe('gameday');
    expect(sheetModel('boat', g, NOW).kind).toBe('boat');
    expect(sheetModel('auction', g, NOW).kind).toBe('auction');
    expect(sheetModel('rival', g, NOW).kind).toBe('rival');
  });
});
