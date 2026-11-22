// Nonna's nudge (card U5): the first time the player taps a look they can't afford, a small card on the Style tab (not a sheet) with her line;
// a tap on it opens the Store tab. Once per save (shop-flags). Words: booster-model.ts BOOSTER_LINES.nudge (COPY-v5.23 `store.nudge`).
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, F } from '../../theme';
import { Portrait } from '../portrait/index';
import { BOOSTER_LINES } from './booster-model';

export const NudgeCard = memo(function NudgeCard({ onStore }: { onStore: () => void }) {
  return (
    <Pressable
      testID="store-nudge"
      accessibilityRole="button"
      accessibilityLabel={`Nonna Rosa: ${BOOSTER_LINES.nudge} Open the Store`}
      onPress={onStore}
      style={styles.card}
    >
      <Portrait id="nonna-rosa" size={44} />
      <View style={styles.text}>
        <Text style={styles.who} maxFontSizeMultiplier={1.15}>
          Nonna Rosa
        </Text>
        <Text style={styles.line} maxFontSizeMultiplier={1.15}>
          {BOOSTER_LINES.nudge}
        </Text>
      </View>
      {/* D562: the card is a button: the pill says where it goes */}
      <View style={styles.pill}>
        <Text style={styles.pillText} maxFontSizeMultiplier={1.15}>
          {'Store \u203A'}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    backgroundColor: '#FFF6E0',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.ink,
    padding: 8,
  },
  text: { flex: 1 },
  pill: { minHeight: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: C.basil, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontFamily: F.bold, fontSize: 14, color: '#fff' },
  who: { fontFamily: F.bold, fontSize: 12, color: C.tomatoDark },
  line: { fontFamily: F.semi, fontSize: 14, lineHeight: 18, color: C.ink },
});
