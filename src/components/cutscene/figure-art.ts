// Path data for the waist-up cut-scene figures (Portrait variant="stage"), built once at module load so a render
// only picks strings. Figure art box: STAGE_VB (120 × 150). Head art keeps the bust's 100-box coordinates and is
// translated by HEAD_SHIFT. The figure faces screen-right; a flipped figure mirrors the whole drawing, while the
// light (upper left) is drawn unflipped on top.
import type { Mood } from '../../content/types';
import type { Pose } from './staging';

export const HEAD_SHIFT = 'translate(10 -6)';

/** Ellipse as a path sub-string, so several share one node. */
export function ell(cx: number, cy: number, rx: number, ry = rx) {
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
}

export const TORSO = 'M26 151 L28 100 Q27 80 46 73.5 L74 73.5 Q93 80 92 100 L94 151 Z';
export const NECK = 'M53 56 L67 56 L67 76 Q60 79 53 76 Z';
export const NECK_SHADOW = 'M53 62 Q60 70 67 62 L67 69 Q60 74 53 69 Z';
export const FOLDS = 'M38 128 Q44 137 40 148 M82 122 Q76 134 80 148 M54 141 q6 -4 12 0';
export const GROUND = { outer: { cx: 60, cy: 148, rx: 46, ry: 5 }, inner: { cx: 60, cy: 148, rx: 30, ry: 3 } };

/**
 * Upper-left light, never mirrored. The head shade and rim are clipped to HEAD_CLIP in Portrait so they can't spill over a
 * hat or off the skull; the torso shade is a plain path.
 */
export const HEAD_CLIP = { cx: 60, cy: 44, rx: 24, ry: 25 } as const;
export const LIGHT_SHADE_HEAD = 'M72 21.5 A24 25 0 0 1 70 66.5 Q81 45 72 21.5 Z';
export const LIGHT_SHADE_TORSO = 'M80 75.5 Q93 81 92 100 L94 151 L79 151 Q85 112 80 75.5 Z';
export const LIGHT_RIM = 'M48.8 64.4 A22.5 23.5 0 0 1 38.9 52';

/** Arm stroke widths (ink outline, sleeve fill) and the shoulder discs that round the arms' butt-capped upper ends. */
export const ARM_INK = 15.5;
export const ARM_SLEEVE = 12;
export const SHOULDERS_INK = ell(34, 86, ARM_INK / 2) + ell(86, 86, ARM_INK / 2);
export const SHOULDERS_SLEEVE = ell(34, 86, ARM_SLEEVE / 2) + ell(86, 86, ARM_SLEEVE / 2);

/**
 * Arms as centre-lines (a thick ink stroke under a thinner sleeve stroke, butt-capped: the hand covers the flat end so the
 * cuff sits flush against it) and the hands. Each arm ends at its hand's centre (palms: 1.5 inside the wrist).
 */
interface Gesture {
  arms: string;
  /** Hands drawn behind a held prop (the card's palms), under the prop; the prop's own layer comes after, then `hands`. */
  back?: string;
  hands: string;
  /** Finger and knuckle creases. */
  creases: string;
}

const knuckles = (cx: number, cy: number) => `M${cx - 3} ${cy - 1.6}q3 1.6 6 0M${cx - 3} ${cy + 1.6}q3 1.6 6 0`;

const f1 = (v: number) => Math.round(v * 10) / 10;
/**
 * A capsule (a finger or thumb lobe) from a to b, `r` thick. Wound counter-clockwise on screen like `ell`, so overlapping lobes and
 * palms in one path add up instead of cancelling to a hole; the ink outline then draws each lobe's edge inside its neighbours.
 */
export function capsule(ax: number, ay: number, bx: number, by: number, r: number) {
  const len = Math.hypot(bx - ax, by - ay);
  const nx = (-(by - ay) / len) * r;
  const ny = ((bx - ax) / len) * r;
  const p = (x: number, y: number) => `${f1(x)} ${f1(y)}`;
  return `M${p(ax + nx, ay + ny)}L${p(bx + nx, by + ny)}A${r} ${r} 0 0 0 ${p(bx - nx, by - ny)}L${p(ax - nx, ay - ny)}A${r} ${r} 0 0 0 ${p(ax + nx, ay + ny)}Z`;
}

/**
 * An open hand at (cx, cy) reaching along the unit vector (ux, uy): a round palm, four fingers fanned a little, and a thumb lobe
 * standing off the upper side. Returns the outline and a knuckle crease across the palm's far edge.
 */
function openHand(cx: number, cy: number, ux: number, uy: number) {
  const vx = -uy; // sideways, toward the thumb (up the screen for a hand reaching left)
  const vy = ux;
  const lens = [6.4, 8.2, 8.6, 7];
  let d = ell(cx, cy, 7);
  [-4.2, -1.4, 1.4, 4.2].forEach((off, i) => {
    const bx = cx + ux * 4.5 + vx * off;
    const by = cy + uy * 4.5 + vy * off;
    d += capsule(bx, by, bx + ux * lens[i] + vx * off * 0.3, by + uy * lens[i] + vy * off * 0.3, 1.8);
  });
  const tx = cx + vx * 4.8 + ux * 1;
  const ty = cy + vy * 4.8 + uy * 1;
  const c = Math.cos(0.7);
  const s = Math.sin(0.7);
  d += capsule(tx, ty, tx + (ux * c + vx * s) * 7.4, ty + (uy * c + vy * s) * 7.4, 2.3);
  const kx = cx + ux * 4;
  const ky = cy + uy * 4;
  return { hand: d, crease: `M${f1(kx - vx * 4.6)} ${f1(ky - vy * 4.6)}L${f1(kx + vx * 4.6)} ${f1(ky + vy * 4.6)}` };
}
const COLLAR_HAND = openHand(72, 90, -0.921, -0.39);

// A fist or mitten is centred on its arm's end and as wide as the sleeve, so the cuff's flat end is hidden inside it.
function fist(cx: number, cy: number) {
  return ell(cx, cy, 7, 7);
}
// (thumb and finger are wound the opposite way to the fist, so where they overlap it the fill doesn't cancel to a hole)
function thumbUp(cx: number, cy: number) {
  return `${fist(cx, cy)}M${cx + 1} ${cy - 3}L${cx + 1} ${cy - 9.2}a2.3 2.3 0 0 0 -4.6 0L${cx - 3.6} ${cy - 3}Z`;
}
function pointRight(cx: number, cy: number) {
  return `${fist(cx, cy)}M${cx + 2} ${cy - 0.2}L${cx + 2} ${cy - 4.6}L${cx + 11.8} ${cy - 4.6}a2.2 2.2 0 0 1 0 4.4Z`;
}
function mittenDown(cx: number, cy: number) {
  return ell(cx, cy, 7, 7.6);
}

/** Finger heights above the palm centre, outer finger first for a hand whose thumb is on its right. */
const FINGER_TOPS = [8.6, 10.8, 11.8, 10.4];
/**
 * An open palm facing out: four rounded fingers and a thumb in one outline; its wrist is as wide as the sleeve (the base sits at
 * cy + 9). `thumb` −1 mirrors it so the thumb is on its left.
 */
function palm(cx: number, cy: number, thumb: 1 | -1) {
  const m = thumb;
  const x = (dx: number) => n(cx + m * dx);
  let d = `M${x(-7)} ${cy + 9}L${x(-6.4)} ${cy - 3}`;
  FINGER_TOPS.forEach((t, i) => {
    d += `L${x(-6.4 + i * 3.2)} ${n(cy - t + 1.6)}a1.6 1.6 0 0 ${m === 1 ? 1 : 0} ${m * 3.2} 0`;
  });
  return `${d}L${x(6.4)} ${cy - 1}Q${x(11.4)} ${cy - 2.4} ${x(10.8)} ${cy + 2.6}Q${x(10.2)} ${cy + 5.4} ${x(6.7)} ${cy + 5}L${x(7)} ${cy + 9}Z`;
}
/** The three gaps between a palm's four fingers. */
function fingerGaps(cx: number, cy: number, thumb: 1 | -1) {
  return [0, 1, 2].map((i) => `M${n(cx + thumb * (-3.2 + i * 3.2))} ${n(cy - Math.min(FINGER_TOPS[i], FINGER_TOPS[i + 1]) + 1.6)}v4.6`).join('');
}
const n = (v: number) => Math.round(v * 10) / 10;

export const GESTURES: Record<Pose, Gesture> = {
  down: { arms: 'M34 86 Q25 112 27 134 M86 86 Q95 112 93 134', hands: mittenDown(27, 134) + mittenDown(93, 134), creases: 'M30.6 129.5q2.6 3.5 0.6 8M89.4 129.5q-2.6 3.5 -0.6 8' },
  thumb: { arms: 'M34 86 Q25 112 27 134 M86 86 L96 108 L96 82', hands: mittenDown(27, 134) + thumbUp(96, 82), creases: 'M30.6 129.5q2.6 3.5 0.6 8' + knuckles(97, 83) },
  // hands clasped at the belt: two overlapping hands (the seam between them reads), finger lines on each, and two short round-tipped
  // thumbs crossed on top: the back one (drawn under the hands) leans left, the front one leans right across it
  clasp: {
    arms: 'M34 86 Q29 112 55.5 122 M86 86 Q91 112 64.5 122',
    back: capsule(62.5, 118, 58.2, 114.6, 2.4),
    hands: ell(55.5, 122, 8.2, 7) + ell(64.5, 122, 8.2, 7) + capsule(57.5, 118, 62.3, 114.2, 2.4),
    creases: 'M50.8 118q2 3.8 0 7.6M54.2 117q2 4.4 0 8.6M69.2 118q-2 3.8 0 7.6M65.8 117q-2 4.4 0 8.6',
  },
  point: { arms: 'M34 86 L19 110 L33 132 M86 86 Q91 99 94 91', hands: fist(33, 132) + pointRight(94, 91), creases: knuckles(33, 132) + 'M92 92.5q3 1.6 6 0' },
  'hands-up': { arms: 'M34 86 L23 86 L21 65 M86 86 L97 86 L99 65', hands: palm(21, 57.5, 1) + palm(99, 57.5, -1), creases: fingerGaps(21, 57.5, 1) + fingerGaps(99, 57.5, -1) },
  // worried: one open hand laid at the collar (fingers toward the neck, thumb up), the other hanging
  collar: { arms: 'M34 86 Q25 112 27 134 M86 86 L98 101 L72 90', hands: mittenDown(27, 134) + COLLAR_HAND.hand, creases: 'M30.6 129.5q2.6 3.5 0.6 8' + COLLAR_HAND.crease },
  // holding a card at chest height by its side edges (the card itself is drawn by Portrait between `back` and `hands`): palms behind the
  // card's edges, fingers hidden behind it, a thumb over each top corner
  card: {
    arms: 'M34 86 Q28 100 43 105 M86 86 Q92 100 77 105',
    back: ell(43, 105, 7.4, 9) + ell(77, 105, 7.4, 9),
    hands: capsule(40.5, 98, 49.5, 92, 2.6) + capsule(79.5, 98, 70.5, 92, 2.6),
    creases: 'M43.9 93.3q2 0.2 2.2 3.3M76.1 93.3q-2 0.2 -2.2 3.3',
  },
};

/** Face parts per mood, in the head's 100-box coordinates (eyes at 42/58, 47). An empty eye path means the eyes are closed. */
interface FaceArt {
  sclera: string;
  iris: string;
  pupil: string;
  glints: string;
  lids: string;
  brows: string;
  browW: number;
  /** Lid line width when it isn't the default 1.9 (closed eyes carry the whole expression). */
  lidW?: number;
  mouth: string;
  mouthFill: boolean;
  tongue?: string;
}

function eyes(rx: number, ry: number, ir: number, dx: number, dy: number) {
  const e = [42, 58];
  return {
    sclera: e.map((x) => ell(x, 47, rx, ry)).join(''),
    iris: e.map((x) => ell(x + dx, 47 + dy, ir)).join(''),
    pupil: e.map((x) => ell(x + dx, 47 + dy, ir * 0.5)).join(''),
    glints: e.map((x) => ell(x + dx + ir * 0.38, 47 + dy - ir * 0.42, ir * 0.36) + ell(x + dx - ir * 0.4, 47 + dy + ir * 0.45, ir * 0.18)).join(''),
  };
}

export const FACES: Record<Mood, FaceArt> = {
  neutral: {
    ...eyes(4.3, 5.1, 3.2, 0.9, 0.4),
    lids: 'M37.4 45.6 Q42 40.6 46.6 45.6 M53.4 45.6 Q58 40.6 62.6 45.6',
    brows: 'M37 38.5 Q42 36 47 38 M53 38 Q58 36 63 38.5',
    browW: 2.4,
    mouth: 'M43 60 Q50 64 57 60',
    mouthFill: false,
  },
  // closed, smiling eyes (the joyful ^ ^), so a win never reads as a stare
  happy: {
    sclera: '',
    iris: '',
    pupil: '',
    glints: '',
    lids: 'M37.4 49 Q42 41.6 46.6 49 M53.4 49 Q58 41.6 62.6 49',
    brows: 'M37 37.5 Q42 33.5 47 36.5 M53 36.5 Q58 33.5 63 37.5',
    browW: 2.4,
    lidW: 2.7,
    mouth: 'M41 58 Q50 69 59 58 Z',
    mouthFill: true,
    tongue: 'M45.5 63.6 Q50 60.6 54.5 63.6 Q50 67 45.5 63.6 Z',
  },
  sad: {
    ...eyes(4.2, 5, 3.1, 0.6, 1.3),
    lids: 'M37.6 46.6 Q41 41.6 46.6 44.4 M53.4 44.4 Q59 41.6 62.4 46.6',
    brows: 'M37 41 L47 37.5 M63 41 L53 37.5',
    browW: 3,
    mouth: 'M43 63 Q50 57 57 63',
    mouthFill: false,
  },
  angry: {
    ...eyes(4.3, 4.6, 3.1, 1, 0.6),
    lids: 'M37.4 43.6 L46.6 46 M53.4 46 L62.6 43.6',
    brows: 'M36 38 L47 42.5 M64 38 L53 42.5',
    browW: 3.2,
    mouth: 'M42 62 Q50 59.5 58 62',
    mouthFill: false,
  },
  surprised: {
    ...eyes(4.9, 5.9, 2.6, 0.5, 0),
    lids: 'M37 44 Q42 39 47 44 M53 44 Q58 39 63 44',
    brows: 'M36 36 q6 -4.5 11 -0.5 M53 35.5 q6 -4 11 0.5',
    browW: 2.8,
    mouth: ell(50, 61, 4.5, 5.5),
    mouthFill: true,
    tongue: ell(50, 64, 2.6, 1.6),
  },
};

export const NOSE = 'M50.6 50.2 q2.8 3.4 -0.8 4.6';
export const BLUSH = ell(35.5, 55, 4.4, 3) + ell(64.5, 55, 4.4, 3);
export const EARS = ell(26.5, 52, 4, 6) + ell(73.5, 52, 4, 6);
export const EAR_INNER = 'M25.6 49 q2 2.5 0.2 6 M74.4 49 q-2 2.5 -0.2 6';

export type HairStyle = 'bun' | 'short' | 'long' | 'bald' | 'slick' | 'bob';
/** Front-hair outlines per style (head 100-box); portrait.tsx fills them, the tests check the strands against them. */
export const HAIR_FRONT: Record<Exclude<HairStyle, 'bald'>, string> = {
  bun: 'M26 46 Q26 24 50 24 Q74 24 74 46 Q66 32 50 32 Q34 32 26 46 Z',
  short: 'M26 46 Q24 22 50 22 Q76 22 74 46 Q70 34 56 32 Q46 38 30 38 Z',
  long: 'M26 46 Q24 22 50 22 Q76 22 74 46 Q70 34 56 32 Q46 38 30 38 Z',
  bob: 'M25 48 Q24 22 50 22 Q76 22 75 48 L70 40 Q50 30 30 40 Z',
  slick: 'M27 42 Q28 22 52 23 Q74 24 73 42 Q66 30 40 32 Z',
};
/** The bun's knot (a circle on top of the bun style's front hair). */
export const BUN_KNOT = { cx: 50, cy: 20, r: 10 } as const;

/** Two or three strand lines per hair style (head 100-box). Every point sits inside that style's front-hair shape (portrait.tsx HairFront), never on the skin. */
export const STRANDS: Record<HairStyle, string> = {
  bun: 'M33 35.5 Q38 30 49 28.5 M67 35.5 Q62 30 51 28.5 M44 15 q6 -3 12 1.5',
  short: 'M30.5 36 Q31 32 38 29.5 M70 36 Q69 32 62 29.5',
  long: 'M30.5 36 Q33 31 44 28 M70 36 Q67 32 56 30',
  bob: 'M27.5 42 Q28 33 41 29.5 M72.5 42 Q72 33 59 29.5 M50 25 Q47 30 44 31',
  slick: 'M31 37 Q43 26.5 60 26.5 M38.5 31 Q52 25.5 68 30.5',
  bald: '',
};

/**
 * D401: the hair behind the head for the stage figures (head 100-box), as an outlined mass, so long hair reads as hair and not a white
 * veil: the outline path, a shade on the side away from the light inset 1.5 from the outline (so the 2.5 ink stays whole), and two or three
 * strand lines. It is drawn before the head, so nothing here can touch the face.
 */
export const HAIR_BACK_STAGE = {
  long: {
    d: 'M24 50 Q22 28 50 26 Q78 28 76 50 Q82 86 68 94 L32 94 Q18 86 24 50 Z',
    shade: 'M76.4 52 Q80 84 67 92.4 L58 92.4 Q71.5 82 69.5 52 Z',
    strands: 'M26 58 Q24 76 31 88 M31 54 Q29 72 35 90 M74 58 Q76 74 69 88',
  },
  bob: {
    d: 'M26 42 Q24 70 32 72 L68 72 Q76 70 74 42 Z',
    shade: 'M72.6 44 Q74.4 68.5 67.5 70.5 L61 70.5 Q68 67 67.5 44 Z',
    strands: 'M30.5 52 Q29 62 33 69 M69.5 52 Q71 62 67 69',
  },
} as const;
/** Width of the stage back-hair outline, in figure units. */
export const HAIR_BACK_INK = 2.5;

/** Clothing pieces per character extra, in figure coordinates. */
export const OUTFIT = {
  apronBib: 'M43 90 L77 90 L80 151 L40 151 Z',
  apronStraps: 'M45 90 L51 74 M75 90 L69 74',
  apronPocket: 'M51 124 L69 124 L69 133 Q60 138 51 133 Z M40 114 L80 114',
  poloCollar: 'M49 73.5 L60 86 L71 73.5 L67 71 L60 80 L53 71 Z',
  lanyard: 'M50 76 L60 98 L70 76',
  whistle: 'M55 96 h11 a3 3 0 0 1 3 3 v1 a3 3 0 0 1 -3 3 h-11 Z M52 98 h4 v3 h-4 Z',
  shirtV: 'M51 73.5 L60 90 L69 73.5 Z',
  jacketLine: 'M60 90 L60 151',
  brass: [ell(52, 100, 1.9), ell(68, 100, 1.9), ell(52, 116, 1.9), ell(68, 116, 1.9), ell(52, 132, 1.9), ell(68, 132, 1.9), 'M29 79 l12 -3 l1 4.5 l-12 3 Z M91 79 l-12 -3 l-1 4.5 l12 3 Z'].join(''),
  teeStrip: 'M51 73.5 L69 73.5 L67 151 L53 151 Z',
  badgeCord: 'M52 76 L57 108 M68 76 L63 108',
  badge: 'M53 107 h14 v14 h-14 Z',
  vestStripes: 'M28 116 L92 116 L92 122 L28 122 Z M38.5 76 L42.5 76 L42.5 151 L38.5 151 Z M77.5 76 L81.5 76 L81.5 151 L77.5 151 Z',
  turtleneck: 'M50.5 67 L69.5 67 L70 77 Q60 80.5 50 77 Z',
  turtleFolds: 'M51 71 Q60 74 69 71 M51 74.5 Q60 77.5 69 74.5',
  pearls: [44, 48.5, 53.5, 60, 66.5, 71.5, 76].map((x, i) => ell(x, 82 + [0, 2.4, 4, 4.8, 4, 2.4, 0][i], 2.1)).join(''),
  suitV: 'M51 73.5 L60 102 L69 73.5 Z',
  lapels: 'M51 73.5 L60 102 L53 105 L43 79 Z M69 73.5 L60 102 L67 105 L77 79 Z',
  tie: 'M57.8 75 L62.2 75 L64 98 L60 104 L56 98 Z',
  pocketSquare: 'M72 92 l8 -2 l-1 5 Z',
  nameBadge: 'M72 99 h12 v7 h-12 Z',
};

/** The art for a pose (staging's `poseFor` picks the pose, so tests and the player see the same mapping). */
export function gestureFor(pose: Pose): Gesture {
  return GESTURES[pose];
}
