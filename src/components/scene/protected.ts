// The protected elements (v5.23b, card Q8): what nothing opaque may cover. The WELCOME mat (owner-required), the entrance, and the faces of the people who work at the
// stations. The critic log found the mat covered or removed about 8 times (G54, D232, D260, D276, D405, D456, D479 and the door overlaps G48 to G69), every time by eye.
// One rule, here, for the two checks that guard it:
//   - the scene test (`__tests__/protected.test.ts`) puts `protectedScene` against `sceneCovers`, the fixed scene things that are drawn on the sidewalk (the parked
//     vehicles, the A-frame, the neighbourhood prop, the patio, the worn cosmetics) and the screen-fixed strip and sidewalk row, over every city, neighbourhood, footprint,
//     managed or not, plan (mirrored or not) and screen size;
//   - the layout probe (scripts/shots_lib.py `cover`) reads `window.__protected`, which the storefront publishes from `protectedRects` through `publishProtected`, and asks
//     the page what is on top of each rect (that is how the HTML overlays, which the scene test cannot see, are caught).
// "Covered" is more than 10% of a protected rect's area under another opaque element that is not a walker passing by (the crowd budget's business).
// Pure (no react-native), so jest can test it. Everything in draw space (the `lay` the drawing code uses) unless a function says it is in page pixels.
import type { NeighborhoodId } from '../../content/types';
import { SIDEWALK_ROW } from '../tap-targets';
import { bboxOf, doorRect, fixedPeople, ladderProps, matRect, propRect, signRect, type LadderInput } from './ladder';
import type { Layout } from './layout';
import { neonSpot, plaqueRect } from './cosmetics';
import { UMBRELLA_TOP, deckBox, patioDeck } from './patio-deck';
import { CURB_Y, P, sceneToScreen, type SceneFit } from './projection';
import { stripRect } from './strip-clear';
import type { Rect } from './stations';

/** The most of a protected rect that may lie under a cover (a share of its area). */
export const COVER_MAX = 0.1;

export type ProtectedId = 'mat' | 'door' | 'face-cook' | 'face-baker' | 'face-counter';
export interface Named extends Rect {
  id: string;
}

const named = (id: string, r: Rect): Named => ({ id, ...r });

/**
 * The protected rects in scene units (draw space): the doormat, the entrance, and the head rect of each cook, baker and counter worker at their station
 * (`fixedPeople`'s own head boxes: the top 40% of the figure, so the face and the cap).
 */
export function protectedScene(lay: Layout): Named[] {
  const out: Named[] = [named('mat', matRect(lay)), named('door', doorRect(lay))];
  const people = fixedPeople(lay); // cooks, then bakers, then the counter staff, then the order spots and diners (not protected)
  let at = 0;
  for (const [id, n] of [
    ['face-cook', lay.cooks.length],
    ['face-baker', lay.bakers.length],
    ['face-counter', lay.staff.length],
  ] as const) {
    for (const p of people.slice(at, at + n)) out.push(named(id, p.head));
    at += n;
  }
  return out;
}

/** What `sceneCovers` needs to know about the shop. */
export interface CoverInputs {
  id: NeighborhoodId;
  /** The city's fleet tier (which vehicle is parked, and the second one beside it). */
  vehicle: number;
  /** The shop has no manager (and is not the city's first): its sidewalk keeps the hire stack and the street props are not drawn. */
  idleShop: boolean;
  /** The scene's scale on this screen (`sceneView(...).fit.s`): where the strip and the sidewalk row stand in scene units. */
  s: number;
  /** The scene area's height (pt): an unmanaged shop's strip stands at its top, so where that lies in scene units depends on it. */
  h: number;
}

/**
 * The things that are drawn over the scene at fixed places and must stay off the protected rects: the parked vehicle and its twin, the A-frame, the neighbourhood's prop,
 * the patio sets (deck and umbrella), the neon sign and the plaque, and, in scene units, the shop report's strip pill and the sidewalk row under it. The street things
 * are only drawn in a shop with a manager (`idleShop` false). The worst case is taken for what depends on the player (every ladder step, the cosmetics on, a live report).
 */
export function sceneCovers(lay: Layout, inp: CoverInputs): Named[] {
  const out: Named[] = [];
  const ladder: LadderInput = { id: inp.id, prepStep: 8, counterStep: 8, driverStep: 8, pins: 12, vehicle: inp.vehicle, outside: !inp.idleShop };
  if (!inp.idleShop) {
    const [vx, vy] = P(lay.scooter.x, lay.scooter.y);
    const b = bboxOf('wrap');
    out.push(named('vehicle', { x0: vx + b.x0, y0: vy + b.y0, x1: vx + b.x1, y1: vy + b.y1 }));
    for (const p of ladderProps(lay, ladder)) if (p.id === 'vehicle2') out.push(named('vehicle2', p.rect));
    out.push(named('sign', signRect(lay)), named('prop', propRect(lay)));
  }
  for (const t of lay.patio) {
    const d = deckBox(patioDeck(t));
    out.push(named('patio', { x0: d.x0, x1: d.x1, y0: P(t.x, t.y, UMBRELLA_TOP)[1], y1: d.y1 }));
  }
  out.push(named('neon', neonSpot(lay).rect), named('plaque', plaqueRect(lay)));
  const strip = stripRect(inp.s, inp.idleShop, inp.h);
  const raise = inp.idleShop ? SIDEWALK_ROW.raiseIdle : SIDEWALK_ROW.raiseManaged;
  const rowH = inp.idleShop ? SIDEWALK_ROW.idleStackHeight : SIDEWALK_ROW.cardHeight;
  const wide = { x0: -1e6, x1: 1e6 };
  out.push(named('strip', { ...wide, ...strip }));
  out.push(named('row', { ...wide, y0: CURB_Y - (raise + rowH) / inp.s, y1: CURB_Y - raise / inp.s }));
  return out;
}

/** The area of `a` that lies under `b`, as a share of `a`'s area. */
export function coveredShare(a: Rect, b: Rect): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  const area = (a.x1 - a.x0) * (a.y1 - a.y0);
  return w > 0 && h > 0 && area > 0 ? (w * h) / area : 0;
}

/** Every (protected, cover) pair where more than `COVER_MAX` of the protected rect lies under the cover: empty when the scene is clean. */
export function coverFindings(lay: Layout, inp: CoverInputs): { protectedId: string; coverId: string; share: number }[] {
  const covers = sceneCovers(lay, inp);
  const out: { protectedId: string; coverId: string; share: number }[] = [];
  for (const p of protectedScene(lay))
    for (const c of covers) {
      const share = coveredShare(p, c);
      if (share > COVER_MAX) out.push({ protectedId: p.id, coverId: c.id, share });
    }
  return out;
}

/**
 * The protected rects in page pixels (the space `document.elementFromPoint` reads), for the layout probe: scene units through `sceneToScreen`, the same mapping every
 * overlay anchored to the shop uses (coach-rects.ts), plus `origin`, where the scene view's top-left corner is on the page.
 */
export function protectedRects(lay: Layout, fit: SceneFit, scrollX = 0, origin: { x: number; y: number } = { x: 0, y: 0 }): Named[] {
  const shift = -lay.frame.x0;
  const sx = (x: number) => origin.x + sceneToScreen(x + shift, scrollX, fit);
  const sy = (y: number) => origin.y + fit.oy + y * fit.s;
  return protectedScene(lay).map((r) => ({ id: r.id, x0: sx(r.x0), y0: sy(r.y0), x1: sx(r.x1), y1: sy(r.y1) }));
}

/**
 * Publish the protected rects as `window.__protected` (an array of {id, x0, y0, x1, y1} in page pixels, a getter so it is read fresh: a scroll or a resize needs no
 * refresh). `read` returns the latest layout, fit, scroll and origin, or null when there is no scene. The layout probe reads it; nothing in the game does. Returns the
 * cleanup that removes it. A no-op outside a browser.
 */
export function publishProtected(read: () => { lay: Layout; fit: SceneFit; scrollX: number; origin: { x: number; y: number } } | null): () => void {
  const w = globalThis as unknown as { document?: unknown; __protected?: unknown };
  if (typeof w.document === 'undefined') return () => {};
  const get = () => {
    const a = read();
    return a ? protectedRects(a.lay, a.fit, a.scrollX, a.origin) : [];
  };
  Object.defineProperty(w, '__protected', { get, configurable: true });
  return () => {
    if (Object.getOwnPropertyDescriptor(w, '__protected')?.get === get) delete w.__protected;
  };
}
