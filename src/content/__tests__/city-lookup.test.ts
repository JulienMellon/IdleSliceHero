// U24, C147: neighbourhood lookups are Map reads over CITIES, and an id that is not in any city is a miss, not a throw.
import { CITIES, cityHolding, findHood, hoodIds } from '../cities';
import { HOME_CITY } from '../cities/home';

describe('which city has a neighbourhood', () => {
  test('every id of every city finds its own city and its own tables', () => {
    for (const city of Object.values(CITIES)) {
      for (const id of hoodIds(city)) {
        expect(cityHolding(id)).toBe(city);
        expect(findHood(id)).toBe(city.neighbourhoods.find((n) => n.id === id));
        expect(findHood(id, city)).toBe(findHood(id));
      }
    }
  });

  test('an id nobody has is a miss, and another city\'s id is a miss in this one', () => {
    expect(cityHolding('atlantis')).toBeUndefined();
    expect(findHood('atlantis')).toBeUndefined();
    const other = Object.values(CITIES).find((c) => c !== HOME_CITY)!;
    expect(findHood(hoodIds(other)[0], HOME_CITY)).toBeUndefined();
  });
});
