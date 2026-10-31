// Path data for the waist-up cut-scene figures (Portrait variant="stage"), built once at module load so a render
// only picks strings. Figure art box: STAGE_VB (120 × 150). Head art keeps the bust's 100-box coordinates and is
// translated by HEAD_SHIFT. The figure faces screen-right; a flipped figure mirrors the whole drawing, while the
// light (upper left) is drawn unflipped on top.
import type { Mood } from '../../content/types';
import { POSE, type Pose } from './staging';

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

/** Upper-left light: one shade path (right side of head, neck and torso) and one rim-highlight path, both unflipped. */
export const LIGHT_SHADE = [
  'M72 21.5 A24 25 0 0 1 70 66.5 Q81 45 72 21.5 Z', // head (stage coords)
  'M80 75.5 Q93 81 92 100 L94 151 L79 151 Q85 112 80 75.5 Z', // torso
].join('');
export const LIGHT_RIM = 'M48.8 64.4 A22.5 23.5 0 0 1 38.9 52';

/** Arms as centre-lines (drawn as a thick ink stroke under a thinner sleeve stroke), and the mitten hands. */
interface Gesture {
  arms: string;
  hands: string;
  /** Finger and knuckle creases. */
  creases: string;
}

const knuckles = (cx: number, cy: number) => `M${cx - 3} ${cy - 1.6}q3 1.6 6 0M${cx - 3} ${cy + 1.6}q3 1.6 6 0`;
const fingers = (cx: number, cy: number) => `M${cx - 2.1} ${cy - 11}v5.5M${cx + 2.1} ${cy - 11}v5.5`;

function fist(cx: number, cy: number) {
  return ell(cx, cy, 6.2, 6.6);
}
function thumbUp(cx: number, cy: number) {
  return `${fist(cx, cy)}M${cx - 3.6} ${cy - 3}L${cx - 3.6} ${cy - 11.5}a2.3 2.3 0 0 1 4.6 0L${cx + 1} ${cy - 3}Z`;
}
function pointRight(cx: number, cy: number) {
  return `${fist(cx, cy)}M${cx + 2} ${cy - 4.6}L${cx + 10.5} ${cy - 4.6}a2.2 2.2 0 0 1 0 4.4L${cx + 2} ${cy - 0.2}Z`;
}
/** An open mitten, palm out, fingers up; `thumb` −1 puts the thumb on its left. */
function palm(cx: number, cy: number, thumb: 1 | -1) {
  return (
    ell(cx + thumb * 6, cy + 0.5, 2.8, 4.2) +
    `M${cx - 5.8} ${cy + 6}L${cx - 6.4} ${cy - 4}Q${cx - 6.4} ${cy - 11.5} ${cx} ${cy - 11.5}Q${cx + 6.4} ${cy - 11.5} ${cx + 6.4} ${cy - 4}L${cx + 5.8} ${cy + 6}Z`
  );
}
function mittenDown(cx: number, cy: number) {
  return ell(cx, cy, 5.8, 7.2);
}

export const GESTURES: Record<Pose, Gesture> = {
  down: { arms: 'M34 86 Q25 112 27 132 M86 86 Q95 112 93 132', hands: mittenDown(27, 136) + mittenDown(93, 136), creases: 'M30.4 131q2.4 3 0.6 7M89.6 131q-2.4 3 -0.6 7' },
  thumb: { arms: 'M34 86 Q25 112 27 132 M86 86 L101 108 L101 88', hands: mittenDown(27, 136) + thumbUp(101, 82), creases: 'M30.4 131q2.4 3 0.6 7' + knuckles(102, 83) },
  clasp: { arms: 'M34 86 Q29 112 51 121 M86 86 Q91 112 69 121', hands: fist(55, 121) + fist(65, 121), creases: 'M57 118.5q3 1.4 6 0M57 122q3 1.4 6 0' },
  point: { arms: 'M34 86 L19 110 L31 131 M86 86 Q99 98 106 93', hands: fist(33, 132) + pointRight(107, 92), creases: knuckles(33, 132) + 'M104 93.5q3 1.6 6 0' },
  'hands-up': { arms: 'M34 86 L19 86 L17 66 M86 86 L101 86 L103 66', hands: palm(17, 58, 1) + palm(103, 58, -1), creases: fingers(17, 58) + fingers(103, 58) },
};

/** Face parts per mood, in the head's 100-box coordinates (eyes at 42/58, 47). */
interface FaceArt {
  sclera: string;
  iris: string;
  pupil: string;
  glints: string;
  lids: string;
  brows: string;
  browW: number;
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
  happy: {
    ...eyes(4.3, 4.6, 3.1, 0.9, 0.2),
    lids: 'M37.4 45.4 Q42 40.8 46.6 45.4 M53.4 45.4 Q58 40.8 62.6 45.4 M38.2 51.4 Q42 49.2 45.8 51.4 M54.2 51.4 Q58 49.2 61.8 51.4',
    brows: 'M37 37.5 Q42 33.5 47 36.5 M53 36.5 Q58 33.5 63 37.5',
    browW: 2.4,
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
/** Two or three strand lines per hair style (head 100-box). */
export const STRANDS: Record<HairStyle, string> = {
  bun: 'M32 38 Q38 30 49 28.5 M68 38 Q62 30 51 28.5 M44 15 q6 -3 12 1.5',
  short: 'M30 42 Q31 33 38 30 M70 42 Q69 33 62 30',
  long: 'M30 42 Q33 31 44 28 M70 42 Q67 32 56 30 M27.5 62 Q27 76 32 86',
  bob: 'M29 47 Q29 34 41 29.5 M71 47 Q71 34 59 29.5 M50 25 Q47 30 44 31',
  slick: 'M31 37 Q43 26.5 60 26.5 M38 32.5 Q52 26.5 68 31.5',
  bald: '',
};

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

/** The gesture a mood gets (shared with staging so tests see the same mapping). */
export function gestureFor(mood: Mood): Gesture {
  return GESTURES[POSE[mood]];
}
