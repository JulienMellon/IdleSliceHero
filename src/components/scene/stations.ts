// Where the three kitchen stations are on screen: tap targets and the badge row (playtest 2, v4.8).
// Pure (no React): hit-testing and badge placement are unit-tested in node.
import { pizzas } from '../../engine/format';
import type { Line, Station } from '../../engine/pipeline';
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

// ---------- badge view-model (A19): primitives per station, built from the line; tested in node ----------

export type BadgeTone = 'basil' | 'tomato';

export interface BadgeModel {
  st: Station;
  /** Ring progress in 24ths, changing at most ~8 times a second so the memoised badge holds (M43). */
  step: number;
  /** Pies in the job, or waiting; an idle prep table shows the next batch as "×4" (D350). */
  count: string;
  /** Tomato on every station tied for the bottleneck (G80), basil otherwise. */
  tone: BadgeTone;
  /** The station to tap next (manual stations only). */
  ready: boolean;
  /** Who runs it: a head, the GM, or the player. */
  runner: 'head' | 'gm' | null;
}

export interface BadgeInput {
  line: Line;
  auto: Readonly<Record<Station, boolean>>;
  managed: boolean;
  /** Stations tied for the bottleneck. */
  neck: ReadonlySet<Station>;
  next: Station | null;
  tapBatch: number;
  /** Seconds since the engine's last tick (0 while paused). */
  since: number;
}

/** Ring steps for a job: about 8 per second of its length, at most 24, at least 1. */
export const ringSteps = (total: number) => Math.max(1, Math.min(24, Math.round(total * 8)));

export function badgeModels(b: BadgeInput): BadgeModel[] {
  const waiting: Record<Station, number> = { prep: b.tapBatch, oven: b.line.prepped, counter: b.line.baked };
  return (['prep', 'oven', 'counter'] as const).map((st) => {
    const job = b.line[st];
    let step = 0;
    if (job && job.total > 0) {
      const p = Math.min(1, Math.max(0, 1 - Math.max(0, job.left - b.since) / job.total));
      const n = ringSteps(job.total);
      step = Math.round((Math.floor(p * n) * 24) / n);
    }
    const count = job ? pizzas(job.n) : st === 'prep' && !b.auto.prep ? `×${pizzas(b.tapBatch)}` : pizzas(waiting[st]);
    return { st, step, count, tone: b.neck.has(st) ? 'tomato' : 'basil', ready: !b.auto[st] && b.next === st, runner: b.auto[st] ? (b.managed ? 'gm' : 'head') : null };
  });
}

/** A tap on a badge (a ≥ 44 pt circle around it) counts as a tap on its station (G79). */
export function badgeAt(xs: Record<Station, number>, y: number, x: number, ty: number, minScene: number): Station | null {
  const r = Math.max(BADGE_R + 4, minScene / 2);
  for (const st of ['prep', 'oven', 'counter'] as const) if (Math.hypot(x - xs[st], ty - y) <= r) return st;
  return null;
}

/** Seconds of a driver's departure spent as a coin flying to the HUD cash (it lands when the engine pays). */
export const COIN_FLIGHT = 0.55;

export interface PopModel<D> {
  dep: D;
  /** Pies and cash shown: the newest pop also carries every pop beyond the first two. */
  n: number;
  cash: number;
}

/**
 * Which departures show a "+$X" pop (T52): drivers until their coin launches, walk-ins for their whole hand-over
 * (C72: they used to go straight to the coin). Newest first, at most 2; older ones' pies and cash merge into the
 * newest, so the shown cash always adds up to the total.
 */
export function popModels<D extends { kind: 'driver' | 'walkin'; n: number; cash: number }>(deps: readonly D[], left: (d: D) => number): PopModel<D>[] {
  const pops: D[] = [];
  for (let i = deps.length - 1; i >= 0; i--) {
    const d = deps[i];
    if (d.kind === 'walkin' || left(d) > COIN_FLIGHT) pops.push(d);
  }
  let n = 0;
  let cash = 0;
  for (let i = 2; i < pops.length; i++) {
    n += pops[i].n;
    cash += pops[i].cash;
  }
  return pops.slice(0, 2).map((d, i) => ({ dep: d, n: d.n + (i === 0 ? n : 0), cash: d.cash + (i === 0 ? cash : 0) }));
}

/** A pop's rectangle (scene units): beside its carrier's head, on the side away from the counter staff (D368). */
export function popRect(head: [number, number], w: number): Rect {
  // to the left of the head at head height: the cashiers stand behind the counter, above and to the right of a
  // driver at the pickup spot, so a pop above the head landed on their faces
  const x1 = Math.max(4 + w, head[0] - 10);
  const y1 = head[1] + 10;
  return { x0: x1 - w, y0: y1 - 18, x1, y1 };
}

/** The counter staff's faces (scene units), for keeping pops off them. */
export function staffFaces(lay: Layout): Rect[] {
  return lay.staff.map((x) => bounds([P(x - 8, 92, 44), P(x + 8, 92, 44), P(x - 8, 92, 64), P(x + 8, 92, 64)]));
}

/**
 * The PIZZERIA plank on the doorway's lintel (scene units): from P(0,0,122) up 12 to P(0,0,108)'s top edge, spanning
 * the left jamb (door.x0 − 8) to the right pilaster (R − 8). room.tsx draws it from this rect; the crowd budget (D377)
 * keeps every standing head off it.
 */
export function doorwaySignRect(lay: Layout): Rect {
  const x0 = P(lay.door.x0 - 8, 0, 0)[0] + 2;
  const x1 = P(lay.R - 8, 0, 0)[0] - 2;
  const lTop = P(0, 0, 122)[1];
  return { x0, y0: lTop - 12, x1, y1: lTop - 1 };
}

/** The tutorial spotlight's cut-out: the station's rect grown by this much on every side. */
export const SPOTLIGHT_PAD = 8;
export const spotlightCutout = (r: Rect): Rect => ({ x0: r.x0 - SPOTLIGHT_PAD, y0: r.y0 - SPOTLIGHT_PAD, x1: r.x1 + SPOTLIGHT_PAD, y1: r.y1 + SPOTLIGHT_PAD });

/**
 * Where the tutorial hand sits (D384): inside the cut-out, centred across and 30 up from its bottom edge: over the work surface, below the heads of the worker at the station.
 * It used to sit on the cut-out's bottom edge, over the rug-table diner's head; the right edge (x1 + 6) is no better,
 * since the neighbouring baker's or counter staff's head stands there. `rot` is the glyph's rotation (the glyph points
 * up at 0; it tilts like a pointing finger); `rect` is its generous bounding box (scene units).
 */
export function tutorialHand(cut: Rect, bounce = 0): { hx: number; hy: number; rot: number; scale: number; rect: Rect } {
  const hx = (cut.x0 + cut.x1) / 2;
  const hy = cut.y1 - 30 + bounce;
  const scale = 1.6;
  return { hx, hy, rot: -20, scale, rect: { x0: hx - 8 * scale, y0: hy - 8 * scale, x1: hx + 8 * scale, y1: hy + 8 * scale } };
}
