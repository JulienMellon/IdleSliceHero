// Keeping the sidewalk's people clear of the shop report's strip (D514, Julien 2026-11-18). The strip (components/report/report-strip.tsx) is a pill over the bottom of the
// scene area, directly above the sidewalk row, and a guest whose feet stood or walked lower was drawn half behind it. The strip's place is a function of the scene's fit `s`
// and of whether the sidewalk row is the tall hire stack, so the layout is lifted per screen: `liftLayout` raises the standing queues' spots and sets `lay.floorY`, the lowest
// depth a managed shop's walkers may use (crew.ts). One rule, here; the rest of the scene reads the lifted layout.
import { STRIP } from '../report/report-model';
import { SIDEWALK_ROW } from '../tap-targets';
import { CURB_Y, SC, SCENE_H, TY, unprojectX } from './projection';
import type { Layout } from './layout';

/** Clear air (scene units) kept between a figure's feet (and their one-pixel bob) and the strip. */
export const STRIP_AIR = 2;

/**
 * Scene y of the top of the strip's drawn pill when it stands over the sidewalk row (a shop with a manager), for a scene drawn at scale `s` (the area's bottom is the scene's bottom; the
 * touch box above the pill is transparent). An unmanaged shop's strip stands at the top of the area (`stripRect`), nowhere near a guest's feet, so there is no top to keep clear of: the
 * kerb line, below everything a guest can stand on.
 */
export function stripTop(s: number, idle: boolean): number {
  if (idle) return CURB_Y;
  return CURB_Y - (SIDEWALK_ROW.raiseManaged + SIDEWALK_ROW.cardHeight + STRIP.above + STRIP.pill) / s;
}

/** The strip's drawn pill in scene units, for a scene drawn at scale `s` in an area `h` pt tall: over the sidewalk row with a manager, at the top of the area without one (STRIP.top). */
export function stripRect(s: number, idle: boolean, h: number): { y0: number; y1: number } {
  const y0 = idle ? SCENE_H - (h - STRIP.top) / s : stripTop(s, false);
  return { y0, y1: y0 + STRIP.pill / s };
}

/** The lowest room depth y (smaller = nearer the viewer) whose feet land at scene y `top - STRIP_AIR` or higher: P's y at z = 0 is TY + (492 - 1.25 y) SC. */
export function floorYFor(top: number): number {
  return (492 - (top - STRIP_AIR - TY) / SC) / 1.25;
}

type Pt = [number, number];

/**
 * The layout with its standing queues (diners, idle drivers and the pills over them) no lower than `floorY`, and `floorY` kept for the walkers' lanes. A group moves up as one
 * (the drivers keep their own heights, DRIVER_DROP_PT) and every figure keeps its screen x. The same layout object when nothing needs lifting and the floor is unchanged
 * (a screen tall enough that the strip is below the sidewalk), so the memos on `lay` stay warm.
 */
export function liftLayout(lay: Layout, floorY: number): Layout {
  const lowest = (pts: readonly Pt[]) => Math.min(...pts.map(([, y]) => y));
  const dDiners = Math.max(0, floorY - lowest([...lay.queue, lay.queueTag]));
  const dDrivers = Math.max(0, floorY - lowest([...lay.driverQueue, lay.waitTag]));
  if (dDiners === 0 && dDrivers === 0 && lay.floorY === floorY) return lay;
  const { vanishX } = lay.frame;
  const lift =
    (d: number) =>
    ([x, y]: Pt): Pt => {
      if (d === 0) return [x, y];
      const sx = vanishX * (1 - SC) + (vanishX + (x - vanishX) * (1 - y / 520)) * SC; // the screen x at the old depth, kept at the new one
      return [unprojectX(sx, y + d, lay.frame), y + d];
    };
  const all = (pts: Pt[], d: number) => (d === 0 ? pts : pts.map(lift(d)));
  return {
    ...lay,
    floorY,
    queue: all(lay.queue, dDiners),
    queueTag: lift(dDiners)(lay.queueTag),
    driverQueue: all(lay.driverQueue, dDrivers),
    waitTag: lift(dDrivers)(lay.waitTag),
  };
}
