// Small pure helpers the layer overlays share. Pure: unit-tested in node.

/** Scene units to window points for a scene drawn in a w x h area (scene/projection.ts `sceneFit`): where an overlay View sits. */
export function toWindow(fit: { s: number; ox: number; oy: number }, x: number, y: number): { left: number; top: number } {
  return { left: fit.ox + x * fit.s, top: fit.oy + y * fit.s };
}
