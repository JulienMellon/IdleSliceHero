// The layout as the drawing code uses it: in the draw space of its frame (layout-space.ts `toDrawSpace`), where the drawing code's default `P` is right and a wide
// shop's edges are frame.x0 and frame.x0 + frame.width. Identical to `layout` for the first three footprints (one screen). Every budget test goes through this, so a
// budget checks the room the player sees (v5.18 card V2).
import { layout as plan, type Layout } from '../layout';
import { toDrawSpace } from '../layout-space';
import type { SceneFrame } from '../projection';

export * from '../layout';
export function layout(
  fp: number,
  ovenCount: number,
  cookCount: number,
  staffCount: number,
  tableCount: number,
  driverSlots: number,
  plants = 0,
  frame?: SceneFrame,
  mirrored = false,
): Layout {
  return toDrawSpace(plan(fp, ovenCount, cookCount, staffCount, tableCount, driverSlots, plants, frame, mirrored));
}
