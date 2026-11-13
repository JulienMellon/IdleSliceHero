// How a running weekly event changes the shop scene (v5.15, S1; D470): the sky goes to dusk, string lights come on over the shop and two more
// hungry diners stand in the lane while the shop runs. Pure (no React); the drawing is event-props.tsx.
import type { EventDef } from '../../content/endgame';
import type { NeighborhoodId } from '../../content/types';

export interface EventLook {
  dusk: boolean;
  lights: boolean;
  /** Hungry diners added to the sidewalk lane while the shop runs. */
  extraDiners: number;
}

export const NO_EVENT_LOOK: EventLook = { dusk: false, lights: false, extraDiners: 0 };
export const EVENT_LOOK: EventLook = { dusk: true, lights: true, extraDiners: 2 };

/** The look of `shop` while `event` runs: the event's own shops only (Big Game Day dresses Downtown and the Suburbs, Friday Night Rush all). */
export function eventLook(event: Pick<EventDef, 'hoods'> | null, shop: NeighborhoodId, running: boolean): EventLook {
  if (!event) return NO_EVENT_LOOK;
  if (event.hoods !== 'all' && !event.hoods.includes(shop)) return NO_EVENT_LOOK;
  // the sky and the lights come with the event; the extra diners only while the shop is selling
  return running ? EVENT_LOOK : { ...EVENT_LOOK, extraDiners: 0 };
}

/** The sagging cord of string lights across the top of the shop, in scene units: `n` bulbs on a curve from (x0, y) to (x1, y) that dips `sag` in the middle. */
export function lightString(x0: number, x1: number, y: number, sag: number, n: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    return { x: x0 + (x1 - x0) * t, y: y + sag * 4 * t * (1 - t) };
  });
}
