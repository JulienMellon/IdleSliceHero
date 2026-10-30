// Payout coins (D344): fly from the departing carrier in the scene to the HUD cash, in a screen overlay above
// everything, on the native driver (no per-frame JS). Each lands when the engine pays, with a small sparkle.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { onCoin, type CoinLaunch } from './pulse-bus';

const SIZE = 18;
/** At most this many coins in flight; extra launches are dropped (the pop already showed the cash). */
const MAX_COINS = 3;

type Coin = CoinLaunch & { key: number; k: Animated.Value };

/** `target`: the HUD cash text's centre in window coordinates. */
export function CoinLayer({ target }: { target: { x: number; y: number } }) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const nextKey = useRef(1);
  const targetRef = useRef(target);
  targetRef.current = target;
  useEffect(
    () =>
      onCoin((c) => {
        setCoins((list) => {
          if (list.length >= MAX_COINS) return list;
          const coin: Coin = { ...c, key: nextKey.current++, k: new Animated.Value(0) };
          Animated.timing(coin.k, { toValue: 1, duration: Math.max(120, c.ms), easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() =>
            setCoins((l) => l.filter((x) => x.key !== coin.key)),
          );
          return [...list, coin];
        });
      }),
    [],
  );
  if (coins.length === 0) return null;
  const t = targetRef.current;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {coins.map((c) => {
        const dx = t.x - c.x;
        const dy = t.y - c.y;
        // bow left of the goal bar on the way up
        const tx = c.k.interpolate({ inputRange: [0, 0.5, 1], outputRange: [c.x - SIZE / 2, c.x + dx * 0.5 - 40 - SIZE / 2, t.x - SIZE / 2] });
        const ty = c.k.interpolate({ inputRange: [0, 1], outputRange: [c.y - SIZE / 2, c.y + dy - SIZE / 2] });
        const sparkle = c.k.interpolate({ inputRange: [0, 0.85, 1], outputRange: [0, 0, 1] });
        return (
          <Animated.View key={c.key} style={[styles.coinBox, { transform: [{ translateX: tx }, { translateY: ty }] }]}>
            <View style={styles.coin}>
              <View style={styles.inner} />
              <View style={styles.shine} />
            </View>
            {[0, 1, 2, 3].map((j) => (
              <Animated.View
                key={j}
                style={[
                  styles.dot,
                  {
                    opacity: sparkle,
                    transform: [
                      { translateX: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0, [12, -12, 0, 0][j]] }) },
                      { translateY: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0, [0, 0, 12, -12][j]] }) },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  coinBox: { position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE },
  coin: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: '#F6C343', borderWidth: 1.5, borderColor: '#8A5A00', alignItems: 'center', justifyContent: 'center' },
  inner: { width: SIZE - 8, height: SIZE - 8, borderRadius: (SIZE - 8) / 2, borderWidth: 1, borderColor: '#B8860B' },
  shine: { position: 'absolute', left: 3.5, top: 3, width: 4, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' },
  dot: { position: 'absolute', left: SIZE / 2 - 2, top: SIZE / 2 - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFE27A' },
});
