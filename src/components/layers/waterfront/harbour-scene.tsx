// Waterfront in the shop scene (SCENE_OVERLAYS slot): the boat in the harbour backdrop and the warming rack by the counter.
//  - the boat sails in from the left over the 4 s before it docks, stays moored while the crew orders (30 s), and sails out;
//    the shop's side wall hides the part of it that is behind the wall (clip at the room's left front corner)
//  - the rack stands on the back wall right of the counter, four trays that fill with pies in four steps; nothing before tier 1
import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Circle, Path, Rect } from 'react-native-svg';

import { BOATS } from '../../../content/layers';
import { boatsView } from '../../../engine/features/layers/waterfront-boats';
import { useGame } from '../../../store/game-store';
import { useClock } from '../../scene/clock';
import { INK, P, sceneFit } from '../../scene/projection';
import type { SceneSlotProps } from '../../slots';
import { layoutOfShop } from '../shop-layout';
import { BOAT, BOAT_ART, RACK_STEPS, RACK_W, boatDock, boatPose, rackBox, rackStep, untilNextBoat } from './boats-model';

/** The boat, drawn at the origin on its waterline, bow to the left; the scene mirrors it so the bow leads (it sails in from the left). */
const BoatArt = memo(function BoatArt({ docked }: { docked: boolean }) {
  return (
    <G>
      <Path d="M-27 4 q13 5 27 5 t27 -5" stroke="#D6F0FB" strokeWidth={1.6} fill="none" opacity={0.9} />
      <Path d="M-27 -10 L27 -10 L21 3 L-21 3 Z" fill="#B23A48" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <Rect x={-27} y={-13} width={54} height={4} fill="#F4F1EC" stroke={INK} strokeWidth={1} />
      <Rect x={-8} y={-27} width={22} height={14} rx={2} fill="#F4F1EC" stroke={INK} strokeWidth={1.1} />
      <Rect x={-4} y={-24} width={5} height={6} fill="#7CC8EE" stroke={INK} strokeWidth={0.6} />
      <Rect x={5} y={-24} width={5} height={6} fill="#7CC8EE" stroke={INK} strokeWidth={0.6} />
      <Rect x={4} y={-36} width={6} height={10} fill="#D9443A" stroke={INK} strokeWidth={1} />
      <Rect x={-20} y={-36} width={2} height={26} fill="#7A4A26" />
      <Path d="M-18 -36 L-6 -32 L-18 -28 Z" fill="#FFC531" stroke={INK} strokeWidth={0.8} />
      {docked && (
        <G>
          <Circle cx={8} cy={-42} r={3.4} fill="#ECEAE6" opacity={0.8} />
          <Circle cx={13} cy={-48} r={4.4} fill="#ECEAE6" opacity={0.55} />
        </G>
      )}
    </G>
  );
});

/** Four trays on two posts; tray 1 is the bottom one. `step` trays hold a pie. */
const RackArt = memo(function RackArt({ step, tier }: { step: number; tier: number }) {
  const w = RACK_W * (0.8 + tier * 0.1);
  const trayH = 9;
  return (
    <G>
      <Rect x={-w / 2} y={-RACK_STEPS * trayH - 4} width={w} height={RACK_STEPS * trayH + 4} rx={2} fill="#E9E4DC" stroke={INK} strokeWidth={1.1} />
      {Array.from({ length: RACK_STEPS }).map((_, i) => {
        const y = -(i + 1) * trayH;
        const lit = i < step;
        return (
          <G key={i}>
            <Rect x={-w / 2 + 2} y={y + 1} width={w - 4} height={trayH - 2} fill={lit ? '#FFE9A8' : '#CFC8BD'} />
            <Path d={`M${-w / 2 + 2} ${y + trayH - 1} h${w - 4}`} stroke="#8E979E" strokeWidth={1.2} />
            {lit && (
              <G>
                <Circle cx={-w / 4} cy={y + trayH / 2} r={3} fill="#E8432E" stroke={INK} strokeWidth={0.7} />
                <Circle cx={0} cy={y + trayH / 2} r={3} fill="#E8432E" stroke={INK} strokeWidth={0.7} />
                <Circle cx={w / 4} cy={y + trayH / 2} r={3} fill="#E8432E" stroke={INK} strokeWidth={0.7} />
              </G>
            )}
          </G>
        );
      })}
      <Rect x={-w / 2 - 1} y={-2} width={3} height={4} fill="#6E757B" />
      <Rect x={w / 2 - 2} y={-2} width={3} height={4} fill="#6E757B" />
    </G>
  );
});

export const HarbourScene = memo(function HarbourScene({ shopId, width, height }: SceneSlotProps) {
  // Reads the live store on its own clock while the boat moves: React Compiler must not cache that.
  'use no memo';
  const here = shopId === BOATS.hood;
  // the rack's look: tier and fill step, two numbers in one (a repaint only when a step changes)
  const rackKey = useGame((s) => {
    if (!here) return 0;
    const v = boatsView(s.game, Date.now());
    return v.rackTier * 10 + rackStep(v.rackPies, v.rackCapacity);
  });
  // the boat: docked, or sailing within BOAT.sailIn / sailOut seconds of it
  const docked = useGame((s) => here && boatsView(s.game, Date.now()).boat);
  const nearDock = useGame((s) => here && s.game.shops[BOATS.hood].built && untilNextBoat(s.game, 0) <= BOAT.sailIn + 1);
  const [leftAt, setLeftAt] = useState<number | null>(null);
  const was = useRef(docked);
  useEffect(() => {
    if (was.current && !docked) {
      setLeftAt(Date.now());
      const t = setTimeout(() => setLeftAt(null), BOAT.sailOut * 1000 + 200);
      was.current = docked;
      return () => clearTimeout(t);
    }
    was.current = docked;
  }, [docked]);
  const moving = nearDock || leftAt !== null;
  const clock = useClock(15, !moving);
  void clock;
  if (!here) return null;
  const st = useGame.getState();
  const g = st.game;
  const shop = g.shops[BOATS.hood];
  if (!shop.built) return null;
  const lay = layoutOfShop(shop);
  const fit = sceneFit(width, height);
  const wallLeft = P(lay.L, 0)[0];
  const sinceTick = Math.max(0, (Date.now() - st.tickAt) / 1000);
  const pose = boatPose({ active: true, docked, untilNext: untilNextBoat(g, sinceTick) }, leftAt === null ? -1 : (Date.now() - leftAt) / 1000);
  const dock = boatDock(wallLeft);
  // sails in from beyond the left edge (and out the same way)
  const boatX = dock.x - (1 - pose.along) * (dock.x + BOAT_ART.half * dock.scale + 40);
  const rb = rackKey > 0 ? rackBox(lay) : null;
  const tier = Math.floor(rackKey / 10);
  const step = rackKey % 10;
  return (
    <View testID="harbour-scene" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`${-fit.ox / fit.s} ${-fit.oy / fit.s} ${width / fit.s} ${height / fit.s}`}>
        <Defs>
          <ClipPath id="harbour-clip">
            <Rect x={-120} y={0} width={120 + dock.clipX} height={BOAT_ART.waterline + 20} />
          </ClipPath>
        </Defs>
        {pose.phase !== 'away' && (
          <G clipPath="url(#harbour-clip)">
            <G testID="boat" transform={`translate(${boatX.toFixed(1)} ${BOAT_ART.waterline}) scale(${-dock.scale} ${dock.scale})`}>
              <BoatArt docked={pose.phase === 'docked'} />
            </G>
          </G>
        )}
        {rb && (
          <G testID="warming-rack" transform={`translate(${rb.x.toFixed(1)} ${rb.y.toFixed(1)}) scale(${rb.k.toFixed(3)})`}>
            <RackArt step={step} tier={tier} />
          </G>
        )}
      </Svg>
    </View>
  );
});
