// Side-view cutaway of one pizzeria: prep table, ovens on the back wall, counter, front door,
// seating area. Cooks, bakers, counter staff, drivers and walk-ins animate at speeds driven by the
// shop's real rates. The room widens and gets fancier as the footprint grows.
import { memo, useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { FOOTPRINTS, OVEN_GRADES, VEHICLES } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';
import { emitPayout } from './pulse-bus';

const INK = '#3B1F14';
const VW = 200;
const VH = 120;
const FLOOR_Y = 88;
const ROOM_W = [118, 136, 156, 178, 200];

interface Props {
  game: Game.GameState;
  id: NeighborhoodId;
  width: number;
  height: number;
  paused: boolean;
  onTap: () => void;
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

/** A little flat person. `kind` picks the outfit. Feet at (x, y). */
function Person({ x, y, kind, shirt, step = 0, arm = 0, flip = false, s = 1 }: { x: number; y: number; kind: 'cook' | 'driver' | 'staff' | 'guest'; shirt: string; step?: number; arm?: number; flip?: boolean; s?: number }) {
  const legA = Math.sin(step) * 2.2;
  const skin = kind === 'guest' ? '#C98F63' : '#F2C9A0';
  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Path d={`M-1.6 -6 L${-1.6 + legA} 0 M1.6 -6 L${1.6 - legA} 0`} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Rect x={-4} y={-15} width={8} height={10} rx={3} fill={shirt} stroke={INK} strokeWidth={0.7} />
      {kind === 'cook' || kind === 'staff' ? <Rect x={-3} y={-12} width={6} height={7} rx={1} fill="#FFFFFF" stroke={INK} strokeWidth={0.4} /> : null}
      <Path d={`M3 -12 L${6 + arm} ${-8 - arm}`} stroke={skin} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={0} cy={-19} r={4} fill={skin} stroke={INK} strokeWidth={0.7} />
      <Circle cx={1.3} cy={-19.4} r={0.5} fill={INK} />
      {kind === 'cook' && <Path d="M-3.6 -21.5 Q-4.5 -27 -1.5 -26 Q0 -29 1.5 -26 Q4.5 -27 3.6 -21.5 Z" fill="#FFFFFF" stroke={INK} strokeWidth={0.6} />}
      {kind === 'driver' && <Path d="M-4 -20.5 Q-4 -24.5 0 -24.5 Q4 -24.5 4 -20.5 L7 -20.5 L7 -19.5 L-4 -19.5 Z" fill={C.tomato} stroke={INK} strokeWidth={0.6} />}
      {kind === 'staff' && <Path d="M-4 -20.5 Q-4 -24 0 -24 Q4 -24 4 -20.5 Z" fill={C.cheese} stroke={INK} strokeWidth={0.6} />}
      {kind === 'driver' && arm > 0.5 && <Rect x={4} y={-16} width={7} height={2.6} fill="#F6E7C1" stroke={INK} strokeWidth={0.5} />}
    </G>
  );
}

function Oven({ x, w, grade, lit, flicker }: { x: number; w: number; grade: number; lit: boolean; flicker: number }) {
  const g = OVEN_GRADES[grade];
  const top = 46 - grade * 1.2; // fancier ovens are bigger
  const mouthW = w * 0.5;
  return (
    <G>
      <Rect x={x + w * 0.38} y={top - 12} width={w * 0.24} height={14} fill={grade >= 3 ? g.color : '#9C8B7A'} stroke={INK} strokeWidth={0.6} />
      <Path d={`M${x} ${FLOOR_Y - 8} L${x} ${top + 10} Q${x + w / 2} ${top - 6} ${x + w} ${top + 10} L${x + w} ${FLOOR_Y - 8} Z`} fill={g.color} stroke={INK} strokeWidth={0.9} />
      {grade >= 4 && <Path d={`M${x + 3} ${top + 9} Q${x + w / 2} ${top - 3} ${x + w - 3} ${top + 9}`} stroke="#FFF3B0" strokeWidth={1} fill="none" />}
      {grade === 2 &&
        [0, 1, 2].map((i) => <Rect key={i} x={x + 3 + i * (w / 3.4)} y={FLOOR_Y - 8} width={w / 4.5} height={2.5} fill="#5A3A1E" />)}
      <Path d={`M${x + (w - mouthW) / 2} ${FLOOR_Y - 9} L${x + (w - mouthW) / 2} ${FLOOR_Y - 17} Q${x + w / 2} ${FLOOR_Y - 24} ${x + (w + mouthW) / 2} ${FLOOR_Y - 17} L${x + (w + mouthW) / 2} ${FLOOR_Y - 9} Z`} fill="#2B1A12" />
      {lit && (
        <Path
          d={`M${x + w / 2 - 6} ${FLOOR_Y - 9} L${x + w / 2 - 4} ${FLOOR_Y - 14 - flicker} L${x + w / 2 - 1} ${FLOOR_Y - 11} L${x + w / 2 + 1} ${FLOOR_Y - 16 + flicker} L${x + w / 2 + 3} ${FLOOR_Y - 11} L${x + w / 2 + 5} ${FLOOR_Y - 14} L${x + w / 2 + 6} ${FLOOR_Y - 9} Z`}
          fill="#FF9F1C"
        />
      )}
      <Rect x={x - 1} y={FLOOR_Y - 9} width={w + 2} height={3} fill="#6B4A3A" stroke={INK} strokeWidth={0.5} />
    </G>
  );
}

interface RoomProps {
  footprint: number;
  wall: string;
  grade: number;
  ovens: number;
  counterSize: number;
  tables: number;
  vehicle: number;
  name: string;
}

/** Everything that doesn't move: walls, decor, ovens, counter, tables, door, street. */
const Room = memo(function Room({ footprint, wall, grade, ovens, counterSize, tables, vehicle, name }: RoomProps) {
  const w = ROOM_W[footprint];
  const L = (VW - w) / 2;
  const R = L + w;
  const ovenW = 17;
  const ovenZone = { from: L + 34, to: R - 62 };
  const gap = ovens > 1 ? Math.min(4, (ovenZone.to - ovenZone.from - ovens * ovenW) / (ovens - 1)) : 0;
  const ovensX = Array.from({ length: ovens }, (_, i) => ovenZone.from + i * (ovenW + gap));
  const counterL = R - 58 + (3 - counterSize) * 5;
  return (
    <G>
      {/* outside: sky + street, visible beyond a small shop */}
      <Rect x={0} y={0} width={VW} height={VH} fill="url(#sky)" />
      {L > 2 && (
        <G>
          {[[4, 30, 18, '#D9C8B4'], [L - 20, 40, 16, '#CDB9A3'], [R + 4, 34, 18, '#D9C8B4'], [VW - 18, 44, 16, '#CDB9A3']].map(([x, y, bw, c], i) =>
            (x as number) > -10 && (x as number) < VW ? <Rect key={i} x={x as number} y={y as number} width={bw as number} height={FLOOR_Y - (y as number)} fill={c as string} opacity={0.7} /> : null,
          )}
        </G>
      )}
      <Rect x={0} y={FLOOR_Y + 14} width={VW} height={VH} fill="#A9A39A" />
      {/* the room */}
      <Rect x={L} y={8} width={w} height={FLOOR_Y - 8} fill={wall} stroke={INK} strokeWidth={1} />
      {/* decor by footprint tier */}
      {footprint === 0 && <Path d={`M${L + 20} 20 l3 6 l-2 4 l3 5`} stroke="#B9A48A" strokeWidth={0.8} fill="none" />}
      {footprint >= 1 && (
        <G>
          <Rect x={L + 8} y={14} width={22} height={13} rx={1.5} fill={INK} />
          {[17, 20.5, 24].map((yy) => <Rect key={yy} x={L + 10.5} y={yy} width={16} height={1.4} rx={0.7} fill="#FFF4E0" />)}
        </G>
      )}
      {footprint >= 2 && (
        <G>
          <Path d={`M${L} 12 Q${L + w / 4} 18 ${L + w / 2} 12 Q${L + (3 * w) / 4} 18 ${R} 12`} stroke={INK} strokeWidth={0.5} fill="none" />
          {Array.from({ length: Math.floor(w / 12) }).map((_, i) => (
            <Circle key={i} cx={L + 6 + i * 12} cy={14.5 + (i % 2) * 1.5} r={1.4} fill={['#FFC531', '#E8432E', '#3FAE5A'][i % 3]} />
          ))}
        </G>
      )}
      {footprint >= 3 && (
        <G>
          <Rect x={R - 46} y={16} width={16} height={12} fill="#C98F63" stroke={INK} strokeWidth={0.7} />
          <Rect x={R - 44} y={18} width={12} height={8} fill="#F6E7C1" />
          <Circle cx={R - 38} cy={22} r={2} fill="#F2C9A0" />
        </G>
      )}
      {footprint >= 4 && (
        <G>
          <Rect x={L} y={FLOOR_Y - 18} width={w} height={18} fill="#FFFFFF" opacity={0.35} />
          {Array.from({ length: Math.floor(w / 8) }).map((_, i) => <Path key={i} d={`M${L + i * 8} ${FLOOR_Y - 18} v18`} stroke="#E0D4C4" strokeWidth={0.4} />)}
          <Path d={`M${VW / 2} 8 v6`} stroke={INK} strokeWidth={0.6} />
          <Path d={`M${VW / 2 - 9} 16 Q${VW / 2} 22 ${VW / 2 + 9} 16 Z`} fill="#E0B000" stroke={INK} strokeWidth={0.6} />
        </G>
      )}
      {footprint < 4 && (
        <G>
          <Path d={`M${VW / 2} 8 v7`} stroke={INK} strokeWidth={0.5} />
          <Circle cx={VW / 2} cy={16.5} r={2} fill="#FFF3B0" stroke={INK} strokeWidth={0.5} />
        </G>
      )}
      {/* sign */}
      <Rect x={VW / 2 - 28} y={1} width={56} height={10} rx={2.5} fill={C.tomato} stroke={INK} strokeWidth={0.8} />
      <SvgText x={VW / 2} y={8.6} fontSize={6.2} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
        {`Rosa’s · ${name}`}
      </SvgText>
      {/* prep table */}
      <Rect x={L + 4} y={FLOOR_Y - 15} width={26} height={4} rx={1} fill="#D9B48A" stroke={INK} strokeWidth={0.7} />
      <Rect x={L + 6} y={FLOOR_Y - 11} width={2} height={11} fill="#8E5A3C" />
      <Rect x={L + 26} y={FLOOR_Y - 11} width={2} height={11} fill="#8E5A3C" />
      {[0, 1, 2].map((i) => <Ellipse key={i} cx={L + 10 + i * 7} cy={FLOOR_Y - 16} rx={2.6} ry={1.4} fill="#F7E3C0" stroke={INK} strokeWidth={0.4} />)}
      {/* ovens */}
      {ovensX.map((x, i) => (
        <G key={i}>
          <Oven x={x} w={ovenW} grade={grade} lit={false} flicker={0} />
        </G>
      ))}
      {/* counter */}
      <Rect x={counterL} y={FLOOR_Y - 14} width={R - 14 - counterL} height={14} fill="#B0653A" stroke={INK} strokeWidth={0.8} />
      <Rect x={counterL - 1} y={FLOOR_Y - 16} width={R - 12 - counterL} height={3} rx={1} fill="#E9DCC8" stroke={INK} strokeWidth={0.6} />
      <Rect x={counterL + 3} y={FLOOR_Y - 22} width={7} height={6} rx={1} fill="#555" stroke={INK} strokeWidth={0.5} />
      {/* door */}
      <Rect x={R - 12} y={FLOOR_Y - 34} width={11} height={34} fill="#7A4A26" stroke={INK} strokeWidth={0.8} />
      <Rect x={R - 10} y={FLOOR_Y - 31} width={7} height={12} fill="#BFE3F5" />
      <SvgText x={R - 6.5} y={FLOOR_Y - 22} fontSize={6} textAnchor="middle">
        {VEHICLES[vehicle].emoji}
      </SvgText>
      {/* floor */}
      <Rect x={L} y={FLOOR_Y} width={w} height={14} fill={footprint >= 3 ? '#E7D2B5' : '#D4B896'} stroke={INK} strokeWidth={0.8} />
      {Array.from({ length: Math.floor(w / 10) }).map((_, i) => <Path key={i} d={`M${L + i * 10} ${FLOOR_Y} l-3 14`} stroke="#B89C7C" strokeWidth={0.4} />)}
      {/* seating, in the front-left */}
      {Array.from({ length: tables }).map((_, i) => {
        const tx = L + 10 + i * 13;
        if (tx > R - 66) return null;
        return (
          <G key={i}>
            <Ellipse cx={tx} cy={FLOOR_Y + 6} rx={5} ry={1.6} fill="#FFFFFF" stroke={INK} strokeWidth={0.6} />
            <Rect x={tx - 0.6} y={FLOOR_Y + 6} width={1.2} height={6} fill={INK} />
            <Rect x={tx - 8} y={FLOOR_Y + 7} width={3} height={5} rx={0.8} fill={C.tomato} stroke={INK} strokeWidth={0.4} />
            <Rect x={tx + 5} y={FLOOR_Y + 7} width={3} height={5} rx={0.8} fill={C.tomato} stroke={INK} strokeWidth={0.4} />
          </G>
        );
      })}
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9EC9F0" />
          <Stop offset="1" stopColor="#E6F4FE" />
        </LinearGradient>
      </Defs>
    </G>
  );
});

export function ShopCutaway({ game, id, width, height, paused, onTap }: Props) {
  const clock = useClock(12, paused);
  const shop = game.shops[id];
  const nd = Game.def(id);
  const lastLoop = useRef<Record<string, number>>({});
  const footprint = shop.footprint;
  const w = ROOM_W[footprint];
  const L = (VW - w) / 2;
  const R = L + w;
  const ovens = Math.min(FOOTPRINTS[footprint].ovenSlots, 1 + Math.floor((shop.ovens - 1) / 8));
  const counterSize = Math.min(3, 1 + Math.floor((shop.counter - 1) / 15));
  const tables = Game.tablesShown(shop);
  const running = shop.managed || shop.queued > 0.01;
  const rate = Game.shopRate(shop, game.vehicle);
  const ovenW = 17;
  const ovenZone = { from: L + 34, to: R - 62 };
  const gap = ovens > 1 ? Math.min(4, (ovenZone.to - ovenZone.from - ovens * ovenW) / (ovens - 1)) : 0;
  const counterL = R - 58 + (3 - counterSize) * 5;
  const counterMid = (counterL + R - 14) / 2;
  const bottleneck = Game.bottleneck(shop, game.vehicle);

  // How fast things move: faster shops animate faster, within a readable range.
  const pace = running ? Math.min(3, 0.8 + Math.log10(1 + rate)) : 0;
  const t = clock * pace;

  // Drivers: walk in from the door to the counter, grab a box, walk back out.
  const driverCount = Math.min(3, shop.drivers);
  const walkers: { x: number; carry: boolean; kind: 'driver' | 'guest'; key: string; shirt: string; flip: boolean; step: number }[] = [];
  let payout = false;
  const pops: { x: number; y: number; t: number; text: string }[] = [];
  const loop = (key: string, period: number, offset: number) => {
    const p = ((t + offset) % period) / period;
    const prev = lastLoop.current[key];
    lastLoop.current[key] = p;
    return { p, wrapped: prev !== undefined && running && prev > 0.5 && p < 0.5 };
  };
  for (let i = 0; i < driverCount; i++) {
    const { p } = loop(`d${i}`, 5, i * 1.7);
    const out = R - 6;
    const at = counterMid + 6;
    const x = p < 0.4 ? out + (at - out) * (p / 0.4) : p < 0.55 ? at : at + (out - at) * ((p - 0.55) / 0.45);
    // Payout when a driver heads out the door with a box.
    const prevP = lastLoop.current[`dp${i}`] ?? p;
    if (running && prevP < 0.55 && p >= 0.55) {
      payout = true;
      if (i === 0) lastLoop.current.popAt = clock;
    }
    lastLoop.current[`dp${i}`] = p;
    walkers.push({ x, carry: p >= 0.55, kind: 'driver', key: `d${i}`, shirt: '#2F80ED', flip: p < 0.4, step: p < 0.4 || p > 0.55 ? clock * 12 : 0 });
  }
  // Walk-ins: come in, order at the counter, then sit down.
  const guestCount = Math.min(2, tables);
  for (let i = 0; i < guestCount; i++) {
    const { p } = loop(`g${i}`, 7, 2.3 + i * 3.1);
    const door = R - 6;
    const at = counterMid - 4;
    const seat = L + 10 + (i % tables) * 13 - 6;
    const x = p < 0.35 ? door + (at - door) * (p / 0.35) : p < 0.5 ? at : at + (seat - at) * ((p - 0.5) / 0.5);
    walkers.push({ x, carry: false, kind: 'guest', key: `g${i}`, shirt: ['#9B51E0', '#27AE60'][i], flip: p < 0.5, step: p < 0.35 || p > 0.5 ? clock * 12 : 0 });
  }
  const popAge = clock - (lastLoop.current.popAt ?? -99);
  if (popAge >= 0 && popAge < 1.2) pops.push({ x: R - 8, y: FLOOR_Y - 38, t: popAge / 1.2, text: `+${money(Game.tripCapacity(shop, game.vehicle) * nd.orderValue)}` });
  useEffect(() => {
    if (payout && !paused) emitPayout();
  });

  const flicker = running ? Math.sin(clock * 9) * 1.5 : 0;
  const ovensX = Array.from({ length: ovens }, (_, i) => ovenZone.from + i * (ovenW + gap));
  const boxes = running ? Math.min(5, 1 + Math.round(rate)) : 0;
  const tag = (x: number, label: string, hot: boolean) => (
    <G key={label}>
      <Rect x={x - 11.5} y={FLOOR_Y + 15.5} width={23} height={6} rx={3} fill={hot ? C.tomato : 'rgba(255,255,255,0.9)'} stroke={INK} strokeWidth={0.4} />
      <SvgText x={x} y={FLOOR_Y + 19.6} fontSize={3.2} fontFamily={F.bold} fill={hot ? '#FFFFFF' : INK} textAnchor="middle">
        {label}
      </SvgText>
    </G>
  );

  return (
    <Pressable onPress={onTap} testID="shop" style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice">
        <Room footprint={footprint} wall={nd.wall} grade={shop.grade} ovens={ovens} counterSize={counterSize} tables={tables} vehicle={game.vehicle} name={nd.name} />
        {/* lit ovens */}
        {running && ovensX.map((x, i) => <Oven key={i} x={x} w={ovenW} grade={shop.grade} lit flicker={flicker * (i % 2 ? -1 : 1)} />)}
        {/* prep cooks */}
        {Array.from({ length: Math.min(2, 1 + Math.floor((shop.prep - 1) / 20)) }).map((_, i) => (
          <Person key={`c${i}`} x={L + 12 + i * 11} y={FLOOR_Y - 1} kind="cook" shirt="#E8432E" arm={running ? Math.abs(Math.sin(t * 4 + i)) * 3 : 0} />
        ))}
        {/* baker at the ovens */}
        <Person x={ovensX[0] + ovenW + 1} y={FLOOR_Y - 1} kind="cook" shirt="#B23A48" arm={running ? Math.abs(Math.sin(t * 3)) * 2.5 : 0} flip />
        {/* counter staff */}
        {Array.from({ length: counterSize }).map((_, i) => (
          <Person key={`s${i}`} x={counterL + 8 + i * 10} y={FLOOR_Y - 15} kind="staff" shirt={C.basil} s={0.85} arm={running ? Math.abs(Math.sin(t * 5 + i * 2)) * 2 : 0} />
        ))}
        {/* pizza boxes on the counter */}
        {Array.from({ length: boxes }).map((_, i) => (
          <Rect key={`b${i}`} x={R - 26} y={FLOOR_Y - 18.5 - i * 2.4} width={9} height={2.2} fill="#F6E7C1" stroke={INK} strokeWidth={0.4} />
        ))}
        {/* drivers and walk-ins */}
        {running &&
          walkers.map((wk) => (
            <Person key={wk.key} x={wk.x} y={wk.kind === 'guest' ? FLOOR_Y + 11 : FLOOR_Y + 1} kind={wk.kind} shirt={wk.shirt} step={wk.step} arm={wk.carry ? 1 : 0} flip={wk.flip} s={0.9} />
          ))}
        {/* seated guests */}
        {running &&
          Array.from({ length: Math.max(0, tables - 1) }).map((_, i) => {
            const tx = L + 10 + (i + 1) * 13;
            if (tx > R - 66) return null;
            return <Person key={`sg${i}`} x={tx + 6.5} y={FLOOR_Y + 11} kind="guest" shirt={['#F2994A', '#56CCF2', '#BB6BD9', '#6FCF97'][i % 4]} s={0.75} arm={Math.abs(Math.sin(clock * 2 + i)) * 2} />;
          })}
        {/* station tags; the bottleneck lights up red */}
        {tag(L + 14, `PREP ${shop.prep}`, bottleneck === 'prep')}
        {tag(Math.max(L + 39, (ovensX[0] + ovensX[ovens - 1] + ovenW) / 2), `OVENS ${shop.ovens}`, bottleneck === 'ovens')}
        {tag(counterMid, `COUNTER ${shop.counter}`, bottleneck === 'counter')}
        {/* idle prompt */}
        {!running && (
          <G>
            <Rect x={VW / 2 - 36} y={30} width={72} height={18} rx={9} fill={C.tomato} stroke="#FFFFFF" strokeWidth={1.2} opacity={0.6 + 0.4 * Math.abs(Math.sin(clock * 3))} />
            <SvgText x={VW / 2} y={42.5} fontSize={9} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
              TAP TO BAKE!
            </SvgText>
          </G>
        )}
        {/* cash pops */}
        {pops.map((p, i) => (
          <G key={i} opacity={1 - p.t * p.t}>
            <SvgText x={p.x} y={p.y - p.t * 8} fontSize={7} fontFamily={F.bold} fill="#FFFFFF" stroke={C.basilDark} strokeWidth={1.6} textAnchor="middle">
              {p.text}
            </SvgText>
            <SvgText x={p.x} y={p.y - p.t * 8} fontSize={7} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
              {p.text}
            </SvgText>
          </G>
        ))}
      </Svg>
    </Pressable>
  );
}
