// Nonna's tutorial card (P2): her portrait and one line. The Coach overlay (coach/overlay.tsx) docks it: below the cut-out when there is room,
// else above, so it never covers its target. Primitive props, so a frame with the same text and dock repaints nothing.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { F } from '../theme';
import { Portrait } from './portrait/index';

export const CoachCard = memo(function CoachCard({ text, top, bottom }: { text: string; top?: number; bottom?: number }) {
  return (
    <View testID="coach" pointerEvents="none" style={[styles.card, top !== undefined ? { top } : { bottom: bottom ?? 8 }]}>
      <Portrait id="nonna-rosa" mood="happy" size={44} />
      <Text style={styles.text} maxFontSizeMultiplier={1.3}>
        {text}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 64,
    backgroundColor: '#FFF4DC',
    borderWidth: 2,
    borderColor: '#5A2E1A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    boxShadow: '0 4px 0 rgba(59,31,20,0.25)',
  } as object,
  text: { flex: 1, fontFamily: F.bold, fontSize: 14, color: '#3B1F14' },
});
