/// <reference types="jest" />
// D507: Boston's map is its own drawing, not Port Marinara's with new names, and no tree grows under a label card in either city.
import { BOSTON_CITY } from '../../../content/cities/boston';
import { HOME_CITY } from '../../../content/cities/home';
import { OPEN_LOT, mapArtFor } from '../map-art';

describe('the city maps', () => {
  it('Boston has its river, its Common, its ballpark and its own ground and harbour', () => {
    const h = mapArtFor('home');
    const b = mapArtFor('boston');
    expect(b.river).not.toBeNull();
    expect(h.river).toBeNull();
    expect([b.centre, b.landmark]).toEqual(['common', 'ballpark']);
    expect([h.centre, h.landmark]).toEqual(['piazza', 'none']);
    expect(b.ground).not.toBe(h.ground);
    expect(b.water.d).not.toBe(h.water.d);
    expect(b.roads).not.toEqual(h.roads);
  });
  it('an unknown city is drawn as the home map', () => {
    expect(mapArtFor('chicago')).toBe(mapArtFor('home'));
  });
  it('no tree stands inside a label card, or on the river', () => {
    for (const [id, city] of [['home', HOME_CITY], ['boston', BOSTON_CITY]] as const) {
      const art = mapArtFor(id);
      for (const [x, y] of art.trees) {
        for (const n of city.neighbourhoods) {
          const inside = x > n.x - 11 - 2 && x < n.x + 11 + 2 && y + 2.6 > n.y + 7.5 && y - 2.8 < n.y + 20;
          expect([id, x, y, n.id, inside]).toEqual([id, x, y, n.id, false]);
        }
      }
    }
    expect(mapArtFor('boston').trees.some(([x, y]) => y >= 30 && y <= 36 && x < 70)).toBe(false);
  });
  it('the ballpark fills the open lot, clear of every neighbourhood card', () => {
    for (const n of BOSTON_CITY.neighbourhoods) {
      const apart = Math.abs(n.x - OPEN_LOT.x) >= 22 || Math.abs(n.y + 14 - OPEN_LOT.y) >= 14;
      expect([n.id, apart]).toEqual([n.id, true]);
    }
  });
});
