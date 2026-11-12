// Pure scene geometry: where every station, table, lane and person stands for a given shop size.
// No React here, so it is unit-tested directly (src/components/scene/__tests__/scene.test.ts).
import { P, SC, SCENE_W, kAt, unprojectX } from './projection';

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

// ---------- the sidewalk (v5.11, re-planned in v5.12: D414, G90, D416; v5.13: D430, D431) ----------
// One lane of figures stands against the shop front, left of the door, nearest the door first: the idle drivers (always three
// spots, the first at x >= 250 on screen), a clear gap, then the hungry diners (up to four, the room left permitting), then the
// patio tables in what room is left. Everything is placed in SCREEN units from the door leftwards (so the spacing is the spacing the
// player sees) and turned back into room units for the cast. Nothing is placed right of the door: at the big footprints the door
// sits 30 pt from the screen edge, which is why x29 idle drivers used to show one figure.
/** How far (screen pt) a queue figure's feet stand in front of the shop front's base line (D430: they stood on the sill; v5.14: 6 still read as on it; the patio deck's back edge, room y −6, is the limit). */
export const FEET_IN = 7;
/** Depth of the standing queues: FEET_IN in front of the shop front, behind the walkers' lanes (-30 / -42) and the parked vehicle (-30). */
export const QUEUE_Y = -FEET_IN / (1.25 * SC);
/** Room units of depth per screen pt at the front (the projection drops 1.25 SC pt per unit of y). */
const PT_PER_Y = 1.25 * SC;
/** Depth of the patio tables (centre of the table; its chairs stand on the same line). */
export const PATIO_Y = -12;
/** A patio chair sits this far either side of its (small, round) table. */
export const PATIO_SEAT = 13;
/** Screen units between neighbouring diner spots (a figure is ~25 wide, so neighbours overlap by about a tenth). */
export const QUEUE_PITCH = 22;
/**
 * Drivers stand 30 apart (D430: at 22 their shoulders overlapped ~40%, at 26 their cap brims still met): a driver's silhouette is
 * about 29 wide with the brim, so neighbours overlap by well under the 15% budget.
 */
export const DRIVER_QUEUE_PITCH = 30;
/** Diner spots: at most four, the first this far (room units) left of the door's left jamb. */
export const QUEUE_SPOTS = 4;
export const QUEUE_FIRST = 18;
/** Idle drivers: three spots (D430: four was a wall of caps), the first at QUEUE_FIRST left of the door's jamb, nearest the door; the pill counts the rest. */
export const DRIVER_SPOTS = 3;
/** Each driver stands this many screen pt lower than the first row (0 = QUEUE_Y itself): ±3 around the mean, in no alternating "fence" order (D430). */
export const DRIVER_DROP_PT = [0, 6, 3] as const;
/** The drivers' nearest spot is never left of this screen x, so the group reads as standing at the door (D431). */
export const DRIVER_NEAR_X = 250;
/** Clear screen space between the last driver and the first diner: two groups, not one crowd (D431). */
export const GROUP_GAP = 30;
/** The fewest diners kept in the lane to make room for a patio set (the rest show in the "+N" pill); where that is not enough room there is no patio. */
const MIN_DINERS_FOR_PATIO = 3;
/** Half a standing figure's width on screen (box: ±11 at k = depth scale × 1.14). */
export const FIGURE_HALF_W = 12.5;
/** Heights (z) the pills hang at over the feet: the drivers' above the "+N" of the diner queue. */
export const WAIT_TAG_Z = 84;
export const MORE_TAG_Z = 66;
/**
 * D450: the "N waiting" pill (no diner figure fits the lane, so nobody stands under it) hangs this low, so its top clears the drivers' pill's
 * body by MORE_TAG_GAP (and the pill is moved left of the drivers, so it clears that pill's tail too). The drivers' pill cannot go up (z 90 covers
 * the face of the driver at the pickup spot: D439) and this one cannot go lower (z 54 covers the faces of the diners seated behind the glass),
 * so 59 is the one height that gives both. The "+N" over a standing diner keeps MORE_TAG_Z: it must stay above that head.
 */
export const MORE_TAG_Z_ALONE = 59;
export const MORE_TAG_GAP = 6;
/** The depth the sidewalk's pills are sorted at (D450): in front of every patio part (`patioSortYs`) and the queue, behind the parked vehicle (y -30) and the chalkboard (SIGN_Y). */
export const PILL_LAYER_Y = PATIO_Y - 8;
/** The "N waiting" pill keeps this far (screen pt) left of the nearest idle driver's silhouette (his cap's brim reaches 15.5 right of him; the body 10 left). */
export const MORE_TAG_DRIVER_AIR = 13;
/**
 * Half the width of a dining table's set on screen-room units: the table top (±14), the chairs and the diners in them (SEAT + 11 each way).
 * The glass shop front shows the front rows through it, so a queue figure standing in front of one covers a seated diner or the table (D430).
 */
export const TABLE_SET_HALF = SEAT + 11;
/** Tables at this depth or nearer the sill sit behind the sidewalk queue's heads; the back row is clear above them. */
export const NEAR_ROW_Y = 24;
/** Half the width of a patio set on screen: the chairs reach ±26.5 at table scale (×1.1 at that depth), the umbrella ±24. */
export const PATIO_HALF_W = 30;
/** Clear space (screen) kept between the patio set and the wall's left pilaster / the nearest diner. */
const PATIO_AIR = 2;
/** The pilaster's right edge, in room units left of which the wall's brick stands (FrontWall draws L − 6 … L + 8). */
export const PILASTER_RIGHT = 8;
/** The potted tree's depth and where it stands: fully on screen (its pot is ~14 wide), at the left. */
export const TREE_Y = -40;
const PLANTER_X = (L: number) => Math.max(L + 8, unprojectX(20, TREE_Y));
/** Depths of the neighbourhood's signature prop and of the chalkboard, and the screen half-widths the packing keeps free for them (the widest prop is the bike rack's ±33). */
export const PROP_Y = -36;
export const SIGN_Y = -34;
export const PROP_HALF_W = 33;
export const TREE_HALF_W = 14;
const SIGN_SCREEN_HALF_W = 16;
const VEHICLE_SCREEN_HALF_W = 25;
/** The second vehicle parks this far (room units) left of the first (ladder.ts). */
export const SECOND_VEHICLE_SHIFT = 24;
/** A patio guest walks straight up to the right-hand chair from the curb lane; nothing stands within this of that line. */
export const CHAIR_WAY_HALF_W = 9;
const PROP_AIR = 3;

/** Height of one oven by how many decks the bank stacks (1 to 4): the deeper the stack, the shorter each deck, so a bank never grows taller than ~150 (the hood on top of it stays under the chip row). */
const DECK_H = [84, 60, 46, 34];
/** The narrowest an oven is ever drawn: its glowing window stays a readable fire (D417; was 30, which let the bank shrink to 32 pt capsules at Lv 20 / 40). */
export const MIN_OVEN_W = 44;
/**
 * The oven bay (D417): each footprint reserves a fixed stretch of back wall for its ovens, at least BAY_COL_MIN per column, measured from the
 * counter's widest end (two cashiers). The ovens fill the bay whatever the prep bench and the counter are doing, so a second cook or a
 * second cashier can never squeeze them: the bench is what gives way (it is clipped at the bay's left edge).
 */
export const BAY_COL_MIN = 52;
export const OVEN_BAY = [
  { cols: 1, w: 52 },
  { cols: 1, w: 60 },
  { cols: 1, w: 60 },
  { cols: 2, w: 110 },
  { cols: 2, w: 118 },
] as const;
/** A counter is 56 wide with one cashier and this much wider for each further one. */
export const COUNTER_STAFF_STEP = 26;
/** The gap between the bay and the bench / the counter. */
const BAY_AIR = 8;

type OvenPlan = { decks: number; cols: number; ow: number; sum: number };
const planFit = (zone: number, n: number, d: number): OvenPlan => {
  const cols = Math.ceil(n / d);
  const ow = Math.min(60, (zone - (cols - 1) * 6) / cols);
  return { decks: Math.ceil(n / cols), cols, ow, sum: n * ow };
};
const planChains = new Map<number, OvenPlan[]>();
const MAX_OVENS = 6;

/**
 * How a bank of `n` ovens fills a zone `zone` wide (D417). The ladder must read as better at every step, so the total width of
 * all the ovens (their widths added up) never shrinks from n − 1 to n: the old rule squeezed every oven narrower as the bank
 * grew (2 big glowing decks at Lv 10, 2 narrower at Lv 20, 3 dark capsules at Lv 40). Each oven is at most 60 wide and at least
 * MIN_OVEN_W, a bank is at most four decks high, and among the plans whose total only ever grows the cheapest one wins (fewest
 * decks, then widest ovens). The plan for all six possible counts is found together (a small DP), so an early step never
 * boxes in a later one; it is cached per zone width.
 */
export function ovenPlan(zone: number, n: number): OvenPlan {
  const count = Math.max(1, Math.round(n));
  const key = Math.round(zone * 100);
  let chain = planChains.get(key);
  if (!chain) {
    const opts: OvenPlan[][] = [];
    for (let m = 1; m <= MAX_OVENS; m++) {
      const all = m === 1 ? [{ decks: 1, cols: 1, ow: Math.min(60, zone), sum: Math.min(60, zone) }] : [1, 2, 3, 4].map((d) => planFit(zone, m, d));
      const ok = all.filter((o) => m === 1 || o.ow >= MIN_OVEN_W);
      opts.push(ok.length ? ok : all);
    }
    const cost = (o: OvenPlan) => o.decks * 100 - o.ow;
    const dp = opts.map((os) => os.map(() => ({ c: Infinity, from: -1 })));
    opts[0].forEach((o, i) => (dp[0][i] = { c: cost(o), from: -1 }));
    for (let m = 1; m < MAX_OVENS; m++)
      opts[m].forEach((o, i) => {
        opts[m - 1].forEach((p, j) => {
          if (p.sum <= o.sum + 1e-9 && dp[m - 1][j].c + cost(o) < dp[m][i].c) dp[m][i] = { c: dp[m - 1][j].c + cost(o), from: j };
        });
      });
    const last = dp[MAX_OVENS - 1].reduce((bi, x, i, arr) => (x.c < arr[bi].c ? i : bi), 0);
    if (Number.isFinite(dp[MAX_OVENS - 1][last].c)) {
      chain = [];
      for (let m = MAX_OVENS - 1, i = last; m >= 0; i = dp[m][i].from, m--) chain[m] = opts[m][i];
    } else {
      // no plan keeps the total growing (cannot happen at the zones the footprints produce): the widest total at each count
      chain = opts.map((os) => os.reduce((a, b) => (b.sum > a.sum + 1e-9 ? b : a)));
    }
    planChains.set(key, chain);
  }
  return chain[Math.min(count, MAX_OVENS) - 1];
}


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
  /** `chimney`: the topmost oven of its column (drawn as the dome); `stacked`: the bank is more than one deck high (it carries a hood instead of per-oven chimneys). */
  ovens: { x0: number; x1: number; z: number; h: number; chimney: boolean; stacked: boolean }[];
  /** The reserved oven bay on the back wall (D417). */
  bay: { x0: number; x1: number };
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
  /** The sidewalk chalkboard (room x at depth SIGN_Y): clear of the tree, the prop, the vehicle and the patio guests' way. */
  sign: { x: number };
  /** The neighbourhood's signature sidewalk prop (room x at depth PROP_Y); always drawn. */
  prop: { x: number };
  /** Up to two patio tables on the sidewalk, right of the left pilaster and left of the drivers: only as many whole sets as fit (0 on the narrowest shops). */
  patio: { x: number; y: number }[];
  /** Diner queue: up to four standing spots outside, left of the idle drivers (GROUP_GAP clear of the last), nearest the door first, facing right; none past the wall's left pilaster, and none in front of a table set (D430: the rest show in the "+N" pill). */
  queue: Pt[];
  /** Where the "+N" pill hangs: over the last diner, or, with no diner figures, over the first spot the diners would take. */
  queueTag: Pt;
  /** Idle drivers wait in the same lane, nearest the door (the first at x >= DRIVER_NEAR_X), facing the door, each at its own height (DRIVER_DROP_PT): always DRIVER_SPOTS spots. */
  driverQueue: Pt[];
  /** Where the "N drivers idle" tag hangs: over the middle of the driver group. */
  waitTag: Pt;
  /** The pill's left edge never goes left of this screen x: the back row's seated faces end here (D439: the long pill grazed the walk-in at the right-hand back table). */
  tagLeft: number;
}

export function layout(fp: number, ovenCount: number, cookCount: number, staffCount: number, tableCount: number, driverSlots: number, plants = 0): Layout {
  const RW = ROOM_W[fp];
  const L = 196.5 - RW / 2;
  const R = L + RW;
  const cw = 56 + COUNTER_STAFF_STEP * (staffCount - 1);
  const counter = { x0: R - 60 - cw, x1: R - 60 };
  // the oven bay is fixed per footprint, from the counter's widest end (D417); the bench grows toward it and stops at its edge
  const bayDef = OVEN_BAY[Math.max(0, Math.min(OVEN_BAY.length - 1, fp))];
  const bay = { x1: R - 60 - (56 + COUNTER_STAFF_STEP) - BAY_AIR, x0: 0 };
  bay.x0 = bay.x1 - bayDef.w;
  const prepMax = bay.x0 - BAY_AIR;
  // a lone cook stands beside the bench's left end so the whole figure shows
  const prep = cookCount === 1 ? { x0: L + 22, x1: Math.min(prepMax, L + 22 + 54) } : { x0: L + 6, x1: Math.min(prepMax, L + 6 + 30 + cookCount * 24) };
  const cooks = cookCount === 1 ? [prep.x0 - 9] : Array.from({ length: cookCount }, (_, i) => prep.x0 + 10 + (i * (prep.x1 - prep.x0 - 20)) / Math.max(1, cookCount - 1));
  const staff = Array.from({ length: staffCount }, (_, i) => counter.x0 + 16 + i * 28);
  // Ovens along the back wall in the bay; stack decks rather than squeeze them thin.
  const zone0 = bay.x0;
  const zone1 = bay.x1;
  const zone = zone1 - zone0;
  const { decks, cols, ow } = ovenPlan(zone, ovenCount);
  // the bank sits in the middle of its bay, so a bank of fewer columns than the bay holds is balanced between the bench and the counter
  const bankX0 = zone0 + (zone - (cols * ow + (cols - 1) * 6)) / 2;
  const ovenCols = Array.from({ length: cols }, (_, c) => ({ x0: bankX0 + c * (ow + 6), x1: bankX0 + c * (ow + 6) + ow }));
  const ovens: Layout['ovens'] = [];
  // an incomplete top row of stacked decks is centred over the columns, not left-aligned (D321: 3 ovens looked lopsided)
  const topCount = ovenCount - cols * (decks - 1);
  const topShift = decks > 1 ? ((cols - topCount) * (ow + 6)) / 2 : 0;
  const deckH = DECK_H[decks - 1];
  for (let i = 0; i < ovenCount; i++) {
    const c = i % cols;
    const deck = Math.floor(i / cols);
    if (decks === 1) ovens.push({ ...ovenCols[c], z: 0, h: deckH, chimney: true, stacked: false });
    else {
      const dx = deck === decks - 1 ? topShift : 0;
      ovens.push({ x0: ovenCols[c].x0 + dx, x1: ovenCols[c].x1 + dx, z: deck * (deckH + 4), h: deckH, chimney: deck === decks - 1 || i + cols >= ovenCount, stacked: true });
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
  // v5.13: the sidewalk lane, in screen units from the door leftwards: the drivers first (they wait at the door), a gap, then the diners
  const sxQ = (x: number, y = QUEUE_Y) => P(x, y)[0];
  const q0 = sxQ(d0 - QUEUE_FIRST);
  // each driver at its own height (D430), turned back into room units at that height so the screen spacing is exact
  const driverQueue: Pt[] = Array.from({ length: DRIVER_SPOTS }, (_, j) => {
    const y = QUEUE_Y - DRIVER_DROP_PT[j % DRIVER_DROP_PT.length] / PT_PER_Y;
    return [unprojectX(q0 - DRIVER_QUEUE_PITCH * j, y), y] as Pt;
  });
  const dq0 = q0;
  const lastDriver = q0 - DRIVER_QUEUE_PITCH * (DRIVER_SPOTS - 1);
  // the lane ends at the wall's left pilaster; a patio set needs a whole 2 × PATIO_HALF_W of it
  const laneLeft = sxQ(L + PILASTER_RIGHT, 0) + PATIO_AIR;
  const setSpan = 2 * PATIO_HALF_W + PATIO_AIR;
  const setsLeft = (rightEdge: number) => Math.max(0, Math.min(2, Math.floor((rightEdge - laneLeft + PATIO_AIR) / setSpan)));
  const dinerX = (i: number) => lastDriver - GROUP_GAP - QUEUE_PITCH * i;
  // the sets the glass front shows nearest the sill: a diner standing in front of one would cover its table or a seated diner
  const sets = tables.filter((tb) => tb.y <= NEAR_ROW_Y).map((tb): [number, number] => {
    const c = sxQ(tb.x, tb.y);
    const h = TABLE_SET_HALF * kAt(tb.y) * 1.1;
    return [c - h, c + h];
  });
  const dinerClear = (x: number) => sets.every(([a, b]) => x + FIGURE_HALF_W <= a || x - FIGURE_HALF_W >= b);
  let nDiners = 0;
  while (nDiners < QUEUE_SPOTS && dinerX(nDiners) - FIGURE_HALF_W >= laneLeft && dinerClear(dinerX(nDiners))) nDiners++;
  // a patio set takes the room left of the diners: give up diners (down to a couple) rather than the patio when that is what makes it fit
  if (nDiners > 0 && setsLeft(dinerX(nDiners - 1) - FIGURE_HALF_W - PATIO_AIR) === 0)
    for (let n = nDiners - 1; n >= Math.min(nDiners, MIN_DINERS_FOR_PATIO); n--)
      if (setsLeft(dinerX(n - 1) - FIGURE_HALF_W - PATIO_AIR) > 0) {
        nDiners = n;
        break;
      }
  const queue: Pt[] = Array.from({ length: nDiners }, (_, i) => [unprojectX(dinerX(i), QUEUE_Y), QUEUE_Y] as Pt);
  const queueTag: Pt = queue[nDiners - 1] ?? ([unprojectX(dinerX(0), QUEUE_Y), QUEUE_Y] as Pt);
  // the patio takes the room between the left pilaster and the last diner (or driver): whole sets only, nearest the diners first, none straddling the wall line
  const patioRight = (nDiners ? dinerX(nDiners - 1) - FIGURE_HALF_W : lastDriver - FIGURE_HALF_W) - PATIO_AIR;
  const centreLo = laneLeft + PATIO_HALF_W;
  const patio: Layout['patio'] = [];
  for (let c = patioRight - PATIO_HALF_W; patio.length < 2 && c >= centreLo - 1e-6; c -= 2 * PATIO_HALF_W + PATIO_AIR) patio.push({ x: unprojectX(c, PATIO_Y), y: PATIO_Y });
  // the tag hangs over the driver group's middle
  const waitTag: Pt = [unprojectX(dq0 - (DRIVER_QUEUE_PITCH * (DRIVER_SPOTS - 1)) / 2, QUEUE_Y), QUEUE_Y];
  // the pill's body is ~84 up from the feet, level with the back row's seated faces: it keeps right of the right-most seat (a diner's head is ±8 wide)
  const tagLeft = Math.max(0, ...tables.filter((tb) => tb.y >= BACK_ROW_Y).map((tb) => sxQ(tb.x + SEAT, tb.y) + 8 * kAt(tb.y) * 1.14 + 3));
  // the sidewalk's props stand in the front row of the sidewalk (−34 … −40): the potted tree is fixed, then the neighbourhood's signature
  // prop and the chalkboard take the first room that is clear of the tree, of the patio guests' way to their chairs and of the parked vehicle
  const scooter = { x: d0 - 60, y: -30 };
  const treeX = sxQ(PLANTER_X(L), TREE_Y);
  const patioWayOf = (t: { x: number; y: number }): [number, number] => {
    const cx = sxQ(t.x + PATIO_SEAT, PATIO_Y);
    return [cx - CHAIR_WAY_HALF_W, cx + CHAIR_WAY_HALF_W];
  };
  const vehicleX = sxQ(scooter.x, scooter.y);
  const vehicle1: [number, number] = [vehicleX - VEHICLE_SCREEN_HALF_W, vehicleX + VEHICLE_SCREEN_HALF_W];
  // the second vehicle the drivers' Lv 30 step adds parks nose to tail on the left of the first (ladder.ts `vehicle2`); where the sidewalk has room it is kept clear
  // always, so the board and the prop never move when the step arrives (D432: the yellow scooter clipped the sandwich board). The starter shop has no room for both.
  const vehicle2: [number, number] = [sxQ(scooter.x - SECOND_VEHICLE_SHIFT, scooter.y) - VEHICLE_SCREEN_HALF_W, vehicle1[1]];
  const treeIv: [number, number] = [treeX - TREE_HALF_W, treeX + TREE_HALF_W];
  const pack = (vehicle: [number, number], ways: [number, number][]) => {
    const taken: [number, number][] = [treeIv, vehicle, ...ways];
    const free = (half: number) => {
      let c = treeX + TREE_HALF_W + PROP_AIR + half;
      for (let guard = 0; guard < 8; guard++) {
        const hit = taken.find(([a, b]) => c + half > a - PROP_AIR && c - half < b + PROP_AIR);
        if (!hit) break;
        c = hit[1] + PROP_AIR + half;
      }
      taken.push([c - half, c + half]);
      return c;
    };
    const prop = free(PROP_HALF_W);
    const sign = free(SIGN_SCREEN_HALF_W);
    return { prop, sign };
  };
  const fits = (pk: { prop: number; sign: number }) => pk.prop + PROP_HALF_W + PROP_AIR <= vehicle1[0] && pk.sign + SIGN_SCREEN_HALF_W + PROP_AIR <= vehicle1[0];
  const packFor = (ways: [number, number][]) => {
    const wide = pack(vehicle2, ways);
    if (fits(wide)) return wide;
    return pack(vehicle1, ways);
  };
  // a patio set only stays where the chalkboard and the signature prop still fit clear of the vehicle (D428: the sets the lane makes room for must not push them under it); the outermost set goes first
  let nPatio = patio.length;
  let packed = packFor(patio.slice(0, nPatio).map(patioWayOf));
  while (nPatio > 0 && !fits(packed)) {
    nPatio--;
    packed = packFor(patio.slice(0, nPatio).map(patioWayOf));
  }
  patio.length = nPatio;
  const propX = unprojectX(packed.prop, PROP_Y);
  const signX = unprojectX(packed.sign, SIGN_Y);
  return { fp, L, R, prep, cooks, ovens, bay: { x0: bay.x0, x1: bay.x1 }, ovenCols, counter, staff, door, spots, orderSpots, tables, bakers, ledge, // D282: the vehicle parks well left of the walk-ins' turn-in (guestPauseX = d0 − 6)
    scooter, sign: { x: signX }, prop: { x: propX }, patio, queue, queueTag, driverQueue, waitTag, tagLeft };
}

/** The pills keep this far (screen) from the screen edge (D420: the "×11 waiting" pill used to end 3 pt from it). */
export const TAG_MARGIN = 12;
/** Width of a pill for its text (10 pt bold: ~5.8 per character plus the padding). */
export const waitTagWidth = (text: string) => text.length * 5.8 + 14;
/** Where the pill's centre sits (screen), over the idle drivers' group, kept TAG_MARGIN inside the screen edges. */
export function waitTagAt(lay: Pick<Layout, 'waitTag' | 'tagLeft'>, text: string): { x: number; y: number; w: number; tail: number } {
  const [sx, sy] = P(lay.waitTag[0], lay.waitTag[1], WAIT_TAG_Z);
  const w = waitTagWidth(text);
  const x = Math.min(SCENE_W - TAG_MARGIN - w / 2, Math.max(TAG_MARGIN + w / 2, lay.tagLeft + w / 2, sx));
  return { x, y: sy, w, tail: sx - x };
}
/** The chin-to-eye-line band of a diner seated at a table's chair (screen units): what a pill hung there would cover. */
function seatedFace(tb: { x: number; y: number }, dx: number) {
  const [sx, sy] = P(tb.x + dx, tb.y);
  const k = kAt(tb.y) * 1.14;
  return { x0: sx - 7 * k, x1: sx + 7 * k, y0: sy - 31 * k, y1: sy - 22 * k };
}

/**
 * The "+N" pill over the last diner: higher than that figure's head and lower than the drivers' pill, so the two never meet. With no diner figure
 * (`lay.queue` is empty) it reads "N waiting" instead: it hangs MORE_TAG_Z_ALONE (a full MORE_TAG_GAP under the drivers' pill's body), moves left
 * until it clears the nearest idle driver and then, if it can, until it covers no seated diner's face behind the glass (D450).
 * storefront.tsx draws both pills on the layer above the patio's umbrellas.
 */
export function moreTagAt(lay: Pick<Layout, 'queueTag' | 'queue' | 'driverQueue' | 'tables'>, text: string): { x: number; y: number; w: number } {
  const alone = lay.queue.length === 0;
  const [sx, sy] = P(lay.queueTag[0], lay.queueTag[1], alone ? MORE_TAG_Z_ALONE : MORE_TAG_Z);
  const w = waitTagWidth(text);
  const lo = TAG_MARGIN + w / 2;
  const hi = SCENE_W - TAG_MARGIN - w / 2;
  if (!alone) return { x: Math.min(hi, Math.max(lo, sx)), y: sy, w };
  const driverX = P(...lay.driverQueue[lay.driverQueue.length - 1])[0];
  const start = Math.min(hi, Math.max(lo, Math.min(sx, driverX - MORE_TAG_DRIVER_AIR - w / 2)));
  const faces = lay.tables.flatMap((tb) => [seatedFace(tb, -SEAT), seatedFace(tb, SEAT)]);
  const clear = (x: number) => faces.every((f) => x + w / 2 <= f.x0 || x - w / 2 >= f.x1 || sy + 8.7 <= f.y0 || sy - 9.7 >= f.y1);
  for (let x = start; x >= lo; x -= 2) if (clear(x)) return { x, y: sy, w };
  return { x: start, y: sy, w };
}

/** What a pill covers on screen, tail included (the pill is 17 tall from 9 above its anchor; the tail reaches 12 below it). */
const pillRect = (x: number, y: number, w: number) => ({ x0: x - w / 2, x1: x + w / 2, y0: y - 9 - 0.7, y1: y + 12 + 0.7 });
/** The drivers' "N drivers idle · buy …" pill's screen rect (G91: pops keep off it, so the station it names is never covered). */
export function waitTagRect(lay: Pick<Layout, 'waitTag' | 'tagLeft'>, text: string) {
  const t = waitTagAt(lay, text);
  return pillRect(t.x, t.y, t.w);
}
/** The "+N" pill's screen rect. */
export function moreTagRect(lay: Pick<Layout, 'queueTag' | 'queue' | 'driverQueue' | 'tables'>, text: string) {
  const t = moreTagAt(lay, text);
  return pillRect(t.x, t.y, t.w);
}
