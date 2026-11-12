// The golden pizza (v5.13): a golden pizza box with small wings drifts across the sky band above the shop for 12 s; a tap
// pays cash. Every 5th is the lucky slice, and five slice icons plus a "4/5" label by the pizza show how close it is. The
// rules (when it appears, what it pays, where the pop sits) are engine/bonus.ts; this draws it.
// v5.14 (D437): every pizza is drawn 1.3x with a gold gradient, a soft glow and three trailing sparkles; the lucky slice is 1.6x
// with turning rays and a LUCKY tag. A lucky tap shows a full-width banner at the scene's centre (D444) and throws ten coins.
//
// Performance: the scene redraws at ~15 fps, so none of this goes through React per frame. The flight, the bob and the wing
// beat are native-driven Animated values made once per pizza (useState initialisers); the component subscribes to
// primitives (which pizza is up, the streak, the seed), so it re-renders only when one appears, leaves or is tapped.
import { memo, useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { BONUS, BONUS_VIEW, LUCKY_MULT } from '../content/hooks';
import { bonusPath, bonusScale, edgeRider, flightX, laneY, skyBottom, isFirstGift, pipsLabel, popPlace, salesLine, sparkleTrail, streakPips } from '../engine/bonus';
import { money } from '../engine/format';
import { bonusBlocked, useGame } from '../store/game-store';
import { F } from '../theme';
import { haptic } from './game-ui';
import { emitCheer, emitCoin, emitPayout } from './pulse-bus';
import { FRONT_TOP, P, sceneFit } from './scene/projection';

const { width: W, height: H } = BONUS_VIEW;
const INK = '#3B1F14';
const GOLD_DARK = '#8A5A00';

interface Pop {
  key: number;
  /** Where the pop sits (scene-area coordinates; engine/bonus.ts `popPlace`). */
  left: number;
  top: number;
  text: string;
  sub: string;
  lucky: boolean;
}

export const FloatingBonus = memo(function FloatingBonus({ width, height, top }: { width: number; height: number; top: number }) {
  // which golden pizza is on screen (0 = none; also none while something covers the scene)
  const live = useGame((s) => (bonusBlocked(s) ? 0 : s.game.bonus.until > s.game.playSeconds ? s.game.bonus.spawned : 0));
  const seed = useGame((s) => s.game.bonus.seed);
  const taps = useGame((s) => s.game.stats.bonusTaps);
  const [pops, setPops] = useState<Pop[]>([]);
  // the lucky banner: the key of the one showing (0 = none)
  const [banner, setBanner] = useState(0);
  const root = useRef<ComponentRef<typeof View>>(null);
  const nextKey = useRef(1);
  const collect = (pageX: number, pageY: number) => {
    const r = useGame.getState().tapBonus();
    if (!r) return;
    haptic('success');
    // coins from the tap point to the cash (ten for the lucky slice), and the cash text's kick
    const coins = r.lucky ? BONUS_VIEW.luckyCoins : BONUS_VIEW.coins;
    for (let i = 0; i < coins; i++) emitCoin({ x: pageX, y: pageY, ms: 420 + i * (r.lucky ? 60 : 140) });
    emitPayout();
    const key = nextKey.current++;
    if (r.lucky) {
      setBanner(key);
      emitCheer();
    }
    const text = `+${money(r.paid)}`;
    const sub = salesLine(r.lucky);
    const boxH = BONUS_VIEW.height * bonusScale(r.lucky);
    root.current?.measureInWindow((ox: number, oy: number) => {
      const at = popPlace(pageX - ox, pageY - oy, width, boxH);
      setPops((l) => [...l, { key, ...at, text, sub, lucky: r.lucky }].slice(-3));
    });
  };
  // stable: a pop's animation must not restart because its parent re-rendered
  const drop = useCallback((key: number) => setPops((l) => l.filter((p) => p.key !== key)), []);
  const dropBanner = useCallback((key: number) => setBanner((k) => (k === key ? 0 : k)), []);
  return (
    <View ref={root} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {live > 0 && <Golden key={live} n={live} seed={seed} taps={taps} width={width} height={height} top={top} onTap={collect} />}
      {pops.map((p) => (
        <PopText key={p.key} pop={p} onDone={drop} />
      ))}
      {banner > 0 && <LuckyBanner id={banner} top={top} onDone={dropBanner} />}
    </View>
  );
});

/** One golden pizza's flight. Mounted when it appears (or when a drawer closes on it) and keyed by its number. */
function Golden({ n, seed, taps, width, height, top, onTap }: { n: number; seed: number; taps: number; width: number; height: number; top: number; onTap: (pageX: number, pageY: number) => void }) {
  const path = bonusPath(seed, n);
  const pips = streakPips(taps);
  const k = bonusScale(pips.lucky);
  const bw = W * k;
  const bh = H * k;
  // where it is in its flight now (it may come back mid-way after a drawer), and the values that carry it
  const [fly] = useState(() => {
    const g = useGame.getState().game;
    const left = Math.max(0.1, g.bonus.until - g.playSeconds);
    const p0 = Math.min(1, Math.max(0, 1 - left / BONUS.visibleSeconds));
    return { x: new Animated.Value(flightX(path, p0)), toX: flightX(path, 1), ms: left * 1000, bob: new Animated.Value(path.phase), flap: new Animated.Value(0), spin: new Animated.Value(0) };
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
    const spin = Animated.loop(Animated.timing(fly.spin, { toValue: 1, duration: BONUS_VIEW.raysMs, easing: Easing.linear, useNativeDriver: true }));
    run.start();
    bob.start();
    flap.start();
    spin.start();
    return () => {
      run.stop();
      bob.stop();
      flap.stop();
      spin.stop();
    };
  }, [fly]);
  const b = BONUS_VIEW.bobPx;
  const g = BONUS_VIEW.glowPx;
  const gift = isFirstGift(n, taps);
  // G95: the lane stays in the sky band above the roof sign; the gift label sits over the pizza, so its lane starts lower to leave it room
  const fit = sceneFit(width, height || 1);
  const bandBottom = height > 0 ? skyBottom(fit.oy, fit.s, P(0, 0, FRONT_TOP)[1]) : 0;
  const lane = laneY(path.lane, top, bandBottom, bh + PIPS_H, gift ? BONUS_VIEW.giftRoom : 0);
  // a refused-tap toast sits in the same sky: the label gives way to it
  const toastUp = useGame((s) => !!s.toast);
  const flapScale = fly.flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] });
  const twinkle = fly.flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });
  const rays = bw * 1.7;
  // G95: the label and the tag ride the box but stay on screen (and fade out with it) at the edges
  const giftRide = gift ? edgeRider(width, bw, BONUS_VIEW.giftWidth) : null;
  const tagRide = pips.lucky ? edgeRider(width, bw, BONUS_VIEW.tagWidth) : null;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.box,
        {
          top: lane,
          width: bw,
          height: bh + PIPS_H,
          transform: [
            { translateX: fly.x.interpolate({ inputRange: [0, 1], outputRange: [-bw, width] }) },
            { translateY: fly.bob.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -b, 0, b, 0] }) },
          ],
        },
      ]}>
      {pips.lucky && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: (bw - rays) / 2, top: (bh - rays) / 2, width: rays, height: rays, transform: [{ rotate: fly.spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
          <Rays size={rays} />
        </Animated.View>
      )}
      {/* the glow, 10 pt past the box all round */}
      <Svg pointerEvents="none" width={bw + 2 * g} height={bh + 2 * g} viewBox={`0 0 ${bw + 2 * g} ${bh + 2 * g}`} style={{ position: 'absolute', left: -g, top: -g }}>
        <Defs>
          <RadialGradient id="gpGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0.55" stopColor="#FFE27A" stopOpacity={pips.lucky ? 0.9 : 0.75} />
            <Stop offset="1" stopColor="#FFD54A" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={(bw + 2 * g) / 2} cy={(bh + 2 * g) / 2} rx={(bw + 2 * g) / 2} ry={(bh + 2 * g) / 2} fill="url(#gpGlow)" />
      </Svg>
      {/* three sparkles trailing behind the flight */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -60 * k, top: 0, opacity: twinkle }}>
        <Svg width={180 * k} height={bh} viewBox="-60 0 180 44">
          {sparkleTrail(path.dir).map((sp, i) => (
            <Path key={i} d={sparkle(30 + sp.x, 22 + sp.y, sp.r)} fill="#FFF6C2" stroke="#E0A800" strokeWidth={0.6} />
          ))}
        </Svg>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.wing, { top: 7 * k, width: 20 * k, height: 26 * k, left: 0, transform: [{ scaleY: flapScale }] }]}>
        <Wing k={k} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.wing, { top: 7 * k, width: 20 * k, height: 26 * k, right: 0, transform: [{ scaleY: flapScale }, { scaleX: -1 }] }]}>
        <Wing k={k} />
      </Animated.View>
      <Pressable
        testID="golden-pizza"
        accessibilityRole="button"
        accessibilityLabel={pips.lucky ? 'Lucky golden pizza. Tap for a big bonus' : 'Golden pizza. Tap for a bonus'}
        onPress={(e) => onTap(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        style={{ width: bw, height: bh }}>
        <Svg width={bw} height={bh} viewBox="0 0 60 44">
          <Box />
        </Svg>
      </Pressable>
      {tagRide && (
        <Animated.View
          testID="golden-lucky-tag"
          pointerEvents="none"
          style={[styles.tag, { transform: [{ translateX: fly.x.interpolate({ inputRange: tagRide.input, outputRange: tagRide.shift }) }], opacity: fly.x.interpolate({ inputRange: tagRide.input, outputRange: tagRide.opacity }) }]}>
          <Text style={styles.tagText}>LUCKY</Text>
        </Animated.View>
      )}
      <View testID="golden-pips" accessibilityLabel={`${pips.filled} of ${pips.total} to the lucky slice`} pointerEvents="none" style={styles.pips}>
        {Array.from({ length: pips.total }, (_, i) => (
          <PipSlice key={i} on={i < pips.filled} last={i === pips.total - 1} lucky={pips.lucky} />
        ))}
        <Text testID="golden-pips-label" style={styles.pipsLabel}>
          {pipsLabel(taps)}
        </Text>
      </View>
      {giftRide && !toastUp && (
        <Animated.View
          testID="golden-gift"
          pointerEvents="none"
          style={[styles.gift, { transform: [{ translateX: fly.x.interpolate({ inputRange: giftRide.input, outputRange: giftRide.shift }) }], opacity: fly.x.interpolate({ inputRange: giftRide.input, outputRange: giftRide.opacity }) }]}>
          <Text style={styles.giftText}>{BONUS_VIEW.giftLine}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** A four-point star centred on (x, y), radius r, in the box's 60 x 44 units. */
const sparkle = (x: number, y: number, r: number): string => `M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`;

/** The box: a lid, a front with a slice on it, a shine, in a #F6C343 to #FFB300 gradient. 60 x 44; the wings sit behind it. */
function Box() {
  return (
    <G>
      <Defs>
        <LinearGradient id="gpFront" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6C343" />
          <Stop offset="1" stopColor="#FFB300" />
        </LinearGradient>
        <LinearGradient id="gpLid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE27A" />
          <Stop offset="1" stopColor="#F6C343" />
        </LinearGradient>
      </Defs>
      <Path d="M17 14 L21 5 L39 5 L43 14 Z" fill="url(#gpLid)" stroke={GOLD_DARK} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M15 14 H45 V37 Q45 39 43 39 H17 Q15 39 15 37 Z" fill="url(#gpFront)" stroke={GOLD_DARK} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M22 20 H38 L30 34 Z" fill="#FFF1C4" stroke={GOLD_DARK} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={29} cy={24} r={2} fill="#E8432E" />
      <Circle cx={33} cy={26.5} r={1.6} fill="#E8432E" />
      <Path d="M18 17 V35" stroke="#FFF6CC" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      {/* a sparkle on the lid's corner */}
      <Path d="M44 2 L45.2 5.2 L48.4 6.4 L45.2 7.6 L44 10.8 L42.8 7.6 L39.6 6.4 L42.8 5.2 Z" fill="#fff" stroke={INK} strokeWidth={0.6} />
    </G>
  );
}

/** The lucky slice's rays: eight soft wedges around the centre (the parent turns them). */
function Rays({ size }: { size: number }) {
  const c = size / 2;
  const wedges = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const half = 0.12;
    const p = (ang: number) => `${(c + Math.cos(ang) * c).toFixed(1)} ${(c + Math.sin(ang) * c).toFixed(1)}`;
    return `M${c} ${c} L${p(a - half)} L${p(a + half)} Z`;
  });
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="gpRay" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0.2" stopColor="#FFF6C2" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FFE27A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {wedges.map((d, i) => (
        <Path key={i} d={d} fill="url(#gpRay)" />
      ))}
    </Svg>
  );
}

/** One streak pip: an 8 pt slice. */
function PipSlice({ on, last, lucky }: { on: boolean; last: boolean; lucky: boolean }) {
  const isLucky = last && lucky;
  return (
    <Svg width={8} height={8} viewBox="0 0 8 8">
      <Path d="M0.7 1.2 H7.3 L4 7.4 Z" fill={isLucky ? '#FFF6C2' : on ? '#FFC531' : 'rgba(255,255,255,0.55)'} stroke={isLucky ? '#E8432E' : GOLD_DARK} strokeWidth={0.9} strokeLinejoin="round" />
    </Svg>
  );
}

function Wing({ k }: { k: number }) {
  return (
    <Svg width={20 * k} height={26 * k} viewBox="0 0 20 26">
      <Path d="M19 18 Q14 3 1 4 Q5 9 3 12 Q8 12 7 17 Q12 16 19 22 Z" fill="#FFFFFF" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M17 17 Q11 11 5 8" stroke="#D8E6F2" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** "+$X" and its second line ("+45 s of sales"), under the box and kept on screen (G93). */
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
          left: pop.left,
          top: pop.top,
          opacity: t.interpolate({ inputRange: [0, 0.12, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -BONUS_VIEW.popRisePx] }) }, { scale: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.6, pop.lucky ? 1.25 : 1.1, 1] }) }],
        },
      ]}>
      <Text style={[styles.popText, pop.lucky && styles.popTextLucky]}>{pop.text}</Text>
      <Text testID="golden-pop-sub" style={styles.popSub}>
        {pop.sub}
      </Text>
    </Animated.View>
  );
}

/** D444: "LUCKY SLICE ×4!" across the whole scene width for 1.2 s, in the sky band (D451) so the cooks' cheer shows below it. */
function LuckyBanner({ id, top, onDone }: { id: number; top: number; onDone: (key: number) => void }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const run = Animated.timing(t, { toValue: 1, duration: BONUS_VIEW.bannerMs, easing: Easing.linear, useNativeDriver: true });
    run.start(({ finished }) => finished && onDone(id));
    return () => run.stop();
  }, [t, id, onDone]);
  return (
    <View pointerEvents="none" style={[styles.bannerWrap, { top: top + 4 }]}>
      <Animated.View
        testID="golden-banner"
        style={[
          styles.banner,
          {
            opacity: t.interpolate({ inputRange: [0, 0.08, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ scale: t.interpolate({ inputRange: [0, 0.12, 0.25, 1], outputRange: [0.6, 1.12, 1, 1] }) }],
          },
        ]}>
        <Text testID="golden-lucky" style={styles.bannerText} adjustsFontSizeToFit numberOfLines={1}>
          {`LUCKY SLICE ×${LUCKY_MULT}!`}
        </Text>
      </Animated.View>
    </View>
  );
}

/** The pips row under the box. */
const PIPS_H = 12;
const GIFT_H = BONUS_VIEW.giftRoom - 6;

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0 },
  wing: { position: 'absolute' },
  pips: { height: PIPS_H, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 },
  pipsLabel: { marginLeft: 3, fontFamily: F.bold, fontSize: 10, color: '#fff', textShadowColor: INK, textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  tag: { position: 'absolute', top: -8, left: 0, width: BONUS_VIEW.tagWidth, alignItems: 'center', paddingVertical: 1, borderRadius: 8, backgroundColor: '#E8432E', borderWidth: 1.5, borderColor: '#fff' },
  tagText: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.8, color: '#fff' },
  gift: { position: 'absolute', top: -GIFT_H - 4, left: 0, width: BONUS_VIEW.giftWidth, height: GIFT_H, justifyContent: 'center', alignItems: 'center', paddingVertical: 3, paddingHorizontal: 6, borderRadius: 10, backgroundColor: '#FFF4DC', borderWidth: 1.5, borderColor: INK },
  giftText: { fontFamily: F.bold, fontSize: 12, color: INK },
  pop: { position: 'absolute', width: BONUS_VIEW.popWidth, alignItems: 'center' },
  popText: { fontFamily: F.bold, fontSize: 20, color: '#FFE27A', textShadowColor: INK, textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
  popTextLucky: { fontSize: 26 },
  popSub: { fontFamily: F.semi, fontSize: 12, color: '#fff', textShadowColor: INK, textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
  bannerWrap: { position: 'absolute', left: 0, right: 0, height: BONUS_VIEW.bannerHeight, justifyContent: 'center' },
  banner: { alignSelf: 'stretch', paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', backgroundColor: 'rgba(192,57,43,0.94)', borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#FFE27A' },
  bannerText: { fontFamily: F.bold, fontSize: 30, letterSpacing: 0.5, color: '#fff', textShadowColor: INK, textShadowRadius: 4, textShadowOffset: { width: 0, height: 2 } },
});
