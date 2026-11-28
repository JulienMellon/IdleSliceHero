// v5.25 (card N3 via E8): a grant that carries cash adds it to the game's cash, and only the cash in hand (not the lifetime earnings).
import { GRANTS, STARTER_CASH } from '../../services/grants';
import * as G from '../game';
import { applyGrant } from '../offers';

const NOW = 1_700_000_000_000;

describe('applyGrant cash', () => {
  it('the Starter Pack pays its cash on top of what the player has, and leaves totalEarned alone', () => {
    const g0 = { ...G.newGame(NOW), cash: 123, totalEarned: 500 };
    const g = applyGrant(g0, GRANTS.starter_pack, NOW);
    expect(STARTER_CASH).toBeGreaterThan(0);
    expect(g.cash).toBe(123 + STARTER_CASH);
    expect(g.totalEarned).toBe(500);
    expect(g.rewards.diamonds).toBe(g0.rewards.diamonds + GRANTS.starter_pack.diamonds);
  });

  it('a grant with no cash leaves the cash as it was, and a negative figure never takes any away', () => {
    const g0 = { ...G.newGame(NOW), cash: 77 };
    expect(applyGrant(g0, GRANTS.diamonds_500, NOW).cash).toBe(77);
    expect(applyGrant(g0, { diamonds: 0, cash: -50 }, NOW).cash).toBe(77);
  });
});
