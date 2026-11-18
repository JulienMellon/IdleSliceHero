// University's sheet (SHEETS slot), opened from its HUD chip: Priya's menu (three recipes, each with a plus and a minus
// button of 44 pt; taps only) and the campus zones with the trip time for the current fleet. Built only while it is open.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { menuView, zonesView } from '../../../engine/features/layers/university-menu';
import { useGame } from '../../../store/game-store';
import { C, F } from '../../../theme';
import { dressed } from '../city-dress';
import { COPY } from './copy';
import { BUTTON_H } from './layer-model';
import { LayerSheet } from './layer-ui';
import { effectLine, mixOfView, mixText, recipeRows, stepMix, type RecipeId } from './menu-model';
import { universitySheet, useUniversitySheet } from './university-state';
import { zoneCells } from './zones-model';

function Sheet() {
  const game = useGame((s) => s.game);
  const setMenu = useGame((s) => s.setMenu);
  const mv = menuView(game);
  const zv = zonesView(game);
  const mix = mixOfView(mv);
  const rows = recipeRows(mix, game.city);
  const tap = (id: RecipeId, dir: 1 | -1) => {
    const next = stepMix(mix, id, dir);
    if (next) setMenu(next.pepperoni, next.knots);
  };
  return (
    <LayerSheet
      testID="university-sheet"
      title={dressed(game.city, 'layer.university.menu.info.title', COPY['layer.university.menu.info.title'])}
      onClose={universitySheet.close}
    >
      <Text style={styles.body}>{COPY['layer.university.menu.info.body']}</Text>
      {rows.map((r) => (
        <View key={r.id} style={styles.row} testID={`recipe-${r.id}`}>
          <View style={styles.rowText}>
            <Text style={styles.name} numberOfLines={1}>
              {r.name}
            </Text>
            <Text style={styles.small} numberOfLines={2}>
              {r.line}
            </Text>
            <Text style={styles.effect} numberOfLines={1}>{`${r.price} · ${r.time}`}</Text>
          </View>
          <Pressable
            testID={`mix-minus-${r.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Less ${r.name}`}
            disabled={!r.canMinus}
            onPress={() => tap(r.id, -1)}
            style={[styles.step, !r.canMinus && styles.stepOff]}
          >
            <Text style={styles.stepText}>{'−'}</Text>
          </Pressable>
          <Text testID={`mix-pct-${r.id}`} style={styles.pct}>{`${r.pct}%`}</Text>
          <Pressable
            testID={`mix-plus-${r.id}`}
            accessibilityRole="button"
            accessibilityLabel={`More ${r.name}`}
            disabled={!r.canPlus}
            onPress={() => tap(r.id, 1)}
            style={[styles.step, !r.canPlus && styles.stepOff]}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      ))}
      <View style={styles.total} testID="menu-total">
        <Text style={styles.totalHead}>{`Mix ${mixText(mix)}`}</Text>
        <Text style={styles.small}>{effectLine(mv)}</Text>
      </View>
      <Text style={styles.head}>{dressed(game.city, 'layer.university.zones.info.title', COPY['layer.university.zones.info.title'])}</Text>
      <Text style={styles.body}>{dressed(game.city, 'layer.university.zones.info.body', COPY['layer.university.zones.info.body'])}</Text>
      {zoneCells(zv, game.city).map((z) => (
        <View key={z.id} style={[styles.zone, z.locked && styles.zoneLocked]} testID={`zone-row-${z.id}`}>
          <Text style={styles.zoneName} numberOfLines={1}>
            {z.name}
          </Text>
          <Text style={styles.zoneMid} numberOfLines={1}>
            {z.mid}
          </Text>
          <Text style={styles.zoneFoot} numberOfLines={1}>
            {z.foot}
          </Text>
        </View>
      ))}
      {zv.drones ? <Text style={styles.drones}>{COPY['layer.university.drones.info']}</Text> : null}
    </LayerSheet>
  );
}

export const UniversitySheet = memo(function UniversitySheet() {
  return useUniversitySheet() ? <Sheet /> : null;
});

const styles = StyleSheet.create({
  body: { fontFamily: F.regular, fontSize: 13, lineHeight: 17, color: C.inkSoft },
  head: { fontFamily: F.bold, fontSize: 17, color: C.ink, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.lockedDark,
    padding: 6,
  },
  rowText: { flex: 1, gap: 1 },
  name: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  small: { fontFamily: F.regular, fontSize: 12, lineHeight: 15, color: C.inkSoft },
  effect: { fontFamily: F.semi, fontSize: 11, color: C.basilDark },
  step: {
    width: BUTTON_H,
    height: BUTTON_H,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.cheese,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepOff: { backgroundColor: C.locked, borderColor: C.lockedDark, opacity: 0.6 },
  stepText: { fontFamily: F.bold, fontSize: 24, lineHeight: 28, color: C.ink },
  pct: { width: 42, fontFamily: F.bold, fontSize: 15, color: C.ink, textAlign: 'center' },
  total: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: C.ink, padding: 8, gap: 2 },
  totalHead: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  zone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.lockedDark,
    paddingHorizontal: 8,
  },
  zoneLocked: { opacity: 0.6 },
  zoneName: { width: 70, fontFamily: F.bold, fontSize: 13, color: C.ink },
  zoneMid: { width: 76, fontFamily: F.semi, fontSize: 12, color: C.ink },
  zoneFoot: { flex: 1, fontFamily: F.regular, fontSize: 12, color: C.inkSoft, textAlign: 'right' },
  drones: { fontFamily: F.semi, fontSize: 12, color: C.basilDark },
});
