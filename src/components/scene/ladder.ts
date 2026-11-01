// The visual ladder (v5.11, D2): every station shows a new visible step about every 10 levels. Pure (no React):
// which props show at a level, where they sit for every footprint, the per-buy bounce, the milestone confetti and
// the head's milestone lines. ladder-props.tsx draws what this places; storefront.tsx wires it in.
//
// Placement is relative to the Layout (prep, counter, spots, scooter, door, back wall) and self-checking: a prop
// whose spot would cover a badge, a head, the menu, the window, the door or the mat in this footprint is dropped
// (`ladderProps` returns only what fits), and the budget in __tests__/ladder.test.ts re-checks it independently.
import { TUNING } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import type { Station } from '../../engine/pipeline';
import { type Layout, SEAT } from './layout';
import { hash32 } from './looks';
import { D, P, SCENE_W, kAt, shade } from './projection';
import { BADGE_R, badgeRowY, badgeXs, doorwaySignRect, stationRects, type Rect } from './stations';

export type LadderStation = 'prep' | 'counter' | 'drivers';
/** `bench`/`counter`: stands on its own station's furniture; `wall`: on the back wall; `floor`: on the floor; `street`: outside. */
export type Mount = 'bench' | 'counter' | 'wall' | 'floor' | 'street';

/** The levels at which a station shows a new step. */
export const LADDER_LEVELS = [10, 20, 30, 40, 60, 80, 100, 120] as const;
/** How many ladder levels a station level has reached (0–8). The furniture memo keys on this, not on every level. */
export const ladderStep = (level: number) => LADDER_LEVELS.filter((l) => level >= l).length;

export type PropId =
  | 'pin2' | 'sacks' | 'sheeter' | 'mixer' | 'toppings' | 'prepBelt'
  | 'boxStack' | 'warmer' | 'tickets' | 'screen' | 'register2' | 'neon' | 'passBelt'
  | 'board' | 'hooks' | 'vehicle2' | 'wrap' | 'photo';

export interface StepDef { id: PropId; station: LadderStation; level: number; mount: Mount }

/**
 * The ladder. Steps the game already shows are not here: prep Lv 30 (3rd cook, from 31) and Lv 100 (gold hats), counter
 * Lv 20 (2nd cashier, from 16). Drivers' radio headsets (Lv 60) and gold helmets (Lv 100) are on people (people.tsx /
 * looks.ts), so they are not here either.
 */
export const STEPS: readonly StepDef[] = [
  { id: 'pin2', station: 'prep', level: 10, mount: 'bench' },
  { id: 'sacks', station: 'prep', level: 20, mount: 'floor' },
  { id: 'sheeter', station: 'prep', level: 40, mount: 'floor' },
  { id: 'mixer', station: 'prep', level: 60, mount: 'floor' },
  { id: 'toppings', station: 'prep', level: 80, mount: 'wall' },
  { id: 'prepBelt', station: 'prep', level: 120, mount: 'wall' },
  { id: 'boxStack', station: 'counter', level: 10, mount: 'counter' },
  { id: 'warmer', station: 'counter', level: 30, mount: 'wall' },
  { id: 'tickets', station: 'counter', level: 40, mount: 'wall' },
  { id: 'screen', station: 'counter', level: 60, mount: 'wall' },
  { id: 'register2', station: 'counter', level: 80, mount: 'counter' },
  { id: 'neon', station: 'counter', level: 100, mount: 'wall' },
  { id: 'passBelt', station: 'counter', level: 120, mount: 'wall' },
  { id: 'board', station: 'drivers', level: 10, mount: 'wall' },
  { id: 'hooks', station: 'drivers', level: 20, mount: 'wall' },
  { id: 'vehicle2', station: 'drivers', level: 30, mount: 'street' },
  { id: 'wrap', station: 'drivers', level: 40, mount: 'street' },
  { id: 'photo', station: 'drivers', level: 80, mount: 'wall' },
];

/** The dispatch board holds one pin per driver, up to this many. */
export const MAX_PINS = 12;

/** What the ladder reads from the shop, as primitives (FurnitureInputs carries the same fields). */
export interface LadderInput {
  /** The neighbourhood: its back window decides how low the belt along the counter wall can run. */
  id: NeighborhoodId;
  prepStep: number;
  counterStep: number;
  driverStep: number;
  /** Drivers shown as pins on the dispatch board (capped at MAX_PINS). */
  pins: number;
  /** City fleet tier (which vehicle is parked). */
  vehicle: number;
  /** The street props (second vehicle, wrap) only stand in a shop with a manager; an idle shop's sidewalk stays clear. */
  outside: boolean;
}

export const stepOf = (inp: LadderInput, station: LadderStation) => (station === 'prep' ? inp.prepStep : station === 'counter' ? inp.counterStep : inp.driverStep);

export interface Placed {
  id: PropId;
  station: LadderStation;
  mount: Mount;
  /** Screen anchor (bottom centre of the drawing), scale, and the painter's depth. */
  ax: number;
  ay: number;
  k: number;
  sortY: number;
  /** Extra number the drawing needs: pins on the board, half-length of a belt (screen units). */
  n: number;
  /** The drawing's bounding box on screen. */
  rect: Rect;
}

/** Each drawing's local bounding box (x right, y down; the anchor is the bottom centre). Belts take their length from `n`. */
export function bboxOf(id: PropId, n = 0): Rect {
  switch (id) {
    case 'pin2': return { x0: -12, y0: -4, x1: 12, y1: 1 };
    case 'sacks': return { x0: -11, y0: -23, x1: 11, y1: 2 };
    case 'sheeter': return { x0: -14, y0: -23, x1: 14, y1: 2 };
    case 'mixer': return { x0: -10, y0: -32, x1: 10, y1: 2 };
    case 'toppings': return { x0: -26, y0: -14, x1: 26, y1: 1 };
    case 'prepBelt':
    case 'passBelt': return { x0: -n, y0: -8.6, x1: n, y1: 0 };
    case 'boxStack': return { x0: -7.5, y0: -15, x1: 7.5, y1: 1 };
    case 'warmer': return { x0: -9, y0: -13.5, x1: 9, y1: 1 };
    case 'tickets': return { x0: -9, y0: -12, x1: 9, y1: 1 };
    case 'screen': return { x0: -9, y0: -13.5, x1: 9, y1: 1 };
    case 'register2': return { x0: -11, y0: -23, x1: 11, y1: 1 };
    case 'neon': return { x0: -19, y0: -12, x1: 19, y1: 2 };
    case 'board': return { x0: -11, y0: -23, x1: 11, y1: 1 };
    case 'hooks': return { x0: -18, y0: -26, x1: 18, y1: 1 };
    case 'photo': return { x0: -7, y0: -19, x1: 7, y1: 1 };
    case 'vehicle2':
    case 'wrap': return { x0: -24, y0: -30, x1: 24, y1: 4 };
  }
}

const rectOf = (id: PropId, ax: number, ay: number, k: number, n: number): Rect => {
  const b = bboxOf(id, n);
  return { x0: ax + b.x0 * k, y0: ay + b.y0 * k, x1: ax + b.x1 * k, y1: ay + b.y1 * k };
};

export const hits = (a: Rect, b: Rect) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

// ---------- what a prop must stay clear of ----------

/** A standing figure's screen box (feet at the room point), as the crowd budget draws it: ~22 wide, `h` tall at depth scale. */
export function figureBox(x: number, y: number, h = 52): Rect {
  const [sx, sy] = P(x, y);
  const k = kAt(y) * 1.14;
  return { x0: sx - 11 * k, x1: sx + 11 * k, y0: sy - h * k, y1: sy };
}
/** The top 40% of a figure's box: the head and shoulders. */
export const headBox = (b: Rect): Rect => ({ ...b, y1: b.y0 + (b.y1 - b.y0) * 0.4 });

/** The doormat's screen box, from the corners Doormat draws (room y −8 … −22). */
export function matRect(lay: Layout): Rect {
  const c = [P(lay.door.x0 + 2, -8), P(lay.door.x1 - 2, -8), P(lay.door.x1 + 1, -22), P(lay.door.x0 - 1, -22)];
  return { x0: Math.min(...c.map((p) => p[0])), x1: Math.max(...c.map((p) => p[0])), y0: Math.min(...c.map((p) => p[1])), y1: Math.max(...c.map((p) => p[1])) };
}

/** The entrance on the front plane: jambs, the glazed leaf and the shop window above it, down to the floor. */
export function doorRect(lay: Layout): Rect {
  return { x0: P(lay.door.x0 - 8, 0)[0], x1: P(lay.R - 8, 0)[0], y0: P(0, 0, 196)[1], y1: P(0, 0)[1] + 8 };
}

/** The menu board (shops from the Corner shop up): room.tsx clamps it between the oven hood and the brick pier. */
export function menuRect(lay: Layout): Rect | null {
  if (lay.fp < 1) return null;
  const [mx0, my] = P(lay.counter.x0 + 4, D, 180);
  const hoodRight = P(lay.ovenCols[lay.ovenCols.length - 1].x1 + 6, D - 6)[0];
  const pierLeft = P(lay.door.x0 - 8, 0)[0];
  const mw = Math.max(40, Math.min(56, pierLeft - 6 - (hoodRight + 6) ));
  const mx = Math.min(Math.max(mx0 - 24, hoodRight + 6), pierLeft - 6 - mw);
  return { x0: mx, y0: my, x1: mx + mw, y1: my + (40 * mw) / 56 };
}

/** The back window with its sill, net or arch: the Waterfront's porthole hangs a net (and floats) to wy + 78, Uptown's arch sits 20 lower (sill ends at wy + 61.4). */
export function windowRect(lay: Layout, id: NeighborhoodId): Rect {
  const [wx, wy] = P(lay.counter.x1 - 50, D, 132);
  return { x0: wx - 3, y0: wy - 6, x1: wx + 43, y1: wy + (id === 'waterfront' ? 78 : id === 'uptown' ? 61.5 : 38) };
}

/** The badge rail with its rings and count pills. */
export function badgeBand(lay: Layout): Rect {
  const xs = badgeXs(lay);
  const y = badgeRowY();
  return { x0: xs.prep - BADGE_R - 8, y0: y - 15, x1: xs.counter + BADGE_R + 40, y1: y + 15 };
}

/** Everyone who stands in a fixed place: the kitchen crew, the counter staff, seated diners and the order spots. */
export function fixedPeople(lay: Layout): { y: number; box: Rect; head: Rect }[] {
  const out: { y: number; box: Rect; head: Rect }[] = [];
  const add = (x: number, y: number, h = 52) => {
    const box = figureBox(x, y, h);
    out.push({ y, box, head: headBox(box) });
  };
  const cookY = lay.cooks.length === 1 ? 74 : 92;
  lay.cooks.forEach((x, i) => add(x, cookY + (i % 2) * 8, 56));
  lay.bakers.forEach((b) => add(b.x, b.y, 56));
  lay.staff.forEach((x) => add(x, 92));
  lay.orderSpots.forEach(([x, y]) => add(x, y));
  for (const tb of lay.tables) {
    add(tb.x - SEAT, tb.y, 40);
    add(tb.x + SEAT, tb.y, 40);
  }
  return out;
}

/** Where a driver stands at each pickup spot. */
export const spotBoxes = (lay: Layout): Rect[] => lay.spots.map((s) => figureBox(s.x, s.y));

// ---------- placement ----------

/** Back-wall bands: the right-hand segment beside the window (driver props, the neon sign) and the strip left of the window. */
function wallZones(lay: Layout) {
  const [wx] = P(lay.counter.x1 - 50, D, 132);
  const hoodRight = P(lay.ovenCols[lay.ovenCols.length - 1].x1 + 6, D - 6)[0];
  const pierLeft = P(lay.door.x0 - 8, 0)[0];
  return {
    right: { x0: wx + 43, x1: P(lay.R, D)[0] - 4 },
    left: { x0: hoodRight + 3.2, x1: wx - 4 },
    /** The belt along the wall above the counter runs to the doorway window's left edge. */
    passX1: pierLeft - 3,
  };
}

// Rows on the wall (screen y of each drawing's bottom edge). Heads start at ~300 and the station rects at 295, the menu
// ends at ~228, the door window starts at 270 and the pantry shelf ends at ~259.
const ROW = { neon: 205, board: 231, hooks: 263, screen: 248, warmer: 266, tickets: 283, passBelt: 296, rail: 280, prepBelt: 292 };

/** Floor props stand in a strip in front of the prep bench, left to right, each in its own fixed slot. */
const STRIP_Y = 55;
const STRIP: { id: PropId; w: number }[] = [
  { id: 'sacks', w: 22 },
  { id: 'sheeter', w: 28 },
  { id: 'mixer', w: 20 },
];
const STRIP_GAP = 3;

/** Every ladder prop at its spot for this layout, whether or not its level is reached. `ok` is false where it would not fit. */
export type Candidate = Placed & { ok: boolean; why: string[] };
export function candidates(lay: Layout, inp: Pick<LadderInput, 'id' | 'pins' | 'outside'>): Candidate[] {
  const out: Candidate[] = [];
  const push = (id: PropId, ax: number, ay: number, k: number, sortY: number, n = 0) => {
    const def = STEPS.find((s) => s.id === id)!;
    out.push({ id, station: def.station, mount: def.mount, ax, ay, k, sortY, n, rect: rectOf(id, ax, ay, k, n), ok: true, why: [] });
  };
  const z = wallZones(lay);
  const { prep, counter } = lay;

  // prep: a second rolling pin on the bench's front edge, floor gear in a strip in front of the bench, bins and a belt on the wall
  {
    const [bx, by] = P(prep.x0 + (prep.x1 - prep.x0) * 0.3, 67.5, 28);
    push('pin2', bx, by, kAt(67.5) * 1.1, 65.4);
    let x = prep.x0 + 2;
    for (const s of STRIP) {
      const [sx, sy] = P(x + s.w / 2, STRIP_Y);
      push(s.id, sx, sy, kAt(STRIP_Y), STRIP_Y);
      x += s.w + STRIP_GAP;
    }
    // wall gear spans the bench but stops short of the oven bank's tap area
    const b0 = P(prep.x0, D)[0];
    const b1 = Math.min(P(prep.x1 + 2, D)[0], stationRects(lay, 44).oven.x0 - 2);
    push('toppings', (b0 + b1) / 2, ROW.rail, 1, D + 1);
    push('prepBelt', (b0 + b1) / 2 + 2, ROW.prepBelt, 1, D + 1, (b1 - b0 - 4) / 2);
  }

  // counter: boxes on the counter's left end, a second register beside the first, trays and screens on the wall left of the window
  {
    const [sx, sy] = P(counter.x0 + 10, 72, 38);
    push('boxStack', sx, sy, kAt(72), 63.4);
    const [rx, ry] = P(counter.x0 + 50, 70, 38);
    push('register2', rx, ry, kAt(70), 63.3);
    const cx = (z.left.x0 + z.left.x1) / 2;
    push('screen', cx, ROW.screen, 1, D + 1);
    push('warmer', cx, ROW.warmer, 1, D + 1);
    push('tickets', cx, ROW.tickets, 1, D + 1);
    push('neon', (z.right.x0 + z.right.x1) / 2, ROW.neon, 1, D + 1);
    const p0 = z.left.x0 + 0.3;
    const p1 = z.passX1;
    push('passBelt', (p0 + p1) / 2, ROW.passBelt, 1, D + 1, (p1 - p0) / 2);
  }

  // drivers: dispatch board, jacket rail and the photo on the right-hand wall segment; a second vehicle beside the parked one
  {
    push('board', z.right.x0 + 11, ROW.board, 1, D + 1, inp.pins);
    push('hooks', (z.right.x0 + z.right.x1) / 2, ROW.hooks, 1, D + 1);
    push('photo', z.right.x1 - 7, ROW.board, 1, D + 1);
    const [vx, vy] = P(lay.scooter.x, lay.scooter.y);
    push('wrap', vx, vy, 1, lay.scooter.y - 0.1);
    // nose to tail with the first, a little left of it and drawn just behind it, clear of the doormat and the walkers' turn-in
    const [wx, wy] = P(lay.scooter.x - 24, lay.scooter.y);
    push('vehicle2', wx, wy, 1, lay.scooter.y + 0.1);
  }

  const blockers = obstacles(lay, inp.id);
  const people = fixedPeople(lay);
  const rects = stationRects(lay, 44);
  const strip = { x0: P(prep.x0, STRIP_Y)[0] - 3, x1: P(prep.x1 + 4, STRIP_Y)[0] + 3 };
  const w = wallZones(lay);
  const zoneOf: Partial<Record<PropId, { x0: number; x1: number }>> = { screen: w.left, warmer: w.left, tickets: w.left, neon: w.right, board: w.right, hooks: w.right, photo: w.right };
  const spots = spotBoxes(lay);
  for (const c of out) {
    const why: string[] = [];
    // everything: clear of the badge rail, the doorway (jambs, window, leaf), the doorway plank, the mat and the pickup spots
    blockers.all.forEach((b, i) => hits(c.rect, b) && why.push(`blocker ${i}`));
    spots.forEach((b, i) => hits(c.rect, b) && why.push(`spot ${i}`));
    // never over another station's tap area (a prop may stand in its own station's)
    const own = c.station === 'drivers' ? '' : c.station;
    for (const st of ['prep', 'oven', 'counter'] as const) if (st !== own && hits(c.rect, rects[st])) why.push(`${st} rect`);
    if (c.mount === 'wall') {
      blockers.wall.forEach((b, i) => hits(c.rect, b) && why.push(`wall ${i}`));
      const zn = zoneOf[c.id];
      if (zn && (c.rect.x0 < zn.x0 - 0.01 || c.rect.x1 > zn.x1 + 0.01)) why.push('zone');
      if (c.id === 'toppings' || c.id === 'prepBelt') {
        if (c.rect.x0 < P(prep.x0, D)[0] - 0.01 || c.rect.x1 > P(prep.x1 + 2, D)[0] + 0.01) why.push('over the bench');
      }
      if (c.id === 'passBelt' && c.rect.x1 - c.rect.x0 < 24) why.push('too short');
    } else if (c.mount === 'floor') {
      if (c.rect.x0 < strip.x0 || c.rect.x1 > strip.x1) why.push('strip');
    }
    // props drawn over people must stay off their heads: only people standing deeper than the prop can be covered
    if (c.mount !== 'wall' && c.mount !== 'street') for (const p of people) if (p.y > c.sortY && hits(c.rect, p.head)) why.push('head');
    if (c.id === 'register2' && counter.x1 - counter.x0 < 60) why.push('counter too short');
    c.why = why;
    c.ok = why.length === 0;
  }
  return out;
}

/** The fixed rectangles on screen props must not cover. `wall` ones are only for back-wall props (they are drawn over the wall's own decor). */
export function obstacles(lay: Layout, id: NeighborhoodId): { all: Rect[]; wall: Rect[] } {
  const sign = doorwaySignRect(lay);
  const all = [badgeBand(lay), doorRect(lay), sign, matRect(lay)];
  const ov0 = lay.ovenCols[0].x0;
  const ov1 = lay.ovenCols[lay.ovenCols.length - 1].x1;
  const menu = menuRect(lay);
  const wall: Rect[] = [
    ...(menu ? [menu] : []),
    windowRect(lay, id),
    // the oven bank, its hood and flue: a full-height column
    { x0: P(ov0, D - 6)[0] - 3, y0: 100, x1: P(ov1 + 6, D - 6)[0] + 3, y1: 340 },
    // the pantry shelf and its sacks on the left wall
    { x0: P(lay.L + 14, D)[0] - 1, y0: 226, x1: P(lay.L + 104, D)[0] + 1, y1: 259 },
  ];
  return { all, wall };
}

/** The props to draw for these ladder steps in this layout, back to front by `sortY` is the caller's job. */
export function ladderProps(lay: Layout, inp: LadderInput): Placed[] {
  const placed: Placed[] = [];
  for (const c of candidates(lay, inp)) {
    const def = STEPS.find((s) => s.id === c.id)!;
    if (!c.ok || stepOf(inp, def.station) <= LADDER_LEVELS.indexOf(def.level as (typeof LADDER_LEVELS)[number])) continue;
    if (def.mount === 'street' && !inp.outside) continue;
    if (placed.some((p) => p.id !== 'wrap' && c.id !== 'wrap' && hits(p.rect, c.rect))) continue;
    const { ok, why, ...rest } = c;
    void ok;
    void why;
    placed.push(rest);
  }
  return placed;
}

/** Back-wall rectangles of the props currently shown, for keeping pills clear of them. */
export const wallRects = (placed: readonly Placed[]): Rect[] => placed.filter((p) => p.mount === 'wall').map((p) => p.rect);

/**
 * Centre x for a pill `w` wide at screen rows y0..y1 that stays on screen and off every `avoid` rect: the nearest
 * clear x to `x`, or `x` clamped to the screen when nothing is clear.
 */
export function clearPillX(x: number, w: number, y0: number, y1: number, avoid: readonly Rect[]): number {
  const lo = 4 + w / 2;
  const hi = SCENE_W - 4 - w / 2;
  const clamp = (v: number) => Math.min(hi, Math.max(lo, v));
  const blocked = (c: number) => avoid.some((r) => c - w / 2 < r.x1 && c + w / 2 > r.x0 && y0 < r.y1 && y1 > r.y0);
  const start = clamp(x);
  if (!blocked(start)) return start;
  const tries = avoid.flatMap((r) => [clamp(r.x0 - 2 - w / 2), clamp(r.x1 + 2 + w / 2)]).filter((c) => !blocked(c));
  if (!tries.length) return start;
  return tries.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a));
}

// ---------- per-buy bounce ----------

export const BOUNCE_SECONDS = 0.6;
export const BOUNCE_STEPS = 8;
/** Which of the BOUNCE_STEPS a bounce `age` seconds old is in, or −1 when it is over (or not started). */
export const bounceStep = (age: number) => (age < 0 || age >= BOUNCE_SECONDS ? -1 : Math.floor((age / BOUNCE_SECONDS) * BOUNCE_STEPS));
/** Scale at the middle of a step: 1 → 1.06 → 1. */
export const bounceScale = (step: number) => 1 + 0.06 * Math.sin(Math.PI * ((step + 0.5) / BOUNCE_STEPS));
/** One transform string per step about the screen point `base`, built once per layout (never per frame). */
export function bounceTransforms(base: readonly [number, number]): string[] {
  const [bx, by] = base;
  return Array.from({ length: BOUNCE_STEPS }, (_, i) => `translate(${bx.toFixed(1)} ${by.toFixed(1)}) scale(${bounceScale(i).toFixed(4)}) translate(${(-bx).toFixed(1)} ${(-by).toFixed(1)})`);
}

/** The "Lv N" chip rises this far over this long. */
export const CHIP_RISE = 20;
export const CHIP_SECONDS = 0.8;

// ---------- milestone moments ----------

export type MilestoneStation = Station;
export const isMilestone = (level: number) => (TUNING.milestones as readonly number[]).includes(level);
/** The highest milestone a jump from `before` to `after` crossed, or null. */
export function crossedMilestone(before: number, after: number): number | null {
  const hit = TUNING.milestones.filter((m) => before < m && after >= m);
  return hit.length ? hit[hit.length - 1] : null;
}

/** What the station's head says at 25 / 50 / 100 (each at most 30 characters). */
export const MILESTONE_LINES: Record<Station, Record<number, string>> = {
  prep: { 25: 'Double batch, capo!', 50: 'The dough never stops!', 100: 'A hundred! Mamma mia!' },
  oven: { 25: 'Twice the heat!', 50: 'The bricks are singing!', 100: 'Hotter than the sun!' },
  counter: { 25: 'Two lines, no waiting!', 50: 'Orders to the ceiling!', 100: 'Everyone gets served!' },
};

/** Who speaks: the station's head if hired; in Downtown, Nonna when not; otherwise nobody. */
export function milestoneSpeaker(hired: boolean, headName: string, downtown: boolean): string | null {
  return hired ? headName : downtown ? 'Nonna' : null;
}

export const CONFETTI_N = 14;
export const CONFETTI_SECONDS = 1.5;
export const CONFETTI_STEPS = 12;
export interface ConfettiPiece { w: number; h: number; tone: 0 | 1 | 2 }
/** Seeded once: the same fourteen pieces every burst (size and tone). */
export const CONFETTI: readonly ConfettiPiece[] = Array.from({ length: CONFETTI_N }, (_, i) => ({
  w: 2.6 + (hash32(i * 17 + 3) % 3),
  h: 5 + (hash32(i * 17 + 5) % 4),
  tone: (hash32(i * 17 + 9) % 3) as 0 | 1 | 2,
}));
/** Per step, per piece: the transform at that moment (a toss up and out, gravity, a spin). Precomputed once at load. */
export const CONFETTI_FRAMES: readonly (readonly string[])[] = Array.from({ length: CONFETTI_STEPS }, (_, s) => {
  const t = ((s + 0.5) / CONFETTI_STEPS) * CONFETTI_SECONDS;
  return CONFETTI.map((_, i) => {
    const a = -Math.PI * (0.08 + (0.84 * ((i * 5) % CONFETTI_N)) / (CONFETTI_N - 1));
    const v = 55 + (hash32(i * 31 + 1) % 45);
    const dx = Math.cos(a) * v * t;
    const dy = Math.sin(a) * v * t + 0.5 * 150 * t * t;
    const rot = ((hash32(i * 31 + 7) % 360) + t * (240 + (hash32(i * 31 + 9) % 200))) % 360;
    return `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${rot.toFixed(0)})`;
  });
});
/** Confetti fades over its last quarter. */
export const CONFETTI_OPACITY: readonly number[] = Array.from({ length: CONFETTI_STEPS }, (_, s) => {
  const k = (s + 0.5) / CONFETTI_STEPS;
  return k > 0.75 ? Math.round(((1 - k) / 0.25) * 10) / 10 : 1;
});
export const confettiStep = (age: number) => (age < 0 || age >= CONFETTI_SECONDS ? -1 : Math.floor((age / CONFETTI_SECONDS) * CONFETTI_STEPS));
/** The three fills of a neighbourhood's colour: itself, lighter, darker. */
export const confettiFills = (color: string): [string, string, string] => [color, shade(color, 0.4), shade(color, -0.3)];
