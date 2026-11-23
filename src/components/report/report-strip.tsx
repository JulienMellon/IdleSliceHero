// The shop report's strip (SHOP_REPORT slot): a 44 pt touch box directly above the sidewalk row with a 28 pt pill drawn at its foot (D479). It shows one line,
// "Served 41/min · Missed 7/min", and the manager's face when one runs the shop. No lamps, no colours, no station named. A tap opens the sheet.
// It selects a primitives-only model (report-model.ts `stripModel`) with a shallow compare, so it repaints when a number changes, never on a game tick.
// Nothing for a shop with no head and no manager yet.
import { memo, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

import { cityOf } from '../../content/cities';
import { t } from '../../content/copy';
import type { NeighborhoodId } from '../../content/types';
import { firstHood } from '../../engine/game';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { useCoachTarget } from '../coach/targets';
import { emitCheer, emitCoin } from '../pulse-bus';
import { Portrait } from '../portrait/index';
import { useMotion } from '../scene/clock';
import { HeadFace } from '../scene/head-face';
import {
  markMissedZeroSeen,
  MISSED_ZERO_HOLD_S,
  missedZeroPlays,
  missedZeroSeen,
  PAYOFF,
  REPORT_TARGET,
  STRIP,
  stripFont,
  stripLineHeight,
  stripModel,
  stripTextWidth,
} from './report-model';
import { openReport } from './sheet-state';

/** The manager's face: the city's founder in its first shop (their portrait), otherwise the head-face drawing the drawer uses (same name, same face). */
function ManagerBadge({ hood }: { hood: NeighborhoodId }) {
  const cityId = useGame((s) => s.game.city);
  const city = cityOf({ city: cityId });
  if (city.founder && hood === firstHood(city)) return <Portrait id={city.founder.id} mood="happy" size={STRIP.badge} city={cityId} />;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={STRIP.badge} height={STRIP.badge} viewBox="-20 -24 40 44">
      <HeadFace kind="gm" name={city.managers[hood]?.id ?? hood} size={40} />
    </Svg>
  );
}

export const ReportStrip = memo(function ReportStrip({ bottom }: { bottom: number }) {
  const m = useGame(useShallow((s) => stripModel(s.game, s.game.active, s.tickAt)));
  const hood = useGame((s) => s.game.active);
  const target = useCoachTarget(REPORT_TARGET.strip);
  const { width: screenW } = useWindowDimensions();
  const missedZeroShown = useGame((s) => s.missedZeroShown);
  const motion = useMotion();
  const [flash] = useState(() => new Animated.Value(0));
  const [line, setLine] = useState(false);
  const pill = useRef<ComponentRef<typeof View>>(null);
  // D556: Missed held at 0 for 10 s plays the payoff once per shop per session (a basil flash, 6 coins from the strip to the cash, Nonna's line in place of the
  // numbers for a few seconds); the save records it too (`missedZeroShown`)
  const plays = m.show && missedZeroPlays(m.zero, missedZeroSeen(hood));
  useEffect(() => {
    if (!plays) return;
    const hold = setTimeout(() => {
      markMissedZeroSeen(hood);
      missedZeroShown();
      setLine(true);
      emitCheer(); // the crew cheers with Nonna (the scene's cooks raise both arms)
      if (motion.fly)
        pill.current?.measureInWindow((x: number, y: number, w: number, h: number) => {
          for (let i = 0; i < PAYOFF.coins; i++) emitCoin({ x: x + w / 2 + (i - (PAYOFF.coins - 1) / 2) * 6, y: y + h / 2, ms: 420 + i * 70 });
        });
      flash.setValue(0);
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: PAYOFF.flashMs / 3, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: (PAYOFF.flashMs * 2) / 3, useNativeDriver: true }),
      ]).start();
    }, MISSED_ZERO_HOLD_S * 1000);
    return () => clearTimeout(hold);
  }, [plays, hood, missedZeroShown, flash, motion.fly]);
  useEffect(() => {
    if (!line) return;
    const id = setTimeout(() => setLine(false), PAYOFF.lineMs);
    return () => clearTimeout(id);
  }, [line]);
  if (!m.show) return null;
  const withBadge = m.manager !== '';
  const text = line ? t('report.missedZero') : m.text;
  const { size } = stripFont(text, stripTextWidth(screenW, withBadge));
  return (
    // the touch box is 44 pt; only its bottom 28 pt are drawn, so the shop front and the mat show above the pill (D479)
    <Pressable
      ref={target}
      onLayout={target.onLayout}
      testID="shop-report-strip"
      accessibilityRole="button"
      accessibilityLabel={`Shop report. ${text}`}
      onPress={openReport}
      style={[styles.box, { bottom }, m.idle && styles.boxTop]}
    >
      <View ref={pill} style={styles.pill}>
        <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
        {withBadge ? <ManagerBadge hood={hood} /> : null}
        <Text
          testID="shop-report-line"
          style={[styles.line, { fontSize: size, lineHeight: stripLineHeight(size) }]}
          numberOfLines={STRIP.maxLines}
          maxFontSizeMultiplier={1.1}
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  box: { position: 'absolute', left: STRIP.margin, right: STRIP.margin, height: STRIP.height, justifyContent: 'flex-end' },
  boxTop: { justifyContent: 'flex-start' },
  pill: {
    height: STRIP.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: STRIP.gap,
    paddingHorizontal: STRIP.padX,
    borderRadius: 12,
    borderWidth: STRIP.border,
    borderColor: C.ink,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  flash: { ...StyleSheet.absoluteFill, borderRadius: 10, backgroundColor: C.basil },
  line: { flex: 1, fontFamily: F.semi, color: C.ink, textAlign: 'center' },
});
