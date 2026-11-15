// A HUD chip for a layer (HUD_CHIPS slot): a 44 pt pill with two short lines ("Game Day" over "3:07"). Primitive props only, so it
// repaints when its text changes (once a second at most), never on a game tick. A tap opens the layer's info sheet.
import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { C, F } from '../../theme';
import { CHIP_H, chipLines, chipWidth } from './layer-model';
import { openLayerSheet, type SheetKind } from './sheet-state';

export const LayerChip = memo(function LayerChip({ id, text, hot, sheet }: { id: string; text: string; hot: boolean; sheet: SheetKind }) {
  if (!text) return null;
  const lines = chipLines(text);
  return (
    <Pressable testID={id} accessibilityRole="button" accessibilityLabel={`${text}. Tap for details`} onPress={() => openLayerSheet(sheet)} style={[styles.chip, { width: chipWidth(text) }, hot && styles.hot]}>
      {lines.map((l, i) => (
        <Text key={i} style={[styles.text, i === lines.length - 1 && styles.time, hot && styles.textHot]} numberOfLines={1} maxFontSizeMultiplier={1.1}>
          {l}
        </Text>
      ))}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: { minWidth: CHIP_H, height: CHIP_H, borderRadius: CHIP_H / 2, paddingHorizontal: 4, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.cheeseDark, alignItems: 'center', justifyContent: 'center' },
  hot: { backgroundColor: C.tomato, borderColor: C.tomatoDark },
  text: { fontFamily: F.bold, fontSize: 10, lineHeight: 11, color: C.ink, textAlign: 'center' },
  textHot: { color: '#fff' },
  time: { fontSize: 11, lineHeight: 12 },
});
