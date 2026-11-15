// University's campus zones as plain data: the strip in the scene (three cells of three short lines), the sheet's rows, the HUD chip and
// the drones' flight lanes. Text is the copy's, by key. Pure: unit-tested in node.
import { FOOTPRINTS } from '../../../content/tuning';
import type { GameState } from '../../../engine/game';
import type { ZonesView } from '../../../engine/features/layers/university-menu';
import { fill, STRIP } from '../../report/report-model';
import { COPY } from './copy';

export const DRONES_NOTE = 'ignores distance';
export const LOCKED_FOOT = 'Expand to open';

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
  /** Line 3: "distance 2", "ignores distance" for drones, or "Expand to open" for a locked zone. */
  foot: string;
  /** The sheet's line 3: the same, but a locked zone names the footprint that opens it. */
  footFull: string;
  locked: boolean;
  /** The words a screen reader gets for the whole cell. */
  label: string;
}

export function zoneCells(v: ZonesView): ZoneCell[] {
  return v.zones.map((z) => {
    const name = COPY[`zone.${z.id}.name` as "zone.dorms.name"];
    const mid = z.open ? `${z.share}% · ${tripText(z.tripSeconds)}` : 'Locked';
    const open = v.drones ? DRONES_NOTE : `distance ${z.distance}`;
    const foot = z.open ? open : LOCKED_FOOT;
    const footFull = z.open ? open : `Opens at ${FOOTPRINTS[z.opensAt].name}`;
    return { id: z.id, name, mid, foot, footFull, locked: !z.open, label: `${name}. ${mid}. ${footFull}` };
  });
}

/** Drivers out on campus right now: the university line's departures that are drivers (walk-ins stay in the shop). */
export const campusOut = (g: Pick<GameState, 'shops'>): number => g.shops.university.line.departures.filter((d) => d.kind === 'driver').length;

/** The chip's text: "3 out on campus", or "3 drones up" once drones are the fleet. */
export const campusChipText = (out: number, drones: boolean): string => fill(drones ? COPY['layer.university.drones.chip'] : COPY['layer.university.zones.chip'], { n: out });

/** The strip: a bordered row of three cells, each three lines of 10 to 11 pt text. */
export const ZONES_STRIP = { border: 2, pad: 2, gap: 3, cellPad: 3, line: 12, lines: 3 } as const;
/** The strip's height (pt): the lines, the cells' padding, the strip's padding and border. */
export const STRIP_H = ZONES_STRIP.lines * ZONES_STRIP.line + 2 * (ZONES_STRIP.pad + ZONES_STRIP.border) + 4;
/** The width one line of a cell has (pt) on a screen `screenW` wide. */
export const cellTextWidth = (screenW: number): number =>
  (screenW - 2 * STRIP.margin - 2 * (ZONES_STRIP.border + ZONES_STRIP.pad) - 2 * ZONES_STRIP.gap) / 3 - 2 * ZONES_STRIP.cellPad;
/** The strip sits above the shop report's strip when that is up, else straight above the sidewalk row (`bottom` is the report strip's own). */
export const stripBottom = (bottom: number, reportUp: boolean): number => bottom + (reportUp ? STRIP.height + STRIP.above : 0);

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
