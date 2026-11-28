// The drawings of a renovated shop (v5.25, card S6; where they stand is renovation-art.ts, the list of looks docs/build/v5.25/renovation.md): the plaque, the fixture upgrades
// that are pieces of their own (the oven arch, the counter's apron, the plank deck, the rope rail, the lighthouse, the roof pylon, the neon OPEN) and the 27 decor props of
// Downtown (classic trattoria), the Suburbs (1950s diner) and the Waterfront (dockside). Every drawing is memoised on primitives and stands at its own origin (the anchor is the
// bottom centre; a hung thing's is its top centre), drawn inside the box renovation-art.ts `DEFS` gives it. The awning, the gold name sign and the rest of the facade are in facade.tsx.
import { memo, type ReactElement } from 'react';
import { Circle, Ellipse, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { F } from '../../theme';
import { INK, P, pts } from './projection';
import { RENO_PLAQUE_H, RENO_PLAQUE_W, type PlaqueFrame } from './renovation-art';

const L = { stroke: INK, strokeWidth: 1, strokeLinejoin: 'round' as const };
const CHROME = '#C9CED4';
const CHROME_DARK = '#8D949C';
const WOOD = '#8A5A3A';
const WOOD_DARK = '#5E3A26';
const WOOD_LIGHT = '#B58355';
const BRICK = '#B5532F';
const CREAM = '#FFF4E0';
const RED = '#D9443A';
const TEAL = '#1F9C93';
const PINK = '#FF5E9A';
const NAVY = '#2E5C8A';
const GOLD = '#F2C94C';
const GLASS = 'rgba(191,227,245,0.45)';

// ---------- the plaque ----------

/** Metal by level: bronze, silver, gold (face, rim, numeral). */
const METALS = [
  { face: '#D9A066', rim: '#8A5A2B', ink: '#4A2A10', hi: '#F5CFA0' },
  { face: '#DDE3E8', rim: '#7B8791', ink: '#2F3A44', hi: '#FFFFFF' },
  { face: '#F2C94C', rim: '#9A6B00', ink: '#5A3A00', hi: '#FFF3B0' },
] as const;

/** The numerals of the three levels. */
export const NUMERALS = ['I', 'II', 'III'] as const;

/**
 * The renovation plaque, centred on its origin in RENO_PLAQUE_W x RENO_PLAQUE_H: an oval with a rope edge (Downtown), a rounded plate with rivets (the Suburbs) or a porthole ring
 * with four bolts (the Waterfront), in bronze, silver or gold with its numeral in Roman at 12 pt.
 */
export const RenoPlaque = memo(function RenoPlaque({ frame, level }: { frame: PlaqueFrame; level: number }) {
  const m = METALS[Math.max(0, Math.min(2, level - 1))];
  const w = RENO_PLAQUE_W;
  const h = RENO_PLAQUE_H;
  const num = (
    <SvgText x={0} y={4.4} fontFamily={F.bold} fontSize={12} fill={m.ink} textAnchor="middle" letterSpacing={0.4}>
      {NUMERALS[Math.max(0, Math.min(2, level - 1))]}
    </SvgText>
  );
  if (frame === 'porthole')
    return (
      <G>
        <Circle cx={1} cy={1.4} r={12.6} fill="rgba(59,31,20,0.3)" />
        <Circle cx={0} cy={0} r={12.6} fill={m.rim} stroke={INK} strokeWidth={1.3} />
        <Circle cx={0} cy={0} r={9.6} fill="#173A57" stroke={m.hi} strokeWidth={0.9} />
        <Circle cx={0} cy={0} r={11} fill="none" stroke={m.face} strokeWidth={1.6} />
        {[45, 135, 225, 315].map((a) => (
          <Circle key={a} cx={Math.cos((a * Math.PI) / 180) * 11} cy={Math.sin((a * Math.PI) / 180) * 11} r={1.5} fill={m.hi} stroke={INK} strokeWidth={0.6} />
        ))}
        <SvgText x={0} y={4.4} fontFamily={F.bold} fontSize={12} fill={m.face} textAnchor="middle" letterSpacing={0.4}>
          {NUMERALS[Math.max(0, Math.min(2, level - 1))]}
        </SvgText>
        <Path d="M-6.4 -6 A9 9 0 0 1 0 -9" stroke="#fff" strokeWidth={1.2} opacity={0.5} fill="none" strokeLinecap="round" />
      </G>
    );
  if (frame === 'plate')
    return (
      <G>
        <Rect x={-w / 2 + 1.2} y={-h / 2 + 1.8} width={w - 2} height={h - 2} rx={6} fill="rgba(59,31,20,0.3)" />
        <Rect x={-w / 2 + 1} y={-h / 2 + 1} width={w - 2} height={h - 2} rx={6} fill={m.rim} stroke={INK} strokeWidth={1.3} />
        <Rect x={-w / 2 + 4} y={-h / 2 + 4} width={w - 8} height={h - 8} rx={3.5} fill={m.face} stroke={m.hi} strokeWidth={0.8} />
        {[
          [-w / 2 + 4.6, -h / 2 + 4.6],
          [w / 2 - 4.6, -h / 2 + 4.6],
          [-w / 2 + 4.6, h / 2 - 4.6],
          [w / 2 - 4.6, h / 2 - 4.6],
        ].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={1.3} fill={m.hi} stroke={INK} strokeWidth={0.6} />
        ))}
        {num}
        <Path d={`M${-w / 2 + 8} ${-h / 2 + 5.4} H${-w / 2 + 16}`} stroke="#fff" strokeWidth={1.2} opacity={0.6} strokeLinecap="round" />
      </G>
    );
  return (
    <G>
      <Ellipse cx={1} cy={1.6} rx={w / 2} ry={h / 2} fill="rgba(59,31,20,0.3)" />
      <Ellipse cx={0} cy={0} rx={w / 2} ry={h / 2} fill={m.rim} stroke={INK} strokeWidth={1.3} />
      {/* the rope edge: a twist of dashes round the rim */}
      <Ellipse cx={0} cy={0} rx={w / 2 - 2.2} ry={h / 2 - 2.2} fill="none" stroke="#E8CFA0" strokeWidth={2.4} strokeDasharray="3.2 1.6" />
      <Ellipse cx={0} cy={0} rx={w / 2 - 5} ry={h / 2 - 5} fill={m.face} stroke={INK} strokeWidth={0.8} />
      {num}
      <Path d="M-10 -6.6 Q-5 -9.2 0 -9.4" stroke="#fff" strokeWidth={1.2} opacity={0.6} fill="none" strokeLinecap="round" />
    </G>
  );
});

// ---------- Downtown's decor ----------

const Espresso = () => (
  <G>
    <Rect x={-8} y={-23} width={16} height={23} rx={2} fill={CHROME} {...L} />
    <Rect x={-8} y={-27} width={16} height={5} rx={1.6} fill={CHROME_DARK} {...L} />
    <Rect x={-6} y={-20} width={12} height={8} rx={1} fill="#2A2F36" stroke={INK} strokeWidth={0.7} />
    <Circle cx={-3} cy={-16} r={1.5} fill="#7FE0A0" />
    <Circle cx={3} cy={-16} r={1.5} fill={RED} />
    <Rect x={-4.4} y={-10} width={8.8} height={2.4} fill="#2A2F36" />
    <Rect x={-2.4} y={-9} width={4.8} height={4.4} rx={0.8} fill="#fff" stroke={INK} strokeWidth={0.7} />
    <Rect x={-7} y={-3.4} width={14} height={2.2} fill="#4A4F57" />
    <Path d="M-6 -22 V-1" stroke="#fff" strokeWidth={1.2} opacity={0.55} strokeLinecap="round" />
    {/* the steam puff */}
    <Circle cx={4.5} cy={-30} r={2.2} fill="#fff" stroke={INK} strokeWidth={0.5} opacity={0.9} />
    <Circle cx={2.6} cy={-32.6} r={1.8} fill="#fff" stroke={INK} strokeWidth={0.5} opacity={0.8} />
    <Circle cx={5.4} cy={-34} r={1.4} fill="#fff" stroke={INK} strokeWidth={0.5} opacity={0.7} />
  </G>
);

const WineRack = () => (
  <G>
    <Rect x={-13} y={-34} width={26} height={34} rx={1.4} fill={WOOD_DARK} stroke={INK} strokeWidth={1.2} />
    {/* the diamond lattice */}
    <Path
      d="M-13 -26 L-3 -34 M-13 -14 L9 -34 M-13 -2 L13 -26 M-5 0 L13 -14 M5 0 L13 -6 M13 -26 L3 -34 M13 -14 L-9 -34 M13 -2 L-13 -26 M5 0 L-13 -14 M-5 0 L-13 -6"
      stroke={WOOD_LIGHT}
      strokeWidth={1.6}
    />
    {[
      [-8, -28],
      [0, -28],
      [8, -28],
      [-4, -20],
      [4, -20],
      [-8, -12],
      [0, -12],
      [8, -12],
      [-4, -4],
      [4, -4],
    ].map(([x, y]) => (
      <G key={`${x}${y}`}>
        <Rect x={x - 1.4} y={y - 1} width={2.8} height={5} rx={0.8} fill="#2F5D3A" stroke={INK} strokeWidth={0.6} />
        <Circle cx={x} cy={y - 1.2} r={1.6} fill="#E8DCC0" stroke={INK} strokeWidth={0.5} />
      </G>
    ))}
    <Rect x={-13} y={-34} width={26} height={3} rx={1} fill={WOOD} stroke={INK} strokeWidth={0.8} />
  </G>
);

const Chalkboard = () => (
  <G>
    <Path d="M-11 2 L-2.4 -30 M11 2 L2.4 -30" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
    <Path d="M-11 2 L-2.4 -30 M11 2 L2.4 -30" stroke={WOOD_LIGHT} strokeWidth={1.8} strokeLinecap="round" />
    <Rect x={-9} y={-28} width={18} height={21} rx={1.5} fill="#2C3A33" stroke={WOOD} strokeWidth={2.2} />
    <Rect x={-9} y={-28} width={18} height={21} rx={1.5} fill="none" stroke={INK} strokeWidth={0.8} />
    {/* the chalk menu: a slice, a heading and ruled lines */}
    <Path d="M-4.4 -24 H4.4" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
    <Path d="M-5 -20 L5 -20 L0 -10 Z" fill="none" stroke="#FFE08A" strokeWidth={1} strokeLinejoin="round" />
    <Circle cx={-0.4} cy={-16.4} r={1} fill="#FF9A8A" />
    <Circle cx={1.6} cy={-18.6} r={0.8} fill="#FF9A8A" />
    <Path d="M-6.6 -8.6 H6.6" stroke="#fff" strokeWidth={0.9} strokeDasharray="2 1.2" />
  </G>
);

const PendantLamps = () => (
  <G>
    <Path d="M-24 0 H24" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
    <Path d="M-24 0 H24" stroke="#C99A3A" strokeWidth={1.3} strokeLinecap="round" />
    {[
      [-17, 8],
      [0, 17],
      [17, 12],
    ].map(([x, len]) => (
      <G key={x}>
        <Path d={`M${x} 0 V${len - 7}`} stroke={INK} strokeWidth={0.9} />
        <Circle cx={x} cy={len + 1} r={11} fill="#FFE9A8" opacity={0.28} />
        <Path d={`M${x - 3} ${len - 7} H${x + 3} L${x + 2} ${len - 3.6} H${x - 2} Z`} fill="#C99A3A" {...L} />
        <Circle cx={x} cy={len + 1} r={5.6} fill="#FFF0B8" stroke={INK} strokeWidth={1} />
        <Circle cx={x} cy={len + 1.4} r={2.4} fill="#FFD34D" />
        <Path
          d={`M${x - 3.4} ${len - 1.4} Q${x - 4} ${len + 1} ${x - 2.6} ${len + 2.8}`}
          stroke="#fff"
          strokeWidth={0.9}
          opacity={0.8}
          fill="none"
          strokeLinecap="round"
        />
      </G>
    ))}
  </G>
);

const Vespa = () => (
  <G>
    {/* wheels */}
    {[-13, 14].map((x) => (
      <G key={x}>
        <Circle cx={x} cy={-5.4} r={5.4} fill="#2A2F36" {...L} />
        <Circle cx={x} cy={-5.4} r={2.2} fill={CHROME} stroke={INK} strokeWidth={0.6} />
      </G>
    ))}
    {/* body: the leg shield, the floor and the rear cowl */}
    <Path d="M-19 -9 Q-20 -20 -12 -20 L-3 -19 L4 -12 L12 -9 L13 -12 L8 -23 L11 -25 L9 -2.4 L3 -2.4 L-6 -3 L-17 -3 Z" fill={RED} {...L} />
    <Path d="M-17 -14 Q-13 -15 -6 -14" stroke="#fff" strokeWidth={1} opacity={0.6} fill="none" />
    <Path d="M-10 -20 H-1 L1 -23 H-11 Z" fill={CREAM} {...L} />
    {/* the seat, the handlebar and the headlight */}
    <Rect x={-13} y={-23} width={13} height={3.4} rx={1.6} fill="#6B3A22" {...L} />
    <Path d="M11 -25 L10 -28 H14" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    <Circle cx={15.4} cy={-20} r={2} fill="#FFE9A8" stroke={INK} strokeWidth={0.7} />
    {/* the front basket with its bread */}
    <Path d="M14 -19 H22 L21 -12 H15 Z" fill={WOOD_LIGHT} {...L} />
    <Path d="M16 -19 V-12 M19 -19 V-12" stroke={WOOD_DARK} strokeWidth={0.5} />
    <Ellipse cx={17} cy={-21.4} rx={2.2} ry={1.3} fill="#E9B766" stroke={INK} strokeWidth={0.6} transform="rotate(-24 17 -21.4)" />
    <Ellipse cx={20} cy={-21} rx={2.2} ry={1.3} fill="#D9983A" stroke={INK} strokeWidth={0.6} transform="rotate(18 20 -21)" />
  </G>
);

const HerbBox = () => (
  <G>
    {/* basil (round leaves) and rosemary (spikes) in a long box of planks */}
    {[-17, -9, 15].map((x) => (
      <G key={x}>
        <Circle cx={x} cy={-9.4} r={5} fill="#3F8A3E" {...L} />
        <Circle cx={x - 2.4} cy={-11} r={3} fill="#58A94C" stroke={INK} strokeWidth={0.6} />
        <Circle cx={x + 2.6} cy={-7.6} r={2.6} fill="#58A94C" stroke={INK} strokeWidth={0.6} />
      </G>
    ))}
    {[-2, 4, 9].map((x) => (
      <G key={x}>
        <Path d={`M${x} -4 V-16 M${x - 2.4} -4 L${x - 4.4} -14 M${x + 2.4} -4 L${x + 4.4} -14`} stroke="#2F6B3A" strokeWidth={1.6} strokeLinecap="round" />
        <Path
          d={`M${x - 3} -9 L${x} -10 M${x + 3} -9 L${x} -10 M${x - 2.6} -12.6 L${x} -13.4 M${x + 2.6} -12.6 L${x} -13.4`}
          stroke="#58A94C"
          strokeWidth={0.9}
        />
      </G>
    ))}
    <Circle cx={-12} cy={-15} r={1.1} fill="#fff" />
    <Circle cx={20.6} cy={-12.6} r={1.1} fill="#fff" />
    <Path d="M-24 -5 H24 L22 2 H-22 Z" fill={WOOD} {...L} />
    <Path d="M-14 -5 V2 M-4 -5 V2 M6 -5 V2 M16 -5 V2" stroke={WOOD_DARK} strokeWidth={0.7} />
    <Path d="M-22 -3.4 H22" stroke="#fff" strokeWidth={0.8} opacity={0.3} />
  </G>
);

const Chandelier = () => (
  <G>
    <Path d="M0 0 V7" stroke={INK} strokeWidth={1.1} />
    <Circle cx={0} cy={0.6} r={1.6} fill="#C99A3A" stroke={INK} strokeWidth={0.6} />
    {/* three tiers: brass rings joined by curved arms, candle tips on the lowest, crystals hung from each */}
    <Path
      d="M-5 8 Q-9 12 -11 17 M5 8 Q9 12 11 17 M-11 19 Q-14 23 -15 26 M11 19 Q14 23 15 26"
      stroke="#C99A3A"
      strokeWidth={1.4}
      fill="none"
      strokeLinecap="round"
    />
    {[
      [8, 6],
      [18, 12],
      [27, 16],
    ].map(([y, rx]) => (
      <Ellipse key={y} cx={0} cy={y} rx={rx} ry={rx * 0.22} fill="#E3B52E" stroke={INK} strokeWidth={0.9} />
    ))}
    {[-12, -6, 0, 6, 12].map((x) => (
      <G key={x}>
        <Rect x={x - 1} y={20.6 - Math.abs(x) * 0.12} width={2} height={5} fill={CREAM} stroke={INK} strokeWidth={0.5} />
        <Path d={`M${x} ${20.4 - Math.abs(x) * 0.12} Q${x + 1.6} ${18} ${x} ${16.4} Q${x - 1.6} ${18} ${x} ${20.4 - Math.abs(x) * 0.12}`} fill="#FFD34D" />
      </G>
    ))}
    {[-14, -8, -2, 4, 10, 15].map((x, i) => (
      <Path key={x} d={`M${x} 28 l1.4 2.6 l-1.4 3.4 l-1.4 -3.4 Z`} fill="#CFF3FF" stroke={INK} strokeWidth={0.5} opacity={0.4 + (i % 2) * 0.2} />
    ))}
    <Path d="M-4 18 L-3 22" stroke="#fff" strokeWidth={1} opacity={0.7} />
  </G>
);

/** The mosaic medallion: a flat disc (the anchor is its centre), squashed to the floor's perspective. */
const Medallion = () => (
  <G>
    <Ellipse cx={0} cy={1.2} rx={22} ry={8.6} fill="rgba(59,31,20,0.25)" />
    <Ellipse cx={0} cy={0} rx={22} ry={8.6} fill="#E9D9B8" stroke={INK} strokeWidth={1.1} />
    <Ellipse cx={0} cy={0} rx={18.4} ry={7.2} fill="#2F6B4A" stroke={INK} strokeWidth={0.7} />
    <Ellipse cx={0} cy={0} rx={18.4} ry={7.2} fill="none" stroke="#E9D9B8" strokeWidth={1.6} strokeDasharray="2.4 2" />
    <Ellipse cx={0} cy={0} rx={13.6} ry={5.3} fill="#F4E8CC" stroke={INK} strokeWidth={0.7} />
    {/* the compass star */}
    <G transform="scale(1 0.39)">
      <Path d="M0 -13.4 L2.6 -2.6 L13.4 0 L2.6 2.6 L0 13.4 L-2.6 2.6 L-13.4 0 L-2.6 -2.6 Z" fill={RED} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Path d="M9.5 -9.5 L2 -2 M9.5 9.5 L2 2 M-9.5 9.5 L-2 2 M-9.5 -9.5 L-2 -2" stroke="#2F6B4A" strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={0} cy={0} r={2.4} fill={GOLD} stroke={INK} strokeWidth={0.8} />
    </G>
  </G>
);

const Bust = () => (
  <G>
    {/* the square pedestal and the marble bust */}
    <Rect x={-8} y={-14} width={16} height={15} fill="#E8E2D6" {...L} />
    <Rect x={-9.6} y={-17} width={19.2} height={3.6} rx={0.8} fill="#F4EFE6" {...L} />
    <Rect x={-9.6} y={-1.6} width={19.2} height={2.6} fill="#D8D0C0" {...L} />
    <Path d="M-4 -10 V-1 M4 -10 V-1" stroke="#CFC6B4" strokeWidth={0.8} />
    <Path d="M-9 -17 Q-8 -24 -3.6 -25.6 H3.6 Q8 -24 9 -17 Z" fill="#F4EFE6" {...L} />
    <Rect x={-2.4} y={-28.6} width={4.8} height={4} fill="#EDE6D8" stroke={INK} strokeWidth={0.8} />
    <Ellipse cx={0} cy={-32.4} rx={5.4} ry={6.2} fill="#F4EFE6" {...L} />
    <Path
      d="M-5.2 -33.6 Q-6.6 -38.4 -1.8 -38.6 Q3.6 -39.4 5.4 -34.6 Q2.4 -36.6 -1 -35.6 Q-3 -34.4 -5.2 -33.6 Z"
      fill="#DAD2C0"
      stroke={INK}
      strokeWidth={0.7}
    />
    <Path d="M-2.4 -32.4 h1.2 M1.4 -32.4 h1.2 M0 -31.4 v2" stroke="#8D8576" strokeWidth={0.7} strokeLinecap="round" />
    <Path d="M-6 -19 Q-3 -17.4 2 -19.6" stroke="#B7B0A0" strokeWidth={0.7} fill="none" />
    <Path d="M-4 -2 L-3 -9 M3 -3 L5 -8" stroke="#B7B0A0" strokeWidth={0.5} />
  </G>
);

// ---------- the Suburbs' decor ----------

const Jukebox = () => (
  <G>
    <Rect x={-12} y={-3} width={24} height={4} rx={1} fill={CHROME} {...L} />
    <Path d="M-12 -3 V-34 A12 12 0 0 1 12 -34 V-3 Z" fill="#E0457B" {...L} />
    {/* the chrome arch over the record window */}
    <Path d="M-9 -8 V-34 A9 9 0 0 1 9 -34 V-8 Z" fill="#FFE9A8" stroke={CHROME} strokeWidth={2.4} />
    <Path d="M-9 -8 V-34 A9 9 0 0 1 9 -34 V-8 Z" fill="none" stroke={INK} strokeWidth={0.9} />
    <Ellipse cx={0} cy={-27} rx={6} ry={1.6} fill="#2A2F36" stroke={INK} strokeWidth={0.5} />
    <Ellipse cx={0} cy={-27.6} rx={1.4} ry={0.5} fill={RED} />
    <Rect x={-6.6} y={-24} width={13.2} height={6} rx={1} fill="#7A2F52" stroke={INK} strokeWidth={0.7} />
    <Path d="M-5 -22.6 H5 M-5 -20.6 H5 M-5 -18.6 H5" stroke="#FF9AC2" strokeWidth={0.8} />
    <Circle cx={-3} cy={-13} r={1.4} fill="#FFD34D" stroke={INK} strokeWidth={0.5} />
    <Circle cx={3} cy={-13} r={1.4} fill="#6FE8FF" stroke={INK} strokeWidth={0.5} />
    <Rect x={-2.4} y={-11} width={4.8} height={1.6} fill="#2A2F36" />
    {/* the bubble tubes down both sides */}
    {[-11.4, 11.4].map((x) => (
      <G key={x}>
        <Rect x={x - 1.8} y={-36} width={3.6} height={31} rx={1.8} fill="#BFF3FF" stroke={INK} strokeWidth={0.8} />
        <Rect x={x - 1} y={-24} width={2} height={19} rx={1} fill="#FF9AC2" opacity={0.85} />
        {[-31, -26, -20].map((y, i) => (
          <Circle key={y} cx={x + (i % 2 ? 0.6 : -0.6)} cy={y} r={0.9} fill="#fff" />
        ))}
      </G>
    ))}
    <Path d="M-9 -36 Q-5 -42 0 -42.4" stroke="#fff" strokeWidth={1.2} opacity={0.6} fill="none" strokeLinecap="round" />
  </G>
);

const Stools = () => (
  <G>
    {[-22.5, -7.5, 7.5, 22.5].map((x) => (
      <G key={x}>
        <Ellipse cx={x} cy={0.6} rx={5} ry={1.5} fill={CHROME} {...L} />
        <Rect x={x - 1.1} y={-9.6} width={2.2} height={10} fill={CHROME_DARK} stroke={INK} strokeWidth={0.7} />
        <Path d={`M${x - 3.6} -5.6 H${x + 3.6}`} stroke={INK} strokeWidth={0.8} />
        <Path d={`M${x - 6} -12 V-14 Q${x} -9.6 ${x + 6} -14 V-12 Q${x} -8.4 ${x - 6} -12 Z`} fill="#A52E26" {...L} />
        <Ellipse cx={x} cy={-14} rx={6.2} ry={2.4} fill={RED} {...L} />
        <Ellipse cx={x - 1.6} cy={-14.6} rx={2.4} ry={0.8} fill="#fff" opacity={0.55} />
      </G>
    ))}
  </G>
);

const PieCase = () => (
  <G>
    <Ellipse cx={0} cy={0} rx={8.4} ry={1.7} fill={CHROME} {...L} />
    <Rect x={-1.3} y={-8.4} width={2.6} height={8.4} fill={CHROME_DARK} stroke={INK} strokeWidth={0.7} />
    <Ellipse cx={0} cy={-9} rx={10} ry={2.2} fill={CHROME} {...L} />
    {/* the pie, lattice-topped with a cherry */}
    <Path d="M-7 -9.6 L-6 -14 Q0 -16 6 -14 L7 -9.6 Q0 -7.6 -7 -9.6 Z" fill="#D9983A" {...L} />
    <Path d="M-4 -14.4 L-1 -9 M0 -15 L2.6 -9.4 M4 -14 L5.6 -10.6 M-5.4 -11.6 L5.6 -13.6" stroke="#9A5A1C" strokeWidth={0.8} />
    <Circle cx={0.4} cy={-15} r={1.5} fill={RED} stroke={INK} strokeWidth={0.5} />
    {/* the glass dome and its knob */}
    <Path d="M-9 -9.6 Q-10 -26 0 -26 Q10 -26 9 -9.6 Z" fill={GLASS} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
    <Circle cx={0} cy={-27} r={1.8} fill={CHROME} stroke={INK} strokeWidth={0.7} />
    <Path d="M-6.4 -13 Q-7 -20 -3.4 -23.4" stroke="#fff" strokeWidth={1.2} opacity={0.8} fill="none" strokeLinecap="round" />
  </G>
);

const Booth = () => (
  <G>
    {/* the high back and the two arms of the U, tufted teal vinyl on a chrome foot */}
    <Rect x={-24} y={-38} width={48} height={27} rx={6} fill={TEAL} {...L} />
    <Rect x={-24} y={-38} width={7} height={36} rx={3} fill="#177A73" {...L} />
    <Rect x={17} y={-38} width={7} height={36} rx={3} fill="#177A73" {...L} />
    {[-10, 0, 10].map((x) => [-32, -25, -18].map((y) => <Circle key={`${x}${y}`} cx={x + (y === -25 ? 5 : 0)} cy={y} r={1.3} fill="#0E4F4A" />))}
    <Path d="M-17 -29 H17 M-17 -22 H17" stroke="#0E4F4A" strokeWidth={0.7} opacity={0.6} />
    {/* the seat, its front rolled, and a small table between the arms */}
    <Rect x={-18} y={-12} width={36} height={9} rx={3} fill="#2FB8AE" {...L} />
    <Path d="M-17 -8.6 H17" stroke="#fff" strokeWidth={0.9} opacity={0.45} />
    <Ellipse cx={0} cy={-6.4} rx={11} ry={2.8} fill="#F4F1E8" {...L} />
    <Path d="M-10 -6 H10" stroke={RED} strokeWidth={0.8} />
    <Rect x={-24} y={-3} width={48} height={3.4} rx={1} fill={CHROME} {...L} />
    <Path d="M-20 -37 Q-16 -38 -8 -37.6" stroke="#fff" strokeWidth={1.2} opacity={0.5} fill="none" strokeLinecap="round" />
  </G>
);

/** The pennants' string spans `w` units wide; its anchor is the middle of the string's top. Team colours: red, cream and gold. */
export const Pennants = memo(function Pennants({ w }: { w: number }) {
  const half = w / 2;
  const n = Math.max(6, Math.floor(w / 15));
  const step = w / n;
  const sag = (x: number) => 8 * (1 - (x / half) * (x / half));
  const cols = [RED, CREAM, '#E3B52E'];
  return (
    <G>
      <Path d={`M${-half} 0 Q0 ${14} ${half} 0`} stroke={INK} strokeWidth={1.2} fill="none" />
      {Array.from({ length: n }).map((_, i) => {
        const x = -half + step * (i + 0.5);
        const y = 7 * (1 - (x / half) * (x / half)) * 1.0 + 0.6;
        return <Path key={i} d={`M${x - 4.4} ${y - 0.4} L${x + 4.4} ${y + 0.4} L${x} ${y + 9.6} Z`} fill={cols[i % 3]} {...L} />;
      })}
    </G>
  );
});

const Gumball = () => (
  <G>
    <Rect x={-6} y={-8} width={12} height={9} rx={1} fill={RED} {...L} />
    <Path d="M-6 -4 H6" stroke="#fff" strokeWidth={0.8} opacity={0.5} />
    <Rect x={-3} y={-6.6} width={6} height={2.2} fill="#2A2F36" />
    <Rect x={-4.6} y={-10} width={9.2} height={2.4} rx={1} fill={CHROME} {...L} />
    <Circle cx={0} cy={-19} r={8.6} fill="rgba(191,227,245,0.4)" stroke={INK} strokeWidth={1.1} />
    {[
      [-3.6, -15, '#FF5E9A'],
      [0.4, -14.4, '#FFD34D'],
      [4, -15.6, '#6FE8FF'],
      [-5.4, -19.4, '#7FE0A0'],
      [-1.6, -18.6, RED],
      [2.6, -19.6, '#FF5E9A'],
      [5.6, -20.4, '#FFD34D'],
      [-3.4, -23, '#6FE8FF'],
      [1, -23.4, '#7FE0A0'],
    ].map(([x, y, c], i) => (
      <Circle key={i} cx={x as number} cy={y as number} r={1.9} fill={c as string} stroke={INK} strokeWidth={0.5} />
    ))}
    <Rect x={-3.6} y={-29.6} width={7.2} height={3} rx={1.4} fill={CHROME} {...L} />
    <Path d="M-6 -22 Q-6.4 -26 -3.4 -26.6" stroke="#fff" strokeWidth={1.1} opacity={0.8} fill="none" strokeLinecap="round" />
  </G>
);

const Cadillac = () => (
  <G>
    {/* a pink convertible, nose to the right, with the tail fin at the left */}
    <Path d="M-30 -9 L-27 -22 L-22 -17 Q-10 -17 -3 -17.4 L2 -22.6 L8 -22 L12 -16 Q23 -15 28 -12 L30 -7 L28 -3 H-27 Z" fill={PINK} {...L} />
    <Path d="M-30 -9 L-27 -22 L-22 -17" fill="#E0457B" {...L} />
    <Path d="M-28 -10.6 H27" stroke={CHROME} strokeWidth={1.8} />
    <Path d="M-28 -10.6 H27" stroke="#fff" strokeWidth={0.6} opacity={0.7} />
    {/* the open cockpit: two seat backs and the windscreen */}
    <Rect x={-16} y={-21} width={6} height={5} rx={1.6} fill="#F4F1E8" {...L} />
    <Rect x={-6} y={-21} width={6} height={5} rx={1.6} fill="#F4F1E8" {...L} />
    <Path d="M2 -22.6 L8 -22 L10.4 -17 H4 Z" fill={GLASS} stroke={INK} strokeWidth={0.9} />
    <Circle cx={26.4} cy={-10.4} r={1.9} fill="#FFE9A8" stroke={INK} strokeWidth={0.6} />
    <Rect x={-30} y={-7.6} width={3} height={2.4} fill={RED} stroke={INK} strokeWidth={0.5} />
    {[-17, 17].map((x) => (
      <G key={x}>
        <Circle cx={x} cy={-3.6} r={5.4} fill="#2A2F36" {...L} />
        <Circle cx={x} cy={-3.6} r={3.4} fill="#F4F1E8" stroke={INK} strokeWidth={0.5} />
        <Circle cx={x} cy={-3.6} r={1.5} fill={CHROME} stroke={INK} strokeWidth={0.5} />
      </G>
    ))}
    <Path d="M-27 -19 Q-26 -14 -22 -11" stroke="#fff" strokeWidth={1} opacity={0.5} fill="none" strokeLinecap="round" />
  </G>
);

const TrophyCase = () => {
  const cup = (x: number, y: number) => (
    <G key={`c${x}${y}`}>
      <Path
        d={`M${x - 3} ${y - 6} H${x + 3} Q${x + 2.6} ${y - 1.4} ${x} ${y - 1} Q${x - 2.6} ${y - 1.4} ${x - 3} ${y - 6} Z`}
        fill={GOLD}
        stroke={INK}
        strokeWidth={0.7}
      />
      <Path
        d={`M${x - 3} ${y - 5} Q${x - 5.4} ${y - 4.6} ${x - 3.6} ${y - 2.6} M${x + 3} ${y - 5} Q${x + 5.4} ${y - 4.6} ${x + 3.6} ${y - 2.6}`}
        stroke={INK}
        strokeWidth={0.7}
        fill="none"
      />
      <Rect x={x - 0.6} y={y - 1.2} width={1.2} height={1.2} fill={GOLD} />
      <Rect x={x - 2.2} y={y} width={4.4} height={1.2} fill="#7A5200" />
    </G>
  );
  return (
    <G>
      <Rect x={-14} y={-42} width={28} height={42} rx={1.6} fill={WOOD} {...L} />
      <Rect x={-11.6} y={-39.6} width={23.2} height={37.4} fill="#D9F0F7" stroke={INK} strokeWidth={0.8} />
      {[-28, -15].map((y) => (
        <Rect key={y} x={-11.6} y={y} width={23.2} height={1.8} fill={WOOD_LIGHT} stroke={INK} strokeWidth={0.5} />
      ))}
      {cup(-5, -28.6)}
      <Circle cx={6} cy={-32} r={3} fill="#fff" stroke={INK} strokeWidth={0.7} />
      <Path d="M3.4 -33.4 Q6 -31 8.6 -33.4 M3.4 -30.6 Q6 -33 8.6 -30.6" stroke={RED} strokeWidth={0.5} fill="none" />
      {/* a star-topped figurine, then a big and a small cup */}
      <Rect x={-7} y={-19.6} width={4} height={3.6} fill="#7A5200" stroke={INK} strokeWidth={0.5} />
      <Path d="M-5 -29 L-4 -25 H-6 Z" fill="none" />
      <Path
        d="M-5 -26.4 l1 2.4 l2.4 0.2 l-1.8 1.6 l0.6 2.4 l-2.2 -1.3 l-2.2 1.3 l0.6 -2.4 l-1.8 -1.6 l2.4 -0.2 Z"
        fill={GOLD}
        stroke={INK}
        strokeWidth={0.5}
        transform="translate(0 6.4)"
      />
      {cup(6, -15.6)}
      {cup(-5.4, -2.6)}
      <Path d="M3 -5 H10" stroke={INK} strokeWidth={0.5} />
      <Rect x={3} y={-8.2} width={7} height={5.6} rx={0.8} fill={GOLD} stroke={INK} strokeWidth={0.6} />
      <Path d="M-9.6 -38 L-4 -38 L-9.6 -30 Z M5 -38 L10 -38 L10 -33 Z" fill="#fff" opacity={0.5} />
    </G>
  );
};

const PopcornCart = () => (
  <G>
    {[-9, 9].map((x) => (
      <G key={x}>
        <Circle cx={x} cy={-4.6} r={4.6} fill="#2A2F36" {...L} />
        <Circle cx={x} cy={-4.6} r={1.8} fill={CHROME} stroke={INK} strokeWidth={0.5} />
      </G>
    ))}
    <Rect x={-14} y={-18} width={28} height={13} rx={1.6} fill={RED} {...L} />
    <Path d="M-8 -18 V-5 M-2 -18 V-5 M4 -18 V-5 M10 -18 V-5" stroke={CREAM} strokeWidth={2.6} />
    <Rect x={-14} y={-18} width={28} height={13} rx={1.6} fill="none" stroke={INK} strokeWidth={1} />
    {/* the popcorn window and the striped canopy */}
    <Rect x={-12} y={-32} width={24} height={14} fill={GLASS} stroke={INK} strokeWidth={0.9} />
    {[-8, -4, 0, 4, 8, -6, -2, 2, 6].map((x, i) => (
      <Circle key={x + i} cx={x} cy={-19.6 - (i % 3) * 2.2} r={2.2} fill={i % 2 ? '#FFF1B8' : '#FFE08A'} stroke={INK} strokeWidth={0.4} />
    ))}
    <Path d="M-18 -33 L-12 -39 H12 L18 -33 Z" fill={RED} {...L} />
    <Path d="M-12 -39 L-14 -33 M-6 -39 L-7 -33 M0 -39 V-33 M6 -39 L7 -33 M12 -39 L14 -33" stroke={CREAM} strokeWidth={2.4} />
    <Path d="M-18 -33 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0" fill={CREAM} stroke={INK} strokeWidth={0.8} />
    <Path d="M14 -10 H20 L24 -4" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    {/* a popcorn box on the counter */}
    <Path d="M-24 -3 L-26 -12 H-18 L-19 -3 Z" fill={CREAM} {...L} />
    <Path d="M-22.6 -3 L-23 -12 M-20.4 -3 L-20.4 -12" stroke={RED} strokeWidth={1.2} />
    {[-24.4, -21.8, -19.4].map((x) => (
      <Circle key={x} cx={x} cy={-13.4} r={1.6} fill="#FFF1B8" stroke={INK} strokeWidth={0.4} />
    ))}
  </G>
);

// ---------- the Waterfront's decor ----------

const Crates = () => (
  <G>
    {[
      [-12, 0, 24],
      [-11, -10, 22],
      [-10, -20, 20],
    ].map(([x, y, w]) => (
      <G key={y}>
        <Rect x={x} y={y - 10} width={w} height={10} fill={WOOD_LIGHT} {...L} />
        <Path
          d={`M${x + 1} ${y - 7.6} H${x + w - 1} M${x + 1} ${y - 4.4} H${x + w - 1} M${x + 1} ${y - 1.8} H${x + w - 1}`}
          stroke={WOOD_DARK}
          strokeWidth={1.4}
        />
        <Rect x={x} y={y - 10} width={2.4} height={10} fill={WOOD} stroke={INK} strokeWidth={0.7} />
        <Rect x={x + w - 2.4} y={y - 10} width={2.4} height={10} fill={WOOD} stroke={INK} strokeWidth={0.7} />
        <Path d={`M${x + w / 2 - 3} ${y - 8.6} Q${x + w / 2} ${y - 6.4} ${x + w / 2 + 3} ${y - 8.6}`} stroke={INK} strokeWidth={0.8} fill="none" />
      </G>
    ))}
    <Path d="M-10 -30 q4 -3 8 0" stroke="#D9B382" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    <Ellipse cx={5} cy={-32} rx={4} ry={2.4} fill="#E8602E" stroke={INK} strokeWidth={0.7} />
    <Path d="M2 -33 q-3 -2 -2 -5 M8 -33 q3 -2 2 -5" stroke="#E8602E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
  </G>
);

const LifeRing = () => (
  <G>
    <Path d="M0 -20 V-18" stroke={INK} strokeWidth={1.4} />
    <Circle cx={0} cy={-10} r={9.2} fill="none" stroke={INK} strokeWidth={6.6} />
    <Circle cx={0} cy={-10} r={9.2} fill="none" stroke="#fff" strokeWidth={5} />
    <Circle cx={0} cy={-10} r={9.2} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="7.2 7.2" />
    {/* the grab rope looped round it */}
    <Circle cx={0} cy={-10} r={10.8} fill="none" stroke="#D9B382" strokeWidth={1} strokeDasharray="2 1.4" />
    <Circle cx={0} cy={-20} r={1.4} fill={CHROME} stroke={INK} strokeWidth={0.6} />
  </G>
);

const Anchor = () => (
  <G>
    {/* the iron anchor: a ring, a shank, the crossbar (the stock), and two curved arms with flukes */}
    <Circle cx={0} cy={-25} r={2.6} fill="none" stroke={INK} strokeWidth={3.4} />
    <Circle cx={0} cy={-25} r={2.6} fill="none" stroke="#5A6672" strokeWidth={1.8} />
    <Path d="M0 -22 V-3 M-7.4 -18 H7.4" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
    <Path d="M-9 -8 Q-8 -1.4 0 -1.4 Q8 -1.4 9 -8" stroke={INK} strokeWidth={4.4} fill="none" strokeLinecap="round" />
    <Path d="M0 -22 V-3 M-7.4 -18 H7.4" stroke="#5A6672" strokeWidth={2.4} strokeLinecap="round" />
    <Path d="M-9 -8 Q-8 -1.4 0 -1.4 Q8 -1.4 9 -8" stroke="#5A6672" strokeWidth={2.4} fill="none" strokeLinecap="round" />
    <Path d="M-11 -7 L-9 -11 L-7 -7 Z M11 -7 L9 -11 L7 -7 Z" fill="#5A6672" {...L} />
    <Circle cx={-7.6} cy={-18} r={1.5} fill="#5A6672" stroke={INK} strokeWidth={0.6} />
    <Circle cx={7.6} cy={-18} r={1.5} fill="#5A6672" stroke={INK} strokeWidth={0.6} />
    <Path d="M0 -25 q6 4 3 9 q-5 3 -3 8" stroke="#D9B382" strokeWidth={1.6} fill="none" strokeDasharray="2.4 1.2" />
  </G>
);

const NetBuoys = () => {
  const top = Array.from({ length: 9 }, (_, i) => -22 + (44 * i) / 8);
  const bot = Array.from({ length: 9 }, (_, i) => -13 + (26 * i) / 8);
  return (
    <G>
      <Path d="M-23 0 H23" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M-23 0 H23" stroke="#D9B382" strokeWidth={1.3} strokeLinecap="round" strokeDasharray="2.6 1.2" />
      <Path d="M-22 1 L-13 31 Q0 38 13 31 L22 1 Z" fill="rgba(180,220,230,0.3)" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
      {top.map((x, i) => (
        <G key={i}>
          <Path d={`M${x} 1 L${bot[i]} ${30 + Math.sin((i / 8) * Math.PI) * 4}`} stroke={INK} strokeWidth={0.6} opacity={0.75} />
          {i < 8 && <Path d={`M${x} 1 L${bot[i + 1]} ${30 + Math.sin(((i + 1) / 8) * Math.PI) * 4}`} stroke={INK} strokeWidth={0.5} opacity={0.5} />}
        </G>
      ))}
      {[9, 17, 25].map((y, i) => (
        <Path key={y} d={`M${-21 + i * 2.6} ${y} Q0 ${y + 4} ${21 - i * 2.6} ${y}`} stroke={INK} strokeWidth={0.5} fill="none" opacity={0.6} />
      ))}
      {[
        [-17, 10],
        [-5, 33],
        [8, 28],
        [17, 12],
      ].map(([x, y]) => (
        <G key={x}>
          <Circle cx={x} cy={y} r={3.6} fill="#F08A2E" {...L} />
          <Path d={`M${x - 3.4} ${y - 0.4} H${x + 3.4}`} stroke="#fff" strokeWidth={1.2} />
          <Path d={`M${x - 2} ${y - 2.4} Q${x} ${y - 3.4} ${x + 1} ${y - 2.8}`} stroke="#fff" strokeWidth={0.7} opacity={0.7} fill="none" />
        </G>
      ))}
    </G>
  );
};

const Rowboat = () => (
  <G>
    {/* an upturned rowboat on two blocks: a crescent hull, planks, a keel line and a rope */}
    <Path d="M-22 -2 L-17 2 H17 L22 -2" stroke={INK} strokeWidth={0} fill="none" />
    <Rect x={-14} y={-4} width={4} height={6} fill={WOOD_DARK} {...L} />
    <Rect x={10} y={-4} width={4} height={6} fill={WOOD_DARK} {...L} />
    <Path d="M-22 -3 Q-18 -16 0 -16 Q18 -16 22 -3 Q0 -7.4 -22 -3 Z" fill={NAVY} {...L} />
    <Path d="M-22 -3 Q0 -7.4 22 -3 L21 -4.6 Q0 -8.6 -21 -4.6 Z" fill="#E8DCC0" stroke={INK} strokeWidth={0.7} />
    <Path d="M-14 -6 Q-12 -13 -8 -15 M-5 -6 Q-4 -13 -2 -15.6 M5 -6 Q4 -13 2 -15.6 M14 -6 Q12 -13 8 -15" stroke="#1B4067" strokeWidth={0.8} fill="none" />
    <Path d="M-6 -15.4 H6" stroke="#8A5A3A" strokeWidth={1.6} strokeLinecap="round" />
    <Path d="M-12 -12 Q-9 -14.4 -5 -14.8" stroke="#fff" strokeWidth={1} opacity={0.5} fill="none" strokeLinecap="round" />
  </G>
);

const LanternPost = () => (
  <G>
    <Rect x={-6.4} y={-3} width={8.8} height={4} rx={1} fill="#5A6672" {...L} />
    <Rect x={-3.6} y={-46} width={3.6} height={44} fill={WOOD_DARK} {...L} />
    <Path d="M-1.8 -45 H9 M-1.8 -39 L5 -45" stroke={INK} strokeWidth={3.2} strokeLinecap="round" fill="none" />
    <Path d="M-1.8 -45 H9 M-1.8 -39 L5 -45" stroke="#5A6672" strokeWidth={1.6} strokeLinecap="round" fill="none" />
    {/* the ship's lantern on its chain */}
    <Circle cx={9} cy={-34} r={11} fill="#FFD34D" opacity={0.25} />
    <Path d="M9 -45 V-41" stroke={INK} strokeWidth={0.9} />
    <Path d="M6 -40.6 H12 L11 -38 H7 Z" fill="#5A6672" {...L} />
    <Rect x={6.6} y={-38} width={4.8} height={9} rx={1.2} fill="#FFE08A" stroke={INK} strokeWidth={0.9} />
    <Rect x={7.6} y={-36} width={2.8} height={5} rx={1} fill="#FFB400" />
    <Path d="M6 -29 H12 L11 -27.4 H7 Z" fill="#5A6672" {...L} />
    <Path d="M9 -38 V-29" stroke={INK} strokeWidth={0.5} opacity={0.6} />
  </G>
);

const Helm = () => (
  <G>
    <Path d="M-5 0 L0 -6 L5 0 Z" fill="#5A6672" {...L} />
    <Rect x={-2} y={-8} width={4} height={4} fill="#5A6672" {...L} />
    {/* the spoked wheel: an outer rim, eight spokes ending in handles, a brass hub */}
    <G transform="translate(0 -17)">
      <Circle cx={0} cy={0} r={11} fill="none" stroke={INK} strokeWidth={4.4} />
      <Circle cx={0} cy={0} r={11} fill="none" stroke={WOOD} strokeWidth={2.8} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <G key={a} transform={`rotate(${a})`}>
          <Path d="M0 0 V-14" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <Path d="M0 0 V-14" stroke={WOOD_LIGHT} strokeWidth={1.5} strokeLinecap="round" />
          <Circle cx={0} cy={-14.4} r={1.5} fill={WOOD} stroke={INK} strokeWidth={0.6} />
        </G>
      ))}
      <Circle cx={0} cy={0} r={3.4} fill="#E3B52E" {...L} />
      <Circle cx={0} cy={0} r={1.2} fill={INK} />
    </G>
  </G>
);

const Mast = () => (
  <G>
    <Rect x={-4.4} y={-4} width={8.8} height={5} rx={1} fill={WOOD_DARK} {...L} />
    <Rect x={-1.4} y={-48} width={2.8} height={45} fill={WOOD} {...L} />
    <Path d="M-6 -40 H6" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    <Path d="M-6 -40 H6" stroke={WOOD_LIGHT} strokeWidth={1.4} strokeLinecap="round" />
    <Circle cx={0} cy={-49} r={1.8} fill={GOLD} stroke={INK} strokeWidth={0.6} />
    <Path d="M1.4 -47 L8 -45.6 L1.4 -44 Z" fill={RED} {...L} />
    {/* the string of signal flags, from the top down to the right */}
    <Path d="M0 -41 Q5 -33 10 -22" stroke={INK} strokeWidth={0.9} fill="none" />
    {[
      [2.4, -37.4, RED],
      [5.4, -33, '#F2C94C'],
      [8, -28.4, NAVY],
      [10, -23.4, CREAM],
    ].map(([x, y, c], i) => (
      <G key={i}>
        <Rect x={x as number} y={y as number} width={5} height={4.4} fill={c as string} {...L} />
        {i === 3 && (
          <Path d={`M${(x as number) + 0.6} ${(y as number) + 0.6} h2 v1.8 h-2 Z M${(x as number) + 2.6} ${(y as number) + 2.4} h2 v1.6 h-2 Z`} fill={RED} />
        )}
        {i === 2 && <Path d={`M${x as number} ${y as number} L${(x as number) + 5} ${(y as number) + 4.4}`} stroke="#fff" strokeWidth={1} />}
      </G>
    ))}
  </G>
);

const BarrelTable = () => (
  <G>
    <Path d="M-8 0 Q-10.6 -8 -8 -16 H8 Q10.6 -8 8 0 Z" fill={WOOD} {...L} />
    <Path d="M-9.6 -4.6 H9.6 M-9.6 -11.6 H9.6" stroke="#4A4F57" strokeWidth={1.8} />
    <Path d="M-3 -16 Q-3.6 -8 -3 0 M3 -16 Q3.6 -8 3 0" stroke={WOOD_DARK} strokeWidth={0.6} />
    <Ellipse cx={0} cy={-16} rx={10.6} ry={3} fill={WOOD_LIGHT} {...L} />
    <Path d="M-5 -16.4 Q0 -14.8 5 -16.4" stroke={WOOD_DARK} strokeWidth={0.5} fill="none" />
    {/* the tankard with a foam head */}
    <Rect x={-8} y={-23} width={5.6} height={7} rx={1} fill="#C9A04A" {...L} />
    <Path d="M-2.4 -21.6 Q0.4 -21.6 0.4 -19 Q0.4 -17.4 -2.4 -17.6" stroke={INK} strokeWidth={1} fill="none" />
    <Path d="M-8 -23 Q-7 -25.4 -5.4 -24.4 Q-4 -26 -2.6 -24 Q-2.4 -23 -2.4 -23 Z" fill="#fff" stroke={INK} strokeWidth={0.5} />
    {/* a small ship's lantern */}
    <Circle cx={5.4} cy={-22} r={6} fill="#FFD34D" opacity={0.25} />
    <Rect x={3.6} y={-24} width={3.6} height={6} rx={0.8} fill="#FFE08A" stroke={INK} strokeWidth={0.7} />
    <Path d="M3 -24 H7.8 L6.8 -25.6 H4 Z" fill="#5A6672" stroke={INK} strokeWidth={0.5} />
  </G>
);

// ---------- the dispatch ----------

const DRAW: Readonly<Record<string, () => ReactElement>> = {
  espresso: Espresso,
  'wine-rack': WineRack,
  chalkboard: Chalkboard,
  'pendant-lamps': PendantLamps,
  vespa: Vespa,
  'herb-box': HerbBox,
  chandelier: Chandelier,
  medallion: Medallion,
  bust: Bust,
  jukebox: Jukebox,
  stools: Stools,
  'pie-case': PieCase,
  booth: Booth,
  gumball: Gumball,
  cadillac: Cadillac,
  'trophy-case': TrophyCase,
  'popcorn-cart': PopcornCart,
  crates: Crates,
  'life-ring': LifeRing,
  anchor: Anchor,
  'net-buoys': NetBuoys,
  rowboat: Rowboat,
  'lantern-post': LanternPost,
  helm: Helm,
  mast: Mast,
  'barrel-table': BarrelTable,
};

/** One decor prop at its own origin (renovation-art.ts `DEFS` has the box it stays inside). `w` is the pennants' span. */
export const RenoDecor = memo(function RenoDecor({ thing, w = 0 }: { thing: string; w?: number }) {
  if (thing === 'pennants') return <Pennants w={w} />;
  const Draw = DRAW[thing];
  return Draw ? <Draw /> : null;
});

/** The things that have a drawing (the budget checks every `DEFS` entry has one). */
export const DRAWN_THINGS: readonly string[] = [...Object.keys(DRAW), 'pennants'];

// ---------- the fixtures that are pieces of their own ----------

/**
 * Downtown's oven arch: a brick arch of voussoirs with a keystone round the dome oven's mouth. `cx` is the mouth's middle, `top` and `bottom` its arch springing and its sill,
 * `w` its width (geometry.ts `domeGeom`). Drawn as a thick stroke along the arch, so the mouth and its flame stay open.
 */
export const OvenArch = memo(function OvenArch({ cx, top, bottom, w }: { cx: number; top: number; bottom: number; w: number }) {
  const r = w / 2 + 2.4;
  const y0 = top + r - 2;
  const d = `M${cx - r} ${bottom} V${y0} A${r} ${r} 0 0 1 ${cx + r} ${y0} V${bottom}`;
  return (
    <G>
      <Path d={d} stroke={INK} strokeWidth={8.4} fill="none" strokeLinejoin="round" />
      <Path d={d} stroke={BRICK} strokeWidth={6} fill="none" strokeLinejoin="round" />
      <Path d={d} stroke="#7A3520" strokeWidth={6} fill="none" strokeDasharray="1.1 3.7" />
      {/* the keystone: taller than the other stones, in pale limestone */}
      <Path d={`M${cx - 3.6} ${y0 - r - 3.6} H${cx + 3.6} L${cx + 2.6} ${y0 - r + 3.6} H${cx - 2.6} Z`} fill="#F1E3C4" {...L} />
      <Path d={`M${cx - 2} ${y0 - r - 1.6} H${cx + 2}`} stroke="#fff" strokeWidth={0.8} opacity={0.7} />
    </G>
  );
});

/**
 * The Suburbs' counter apron: a chrome band along the front panel's top edge and a checkerboard apron at its foot (screen x from `x0` to `x1`; `bandY` the band's centre, `footY` the
 * foot of the panel). Over the counter's front, under the people at it.
 */
export const ChromeCounter = memo(function ChromeCounter({ x0, x1, bandY, footY }: { x0: number; x1: number; bandY: number; footY: number }) {
  const w = x1 - x0;
  const n = Math.max(4, Math.round(w / 5));
  const cw = w / n;
  return (
    <G>
      <Rect x={x0 - 1} y={bandY - 2.6} width={w + 2} height={5.2} rx={2.6} fill={CHROME} {...L} />
      <Path d={`M${x0 + 2} ${bandY - 1.2} H${x1 - 2}`} stroke="#fff" strokeWidth={1} opacity={0.85} />
      {[x0 + 3, x1 - 3].map((x) => (
        <Circle key={x} cx={x} cy={bandY + 0.4} r={0.9} fill={CHROME_DARK} />
      ))}
      <Rect x={x0} y={footY - 9} width={w} height={9} fill="#fff" stroke={INK} strokeWidth={0.9} />
      {Array.from({ length: n * 2 }).map((_, i) => {
        const col = Math.floor(i / 2);
        const row = i % 2;
        return (col + row) % 2 === 0 ? <Rect key={i} x={x0 + col * cw} y={footY - 9 + row * 4.5} width={cw} height={4.5} fill="#2A2F36" /> : null;
      })}
      <Rect x={x0} y={footY - 9} width={w} height={9} fill="none" stroke={INK} strokeWidth={0.9} />
    </G>
  );
});

/** The Suburbs' neon OPEN in a rounded glow, 40 x 18 (the origin is its centre), for the shop window; the word is 10 pt. */
export const NeonOpen = memo(function NeonOpen() {
  return (
    <G>
      <Rect x={-23} y={-12} width={46} height={24} rx={10} fill={PINK} opacity={0.26} />
      <Rect x={-20} y={-9} width={40} height={18} rx={6} fill="#1E1630" stroke={PINK} strokeWidth={1.8} />
      <Rect x={-18} y={-7} width={36} height={14} rx={4.4} fill="none" stroke="#6FE8FF" strokeWidth={0.9} />
      <SvgText x={0} y={3.6} fontFamily={F.bold} fontSize={10} fill={PINK} stroke={PINK} strokeWidth={2} opacity={0.4} textAnchor="middle" letterSpacing={1}>
        OPEN
      </SvgText>
      <SvgText x={0} y={3.6} fontFamily={F.bold} fontSize={10} fill="#FFE3EE" textAnchor="middle" letterSpacing={1}>
        OPEN
      </SvgText>
    </G>
  );
});

/**
 * The Waterfront's plank deck: weathered boards across the whole floor (room x `x0` to `x1`, depth 0 to 104 (the ovens' feet)), a dark gap between boards and a nail at each end and at the middle of
 * every board. Drawn over the floor and under everything that stands on it.
 */
export const PlankDeck = memo(function PlankDeck({ x0, x1 }: { x0: number; x1: number }) {
  const tones = ['#B58A5E', '#A47A52', '#BE9568', '#9C7249'];
  const boards: number[] = [];
  for (let y = 0; y < 104; y += 8) boards.push(y);
  return (
    <G>
      <Polygon points={pts([P(x0, 0), P(x1, 0), P(x1, 104), P(x0, 104)])} fill="#4A3426" />
      {boards.map((y, i) => (
        <G key={y}>
          <Polygon points={pts([P(x0, y + 0.5), P(x1, y + 0.5), P(x1, y + 7.5), P(x0, y + 7.5)])} fill={tones[i % tones.length]} />
          <Polygon points={pts([P(x0, y + 6), P(x1, y + 6), P(x1, y + 7.5), P(x0, y + 7.5)])} fill="#000" opacity={0.12} />
          {[x0 + 6, (x0 + x1) / 2 + (i % 2 ? 14 : -14), x1 - 6].map((nx) => {
            const [px, py] = P(nx, y + 3.8);
            return <Circle key={nx} cx={px} cy={py} r={0.8} fill="#3B2A1E" />;
          })}
          {/* a seam across the board where two planks meet, staggered from row to row */}
          {(() => {
            const sx = x0 + ((i * 53) % (x1 - x0 - 40)) + 20;
            const [a, ay] = P(sx, y + 0.5);
            const [, by] = P(sx, y + 7.5);
            return <Path d={`M${a} ${ay} L${a} ${by}`} stroke="#4A3426" strokeWidth={0.9} />;
          })()}
        </G>
      ))}
    </G>
  );
});

/** The Waterfront's rope-and-post railing along the front, screen x from `x0` to `x1`, its feet at `y`: a post every ~36, a sagging rope between. */
export const RopeRail = memo(function RopeRail({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  const n = Math.max(2, Math.round((x1 - x0) / 36));
  const gap = (x1 - x0) / n;
  const top = y - 14;
  return (
    <G>
      {Array.from({ length: n }).map((_, i) => {
        const a = x0 + i * gap + 3;
        const b = x0 + (i + 1) * gap - 3;
        return (
          <G key={i}>
            <Path d={`M${a} ${top + 2} Q${(a + b) / 2} ${top + 9} ${b} ${top + 2}`} stroke={INK} strokeWidth={3.2} fill="none" strokeLinecap="round" />
            <Path
              d={`M${a} ${top + 2} Q${(a + b) / 2} ${top + 9} ${b} ${top + 2}`}
              stroke="#E8CFA0"
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="2.6 1.2"
            />
          </G>
        );
      })}
      {Array.from({ length: n + 1 }).map((_, i) => {
        const x = x0 + i * gap;
        return (
          <G key={i}>
            <Rect x={x - 1.8} y={top} width={3.6} height={14} fill={WOOD} {...L} />
            <Circle cx={x} cy={top - 0.6} r={2.6} fill={WOOD_LIGHT} {...L} />
            <Path d={`M${x - 1} ${top + 2} V${y - 1}`} stroke="#fff" strokeWidth={0.6} opacity={0.35} />
          </G>
        );
      })}
    </G>
  );
});

/**
 * The Waterfront's lighthouse turret on the roof: a banded tower, a gallery rail, the lamp and a cap. The origin is the tower's foot, 22 wide and 52 tall, and the beam sweeps out of the
 * lamp (`dir` 1 to the right, -1 to the left, 150 long, translucent).
 */
export const Beacon = memo(function Beacon({ dir }: { dir: number }) {
  return (
    <G>
      <Path d={`M0 -46 L${dir * 150} -66 L${dir * 150} -26 Z`} fill="#FFF0A8" opacity={0.3} />
      <Path d={`M0 -46 L${dir * 90} -56 L${dir * 90} -36 Z`} fill="#FFF8D0" opacity={0.35} />
      <Path d="M-8 0 L-6 -30 H6 L8 0 Z" fill="#F4F1E8" {...L} />
      <Path d="M-7.4 -8 H7.4 L7 -14 H-7 Z M-6.6 -22 H6.6 L6.2 -28 H-6.2 Z" fill={RED} stroke={INK} strokeWidth={0.8} />
      <Rect x={-9} y={-33} width={18} height={3.6} rx={1} fill="#4A4F57" {...L} />
      <Path d="M-8 -33 V-37 M-4 -33 V-37 M0 -33 V-37 M4 -33 V-37 M8 -33 V-37" stroke={INK} strokeWidth={0.8} />
      <Rect x={-5.6} y={-46} width={11.2} height={10} rx={1.4} fill="#FFE08A" stroke={INK} strokeWidth={1} />
      <Circle cx={0} cy={-41} r={2.8} fill="#FFFBE0" stroke="#E0B000" strokeWidth={0.8} />
      <Path d="M-5.6 -41 H5.6 M0 -46 V-36" stroke={INK} strokeWidth={0.6} />
      <Path d="M-7 -46 L0 -53 L7 -46 Z" fill={RED} {...L} />
      <Circle cx={0} cy={-54} r={1.4} fill={GOLD} stroke={INK} strokeWidth={0.5} />
    </G>
  );
});

/**
 * The Suburbs' roof pylon: a tall pole with an arrow-shaped panel that points down at the shop and a starburst on top. The origin is the pole's foot; it is 26 wide and 74 tall.
 */
export const RoofPylon = memo(function RoofPylon() {
  const rays = Array.from({ length: 12 }).map((_, i) => {
    const a = (i * Math.PI) / 6;
    const r = i % 2 ? 7 : 13;
    return `${i === 0 ? 'M' : 'L'}${(Math.sin(a) * r).toFixed(1)} ${(-Math.cos(a) * r).toFixed(1)}`;
  });
  return (
    <G>
      <Rect x={-2} y={-58} width={4} height={58} fill={CHROME} {...L} />
      <Path d="M-11 -56 H11 V-30 L0 -18 L-11 -30 Z" fill="#E0457B" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M-8 -53 H8 V-31 L0 -22 L-8 -31 Z" fill="none" stroke="#FFE3EE" strokeWidth={1.2} strokeLinejoin="round" />
      {[-46, -39, -32].map((y) => (
        <Circle key={y} cx={0} cy={y} r={2.2} fill="#FFE08A" stroke={INK} strokeWidth={0.6} />
      ))}
      <G transform="translate(0 -64)">
        <Path d={`${rays.join(' ')} Z`} fill={GOLD} stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
        <Circle cx={0} cy={0} r={4.4} fill={RED} stroke={INK} strokeWidth={0.8} />
      </G>
    </G>
  );
});
