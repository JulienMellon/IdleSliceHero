// Event-driven drivers and walk-ins (playtest 2, v4.9). The engine's departures decide who moves:
//   - drivers wait at the pickup spots (one per spot); a driver departure sends the waiting driver nearest the door
//     out through it and down the street; a replacement walks back in a few seconds later;
//   - walk-ins come in, wait at their own order spot (one per spot) until a walk-in departure hands them a pie,
//     sit and eat, then leave. With no walk-in sales (the drivers take everything) nobody comes in to wait.
// Pure: `stepCrew` folds new departures into a small state; `crewPoses` places everyone at a time. Walking is at a
// constant speed along each route (`alongTimed`), so nobody speeds up or slows down between legs (P6).
import { DINING_AISLE_Y, DOOR_IN_Y, DOOR_OUT_Y, SEAT, type Layout } from './layout';
import { GUEST_WALK_Y } from './timelines';

type Pt = [number, number];

/** Walking speed in room units per second (a brisk step: the old lap walked the doorway at ~105). */
export const WALK = 110;
/** A driver is out on a delivery this long before a replacement starts back (short, so busy shops keep drivers waiting at the counter). */
export const AWAY_S = 0.8;
/** A walk-in eats this long. */
export const EAT_S = 7;
/** A walk-in waits this long at the counter for a pie before giving up and leaving (codecritic #4). */
export const MAX_WAIT_S = 8;
/** Drivers leave and return along this depth: in front of the pickup line and the register queue. */
export const DRIVER_EXIT_Y = 30;
/** Pause before a guest slot sends in the next walk-in. */
const RESPAWN_S = 1.2;
/** A walk-in takes their pie at the register for this long (matches LINE.handoffSeconds). */
const HANDOFF_S = 0.5;

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const pathLength = (path: readonly Pt[]) => path.slice(1).reduce((t, p, i) => t + dist(path[i], p), 0);

/** Position after walking `d` units along a polyline at constant speed (clamped to its ends). */
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

/** Position `seconds` into a walk along `path` at WALK speed. */
export const alongTimed = (path: readonly Pt[], seconds: number) => alongDist(path, seconds * WALK);
export const walkSeconds = (path: readonly Pt[]) => pathLength(path) / WALK;

// ---------- state ----------

export interface DriverSlot {
  /** When this slot's driver left with an order (null: waiting at the spot). */
  leftAt: number | null;
  /** The departure they carry (for the pop). */
  dep: number;
}
export interface GuestSlot {
  /** When this walk-in set off from the street. */
  start: number;
  /** When they were handed their pie, or null while waiting. */
  servedAt: number | null;
  /** Departure id that served them. */
  dep: number;
  /** Visit counter (a new face each visit). */
  visit: number;
}
export interface CrewState {
  drivers: DriverSlot[];
  guests: GuestSlot[];
  /** Highest departure id already handed to someone. */
  seenId: number;
}

export interface CrewInput {
  lay: Layout;
  /** Drivers that wait at the counter (≤ pickup spots). */
  drivers: number;
  /** Guest slots (≤ order spots); 0 when walk-ins buy nothing. */
  guests: number;
  /** Departures on the line right now, oldest first. */
  departures: readonly { id: number; kind: 'driver' | 'walkin' }[];
}

export const emptyCrew = (): CrewState => ({ drivers: [], guests: [], seenId: 0 });

/** The whole driver lap after leaving: out the door, down the street, away, and back to the spot. */
export function driverLeg(lay: Layout, i: number, sceneW: number) {
  const spot = lay.spots[i];
  const { driverX, driverPauseX } = lay.door.lanes;
  const lane = (i % 3) * 6;
  const at: Pt = [spot.x, spot.y];
  const inside: Pt = [driverX, DOOR_IN_Y];
  const outside: Pt = [driverPauseX, DOOR_OUT_Y - lane];
  const street: Pt = [sceneW + 50 + (i % 3) * 18, -30 - lane];
  // D336: step forward off the pickup line first and cross to the door in front of the register, never through the
  // walk-ins' order spot (the old route ran along the counter at y ≈ 44, straight through it)
  const front: Pt = [spot.x, DRIVER_EXIT_Y];
  const out: Pt[] = [at, front, inside, outside, street];
  const back: Pt[] = [street, outside, inside, front, at];
  const tOut = walkSeconds(out);
  const tBack = walkSeconds(back);
  return { out, back, tOut, tBack, total: tOut + AWAY_S + tBack };
}

/** A walk-in's routes: in to their order spot; then (along the dining aisle in front of the pickup line) to a seat; then out. */
export function guestLegs(lay: Layout, i: number, sceneW: number) {
  const table = lay.tables[i % lay.tables.length];
  const seat: Pt = [table.x + SEAT, table.y];
  const orderAt = lay.orderSpots[i % lay.orderSpots.length];
  const { guestX, guestVia, guestPauseX } = lay.door.lanes;
  const start: Pt = [-30, GUEST_WALK_Y];
  const gOut: Pt = [guestPauseX, DOOR_OUT_Y];
  const gIn: Pt = [guestX, DOOR_IN_Y];
  // D336: the old seat route walked the lane right behind the waiting drivers (one figure, two heads); now a guest
  // steps forward from the register to the dining aisle first and walks in front of the pickup line
  const aisleR: Pt = [orderAt[0], DINING_AISLE_Y];
  const aisleS: Pt = [seat[0], DINING_AISLE_Y];
  const arrive: Pt[] = [start, [gOut[0], GUEST_WALK_Y], gOut, gIn, guestVia, orderAt];
  const toSeat: Pt[] = [orderAt, aisleR, aisleS, seat];
  const leave: Pt[] = [seat, aisleS, [gIn[0], DINING_AISLE_Y], gIn, gOut, [gOut[0], GUEST_WALK_Y], [sceneW + 50, GUEST_WALK_Y]];
  return { arrive, toSeat, leave, tArrive: walkSeconds(arrive), tSeat: walkSeconds(toSeat), tLeave: walkSeconds(leave), seat, orderAt };
}

/** Guest slots start staggered so two walk-ins don't arrive in step. */
const guestStart = (i: number, now: number) => now + i * 2.3;

function guestDone(lay: Layout, g: GuestSlot, i: number, sceneW: number) {
  const L = guestLegs(lay, i, sceneW);
  const waitEnd = g.servedAt ?? g.start + L.tArrive + MAX_WAIT_S;
  return waitEnd + (g.servedAt !== null ? HANDOFF_S + L.tSeat + EAT_S : 0) + L.tLeave;
}

/**
 * Fold the line's new departures into the crew at time `now` (scene seconds). Pure and idempotent for the same
 * inputs, so calling it again on a re-render changes nothing. Bounded: ≤ spots drivers and ≤ 2 guests.
 */
export function stepCrew(prev: CrewState, input: CrewInput, now: number, sceneW: number): CrewState {
  const { lay } = input;
  const nD = Math.min(input.drivers, lay.spots.length);
  const nG = Math.min(input.guests, lay.orderSpots.length, lay.tables.length);
  const drivers = Array.from({ length: nD }, (_, i) => {
    const d = prev.drivers[i] ?? { leftAt: null, dep: 0 };
    // back at the spot: waiting again
    return d.leftAt !== null && now - d.leftAt >= driverLeg(lay, i, sceneW).total ? { leftAt: null, dep: 0 } : d;
  });
  const guests = Array.from({ length: nG }, (_, i) => {
    const g = prev.guests[i];
    if (!g) return { start: guestStart(i, now), servedAt: null, dep: 0, visit: 0 };
    return now >= guestDone(lay, g, i, sceneW) + RESPAWN_S ? { start: now, servedAt: null, dep: 0, visit: g.visit + 1 } : g;
  });
  let seenId = prev.seenId;
  for (const dep of input.departures) {
    if (dep.id <= seenId) continue;
    seenId = dep.id;
    if (dep.kind === 'driver') {
      // the waiting driver nearest the door (the spots run left → right towards it) takes the order
      for (let i = drivers.length - 1; i >= 0; i--)
        if (drivers[i].leftAt === null) {
          drivers[i] = { leftAt: now, dep: dep.id };
          break;
        }
    } else {
      // the walk-in who has been waiting at the register longest gets it
      let best = -1;
      guests.forEach((g, i) => {
        const L = guestLegs(lay, i, sceneW);
        const waiting = g.servedAt === null && now >= g.start + L.tArrive && now < g.start + L.tArrive + MAX_WAIT_S;
        if (waiting && (best < 0 || g.start < guests[best].start)) best = i;
      });
      if (best >= 0) guests[best] = { ...guests[best], servedAt: now, dep: dep.id };
    }
  }
  const same = seenId === prev.seenId && drivers.length === prev.drivers.length && guests.length === prev.guests.length && drivers.every((d, i) => d === prev.drivers[i]) && guests.every((g, i) => g === prev.guests[i]);
  return same ? prev : { drivers, guests, seenId };
}

// ---------- poses ----------

export interface MoverPose {
  pos: Pt;
  walking: boolean;
  /** facing left (into the shop) */
  face: boolean;
  carry: boolean;
  leaving: boolean;
  /** departure id this figure carries (for its pop), or 0 */
  dep: number;
}

export function driverPoseAt(lay: Layout, i: number, d: DriverSlot, now: number, sceneW: number): MoverPose {
  const spot = lay.spots[i];
  if (d.leftAt === null) return { pos: [spot.x, spot.y], walking: false, face: false, carry: false, leaving: false, dep: 0 };
  const L = driverLeg(lay, i, sceneW);
  const t = now - d.leftAt;
  if (t < L.tOut) return { pos: alongTimed(L.out, t), walking: true, face: false, carry: true, leaving: true, dep: d.dep };
  if (t < L.tOut + AWAY_S) return { pos: L.out[L.out.length - 1], walking: false, face: false, carry: false, leaving: true, dep: 0 };
  return { pos: alongTimed(L.back, t - L.tOut - AWAY_S), walking: true, face: true, carry: false, leaving: false, dep: 0 };
}

export type GuestStage = 'arrive' | 'order' | 'toSeat' | 'seated' | 'leave';
export interface GuestPoseAt extends MoverPose {
  stage: GuestStage;
}

export function guestPoseAt(lay: Layout, i: number, g: GuestSlot, now: number, sceneW: number): GuestPoseAt | null {
  const L = guestLegs(lay, i, sceneW);
  const t = now - g.start;
  if (t < 0) return null;
  const base = { carry: false, dep: 0 };
  if (t < L.tArrive) return { ...base, pos: alongTimed(L.arrive, t), walking: true, face: false, leaving: false, stage: 'arrive' };
  const waitEnd = g.servedAt ?? g.start + L.tArrive + MAX_WAIT_S;
  if (now < waitEnd) return { ...base, pos: L.orderAt, walking: false, face: true, leaving: false, stage: 'order' };
  if (g.servedAt === null) {
    // gave up waiting: straight back out
    const tl = now - waitEnd;
    const out: Pt[] = [L.orderAt, ...L.leave.slice(L.leave.length - 5)];
    return tl < walkSeconds(out) ? { ...base, pos: alongTimed(out, tl), walking: true, face: false, leaving: true, stage: 'leave' } : null;
  }
  let u = now - g.servedAt;
  if (u < HANDOFF_S) return { ...base, pos: L.orderAt, walking: false, face: true, leaving: false, stage: 'order', dep: g.dep };
  u -= HANDOFF_S;
  if (u < L.tSeat) return { ...base, pos: alongTimed(L.toSeat, u), walking: true, face: true, leaving: false, stage: 'toSeat' };
  u -= L.tSeat;
  if (u < EAT_S) return { ...base, pos: L.seat, walking: false, face: true, leaving: false, stage: 'seated' };
  u -= EAT_S;
  return u < L.tLeave ? { ...base, pos: alongTimed(L.leave, u), walking: true, face: false, leaving: true, stage: 'leave' } : null;
}
