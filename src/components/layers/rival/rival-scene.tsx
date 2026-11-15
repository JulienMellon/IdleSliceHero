// The MegaSlice shop across the street (SCENE_OVERLAYS slot): small, in the bottom strip of the scene below the curb, so it never sits on
// the WELCOME mat, the sidewalk row or the report strip. While the rival is open it stands there with its sign and awning; when the
// challenge is won its shutters come down, a burst of coins flies to the cash, and the shop is taken away (the HUD tag goes with it).
import { memo, useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { ORDER_VIEW } from '../../../content/hooks';
import { challengeWon, rivalOpen } from '../../../engine/features/layers/rival';
import { useGame } from '../../../store/game-store';
import { F } from '../../../theme';
import { emitCheer, emitCoin, emitPayout } from '../../pulse-bus';
import { useClock } from '../../scene/clock';
import { INK, sceneFit } from '../../scene/projection';
import type { SceneSlotProps } from '../../slots';
import { RIVAL_SHOP, SHUTTERS_TOTAL, shutterShare } from './rival-model';

const PURPLE = '#7B2CBF';
const YELLOW = '#FFC531';

/**
 * The shop: sign band, striped awning, window with a shutter box above it, door, and the shutters that come down over both (`shut` 0..1).
 * The shapes are drawn at the art's size (RIVAL_SHOP.art) and scaled down; the sign's text is drawn outside the scale at a readable size.
 */
const MegaShop = memo(function MegaShop({ shut }: { shut: number }) {
  const { art, scale, w, kerb } = RIVAL_SHOP;
  const aw = art.w;
  const h = art.h;
  const winY = 28;
  const winH = h - winY - 3;
  const slats = Math.floor((winH * shut) / 4);
  return (
    <G>
      {/* the far kerb it stands on, a little wider than the shop */}
      <Rect x={-3} y={h * scale} width={w + 6} height={kerb} rx={1.5} fill="#9B9386" stroke={INK} strokeWidth={0.8} />
      <G transform={`scale(${scale})`}>
        <Rect x={0} y={6} width={aw} height={h - 6} rx={4} fill={PURPLE} stroke={INK} strokeWidth={1.8} />
        <Rect x={0} y={0} width={aw} height={19} rx={4} fill={YELLOW} stroke={INK} strokeWidth={1.8} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Path key={i} d={`M${i * 18} 19 h18 v6 q-9 5 -18 0 Z`} fill={i % 2 ? '#fff' : '#E8432E'} stroke={INK} strokeWidth={1.2} />
        ))}
        <Rect x={8} y={winY} width={aw - 16 - 28} height={winH} fill="#FFE9A8" stroke={INK} strokeWidth={1.4} />
        {/* the door, with a balloon tied to it */}
        <Rect x={aw - 30} y={winY} width={20} height={winH} fill="#3B1F14" stroke={INK} strokeWidth={1.4} />
        <Circle cx={aw - 6} cy={winY - 3} r={6} fill="#E8432E" stroke={INK} strokeWidth={1} opacity={shut > 0.5 ? 0.35 : 1} />
        {/* the shutter box under the awning: the rolled shutters, always in view */}
        <Rect x={6} y={winY - 4} width={aw - 12} height={5} rx={1.5} fill="#8E979E" stroke={INK} strokeWidth={1.2} />
        {/* the shutters: slats that come down over the window and the door */}
        {shut > 0 && (
          <G>
            <Rect x={8} y={winY} width={aw - 16} height={winH * shut} fill="#8E979E" stroke={INK} strokeWidth={1.2} />
            {Array.from({ length: slats }).map((_, i) => (
              <Path key={i} d={`M8 ${winY + (i + 1) * 4} h${aw - 16}`} stroke="#6E757B" strokeWidth={1.2} />
            ))}
          </G>
        )}
      </G>
      {/* the sign, at its own size (a 10 pt text never scales down with the shop) */}
      <SvgText x={w / 2} y={(19 * scale) / 2 + 3.4} fontFamily={F.bold} fontSize={RIVAL_SHOP.signFont} fill={INK} textAnchor="middle">
        MEGASLICE
      </SvgText>
    </G>
  );
});

export const RivalScene = memo(function RivalScene({ shopId, width, height }: SceneSlotProps) {
  // Reads the live store: React Compiler must not cache that.
  'use no memo';
  const open = useGame((s) => rivalOpen(s.game, shopId as never));
  const wasOpen = useRef(open);
  const [closedAt, setClosedAt] = useState<number | null>(null);
  const root = useRef<ComponentRef<typeof View>>(null);
  const clock = useClock(15, closedAt === null);
  void clock;

  // the rival closes because the challenge was won: shutters, coins, then gone
  useEffect(() => {
    if (wasOpen.current && !open && challengeWon(useGame.getState().game, shopId as never)) {
      setClosedAt(Date.now());
      const fit = sceneFit(width, height);
      root.current?.measureInWindow((x: number, y: number) => {
        const cx = x + (RIVAL_SHOP.x + RIVAL_SHOP.w / 2) * fit.s;
        const cy = y + (RIVAL_SHOP.top + 10) * fit.s;
        for (let i = 0; i < ORDER_VIEW.coins + 3; i++) emitCoin({ x: cx + (i - 4) * 6, y: cy, ms: 520 + i * 90 });
        emitPayout();
        emitCheer();
      });
    }
    wasOpen.current = open;
  }, [open, shopId, width, height]);
  useEffect(() => {
    if (closedAt === null) return;
    const t = setTimeout(() => setClosedAt(null), SHUTTERS_TOTAL * 1000);
    return () => clearTimeout(t);
  }, [closedAt]);

  const fit = sceneFit(width, height);
  const shown = open || closedAt !== null;
  if (!shown) return <View ref={root} pointerEvents="none" style={StyleSheet.absoluteFill} />;
  const shut = closedAt === null ? 0 : shutterShare((Date.now() - closedAt) / 1000);
  return (
    <View ref={root} testID="rival-shop" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`${-fit.ox / fit.s} ${-fit.oy / fit.s} ${width / fit.s} ${height / fit.s}`}>
        <G transform={`translate(${RIVAL_SHOP.x} ${RIVAL_SHOP.top})`}>
          <MegaShop shut={shut} />
        </G>
      </Svg>
    </View>
  );
});
