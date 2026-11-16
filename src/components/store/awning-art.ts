// The Founder awning as art for the paid screens (card U3, D496): the same red-and-white stripes and dark-red piping the shop wears
// (`AWNING_FOUNDER`), drawn as nine scalloped stripes in a 300 x 64 box. Pure, so a test pins the geometry; store-art.tsx only draws it.
import { AWNING_FOUNDER } from '../scene/cosmetics';

export const AWNING_VIEW = { w: 300, h: 64, bar: 12, run: 46 } as const;
export const AWNING_STRIPES = 9;

export interface Stripe {
  x: number;
  w: number;
  fill: string;
  /** The stripe's path: straight sides from the piping bar down, a round scallop at the bottom. */
  d: string;
}

/** Stripes left to right: the first and last are red, so an odd count keeps both edges the same. */
export function awningStripes(n: number = AWNING_STRIPES): Stripe[] {
  const w = AWNING_VIEW.w / n;
  const { bar, run } = AWNING_VIEW;
  const r = w / 2;
  return Array.from({ length: n }, (_, i) => {
    const x = i * w;
    return { x, w, fill: i % 2 === 0 ? AWNING_FOUNDER.main : AWNING_FOUNDER.alt, d: `M${x} ${bar} H${x + w} V${run} A${r} ${r} 0 0 1 ${x} ${run} Z` };
  });
}

export const AWNING_COLORS = AWNING_FOUNDER;
