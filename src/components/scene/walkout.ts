// A customer who gave up on the line (v5.22, card S3): while the floor shows a walk-out, every WALKOUT_EVERY seconds one of the figures in the door
// line turns away, shows a frown bubble and walks off down the sidewalk. One at a time by construction: the whole walk (turn, walk, fade) is shorter than
// the gap, and the figure is the same one the line draws (same key, same look), so nothing mounts or unmounts. Pure and a function of the clock.
import { hash32 } from './looks';
import { DOOR_OUT_Y, type Layout } from './layout';
import { WALK, alongDist, pathLength } from './crew';
import { GUEST_WALK_Y } from './timelines';

/** The frown bubble over a walking-out customer: its radius (figure units; drawn at the figure's scale, so about 17 pt across at the front), above 12 pt at every depth the walk takes. */
export const FROWN_R = 7.6;

/** A new walk-out starts this often (s) while the floor shows one. */
export const WALKOUT_EVERY = 7;
/** The customer turns round for this long, then walks this long; the last WALKOUT_FADE of the walk fades them out. */
export const WALKOUT_TURN = 0.5;
export const WALKOUT_WALK = 2.4;
export const WALKOUT_FADE = 0.6;
/** The line's spot is empty for the walk, then a new customer fades in over this long. */
export const WALKOUT_RETURN = 0.6;
/** Everything one walk-out takes, start to the spot filling again: always under WALKOUT_EVERY, so two never overlap. */
export const WALKOUT_TOTAL = WALKOUT_TURN + WALKOUT_WALK + WALKOUT_RETURN;

/** The walking customer this frame. */
export interface Walker {
  x: number;
  y: number;
  /**
   * Turned round against the way the line's figures face (they face the door): a customer of the line walks off with their back to it. The customer from the door (`q` -1) stands on the far side of the
   * door from the line (D552) and walks off the way the line faces, so they are not turned round.
   */
  away: boolean;
  /** Walking (false while still turning round). */
  walking: boolean;
  o: number;
}

/**
 * Which line figure this is about (`-1`: the shop's sidewalk has no room for figures, so the customer comes from where walk-ins pause left of the
 * door), the walker when they are away from the spot, and how visible the line's own figure is (0 while it walks, fading back in after).
 */
export interface WalkoutFrame {
  q: number;
  walker: Walker | null;
  spotOpacity: number;
}

const paths = new WeakMap<Layout, [number, number][][]>();

/** The customer who comes from the door stands this far (room units) beyond where delivery drivers pause, so they never stand on the mat (that pause is a waypoint, not a place to stand). */
export const DOOR_SPOT_GAP = 16;

/**
 * Where customer `q` stands before they go: their line spot, or (`-1`) just past the drivers' pause by the door, on the far side of it from the idle drivers' lane (D552: the idle
 * drivers park on the guests' side of the door, the customer used to stand on the first of them). Never lower than `lay.floorY`, the lowest depth that is clear of the report
 * strip, so the whole body shows (the plain pause line, y -30, is behind the strip on a phone).
 */
export const spotOf = (lay: Layout, q: number): [number, number] => {
  if (q >= 0) return lay.queue[q];
  const pause = lay.door.lanes.driverPauseX;
  return [pause + (pause >= lay.door.cx ? 1 : -1) * DOOR_SPOT_GAP, Math.max(DOOR_OUT_Y, lay.floorY)];
};

/**
 * Where a customer at line spot `q` walks: down off the sidewalk to the walkers' lane, then away from the door along it. Far enough to be off screen. Cached per layout.
 * The lane is above the report strip (`lay.floorY`), like every walker's.
 */
export function walkoutPath(lay: Layout, q: number): [number, number][] {
  let all = paths.get(lay);
  if (!all) paths.set(lay, (all = []));
  if (!all[q + 1]) {
    const [x, y] = spotOf(lay, q);
    const lane = Math.max(lay.floorY, Math.min(y, Math.max(GUEST_WALK_Y, DOOR_OUT_Y - 40)));
    const dir = x >= lay.door.cx ? 1 : -1;
    all[q + 1] = [
      [x, y],
      [x, lane],
      [x + dir * WALK * WALKOUT_WALK, lane],
    ];
  }
  return all[q + 1];
}

/** The walk-out under way at `clock`, or null: nothing is walking out. `active` is the floor's `walkout` symptom; `figures` is how many the line draws. */
export function walkoutAt(lay: Layout, clock: number, active: boolean, figures: number): WalkoutFrame | null {
  if (!active || clock < 0) return null;
  const n = Math.min(figures, lay.queue.length);
  const cycle = Math.floor(clock / WALKOUT_EVERY);
  const age = clock - cycle * WALKOUT_EVERY;
  if (age >= WALKOUT_TOTAL) return null;
  const q = n > 0 ? hash32(cycle * 7919 + 3) % n : -1;
  const [sx, sy] = spotOf(lay, q);
  // a customer from the door fades in as they turn (nobody was drawn there before); a line figure is already there
  if (age < WALKOUT_TURN) return { q, walker: { x: sx, y: sy, away: q >= 0, walking: false, o: q < 0 ? age / WALKOUT_TURN : 1 }, spotOpacity: 0 };
  const t = age - WALKOUT_TURN;
  if (t < WALKOUT_WALK) {
    const path = walkoutPath(lay, q);
    const [x, y] = alongDist(path, Math.min(t * WALK, pathLength(path)));
    const left = WALKOUT_WALK - t;
    return { q, walker: { x, y, away: q >= 0, walking: true, o: left < WALKOUT_FADE ? left / WALKOUT_FADE : 1 }, spotOpacity: 0 };
  }
  return { q, walker: null, spotOpacity: q < 0 ? 1 : Math.min(1, (t - WALKOUT_WALK) / WALKOUT_RETURN) };
}
