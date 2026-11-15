// The layers' info sheets (SHEETS slot): one card for the open layer. What it is, the numbers, what to buy to do better. Built only while open.
import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { LABELS } from './layer-text';
import { sheetModel } from './sheet-model';
import { closeLayerSheet, useLayerSheet, type SheetKind } from './sheet-state';

function Sheet({ kind }: { kind: SheetKind }) {
  const game = useGame((s) => s.game);
  const m = sheetModel(kind, game, Date.now());
  return (
    <View style={styles.overlay} testID={`layer-sheet-${kind}`}>
      <Pressable style={StyleSheet.absoluteFill} onPress={closeLayerSheet} accessibilityLabel="Close" />
      <View style={styles.card}>
        <Text style={styles.title}>{m.title}</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
          {m.speaker ? <Text style={styles.speaker}>{m.speaker}</Text> : null}
          <Text style={styles.text}>{m.body}</Text>
          <View style={styles.rows}>
            {m.rows.map((r) => (
              <View key={r.key} style={styles.row} testID={`layer-row-${r.key}`}>
                <Text style={styles.label} numberOfLines={1}>{r.label}</Text>
                <Text style={styles.value} numberOfLines={1}>{r.value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.head}>{LABELS.buyBetter}</Text>
          {m.buys.map((b) => (
            <View key={b.key} style={styles.buy} testID={`layer-buy-${b.key}`}>
              <Text style={styles.buyTitle}>{b.title}</Text>
              <Text style={styles.small}>{b.line}</Text>
            </View>
          ))}
        </ScrollView>
        {m.action ? (
          <Pressable
            testID="layer-action"
            accessibilityRole="button"
            accessibilityState={{ disabled: !m.action.enabled }}
            onPress={() => {
              if (!m.action?.enabled) return;
              if (useGame.getState().startRival(game.active)) closeLayerSheet();
            }}
            style={[styles.start, !m.action.enabled && styles.startWait]}
          >
            <Text style={styles.startText}>{m.action.label}</Text>
          </Pressable>
        ) : null}
        <Pressable testID="close-layer-sheet" accessibilityRole="button" onPress={closeLayerSheet} style={styles.close}>
          <Text style={styles.closeText}>{LABELS.close}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const LayerSheet = memo(function LayerSheet() {
  const kind = useLayerSheet();
  return kind ? <Sheet kind={kind} /> : null;
});

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: C.bg, borderRadius: 20, borderWidth: 4, borderColor: C.ink, padding: 14, width: '100%', maxWidth: 360, maxHeight: '88%', gap: 8 },
  title: { fontFamily: F.bold, fontSize: 20, lineHeight: 24, color: C.ink, textAlign: 'center' },
  scroll: { flexGrow: 0 },
  body: { gap: 8 },
  speaker: { fontFamily: F.bold, fontSize: 12, color: C.tomatoDark },
  text: { fontFamily: F.regular, fontSize: 13, lineHeight: 17, color: C.ink },
  rows: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: C.ink, padding: 8, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 22 },
  label: { flex: 1, fontFamily: F.semi, fontSize: 13, color: C.inkSoft },
  value: { fontFamily: F.bold, fontSize: 14, color: C.ink, textAlign: 'right' },
  head: { fontFamily: F.bold, fontSize: 14, color: C.basilDark },
  buy: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: C.lockedDark, padding: 8, gap: 1 },
  buyTitle: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  small: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: C.inkSoft },
  start: { height: 44, borderRadius: 12, backgroundColor: C.tomato, borderWidth: 2, borderColor: C.tomatoDark, alignItems: 'center', justifyContent: 'center' },
  startWait: { backgroundColor: C.locked, borderColor: C.lockedDark },
  startText: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
  close: { height: 44, borderRadius: 12, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
});
