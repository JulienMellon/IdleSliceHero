import { useState } from 'react';
import { lotView } from './city-model';
import { LOOKS } from './scene/identity';
// City overview: every neighborhood and its pizzeria at a glance. Tap one to visit it (or build it).
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { cityOf, hoodIds } from '../content/cities';
import { HOME_CITY } from '../content/cities/home';
import { MAP_VIEWBOX } from '../content/tuning';
import type { NeighborhoodId } from '../content/types';
import { money } from '../engine/format';
import * as Game from '../engine/game';
import { canFranchise } from '../engine/features/franchise';
import { C, F } from '../theme';
import { attackLite } from './endgame/attack-model';
import { pipBits, showPips, starPips } from './endgame/mastery-model';
import { MapStars } from './endgame/star-pips';
import { FranchiseFlow } from './franchise/flow';
import { lotLabel } from './franchise/franchise-model';
import { OPEN_LOT, mapArtFor } from './franchise/map-art';

const INK = '#3B1F14';
/** D463: the bottom row's label cards have a third row of stars now: the view is this much taller, so the list panel below never cuts them. */
const MAP_PAD_BOTTOM = 8;
const ROAD = '#D8CFC0';

/** A built lot: a tiny Rosa's storefront in the neighbourhood's wall colour, with a striped awning. */
/** A pizzeria pin in its own neighbourhood's colours (D365): facade, pilasters and awning from identity.ts. */
function MiniShop({ x, y, id, color, wall, lookId }: { x: number; y: number; id: NeighborhoodId; color: string; wall: string; lookId: NeighborhoodId }) {
  const look = LOOKS[lookId] ?? LOOKS[id];
  return (
    <G>
      <Rect x={x - 9} y={y - 5.5} width={18} height={12} rx={1.2} fill="rgba(59,31,20,0.25)" transform="translate(0 1)" />
      <Rect x={x - 9} y={y - 6.5} width={18} height={12.5} rx={1.2} fill={look.facade === 'clapboard' ? '#F7F3EA' : wall} stroke={INK} strokeWidth={0.6} />
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

const BOSTON = OPEN_LOT;

/** Fenway's block in the open lot: a green field, the diamond inside it and a light tower at each corner. */
function Ballpark({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 10} y={y - 6} width={20} height={13} rx={1.6} fill="#7FBF6A" stroke={INK} strokeWidth={0.5} />
      <Path d={`M${x} ${y + 5} L${x + 5.5} ${y} L${x} ${y - 5} L${x - 5.5} ${y} Z`} fill="#E5C79A" stroke="#FFFFFF" strokeWidth={0.4} />
      <Circle cx={x} cy={y} r={1.1} fill="#7FBF6A" />
      {[[-10, -6], [10, -6], [-10, 7], [10, 7]].map(([dx, dy]) => (
        <Circle key={`${dx}${dy}`} cx={x + dx} cy={y + dy} r={1.3} fill="#FFF4C2" stroke={INK} strokeWidth={0.3} />
      ))}
    </G>
  );
}

/** The lot for the next city (v5.18): the "Coming soon: Boston" card is the franchise offer now. Its label is the model's, two lines: "Franchise" and the city. */
function FranchiseLot({ label, onPress }: { label: [string, string]; onPress: () => void }) {
  const { x, y } = BOSTON;
  return (
    <G testID="city-boston" onPress={onPress} opacity={0.95}>
      <BuildSite x={x} y={y} next />
      <Rect x={x - 11} y={y + 8.5} width={22} height={8.5} rx={2.2} fill="rgba(59,31,20,0.25)" />
      <Rect x={x - 11} y={y + 7.5} width={22} height={8.5} rx={2.2} fill="#FFFFFF" stroke={C.cheeseDark} strokeWidth={0.6} />
      <SvgText x={x} y={y + 11} fontSize={3} fontFamily={F.bold} fill={INK} textAnchor="middle">
        {label[1]}
      </SvgText>
      <SvgText x={x} y={y + 14.6} fontSize={2.8} fontFamily={F.bold} fill={C.tomato} textAnchor="middle">
        {label[0]}
      </SvgText>
    </G>
  );
}

export function CityMap({ game, width, height, onPress, onFranchised }: { game: Game.GameState; width: number; height: number; onPress: (id: NeighborhoodId) => void; /** The franchise went through: the screen leaves the old city. */ onFranchised?: () => void }) {
  // v5.15: the shop under attack is marked; Boston's card opens from its locked tile
  const attack = attackLite(game);
  const attacked = attack.face === 'banner' || attack.face === 'running' ? attack.shopId : null;
  const [flow, setFlow] = useState(false);
  const city = cityOf(game);
  const ids = hoodIds(city);
  const franchiseLabel = lotLabel(game);
  const art = mapArtFor(city.id);
  const offered = !!franchiseLabel && canFranchise(game);
  return (
    <>
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h + MAP_PAD_BOTTOM}`} preserveAspectRatio="xMidYMid meet">
      <Rect x={-50} y={-50} width={200} height={200} fill={art.ground} />
      {art.river && (
        <G>
          <Path d={art.river.d} stroke="#4F8FB8" strokeWidth={5.4} fill="none" />
          <Path d={art.river.d} stroke={art.river.color} strokeWidth={4.4} fill="none" />
        </G>
      )}
      {art.roads.map(([x0, y0, x1, y1], i) => (
        <G key={i}>
          <Path d={`M${x0} ${y0} L${x1} ${y1}`} stroke="#C2B7A6" strokeWidth={5} />
          <Path d={`M${x0} ${y0} L${x1} ${y1}`} stroke={ROAD} strokeWidth={4.2} />
          <Path d={`M${x0} ${y0} L${x1} ${y1}`} stroke="#fff" strokeWidth={0.5} strokeDasharray="2 1.6" />
        </G>
      ))}
      <Path d={art.water.d} fill={art.water.color} />
      <Path d={art.water.rim} stroke="#D6F0FB" strokeWidth={0.8} fill="none" />
      <Rect x={89} y={66} width={8} height={1.8} fill="#A8714B" stroke={INK} strokeWidth={0.3} />
      {art.centre === 'piazza' ? (
        <G>
          {/* piazza with a fountain in the middle of town */}
          <Circle cx={50} cy={42} r={7} fill="#E9DCC8" stroke="#C9B79E" strokeWidth={0.6} />
          <Circle cx={50} cy={42} r={3.5} fill={C.water} stroke="#8FBFD8" strokeWidth={0.6} />
          <Circle cx={50} cy={42} r={1} fill="#FFFFFF" />
        </G>
      ) : (
        <G>
          {/* the Common: a lawn with crossing paths and the Frog Pond */}
          <Circle cx={50} cy={42} r={8} fill="#9ED08A" stroke="#6FA25F" strokeWidth={0.6} />
          <Path d="M43 42 L57 42 M50 35 L50 49" stroke="#E9DCC8" strokeWidth={1.1} />
          <Ellipse cx={50} cy={42} rx={3.2} ry={2.4} fill={art.water.color} stroke="#8FBFD8" strokeWidth={0.5} />
        </G>
      )}
      {art.trees.map(([x, y], i) => (
        <G key={i}>
          <Ellipse cx={x} cy={y + 2.6} rx={2.2} ry={0.7} fill="rgba(59,31,20,0.2)" />
          <Rect x={x - 0.35} y={y} width={0.7} height={2.6} fill="#7A4A26" />
          <Circle cx={x} cy={y - 0.6} r={2.2} fill="#4FA048" stroke={INK} strokeWidth={0.35} />
          <Circle cx={x - 0.7} cy={y - 1.3} r={0.9} fill="#86CF6E" />
        </G>
      ))}
      {art.landmark === 'ballpark' && !offered && <Ballpark x={OPEN_LOT.x} y={OPEN_LOT.y} />}
      {city.neighbourhoods.map((n) => {
        const shop = game.shops[n.id];
        // D305: a lot held back by Nonna's takeover is a dim padlock with the countdown, not a live "Build $"
        const lot = lotView(game, n);
        const isNext = lot.kind === 'buildable';
        const active = game.active === n.id;
        const eps = Game.shopEarnings(game, n.id);
        // D464: no stars until the first head is hired
        const pips = shop.built && showPips(shop);
        return (
          <G key={n.id} onPress={() => onPress(n.id)} opacity={lot.dim ? 0.7 : 1}>
            {active && <Circle cx={n.x} cy={n.y} r={12} fill={C.cheese} opacity={0.55} />}
            {attacked === n.id && <Circle testID={`city-attack-${n.id}`} cx={n.x} cy={n.y} r={12} fill="none" stroke={C.tomato} strokeWidth={0.9} strokeDasharray="2 1.4" />}
            {shop.built ? <MiniShop x={n.x} y={n.y} id={n.id} color={n.color} wall={n.wall} lookId={HOME_CITY.neighbourhoods[ids.indexOf(n.id)]?.id ?? n.id} /> : <BuildSite x={n.x} y={n.y} next={isNext} />}
            {attacked === n.id && (
              <G>
                <Circle cx={n.x + 9.5} cy={n.y - 8} r={2.8} fill={C.tomato} stroke="#fff" strokeWidth={0.5} />
                <SvgText x={n.x + 9.5} y={n.y - 6.9} fontSize={3.6} fontFamily={F.bold} fill="#fff" textAnchor="middle">
                  !
                </SvgText>
              </G>
            )}
            {/* a built pizzeria's card has a third row: its three mastery stars (heads, Flagship, golden ovens) */}
            <Rect x={n.x - 11} y={n.y + 8.5} width={22} height={pips ? 11.5 : 8.5} rx={2.2} fill="rgba(59,31,20,0.25)" />
            <Rect x={n.x - 11} y={n.y + 7.5} width={22} height={pips ? 11.5 : 8.5} rx={2.2} fill="#FFFFFF" stroke={attacked === n.id ? C.tomato : isNext ? C.cheeseDark : INK} strokeWidth={attacked === n.id ? 0.8 : 0.45} />
            {pips && <MapStars x={n.x} y={n.y + 16.9} bits={pipBits(starPips(shop, city))} r={1.8} />}
            <SvgText x={n.x} y={n.y + 11} fontSize={3} fontFamily={F.bold} fill={INK} textAnchor="middle">
              {n.name}
            </SvgText>
            <SvgText x={n.x} y={n.y + 14.6} fontSize={2.8} fontFamily={F.bold} fill={shop.built ? (shop.managed ? C.basilDark : C.tomato) : isNext ? C.tomato : C.inkSoft} textAnchor="middle">
              {shop.built ? (shop.managed ? `${money(eps)}/s` : 'needs manager') : lot.pin}
            </SvgText>
          </G>
        );
      })}
      {franchiseLabel && offered && <FranchiseLot label={franchiseLabel} onPress={() => setFlow(true)} />}
    </Svg>
    {flow && <FranchiseFlow game={game} onClose={() => setFlow(false)} onDone={() => { setFlow(false); onFranchised?.(); }} />}
    </>
  );
}
