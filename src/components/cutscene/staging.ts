// Cut-scene staging: where each waist-up figure stands in a panel, and which gesture a mood gets.
// Pure so the layout rules (centred / 30–70 %, nothing cropped through a face or chest) are tested in node.
import type { Mood } from '../../content/types';

/** The 'stage' portrait art box (Portrait variant="stage" draws in viewBox 0 0 w h). */
export const STAGE_VB = { w: 120, h: 150 } as const;
/** Parts of the figure, in art units, that must never be cut by the panel edge (hats and hands included in the face box). */
export const FACE_BOX = { x0: 34, x1: 86, y0: 2, y1: 68 } as const;
export const CHEST_BOX = { x0: 28, x1: 92, y0: 74, y1: 112 } as const;

/** Figure height as a share of the panel's inner height (spec: 48–52 %). */
export const FIGURE_SHARE = 0.5;
/** Where the cast stands, as a share of the panel width. */
export const SLOTS: Record<1 | 2, readonly number[]> = { 1: [0.5], 2: [0.3, 0.7] };
export const LISTENER_SCALE = 0.92;

export type Pose = 'down' | 'thumb' | 'clasp' | 'point' | 'hands-up';
/** One gesture per mood. */
export const POSE: Record<Mood, Pose> = { neutral: 'down', happy: 'thumb', sad: 'clasp', angry: 'point', surprised: 'hands-up' };

export interface Placement {
  /** Left edge and size of the figure's box in px, standing on the panel bottom. */
  left: number;
  width: number;
  height: number;
  /** Centre x in px. */
  cx: number;
  scale: number;
  dim: boolean;
  flip: boolean;
  z: number;
}

/** Panel border (ink) in pt; the art sits inside it. */
export const PANEL_BORDER = 3;

/** Outer panel size for a window: up to 520 wide, tall (~55 % of the screen) but never squatter than 4:3 or taller than 1:1.45. */
export function panelSize(winW: number, winH: number, insetTop: number) {
  const w = Math.min(winW - 24, 520);
  const h = Math.max(w * 0.75, Math.min(winH * 0.66 - insetTop, w * 1.45));
  return { w, h, innerW: w - 2 * PANEL_BORDER, innerH: h - 2 * PANEL_BORDER };
}

/**
 * Figures for a panel of `w`×`h` px (inner size). The speaker stands in front at scale 1; a listener at 0.92, dimmed.
 * Two figures face each other (the right one is flipped). Height is 50 % of the panel unless the panel is so narrow that
 * two chests would touch, then it shrinks to fit.
 */
export function stageLayout(count: number, w: number, h: number, speaker: number): Placement[] {
  const n = Math.min(2, Math.max(0, count)) as 0 | 1 | 2;
  if (n === 0) return [];
  const aspect = STAGE_VB.w / STAGE_VB.h;
  let height = h * FIGURE_SHARE;
  if (n === 2) {
    // chest half-width in px must stay under half the gap between the two slots, with a little air
    const chestHalf = ((CHEST_BOX.x1 - CHEST_BOX.x0) / 2 / STAGE_VB.w) * aspect; // per px of height
    const gap = (SLOTS[2][1] - SLOTS[2][0]) * w;
    height = Math.min(height, (gap * 0.46) / chestHalf);
  }
  // a single figure never gets wider than the panel
  height = Math.min(height, (w * 0.96) / aspect);
  const width = height * aspect;
  return SLOTS[n].map((share, i) => {
    const cx = share * w;
    const talking = speaker === -1 || speaker === i || n === 1;
    return { left: cx - width / 2, width, height, cx, scale: talking ? 1 : LISTENER_SCALE, dim: !talking, flip: n === 2 && i === 1, z: talking ? 2 : 1 };
  });
}

/** Horizontal share of the panel the speech-bubble tail points at (the speaker's slot; centre for narration). */
export function tailShare(count: number, speaker: number): number {
  if (count <= 1 || speaker < 0) return 0.5;
  return SLOTS[2][Math.min(1, speaker)];
}

/** A figure's box (art units) mapped to panel px, after its scale about the bottom centre. */
export function boxInPanel(p: Placement, box: { x0: number; x1: number; y0: number; y1: number }, panelH: number) {
  const k = (p.height / STAGE_VB.h) * p.scale;
  const top = panelH - p.height * p.scale;
  // flipping mirrors the art about the figure's centre line
  const x0 = p.flip ? STAGE_VB.w - box.x1 : box.x0;
  const x1 = p.flip ? STAGE_VB.w - box.x0 : box.x1;
  return { x0: p.cx + (x0 - STAGE_VB.w / 2) * k, x1: p.cx + (x1 - STAGE_VB.w / 2) * k, y0: top + box.y0 * k, y1: top + box.y1 * k };
}
