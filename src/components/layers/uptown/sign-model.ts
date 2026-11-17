// The star rating on the storefront sign, as geometry in scene units. The sign's plate is centred on the shop (the frame middle) between y 129 and 149
// (facade.tsx: P(·, 0, FRONT_TOP) .. P(·, 0, FRONT_TOP − 20)); the rating hangs under it and the critic's passes sit on its top edge.
// Pure: unit-tested in node.
import { STARS } from '../../../content/layers';
import { FRONT_TOP, ONE_SCREEN, P, type SceneFrame } from '../../scene/projection';

/** The plate's centre x and its top and bottom, in scene units (the same projection the facade uses), in `frame`: the plate is centred on the shop, the frame's middle. */
export const signOf = (frame: SceneFrame = ONE_SCREEN) => {
  const [cx, top] = P(frame.vanishX, 0, FRONT_TOP, frame);
  const [, bottom] = P(frame.vanishX, 0, FRONT_TOP - 20, frame);
  return { cx, top, bottom };
};
/** The plate in the one-screen frame. */
export const SIGN = signOf();

/** One star glyph on the plaque (scene units), and the gap between neighbours. */
export const STAR = { size: 13, gap: 1.5 } as const;
/** The plaque under the sign: five stars in a pill. */
export const PLAQUE = { padX: 5, padY: 2, height: STAR.size + 4 } as const;
export const PLAQUE_W = 5 * STAR.size + 4 * STAR.gap + 2 * PLAQUE.padX;
/** The pay tag beside the plaque ("Half pay"): a pill in pt. */
export const TAG = { w: 72, h: 18, gap: 4 } as const;
/** The "local" stamp left of the plaque in a city that dresses the stars as a local rating (Southie): a pill in pt, the rating's name in it. */
export const STAMP = { w: 96, h: 18, gap: 4 } as const;

/**
 * Where the plaque, its tag and the pins go, in scene units, for a scene drawn at scale `s` (the tag is in pt). The plaque sits in the
 * sky strip just above the sign's plate (under the plate are the station badges), the tag to its right (the pair is centred on the sign
 * when there is a tag), and the pins hang on the plate's lower edge.
 */
export function plaqueBox(s: number, tag: boolean, sign: typeof SIGN = SIGN, stamp = false): { x: number; y: number; tagX: number; tagY: number; stampX: number; stampY: number; pinY: number } {
  // the stamp, the plaque and the tag stand in a row, centred on the sign as a whole
  const shift = ((tag ? TAG.w + TAG.gap : 0) - (stamp ? STAMP.w + STAMP.gap : 0)) / s / 2;
  const x = sign.cx - PLAQUE_W / 2 - shift;
  const y = sign.top - PLAQUE.height - 3;
  return { x, y, tagX: x + PLAQUE_W + TAG.gap / s, tagY: y + (PLAQUE.height - TAG.h / s) / 2, stampX: x - (STAMP.w + STAMP.gap) / s, stampY: y + (PLAQUE.height - STAMP.h / s) / 2, pinY: sign.bottom - PIN.size / 2 };
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
export function pinXs(passes: number, sign: typeof SIGN = SIGN): number[] {
  const n = Math.max(0, Math.min(PIN.max, Math.floor(passes)));
  const w = n * PIN.size + Math.max(0, n - 1) * PIN.gap;
  return Array.from({ length: n }, (_, i) => sign.cx - w / 2 + i * (PIN.size + PIN.gap));
}
