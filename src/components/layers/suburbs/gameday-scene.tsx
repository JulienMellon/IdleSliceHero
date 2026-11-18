// Game Day in the shop scene (SCENE_OVERLAYS slot): during the rush the free seats glow and a wave of families walks in from the
// street. The families are ordinary guests (`Person`) at most three families at once on the walkers' lane (gameday-model.ts WAVE;
// wave-budget.test.ts keeps them off each other and off the doormat). Nothing outside the rush, and nothing in any other shop.
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import { GAME_DAY, LAYER_KEYS } from '../../../content/layers';
import { gameDayView, type Timed } from '../../../engine/features/layers/suburbs-gameday';
import { patioTables } from '../../../engine/game';
import { useGame } from '../../../store/game-store';
import { useClock } from '../../scene/clock';
import { Person } from '../../scene/people';
import { kAt, P, sceneFit } from '../../scene/projection';
import { useShopFrame } from '../../scene/use-frame';
import type { SceneSlotProps } from '../../slots';
import { hoodOf } from '../city-layers';
import { layoutOfShop } from '../shop-layout';
import { BURST_SECONDS, chairsOf, familiesFor, freeChairs, glowing, seatedFamilies, waveFigures } from './gameday-model';
import { gameNow } from '../../../engine/clock';

export const GameDayScene = memo(function GameDayScene({ shopId, width, height }: SceneSlotProps) {
  // Reads the live store on its own 15 fps clock: React Compiler must not cache that.
  'use no memo';
  const frame = useShopFrame(shopId);
  const on = useGame((s) => shopId === hoodOf(s.game, 'gameDay') && gameDayView(s.game, gameNow()).rush);
  const clock = useClock(15, !on);
  if (!on) return null;
  const st = useGame.getState();
  const g = st.game;
  const shop = g.shops[shopId];
  const v = gameDayView(g, gameNow());
  if (!v.rush) return null;
  const lay = layoutOfShop(shop);
  const until = (g.x?.[LAYER_KEYS.gameDay] as Timed | undefined)?.until ?? 0;
  // seconds into the rush, smooth between the 200 ms game ticks
  const since = Math.max(0, (gameNow() - st.tickAt) / 1000);
  const t = Math.max(0, Math.min(GAME_DAY.rushSeconds, GAME_DAY.rushSeconds - (until - g.playSeconds) + since));
  const chairs = chairsOf(lay, patioTables(shop));
  const free = freeChairs(chairs.length, v);
  const families = familiesFor(v.seatsFree, lay);
  const open = glowing(free, t, families, lay);
  const fit = sceneFit(width, height, frame);
  const pulse = 0.5 + 0.5 * Math.sin(clock * 5);
  const figures = waveFigures(lay, t, families, clock).sort((a, b) => b.y - a.y);
  const seated = seatedFamilies(lay, chairs, free, t, families);
  return (
    <View testID="gameday-scene" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`${-fit.ox / fit.s} ${-fit.oy / fit.s} ${width / fit.s} ${height / fit.s}`}>
        {chairs.slice(0, open).map((c, i) => {
          const [x, y] = P(c.x, c.y);
          const k = kAt(c.y) * (c.patio ? 1.1 : 1);
          return (
            <G key={i}>
              <Ellipse cx={x} cy={y + 2} rx={13 * k} ry={5 * k} fill="#6FE08A" opacity={0.28 + 0.3 * pulse} />
              <Ellipse cx={x} cy={y + 2} rx={13 * k} ry={5 * k} fill="none" stroke="#2E9B4E" strokeWidth={1.6} opacity={0.55 + 0.4 * pulse} />
            </G>
          );
        })}
        {seated.map((f) => (
          <Person key={f.key} x={f.x} y={f.y} kind="sit" flip={f.flip} seed={f.seed} act="slice" mood="happy" />
        ))}
        {seated.filter((f) => f.age < BURST_SECONDS).map((f) => {
          const [x, y] = P(f.x, f.y, 30);
          const k = f.age / BURST_SECONDS;
          return (
            <G key={`b${f.key}`} opacity={1 - k}>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const a = (i / 6) * Math.PI * 2 + 0.4;
                return <Circle key={i} cx={x + Math.cos(a) * (6 + 22 * k)} cy={y + Math.sin(a) * (6 + 22 * k) - 8 * k} r={2.6} fill={['#FFC531', '#E8432E', '#3FAE5A'][i % 3]} />;
              })}
            </G>
          );
        })}
        {figures.map((f) => (
          <Person key={f.key} x={f.x} y={f.y} {...f.props} />
        ))}
      </Svg>
    </View>
  );
});
