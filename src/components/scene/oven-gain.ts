// What an oven upgrade is worth, on the oven (v5.20, D522): while the tutorial's "look at the ovens" step is up (its target is `ovens:all`) the oven wears a plaque with its
// level and how much faster it bakes than a level ago, so the player sees the gain the step names. Pure: the storefront draws it.
import type { CityFit } from '../../content/cities';
import { ovenRate, type Shop } from '../../engine/game';
import type { Layout } from './layout';
import { D, P } from './projection';

export interface OvenGain {
  level: number;
  /** Whole percent faster than one level ago (at least 1). */
  pct: number;
}

/** The plaque's content: null at level 1 (nothing was bought) or when the level made no difference. */
export function ovenGain(shop: Pick<Shop, 'ovens' | 'grade'>, fit: CityFit): OvenGain | null {
  if (shop.ovens < 2) return null;
  const now = ovenRate(shop as Shop, fit);
  const before = ovenRate({ ...shop, ovens: shop.ovens - 1 } as Shop, fit);
  const pct = Math.round((now / before - 1) * 100);
  return pct >= 1 ? { level: shop.ovens, pct } : null;
}

/** Plaque width and the two rows' heights (scene units): it must fit the narrowest oven as drawn on the back wall (MIN_OVEN_W x kAt(D)) so it never leaves the oven's own lit area. */
export const GAIN_W = 33;
export const GAIN_BAND_H = 15;
export const GAIN_PILL_H = 16;

/** Where the plaque is centred, in the draw space: the middle of the highest oven's body, above the fire window and the baker's hands. */
export function gainAnchor(lay: Layout): { x: number; y: number } {
  const top = lay.ovens.reduce((a, o) => (o.z + o.h > a.z + a.h ? o : a), lay.ovens[0]);
  const [x, y] = P((top.x0 + top.x1) / 2, D, top.z + top.h * 0.62, lay.frame);
  return { x, y };
}
