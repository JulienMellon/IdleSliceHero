// Event-driven drivers and walk-ins (v4.9; v5.0: synced with the engine's carriers, G81). The engine decides who
// carries each sale (pipeline.ts `dispatch`); the scene shows exactly that person:
//   - the driver waits at the pickup spot; a driver departure sends him out through the door (reaching it as the
//     engine pays, LINE.departSeconds), down the street and back, in exactly LINE.driverLap;
//   - a walk-in waits at the register; a walk-in departure hands them their pies (LINE.handoffSeconds), they sit,
//     eat and leave, and the next walk-in reaches the register exactly LINE.walkinLap after the hand-over.
// Pure: `stepCrew` folds new departures into a small state; `driverPoseAt` / `guestPoseAt` place everyone at a time.
// Routes depend only on the layout and are cached per layout object (M46).
import { LINE } from '../../engine/pipeline';
import { DINING_AISLE_Y, DOOR_IN_Y, DOOR_OUT_Y, PATIO_SEAT, SEAT, type Layout } from './layout';
import { GUEST_WALK_Y } from './timelines';

type Pt = [number, number];

/** Walking speed in room units per second (a brisk step). Legs that must fit an engine time walk at their own speed. */
export const WALK = 110;
/** A walk-in eats this long. */
export const EAT_S = 6;
/** With walk-ins no longer selling, one still waiting gives up after this long (C78/codecritic #4). */
export const MAX_WAIT_S = 8;
/** Drivers leave and return along this depth: in front of the pickup line and the register queue (D336). */
export const DRIVER_EXIT_Y = 40;
/** Near the door, drivers cross at this depth: in front of the walk-in waiting beside the counter. */
const DOOR_LANE_Y = 32;
/** At most this many walk-ins in the shop (one waiting, the rest seating, eating or leaving). */
const MAX_GUESTS = 4;
/**
 * v5.11: walk-ins sit at every table, indoors and on the patio, in turn (visit v takes table v mod n). Consecutive
 * walk-ins are served at least LINE.walkinLap apart, so with two or more tables nobody is handed a chair that is
 * still taken. A lone table can't wait out a 6 s meal before the next walk-in, so they eat faster there.
 */
export const EAT_S_SOLO = 3;

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** A polyline with its total length, for constant-speed walking. */
export interface Route {
  pts: readonly Pt[];
  len: number;
}
const route = (pts: Pt[]): Route => {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
  return { pts, len };
};
export const pathLength = (pts: readonly Pt[]) => route(pts as Pt[]).len;

/** Position after walking `d` units along a polyline (clamped to its ends). */
export function alongDist(path: readonly Pt[], d: number): Pt {
  let left = Math.max(0, d);
  for (let i = 1; i < path.length; i++) {
    const seg = dist(path[i - 1], path[i]);
    if (left <= seg || i === path.length - 1) {
      const f = seg > 0 ? Math.min(1, left / seg) : 1;
      return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * f, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * f];
    }
    left -= seg;
  }
  return path[path.length - 1];
}
/** Position `seconds` into a walk at WALK speed. */
export const alongTimed = (path: readonly Pt[], seconds: number) => alongDist(path, seconds * WALK);
export const walkSeconds = (path: readonly Pt[]) => pathLength(path) / WALK;

// ---------- routes (cached per layout) ----------

export interface DriverLeg {
  /** Pickup spot → in front of the register → just inside the door: walked in exactly LINE.departSeconds. */
  toDoor: Route;
  /** Door → sidewalk → off down the street. */
  away: Route;
  /** Street → door → pickup spot. */
  back: Route;
  /** Speed for `away` and `back`, so the whole lap takes LINE.driverLap. */
  speed: number;
  /** Seconds off screen between leaving and coming back. */
  gone: number;
}

export interface GuestLeg {
  arrive: Route;
  toSeat: Route;
  leave: Route;
  /** Register → out, for a walk-in who gives up. */
  giveUp: Route;
  /** Arrival speed, so the next walk-in reaches the register exactly LINE.walkinLap after a hand-over. */
  arriveSpeed: number;
  seat: Pt;
  orderAt: Pt;
  /** Index into the walk-in tables: the room's tables, then the patio's. */
  table: number;
  /** The seat is on the sidewalk patio. */
  patio: boolean;
  /** Seconds this walk-in eats. */
  eat: number;
}

export interface Routes {
  driver: DriverLeg;
  /** One per walk-in table: every table in the room, then the patio tables. */
  guests: GuestLeg[];
}
const routeCache = new WeakMap<Layout, Map<string, Routes>>();

/**
 * Sidewalk lanes. On a shop with no manager the sidewalk row stands taller (the hire bar) and covers the usual
 * lanes, so walkers keep to a lane just outside the door instead (D352).
 */
export const IDLE_WALK_Y = -16;

function buildRoutes(lay: Layout, sceneW: number, idle: boolean, patio: number): Routes {
  const walkY = idle ? IDLE_WALK_Y : GUEST_WALK_Y;
  const outY = idle ? IDLE_WALK_Y : DOOR_OUT_Y;
  const spot = lay.spots[0];
  const { driverX, driverPauseX, guestX, guestPauseX } = lay.door.lanes;
  const at: Pt = [spot.x, spot.y];
  const inside: Pt = [driverX, DOOR_IN_Y];
  const outside: Pt = [driverPauseX, outY];
  const street: Pt = [sceneW + 50, idle ? IDLE_WALK_Y : -30];
  // walk the exit lane (behind the front diners' heads, D353) to the counter's end, then step forward to the
  // doorway lane before reaching the walk-in waiting beside the counter (D336), and out
  // v5.3: step straight forward from the pickup spot to the doorway lane, then across in front of the walk-in
  // waiting at the counter's end (D370), and out
  const doorLane: Pt = [spot.x, DOOR_LANE_Y];
  const doorCol: Pt = [driverX, DOOR_LANE_Y];
  const toDoor = route([at, doorLane, doorCol, inside]);
  const away = route([inside, outside, street]);
  const back = route([street, outside, inside, doorCol, doorLane, at]);
  const rest = LINE.driverLap - LINE.departSeconds;
  // walk the rest of the lap at a normal pace if it fits, leaving the remainder off screen
  const speed = Math.max(WALK, (away.len + back.len) / Math.max(0.5, rest - 0.2));
  const gone = Math.max(0, rest - (away.len + back.len) / speed);
  const driver: DriverLeg = { toDoor, away, back, speed, gone };
  const orderAt = lay.orderSpots[0];
  const gIn: Pt = [guestX, DOOR_IN_Y];
  const gOut: Pt = [guestPauseX, outY];
  const start: Pt = [-30, walkY];
  const seats = [...lay.tables.map((t) => ({ x: t.x, y: t.y, seat: SEAT, out: false })), ...lay.patio.slice(0, idle ? 0 : patio).map((t) => ({ x: t.x, y: t.y, seat: PATIO_SEAT, out: true }))];
  const eat = seats.length >= 2 ? EAT_S : EAT_S_SOLO;
  const guests = seats.map((table, n) => {
    const seat: Pt = [table.x + table.seat, table.y];
    // D336: from the register the guest steps forward to the dining aisle and walks in front of the pickup line
    const aisleR: Pt = [orderAt[0], DINING_AISLE_Y];
    const aisleS: Pt = [seat[0], DINING_AISLE_Y];
    // in through the door, along the dining aisle in front of the pickup line, and up to the register's end
    const arrive = route([start, [gOut[0], walkY], gOut, gIn, [gIn[0], DINING_AISLE_Y], [orderAt[0], DINING_AISLE_Y], orderAt]);
    // a patio guest goes out the door and along the curb lane (in front of the vehicle and the queue), then straight
    // up to their chair; leaving is the same way back
    const leave = table.out
      ? route([seat, [seat[0], walkY], [sceneW + 50, walkY]])
      : route([seat, aisleS, [gIn[0], DINING_AISLE_Y], gIn, gOut, [gOut[0], walkY], [sceneW + 50, walkY]]);
    const toSeat = table.out
      ? route([orderAt, aisleR, [gIn[0], DINING_AISLE_Y], gIn, gOut, [gOut[0], walkY], [seat[0], walkY], seat])
      : route([orderAt, aisleR, aisleS, seat]);
    const giveUp = route([orderAt, [orderAt[0], DINING_AISLE_Y], [gIn[0], DINING_AISLE_Y], gIn, gOut, [gOut[0], walkY], [sceneW + 50, walkY]]);
    const arriveSpeed = Math.max(WALK, arrive.len / Math.max(0.5, LINE.walkinLap - LINE.handoffSeconds - 0.1));
    return { arrive, toSeat, leave, giveUp, arriveSpeed, seat, orderAt, table: n, patio: table.out, eat };
  });
  return { driver, guests };
}

/**
 * The routes for a layout, built once (M46). `idle`: the shop has no manager (raised sidewalk row, no patio).
 * `patio`: how many patio tables stand outside (0..2).
 */
export function routesFor(lay: Layout, sceneW: number, idle = false, patio = 0): Routes {
  let byW = routeCache.get(lay);
  if (!byW) routeCache.set(lay, (byW = new Map()));
  const n = idle ? 0 : Math.max(0, Math.min(lay.patio.length, patio));
  const key = `${sceneW}|${idle}|${n}`;
  let r = byW.get(key);
  if (!r) byW.set(key, (r = buildRoutes(lay, sceneW, idle, n)));
  return r;
}

// ---------- state ----------

export interface DriverSlot {
  /** When he left with an order (null: waiting at the spot). */
  leftAt: number | null;
  /** Departure ids he carries this trip (the pop rides over him). */
  deps: number[];
}
export interface GuestSlot {
  /** When this walk-in set off from the street. */
  start: number;
  /** Their arrival takes this long (the next walk-in is timed to the engine's lap). */
  arriveT: number;
  /** When they were handed their pies, or null while waiting. */
  servedAt: number | null;
  dep: number;
  /** Visit number (a new face each visit; survives gaps, C78). */
  visit: number;
  /** While waiting: when they give up and leave (set only once walk-ins stop buying), else null. */
  quitAt: number | null;
}
export interface CrewState {
  /** Routes use the lane outside the door (no manager: the sidewalk row stands taller, D352). */
  idle: boolean;
  /** Patio tables outside that walk-ins can sit at (0 on an idle shop). */
  patio: number;
  driver: DriverSlot;
  guests: GuestSlot[];
  /** Highest departure id already handed to someone. */
  seenId: number;
  nextVisit: number;
}

export interface CrewInput {
  lay: Layout;
  /** Walk-ins buy here (the engine sends them some sales). */
  walkins: boolean;
  /** The shop has no manager: keep walkers clear of the taller sidewalk row (D352). */
  idle?: boolean;
  /** Patio tables standing outside (`patioTables`); ignored on an idle shop, where the sidewalk stays clear. */
  patio?: number;
  /** Departures on the line right now (`left`: seconds to payment at the engine's last tick). */
  departures: readonly { id: number; kind: 'driver' | 'walkin'; left: number }[];
  /** Seconds since the engine's last tick, so a trip starts when the engine dispatched it, not when the scene saw it. */
  since?: number;
}

export const emptyCrew = (): CrewState => ({ idle: false, patio: 0, driver: { leftAt: null, deps: [] }, guests: [], seenId: 0, nextVisit: 0 });

export interface GuestSchedule {
  arrived: number;
  /** End of waiting: served, or gave up. */
  waitEnd: number;
  seated: number;
  eaten: number;
  done: number;
}

/** Every stage boundary of a walk-in's visit (C82: one schedule for the fold and the pose). */
export function guestSchedule(g: GuestSlot, L: GuestLeg): GuestSchedule {
  const arrived = g.start + g.arriveT;
  if (g.servedAt === null) {
    const waitEnd = g.quitAt === null ? Number.POSITIVE_INFINITY : Math.max(arrived, g.quitAt);
    return { arrived, waitEnd, seated: waitEnd, eaten: waitEnd, done: waitEnd + L.giveUp.len / WALK };
  }
  const seated = g.servedAt + LINE.handoffSeconds + L.toSeat.len / WALK;
  const eaten = seated + L.eat;
  return { arrived, waitEnd: g.servedAt, seated, eaten, done: eaten + L.leave.len / WALK };
}

/** Walk-in visit `visit`'s route and seat. */
export const guestLeg = (lay: Layout, sceneW: number, visit: number, idle = false, patio = 0) => {
  const gs = routesFor(lay, sceneW, idle, patio).guests;
  return gs[visit % gs.length];
};
const legOf = guestLeg;

/**
 * Fold the line's new departures into the crew at time `now` (scene seconds). Pure, bounded and idempotent:
 * the same inputs return the same state object, so calling it on every render costs almost nothing.
 * A waiting walk-in only gives up while walk-ins aren't buying (the engine always serves one in time otherwise).
 */
export function stepCrew(prev: CrewState, input: CrewInput, now: number, sceneW: number): CrewState {
  const { lay } = input;
  const idle = !!input.idle;
  const patio = idle ? 0 : Math.max(0, Math.min(lay.patio.length, input.patio ?? 0));
  const R = routesFor(lay, sceneW, idle, patio);
  const canSeat = R.guests.length > 0;
  const live = (g: GuestSlot) => now < guestSchedule(g, legOf(lay, sceneW, g.visit, idle, patio)).done;
  // while walk-ins buy, the one at the register waits as long as it takes (the engine will serve them); once they
  // stop, they give up after MAX_WAIT_S
  const patience = (g: GuestSlot) => g.servedAt === null && (input.walkins ? g.quitAt !== null : g.quitAt === null);
  const newDeps = input.departures.some((d) => d.id > prev.seenId);
  const driverBack = prev.driver.leftAt !== null && now - prev.driver.leftAt >= LINE.driverLap;
  const guestGone = prev.guests.some((g) => !live(g));
  const needGuest = input.walkins && canSeat && !prev.guests.some((g) => g.servedAt === null);
  if (!newDeps && !driverBack && !guestGone && !needGuest && !prev.guests.some(patience) && idle === prev.idle && patio === prev.patio) return prev;

  let driver: DriverSlot = driverBack ? { leftAt: null, deps: [] } : prev.driver;
  let guests = prev.guests.filter(live).map((g) => (patience(g) ? { ...g, quitAt: input.walkins ? null : Math.max(now, g.start + g.arriveT) + MAX_WAIT_S } : g));
  const since = input.since ?? 0;
  let nextVisit = prev.nextVisit;
  let seenId = prev.seenId;
  for (const dep of input.departures) {
    if (dep.id <= seenId) continue;
    seenId = dep.id;
    if (dep.kind === 'driver') {
      // the trip started when the engine dispatched it (up to a tick ago), so the driver is back exactly when the
      // engine's driver is free again. If the scene is behind (it was paused) and he's still carrying the last
      // stack out, the pies join that trip; if he's already on his way back, a new trip starts from the spot
      const start = now - Math.max(0, LINE.departSeconds - Math.max(0, dep.left - since));
      const carrying = driver.leftAt !== null && now - driver.leftAt < LINE.departSeconds;
      driver = carrying ? { ...driver, deps: [...driver.deps, dep.id].slice(-4) } : { leftAt: start, deps: [dep.id] };
    } else {
      const at = now - Math.max(0, LINE.handoffSeconds - Math.max(0, dep.left - since));
      const i = guests.findIndex((g) => g.servedAt === null);
      if (i >= 0) {
        guests = guests.map((g, j) => (j === i ? { ...g, servedAt: at, dep: dep.id, quitAt: null, start: Math.min(g.start, at - g.arriveT) } : g));
      } else if (canSeat) {
        // the scene missed the arrival (it was paused): this walk-in is served the moment they appear at the register
        const L = legOf(lay, sceneW, nextVisit, idle, patio);
        const arriveT = L.arrive.len / L.arriveSpeed;
        guests = [...guests, { start: at - arriveT, arriveT, servedAt: at, dep: dep.id, visit: nextVisit++, quitAt: null }];
      }
    }
  }
  // keep one walk-in at (or on the way to) the register while walk-ins buy here. After a hand-over the next one is
  // timed to arrive exactly when the engine's walk-in lap ends; on a fresh mount one is already there. A shop going
  // idle only stops new arrivals: nobody vanishes mid-meal (C78)
  if (input.walkins && canSeat && !guests.some((g) => g.servedAt === null)) {
    const L = legOf(lay, sceneW, nextVisit, idle, patio);
    const arriveT = L.arrive.len / L.arriveSpeed;
    let lastServe = -Infinity;
    for (const g of guests) if (g.servedAt !== null && g.servedAt > lastServe) lastServe = g.servedAt;
    const start = now - lastServe < LINE.walkinLap ? lastServe + LINE.walkinLap - arriveT : prev.nextVisit === 0 ? now - arriveT : now;
    guests = [...guests, { start, arriveT, servedAt: null, dep: 0, visit: nextVisit++, quitAt: null }];
  }
  if (guests.length > MAX_GUESTS) guests = guests.slice(guests.length - MAX_GUESTS);
  return { idle, patio, driver, guests, seenId, nextVisit };
}

// ---------- poses ----------

export interface MoverPose {
  pos: Pt;
  walking: boolean;
  /** facing left (into the shop) */
  face: boolean;
  carry: boolean;
  leaving: boolean;
  /** departure ids this figure carries or is being handed (their pops ride above them) */
  deps: readonly number[];
}
const NONE: readonly number[] = [];

export function driverPoseAt(lay: Layout, d: DriverSlot, now: number, sceneW: number, idle = false): MoverPose | null {
  const spot = lay.spots[0];
  if (!spot) return null;
  if (d.leftAt === null) return { pos: [spot.x, spot.y], walking: false, face: false, carry: false, leaving: false, deps: NONE };
  const L = routesFor(lay, sceneW, idle).driver;
  let t = now - d.leftAt;
  if (t < LINE.departSeconds) return { pos: alongDist(L.toDoor.pts, (t / LINE.departSeconds) * L.toDoor.len), walking: true, face: false, carry: true, leaving: true, deps: d.deps };
  t -= LINE.departSeconds;
  const tAway = L.away.len / L.speed;
  if (t < tAway) return { pos: alongDist(L.away.pts, t * L.speed), walking: true, face: false, carry: true, leaving: true, deps: d.deps };
  t -= tAway;
  if (t < L.gone) return null; // off down the street
  t -= L.gone;
  if (t >= L.back.len / L.speed) return { pos: [spot.x, spot.y], walking: false, face: false, carry: false, leaving: false, deps: NONE };
  return { pos: alongDist(L.back.pts, t * L.speed), walking: true, face: true, carry: false, leaving: false, deps: NONE };
}

export type GuestStage = 'arrive' | 'order' | 'toSeat' | 'seated' | 'leave';
export interface GuestPoseAt extends MoverPose {
  stage: GuestStage;
}

export function guestPoseAt(lay: Layout, g: GuestSlot, now: number, sceneW: number, idle = false, patio = 0): GuestPoseAt | null {
  const L = legOf(lay, sceneW, g.visit, idle, patio);
  const S = guestSchedule(g, L);
  if (now < g.start) return null;
  const base = { carry: false, deps: NONE };
  if (now < S.arrived) return { ...base, pos: alongDist(L.arrive.pts, (now - g.start) * (L.arrive.len / g.arriveT)), walking: true, face: false, leaving: false, stage: 'arrive' };
  if (g.servedAt === null) {
    if (now < S.waitEnd) return { ...base, pos: L.orderAt, walking: false, face: true, leaving: false, stage: 'order' };
    return now < S.done ? { ...base, pos: alongTimed(L.giveUp.pts, now - S.waitEnd), walking: true, face: false, leaving: true, stage: 'leave' } : null;
  }
  if (now >= S.done) return null;
  if (now < g.servedAt + LINE.handoffSeconds) return { ...base, pos: L.orderAt, walking: false, face: true, leaving: false, stage: 'order', carry: true, deps: [g.dep] };
  if (now < S.seated) return { ...base, pos: alongTimed(L.toSeat.pts, now - g.servedAt - LINE.handoffSeconds), walking: true, face: true, leaving: false, stage: 'toSeat', carry: true };
  if (now < S.eaten) return { ...base, pos: L.seat, walking: false, face: true, leaving: false, stage: 'seated' };
  return { ...base, pos: alongTimed(L.leave.pts, now - S.eaten), walking: true, face: false, leaving: true, stage: 'leave' };
}
