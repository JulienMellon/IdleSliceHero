// Industrial's sheet (SHEETS slot), opened from its shift chip: the three shifts with the one on the clock marked, the time to the next, and
// the oven jam (when the next one comes, or the one now with its wrench's hint). Built only while it is open.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SHIFTS } from '../../../content/layers';
import { jamView, shiftView } from '../../../engine/features/layers/industrial-shifts';
import { useGame } from '../../../store/game-store';
import { C, F } from '../../../theme';
import { fill } from '../../report/report-model';
import { mmss } from '../layer-model';
import { LayerSheet } from '../university/layer-ui';
import { COPY } from './copy';
import { industrialSheet, useIndustrialSheet } from './industrial-state';
import { jamLabel } from './jam-model';
import { shiftRows } from './shift-model';

function Sheet() {
  const game = useGame((s) => s.game);
  const sv = shiftView(game);
  const jv = jamView(game);
  const label = jamLabel(jv);
  return (
    <LayerSheet testID="industrial-sheet" title={COPY['layer.industrial.shift.info.title']} onClose={industrialSheet.close}>
      <Text style={styles.body}>{COPY['layer.industrial.shift.info.body']}</Text>
      {shiftRows(sv.shift, SHIFTS.shifts).map((r) => (
        <View key={r.id} style={[styles.row, r.now && styles.rowNow]} testID={`shift-row-${r.id}`}>
          <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
          <Text style={styles.effect} numberOfLines={1}>{r.effect}</Text>
        </View>
      ))}
      <Text style={styles.line} testID="shift-left">{fill(COPY['layer.industrial.shift.chip'], { time: mmss(sv.left) })}</Text>
      <View style={styles.jam} testID="jam-status">
        <Text style={styles.jamHead}>{label ?? `Next jam in ${mmss(jv.nextIn)}`}</Text>
      </View>
    </LayerSheet>
  );
}

export const IndustrialSheet = memo(function IndustrialSheet() {
  return useIndustrialSheet() ? <Sheet /> : null;
});

const styles = StyleSheet.create({
  body: { fontFamily: F.regular, fontSize: 13, lineHeight: 17, color: C.inkSoft },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 36, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: C.lockedDark, paddingHorizontal: 10 },
  rowNow: { borderColor: C.ink, borderWidth: 2.5, backgroundColor: '#FFF1C9' },
  name: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  effect: { fontFamily: F.semi, fontSize: 12, color: C.inkSoft },
  line: { fontFamily: F.bold, fontSize: 14, color: C.ink, textAlign: 'center' },
  jam: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: C.ink, padding: 10 },
  jamHead: { fontFamily: F.bold, fontSize: 14, color: C.tomatoDark, textAlign: 'center' },
});
