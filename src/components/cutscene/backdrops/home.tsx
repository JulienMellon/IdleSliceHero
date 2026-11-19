// The home neighbourhoods' scenes: Downtown, Suburbs, Waterfront, University.
import { Circle, ClipPath, Defs, G, Path, Rect, Text } from 'react-native-svg';

import { F } from '../../../theme';
import {
  LEFT_HOUSE,
  OAK,
  PIER_PLAQUE,
  SUN,
  alongQuad,
  brickPatch,
  n as n1,
  bricks,
  circle,
  gridLines,
  mullions,
  planks,
  rect,
  skyline,
  windows,
} from '../backdrop-art';
import { CLOUDS, FAR_CITY, FAR_CITY_WINDOWS, Ground, INK, type Ids } from './shared';

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
    return {
      glass: windows(left, top + 14, cols, rows, 14, 16, 22, 24, skip),
      bars: mullions(left, top + 14, cols, rows, 14, 16, 22, 24, skip),
      sills: windows(left - 2, top + 30, cols, rows, 18, 3, 22, 24, skip),
    };
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
    tower: {
      legs: 'M276 -26L280 -50M312 -26L308 -50M294 -26V-50M278 -38H310',
      tank: 'M272 -82h44v32q-22 6 -44 0Z',
      bands: 'M272 -72q22 5 44 0M272 -61q22 5 44 0',
      roof: 'M270 -82L294 -102L318 -82Z',
    },
    awningG: 'M68 96H148L152 112H64Z',
    awningR: 'M156 96H248L252 112H152Z',
    awningB: 'M256 96H332L336 112H252Z',
    stripes: [72, 88, 104, 120, 136, 164, 180, 196, 212, 228, 244, 262, 278, 294, 310, 326].map((x) => `M${x} 96h7l1 16h-7Z`).join(''),
    shopGlass: rect(70, 116, 44, 22) + rect(160, 116, 52, 22) + rect(260, 116, 40, 22),
    doors: rect(122, 114, 20, 26) + rect(220, 114, 22, 26) + rect(306, 114, 22, 26),
    paving: gridLines(-20, 140, 420, 200, 40, 22),
  };
})();

export function DowntownScene() {
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
    chimney: `M${LEFT_HOUSE.chimney.x} ${LEFT_HOUSE.chimney.base}h${LEFT_HOUSE.chimney.w}V${LEFT_HOUSE.chimney.top}h${-LEFT_HOUSE.chimney.w}Z`,
    glass:
      rect(72, 34, 26, 30) +
      rect(134, 34, 26, 30) +
      rect(66, 86, 26, 30) +
      rect(248, 44, 26, 28) +
      rect(306, 44, 26, 28) +
      rect(306, 92, 26, 28) +
      rect(103, -14, 26, 22) +
      rect(277, -6, 26, 20),
    bars:
      mullions(72, 34, 1, 1, 26, 30, 0, 0) +
      mullions(134, 34, 1, 1, 26, 30, 0, 0) +
      mullions(66, 86, 1, 1, 26, 30, 0, 0) +
      mullions(248, 44, 1, 1, 26, 28, 0, 0) +
      mullions(306, 44, 1, 1, 26, 28, 0, 0) +
      mullions(306, 92, 1, 1, 26, 28, 0, 0) +
      mullions(103, -14, 1, 1, 26, 22, 0, 0) +
      mullions(277, -6, 1, 1, 26, 20, 0, 0),
    shutters:
      rect(64, 34, 7, 30) +
      rect(99, 34, 7, 30) +
      rect(126, 34, 7, 30) +
      rect(161, 34, 7, 30) +
      rect(240, 44, 7, 28) +
      rect(275, 44, 7, 28) +
      rect(298, 44, 7, 28) +
      rect(333, 44, 7, 28),
    doors: 'M106 140V98q0 -10 10 -10h6q10 0 10 10V140Z M250 140V102q0 -9 9 -9h6q9 0 9 9V140Z',
    sides: rect(168, 22, 6, 118) + rect(340, 32, 6, 108),
    canopy: OAK.canopy.map(([cx, cy, r]) => circle(cx, cy, r)).join(''),
    canopyShade: OAK.shade.map(([cx, cy, r]) => circle(cx, cy, r)).join(''),
    canopyLight: OAK.light.map(([cx, cy, r]) => circle(cx, cy, r)).join(''),
    trunk: `M${OAK.trunkX0} 140 L${OAK.trunkX0 + 3} 30 Q${OAK.trunkX0 + 6} 18 ${OAK.trunkX0 + 10} 30 L${OAK.trunkX1} 140 Z`,
    fence: Array.from({ length: 30 }, (_, i) => `M${-16 + i * 15} 140V116l4 -5l4 5V140Z`).join('') + 'M-20 122h440v4h-440Z M-20 132h440v4h-440Z',
    lawnTufts: Array.from({ length: 18 }, (_, i) => `M${(i * 47) % 400} ${150 + ((i * 31) % 44)}l3 -6l2 5l3 -7l2 8`).join(''),
    walk: 'M-20 168 H420 V182 H-20 Z',
    walkJoints: gridLines(-20, 168, 420, 182, 30, 400),
    shadows: 'M174 140 L214 140 L196 150 L160 150 Z M346 140 L386 140 L368 150 L332 150 Z M152 140 L188 140 L178 148 L148 148 Z',
    birds: 'M120 -78 q4 -4 8 0 q4 -4 8 0 M146 -88 q3 -3 6 0 q3 -3 6 0',
  };
})();

export function SuburbsScene({ oak }: Ids) {
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
      {/* the oak, left of the centre line so no trunk grows out of a figure's cap */}
      <Path d={SUB.trunk} fill="#7A5236" stroke={INK} strokeWidth={1.8} />
      {/* outline under, fill over: the puffs read as one canopy */}
      <Path d={SUB.canopy} fill="none" stroke={INK} strokeWidth={4} />
      <Path d={SUB.canopy} fill="#5DAE55" />
      {/* shading and highlight puffs are clipped to the canopy so none spills into the sky (D398) */}
      <Defs>
        <ClipPath id={oak}>
          <Path d={SUB.canopy} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${oak})`}>
        <Path d={SUB.canopyShade} fill="#3F8A3E" opacity={0.75} />
        <Path d={SUB.canopyLight} fill="#9ED58F" opacity={0.7} />
      </G>
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
    shore: skyline(70, [
      [-10, 22, 30],
      [14, 14, 44],
      [40, 18, 26],
      [150, 16, 30],
      [168, 12, 48],
      [182, 18, 26],
      [204, 14, 56],
      [220, 20, 34],
      [244, 12, 40],
      [262, 18, 24],
      [340, 20, 34],
      [362, 14, 46],
      [380, 24, 28],
    ]),
    water: 'M-20 70H420V150H-20Z',
    waves: Array.from({ length: 9 }, (_, i) => `M${-20 + ((i * 61) % 60)} ${80 + i * 8}` + Array.from({ length: 8 }, () => 'q12 -3 24 0t24 0').join('')).join(
      '',
    ),
    glitter: Array.from({ length: 9 }, (_, i) => `M${132 + ((i * 17) % 30) - 15} ${76 + i * 7}h${14 - (i % 3) * 4}`).join(''),
    boat: {
      hull: 'M100 104 L162 104 L152 118 L110 118 Z',
      stripe: 'M103 108 L159 108',
      mast: 'M132 104 V0',
      sail: 'M134 6 L134 100 L166 100 Z',
      jib: 'M130 12 L130 100 L106 100 Z',
      wake: 'M108 121 h46 l-6 4 h-34 Z',
    },
    warehouse: 'M222 146 V10 L276 -24 L330 10 V146 Z',
    corrugated: Array.from({ length: 13 }, (_, i) => {
      const x = 226 + i * 8;
      return `M${x} ${n1(x < 276 ? 10 - ((x - 222) * 34) / 54 : 10 - ((330 - x) * 34) / 54)}V146`;
    }).join(''),
    door: rect(236, 70, 52, 76),
    doorSlats: gridLines(236, 70, 288, 146, 400, 6),
    bunting: 'M96 -34 Q190 0 276 -24',
    flagsA: flags
      .filter((_, i) => i % 2 === 0)
      .map(([x, y]) => `M${n1(x - 5)} ${n1(y)}l10 0l-5 9Z`)
      .join(''),
    flagsB: flags
      .filter((_, i) => i % 2 === 1)
      .map(([x, y]) => `M${n1(x - 5)} ${n1(y)}l10 0l-5 9Z`)
      .join(''),
    gulls: 'M176 -72 q5 -5 10 0 q5 -5 10 0 M206 -88 q4 -4 8 0 q4 -4 8 0 M236 -60 q3 -3 6 0 q3 -3 6 0',
    dock,
    bollard: 'M286 146 v-14 q0 -5 8 -5 q8 0 8 5 v14 Z',
    rope: circle(274, 146, 10, 3.6) + circle(274, 143, 6.5, 2.6),
    crates: rect(98, 122, 26, 24) + rect(104, 104, 20, 18),
    crateSlats: 'M98 130h26M98 138h26M104 110h20M104 116h20',
    shadows: 'M124 146 L150 146 L142 154 L118 154 Z M302 146 L322 146 L314 154 L296 154 Z',
  };
})();

export function WaterfrontScene({ glow }: Ids) {
  return (
    <G>
      <Circle cx={SUN.cx} cy={SUN.cy} r={SUN.glow} fill={`url(#${glow})`} />
      <Circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill="#FFB347" />
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
      <Rect x={PIER_PLAQUE.x} y={PIER_PLAQUE.y} width={PIER_PLAQUE.w} height={PIER_PLAQUE.h} rx={3} fill="#1F4E79" stroke={INK} strokeWidth={2} />
      <Text x={PIER_PLAQUE.x + PIER_PLAQUE.w / 2} y={PIER_PLAQUE.y + 19} fontSize={14} fontFamily={F.bold} fill="#FFF4E0" textAnchor="middle">
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
    ivy:
      circle(50, 60, 9) +
      circle(44, 76, 10) +
      circle(54, 90, 8) +
      circle(350, 70, 9) +
      circle(354, 88, 10) +
      circle(344, 104, 8) +
      circle(130, 34, 6) +
      circle(126, 46, 7),
    walk: 'M176 140 L224 140 L262 202 L138 202 Z',
    lawnTufts: Array.from({ length: 16 }, (_, i) => `M${(i * 53) % 400} ${152 + ((i * 29) % 40)}l3 -6l2 5l3 -7l2 8`).join(''),
    shadows: 'M360 140 L396 140 L380 150 L346 150 Z',
  };
})();

export function UniversityScene() {
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
