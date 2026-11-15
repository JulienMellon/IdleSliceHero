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

/** The shop: sign band, striped awning, window with shutters coming down (`shut` 0..1). Drawn in scene units from its own top-left. */
const MegaShop = memo(function MegaShop({ shut }: { shut: number }) {
  const { w, h } = RIVAL_SHOP;
  const winY = 17;
  const winH = h - winY;
  return (
    <G>
      <Rect x={0} y={4} width={w} height={h} rx={3} fill={PURPLE} stroke={INK} strokeWidth={1.2} />
      <Rect x={0} y={0} width={w} height={13} rx={3} fill={YELLOW} stroke={INK} strokeWidth={1.2} />
      <SvgText x={w / 2} y={10.5} fontFamily={F.bold} fontSize={10} fill={INK} textAnchor="middle">
        MEGASLICE
      </SvgText>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Path key={i} d={`M${i * 16} 13 h16 v4 q-8 4 -16 0 Z`} fill={i % 2 ? '#fff' : '#E8432E'} stroke={INK} strokeWidth={0.8} />
      ))}
      <Rect x={8} y={winY + 3} width={w - 16} height={winH - 3} fill="#FFE9A8" stroke={INK} strokeWidth={1} />
      {/* the shutters: slats that come down over the window */}
      {shut > 0 && (
        <G>
          <Rect x={8} y={winY + 3} width={w - 16} height={(winH - 3) * shut} fill="#8E979E" stroke={INK} strokeWidth={0.8} />
          {Array.from({ length: Math.floor(((winH - 3) * shut) / 4) }).map((_, i) => (
            <Path key={i} d={`M8 ${winY + 3 + (i + 1) * 4} h${w - 16}`} stroke="#6E757B" strokeWidth={0.8} />
          ))}
        </G>
      )}
      {/* a balloon or two, tied to the door */}
      <Circle cx={w - 10} cy={winY + 6} r={3.6} fill="#E8432E" stroke={INK} strokeWidth={0.7} opacity={shut > 0.5 ? 0.35 : 1} />
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
      <Svg width={width} height={height} viewBox={`${-fit.ox / fit.s} ${-fit.oy / fit.s} ${width / fit.s} ${height / fit.s}`}>
        <G transform={`translate(${RIVAL_SHOP.x} ${RIVAL_SHOP.top})`}>
          <MegaShop shut={shut} />
        </G>
      </Svg>
    </View>
  );
});
