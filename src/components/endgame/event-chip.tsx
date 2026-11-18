// The HUD chip in the hour before an event (HUD_CHIPS): "Rush in 42m" / "Playoffs in 42m". A 44 pt pill; nothing at any other time.
// Repaints once a minute (once a second in the last minute), never per game tick.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { eventChipText, eventViewNow } from './event-model';
import { gameNow } from '../../engine/clock';

export const EventChip = memo(function EventChip() {
  const text = useGame((s) => eventChipText(eventViewNow(gameNow(), s.game)));
  if (!text) return null;
  return (
    <View testID="event-chip" accessibilityLabel={text} style={styles.chip}>
      <Text style={styles.text} numberOfLines={2} maxFontSizeMultiplier={1.1}>
        {text}
      </Text>
    </View>
  );
});

// D465: "Rush in 42m" is one line; the longer "Playoffs in 42m" wraps to two in the same 44 pt pill
const styles = StyleSheet.create({
  chip: { minWidth: 44, maxWidth: 80, height: 44, borderRadius: 22, paddingHorizontal: 5, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.cheeseDark, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: F.bold, fontSize: 10.5, lineHeight: 12, color: C.ink, textAlign: 'center' },
});
