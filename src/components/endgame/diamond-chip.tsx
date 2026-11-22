// The HUD chip with the player's diamonds (HUD_CHIPS): a 40 pt round chip (a 44 pt touch area: HUD_BUTTON_SLOP) that opens the Shop screen. Shows from
// the Store intro (tutorial step 16), once the Starter Pack has been offered, or once rewards unlock (DECISIONS #47), and is the coach's `hud:store`.
// A small dot at the takeover while the Starter Pack isn't owned, until the Shop is opened.
// Selectors return strings and booleans: it repaints when the diamond count or the dot changes, never per game tick.
import { router } from 'expo-router';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { useCoachTarget } from '../coach/targets';
import { haptic } from '../game-ui';
import { DiamondIcon } from '../icons';
import { HUD_BUTTON_SLOP, HUD_ICON } from '../tap-targets';
import { BOOSTER_LINES } from './booster-model';
import { chipDot, diamondChipText, shopHref, STORE_INTRO_STEP } from './diamond-chip-model';
import { useShopFlags } from './shop-flags';

export const DiamondChip = memo(function DiamondChip() {
  const text = useGame((s) => diamondChipText(s.game, s.prefs.starterOffered));
  const newGame = useGame((s) => s.game.tutorial < STORE_INTRO_STEP);
  const dotCleared = useShopFlags((f) => f.dotCleared);
  const loaded = useShopFlags((f) => f.loaded);
  const dot = useGame((s) => chipDot(s.game, dotCleared)) && loaded;
  const target = useCoachTarget('hud:store');
  // a new game (the tutorial is back before the Store intro) starts the reminders over
  useEffect(() => {
    if (newGame && loaded) useShopFlags.getState().reset();
  }, [newGame, loaded]);
  if (!text) return null;
  return (
    <Pressable
      ref={target}
      onLayout={target.onLayout}
      collapsable={false}
      testID="shop-chip"
      hitSlop={HUD_BUTTON_SLOP.shop}
      accessibilityRole="button"
      accessibilityLabel={dot ? `Shop: ${text} diamonds. ${BOOSTER_LINES.dot}` : `Shop: ${text} diamonds`}
      onPress={() => {
        haptic();
        router.push(shopHref(useGame.getState().game));
      }}
      style={styles.chip}
    >
      <DiamondIcon size={16} />
      <Text style={styles.text} numberOfLines={1} maxFontSizeMultiplier={1.1}>
        {text}
      </Text>
      {dot && <View testID="shop-chip-dot" style={styles.dot} />}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    width: HUD_ICON,
    height: HUD_ICON,
    borderRadius: HUD_ICON / 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: F.bold, fontSize: 10, lineHeight: 12, color: '#fff' },
  dot: { position: 'absolute', top: -1, right: -1, width: 11, height: 11, borderRadius: 6, backgroundColor: C.tomato, borderWidth: 2, borderColor: '#fff' },
});
