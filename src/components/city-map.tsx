// City overview: every neighborhood and its pizzeria at a glance. Tap one to visit it (or build it).
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { MAP_VIEWBOX, NEIGHBORHOODS } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';

const INK = '#3B1F14';
const TREES = [
  [6, 26], [34, 24], [66, 24], [94, 30], [6, 70], [52, 70], [92, 44], [40, 44], [8, 48], [60, 26], [96, 22], [62, 46],
];

export function CityMap({ game, width, height, onPress }: { game: Game.GameState; width: number; height: number; onPress: (id: NeighborhoodId) => void }) {
  const next = Game.nextToBuild(game);
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`} preserveAspectRatio="xMidYMid meet">
      <Rect x={-50} y={-50} width={200} height={200} fill={C.map} />
      <Path d={`M100 34 Q86 40 90 52 Q94 66 84 78 L150 126 L150 34 Z`} fill={C.water} />
      {/* Piazza with a fountain in the middle of town */}
      <Circle cx={56} cy={42} r={8} fill="#E9DCC8" stroke="#C9B79E" strokeWidth={0.6} />
      <Circle cx={56} cy={42} r={3.5} fill={C.water} stroke="#8FBFD8" strokeWidth={0.6} />
      <Circle cx={56} cy={42} r={1} fill="#FFFFFF" />
      {TREES.map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={2} fill="#5DAE4B" />
          <Circle cx={x - 0.7} cy={y - 0.7} r={0.8} fill="#86CF6E" />
        </G>
      ))}
      {NEIGHBORHOODS.map((n) => {
        const shop = game.shops[n.id];
        const isNext = next?.id === n.id;
        const active = game.active === n.id;
        const eps = Game.shopEarnings(game, n.id);
        return (
          <G key={n.id} onPress={() => onPress(n.id)}>
            {active && <Circle cx={n.x} cy={n.y} r={10.5} fill={C.cheese} opacity={0.6} />}
            <Rect x={n.x - 9} y={n.y - 6.5} width={18} height={13} rx={3} fill={shop.built ? n.color : C.locked} stroke={INK} strokeWidth={0.7} />
            {[-6, 6].map((dx) => (
              <Rect key={dx} x={n.x + dx - 1.6} y={n.y - 4} width={3.2} height={7} fill={shop.built ? '#FFFFFF' : '#E3DAD2'} stroke={INK} strokeWidth={0.3} opacity={0.85} />
            ))}
            {shop.built ? (
              <G>
                <Rect x={n.x - 4.5} y={n.y - 3} width={9} height={8} rx={1} fill={C.tomato} stroke={INK} strokeWidth={0.6} />
                <Path d={`M${n.x - 5.5} ${n.y - 2.5} L${n.x} ${n.y - 6.5} L${n.x + 5.5} ${n.y - 2.5} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={0.5} />
                <Circle cx={n.x} cy={n.y + 1} r={1.8} fill={C.cheese} />
              </G>
            ) : (
              <G>
                <Rect x={n.x - 1.7} y={n.y - 0.4} width={3.4} height={2.9} rx={0.5} fill={INK} />
                <Path d={`M${n.x - 1} ${n.y - 0.3} v-0.9 a1 1 0 0 1 2 0 v0.9`} stroke={INK} strokeWidth={0.6} fill="none" />
              </G>
            )}
            <Rect x={n.x - 11} y={n.y + 7.5} width={22} height={8.5} rx={2.2} fill="#FFFFFF" stroke={INK} strokeWidth={0.45} />
            <SvgText x={n.x} y={n.y + 11} fontSize={3} fontFamily={F.bold} fill={INK} textAnchor="middle">
              {n.name}
            </SvgText>
            <SvgText x={n.x} y={n.y + 14.6} fontSize={2.8} fontFamily={F.bold} fill={shop.built ? (shop.managed ? C.basilDark : C.tomato) : isNext ? C.tomato : C.inkSoft} textAnchor="middle">
              {shop.built ? (shop.managed ? `${money(eps)}/s` : 'needs manager') : isNext ? `Build ${money(n.buildCost)}` : '???'}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
