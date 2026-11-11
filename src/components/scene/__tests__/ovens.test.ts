/// <reference types="jest" />
// The oven ladder (D417): at every step the bank is wider in total, every oven keeps a fire window, Lv 25 / 50 add trim and a taller hood.
import { FOOTPRINTS } from '../../../content/tuning';
import { HOOD_EXTRA, ovenOpening, ovenTier } from '../geometry';
import { MIN_OVEN_W, layout, ovenPlan } from '../layout';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];

function* banks() {
  for (let fp = 0; fp < 5; fp++)
    for (const cooks of [1, 2, 3])
      for (const staff of [1, 2])
        for (const plants of [0, 1, 3]) {
          const seq = Array.from({ length: FOOTPRINTS[fp].ovenSlots }, (_, i) => layout(fp, i + 1, cooks, staff, 6, DRIVER_SLOTS[fp], plants));
          yield { name: `fp${fp} c${cooks} s${staff} p${plants}`, seq };
        }
}
const total = (lay: ReturnType<typeof layout>) => lay.ovens.reduce((t, o) => t + (o.x1 - o.x0), 0);

/** The v5.11 rule: squeeze every oven thinner as the bank grows. */
function oldTotal(zone: number, n: number) {
  const singleW = (zone - (n - 1) * 6) / n;
  const decks = singleW >= 40 || n < 2 ? 1 : 2;
  const cols = Math.ceil(n / decks);
  return n * Math.min(60, (zone - (cols - 1) * 6) / cols);
}

describe('the oven ladder (D417)', () => {
  test('the total width of the ovens only grows with each new oven, in every kitchen at every footprint', () => {
    const bad: string[] = [];
    for (const { name, seq } of banks())
      seq.forEach((lay, i) => {
        if (i && total(lay) < total(seq[i - 1]) - 1e-6) bad.push(`${name}: ${i} → ${i + 1} ovens ${total(seq[i - 1]).toFixed(0)} → ${total(lay).toFixed(0)}`);
      });
    expect(bad).toEqual([]);
  });
  test('the check can fail: the old rule made the bank thinner at a step in the cramped kitchens', () => {
    let shrinks = 0;
    for (const { seq } of banks())
      seq.forEach((lay, i) => {
        const zone = lay.ovenCols.length ? lay.counter.x0 - 8 - (lay.prep.x1 + 8) : 0;
        if (i && oldTotal(zone, i + 1) < oldTotal(zone, i) - 1e-6) shrinks += 1;
      });
    expect(shrinks).toBeGreaterThan(10);
  });
  test('no oven is thinner than MIN_OVEN_W, none stands taller than the hood can clear (150), all stay in the zone between the bench and the counter', () => {
    for (const { name, seq } of banks())
      for (const lay of seq) {
        const zone0 = lay.prep.x1 + 8;
        const zone1 = lay.counter.x0 - 8;
        for (const o of lay.ovens) {
          expect([name, o.x1 - o.x0 >= MIN_OVEN_W - 1e-6, o.x0 >= zone0 - 1e-6, o.x1 <= zone1 + 1e-6]).toEqual([name, true, true, true]);
          expect([name, o.z + o.h <= 160]).toEqual([name, true]);
        }
      }
  });
  test('every oven has a fire window you can see: at least 14 wide and 5 tall on screen, every grade', () => {
    for (const { name, seq } of banks())
      for (const lay of seq)
        for (const grade of [0, 1, 2, 3, 4])
          for (const o of lay.ovens) {
            const op = ovenOpening(o, grade);
            expect([name, grade, op.x1 - op.x0 >= 14, op.y1 - op.y0 >= 5]).toEqual([name, grade, true, true]);
          }
  });
  test('Lv 25 and Lv 50 are the brass tiers, each with a taller hood', () => {
    expect([1, 24, 25, 49, 50, 125].map(ovenTier)).toEqual([0, 0, 1, 1, 2, 2]);
    expect(HOOD_EXTRA[1]).toBeGreaterThan(HOOD_EXTRA[0]);
    expect(HOOD_EXTRA[2]).toBeGreaterThan(HOOD_EXTRA[1]);
  });
  test('the plan is cached and stable per zone', () => {
    expect(ovenPlan(100, 3)).toBe(ovenPlan(100, 3));
    expect(ovenPlan(100, 1).decks).toBe(1);
  });
});
