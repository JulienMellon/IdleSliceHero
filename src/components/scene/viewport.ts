// What a scrolled wide shop shows (v5.18, card V2): the part of the drawing on screen, in the draw space, and how a sign or a bubble that is wider than the
// edge it stands at slides inside it (D511, D512). Pure: tested in node. A one-screen shop does not scroll, so its span is its whole drawing and nothing moves.
import type { Layout } from './layout';
import { FRONT_TOP, P, screenToScene, type SceneFit } from './projection';

export interface Span {
  x0: number;
  x1: number;
}
/** Clear space (pt) kept between a sign or a bubble and the screen's edge. */
export const VIEW_MARGIN = 12;

/**
 * The draw-space span on screen: the view `viewW` pt wide scrolled `scrollX`, `margin` pt in from each edge, inside `bounds` (the drawing's own edges). `shift` is the
 * draw space's distance to the frame's space (`drawShift`). With no scrolling (`scrolls` false) it is `bounds`.
 */
export function visibleSpan(
  scrolls: boolean,
  scrollX: number,
  viewW: number,
  fit: Pick<SceneFit, 's' | 'ox'>,
  shift: number,
  bounds: Span,
  margin = VIEW_MARGIN,
): Span {
  if (!scrolls) return bounds;
  const x0 = screenToScene(margin, scrollX, fit) - shift;
  const x1 = screenToScene(viewW - margin, scrollX, fit) - shift;
  return { x0: Math.max(bounds.x0, x0), x1: Math.min(bounds.x1, x1) };
}

/**
 * What a scene overlay may use of a scrolled wide shop (D512, C149, U25): the part of the scene `contentW` wide that is on screen, in the same pt as the overlay (the overlay
 * fills the content), `margin` in from each screen edge and inside [0, contentW]. `scrollX` is rounded so the span only changes when the shop moves a whole point. Null when
 * the shop does not scroll: the overlay then has the whole width.
 */
export function overlaySpan(scrolls: boolean, scrollX: number, viewW: number, contentW: number, margin = VIEW_MARGIN): Span | null {
  if (!scrolls) return null;
  const at = Math.round(scrollX);
  const clamp = (x: number) => Math.max(0, Math.min(contentW, x));
  return { x0: clamp(at + margin), x1: clamp(at + viewW - margin) };
}

/**
 * How far (dx, whole units) a thing `width` wide centred at `centre` slides to lie inside `span` and inside `limit` (the beam it hangs on). A thing wider than the span is centred
 * on it. Zero when it already fits.
 */
export function slideInto(centre: number, width: number, span: Span, limit: Span): number {
  const lo = Math.max(span.x0, limit.x0) + width / 2;
  const hi = Math.min(span.x1, limit.x1) - width / 2;
  const at = lo > hi ? (Math.max(span.x0, limit.x0) + Math.min(span.x1, limit.x1)) / 2 : Math.max(lo, Math.min(hi, centre));
  return Math.round(at - centre);
}

/** The sign's own measure: the fascia beam's span, the sign's width (it follows the name) and the beam's top and bottom (plain plan, draw space). */
export function fasciaSignBox(
  lay: Pick<Layout, 'L' | 'R'>,
  name: string,
): { fx0: number; fx1: number; fTop: number; fBot: number; fcx: number; signW: number } {
  const [fx0, fTop] = P(lay.L - 6, 0, FRONT_TOP);
  const [fx1, fBot] = P(lay.R + 6, 0, FRONT_TOP - 20);
  return { fx0, fx1, fTop, fBot, fcx: (fx0 + fx1) / 2, signW: Math.min(fx1 - fx0 - 40, 34 + name.length * 9.6 + 54) };
}

// ---------- the rival's shop across the street (D481) ----------

/**
 * Pt kept clear at the foot of the screen: the home indicator's safe area (34 pt on an iPhone) and a little air. The scene area runs to the screen's last row, so the far kerb
 * band, which is the scene's foot, is inside it; nothing the player is meant to read stands lower than this.
 */
export const FOOT_SAFE = 36;

/** The rival shop's drawing, in scene units: the shop and its kerb, and how far the pavement slab reaches past it on each side. */
export interface RivalBox {
  w: number;
  h: number;
  kerb: number;
  slab: number;
}

/**
 * Where the rival's shop stands (scene units): its left edge `x` and its top. It stands on the far kerb with the foot of the kerb `FOOT_SAFE` pt above the screen's last
 * row, and `margin` pt in from the screen's left edge: from the view's own left edge on a wide shop (`span`, the overlays' span in pt), so it is on screen however the
 * shop has been scrolled (D481: it was drawn at the drawing's left edge and was off screen in a wide shop that had been scrolled). `fit` is the content's fit, `sceneH` the scene's height.
 */
export function rivalPlace(
  fit: Pick<SceneFit, 's' | 'ox'>,
  sceneH: number,
  span: Span | null,
  shop: RivalBox,
  margin = VIEW_MARGIN,
): { x: number; top: number } {
  const leftPt = span ? span.x0 : margin;
  return { x: (leftPt - fit.ox) / fit.s + shop.slab, top: sceneH - FOOT_SAFE / fit.s - shop.kerb - shop.h };
}

// ---------- how much of a wide shop fits the screen (D519) ----------

/** The room's drawn extent across, in the frame's space: the front fascia's edges (the widest part of the cutaway), from the layout's walls. */
export function roomSpan(lay: Pick<Layout, 'L' | 'R' | 'frame'>): Span {
  return { x0: P(lay.L - 6, 0, FRONT_TOP, lay.frame)[0], x1: P(lay.R + 6, 0, FRONT_TOP, lay.frame)[0] };
}

/** A wide cutaway is drawn no smaller than this before the shop scrolls: smaller and the people are too small to read. */
export const WIDE_MIN_SCALE = 0.88;

/**
 * How a cutaway whose room spans `room` (pt at scale 1, at scroll 0) sits on a screen `viewW` wide with `margin` pt clear at each edge (D519): the scale that makes it fit, never under
 * `minScale`, and whether it still scrolls at that scale. Never above 1. Owner decision (D519): the game does not scale wide shops, they scroll; this is the measure the budget uses.
 */
export function wideFit(room: Span, viewW: number, margin = VIEW_MARGIN, minScale = WIDE_MIN_SCALE): { scale: number; scrolls: boolean } {
  const avail = viewW - 2 * margin;
  const width = room.x1 - room.x0;
  const scale = Math.max(minScale, Math.min(1, avail / width));
  return { scale, scrolls: width * scale > avail + 1e-9 };
}
