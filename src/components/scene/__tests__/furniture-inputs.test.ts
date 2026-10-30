/// <reference types="jest" />
import { furnitureDeps, furnitureInputs, type FurnitureSource } from '../furniture-inputs';

const base = (over: Partial<FurnitureSource['shop']> = {}): FurnitureSource => ({
  id: 'suburbs',
  name: 'Suburbs',
  shop: { footprint: 1, prep: 24, managed: true, queued: 0, decor: { plants: 1, tables: 1, signage: 1 }, ...over },
  running: true,
  rate: 4,
  vehicle: 1,
});
const deps = (s: FurnitureSource) => JSON.stringify(furnitureDeps(furnitureInputs(s)));

describe('furniture memo deps (T27)', () => {
  test('every input field is a dependency, in a constant-length list', () => {
    const f = furnitureInputs(base());
    expect(furnitureDeps(f)).toHaveLength(Object.keys(f).length);
    expect(furnitureDeps(furnitureInputs(base({ queued: 8, managed: false })))).toHaveLength(Object.keys(f).length);
  });
  test('name, id and idleShop each change the deps', () => {
    const d0 = deps(base());
    expect(deps({ ...base(), name: 'Elsewhere' })).not.toBe(d0);
    expect(deps({ ...base(), id: 'waterfront' })).not.toBe(d0);
    expect(deps(base({ managed: false }))).not.toBe(d0);
  });
});

describe('furniture memo inputs (T24)', () => {
  test('a prep upgrade changes the deps even in a managed shop, where dough is constant', () => {
    // the v3.5 bug: the PrepBench draws extra gear at prep 25/50/75 but the memo never saw prep
    expect(deps(base({ prep: 25 }))).not.toBe(deps(base({ prep: 24 })));
    expect(deps(base({ prep: 50 }))).not.toBe(deps(base({ prep: 49 })));
  });
  test('every upgrade the furniture draws changes the deps', () => {
    const d0 = deps(base());
    expect(deps(base({ footprint: 2 }))).not.toBe(d0);
    expect(deps(base({ decor: { plants: 3, tables: 1, signage: 1 } }))).not.toBe(d0);
    expect(deps(base({ decor: { plants: 1, tables: 2, signage: 1 } }))).not.toBe(d0);
    expect(deps(base({ decor: { plants: 1, tables: 1, signage: 2 } }))).not.toBe(d0);
    expect(deps({ ...base(), vehicle: 2 })).not.toBe(d0);
    expect(deps({ ...base(), rate: 400 })).not.toBe(d0); // more boxes on the counter
    expect(deps({ ...base(), running: false })).not.toBe(d0);
  });
  test('things that change every tick do not (so the memo holds between upgrades)', () => {
    const d0 = deps(base());
    // a managed shop ignores the tap queue; sales and cash are not inputs at all
    expect(deps(base({ queued: 5 }))).toBe(d0);
  });
  test('an unmanaged shop follows its tap queue and keeps the vehicle at home', () => {
    const f = furnitureInputs(base({ managed: false, queued: 9 }));
    expect(f.dough).toBe(6);
    expect(f.idleShop).toBe(true);
    expect(furnitureInputs({ ...base({ managed: false }), id: 'downtown' }).idleShop).toBe(false);
  });
});
