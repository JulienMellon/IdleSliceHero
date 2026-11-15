// Game Day in the shop scene (SCENE_OVERLAYS slot): during the rush the free seats glow and a wave of families walks in from the
// street. The families are ordinary guests (`Person`) at most three families at once on the walkers' lane (gameday-model.ts WAVE;
// wave-budget.test.ts keeps them off each other and off the doormat). Nothing outside the rush, and nothing in any other shop.
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G } from 'react-native-svg';

import { GAME_DAY, LAYER_KEYS } from '../../../content/layers';
import { gameDayView, type Timed } from '../../../engine/features/layers/suburbs-gameday';
import { patioTables } from '../../../engine/game';
import { useGame } from '../../../store/game-store';
import { useClock } from '../../scene/clock';
import { Person } from '../../scene/people';
import { kAt, P, sceneFit } from '../../scene/projection';
import type { SceneSlotProps } from '../../slots';
import { layoutOfShop } from '../shop-layout';
import { chairsOf, familiesFor, freeChairs, glowing, waveFigures } from './gameday-model';

export const GameDayScene = memo(function GameDayScene({ shopId, width, height }: SceneSlotProps) {
  // Reads the live store on its own 15 fps clock: React Compiler must not cache that.
  'use no memo';
  const on = useGame((s) => shopId === GAME_DAY.hood && gameDayView(s.game, Date.now()).rush);
  const clock = useClock(15, !on);
  if (!on) return null;
  const st = useGame.getState();
  const g = st.game;
  const shop = g.shops[GAME_DAY.hood];
  const v = gameDayView(g, Date.now());
  if (!v.rush) return null;
  const lay = layoutOfShop(shop);
  const until = (g.x?.[LAYER_KEYS.gameDay] as Timed | undefined)?.until ?? 0;
  // seconds into the rush, smooth between the 200 ms game ticks
  const since = Math.max(0, (Date.now() - st.tickAt) / 1000);
  const t = Math.max(0, Math.min(GAME_DAY.rushSeconds, GAME_DAY.rushSeconds - (until - g.playSeconds) + since));
  const chairs = chairsOf(lay, patioTables(shop));
  const free = freeChairs(chairs.length, v);
  const families = familiesFor(v.seatsFree, lay);
  const open = glowing(free, t, families, lay);
  const fit = sceneFit(width, height);
  const pulse = 0.5 + 0.5 * Math.sin(clock * 5);
  const figures = waveFigures(lay, t, families, clock).sort((a, b) => b.y - a.y);
  return (
    <View testID="gameday-scene" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} viewBox={`${-fit.ox / fit.s} ${-fit.oy / fit.s} ${width / fit.s} ${height / fit.s}`}>
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
        {figures.map((f) => (
          <Person key={f.key} x={f.x} y={f.y} {...f.props} />
        ))}
      </Svg>
    </View>
  );
});
