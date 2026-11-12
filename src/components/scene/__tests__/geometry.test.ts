/// <reference types="jest" />
import { CHEER_HAND, bodyBy, boxOvenGeom, domeGeom, flameBox, isBoxOven, limbGeom, ovenFrame } from '../geometry';
import { layout } from '../layout';
import type { Act, Kind } from '../looks';
import { bobFor } from '../quantise';

const DRIVER_SLOTS = [2, 2, 3, 3, 4];

describe('flame stays inside its window or mouth (T14)', () => {
  test('every oven at every footprint and grade', () => {
    let checked = 0;
    for (let fp = 0; fp < 5; fp++)
      for (const ovens of [1, 2, 3, 4, 6])
        for (let grade = 0; grade < 5; grade++) {
          const lay = layout(fp, ovens, 2, 1, 4, DRIVER_SLOTS[fp], 0);
          for (const o of lay.ovens) {
            const f = flameBox(o, grade);
            const { cx } = ovenFrame(o);
            if (isBoxOven(o, grade)) {
              const { dw, dh, dy } = boxOvenGeom(o);
              expect(f.mx - f.mw / 2).toBeGreaterThanOrEqual(cx - dw / 2 - 1e-6);
              expect(f.mx + f.mw / 2).toBeLessThanOrEqual(cx + dw / 2 + 1e-6);
              expect(f.my).toBeGreaterThanOrEqual(dy);
              expect(f.my).toBeLessThanOrEqual(dy + dh);
            } else {
              const { pTop, mTop, mw } = domeGeom(o);
              expect(f.mw).toBeLessThanOrEqual(mw + 1e-6);
              expect(f.my).toBeGreaterThanOrEqual(mTop);
              expect(f.my).toBeLessThanOrEqual(pTop);
            }
            checked++;
          }
        }
    expect(checked).toBeGreaterThan(200);
  });
});

describe("limbs hang from the body's hip (T15)", () => {
  test('limb hip height equals the drawn body height minus the walk bob', () => {
    const kinds: Kind[] = ['cook', 'baker', 'staff', 'driver', 'guest', 'sit'];
    const acts: Act[] = ['none', 'pin', 'toss', 'ladle', 'peel', 'pizza', 'slide', 'slice', 'cup', 'lean'];
    for (const kind of kinds)
      for (const act of acts)
        for (const step of [0, 0.7, 1.9, 3.1])
          for (const tall of [-1, 0, 2]) {
            const g = limbGeom({ kind, act, carry: false, carryWalk: false, step, arm: 1, tall });
            expect(g.by).toBeCloseTo(bodyBy(kind, tall) - bobFor(kind, step), 9);
          }
  });
});

describe('the cheer pose (D444)', () => {
  test('both hands go above the head, one either side of it, for every cook at every walk and arm phase', () => {
    for (const tall of [-2, 0, 3])
      for (const arm of [0, 1.5, 3]) {
        const g = limbGeom({ kind: 'cook', act: 'cheer', carry: false, carryWalk: false, step: 0, arm, tall });
        const headTop = g.by - 9 - 8; // the head's centre is 9 above the shoulders, and it is ~8 tall above that
        expect(g.hand[1]).toBeLessThan(headTop);
        expect(g.backHand[1]).toBeLessThan(headTop);
        expect(g.hand[0]).toBeGreaterThan(0);
        expect(g.backHand[0]).toBeLessThan(0);
        expect(g.hand[0] + g.backHand[0]).toBeCloseTo(0, 6); // a mirrored pair
      }
    expect(CHEER_HAND(-39)[1]).toBeLessThan(-39);
    // the working poses are untouched
    const toss = limbGeom({ kind: 'cook', act: 'toss', carry: false, carryWalk: false, step: 0, arm: 0, tall: 0 });
    expect(toss.backHand[1]).toBeGreaterThan(toss.hand[1]);
  });
});

