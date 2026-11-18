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
export function visibleSpan(scrolls: boolean, scrollX: number, viewW: number, fit: Pick<SceneFit, 's' | 'ox'>, shift: number, bounds: Span, margin = VIEW_MARGIN): Span {
  if (!scrolls) return bounds;
  const x0 = screenToScene(margin, scrollX, fit) - shift;
  const x1 = screenToScene(viewW - margin, scrollX, fit) - shift;
  return { x0: Math.max(bounds.x0, x0), x1: Math.min(bounds.x1, x1) };
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
export function fasciaSignBox(lay: Pick<Layout, 'L' | 'R'>, name: string): { fx0: number; fx1: number; fTop: number; fBot: number; fcx: number; signW: number } {
  const [fx0, fTop] = P(lay.L - 6, 0, FRONT_TOP);
  const [fx1, fBot] = P(lay.R + 6, 0, FRONT_TOP - 20);
  return { fx0, fx1, fTop, fBot, fcx: (fx0 + fx1) / 2, signW: Math.min(fx1 - fx0 - 40, 34 + name.length * 9.6 + 54) };
}
