// The shop report's sheet (SHEETS slot): opened by a tap on the strip. Each station's rate a minute and load, the floor, service with the
// tip and cold thresholds and the cold timer, and three "ways to fix it" rows that name real purchases. Built only while it is open.
import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { LAMP_COLOR, sheetModel } from './report-model';
import { closeReport, useReportOpen } from './sheet-state';

function Sheet() {
  const game = useGame((s) => s.game);
  const now = useGame((s) => s.tickAt);
  const m = sheetModel(game, game.active, now);
  return (
    <View style={styles.overlay} testID="report-sheet">
      <Pressable style={StyleSheet.absoluteFill} onPress={closeReport} accessibilityRole="button" accessibilityLabel="Close the shop report" />
      <View style={styles.card}>
        <Text style={styles.title}>{m.title}</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
          {m.rows.map((r) => (
            <View key={r.key} style={styles.row} testID={`report-row-${r.key}`}>
              <View style={[styles.dot, { backgroundColor: LAMP_COLOR[r.tone] }]} />
              <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
              <Text style={styles.rate} numberOfLines={1}>{r.rate}</Text>
              <Text style={styles.load} numberOfLines={1}>{r.load}</Text>
              <Text style={styles.word} numberOfLines={1}>{r.word}</Text>
            </View>
          ))}
          <View style={styles.service} testID="report-service">
            <Text style={styles.serviceHead}>{`Service ${m.service}`}</Text>
            <Text style={styles.small}>{m.tip}</Text>
            <Text style={styles.small}>{m.cold}</Text>
            {m.timer ? <Text style={[styles.small, styles.timer]}>{m.timer}</Text> : null}
          </View>
          {m.fixes.map((f) => (
            <View key={f.key} style={styles.fix} testID={`report-fix-${f.key}`}>
              <Text style={styles.fixTitle}>{f.title}</Text>
              <Text style={styles.small}>{f.line}</Text>
              <Text style={styles.buys}>{f.buys}</Text>
            </View>
          ))}
        </ScrollView>
        <Pressable testID="close-report" accessibilityRole="button" onPress={closeReport} style={styles.close}>
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

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: C.bg, borderRadius: 20, borderWidth: 4, borderColor: C.ink, padding: 14, width: '100%', maxWidth: 360, maxHeight: '88%', gap: 8 },
  title: { fontFamily: F.bold, fontSize: 22, color: C.ink, textAlign: 'center' },
  scroll: { flexGrow: 0 },
  body: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { flex: 1, fontFamily: F.semi, fontSize: 13, color: C.ink },
  rate: { width: 62, fontFamily: F.bold, fontSize: 13, color: C.ink, textAlign: 'right' },
  load: { width: 42, fontFamily: F.regular, fontSize: 12, color: C.inkSoft, textAlign: 'right' },
  word: { width: 56, fontFamily: F.semi, fontSize: 11, color: C.inkSoft, textAlign: 'right' },
  service: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: C.ink, padding: 10, gap: 2 },
  serviceHead: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  small: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: C.inkSoft },
  timer: { fontFamily: F.semi, color: C.tomatoDark },
  fix: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: C.lockedDark, padding: 8, gap: 1 },
  fixTitle: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  buys: { fontFamily: F.semi, fontSize: 11, color: C.basilDark },
  close: { height: 44, borderRadius: 12, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
});
