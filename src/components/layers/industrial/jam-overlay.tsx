// Industrial's oven jam (SCENE_OVERLAYS slot): smoke over the oven bank, a 44 pt wrench button on it and a label by it ("Oven jammed! Tap the
// wrench." / "Head Baker fixing… 12s"). A tap on the wrench fixes the jam. The smoke is three puffs on the native driver; nothing re-renders
// per frame. Only in the Industrial scene, only while an oven is jammed.
import { memo, useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { jamView } from '../../../engine/features/layers/industrial-shifts';
import { useGame } from '../../../store/game-store';
import { builtHood } from '../city-layers';
import { C, F } from '../../../theme';
import { useMotion } from '../../scene/clock';
import { INK, sceneFit } from '../../scene/projection';
import { useShopFrame } from '../../scene/use-frame';
import type { SceneSlotProps } from '../../slots';
import { layoutOfShop } from '../shop-layout';
import { jamLabel, ovenSpot, pillBox, WRENCH } from './jam-model';

const native = Platform.OS !== 'web';
const PUFFS = 3;

function Puff({ i, left, top, s }: { i: number; left: number; top: number; s: number }) {
  const [t] = useState(() => new Animated.Value(0));
  const { loops } = useMotion();
  useEffect(() => {
    t.setValue(0);
    if (!loops) return;
    const loop = Animated.loop(Animated.sequence([Animated.delay(i * 520), Animated.timing(t, { toValue: 1, duration: 1560, easing: Easing.out(Easing.quad), useNativeDriver: native }), Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: native })]));
    loop.start();
    return () => loop.stop();
  }, [t, i, loops]);
  const size = Math.round(16 * s);
  const rise = t.interpolate({ inputRange: [0, 1], outputRange: [0, -34 * s] });
  const drift = t.interpolate({ inputRange: [0, 1], outputRange: [0, (i - 1) * 8 * s] });
  const fade = t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.8, 0] });
  const grow = t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] });
  return <Animated.View pointerEvents="none" style={[styles.puff, { left: left - size / 2, top: top - size / 2, width: size, height: size, borderRadius: size / 2, opacity: fade, transform: [{ translateY: rise }, { translateX: drift }, { scale: grow }] }]} />;
}

function WrenchArt() {
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={26} height={26} viewBox="0 0 26 26">
      <Path d="M17.5 3.5 A6 6 0 0 0 11 10.5 L3.8 17.7 A2.6 2.6 0 0 0 8.3 22.2 L15.5 15 A6 6 0 0 0 22.5 8.5 L18.6 12.4 L14 11.8 L13.4 7.2 Z" fill="#E8EEF2" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export const JamOverlay = memo(function JamOverlay({ shopId, width, height }: SceneSlotProps) {
  const frame = useShopFrame(shopId);
  // one string: the label (it changes once a second under a Head Baker), then the jammed oven's place; '' for no jam
  const key = useGame((s) => {
    if (shopId !== builtHood(s.game, 'shifts')) return '';
    const label = jamLabel(jamView(s.game), s.game.city);
    if (!label) return '';
    const at = ovenSpot(layoutOfShop(s.game.shops[shopId]));
    return `${label}~${at.x.toFixed(1)}~${at.y.toFixed(1)}~${at.top.toFixed(1)}`;
  });
  const fixJam = useGame((s) => s.fixJam);
  if (!key || !(width > 0)) return null;
  const [label, px, py, ptop] = key.split('~');
  const f = sceneFit(width, height, frame);
  const spot = { x: Number(px), y: Number(py), top: Number(ptop) };
  const cx = f.ox + spot.x * f.s;
  const cy = f.oy + spot.y * f.s;
  const topY = f.oy + spot.top * f.s;
  const box = pillBox(width, cx, label);
  return (
    <View testID="jam-overlay" pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: PUFFS }, (_, i) => (
        <Puff key={i} i={i} left={cx + (i - 1) * 6 * f.s} top={topY} s={f.s} />
      ))}
      <Pressable testID="fix-jam" accessibilityRole="button" accessibilityLabel="Fix the jammed oven" onPress={fixJam} style={[styles.wrench, { left: cx - WRENCH / 2, top: cy - WRENCH / 2 }]}>
        <WrenchArt />
      </Pressable>
      <View testID="jam-label" pointerEvents="none" style={[styles.label, { left: box.left, width: box.width, top: cy + WRENCH / 2 + 4 }]}>
        <Text style={styles.labelText} numberOfLines={1} maxFontSizeMultiplier={1.1}>
          {label}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  puff: { position: 'absolute', backgroundColor: '#8D8780' },
  wrench: { position: 'absolute', width: WRENCH, height: WRENCH, borderRadius: WRENCH / 2, backgroundColor: C.cheese, borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  label: { position: 'absolute', height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: C.ink, backgroundColor: 'rgba(255,255,255,0.96)', alignItems: 'center', justifyContent: 'center' },
  labelText: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: C.tomatoDark },
});
