// The HUD chip with the player's diamonds (HUD_CHIPS): a 44 pt round chip that opens the Shop screen. Shows once rewards unlock.
// A string selector: it repaints when the diamond count changes, never per game tick.
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { count } from '../../engine/format';
import { rewardsUnlocked } from '../../engine/rewards';
import { useGame } from '../../store/game-store';
import { F } from '../../theme';
import { haptic } from '../game-ui';
import { DiamondIcon } from '../icons';

export const DiamondChip = memo(function DiamondChip() {
  const text = useGame((s) => (rewardsUnlocked(s.game) ? count(Math.floor(s.game.rewards.diamonds)) : ''));
  if (!text) return null;
  return (
    <Pressable testID="shop-chip" accessibilityRole="button" accessibilityLabel={`Shop: ${text} diamonds`} onPress={() => { haptic(); router.push('/shop'); }} style={styles.chip}>
      <DiamondIcon size={16} />
      <Text style={styles.text} numberOfLines={1} maxFontSizeMultiplier={1.1}>
        {text}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: '#fff' },
});
