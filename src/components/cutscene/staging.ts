// Cut-scene staging: where each waist-up figure stands in a panel, and which gesture a mood gets.
// Pure so the layout rules (centred / 30–70 %, nothing cropped through a face or chest) are tested in node.
import type { CharacterId, Mood } from '../../content/types';

/** The 'stage' portrait art box (Portrait variant="stage" draws in viewBox 0 0 w h). */
export const STAGE_VB = { w: 120, h: 150 } as const;
export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
/**
 * Parts of the figure, in art units, that must never be cut by the panel edge or covered by the other figure: the head
 * with its ears, hair and the widest hat brim (the cap's peak), and the chest.
 */
export const FACE_BOX: Box = { x0: 30, x1: 96, y0: 2, y1: 68 };
export const CHEST_BOX: Box = { x0: 28, x1: 92, y0: 74, y1: 112 };

/** Figure height as a share of the panel's inner height (spec: 48–52 %). */
export const FIGURE_SHARE = 0.5;
/** Where the cast stands, as a share of the panel width. */
export const SLOTS: Record<1 | 2, readonly number[]> = { 1: [0.5], 2: [0.3, 0.7] };
export const LISTENER_SCALE = 0.92;

export type Pose = 'down' | 'thumb' | 'clasp' | 'point' | 'hands-up' | 'collar' | 'card';
/** One gesture per mood. */
export const POSE: Record<Mood, Pose> = { neutral: 'down', happy: 'thumb', sad: 'clasp', angry: 'point', surprised: 'hands-up' };
/** A character whose gesture for a mood differs from everyone else's (Marisol worries with a hand at her collar, Nonna wrings her hands). */
const POSE_OVERRIDE: Partial<Record<CharacterId, Partial<Record<Mood, Pose>>>> = { marisol: { sad: 'collar' } };

/** The pose for a character in a mood; a character holding a prop (the recipe card) holds it at chest height whatever the mood. */
export function poseFor(id: CharacterId, mood: Mood, holding?: 'recipe-card'): Pose {
  if (holding) return 'card';
  return POSE_OVERRIDE[id]?.[mood] ?? POSE[mood];
}

/**
 * Both hands of each pose, ink outline included, and the whole limbs (arm sleeves with their ink, plus the hands), in art units
 * for the unflipped figure (its inner side, the one facing the other figure, is the right). Measured from the art in
 * figure-art.ts; the staging tests re-measure them so they can't drift.
 */
export const HANDS_BOX: Record<Pose, Box> = {
  down: { x0: 19.2, x1: 100.8, y0: 125.6, y1: 142.4 },
  thumb: { x0: 19.2, x1: 103.8, y0: 69.7, y1: 142.4 },
  clasp: { x0: 46.4, x1: 73.6, y0: 110.9, y1: 129.9 },
  point: { x0: 25.2, x1: 108.8, y0: 83.2, y1: 139.8 },
  'hands-up': { x0: 13.2, x1: 106.8, y0: 44.9, y1: 67.3 },
  collar: { x0: 19.2, x1: 79.9, y0: 75.3, y1: 142.4 },
  card: { x0: 34.7, x1: 85.3, y0: 88.5, y1: 114.9 },
};
export const LIMBS_BOX: Record<Pose, Box> = {
  down: { x0: 18.8, x1: 101.2, y0: 78.2, y1: 142.4 },
  thumb: { x0: 18.8, x1: 103.8, y0: 69.7, y1: 142.4 },
  clasp: { x0: 25.4, x1: 94.6, y0: 78.2, y1: 129.9 },
  point: { x0: 11.2, x1: 108.8, y0: 78.2, y1: 139.8 },
  'hands-up': { x0: 13.2, x1: 106.8, y0: 44.9, y1: 93.8 },
  collar: { x0: 18.8, x1: 105.8, y0: 75.3, y1: 142.4 },
  card: { x0: 24.4, x1: 95.6, y0: 78.2, y1: 114.9 },
};
/** Air kept between one figure's limbs and the other figure, in px. */
export const LIMB_CLEARANCE = 8;
/** How far a pose reaches toward the other figure, from the figure's centre line (never less than the head and chest). */
function reachOf(pose?: Pose): number {
  const poses = pose ? [pose] : (Object.keys(LIMBS_BOX) as Pose[]);
  return Math.max(FACE_BOX.x1, CHEST_BOX.x1, ...poses.map((q) => LIMBS_BOX[q].x1)) - STAGE_VB.w / 2;
}

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

/** The caption box laid over the top of a panel (cutscene-player styles read these): inset, border, padding and text metrics in pt. */
export const CAPTION = { top: 8, border: 2.5, padV: 6, fontSize: 14, lineHeight: 18 } as const;
/** Whether a panel draws the caption bar over its art (narration-only panels, with no lines, read below the art instead). One rule for the player and the backdrop. */
export const hasCaptionBar = (p: { caption?: string; lines: readonly unknown[] }) => !!p.caption && p.lines.length > 0;
/** Where the caption's bottom edge lands, in pt from the panel's top, for `lines` lines of text. */
export function captionBottom(lines: number) {
  return CAPTION.top + 2 * CAPTION.border + 2 * CAPTION.padV + lines * CAPTION.lineHeight;
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
 * Two figures face each other (the right one is flipped). Height is 50 % of the panel unless the panel is so narrow that the
 * two figures' limbs would come within LIMB_CLEARANCE of each other: then both shrink to fit. `poses` (one per figure) sizes
 * that fit to the gestures actually drawn; without them the widest pose is assumed.
 */
export function stageLayout(count: number, w: number, h: number, speaker: number, poses?: readonly Pose[]): Placement[] {
  const n = Math.min(2, Math.max(0, count)) as 0 | 1 | 2;
  if (n === 0) return [];
  const aspect = STAGE_VB.w / STAGE_VB.h;
  const talking = (i: number) => speaker === -1 || speaker === i || n === 1;
  let height = h * FIGURE_SHARE;
  if (n === 2) {
    // each figure's reach toward the other (scaled about its bottom centre) plus the clearance must fit in the gap between the slots
    const gap = (SLOTS[2][1] - SLOTS[2][0]) * w;
    const reach = [0, 1].reduce((sum, i) => sum + reachOf(poses?.[i]) * (talking(i) ? 1 : LISTENER_SCALE), 0);
    height = Math.min(height, (STAGE_VB.h * (gap - LIMB_CLEARANCE)) / reach);
  }
  // a single figure never gets wider than the panel
  height = Math.min(height, (w * 0.96) / aspect);
  const width = height * aspect;
  return SLOTS[n].map((share, i) => {
    const cx = share * w;
    return { left: cx - width / 2, width, height, cx, scale: talking(i) ? 1 : LISTENER_SCALE, dim: !talking(i), flip: n === 2 && i === 1, z: talking(i) ? 2 : 1 };
  });
}

/** Horizontal share of the panel the speech-bubble tail points at (the speaker's slot; centre for narration). */
export function tailShare(count: number, speaker: number): number {
  if (count <= 1 || speaker < 0) return 0.5;
  return SLOTS[2][Math.min(1, speaker)];
}

/** A figure's box (art units) mapped to panel px, after its scale about the bottom centre. */
export function boxInPanel(p: Placement, box: Box, panelH: number) {
  const k = (p.height / STAGE_VB.h) * p.scale;
  const top = panelH - p.height * p.scale;
  // flipping mirrors the art about the figure's centre line
  const x0 = p.flip ? STAGE_VB.w - box.x1 : box.x0;
  const x1 = p.flip ? STAGE_VB.w - box.x0 : box.x1;
  return { x0: p.cx + (x0 - STAGE_VB.w / 2) * k, x1: p.cx + (x1 - STAGE_VB.w / 2) * k, y0: top + box.y0 * k, y1: top + box.y1 * k };
}
