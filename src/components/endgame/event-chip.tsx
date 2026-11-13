// The HUD chip in the hour before an event (HUD_CHIPS): "Rush: 42m left" / "Game: 42m left". A 44 pt pill; nothing at any other time.
// Repaints once a minute (once a second in the last minute), never per game tick.
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { eventChipText, eventViewNow } from './event-model';

export const EventChip = memo(function EventChip() {
  const text = useGame((s) => eventChipText(eventViewNow(Date.now())));
  if (!text) return null;
  return (
    <View testID="event-chip" accessibilityLabel={text} style={styles.chip}>
      <Text style={styles.text} numberOfLines={2} maxFontSizeMultiplier={1.1}>
        {text}
      </Text>
    </View>
  );
});

// two lines in a 44 pt pill: "Rush: 42m" over "left"
const styles = StyleSheet.create({
  chip: { minWidth: 44, maxWidth: 60, height: 44, borderRadius: 22, paddingHorizontal: 4, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.cheeseDark, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: F.bold, fontSize: 10.5, lineHeight: 12, color: C.ink, textAlign: 'center' },
});
