// The rest of the home scenes: Industrial, Uptown, MegaSlice HQ and Downtown in the rain.
import { Circle, Ellipse, G, Path, Rect, Text } from 'react-native-svg';

import { F } from '../../../theme';
import {
  HQ_PLATE,
  INDUSTRIAL_BILLBOARD,
  INDUSTRIAL_POSTS,
  UPTOWN_BILLBOARD,
  n as n1,
  bricks,
  circle,
  gridLines,
  rain,
  rect,
  skyline,
  windows,
} from '../backdrop-art';
import { Billboard, Ground, INK, type Ids } from './shared';

// ---------------------------------------------------------------------------------------------------------------
// Industrial: hazy factory skyline and a crane, a sawtooth-roofed brick hall with big multi-pane windows, two
// chimneys with steam, a water tower, the orange corrugated shed, the MEGASLICE billboard; asphalt with a hazard line.

const IND = (() => {
  const saw = 'M24 140 V26 ' + Array.from({ length: 6 }, (_, i) => `L${60 + i * 36} -6 V26 `).join('') + 'V140 Z';
  return {
    farFactories: skyline(140, [
      [-10, 40, 120],
      [30, 24, 150],
      [70, 36, 110],
      [120, 20, 190],
      [150, 44, 130],
      [214, 30, 170],
      [260, 40, 140],
      [320, 22, 200],
      [350, 50, 120],
    ]),
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
    steam:
      circle(120, -72, 8) +
      circle(131, -81, 10) +
      circle(146, -87, 9) +
      circle(160, -90, 8) +
      circle(141, -92, 5.5) +
      circle(148, -44, 6) +
      circle(157, -52, 7) +
      circle(168, -57, 6),
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

export function IndustrialScene() {
  return (
    <G>
      <Path d={IND.farFactories} fill="#A3A0AC" opacity={0.5} />
      <Path d={IND.crane} stroke="#767487" strokeWidth={1.8} fill="none" opacity={0.7} />
      <Path d={IND.hook} fill="#767487" opacity={0.7} />
      <Billboard {...INDUSTRIAL_BILLBOARD} posts={INDUSTRIAL_POSTS} />
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
    return {
      on: windows(left, top + 12, cols, rows, 8, 10, 14, 16, (c, r) => !lit(c + x0, r)),
      off: windows(left, top + 12, cols, rows, 8, 10, 14, 16, (c, r) => lit(c + x0, r)),
    };
  });
  let stars = '';
  for (let i = 0; i < 18; i++) stars += circle((i * 83) % 400, -108 + ((i * 47) % 70), i % 3 ? 1 : 1.6);
  return {
    B,
    far: skyline(140, [
      [-10, 30, 200],
      [40, 24, 230],
      [90, 34, 210],
      [150, 26, 250],
      [210, 30, 230],
      [250, 24, 260],
      [300, 34, 215],
      [360, 30, 240],
    ]),
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

export function UptownScene({ glow }: Ids) {
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
      <Billboard {...UPTOWN_BILLBOARD} />
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
  far: skyline(140, [
    [-10, 40, 160],
    [36, 30, 200],
    [74, 30, 150],
    [300, 30, 190],
    [336, 34, 160],
    [376, 40, 210],
  ]),
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

export function HqScene({ glow }: Ids) {
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
      <Rect x={HQ_PLATE.x} y={HQ_PLATE.y} width={HQ_PLATE.w} height={HQ_PLATE.h} rx={3} fill="#14041D" stroke="#C77DFF" strokeWidth={1.6} />
      <Text x={HQ_PLATE.x + HQ_PLATE.w / 2} y={HQ_PLATE.y + 13} fontSize={12} fontFamily={F.bold} fill="#FFC531" textAnchor="middle">
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
  far: skyline(120, [
    [0, 30, 70],
    [34, 30, 95],
    [62, 30, 60],
    [96, 30, 120],
    [130, 30, 80],
    [168, 30, 105],
    [210, 30, 70],
    [246, 30, 130],
    [282, 30, 85],
    [318, 30, 110],
    [356, 30, 75],
  ]),
  farLit: [
    [34, 95],
    [96, 120],
    [168, 105],
    [246, 130],
    [318, 110],
  ]
    .map(([x, h]) => windows(x + 6, 120 - h + 8, 2, Math.floor((h - 12) / 16), 6, 7, 12, 16, (c, r) => (c + r + x) % 3 === 1))
    .join(''),
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

export function RainScene({ glow }: Ids) {
  return (
    <G>
      <Circle cx={248} cy={-26} r={34} fill="#E8E4FF" opacity={0.12} />
      <Circle cx={248} cy={-26} r={22} fill="#E8E4FF" opacity={0.92} />
      <Path d={circle(240, -32, 5) + circle(256, -18, 3.4)} fill="#D2CCF2" opacity={0.7} />
      <Path d={RAIN.far} fill="#2D2B47" />
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
