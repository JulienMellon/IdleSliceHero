// Uptown's critic in the scene (SCENE_OVERLAYS slot): a figure in black who walks in from the pavement, through the door, to a spot on the
// dining aisle, with a "Target 4★" chip over its head. It is there from CRITIC_LEAD seconds before the visit until the result is
// acknowledged. Decoration only: it takes no touches. The walk is local time (the engine's clock only counts whole seconds).
import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G } from 'react-native-svg';

import { criticView } from '../../../engine/features/layers/stars';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import { C, F } from '../../../theme';
import { Person } from '../../scene/people';
import { P, kAt, sceneFit, type SceneFrame } from '../../scene/projection';
import { useShopFrame } from '../../scene/use-frame';
import type { SceneSlotProps } from '../../slots';
import { toWindow } from '../layer-geometry';
import { pillBox } from '../shifts/jam-model';
import { cityOf } from '../../../content/cities';
import { shopLayout } from '../../scene/shop-layout';
import { CRITIC_LEAD, criticPath, criticPhase, targetChip, WALK_SECONDS } from './critic-model';

/** The critic's look: a black polo, grey hair, a notebook (the phone pose). */
const LOOK = { seed: 7, shirt: '#2B2B3A', hair: '#8F8A86' } as const;
const CHIP_H = 20;
/** The shop door: its centre and left jamb in room units (`shopLayout(...).room`). */
interface Door {
  cx: number;
  x0: number;
}

function Figure({
  door,
  p,
  mood,
  act,
  width,
  height,
  target,
  frame,
}: {
  door: Door;
  p: number;
  mood: 'focus' | 'happy' | 'o';
  act: 'phone' | 'none';
  width: number;
  height: number;
  target: number;
  frame: SceneFrame;
}) {
  const at = criticPath(p, door.cx, door.x0);
  const f = sceneFit(width, height, frame);
  const [sx, sy] = P(at.x, at.y, 0, frame);
  const k = kAt(at.y) * 1.14;
  const text = targetChip(target);
  const head = toWindow(f, sx, sy - 62 * k);
  const box = pillBox(width, head.left, text, 4);
  return (
    <View testID="critic" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} style={StyleSheet.absoluteFill}>
        <G transform={`translate(${f.ox} ${f.oy}) scale(${f.s})`}>
          <Person x={at.x} y={at.y} kind="guest" front={false} flip={at.flip && p < 1} step={at.step} act={act} mood={mood} {...LOOK} />
        </G>
      </Svg>
      <View testID="critic-target" style={[styles.chip, { width: box.width, left: box.left, top: head.top - CHIP_H - 2 }]}>
        <Text style={styles.chipText} numberOfLines={1} maxFontSizeMultiplier={1.1}>
          {text}
        </Text>
      </View>
    </View>
  );
}

/** The walk: progress from `e0` seconds in, moving on real time every 100 ms until the walk is done. Mounted only while walking. */
function Walker({ door, e0, target, width, height, frame }: { door: Door; e0: number; target: number; width: number; height: number; frame: SceneFrame }) {
  const [t0] = useState(() => Date.now());
  const [p, setP] = useState(() => Math.min(1, e0 / WALK_SECONDS));
  useEffect(() => {
    const h = setInterval(() => setP(Math.min(1, (e0 + (Date.now() - t0) / 1000) / WALK_SECONDS)), 100);
    return () => clearInterval(h);
  }, [e0, t0]);
  return <Figure door={door} p={p} mood="focus" act="none" width={width} height={height} target={target} frame={frame} />;
}

export const CriticScene = memo(function CriticScene({ shopId, width, height }: SceneSlotProps) {
  const frame = useShopFrame(shopId);
  // one string: the phase, the target on the chip, how the visit went, and (walking) the seconds already walked
  const key = useGame((s) => {
    if (shopId !== builtHood(s.game, 'stars')) return '';
    const v = criticView(s.game);
    const phase = criticPhase(v);
    if (phase === 'away') return '';
    const door = shopLayout(shopId, s.game.shops[shopId], cityOf(s.game)).room.door;
    return `${phase}|${v.last ? v.last.target : v.target}|${v.last ? (v.last.hit ? 1 : 0) : 0}|${phase === 'walking' ? Math.max(0, CRITIC_LEAD - v.nextIn) : 0}|${door.cx.toFixed(1)}|${door.x0.toFixed(1)}`;
  });
  if (!key || !(width > 0)) return null;
  const [phase, target, hit, elapsed, cx, x0] = key.split('|');
  const door: Door = { cx: Number(cx), x0: Number(x0) };
  if (phase === 'walking') return <Walker key="walk" door={door} e0={Number(elapsed)} target={Number(target)} width={width} height={height} frame={frame} />;
  if (phase === 'result')
    return <Figure door={door} p={1} mood={hit === '1' ? 'happy' : 'o'} act="none" width={width} height={height} target={Number(target)} frame={frame} />;
  return <Figure door={door} p={1} mood="focus" act="phone" width={width} height={height} target={Number(target)} frame={frame} />;
});

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    height: CHIP_H,
    borderRadius: CHIP_H / 2,
    borderWidth: 1.5,
    borderColor: C.ink,
    backgroundColor: C.cheese,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: C.ink },
});
