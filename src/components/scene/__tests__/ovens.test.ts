/// <reference types="jest" />
// The oven ladder (D417): at every step the bank is wider in total, every oven keeps a fire window, Lv 25 / 50 add trim and a taller hood.
import { FOOTPRINTS } from '../../../content/tuning';
import { HOOD_EXTRA, isBoxOven, ovenFrame, ovenOpening, ovenTier } from '../geometry';
import { BAY_COL_MIN, COUNTER_STAFF_STEP, MIN_OVEN_W, OVEN_BAY, ROOM_W, layout, ovenPlan } from '../layout';

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

// ---------- D417 (round 60): the bay is fixed, the ovens are never squeezed ----------
const LEVELS = [1, 10, 20, 30, 40, 60, 80, 100, 120];
const CAP = (fp: number) => 25 * (fp + 1); // TUNING.levelsPerFootprint × (footprint + 1)
/** The crew and the bank a station level brings (storefront.tsx). */
const ovensAt = (fp: number, lv: number) => Math.min(FOOTPRINTS[fp].ovenSlots, 1 + Math.floor((lv - 1) / 8));
const cooksAt = (lv: number) => Math.min(3, 1 + Math.floor((lv - 1) / 15));
const staffAt = (lv: number) => Math.min(2, 1 + Math.floor((lv - 1) / 15));
const within = (fp: number) => LEVELS.filter((l) => l <= CAP(fp));
const totalW = (lay: ReturnType<typeof layout>) => lay.ovens.reduce((t, o) => t + (o.x1 - o.x0), 0);
const rig = (fp: number, ovenLv: number, prepLv: number, counterLv: number) => layout(fp, ovensAt(fp, ovenLv), cooksAt(prepLv), staffAt(counterLv), 6, 3, 1);

describe('the oven bay (D417, round 60)', () => {
  test('MIN_OVEN_W is 44 and every footprint reserves at least 52 per oven column', () => {
    expect(MIN_OVEN_W).toBe(44);
    expect(BAY_COL_MIN).toBe(52);
    OVEN_BAY.forEach((b, fp) => {
      expect([fp, b.w >= b.cols * BAY_COL_MIN + (b.cols - 1) * 6]).toEqual([fp, true]);
      // enough columns that the footprint's biggest bank needs at most four decks
      expect([fp, Math.ceil(FOOTPRINTS[fp].ovenSlots / b.cols) <= 4]).toEqual([fp, true]);
    });
  });
  test('for every footprint and every prep / oven / counter level on the ladder: every oven is drawn ≥ 44 wide, the bank only widens with the oven level, and a higher prep or counter level never narrows it', () => {
    const bad: string[] = [];
    for (let fp = 0; fp < 5; fp++)
      for (const prepLv of within(fp))
        for (const counterLv of within(fp)) {
          let prev = 0;
          for (const ovenLv of within(fp)) {
            const lay = rig(fp, ovenLv, prepLv, counterLv);
            const tag = `fp${fp} prep${prepLv} oven${ovenLv} counter${counterLv}`;
            for (const o of lay.ovens) if (o.x1 - o.x0 < MIN_OVEN_W - 1e-6) bad.push(`${tag}: oven ${(o.x1 - o.x0).toFixed(1)} wide`);
            if (totalW(lay) < prev - 1e-6) bad.push(`${tag}: bank narrowed ${prev.toFixed(0)} → ${totalW(lay).toFixed(0)}`);
            prev = totalW(lay);
            // …the same bank at the lowest prep and counter level: more crew never takes width from it
            const base = rig(fp, ovenLv, 1, 1);
            if (totalW(lay) < totalW(base) - 1e-6 || lay.ovens.some((o, i) => Math.abs(o.x0 - base.ovens[i].x0) > 1e-6 || Math.abs(o.x1 - base.ovens[i].x1) > 1e-6)) bad.push(`${tag}: crew moved the ovens`);
          }
        }
    expect(bad.slice(0, 6)).toEqual([]);
  });
  test('the check can fail: the v5.12 zone (the bench and the counter set the ovens\' room) shrank with the crew and fell below the bay\'s 52 at every footprint', () => {
    // the old geometry, from layout.ts before the bay: bench ends at min(counter.x0 − 16 − 36, …), the ovens fill bench + 8 … counter.x0 − 8
    const oldZone = (fp: number, cooks: number, staff: number) => {
      const L = 196.5 - ROOM_W[fp] / 2;
      const R = L + ROOM_W[fp];
      const counterX0 = R - 60 - (56 + 26 * (staff - 1));
      const prepMax = counterX0 - 16 - 36;
      const prepX1 = cooks === 1 ? Math.min(prepMax, L + 22 + 54) : Math.min(prepMax, L + 6 + 30 + cooks * 24);
      return counterX0 - 8 - (prepX1 + 8);
    };
    let shrinks = 0;
    let thin = 0;
    for (let fp = 0; fp < 5; fp++) {
      if (oldZone(fp, cooksAt(CAP(fp)), 2) < oldZone(fp, 1, 1) - 1e-6) shrinks += 1;
      if (oldZone(fp, cooksAt(CAP(fp)), 2) < OVEN_BAY[fp].cols * BAY_COL_MIN) thin += 1;
    }
    expect(shrinks).toBe(5);
    expect(thin).toBeGreaterThanOrEqual(3);
    // the new bay is the same whatever the crew
    for (let fp = 0; fp < 5; fp++) {
      const a = layout(fp, 1, 1, 1, 6, 3, 1);
      const b = layout(fp, 1, cooksAt(CAP(fp)), 2, 6, 3, 1);
      expect([fp, a.bay, a.ovenCols]).toEqual([fp, b.bay, b.ovenCols]);
      expect(b.bay.x1 - b.bay.x0).toBe(OVEN_BAY[fp].w);
      expect(b.counter.x0 - 8).toBeGreaterThanOrEqual(b.bay.x1 - 1e-6);
    }
    expect(COUNTER_STAFF_STEP).toBe(26);
  });
  test('the bench grows toward the bay and stops at its edge, with an 8 pt gap, and a full crew still has room to stand', () => {
    for (let fp = 0; fp < 5; fp++)
      for (const cooks of [1, 2, 3]) {
        const lay = layout(fp, 1, cooks, 2, 6, 3, 1);
        expect([fp, cooks, lay.prep.x1 <= lay.bay.x0 - 8 + 1e-6, lay.prep.x1 > lay.prep.x0 + 30]).toEqual([fp, cooks, true, true]);
        // cooks stand at least 17 apart (the starter shop cannot reach a third cook: its cap is Lv 25)
        if (cooks <= cooksAt(CAP(fp))) lay.cooks.forEach((x, i) => i && expect([fp, cooks, x - lay.cooks[i - 1] >= 17]).toEqual([fp, cooks, true]));
      }
  });
  test('the top deck of every column is a dome at every grade: stone, wood-fired, copper and gold keep the Lv 3 brick arch', () => {
    for (let fp = 0; fp < 5; fp++) {
      const lay = layout(fp, FOOTPRINTS[fp].ovenSlots, 3, 2, 6, 3, 1);
      for (const grade of [0, 1, 2, 3, 4]) {
        const tops = lay.ovens.filter((o) => !isBoxOven(o, grade));
        expect([fp, grade, tops.length >= lay.ovenCols.length]).toEqual([fp, grade, true]);
        // a column's topmost oven (nothing above it) is never a box
        for (const o of lay.ovens) if (!lay.ovens.some((p) => p !== o && p.x0 < o.x1 - 1 && p.x1 > o.x0 + 1 && p.z > o.z)) expect([fp, grade, isBoxOven(o, grade)]).toEqual([fp, grade, false]);
        for (const o of tops) {
          const f = ovenFrame(o);
          expect(f.w).toBeGreaterThan(30); // an arch you can see
        }
      }
    }
  });
});
