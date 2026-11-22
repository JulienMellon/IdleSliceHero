// The Boosters tab's "Buy" section (card U5): the running slot's line, then three cards for E5's diamond boosters. A card that would pass the
// slot's 24 h shows Nonna's refusal (booster.full) when tapped and spends nothing. Data: endgame/booster-model.ts; the buy is the store's `buyBooster`.
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { gameNow } from '../../engine/clock';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { haptic } from '../game-ui';
import { BoostIcon, DiamondIcon } from '../icons';
import { BOOSTER_LINES, boosterSection, type BoosterSection, type BoosterView } from './booster-model';

const BoosterCard = memo(function BoosterCard({
  id,
  name,
  mult,
  duration,
  desc,
  pace,
  price,
  state,
  onBuy,
}: BoosterView & { onBuy: (id: string, state: BoosterView['state']) => void }) {
  const off = state !== 'buy';
  return (
    <View testID={`booster-${id}`} style={styles.card}>
      <View style={styles.top}>
        <BoostIcon size={30} />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.15}>
            {name}
            <Text style={styles.tag}>{`  ${mult} · ${duration}`}</Text>
          </Text>
          <Text style={styles.desc} numberOfLines={2} maxFontSizeMultiplier={1.15}>
            {desc}
          </Text>
          <Text style={styles.pace} numberOfLines={1} maxFontSizeMultiplier={1.15}>
            {pace}
          </Text>
        </View>
      </View>
      <Pressable
        testID={`booster-${id}-buy`}
        accessibilityRole="button"
        accessibilityLabel={`Buy ${name} for ${price} diamonds`}
        accessibilityState={{ disabled: off }}
        onPress={() => onBuy(id, state)}
        style={({ pressed }) => [styles.btn, off ? styles.btnOff : styles.btnBuy, pressed && styles.pressed]}
      >
        <DiamondIcon size={18} />
        <Text style={[styles.btnText, off && styles.btnTextOff]} numberOfLines={1} maxFontSizeMultiplier={1.15}>
          {price}
        </Text>
      </Pressable>
    </View>
  );
});

export const BoosterBuy = memo(function BoosterBuy() {
  // one string: the section repaints when a price state, a pace or the running minute changes, never per game tick
  const key = useGame((s) => JSON.stringify(boosterSection(s.game, gameNow())));
  const section = useMemo(() => JSON.parse(key) as BoosterSection, [key]);
  const [refused, setRefused] = useState(false);
  const buy = useCallback((id: string, state: BoosterView['state']) => {
    if (state === 'full') {
      haptic('error');
      setRefused(true);
      return;
    }
    const ok = useGame.getState().buyBooster(id);
    haptic(ok ? 'success' : 'error');
    setRefused(false);
  }, []);
  return (
    <View style={styles.section} testID="booster-buy">
      <Text style={styles.head} accessibilityRole="header">
        Buy
      </Text>
      {section.running !== null && (
        <Text style={styles.running} testID="booster-running" accessibilityLiveRegion="polite">
          {section.running}
        </Text>
      )}
      {section.cards.map((c) => (
        <BoosterCard key={c.id} {...c} onBuy={buy} />
      ))}
      {refused && (
        <Text style={styles.full} testID="booster-full" accessibilityLiveRegion="polite">
          {BOOSTER_LINES.full}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: { gap: 10 },
  head: { fontFamily: F.bold, fontSize: 18, color: C.ink },
  running: { fontFamily: F.bold, fontSize: 14, color: C.basilDark, textAlign: 'center' },
  full: { fontFamily: F.semi, fontSize: 14, color: C.ink, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 2.5, borderColor: C.ink, padding: 10, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1 },
  name: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  tag: { fontFamily: F.semi, fontSize: 13, color: C.inkSoft },
  desc: { fontFamily: F.regular, fontSize: 13, lineHeight: 16, color: C.inkSoft },
  pace: { fontFamily: F.semi, fontSize: 13, lineHeight: 16, color: C.basilDark },
  btn: {
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 4,
  },
  // the diamond's blue, as the vanity shop's Buy (D461)
  btnBuy: { backgroundColor: '#2D8FD9', borderBottomColor: '#1D5F9A' },
  btnOff: { backgroundColor: '#E2D9CE', borderBottomColor: '#C9BCAD' },
  btnText: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
  btnTextOff: { color: '#665A4F' },
  pressed: { transform: [{ translateY: 2 }] },
});
