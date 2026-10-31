import { lotView } from './city-model';
import { LOOKS } from './scene/identity';
// City overview: every neighborhood and its pizzeria at a glance. Tap one to visit it (or build it).
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { MAP_VIEWBOX, NEIGHBORHOODS } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { C, F } from '../theme';

const INK = '#3B1F14';
const TREES = [
  // kept ≥ 8 units clear of every label card
  [2, 40], [42, 34], [60, 33], [44, 48], [58, 48], [93, 36], [96, 44], [3, 70], [9, 82], [48, 72], [57, 80], [38, 4], [6, 60],
];
const ROAD = '#D8CFC0';
// avenues between the rows of lots, and cross streets that stay clear of them
const ROADS: [number, number, number, number][] = [
  [-5, 28, 105, 28],
  [-5, 56.5, 105, 56.5],
  [34, -5, 34, 56.5],
  [66, -5, 66, 56.5],
  [51, 56.5, 51, 90],
];

/** A built lot: a tiny Rosa's storefront in the neighbourhood's wall colour, with a striped awning. */
/** A pizzeria pin in its own neighbourhood's colours (D365): facade, pilasters and awning from identity.ts. */
function MiniShop({ x, y, id, color }: { x: number; y: number; id: NeighborhoodId; color: string }) {
  const look = LOOKS[id];
  return (
    <G>
      <Rect x={x - 9} y={y - 5.5} width={18} height={12} rx={1.2} fill="rgba(59,31,20,0.25)" transform="translate(0 1)" />
      <Rect x={x - 9} y={y - 6.5} width={18} height={12.5} rx={1.2} fill={look.facade === 'clapboard' ? '#F7F3EA' : NEIGHBORHOODS.find((n) => n.id === id)!.wall} stroke={INK} strokeWidth={0.6} />
      <Rect x={x - 9} y={y - 6.5} width={2.2} height={12.5} fill={look.pilaster} stroke={INK} strokeWidth={0.3} />
      <Rect x={x + 6.8} y={y - 6.5} width={2.2} height={12.5} fill={look.pilaster} stroke={INK} strokeWidth={0.3} />
      <Rect x={x - 9.6} y={y - 8.5} width={19.2} height={3} rx={0.8} fill={color} stroke={INK} strokeWidth={0.5} />
      <SvgText x={x} y={y - 6.2} fontSize={2.2} fontFamily={F.bold} fill="#fff" textAnchor="middle">
        ROSA’S
      </SvgText>
      {Array.from({ length: 6 }).map((_, i) => (
        <Path key={i} d={`M${x - 9.6 + i * 3.2} ${y - 5.5} h3.2 l-0.2 1.6 q-1.4 1 -2.8 0 Z`} fill={i % 2 ? look.awning[1] : look.awning[0]} stroke={INK} strokeWidth={0.3} />
      ))}
      <Rect x={x - 7} y={y - 2} width={7} height={5} rx={0.6} fill="#BFE3F5" stroke={INK} strokeWidth={0.4} />
      <Path d={`M${x - 6} ${y + 2} h5`} stroke="#E8432E" strokeWidth={0.8} />
      <Rect x={x + 2} y={y - 2} width={4.5} height={8} rx={0.6} fill="#7E5038" stroke={INK} strokeWidth={0.4} />
      <Circle cx={x + 5.6} cy={y + 2} r={0.4} fill="#FFC531" />
    </G>
  );
}

/** A locked lot: a fenced construction site with a little crane. */
function BuildSite({ x, y, next }: { x: number; y: number; next: boolean }) {
  return (
    <G>
      <Rect x={x - 9} y={y - 5.5} width={18} height={12} rx={1} fill={next ? '#F3E3C2' : '#D9D0C4'} stroke={next ? C.cheeseDark : '#A3958B'} strokeWidth={0.6} strokeDasharray="1.4 1" />
      <Path d={`M${x - 6} ${y + 5} V${y - 8.5} M${x - 6} ${y - 8} H${x + 7} M${x + 5} ${y - 8} V${y - 4}`} stroke={next ? '#E0A100' : '#A3958B'} strokeWidth={0.9} fill="none" />
      <Path d={`M${x - 6} ${y - 10} L${x - 3} ${y - 5} M${x - 6} ${y - 5} L${x - 3} ${y - 8}`} stroke={next ? '#E0A100' : '#A3958B'} strokeWidth={0.4} />
      <Rect x={x + 3.6} y={y - 4} width={2.8} height={2} fill={next ? '#C8763A' : '#B5A99C'} />
      <Rect x={x - 1} y={y + 1} width={8} height={3} rx={0.5} fill={next ? '#C9A27A' : '#BDB2A6'} />
      {!next && (
        <G>
          <Rect x={x - 3.7} y={y - 0.4} width={3.4} height={2.9} rx={0.5} fill={INK} />
          <Path d={`M${x - 3} ${y - 0.3} v-0.9 a1 1 0 0 1 2 0 v0.9`} stroke={INK} strokeWidth={0.6} fill="none" />
        </G>
      )}
    </G>
  );
}

export function CityMap({ game, width, height, onPress }: { game: Game.GameState; width: number; height: number; onPress: (id: NeighborhoodId) => void }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`} preserveAspectRatio="xMidYMid meet">
      <Rect x={-50} y={-50} width={200} height={200} fill={C.map} />
      {ROADS.map(([x0, y0, x1, y1], i) => (
        <G key={i}>
          <Path d={`M${x0} ${y0} L${x1} ${y1}`} stroke="#C2B7A6" strokeWidth={5} />
          <Path d={`M${x0} ${y0} L${x1} ${y1}`} stroke={ROAD} strokeWidth={4.2} />
          <Path d={`M${x0} ${y0} L${x1} ${y1}`} stroke="#fff" strokeWidth={0.5} strokeDasharray="2 1.6" />
        </G>
      ))}
      <Path d={`M100 38 Q86 44 90 57 Q94 72 84 86 L150 126 L150 38 Z`} fill={C.water} />
      <Path d={`M100 38 Q86 44 90 57 Q94 72 84 86`} stroke="#D6F0FB" strokeWidth={0.8} fill="none" />
      <Rect x={89} y={66} width={8} height={1.8} fill="#A8714B" stroke={INK} strokeWidth={0.3} />
      {/* piazza with a fountain in the middle of town */}
      <Circle cx={50} cy={42} r={7} fill="#E9DCC8" stroke="#C9B79E" strokeWidth={0.6} />
      <Circle cx={50} cy={42} r={3.5} fill={C.water} stroke="#8FBFD8" strokeWidth={0.6} />
      <Circle cx={50} cy={42} r={1} fill="#FFFFFF" />
      {TREES.map(([x, y], i) => (
        <G key={i}>
          <Ellipse cx={x} cy={y + 2.6} rx={2.2} ry={0.7} fill="rgba(59,31,20,0.2)" />
          <Rect x={x - 0.35} y={y} width={0.7} height={2.6} fill="#7A4A26" />
          <Circle cx={x} cy={y - 0.6} r={2.2} fill="#4FA048" stroke={INK} strokeWidth={0.35} />
          <Circle cx={x - 0.7} cy={y - 1.3} r={0.9} fill="#86CF6E" />
        </G>
      ))}
      {NEIGHBORHOODS.map((n) => {
        const shop = game.shops[n.id];
        // D305: a lot held back by Nonna's takeover is a dim padlock with the countdown, not a live "Build $"
        const lot = lotView(game, n);
        const isNext = lot.kind === 'buildable';
        const active = game.active === n.id;
        const eps = Game.shopEarnings(game, n.id);
        return (
          <G key={n.id} onPress={() => onPress(n.id)} opacity={lot.dim ? 0.7 : 1}>
            {active && <Circle cx={n.x} cy={n.y} r={12} fill={C.cheese} opacity={0.55} />}
            {shop.built ? <MiniShop x={n.x} y={n.y} id={n.id} color={n.color} /> : <BuildSite x={n.x} y={n.y} next={isNext} />}
            <Rect x={n.x - 11} y={n.y + 8.5} width={22} height={8.5} rx={2.2} fill="rgba(59,31,20,0.25)" />
            <Rect x={n.x - 11} y={n.y + 7.5} width={22} height={8.5} rx={2.2} fill="#FFFFFF" stroke={isNext ? C.cheeseDark : INK} strokeWidth={0.45} />
            <SvgText x={n.x} y={n.y + 11} fontSize={3} fontFamily={F.bold} fill={INK} textAnchor="middle">
              {n.name}
            </SvgText>
            <SvgText x={n.x} y={n.y + 14.6} fontSize={2.8} fontFamily={F.bold} fill={shop.built ? (shop.managed ? C.basilDark : C.tomato) : isNext ? C.tomato : C.inkSoft} textAnchor="middle">
              {shop.built ? (shop.managed ? `${money(eps)}/s` : 'needs manager') : lot.pin}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
