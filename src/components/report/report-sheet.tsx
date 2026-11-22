// The shop report's sheet (SHEETS slot), opened by a tap on the strip (card U3, v5.22): one bar per station and one for the drivers, all basil,
// each as long as the pizzas a minute it can handle, one dashed ink line across them at the customers a minute, then served and missed, and the
// service score. No lamps, no red, no station named as the limit. Built only while it is open; opening it tells the store (`reportOpened`).
import { memo, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import type { CoachTargetId } from '../../engine/coach-types';
import { useCoachTarget } from '../coach/targets';
import { REPORT_TARGET, sheetModel, type BarRow } from './report-model';
import { closeReport, useReportOpen } from './sheet-state';

const BAR_H = 14;
const ROW_H = 22;

/** One bar: its name, the track with the basil bar (and "You" when the player's hands make it) and its value at the end. Primitive props, so a tick that changes nothing repaints nothing. */
const Bar = memo(function Bar({ id, name, value, frac, you }: { id: CoachTargetId; name: string; value: string; frac: number; you: string }) {
  const t = useCoachTarget(id);
  return (
    <View ref={t} onLayout={t.onLayout} style={styles.row} testID={`report-bar-${id.split(':').pop()}`}>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${Math.round(frac * 100)}%` }]} />
        {you ? (
          <Text style={styles.you} numberOfLines={1} maxFontSizeMultiplier={1.1}>
            {you}
          </Text>
        ) : null}
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
});

/** The dashed line across the bars' tracks, `frac` of the way along. It is drawn over the tracks column only, which is why that column has its own box. */
function DemandLine({ frac }: { frac: number }) {
  const x = `${(frac * 100).toFixed(1)}%`;
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Line x1={x} x2={x} y1="0" y2="100%" stroke={C.ink} strokeWidth={2} strokeDasharray="5 3" />
    </Svg>
  );
}

function Sheet() {
  const game = useGame((s) => s.game);
  const now = useGame((s) => s.tickAt);
  const reportOpened = useGame((s) => s.reportOpened);
  const demandTarget = useCoachTarget(REPORT_TARGET.demand);
  const closeTarget = useCoachTarget(REPORT_TARGET.close);
  useEffect(() => {
    reportOpened();
  }, [reportOpened]);
  const m = sheetModel(game, game.active, now);
  return (
    <View style={styles.overlay} testID="report-sheet">
      <Pressable style={StyleSheet.absoluteFill} onPress={closeReport} accessibilityRole="button" accessibilityLabel="Close the shop report" />
      <View style={styles.card}>
        <Text style={styles.title}>{m.title}</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
          <View ref={demandTarget} onLayout={demandTarget.onLayout} style={styles.legend} testID="report-demand">
            <Svg width={6} height={16} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Line x1="3" x2="3" y1="0" y2="16" stroke={C.ink} strokeWidth={2} strokeDasharray="4 3" />
            </Svg>
            <Text style={styles.legendText} numberOfLines={1}>
              {m.demand.label}
            </Text>
          </View>
          <View style={styles.bars}>
            {m.bars.map((b: BarRow) => (
              <Bar key={b.key} id={b.target} name={b.name} value={b.value} frac={b.frac} you={b.you} />
            ))}
            <View style={styles.lineBox} pointerEvents="none">
              <DemandLine frac={m.demand.frac} />
            </View>
          </View>
          <View style={styles.flow} testID="report-flow">
            <Text style={styles.served}>{m.served}</Text>
            <Text style={styles.missed}>{m.missed}</Text>
          </View>
          <View style={styles.service} testID="report-service">
            <View style={styles.serviceTop}>
              <Text style={styles.serviceHead}>{m.service}</Text>
              {m.stateWord ? <Text style={styles.stateWord}>{m.stateWord}</Text> : null}
            </View>
            <Text style={styles.small}>{m.tip}</Text>
            <Text style={styles.small}>{m.cold}</Text>
            {m.timer ? <Text style={[styles.small, styles.timer]}>{m.timer}</Text> : null}
          </View>
        </ScrollView>
        <Pressable
          ref={closeTarget}
          onLayout={closeTarget.onLayout}
          testID="close-report"
          accessibilityRole="button"
          onPress={closeReport}
          style={styles.close}
        >
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const ReportSheet = memo(function ReportSheet() {
  const open = useReportOpen();
  return open ? <Sheet /> : null;
});

// the name and value columns' widths; the tracks column takes the rest, and the dashed line is laid over it alone
const NAME_W = 64;
const VALUE_W = 58;
const GAP = 6;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30,14,8,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: { backgroundColor: C.bg, borderRadius: 20, borderWidth: 4, borderColor: C.ink, padding: 14, width: '100%', maxWidth: 360, maxHeight: '88%', gap: 8 },
  title: { fontFamily: F.bold, fontSize: 22, color: C.ink, textAlign: 'center' },
  scroll: { flexGrow: 0 },
  body: { gap: 10 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  legendText: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  bars: { gap: 4, position: 'relative' },
  row: { flexDirection: 'row', alignItems: 'center', gap: GAP, height: ROW_H },
  name: { width: NAME_W, fontFamily: F.semi, fontSize: 13, color: C.ink },
  track: { flex: 1, height: BAR_H, justifyContent: 'center' },
  bar: { height: BAR_H, borderRadius: 4, backgroundColor: C.basil },
  you: {
    position: 'absolute',
    left: 3,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
    fontFamily: F.bold,
    fontSize: 10,
    lineHeight: 12,
    color: C.ink,
    includeFontPadding: false,
  },
  value: { width: VALUE_W, fontFamily: F.bold, fontSize: 13, color: C.ink, textAlign: 'right' },
  // the tracks column: from after the name column to before the value column, over every row
  lineBox: { position: 'absolute', top: 0, bottom: 0, left: NAME_W + GAP, right: VALUE_W + GAP },
  flow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  served: { fontFamily: F.bold, fontSize: 15, color: C.basilDark },
  missed: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  service: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: C.ink, padding: 10, gap: 2 },
  serviceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceHead: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  stateWord: { fontFamily: F.semi, fontSize: 12, color: C.inkSoft },
  small: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: C.inkSoft },
  timer: { fontFamily: F.semi, color: C.tomatoDark },
  close: { height: 44, borderRadius: 12, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
});
