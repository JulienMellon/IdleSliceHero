// Industrial's oven jam as plain data: the wrench's label, where the smoke and the wrench stand on the oven bank, and the two pulses
// (`jam`, `jamfixed`) the audio lane listens for. Pure: unit-tested in node.
import { BUTTON_H } from '../university/layer-model';
import type { JamView } from '../../../engine/features/layers/industrial-shifts';
import type { Layout } from '../../scene/layout';
import { D, P } from '../../scene/projection';
import { fill } from '../../report/report-model';
import { COPY } from './copy';

/** The wrench button is a 44 pt target. */
export const WRENCH = BUTTON_H;

/** The label by the wrench: the Head Baker's countdown when one is hired ("Head Baker fixing… 12s"), else the alert; null with no jam. */
export function jamLabel(v: Pick<JamView, 'jammed' | 'autoFixIn'>): string | null {
  if (!v.jammed) return null;
  return v.autoFixIn !== null ? fill(COPY['layer.industrial.jam.headfix'], { n: v.autoFixIn }) : COPY['layer.industrial.jam.alert'];
}

/**
 * The jammed oven in scene units: the last oven of the shop's bank (`lay.ovens`, the room the storefront draws), at the front of its deck.
 * `y` is its middle (the wrench stands there), `top` the height of its top edge (the smoke starts there).
 */
export function ovenSpot(lay: Pick<Layout, 'ovens'>): { x: number; y: number; top: number } {
  const o = lay.ovens[lay.ovens.length - 1];
  const cx = (o.x0 + o.x1) / 2;
  const [x, y] = P(cx, D - 6, o.z + o.h / 2);
  const [, top] = P(cx, D - 6, o.z + o.h);
  return { x, y, top };
}

/** A pill over the scene (the jam's label, the critic's chip): `text` at 10 pt in a box centred on `cx`, kept `edge` pt inside a scene `width` wide. */
export function pillBox(width: number, cx: number, text: string, edge = 8): { left: number; width: number } {
  const w = Math.min(width - 2 * edge, Math.ceil(text.length * 6.2 + 16));
  return { left: Math.max(edge, Math.min(width - edge - w, cx - w / 2)), width: w };
}

/** Which pulse a change of the jam flag makes: null the first time it is seen (a save that loads jammed is not a new jam). */
export function jamEdge(prev: boolean | null, now: boolean): 'jam' | 'jamfixed' | null {
  if (prev === null || prev === now) return null;
  return now ? 'jam' : 'jamfixed';
}
