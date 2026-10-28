// Top-down city map: neighborhoods light up when unlocked; drivers ride the routes.
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { NEIGHBORHOODS, SHOP_POS, VEHICLES } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';

const INK = '#3B1F14';

interface Props {
  game: Game.GameState;
  width: number;
  height: number;
  /** Seconds, drives the cosmetic driver animation. */
  clock: number;
  /** True while pizzas are flowing (drivers out on routes). */
  active: boolean;
  onPressHood: (id: NeighborhoodId) => void;
}

const TREE_SPOTS = [
  [8, 50], [34, 12], [66, 16], [92, 56], [8, 92], [36, 88], [64, 92], [92, 94], [30, 46], [70, 50], [62, 34], [38, 30],
];

export function CityMap({ game, width, height, clock, active, onPressHood }: Props) {
  const vehicle = VEHICLES[game.vehicle];
  const hoods = Game.unlockedDefs(game);
  const nextLockedIdx = NEIGHBORHOODS.findIndex((n) => !game.unlocked.includes(n.id));
  const visibleDrivers = Math.min(game.drivers, 10);

  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      {/* ground, river, park */}
      <Rect x={0} y={0} width={100} height={100} fill={C.map} />
      <Path d="M100 62 Q80 70 70 88 Q66 96 60 100 L100 100 Z" fill={C.water} />
      {TREE_SPOTS.map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={2.2} fill="#5DAE4B" />
          <Circle cx={x - 0.8} cy={y - 0.8} r={0.9} fill="#86CF6E" />
        </G>
      ))}

      {/* roads */}
      {NEIGHBORHOODS.map((n) => {
        const open = game.unlocked.includes(n.id);
        return (
          <G key={`road-${n.id}`}>
            <Line x1={SHOP_POS.x} y1={SHOP_POS.y} x2={n.x} y2={n.y} stroke={open ? '#FFFFFF' : '#D5CCBF'} strokeWidth={4.2} strokeLinecap="round" />
            <Line
              x1={SHOP_POS.x}
              y1={SHOP_POS.y}
              x2={n.x}
              y2={n.y}
              stroke={open ? C.road : '#C9BCB2'}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={open ? '2 1.6' : '0.8 2'}
            />
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
        return (
          <G key={n.id} onPress={() => onPressHood(n.id)}>
            {affordable && <Circle cx={n.x} cy={n.y} r={11 + 1.2 * Math.sin(clock * 5)} fill={C.cheese} opacity={0.55} />}
            <Rect x={n.x - 9} y={n.y - 7} width={18} height={14} rx={3.5} fill={fill} stroke={INK} strokeWidth={0.8} />
            {/* little buildings */}
            {[-5, 0, 5].map((dx, k) => (
              <Rect
                key={k}
                x={n.x + dx - 2}
                y={n.y - 4 - (k === 1 ? 2 : 0)}
                width={4}
                height={6 + (k === 1 ? 2 : 0)}
                fill={open ? '#FFFFFF' : '#E3DAD2'}
                stroke={INK}
                strokeWidth={0.4}
                opacity={open ? 0.9 : 0.6}
              />
            ))}
            {!open && (
              <G>
                <Rect x={n.x - 2} y={n.y - 0.5} width={4} height={3.4} rx={0.6} fill={INK} />
                <Path d={`M${n.x - 1.2} ${n.y - 0.4} v-1 a1.2 1.2 0 0 1 2.4 0 v1`} stroke={INK} strokeWidth={0.7} fill="none" />
              </G>
            )}
            <Rect x={n.x - 11} y={n.y + 7.5} width={22} height={open ? 5.4 : 9.6} rx={2.4} fill="#FFFFFF" stroke={INK} strokeWidth={0.5} opacity={0.95} />
            <SvgText x={n.x} y={n.y + 11.4} fontSize={3.4} fontFamily={F.bold} fill={INK} textAnchor="middle">
              {n.name}
            </SvgText>
            {!open && (
              <SvgText x={n.x} y={n.y + 15.6} fontSize={3.2} fontFamily={F.bold} fill={affordable ? C.basilDark : isNext ? C.tomato : C.inkSoft} textAnchor="middle">
                {isNext ? (lock && lock !== 'Unlocked' ? lock.replace('Needs a ', 'Need ') : money(n.unlockCost)) : '???'}
              </SvgText>
            )}
          </G>
        );
      })}

      {/* the shop */}
      <G>
        <Rect x={SHOP_POS.x - 8} y={SHOP_POS.y - 6} width={16} height={12} rx={1.5} fill={C.tomato} stroke={INK} strokeWidth={0.9} />
        <Path d={`M${SHOP_POS.x - 9.5} ${SHOP_POS.y - 5} L${SHOP_POS.x} ${SHOP_POS.y - 11} L${SHOP_POS.x + 9.5} ${SHOP_POS.y - 5} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={0.8} />
        {[-6, -2, 2, 6].map((dx, k) => (
          <Rect key={k} x={SHOP_POS.x + dx - 2} y={SHOP_POS.y - 6} width={2} height={2.2} fill={C.tomatoDark} />
        ))}
        <Circle cx={SHOP_POS.x} cy={SHOP_POS.y + 0.5} r={3.4} fill={C.cheese} stroke={INK} strokeWidth={0.6} />
        <Circle cx={SHOP_POS.x - 1} cy={SHOP_POS.y} r={0.7} fill={C.tomato} />
        <Circle cx={SHOP_POS.x + 1.2} cy={SHOP_POS.y + 1.2} r={0.7} fill={C.tomato} />
        <SvgText x={SHOP_POS.x} y={SHOP_POS.y + 10} fontSize={3.4} fontFamily={F.bold} fill={INK} textAnchor="middle">
          Rosa’s
        </SvgText>
      </G>

      {/* drivers */}
      {Array.from({ length: visibleDrivers }).map((_, i) => {
        const hood = hoods[i % hoods.length];
        let x = SHOP_POS.x + ((i % 3) - 1) * 3;
        let y = SHOP_POS.y + 4;
        let pop: { x: number; y: number; t: number } | null = null;
        if (active) {
          const trip = Math.max(4, Math.min(14, Game.tripSeconds(hood.distance, game.vehicle)));
          const phase = ((clock + i * 1.37) % trip) / trip;
          const k = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
          x = SHOP_POS.x + (hood.x - SHOP_POS.x) * k;
          y = SHOP_POS.y + (hood.y - SHOP_POS.y) * k;
          if (phase >= 0.5 && phase < 0.68) pop = { x: hood.x, y: hood.y - 9, t: (phase - 0.5) / 0.18 };
        }
        return (
          <G key={`d${i}`}>
            {pop && (
              <SvgText x={pop.x} y={pop.y - pop.t * 6} fontSize={4.2} fontFamily={F.bold} fill={C.basilDark} stroke="#FFFFFF" strokeWidth={0.6} textAnchor="middle" opacity={1 - pop.t}>
                {`+${money(Game.tripCapacity(game) * hood.orderValue)}`}
              </SvgText>
            )}
            <Circle cx={x} cy={y} r={3} fill="#FFFFFF" stroke={INK} strokeWidth={0.6} />
            <SvgText x={x} y={y + 1.3} fontSize={3.6} textAnchor="middle">
              {vehicle.emoji}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
