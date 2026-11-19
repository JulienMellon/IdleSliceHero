// Uptown's stars sheet (SHEETS slot), opened from its HUD chip: the rating and the pay rule (below 3 stars half pay; 5 stars double), the
// three inputs (oven grade, decor, Ingredients) with what the next point costs, the Ingredients buy button (44 pt), and the critic's
// schedule. Built only while it is open.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fill } from '../../report/report-model';
import { money } from '../../../engine/format';
import { useGame } from '../../../store/game-store';
import { C, F } from '../../../theme';
import { BUTTON_H } from '../menu/layer-model';
import { LayerSheet } from '../menu/layer-ui';
import { dressed } from '../city-dress';
import { COPY } from './copy';
import { PAY_RULE, starsSheet } from './stars-model';
import { starsSheetState, useStarsSheetOpen } from './stars-state';

function Sheet() {
  const game = useGame((s) => s.game);
  const buy = useGame((s) => s.buyIngredients);
  const m = starsSheet(game);
  return (
    <LayerSheet
      testID="uptown-sheet"
      title={dressed(game.city, 'layer.uptown.stars.info.title', COPY['layer.uptown.stars.info.title'])}
      onClose={starsSheetState.close}
    >
      <View style={styles.head} testID="stars-head">
        <Text style={styles.rating}>{m.rating}</Text>
        <Text style={[styles.pay, m.pay === 'half' && styles.payHalf]} testID="pay-word">
          {m.payWord}
        </Text>
      </View>
      <Text style={styles.small}>{m.progress}</Text>
      <Text style={styles.body}>{dressed(game.city, 'layer.uptown.stars.info.body', COPY['layer.uptown.stars.info.body'])}</Text>
      <Text style={styles.rule} testID="pay-rule">
        {PAY_RULE}
      </Text>
      {m.rows.map((r) => (
        <View key={r.key} style={styles.row} testID={`input-${r.key}`}>
          <View style={styles.rowText}>
            <Text style={styles.name} numberOfLines={1}>{`${r.title} · ${r.value}`}</Text>
            <Text style={styles.small} numberOfLines={2}>
              {fill(COPY['layer.uptown.stars.next'], { cost: r.next })}
            </Text>
          </View>
          <Text style={styles.points}>{r.points}</Text>
          {r.key === 'ingredients' && m.ingredients.name !== null ? (
            <Pressable
              testID="sheet-buy-ingredients"
              accessibilityRole="button"
              disabled={!m.ingredients.canBuy}
              onPress={buy}
              style={[styles.buy, !m.ingredients.canBuy && styles.buyOff]}
            >
              <Text style={styles.buyText} numberOfLines={1}>
                {m.ingredients.price !== null ? money(m.ingredients.price) : ''}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      <View style={styles.critic} testID="critic-info">
        <Text style={styles.name}>{COPY['layer.uptown.critic.info.title']}</Text>
        <Text style={styles.small}>{`${m.criticNext} · ${m.criticTarget}`}</Text>
        <Text style={styles.small}>{COPY['layer.uptown.critic.info.body']}</Text>
      </View>
    </LayerSheet>
  );
}

export const StarsSheet = memo(function StarsSheet() {
  return useStarsSheetOpen() ? <Sheet /> : null;
});

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  rating: { fontFamily: F.bold, fontSize: 20, color: C.ink },
  pay: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.basilDark,
    borderWidth: 2,
    borderColor: C.basilDark,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  payHalf: { color: C.tomatoDark, borderColor: C.tomatoDark },
  body: { fontFamily: F.regular, fontSize: 13, lineHeight: 17, color: C.inkSoft },
  rule: { fontFamily: F.semi, fontSize: 12, lineHeight: 15, color: C.ink, textAlign: 'center' },
  small: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: C.inkSoft },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.lockedDark,
    padding: 8,
  },
  rowText: { flex: 1, gap: 1 },
  name: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  points: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  buy: {
    minWidth: 72,
    height: BUTTON_H,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.basil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyOff: { backgroundColor: C.locked, borderColor: C.lockedDark },
  buyText: { fontFamily: F.bold, fontSize: 14, color: '#fff' },
  critic: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: C.ink, padding: 10, gap: 2 },
});
