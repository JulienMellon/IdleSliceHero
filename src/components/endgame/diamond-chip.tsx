// The HUD chip with the player's diamonds (HUD_CHIPS): a 40 pt round chip (a 44 pt touch area: HUD_BUTTON_SLOP) that opens the Shop screen. Shows from
// the Store intro (tutorial step 16), once the Starter Pack has been offered, or once rewards unlock (DECISIONS #47), and is the coach's `hud:store`.
// A small dot at the takeover while the Starter Pack isn't owned, until the Shop is opened.
// Selectors return strings and booleans: it repaints when the diamond count or the dot changes, never per game tick.
import { router } from 'expo-router';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { useCoachTarget } from '../coach/targets';
import { haptic } from '../game-ui';
import { DiamondIcon } from '../icons';
import { HUD_BUTTON_SLOP, HUD_ICON } from '../tap-targets';
import { BOOSTER_LINES } from './booster-model';
import { STORE_INTRO_START } from '../../engine/game';
import { chipDot, diamondChipText, shopHref } from './diamond-chip-model';
import { useShopFlags } from './shop-flags';

export const DiamondChip = memo(function DiamondChip() {
  const text = useGame((s) => diamondChipText(s.game, s.prefs.starterOffered));
  const newGame = useGame((s) => s.game.tutorial < STORE_INTRO_START);
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
      {/* D568: a "0" next to a diamond reads as an empty wallet; the bag says this is the Store */}
      <View style={styles.bag} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={14} height={14} viewBox="0 0 16 16">
          <Path d="M3.5 6.5 H12.5 L13.5 14 H2.5 Z" fill={C.basil} stroke={C.ink} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d="M5.8 6.5 V5.2 a2.2 2.2 0 0 1 4.4 0 V6.5" fill="none" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
      </View>
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
  bag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // D561: filled like the gift dot (cheese with a tomato rim), never tomato on the tomato HUD
  dot: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.tomato },
});
