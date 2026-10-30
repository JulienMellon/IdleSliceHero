// Payout coins (D344): fly from the departing carrier in the scene to the HUD cash, in a screen overlay above
// everything, on the native driver (no per-frame JS). Each lands when the engine pays, with a small sparkle.
// C79: animations are built and started outside state updaters and stopped on unmount; M47: interpolations are
// made once per coin at launch and the layer is memoised; C81: the target is the measured HUD cash text.
import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { coinTarget, onCoin } from './pulse-bus';

const SIZE = 18;
/** At most this many coins in flight; extra launches are dropped (the pop already showed the cash). */
const MAX_COINS = 3;
const SPARK: [number, number][] = [
  [12, 0],
  [-12, 0],
  [0, 12],
  [0, -12],
];

interface Coin {
  key: number;
  tx: Animated.AnimatedInterpolation<number>;
  ty: Animated.AnimatedInterpolation<number>;
  sparkle: Animated.AnimatedInterpolation<number>;
  dots: { x: Animated.AnimatedInterpolation<number>; y: Animated.AnimatedInterpolation<number> }[];
}

export const CoinLayer = memo(function CoinLayer() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const live = useRef(new Map<number, Animated.CompositeAnimation>());
  const nextKey = useRef(1);
  useEffect(() => {
    const running = live.current;
    const off = onCoin((c) => {
      if (running.size >= MAX_COINS) return;
      const t = coinTarget();
      const key = nextKey.current++;
      const k = new Animated.Value(0);
      const dx = t.x - c.x;
      // bow left of the goal bar on the way up
      const coin: Coin = {
        key,
        tx: k.interpolate({ inputRange: [0, 0.5, 1], outputRange: [c.x - SIZE / 2, c.x + dx * 0.5 - 40 - SIZE / 2, t.x - SIZE / 2] }),
        ty: k.interpolate({ inputRange: [0, 1], outputRange: [c.y - SIZE / 2, t.y - SIZE / 2] }),
        sparkle: k.interpolate({ inputRange: [0, 0.85, 1], outputRange: [0, 0, 1] }),
        dots: SPARK.map(([sx, sy]) => ({ x: k.interpolate({ inputRange: [0.85, 1], outputRange: [0, sx], extrapolate: 'clamp' }), y: k.interpolate({ inputRange: [0.85, 1], outputRange: [0, sy], extrapolate: 'clamp' }) })),
      };
      const anim = Animated.timing(k, { toValue: 1, duration: Math.max(120, c.ms), easing: Easing.in(Easing.quad), useNativeDriver: true });
      running.set(key, anim);
      anim.start(() => {
        running.delete(key);
        setCoins((l) => l.filter((x) => x.key !== key));
      });
      setCoins((l) => [...l, coin]);
    });
    return () => {
      off();
      running.forEach((a) => a.stop());
      running.clear();
    };
  }, []);
  if (coins.length === 0) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {coins.map((c) => (
        <Animated.View key={c.key} style={[styles.coinBox, { transform: [{ translateX: c.tx }, { translateY: c.ty }] }]}>
          <View style={styles.coin}>
            <View style={styles.inner} />
            <View style={styles.shine} />
          </View>
          {c.dots.map((d, j) => (
            <Animated.View key={j} style={[styles.dot, { opacity: c.sparkle, transform: [{ translateX: d.x }, { translateY: d.y }] }]} />
          ))}
        </Animated.View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  coinBox: { position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE },
  coin: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: '#F6C343', borderWidth: 1.5, borderColor: '#8A5A00', alignItems: 'center', justifyContent: 'center' },
  inner: { width: SIZE - 8, height: SIZE - 8, borderRadius: (SIZE - 8) / 2, borderWidth: 1, borderColor: '#B8860B' },
  shine: { position: 'absolute', left: 3.5, top: 3, width: 4, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' },
  dot: { position: 'absolute', left: SIZE / 2 - 2, top: SIZE / 2 - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFE27A' },
});
