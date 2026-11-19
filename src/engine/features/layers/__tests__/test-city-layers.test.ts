// R1L: every layer runs on the hood `layerHood` gives it, in a city that is not the home city (the R0 test city: its ids are none of the home ids, and each layer
// is on a different shop than at home). A layer that still named a home neighbourhood would see no shop here and stay inactive.
import { CITIES, cityOf, layerHood } from '../../../../content/cities';
import { LAYER_KINDS, type LayerKind } from '../../../../content/cities/types';
import { TEST_CITY, TEST_IDS } from '../../../../content/cities/__fixtures__/test-city';
import { LAYER_KEYS } from '../../../../content/layers';
import { withFeatures } from '../../index';
import * as G from '../../../game';
import { boatsView, boatsLayer } from '../boats';
import { gameDayLayer, gameDayView } from '../game-day';
import { menuLayer, menuView, mixOf, setMenu, zonesView } from '../menu';
import { jamView, shiftView, shiftsLayer } from '../shifts';
import { criticView, starsLayer, starsView } from '../stars';

CITIES[TEST_CITY.id] = TEST_CITY;
afterAll(() => {
  delete CITIES[TEST_CITY.id];
});

const NOW = new Date(2026, 10, 18, 12, 0, 0).getTime();
const LAYERS = [gameDayLayer, boatsLayer, menuLayer, shiftsLayer, starsLayer];
const run = <T>(fn: () => T): T => withFeatures(LAYERS, fn);

/** The test city's game with the shops of `kinds` built (and no others). */
function game(kinds: readonly LayerKind[]): G.GameState {
  const g = G.newGame(NOW, TEST_CITY.id);
  const shops = { ...g.shops };
  for (const id of TEST_IDS) shops[id] = { ...shops[id], built: false };
  for (const k of kinds) {
    const id = layerHood(cityOf(g), k)!;
    shops[id] = { ...shops[id], built: true, managed: true, heads: G.allHeads(), prep: 5, ovens: 5, counter: 5, drivers: 4, tables: 4, footprint: 2 };
  }
  return { ...g, shops, cash: 1e15, tutorial: G.TUTORIAL_DONE };
}

/** Which layers are live in a game, by the views the UI reads. */
const live = (g: G.GameState): Record<LayerKind, boolean> => ({
  gameDay: gameDayView(g, NOW).active,
  boats: boatsView(g, NOW).active,
  menu: menuView(g).active,
  shifts: shiftView(g).active,
  stars: starsView(g).active,
});

describe('each layer runs on the hood layerHood gives it', () => {
  test('the test city puts the layers on none of the home neighbourhoods', () => {
    for (const k of LAYER_KINDS) expect(TEST_IDS).toContain(layerHood(TEST_CITY, k));
  });

  test.each(LAYER_KINDS.map((k) => [k]))('%s: built alone, only that layer is live', (kind) => {
    const g = game([kind]);
    const want: Record<LayerKind, boolean> = { gameDay: false, boats: false, menu: false, shifts: false, stars: false, [kind]: true };
    expect(run(() => live(g))).toEqual(want);
  });

  test('with no layer shop built, none is live', () => {
    expect(run(() => live(game([])))).toEqual({ gameDay: false, boats: false, menu: false, shifts: false, stars: false });
  });

  test('the other views of the shifts and the menu follow their hood too', () => {
    run(() => {
      expect(jamView(game(['shifts'])).active).toBe(true);
      expect(jamView(game(['menu'])).active).toBe(false);
      expect(zonesView(game(['menu'])).active).toBe(true);
      expect(zonesView(game(['shifts'])).active).toBe(false);
      expect(criticView(game(['stars'])).active).toBe(true);
      expect(criticView(game(['boats'])).active).toBe(false);
    });
  });

  test('ticking: each layer schedules its own state on its own key', () => {
    run(() => {
      let g = game(LAYER_KINDS);
      for (let i = 0; i < 5; i++) g = G.playTick(g, 1, NOW + i * 1000);
      for (const k of ['gameDay', 'boats', 'stars'] as const) expect((g.x[LAYER_KEYS[k]] as { nextAt: number }).nextAt).toBeGreaterThanOrEqual(0);
      expect((g.x[LAYER_KEYS.shifts] as { startAt: number }).startAt).toBeGreaterThanOrEqual(0);
    });
  });

  test('the menu sets its mix on the menu hood of the city', () => {
    run(() => {
      const r = setMenu(game(['menu']), 50, 25);
      expect(r.ok).toBe(true);
      if (r.ok) expect(mixOf(r.state)).toEqual({ pepperoni: 50, knots: 25 });
      expect(setMenu(game(['gameDay']), 50, 25).ok).toBe(false);
    });
  });
});
