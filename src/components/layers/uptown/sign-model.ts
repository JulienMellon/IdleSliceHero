// The star rating on the storefront sign, as geometry in scene units. The sign's plate is centred on the shop (x 196.5) between y 129 and 149
// (facade.tsx: P(·, 0, FRONT_TOP) .. P(·, 0, FRONT_TOP − 20)); the rating hangs under it and the critic's passes sit on its top edge.
// Pure: unit-tested in node.
import { STARS } from '../../../content/layers';
import { FRONT_TOP, P } from '../../scene/projection';

/** The plate's centre x and its top and bottom, in scene units (the same projection the facade uses). */
export const SIGN = (() => {
  const [cx, top] = P(196.5, 0, FRONT_TOP);
  const [, bottom] = P(196.5, 0, FRONT_TOP - 20);
  return { cx, top, bottom };
})();

/** One star glyph on the plaque (scene units), and the gap between neighbours. */
export const STAR = { size: 13, gap: 1.5 } as const;
/** The plaque under the sign: five stars in a pill. */
export const PLAQUE = { padX: 5, padY: 2, height: STAR.size + 4 } as const;
export const PLAQUE_W = 5 * STAR.size + 4 * STAR.gap + 2 * PLAQUE.padX;
/** The pay tag beside the plaque ("Half pay"): a pill in pt. */
export const TAG = { w: 72, h: 18, gap: 4 } as const;

/**
 * Where the plaque, its tag and the pins go, in scene units, for a scene drawn at scale `s` (the tag is in pt). The plaque sits in the
 * sky strip just above the sign's plate (under the plate are the station badges), the tag to its right (the pair is centred on the sign
 * when there is a tag), and the pins hang on the plate's lower edge.
 */
export function plaqueBox(s: number, tag: boolean): { x: number; y: number; tagX: number; tagY: number; pinY: number } {
  const shift = tag ? (TAG.w + TAG.gap) / s / 2 : 0;
  const x = SIGN.cx - PLAQUE_W / 2 - shift;
  const y = SIGN.top - PLAQUE.height - 3;
  return { x, y, tagX: x + PLAQUE_W + TAG.gap / s, tagY: y + (PLAQUE.height - TAG.h / s) / 2, pinY: SIGN.bottom - PIN.size / 2 };
}

/** The gold pins on the sign's lower edge (one for every critic pass), at most this many. */
export const PIN = { size: 9, gap: 2, max: 8 } as const;

export interface PlaqueStar {
  x: number;
  filled: boolean;
}

/** The five stars of the plaque from its left edge: `stars` of them filled. */
export function plaqueStars(stars: number): PlaqueStar[] {
  const n = Math.max(0, Math.min(STARS.maxStars, Math.round(stars)));
  return Array.from({ length: STARS.maxStars }, (_, i) => ({ x: PLAQUE.padX + i * (STAR.size + STAR.gap), filled: i < n }));
}

/** The pins' left edges, centred on the sign: min(passes, PIN.max) of them. */
export function pinXs(passes: number): number[] {
  const n = Math.max(0, Math.min(PIN.max, Math.floor(passes)));
  const w = n * PIN.size + Math.max(0, n - 1) * PIN.gap;
  return Array.from({ length: n }, (_, i) => SIGN.cx - w / 2 + i * (PIN.size + PIN.gap));
}
