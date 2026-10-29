import { COUNTER_LANE_Y, DINING_AISLE_Y, DOOR_IN_Y, DOOR_OUT_Y, SEAT, type Layout } from './layout';

/** Walk-ins walk the sidewalk on the curb side (drivers use −30…−42), so the two never stack. */
const GUEST_WALK_Y = -48;

/** Linear interpolation along a polyline at fraction k (0..1) of its length. */
export function along(path: [number, number][], k: number): [number, number] {
  const segs = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = segs.reduce((a, b) => a + b, 0) || 1;
  let d = Math.max(0, Math.min(1, k)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? Math.min(1, d / segs[i]) : 1;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f];
    }
    d -= segs[i];
  }
  return path[path.length - 1];
}

// ---------- people timelines ----------
// Each person loops through a fixed itinerary; `p` (0..1) is how far round the loop they are.
// These are pure so the routes can be tested (no overlap, payout fires once per lap).

type Pt = [number, number];

/** Driver lap: walk in → pick up → walk out. The box is handed over (payout) at DRIVER_PAYOUT. */
export const DRIVER_PAYOUT = 0.54;
const DRIVER_WAIT: [number, number] = [0.26, 0.46];

export interface DriverPose {
  p: number;
  pos: Pt;
  walking: boolean;
  /** facing left (into the shop) */
  face: boolean;
  carry: boolean;
  leaving: boolean;
}

/** Phase (0..1) of driver i of n at animation time t. */
export function driverPhase(i: number, n: number, t: number, jitter: number) {
  return (((t / 6 + i / n + jitter) % 1) + 1) % 1;
}

export function driverPose(lay: Layout, i: number, p: number, sceneW: number): DriverPose {
  const spot = lay.spots[i % lay.spots.length];
  const lane = (i % 3) * 6;
  const { driverX, driverVia } = lay.door.lanes;
  const offStreet: Pt = [sceneW + 50 + (i % 3) * 18, -30 - lane];
  const outside: Pt = [lay.door.lanes.driverPauseX, DOOR_OUT_Y - lane];
  const inside: Pt = [driverX, DOOR_IN_Y];
  const at: Pt = [spot.x, spot.y];
  let pos: Pt;
  let walking = true;
  let face = false;
  if (p < 0.12) {
    pos = along([offStreet, outside], p / 0.12);
    face = true;
  } else if (p < 0.18) {
    pos = along([outside, inside], (p - 0.12) / 0.06);
    face = true;
  } else if (p < DRIVER_WAIT[0]) {
    pos = along([inside, driverVia, at], (p - 0.18) / 0.08);
    face = true;
  } else if (p < DRIVER_WAIT[1]) {
    pos = at;
    walking = false;
  } else if (p < DRIVER_PAYOUT) pos = along([at, driverVia, inside], (p - DRIVER_WAIT[1]) / 0.08);
  else if (p < 0.6) pos = along([inside, outside], (p - DRIVER_PAYOUT) / 0.06);
  else pos = along([outside, offStreet], (p - 0.6) / 0.4);
  return { p, pos, walking, face, carry: p >= DRIVER_WAIT[1], leaving: p >= DRIVER_PAYOUT };
}

/** True when any driver crossed the payout point between two frames' phases (index-aligned). */
export function payoutCrossed(prev: readonly number[], next: readonly number[]) {
  // a change in driver count re-spaces every phase (i / n), so that frame can't be compared
  if (prev.length !== next.length) return false;
  for (let i = 0; i < next.length; i++) {
    const a = prev[i];
    if (a !== undefined && a < DRIVER_PAYOUT && next[i] >= DRIVER_PAYOUT && next[i] - a < 0.5) return true;
  }
  return false;
}

export type GuestStage = 'arrive' | 'order' | 'toSeat' | 'seated' | 'leave';

export interface GuestPose {
  p: number;
  pos: Pt;
  stage: GuestStage;
  walking: boolean;
  face: boolean;
}

/** Walk-in i's lap: in by the door's left lane, order at the counter, sit opposite the table's regular, leave. */
export function guestPose(lay: Layout, i: number, p: number, sceneW: number): GuestPose {
  const table = lay.tables[i];
  // walk-ins come from the counter (right), so they take the right-hand chair and never pass the table;
  // the table's regular sits on the left
  const seat: Pt = [table.x + SEAT, table.y];
  // the aisle behind the table, so walkers turn into the chair instead of cutting through the table
  const aisle: Pt = [seat[0], DINING_AISLE_Y];
  // Between the counter and the order spot people walk the lane just in front of the counter (behind the
  // drivers' pickup line), and only step forward to the tables once they're left of the pickup spots.
  // turn down right beside the counter, before the bakers, and walk the dining aisle from there
  const turnX = Math.min(seat[0], lay.counter.x0);
  const behindPickup: Pt[] = [
    [lay.counter.x1 + 2, COUNTER_LANE_Y],
    [turnX, COUNTER_LANE_Y],
    [turnX, aisle[1]],
  ];
  const { guestX, guestVia } = lay.door.lanes;
  const gIn: Pt = [guestX, DOOR_IN_Y];
  const gOut: Pt = [lay.door.lanes.guestPauseX, DOOR_OUT_Y];
  const orderAt = lay.orderSpots[i % 2];
  const start: Pt = [-30, GUEST_WALK_Y];
  if (p < 0.18) return { p, pos: along([start, [gOut[0], GUEST_WALK_Y], gOut], p / 0.18), stage: 'arrive', walking: true, face: false };
  if (p < 0.24) return { p, pos: along([gOut, gIn], (p - 0.18) / 0.06), stage: 'arrive', walking: true, face: false };
  if (p < 0.34) return { p, pos: along([gIn, guestVia, orderAt], (p - 0.24) / 0.1), stage: 'arrive', walking: true, face: false };
  if (p < 0.42) return { p, pos: orderAt, stage: 'order', walking: false, face: true };
  if (p < 0.5) return { p, pos: along([orderAt, ...behindPickup, aisle, seat], (p - 0.42) / 0.08), stage: 'toSeat', walking: true, face: true };
  if (p < 0.8) return { p, pos: seat, stage: 'seated', walking: false, face: true };
  if (p < 0.88) return { p, pos: along([seat, aisle, ...behindPickup.slice().reverse(), guestVia, gIn], (p - 0.8) / 0.08), stage: 'leave', walking: true, face: false };
  if (p < 0.92) return { p, pos: along([gIn, gOut], (p - 0.88) / 0.04), stage: 'leave', walking: true, face: false };
  return { p, pos: along([gOut, [gOut[0], GUEST_WALK_Y], [sceneW + 50, GUEST_WALK_Y]], (p - 0.92) / 0.08), stage: 'leave', walking: true, face: false };
}
