// Draws the visual-ladder props that ladder.ts places (v5.11, D2). Same house style as props.tsx: INK outlines
// (1.1 / 0.9 pt), light from the upper left (highlight on the left and top, shade on the right), the scene palette.
// Every piece is memoised on primitives (anchor, scale, one extra number); the drawing's origin is its bottom centre.
import { memo } from 'react';
import { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { F } from '../../theme';
import { INK } from './projection';
import { ParkedVehicle } from './street';
import type { PropId } from './ladder';

const STEEL = '#AEB4BB';
const STEEL_HI = '#DDE2E7';
const STEEL_DK = '#8F979F';
const WOOD = '#9A6A44';
const WOOD_DK = '#6B4330';
const CREAM = '#F6E7C1';
const TOMATO = '#D9443A';
const BASIL = '#3F9A48';

/** A soft floor shadow under a standing prop. */
const Shadow = ({ rx }: { rx: number }) => <Ellipse cx={0} cy={0.5} rx={rx} ry={rx * 0.22} fill="rgba(59,31,20,0.22)" />;

// ---------- prep ----------

/** A second rolling pin lying across the bench's front edge. */
const Pin2 = () => (
  <G>
    <Rect x={-9} y={-3.4} width={18} height={3.4} rx={1.7} fill="#D9AE7B" stroke={INK} strokeWidth={0.8} />
    <Rect x={-12} y={-2.6} width={3.4} height={1.8} rx={0.9} fill="#8E5A3C" stroke={INK} strokeWidth={0.6} />
    <Rect x={8.6} y={-2.6} width={3.4} height={1.8} rx={0.9} fill="#8E5A3C" stroke={INK} strokeWidth={0.6} />
    <Rect x={-7} y={-3} width={11} height={0.9} rx={0.45} fill="#fff" opacity={0.45} />
  </G>
);

const sack = (cx: number, base: number, w: number, h: number) =>
  `M${cx - w / 2} ${base} Q${cx - w / 2 - 1} ${base - h * 0.6} ${cx - w / 2 + 1.5} ${base - h} L${cx + w / 2 - 1.5} ${base - h} Q${cx + w / 2 + 1} ${base - h * 0.6} ${cx + w / 2} ${base} Z`;

/** Flour sacks stacked two and one. */
const Sacks = () => (
  <G>
    <Shadow rx={12} />
    {[[-5.4, 0], [5.4, 0], [0, -10.5]].map(([cx, b], i) => (
      <G key={i}>
        <Path d={sack(cx, b, 10.6, 11)} fill="#F3ECE2" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
        <Path d={`M${cx - 3.6} ${b - 11} q3.6 -2.4 7.2 0`} fill="none" stroke={INK} strokeWidth={0.8} />
        <Rect x={cx - 3.8} y={b - 7.2} width={7.6} height={3.2} fill={TOMATO} opacity={0.9} />
        <Path d={`M${cx - 4} ${b - 1.5} v-8`} stroke="#fff" strokeWidth={1.1} opacity={0.6} strokeLinecap="round" />
      </G>
    ))}
  </G>
);

/** A dough sheeter: cabinet, canvas belt, roller column and a hand wheel. */
const Sheeter = () => (
  <G>
    <Shadow rx={15} />
    <Rect x={-12} y={-9} width={24} height={9} rx={1} fill={STEEL_DK} stroke={INK} strokeWidth={1.1} />
    <Rect x={-11} y={-8.4} width={22} height={1.6} fill="#fff" opacity={0.3} />
    <Rect x={-14} y={-13} width={28} height={4} rx={2} fill="#E9DCC8" stroke={INK} strokeWidth={0.9} />
    <Ellipse cx={-7} cy={-14} rx={5} ry={1.3} fill="#FBEFD6" stroke={INK} strokeWidth={0.6} />
    <Rect x={-3.5} y={-22} width={8} height={11} rx={1.5} fill={STEEL} stroke={INK} strokeWidth={1} />
    <Rect x={-2.6} y={-21.2} width={2} height={9.4} rx={1} fill="#fff" opacity={0.45} />
    <Rect x={-5} y={-16} width={11} height={3} rx={1.5} fill={STEEL_HI} stroke={INK} strokeWidth={0.8} />
    <Circle cx={9} cy={-17} r={3} fill={TOMATO} stroke={INK} strokeWidth={0.9} />
    <Path d="M9 -17 L11 -19" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
  </G>
);

/** A floor-standing spiral mixer: pedestal, column, red head, steel bowl and hook. */
const Mixer = () => (
  <G>
    <Shadow rx={11} />
    <Rect x={-7} y={-5} width={14} height={5} rx={1} fill="#4A4F57" stroke={INK} strokeWidth={1} />
    <Rect x={-3} y={-24} width={6} height={19} fill={TOMATO} stroke={INK} strokeWidth={1} />
    <Rect x={-2.2} y={-23} width={1.8} height={17} fill="#F26B5E" opacity={0.8} />
    <Rect x={-10} y={-31} width={20} height={8} rx={3} fill={TOMATO} stroke={INK} strokeWidth={1.1} />
    <Rect x={-8} y={-30} width={8} height={1.6} rx={0.8} fill="#fff" opacity={0.4} />
    <Path d="M-9 -17 Q-9 -6 0 -6 Q9 -6 9 -17 Z" fill="#AEB6BE" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
    <Path d="M-6.4 -15 Q-6.4 -8.6 -2 -7.6" stroke="#fff" strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.7} />
    <Path d="M0 -23 V-14 Q3 -12 0 -10" stroke="#7C858E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
  </G>
);

const BINS = ['#C8463A', '#4FA048', '#3A3A3A', '#E7D5BF', '#B58AC9', '#FFD76A'];
/** A topping rail on the back wall: a steel splashback over six bins (pepperoni, pepper, olives, mushroom, onion, cheese). */
const Toppings = () => (
  <G>
    <Rect x={-26} y={-14} width={52} height={4} rx={1} fill={STEEL} stroke={INK} strokeWidth={0.9} />
    <Rect x={-25} y={-13.4} width={50} height={1.2} fill="#fff" opacity={0.4} />
    <Rect x={-26} y={-3} width={52} height={3} rx={1} fill={STEEL_DK} stroke={INK} strokeWidth={0.9} />
    {BINS.map((c, i) => (
      <G key={c}>
        <Rect x={-24.6 + i * 8.2} y={-10} width={7.4} height={7.4} rx={1} fill={STEEL_HI} stroke={INK} strokeWidth={0.7} />
        <Rect x={-23.4 + i * 8.2} y={-9.2} width={5} height={3} rx={1.2} fill={c} />
        <Circle cx={-21.9 + i * 8.2} cy={-8.4} r={0.7} fill="#fff" opacity={0.55} />
      </G>
    ))}
  </G>
);

/** A wall-mounted belt with chevrons, dough discs riding it toward the ovens (`n` = half its length). */
const Belt = ({ n, discs, tone }: { n: number; discs: boolean; tone: string }) => {
  const chev = Math.max(2, Math.floor((2 * n - 10) / 12));
  return (
    <G>
      <Rect x={-n} y={-6} width={2 * n} height={5} rx={2.5} fill="#4A4F57" stroke={INK} strokeWidth={0.9} />
      <Rect x={-n + 3} y={-5.6} width={2 * n - 6} height={1} rx={0.5} fill="#fff" opacity={0.22} />
      {Array.from({ length: chev }).map((_, i) => (
        <Path key={i} d={`M${-n + 8 + i * 12} -5 l2.6 1.6 l-2.6 1.6`} stroke={tone} strokeWidth={1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <Circle cx={-n + 2.5} cy={-3.5} r={2.2} fill={STEEL} stroke={INK} strokeWidth={0.7} />
      <Circle cx={n - 2.5} cy={-3.5} r={2.2} fill={STEEL} stroke={INK} strokeWidth={0.7} />
      {discs &&
        [0.3, 0.62].map((f) => (
          <Ellipse key={f} cx={-n + 2 * n * f} cy={-6.8} rx={4} ry={1.6} fill="#FBEFD6" stroke={INK} strokeWidth={0.7} />
        ))}
      {!discs &&
        [0.3, 0.64].map((f) => (
          <G key={f}>
            <Ellipse cx={-n + 2 * n * f} cy={-6.8} rx={4} ry={1.6} fill="#E9A64B" stroke={INK} strokeWidth={0.7} />
            <Ellipse cx={-n + 2 * n * f} cy={-7.2} rx={2.8} ry={1} fill="#FFC531" />
          </G>
        ))}
    </G>
  );
};

// ---------- counter ----------

/** Three pizza boxes stacked a little crooked. */
const BoxStack = () => (
  <G transform="scale(0.92)">
    {[0, 1, 2].map((i) => {
      const dx = (i - 1) * 0.8;
      const b = -i * 5.2;
      return (
        <G key={i}>
          <Path d={`M${-8 + dx} ${b} H${8 + dx} V${b - 4.6} H${-8 + dx} Z`} fill={CREAM} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
          <Path d={`M${-8 + dx} ${b - 4.6} L${-6 + dx} ${b - 6.2} L${10 + dx} ${b - 6.2} L${8 + dx} ${b - 4.6} Z`} fill="#FFF6E5" stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
          <Path d={`M${-8 + dx} ${b - 2.4} H${8 + dx}`} stroke={TOMATO} strokeWidth={1.1} />
          <Rect x={-8 + dx + 1} y={b - 4} width={3} height={1} rx={0.5} fill="#fff" opacity={0.6} />
        </G>
      );
    })}
  </G>
);

/** A heated pizza shelf on the wall: steel frame, glowing lamp strip and two pies. */
const Warmer = () => (
  <G transform="scale(0.9)">
    <Rect x={-10} y={-15} width={20} height={14} rx={1.5} fill="#2F3B33" stroke={INK} strokeWidth={1} />
    <Rect x={-9} y={-14} width={18} height={2.4} rx={1} fill="#FFB347" opacity={0.95} />
    <Rect x={-9} y={-14} width={18} height={1} fill="#FFE08A" />
    <Rect x={-9} y={-11.4} width={18} height={9} fill="#FFB347" opacity={0.16} />
    {[-4.2, 4.2].map((cx) => (
      <G key={cx}>
        <Ellipse cx={cx} cy={-4.6} rx={4.2} ry={1.6} fill="#E9A64B" stroke={INK} strokeWidth={0.7} />
        <Ellipse cx={cx} cy={-5} rx={3} ry={1} fill="#FFC531" />
        <Circle cx={cx - 1} cy={-5.1} r={0.6} fill="#E8432E" />
        <Circle cx={cx + 1.2} cy={-4.9} r={0.6} fill="#E8432E" />
      </G>
    ))}
    <Rect x={-10} y={-2.6} width={20} height={2.6} rx={1} fill={STEEL} stroke={INK} strokeWidth={0.9} />
  </G>
);

/** A ticket rail with order slips hanging from clips. */
const Tickets = () => (
  <G transform="scale(0.9)">
    <Rect x={-9.5} y={-12} width={19} height={2.4} rx={1.2} fill={STEEL} stroke={INK} strokeWidth={0.9} />
    <Rect x={-8.5} y={-11.6} width={17} height={0.8} fill="#fff" opacity={0.45} />
    {[-6.8, -2.3, 2.2, 6.7].map((x, i) => (
      <G key={x} transform={`rotate(${(i % 2 ? 1 : -1) * 3} ${x} -10)`}>
        <Rect x={x - 1.9} y={-10} width={3.8} height={8 + (i % 3)} fill="#FFFDF4" stroke={INK} strokeWidth={0.7} />
        <Path d={`M${x - 1} -8 h2 M${x - 1} -6 h1.4 M${x - 1} -4 h2`} stroke={i % 2 ? TOMATO : INK} strokeWidth={0.6} />
      </G>
    ))}
  </G>
);

/** An order screen on a wall bracket: green ticket lines on a dark monitor. */
const OrderScreen = () => (
  <G transform="scale(0.9)">
    <Rect x={-9} y={-15} width={18} height={11.4} rx={1.6} fill="#2B2F35" stroke={INK} strokeWidth={0.9} />
    <Rect x={-7.6} y={-13.6} width={15.2} height={8.4} rx={1} fill="#7FE0A0" />
    {[0, 1, 2].map((i) => (
      <G key={i}>
        <Rect x={-6.4} y={-12.4 + i * 2.6} width={2.4} height={1.5} rx={0.4} fill={i === 0 ? TOMATO : '#1E6B3A'} />
        <Rect x={-3} y={-12.2 + i * 2.6} width={6 + (i % 2) * 2} height={1} rx={0.5} fill="#1E6B3A" />
      </G>
    ))}
    <Rect x={-7.6} y={-13.6} width={6} height={1.6} rx={0.8} fill="#fff" opacity={0.3} />
    <Rect x={-1.6} y={-3.6} width={3.2} height={2.6} fill="#4A4F57" stroke={INK} strokeWidth={0.7} />
    <Rect x={-5} y={-1.2} width={10} height={1.6} rx={0.8} fill="#4A4F57" stroke={INK} strokeWidth={0.7} />
  </G>
);

/** The second register: the same terminal as the first, in the shop's red. */
const Register2 = () => (
  <G>
    <Path d="M-11 0 L11 0 L9 -9 L-9 -9 Z" fill="#B23A48" stroke={INK} strokeWidth={1} />
    <Rect x={-10} y={-3} width={20} height={3} fill="#7E2A34" />
    <Rect x={-2} y={-2.4} width={4} height={1.2} rx={0.6} fill="#C9C3BA" />
    {[-6, -2, 2, 6].map((dx) => [-7, -5].map((dy) => <Rect key={`${dx}${dy}`} x={dx - 1.2} y={dy} width={2.4} height={1.2} rx={0.4} fill="#E9E4DC" />))}
    <Rect x={-2} y={-17} width={4} height={8} fill="#4A4F57" stroke={INK} strokeWidth={0.8} />
    <Rect x={-8} y={-22} width={16} height={7} rx={1.5} fill="#2B2F35" stroke={INK} strokeWidth={0.9} />
    <Rect x={-6.5} y={-20.8} width={13} height={4.6} rx={1} fill="#FFD76A" />
    <Path d="M-4.5 -18 h4 M1 -18 h3" stroke="#8C6A20" strokeWidth={1} />
  </G>
);

/** The neon "ORDER HERE" sign: dark backing, a glowing border and a soft halo. */
const Neon = () => (
  <G>
    <Rect x={-19} y={-12} width={38} height={13} rx={4} fill="#1E1630" stroke={INK} strokeWidth={1.1} />
    <Rect x={-17} y={-10} width={34} height={9} rx={3} fill="none" stroke="#FF8FB8" strokeWidth={0.9} opacity={0.9} />
    <SvgText x={0} y={-3.6} fontFamily={F.bold} fontSize={5.4} fill="#FF8FB8" stroke="#FF8FB8" strokeWidth={1.6} opacity={0.35} textAnchor="middle">
      ORDER HERE
    </SvgText>
    <SvgText x={0} y={-3.6} fontFamily={F.bold} fontSize={5.4} fill="#FFE3EE" textAnchor="middle">
      ORDER HERE
    </SvgText>
  </G>
);

// ---------- drivers ----------

const PIN_COLORS = [TOMATO, BASIL, '#FFC531', '#2D9CDB'];
/** The dispatch board: corkboard with a red header and one pin per driver (`n`, up to 12). */
const Board = ({ n }: { n: number }) => (
  <G>
    <Rect x={-11} y={-23} width={22} height={22} rx={2} fill="#C99A6B" stroke="#8E5A3C" strokeWidth={1.6} />
    <Rect x={-11} y={-23} width={22} height={5} rx={2} fill={TOMATO} stroke={INK} strokeWidth={0.9} />
    <Path d="M-8 -20.4 h9" stroke="#fff" strokeWidth={0.9} strokeLinecap="round" opacity={0.85} />
    <Path d="M-8 -9 Q-3 -13 0 -9 T8 -11" stroke="#8E5A3C" strokeWidth={0.7} fill="none" opacity={0.6} />
    <Rect x={-9.6} y={-17} width={5} height={1} fill="#fff" opacity={0.3} />
    {Array.from({ length: n }).map((_, i) => (
      <Circle key={i} cx={-8.5 + (i % 6) * 3.4} cy={-14 + Math.floor(i / 6) * 5} r={1.3} fill={PIN_COLORS[i % 4]} stroke={INK} strokeWidth={0.4} />
    ))}
  </G>
);

const JACKETS = [TOMATO, '#3B4A6B', BASIL];
/** A coat-hook rail with three uniform jackets. */
const Hooks = () => (
  <G>
    <Rect x={-17} y={-26} width={34} height={3} rx={1.5} fill="#5E3A26" stroke={INK} strokeWidth={0.9} />
    <Rect x={-16} y={-25.6} width={32} height={0.9} fill="#fff" opacity={0.25} />
    {JACKETS.map((c, i) => {
      const x = -11 + i * 11;
      return (
        <G key={c}>
          <Circle cx={x} cy={-22} r={1} fill={STEEL} stroke={INK} strokeWidth={0.5} />
          <Path d={`M${x - 3.4} -22 L${x + 3.4} -22 L${x + 6} -18.6 L${x + 5.2} -2.6 L${x - 5.2} -2.6 L${x - 6} -18.6 Z`} fill={c} stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
          <Path d={`M${x - 3.4} -22 L${x} -17.6 L${x + 3.4} -22`} fill="#FFF4E0" stroke={INK} strokeWidth={0.6} strokeLinejoin="round" />
          <Path d={`M${x} -17.6 V-2.8`} stroke={INK} strokeWidth={0.6} opacity={0.6} />
          <Rect x={x - 4.4} y={-20} width={1.4} height={9} rx={0.7} fill="#fff" opacity={0.28} />
        </G>
      );
    })}
  </G>
);

/** "DRIVER OF THE MONTH": a gold frame around a smiling portrait and a star. */
const Photo = () => (
  <G>
    <Rect x={-6.5} y={-18.5} width={13} height={18} rx={1} fill="#D4AF37" stroke={INK} strokeWidth={0.9} />
    <Rect x={-4.8} y={-16.8} width={9.6} height={10.6} fill="#BFE3F5" />
    <Circle cx={0} cy={-12.6} r={2.4} fill="#F2C9A0" stroke={INK} strokeWidth={0.5} />
    <Path d="M-4.2 -6.2 Q-4 -9.6 0 -9.6 Q4 -9.6 4.2 -6.2 Z" fill={TOMATO} stroke={INK} strokeWidth={0.5} />
    <Path d="M0 -19.6 l1 2 l2.2 .3 l-1.6 1.5 l.4 2.2 l-2 -1.1 l-2 1.1 l.4 -2.2 l-1.6 -1.5 l2.2 -.3 Z" fill="#FFD54A" stroke={INK} strokeWidth={0.5} strokeLinejoin="round" />
    <Rect x={-4.8} y={-4.8} width={9.6} height={3} rx={0.6} fill="#2B2F35" />
    <Path d="M-3.4 -3.9 h6.8 M-2.4 -2.8 h4.8" stroke="#FFD76A" strokeWidth={0.5} />
  </G>
);

/**
 * ROSA'S wrap on the parked vehicle: a checked tomato-and-cream band along the body, drawn over the vehicle in its own
 * coordinates (street.tsx `ParkedVehicle`). The bike gets a delivery bag, the scooter a band on its body, the drone a stripe.
 */
const Wrap = ({ v }: { v: number }) => {
  if (v >= 2 && v <= 3) {
    const van = v === 3;
    const len = van ? 74 : 56;
    const y = van ? -9 : -12;
    return (
      <G transform={`translate(0 2) scale(0.62) translate(${-len / 2} 0)`}>
        <Rect x={2} y={y - 5} width={len - 4} height={5} fill="#FFF4E0" stroke={INK} strokeWidth={1} />
        {Array.from({ length: Math.floor((len - 4) / 6) }).map((_, i) => (
          <Rect key={i} x={2 + i * 6 + (i % 2 ? 0 : 3)} y={y - 5 + (i % 2 ? 2.5 : 0)} width={3} height={2.5} fill={TOMATO} />
        ))}
        {!van && (
          <SvgText x={len / 2} y={y - 12} fontFamily={F.bold} fontSize={8} fill="#FFF4E0" textAnchor="middle">
            ROSA’S
          </SvgText>
        )}
      </G>
    );
  }
  if (v === 4) {
    return (
      <G transform="translate(0 -18)">
        <Rect x={-10} y={-2} width={20} height={3} fill="#FFF4E0" stroke={INK} strokeWidth={0.8} />
        {[-8, -2, 4].map((x) => <Rect key={x} x={x} y={-2} width={3} height={1.5} fill={TOMATO} />)}
      </G>
    );
  }
  if (v === 0) {
    return (
      <G>
        <Rect x={-23} y={-23} width={11} height={9} rx={1.5} fill={TOMATO} stroke={INK} strokeWidth={0.9} />
        <Rect x={-23} y={-20} width={11} height={2.4} fill="#FFF4E0" />
        <Path d="M-20 -14 L-17 -7" stroke={INK} strokeWidth={1.1} />
      </G>
    );
  }
  return (
    <G>
      <Rect x={-16} y={-14} width={26} height={3.4} fill="#FFF4E0" stroke={INK} strokeWidth={0.8} />
      {[-14, -8, -2, 4].map((x) => <Rect key={x} x={x} y={-14} width={3} height={1.7} fill={TOMATO} />)}
    </G>
  );
};

export interface LadderPieceProps {
  id: PropId;
  ax: number;
  ay: number;
  k: number;
  /** Pins on the board; a belt's half-length. */
  n: number;
  /** City fleet tier, for the vehicle props. */
  v: number;
}

/** One ladder prop at its screen anchor. */
export const LadderPiece = memo(function LadderPiece({ id, ax, ay, k, n, v }: LadderPieceProps) {
  if (id === 'vehicle2') {
    return (
      <G opacity={1}>
        <ParkedVehicle x={ax} y={ay} v={v} />
      </G>
    );
  }
  if (id === 'wrap') {
    return (
      <G transform={`translate(${ax} ${ay})`}>
        <Wrap v={v} />
      </G>
    );
  }
  return (
    <G transform={`translate(${ax} ${ay}) scale(${k})`}>
      {id === 'pin2' && <Pin2 />}
      {id === 'sacks' && <Sacks />}
      {id === 'sheeter' && <Sheeter />}
      {id === 'mixer' && <Mixer />}
      {id === 'toppings' && <Toppings />}
      {id === 'prepBelt' && <Belt n={n} discs tone="#FFC531" />}
      {id === 'passBelt' && <Belt n={n} discs={false} tone="#7FE0A0" />}
      {id === 'boxStack' && <BoxStack />}
      {id === 'warmer' && <Warmer />}
      {id === 'tickets' && <Tickets />}
      {id === 'screen' && <OrderScreen />}
      {id === 'register2' && <Register2 />}
      {id === 'neon' && <Neon />}
      {id === 'board' && <Board n={n} />}
      {id === 'hooks' && <Hooks />}
      {id === 'photo' && <Photo />}
    </G>
  );
});
