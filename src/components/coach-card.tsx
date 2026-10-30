// Nonna's tutorial card (P2): her portrait and one line, docked low (above the sidewalk row) when she points at
// the kitchen, high (in the sky band) when she points at the sidewalk or the HUD, so it never covers its target.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CoachStep } from '../engine/tutorial';
import { F } from '../theme';
import { Portrait } from './portrait';

export const CoachCard = memo(function CoachCard({ step, low, high }: { step: CoachStep; low: number; high: number }) {
  return (
    <View testID="coach" pointerEvents="none" style={[styles.card, step.dock === 'low' ? { bottom: low } : { top: high }]}>
      <Portrait id="nonna-rosa" mood="happy" size={56} />
      <Text style={styles.text} maxFontSizeMultiplier={1.3}>
        {step.text}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 84,
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
  text: { flex: 1, fontFamily: F.bold, fontSize: 15, color: '#3B1F14' },
});
