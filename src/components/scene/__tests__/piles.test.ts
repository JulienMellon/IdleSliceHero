/// <reference types="jest" />
// Card S3, step 1: the piles. How many items a backlog draws, and the budget on where they stand: no pile over a head, a badge, the WELCOME mat, the doorway,
// the ladder's props or another pile, in any footprint, any crew and either floor plan.
import { layout } from './draw-layout';
import { cityOf } from '../../../content/cities';
import { NONNA_TAKEOVER } from '../../../content/cities/home/fit';
import { withFeatures } from '../../../engine/features';
import { reportView, service } from '../../../engine/features/service';
import * as G from '../../../engine/game';
import { FIRST_WIDE_FOOTPRINT } from '../../../content/shop-layout';
import { LINE } from '../../../engine/pipeline';
import {
  CALM_MAX,
  PILE_KINDS,
  PILE_MAX,
  PILING_MIN,
  PILE_SCALE,
  PILE_STACK,
  PILE_STEPS,
  batchOf,
  pileBox,
  pileCount,
  pileParts,
  pileRect,
  pileSpots,
  type PileKind,
} from '../piles';
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
  test('a balanced station shows 0 to 2 items from the backlog against one batch (D557: the first at 1.5 batches, never more than two)', () => {
    const b = 8;
    expect([0, 0.4, 1, 1.5, 1.6, 1.75, 1.8, 2, 2.6, 4.01, 9].map((r) => pileCount(r * b, b))).toEqual([0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 2]);
    expect(PILE_STEPS[0]).toBe(1.5);
    expect(CALM_MAX).toBe(2);
  });
  test('a piling station shows 4 items or more, 5 past four batches', () => {
    const b = 8;
    expect([0, 0.4, 1, 1.6, 2, 2.6, 4, 4.01, 9].map((r) => pileCount(r * b, b, true))).toEqual([0, 4, 4, 4, 4, 4, 4, 5, 5]);
    expect(PILING_MIN).toBeGreaterThan(PILE_STACK);
    expect(pileCount(4 * b + 0.01, b, true)).toBe(PILE_MAX);
  });
  test('never negative, never over five, never NaN: an empty or odd input draws nothing', () => {
    for (const [backlog, batch] of [
      [-3, 4],
      [NaN, 4],
      [10, 0],
      [10, NaN],
      [Infinity, 4],
    ] as const) {
      for (const piling of [false, true]) {
        const n = pileCount(backlog, batch, piling);
        expect([backlog, batch, Number.isInteger(n) && n >= 0 && n <= PILE_MAX]).toEqual([backlog, batch, true]);
      }
    }
    expect(PILE_STEPS).toHaveLength(PILE_MAX);
  });
  test('a pile only grows as the backlog does', () => {
    let last = 0;
    for (const piling of [false, true]) {
      last = 0;
      for (let q = 0; q <= 400; q++) {
        const n = pileCount(q / 10, 5, piling);
        expect(n).toBeGreaterThanOrEqual(last);
        last = n;
      }
    }
  });
  test('the batch is a tapped batch or what the shop moves in one cycle, as the line sizes it', () => {
    expect(batchOf(4, 1)).toBe(4);
    expect(batchOf(4, 10)).toBe(Math.ceil(10 * LINE.cycleSeconds));
  });
});

describe('a balanced shop shows no dough stack (D557)', () => {
  const T0 = 1_800_000_000_000;
  /** Downtown after the tutorial, a head at every station, 10 drivers and 1 seating; the kitchen at the given levels. Played `seconds` seconds, then the piles it would draw. */
  function piles(
    levels: { prep: number; ovens: number; counter: number },
    seconds: number,
  ): (Record<'dough' | 'boxes' | 'bags', number> & { oldDough: number })[] {
    let g = G.newGame(T0);
    g = { ...g, seenScenes: [...g.seenScenes, NONNA_TAKEOVER.sceneId] };
    g = { ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, built: true, managed: false, heads: G.allHeads(), drivers: 10, tables: 1, ...levels } } };
    const city = cityOf(g);
    const out: (Record<'dough' | 'boxes' | 'bags', number> & { oldDough: number })[] = [];
    let now = T0;
    for (let i = 0; i < seconds; i++) {
      now += 1000;
      g = G.playTick(g, 1, now);
      if (i < 40) continue;
      const shop = g.shops.downtown;
      const batch = batchOf(G.tapBatch(shop), G.shopRate(shop, g.vehicle, city.fit));
      const sym = reportView(g, 'downtown', now).symptoms;
      out.push({
        dough: pileCount(shop.line.prepped, batch, sym.prep === 'piling'),
        oldDough: [0.5, 1, 1.75, 2.5, 4].filter((t) => shop.line.prepped / batch > t).length,
        boxes: pileCount(shop.line.baked, batch, sym.ovens === 'piling'),
        bags: pileCount(shop.line.boxed, batch, sym.counter === 'piling'),
      });
    }
    return out;
  }
  test('with every station at one level the dough pile is 0 or 2 discs at most in every second, and the other piles too', () => {
    const seen = withFeatures([service], () => piles({ prep: 10, ovens: 10, counter: 10 }, 120));
    expect(seen.length).toBeGreaterThan(60);
    expect(Math.max(...seen.map((p) => p.dough))).toBeLessThanOrEqual(CALM_MAX);
    expect(Math.max(...seen.map((p) => p.boxes))).toBeLessThanOrEqual(CALM_MAX);
    expect(Math.max(...seen.map((p) => p.bags))).toBeLessThanOrEqual(CALM_MAX);
    // the check can fail: the old steps (the first at half a batch, a third item at two) drew a stack of 3 for this balanced shop
    expect(Math.max(...seen.map((p) => p.oldDough))).toBeGreaterThan(CALM_MAX);
  });
  test('a shop short on ovens piles the dough above 3 discs in every second', () => {
    const seen = withFeatures([service], () => piles({ prep: 20, ovens: 1, counter: 20 }, 120));
    expect(Math.min(...seen.map((p) => p.dough))).toBeGreaterThan(3);
  });
});

describe('piles read at phone size (D548)', () => {
  test('a pile is drawn bigger than the furniture, so three items stand at least 18 pt tall (the dough on its stand 40) and 22 pt wide', () => {
    const lay = layout(1, 3, 3, 2, 3, 3, 1);
    for (const kind of PILE_KINDS) {
      expect(PILE_SCALE[kind]).toBeGreaterThanOrEqual(1.3);
      const s = pileSpots(lay, 'downtown')[kind]!;
      const r = pileRect(s, PILE_STACK);
      expect([kind, r.y1 - r.y0 >= (kind === 'dough' ? 40 : 18), r.x1 - r.x0 >= 22]).toEqual([kind, true, true]);
    }
  });
  test('items past the third spill onto the floor beside the pile (the shelf takes a second row), and a bigger pile is a bigger drawing', () => {
    const lay = layout(1, 3, 3, 2, 3, 3, 1);
    for (const kind of ['dough', 'boxes'] as const) {
      const s = pileSpots(lay, 'downtown')[kind]!;
      expect(pileParts(s, PILE_STACK)).toHaveLength(1);
      const spilled = pileParts(s, PILE_STACK + 2);
      expect(spilled).toHaveLength(2);
      // the spill lies on the floor, below the stack's foot
      expect(spilled[1].y1).toBeGreaterThan(spilled[0].y1);
    }
    const s = pileSpots(lay, 'downtown').bags!;
    expect(pileParts(s, 5)).toHaveLength(1);
    expect(pileRect(s, 5).y1 - pileRect(s, 5).y0).toBeGreaterThan(pileRect(s, 3).y1 - pileRect(s, 3).y0);
    for (const kind of PILE_KINDS) {
      const sp = pileSpots(lay, 'downtown')[kind]!;
      const area = (n: number) => pileParts(sp, n).reduce((t, r) => t + (r.x1 - r.x0) * (r.y1 - r.y0), 0);
      for (let n = 2; n <= PILE_MAX; n++) expect(area(n)).toBeGreaterThanOrEqual(area(n - 1));
      expect(area(PILE_MAX)).toBeGreaterThan(area(1));
    }
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
      // the stacks stay clear of each other; a spill is items on the floor, which another pile may stand over
      const stacks = PILE_KINDS.flatMap((k) => (spots[k] ? [{ k, r: pileParts(spots[k]!, PILE_MAX)[0] }] : []));
      stacks.forEach((a, i) => stacks.slice(i + 1).forEach((b) => hits(a.r, b.r) && bad.push(`${name} ${a.k} over ${b.k}`)));
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
