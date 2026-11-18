// The shop's floor plan as numbers (v5.18, card V2): how wide each footprint's drawing and room are, and which neighbourhoods use the mirrored plan (the plan itself is data on the neighbourhood).
// Pure data, so the layout module (src/components/scene/layout.ts) and its tests read the same table. Index = footprint (0 starter … 4 flagship).
import { findHood } from './cities';
import type { NeighborhoodDef } from './cities/types';

/** Width of the drawing (scene units) by footprint: one screen for the first three tiers (393: they must not change by a pixel), wider for the Restaurant and the Flagship. */
export const SCENE_WIDTH: readonly number[] = [393, 393, 393, 520, 640];
/** Width of the room (side wall to side wall) by footprint. */
export const ROOM_WIDTH: readonly number[] = [270, 295, 320, 450, 570];

/** The first tier whose drawing is wider than one screen (it scrolls sideways). */
export const FIRST_WIDE_FOOTPRINT = 3;

/**
 * The second floor plan: kitchen on the right, door on the left. It is data on the neighbourhood (`NeighborhoodDef.plan`): home Waterfront (the harbour is on
 * the other side of the street) and Industrial (the loading dock) are the ones that choose it; a city picks its own. `isMirrored(id)` looks the id up in
 * whichever city has it; `mirroredIn(def)` is the same rule on a def already in hand (a city under test is not in CITIES).
 */
export const mirroredIn = (def: NeighborhoodDef | undefined): boolean => def?.plan === 'mirrored';
export const isMirrored = (id: string): boolean => mirroredIn(findHood(id));

/** What the two wide tiers add to the plan (index = footprint). Narrow tiers have none. */
export interface WidePlan {
  /** The back wall's oven bay (room units): a longer bank than the narrow tiers' 110 / 118. */
  bayW: number;
  /** The most the first prep bench stretches (a bench of three cooks), and the second bench beside it. */
  benchMax: number;
  bench2W: number;
  /** Extra air between the oven bank and the counter (room units), so the wall props between them (the order screen, the warmer, the tickets) are not in the oven's tap area at that distance from the room's centre. */
  counterAir: number;
  /** Clear floor between the counter's end and the door's side wall: the layer props (warming rack, shift clock) stand here. */
  doorGap: number;
}
export const WIDE_PLAN: Readonly<Record<number, WidePlan>> = {
  3: { bayW: 140, benchMax: 84, bench2W: 48, counterAir: 0, doorGap: 60 },
  4: { bayW: 190, benchMax: 102, bench2W: 66, counterAir: 28, doorGap: 90 },
};
