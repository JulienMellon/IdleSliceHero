// A small drone flight over the University scene once drones are the fleet (SCENE_OVERLAYS slot): one to three drones cross the sky band,
// each in its own lane, speed and direction (zones-model.ts droneLane). Decoration only: it takes no touches. Each drone is one Animated
// translation on the native driver; nothing re-renders per frame.
import { memo, useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { cityOf } from '../../../content/cities';
import { isDrones } from '../../../engine/features/layers/menu';
import { skyBottom } from '../../../engine/bonus';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import type { SceneSlotProps } from '../../slots';
import { useMotion } from '../../scene/clock';
import { FRONT_TOP, INK, P, sceneFit } from '../../scene/projection';
import { useShopFrame } from '../../scene/use-frame';
import { campusOut, droneCount, droneLane, droneX, type DroneLane } from './zones-model';

const W = 30;
const H = 18;
const native = Platform.OS !== 'web';

function DroneArt() {
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={W} height={H} viewBox="0 0 30 18">
      <Path d="M4 4 H11 M19 4 H26" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      <Ellipse cx={7.5} cy={3.4} rx={5} ry={1.3} fill="#fff" opacity={0.7} />
      <Ellipse cx={22.5} cy={3.4} rx={5} ry={1.3} fill="#fff" opacity={0.7} />
      <Path d="M11 5 L13 8 M19 5 L17 8" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      <Rect x={9} y={7.5} width={12} height={6.5} rx={3} fill="#E8EEF2" stroke={INK} strokeWidth={1.2} />
      <Circle cx={15} cy={10.7} r={1.8} fill="#2F6FA8" stroke={INK} strokeWidth={0.8} />
      <Rect x={12.5} y={14} width={5} height={3} rx={0.8} fill="#E8432E" stroke={INK} strokeWidth={0.9} />
    </Svg>
  );
}

const Drone = memo(function Drone({ lane, width, top }: { lane: DroneLane; width: number; top: number }) {
  const [p] = useState(() => new Animated.Value(0));
  const { loops } = useMotion();
  useEffect(() => {
    p.setValue(0);
    if (!loops) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(lane.delay),
        Animated.timing(p, { toValue: 1, duration: lane.ms, easing: Easing.linear, useNativeDriver: native }),
        Animated.timing(p, { toValue: 0, duration: 0, useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [p, lane.delay, lane.ms, loops]);
  const x = p.interpolate({ inputRange: [0, 1], outputRange: [droneX(lane, 0, width, W), droneX(lane, 1, width, W)] });
  const bob = p.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -4, 0, 4, 0] });
  return (
    <Animated.View pointerEvents="none" style={[styles.drone, { top, transform: [{ translateX: x }, { translateY: bob }, { scaleX: lane.dir }] }]}>
      <DroneArt />
    </Animated.View>
  );
});

export const DroneFlight = memo(function DroneFlight({ shopId, width, height }: SceneSlotProps) {
  const frame = useShopFrame(shopId);
  const count = useGame((s) => (shopId === builtHood(s.game, 'menu') && isDrones(s.game.vehicle, cityOf(s.game).fit) ? droneCount(campusOut(s.game)) : 0));
  if (count === 0 || !(width > 0)) return null;
  const f = sceneFit(width, height, frame);
  const band = Math.max(40, skyBottom(f.oy, f.s, P(0, 0, FRONT_TOP)[1]));
  return (
    <View testID="drone-flight" pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }, (_, i) => {
        const lane = droneLane(i);
        return <Drone key={i} lane={lane} width={width} top={Math.round(band * lane.y)} />;
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  drone: { position: 'absolute', left: 0, width: W, height: H },
});
