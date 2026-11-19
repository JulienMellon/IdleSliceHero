// The shop report's strip (SHOP_REPORT slot): a 44 pt touch box directly above the sidewalk row with a 28 pt pill drawn at its foot (D479). Four lamp chips (P, O, C, In) with
// one state word under them (always, D492), and one line from the copy: the manager's voice and face when one is hired. A tap opens the sheet.
// It selects a primitives-only model (report-model.ts `stripModel`) with a shallow compare, so it repaints when a word or a lamp changes,
// never on a game tick. Nothing for a shop that does not run itself, or in the tutorial.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

import { cityOf } from '../../content/cities';
import type { NeighborhoodId } from '../../content/types';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { Portrait } from '../portrait/index';
import { HeadFace } from '../scene/head-face';
import { LAMP_COLOR, LAMP_INK, lampInitial, STRIP, stripFont, stripLineHeight, stripModel, stripTextWidth, type LampTone } from './report-model';
import { openReport } from './sheet-state';

const CHIPS = ['prep', 'ovens', 'counter', 'floor'] as const;

/** The manager's face: Nonna's portrait in Downtown, otherwise the head-face drawing the drawer uses (same name, same face). */
function ManagerBadge({ hood }: { hood: NeighborhoodId }) {
  const city = useGame((s) => s.game.city);
  if (hood === 'downtown') return <Portrait id="nonna-rosa" mood="happy" size={STRIP.badge} />;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={STRIP.badge} height={STRIP.badge} viewBox="-20 -24 40 44">
      <HeadFace kind="gm" name={cityOf({ city }).managers[hood]?.id ?? hood} size={40} />
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
  const tones: Record<(typeof CHIPS)[number], LampTone> = { prep: m.prep, ovens: m.ovens, counter: m.counter, floor: m.floor };
  return (
    // the touch box is 44 pt; only its bottom 28 pt are drawn, so the shop front and the mat show above the pill (D479)
    <Pressable
      testID="shop-report-strip"
      accessibilityRole="button"
      accessibilityLabel={`Shop report. ${m.word}. ${m.text}`}
      onPress={openReport}
      style={[styles.box, { bottom }]}
    >
      <View style={styles.pill}>
        <View style={styles.lamps}>
          <View style={styles.chips}>
            {CHIPS.map((d) => (
              <View key={d} testID={`lamp-${d}`} style={[styles.chip, { backgroundColor: LAMP_COLOR[tones[d]] }, m.worstDot === d && styles.chipWorst]}>
                <Text style={[styles.initial, { color: LAMP_INK[tones[d]] === 'light' ? '#FFFFFF' : C.ink }]} numberOfLines={1} maxFontSizeMultiplier={1.1}>
                  {lampInitial(d)}
                </Text>
              </View>
            ))}
          </View>
          <Text testID="shop-report-word" style={styles.word} numberOfLines={1} maxFontSizeMultiplier={1.1}>
            {m.word}
          </Text>
        </View>
        {withBadge ? <ManagerBadge hood={hood} /> : null}
        <Text
          testID="shop-report-line"
          style={[styles.line, { fontSize: size, lineHeight: stripLineHeight(size) }]}
          numberOfLines={STRIP.maxLines}
          maxFontSizeMultiplier={1.1}
        >
          {m.text}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  box: { position: 'absolute', left: STRIP.margin, right: STRIP.margin, height: STRIP.height, justifyContent: 'flex-end' },
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
  lamps: { width: STRIP.lampsWidth, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: STRIP.chipGap },
  chip: { width: STRIP.chipW, height: STRIP.chipH, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  chipWorst: { borderWidth: 1.5, borderColor: C.ink },
  initial: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, includeFontPadding: false },
  word: { fontFamily: F.bold, fontSize: 10, lineHeight: 11, color: C.ink },
  line: { flex: 1, fontFamily: F.semi, color: C.ink },
});
