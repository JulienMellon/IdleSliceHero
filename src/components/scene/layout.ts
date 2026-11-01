// Pure scene geometry: where every station, table, lane and person stands for a given shop size.
// No React here, so it is unit-tested directly (src/components/scene/__tests__/scene.test.ts).
import { P, SCENE_W, unprojectX } from './projection';

export const ROOM_W = [270, 295, 320, 340, 358];

/** Chairs sit ±SEAT from a table's centre; with a 78 pitch and a quarter-pitch back-row offset every seat interleaves. */
export const SEAT = 19.5;
/** Table pitch along a row. */
export const TABLE_PITCH = 78;
/** Depths (room y) of the dining rows. */
export const FRONT_ROW_Y = 6;
export const BACK_ROW_Y = 42;
/** A lone starter table sits mid-floor at this depth. */
export const STARTER_Y = 20;
/** Depths of the door threshold just inside and just outside the shop. */
export const DOOR_IN_Y = 8;
export const DOOR_OUT_Y = -30;
/** Depth of the walkway in front of the counter that people route through. */
export const COUNTER_AISLE_Y = 44;
/** The lane just in front of the counter, behind the drivers' pickup spots (y 46). */
export const COUNTER_LANE_Y = 52;
/** The aisle between the two table rows; walk-ins reach every chair from here. */
export const DINING_AISLE_Y = 24;
/** Window bar and its stools sit along the front glass. */
export const LEDGE_Y = 5;
export const STOOL_Y = 13;

/** Bakers standing behind a back-row diner step this far deeper so the diner's head clears their legs (D283). */
const BACKROW_BAKER_SHIFT = 17;
/** Half the parked vehicle's width in room units (it is drawn ~45 screen units wide at the door). */
export const VEHICLE_HALF_W = 24;
/** Half the sidewalk chalkboard's width (room units). */
export const SIGN_HALF_W = 15;

// ---------- the sidewalk (v5.11): a diner queue and patio tables left of the door, idle drivers right of it ----------
/** Depth of the standing queues: hugging the shop front, behind the walkers' lanes (−30 / −42) and the parked vehicle. */
export const QUEUE_Y = -9;
/** Depth of the patio tables (centre of the table; its chairs stand on the same line). */
export const PATIO_Y = -12;
/** A patio chair sits this far either side of its (small, round) table. */
export const PATIO_SEAT = 13;
/** Room units between neighbouring queue spots: a figure is ~25 wide, so a queue overlaps by under a quarter. */
export const QUEUE_PITCH = 19;
export const DRIVER_QUEUE_PITCH = 20;
/** Dining queue: the first spot is this far left of the door's left jamb; patio table A and B are these far left of it. */
const QUEUE_GAP = 27;
const PATIO_AT = [126, 213];
/** A queuing driver stands fully on screen: its centre stays this far inside the scene's right edge. */
const EDGE_MARGIN = 14;
/** Leftmost x the chalkboard may take: the sidewalk prop between it and the potted tree is only drawn while they stand > 56 apart. */
const PLANTER_X = (L: number) => Math.max(L + 8, unprojectX(20, -40));
const SIGN_PLANTER_SPAN = 58;

/** Narrowest oven bank (one column) the back wall must keep between the prep bench and the counter. */
export const MIN_OVEN_ZONE = 36;

type Pt = [number, number];

export interface DoorLanes {
  /** Outside, walk-ins pause left of the door and drivers right of it, so nobody stands on the mat. */
  guestPauseX: number;
  driverPauseX: number;
  /** Walk-ins use the left half of the doorway… */
  guestX: number;
  guestVia: Pt;
  /** …drivers the right half, past the swung-in door leaf. */
  driverX: number;
  driverVia: Pt;
}

export interface Layout {
  /** footprint index (0 = starter … 4 = flagship) */
  fp: number;
  L: number;
  R: number;
  prep: { x0: number; x1: number };
  cooks: number[];
  ovens: { x0: number; x1: number; z: number; h: number; chimney: boolean }[];
  ovenCols: { x0: number; x1: number }[];
  counter: { x0: number; x1: number };
  staff: number[];
  door: { x0: number; x1: number; cx: number; lanes: DoorLanes };
  /** Driver pickup spots along the counter front. */
  spots: { x: number; y: number }[];
  /** Where walk-in i orders (alternating front/back of a short queue). */
  orderSpots: Pt[];
  tables: { x: number; y: number }[];
  /** Bakers in front of the oven bank; the one nearest the counter keeps an upright pose. */
  bakers: { x: number; y: number; nearCounter: boolean }[];
  /** Window bar along the front glass, when the front row leaves room for it. */
  ledge: { x0: number; x1: number } | null;
  scooter: { x: number; y: number };
  /** The sidewalk chalkboard stands left of the parked vehicle. */
  sign: { x: number };
  /** Up to two patio tables on the sidewalk left of the queue (small umbrella tables; chairs at ±PATIO_SEAT). */
  patio: { x: number; y: number }[];
  /** Diner queue: up to four standing spots outside, left of the door, nearest the door first, facing right. */
  queue: Pt[];
  /** Idle drivers wait right of the door past the mat, facing left, nearest the door first (as many as stand fully on screen, up to 3). */
  driverQueue: Pt[];
  /** Where the "×N waiting" tag hangs: over the last driver spot. */
  waitTag: Pt;
}

export function layout(fp: number, ovenCount: number, cookCount: number, staffCount: number, tableCount: number, driverSlots: number, plants = 0): Layout {
  const RW = ROOM_W[fp];
  const L = 196.5 - RW / 2;
  const R = L + RW;
  const cw = 56 + 26 * (staffCount - 1);
  const counter = { x0: R - 60 - cw, x1: R - 60 };
  // the bench grows with the crew but always leaves at least MIN_OVEN_ZONE for the ovens before the counter
  const prepMax = counter.x0 - 16 - MIN_OVEN_ZONE;
  // a lone cook stands beside the bench's left end so the whole figure shows
  const prep = cookCount === 1 ? { x0: L + 22, x1: Math.min(prepMax, L + 22 + 54) } : { x0: L + 6, x1: Math.min(prepMax, L + 6 + 30 + cookCount * 24) };
  const cooks = cookCount === 1 ? [prep.x0 - 9] : Array.from({ length: cookCount }, (_, i) => prep.x0 + 10 + (i * (prep.x1 - prep.x0 - 20)) / Math.max(1, cookCount - 1));
  const staff = Array.from({ length: staffCount }, (_, i) => counter.x0 + 16 + i * 28);
  // Ovens along the back wall between prep and counter; stack two decks rather than squeeze them thin.
  const zone0 = prep.x1 + 8;
  const zone1 = counter.x0 - 8;
  const zone = zone1 - zone0;
  const singleW = (zone - (ovenCount - 1) * 6) / ovenCount;
  const decks = singleW >= 40 || ovenCount < 2 ? 1 : 2;
  const cols = Math.ceil(ovenCount / decks);
  const ow = Math.min(60, (zone - (cols - 1) * 6) / cols);
  const ovenCols = Array.from({ length: cols }, (_, c) => ({ x0: zone0 + c * (ow + 6), x1: zone0 + c * (ow + 6) + ow }));
  const ovens: Layout['ovens'] = [];
  // an incomplete top row of stacked decks is centred over the columns, not left-aligned (D321: 3 ovens looked lopsided)
  const topShift = decks === 2 ? ((cols - (ovenCount - cols)) * (ow + 6)) / 2 : 0;
  for (let i = 0; i < ovenCount; i++) {
    const c = i % cols;
    const deck = Math.floor(i / cols);
    if (decks === 1) ovens.push({ ...ovenCols[c], z: 0, h: 84, chimney: true });
    else {
      const dx = deck === 1 ? topShift : 0;
      ovens.push({ x0: ovenCols[c].x0 + dx, x1: ovenCols[c].x1 + dx, z: deck * 64, h: 60, chimney: deck === 1 || i + cols >= ovenCount });
    }
  }
  // A 46-wide entrance with two lanes, so walk-ins and drivers never walk through each other.
  const d0 = R - 58;
  const d1 = R - 12;
  const door = {
    x0: d0,
    x1: d1,
    cx: (d0 + d1) / 2,
    lanes: { guestPauseX: d0 - 6, driverPauseX: d1 + 4, guestX: d0 + 13, guestVia: [d0 + 16, COUNTER_AISLE_Y] as Pt, driverX: d1 - 6, driverVia: [d1 - 8, COUNTER_AISLE_Y] as Pt },
  };
  // Drivers pick up along the counter's left; walk-ins order at its right end, away from the pickup line.
  const spotCols = Math.max(1, Math.floor((counter.x1 - 46 - (counter.x0 + 12)) / 28) + 1);
  // v5.3 (D370/D377): drivers pick up at the counter's right end, nearest the door, so a driver leaving never walks
  // past the walk-in, who orders at the left end by the register
  const spots = Array.from({ length: Math.min(driverSlots, spotCols) }, (_, i) => ({ x: counter.x1 - 14 - i * 28, y: 46 }));
  // v5.0 (D336/D353): the walk-in waits beside the counter's right end, deeper than the drivers' exit lane, so a
  // driver leaving never walks across the waiting walk-in (the second spot is kept for older callers)
  // v5.3 (D377/D370/D372): in front of the counter's right end, left of the doorway, so neither the doorway's post
  // nor its PIZZERIA plank hides the walk-in, and clear of the driver's spot and his column at the door
  const orderSpots: Pt[] = [
    [counter.x0 + 4, 60],
    [counter.x1 + 4, 48],
  ];
  // Dining: two rows in front of the prep/oven area, clear of the left pilaster (and a floor plant).
  const t0 = L + 44 + (plants >= 1 ? 10 : 0);
  const frontCols = Math.max(1, Math.floor((counter.x1 - 30 - SEAT - t0) / TABLE_PITCH) + 1);
  // the back row starts right of the prep bench, so diners' heads never poke into it
  // …and its seats interleave with the front row's: each back seat falls midway between two front seats
  const b0raw = Math.max(t0 + SEAT, prep.x1 + 4 + SEAT);
  const backColsAt = (b: number) => Math.max(0, Math.floor((counter.x0 - 40 - SEAT - b) / TABLE_PITCH) + 1);
  const b0snap = t0 + SEAT + Math.ceil((b0raw - t0 - SEAT) / (2 * SEAT)) * (2 * SEAT);
  // C19: snap to the interleave grid only when no column is lost; otherwise keep the unsnapped start
  const b0 = backColsAt(b0snap) >= backColsAt(b0raw) ? b0snap : b0raw;
  const backCols = backColsAt(b0);
  const tables: Layout['tables'] = [];
  // fill the front row first, so a small dining room spreads out instead of stacking
  for (let f = 0; f < frontCols && tables.length < tableCount; f++) tables.push({ x: t0 + TABLE_PITCH * f, y: FRONT_ROW_Y });
  for (let b = 0; b < backCols && tables.length < tableCount; b++) tables.push({ x: b0 + TABLE_PITCH * b, y: BACK_ROW_Y });
  if (tables.length === 1) tables[0] = { x: (L + counter.x0) / 2, y: STARTER_Y };
  // Bakers stand in front of the oven bank, one per ~40 units, alternating depth.
  const bk0 = ovenCols[0].x0;
  const bk1 = ovenCols[ovenCols.length - 1].x1;
  const nb = Math.max(1, Math.min(3, Math.floor((bk1 - bk0) / 40)));
  const backRow = tables.filter((tb) => tb.y === BACK_ROW_Y);
  const bakers = Array.from({ length: nb }, (_, i) => {
    const x = Math.min(bk0 + ((bk1 - bk0) * (i + 0.5)) / nb, counter.x0 - 26);
    // D283: a back-row diner's head would cover this baker's shins and feet, so stand them deeper (feet above the head)
    const crowded = backRow.some((tb) => Math.abs(tb.x - x) < SEAT + 16);
    return { x, y: (i % 2 ? 60 : 72) + (crowded ? BACKROW_BAKER_SHIFT : 0), nearCounter: nb > 1 && i === nb - 1 };
  });
  // The window bar fills the front-right floor up to the door, until the front row of tables reaches it.
  const frontRowRight = Math.max(-Infinity, ...tables.filter((tb) => tb.y < STARTER_Y).map((tb) => tb.x + SEAT + 14));
  const lx0 = Math.max(counter.x0 + 4, frontRowRight);
  const lx1 = d0 - 12;
  const ledge = lx1 - lx0 > 30 ? { x0: lx0, x1: lx1 } : null;
  // v5.11: the diner queue stands left of the door, the patio left of the queue; the chalkboard stands between the two
  // patio tables (so a walk-in's way to a patio chair never crosses it), but never so near the tree that the sidewalk
  // prop between them (storefront) would be dropped
  const queue: Pt[] = Array.from({ length: 4 }, (_, i) => [d0 - QUEUE_GAP - QUEUE_PITCH * i, QUEUE_Y]);
  const patio = PATIO_AT.map((dx) => ({ x: d0 - dx, y: PATIO_Y }));
  const signX = Math.max(d0 - 169.5, PLANTER_X(L) + SIGN_PLANTER_SPAN);
  const xMax = unprojectX(SCENE_W - EDGE_MARGIN, QUEUE_Y);
  const dq0 = d1 + 19;
  const driverQueue: Pt[] = [];
  for (let j = 0; j < 3; j++) {
    const x = dq0 + DRIVER_QUEUE_PITCH * j;
    if (j === 0) driverQueue.push([Math.min(x, xMax), QUEUE_Y]);
    else if (x <= xMax) driverQueue.push([x, QUEUE_Y]);
  }
  const waitTag = driverQueue[driverQueue.length - 1];
  return { fp, L, R, prep, cooks, ovens, ovenCols, counter, staff, door, spots, orderSpots, tables, bakers, ledge, // D282: the vehicle parks well left of the walk-ins' turn-in (guestPauseX = d0 − 6)
    scooter: { x: d0 - 60, y: -30 }, sign: { x: signX }, patio, queue, driverQueue, waitTag };
}

/** Width of the "×N waiting" pill for its text. */
export const waitTagWidth = (n: number) => `×${n} waiting`.length * 5.8 + 14;
/** Where the pill's centre sits (screen), over the last waiting driver, kept inside the screen edges. */
export function waitTagAt(lay: Pick<Layout, 'waitTag'>, n: number): { x: number; y: number; w: number; tail: number } {
  const [sx, sy] = P(lay.waitTag[0], lay.waitTag[1], 74);
  const w = waitTagWidth(n);
  const x = Math.min(SCENE_W - 4 - w / 2, Math.max(4 + w / 2, sx));
  return { x, y: sy, w, tail: sx - x };
}
