// The City screen's list of cities (card T2): the one you are in, and the earlier ones, each with a way to read its Scrapbook. A franchise is one
// way, so an earlier city is read, not visited.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameState } from '../../engine/game';
import { C, F } from '../../theme';
import { TAP } from '../tap-targets';
import { cityRows, starsSummary } from './franchise-model';
import { PastScrapbook } from './past-scrapbook';

export function CityPicker({ game }: { game: GameState }) {
  const rows = cityRows(game);
  const stars = starsSummary(game);
  const [open, setOpen] = useState<string | null>(null);
  if (rows.length < 2 && !stars) return null;
  return (
    <View style={styles.wrap} testID="city-picker">
      <Text style={styles.head}>Cities</Text>
      {stars && <Text style={styles.stars}>{stars}</Text>}
      {rows.map((r) => (
        <View key={r.id} style={[styles.row, r.current && styles.rowHere]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{r.name}</Text>
            <Text style={styles.sub}>{r.current ? 'You are here' : 'Franchised'}</Text>
          </View>
          {r.past && (
            <Pressable
              testID={`city-scrapbook-${r.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${r.name} Scrapbook`}
              onPress={() => setOpen(r.id)}
              style={styles.read}
            >
              <Text style={styles.readText}>Scrapbook ›</Text>
            </Pressable>
          )}
        </View>
      ))}
      {open && <PastScrapbook cityId={open} onClose={() => setOpen(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, gap: 6 },
  head: { fontFamily: F.bold, fontSize: 18, color: C.ink },
  stars: { fontFamily: F.semi, fontSize: 14, color: C.inkSoft },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: C.locked,
    padding: 10,
    minHeight: TAP.min,
  },
  rowHere: { borderColor: C.cheeseDark },
  name: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  sub: { fontFamily: F.regular, fontSize: 12, color: C.inkSoft },
  read: {
    minHeight: TAP.min,
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: C.ink,
    backgroundColor: '#FFF4E0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  readText: { fontFamily: F.bold, fontSize: 14, color: C.ink },
});
