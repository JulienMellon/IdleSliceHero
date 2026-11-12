// The title card (P1): after the native splash, the logo drops in over rotating rays, the name lands and Nonna
// waves; it continues by itself (2.0 s on the first launch of the day, 1.2 s after) and a tap skips it.
// It hides the native splash once it has laid out, so there's no flash between the two.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { F } from '../theme';
import { copy } from './endgame/copy-text';
import { Logo } from './logo';
import { LOGO_RED } from './logo-art';
import { Portrait } from './portrait';

const DAY_KEY = 'slice-empire/title-day';
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const b = a + Math.PI / 12;
  return `M0 0 L${Math.cos(a) * 320} ${Math.sin(a) * 320} L${Math.cos(b) * 320} ${Math.sin(b) * 320} Z`;
}).join(' ');

export function TitleCard({ onDone }: { onDone: () => void }) {
  const [drop] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));
  const [wave] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const [blink] = useState(() => new Animated.Value(1));
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
      Animated.loop(Animated.sequence([Animated.timing(blink, { toValue: 0.45, duration: 600, useNativeDriver: true }), Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true })])),
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
          {/* D369: the rays turn about the logo's own centre and fade out towards the edges */}
          <View style={styles.logoBox}>
            <Animated.View style={[styles.rays, { transform: [{ rotate: rot }] }]}>
              <Svg width={640} height={640} viewBox="-320 -320 640 640">
                <Defs>
                  <RadialGradient id="rayFade" cx="0" cy="0" r="320" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.18} />
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Path d={RAYS} fill="url(#rayFade)" />
              </Svg>
            </Animated.View>
            <Animated.View style={{ transform: [{ translateY: y }] }}>
              <Logo size={250} />
            </Animated.View>
          </View>
          <Animated.Text style={[styles.name, { opacity: drop }]}>SLICE EMPIRE</Animated.Text>
          <Text style={styles.sub}>Rosa’s Pizzeria · Port Marinara</Text>
        </View>
        {/* D380: Nonna is centred under the subtitle; the full-width row keeps her on the screen's centre line */}
        <View style={styles.nonnaRow} pointerEvents="none">
          <Animated.View style={{ transform: [{ rotate: tilt }] }}>
            <View style={styles.nonnaRing}>
              <Portrait id="nonna-rosa" mood="happy" size={84} />
            </View>
          </Animated.View>
        </View>
        <Animated.Text style={[styles.skip, { opacity: blink }]}>Tap to start</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: LOGO_RED, zIndex: 50 },
  // the block sits ~60 pt above centre, so the top of the screen isn't empty
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 120 },
  logoBox: { width: 250, height: 250, alignItems: 'center', justifyContent: 'center' },
  rays: { position: 'absolute', width: 640, height: 640, left: -195, top: -195 },
  name: { marginTop: 14, fontFamily: F.bold, fontSize: 44, color: '#FFFFFF', letterSpacing: 1, textShadowColor: '#3B1F14', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  sub: { marginTop: 4, fontFamily: F.semi, fontSize: 15, color: '#FFE7C2' },
  nonnaRow: { position: 'absolute', left: 0, right: 0, bottom: 78, alignItems: 'center' },
  nonnaRing: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#FFF4DC', borderWidth: 2, borderColor: '#5A2E1A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  skip: { position: 'absolute', bottom: 34, alignSelf: 'center', fontFamily: F.bold, fontSize: 15, color: '#FFF4DC' },
  soonCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 190, paddingHorizontal: 24 },
  soonLogo: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  soonText: { marginTop: 14, alignItems: 'center', gap: 6 },
  soonTitle: { fontFamily: F.bold, fontSize: 30, lineHeight: 34, color: '#FFFFFF', textAlign: 'center', textShadowColor: '#3B1F14', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  soonLine: { fontFamily: F.semi, fontSize: 15, lineHeight: 20, color: '#FFE7C2', textAlign: 'center', maxWidth: 300 },
  soonNonna: { position: 'absolute', left: 24, right: 24, bottom: 96, alignItems: 'center', gap: 8 },
  soonBubble: { backgroundColor: '#FFF4DC', borderWidth: 2, borderColor: '#5A2E1A', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, maxWidth: 320 },
  soonSign: { fontFamily: F.semi, fontSize: 14, lineHeight: 18, color: '#3B1F14', textAlign: 'center' },
  soonClose: { position: 'absolute', bottom: 34, alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  skip2: { fontFamily: F.bold, fontSize: 15, color: '#FFF4DC' },
});

/**
 * "Coming soon: Boston" (v5.15): the title card's red rays and logo with the copy file's two lines and Nonna's sign-off. Shown once after
 * the last finale and again from the City screen's locked seventh tile. A tap (or the button, drawn at 44 pt) closes it.
 */
export function SoonCard({ onDone }: { onDone: () => void }) {
  const [spin] = useState(() => new Animated.Value(0));
  const [rise] = useState(() => new Animated.Value(0));
  const [blink] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const anims = [
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })),
      Animated.spring(rise, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.loop(Animated.sequence([Animated.timing(blink, { toValue: 0.45, duration: 600, useNativeDriver: true }), Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true })])),
    ];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [spin, rise, blink]);
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const y = rise.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <Pressable testID="soon-card" accessibilityRole="button" accessibilityLabel={`${copy('soon.boston.title')}. Tap to close`} style={StyleSheet.absoluteFill} onPress={onDone}>
        <View style={styles.soonCenter}>
          <View style={styles.soonLogo}>
            <Animated.View style={[styles.rays, { transform: [{ rotate: rot }] }]}>
              <Svg width={640} height={640} viewBox="-320 -320 640 640">
                <Defs>
                  <RadialGradient id="soonFade" cx="0" cy="0" r="320" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.18} />
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Path d={RAYS} fill="url(#soonFade)" />
              </Svg>
            </Animated.View>
            <Logo size={150} />
          </View>
          <Animated.View style={[styles.soonText, { opacity: rise, transform: [{ translateY: y }] }]}>
            <Text testID="soon-title" style={styles.soonTitle} maxFontSizeMultiplier={1.2}>
              {copy('soon.boston.title')}
            </Text>
            <Text style={styles.soonLine} maxFontSizeMultiplier={1.2}>
              {copy('soon.boston.line.1')}
            </Text>
            <Text style={styles.soonLine} maxFontSizeMultiplier={1.2}>
              {copy('soon.boston.line.2')}
            </Text>
          </Animated.View>
        </View>
        <View style={styles.soonNonna} pointerEvents="none">
          <View style={styles.nonnaRing}>
            <Portrait id="nonna-rosa" mood="happy" size={84} />
          </View>
          <View style={styles.soonBubble}>
            <Text style={styles.soonSign} maxFontSizeMultiplier={1.2}>
              {copy('soon.boston.signoff')}
            </Text>
          </View>
        </View>
        <Animated.View style={[styles.soonClose, { opacity: blink }]}>
          <Text style={styles.skip2}>Tap to close</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}
