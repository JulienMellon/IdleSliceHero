// What the shop drawing tells the Coach (v5.20, card C2): where each station, its dial and the oven bank are on the SCREEN, in points, so the one overlay
// (coach/overlay.tsx) can light a station together with its dial. Pure: the storefront registers the answer (coach/targets.ts `registerTarget`).
import type { Station } from '../../engine/pipeline';
import type { CoachTargetId, Rect } from '../coach/targets';
import type { Layout } from './layout';
import { D, P, sceneToScreen, type SceneFit } from './projection';
import { BADGE_R, MIN_TAP_PT, badgeRowY, badgeXs, stationRects, type Rect as SceneRect } from './stations';

/** A dial is the badge's circle, a little proud of its ring (scene units: `badgeAt`'s own reach), plus its count pill on the right. */
export const DIAL_R = BADGE_R + 4;
/** …and the count pill beside the ring (kitchen-hud.tsx: it starts BADGE_R + 3 right of the centre and is 6.2 per character + 10 wide): room for two characters ("×4", "12"), so the number Nonna names is lit with the ring (G112). */
export const DIAL_PILL = 24;

/** The ids this module reports, in a fixed order. */
export const SCENE_TARGETS = [
  'station:prep',
  'station:oven',
  'station:counter',
  'dial:prep',
  'dial:oven',
  'dial:counter',
  'ovens:all',
] as const satisfies readonly CoachTargetId[];

export type SceneTargetId = (typeof SCENE_TARGETS)[number];

/**
 * Every scene target in screen points. `lay` is the layout as the drawing code uses it (draw space: a wide shop's group is moved right by `-lay.frame.x0`),
 * `fit` the content's fit (`sceneView(...).fit`), `scrollX` how far the shop has scrolled, `origin` where the scene view's top-left corner is on the screen
 * (`measureInWindow`). The mapping is `sceneToScreen`, the one every overlay anchored to the shop uses, so a scrolling shop is right.
 */
export function coachRects(lay: Layout, fit: SceneFit, scrollX: number, origin: { x: number; y: number }): Record<SceneTargetId, Rect> {
  const shift = -lay.frame.x0;
  const sx = (x: number) => origin.x + sceneToScreen(x + shift, scrollX, fit);
  const sy = (y: number) => origin.y + fit.oy + y * fit.s;
  const toScreen = (r: SceneRect): Rect => ({ x0: sx(r.x0), y0: sy(r.y0), x1: sx(r.x1), y1: sy(r.y1) });

  const stations = stationRects(lay, MIN_TAP_PT / fit.s);
  const xs = badgeXs(lay);
  const by = badgeRowY();
  const dial = (st: Station): Rect => toScreen({ x0: xs[st] - DIAL_R, y0: by - DIAL_R, x1: xs[st] + BADGE_R + 3 + DIAL_PILL, y1: by + DIAL_R });

  // every oven slot drawn: the face of each oven on the back wall (the same projection the drawing uses)
  let ov: SceneRect = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const o of lay.ovens) {
    const a = P(o.x0, D, o.z);
    const b = P(o.x1, D, o.z + o.h);
    ov = { x0: Math.min(ov.x0, a[0], b[0]), y0: Math.min(ov.y0, a[1], b[1]), x1: Math.max(ov.x1, a[0], b[0]), y1: Math.max(ov.y1, a[1], b[1]) };
  }

  return {
    'station:prep': toScreen(stations.prep),
    'station:oven': toScreen(stations.oven),
    'station:counter': toScreen(stations.counter),
    'dial:prep': dial('prep'),
    'dial:oven': dial('oven'),
    'dial:counter': dial('counter'),
    'ovens:all': toScreen(ov),
  };
}
