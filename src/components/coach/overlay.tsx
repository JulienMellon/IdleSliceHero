// The Coach overlay (v5.20, card C1): the one tutorial highlight. A full-screen gray scrim with a rounded cut-out per target (the union of two
// when they touch), a gold pulse outline, Nonna's pointing hand and her card docked clear of the cut-out. Mounted once, above the HUD, the
// sidewalk and the drawer, below cut-scenes and system sheets.
//   tap   taps outside the cut-out are swallowed (and shake the hand once); taps inside fall through to the element below
//   wait  no tap anywhere reaches the game; a breathing ring on the cut-out (G83)
//   look  like wait, ended by a tap anywhere or after 4 s (`onDone`)
//   free  the card only, no scrim
// A target whose rect is missing hides the overlay for that frame: never a scrim with no hole.
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachCard } from '../coach-card';
import { useMotion } from '../scene/clock';
import { blockers, CUT, freeDock, HAND, leaders, outsideTap, overlayLayout, type Rect } from './overlay-model';
import type { CoachMode } from './steps';
import { remeasureTargets, type CoachTargetId, useTargetRects } from './targets';

const native = Platform.OS !== 'web';
/** How long a `look` step stays up by itself (D529: a slow reader still gets the closing line; a tap ends it sooner). */
export const LOOK_MS = 4000;
const SCRIM = '#2A1408';
const GOLD = '#FFD54A';
const INK = '#3B1F14';
const HAND_PATH =
  'M0 -7 Q1.6 -7 1.6 -5 L1.6 -1 L5 -0.4 Q6.6 0 6.2 2 L5 6 Q4.4 7.4 3 7.4 L-2.4 7.4 Q-4 7.4 -4.4 6 L-5.6 1.6 Q-5.8 0 -4.2 0.2 L-1.6 1 L-1.6 -5 Q-1.6 -7 0 -7 Z';

/** One rounded rectangle as an SVG sub-path. */
const hole = ({ x0, y0, x1, y1 }: Rect, r: number) => {
  const k = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  return `M${x0 + k} ${y0} H${x1 - k} Q${x1} ${y0} ${x1} ${y0 + k} V${y1 - k} Q${x1} ${y1} ${x1 - k} ${y1} H${x0 + k} Q${x0} ${y1} ${x0} ${y1 - k} V${y0 + k} Q${x0} ${y0} ${x0 + k} ${y0} Z`;
};

export interface CoachOverlayProps {
  targets: readonly CoachTargetId[];
  mode: CoachMode;
  text: string;
  /** `look` only: called when the step has been seen (a tap, or 4 s). */
  onDone?: () => void;
  /** False for a step whose line is about nothing to tap (15): the breathing ring carries it, no hand. */
  hand?: boolean;
  /** `tap` only: a first tap outside the lit spot nudges as usual; a second one calls `onSkip` (the Store chip, step 16), so one stray tap does not end the intro (C191). */
  skippable?: boolean;
  onSkip?: () => void;
}

// primitive or stable props (the step's own target list, its text, a stable callback), so a screen tick that changes nothing repaints nothing (M72)
export const CoachOverlay = memo(function CoachOverlay({ targets, mode, text, onDone, hand: showHand = true, skippable = false, onSkip }: CoachOverlayProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wantsTargets = mode !== 'free' || targets.length > 0;
  const rects = useTargetRects(wantsTargets ? targets : []);
  const idKey = targets.join(',');
  // a target may have moved since it measured itself (a wide shop scrolled, the row rose): ask again when the step starts and as the screen settles
  useEffect(() => {
    if (!idKey) return;
    const ids = idKey.split(',') as CoachTargetId[];
    remeasureTargets(ids);
    const timers = [250, 750].map((ms) => setTimeout(() => remeasureTargets(ids), ms));
    return () => timers.forEach(clearTimeout);
  }, [idKey]);

  const [pulse] = useState(() => new Animated.Value(0));
  const [shake] = useState(() => new Animated.Value(0));
  const { loops } = useMotion();
  useEffect(() => {
    if (!loops) {
      pulse.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loops, pulse]);

  const skipRef = useRef(onSkip);
  const lastOutside = useRef<number | null>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
    skipRef.current = onSkip;
  });
  // C193: a stray tap on one step must not count towards the next step's skip: the first outside tap of a new step only nudges
  useEffect(() => {
    lastOutside.current = null;
  }, [idKey, text, skippable]);
  useEffect(() => {
    if (mode !== 'look') return;
    const t = setTimeout(() => doneRef.current?.(), LOOK_MS);
    return () => clearTimeout(t);
  }, [mode, idKey, text]);

  const layout = useMemo(
    () =>
      rects && rects.length > 0
        ? overlayLayout(rects, { w: width, h: height }, { top: insets.top, bottom: insets.bottom }, mode === 'wait' || mode === 'look' ? mode : 'tap', targets)
        : null,
    [rects, width, height, insets.top, insets.bottom, mode, targets],
  );
  const holes = useMemo(() => (layout ? layout.cuts.map((c) => hole(c, CUT.radius)).join(' ') : ''), [layout]);
  const pieces = useMemo(() => (layout && mode === 'tap' ? blockers(layout.cuts, { w: width, h: height }) : []), [layout, mode, width, height]);

  const links = useMemo(() => (layout ? leaders(layout.cuts) : []), [layout]);
  const anim = useMemo(
    () => ({
      glow: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
      halo: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.154, 0.28] }),
      breathe: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }),
      grow: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }),
      bounce: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
      swing: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }),
    }),
    [pulse, shake],
  );

  const nudge = () => {
    shake.setValue(0);
    Animated.sequence([-1, 1, -0.6, 0.6, 0].map((to) => Animated.timing(shake, { toValue: to, duration: 60, useNativeDriver: native }))).start();
  };

  // no rect yet (the target has not measured itself): nothing, never a scrim without its hole
  if (!rects) return null;
  if (mode === 'free') {
    const dock = layout?.card ?? freeDock({ top: insets.top, bottom: insets.bottom });
    return (
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill} testID="coach-overlay">
        <CoachCard text={text} top={dock.top} bottom={dock.bottom} />
      </View>
    );
  }
  if (!layout) return null;

  const { glow, halo, breathe, grow, bounce, swing } = anim;
  const waiting = mode !== 'tap';
  const { hand, card } = layout;
  const half = HAND.size / 2;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} testID="coach-overlay">
      <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={`M0 0 H${width} V${height} H0 Z ${holes}`} fill={SCRIM} opacity={0.6} fillRule="evenodd" />
        {/* D524: a dotted gold leader links the station's hole to its dial's, so the eye need not make the jump */}
        {links.map((l, i) => (
          <Line key={i} x1={l.x0} y1={l.y0} x2={l.x1} y2={l.y1} stroke={GOLD} strokeWidth={2} strokeDasharray="1 6" strokeLinecap="round" opacity={0.9} />
        ))}
      </Svg>
      {/* the touches: one view that claims every touch, over everything (wait, look), or the pieces round the holes (tap), so a tap in a hole reaches the element below */}
      {waiting ? (
        <View
          testID="coach-block"
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderRelease={mode === 'look' ? () => doneRef.current?.() : undefined}
        />
      ) : (
        pieces.map((p, i) => (
          <View
            key={i}
            testID="coach-block"
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => {
              const tap = outsideTap(lastOutside.current, Date.now());
              lastOutside.current = tap.last;
              if (skippable && tap.skip) skipRef.current?.();
              else nudge();
            }}
            style={{ position: 'absolute', left: p.x0, top: p.y0, width: p.x1 - p.x0, height: p.y1 - p.y0 }}
          />
        ))
      )}
      {layout.cuts.map((c, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{ position: 'absolute', left: c.x0, top: c.y0, width: c.x1 - c.x0, height: c.y1 - c.y0 }}
          testID={`coach-cut-${i}`}
        >
          {/* a soft glow, then the gold outline */}
          <Animated.View style={[styles.ring, styles.glow, { opacity: halo }]} />
          <Animated.View style={[styles.ring, styles.outline, { opacity: glow }]} />
          {/* G83: on a wait step the ring breathes outward, so the thing being waited on still reads as the focus */}
          {waiting && <Animated.View style={[styles.ring, styles.breath, { opacity: breathe, transform: [{ scale: grow }] }]} />}
        </View>
      ))}
      {showHand && (
        <Animated.View
          pointerEvents="none"
          testID="coach-hand"
          style={{
            position: 'absolute',
            left: hand.x - half,
            top: hand.y - half,
            width: HAND.size,
            height: HAND.size,
            transform: [{ translateX: swing }, { translateY: waiting ? 0 : bounce }, { rotate: `${hand.rot}deg` }],
          }}
        >
          <Svg width={HAND.size} height={HAND.size} viewBox="-8 -8 16 16">
            <Path d={HAND_PATH} fill="#fff" stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      )}
      <CoachCard text={text} top={card.top} bottom={card.bottom} />
    </View>
  );
});

const styles = StyleSheet.create({
  ring: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: CUT.radius },
  glow: { left: -4, top: -4, right: -4, bottom: -4, borderRadius: CUT.radius + 4, borderWidth: 8, borderColor: GOLD },
  outline: { borderWidth: 3, borderColor: GOLD },
  breath: { borderWidth: 2, borderColor: '#fff' },
});
