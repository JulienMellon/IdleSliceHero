// The Test panel (card X1): the red TEST pill in the HUD and the bottom sheet it opens. Tap-only: no row needs a drag.
// Only game-ui.tsx reaches this file, through a require behind the literal env check (src/dev/README.md).
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAP } from '../components/tap-targets';
import { C, F } from '../theme';
import { PANEL_SECTIONS } from './panel-sections';
import { TEST_PILL } from './test-mode';

/** The bundle marker: the normal build's checks grep for this exact string and fail if it is there. */
export const PANEL_MARKER = 'TEST MODE PANEL';

const SLOP = { top: TEST_PILL.slop, bottom: TEST_PILL.slop, left: TEST_PILL.slop, right: TEST_PILL.slop };

export function TestPill() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.pill}
        hitSlop={SLOP}
        testID="test-pill"
        accessibilityRole="button"
        accessibilityLabel="Test mode panel"
      >
        <Text style={styles.pillText}>TEST</Text>
      </Pressable>
      {open && <TestSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function TestSheet({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close the test panel" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]} testID="test-panel">
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {PANEL_MARKER}
            </Text>
            <Pressable onPress={onClose} style={styles.close} testID="test-panel-close" accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            {PANEL_SECTIONS.map((s) => (
              <View key={s.id} style={styles.section} testID={`test-section-${s.id}`}>
                <Text style={styles.sectionTitle}>{s.title}</Text>
                {s.Body ? <s.Body /> : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    right: TEST_PILL.right,
    bottom: TEST_PILL.bottom,
    width: TEST_PILL.width,
    height: TEST_PILL.height,
    borderRadius: TEST_PILL.height / 2,
    backgroundColor: '#B00020',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontFamily: F.bold, color: '#fff', fontSize: 13, letterSpacing: 0.5 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  dismiss: { flex: 1 },
  sheet: {
    maxHeight: '80%',
    minHeight: '45%',
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 6 },
  title: { flex: 1, fontFamily: F.bold, color: '#B00020', fontSize: 18, letterSpacing: 0.5 },
  close: {
    minWidth: TAP.min,
    height: TAP.min,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontFamily: F.bold, color: '#fff', fontSize: 15 },
  body: { gap: 10, paddingVertical: 8 },
  section: { minHeight: 56, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#fff', padding: 10, gap: 8 },
  sectionTitle: { fontFamily: F.bold, color: C.ink, fontSize: 16 },
});
