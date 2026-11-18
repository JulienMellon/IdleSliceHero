/// <reference types="jest" />
// D508: Boston's shops wear Boston's colours, not the home city's art at the same build position.
import { NEIGHBORHOODS } from '../../../content/cities/boston/data';
import { BOSTON_LOOKS } from '../../cutscene/backdrop-art';
import { furnitureInputs, type FurnitureSource } from '../furniture-inputs';
import { LOOKS } from '../identity';

const HOME = ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'];

describe('Boston looks', () => {
  test('every Boston neighbourhood has a look of its own, with the awning in its data.ts colour', () => {
    for (const n of NEIGHBORHOODS) {
      expect(LOOKS[n.id]).toBeDefined();
      expect(LOOKS[n.id].awning[0].toLowerCase()).toBe(n.color.toLowerCase());
      expect(BOSTON_LOOKS[n.id]).toBeDefined();
    }
  });
  test('no two Boston shops share an awning, and none wears the University steeple awning (purple) on the Fenway look', () => {
    const mains = NEIGHBORHOODS.map((n) => LOOKS[n.id].awning[0]);
    expect(new Set(mains).size).toBe(mains.length);
    expect(LOOKS.fenway.awning[0]).not.toBe(LOOKS.university.awning[0]);
    for (const n of NEIGHBORHOODS) expect(HOME).not.toContain(n.id);
  });
  test('the first shop of a city has a free sidewalk, whichever city: Downtown, and North End', () => {
    const src = (id: string, first?: boolean): FurnitureSource => ({ id, name: 'x', shop: { footprint: 0, prep: 1, counter: 1, drivers: 1, managed: false, line: { prepped: 0 }, decor: { plants: 0, tables: 0, signage: 0 } }, running: false, rate: 0, vehicle: 0, first });
    expect(furnitureInputs(src('north-end', true)).idleShop).toBe(false);
    expect(furnitureInputs(src('southie', false)).idleShop).toBe(true);
    expect(furnitureInputs(src('downtown')).idleShop).toBe(false);
  });
});
