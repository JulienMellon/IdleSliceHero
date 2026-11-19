// v5.19 fix round r2 (C150, C152, T111, T112, T113): the bid speaks with the city's own bid name, a pack with no layers plays, and a franchised
// Boston has its rewards on tick 1 (franchising keeps `seenScenes`).
import '../features';
import * as G from '../game';
import { boatsLayer, boatsView, buyRack, rackLock, rackPrice } from '../features/layers/boats';
import { gameDayLayer } from '../features/layers/game-day';
import { menuLayer } from '../features/layers/menu';
import { shiftsLayer } from '../features/layers/shifts';
import { starsLayer } from '../features/layers/stars';
import { canFranchise, franchise } from '../features/franchise';
import { withFeatures } from '../features';
import { rewardsUnlocked } from '../rewards';
import { CITIES, cityOf, hoodIds, layerHood } from '../../content/cities';
import { HOME_CITY } from '../../content/cities/home';
import { LAYER_KINDS, type CityDef } from '../../content/cities/types';
import { TEST_CITY } from '../../content/cities/__fixtures__/test-city';
import { t } from '../../content/copy';

const NOW = new Date(2026, 10, 18, 12, 0, 0).getTime();
const NO_LAYERS: CityDef = {
  ...TEST_CITY,
  id: 'no-layers',
  bid: undefined,
  layers: Object.fromEntries(hoodIds(TEST_CITY).map((id) => [id, null])),
};
CITIES[TEST_CITY.id] = TEST_CITY;
CITIES[NO_LAYERS.id] = NO_LAYERS;
afterAll(() => {
  delete CITIES[TEST_CITY.id];
  delete CITIES[NO_LAYERS.id];
});

describe('the bid says its own name (C150, T113)', () => {
  const bid = TEST_CITY.bid!;
  const g = G.newGame(NOW, TEST_CITY.id);

  test('the refusals name the test city bid, never Pier 9', () => {
    const closed = G.placeBid({ ...g, cash: 1e15 });
    expect(closed).toEqual({ ok: false, reason: `The ${bid.name} auction hasn’t opened yet` });
    const saved = G.placeBid({ ...g, shops: { ...g.shops, [bid.hood]: { ...g.shops[bid.hood], perk: true } } });
    expect(saved).toEqual({ ok: false, reason: `${bid.name} is already saved` });
    for (const r of [closed, saved]) expect(JSON.stringify(r)).not.toContain('Pier 9');
  });

  test('the toast line names it too, and home still says Pier 9', () => {
    expect(t('bid.toast', { bid: bid.name }, TEST_CITY.id)).toBe(`Bid on ${bid.name}`);
    expect(t('bid.toast', { bid: HOME_CITY.bid!.name }, 'home')).toBe('Bid on Pier 9');
    const home = G.newGame(NOW);
    expect(G.placeBid(home)).toEqual({ ok: false, reason: 'The Pier 9 auction hasn’t opened yet' });
  });

  test('a city with no bid says so', () => {
    expect(G.placeBid(G.newGame(NOW, NO_LAYERS.id))).toEqual({ ok: false, reason: 'There is no auction in this city' });
  });
});

describe('a pack with no layers plays (T111)', () => {
  const g = { ...G.newGame(NOW, NO_LAYERS.id), tutorial: G.TUTORIAL_DONE };
  const layers = [gameDayLayer, boatsLayer, menuLayer, shiftsLayer, starsLayer];

  test('it has no layer hood and ticks', () => {
    for (const k of LAYER_KINDS) expect(layerHood(cityOf(g), k)).toBeNull();
    let s = g;
    withFeatures(layers, () => {
      for (let i = 0; i < 30; i++) s = G.playTick(s, 1, NOW + i * 1000);
    });
    expect(Number.isFinite(s.cash)).toBe(true);
  });

  test('the boats view, the rack lock and a rack purchase never throw', () => {
    withFeatures(layers, () => {
      expect(() => boatsView(g, NOW)).not.toThrow();
      expect(() => rackLock(g)).not.toThrow();
      expect(buyRack({ ...g, cash: 1e15 }).ok).toBe(false);
    });
  });

  // C154 (features/layers/boats.ts, card R1L's file): `hoodOf` is '' with no boats shop, and `rackPrice` reads shopRevenue('') and throws. Flip to `it` when it is fixed.
  it.failing('the rack price is null, not a throw (C154)', () => {
    withFeatures(layers, () => expect(rackPrice(g)).toBeNull());
  });
});

describe('a franchised Boston has its rewards on tick 1 (T112)', () => {
  test('franchising keeps seenScenes, so the home takeover scene unlocks them', () => {
    const home = G.newGame(NOW);
    const done = { ...home, seenScenes: [...home.seenScenes, ...HOME_CITY.scenes.map((s) => s.id)], tutorial: G.TUTORIAL_DONE };
    expect(canFranchise(done)).toBe(true);
    const boston = franchise(done, NOW);
    expect(boston.city).toBe('boston');
    expect(rewardsUnlocked(boston)).toBe(true);
    expect(rewardsUnlocked(withFeatures([], () => G.playTick(boston, 1, NOW + 1000)))).toBe(true);
  });
});
