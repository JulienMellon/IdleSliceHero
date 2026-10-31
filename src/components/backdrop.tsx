// Cut-scene backdrops: one layered SVG set per location. Far layer (hazy, low contrast), mid layer (the location's
// buildings and props), near layer (ground plane, contact line, cast shadows, edge props), then a vignette.
// Light comes from the upper left: right faces are shaded and shadows fall to the right.
// Static per (id, size, prop): the component is memo'd and every path string is built once at module load.
import { memo, useId, type ReactElement } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text } from 'react-native-svg';

import type { Backdrop as BackdropId } from '../content/types';
import { F } from '../theme';
import { alongQuad, brickPatch, n as n1, bricks, circle, cloud, gridLines, mullions, planks, rain, rect, skyline, windows } from './cutscene/backdrop-art';

const INK = '#3B1F14';

/** Sky (or wall) gradient, top → horizon. */
const SKY: Record<BackdropId, [string, string]> = {
  shop: ['#F3CB94', '#F2B880'],
  downtown: ['#8FBFEA', '#DCEEFB'],
  suburbs: ['#94D3F2', '#EAF8FF'],
  waterfront: ['#F49A7A', '#FFE2B8'],
  university: ['#A894E0', '#ECE3FF'],
  industrial: ['#7F8298', '#DDC6A8'],
  uptown: ['#1F2852', '#6A5ACD'],
  'megaslice-hq': ['#25093A', '#7B2CBF'],
  'downtown-rain': ['#232548', '#5C5470'],
};

/** Warm or cool light for lamp glows per scene. */
const GLOW: Record<BackdropId, string> = {
  shop: '#FFD98A',
  downtown: '#FFF1C2',
  suburbs: '#FFF6C8',
  waterfront: '#FFD27A',
  university: '#FFF1C2',
  industrial: '#FFD27A',
  uptown: '#FFD27A',
  'megaslice-hq': '#E2B8FF',
  'downtown-rain': '#FFC46B',
};

type Ids = { glow: string };

// ---------------------------------------------------------------------------------------------------------------
// Shared pieces

const CLOUDS = cloud(40, -62, 1) + cloud(250, -78, 1.25) + cloud(330, -20, 0.8);

const FAR_CITY = skyline(140, [
  [-10, 34, 150], [22, 26, 196], [46, 30, 170], [74, 22, 214], [94, 34, 160], [126, 28, 230], [152, 30, 190], [180, 24, 240], [202, 34, 176],
  [234, 26, 226], [258, 32, 200], [288, 24, 248], [310, 34, 186], [342, 28, 216], [368, 40, 170],
]);
const FAR_CITY_WINDOWS = [
  [26, 196], [78, 214], [130, 230], [184, 240], [238, 226], [292, 248], [346, 216],
]
  .map(([x, h]) => windows(x + 4, 140 - h + 14, 2, Math.floor((h - 40) / 16), 4, 6, 9, 16, (c, r) => (c + r + x) % 3 === 0))
  .join('');

function Ground({ y, fill, line = INK }: { y: number; fill: string; line?: string }) {
  return (
    <G>
      <Rect x={-20} y={y} width={440} height={230 - y} fill={fill} />
      <Rect x={-20} y={y} width={440} height={6} fill="#000" opacity={0.12} />
      <Path d={`M-20 ${y}H420`} stroke={line} strokeWidth={2} />
    </G>
  );
}

/** The MEGASLICE billboard on its frame (industrial and uptown skylines carry it). */
function Billboard({ x, y, w = 172 }: { x: number; y: number; w?: number }) {
  const fs = Math.round(w / 10);
  return (
    <G>
      <Path d={`M${x + 22} ${y + 30}v40M${x + w - 22} ${y + 30}v40M${x + 22} ${y + 50}L${x + w - 22} ${y + 66}M${x + w - 22} ${y + 50}L${x + 22} ${y + 66}`} stroke="#2A2233" strokeWidth={3} />
      <Rect x={x} y={y} width={w} height={30} rx={3} fill="#7B2CBF" stroke={INK} strokeWidth={2} />
      <Path d={`M${x + 4} ${y + 4}h${w - 8}v5h${8 - w}Z`} fill="#fff" opacity={0.18} />
      <Path d={`M${x + 8} ${y + 22}l9 -14l9 14Z`} fill="#FFC531" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      <Text x={x + 16 + w / 2} y={y + 15 + fs * 0.36} fontSize={fs} fontFamily={F.bold} fill="#FFC531" stroke={INK} strokeWidth={0.8} textAnchor="middle">
        MEGASLICE
      </Text>
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Shop interior: plaster wall with wallpaper stripes, tiled backsplash, brick oven under a pendant lamp,
// menu board, EST. 1974 photo, PIZZA sign, string lights, a shelf of labelled jars, pizza boxes, plank floor.

const SHOP = (() => {
  const wallpaper = gridLines(-20, -112, 420, 36, 16, 400);
  const tiles = gridLines(-20, 48, 420, 134, 13, 13);
  const floor = planks(-20, 420, 142, 212, 200, 10, 24);
  // brick dome: courses follow the dome's quadratic top (x = 248 + 104t, y = 60 − 100t(1−t))
  let ovenBricks = '';
  for (let y = 40, r = 0; y < 136; y += 7, r++) {
    let xa = 249;
    let xb = 351;
    if (y < 60) {
      const t = (1 - Math.sqrt(1 - (4 * (60 - y)) / 100)) / 2;
      xa = 248 + 104 * t + 1;
      xb = 352 - 104 * t - 1;
    }
    ovenBricks += `M${xa.toFixed(1)} ${y}H${xb.toFixed(1)}`;
    for (let x = xa + (r % 2 ? 6 : 12); x < xb - 3; x += 12) if (y < 98 || x < 268 || x > 332) ovenBricks += `M${x.toFixed(1)} ${y}v7`;
  }
  const lights = alongQuad([-10, -102], [100, -66], [200, -96], 5).concat(alongQuad([200, -96], [300, -66], [410, -102], 5));
  const bulbs = ['', '', ''];
  let glow = '';
  lights.forEach(([x, y], i) => {
    bulbs[i % 3] += circle(x, y + 6, 4, 5);
    glow += circle(x, y + 6, 10);
  });
  const jarsX = [108, 130, 152, 174];
  const contents = ['#D9443A', '#4E9A4A', '#E8C27A', '#F4EEDC'];
  return {
    wallpaper,
    tiles,
    floor,
    ovenBricks,
    wire: 'M-10 -102 Q100 -66 200 -96 Q300 -66 410 -102',
    bulbs,
    bulbGlow: glow,
    jarGlass: jarsX.map((x) => `M${x} 14q0 -3 3 -3h10q3 0 3 3v14q0 2 -2 2h-12q-2 0 -2 -2Z`).join(''),
    jarFill: jarsX.map((x, i) => ({ d: `M${x + 1.5} 19h13v9q0 1 -1 1h-11q-1 0 -1 -1Z`, c: contents[i] })),
    jarLids: jarsX.map((x) => rect(x + 1.5, 7.5, 13, 4)).join(''),
    jarLabels: jarsX.map((x) => rect(x + 3, 16.5, 10, 7)).join(''),
    jarInk: jarsX.map((x) => `M${x + 5} 19h6M${x + 5} 21.5h4`).join(''),
    jarGlints: jarsX.map((x) => `M${x + 2.5} 14v12`).join(''),
    boxes: rect(100, 113, 44, 9) + rect(102, 122, 42, 9) + rect(99, 131, 46, 9),
    boxLids: 'M100 116h44M102 125h42M99 134h46',
    shadows: 'M336 140 L376 140 L362 150 L322 150 Z M145 140 L168 140 L160 147 L139 147 Z',
  };
})();

function ShopScene({ glow }: Ids) {
  const S = SHOP;
  return (
    <G>
      {/* far: plaster wall, wallpaper stripes */}
      <Path d={S.wallpaper} stroke="#C8925E" strokeWidth={5} opacity={0.18} />
      {/* mid: rail, red tile band, cream tiles */}
      <Rect x={-20} y={42} width={440} height={94} fill="#F6EEE2" />
      <Path d={S.tiles} stroke="#D9C7AE" strokeWidth={1.2} />
      <Rect x={-20} y={42} width={440} height={6} fill="#C8483A" />
      <Rect x={-20} y={36} width={440} height={6} fill="#8E5A3C" stroke={INK} strokeWidth={1.4} />
      {/* string lights */}
      <Path d={S.bulbGlow} fill="#FFE7A0" opacity={0.28} />
      <Path d={S.wire} stroke={INK} strokeWidth={1.6} fill="none" />
      {S.bulbs.map((d, i) => (
        <Path key={i} d={d} fill={['#FFC531', '#E8432E', '#3FAE5A'][i]} stroke={INK} strokeWidth={1.2} />
      ))}
      {/* PIZZA sign on two cords */}
      <Path d="M134 -112V-72M198 -112V-72" stroke={INK} strokeWidth={1.4} />
      <Rect x={124} y={-74} width={84} height={32} rx={6} fill="#FFFFFF" stroke="#D9443A" strokeWidth={3} />
      <Circle cx={142} cy={-58} r={11} fill="#FFC531" stroke="#C97B2A" strokeWidth={3} />
      <Path d={circle(138, -61, 2.6) + circle(146, -60, 2.6) + circle(141, -53, 2.6) + circle(147, -54, 2.2)} fill="#E8432E" />
      <Text x={178} y={-52} fontSize={14} fontFamily={F.bold} fill="#D9443A" textAnchor="middle">
        PIZZA
      </Text>
      {/* menu board */}
      <Rect x={112} y={-34} width={70} height={40} rx={4} fill="#2F3B33" stroke="#8E5A3C" strokeWidth={3} />
      <Path d="M118 -28 l20 26" stroke="#fff" strokeWidth={6} opacity={0.05} />
      <Text x={147} y={-22} fontSize={9} fontFamily={F.bold} fill="#FFC531" textAnchor="middle">
        MENU
      </Text>
      <Path d="M118 -16l6 0l-3 5ZM118 -8l6 0l-3 5ZM118 0l6 0l-3 5Z" fill="#FFC531" />
      <Path d="M127 -14.5h28M127 -6.5h24M127 1.5h20" stroke="#FFF4E0" strokeWidth={2.4} strokeLinecap="round" />
      <Text x={177} y={3} fontSize={6} fontFamily={F.bold} fill="#FFC531" textAnchor="end">
        $3 · $4 · $4
      </Text>
      {/* framed photo: young Rosa at the oven, est. 1974 */}
      <Path d="M210 -68 L227 -82 L244 -68" stroke={INK} strokeWidth={1.2} fill="none" />
      <Rect x={194} y={-68} width={66} height={58} rx={3} fill="#C98F63" stroke={INK} strokeWidth={2.4} />
      <Rect x={200} y={-62} width={54} height={36} fill="#EED9B0" />
      <Path d="M233 -26 L233 -38 Q242 -49 251 -38 L251 -26 Z" fill="#B8784F" />
      <Path d={circle(216, -46, 6.5) + 'M206 -26 Q216 -38 226 -26 Z'} fill="#A0664A" />
      <Path d="M200 -62h54v36h-54Z" fill="#8E5A3C" opacity={0.12} />
      <Text x={227} y={-14} fontSize={8} fontFamily={F.bold} fill="#FFF4E0" textAnchor="middle">
        EST. 1974
      </Text>
      {/* shelf of labelled jars */}
      <Path d={S.jarGlass} fill="#E6F2F2" stroke={INK} strokeWidth={1.3} />
      {S.jarFill.map((j) => (
        <Path key={j.c} d={j.d} fill={j.c} />
      ))}
      <Path d={S.jarLabels} fill="#FFF8E8" stroke={INK} strokeWidth={0.7} />
      <Path d={S.jarInk} stroke="#C8483A" strokeWidth={1.1} />
      <Path d={S.jarGlints} stroke="#fff" strokeWidth={1.6} opacity={0.7} strokeLinecap="round" />
      <Path d={S.jarLids} fill="#7A4A26" stroke={INK} strokeWidth={1} />
      <Rect x={100} y={30} width={98} height={5} fill="#8E5A3C" stroke={INK} strokeWidth={1.3} />
      <Path d="M110 35l5 7M188 35l-5 7" stroke="#5E3A26" strokeWidth={2} strokeLinecap="round" />
      {/* brick oven under a pendant lamp */}
      <G transform="translate(-16 0)">
      <Path d="M288 -22 L232 42 L368 42 L312 -22 Z" fill="#FFE7A0" opacity={0.2} />
      <Ellipse cx={300} cy={-18} rx={40} ry={30} fill={`url(#${glow})`} opacity={0.9} />
      <Path d="M300 -112V-38" stroke={INK} strokeWidth={1.4} />
      <Path d="M285 -22 Q285 -40 300 -40 Q315 -40 315 -22 Z" fill="#2E6B4F" stroke={INK} strokeWidth={1.8} />
      <Ellipse cx={300} cy={-21} rx={6} ry={3} fill="#FFF6C8" />
      <Path d="M248 140 L248 60 Q300 10 352 60 L352 140 Z" fill="#B85C38" stroke={INK} strokeWidth={2.4} />
      <Path d={S.ovenBricks} stroke="#8A3F22" strokeWidth={1} opacity={0.75} />
      <Path d="M330 60 Q340 72 340 140 L352 140 L352 60 Q345 50 336 44 Z" fill="#000" opacity={0.14} />
      <Path d="M266 140 L266 100 Q300 64 334 100 L334 140" stroke="#D88A5A" strokeWidth={7} fill="none" />
      <Path d="M266 140 L266 100 Q300 64 334 100 L334 140" stroke={INK} strokeWidth={7} strokeDasharray="1.2 7" fill="none" />
      <Path d="M270 140 L270 102 Q300 72 330 102 L330 140 Z" fill="#2B1A12" />
      <Ellipse cx={300} cy={124} rx={34} ry={22} fill={`url(#${glow})`} />
      <Path d="M276 138 L282 116 L290 128 L298 104 L306 126 L314 112 L322 138 Z" fill="#FF9F1C" />
      <Path d="M288 138 L292 124 L298 132 L303 118 L309 138 Z" fill="#FFE066" />
      <Rect x={258} y={134} width={84} height={7} fill="#8C8C8C" stroke={INK} strokeWidth={1.4} />
      </G>
      {/* near: baseboard, plank floor, warm spill from the oven, pizza boxes */}
      <Rect x={-20} y={134} width={440} height={8} fill="#6B3A22" />
      <Rect x={-20} y={142} width={440} height={70} fill="#B8743F" />
      <Path d={S.floor.lines + S.floor.joints} stroke="#8A5129" strokeWidth={1.3} />
      <Path d={S.floor.grain} stroke="#D49A62" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Rect x={-20} y={142} width={440} height={5} fill="#000" opacity={0.16} />
      <Ellipse cx={284} cy={156} rx={70} ry={12} fill={`url(#${glow})`} opacity={0.75} />
      <Path d={S.shadows} fill="#000" opacity={0.16} />
      <Path d={S.boxes} fill="#EBD5A8" stroke={INK} strokeWidth={1.4} />
      <Path d={S.boxLids} stroke="#B8946A" strokeWidth={1} />
      <Path d={circle(122, 118, 2.4) + circle(123, 127, 2.4) + circle(121, 136, 2.4)} fill="#E8432E" />
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Downtown by day: brownstones with brick, cornices, a fire escape and a rooftop water tower; shopfront awnings,
// a street lamp and a hydrant on the sidewalk.

const DT = (() => {
  const B: [number, number, number, string][] = [
    [-20, 64, 6, '#D58E5E'],
    [64, 152, -40, '#C9774A'],
    [152, 252, -86, '#E9A86B'],
    [252, 336, -26, '#B9694A'],
    [336, 420, -4, '#E7B07A'],
  ];
  const win = B.map(([x0, x1, top], i) => {
    const cols = Math.floor((x1 - x0 - 12) / 22);
    const rows = Math.floor((90 - top - 10) / 24);
    const left = x0 + (x1 - x0 - (cols * 22 - 8)) / 2;
    const skip = i === 2 ? (c: number) => c === cols - 1 : undefined; // fire-escape bay
    return { glass: windows(left, top + 14, cols, rows, 14, 16, 22, 24, skip), bars: mullions(left, top + 14, cols, rows, 14, 16, 22, 24, skip), sills: windows(left - 2, top + 30, cols, rows, 18, 3, 22, 24, skip) };
  });
  return {
    B,
    glass: win.map((w) => w.glass).join(''),
    bars: win.map((w) => w.bars).join(''),
    sills: win.map((w) => w.sills).join(''),
    cornices: B.map(([x0, x1, top]) => rect(x0 - 3, top - 6, x1 - x0 + 6, 7)).join(''),
    sides: 'M146 -40h6v180h-6Z M246 -86h6v226h-6Z M330 -26h6v166h-6Z',
    brick: bricks(64, -34, 146, 96, 6, 14) + bricks(252, -20, 330, 96, 6, 14),
    brickHint: brickPatch(160, -60, 4, [26, 18, 22]) + brickPatch(200, 40, 3, [20, 30]),
    fireEscape:
      'M222 -38h26M222 -2h26M222 34h26M222 70h26' +
      'M222 -46h26M222 -10h26M222 26h26M222 62h26' +
      'M222 -46v8M248 -46v8M222 -10v8M248 -10v8M222 26v8M248 26v8M222 62v8M248 62v8' +
      'M226 -38L244 -2M226 -2L244 34M226 34L244 70',
    tower: { legs: 'M276 -26L280 -50M312 -26L308 -50M294 -26V-50M278 -38H310', tank: 'M272 -82h44v32q-22 6 -44 0Z', bands: 'M272 -72q22 5 44 0M272 -61q22 5 44 0', roof: 'M270 -82L294 -102L318 -82Z' },
    awningG: 'M68 96H148L152 112H64Z',
    awningR: 'M156 96H248L252 112H152Z',
    awningB: 'M256 96H332L336 112H252Z',
    stripes: [72, 88, 104, 120, 136, 164, 180, 196, 212, 228, 244, 262, 278, 294, 310, 326].map((x) => `M${x} 96h7l1 16h-7Z`).join(''),
    shopGlass: rect(70, 116, 44, 22) + rect(160, 116, 52, 22) + rect(260, 116, 40, 22),
    doors: rect(122, 114, 20, 26) + rect(220, 114, 22, 26) + rect(306, 114, 22, 26),
    paving: gridLines(-20, 140, 420, 200, 40, 22),
  };
})();

function DowntownScene() {
  return (
    <G>
      <Path d={CLOUDS} fill="#FFFFFF" opacity={0.8} />
      <Path d={FAR_CITY} fill="#AFC8E2" />
      <Path d={FAR_CITY_WINDOWS} fill="#9DB8D6" />
      {DT.B.map(([x0, x1, top, c]) => (
        <Path key={x0} d={rect(x0, top, x1 - x0, 140 - top)} fill={c} stroke={INK} strokeWidth={2} />
      ))}
      <Path d={DT.brick} stroke="#7E3E24" strokeWidth={0.9} opacity={0.45} />
      <Path d={DT.brickHint} stroke="#B7703F" strokeWidth={1} opacity={0.8} />
      <Path d={DT.sides} fill="#000" opacity={0.16} />
      <Path d={DT.cornices} fill="#7A4A30" stroke={INK} strokeWidth={1.6} />
      <Path d={DT.sills} fill="#F2E3C8" />
      <Path d={DT.glass} fill="#BFDDF2" stroke={INK} strokeWidth={1.3} />
      <Path d={DT.bars} stroke="#7A4A30" strokeWidth={1.2} />
      <Path d={DT.fireEscape} stroke="#2E2A2A" strokeWidth={1.6} fill="none" />
      <Path d={DT.tower.legs} stroke="#3D2B22" strokeWidth={2.2} />
      <Path d={DT.tower.tank} fill="#8B5A3C" stroke={INK} strokeWidth={2} />
      <Path d={DT.tower.bands} stroke="#3D2B22" strokeWidth={1.4} fill="none" />
      <Path d={DT.tower.roof} fill="#6E4430" stroke={INK} strokeWidth={2} />
      {/* street level */}
      <Path d={DT.shopGlass} fill="#9CC7DE" stroke={INK} strokeWidth={1.6} />
      <Path d={DT.doors} fill="#5A2E1A" stroke={INK} strokeWidth={1.6} />
      <Path d={DT.awningG} fill="#3FAE5A" stroke={INK} strokeWidth={1.8} />
      <Path d={DT.awningR} fill="#E8432E" stroke={INK} strokeWidth={1.8} />
      <Path d={DT.awningB} fill="#2F80ED" stroke={INK} strokeWidth={1.8} />
      <Path d={DT.stripes} fill="#fff" opacity={0.4} />
      <Path d="M64 112H336" stroke="#000" strokeWidth={4} opacity={0.12} />
      {/* near: sidewalk, lamp, hydrant */}
      <Ground y={140} fill="#D3C7B6" />
      <Path d={DT.paving} stroke="#B2A693" strokeWidth={1.2} />
      <Rect x={-20} y={190} width={440} height={12} fill="#A39A8C" />
      <Path d="M118 140 L160 160 M298 140 L318 150" stroke="#000" strokeWidth={5} opacity={0.12} strokeLinecap="round" />
      <Path d="M114 140V-6" stroke="#2D3436" strokeWidth={4} />
      <Path d="M108 140h12l-2 -8h-8Z M104 -6h20l-4 -16h-12Z" fill="#2D3436" stroke={INK} strokeWidth={1.2} />
      <Path d="M109 -8h10l-2 -11h-6Z" fill="#FFF1C2" />
      <Path d="M290 140v-14q0 -6 6 -6q6 0 6 6v14Z M287 128h18v4h-18Z" fill="#D9443A" stroke={INK} strokeWidth={1.5} />
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Suburbs: two two-storey houses with siding and shingles, a big oak between them, picket fence, lawn and walk.

const SUB = (() => {
  const shingles = (x0: number, x1: number, apexX: number, apexY: number, eaveY: number) => {
    let d = '';
    for (let y = apexY + 9; y < eaveY - 1; y += 7) {
      const t = (y - apexY) / (eaveY - apexY);
      d += `M${(apexX - (apexX - x0) * t).toFixed(1)} ${y}H${(apexX + (x1 - apexX) * t).toFixed(1)}`;
    }
    return d;
  };
  return {
    hills: 'M-20 70 Q40 30 110 56 Q170 20 240 50 Q310 26 420 60 L420 140 L-20 140 Z',
    treeLine: 'M-20 92' + Array.from({ length: 22 }, (_, i) => `q10 -${10 + (i % 3) * 5} 20 0`).join('') + 'L420 140L-20 140Z',
    walls: rect(58, 20, 116, 120) + rect(234, 30, 112, 110),
    siding: gridLines(58, 20, 174, 140, 400, 7) + gridLines(234, 30, 346, 140, 400, 7),
    roofA: 'M46 22 L116 -40 L186 22 Z',
    roofB: 'M222 32 L290 -26 L358 32 Z',
    shingles: shingles(46, 186, 116, -40, 22) + shingles(222, 358, 290, -26, 32),
    chimney: 'M146 -26h14v-28h-14Z',
    glass: rect(72, 34, 26, 30) + rect(134, 34, 26, 30) + rect(72, 86, 26, 30) + rect(248, 44, 26, 28) + rect(306, 44, 26, 28) + rect(306, 92, 26, 28) + rect(103, -14, 26, 22) + rect(277, -6, 26, 20),
    bars: mullions(72, 34, 1, 1, 26, 30, 0, 0) + mullions(134, 34, 1, 1, 26, 30, 0, 0) + mullions(72, 86, 1, 1, 26, 30, 0, 0) + mullions(248, 44, 1, 1, 26, 28, 0, 0) + mullions(306, 44, 1, 1, 26, 28, 0, 0) + mullions(306, 92, 1, 1, 26, 28, 0, 0) + mullions(103, -14, 1, 1, 26, 22, 0, 0) + mullions(277, -6, 1, 1, 26, 20, 0, 0),
    shutters: rect(64, 34, 7, 30) + rect(99, 34, 7, 30) + rect(126, 34, 7, 30) + rect(161, 34, 7, 30) + rect(240, 44, 7, 28) + rect(275, 44, 7, 28) + rect(298, 44, 7, 28) + rect(333, 44, 7, 28),
    doors: 'M130 140V98q0 -10 10 -10h6q10 0 10 10V140Z M250 140V102q0 -9 9 -9h6q9 0 9 9V140Z',
    sides: rect(168, 22, 6, 118) + rect(340, 32, 6, 108),
    canopy: circle(208, -40, 34) + circle(178, -10, 28) + circle(238, -6, 30) + circle(206, 14, 30) + circle(232, -54, 22),
    canopyShade: circle(244, 0, 22) + circle(222, 26, 18) + circle(250, -40, 14),
    canopyLight: circle(186, -34, 12) + circle(196, -60, 9),
    trunk: 'M200 140 L203 30 Q206 18 210 30 L214 140 Z',
    fence: Array.from({ length: 30 }, (_, i) => `M${-16 + i * 15} 140V116l4 -5l4 5V140Z`).join('') + 'M-20 122h440v4h-440Z M-20 132h440v4h-440Z',
    lawnTufts: Array.from({ length: 18 }, (_, i) => `M${(i * 47) % 400} ${150 + ((i * 31) % 44)}l3 -6l2 5l3 -7l2 8`).join(''),
    walk: 'M-20 168 H420 V182 H-20 Z',
    walkJoints: gridLines(-20, 168, 420, 182, 30, 400),
    shadows: 'M174 140 L214 140 L196 150 L160 150 Z M346 140 L386 140 L368 150 L332 150 Z M214 140 L250 140 L240 148 L210 148 Z',
    birds: 'M120 -78 q4 -4 8 0 q4 -4 8 0 M146 -88 q3 -3 6 0 q3 -3 6 0',
  };
})();

function SuburbsScene() {
  return (
    <G>
      <Circle cx={60} cy={-74} r={26} fill="#FFF3B0" opacity={0.5} />
      <Circle cx={60} cy={-74} r={17} fill="#FFE066" />
      <Path d={CLOUDS} fill="#FFFFFF" opacity={0.85} />
      <Path d={SUB.birds} stroke="#4A5A6A" strokeWidth={1.4} fill="none" />
      <Path d={SUB.hills} fill="#B5DFA8" />
      <Path d={SUB.treeLine} fill="#8DC981" />
      {/* mid: houses */}
      <Path d={SUB.chimney} fill="#A0503B" stroke={INK} strokeWidth={1.8} />
      <Path d={SUB.walls} fill="#F6E7C1" stroke={INK} strokeWidth={2.2} />
      <Path d={rect(234, 30, 112, 110)} fill="#CFE4F5" stroke={INK} strokeWidth={2.2} />
      <Path d={SUB.siding} stroke="#000" strokeWidth={0.8} opacity={0.12} />
      <Path d={SUB.sides} fill="#000" opacity={0.12} />
      <Path d={SUB.roofA} fill="#C0392B" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d={SUB.roofB} fill="#7E5A44" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d={SUB.shingles} stroke="#000" strokeWidth={1} opacity={0.22} />
      <Path d="M116 -40 L186 22 L170 22 L116 -26 Z M290 -26 L358 32 L342 32 L290 -12 Z" fill="#000" opacity={0.14} />
      <Path d={SUB.shutters} fill="#3F6E8C" stroke={INK} strokeWidth={1} />
      <Path d={SUB.glass} fill="#CFE9F7" stroke={INK} strokeWidth={1.6} />
      <Path d={SUB.bars} stroke="#FFFFFF" strokeWidth={1.8} />
      <Path d={SUB.doors} fill="#8E5A3C" stroke={INK} strokeWidth={1.8} />
      {/* the oak between the houses */}
      <Path d={SUB.trunk} fill="#7A5236" stroke={INK} strokeWidth={1.8} />
      {/* outline under, fill over: the puffs read as one canopy */}
      <Path d={SUB.canopy} fill="none" stroke={INK} strokeWidth={4} />
      <Path d={SUB.canopy} fill="#5DAE55" />
      <Path d={SUB.canopyShade} fill="#3F8A3E" opacity={0.75} />
      <Path d={SUB.canopyLight} fill="#9ED58F" opacity={0.7} />
      {/* near: fence, lawn, walk */}
      <Ground y={140} fill="#7BC96F" />
      <Path d={SUB.shadows} fill="#1F5A2A" opacity={0.25} />
      <Path d={SUB.fence} fill="#FFFFFF" stroke={INK} strokeWidth={1.2} />
      <Path d={SUB.lawnTufts} stroke="#4E9A4A" strokeWidth={1.4} fill="none" />
      <Path d={SUB.walk} fill="#E6DCCB" />
      <Path d={SUB.walkJoints + 'M-20 168H420M-20 182H420'} stroke="#BBAE98" strokeWidth={1.2} />
      <Path d="M300 140v-22M294 118h14v-9q0 -5 -7 -5q-7 0 -7 5Z" fill="#2F80ED" stroke={INK} strokeWidth={1.6} />
      <Path d="M308 112h4v-6h-4" fill="#E8432E" stroke={INK} strokeWidth={1} />
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Waterfront at sunset: far shore skyline, the PIER 9 warehouse, a sailboat, gulls, a glittering bay and a plank dock.

const WF = (() => {
  const dock = planks(-20, 420, 146, 212, 200, 10, 26);
  const flags = alongQuad([96, -34], [190, 0], [276, -24], 9);
  return {
    shore: skyline(70, [[-10, 22, 30], [14, 14, 44], [40, 18, 26], [150, 16, 30], [168, 12, 48], [182, 18, 26], [204, 14, 56], [220, 20, 34], [244, 12, 40], [262, 18, 24], [340, 20, 34], [362, 14, 46], [380, 24, 28]]),
    water: 'M-20 70H420V150H-20Z',
    waves: Array.from({ length: 9 }, (_, i) => `M${-20 + ((i * 61) % 60)} ${80 + i * 8}` + Array.from({ length: 8 }, () => 'q12 -3 24 0t24 0').join('')).join(''),
    glitter: Array.from({ length: 9 }, (_, i) => `M${132 + ((i * 17) % 30) - 15} ${76 + i * 7}h${14 - (i % 3) * 4}`).join(''),
    boat: { hull: 'M100 104 L162 104 L152 118 L110 118 Z', stripe: 'M103 108 L159 108', mast: 'M132 104 V0', sail: 'M134 6 L134 100 L166 100 Z', jib: 'M130 12 L130 100 L106 100 Z', wake: 'M108 121 h46 l-6 4 h-34 Z' },
    warehouse: 'M222 146 V10 L276 -24 L330 10 V146 Z',
    corrugated: Array.from({ length: 13 }, (_, i) => {
      const x = 226 + i * 8;
      return `M${x} ${n1(x < 276 ? 10 - ((x - 222) * 34) / 54 : 10 - ((330 - x) * 34) / 54)}V146`;
    }).join(''),
    door: rect(236, 70, 52, 76),
    doorSlats: gridLines(236, 70, 288, 146, 400, 6),
    bunting: 'M96 -34 Q190 0 276 -24',
    flagsA: flags.filter((_, i) => i % 2 === 0).map(([x, y]) => `M${n1(x - 5)} ${n1(y)}l10 0l-5 9Z`).join(''),
    flagsB: flags.filter((_, i) => i % 2 === 1).map(([x, y]) => `M${n1(x - 5)} ${n1(y)}l10 0l-5 9Z`).join(''),
    gulls: 'M176 -72 q5 -5 10 0 q5 -5 10 0 M206 -88 q4 -4 8 0 q4 -4 8 0 M236 -60 q3 -3 6 0 q3 -3 6 0',
    dock,
    bollard: 'M286 146 v-14 q0 -5 8 -5 q8 0 8 5 v14 Z',
    rope: circle(274, 146, 10, 3.6) + circle(274, 143, 6.5, 2.6),
    crates: rect(98, 122, 26, 24) + rect(104, 104, 20, 18),
    crateSlats: 'M98 130h26M98 138h26M104 110h20M104 116h20',
    shadows: 'M124 146 L150 146 L142 154 L118 154 Z M302 146 L322 146 L314 154 L296 154 Z',
  };
})();

function WaterfrontScene({ glow }: Ids) {
  return (
    <G>
      <Circle cx={132} cy={-58} r={56} fill={`url(#${glow})`} />
      <Circle cx={132} cy={-58} r={24} fill="#FFB347" />
      <Path d={CLOUDS} fill="#FFF1E2" opacity={0.75} />
      <Path d={WF.gulls} stroke="#5A3A3A" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d={WF.shore} fill="#C98C8C" opacity={0.5} />
      {/* bay */}
      <Path d={WF.water} fill="#3E8FC2" />
      <Rect x={-20} y={70} width={440} height={12} fill="#F7B07A" opacity={0.35} />
      <Path d={WF.waves} stroke="#9ED4F2" strokeWidth={1.4} fill="none" opacity={0.7} />
      <Path d={WF.glitter} stroke="#FFE2A0" strokeWidth={2} strokeLinecap="round" />
      {/* a sailboat out in the bay */}
      <Path d={WF.boat.mast} stroke={INK} strokeWidth={2} />
      <Path d={WF.boat.sail} fill="#FFF7E0" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d={WF.boat.jib} fill="#F9E79F" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d={WF.boat.hull} fill="#FFFFFF" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Path d={WF.boat.stripe} stroke="#E8432E" strokeWidth={2.4} />
      <Path d={WF.boat.wake} fill="#FFFFFF" opacity={0.3} />
      {/* Pier 9 warehouse */}
      <Path d={WF.warehouse} fill="#8FA7A8" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d={WF.corrugated} stroke="#6D8586" strokeWidth={1.4} />
      <Path d="M300 -5 L330 10 V146 H312 V0 Z" fill="#000" opacity={0.14} />
      <Path d={WF.door} fill="#B6C4C4" stroke={INK} strokeWidth={1.8} />
      <Path d={WF.doorSlats} stroke="#8EA0A0" strokeWidth={1} />
      <Rect x={234} y={20} width={68} height={26} rx={3} fill="#1F4E79" stroke={INK} strokeWidth={2} />
      <Text x={268} y={39} fontSize={16} fontFamily={F.bold} fill="#FFF4E0" textAnchor="middle">
        PIER 9
      </Text>
      <Path d={WF.bunting} stroke={INK} strokeWidth={1.2} fill="none" />
      <Path d={WF.flagsA} fill="#E8432E" />
      <Path d={WF.flagsB} fill="#FFC531" />
      {/* near: plank dock */}
      <Rect x={-20} y={146} width={440} height={70} fill="#A0703F" />
      <Path d={WF.dock.lines + WF.dock.joints} stroke="#6E4A28" strokeWidth={1.3} />
      <Path d={WF.dock.grain} stroke="#C49060" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Path d="M-20 146H420" stroke={INK} strokeWidth={2} />
      <Rect x={-20} y={146} width={440} height={5} fill="#000" opacity={0.15} />
      <Path d={WF.shadows} fill="#000" opacity={0.18} />
      <Path d={WF.crates} fill="#C99A5E" stroke={INK} strokeWidth={1.6} />
      <Path d={WF.crateSlats} stroke="#8E6A3C" strokeWidth={1} />
      <Path d={WF.rope} fill="none" stroke="#D9C08A" strokeWidth={3} />
      <Path d={WF.bollard} fill="#3D3D45" stroke={INK} strokeWidth={1.6} />
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// University: brick hall with a columned portico, pediment and clock tower; ivy, banners, lawn and walk.

const UNI = (() => {
  const colsX = [146, 168, 190, 212, 234];
  return {
    trees: 'M-20 110' + Array.from({ length: 20 }, (_, i) => `q11 -${14 + (i % 4) * 4} 22 0`).join('') + 'L420 140L-20 140Z',
    hall: rect(40, 20, 320, 120),
    brick: bricks(40, 20, 136, 140, 6, 14) + bricks(264, 20, 360, 140, 6, 14),
    wings: windows(52, 34, 4, 3, 14, 22, 21, 34) + windows(272, 34, 4, 3, 14, 22, 21, 34),
    arches: Array.from({ length: 8 }, (_, i) => {
      const x = (i < 4 ? 52 : 188) + i * 21;
      return Array.from({ length: 3 }, (_, r) => `M${x} ${34 + r * 34}q7 -8 14 0`).join('');
    }).join(''),
    bars: mullions(52, 34, 4, 3, 14, 22, 21, 34) + mullions(272, 34, 4, 3, 14, 22, 21, 34),
    portico: rect(136, 20, 128, 120),
    columns: colsX.map((x) => rect(x, 30, 14, 100)).join(''),
    fluting: colsX.map((x) => `M${x + 4} 32V128M${x + 8} 32V128`).join(''),
    capitals: colsX.map((x) => rect(x - 3, 26, 20, 5) + rect(x - 3, 128, 20, 5)).join(''),
    pediment: 'M128 22 L200 -24 L272 22 Z',
    tower: rect(178, -70, 44, 48),
    towerTop: 'M172 -70 L200 -104 L228 -70 Z',
    steps: rect(140, 132, 120, 4) + rect(134, 136, 132, 4),
    ivy: circle(50, 60, 9) + circle(44, 76, 10) + circle(54, 90, 8) + circle(350, 70, 9) + circle(354, 88, 10) + circle(344, 104, 8) + circle(130, 34, 6) + circle(126, 46, 7),
    walk: 'M176 140 L224 140 L262 202 L138 202 Z',
    lawnTufts: Array.from({ length: 16 }, (_, i) => `M${(i * 53) % 400} ${152 + ((i * 29) % 40)}l3 -6l2 5l3 -7l2 8`).join(''),
    shadows: 'M360 140 L396 140 L380 150 L346 150 Z',
  };
})();

function UniversityScene() {
  return (
    <G>
      <Path d={CLOUDS} fill="#FFFFFF" opacity={0.7} />
      <Path d={UNI.trees} fill="#A9C99A" />
      <Path d={UNI.hall} fill="#B5583F" stroke={INK} strokeWidth={2.4} />
      <Path d={UNI.brick} stroke="#7E3A26" strokeWidth={0.9} opacity={0.5} />
      <Path d={UNI.wings} fill="#F4E6B8" stroke={INK} strokeWidth={1.3} />
      <Path d={UNI.arches} fill="#E8D8C3" stroke={INK} strokeWidth={1.3} />
      <Path d={UNI.bars} stroke="#8E5A3C" strokeWidth={1.1} />
      <Path d={UNI.ivy} fill="#4E8A3E" opacity={0.9} />
      <Path d="M354 20h6v120h-6Z" fill="#000" opacity={0.15} />
      {/* portico, pediment, clock tower */}
      <Path d={UNI.tower} fill="#E8D8C3" stroke={INK} strokeWidth={2.2} />
      <Path d="M212 -70h10v48h-10Z" fill="#000" opacity={0.12} />
      <Path d={UNI.towerTop} fill="#3E6B8C" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M200 -104V-118" stroke={INK} strokeWidth={2} />
      <Circle cx={200} cy={-46} r={14} fill="#FFFDF5" stroke={INK} strokeWidth={2} />
      <Path d="M200 -46V-56M200 -46L207 -42" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <Path d={UNI.portico} fill="#EFE3D2" stroke={INK} strokeWidth={2} />
      <Path d="M150 30h100v100h-100Z" fill="#5A4636" opacity={0.35} />
      <Path d={UNI.columns} fill="#FFFFFF" stroke={INK} strokeWidth={1.4} />
      <Path d={UNI.fluting} stroke="#C9BBA8" strokeWidth={1} />
      <Path d={UNI.capitals} fill="#F4EBDD" stroke={INK} strokeWidth={1.2} />
      <Path d={UNI.pediment} fill="#E8D8C3" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M150 14 L200 -12 L250 14 Z" fill="#000" opacity={0.08} />
      <Text x={200} y={11} fontSize={8} fontFamily={F.bold} fill="#7A5236" textAnchor="middle">
        MMXXV
      </Text>
      <Path d={UNI.steps} fill="#D9CDBB" stroke={INK} strokeWidth={1.2} />
      {/* near: lawn, walk, lamp with a banner */}
      <Ground y={140} fill="#7BC96F" />
      <Path d={UNI.walk} fill="#E6DCCB" />
      <Path d="M180 150H220M172 164H228M162 182H238" stroke="#C9BBA8" strokeWidth={1.2} />
      <Path d={UNI.lawnTufts} stroke="#4E9A4A" strokeWidth={1.4} fill="none" />
      <Path d={UNI.shadows} fill="#1F5A2A" opacity={0.22} />
      <Path d="M112 140V40M296 140V40" stroke="#2D3436" strokeWidth={3.5} />
      <Path d="M114 50h20v30l-10 -6l-10 6Z M298 50h20v30l-10 -6l-10 6Z" fill="#6A3FB5" stroke={INK} strokeWidth={1.4} />
      <Path d="M107 40h10l-2 -10h-6Z M291 40h10l-2 -10h-6Z" fill="#2D3436" />
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Industrial: hazy factory skyline and a crane, a sawtooth-roofed brick hall with big multi-pane windows, two
// chimneys with steam, a water tower, the orange corrugated shed, the MEGASLICE billboard; asphalt with a hazard line.

const IND = (() => {
  const saw = 'M24 140 V26 ' + Array.from({ length: 6 }, (_, i) => `L${60 + i * 36} -6 V26 `).join('') + 'V140 Z';
  return {
    farFactories: skyline(140, [[-10, 40, 120], [30, 24, 150], [70, 36, 110], [120, 20, 190], [150, 44, 130], [214, 30, 170], [260, 40, 140], [320, 22, 200], [350, 50, 120]]),
    crane:
      'M64 140 V-74 M76 140 V-74 M64 -74 H76 M70 -74 V-98 M70 -98 L260 -84 M70 -98 L36 -84 M70 -74 L260 -84' +
      Array.from({ length: 13 }, (_, i) => `M64 ${124 - i * 15}L76 ${110 - i * 15}`).join('') +
      Array.from({ length: 9 }, (_, i) => `M${84 + i * 20} ${n1(-74 - (i * 20 + 14) * 0.0526)}L${94 + i * 20} ${n1(-98 + (i * 20 + 24) * 0.0737)}`).join('') +
      'M214 -88V-44',
    hook: 'M210 -44h8v6h-8Z',
    hall: saw,
    sawGlass: Array.from({ length: 6 }, (_, i) => `M${50 + i * 36} 2.9 L${59 + i * 36} -5 L${59 + i * 36} 24 L${50 + i * 36} 24 Z`).join(''),
    brick: bricks(24, 26, 240, 140, 6, 14),
    bigWindows: windows(36, 46, 4, 1, 36, 50, 50, 0),
    panes: Array.from({ length: 4 }, (_, i) => gridLines(36 + i * 50, 46, 72 + i * 50, 96, 9, 10)).join(''),
    loading: rect(96, 104, 52, 36),
    shutter: gridLines(96, 104, 148, 140, 400, 4),
    chimneys: 'M108 30 V-62 h18 V30 Z M140 30 V-34 h14 V30 Z',
    chimneyBands: 'M108 -54h18M108 -46h18M140 -28h14',
    steam: circle(120, -74, 9) + circle(134, -86, 12) + circle(152, -96, 10) + circle(170, -104, 12) + circle(146, -106, 7) + circle(150, -44, 6) + circle(160, -54, 8) + circle(174, -60, 6),
    tower: { legs: 'M254 66L260 18M290 66L284 18M272 66V18M256 44H288', tank: 'M248 18 q0 -36 24 -36 q24 0 24 36 Z', bands: 'M250 6h44M252 -6h40' },
    shed: rect(244, 66, 176, 74),
    shedRibs: gridLines(244, 66, 420, 140, 7, 400),
    shedRoof: 'M240 68 L330 48 L424 68 Z',
    hazard: Array.from({ length: 14 }, (_, i) => `M${-20 + i * 32} 176l14 0l-8 10l-14 0Z`).join(''),
    cracks: 'M60 160l12 6l6 -3l10 8M300 190l8 -6l10 2M200 150l-6 8l8 6',
    barrels: 'M100 140v-26q9 -4 18 0v26Z M120 140v-26q9 -4 18 0v26Z',
    barrelBands: 'M100 122q9 3 18 0M100 132q9 3 18 0M120 122q9 3 18 0M120 132q9 3 18 0',
    shadows: 'M138 140 L160 140 L150 148 L128 148 Z',
  };
})();

function IndustrialScene() {
  return (
    <G>
      <Path d={IND.farFactories} fill="#A3A0AC" opacity={0.5} />
      <Path d={IND.crane} stroke="#767487" strokeWidth={1.8} fill="none" opacity={0.7} />
      <Path d={IND.hook} fill="#767487" opacity={0.7} />
      <Billboard x={172} y={-106} w={124} />
      {/* chimneys, steam drifting up and right */}
      <Path d={IND.steam} fill="#F4F0EA" opacity={0.8} />
      <Path d={IND.chimneys} fill="#8B5A3C" stroke={INK} strokeWidth={2} />
      <Path d={IND.chimneyBands} stroke="#E8E2D8" strokeWidth={3} />
      <Path d="M120 -62h6v92h-6Z M150 -34h4v64h-4Z" fill="#000" opacity={0.16} />
      {/* the hall */}
      <Path d={IND.hall} fill="#9C6A52" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d={IND.brick} stroke="#6E4434" strokeWidth={0.9} opacity={0.45} />
      <Path d={IND.sawGlass} fill="#C9D6DA" stroke={INK} strokeWidth={1.2} />
      <Path d={IND.bigWindows} fill="#B9CCD3" stroke={INK} strokeWidth={1.8} />
      <Path d={IND.panes} stroke="#4E5A60" strokeWidth={1} />
      <Path d={IND.loading} fill="#7D8A90" stroke={INK} strokeWidth={1.8} />
      <Path d={IND.shutter} stroke="#5E6A70" strokeWidth={1} />
      {/* water tower over the orange shed */}
      <Path d={IND.tower.legs} stroke="#3D3540" strokeWidth={2.4} />
      <Path d={IND.tower.tank} fill="#9AA3AD" stroke={INK} strokeWidth={2} />
      <Path d={IND.tower.bands} stroke="#6E7781" strokeWidth={1.5} />
      <Path d="M282 -16 q12 8 14 34 h-10 q-1 -20 -4 -34 Z" fill="#000" opacity={0.14} />
      <Path d={IND.shed} fill="#E67E22" stroke={INK} strokeWidth={2.2} />
      <Path d={IND.shedRibs} stroke="#B85E12" strokeWidth={1.4} />
      <Path d={IND.shedRoof} fill="#B85E12" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M240 68h6v72h-6Z" fill="#000" opacity={0.2} />
      {/* near: asphalt, hazard line, barrels */}
      <Ground y={140} fill="#6D6D72" />
      <Path d={IND.hazard} fill="#F2C94C" />
      <Path d={IND.cracks} stroke="#4E4E52" strokeWidth={1.3} fill="none" />
      <Path d={IND.shadows} fill="#000" opacity={0.2} />
      <Path d={IND.barrels} fill="#3F7FBF" stroke={INK} strokeWidth={1.6} />
      <Path d={IND.barrelBands} stroke="#2A5A8A" strokeWidth={1.4} fill="none" />
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Uptown at night: stars and moon, a lit skyline, an art-deco tower, the billboard, lamp-lit sidewalk and a canopy.

const UP = (() => {
  const B: [number, number, number, string][] = [
    [-20, 60, -20, '#41436A'],
    [60, 130, -60, '#5B5F97'],
    [130, 196, -76, '#3A3D66'],
    [196, 270, -40, '#984063'],
    [270, 336, -76, '#41436A'],
    [336, 420, -10, '#5B5F97'],
  ];
  const lit = (c: number, r: number) => (c * 7 + r * 3) % 5 < 2;
  const grids = B.map(([x0, x1, top]) => {
    const cols = Math.floor((x1 - x0 - 10) / 14);
    const left = x0 + (x1 - x0 - (cols * 14 - 6)) / 2;
    const rows = Math.floor((96 - top - 10) / 16);
    return { on: windows(left, top + 12, cols, rows, 8, 10, 14, 16, (c, r) => !lit(c + x0, r)), off: windows(left, top + 12, cols, rows, 8, 10, 14, 16, (c, r) => lit(c + x0, r)) };
  });
  let stars = '';
  for (let i = 0; i < 18; i++) stars += circle((i * 83) % 400, -108 + ((i * 47) % 70), i % 3 ? 1 : 1.6);
  return {
    B,
    far: skyline(140, [[-10, 30, 200], [40, 24, 230], [90, 34, 210], [150, 26, 250], [210, 30, 230], [250, 24, 260], [300, 34, 215], [360, 30, 240]]),
    on: grids.map((g) => g.on).join(''),
    off: grids.map((g) => g.off).join(''),
    crown: 'M136 -76 L136 -86 L146 -86 L146 -94 L156 -94 L163 -112 L170 -94 L180 -94 L180 -86 L190 -86 L190 -76 Z',
    crownLines: 'M163 -112 V-128 M142 -82h42M150 -90h26',
    sides: 'M124 -60h6v200h-6Z M190 -76h6v216h-6Z M330 -76h6v216h-6Z',
    stars,
    canopy: 'M206 96 H296 L304 110 H198 Z',
    canopyTrim: 'M198 110 H304',
    lampPoles: 'M110 140V30M318 140V30',
    lampHeads: circle(110, 26, 6) + circle(318, 26, 6),
    paving: gridLines(-20, 140, 420, 200, 44, 20),
    planters: 'M88 140 l4 -16 h22 l4 16 Z M298 140 l4 -16 h22 l4 16 Z',
    hedges: circle(103, 116, 11, 9) + circle(313, 116, 11, 9),
  };
})();

function UptownScene({ glow }: Ids) {
  return (
    <G>
      <Path d={UP.stars} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={330} cy={-84} r={24} fill={`url(#${glow})`} opacity={0.5} />
      <Circle cx={330} cy={-84} r={13} fill="#FFF3B0" />
      <Path d={UP.far} fill="#2B2F5A" opacity={0.7} />
      {UP.B.map(([x0, x1, top, c]) => (
        <Path key={x0} d={rect(x0, top, x1 - x0, 140 - top)} fill={c} stroke={INK} strokeWidth={2} />
      ))}
      <Path d={UP.crown} fill="#C9A86A" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d={UP.crownLines} stroke={INK} strokeWidth={1.4} />
      <Path d={UP.sides} fill="#000" opacity={0.22} />
      <Path d={UP.off} fill="#262A4E" />
      <Path d={UP.on} fill="#FFD27A" />
      <Billboard x={192} y={-100} w={104} />
      {/* the restaurant canopy */}
      <Path d={UP.canopy} fill="#7A1F3D" stroke={INK} strokeWidth={1.8} />
      <Path d={UP.canopyTrim} stroke="#E6C26E" strokeWidth={2.4} />
      <Path d="M210 112h88v28h-88Z" fill="#FFD27A" opacity={0.55} />
      {/* near: sidewalk under lamps */}
      <Ground y={140} fill="#3A3858" />
      <Path d={UP.paving} stroke="#2C2A46" strokeWidth={1.2} />
      <Ellipse cx={110} cy={160} rx={46} ry={12} fill={`url(#${glow})`} opacity={0.55} />
      <Ellipse cx={318} cy={160} rx={46} ry={12} fill={`url(#${glow})`} opacity={0.55} />
      <Path d={UP.lampPoles} stroke="#1A1A2A" strokeWidth={3.5} />
      <Circle cx={110} cy={26} r={20} fill={`url(#${glow})`} />
      <Circle cx={318} cy={26} r={20} fill={`url(#${glow})`} />
      <Path d={UP.lampHeads} fill="#FFF3C8" stroke={INK} strokeWidth={1.4} />
      <Path d={UP.planters} fill="#8E8EA8" stroke={INK} strokeWidth={1.4} />
      <Path d={UP.hedges} fill="#2E6B4F" stroke={INK} strokeWidth={1.4} />
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// MegaSlice HQ: searchlights, a glass tower with the logo at its crown, a lobby and a paved plaza with topiaries.

const HQ = (() => ({
  beams: 'M180 -20 L60 -130 L100 -130 Z M220 -20 L340 -130 L300 -130 Z',
  far: skyline(140, [[-10, 40, 160], [36, 30, 200], [74, 30, 150], [300, 30, 190], [336, 34, 160], [376, 40, 210]]),
  tower: 'M110 140 V-80 L200 -112 L290 -80 V140 Z',
  side: 'M290 -80 L306 -74 V140 H290 Z',
  glass: windows(118, -64, 8, 9, 18, 14, 21.4, 18, (c, r) => (c + r * 3) % 7 === 0),
  mullions: gridLines(110, -70, 290, 96, 21.4, 18),
  glare: 'M120 60 L180 -60 L196 -60 L136 60 Z M150 90 L196 0 L204 0 L158 90 Z',
  lobby: rect(140, 96, 120, 44),
  lobbyGlass: gridLines(140, 96, 260, 140, 20, 400),
  paving: gridLines(-20, 140, 420, 200, 30, 18),
  planters: 'M64 140 l4 -14 h24 l4 14 Z M304 140 l4 -14 h24 l4 14 Z',
  topiary: 'M80 126 L70 92 L80 64 L90 92 Z M320 126 L310 92 L320 64 L330 92 Z',
}))();

function HqScene({ glow }: Ids) {
  return (
    <G>
      <Path d={HQ.beams} fill="#E2B8FF" opacity={0.14} />
      <Path d={HQ.far} fill="#24082F" opacity={0.6} />
      <Path d={HQ.side} fill="#1A0526" stroke="#000" strokeWidth={2} />
      <Path d={HQ.tower} fill="#2A0A3A" stroke="#000" strokeWidth={3} strokeLinejoin="round" />
      <Path d={HQ.glass} fill="#C77DFF" opacity={0.42} />
      <Path d={HQ.mullions} stroke="#14041D" strokeWidth={1.2} />
      <Path d={HQ.glare} fill="#FFFFFF" opacity={0.08} />
      {/* logo at the crown, above the speaker's head */}
      <Circle cx={200} cy={-82} r={26} fill={`url(#${glow})`} opacity={0.6} />
      <Path d="M200 -104 L222 -66 L178 -66 Z" fill="#FFC531" stroke="#000" strokeWidth={2.6} strokeLinejoin="round" />
      <Path d={circle(196, -76, 3.6) + circle(206, -72, 3.2) + circle(199, -88, 2.8)} fill="#E8432E" />
      <Rect x={150} y={-58} width={100} height={18} rx={3} fill="#14041D" stroke="#C77DFF" strokeWidth={1.6} />
      <Text x={200} y={-45} fontSize={12} fontFamily={F.bold} fill="#FFC531" textAnchor="middle">
        MEGASLICE
      </Text>
      <Path d={HQ.lobby} fill="#E2B8FF" opacity={0.35} />
      <Path d={HQ.lobbyGlass + 'M140 96H260'} stroke="#000" strokeWidth={1.6} />
      {/* near: plaza */}
      <Ground y={140} fill="#4B2A5E" line="#000" />
      <Path d={HQ.paving} stroke="#3A1E4A" strokeWidth={1.2} />
      <Ellipse cx={200} cy={150} rx={80} ry={10} fill={`url(#${glow})`} opacity={0.35} />
      <Path d={HQ.topiary} fill="#2E6B4F" stroke="#000" strokeWidth={1.4} />
      <Path d={HQ.planters} fill="#6E6E86" stroke="#000" strokeWidth={1.4} />
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Downtown in the rain (the opening shot): Rosa's storefront with its half-dark neon, lit neighbours, a moon behind
// the rain, a wet kerb that reflects the window glow.

const RAIN = (() => ({
  far: skyline(120, [[0, 30, 70], [34, 30, 95], [62, 30, 60], [96, 30, 120], [130, 30, 80], [168, 30, 105], [210, 30, 70], [246, 30, 130], [282, 30, 85], [318, 30, 110], [356, 30, 75]]),
  farLit: [[34, 95], [96, 120], [168, 105], [246, 130], [318, 110]].map(([x, h]) => windows(x + 6, 120 - h + 8, 2, Math.floor((h - 12) / 16), 6, 7, 12, 16, (c, r) => (c + r + x) % 3 === 1)).join(''),
  neighbours: rect(98, 28, 60, 172) + rect(242, 38, 60, 162),
  neighbourWin: windows(104, 36, 4, 10, 6, 8, 12, 14) + windows(248, 46, 4, 10, 6, 8, 12, 14),
  neighbourGlow: windows(102, 34, 4, 10, 10, 12, 12, 14) + windows(246, 44, 4, 10, 10, 12, 12, 14),
  cornices: rect(95, 24, 66, 6) + rect(239, 34, 66, 6),
  front: rect(120, 88, 160, 112),
  brick: bricks(121, 115, 279, 199, 9, 20),
  scallops: [136, 168, 200, 232, 264].map((x) => `M${x - 12} 118q12 12 24 0Z`).join(''),
  rain: rain(60, -40, 440, -320, 200, 18),
  splash: 'M150 194 q10 -2 20 0 M232 196 q12 -2 24 0 M60 192 q8 -2 16 0 M330 194 q10 -2 20 0',
}))();

function RainScene({ glow }: Ids) {
  return (
    <G>
      <Circle cx={248} cy={-26} r={34} fill="#E8E4FF" opacity={0.12} />
      <Circle cx={248} cy={-26} r={22} fill="#E8E4FF" opacity={0.92} />
      <Path d={circle(240, -32, 5) + circle(256, -18, 3.4)} fill="#D2CCF2" opacity={0.7} />
      <Path d={RAIN.far} fill="#141028" opacity={0.4} />
      <Path d={RAIN.farLit} fill="#FFD27A" opacity={0.55} />
      {/* lit neighbours either side of Rosa's */}
      <Path d={RAIN.neighbours} fill="#463F66" stroke={INK} strokeWidth={2} />
      <Path d={RAIN.cornices} fill="#2E2948" stroke={INK} strokeWidth={1.5} />
      <Path d={RAIN.neighbourGlow} fill="#FFD27A" opacity={0.22} />
      <Path d={RAIN.neighbourWin} fill="#FFD27A" opacity={0.9} />
      <Path d="M150 28h8v172h-8Z M294 38h8v162h-8Z" fill="#000" opacity={0.2} />
      {/* Rosa's storefront */}
      <Path d={RAIN.front} fill="#8E3B2E" stroke={INK} strokeWidth={2.4} />
      <Path d={RAIN.brick} stroke="#6E2A20" strokeWidth={1} />
      <Rect x={250} y={89} width={29} height={110} fill="#000" opacity={0.18} />
      <Rect x={121} y={89} width={8} height={110} fill="#fff" opacity={0.1} />
      <Path d="M112 96 L288 96 L276 118 L124 118 Z" fill="#E8432E" stroke={INK} strokeWidth={2} />
      <Path d="M118 99 L282 99" stroke="#fff" strokeWidth={2} opacity={0.3} />
      <Path d={RAIN.scallops} fill="#FFFFFF" stroke={INK} strokeWidth={1.4} />
      <Rect x={124} y={126} width={152} height={8} fill="#000" opacity={0.22} />
      <Rect x={138} y={131} width={64} height={57} rx={2} fill="#5A2A1F" stroke={INK} strokeWidth={2} />
      <Rect x={142} y={134} width={56} height={50} fill="#F7C873" stroke={INK} strokeWidth={1.6} />
      <Path d="M170 134 V184 M142 158 H198" stroke="#5A2A1F" strokeWidth={2.4} />
      <Path d="M148 180 L162 138 M156 180 L168 146" stroke="#fff" strokeWidth={2.4} opacity={0.4} strokeLinecap="round" />
      <Rect x={136} y={186} width={68} height={5} rx={1.5} fill="#5A2A1F" stroke={INK} strokeWidth={1.2} />
      <Rect x={214} y={134} width={44} height={66} fill="#5A2A1F" stroke={INK} strokeWidth={2} />
      <Path d="M219 139h34v24h-34Z M219 168h34v26h-34Z" fill="#7A3A2A" stroke={INK} strokeWidth={1} />
      <Circle cx={250} cy={168} r={2.2} fill="#E0B000" stroke={INK} strokeWidth={0.8} />
      {/* flickering neon sign: half the letters dark */}
      <Rect x={130} y={38} width={140} height={46} rx={10} fill={`url(#${glow})`} opacity={0.5} />
      <Rect x={136} y={44} width={128} height={38} rx={8} fill="#1E1630" stroke="#FF5E7E" strokeWidth={3} />
      <Text x={200} y={71} fontSize={24} fontFamily={F.bold} fill="#FF8FA3" textAnchor="middle" opacity={0.95}>
        ROSA’S
      </Text>
      <Rect x={213} y={50} width={46} height={27} fill="#1E1630" opacity={0.75} />
      {/* wet sidewalk: kerb, the window's glow reflected, splashes */}
      <Rect x={0} y={186} width={400} height={14} fill="#4A4566" />
      <Rect x={0} y={186} width={400} height={3} fill="#3A3550" />
      <Ellipse cx={170} cy={194} rx={40} ry={6} fill={`url(#${glow})`} />
      <Path d={RAIN.splash} stroke="#8D86B8" strokeWidth={1.4} opacity={0.6} fill="none" />
      <Path d={RAIN.rain} stroke="#B9C6FF" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
    </G>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Props (scene-specific foreground pieces, in the top half, clear of the cast's heads)

/** Pier 9 sign: board above the speaker's cap, its post planted in the dock left of her. */
function SoldSign() {
  return (
    <G>
      <Path d="M124 4h8v146h-8Z" fill="#6B4423" stroke={INK} strokeWidth={2} />
      <Path d="M132 150 L154 150 L146 156 L126 156 Z" fill="#000" opacity={0.2} />
      <Path d="M110 -40h100v46h-100Z" fill="#000" opacity={0.18} />
      <Rect x={106} y={-44} width={100} height={46} rx={4} fill="#F2E2B8" stroke={INK} strokeWidth={3} />
      <Path d="M110 -40h92" stroke="#fff" strokeWidth={3} opacity={0.5} />
      <Text x={156} y={-22} fontSize={14} fontFamily={F.bold} fill="#E8432E" textAnchor="middle">
        SOLD SOON
      </Text>
      <Text x={156} y={-7} fontSize={8} fontFamily={F.bold} fill={INK} textAnchor="middle">
        FUTURE MEGASTORE
      </Text>
    </G>
  );
}

/** Rosa's sauce card, pinned on the backsplash right of her head. */
function RecipeCard() {
  return (
    <G transform="rotate(-6 268 72)">
      <Rect x={247} y={48} width={46} height={52} rx={4} fill="#000" opacity={0.18} transform="translate(3 3)" />
      <Rect x={245} y={46} width={46} height={52} rx={4} fill="#FFF4D6" stroke={INK} strokeWidth={2.5} />
      <Circle cx={268} cy={50} r={3} fill="#E8432E" stroke={INK} strokeWidth={1} />
      <Text x={268} y={63} fontSize={7.5} fontFamily={F.bold} fill="#E8432E" textAnchor="middle">
        ROSA’S
      </Text>
      <Text x={268} y={72} fontSize={7.5} fontFamily={F.bold} fill="#E8432E" textAnchor="middle">
        SAUCE
      </Text>
      <Path d="M251 79h34M251 85.5h27M251 92h20" stroke={INK} strokeWidth={2.4} opacity={0.5} strokeLinecap="round" />
    </G>
  );
}

/** MegaSlice vending machine, tall enough that its sign and snack rows show between and above two heads. */
const VEND = {
  rows: gridLines(180, 26, 216, 92, 400, 13),
  snacks: windows(183, 16, 3, 5, 9, 9, 11.5, 13),
  snackHi: windows(184, 17, 3, 5, 3, 3, 11.5, 13),
};
function VendingMachine() {
  return (
    <G>
      <Path d="M236 140 L262 140 L252 148 L226 148 Z" fill="#000" opacity={0.2} />
      <Rect x={168} y={-6} width={68} height={146} rx={5} fill="#7B2CBF" stroke={INK} strokeWidth={3} />
      <Path d="M226 -4h8v142h-8Z" fill="#000" opacity={0.18} />
      <Rect x={168} y={-22} width={68} height={18} rx={4} fill="#E8432E" stroke={INK} strokeWidth={2} />
      <Text x={202} y={-9} fontSize={12} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
        MEGA
      </Text>
      <Rect x={177} y={6} width={42} height={88} fill="#D9C8EE" stroke={INK} strokeWidth={2} />
      <Path d={VEND.snacks} fill="#FFC531" stroke={INK} strokeWidth={0.9} />
      <Path d={VEND.snackHi} fill="#fff" opacity={0.6} />
      <Path d={VEND.rows} stroke="#8E6AB8" strokeWidth={1.4} />
      <Path d="M180 90 L198 8 L206 8 L188 90 Z" fill="#fff" opacity={0.18} />
      <Rect x={222} y={10} width={8} height={30} rx={2} fill="#3A1450" />
      <Rect x={178} y={102} width={42} height={16} fill="#2A0A3A" />
    </G>
  );
}

const SCENES: Record<BackdropId, (ids: Ids) => ReactElement> = {
  shop: ShopScene,
  downtown: DowntownScene,
  suburbs: SuburbsScene,
  waterfront: WaterfrontScene,
  university: UniversityScene,
  industrial: IndustrialScene,
  uptown: UptownScene,
  'megaslice-hq': HqScene,
  'downtown-rain': RainScene,
};

/** Per-scene zoom on the scenery, anchored at the kerb (the rainy opening shot frames Rosa's front). */
const SCENE_ZOOM: Partial<Record<BackdropId, number>> = { 'downtown-rain': 1.15 };

export const Backdrop = memo(function Backdrop({ id, width, height, prop }: { id: BackdropId; width: number; height: number; prop?: 'vending-machine' | 'sold-sign' | 'recipe-card' }) {
  const [top, bottom] = SKY[id];
  // unique per instance: two backdrops on screen (a panel sliding in over the last) never share gradient ids
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ids = { sky: `sky${uid}`, glow: `glow${uid}`, vig: `vig${uid}` };
  // Art is 400 wide with the ground at y 200 and up to 100 units of sky; a taller frame scales up and crops the sides.
  const vbH = Math.max(200, Math.min(300, (400 * height) / width));
  const Scene = SCENES[id];
  const zoom = SCENE_ZOOM[id];
  return (
    <Svg width={width} height={height} viewBox={`0 ${200 - vbH} 400 ${vbH}`} preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
        <RadialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={GLOW[id]} stopOpacity={0.9} />
          <Stop offset="1" stopColor={GLOW[id]} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={ids.vig} cx="50%" cy="42%" r="72%">
          <Stop offset="0.6" stopColor="#1A0A04" stopOpacity={0} />
          <Stop offset="1" stopColor="#1A0A04" stopOpacity={0.42} />
        </RadialGradient>
      </Defs>
      <Rect x={-20} y={-130} width={440} height={340} fill={`url(#${ids.sky})`} />
      {zoom ? (
        <G transform={`translate(200 200) scale(${zoom}) translate(-200 -200)`}>
          <Scene glow={ids.glow} />
        </G>
      ) : (
        <Scene glow={ids.glow} />
      )}
      {prop === 'vending-machine' && <VendingMachine />}
      {prop === 'sold-sign' && <SoldSign />}
      {prop === 'recipe-card' && <RecipeCard />}
      <Rect x={-20} y={200 - vbH - 10} width={440} height={vbH + 20} fill={`url(#${ids.vig})`} />
    </Svg>
  );
});
