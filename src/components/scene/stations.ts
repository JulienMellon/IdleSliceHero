// Where the three kitchen stations are on screen: tap targets and the badge row (playtest 2, v4.8).
// Pure (no React): hit-testing and badge placement are unit-tested in node.
import type { Station } from '../../engine/pipeline';
import { D, FRONT_TOP, P } from './projection';
import type { Layout } from './layout';

/** A screen-space rectangle in scene units (x right, y down). */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Front-most first: the counter is drawn over the oven bank's right end, the prep bench over its left. */
export const HIT_ORDER: readonly Station[] = ['counter', 'prep', 'oven'];

/** Minimum tap target, in points (Apple HIG). */
export const MIN_TAP_PT = 44;

const bounds = (pts: [number, number][]): Rect => ({
  x0: Math.min(...pts.map((p) => p[0])),
  y0: Math.min(...pts.map((p) => p[1])),
  x1: Math.max(...pts.map((p) => p[0])),
  y1: Math.max(...pts.map((p) => p[1])),
});

/** The screen box of a room-space block (x0..x1 across, y0..y1 deep, z0..z1 high). */
const block = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  bounds([P(x0, y0, z0), P(x1, y0, z0), P(x0, y1, z1), P(x1, y1, z1), P(x0, y0, z1), P(x1, y0, z1)]);

/** Grow a rect about its centre so it is at least `min` wide and tall. */
export function padTo(r: Rect, min: number): Rect {
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  const w = Math.max(min, r.x1 - r.x0);
  const h = Math.max(min, r.y1 - r.y0);
  return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
}

/**
 * Each station's tap area in scene units: the furniture plus the worker standing at it. `minScene` is the
 * 44 pt minimum converted to scene units (44 / fit.s), so the target is big enough on any screen.
 */
export function stationRects(lay: Layout, minScene: number): Record<Station, Rect> {
  const ov0 = lay.ovenCols[0].x0;
  const ov1 = lay.ovenCols[lay.ovenCols.length - 1].x1;
  const ovenTop = Math.max(...lay.ovens.map((o) => o.z + o.h));
  return {
    // bench (depth 66–84) and the cooks behind it, up to their hats
    prep: padTo(block(Math.min(lay.prep.x0, ...lay.cooks) - 8, lay.prep.x1 + 2, 62, 100, 0, 56), minScene),
    // the oven bank on the back wall and the bakers in front of it
    oven: padTo(block(ov0 - 2, ov1 + 2, 58, D, 0, ovenTop), minScene),
    // the counter (depth 64–84) and its staff, up to their caps
    counter: padTo(block(lay.counter.x0 - 2, lay.counter.x1 + 2, 60, 92, 0, 66), minScene),
  };
}

const inside = (r: Rect, x: number, y: number) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

/** Which station a tap at scene point (x, y) lands on (front-most wins), or null. */
export function stationAt(rects: Record<Station, Rect>, x: number, y: number): Station | null {
  for (const st of HIT_ORDER) if (inside(rects[st], x, y)) return st;
  return null;
}

/** Badge ring radius and the gap between the shop's name plank and the badge row (scene units). */
export const BADGE_R = 12;
const BADGE_GAP = 22;

/** The badge row's centre y: just under the fascia plank, above the back-wall props (menu, shelf, mural). */
export const badgeRowY = () => P(0, 0, FRONT_TOP - 20)[1] + BADGE_GAP;

/** Each station's badge centre x: over the station's middle, kept apart so rings and their count pills never touch. */
export function badgeXs(lay: Layout): Record<Station, number> {
  const ov0 = lay.ovenCols[0].x0;
  const ov1 = lay.ovenCols[lay.ovenCols.length - 1].x1;
  const xs = {
    prep: P((lay.prep.x0 + lay.prep.x1) / 2, 80)[0],
    oven: P((ov0 + ov1) / 2, D)[0],
    counter: P((lay.counter.x0 + lay.counter.x1) / 2, 80)[0],
  };
  // a badge plus its count pill is ~2 rings wide; push neighbours apart from the oven outwards
  const gap = BADGE_R * 4.6;
  if (xs.oven - xs.prep < gap) xs.prep = xs.oven - gap;
  if (xs.counter - xs.oven < gap) xs.counter = xs.oven + gap;
  return xs;
}

/** Ring progress snapped to 1/24 steps, so a memoised badge only re-renders when its arc visibly changes (M36). */
export const progressStep = (p: number) => Math.max(0, Math.min(24, Math.floor(p * 24)));
