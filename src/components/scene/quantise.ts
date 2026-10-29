// Pose quantisers: snapping continuous motion to a few steps lets memoised figure parts skip re-rendering.
// Pure (no React) so they are unit-tested.

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
