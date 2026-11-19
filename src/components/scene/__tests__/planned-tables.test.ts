// R1: the room plan (scene/layout.ts) no longer reads the home city's footprints. It plans each footprint's room for PLANNED_TABLES, so every
// city pack's fit must cap its tables at the same numbers, or the engine would draw more tables than the room holds.
import { CITIES } from '../../../content/cities';
import { HOME_CITY } from '../../../content/cities/home';
import { PLANNED_TABLES } from '../layout';

describe('the room plan and the cities agree on the tables of each footprint', () => {
  test.each(Object.values(CITIES).map((c) => [c.id, c] as const))('%s', (_id, city) => {
    expect(city.fit.footprints.map((f) => f.maxTables)).toEqual([...PLANNED_TABLES]);
  });

  test('the home city is the plan the numbers were taken from', () => {
    expect(HOME_CITY.fit.footprints.map((f) => f.maxTables)).toEqual([2, 3, 4, 5, 6]);
  });
});
