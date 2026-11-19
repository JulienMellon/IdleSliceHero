// Industrial's oven jam as plain data: the wrench's label, where the smoke and the wrench stand on the oven bank, and the two pulses
// (`jam`, `jamfixed`) the audio lane listens for. Pure: unit-tested in node.
import { BUTTON_H } from '../menu/layer-model';
import type { JamView } from '../../../engine/features/layers/shifts';
import type { Layout } from '../../scene/layout';
import { D, P } from '../../scene/projection';
import { fill } from '../../report/report-model';
import { dressed } from '../../../content/copy';
import { COPY } from './copy';

/** The wrench button is a 44 pt target. */
export const WRENCH = BUTTON_H;

/** The label by the wrench: the Head Baker's countdown when one is hired ("Head Baker fixing… 12s"), else the alert; null with no jam. */
export function jamLabel(v: Pick<JamView, 'jammed' | 'autoFixIn'>, city?: string): string | null {
  if (!v.jammed) return null;
  return v.autoFixIn !== null
    ? fill(COPY['layer.industrial.jam.headfix'], { n: v.autoFixIn })
    : dressed(city, 'layer.industrial.jam.alert', COPY['layer.industrial.jam.alert']);
}

/**
 * The jammed oven in the draw space (`shopLayout(...).draw`, the room the storefront draws): the last oven of the shop's bank (`lay.ovens`), at the front of its deck.
 * `y` is its middle (the wrench stands there), `top` the height of its top edge (the smoke starts there).
 */
export function ovenSpot(lay: Pick<Layout, 'ovens'>): { x: number; y: number; top: number } {
  const o = lay.ovens[lay.ovens.length - 1];
  const cx = (o.x0 + o.x1) / 2;
  const [x, y] = P(cx, D - 6, o.z + o.h / 2);
  const [, top] = P(cx, D - 6, o.z + o.h);
  return { x, y, top };
}

/**
 * `ovenSpot` in the scene's own units, which is where an overlay drawn over the whole scene (the wrench, the puffs) stands: the draw-space layout's frame says how far
 * the draw space is moved right (`drawFrame`: its `x0` is minus that shift; 0 for a one-screen shop).
 */
export function wrenchSpot(draw: Pick<Layout, 'ovens' | 'frame'>): { x: number; y: number; top: number } {
  const at = ovenSpot(draw);
  return { x: at.x - draw.frame.x0, y: at.y, top: at.top };
}

/**
 * A pill over the scene (the jam's label, the critic's chip): `text` at 10 pt in a box centred on `cx`, kept `edge` pt inside a scene `width` wide. In a scrolled wide shop `view`
 * (the part on screen, already 12 pt in from the screen's edges: `overlaySpan`) replaces the edges, so the pill slides inside what the player sees (D512).
 */
export function pillBox(width: number, cx: number, text: string, edge = 8, view: { x0: number; x1: number } | null = null): { left: number; width: number } {
  const lo = view ? Math.max(0, view.x0) : edge;
  const hi = view ? Math.min(width, view.x1) : width - edge;
  const w = Math.min(hi - lo, Math.ceil(text.length * 6.2 + 16));
  return { left: Math.max(lo, Math.min(hi - w, cx - w / 2)), width: w };
}

/** Which pulse a change of the jam flag makes: null the first time it is seen (a save that loads jammed is not a new jam). */
export function jamEdge(prev: boolean | null, now: boolean): 'jam' | 'jamfixed' | null {
  if (prev === null || prev === now) return null;
  return now ? 'jam' : 'jamfixed';
}
