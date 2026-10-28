// Side-view cutaway of one pizzeria, laid out left to right:
//   Prep table | Ovens on the back wall | Counter | Dining room with tables | Front door
// Cooks, bakers (one per oven), counter staff, drivers and walk-ins animate at speeds driven by the
// shop's real rates. The room widens and gets fancier as the footprint grows.
import { memo, useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { FOOTPRINTS, OVEN_GRADES, TUNING, VEHICLES } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';
import { emitPayout } from './pulse-bus';

const INK = '#3B1F14';
const VW = 200;
const VH = 120;
const FLOOR_Y = 86;
const ROOM_W = [124, 140, 158, 178, 196];
const OVEN_W = 14;
const OVEN_GAP = 2;

export const CUTAWAY_SKY = '#CFE6F7';

interface Layout {
  L: number;
  R: number;
  prep: { x0: number; x1: number };
  ovens: number[];
  ovenW: number;
  counter: { x0: number; x1: number };
  dining: { x0: number; x1: number };
  door: number;
  tables: { x: number; y: number }[];
}

/**
 * Where everything sits. The dining room always gets at least 30% of the room (critic G28);
 * ovens shrink to share what's left, and only as many tables are drawn as fit 15 units apart.
 */
function layout(footprint: number, ovens: number, tablesWanted: number, cooks = 2): Layout {
  const w = ROOM_W[footprint];
  const L = (VW - w) / 2;
  const R = L + w;
  // Each prep cook gets a clear spot of their own (critic D35).
  const prep = { x0: L + 3, x1: L + 3 + Math.max(20, 8 + cooks * 7) };
  const door = R - 12;
  const diningW = Math.max(30, w * 0.3);
  const counterW = 21;
  const ovenStart = prep.x1 + 3;
  const ovenZone = door - 2 - diningW - 3 - counterW - 2 - ovenStart;
  const ovenW = Math.min(OVEN_W, (ovenZone - (ovens - 1) * OVEN_GAP) / Math.max(1, ovens));
  const ovensX = Array.from({ length: ovens }, (_, i) => ovenStart + i * (ovenW + OVEN_GAP));
  const ovenEnd = ovenStart + ovens * (ovenW + OVEN_GAP) - OVEN_GAP;
  const counter = { x0: ovenEnd + 2, x1: ovenEnd + 2 + counterW };
  const dining = { x0: counter.x1 + 3, x1: door - 2 };
  const span = dining.x1 - dining.x0;
  const cols = Math.max(1, Math.floor(span / 15));
  const tables = Math.min(tablesWanted, cols * 2);
  const used = Math.ceil(tables / 2);
  const step = span / Math.max(1, used);
  const tablesXY = Array.from({ length: tables }, (_, i) => {
    const col = Math.floor(i / 2);
    const row = i % 2;
    return { x: dining.x0 + step * (col + 0.5) + (row ? Math.min(3, step * 0.15) : 0), y: row === 0 ? FLOOR_Y + 4 : FLOOR_Y + 11 };
  });
  return { L, R, prep, ovens: ovensX, ovenW, counter, dining, door, tables: tablesXY };
}

function useClock(fps: number, paused: boolean) {
  const [t, setT] = useState(0);
  const base = useRef({ wall: Date.now(), t: 0 });
  useEffect(() => {
    if (paused) return;
    base.current = { wall: Date.now(), t: base.current.t };
    const timer = setInterval(() => setT(base.current.t + (Date.now() - base.current.wall) / 1000), 1000 / fps);
    return () => {
      base.current.t += (Date.now() - base.current.wall) / 1000;
      clearInterval(timer);
    };
  }, [fps, paused]);
  return t;
}

/** A little flat person, feet at (x, y). */
function Person({ x, y, kind, shirt, step = 0, arm = 0, flip = false, s = 1, carry = false }: { x: number; y: number; kind: 'cook' | 'driver' | 'staff' | 'guest'; shirt: string; step?: number; arm?: number; flip?: boolean; s?: number; carry?: boolean }) {
  const leg = Math.sin(step) * 2.2;
  const skin = kind === 'guest' ? '#C98F63' : '#F2C9A0';
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Path d={`M-1.6 -6 L${-1.6 + leg} 0 M1.6 -6 L${1.6 - leg} 0`} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Rect x={-4} y={-15} width={8} height={10} rx={3} fill={shirt} stroke={INK} strokeWidth={0.7} />
      {kind === 'cook' || kind === 'staff' ? <Rect x={-3} y={-12} width={6} height={7} rx={1} fill="#FFFFFF" stroke={INK} strokeWidth={0.4} /> : null}
      <Path d={`M3 -12 L${6 + arm} ${-8 - arm}`} stroke={skin} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={0} cy={-19} r={4} fill={skin} stroke={INK} strokeWidth={0.7} />
      <Circle cx={1.3} cy={-19.4} r={0.5} fill={INK} />
      {kind === 'cook' && <Path d="M-3.6 -21.5 Q-4.5 -27 -1.5 -26 Q0 -29 1.5 -26 Q4.5 -27 3.6 -21.5 Z" fill="#FFFFFF" stroke={INK} strokeWidth={0.6} />}
      {kind === 'driver' && <Path d="M-4 -20.5 Q-4 -24.5 0 -24.5 Q4 -24.5 4 -20.5 L7 -20.5 L7 -19.5 L-4 -19.5 Z" fill={C.tomato} stroke={INK} strokeWidth={0.6} />}
      {kind === 'staff' && <Path d="M-4 -20.5 Q-4 -24 0 -24 Q4 -24 4 -20.5 Z" fill={C.cheese} stroke={INK} strokeWidth={0.6} />}
      {carry && <Rect x={3} y={-14} width={8} height={3} fill="#F6E7C1" stroke={INK} strokeWidth={0.5} />}
    </G>
  );
}

function Oven({ x, w, grade, lit, flicker }: { x: number; w: number; grade: number; lit: boolean; flicker: number }) {
  const g = OVEN_GRADES[grade];
  const top = 48 - grade * 1.5; // fancier ovens are taller
  const mouth = w * 0.55;
  const cx = x + w / 2;
  return (
    <G>
      <Rect x={x + w * 0.36} y={top - 12} width={w * 0.28} height={14} fill={grade >= 3 ? g.color : '#9C8B7A'} stroke={INK} strokeWidth={0.5} />
      <Path d={`M${x} ${FLOOR_Y - 8} L${x} ${top + 9} Q${cx} ${top - 6} ${x + w} ${top + 9} L${x + w} ${FLOOR_Y - 8} Z`} fill={g.color} stroke={INK} strokeWidth={0.8} />
      {grade === 2 && [0, 1, 2].map((i) => <Rect key={i} x={x + w * 0.1 + i * w * 0.29} y={FLOOR_Y - 8} width={w * 0.22} height={2.4} fill="#5A3A1E" />)}
      {grade >= 4 && <Path d={`M${x + 2} ${top + 8} Q${cx} ${top - 3} ${x + w - 2} ${top + 8}`} stroke="#FFF3B0" strokeWidth={0.9} fill="none" />}
      <Path d={`M${cx - mouth / 2} ${FLOOR_Y - 9} L${cx - mouth / 2} ${FLOOR_Y - 16} Q${cx} ${FLOOR_Y - 22} ${cx + mouth / 2} ${FLOOR_Y - 16} L${cx + mouth / 2} ${FLOOR_Y - 9} Z`} fill="#2B1A12" />
      {lit && <Path d={`M${cx - mouth * 0.45} ${FLOOR_Y - 9} L${cx - mouth * 0.3} ${FLOOR_Y - 13 - flicker} L${cx - mouth * 0.1} ${FLOOR_Y - 11} L${cx + mouth * 0.08} ${FLOOR_Y - 15 + flicker} L${cx + mouth * 0.25} ${FLOOR_Y - 11} L${cx + mouth * 0.38} ${FLOOR_Y - 13} L${cx + mouth * 0.45} ${FLOOR_Y - 9} Z`} fill="#FF9F1C" />}
      <Rect x={x - 0.5} y={FLOOR_Y - 9} width={w + 1} height={2.5} fill="#6B4A3A" stroke={INK} strokeWidth={0.4} />
    </G>
  );
}

interface RoomProps {
  cooks: number;
  footprint: number;
  wall: string;
  grade: number;
  ovens: number;
  counterStaff: number;
  tables: number;
  vehicle: number;
  name: string;
}

/** Everything that doesn't move: outside, walls, decor, ovens (unlit), counter, tables, door. */
const Room = memo(function Room({ cooks, footprint, wall, grade, ovens, counterStaff, tables, vehicle, name }: RoomProps) {
  const lay = layout(footprint, ovens, tables, cooks);
  const { L, R } = lay;
  const w = R - L;
  return (
    <G>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9EC9F0" />
          <Stop offset="1" stopColor="#E6F4FE" />
        </LinearGradient>
      </Defs>
      <Rect x={-20} y={-20} width={VW + 40} height={VH + 40} fill="url(#sky)" />
      {/* neighbours' buildings beside a small shop */}
      {L > 8 && (
        <G opacity={0.75}>
          <Rect x={-4} y={30} width={L - 2} height={FLOOR_Y - 30} fill="#D9C8B4" />
          <Rect x={R + 2} y={38} width={VW - R + 4} height={FLOOR_Y - 38} fill="#CDB9A3" />
          {[0, 1, 2].map((i) => (
            <Rect key={i} x={3 + (i % 2) * 8} y={36 + i * 14} width={5} height={7} fill="#F6EBDC" opacity={L > 14 ? 1 : 0} />
          ))}
        </G>
      )}
      <Rect x={-20} y={FLOOR_Y + 16} width={VW + 40} height={VH} fill="#A9A39A" />
      {/* room shell */}
      <Rect x={L} y={10} width={w} height={FLOOR_Y - 10} fill={wall} stroke={INK} strokeWidth={1} />
      {/* kitchen back wall tiles vs dining room wallpaper */}
      <Rect x={L} y={FLOOR_Y - 22} width={lay.counter.x1 - L} height={22} fill="#FFFFFF" opacity={0.45} />
      {Array.from({ length: Math.floor((lay.counter.x1 - L) / 6) }).map((_, i) => <Path key={i} d={`M${L + i * 6} ${FLOOR_Y - 22} v22`} stroke="#E0D4C4" strokeWidth={0.35} />)}
      {/* decor by footprint tier */}
      {footprint === 0 && <Path d={`M${lay.dining.x0 + 4} 22 l3 6 l-2 4 l3 5`} stroke="#B9A48A" strokeWidth={0.8} fill="none" />}
      {footprint >= 1 && (
        <G>
          <Rect x={lay.dining.x0 + 2} y={18} width={20} height={12} rx={1.5} fill={INK} />
          {[21, 24.5, 28].map((yy) => <Rect key={yy} x={lay.dining.x0 + 4.5} y={yy - 0.5} width={14} height={1.3} rx={0.6} fill="#FFF4E0" />)}
        </G>
      )}
      {footprint >= 2 && (
        <G>
          <Path d={`M${L} 14 Q${L + w / 4} 20 ${L + w / 2} 14 Q${L + (3 * w) / 4} 20 ${R} 14`} stroke={INK} strokeWidth={0.5} fill="none" />
          {Array.from({ length: Math.floor(w / 12) }).map((_, i) => (
            <Circle key={i} cx={L + 6 + i * 12} cy={16.5 + (i % 2) * 1.5} r={1.4} fill={['#FFC531', '#E8432E', '#3FAE5A'][i % 3]} />
          ))}
        </G>
      )}
      {footprint >= 3 && (
        <G>
          <Rect x={lay.dining.x1 - 16} y={20} width={14} height={11} fill="#C98F63" stroke={INK} strokeWidth={0.7} />
          <Rect x={lay.dining.x1 - 14.5} y={21.5} width={11} height={8} fill="#F6E7C1" />
          <Circle cx={lay.dining.x1 - 9} cy={25.5} r={1.8} fill="#F2C9A0" />
        </G>
      )}
      {footprint >= 4 ? (
        <G>
          <Path d={`M${(lay.dining.x0 + lay.dining.x1) / 2} 10 v6`} stroke={INK} strokeWidth={0.6} />
          <Path d={`M${(lay.dining.x0 + lay.dining.x1) / 2 - 8} 18 Q${(lay.dining.x0 + lay.dining.x1) / 2} 24 ${(lay.dining.x0 + lay.dining.x1) / 2 + 8} 18 Z`} fill="#E0B000" stroke={INK} strokeWidth={0.6} />
        </G>
      ) : (
        <G>
          <Path d={`M${(lay.dining.x0 + lay.dining.x1) / 2} 10 v7`} stroke={INK} strokeWidth={0.5} />
          <Circle cx={(lay.dining.x0 + lay.dining.x1) / 2} cy={18.5} r={2} fill="#FFF3B0" stroke={INK} strokeWidth={0.5} />
        </G>
      )}
      {/* sign */}
      <Rect x={VW / 2 - 30} y={2} width={60} height={10} rx={2.5} fill={C.tomato} stroke={INK} strokeWidth={0.8} />
      <SvgText x={VW / 2} y={9.6} fontSize={6} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
        {`Rosa’s · ${name}`}
      </SvgText>
      {/* prep table */}
      <Rect x={lay.prep.x0} y={FLOOR_Y - 15} width={lay.prep.x1 - lay.prep.x0} height={4} rx={1} fill="#D9B48A" stroke={INK} strokeWidth={0.7} />
      <Rect x={lay.prep.x0 + 2} y={FLOOR_Y - 11} width={2} height={11} fill="#8E5A3C" />
      <Rect x={lay.prep.x1 - 4} y={FLOOR_Y - 11} width={2} height={11} fill="#8E5A3C" />
      {/* ovens (unlit; fire is drawn on top when running) */}
      {lay.ovens.map((x, i) => <Oven key={i} x={x} w={lay.ovenW} grade={grade} lit={false} flicker={0} />)}
      {/* counter: grows longer with more staff */}
      <Rect x={lay.counter.x0} y={FLOOR_Y - 14} width={lay.counter.x1 - lay.counter.x0} height={14} fill="#B0653A" stroke={INK} strokeWidth={0.8} />
      <Rect x={lay.counter.x0 - 1} y={FLOOR_Y - 16} width={lay.counter.x1 - lay.counter.x0 + 2} height={3} rx={1} fill="#E9DCC8" stroke={INK} strokeWidth={0.6} />
      {Array.from({ length: counterStaff }).map((_, i) => (
        <Rect key={i} x={lay.counter.x0 + 1.5 + i * 6.5} y={FLOOR_Y - 21} width={5} height={5} rx={1} fill="#555" stroke={INK} strokeWidth={0.4} />
      ))}
      {/* dining room floor is wood; kitchen floor is tile */}
      <Rect x={L} y={FLOOR_Y} width={lay.counter.x1 - L} height={16} fill="#E7DCCB" stroke={INK} strokeWidth={0.8} />
      {Array.from({ length: Math.floor((lay.counter.x1 - L) / 6) }).map((_, i) => <Path key={i} d={`M${L + i * 6} ${FLOOR_Y} v16`} stroke="#CFC2AE" strokeWidth={0.4} />)}
      <Rect x={lay.counter.x1} y={FLOOR_Y} width={R - lay.counter.x1} height={16} fill={footprint >= 3 ? '#C98F63' : '#D4B896'} stroke={INK} strokeWidth={0.8} />
      {Array.from({ length: Math.floor((R - lay.counter.x1) / 9) }).map((_, i) => <Path key={i} d={`M${lay.counter.x1 + i * 9} ${FLOOR_Y} l-3 16`} stroke="#B89C7C" strokeWidth={0.4} />)}
      {/* tables */}
      {lay.tables.map((t, i) => (
        <G key={i}>
          <Rect x={t.x - 7.5} y={t.y - 0.5} width={2.6} height={4.5} rx={0.8} fill={C.tomato} stroke={INK} strokeWidth={0.4} />
          <Rect x={t.x + 4.9} y={t.y - 0.5} width={2.6} height={4.5} rx={0.8} fill={C.tomato} stroke={INK} strokeWidth={0.4} />
          <Rect x={t.x - 0.5} y={t.y} width={1} height={4.5} fill={INK} />
          <Ellipse cx={t.x} cy={t.y} rx={4.6} ry={1.4} fill="#FFFFFF" stroke={INK} strokeWidth={0.6} />
        </G>
      ))}
      {/* front door with the fleet vehicle waiting outside */}
      <Rect x={lay.door} y={FLOOR_Y - 32} width={11} height={32} fill="#7A4A26" stroke={INK} strokeWidth={0.8} />
      <Rect x={lay.door + 2} y={FLOOR_Y - 29} width={7} height={11} fill="#BFE3F5" />
      <SvgText x={lay.door + 5.5} y={FLOOR_Y - 20.5} fontSize={6} textAnchor="middle">
        {VEHICLES[vehicle].emoji}
      </SvgText>
    </G>
  );
});

interface Props {
  game: Game.GameState;
  id: NeighborhoodId;
  width: number;
  height: number;
  paused: boolean;
  onTap: () => void;
}

export function ShopCutaway({ game, id, width, height, paused, onTap }: Props) {
  const clock = useClock(12, paused);
  const shop = game.shops[id];
  const nd = Game.def(id);
  const mem = useRef<{ phase: Record<string, number>; lastPopAt: number; lastPopSold: number; shopId: string; pop: { at: number; text: string } | null; taps: { at: number; x: number; text: string; color: string; slot: number; count: number }[]; tapCount: number }>({
    phase: {},
    lastPopAt: 0,
    lastPopSold: -1,
    shopId: '',
    pop: null,
    taps: [],
    tapCount: 0,
  });
  const fp = shop.footprint;
  const ovens = Math.min(FOOTPRINTS[fp].ovenSlots, 1 + Math.floor((shop.ovens - 1) / 8));
  const counterStaff = Math.min(3, 1 + Math.floor((shop.counter - 1) / 15));
  const prepCooks = Math.min(4, 1 + Math.floor((shop.prep - 1) / 15));
  const tables = Game.tablesShown(shop);
  const lay = layout(fp, ovens, tables, prepCooks);
  const running = shop.managed || shop.queued > 0.01;
  const rate = Game.shopRate(shop, game.vehicle);
  const revenue = Game.shopEarnings(game, id);
  const neck = Game.bottleneck(shop, game.vehicle);
  const pace = running ? Math.min(3, 0.8 + Math.log10(1 + rate)) : 0;
  const t = clock * pace;
  const counterFront = lay.counter.x1 + 3;

  // Drivers: in through the door, to the counter, grab a box, back out. Each exit pays out.
  const driverCount = Math.min(4, shop.drivers);
  let payout = false;
  const walkers: { key: string; x: number; y: number; kind: 'driver' | 'guest'; shirt: string; flip: boolean; step: number; carry: boolean }[] = [];
  for (let i = 0; i < driverCount; i++) {
    const p = ((t + i * 1.25) % 5) / 5;
    const out = lay.door + 5;
    // Each driver has their own pickup spot, 6 apart, so bodies never merge (critic G33).
    const at = Math.min(lay.door - 4, counterFront + 3 + i * 7);
    const x = p < 0.4 ? out + (at - out) * (p / 0.4) : p < 0.55 ? at : at + (out - at) * ((p - 0.55) / 0.45);
    const prev = mem.current.phase[`d${i}`];
    if (running && prev !== undefined && prev < 0.55 && p >= 0.55) payout = true;
    mem.current.phase[`d${i}`] = p;
    walkers.push({ key: `d${i}`, x, y: FLOOR_Y - 0.5, kind: 'driver', shirt: '#2F80ED', flip: p < 0.4, step: p < 0.4 || p > 0.55 ? clock * 12 : 0, carry: p >= 0.55 });
  }
  // Walk-ins: in through the door, order at the counter, then sit at a table.
  const guestCount = Math.min(2, lay.tables.length);
  for (let i = 0; i < guestCount; i++) {
    const p = ((t + 2.3 + i * 3.1) % 7) / 7;
    const door = lay.door + 5;
    const at = Math.min(lay.door - 6, counterFront + 3 + driverCount * 7);
    const seat = lay.tables[i % lay.tables.length];
    const x = p < 0.35 ? door + (at - door) * (p / 0.35) : p < 0.5 ? at : at + (seat.x - 6 - at) * ((p - 0.5) / 0.5);
    const y = p < 0.5 ? FLOOR_Y + 1 : FLOOR_Y + 1 + (seat.y + 4 - (FLOOR_Y + 1)) * ((p - 0.5) / 0.5);
    walkers.push({ key: `g${i}`, x, y, kind: 'guest', shirt: ['#9B51E0', '#27AE60'][i], flip: p < 0.5, step: p < 0.35 || p > 0.5 ? clock * 12 : 0, carry: false });
  }

  // Cash pop shows what the shop actually earned since the last pop (critic G19).
  if (mem.current.shopId !== id || mem.current.lastPopSold > shop.sold) {
    mem.current.shopId = id;
    mem.current.lastPopSold = shop.sold;
    mem.current.pop = null;
  }
  if (payout && clock - mem.current.lastPopAt > 0.9) {
    const earned = (shop.sold - mem.current.lastPopSold) * Game.valuePerPizza(id, shop, game.vehicle);
    if (earned > 0) mem.current.pop = { at: clock, text: `+${money(earned)}` };
    mem.current.lastPopAt = clock;
    mem.current.lastPopSold = shop.sold;
  }
  useEffect(() => {
    if (payout && !paused) emitPayout();
  });
  const pop = mem.current.pop && clock - mem.current.pop.at < 1.2 ? { t: (clock - mem.current.pop.at) / 1.2, text: mem.current.pop.text } : null;
  const taps = mem.current.taps.filter((tp) => clock - tp.at < 0.9);

  const flicker = running ? Math.sin(clock * 9) * 1.4 : 0;
  const boxes = running ? Math.min(5, 1 + Math.round(Math.log2(1 + rate))) : 0;
  const queueBalls = Math.ceil(shop.queued / 2);
  const tag = (x: number, label: string, hot: boolean) => (
    <G key={label}>
      <Rect x={x - 12} y={FLOOR_Y + 18.5} width={24} height={6.5} rx={3.2} fill={hot ? C.tomato : '#FFFFFF'} stroke={INK} strokeWidth={0.45} />
      <SvgText x={x} y={FLOOR_Y + 23} fontSize={3.3} fontFamily={F.bold} fill={hot ? '#FFFFFF' : INK} textAnchor="middle">
        {label}
      </SvgText>
    </G>
  );
  const ovenMid = (lay.ovens[0] + lay.ovens[lay.ovens.length - 1] + lay.ovenW) / 2;
  const tagXs = [(lay.prep.x0 + lay.prep.x1) / 2, Math.max(ovenMid, lay.prep.x1 + 13), (lay.counter.x0 + lay.counter.x1) / 2 + 2, (lay.dining.x0 + lay.door) / 2 + 4];
  // keep tags from colliding on the smallest shop
  for (let i = 1; i < tagXs.length; i++) tagXs[i] = Math.max(tagXs[i], tagXs[i - 1] + 25);

  return (
    <Pressable
      onPress={(e) => {
        // locationX can be missing (web, synthetic taps): fall back to the middle of the shop.
        const lx = e?.nativeEvent?.locationX;
        const x = typeof lx === 'number' && Number.isFinite(lx) ? (lx / width) * VW : VW / 2;
        const full = !shop.managed && shop.queued > TUNING.tapQueueMax - 1;
        const text = shop.managed ? `+${money(revenue * TUNING.rushSeconds)} rush!` : full ? 'Kitchen full!' : `+${TUNING.tapBatch} 🍕`;
        const color = shop.managed ? C.basilDark : full ? INK : C.tomatoDark;
        // Fast taps don't stack: a repeat of the newest pop refreshes it with a ×N counter;
        // a different message takes the next slot down, at most 2 on screen (critic G31).
        const live = mem.current.taps.filter((tp) => clock - tp.at < 0.9);
        const last = live[live.length - 1];
        if (last && last.text === text) {
          last.count += 1;
          last.at = clock;
          mem.current.taps = live;
        } else {
          const slot = last ? (last.slot + 1) % 2 : 0;
          mem.current.taps = [...live.slice(-1), { at: clock, x: Math.max(30, Math.min(VW - 30, x)), text, color, slot, count: 1 }];
        }
        onTap();
      }}
      testID="shop"
      style={{ width, height, backgroundColor: CUTAWAY_SKY }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet">
        <Room cooks={prepCooks} footprint={fp} wall={nd.wall} grade={shop.grade} ovens={ovens} counterStaff={counterStaff} tables={tables} vehicle={game.vehicle} name={nd.name} />
        {running && lay.ovens.map((x, i) => <Oven key={i} x={x} w={lay.ovenW} grade={shop.grade} lit flicker={flicker * (i % 2 ? -1 : 1)} />)}
        {/* dough waiting on the prep table: the tap queue for unmanaged shops, a steady pile when managed */}
        {Array.from({ length: shop.managed ? 3 : queueBalls }).map((_, i) => (
          <Ellipse key={`q${i}`} cx={lay.prep.x0 + 4 + (i % 6) * 3.6} cy={FLOOR_Y - 16 - Math.floor(i / 6) * 1.6} rx={1.9} ry={1.1} fill="#F7E3C0" stroke={INK} strokeWidth={0.35} />
        ))}
        {/* prep cooks */}
        {Array.from({ length: prepCooks }).map((_, i) => (
          <Person key={`c${i}`} x={lay.prep.x0 + 4.5 + (prepCooks > 1 ? (i * (lay.prep.x1 - lay.prep.x0 - 9)) / (prepCooks - 1) : 4)} y={FLOOR_Y - 1 + (i % 2 === 1 ? 2.5 : 0)} kind="cook" shirt={i % 2 ? '#D9534F' : '#E8432E'} s={i % 2 ? 0.9 : 0.82} arm={running ? Math.abs(Math.sin(t * 4 + i)) * 3 : 0} />
        ))}
        {/* one baker per oven */}
        {lay.ovens.map((x, i) => (
          <Person key={`b${i}`} x={x + lay.ovenW / 2 + 2} y={FLOOR_Y + 3} kind="cook" shirt="#B23A48" s={0.8} arm={running ? Math.abs(Math.sin(t * 3 + i)) * 2.5 : 0} flip={i % 2 === 1} />
        ))}
        {/* counter staff */}
        {Array.from({ length: counterStaff }).map((_, i) => (
          <Person key={`s${i}`} x={lay.counter.x0 + 4 + i * 6.5} y={FLOOR_Y - 15} kind="staff" shirt={C.basil} s={0.8} arm={running ? Math.abs(Math.sin(t * 5 + i * 2)) * 2 : 0} />
        ))}
        {/* boxes ready for pickup */}
        {Array.from({ length: boxes }).map((_, i) => (
          <Rect key={`x${i}`} x={lay.counter.x1 - 9} y={FLOOR_Y - 18.5 - i * 2.3} width={8} height={2.1} fill="#F6E7C1" stroke={INK} strokeWidth={0.4} />
        ))}
        {/* seated guests */}
        {running &&
          lay.tables.slice(guestCount).map((tb, i) => (
            <Person key={`sg${i}`} x={tb.x + 6} y={tb.y + 4} kind="guest" shirt={['#F2994A', '#56CCF2', '#BB6BD9', '#6FCF97'][i % 4]} s={0.7} arm={Math.abs(Math.sin(clock * 2 + i)) * 2} flip />
          ))}
        {running && walkers.map((wk) => <Person key={wk.key} x={wk.x} y={wk.y} kind={wk.kind} shirt={wk.shirt} step={wk.step} carry={wk.carry} flip={wk.flip} s={0.85} />)}
        {/* station tags: the bottleneck lights up red */}
        {tag(tagXs[0], `PREP ${shop.prep}`, neck === 'prep')}
        {tag(tagXs[1], `OVENS ${shop.ovens}`, neck === 'ovens')}
        {tag(tagXs[2], `COUNTER ${shop.counter}`, neck === 'counter')}
        {tag(tagXs[3], `DRIVERS ${shop.drivers}`, neck === 'customers')}
        {/* idle prompt (opaque; pulses in size) */}
        {!running && (
          <G transform={`translate(${VW / 2} 40) scale(${1 + 0.06 * Math.sin(clock * 5)})`}>
            <Rect x={-36} y={-9} width={72} height={18} rx={9} fill={C.tomato} stroke="#FFFFFF" strokeWidth={1.2} />
            <SvgText x={0} y={3.5} fontSize={9} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
              TAP TO BAKE!
            </SvgText>
          </G>
        )}
        {/* queue meter for unmanaged shops */}
        {!shop.managed && (
          <G>
            <Rect x={VW / 2 - 26} y={22} width={52} height={6} rx={3} fill="#FFFFFF" stroke={INK} strokeWidth={0.5} />
            <Rect x={VW / 2 - 25.5} y={22.5} width={51 * Math.min(1, shop.queued / TUNING.tapQueueMax)} height={5} rx={2.5} fill={C.cheese} />
            <SvgText x={VW / 2} y={26.6} fontSize={3.6} fontFamily={F.bold} fill={INK} textAnchor="middle">
              {`${Math.ceil(shop.queued)} / ${TUNING.tapQueueMax} queued`}
            </SvgText>
          </G>
        )}
        {/* per-tap feedback: a solid pill per tap, in its own slot, so fast taps stay readable */}
        {taps.map((tp) => {
          const k = (clock - tp.at) / 0.9;
          const label = tp.count > 1 ? `${tp.text} ×${tp.count}` : tp.text;
          const y = 40 + tp.slot * 10 - k * 6;
          const w = label.length * 3.5 + 6;
          return (
            <G key={`${tp.slot}-${tp.text}`} opacity={k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3}>
              <Rect x={tp.x - w / 2} y={y - 5.5} width={w} height={8} rx={4} fill={tp.color} stroke="#FFFFFF" strokeWidth={0.8} />
              <SvgText x={tp.x} y={y + 0.6} fontSize={5.6} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
                {label}
              </SvgText>
            </G>
          );
        })}
        {/* cash pop at the door */}
        {pop && (
          <G opacity={1 - pop.t * pop.t} transform={`translate(${Math.min(lay.door, lay.R - pop.text.length * 2.1 - 2) - Math.min(lay.door, VW - 22)} 0)`}>
            <SvgText x={Math.min(lay.door, VW - 22)} y={FLOOR_Y - 38 - pop.t * 8} fontSize={7} fontFamily={F.bold} fill="#FFFFFF" stroke={C.basilDark} strokeWidth={1.6} textAnchor="middle">
              {pop.text}
            </SvgText>
            <SvgText x={Math.min(lay.door, VW - 22)} y={FLOOR_Y - 38 - pop.t * 8} fontSize={7} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
              {pop.text}
            </SvgText>
          </G>
        )}
      </Svg>
    </Pressable>
  );
}
