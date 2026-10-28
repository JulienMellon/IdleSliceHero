// Top-down city map: neighborhoods light up when unlocked; drivers ride the routes.
// The static scenery is memoized; only the driver layer animates, on its own clock,
// and the clock pauses while a cut-scene or popup covers the map.
import { memo, useEffect, useRef, useState } from 'react';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { MAP_VIEWBOX, NEIGHBORHOODS, SHOP_POS, VEHICLES } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';
import { emitPayout } from './pulse-bus';

const INK = '#3B1F14';
const HW = 9 * 0.85;
const HH = 7 * 0.85;

interface Props {
  game: Game.GameState;
  width: number;
  height: number;
  /** True while pizzas are flowing (drivers out on routes). */
  active: boolean;
  /** Stop animating while something covers the map. */
  paused: boolean;
  onPressHood: (id: NeighborhoodId) => void;
}

const TREES = [
  [6, 26], [34, 22], [66, 22], [94, 30], [6, 70], [40, 68], [60, 48], [92, 44], [36, 46], [64, 30], [8, 46], [50, 64],
];

function useClock(fps: number, paused: boolean) {
  const [t, setT] = useState(0);
  const base = useRef({ wall: Date.now(), t: 0 });
  useEffect(() => {
    if (paused) return;
    base.current = { wall: Date.now(), t: base.current.t };
    const id = setInterval(() => {
      const now = base.current.t + (Date.now() - base.current.wall) / 1000;
      setT(now);
    }, 1000 / fps);
    return () => {
      base.current.t += (Date.now() - base.current.wall) / 1000;
      clearInterval(id);
    };
  }, [fps, paused]);
  return t;
}

interface StaticProps {
  unlockedKey: string;
  nextLockedIdx: number;
  nextLabel: string;
  nextColor: string;
  onPressHood: (id: NeighborhoodId) => void;
}

/** Ground, river, trees, roads, neighborhoods and the shop: redraws only when unlocks change. */
const StaticLayer = memo(function StaticLayer({ unlockedKey, nextLockedIdx, nextLabel, nextColor, onPressHood }: StaticProps) {
  const unlocked = unlockedKey.split(',');
  const { w: VW, h: VH } = MAP_VIEWBOX;
  return (
    <G>
      <Rect x={-50} y={-50} width={VW + 100} height={VH + 100} fill={C.map} />
      <Path d={`M${VW} 34 Q86 40 90 52 Q94 66 84 ${VH + 2} L${VW + 50} ${VH + 50} L${VW + 50} 34 Z`} fill={C.water} />
      <Path d={`M${VW} 38 Q90 44 93 54`} stroke="#B7E4F7" strokeWidth={0.6} fill="none" />
      {TREES.map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={2} fill="#5DAE4B" />
          <Circle cx={x - 0.7} cy={y - 0.7} r={0.8} fill="#86CF6E" />
        </G>
      ))}
      {NEIGHBORHOODS.map((n) => {
        const open = unlocked.includes(n.id);
        return (
          <G key={`road-${n.id}`}>
            <Line x1={SHOP_POS.x} y1={SHOP_POS.y} x2={n.x} y2={n.y} stroke={open ? '#FFFFFF' : '#D5CCBF'} strokeWidth={3.6} strokeLinecap="round" />
            <Line x1={SHOP_POS.x} y1={SHOP_POS.y} x2={n.x} y2={n.y} stroke={open ? C.road : '#C9BCB2'} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={open ? '2 1.4' : '0.7 1.8'} />
          </G>
        );
      })}
      {NEIGHBORHOODS.map((n, i) => {
        const open = unlocked.includes(n.id);
        const isNext = i === nextLockedIdx;
        return (
          <G key={n.id} onPress={() => onPressHood(n.id)}>
            <Rect x={n.x - HW} y={n.y - HH} width={HW * 2} height={HH * 2} rx={3} fill={open ? n.color : C.locked} stroke={INK} strokeWidth={0.7} />
            {[-4.2, 0, 4.2].map((dx, k) => (
              <Rect key={k} x={n.x + dx - 1.7} y={n.y - 3.4 - (k === 1 ? 1.7 : 0)} width={3.4} height={5.1 + (k === 1 ? 1.7 : 0)} fill={open ? '#FFFFFF' : '#E3DAD2'} stroke={INK} strokeWidth={0.35} opacity={open ? 0.9 : 0.6} />
            ))}
            {!open && (
              <G>
                <Rect x={n.x - 1.7} y={n.y - 0.4} width={3.4} height={2.9} rx={0.5} fill={INK} />
                <Path d={`M${n.x - 1} ${n.y - 0.3} v-0.9 a1 1 0 0 1 2 0 v0.9`} stroke={INK} strokeWidth={0.6} fill="none" />
              </G>
            )}
          </G>
        );
      })}
      <G>
        <Rect x={SHOP_POS.x - 7} y={SHOP_POS.y - 5} width={14} height={10} rx={1.3} fill={C.tomato} stroke={INK} strokeWidth={0.8} />
        <Path d={`M${SHOP_POS.x - 8.4} ${SHOP_POS.y - 4.2} L${SHOP_POS.x} ${SHOP_POS.y - 9.4} L${SHOP_POS.x + 8.4} ${SHOP_POS.y - 4.2} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={0.7} />
        {[-5, -1.7, 1.7, 5].map((dx, k) => (
          <Rect key={k} x={SHOP_POS.x + dx - 1.7} y={SHOP_POS.y - 5} width={1.7} height={1.9} fill={C.tomatoDark} />
        ))}
        <Circle cx={SHOP_POS.x} cy={SHOP_POS.y + 0.4} r={2.9} fill={C.cheese} stroke={INK} strokeWidth={0.5} />
        <Circle cx={SHOP_POS.x - 0.9} cy={SHOP_POS.y} r={0.6} fill={C.tomato} />
        <Circle cx={SHOP_POS.x + 1} cy={SHOP_POS.y + 1} r={0.6} fill={C.tomato} />
        <Rect x={SHOP_POS.x - 6} y={SHOP_POS.y + 5.6} width={12} height={4} rx={1.8} fill={C.tomatoDark} />
        <SvgText x={SHOP_POS.x} y={SHOP_POS.y + 8.6} fontSize={2.8} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
          Rosa’s
        </SvgText>
      </G>
    </G>
  );
});

/** Neighborhood name tags, drawn above the drivers so vans never cover them. */
const LabelLayer = memo(function LabelLayer({ unlockedKey, nextLockedIdx, nextLabel, nextColor, onPressHood }: StaticProps) {
  const unlocked = unlockedKey.split(',');
  return (
    <G>
      {NEIGHBORHOODS.map((n, i) => {
        const open = unlocked.includes(n.id);
        const isNext = i === nextLockedIdx;
        return (
          <G key={n.id} onPress={() => onPressHood(n.id)}>
            <Rect x={n.x - 10} y={n.y + HH + 0.6} width={20} height={open ? 4.6 : 8.4} rx={2.1} fill="#FFFFFF" stroke={INK} strokeWidth={0.45} />
            <SvgText x={n.x} y={n.y + HH + 3.9} fontSize={3} fontFamily={F.bold} fill={INK} textAnchor="middle">
              {n.name}
            </SvgText>
            {!open && (
              <SvgText x={n.x} y={n.y + HH + 7.6} fontSize={2.8} fontFamily={F.bold} fill={isNext ? nextColor : C.inkSoft} textAnchor="middle">
                {isNext ? nextLabel : '???'}
              </SvgText>
            )}
          </G>
        );
      })}
    </G>
  );
});

/** Where each neighborhood's "+$" pop floats: an open patch beside it, clear of labels and other pops. */
const POP_OFFSET: Record<NeighborhoodId, [number, number]> = {
  downtown: [-14, 0],
  suburbs: [-14, -1],
  waterfront: [15, -1],
  university: [15, 1],
  industrial: [-15, 1],
  uptown: [0, 15],
};
function popAnchor(id: NeighborhoodId, x: number, y: number) {
  const [dx, dy] = POP_OFFSET[id];
  return { x: x + dx, y: y + dy };
}

export function CityMap({ game, width, height, active, paused, onPressHood }: Props) {
  const clock = useClock(16, paused);
  const lastPhase = useRef<number[]>([]);
  const vehicle = VEHICLES[game.vehicle];
  const hoods = Game.unlockedDefs(game);
  const nextLockedIdx = NEIGHBORHOODS.findIndex((n) => !game.unlocked.includes(n.id));
  const next = NEIGHBORHOODS[nextLockedIdx];
  const lock = next ? Game.neighborhoodLock(game, next.id) : null;
  const affordable = !!next && !lock && game.cash >= next.unlockCost;
  const nextLabel = next ? (lock ? lock.replace('Needs a ', 'Need ') : money(next.unlockCost)) : '';
  const visibleDrivers = Math.min(game.drivers, 10);
  const capacity = Game.tripCapacity(game);

  const drivers: { x: number; y: number }[] = [];
  const pops: { x: number; y: number; t: number; text: string }[] = [];
  let payout = false;
  for (let i = 0; i < visibleDrivers; i++) {
    const hood = hoods[i % hoods.length];
    if (!active) {
      drivers.push({ x: SHOP_POS.x + 10 + (i % 4) * 3.2, y: SHOP_POS.y + 2 + Math.floor(i / 4) * 3.2 });
      continue;
    }
    const trip = Math.max(4, Math.min(14, Game.tripSeconds(hood.distance, game.vehicle)));
    const phase = ((clock + i * 1.37) % trip) / trip;
    const k = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    drivers.push({ x: SHOP_POS.x + (hood.x - SHOP_POS.x) * k, y: SHOP_POS.y + (hood.y - SHOP_POS.y) * k });
    // One cash pop per neighborhood: only the first driver on each route shows it.
    if (i < hoods.length) {
      if (phase >= 0.5 && phase < 0.72) pops.push({ ...popAnchor(hood.id, hood.x, hood.y), t: (phase - 0.5) / 0.22, text: `+${money(capacity * hood.orderValue)}` });
      const prev = lastPhase.current[i];
      if (prev !== undefined && prev < 0.5 && phase >= 0.5) payout = true;
      lastPhase.current[i] = phase;
    }
  }
  useEffect(() => {
    if (payout && !paused) emitPayout();
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`} preserveAspectRatio="xMidYMid meet">
      {affordable && next && <Circle cx={next.x} cy={next.y} r={10 + 1.2 * Math.sin(clock * 5)} fill={C.cheese} opacity={0.6} />}
      <StaticLayer
        unlockedKey={game.unlocked.join(',')}
        nextLockedIdx={nextLockedIdx}
        nextLabel={nextLabel}
        nextColor={affordable ? C.basilDark : C.tomato}
        onPressHood={onPressHood}
      />
      {drivers.map((d, i) => (
        <G key={`d${i}`}>
          <Circle cx={d.x} cy={d.y} r={2.6} fill="#FFFFFF" stroke={INK} strokeWidth={0.5} />
          <SvgText x={d.x} y={d.y + 1.1} fontSize={3.1} textAnchor="middle">
            {vehicle.emoji}
          </SvgText>
        </G>
      ))}
      <LabelLayer
        unlockedKey={game.unlocked.join(',')}
        nextLockedIdx={nextLockedIdx}
        nextLabel={nextLabel}
        nextColor={affordable ? C.basilDark : C.tomato}
        onPressHood={onPressHood}
      />
      {/* Pops sit above every driver and label so nothing covers them. */}
      {pops.map((p, i) => (
        <G key={`p${i}`} opacity={1 - p.t * p.t}>
          <SvgText x={p.x} y={p.y - p.t * 3.5} fontSize={5.2} fontFamily={F.bold} fill="#FFFFFF" stroke={C.basilDark} strokeWidth={1.4} textAnchor="middle">
            {p.text}
          </SvgText>
          <SvgText x={p.x} y={p.y - p.t * 3.5} fontSize={5.2} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
            {p.text}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}
