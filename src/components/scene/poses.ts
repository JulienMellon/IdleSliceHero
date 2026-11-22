// How a worker shows the state of their station (v5.22, card S3), with the same art and new transforms only:
//   - `piling` (their output is backing up): a quick bob and a sweat drop every SWEAT_EVERY seconds;
//   - `idle` (they wait for input): they lean on the counter, hands still, and every YAWN_EVERY seconds yawn or glance at a phone (the two take turns).
// Pure and a function of the pose clock alone (the 7.5 Hz clock in cast.ts), so the memoised figures keep identical props between steps and a budget
// test can check the timing without a renderer.
import type { Symptom } from '../../engine/features/service';
import type { Act, Mood } from './looks';

/** What a worker's station says about them: the engine's `piling` or `idle`, or nothing. */
export type WorkerSymptom = Symptom | null | undefined;

/** The whole pose: transforms (`bob` lifts the figure, `lean` tilts it, `sweat` is the drop's step 1-3 or 0), and what replaces the work they were doing. */
export interface WorkerPose {
  bob: number;
  lean: number;
  sweat: number;
  /** Hands still: the worker stops the arm work (cast.ts zeroes `arm` and takes the tool out of their hand). */
  still: boolean;
  /** A phone glance, or none. */
  act: Act | null;
  /** A yawn, or none. */
  mood: Mood | null;
  /** The bubble over an idle worker's head, there the whole time (D549): a Z, or the phone while they glance at it. */
  bubble: 'z' | 'phone' | null;
}

/** A drop of sweat shows this often, this long, and falls through three steps. */
export const SWEAT_EVERY = 3;
export const SWEAT_SECONDS = 1.5;
export const SWEAT_STEPS = 3;
/** A yawn or a phone glance comes this often (they alternate), and lasts this long. */
export const YAWN_EVERY = 6;
export const YAWN_SECONDS = 1.2;
export const PHONE_SECONDS = 2;
/** The hurried bob: this high (scene units), flipping every pose step (7.5 Hz: about four bobs a second). */
export const HURRY_BOB = 2.4;
/** The lean's strength (1 = leaning). */
export const LEAN = 1;

/** Where in its cycle a worker is, so the three at a station do not all yawn together: a fixed offset per seed (0 to 1.9 s). */
const offsetOf = (seed: number): number => (Math.abs(Math.trunc(seed)) % 20) * 0.1;

/** The pose for a worker at `poseClock` seconds (the 7.5 Hz clock), or null when their station shows nothing. */
export function workerPose(sym: WorkerSymptom, poseClock: number, seed: number): WorkerPose | null {
  if (sym !== 'piling' && sym !== 'idle') return null;
  const t = poseClock + offsetOf(seed);
  if (sym === 'piling') {
    const phase = t % SWEAT_EVERY;
    return {
      bob: Math.floor(poseClock * 7.5) % 2 === 0 ? 0 : HURRY_BOB,
      lean: 0,
      sweat: phase < SWEAT_SECONDS ? 1 + Math.min(SWEAT_STEPS - 1, Math.floor((phase / SWEAT_SECONDS) * SWEAT_STEPS)) : 0,
      still: false,
      act: null,
      mood: null,
      bubble: null,
    };
  }
  const cycle = Math.floor(t / YAWN_EVERY);
  const phase = t - cycle * YAWN_EVERY;
  const yawn = cycle % 2 === 0 && phase < YAWN_SECONDS;
  const phone = cycle % 2 === 1 && phase < PHONE_SECONDS;
  return { bob: 0, lean: LEAN, sweat: 0, still: true, act: phone ? 'phone' : null, mood: yawn ? 'o' : null, bubble: phone ? 'phone' : 'z' };
}

// ---------- the idle drivers' scooters ----------
/** An idle driver sits on a small scooter: it is drawn at this scale, the driver is lifted this far (figure units) onto its seat, and its drawing spans this box (unscaled). */
export const SCOOTER_K = 0.75;
export const RIDE_LIFT = 8;
export const SCOOTER_BOX = { x0: -16.2, x1: 17.2, y0: -21.5, y1: 3.5 } as const;
