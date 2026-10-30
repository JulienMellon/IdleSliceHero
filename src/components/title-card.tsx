// The title card (P1): after the native splash, the logo drops in over rotating rays, the name lands and Nonna
// waves; it continues by itself (2.0 s on the first launch of the day, 1.2 s after) and a tap skips it.
// It hides the native splash once it has laid out, so there's no flash between the two.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { F } from '../theme';
import { Logo } from './logo';
import { LOGO_RED } from './logo-art';
import { Portrait } from './portrait';

const DAY_KEY = 'slice-empire/title-day';
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const b = a + Math.PI / 12;
  return `M0 0 L${Math.cos(a) * 300} ${Math.sin(a) * 300} L${Math.cos(b) * 300} ${Math.sin(b) * 300} Z`;
}).join(' ');

export function TitleCard({ onDone }: { onDone: () => void }) {
  const [drop] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));
  const [wave] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => onDone());
  };
  useEffect(() => {
    const anims = [
      Animated.spring(drop, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.sequence([Animated.timing(wave, { toValue: 1, duration: 260, useNativeDriver: true }), Animated.timing(wave, { toValue: 0, duration: 260, useNativeDriver: true })])),
    ];
    anims.forEach((a) => a.start());
    let timer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;
    const today = new Date().toDateString();
    AsyncStorage.getItem(DAY_KEY)
      .catch(() => null)
      .then((seen) => {
        if (!alive) return;
        timer = setTimeout(finish, seen === today ? 1200 : 2000);
        AsyncStorage.setItem(DAY_KEY, today).catch(() => {});
      });
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      anims.forEach((a) => a.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount
  }, []);
  const y = drop.interpolate({ inputRange: [0, 1], outputRange: [-260, 0] });
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const tilt = wave.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]} onLayout={() => SplashScreen.hideAsync().catch(() => {})}>
      <Pressable testID="title-card" style={StyleSheet.absoluteFill} onPress={finish}>
        <View style={styles.center}>
          <Animated.View style={[styles.rays, { transform: [{ rotate: rot }] }]}>
            <Svg width={600} height={600} viewBox="-300 -300 600 600">
              <Path d={RAYS} fill="#FFFFFF" opacity={0.12} />
            </Svg>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: y }] }}>
            <Logo size={180} />
          </Animated.View>
          <Animated.Text style={[styles.name, { opacity: drop }]}>SLICE EMPIRE</Animated.Text>
          <Text style={styles.sub}>Rosa’s Pizzeria · Port Marinara</Text>
        </View>
        <Animated.View style={[styles.nonna, { transform: [{ rotate: tilt }] }]}>
          <Portrait id="nonna-rosa" mood="happy" size={88} />
        </Animated.View>
        <Text style={styles.skip}>Tap to start</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: LOGO_RED, zIndex: 50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rays: { position: 'absolute', width: 600, height: 600 },
  name: { marginTop: 14, fontFamily: F.bold, fontSize: 44, color: '#FFFFFF', letterSpacing: 1, textShadowColor: '#3B1F14', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  sub: { marginTop: 4, fontFamily: F.semi, fontSize: 15, color: '#FFE7C2' },
  nonna: { position: 'absolute', right: 22, bottom: 70 },
  skip: { position: 'absolute', bottom: 34, alignSelf: 'center', fontFamily: F.semi, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
});
