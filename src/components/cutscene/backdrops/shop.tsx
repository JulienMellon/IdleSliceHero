// The shop interior: plaster wall, brick oven, menu board, jars and the plank floor, plus each neighbourhood's window and shelf object (the cities add theirs, see cities/).
import type { ReactElement } from 'react';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect, Text } from 'react-native-svg';

import type { NeighborhoodId } from '../../../content/types';
import { F } from '../../../theme';
import { SHOP_WINDOW, UNI_LIGHTS, shopLookFor, SHOP_SIGNS, STRING_LIGHTS, quadAt, n as n1, circle, gridLines, planks, rect, windows } from '../backdrop-art';
import { cityShopObject, cityShopWindow } from '../../cities';
import { INK, type Ids } from './shared';

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
  // the string lights: built for both cases (a captioned panel hangs none, see lightsFor)
  const lights = (bulbList: [number, number][]) => {
    const bulbs = ['', '', ''];
    let glow = '';
    bulbList.forEach(([x, y], i) => {
      bulbs[i % 3] += circle(x, y + 6, 4, 5);
      glow += circle(x, y + 6, 10);
    });
    return { bulbs, glow };
  };
  const strung = lights(STRING_LIGHTS.bulbs);
  const jarsX = [108, 130, 152, 174];
  const contents = ['#D9443A', '#4E9A4A', '#E8C27A', '#F4EEDC'];
  return {
    wallpaper,
    tiles,
    floor,
    ovenBricks,
    bulbs: strung.bulbs,
    bulbGlow: strung.glow,
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

export function ShopScene({ glow, lights, hood }: Ids) {
  const S = SHOP;
  const L = shopLookFor(hood);
  const own = !!hood && hood !== 'downtown';
  return (
    <G>
      {/* far: plaster wall, wallpaper stripes */}
      <Path d={S.wallpaper} stroke={L.stripe} strokeWidth={5} opacity={own ? 0.3 : 0.18} />
      {/* mid: rail, coloured band, tiles */}
      <Rect x={-20} y={42} width={440} height={94} fill={L.tile} />
      <Path d={S.tiles} stroke={L.grout} strokeWidth={1.2} />
      {hood === 'uptown' && <Path d={SHOPX.marbleVeins} stroke="#B9AFC4" strokeWidth={1.1} fill="none" opacity={0.8} strokeLinecap="round" />}
      <Rect x={-20} y={42} width={440} height={6} fill={L.band} />
      <Rect x={-20} y={36} width={440} height={6} fill={L.rail} stroke={INK} strokeWidth={1.4} />
      {/* string lights: none under a caption bar (D394) */}
      {lights.bulbs.length > 0 && (
        <>
          <Path d={S.bulbGlow} fill="#FFE7A0" opacity={0.28} />
          <Path d={lights.wire} stroke={INK} strokeWidth={1.6} fill="none" />
          {S.bulbs.map((d, i) => (
            <Path key={i} d={d} fill={['#FFC531', '#E8432E', '#3FAE5A'][i]} stroke={INK} strokeWidth={1.2} />
          ))}
        </>
      )}
      {/* PIZZA sign on two cords, menu board and the framed photo: 0.8× boards below the caption zone (see SHOP_SIGNS) */}
      <G transform={`translate(${SHOP_SIGNS.pizza.x} ${SHOP_SIGNS.pizza.y}) scale(${SHOP_SIGNS.pizza.k})`}>
        <Path d="M10 -120V2M74 -120V2" stroke={INK} strokeWidth={1.4} />
        <Rect x={0} y={0} width={84} height={32} rx={6} fill="#FFFFFF" stroke="#D9443A" strokeWidth={3} />
        <Circle cx={18} cy={16} r={11} fill="#FFC531" stroke="#C97B2A" strokeWidth={3} />
        <Path d={circle(14, 13, 2.6) + circle(22, 14, 2.6) + circle(17, 21, 2.6) + circle(23, 20, 2.2)} fill="#E8432E" />
        <Text x={54} y={22} fontSize={14} fontFamily={F.bold} fill="#D9443A" textAnchor="middle">
          PIZZA
        </Text>
      </G>
      <G transform={`translate(${SHOP_SIGNS.menu.x} ${SHOP_SIGNS.menu.y}) scale(${SHOP_SIGNS.menu.k})`}>
        <Rect x={0} y={0} width={70} height={40} rx={4} fill="#2F3B33" stroke="#8E5A3C" strokeWidth={3} />
        <Path d="M6 6 l20 26" stroke="#fff" strokeWidth={6} opacity={0.05} />
        <Text x={35} y={12} fontSize={9} fontFamily={F.bold} fill="#FFC531" textAnchor="middle">
          MENU
        </Text>
        <Path d="M6 18l6 0l-3 5ZM6 26l6 0l-3 5ZM6 34l6 0l-3 5Z" fill="#FFC531" />
        <Path d="M15 19.5h28M15 27.5h24M15 35.5h20" stroke="#FFF4E0" strokeWidth={2.4} strokeLinecap="round" />
        {/* one price per line, right-aligned */}
        {['$3', '$4', '$4'].map((price, i) => (
          <Text key={i} x={63} y={21.7 + i * 8} fontSize={6.5} fontFamily={F.bold} fill="#FFC531" textAnchor="end">
            {price}
          </Text>
        ))}
      </G>
      {own ? (
        <ShopWindow hood={hood} />
      ) : (
        <G transform={`translate(${SHOP_SIGNS.frame.x} ${SHOP_SIGNS.frame.y}) scale(${SHOP_SIGNS.frame.k})`}>
          <Path d="M16 0 L33 -14 L50 0" stroke={INK} strokeWidth={1.2} fill="none" />
          <Rect x={0} y={0} width={66} height={58} rx={3} fill="#C98F63" stroke={INK} strokeWidth={2.4} />
          <Rect x={6} y={6} width={54} height={36} fill="#EED9B0" />
          <Path d="M39 42 L39 30 Q48 19 57 30 L57 42 Z" fill="#B8784F" />
          <Path d={circle(22, 22, 6.5) + 'M12 42 Q22 30 32 42 Z'} fill="#A0664A" />
          <Path d="M6 6h54v36h-54Z" fill="#8E5A3C" opacity={0.12} />
          <Text x={33} y={54} fontSize={8} fontFamily={F.bold} fill="#FFF4E0" textAnchor="middle">
            EST. 1974
          </Text>
        </G>
      )}
      {own ? (
        <ShopObject hood={hood} glow={glow} />
      ) : (
        <G>
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
        </G>
      )}
      {hood === 'university' && <UniLights />}
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
      <Rect x={-20} y={134} width={440} height={8} fill={L.baseboard} />
      <Rect x={-20} y={142} width={440} height={70} fill={L.floor} />
      <Path d={S.floor.lines + S.floor.joints} stroke={L.floorLine} strokeWidth={1.3} />
      <Path d={S.floor.grain} stroke={L.floorGrain} strokeWidth={1.4} fill="none" strokeLinecap="round" />
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
// The other five shops' interiors (v5.16): a window onto the neighbourhood where Rosa's photo hangs, and one signature object on the shelf wall.
// Palettes live in cutscene/backdrop-art.ts SHOP_LOOKS; the object's room (SHOP_OBJECT) and the window's (SHOP_WINDOW) are tested there.

const SHOPX = (() => {
  // pennants hang from a rope across the shelf wall
  const rope: [[number, number], [number, number], [number, number]] = [
    [102, -6],
    [151, 10],
    [200, -6],
  ];
  const pennants = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9].map((t, i) => {
    const [x, y] = quadAt(rope[0], rope[1], rope[2], t);
    return { d: `M${n1(x - 4.5)} ${n1(y)}h9l-4.5 12Z`, c: ['#D9443A', '#FFC531', '#2F80ED'][i % 3] };
  });
  const cups = [120, 150, 180].map((x) => `M${x - 6} 17h12v4q0 6 -6 7q-6 -1 -6 -7ZM${x - 1.2} 27h2.4v2h-2.4ZM${x - 4} 29h8v1h-8Z`).join('');
  // the fishing net: diagonal mesh over a draped shape, floats along its top rope
  let mesh = '';
  for (let k = -50; k <= 90; k += 8) mesh += `M${98 + k} -10L${98 + k + 46} 36M${98 + k + 46} -10L${98 + k} 36`;
  const floats = [108, 126, 144, 162].map((x) => [x, -9 + Math.sin(x / 22) * -1.2 + 3.6 * (1 - Math.abs((x - 137) / 40) ** 2)] as const);
  // marble veins across the tiled band
  let veins = '';
  for (let i = 0; i < 12; i++) veins += `M${-12 + i * 38} ${50 + ((i * 37) % 34)}q9 9 5 19t9 17q5 8 -2 14`;
  return {
    pennantRope: 'M102 -6Q151 10 200 -6',
    pennants,
    cups,
    net: { shape: 'M102 -10Q140 -2 176 -10L172 20Q142 40 104 30Z', mesh, floats },
    marbleVeins: veins,
    notes: [
      [106, 9, 16, 12, '#FFF4C2'],
      [126, 11, 14, 17, '#F7B6C8'],
      [145, 8, 18, 13, '#FFFFFF'],
      [166, 12, 14, 14, '#BFE3F2'],
      [112, 23, 18, 8, '#FFFFFF'],
      [140, 25, 16, 7, '#FFF4C2'],
    ] as const,
    cork: Array.from({ length: 26 }, (_, i) => `M${102 + ((i * 29) % 82)} ${6 + ((i * 17) % 26)}h1.6`).join(''),
    thread: 'M114 15L152 28L172 18',
    crates: [
      [106, -2, 13, 10, '#E0A82E'],
      [122, 0, 9, 8, '#4F7DB5'],
      [133, -3, 14, 11, '#C8483A'],
      [150, 0, 9, 8, '#4F7DB5'],
      [162, -1, 16, 9, '#E0A82E'],
      [108, 20, 15, 11, '#BFC6CE'],
      [126, 22, 10, 9, '#E0A82E'],
      [140, 19, 18, 12, '#8E9AA6'],
      [163, 21, 12, 10, '#C8483A'],
    ] as const,
  };
})();

export function UniLights() {
  const bulbs = UNI_LIGHTS.bulbs;
  return (
    <G>
      <Path d={bulbs.map(([x, y]) => circle(x, y + 3, 9)).join('')} fill="#FFE7A0" opacity={0.28} />
      <Path d={UNI_LIGHTS.wire} stroke={INK} strokeWidth={1.4} fill="none" />
      {bulbs.map(([x, y], i) => (
        <Path
          key={i}
          d={circle(x, y + 3, UNI_LIGHTS.radius, UNI_LIGHTS.radius + 1)}
          fill={['#FFC531', '#E8432E', '#3FAE5A'][i % 3]}
          stroke={INK}
          strokeWidth={1}
        />
      ))}
    </G>
  );
}

/** The window onto each neighbourhood, hung where Rosa's EST. 1974 photo hangs (same box, same scale). Drawn in the frame's own 66 × 58 space. */
export function ShopWindow({ hood }: { hood: NeighborhoodId | undefined }) {
  const f = SHOP_WINDOW;
  let art: ReactElement | null = null;
  if (hood === 'suburbs') {
    art = (
      <G>
        <Rect x={0} y={0} width={66} height={58} rx={3} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
        <Rect x={5} y={5} width={56} height={44} fill="#9AD7F2" />
        <Path d="M5 49V36Q22 27 38 34Q50 30 61 36V49Z" fill="#6FBF5A" />
        <Path d="M12 40V31L22 24L32 31V40Z" fill="#F4C27A" stroke={INK} strokeWidth={1} />
        <Path d="M10 32L22 20L34 32Z" fill="#D9443A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <Circle cx={48} cy={29} r={8} fill="#3E9A4A" stroke={INK} strokeWidth={1} />
        <Rect x={46.5} y={34} width={3} height={9} fill="#7A4A26" />
        <Path d="M33 5V49M5 27H61" stroke="#FFFFFF" strokeWidth={2.4} />
        <Rect x={-3} y={49} width={72} height={6} rx={1.5} fill="#FFFFFF" stroke={INK} strokeWidth={1.6} />
      </G>
    );
  } else if (hood === 'waterfront') {
    art = (
      <G>
        <Circle cx={33} cy={29} r={27} fill="#C9A24A" stroke={INK} strokeWidth={2.4} />
        <Circle cx={33} cy={29} r={21} fill="#8FD0E8" stroke={INK} strokeWidth={1.6} />
        <Circle cx={42} cy={20} r={5} fill="#FFD27A" />
        <Path d="M12.4 33H53.6A21 21 0 0 1 12.4 33Z" fill="#2E86AB" />
        <Path d="M16 38q4 -2 8 0t8 0t8 0t8 0M22 44q4 -2 8 0t8 0" stroke="#BFE8F2" strokeWidth={1.2} fill="none" strokeLinecap="round" />
        <Path d="M31 32V19L39 32Z" fill="#FFFFFF" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <Path d="M25 33H40L37 37H28Z" fill="#8E3B2E" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <Path
          d={[0, 1, 2, 3, 4, 5, 6, 7].map((i) => circle(33 + 24 * Math.cos((i * Math.PI) / 4), 29 + 24 * Math.sin((i * Math.PI) / 4), 1.6)).join('')}
          fill="#8A6A22"
        />
      </G>
    );
  } else if (hood === 'university') {
    art = (
      <G>
        <Path d="M0 58V22Q0 0 33 0Q66 0 66 22V58Z" fill="#F4F0FB" stroke={INK} strokeWidth={2.4} />
        <Path d="M5 53V23Q5 5 33 5Q61 5 61 23V53Z" fill="#BFD0FF" />
        <Rect x={28} y={25} width={10} height={28} fill="#B9886A" stroke={INK} strokeWidth={1} />
        <Path d="M26.5 25L33 13L39.5 25Z" fill="#6C4BC4" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <Circle cx={33} cy={31} r={3.2} fill="#FFFFFF" stroke={INK} strokeWidth={0.8} />
        <Circle cx={14} cy={45} r={7} fill="#4FA86A" stroke={INK} strokeWidth={1} />
        <Circle cx={52} cy={45} r={7} fill="#4FA86A" stroke={INK} strokeWidth={1} />
        <Path d="M33 5V53M5 33H61" stroke="#F4F0FB" strokeWidth={2.2} />
      </G>
    );
  } else if (hood === 'industrial') {
    art = (
      <G>
        <Rect x={0} y={0} width={66} height={58} rx={2} fill="#4A515C" stroke={INK} strokeWidth={2.4} />
        <Rect x={5} y={5} width={56} height={48} fill="#F0B46A" />
        <Rect x={14} y={14} width={6} height={39} fill="#3B3F47" />
        <Rect x={44} y={9} width={7} height={44} fill="#3B3F47" />
        <Path d="M5 53V42L16 35V42L27 35V42L38 35V53Z" fill="#4A4F58" />
        <Path d={circle(17, 10, 4) + circle(21, 5, 3) + circle(47, 5, 4.5)} fill="#E6DFD6" opacity={0.85} />
        <Path d="M33.5 5V53M5 29H61" stroke="#4A515C" strokeWidth={3} />
      </G>
    );
  } else if (hood === 'uptown') {
    art = (
      <G>
        <Path d="M0 58V22Q0 0 33 0Q66 0 66 22V58Z" fill="#CDA64B" stroke={INK} strokeWidth={2.4} />
        <Path d="M5 53V23Q5 5 33 5Q61 5 61 23V53Z" fill="#1D2350" />
        <Circle cx={49} cy={17} r={5} fill="#F4EFC8" />
        <Path d={rect(9, 30, 10, 23) + rect(21, 22, 9, 31) + rect(34, 34, 12, 19) + rect(48, 28, 10, 25)} fill="#2C3470" />
        <Path
          d={
            windows(11, 33, 2, 5, 2.4, 2.8, 5, 4.6) +
            windows(23, 25, 2, 6, 2.4, 2.8, 4.6, 4.6) +
            windows(37, 37, 3, 3, 2.4, 2.8, 3.8, 4.6) +
            windows(50, 31, 2, 4, 2.4, 2.8, 4.6, 4.8)
          }
          fill="#FFD76A"
        />
        <Path d="M33 5V53" stroke="#CDA64B" strokeWidth={2.2} />
      </G>
    );
  } else if (hood) art = cityShopWindow(hood);
  return (
    <G transform={`translate(${f.x} ${f.y}) scale(${f.k})`}>
      <Path d="M16 0 L33 -14 L50 0" stroke={INK} strokeWidth={1.2} fill="none" />
      {art}
    </G>
  );
}

/** The one thing in the room that is the neighbourhood's: Suburbs' team pennants, Waterfront's nets, University's corkboard, Industrial's steel shelving, Uptown's marble and brass. */
export function ShopObject({ hood, glow }: { hood: NeighborhoodId | undefined; glow: string }) {
  const X = SHOPX;
  const city = hood ? cityShopObject(hood) : null;
  if (city) return city;
  if (hood === 'suburbs') {
    return (
      <G>
        <Path d={X.pennantRope} stroke={INK} strokeWidth={1.4} fill="none" />
        {X.pennants.map((p, i) => (
          <Path key={i} d={p.d} fill={p.c} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        ))}
        <Path d={X.cups} fill="#F2C94C" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <Rect x={102} y={30} width={96} height={5} fill="#8E5A3C" stroke={INK} strokeWidth={1.3} />
        <Path d="M110 35l5 7M188 35l-5 7" stroke="#5E3A26" strokeWidth={2} strokeLinecap="round" />
      </G>
    );
  }
  if (hood === 'waterfront') {
    const clip = `${glow}net`;
    return (
      <G>
        <Defs>
          <ClipPath id={clip}>
            <Path d={X.net.shape} />
          </ClipPath>
        </Defs>
        <Path d={X.net.shape} fill="#3B2E1F" opacity={0.22} transform="translate(2 2)" />
        <G clipPath={`url(#${clip})`}>
          <Path d={X.net.mesh} stroke="#9C7A44" strokeWidth={1.3} />
        </G>
        <Path d={X.net.shape} stroke={INK} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
        <Path d="M102 -10Q140 -2 176 -10" stroke="#C9A56A" strokeWidth={3} fill="none" strokeLinecap="round" />
        {X.net.floats.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={3.4} fill={i % 2 ? '#FFFFFF' : '#E8742A'} stroke={INK} strokeWidth={1} />
        ))}
      </G>
    );
  }
  if (hood === 'university') {
    return (
      <G>
        <Rect x={102} y={4} width={84} height={30} rx={2} fill="#C58B52" stroke="#7A4A26" strokeWidth={3} />
        <Path d={X.cork} stroke="#8E5E34" strokeWidth={1.4} strokeLinecap="round" />
        {X.notes.map(([x, y, w, h, c], i) => (
          <G key={i}>
            <Rect x={x} y={y} width={w} height={h} fill={c} stroke="#7A6A50" strokeWidth={0.7} />
            <Circle cx={x + w / 2} cy={y + 1.8} r={1.5} fill="#D9443A" />
          </G>
        ))}
        <Path d={X.thread} stroke="#D9443A" strokeWidth={1} fill="none" />
      </G>
    );
  }
  if (hood === 'industrial') {
    return (
      <G>
        <Path d="M102 -10h3.6v46h-3.6ZM194 -10h3.6v46h-3.6Z" fill="#8A95A1" stroke={INK} strokeWidth={1.2} />
        {X.crates.map(([x, y, w, h, c], i) => (
          <Rect key={i} x={x} y={y} width={w} height={h} fill={c} stroke={INK} strokeWidth={1} />
        ))}
        <Rect x={102} y={8} width={94} height={3.4} fill="#6F7B88" stroke={INK} strokeWidth={1} />
        <Rect x={102} y={31} width={94} height={3.4} fill="#6F7B88" stroke={INK} strokeWidth={1} />
        <Path d="M104 11L192 31" stroke="#8A95A1" strokeWidth={1} opacity={0.5} />
      </G>
    );
  }
  if (hood === 'uptown') {
    const sconce = (x: number) => (
      <G key={x}>
        <Ellipse cx={x} cy={6} rx={13} ry={11} fill={`url(#${glow})`} opacity={0.7} />
        <Path d={`M${x - 4} -1h8l2 8h-12Z`} fill="#FFE9A8" stroke="#CDA64B" strokeWidth={1.4} strokeLinejoin="round" />
        <Path d={`M${x} 7v5q0 4 -4 4`} stroke="#CDA64B" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Circle cx={x - 4} cy={16} r={2.4} fill="#CDA64B" stroke={INK} strokeWidth={0.8} />
      </G>
    );
    return (
      <G>
        {sconce(114)}
        {sconce(188)}
        <Path d="M128 27V8Q128 -10 149 -10Q170 -10 170 8V27Z" fill="#CFE6F0" stroke="#CDA64B" strokeWidth={3.2} strokeLinejoin="round" />
        <Path d="M128 27V8Q128 -10 149 -10Q170 -10 170 8V27Z" fill="none" stroke={INK} strokeWidth={1} />
        <Path d="M134 22L146 -4M142 22L150 6" stroke="#FFFFFF" strokeWidth={3} opacity={0.5} strokeLinecap="round" />
        <Rect x={102} y={28} width={96} height={6} fill="#F4F1F6" stroke={INK} strokeWidth={1.3} />
        <Path d="M104 31q8 -1 14 1t12 -1t14 1" stroke="#B9AFC4" strokeWidth={1} fill="none" />
        <Rect x={102} y={33.4} width={96} height={2.6} fill="#CDA64B" stroke={INK} strokeWidth={0.9} />
        <Path d="M112 36l4 6M186 36l-4 6" stroke="#CDA64B" strokeWidth={2.2} strokeLinecap="round" />
        <Path d="M143 28q-5 -8 -2 -13h16q3 5 -2 13Z" fill="#2E8B9A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
        <Path d={circle(146, 12, 3.2) + circle(152, 9.5, 3.2) + circle(157, 13, 3)} fill="#F28AA8" stroke={INK} strokeWidth={0.8} />
      </G>
    );
  }
  return null;
}
