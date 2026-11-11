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

// ---------- the sidewalk (v5.11, re-planned in v5.12: D414, G90, D416) ----------
// One lane of figures stands against the shop front, left of the door, nearest the door first: the hungry diners (up to
// four, never left of QUEUE_MIN_X on screen), then the idle drivers (always four spots), then the patio tables in what
// room is left. Everything is placed in SCREEN units from the door leftwards (so the spacing is the spacing the player
// sees) and turned back into room units for the cast. Nothing is placed right of the door: at the big footprints the
// door sits 30 pt from the screen edge, which is why ×29 idle drivers used to show one figure.
/** Depth of the standing queues: against the shop front, behind the walkers' lanes (−30 / −42) and the parked vehicle (−30). */
export const QUEUE_Y = -3;
/** Depth of the patio tables (centre of the table; its chairs stand on the same line). */
export const PATIO_Y = -12;
/** A patio chair sits this far either side of its (small, round) table. */
export const PATIO_SEAT = 13;
/** Screen units between neighbouring queue spots (a figure is ~25 wide, so neighbours overlap by about a tenth). */
export const QUEUE_PITCH = 22;
export const DRIVER_QUEUE_PITCH = 22;
/** Diner spots: at most four, the first this far (room units) left of the door's left jamb, none left of this screen x. */
export const QUEUE_SPOTS = 4;
export const QUEUE_FIRST = 18;
export const QUEUE_MIN_X = 200;
/** Idle drivers: four spots, the first one pitch plus a hair left of the last diner spot. */
export const DRIVER_SPOTS = 4;
/** Alternate drivers stand this much deeper (room units). */
const DRIVER_STAGGER = 5;
/** Half a standing figure's width on screen (box: ±11 at k = depth scale × 1.14). */
export const FIGURE_HALF_W = 12.5;
/** Heights (z) the pills hang at over the feet: the drivers' above the "+N" of the diner queue. */
export const WAIT_TAG_Z = 96;
export const MORE_TAG_Z = 68;
/** Gap (screen) between the last diner spot and the first driver spot, beyond the pitch. */
const DRIVER_GAP = 0;
/** Half the width of a patio set on screen: the chairs reach ±26.5 at table scale (×1.1 at that depth), the umbrella ±24. */
export const PATIO_HALF_W = 30;
/** Clear space (screen) kept between the patio set and the wall's left pilaster / the nearest driver. */
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
/** A patio guest walks straight up to the right-hand chair from the curb lane; nothing stands within this of that line. */
export const CHAIR_WAY_HALF_W = 9;
const PROP_AIR = 3;

/** Height of one oven by how many decks the bank stacks (1 to 4): the deeper the stack, the shorter each deck, so a bank never grows taller than ~150 (the hood on top of it stays under the chip row). */
const DECK_H = [84, 60, 46, 34];
/** The narrowest an oven is ever drawn: its glowing window (74% of the width) stays a readable fire (D417). */
export const MIN_OVEN_W = 30;

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
  /** The sidewalk chalkboard (room x at depth SIGN_Y): clear of the tree, the prop, the vehicle and the patio guests' way. */
  sign: { x: number };
  /** The neighbourhood's signature sidewalk prop (room x at depth PROP_Y); always drawn. */
  prop: { x: number };
  /** Up to two patio tables on the sidewalk, right of the left pilaster and left of the drivers: only as many whole sets as fit (0 on the narrowest shops). */
  patio: { x: number; y: number }[];
  /** Diner queue: up to four standing spots outside, left of the door, nearest the door first, facing right; none left of QUEUE_MIN_X on screen. */
  queue: Pt[];
  /** Idle drivers wait in the same lane, left of the diners, facing the door, in two alternating depths: always DRIVER_SPOTS spots. */
  driverQueue: Pt[];
  /** Where the "N drivers idle" tag hangs: over the middle of the driver group. */
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
  const { decks, cols, ow } = ovenPlan(zone, ovenCount);
  const ovenCols = Array.from({ length: cols }, (_, c) => ({ x0: zone0 + c * (ow + 6), x1: zone0 + c * (ow + 6) + ow }));
  const ovens: Layout['ovens'] = [];
  // an incomplete top row of stacked decks is centred over the columns, not left-aligned (D321: 3 ovens looked lopsided)
  const topCount = ovenCount - cols * (decks - 1);
  const topShift = decks > 1 ? ((cols - topCount) * (ow + 6)) / 2 : 0;
  const deckH = DECK_H[decks - 1];
  for (let i = 0; i < ovenCount; i++) {
    const c = i % cols;
    const deck = Math.floor(i / cols);
    if (decks === 1) ovens.push({ ...ovenCols[c], z: 0, h: deckH, chimney: true });
    else {
      const dx = deck === decks - 1 ? topShift : 0;
      ovens.push({ x0: ovenCols[c].x0 + dx, x1: ovenCols[c].x1 + dx, z: deck * (deckH + 4), h: deckH, chimney: deck === decks - 1 || i + cols >= ovenCount });
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
  // v5.12: the sidewalk lane, in screen units from the door leftwards (see the constants above)
  const sxQ = (x: number, y = QUEUE_Y) => P(x, y)[0];
  const q0 = sxQ(d0 - QUEUE_FIRST);
  const queue: Pt[] = [];
  for (let i = 0; i < QUEUE_SPOTS; i++) {
    const sx = q0 - QUEUE_PITCH * i;
    if (sx < QUEUE_MIN_X) break;
    queue.push([unprojectX(sx, QUEUE_Y), QUEUE_Y]);
  }
  const dq0 = q0 - QUEUE_PITCH * (queue.length - 1) - DRIVER_QUEUE_PITCH - DRIVER_GAP;
  // the drivers alternate between two depths (3 units apart is ~4 pt on screen) so their shoulders do not line up like a fence
  const driverQueue: Pt[] = Array.from({ length: DRIVER_SPOTS }, (_, j) => {
    const y = QUEUE_Y - (j % 2 ? DRIVER_STAGGER : 0);
    return [unprojectX(dq0 - DRIVER_QUEUE_PITCH * j, y), y] as Pt;
  });
  // the patio takes the room between the left pilaster and the last driver: whole sets only, nearest the drivers first, none straddling the wall line
  const driversLeft = dq0 - DRIVER_QUEUE_PITCH * (DRIVER_SPOTS - 1) - FIGURE_HALF_W;
  const centreLo = sxQ(L + PILASTER_RIGHT, 0) + PATIO_AIR + PATIO_HALF_W;
  const patio: Layout['patio'] = [];
  for (let c = driversLeft - PATIO_AIR - PATIO_HALF_W; patio.length < 2 && c >= centreLo - 1e-6; c -= 2 * PATIO_HALF_W + PATIO_AIR) patio.push({ x: unprojectX(c, PATIO_Y), y: PATIO_Y });
  // the tag hangs over the driver group's middle
  const waitTag: Pt = [unprojectX(dq0 - (DRIVER_QUEUE_PITCH * (DRIVER_SPOTS - 1)) / 2, QUEUE_Y), QUEUE_Y];
  // the sidewalk's props stand in the front row of the sidewalk (−34 … −40): the potted tree is fixed, then the neighbourhood's signature
  // prop and the chalkboard take the first room that is clear of the tree, of the patio guests' way to their chairs and of the parked vehicle
  const scooter = { x: d0 - 60, y: -30 };
  const treeX = sxQ(PLANTER_X(L), TREE_Y);
  const taken: [number, number][] = [
    [treeX - TREE_HALF_W, treeX + TREE_HALF_W],
    [sxQ(scooter.x, scooter.y) - VEHICLE_SCREEN_HALF_W, sxQ(scooter.x, scooter.y) + VEHICLE_SCREEN_HALF_W],
    ...patio.map((t): [number, number] => {
      const cx = sxQ(t.x + PATIO_SEAT, PATIO_Y);
      return [cx - CHAIR_WAY_HALF_W, cx + CHAIR_WAY_HALF_W];
    }),
  ];
  const free = (half: number, y: number) => {
    let c = treeX + TREE_HALF_W + PROP_AIR + half;
    for (let guard = 0; guard < 8; guard++) {
      const hit = taken.find(([a, b]) => c + half > a - PROP_AIR && c - half < b + PROP_AIR);
      if (!hit) break;
      c = hit[1] + PROP_AIR + half;
    }
    taken.push([c - half, c + half]);
    return unprojectX(c, y);
  };
  const propX = free(PROP_HALF_W, PROP_Y);
  const signX = free(SIGN_SCREEN_HALF_W, SIGN_Y);
  return { fp, L, R, prep, cooks, ovens, ovenCols, counter, staff, door, spots, orderSpots, tables, bakers, ledge, // D282: the vehicle parks well left of the walk-ins' turn-in (guestPauseX = d0 − 6)
    scooter, sign: { x: signX }, prop: { x: propX }, patio, queue, driverQueue, waitTag };
}

/** The pills keep this far (screen) from the screen edge (D420: the "×11 waiting" pill used to end 3 pt from it). */
export const TAG_MARGIN = 12;
/** Width of a pill for its text (10 pt bold: ~5.8 per character plus the padding). */
export const waitTagWidth = (text: string) => text.length * 5.8 + 14;
/** Where the pill's centre sits (screen), over the idle drivers' group, kept TAG_MARGIN inside the screen edges. */
export function waitTagAt(lay: Pick<Layout, 'waitTag'>, text: string): { x: number; y: number; w: number; tail: number } {
  const [sx, sy] = P(lay.waitTag[0], lay.waitTag[1], WAIT_TAG_Z);
  const w = waitTagWidth(text);
  const x = Math.min(SCENE_W - TAG_MARGIN - w / 2, Math.max(TAG_MARGIN + w / 2, sx));
  return { x, y: sy, w, tail: sx - x };
}
/** The "+N" pill over the last diner: higher than that figure's head and lower than the drivers' pill, so the two never meet. */
export function moreTagAt(lay: Pick<Layout, 'queue'>, text: string): { x: number; y: number; w: number } {
  const last = lay.queue[lay.queue.length - 1] ?? [0, QUEUE_Y];
  const [sx, sy] = P(last[0], last[1], MORE_TAG_Z);
  const w = waitTagWidth(text);
  return { x: Math.min(SCENE_W - TAG_MARGIN - w / 2, Math.max(TAG_MARGIN + w / 2, sx)), y: sy, w };
}
