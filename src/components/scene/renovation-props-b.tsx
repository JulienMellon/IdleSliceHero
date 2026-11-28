// The drawings of the other three renovated shops (v5.25, card S7; where they stand is renovation-art.ts, the list of looks docs/build/v5.25/renovation.md): the University (dorm: cork,
// string lights, secondhand sofas), Industrial (brick and steel: pipes, rivets, hazard stripes) and Uptown (marble and gold: art deco, velvet). The 27 decor props, and the fixture upgrades
// that are drawn on the front wall or on the counter. Every drawing is memoised on primitives and stands at its own origin (the anchor is the bottom centre; a hung thing's is its top
// centre), inside the box renovation-art.ts `DEFS` gives it. No text: the plaque's numeral is the only lettering (renovation-props.tsx).
import { memo, type ReactElement } from 'react';
import { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { INK } from './projection';

const L = { stroke: INK, strokeWidth: 1, strokeLinejoin: 'round' as const };
const WOOD = '#8A5A3A';
const WOOD_DARK = '#5E3A26';
const WOOD_LIGHT = '#B58355';
const STEEL = '#8D949C';
const STEEL_DARK = '#4A4F57';
const STEEL_LIGHT = '#C9CED4';
const BRICK = '#B5532F';
const CREAM = '#FFF4E0';
const RED = '#D9443A';
const NAVY = '#2E5C8A';
const GOLD = '#E3B52E';
const GOLD_LIGHT = '#F6DA7A';
const HAZARD = '#F2C94C';
const MARBLE = '#F1EEE8';
const VEIN = '#9AA3AD';

// ---------- the University: dorm ----------

const BulletinBoard = () => (
  <G>
    <Rect x={-12} y={-22} width={24} height={20} rx={1.4} fill="#C99A62" stroke={WOOD_DARK} strokeWidth={2} />
    <Rect x={-12} y={-22} width={24} height={20} rx={1.4} fill="none" stroke={INK} strokeWidth={0.8} />
    {[
      [-8, -8],
      [-1, -19],
      [6, -10],
      [9, -18],
    ].map(([x, y]) => (
      <Circle key={`${x}${y}`} cx={x} cy={y} r={0.8} fill="#A97B45" />
    ))}
    {/* scattered flyers, each ragged at an edge: a tall one, a wide one, a torn one and a note */}
    <Path d="M-10 -20 H-3 V-11 L-4.4 -12.4 L-6 -11 L-7.6 -12.4 L-10 -11 Z" fill="#fff" stroke={INK} strokeWidth={0.7} strokeLinejoin="round" />
    <Path d="M-8.6 -17.4 H-4.4 M-8.6 -15.4 H-5.4" stroke="#6A7A8A" strokeWidth={0.8} />
    <Path d="M-1.4 -20 H7 L8 -14 L6 -13 L4 -14.4 L0 -13 L-1.6 -14 Z" fill="#7FC8F8" stroke={INK} strokeWidth={0.7} strokeLinejoin="round" />
    <Path d="M0.8 -17.6 H5.6" stroke="#fff" strokeWidth={0.9} />
    <Path d="M-9.4 -9 L-3 -9.6 L-2.6 -3.4 L-9 -3.8 Z" fill="#FFE08A" stroke={INK} strokeWidth={0.7} strokeLinejoin="round" />
    <Path d="M0 -10.4 H8.6 V-6 L7 -4.6 L5 -6 L2.4 -4.4 L0 -6 Z" fill="#F4A6C0" stroke={INK} strokeWidth={0.7} strokeLinejoin="round" />
    {[
      [-6.4, -19.6, RED],
      [3, -19.6, NAVY],
      [-6, -9.2, RED],
      [4.2, -10, NAVY],
    ].map(([x, y, c]) => (
      <Circle key={`${x}${y}`} cx={x as number} cy={y as number} r={1.1} fill={c as string} stroke={INK} strokeWidth={0.4} />
    ))}
  </G>
);

const BeanBag = () => (
  <G>
    <Ellipse cx={0} cy={1} rx={11} ry={2} fill="#000" opacity={0.18} />
    <Path d="M-11 0 Q-12.4 -8 -4 -12 Q1 -17 6 -12.4 Q12.6 -8 11 0 Q0 3 -11 0 Z" fill="#F2994A" {...L} />
    <Path d="M-4 -12 Q-2 -6 -4.6 0.6 M6 -12.4 Q5 -6 7 0" stroke="#C26A1E" strokeWidth={0.9} fill="none" />
    <Path d="M-8 -9 Q-5.6 -11 -3.6 -10.6" stroke="#fff" strokeWidth={1.4} opacity={0.5} fill="none" strokeLinecap="round" />
    <Path d="M1 -13.8 Q3 -17 5 -14.6" stroke={INK} strokeWidth={0.8} fill="none" />
  </G>
);

const StringLights = () => {
  const xs = [-28, -21, -14, -7, 0, 7, 14, 21, 28];
  const bulbs = ['#FFD34D', '#FF9A8A', '#7FE0A0', '#7FC8F8'];
  return (
    <G>
      <Path d={xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x} ${i % 2 ? 7 : 1}`).join(' ')} stroke={INK} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <Path
        d={xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x} ${i % 2 ? 7 : 1}`).join(' ')}
        stroke="#3B3B3B"
        strokeWidth={0.8}
        fill="none"
        strokeLinejoin="round"
      />
      {xs.map((x, i) => (
        <G key={x}>
          <Circle cx={x} cy={(i % 2 ? 7 : 1) + 5} r={4.4} fill="#FFE08A" opacity={0.28} />
          <Path d={`M${x} ${i % 2 ? 7 : 1} V${(i % 2 ? 7 : 1) + 2.4}`} stroke={INK} strokeWidth={0.8} />
          <Ellipse cx={x} cy={(i % 2 ? 7 : 1) + 4.4} rx={1.9} ry={2.3} fill={bulbs[i % bulbs.length]} stroke={INK} strokeWidth={0.6} />
        </G>
      ))}
    </G>
  );
};

const Couch = () => (
  <G>
    <Path d="M-18 0 V2 M18 0 V2" stroke={WOOD_DARK} strokeWidth={2.4} strokeLinecap="round" />
    <Rect x={-19} y={-15} width={38} height={8} rx={3} fill="#5C7A8A" {...L} />
    <Rect x={-21} y={-11} width={7} height={11} rx={2.6} fill="#4A6676" {...L} />
    <Rect x={14} y={-11} width={7} height={11} rx={2.6} fill="#4A6676" {...L} />
    <Rect x={-14} y={-8} width={28} height={7} rx={1.6} fill="#6E8FA0" {...L} />
    <Path d="M0 -8 V-1" stroke="#3E5663" strokeWidth={0.8} />
    {/* the throw blanket: striped, over the right arm and down the seat */}
    <Path d="M11 -12 Q17 -13 21 -10.6 V-3 L16 -2 L14 -7 Z" fill="#E8A04A" {...L} />
    <Path d="M12.4 -9.6 L19.4 -8 M13.4 -6.2 L20 -5.2" stroke="#fff" strokeWidth={1.1} />
    <Path d="M-17 -13 H-8" stroke="#fff" strokeWidth={1} opacity={0.4} strokeLinecap="round" />
  </G>
);

const Vending = () => (
  <G>
    <Rect x={-8} y={-40} width={16} height={40} rx={1.6} fill="#C0392B" {...L} />
    <Rect x={-6} y={-37} width={12} height={19} rx={1} fill="#1E2A38" stroke={INK} strokeWidth={0.8} />
    {/* the window grid of snacks: three shelves of three */}
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <Rect
          key={`${r}${c}`}
          x={-5.2 + c * 3.8}
          y={-35.4 + r * 6}
          width={3}
          height={4}
          rx={0.6}
          fill={['#FFC531', '#7FC8F8', '#FF9A8A', '#7FE0A0', '#F4A6C0'][(r * 3 + c) % 5]}
        />
      )),
    )}
    <Path d="M-5.6 -32 H5.6 M-5.6 -26 H5.6" stroke="#8D949C" strokeWidth={0.7} />
    <Path d="M-5 -36 V-20" stroke="#fff" strokeWidth={1} opacity={0.3} />
    <Rect x={-6} y={-15} width={5} height={4} rx={0.8} fill="#2A2F36" />
    <Circle cx={3} cy={-14.6} r={1} fill="#7FE0A0" />
    <Circle cx={3} cy={-11.6} r={1} fill={RED} />
    <Rect x={-5.4} y={-8} width={10.8} height={5} rx={1} fill="#111" stroke={INK} strokeWidth={0.7} />
    <Rect x={-9} y={-1} width={18} height={2} rx={0.6} fill={STEEL_DARK} {...L} />
  </G>
);

const BikeRack = () => {
  const bike = (cx: number, c: string) => (
    <G>
      <Circle cx={cx - 5} cy={-5} r={4.4} fill="none" stroke={INK} strokeWidth={2.2} />
      <Circle cx={cx - 5} cy={-5} r={4.4} fill="none" stroke="#3A3F47" strokeWidth={1.2} />
      <Circle cx={cx + 5} cy={-5} r={4.4} fill="none" stroke={INK} strokeWidth={2.2} />
      <Circle cx={cx + 5} cy={-5} r={4.4} fill="none" stroke="#3A3F47" strokeWidth={1.2} />
      <Path
        d={`M${cx - 5} -5 L${cx - 1} -11 H${cx + 4} L${cx + 5} -5 M${cx - 1} -11 L${cx + 1} -5 H${cx - 5}`}
        stroke={INK}
        strokeWidth={2.4}
        fill="none"
        strokeLinejoin="round"
      />
      <Path
        d={`M${cx - 5} -5 L${cx - 1} -11 H${cx + 4} L${cx + 5} -5 M${cx - 1} -11 L${cx + 1} -5 H${cx - 5}`}
        stroke={c}
        strokeWidth={1.2}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d={`M${cx - 2} -12.4 H${cx + 1} M${cx + 4} -11 L${cx + 5.4} -13.6 H${cx + 7}`} stroke={INK} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </G>
  );
  return (
    <G>
      <Rect x={-16} y={-1.4} width={32} height={2.8} rx={1} fill={STEEL_DARK} {...L} />
      {bike(-8, '#E0457B')}
      {bike(8, '#2E9CCA')}
      {/* the wheel-loop rack: four hoops in front of the wheels */}
      {[-14, -5, 4, 13].map((x) => (
        <G key={x}>
          <Path d={`M${x - 3} -1 V-8 Q${x - 3} -12 ${x} -12 Q${x + 3} -12 ${x + 3} -8 V-1`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Path
            d={`M${x - 3} -1 V-8 Q${x - 3} -12 ${x} -12 Q${x + 3} -12 ${x + 3} -8 V-1`}
            stroke={STEEL_LIGHT}
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
          />
        </G>
      ))}
    </G>
  );
};

const Globe = () => (
  <G>
    <Rect x={-6} y={-3} width={12} height={3.4} rx={1} fill={WOOD_DARK} {...L} />
    <Path d="M-1.4 -3 V-7 H1.4 V-3" fill={WOOD} {...L} />
    {/* the brass meridian: a half ring holding the ball on its tilted axis */}
    <G transform="translate(0 -14) rotate(-20)">
      <Circle cx={0} cy={0} r={7.6} fill="#2E7DB8" {...L} />
      <Path
        d="M-5 -3 Q-2 -6 1 -3.4 Q0 -0.6 -3 0.4 Q-5 -0.4 -5 -3 Z M2.4 1.4 Q6 0.4 6.4 3.4 Q4.6 6 2.8 4.4 Z"
        fill="#6DBE6A"
        stroke={INK}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      <Path d="M-7.6 0 H7.6" stroke="#fff" strokeWidth={0.5} opacity={0.5} />
      <Path d="M-5 -5.4 Q-3 -6.8 -1 -7" stroke="#fff" strokeWidth={1} opacity={0.5} fill="none" strokeLinecap="round" />
      <Path d="M0 -10 V10" stroke={INK} strokeWidth={0.9} />
      <Path d="M-9 4 A9.6 9.6 0 0 0 5.4 8.4" stroke={GOLD} strokeWidth={1.8} fill="none" />
      <Path d="M-9 4 A9.6 9.6 0 0 0 5.4 8.4" stroke={INK} strokeWidth={0.5} fill="none" />
    </G>
  </G>
);

const LibraryLadder = () => {
  const spines = ['#C0392B', '#2E5C8A', '#2F7D4F', '#E8A04A', '#6B4A8A', '#E0457B'];
  return (
    <G>
      <Rect x={-14} y={-40} width={28} height={40} rx={1.2} fill={WOOD_DARK} stroke={INK} strokeWidth={1.2} />
      {[0, 1, 2, 3].map((r) => {
        const y = -36 + r * 9.4;
        return (
          <G key={r}>
            <Rect x={-12} y={y - 1} width={24} height={9} fill="#3A2415" />
            {Array.from({ length: 8 }).map((_, i) => {
              const h = 5 + ((i * 3 + r * 5) % 4);
              return (
                <Rect
                  key={i}
                  x={-11.4 + i * 2.9}
                  y={y + 8 - h}
                  width={2.4}
                  height={h}
                  fill={spines[(i + r * 2) % spines.length]}
                  stroke={INK}
                  strokeWidth={0.4}
                />
              );
            })}
            <Rect x={-13} y={y + 8} width={26} height={1.6} fill={WOOD} stroke={INK} strokeWidth={0.5} />
          </G>
        );
      })}
      {/* the rolling ladder: a rail along the top, two rails leaning from it, rungs */}
      <Path d="M-14 -37 H14" stroke={GOLD} strokeWidth={1.4} />
      <Path d="M5 -37 L9 -2 M11 -37 L15 -2" stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M5 -37 L9 -2 M11 -37 L15 -2" stroke={WOOD_LIGHT} strokeWidth={1.7} strokeLinecap="round" />
      {[-30, -22, -14, -6].map((y) => (
        <Path key={y} d={`M${5 + ((y + 37) / 35) * 4} ${y} H${11 + ((y + 37) / 35) * 4}`} stroke={WOOD} strokeWidth={1.6} />
      ))}
      <Circle cx={5} cy={-37} r={1.4} fill={GOLD} stroke={INK} strokeWidth={0.5} />
      <Circle cx={11} cy={-37} r={1.4} fill={GOLD} stroke={INK} strokeWidth={0.5} />
    </G>
  );
};

const Telescope = () => (
  <G>
    <Path d="M0 -13 L-10 1 M0 -13 L10 1 M0 -13 L1 2" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    <Path d="M0 -13 L-10 1 M0 -13 L10 1 M0 -13 L1 2" stroke={WOOD_LIGHT} strokeWidth={1.5} strokeLinecap="round" />
    <Circle cx={0} cy={-13} r={2.4} fill={STEEL} {...L} />
    {/* the tube, pointing up and out to the right: a wide objective end, two brass rings, the eyepiece at the low end */}
    <G transform="translate(0 -14) rotate(-48)">
      <Rect x={-4} y={-3} width={24} height={6} rx={1.4} fill="#2E4A6A" {...L} />
      <Rect x={14} y={-4.4} width={8} height={8.8} rx={1.4} fill="#3E6590" {...L} />
      <Rect x={5} y={-3.2} width={2} height={6.4} fill={GOLD} stroke={INK} strokeWidth={0.5} />
      <Rect x={11} y={-3.2} width={2} height={6.4} fill={GOLD} stroke={INK} strokeWidth={0.5} />
      <Rect x={-8} y={-1.6} width={4.4} height={3.2} rx={0.8} fill={STEEL_DARK} {...L} />
      <Path d="M0 -2 H12" stroke="#fff" strokeWidth={0.9} opacity={0.45} />
    </G>
  </G>
);

// ---------- Industrial: brick and steel ----------

const Wheel = ({ x, y, c }: { x: number; y: number; c: string }) => (
  <G>
    <Circle cx={x} cy={y} r={4.6} fill="none" stroke={INK} strokeWidth={2.2} />
    <Circle cx={x} cy={y} r={4.6} fill="none" stroke={c} strokeWidth={1.2} />
    <Path d={`M${x - 4.4} ${y} H${x + 4.4} M${x} ${y - 4.4} V${y + 4.4}`} stroke={INK} strokeWidth={1.2} />
    <Circle cx={x} cy={y} r={1.2} fill={c} stroke={INK} strokeWidth={0.5} />
  </G>
);

const PipeRun = () => (
  <G>
    {[-24, -6, 12].map((x) => (
      <Path key={x} d={`M${x} 0 V4`} stroke={INK} strokeWidth={1.6} />
    ))}
    {/* the run, with an elbow bending down at the right end */}
    <Path d="M-30 7 H14 Q24 7 24 17" stroke={INK} strokeWidth={6.6} fill="none" strokeLinecap="round" />
    <Path d="M-30 7 H14 Q24 7 24 17" stroke={STEEL} strokeWidth={4.4} fill="none" strokeLinecap="round" />
    <Path d="M-30 5.8 H14 Q22.8 5.8 22.8 14" stroke="#fff" strokeWidth={0.9} opacity={0.5} fill="none" />
    {[-18, 0, 18].map((x) => (
      <Rect key={x} x={x - 1.6} y={3.6} width={3.2} height={6.8} rx={0.6} fill={STEEL_DARK} {...L} />
    ))}
    {/* two valve wheels on stems */}
    {[-12, 6].map((x, i) => (
      <G key={x}>
        <Path d={`M${x} 10 V13`} stroke={INK} strokeWidth={2} />
        <Wheel x={x} y={17} c={i ? '#2E9CCA' : RED} />
      </G>
    ))}
  </G>
);

const Drums = () => (
  <G>
    <G transform="translate(-7 0)">
      <Path d="M-6 -16 V0 Q0 3 6 0 V-16 Z" fill={NAVY} {...L} />
      <Ellipse cx={0} cy={-16} rx={6} ry={2} fill="#4F7FAE" {...L} />
      <Ellipse cx={0} cy={-16} rx={3.4} ry={1.1} fill="none" stroke={INK} strokeWidth={0.6} />
      <Path d="M-6 -11 Q0 -8.6 6 -11 M-6 -5 Q0 -2.6 6 -5" stroke="#1B4067" strokeWidth={1.2} fill="none" />
      <Path d="M-4 -14 V-2" stroke="#fff" strokeWidth={0.9} opacity={0.35} />
    </G>
    <G transform="translate(7 0)">
      <Path d="M-6 -18 V0 Q0 3 6 0 V-18 Z" fill="#A6402A" {...L} />
      <Ellipse cx={0} cy={-18} rx={6} ry={2} fill="#C8664A" {...L} />
      <Ellipse cx={0} cy={-18} rx={3.4} ry={1.1} fill="none" stroke={INK} strokeWidth={0.6} />
      <Path d="M-6 -12.6 Q0 -10.2 6 -12.6 V-8 Q0 -5.6 -6 -8 Z" fill={HAZARD} stroke={INK} strokeWidth={0.7} />
      <Path d="M-3.6 -11.8 L-1.6 -8.8 M0 -11.4 L2 -8.2 M3.4 -12 L5 -9.6" stroke={INK} strokeWidth={1.1} />
      <Path d="M-4 -16 V-2" stroke="#fff" strokeWidth={0.9} opacity={0.3} />
    </G>
  </G>
);

const Pegboard = () => {
  const holes: [number, number][] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) holes.push([-10.5 + c * 3, -21 + r * 4.4]);
  return (
    <G>
      <Rect x={-13} y={-24} width={26} height={24} rx={1} fill="#9AA3AD" stroke={INK} strokeWidth={1.2} />
      {holes.map(([x, y]) => (
        <Circle key={`${x}${y}`} cx={x} cy={y} r={0.55} fill="#5A6672" />
      ))}
      {/* outlined tools: a hammer, a wrench and a saw, each drawn in a dark line on a pale painted outline */}
      <Path d="M-9 -6 V-20" stroke="#fff" strokeWidth={3.8} strokeLinecap="round" opacity={0.7} />
      <Path d="M-9 -6 V-20" stroke={WOOD_DARK} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={-12.4} y={-21.6} width={7} height={3.6} rx={0.8} fill={STEEL_DARK} {...L} />
      <Path d="M0 -4 V-17" stroke="#fff" strokeWidth={3.8} strokeLinecap="round" opacity={0.7} />
      <Path d="M0 -4 V-17" stroke={STEEL_DARK} strokeWidth={2} strokeLinecap="round" />
      <Path d="M-2.6 -19.6 A3.2 3.2 0 1 1 2.6 -19.6 L1 -17 H-1 Z" fill={STEEL_LIGHT} {...L} />
      <Path d="M5 -19 H11 L11 -9 Q8 -7 5 -9 Z" fill="#fff" opacity={0.7} />
      <Path d="M5.6 -18.6 H10.4 L10.4 -10 Q8 -8.4 5.6 -10 Z" fill={STEEL_LIGHT} stroke={INK} strokeWidth={0.8} />
      <Path d="M5.6 -17 L6.6 -15.8 L7.6 -17 L8.6 -15.8 L9.6 -17" stroke={INK} strokeWidth={0.6} fill="none" />
      <Rect x={6.4} y={-8.6} width={3.2} height={5} rx={1} fill="#C0392B" {...L} />
      <Path d="M-12 -2.4 H12" stroke={INK} strokeWidth={0.8} opacity={0.4} />
    </G>
  );
};

const FlourPallet = () => {
  const sack = (x: number, y: number, k: number) => (
    <G key={`${x}${y}`}>
      <Path
        d={`M${x} ${y} H${x + 9} V${y - 7} Q${x + 8} ${y - 8.4} ${x + 6} ${y - 8} H${x + 3} Q${x + 1} ${y - 8.4} ${x} ${y - 7} Z`}
        fill={k % 2 ? '#F4EEDC' : '#EAE3CC'}
        {...L}
      />
      <Path d={`M${x + 1.6} ${y - 5} H${x + 7.4} M${x + 1.6} ${y - 3} H${x + 7.4}`} stroke={NAVY} strokeWidth={0.9} />
      <Path d={`M${x + 2} ${y - 7.6} Q${x + 4.5} ${y - 9.6} ${x + 7} ${y - 7.6}`} stroke={INK} strokeWidth={0.7} fill="none" />
    </G>
  );
  return (
    <G>
      <Rect x={-15} y={-3} width={30} height={3.4} fill={WOOD} {...L} />
      {[-12, 0, 11].map((x) => (
        <Rect key={x} x={x - 1.6} y={-6} width={3.2} height={3} fill={WOOD_DARK} {...L} />
      ))}
      {[-14, -5, 5].map((x, i) => sack(x, -3, i))}
      {[-10, -1].map((x, i) => sack(x + 1, -11, i + 1))}
      {sack(-4, -19, 0)}
      {/* the strap round the stack, with its buckle */}
      <Path d="M-15 -9 H15" stroke={STEEL_DARK} strokeWidth={1.6} />
      <Rect x={-2} y={-11} width={4} height={4} rx={0.6} fill={STEEL_LIGHT} stroke={INK} strokeWidth={0.6} />
    </G>
  );
};

const GearClock = () => {
  const teeth = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <G transform="translate(0 -14)">
      {teeth.map((a) => (
        <Rect key={a} x={-2.2} y={-14} width={4.4} height={5.6} rx={0.6} fill={STEEL} stroke={INK} strokeWidth={0.8} transform={`rotate(${a})`} />
      ))}
      <Circle cx={0} cy={0} r={11.4} fill={STEEL} {...L} />
      <Circle cx={0} cy={0} r={8.6} fill={CREAM} stroke={INK} strokeWidth={0.9} />
      {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
        <Path key={a} d="M0 -7.8 V-6" stroke={INK} strokeWidth={a % 90 === 0 ? 1.2 : 0.7} transform={`rotate(${a})`} />
      ))}
      <Path d="M0 0 L-3 -4.6" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M0 0 L4.6 1.4" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
      <Circle cx={0} cy={0} r={1.3} fill={RED} stroke={INK} strokeWidth={0.5} />
      {[45, 135, 225, 315].map((a) => (
        <Circle key={a} cx={Math.cos((a * Math.PI) / 180) * 10} cy={Math.sin((a * Math.PI) / 180) * 10} r={0.8} fill={STEEL_DARK} />
      ))}
      <Path d="M-10 -5 Q-8 -9 -4 -10.4" stroke="#fff" strokeWidth={1.1} opacity={0.5} fill="none" strokeLinecap="round" />
    </G>
  );
};

const WorkLamp = () => (
  <G>
    <Rect x={-4} y={0} width={8} height={2.6} rx={0.8} fill={STEEL_DARK} {...L} />
    {/* the swing arm: two links on pin joints */}
    <Path d="M0 2.6 L-8 9 L2 13" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M0 2.6 L-8 9 L2 13" stroke={STEEL} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={-8} cy={9} r={1.4} fill={GOLD} stroke={INK} strokeWidth={0.5} />
    <Circle cx={2} cy={22} r={10} fill="#FFE08A" opacity={0.25} />
    {/* the caged lamp: a dome shade, a bulb and a wire cage over it */}
    <Path d="M-3 15 Q2 11 7 15 V17 H-3 Z" fill="#2F7D4F" {...L} />
    <Circle cx={2} cy={20} r={3.6} fill="#FFF4B0" stroke={INK} strokeWidth={0.7} />
    <Path d="M-2.4 17 Q-3.6 24 2 25.6 Q7.6 24 6.4 17 M2 17 V25.6 M-2.6 21 H6.6" stroke={STEEL_DARK} strokeWidth={0.8} fill="none" />
  </G>
);

const Boiler = () => (
  <G>
    <Rect x={-9} y={-2} width={4} height={3} fill={STEEL_DARK} {...L} />
    <Rect x={5} y={-2} width={4} height={3} fill={STEEL_DARK} {...L} />
    <Path d="M-12 -6 V-26 Q-12 -31 -7 -31 H7 Q12 -31 12 -26 V-6 Q12 -2 7 -2 H-7 Q-12 -2 -12 -6 Z" fill="#6A4A3A" {...L} />
    <Path d="M-12 -14 H12 M-12 -22 H12" stroke="#4A4F57" strokeWidth={2.4} />
    <Path d="M-12 -14 H12 M-12 -22 H12" stroke="#8D949C" strokeWidth={1} />
    {[-9, -4.5, 0, 4.5, 9].map((x) => (
      <G key={x}>
        <Circle cx={x} cy={-17.4} r={0.8} fill="#A98A78" stroke={INK} strokeWidth={0.3} />
        <Circle cx={x} cy={-9.6} r={0.8} fill="#A98A78" stroke={INK} strokeWidth={0.3} />
        <Circle cx={x} cy={-26} r={0.8} fill="#A98A78" stroke={INK} strokeWidth={0.3} />
      </G>
    ))}
    <Path d="M-9 -27 V-8" stroke="#fff" strokeWidth={1.2} opacity={0.22} />
    {/* the pressure gauge, a stack pipe and a valve on top */}
    <Circle cx={0} cy={-18} r={4} fill={CREAM} stroke={INK} strokeWidth={1} />
    <Circle cx={0} cy={-18} r={4} fill="none" stroke={GOLD} strokeWidth={1.2} opacity={0.8} />
    <Path d="M0 -18 L2.4 -20.4" stroke={RED} strokeWidth={1} strokeLinecap="round" />
    <Path d="M-2.6 -16.4 A3.6 3.6 0 0 0 2.6 -16.4" stroke={RED} strokeWidth={0.8} fill="none" />
    <Rect x={-2} y={-37} width={4} height={7} fill={STEEL} {...L} />
    <Rect x={-4} y={-38.6} width={8} height={2.6} rx={0.8} fill={STEEL_DARK} {...L} />
    <Path d="M2 -34 H9" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
    <Path d="M2 -34 H9" stroke={STEEL} strokeWidth={1} strokeLinecap="round" />
    <Circle cx={9.6} cy={-34} r={1.8} fill={RED} stroke={INK} strokeWidth={0.5} />
  </G>
);

const Conveyor = () => {
  const box = (x: number, y: number, r: boolean) => (
    <G key={x}>
      <Rect x={x} y={y - 6} width={13} height={6} rx={0.6} fill={r ? '#E9C58C' : '#F4EEDC'} {...L} />
      <Path d={`M${x} ${y - 4.4} H${x + 13}`} stroke={INK} strokeWidth={0.5} opacity={0.5} />
      <Rect x={x + 3.6} y={y - 5.4} width={5.8} height={3} rx={0.6} fill={RED} />
    </G>
  );
  return (
    <G>
      <Path d="M-20 0 V-6 M20 0 V-6" stroke={INK} strokeWidth={3.2} />
      <Path d="M-20 0 V-6 M20 0 V-6" stroke={STEEL} strokeWidth={1.6} />
      <Rect x={-24} y={-8} width={48} height={4} rx={1.4} fill={STEEL_DARK} {...L} />
      {Array.from({ length: 11 }, (_, i) => -21 + i * 4.2).map((x) => (
        <Rect key={x} x={x - 1.4} y={-10} width={2.8} height={3} rx={1.2} fill={STEEL_LIGHT} stroke={INK} strokeWidth={0.5} />
      ))}
      {box(-20, -9.6, true)}
      {box(-3, -9.6, false)}
      {box(10, -9.6, true)}
      <Path d="M20 -4 L24 -4" stroke={HAZARD} strokeWidth={2} />
    </G>
  );
};

const AnvilTable = () => (
  <G>
    <Path d="M-6 0 L-5 -4 H5 L6 0 Z" fill="#3A3F47" {...L} />
    <Path d="M-4 -4 Q-3 -9 -4 -11 H4 Q3 -9 4 -4 Z" fill="#4A4F57" {...L} />
    {/* the face and the horn */}
    <Path d="M-12 -14 Q-12 -17 -8 -17 H12 V-11 H-4 Q-8 -11 -8 -12.6 Q-10 -12.6 -12 -14 Z" fill="#5A6672" {...L} />
    <Path d="M-7 -16 H11" stroke="#fff" strokeWidth={1} opacity={0.5} strokeLinecap="round" />
    <Rect x={7} y={-15} width={2.6} height={1.6} fill={STEEL_DARK} />
    {/* a pizza on a plate and a mug on it, so it reads as a table */}
    <Ellipse cx={1} cy={-18} rx={5.6} ry={1.4} fill={CREAM} stroke={INK} strokeWidth={0.6} />
    <Ellipse cx={1} cy={-18.4} rx={4.2} ry={1} fill="#E9A64B" />
    <Circle cx={-0.6} cy={-18.6} r={0.7} fill={RED} />
    <Circle cx={2.4} cy={-18.4} r={0.7} fill={RED} />
    <Rect x={8} y={-21} width={3.4} height={4} rx={0.6} fill="#C9A04A" {...L} />
  </G>
);

// ---------- Uptown: marble and gold ----------

const Post = ({ x }: { x: number }) => (
  <G>
    <Ellipse cx={x} cy={0} rx={4} ry={1.4} fill={GOLD} {...L} />
    <Rect x={x - 0.9} y={-17} width={1.8} height={16} fill={GOLD} stroke={INK} strokeWidth={0.7} />
    <Circle cx={x} cy={-18} r={2.4} fill={GOLD_LIGHT} {...L} />
    <Path d={`M${x - 0.3} -16 V-2`} stroke="#fff" strokeWidth={0.5} opacity={0.7} />
  </G>
);

const VelvetRope = () => (
  <G>
    <Path d="M-14 -16 Q0 -2 14 -16" stroke={INK} strokeWidth={4.6} fill="none" strokeLinecap="round" />
    <Path d="M-14 -16 Q0 -2 14 -16" stroke="#B32030" strokeWidth={3.2} fill="none" strokeLinecap="round" />
    <Path d="M-12 -14 Q-5 -7 0 -6.4" stroke="#E0586A" strokeWidth={0.9} fill="none" strokeLinecap="round" />
    <Post x={-14} />
    <Post x={14} />
    <Circle cx={-13} cy={-16} r={1.5} fill={GOLD} stroke={INK} strokeWidth={0.5} />
    <Circle cx={13} cy={-16} r={1.5} fill={GOLD} stroke={INK} strokeWidth={0.5} />
  </G>
);

const Orchid = () => {
  const bloom = (x: number, y: number, r: number) => (
    <G key={`${x}${y}`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <Ellipse
          key={a}
          cx={x + Math.sin((a * Math.PI) / 180) * r * 0.9}
          cy={y - Math.cos((a * Math.PI) / 180) * r * 0.9}
          rx={r * 0.7}
          ry={r * 0.55}
          fill="#F7E6F4"
          stroke={INK}
          strokeWidth={0.4}
        />
      ))}
      <Circle cx={x} cy={y} r={r * 0.5} fill="#B04A92" stroke={INK} strokeWidth={0.3} />
    </G>
  );
  return (
    <G>
      <Path d="M-2.6 0 L-3.4 -11 H3.4 L2.6 0 Z" fill="#fff" {...L} />
      <Path d="M-2.2 -10 V-2" stroke="#BFD0E0" strokeWidth={1} />
      <Path d="M0 -10 Q-1 -22 3.4 -28 Q4.6 -31 4.6 -33" stroke="#3F8A3E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Path d="M-1 -10 Q-6 -14 -5 -19" stroke="#3F8A3E" strokeWidth={1.1} fill="none" strokeLinecap="round" />
      <Path d="M1 -10 Q7 -12 5.2 -17" stroke="#4FA048" strokeWidth={1.1} fill="none" strokeLinecap="round" />
      {bloom(4.6, -33, 2)}
      {bloom(4, -27, 2.2)}
      {bloom(2, -21, 2.2)}
      {bloom(-5, -20, 1.9)}
      {bloom(5.2, -18, 1.9)}
    </G>
  );
};

const Lectern = () => (
  <G>
    <Path d="M-6 0 H6 L5 -3 H-5 Z" fill={WOOD_DARK} {...L} />
    <Path d="M-2.4 -3 L-2 -18 H2 L2.4 -3 Z" fill={WOOD} {...L} />
    <Path d="M-8 -20 L8 -20 L6 -27 L-6 -27 Z" fill={WOOD_DARK} {...L} />
    <Path d="M-8 -20 H8 V-17.6 H-8 Z" fill={WOOD} {...L} />
    <Path d="M-8 -20 H8" stroke={GOLD} strokeWidth={1.2} />
    {/* the reservation book lying open on the slanted top, with a pen */}
    <Path
      d="M-6 -22.4 L-0.4 -22.4 L-0.4 -26 L-5 -26 Z M0.4 -22.4 L6 -22.4 L5 -26 L0.4 -26 Z"
      fill="#fff"
      stroke={INK}
      strokeWidth={0.6}
      strokeLinejoin="round"
    />
    <Path d="M-4.6 -24.8 H-1.4 M1.4 -24.8 H4.4" stroke="#6A7A8A" strokeWidth={0.6} />
    <Path d="M5.6 -21.4 L7.6 -25.4" stroke={GOLD} strokeWidth={1} strokeLinecap="round" />
    <Path d="M-1 -17 H1" stroke={GOLD} strokeWidth={1.2} />
  </G>
);

const Columns = () => {
  const column = (x: number) => (
    <G key={x} transform={`translate(${x} 0)`}>
      <Rect x={-5} y={-3.4} width={10} height={3.4} rx={0.8} fill={GOLD} {...L} />
      <Rect x={-3.6} y={-39} width={7.2} height={36} fill={MARBLE} {...L} />
      <Path d="M-1.8 -39 V-3.4 M0 -39 V-3.4 M1.8 -39 V-3.4" stroke={VEIN} strokeWidth={0.6} />
      <Path d="M-3 -38 V-4" stroke="#fff" strokeWidth={0.8} opacity={0.7} />
      {/* the capital: a gold block under a flare of leaves */}
      <Path
        d="M-5.6 -39 Q-5.6 -44 -2 -44.6 Q-3.4 -42 -1.4 -40.6 Q0 -45.6 0 -45.6 Q0 -45.6 1.4 -40.6 Q3.4 -42 2 -44.6 Q5.6 -44 5.6 -39 Z"
        fill={GOLD}
        stroke={INK}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <Rect x={-6.2} y={-46.4} width={12.4} height={2} rx={0.6} fill={GOLD_LIGHT} {...L} />
    </G>
  );
  return (
    <G>
      {column(-8)}
      {column(8)}
    </G>
  );
};

const Piano = () => (
  <G>
    <Path d="M-14 0 V-8 M10 0 V-8 M20 0 V-7" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
    <Path d="M-14 0 V-8 M10 0 V-8 M20 0 V-7" stroke="#2A2F36" strokeWidth={1.8} strokeLinecap="round" />
    {/* the lid up on its prop, over the curved side */}
    <Path d="M-8 -14 L-1 -27 L18 -22 L12 -14 Z" fill="#1E232B" {...L} />
    <Path d="M-1 -27 L18 -22" stroke="#8D949C" strokeWidth={0.8} opacity={0.6} />
    <Path d="M0 -14 L-1 -22" stroke={GOLD} strokeWidth={0.9} />
    {/* the body: a long case with the curve of the bow on the right */}
    <Path d="M-20 -8 V-14 H12 Q22 -14 22 -11 Q22 -8 14 -8 Z" fill="#2A2F36" {...L} />
    <Path d="M-18 -13 H6" stroke="#fff" strokeWidth={0.9} opacity={0.35} strokeLinecap="round" />
    {/* the keyboard, in front and low */}
    <Rect x={-22} y={-9} width={22} height={3} fill="#fff" stroke={INK} strokeWidth={0.7} />
    {[-19, -16, -12, -9, -5, -2].map((x) => (
      <Rect key={x} x={x} y={-9} width={1.6} height={1.9} fill={INK} />
    ))}
    <Rect x={-22} y={-6.6} width={22} height={2} fill="#3A3F47" stroke={INK} strokeWidth={0.5} />
    {/* the stool */}
    <Rect x={-9} y={-5.4} width={8} height={2.2} rx={1} fill="#7A2E3A" {...L} />
  </G>
);

const Portrait = () => (
  <G>
    <Path d="M-5 -26 H5" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
    <Path d="M-5 -26 H5" stroke={GOLD} strokeWidth={1.2} strokeLinecap="round" />
    <Path d="M-4 -26 L-8 -23.6 H8 L4 -26 Z" fill="#FFE9A0" opacity={0.4} />
    <Rect x={-12} y={-28} width={24} height={28} rx={1.6} fill={GOLD} {...L} />
    <Rect x={-9.6} y={-25.6} width={19.2} height={23.2} rx={0.8} fill={WOOD_DARK} stroke={INK} strokeWidth={0.8} />
    <Rect x={-8.4} y={-24.4} width={16.8} height={20.8} fill="#4A5A6A" />
    {/* the sitter: a head and a pair of shoulders in a dark coat with a white collar */}
    <Path d="M-6.4 -3.6 Q-6.4 -11 0 -11 Q6.4 -11 6.4 -3.6 Z" fill="#2A2F36" />
    <Path d="M-2.4 -11 L0 -8 L2.4 -11 Z" fill="#fff" />
    <Ellipse cx={0} cy={-15.6} rx={3.6} ry={4.4} fill="#E8B88A" stroke={INK} strokeWidth={0.5} />
    <Path d="M-3.8 -16.6 Q-3 -21 0 -20.6 Q3.4 -21 3.8 -16.6 Q2 -18.6 0 -18.6 Q-2 -18.6 -3.8 -16.6 Z" fill="#5A3A2A" />
    {[
      [-11, -27],
      [11, -27],
      [-11, -1],
      [11, -1],
    ].map(([x, y]) => (
      <Circle key={`${x}${y}`} cx={x} cy={y} r={1.8} fill={GOLD_LIGHT} stroke={INK} strokeWidth={0.5} />
    ))}
  </G>
);

const IceSwan = () => (
  <G>
    <Ellipse cx={0} cy={-1.4} rx={8} ry={2.2} fill={STEEL_LIGHT} {...L} />
    <Ellipse cx={0} cy={-2} rx={6} ry={1.4} fill="#E8EEF2" stroke={STEEL} strokeWidth={0.5} />
    {/* the swan: a body, a wing of feathers and an S neck holding its head up */}
    <Path d="M-7 -3 Q-8 -9 -3 -9.6 Q4 -9.6 7.4 -14 Q8 -10 5 -5 Q2 -2 -7 -3 Z" fill="#CFEFFF" opacity={0.92} {...L} />
    <Path d="M6 -8.6 Q5 -16 2 -18.4 Q-0.6 -20.6 1.6 -22.4 Q4 -22.6 5 -20.6" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
    <Path d="M6 -8.6 Q5 -16 2 -18.4 Q-0.6 -20.6 1.6 -22.4 Q4 -22.6 5 -20.6" stroke="#CFEFFF" strokeWidth={2.4} fill="none" strokeLinecap="round" />
    <Path d="M5.4 -21.4 L7.8 -20.6 L5.4 -19.6 Z" fill="#F2994A" stroke={INK} strokeWidth={0.5} strokeLinejoin="round" />
    <Path d="M-6 -6 Q-3 -9 0 -6 M-3 -4 Q0 -7 3 -4" stroke="#7FB4D8" strokeWidth={0.7} fill="none" />
    <Path d="M-6 -8.4 Q-3 -9.4 0 -9" stroke="#fff" strokeWidth={1} opacity={0.8} fill="none" strokeLinecap="round" />
    <Path d="M-6 -17 V-13 M-8 -15 H-4" stroke="#fff" strokeWidth={0.9} strokeLinecap="round" />
  </G>
);

const ChampagneTower = () => {
  const glass = (x: number, y: number) => (
    <G key={`${x}${y}`}>
      <Path d={`M${x - 3.4} ${y - 5} Q${x} ${y - 0.4} ${x + 3.4} ${y - 5} Z`} fill="#FFF3C4" stroke={INK} strokeWidth={0.6} strokeLinejoin="round" />
      <Path d={`M${x - 3} ${y - 5} H${x + 3}`} stroke="#fff" strokeWidth={0.7} />
      <Path d={`M${x} ${y - 2} V${y + 1.2} M${x - 1.6} ${y + 1.4} H${x + 1.6}`} stroke={INK} strokeWidth={0.8} strokeLinecap="round" />
    </G>
  );
  const rows = [4, 3, 2, 1];
  return (
    <G>
      <Ellipse cx={0} cy={0} rx={14} ry={1.8} fill="#fff" {...L} />
      <Ellipse cx={0} cy={0.4} rx={10} ry={1} fill={GOLD_LIGHT} opacity={0.5} />
      {rows.map((n, r) => Array.from({ length: n }, (_, i) => glass((i - (n - 1) / 2) * 7.6, -2 - r * 7.4)))}
      <Path d="M0 -28 V-31" stroke={GOLD} strokeWidth={1} />
      <Circle cx={4} cy={-34} r={1} fill="#fff" opacity={0.9} />
      <Path d="M-2 -33 L2 -33 M0 -35 L0 -31" stroke="#fff" strokeWidth={0.8} strokeLinecap="round" />
    </G>
  );
};

const DecoArch = () => (
  <G>
    <Path d="M-14 0 V-22 A14 14 0 0 1 14 -22 V0 Z" fill={GOLD} {...L} />
    {/* the sunburst: rays fanning round the arch's crown */}
    {Array.from({ length: 9 }, (_, i) => -80 + i * 20).map((a) => (
      <Path key={a} d="M0 -22 V-35" transform={`rotate(${a} 0 -22)`} stroke={INK} strokeWidth={0.7} opacity={0.7} />
    ))}
    <Path d="M-10.4 0 V-22 A10.4 10.4 0 0 1 10.4 -22 V0 Z" fill="#CFE2EE" stroke={INK} strokeWidth={0.9} />
    <Path d="M-6 -3 L4 -20 M0 -3 L7 -15" stroke="#fff" strokeWidth={1.6} opacity={0.7} strokeLinecap="round" />
    <Path d="M-10.4 -22 A10.4 10.4 0 0 1 10.4 -22" stroke={GOLD_LIGHT} strokeWidth={1.1} fill="none" />
    <Rect x={-14.6} y={-2.4} width={29.2} height={2.8} rx={0.8} fill={GOLD_LIGHT} {...L} />
  </G>
);

/** The drawing of each decor thing of the three shops, by name (renovation-props.tsx merges it into the dispatch). */
export const DRAW_B: Readonly<Record<string, () => ReactElement>> = {
  'bulletin-board': BulletinBoard,
  'bean-bag': BeanBag,
  'string-lights': StringLights,
  couch: Couch,
  vending: Vending,
  'bike-rack': BikeRack,
  globe: Globe,
  'library-ladder': LibraryLadder,
  telescope: Telescope,
  'pipe-run': PipeRun,
  drums: Drums,
  pegboard: Pegboard,
  'flour-pallet': FlourPallet,
  'gear-clock': GearClock,
  'work-lamp': WorkLamp,
  boiler: Boiler,
  conveyor: Conveyor,
  'anvil-table': AnvilTable,
  'velvet-rope': VelvetRope,
  orchid: Orchid,
  lectern: Lectern,
  columns: Columns,
  piano: Piano,
  portrait: Portrait,
  'ice-swan': IceSwan,
  'champagne-tower': ChampagneTower,
  'deco-arch': DecoArch,
};

// ---------- the fixtures ----------

/**
 * The University's school banner: a tall pennant on a brass rod, hung by the door. The origin is the rod's middle; it is 18 wide and 52 tall (a swallow-tail foot), with a crest
 * (a shield with a star and a book) and a gold fringe.
 */
export const SchoolBanner = memo(function SchoolBanner() {
  return (
    <G>
      <Rect x={-10} y={-2} width={20} height={3} rx={1.4} fill={GOLD} {...L} />
      <Circle cx={-10} cy={-0.5} r={1.8} fill={GOLD_LIGHT} stroke={INK} strokeWidth={0.6} />
      <Circle cx={10} cy={-0.5} r={1.8} fill={GOLD_LIGHT} stroke={INK} strokeWidth={0.6} />
      <Path d="M-8 1 H8 V46 L0 38 L-8 46 Z" fill="#2E4FA0" {...L} />
      <Path d="M-8 1 H-5.4 V43.4 L-8 46 Z" fill="#000" opacity={0.18} />
      <Path d="M-6 3.4 H6" stroke={GOLD} strokeWidth={1.2} />
      {/* the crest: a gold shield with a star over an open book */}
      <Path d="M-5 9 H5 V18 Q5 22 0 24.4 Q-5 22 -5 18 Z" fill={GOLD} stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
      <Path d="M0 10 L1.2 12.8 L4 13 L1.8 14.8 L2.6 17.6 L0 16 L-2.6 17.6 L-1.8 14.8 L-4 13 L-1.2 12.8 Z" fill="#2E4FA0" />
      <Path d="M-3.4 19.2 Q-1.6 18.2 0 19.2 Q1.6 18.2 3.4 19.2 V21.4 Q1.6 20.6 0 21.4 Q-1.6 20.6 -3.4 21.4 Z" fill={CREAM} stroke={INK} strokeWidth={0.4} />
      <Path d="M-6 28 H6 M-6 31 H6" stroke={GOLD} strokeWidth={1.1} strokeDasharray="1.6 1.2" />
      <Path d="M-6 3 V42" stroke="#fff" strokeWidth={1} opacity={0.2} />
    </G>
  );
});

/**
 * The University's clock tower on the roof: a slim stone shaft, a round clock face with hands, a belfry and a pointed copper cap. The origin is the tower's foot; it is 16 wide, 70 tall.
 */
export const ClockTower = memo(function ClockTower() {
  return (
    <G>
      <Path d="M-6.4 0 V-34 H6.4 V0 Z" fill="#D9C7A2" {...L} />
      <Path d="M-6.4 -10 H6.4 M-6.4 -20 H6.4" stroke="#A8946A" strokeWidth={0.7} />
      <Path d="M-6.4 -34 H-3.6 V0 H-6.4 Z" fill="#000" opacity={0.14} />
      <Path d="M-7.8 -34 H7.8 V-31.4 H-7.8 Z" fill="#B9A57C" {...L} />
      <Circle cx={0} cy={-45} r={9.6} fill="#E8D8B0" {...L} />
      <Circle cx={0} cy={-45} r={7.2} fill={CREAM} stroke={INK} strokeWidth={0.9} />
      {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
        <Path key={a} d="M0 -6.6 V-5.2" transform={`translate(0 -45) rotate(${a})`} stroke={INK} strokeWidth={a % 90 === 0 ? 1 : 0.6} />
      ))}
      <Path d="M0 -45 V-50.4" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M0 -45 L3.8 -43" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={0} cy={-45} r={0.9} fill={RED} />
      <Path d="M-8.6 -54.4 H8.6 L6.4 -57 H-6.4 Z" fill="#B9A57C" {...L} />
      <Path d="M-6.4 -57 L0 -70 L6.4 -57 Z" fill="#3F8F7A" {...L} />
      <Path d="M-1 -62 L0 -68" stroke="#fff" strokeWidth={0.9} opacity={0.5} strokeLinecap="round" />
      <Circle cx={0} cy={-70.8} r={1.1} fill={GOLD} stroke={INK} strokeWidth={0.4} />
    </G>
  );
});

/**
 * Industrial's brick stack on the roof, with a slow plume: a tapered brick shaft, a corbelled cap and three smoke puffs drifting up and away. The origin is the stack's foot; it is
 * 14 wide and 56 tall to the cap, the plume rising to 88.
 */
export const BrickChimney = memo(function BrickChimney() {
  return (
    <G>
      <Path d="M-7.6 0 L-5.6 -52 H5.6 L7.6 0 Z" fill={BRICK} {...L} />
      {Array.from({ length: 8 }, (_, i) => i * 6.4 + 4).map((y) => (
        <Path key={y} d={`M${-7.4 + (y / 52) * 1.8} ${-y} H${7.4 - (y / 52) * 1.8}`} stroke="#7A3520" strokeWidth={0.6} />
      ))}
      <Path d="M-5.4 -4 V-50" stroke="#fff" strokeWidth={0.9} opacity={0.2} />
      <Path d="M-7.4 -52 H7.4 V-55.6 H-7.4 Z" fill="#6A2E1C" {...L} />
      <Path d="M-5.6 -46 H5.6 V-44 H-5.6 Z" fill={STEEL_DARK} stroke={INK} strokeWidth={0.5} />
      <Ellipse cx={0} cy={-55.6} rx={6} ry={1.2} fill="#2A2F36" />
      <Circle cx={3} cy={-62} r={4.6} fill="#E8EAED" stroke={INK} strokeWidth={0.6} opacity={0.92} />
      <Circle cx={8} cy={-71} r={5.8} fill="#DADDE1" stroke={INK} strokeWidth={0.6} opacity={0.8} />
      <Circle cx={15} cy={-82} r={7} fill="#CBD0D6" stroke={INK} strokeWidth={0.6} opacity={0.6} />
    </G>
  );
});

/**
 * Industrial's gantry crane above the entrance: two steel legs with cross-bracing, a girder across the top, a trolley and a cable ending in a hook. The origin is the middle of its
 * foot; it is 44 wide and 48 tall, the hook hanging inside the frame.
 */
export const Gantry = memo(function Gantry() {
  return (
    <G>
      {[-20, 20].map((x) => (
        <G key={x}>
          <Path d={`M${x - 2.4} 0 V-40 M${x + 2.4} 0 V-40`} stroke={STEEL_DARK} strokeWidth={1.8} />
          <Path
            d={`M${x - 2.4} 0 L${x + 2.4} -13 L${x - 2.4} -26 L${x + 2.4} -40 M${x + 2.4} 0 L${x - 2.4} -13 L${x + 2.4} -26 L${x - 2.4} -40`}
            stroke={STEEL}
            strokeWidth={1}
            fill="none"
          />
          <Rect x={x - 4} y={-1.6} width={8} height={2.4} fill={STEEL_DARK} {...L} />
        </G>
      ))}
      <Rect x={-24} y={-46} width={48} height={7} fill={HAZARD} {...L} />
      {Array.from({ length: 8 }, (_, i) => -22 + i * 6).map((x) => (
        <Path key={x} d={`M${x} -39 L${x + 4} -46`} stroke={INK} strokeWidth={1.8} />
      ))}
      <Rect x={-24} y={-46} width={48} height={7} fill="none" stroke={INK} strokeWidth={1} />
      {/* the trolley, its cable and the hook */}
      <Rect x={-4} y={-40} width={8} height={4.4} rx={0.8} fill={STEEL_DARK} {...L} />
      <Path d="M0 -36 V-14" stroke={INK} strokeWidth={1.2} />
      <Path d="M-1.8 -14 H1.8 V-11 Q1.8 -7 -1 -7 Q-3 -7 -3 -9.4" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d="M-1.8 -14 H1.8 V-11 Q1.8 -7 -1 -7 Q-3 -7 -3 -9.4" stroke={STEEL_LIGHT} strokeWidth={1} fill="none" strokeLinecap="round" />
      <Circle cx={21} cy={-47.4} r={1.6} fill={RED} stroke={INK} strokeWidth={0.5} />
    </G>
  );
});

/**
 * Industrial's roll-up steel shutter over the doorway: a coil box with a hazard stripe along its face and the shutter's slatted curtain rolled most of the way up, `w` wide. The origin
 * is the box's top left; the box is 12 tall, the curtain's slats hang 5 more.
 */
export const SteelShutter = memo(function SteelShutter({ w }: { w: number }) {
  const n = Math.max(6, Math.round(w / 3.4));
  const sw = (w - 4) / n;
  return (
    <G>
      <Rect x={0} y={0} width={w} height={9} rx={2} fill={STEEL} {...L} />
      <Path d="M2 1.4 H12" stroke="#fff" strokeWidth={0.9} opacity={0.5} strokeLinecap="round" />
      {/* the hazard stripe on the housing's face */}
      <Rect x={2} y={4} width={w - 4} height={4} fill={HAZARD} stroke={INK} strokeWidth={0.6} />
      {Array.from({ length: n }, (_, i) => 2 + i * sw).map((x) => (
        <Path key={x} d={`M${x} 8 L${x + sw * 0.6} 4`} stroke={INK} strokeWidth={1.4} />
      ))}
      <Rect x={2} y={9} width={w - 4} height={5} fill="#B8BEC4" stroke={INK} strokeWidth={0.8} />
      {Array.from({ length: 3 }, (_, i) => 10.4 + i * 1.6).map((y) => (
        <Path key={y} d={`M2 ${y} H${w - 2}`} stroke={STEEL_DARK} strokeWidth={0.5} />
      ))}
      <Rect x={w / 2 - 3} y={13} width={6} height={2.6} rx={0.8} fill={STEEL_DARK} {...L} />
    </G>
  );
});

/**
 * Uptown's brass revolving door, as seen over the doorway: a brass hood in the shape of a half drum with four glass wedges, brass posts down both jambs, `w` wide. The origin is the
 * hood's middle, at the doorway's top; the hood is 14 tall.
 */
export const BrassDoor = memo(function BrassDoor({ w }: { w: number }) {
  const r = w / 2;
  return (
    <G>
      <Path d={`M${-r} 0 A${r} 14 0 0 1 ${r} 0 Z`} fill={GOLD} {...L} />
      <Path d={`M${-r + 2.6} 0 A${r - 2.6} 11.4 0 0 1 ${r - 2.6} 0 Z`} fill="#CFE2EE" stroke={INK} strokeWidth={0.8} />
      {/* four glass wedges: the door's wings seen from above */}
      {[-0.66, -0.22, 0.22, 0.66].map((t) => (
        <Path key={t} d={`M0 0 L${(r - 2.6) * t} ${-11.4 * Math.sqrt(1 - t * t)}`} stroke={GOLD} strokeWidth={1.2} />
      ))}
      <Path d={`M${-r + 5} -3 Q${-r / 2} -9 ${-r / 4} -9.6`} stroke="#fff" strokeWidth={1} opacity={0.7} fill="none" strokeLinecap="round" />
      <Rect x={-r - 0.4} y={0} width={3} height={5} fill={GOLD_LIGHT} {...L} />
      <Rect x={r - 2.6} y={0} width={3} height={5} fill={GOLD_LIGHT} {...L} />
      <Circle cx={0} cy={-13.6} r={1.6} fill={GOLD_LIGHT} stroke={INK} strokeWidth={0.5} />
    </G>
  );
});

/** A brass post for a jamb: `h` tall, the origin its top; ball cap, a fluted shaft and a foot. */
export const BrassPost = memo(function BrassPost({ h }: { h: number }) {
  return (
    <G>
      <Rect x={-1.8} y={0} width={3.6} height={h} fill={GOLD} {...L} />
      <Path d={`M-0.6 1 V${h - 1}`} stroke="#fff" strokeWidth={0.7} opacity={0.6} />
      <Rect x={-2.6} y={-1.4} width={5.2} height={2.4} rx={0.8} fill={GOLD_LIGHT} {...L} />
      <Rect x={-2.8} y={h - 2} width={5.6} height={2.6} rx={0.8} fill={GOLD_LIGHT} {...L} />
    </G>
  );
});

/** Uptown's gold crown over the sign, with a twinkle: 30 wide, 24 tall, the origin its foot's middle. */
export const CrownSign = memo(function CrownSign() {
  return (
    <G>
      <Circle cx={0} cy={-14} r={16} fill="#FFE08A" opacity={0.25} />
      <Path d="M-14 0 L-16 -16 L-8 -9 L0 -20 L8 -9 L16 -16 L14 0 Z" fill={GOLD} {...L} />
      <Rect x={-14.6} y={-4} width={29.2} height={4.4} rx={1} fill={GOLD_LIGHT} {...L} />
      {[
        [-16, -16],
        [0, -20.6],
        [16, -16],
      ].map(([x, y]) => (
        <Circle key={x} cx={x} cy={y} r={2.2} fill={RED} stroke={INK} strokeWidth={0.7} />
      ))}
      {[-8, 0, 8].map((x) => (
        <Circle key={x} cx={x} cy={-2} r={1.2} fill={NAVY} stroke={INK} strokeWidth={0.4} />
      ))}
      <Path d="M-6 -8 L-3 -14" stroke="#fff" strokeWidth={1} opacity={0.6} strokeLinecap="round" />
      {/* the twinkle: a four-point star beside the crown */}
      <Path
        d="M21 -30 L22.4 -26 L26.4 -24.6 L22.4 -23.2 L21 -19.2 L19.6 -23.2 L15.6 -24.6 L19.6 -26 Z"
        fill="#fff"
        stroke={GOLD}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
    </G>
  );
});

/**
 * The University's lounge counter: stickers over the counter's front panel and a laptop charging rail along its top (screen x from `x0` to `x1`; `bandY` the rail's centre, `footY`
 * the panel's foot). Over the counter's front, under the people at it.
 */
export const LoungeCounter = memo(function LoungeCounter({ x0, x1, bandY, footY }: { x0: number; x1: number; bandY: number; footY: number }) {
  const w = x1 - x0;
  const cols = ['#E0457B', '#2E9CCA', '#FFC531', '#7FE0A0', '#B04A92', '#F2994A'];
  const n = Math.max(5, Math.round(w / 12));
  return (
    <G>
      <Rect x={x0 - 1} y={bandY - 2.8} width={w + 2} height={5.6} rx={2} fill="#2A2F36" {...L} />
      {Array.from({ length: Math.max(4, Math.round(w / 9)) }, (_, i) => x0 + 5 + i * ((w - 10) / Math.max(3, Math.round(w / 9) - 1))).map((x) => (
        <Rect key={x} x={x - 1.6} y={bandY - 1.2} width={3.2} height={2} rx={0.5} fill="#7FE0A0" />
      ))}
      {/* the stickers: rounded patches, stars and a smiley, each a different shape and colour, on the panel below the rail */}
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + 5 + i * ((w - 10) / (n - 1));
        const y = bandY + 5 + ((i * 7) % 5);
        const c = cols[i % cols.length];
        return i % 3 === 0 ? (
          <Circle key={i} cx={x} cy={y + 2} r={3.2} fill={c} stroke="#fff" strokeWidth={1} />
        ) : i % 3 === 1 ? (
          <Path
            key={i}
            d={`M${x} ${y - 2} L${x + 1.3} ${y + 1} L${x + 4} ${y + 1.2} L${x + 1.8} ${y + 3} L${x + 2.6} ${y + 6} L${x} ${y + 4.2} L${x - 2.6} ${y + 6} L${x - 1.8} ${y + 3} L${x - 4} ${y + 1.2} L${x - 1.3} ${y + 1} Z`}
            fill={c}
            stroke="#fff"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        ) : (
          <Rect key={i} x={x - 3.6} y={y} width={7.2} height={5} rx={1.6} fill={c} stroke="#fff" strokeWidth={1} />
        );
      })}
      <Rect x={x0} y={footY - 2.4} width={w} height={2.4} fill="#2A2F36" />
    </G>
  );
});

/**
 * Uptown's marble counter: a veined marble face under a gold trim (screen x from `x0` to `x1`; `bandY` the trim's centre, `footY` the panel's foot). Over the counter's front, under
 * the people at it.
 */
export const MarbleCounter = memo(function MarbleCounter({ x0, x1, bandY, footY }: { x0: number; x1: number; bandY: number; footY: number }) {
  const w = x1 - x0;
  const h = footY - bandY;
  return (
    <G>
      <Rect x={x0} y={bandY - 1} width={w} height={h + 1} fill={MARBLE} stroke={INK} strokeWidth={0.9} />
      <Path
        d={`M${x0 + w * 0.12} ${bandY + 2} Q${x0 + w * 0.3} ${bandY + h * 0.5} ${x0 + w * 0.22} ${footY - 2}`}
        stroke={VEIN}
        strokeWidth={0.9}
        fill="none"
      />
      <Path
        d={`M${x0 + w * 0.46} ${bandY + 1} Q${x0 + w * 0.6} ${bandY + h * 0.4} ${x0 + w * 0.52} ${bandY + h * 0.8}`}
        stroke={VEIN}
        strokeWidth={1.3}
        fill="none"
      />
      <Path d={`M${x0 + w * 0.8} ${bandY + 2} Q${x0 + w * 0.7} ${bandY + h * 0.6} ${x0 + w * 0.88} ${footY - 3}`} stroke={VEIN} strokeWidth={0.8} fill="none" />
      <Path d={`M${x0 + w * 0.3} ${bandY + 3} L${x0 + w * 0.4} ${bandY + h * 0.7}`} stroke="#fff" strokeWidth={1.6} opacity={0.7} />
      <Rect x={x0 - 1} y={bandY - 3} width={w + 2} height={5} rx={1.6} fill={GOLD} {...L} />
      <Path d={`M${x0 + 2} ${bandY - 1.6} H${x1 - 2}`} stroke="#fff" strokeWidth={0.9} opacity={0.7} />
      <Rect x={x0 - 1} y={footY - 3.2} width={w + 2} height={3.2} fill={GOLD} stroke={INK} strokeWidth={0.8} />
      <Polygon points={`${x0 + 2},${bandY + 3} ${x0 + 7},${bandY + 3} ${x0 + 2},${bandY + 8}`} fill={GOLD_LIGHT} stroke={INK} strokeWidth={0.5} />
      <Polygon points={`${x1 - 2},${bandY + 3} ${x1 - 7},${bandY + 3} ${x1 - 2},${bandY + 8}`} fill={GOLD_LIGHT} stroke={INK} strokeWidth={0.5} />
    </G>
  );
});
