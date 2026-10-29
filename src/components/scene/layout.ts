import { along } from './timelines';

// ---------- layout ----------
export const ROOM_W = [270, 295, 320, 340, 358];

export interface Layout {
  L: number;
  R: number;
  prep: { x0: number; x1: number };
  cooks: number[];
  ovens: { x0: number; x1: number; z: number; h: number; chimney: boolean }[];
  ovenCols: { x0: number; x1: number }[];
  counter: { x0: number; x1: number };
  staff: number[];
  door: { x0: number; x1: number; cx: number };
  spots: { x: number; y: number }[];
  tables: { x: number; y: number }[];
  scooter: { x: number; y: number };
}

export function layout(fp: number, ovenCount: number, cookCount: number, staffCount: number, tableCount: number, driverSlots: number, plants = 0): Layout {
  const RW = ROOM_W[fp];
  const L = 196.5 - RW / 2;
  const R = L + RW;
  // a lone cook stands beside the bench's left end so the whole figure shows (critic D216)
  const prep = cookCount === 1 ? { x0: L + 22, x1: L + 22 + 54 } : { x0: L + 6, x1: L + 6 + 30 + cookCount * 24 };
  const cooks = cookCount === 1 ? [prep.x0 - 9] : Array.from({ length: cookCount }, (_, i) => prep.x0 + 10 + (i * (prep.x1 - prep.x0 - 20)) / Math.max(1, cookCount - 1));
  const cw = 56 + 26 * (staffCount - 1);
  const counter = { x0: R - 60 - cw, x1: R - 60 };
  const staff = Array.from({ length: staffCount }, (_, i) => counter.x0 + 16 + i * 28);
  // Ovens along the back wall between prep and counter; stack two decks rather than squeeze (critic G43).
  const zone0 = prep.x1 + 8;
  const zone1 = counter.x0 - 8;
  const zone = Math.max(30, zone1 - zone0);
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
  // a 46-wide entrance: walk-ins use the left lane (x0 + 13), drivers the right (x1 − 11) (critic G62/D189)
  const door = { x0: R - 58, x1: R - 12, cx: R - 35 };
  // Counter front (critic G61/D179): drivers pick up on the left, walk-ins queue on the right, clear of the
  // door leaf. Pickup spots are ≥28 apart; drivers take turns at them rather than crowding.
  const spotCols = Math.max(1, Math.floor((counter.x1 - 46 - (counter.x0 + 12)) / 28) + 1);
  const spots = Array.from({ length: Math.min(driverSlots, spotCols) }, (_, i) => ({ x: counter.x0 + 12 + i * 28, y: 46 }));
  // Dining: tables in front of the prep/oven area, two rows, clear of the left pilaster (critic D180).
  const t0 = L + 44 + (plants >= 1 ? 10 : 0);
  // 78-unit pitch; the back row sits half a pitch over, and the front row runs on toward the counter (critic D188)
  const frontCols = Math.max(1, Math.floor((counter.x1 - 30 - SEAT - t0) / 78) + 1);
  // the back row starts right of the prep bench, so diners' heads never poke into it (critic D239)
  const b0 = Math.max(t0 + 19.5, prep.x1 + 12 + SEAT);
  const backCols = Math.max(0, Math.floor((counter.x0 - 40 - SEAT - b0) / 78) + 1);
  const tables: Layout['tables'] = [];
  // fill the front row first, so a small dining room spreads out instead of stacking (critic D199)
  for (let f = 0; f < frontCols && tables.length < tableCount; f++) tables.push({ x: t0 + 78 * f, y: 6 });
  for (let b = 0; b < backCols && tables.length < tableCount; b++) tables.push({ x: b0 + 78 * b, y: 40 });
  // a single starter table sits mid-floor so its diner fills the empty middle (critic D180)
  if (tables.length === 1) tables[0] = { x: (L + counter.x0) / 2, y: 20 };
  return { L, R, prep, cooks, ovens, ovenCols, counter, staff, door, spots, tables, scooter: { x: door.x0 - 30, y: -30 } };
}

/** Chairs sit ±SEAT from a table's centre; with a 78 pitch and a quarter-pitch back-row offset every seat interleaves (critic D188). */
export const SEAT = 19.5;
