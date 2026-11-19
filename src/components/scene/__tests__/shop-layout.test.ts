// R1L: one shop layout. The storefront and every overlay drawn on the room ask `shopLayout` for it, so they stand on the room the storefront draws: the floor plan comes
// from the neighbourhood's data (`plan`), the counts from the city's fit, and the overlays get the draw space the storefront uses. The budget that matters: in a mirrored
// shop the jam wrench lies on the oven that is drawn (shot 145: wrench at x330, oven at x256, before).
import { CITIES, cityOf, findHood } from '../../../content/cities';
import { HOME_CITY } from '../../../content/cities/home';
import { TEST_CITY, TEST_IDS } from '../../../content/cities/__fixtures__/test-city';
import type { CityDef } from '../../../content/cities/types';
import { isMirrored } from '../../../content/shop-layout';
import * as G from '../../../engine/game';
import { ovenSpot, wrenchSpot } from '../../layers/shifts/jam-model';
import { layout } from '../layout';
import { toDrawSpace } from '../layout-space';
import { D, P, drawShift, sceneFrame } from '../projection';
import { shopLayout } from '../shop-layout';

const home = cityOf({});
const shopAt = (footprint: number, over: Partial<G.Shop> = {}): G.Shop => ({
  ...G.newShop(true),
  footprint,
  ovens: 100,
  prep: 100,
  counter: 100,
  tables: 100,
  ...over,
});
/** The room the way the storefront drew it before the overlays shared it: its own counts and the floor plan asked for the id, straight into `layout`. */
const drawn = (fp: number, mirrored: boolean): ReturnType<typeof layout> =>
  toDrawSpace(layout(fp, home.fit.footprints[fp].ovenSlots, 3, 2, home.fit.footprints[fp].maxTables, [2, 2, 3, 3, 4][fp], 0, undefined, mirrored));

describe('the floor plan is data on the neighbourhood', () => {
  test('home Waterfront and Industrial are mirrored, no other home shop is', () => {
    expect(['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'].filter((id) => isMirrored(id))).toEqual(['waterfront', 'industrial']);
    expect(findHood('waterfront')?.plan).toBe('mirrored');
    expect(findHood('downtown')?.plan).toBeUndefined();
  });
  test('Boston and the test city have no mirrored shop; a city that asks for one gets it', () => {
    for (const n of CITIES.boston.neighbourhoods) expect(isMirrored(n.id)).toBe(false);
    for (const n of TEST_CITY.neighbourhoods) expect(n.plan).toBeUndefined();
    const mirroredCity: CityDef = { ...TEST_CITY, neighbourhoods: TEST_CITY.neighbourhoods.map((n, i) => (i === 1 ? { ...n, plan: 'mirrored' } : n)) };
    const [a, b] = [TEST_IDS[0], TEST_IDS[1]];
    expect(shopLayout(a, shopAt(3), mirroredCity).room.mirrored).toBe(false);
    expect(shopLayout(b, shopAt(3), mirroredCity).room.mirrored).toBe(true);
    expect(shopLayout(b, shopAt(3), TEST_CITY).room.mirrored).toBe(false);
  });
});

describe('one room for the storefront and the overlays', () => {
  test.each([0, 1, 2, 3, 4])('footprint %i: the draw space is the room in draw space, and is one object per room', (fp) => {
    for (const id of ['downtown', 'industrial']) {
      const a = shopLayout(id, shopAt(fp), home);
      expect(a.draw).toBe(toDrawSpace(a.room));
      expect(shopLayout(id, shopAt(fp), home)).toBe(a);
      expect(a.room.mirrored).toBe(id === 'industrial');
    }
  });
  test('the counts come from the city fit, not the home tables', () => {
    const shop = shopAt(4);
    expect(shopLayout('tc-alpha', shop, TEST_CITY).room.ovens).toHaveLength(TEST_CITY.fit.footprints[4].ovenSlots);
    expect(shopLayout('downtown', shop, home).room.ovens).toHaveLength(home.fit.footprints[4].ovenSlots);
    expect(TEST_CITY.fit.footprints[4].ovenSlots).not.toBe(home.fit.footprints[4].ovenSlots);
  });
});

describe('a mirrored shop: the wrench is on the oven that is drawn', () => {
  test.each([0, 1, 2, 3, 4])('footprint %i: the oven spot lies inside the last oven of the storefront’s room', (fp) => {
    const { room, draw } = shopLayout('industrial', shopAt(fp), home);
    const lay = drawn(fp, true);
    const o = lay.ovens[lay.ovens.length - 1];
    const spot = ovenSpot(draw);
    expect(spot.x).toBeGreaterThanOrEqual(P(o.x0, D - 6)[0]);
    expect(spot.x).toBeLessThanOrEqual(P(o.x1, D - 6)[0]);
    // in the scene's own units (what the overlay is laid out in): the room's projection by its real frame is the same place
    const r = room.ovens[room.ovens.length - 1];
    expect(wrenchSpot(draw).x).toBeCloseTo(P((r.x0 + r.x1) / 2, D - 6, 0, room.frame)[0], 6);
    expect(wrenchSpot(draw).x).toBeCloseTo(spot.x + drawShift(sceneFrame(fp)), 6);
  });
  test.each([0, 1, 2, 4])(
    'footprint %i: the wrench the overlays used to place (the standard plan, in the room\u2019s own space) was off the drawn oven',
    (fp) => {
      const n = home.fit.footprints[fp].ovenSlots;
      const old = ovenSpot(layout(fp, n, 3, 2, home.fit.footprints[fp].maxTables, [2, 2, 3, 3, 4][fp], 0));
      const lay = drawn(fp, true);
      const o = lay.ovens[lay.ovens.length - 1];
      const shift = drawShift(sceneFrame(fp));
      const outside = old.x < P(o.x0, D - 6)[0] + shift || old.x > P(o.x1, D - 6)[0] + shift;
      expect(outside).toBe(true);
      const now = wrenchSpot(shopLayout('industrial', shopAt(fp), home).draw).x;
      expect(now).toBeGreaterThanOrEqual(P(o.x0, D - 6)[0] + shift);
      expect(now).toBeLessThanOrEqual(P(o.x1, D - 6)[0] + shift);
    },
  );
  test('shot 145: the Flagship wrench is on its oven in the scene, not at the old x330', () => {
    const { draw, room } = shopLayout('industrial', shopAt(4), home);
    const spot = wrenchSpot(draw);
    const oven = drawn(4, true).ovens.at(-1)!;
    expect(spot.x).toBeGreaterThan(P(oven.x0, D - 6)[0] + drawShift(room.frame));
    expect(spot.x).toBeLessThan(P(oven.x1, D - 6)[0] + drawShift(room.frame));
    expect(Math.abs(spot.x - 330)).toBeGreaterThan(40);
  });
});
