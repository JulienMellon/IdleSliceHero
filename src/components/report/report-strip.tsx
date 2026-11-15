// The shop report's strip (SHOP_REPORT slot): one 44 pt row directly above the sidewalk row. Four lamps (prep, ovens, counter, floor) with
// a one-word label under the worst one, and one line from the copy: the manager's voice and face when one is hired. A tap opens the sheet.
// It selects a primitives-only model (report-model.ts `stripModel`) with a shallow compare, so it repaints when a word or a lamp changes,
// never on a game tick. Nothing for a shop that does not run itself, or in the tutorial.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

import { MANAGERS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { Portrait } from '../portrait';
import { HeadFace } from '../scene/head-face';
import { LAMP_COLOR, STRIP, stripFont, stripModel, stripTextWidth, type LampTone } from './report-model';
import { openReport } from './sheet-state';

const DOTS = ['prep', 'ovens', 'counter', 'floor'] as const;

/** The manager's face: Nonna's portrait in Downtown, otherwise the head-face drawing the drawer uses (same name, same face). */
function ManagerBadge({ hood }: { hood: NeighborhoodId }) {
  if (hood === 'downtown') return <Portrait id="nonna-rosa" mood="happy" size={STRIP.badge} />;
  return (
    <Svg width={STRIP.badge} height={STRIP.badge} viewBox="-20 -24 40 44">
      <HeadFace kind="gm" name={MANAGERS[hood].id} size={40} />
    </Svg>
  );
}

export const ReportStrip = memo(function ReportStrip({ bottom }: { bottom: number }) {
  const m = useGame(useShallow((s) => stripModel(s.game, s.game.active, s.tickAt)));
  const hood = useGame((s) => s.game.active);
  const { width: screenW } = useWindowDimensions();
  if (!m.show) return null;
  const withBadge = m.manager !== '';
  const { size } = stripFont(m.text, stripTextWidth(screenW, withBadge));
  const tones: Record<(typeof DOTS)[number], LampTone> = { prep: m.prep, ovens: m.ovens, counter: m.counter, floor: m.floor };
  return (
    <Pressable testID="shop-report-strip" accessibilityRole="button" accessibilityLabel={`Shop report. ${m.text}`} onPress={openReport} style={[styles.strip, { bottom }]}>
      <View style={styles.lamps}>
        <View style={styles.dots}>
          {DOTS.map((d) => (
            <View key={d} testID={`lamp-${d}`} style={[styles.dot, { backgroundColor: LAMP_COLOR[tones[d]] }, m.worstDot === d && styles.dotWorst]} />
          ))}
        </View>
        <Text style={styles.word} numberOfLines={1} maxFontSizeMultiplier={1.1}>
          {m.word}
        </Text>
      </View>
      {withBadge ? <ManagerBadge hood={hood} /> : null}
      <Text testID="shop-report-line" style={[styles.line, { fontSize: size, lineHeight: size + 2 }]} numberOfLines={STRIP.maxLines} maxFontSizeMultiplier={1.1}>
        {m.text}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: STRIP.margin, right: STRIP.margin, height: STRIP.height, flexDirection: 'row', alignItems: 'center', gap: STRIP.gap, paddingHorizontal: STRIP.padX, borderRadius: 12, borderWidth: 2, borderColor: C.ink, backgroundColor: 'rgba(255,255,255,0.96)' },
  lamps: { width: STRIP.lampsWidth, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: STRIP.dotGap },
  dot: { width: STRIP.dot, height: STRIP.dot, borderRadius: STRIP.dot / 2 },
  dotWorst: { borderWidth: 2, borderColor: C.ink },
  word: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: C.ink, marginTop: 2 },
  line: { flex: 1, fontFamily: F.semi, color: C.ink },
});
