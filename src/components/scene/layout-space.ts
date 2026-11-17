// Moving a whole room layout sideways in one place (v5.18, card V2), so nothing else has to know how:
//   - `reflectLayout`: the mirrored floor plan (kitchen on the right, door on the left). It is the layout's own last step, so the crew's routes, the tags,
//     the sidewalk and every budget mirror with it; the drawing code never mirrors anything itself. Reflecting twice gives the layout back.
//   - `toDrawSpace`: the same layout in the coordinates the drawing code's default `P` expects (see `drawFrame`): every x less the frame's shift.
// Both map every x the layout holds (room units, and the one screen x it keeps, `tagLeft`) through one function, so a new field is added here once.
import { drawFrame, drawShift, type SceneFrame } from './projection';
import type { Layout } from './layout';

type Pt = [number, number];
type Span = { x0: number; x1: number };

interface Mapping {
  /** Where an x goes. */
  f: (x: number) => number;
  /** The map reverses left and right (a reflection): spans swap their ends and left-to-right lists reverse. */
  flip: boolean;
  /** The frame the mapped layout stands in. */
  frame: SceneFrame;
  mirrored: boolean;
}

const span = (s: Span, m: Mapping): Span => (m.flip ? { x0: m.f(s.x1), x1: m.f(s.x0) } : { x0: m.f(s.x0), x1: m.f(s.x1) });
const pt = (p: Pt, m: Mapping): Pt => [m.f(p[0]), p[1]];

function mapLayout(lay: Layout, m: Mapping, tagLeft: number): Layout {
  const { f } = m;
  const door = lay.door;
  const ls = door.lanes;
  const ovenCols = lay.ovenCols.map((c) => span(c, m));
  return {
    ...lay,
    frame: m.frame,
    mirrored: m.mirrored,
    L: m.flip ? f(lay.R) : f(lay.L),
    R: m.flip ? f(lay.L) : f(lay.R),
    prep: span(lay.prep, m),
    prep2: lay.prep2 ? span(lay.prep2, m) : null,
    cooks: lay.cooks.map(f),
    ovens: lay.ovens.map((o) => ({ ...o, ...span(o, m) })),
    bay: span(lay.bay, m),
    ovenCols: m.flip ? ovenCols.reverse() : ovenCols,
    counter: span(lay.counter, m),
    staff: lay.staff.map(f),
    door: {
      ...span(door, m),
      cx: f(door.cx),
      lanes: { guestPauseX: f(ls.guestPauseX), driverPauseX: f(ls.driverPauseX), guestX: f(ls.guestX), guestVia: pt(ls.guestVia, m), driverX: f(ls.driverX), driverVia: pt(ls.driverVia, m) },
    },
    jamb: span(lay.jamb, m),
    spots: lay.spots.map((s) => ({ ...s, x: f(s.x) })),
    orderSpots: lay.orderSpots.map((p) => pt(p, m)),
    tables: lay.tables.map((t) => ({ ...t, x: f(t.x) })),
    bakers: lay.bakers.map((b) => ({ ...b, x: f(b.x) })),
    ledge: lay.ledge ? span(lay.ledge, m) : null,
    scooter: { ...lay.scooter, x: f(lay.scooter.x) },
    tree: { x: f(lay.tree.x) },
    sign: { x: f(lay.sign.x) },
    prop: { x: f(lay.prop.x) },
    patio: lay.patio.map((p) => ({ ...p, x: f(p.x) })),
    queue: lay.queue.map((p) => pt(p, m)),
    queueTag: pt(lay.queueTag, m),
    driverQueue: lay.driverQueue.map((p) => pt(p, m)),
    waitTag: pt(lay.waitTag, m),
    tagLeft,
    walk: { from: f(lay.walk.from), away: f(lay.walk.away) },
  };
}

/**
 * The layout as the mirrored floor plan: every x reflected about the room's centre (the vanishing point), the perspective being symmetric about it, so
 * a reflected room is exactly what a mirror would show. `tagLeft` is a place in the unmirrored plan (the pill functions in layout.ts un-reflect the layout before
 * they use it), so it stays as it is. Reflecting a mirrored layout gives back the plain one.
 */
export function reflectLayout(lay: Layout): Layout {
  const a = 2 * lay.frame.vanishX;
  return mapLayout(lay, { f: (x) => a - x, flip: true, frame: lay.frame, mirrored: !lay.mirrored }, lay.tagLeft);
}

const drawn = new WeakMap<Layout, Layout>();
/**
 * The layout in the draw space of its frame (`drawFrame`): what the storefront hands to the drawing code, the crew and the cast, inside a group moved right by
 * `drawShift`. A one-screen layout is its own draw space. Built once per layout.
 */
export function toDrawSpace(lay: Layout): Layout {
  const dx = drawShift(lay.frame);
  if (dx === 0) return lay;
  let d = drawn.get(lay);
  if (!d) {
    d = mapLayout(lay, { f: (x) => x - dx, flip: false, frame: drawFrame(lay.frame), mirrored: lay.mirrored }, lay.tagLeft > 0 ? lay.tagLeft - dx : 0);
    drawn.set(lay, d);
  }
  return d;
}

const plains = new WeakMap<Layout, Layout>();
/**
 * The plain plan of a layout (itself when it is the plain plan): the mirrored plan reflected back, once per layout. Code that places things by the plain plan's handed
 * rules (the wall props, the menu board, the visitor's spot) runs on this and reflects its answer with `flipRect` / `a - x`, `a = 2 * frame.vanishX`.
 */
export function plainOf(lay: Layout): Layout {
  if (!lay.mirrored) return lay;
  let p = plains.get(lay);
  if (!p) {
    p = reflectLayout(lay);
    plains.set(lay, p);
  }
  return p;
}
/** A screen rect reflected about the vertical line at x = a / 2. */
export const flipRect = <R extends { x0: number; x1: number }>(r: R, a: number): R => ({ ...r, x0: a - r.x1, x1: a - r.x0 });
