// University's zones strip (SHOP_REPORT slot): a row of three cells over the shop report's strip, Dorms, Library and Stadium, each with its
// share and the trip time of the current fleet, or its lock; drones say "ignores distance". A tap opens the University sheet. Primitive
// selectors only; nothing in any other shop.
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { zonesView } from '../../../engine/features/layers/university-menu';
import { useGame } from '../../../store/game-store';
import { C, F } from '../../../theme';
import { stripModel, STRIP } from '../../report/report-model';
import type { ShopReportSlotProps } from '../../slots';
import { universitySheet } from './university-state';
import { STRIP_H, stripBottom, ZONES_STRIP, zoneCells, type ZoneCell } from './zones-model';

export const ZonesStrip = memo(function ZonesStrip({ bottom }: ShopReportSlotProps) {
  const reportUp = useGame((s) => s.game.active === 'university' && stripModel(s.game, s.game.active, s.tickAt).show);
  // one string (the cells as JSON): a fresh array of objects every call would never compare equal
  const key = useGame((s) => (s.game.active === 'university' && s.game.shops.university.built ? JSON.stringify(zoneCells(zonesView(s.game))) : ''));
  if (!key) return null;
  const cells = JSON.parse(key) as ZoneCell[];
  return (
    <Pressable testID="zones-strip" accessibilityRole="button" accessibilityLabel="Campus zones" onPress={universitySheet.open} style={[styles.strip, { bottom: stripBottom(bottom, reportUp) }]}>
      {cells.map((c) => (
        <Cell key={c.id} c={c} />
      ))}
    </Pressable>
  );
});

function Cell({ c }: { c: ZoneCell }) {
  return (
    <View testID={`zone-${c.id}`} accessibilityLabel={c.label} style={[styles.cell, c.locked && styles.cellLocked]}>
      <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.1}>{c.name}</Text>
      <Text style={styles.mid} numberOfLines={1} maxFontSizeMultiplier={1.1}>{c.mid}</Text>
      <Text style={styles.foot} numberOfLines={1} maxFontSizeMultiplier={1.1}>{c.foot}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: STRIP.margin, right: STRIP.margin, height: STRIP_H, flexDirection: 'row', gap: ZONES_STRIP.gap, padding: ZONES_STRIP.pad, borderRadius: 12, borderWidth: ZONES_STRIP.border, borderColor: C.ink, backgroundColor: 'rgba(255,255,255,0.96)' },
  cell: { flex: 1, paddingHorizontal: ZONES_STRIP.cellPad, borderRadius: 8, justifyContent: 'center', backgroundColor: '#FFF4E0' },
  cellLocked: { backgroundColor: '#E6DDD5', opacity: 0.75 },
  name: { fontFamily: F.bold, fontSize: 11, lineHeight: ZONES_STRIP.line, color: C.ink },
  mid: { fontFamily: F.semi, fontSize: 10, lineHeight: ZONES_STRIP.line, color: C.ink },
  foot: { fontFamily: F.regular, fontSize: 10, lineHeight: ZONES_STRIP.line, color: C.inkSoft },
});
