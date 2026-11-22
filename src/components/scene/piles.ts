// What a slow station leaves lying around (v5.22, card S3): rolled dough on the pass between prep and the ovens, boxed pies on the counter, bags on
// the pickup shelf. How many are drawn follows the backlog (0-5), where they stand is found per layout and checked against what must stay clear
// (a head, the badges, the doormat, the doorway, the ladder's props and each other). Pure, so the counts and the places are budget-tested in node;
// piles.tsx draws what this places.
import { LINE } from '../../engine/pipeline';
import type { Layout } from './layout';
import { flipRect, plainOf } from './layout-space';
import { P, kAt } from './projection';
import type { Rect } from './stations';
import { fixedPeople, hits, obstacles } from './ladder';
import type { NeighborhoodId } from '../../content/types';

/** The most items a pile shows. */
export const PILE_MAX = 5;
/**
 * A pile shows another item at each of these many batches of backlog: over one and a half is the first, over four is the full five (D557: a balanced shop's bench holds a batch
 * or two as the line runs, which read as a pile at one half; D548 asked for the first item at 1.5).
 */
export const PILE_STEPS: readonly number[] = [1.5, 1.75, 2, 2.5, 4];
/** A station that is not `piling` (the engine's symptom: customers outnumber the kitchen and the stock stays over two batches) never shows more than this many items (D557: two discs, no stack). */
export const CALM_MAX = 2;
/** A station that is `piling` shows at least this many items, so a short shop reads as one at a glance whatever instant the pile is drawn at (the oven takes a batch every few seconds). */
export const PILING_MIN = 4;

/**
 * How many items a backlog of `backlog` pies shows when one batch is `batch` (0 to PILE_MAX). `piling`: the station's symptom is `piling`. A balanced station (the default) shows 0 to
 * CALM_MAX items; a piling one shows PILING_MIN or more while anything is waiting.
 */
export function pileCount(backlog: number, batch: number, piling = false): number {
  if (!(backlog > 0) || !(batch > 0)) return 0;
  const r = backlog / batch;
  const n = PILE_STEPS.filter((t) => r > t).length;
  return piling ? Math.max(n, PILING_MIN) : Math.min(n, CALM_MAX);
}

export type PileKind = 'dough' | 'boxes' | 'bags';
export const PILE_KINDS: readonly PileKind[] = ['dough', 'boxes', 'bags'];

/** One batch of the line: a tapped batch, or what the shop's rate moves in one cycle (pipeline.ts `batchFor`). */
export const batchOf = (tapBatch: number, rate: number): number => Math.max(tapBatch, Math.ceil(rate * LINE.cycleSeconds));

/** The height (local units) of the steel stand the dough stands on when it is on the pass; on the bench it stands on the bench itself. */
export const STAND_H = 22;

/** Piles are drawn this much bigger than the furniture's scale: at phone size a pile of three has to read as a pile (D548). */
export const PILE_SCALE: Readonly<Record<PileKind, number>> = { dough: 1.6, boxes: 1.35, bags: 1.3 };
/** The first this many items stand in the pile; the rest spill onto the floor beside it. The shelf's bags are the exception: a second row on the shelf (the counter's front is too short for a floor spill beside the boxes'). */
export const PILE_STACK = 3;
export const stackOf = (kind: PileKind): number => (kind === 'bags' ? PILE_MAX : PILE_STACK);

/**
 * A pile's drawing box in its own units (x right, y down, anchor at the bottom centre) for `n` items. `stand`: the dough's steel stand under it.
 * `drop`: how far the floor is below the anchor, where items past PILE_STACK spill. The art in pile-art.tsx is drawn inside exactly this box.
 */
export function pileBox(kind: PileKind, n: number, stand = false, drop = 0): Rect {
  if (n <= 0) return { x0: 0, y0: 0, x1: 0, y1: 0 };
  const stacked = Math.min(n, stackOf(kind));
  const spilled = Math.max(0, n - stacked);
  let b: Rect;
  if (kind === 'dough') b = { x0: -9, y0: -((stand ? STAND_H : 0) + 3.2 * stacked + 4), x1: 9, y1: 1 };
  else if (kind === 'boxes') b = { x0: -10.5, y0: -(5 * stacked + 1), x1: 10.5, y1: 1 };
  else b = { x0: -15, y0: n > PILE_STACK ? -25 : -15, x1: 15, y1: 6 };
  if (spilled > 0) {
    // the spilled items lie on the floor beside the pile, one to a place
    const far = spillX(kind, spilled - 1);
    b = { x0: Math.min(b.x0, far - 9), y0: b.y0, x1: Math.max(b.x1, far + 9), y1: Math.max(b.y1, drop + 2) };
  }
  return b;
}
/** Where the first spilled item lies (x, local units, on the side `SPILL_SIDE` says) and the gap to the next. */
export const SPILL_X = 14;
export const SPILL_STEP = 11;
/** The dough spills toward the ovens; the counter's piles away from the door, which stands at the counter's other end. */
export const SPILL_SIDE: Readonly<Record<PileKind, 1 | -1>> = { dough: 1, boxes: -1, bags: -1 };
/** The x (local units) of the `i`th spilled item. */
export const spillX = (kind: PileKind, i: number): number => SPILL_SIDE[kind] * (SPILL_X + i * SPILL_STEP);

/** Where one kind of pile stands in a layout: the screen anchor, the scale, the painter's depth and whether the dough has its stand. */
export interface PileSpot {
  kind: PileKind;
  ax: number;
  ay: number;
  k: number;
  sortY: number;
  stand: boolean;
  /** How far below the anchor the floor is, in the pile's own units. */
  drop: number;
  /** 1, or -1 in the mirrored plan: the drawing is turned round, so the spill lies on the other side. */
  dir: 1 | -1;
}

/** A pile's rectangle on the screen. */
export function pileRect(s: PileSpot, n: number): Rect {
  const b = pileBox(s.kind, n, s.stand, s.drop);
  const [x0, x1] = s.dir < 0 ? [-b.x1, -b.x0] : [b.x0, b.x1];
  return { x0: s.ax + x0 * s.k, y0: s.ay + b.y0 * s.k, x1: s.ax + x1 * s.k, y1: s.ay + b.y1 * s.k };
}

/**
 * The parts a pile is drawn in, each its own rectangle: the stack, and (past PILE_STACK items) the spill on the floor, which is only as tall as an item.
 * The budget checks these, not their union: the empty air between a stack and the floor is not drawn.
 */
export function pileParts(s: PileSpot, n: number): Rect[] {
  const stack = pileRect(s, Math.min(n, stackOf(s.kind)));
  if (n <= stackOf(s.kind)) return [stack];
  const ends = [spillX(s.kind, 0), spillX(s.kind, n - stackOf(s.kind) - 1)];
  const [lo, hi] = [Math.min(...ends) - 9, Math.max(...ends) + 9];
  const [x0, x1] = s.dir < 0 ? [-hi, -lo] : [lo, hi];
  return [stack, { x0: s.ax + x0 * s.k, y0: s.ay + (s.drop - 8) * s.k, x1: s.ax + x1 * s.k, y1: s.ay + (s.drop + 2) * s.k }];
}

interface Candidate {
  x: number;
  y: number;
  z: number;
  /** The painter's depth: just in front of the furniture the pile stands on (the bench at 66, the counter at 64), so it is drawn over it. */
  sort: number;
  stand: boolean;
}

/** The depths the bench (props.tsx `PrepBench`, 66) and the counter (64) are sorted at: a pile standing on one is drawn just after it. */
const BENCH_SORT = 65.5;
const COUNTER_SORT = 63.5;

/** Candidates for each kind, in the order they are tried, in the plain plan's room units. */
function candidatesFor(lay: Layout): Record<PileKind, Candidate[]> {
  const lastPrep = lay.prep2 ?? lay.prep;
  const gap = (lastPrep.x1 + lay.bay.x0) / 2;
  const { counter, staff } = lay;
  const mid = staff.length > 1 ? (staff[0] + staff[1]) / 2 : counter.x0 + 20;
  return {
    // the pass: the gap between the bench and the oven bay, on a steel stand; then the bench's two ends
    dough: [
      { x: gap, y: 76, z: 0, sort: BENCH_SORT, stand: true },
      { x: lastPrep.x1 - 6, y: 76, z: 28, sort: BENCH_SORT, stand: false },
      { x: lay.prep.x0 + 8, y: 76, z: 28, sort: BENCH_SORT, stand: false },
    ],
    // the counter's door end, where the boxes always stood, then its other free places
    boxes: [
      { x: counter.x1 - 15, y: 74, z: 38, sort: COUNTER_SORT, stand: false },
      { x: counter.x0 + 9, y: 74, z: 38, sort: COUNTER_SORT, stand: false },
      { x: mid, y: 76, z: 38, sort: COUNTER_SORT, stand: false },
    ],
    // the pickup shelf: bracketed to the counter's front panel by the pickup spots (an idle driver stands in front of it and covers it), then further along the panel
    bags: [
      { x: counter.x1 - 15, y: 64.5, z: 12, sort: COUNTER_SORT - 0.1, stand: false },
      { x: counter.x1 - 44, y: 64.5, z: 12, sort: COUNTER_SORT - 0.1, stand: false },
      { x: counter.x0 + 15, y: 64.5, z: 12, sort: COUNTER_SORT - 0.1, stand: false },
    ],
  };
}

/**
 * Where each pile stands in this layout, or null where nowhere is clear. Placed in the plain plan (the mirrored plan's are the plain plan's places
 * flipped, as the ladder's are) and checked at the full pile of five against the badges, the doorway and the mat, every standing
 * head the pile would be drawn over, `avoid` (the ladder's props) and the piles already placed.
 */
export function pileSpots(lay: Layout, id: NeighborhoodId, avoid: readonly Rect[] = []): Record<PileKind, PileSpot | null> {
  if (lay.mirrored) {
    const a = 2 * lay.frame.vanishX;
    const plain = pileSpots(
      plainOf(lay),
      id,
      avoid.map((r) => flipRect(r, a)),
    );
    const out = {} as Record<PileKind, PileSpot | null>;
    for (const kind of PILE_KINDS) out[kind] = plain[kind] && { ...plain[kind]!, ax: a - plain[kind]!.ax, dir: -1 };
    return out;
  }
  const blockers = obstacles(lay, id).all;
  const people = fixedPeople(lay);
  const fixed: Rect[] = [...blockers, ...avoid];
  const cands = candidatesFor(lay);
  const out: Record<PileKind, PileSpot | null> = { dough: null, boxes: null, bags: null };
  const taken: Rect[] = [];
  for (const kind of PILE_KINDS) {
    for (const c of cands[kind]) {
      const [ax, ay] = P(c.x, c.y, c.z);
      const k = kAt(c.y) * PILE_SCALE[kind];
      const spot: PileSpot = { kind, ax, ay, k, sortY: c.sort, stand: c.stand, drop: (P(c.x, c.y, 0)[1] - ay) / k, dir: 1 };
      const parts = pileParts(spot, PILE_MAX);
      const any = (rs: readonly Rect[]) => parts.some((r) => rs.some((b) => hits(r, b)));
      // the pickup shelf stands where the idle driver does: he covers it, it never covers him (he is drawn over the shelf)
      if (any(fixed) || taken.some((b) => hits(parts[0], b))) continue;
      // drawn over whoever stands deeper than the pile: their heads must stay clear of it
      if (people.some((p) => p.y > spot.sortY && any([p.head]))) continue;
      out[kind] = spot;
      // (a spill is only items lying on the floor: another pile may stand over it, so only the stack is kept clear)
      taken.push(parts[0]);
      break;
    }
  }
  return out;
}
