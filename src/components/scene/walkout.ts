// A customer who gave up on the line (v5.22, card S3): while the floor shows a walk-out, every WALKOUT_EVERY seconds one of the figures in the door
// line turns away, shows a frown bubble and walks off down the sidewalk. One at a time by construction: the whole walk (turn, walk, fade) is shorter than
// the gap, and the figure is the same one the line draws (same key, same look), so nothing mounts or unmounts. Pure and a function of the clock.
import { hash32 } from './looks';
import { DOOR_OUT_Y, type Layout } from './layout';
import { WALK, alongDist, pathLength } from './crew';
import { GUEST_WALK_Y } from './timelines';

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
  /** Turned toward where they walk (`true`: away from the door). */
  away: boolean;
  /** Walking (false while still turning round). */
  walking: boolean;
  o: number;
}

/** Which line figure this is about, the walker when they are away from the spot, and how visible the line's own figure is (0 while it walks, fading back in after). */
export interface WalkoutFrame {
  q: number;
  walker: Walker | null;
  spotOpacity: number;
}

const paths = new WeakMap<Layout, [number, number][][]>();

/** Where a customer at line spot `q` walks: down off the sidewalk to the walkers' lane, then away from the door along it. Far enough to be off screen. Cached per layout. */
export function walkoutPath(lay: Layout, q: number): [number, number][] {
  let all = paths.get(lay);
  if (!all) paths.set(lay, (all = []));
  if (!all[q]) {
    const [x, y] = lay.queue[q];
    const lane = Math.min(y, Math.max(GUEST_WALK_Y, lay.floorY, DOOR_OUT_Y - 40));
    const dir = x >= lay.door.cx ? 1 : -1;
    all[q] = [
      [x, y],
      [x, lane],
      [x + dir * WALK * WALKOUT_WALK, lane],
    ];
  }
  return all[q];
}

/** The walk-out under way at `clock`, or null: nothing is walking out, or the line has no figures. `active` is the floor's `walkout` symptom. */
export function walkoutAt(lay: Layout, clock: number, active: boolean, figures: number): WalkoutFrame | null {
  const n = Math.min(figures, lay.queue.length);
  if (!active || n <= 0 || clock < 0) return null;
  const cycle = Math.floor(clock / WALKOUT_EVERY);
  const age = clock - cycle * WALKOUT_EVERY;
  if (age >= WALKOUT_TOTAL) return null;
  const q = hash32(cycle * 7919 + 3) % n;
  const [sx, sy] = lay.queue[q];
  if (age < WALKOUT_TURN) return { q, walker: { x: sx, y: sy, away: true, walking: false, o: 1 }, spotOpacity: 0 };
  const t = age - WALKOUT_TURN;
  if (t < WALKOUT_WALK) {
    const path = walkoutPath(lay, q);
    const [x, y] = alongDist(path, Math.min(t * WALK, pathLength(path)));
    const left = WALKOUT_WALK - t;
    return { q, walker: { x, y, away: true, walking: true, o: left < WALKOUT_FADE ? left / WALKOUT_FADE : 1 }, spotOpacity: 0 };
  }
  return { q, walker: null, spotOpacity: Math.min(1, (t - WALKOUT_WALK) / WALKOUT_RETURN) };
}
