// Small bounded caches and quantisers that let the 15 fps scene reuse work between frames.
// Pure (no React) so they are unit-tested.

/** A least-recently-used map capped at `max` entries, so a cache keyed by look/pose can never grow without bound. */
export class Lru<V> {
  private map = new Map<string, V>();
  constructor(readonly max: number) {}
  get size() {
    return this.map.size;
  }
  get(key: string): V | undefined {
    const v = this.map.get(key);
    if (v !== undefined) {
      this.map.delete(key);
      this.map.set(key, v);
    }
    return v;
  }
  set(key: string, v: V) {
    this.map.delete(key);
    this.map.set(key, v);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }
}

/** Arm swing (0..~3) snapped to steps of 0.4: under a pixel at scene scale, but each step is a reusable pose. */
export const quantArm = (a: number) => Math.round(a * 2.5) / 2.5;

/** Walk cycle phase snapped to 8 frames. Never returns 0, because `step === 0` means "standing". */
export const STEP_FRAMES = 8;
export function quantStep(step: number) {
  if (step === 0) return 0;
  const tau = Math.PI * 2;
  const f = Math.floor((((step % tau) + tau) % tau) / (tau / STEP_FRAMES));
  return (f + 0.5) * (tau / STEP_FRAMES);
}
