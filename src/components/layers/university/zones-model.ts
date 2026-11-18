// University's campus zones as plain data: the sheet's rows (the scene has no zones strip: it covered the dining room, D485), the HUD chip and
// the drones' flight lanes. Text is the copy's, by key. Pure: unit-tested in node.
import type { GameState } from '../../../engine/game';
import type { ZonesView } from '../../../engine/features/layers/university-menu';
import { dressed } from '../city-dress';
import { hoodOf } from '../city-layers';
import { fill } from '../../report/report-model';
import { COPY } from './copy';

export const DRONES_NOTE = COPY['zone.drone.trip'];

/** "6s" / "2.4s": a trip's length (one decimal under 10 s). */
export function tripText(seconds: number): string {
  if (!(seconds > 0)) return '0s';
  return seconds < 10 ? `${Math.round(seconds * 10) / 10}s` : `${Math.round(seconds)}s`;
}

export interface ZoneCell {
  id: string;
  name: string;
  /** Line 2: "50% · 6s", or "Locked". */
  mid: string;
  /** Line 3: "distance 2", "ignores distance" for drones, or the footprint that opens a locked zone. */
  foot: string;
  locked: boolean;
  /** The words a screen reader gets for the whole cell. */
  label: string;
}

export function zoneCells(v: ZonesView, city?: string): ZoneCell[] {
  return v.zones.map((z) => {
    const name = dressed(city, `zone.${z.id}.name`, COPY[`zone.${z.id}.name` as 'zone.dorms.name']);
    const mid = z.open ? `${z.share}% · ${tripText(z.tripSeconds)}` : 'Locked';
    const open = v.drones ? DRONES_NOTE : `distance ${z.distance}`;
    const foot = z.open ? open : COPY['zone.locked'];
    return { id: z.id, name, mid, foot, locked: !z.open, label: `${name}. ${mid}. ${foot}` };
  });
}

/** Drivers out on campus right now: the university line's departures that are drivers (walk-ins stay in the shop). */
export const campusOut = (g: { city?: string } & Pick<GameState, 'shops'>): number =>
  g.shops[hoodOf(g, 'menu')]?.line.departures.filter((d) => d.kind === 'driver').length ?? 0;

/** The chip's text: "3 out on campus", or "3 drones up" once drones are the fleet; one drone is "1 drone up" (G107). */
export const campusChipText = (out: number, drones: boolean): string => {
  const text = fill(drones ? COPY['layer.university.drones.chip'] : COPY['layer.university.zones.chip'], { n: out });
  return drones && out === 1 ? text.replace('drones', 'drone') : text;
};

/** Where a drone flies: each lane is a band of the sky (as shares of the sky's height) and a crossing time. */
export const DRONE_MAX = 3;

export interface DroneLane {
  /** Centre height as a share of the sky band, 0..1 (top..bottom). */
  y: number;
  /** One crossing of the screen, ms. */
  ms: number;
  /** Start after this many ms of the loop, so the drones are not in step. */
  delay: number;
  /** +1 flies left to right, -1 right to left. */
  dir: 1 | -1;
}

/** How many drones are drawn: one for every drone out on campus, at least one (the fleet is owned), at most DRONE_MAX. */
export const droneCount = (out: number): number => Math.max(1, Math.min(DRONE_MAX, Math.floor(out)));

/** The lane of drone `i`: spread through the band, each a different speed and direction. */
export function droneLane(i: number): DroneLane {
  return { y: 0.25 + 0.25 * (i % DRONE_MAX), ms: 9000 + 2500 * i, delay: 1200 * i, dir: i % 2 === 0 ? 1 : -1 };
}

/** A drone's screen x at progress p (0..1) of its crossing: from just off one edge to just off the other. */
export function droneX(lane: DroneLane, p: number, width: number, size: number): number {
  const from = lane.dir === 1 ? -size : width + size;
  const to = lane.dir === 1 ? width + size : -size;
  return from + (to - from) * Math.max(0, Math.min(1, p));
}
