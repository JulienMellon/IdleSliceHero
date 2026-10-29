// Pure scene geometry: where every station, table, lane and person stands for a given shop size.
// No React here, so it is unit-tested directly (src/components/scene/__tests__/layout.test.ts).

export const ROOM_W = [270, 295, 320, 340, 358];

/** Chairs sit ±SEAT from a table's centre; with a 78 pitch and a quarter-pitch back-row offset every seat interleaves. */
export const SEAT = 19.5;
/** Table pitch along a row. */
export const TABLE_PITCH = 78;
/** Depths (room y) of the dining rows. */
export const FRONT_ROW_Y = 6;
export const BACK_ROW_Y = 32;
/** A lone starter table sits mid-floor at this depth. */
export const STARTER_Y = 20;
/** Depths of the door threshold just inside and just outside the shop. */
export const DOOR_IN_Y = 8;
export const DOOR_OUT_Y = -24;
/** Depth of the walkway in front of the counter that people route through. */
export const COUNTER_AISLE_Y = 44;
/** Window bar and its stools sit along the front glass. */
export const LEDGE_Y = 5;
export const STOOL_Y = 13;

/** Narrowest oven bank (one column) the back wall must keep between the prep bench and the counter. */
export const MIN_OVEN_ZONE = 36;

type Pt = [number, number];

export interface DoorLanes {
  /** Walk-ins use the left half of the doorway… */
  guestX: number;
  guestVia: Pt;
  /** …drivers the right half, past the swung-in door leaf. */
  driverX: number;
  driverVia: Pt;
}

export interface Layout {
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
  for (let i = 0; i < ovenCount; i++) {
    const c = i % cols;
    const deck = Math.floor(i / cols);
    if (decks === 1) ovens.push({ ...ovenCols[c], z: 0, h: 84, chimney: true });
    else ovens.push({ ...ovenCols[c], z: deck * 64, h: 60, chimney: deck === 1 || i + cols >= ovenCount });
  }
  // A 46-wide entrance with two lanes, so walk-ins and drivers never walk through each other.
  const d0 = R - 58;
  const d1 = R - 12;
  const door = {
    x0: d0,
    x1: d1,
    cx: (d0 + d1) / 2,
    lanes: { guestX: d0 + 13, guestVia: [d0 + 16, COUNTER_AISLE_Y] as Pt, driverX: d1 - 6, driverVia: [d1 - 8, COUNTER_AISLE_Y] as Pt },
  };
  // Drivers pick up along the counter's left; walk-ins order at its right end, away from the pickup line.
  const spotCols = Math.max(1, Math.floor((counter.x1 - 46 - (counter.x0 + 12)) / 28) + 1);
  const spots = Array.from({ length: Math.min(driverSlots, spotCols) }, (_, i) => ({ x: counter.x0 + 12 + i * 28, y: 46 }));
  const orderSpots: Pt[] = [
    [counter.x1 - 4, 58],
    [counter.x1 + 4, 48],
  ];
  // Dining: two rows in front of the prep/oven area, clear of the left pilaster (and a floor plant).
  const t0 = L + 44 + (plants >= 1 ? 10 : 0);
  const frontCols = Math.max(1, Math.floor((counter.x1 - 30 - SEAT - t0) / TABLE_PITCH) + 1);
  // the back row starts right of the prep bench, so diners' heads never poke into it
  const b0 = Math.max(t0 + SEAT, prep.x1 + 4 + SEAT);
  const backCols = Math.max(0, Math.floor((counter.x0 - 40 - SEAT - b0) / TABLE_PITCH) + 1);
  const tables: Layout['tables'] = [];
  // fill the front row first, so a small dining room spreads out instead of stacking
  for (let f = 0; f < frontCols && tables.length < tableCount; f++) tables.push({ x: t0 + TABLE_PITCH * f, y: FRONT_ROW_Y });
  for (let b = 0; b < backCols && tables.length < tableCount; b++) tables.push({ x: b0 + TABLE_PITCH * b, y: BACK_ROW_Y });
  if (tables.length === 1) tables[0] = { x: (L + counter.x0) / 2, y: STARTER_Y };
  // Bakers stand in front of the oven bank, one per ~40 units, alternating depth.
  const bk0 = ovenCols[0].x0;
  const bk1 = ovenCols[ovenCols.length - 1].x1;
  const nb = Math.max(1, Math.min(3, Math.floor((bk1 - bk0) / 40)));
  const bakers = Array.from({ length: nb }, (_, i) => ({
    x: Math.min(bk0 + ((bk1 - bk0) * (i + 0.5)) / nb, counter.x0 - 26),
    y: i % 2 ? 60 : 72,
    nearCounter: nb > 1 && i === nb - 1,
  }));
  // The window bar fills the front-right floor up to the door, until the front row of tables reaches it.
  const frontRowRight = Math.max(-Infinity, ...tables.filter((tb) => tb.y < STARTER_Y).map((tb) => tb.x + SEAT + 14));
  const lx0 = Math.max(counter.x0 + 4, frontRowRight);
  const lx1 = d0 - 12;
  const ledge = lx1 - lx0 > 30 ? { x0: lx0, x1: lx1 } : null;
  return { L, R, prep, cooks, ovens, ovenCols, counter, staff, door, spots, orderSpots, tables, bakers, ledge, scooter: { x: d0 - 30, y: -30 } };
}
