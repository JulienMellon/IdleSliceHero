// Top-down city map: neighborhoods light up when unlocked; drivers ride the routes.
// Owns its own ~16 fps animation clock so the rest of the screen doesn't re-render with it.
import { useEffect, useState } from 'react';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { MAP_VIEWBOX, NEIGHBORHOODS, SHOP_POS, VEHICLES } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';

const INK = '#3B1F14';
const S = 0.85; // node scale

interface Props {
  game: Game.GameState;
  width: number;
  height: number;
  /** True while pizzas are flowing (drivers out on routes). */
  active: boolean;
  onPressHood: (id: NeighborhoodId) => void;
}

const TREES = [
  [6, 26], [34, 22], [66, 22], [94, 30], [6, 70], [40, 68], [60, 48], [92, 44], [36, 46], [64, 30], [8, 46], [50, 64],
];

function useClock(fps: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setT((Date.now() - start) / 1000), 1000 / fps);
    return () => clearInterval(id);
  }, [fps]);
  return t;
}

export function CityMap({ game, width, height, active, onPressHood }: Props) {
  const clock = useClock(16);
  const vehicle = VEHICLES[game.vehicle];
  const hoods = Game.unlockedDefs(game);
  const nextLockedIdx = NEIGHBORHOODS.findIndex((n) => !game.unlocked.includes(n.id));
  const visibleDrivers = Math.min(game.drivers, 10);
  const { w: VW, h: VH } = MAP_VIEWBOX;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet">
      {/* ground, river */}
      <Rect x={-50} y={-50} width={VW + 100} height={VH + 100} fill={C.map} />
      <Path d={`M${VW} 34 Q86 40 90 52 Q94 66 84 ${VH + 2} L${VW + 50} ${VH + 50} L${VW + 50} 34 Z`} fill={C.water} />
      <Path d={`M${VW} 38 Q90 44 93 54`} stroke="#B7E4F7" strokeWidth={0.6} fill="none" />
      {TREES.map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={2} fill="#5DAE4B" />
          <Circle cx={x - 0.7} cy={y - 0.7} r={0.8} fill="#86CF6E" />
        </G>
      ))}

      {/* roads */}
      {NEIGHBORHOODS.map((n) => {
        const open = game.unlocked.includes(n.id);
        return (
          <G key={`road-${n.id}`}>
            <Line x1={SHOP_POS.x} y1={SHOP_POS.y} x2={n.x} y2={n.y} stroke={open ? '#FFFFFF' : '#D5CCBF'} strokeWidth={3.6} strokeLinecap="round" />
            <Line x1={SHOP_POS.x} y1={SHOP_POS.y} x2={n.x} y2={n.y} stroke={open ? C.road : '#C9BCB2'} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={open ? '2 1.4' : '0.7 1.8'} />
          </G>
        );
      })}

      {/* neighborhoods */}
      {NEIGHBORHOODS.map((n, i) => {
        const open = game.unlocked.includes(n.id);
        const isNext = i === nextLockedIdx;
        const lock = Game.neighborhoodLock(game, n.id);
        const affordable = isNext && !lock && game.cash >= n.unlockCost;
        const fill = open ? n.color : C.locked;
        const hw = 9 * S, hh = 7 * S;
        return (
          <G key={n.id} onPress={() => onPressHood(n.id)}>
            {affordable && <Circle cx={n.x} cy={n.y} r={10 + 1.2 * Math.sin(clock * 5)} fill={C.cheese} opacity={0.6} />}
            <Rect x={n.x - hw} y={n.y - hh} width={hw * 2} height={hh * 2} rx={3} fill={fill} stroke={INK} strokeWidth={0.7} />
            {[-4.2, 0, 4.2].map((dx, k) => (
              <Rect key={k} x={n.x + dx - 1.7} y={n.y - 3.4 - (k === 1 ? 1.7 : 0)} width={3.4} height={5.1 + (k === 1 ? 1.7 : 0)} fill={open ? '#FFFFFF' : '#E3DAD2'} stroke={INK} strokeWidth={0.35} opacity={open ? 0.9 : 0.6} />
            ))}
            {!open && (
              <G>
                <Rect x={n.x - 1.7} y={n.y - 0.4} width={3.4} height={2.9} rx={0.5} fill={INK} />
                <Path d={`M${n.x - 1} ${n.y - 0.3} v-0.9 a1 1 0 0 1 2 0 v0.9`} stroke={INK} strokeWidth={0.6} fill="none" />
              </G>
            )}
            <Rect x={n.x - 10} y={n.y + hh + 0.6} width={20} height={open ? 4.6 : 8.4} rx={2.1} fill="#FFFFFF" stroke={INK} strokeWidth={0.45} />
            <SvgText x={n.x} y={n.y + hh + 3.9} fontSize={3} fontFamily={F.bold} fill={INK} textAnchor="middle">
              {n.name}
            </SvgText>
            {!open && (
              <SvgText x={n.x} y={n.y + hh + 7.6} fontSize={2.8} fontFamily={F.bold} fill={affordable ? C.basilDark : isNext ? C.tomato : C.inkSoft} textAnchor="middle">
                {isNext ? (lock ? lock.replace('Needs a ', 'Need ') : money(n.unlockCost)) : '???'}
              </SvgText>
            )}
          </G>
        );
      })}

      {/* the shop */}
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

      {/* drivers */}
      {Array.from({ length: visibleDrivers }).map((_, i) => {
        const hood = hoods[i % hoods.length];
        // Parked drivers line up to the right of the shop.
        let x = SHOP_POS.x + 10 + (i % 4) * 3.2;
        let y = SHOP_POS.y + 2 + Math.floor(i / 4) * 3.2;
        let pop: number | null = null;
        if (active) {
          const trip = Math.max(4, Math.min(14, Game.tripSeconds(hood.distance, game.vehicle)));
          const phase = ((clock + i * 1.37) % trip) / trip;
          const k = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
          x = SHOP_POS.x + (hood.x - SHOP_POS.x) * k;
          y = SHOP_POS.y + (hood.y - SHOP_POS.y) * k;
          // One cash pop per neighborhood: only the first driver on each route shows it.
          if (i < hoods.length && phase >= 0.5 && phase < 0.72) pop = (phase - 0.5) / 0.22;
        }
        return (
          <G key={`d${i}`}>
            {pop !== null && (
              <G opacity={1 - pop * pop}>
                <SvgText x={hood.x} y={hood.y - 1 - pop * 6} fontSize={5.2} fontFamily={F.bold} fill="#FFFFFF" stroke={C.basilDark} strokeWidth={1.4} textAnchor="middle">
                  {`+${money(Game.tripCapacity(game) * hood.orderValue)}`}
                </SvgText>
                <SvgText x={hood.x} y={hood.y - 1 - pop * 6} fontSize={5.2} fontFamily={F.bold} fill="#FFFFFF" textAnchor="middle">
                  {`+${money(Game.tripCapacity(game) * hood.orderValue)}`}
                </SvgText>
              </G>
            )}
            <Circle cx={x} cy={y} r={2.6} fill="#FFFFFF" stroke={INK} strokeWidth={0.5} />
            <SvgText x={x} y={y + 1.1} fontSize={3.1} textAnchor="middle">
              {vehicle.emoji}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
