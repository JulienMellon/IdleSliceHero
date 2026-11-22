/// <reference types="jest" />
// Card S3, step 1: the piles. How many items a backlog draws, and the budget on where they stand: no pile over a head, a badge, the WELCOME mat, the doorway,
// the ladder's props or another pile, in any footprint, any crew and either floor plan.
import { layout } from './draw-layout';
import { FIRST_WIDE_FOOTPRINT } from '../../../content/shop-layout';
import { LINE } from '../../../engine/pipeline';
import { PILE_KINDS, PILE_MAX, PILE_STEPS, batchOf, pileBox, pileCount, pileParts, pileRect, pileSpots, type PileKind } from '../piles';
import { LADDER_LEVELS, ladderProps, badgeBand, doorRect, fixedPeople, hits, headBox, matRect } from '../ladder';
import { doorwaySignRect } from '../stations';
import { MAX_PINS } from '../ladder';

type Lay = ReturnType<typeof layout>;

/** A footprint, oven count, cooks and cashiers, the way shops grow, on both floor plans. */
function* layouts(): Generator<{ name: string; lay: Lay }> {
  for (let fp = 0; fp < 5; fp++)
    for (const ovens of [1, 3, 6])
      for (const cooks of fp === 0 ? [1, 2] : [1, 2, 3])
        for (const staff of [1, 2])
          for (const mirrored of [false, true]) {
            const lay = layout(fp, ovens, cooks, staff, 3, 3, 1, undefined, mirrored);
            yield { name: `fp${fp} ov${ovens} ck${cooks} st${staff}${mirrored ? ' mirrored' : ''}`, lay };
          }
}
const fullLadder = (lay: Lay) =>
  ladderProps(lay, {
    id: 'downtown',
    prepStep: LADDER_LEVELS.length,
    counterStep: LADDER_LEVELS.length,
    driverStep: LADDER_LEVELS.length,
    pins: MAX_PINS,
    vehicle: 1,
    outside: true,
  });

describe('pile counts (step 1)', () => {
  test('0 to 5 items from the backlog against one batch; 5 means more than four batches', () => {
    const b = 8;
    expect([0, 0.4, 0.5, 0.6, 1, 1.5, 1.75, 1.8, 2.5, 2.6, 4, 4.01, 9].map((r) => pileCount(r * b, b))).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    // a station is `piling` from two batches (features/service.ts): that already shows three items
    expect(pileCount(2 * b, b)).toBe(3);
    expect(pileCount(4 * b + 0.01, b)).toBe(PILE_MAX);
    expect(pileCount(4 * b, b)).toBeLessThan(PILE_MAX);
  });
  test('never negative, never over five, never NaN: an empty or odd input draws nothing', () => {
    for (const [backlog, batch] of [
      [-3, 4],
      [NaN, 4],
      [10, 0],
      [10, NaN],
      [Infinity, 4],
    ] as const) {
      const n = pileCount(backlog, batch);
      expect([backlog, batch, Number.isInteger(n) && n >= 0 && n <= PILE_MAX]).toEqual([backlog, batch, true]);
    }
    expect(PILE_STEPS).toHaveLength(PILE_MAX);
  });
  test('a pile only grows as the backlog does', () => {
    let last = 0;
    for (let q = 0; q <= 400; q++) {
      const n = pileCount(q / 10, 5);
      expect(n).toBeGreaterThanOrEqual(last);
      last = n;
    }
  });
  test('the batch is a tapped batch or what the shop moves in one cycle, as the line sizes it', () => {
    expect(batchOf(4, 1)).toBe(4);
    expect(batchOf(4, 10)).toBe(Math.ceil(10 * LINE.cycleSeconds));
  });
});

describe('where the piles stand (step 1 budget)', () => {
  test('every pile finds a place in every footprint, crew and plan', () => {
    const missing: string[] = [];
    for (const { name, lay } of layouts()) {
      const spots = pileSpots(lay, 'downtown');
      for (const kind of PILE_KINDS) if (!spots[kind]) missing.push(`${name} ${kind}`);
    }
    expect(missing).toEqual([]);
  });
  test('a full pile of each kind (the biggest it draws) is clear of heads, badges, the mat, the doorway and the plank', () => {
    const bad: string[] = [];
    for (const { name, lay } of layouts()) {
      const spots = pileSpots(lay, 'downtown');
      const fixed = [
        ['badges', badgeBand(lay)],
        ['mat', matRect(lay)],
        ['door', doorRect(lay)],
        ['plank', doorwaySignRect(lay)],
      ] as const;
      for (const kind of PILE_KINDS) {
        const s = spots[kind];
        if (!s) continue;
        for (let n = 1; n <= PILE_MAX; n++) {
          for (const r of pileParts(s, n)) {
            for (const [what, f] of fixed) if (hits(r, f)) bad.push(`${name} ${kind}×${n} over ${what}`);
            // drawn after everyone standing deeper than it: their heads must show
            for (const p of fixedPeople(lay)) if (p.y > s.sortY && hits(r, headBox(p.box))) bad.push(`${name} ${kind}×${n} over a head`);
          }
        }
      }
    }
    expect(bad.slice(0, 6)).toEqual([]);
  });
  test('the piles are clear of the ladder’s props at the top of every ladder, and of each other', () => {
    const bad: string[] = [];
    for (const { name, lay } of layouts()) {
      const props = fullLadder(lay);
      const spots = pileSpots(
        lay,
        'downtown',
        props.map((p) => p.rect),
      );
      const placed = PILE_KINDS.flatMap((k) => (spots[k] ? pileParts(spots[k]!, PILE_MAX).map((r) => ({ k, r })) : []));
      for (const { k, r } of placed) for (const p of props) if (hits(r, p.rect)) bad.push(`${name} ${k} over ${p.id}`);
      placed.forEach((a, i) => placed.slice(i + 1).forEach((b) => a.k !== b.k && hits(a.r, b.r) && bad.push(`${name} ${a.k} over ${b.k}`)));
    }
    expect(bad.slice(0, 6)).toEqual([]);
  });
  test('the budget can fail: a pile on the doormat is caught', () => {
    const lay = layout(2, 3, 3, 2, 3, 3, 1);
    const mat = matRect(lay);
    const on: PileKindSpot = { kind: 'boxes', ax: (mat.x0 + mat.x1) / 2, ay: mat.y1, k: 1, sortY: -15, stand: false, drop: 0, dir: 1 };
    expect(hits(pileRect(on, 3), mat)).toBe(true);
  });
  test('the mirrored plan is the plain plan’s places reflected', () => {
    for (let fp = 0; fp < 5; fp++) {
      const plain = layout(fp, 3, 3, 2, 3, 3, 1);
      const mirrored = layout(fp, 3, 3, 2, 3, 3, 1, undefined, true);
      const a = 2 * plain.frame.vanishX;
      const p = pileSpots(plain, 'downtown');
      const m = pileSpots(mirrored, 'downtown');
      for (const kind of PILE_KINDS) expect([kind, m[kind] && Math.round(m[kind]!.ax)]).toEqual([kind, p[kind] && Math.round(a - p[kind]!.ax)]);
    }
  });
  test('on a wide shop the piles stand inside its drawing', () => {
    for (let fp = FIRST_WIDE_FOOTPRINT; fp < 5; fp++) {
      const lay = layout(fp, 3, 3, 2, 3, 3, 1);
      for (const kind of PILE_KINDS) {
        const s = pileSpots(lay, 'downtown')[kind]!;
        const r = pileRect(s, PILE_MAX);
        expect(r.x0).toBeGreaterThanOrEqual(lay.frame.x0);
        expect(r.x1).toBeLessThanOrEqual(lay.frame.x0 + lay.frame.width);
      }
    }
  });
  test('a pile’s box grows with its count and an empty pile has none', () => {
    for (const kind of PILE_KINDS) {
      expect(pileBox(kind, 0)).toEqual({ x0: 0, y0: 0, x1: 0, y1: 0 });
      let h = 0;
      for (let n = 1; n <= PILE_MAX; n++) {
        const b = pileBox(kind, n, kind === 'dough');
        expect(b.y1 - b.y0).toBeGreaterThanOrEqual(h);
        h = b.y1 - b.y0;
      }
    }
  });
});

type PileKindSpot = Parameters<typeof pileRect>[0] & { kind: PileKind };
