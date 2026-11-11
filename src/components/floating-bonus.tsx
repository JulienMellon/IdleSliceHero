// The golden pizza (v5.13): a golden pizza box with small wings drifts across the sky band above the shop for 12 s; a tap
// pays cash. Every 5th is the lucky slice, and five pips by the pizza show how close it is. The rules (when it appears,
// what it pays) are engine/bonus.ts; this draws it.
//
// Performance: the scene redraws at ~15 fps, so none of this goes through React per frame. The flight, the bob and the wing
// beat are native-driven Animated values made once per pizza (useState initialisers); the component subscribes to
// primitives (which pizza is up, the streak, the seed), so it re-renders only when one appears, leaves or is tapped.
import { memo, useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { BONUS, BONUS_VIEW, LUCKY_MULT } from '../content/hooks';
import { bonusPath, flightX, streakPips } from '../engine/bonus';
import { money } from '../engine/format';
import { bonusBlocked, useGame } from '../store/game-store';
import { F } from '../theme';
import { haptic } from './game-ui';
import { emitCoin, emitPayout } from './pulse-bus';

const { width: W, height: H } = BONUS_VIEW;
const INK = '#3B1F14';
const GOLD_DARK = '#8A5A00';

interface Pop {
  key: number;
  x: number;
  y: number;
  text: string;
  lucky: boolean;
}

export const FloatingBonus = memo(function FloatingBonus({ width, top }: { width: number; top: number }) {
  // which golden pizza is on screen (0 = none; also none while something covers the scene)
  const live = useGame((s) => (bonusBlocked(s) ? 0 : s.game.bonus.until > s.game.playSeconds ? s.game.bonus.spawned : 0));
  const seed = useGame((s) => s.game.bonus.seed);
  const taps = useGame((s) => s.game.stats.bonusTaps);
  const [pops, setPops] = useState<Pop[]>([]);
  const root = useRef<ComponentRef<typeof View>>(null);
  const nextKey = useRef(1);
  const collect = (pageX: number, pageY: number) => {
    const r = useGame.getState().tapBonus();
    if (!r) return;
    haptic('success');
    // the existing coin burst: a few coins from the tap point to the cash, and the cash text's kick
    emitCoin({ x: pageX, y: pageY, ms: 420 });
    emitCoin({ x: pageX, y: pageY, ms: 560 });
    if (r.lucky) emitCoin({ x: pageX, y: pageY, ms: 700 });
    emitPayout();
    const key = nextKey.current++;
    const text = `+${money(r.paid)}`;
    root.current?.measureInWindow((ox: number, oy: number) => setPops((l) => [...l, { key, x: pageX - ox, y: pageY - oy, text, lucky: r.lucky }].slice(-3)));
  };
  // stable: a pop's animation must not restart because its parent re-rendered
  const drop = useCallback((key: number) => setPops((l) => l.filter((p) => p.key !== key)), []);
  return (
    <View ref={root} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {live > 0 && <Golden key={live} n={live} seed={seed} taps={taps} width={width} top={top} onTap={collect} />}
      {pops.map((p) => (
        <PopText key={p.key} pop={p} onDone={drop} />
      ))}
    </View>
  );
});

/** One golden pizza's flight. Mounted when it appears (or when a drawer closes on it) and keyed by its number. */
function Golden({ n, seed, taps, width, top, onTap }: { n: number; seed: number; taps: number; width: number; top: number; onTap: (pageX: number, pageY: number) => void }) {
  const path = bonusPath(seed, n);
  const pips = streakPips(taps);
  // where it is in its flight now (it may come back mid-way after a drawer), and the values that carry it
  const [fly] = useState(() => {
    const g = useGame.getState().game;
    const left = Math.max(0.1, g.bonus.until - g.playSeconds);
    const p0 = Math.min(1, Math.max(0, 1 - left / BONUS.visibleSeconds));
    return { x: new Animated.Value(flightX(path, p0)), toX: flightX(path, 1), ms: left * 1000, bob: new Animated.Value(path.phase), flap: new Animated.Value(0) };
  });
  useEffect(() => {
    const run = Animated.timing(fly.x, { toValue: fly.toX, duration: fly.ms, easing: Easing.linear, useNativeDriver: true });
    const bob = Animated.loop(Animated.timing(fly.bob, { toValue: 1, duration: BONUS_VIEW.bobMs, easing: Easing.linear, useNativeDriver: true }));
    const flap = Animated.loop(
      Animated.sequence([
        Animated.timing(fly.flap, { toValue: 1, duration: BONUS_VIEW.flapMs / 2, useNativeDriver: true }),
        Animated.timing(fly.flap, { toValue: 0, duration: BONUS_VIEW.flapMs / 2, useNativeDriver: true }),
      ]),
    );
    run.start();
    bob.start();
    flap.start();
    return () => {
      run.stop();
      bob.stop();
      flap.stop();
    };
  }, [fly]);
  const b = BONUS_VIEW.bobPx;
  const lane = top + path.lane * BONUS_VIEW.laneHeight;
  const flapScale = fly.flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] });
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.box,
        {
          top: lane,
          transform: [
            { translateX: fly.x.interpolate({ inputRange: [0, 1], outputRange: [-W, width] }) },
            { translateY: fly.bob.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -b, 0, b, 0] }) },
          ],
        },
      ]}>
      <Animated.View pointerEvents="none" style={[styles.wing, { left: 0, transform: [{ scaleY: flapScale }] }]}>
        <Wing />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.wing, { right: 0, transform: [{ scaleY: flapScale }, { scaleX: -1 }] }]}>
        <Wing />
      </Animated.View>
      <Pressable
        testID="golden-pizza"
        accessibilityRole="button"
        accessibilityLabel={pips.lucky ? 'Lucky golden pizza. Tap for a big bonus' : 'Golden pizza. Tap for a bonus'}
        onPress={(e) => onTap(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        style={styles.hit}>
        <Svg width={W} height={H} viewBox="0 0 60 44">
          {pips.lucky && <Circle cx={30} cy={22} r={21} fill="rgba(255,236,140,0.55)" stroke="#FFD54A" strokeWidth={1.5} />}
          <Box lucky={pips.lucky} />
        </Svg>
      </Pressable>
      <View testID="golden-pips" accessibilityLabel={`${pips.filled} of ${pips.total} to the lucky slice`} pointerEvents="none" style={styles.pips}>
        {Array.from({ length: pips.total }, (_, i) => (
          <View key={i} style={[styles.pip, i < pips.filled && styles.pipOn, i === pips.total - 1 && styles.pipLast, i === pips.total - 1 && pips.lucky && styles.pipLucky]} />
        ))}
      </View>
    </Animated.View>
  );
}

/** The box: a lid, a front with a slice on it, a shine. 60 × 44; the wings sit behind it. */
function Box({ lucky }: { lucky: boolean }) {
  return (
    <G>
      <Path d="M17 14 L21 5 L39 5 L43 14 Z" fill="#FFE27A" stroke={GOLD_DARK} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M15 14 H45 V37 Q45 39 43 39 H17 Q15 39 15 37 Z" fill="#F6C343" stroke={GOLD_DARK} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M22 20 H38 L30 34 Z" fill="#FFF1C4" stroke={GOLD_DARK} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={29} cy={24} r={2} fill="#E8432E" />
      <Circle cx={33} cy={26.5} r={1.6} fill="#E8432E" />
      <Path d="M18 17 V35" stroke="#FFF6CC" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      {/* a sparkle on the lid's corner */}
      <Path d="M44 2 L45.2 5.2 L48.4 6.4 L45.2 7.6 L44 10.8 L42.8 7.6 L39.6 6.4 L42.8 5.2 Z" fill={lucky ? '#fff' : '#FFFBE0'} stroke={INK} strokeWidth={0.6} />
    </G>
  );
}

function Wing() {
  return (
    <Svg width={20} height={26} viewBox="0 0 20 26">
      <Path d="M19 18 Q14 3 1 4 Q5 9 3 12 Q8 12 7 17 Q12 16 19 22 Z" fill="#FFFFFF" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M17 17 Q11 11 5 8" stroke="#D8E6F2" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** "+$X" rising from the tap point (and the lucky banner above it). */
function PopText({ pop, onDone }: { pop: Pop; onDone: (key: number) => void }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const run = Animated.timing(t, { toValue: 1, duration: BONUS_VIEW.popMs, easing: Easing.out(Easing.quad), useNativeDriver: true });
    run.start(({ finished }) => finished && onDone(pop.key));
    return () => run.stop();
  }, [t, pop.key, onDone]);
  return (
    <Animated.View
      testID="golden-pop"
      pointerEvents="none"
      style={[
        styles.pop,
        {
          left: pop.x - 90,
          top: pop.y - 24,
          opacity: t.interpolate({ inputRange: [0, 0.12, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -BONUS_VIEW.popRisePx] }) }, { scale: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.6, pop.lucky ? 1.25 : 1.1, 1] }) }],
        },
      ]}>
      {pop.lucky && (
        <Text testID="golden-lucky" style={styles.lucky}>
          {`LUCKY SLICE ×${LUCKY_MULT}!`}
        </Text>
      )}
      <Text style={[styles.popText, pop.lucky && styles.popTextLucky]}>{pop.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, width: W, height: H + 12 },
  wing: { position: 'absolute', top: 7, width: 20, height: 26 },
  hit: { width: W, height: H },
  pips: { height: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 3 },
  pip: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: GOLD_DARK },
  pipOn: { backgroundColor: '#FFC531' },
  pipLast: { width: 8, height: 8, borderRadius: 4 },
  pipLucky: { backgroundColor: '#FFF6C2', borderColor: '#E8432E' },
  pop: { position: 'absolute', width: 180, alignItems: 'center' },
  popText: { fontFamily: F.bold, fontSize: 20, color: '#FFE27A', textShadowColor: INK, textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
  popTextLucky: { fontSize: 26 },
  lucky: { fontFamily: F.bold, fontSize: 16, letterSpacing: 0.5, color: '#fff', textShadowColor: '#C0392B', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
});
