// The Scrapbook's Recipes tab: 24 recipe cards, four per shop. An owned card shows its picture, name and line; one not owned yet is a
// silhouette with "???" and what earns it. Cards come from play only (never bought). Data: recipes-model.ts.
import { StyleSheet, Text, View } from 'react-native';

import { C, F } from '../../theme';
import type { RecipeGroup, RecipeTile } from './recipes-model';
import { RecipeArt } from './recipe-art';

function Tile({ t }: { t: RecipeTile }) {
  return (
    <View testID={`recipe-${t.id}`} accessibilityLabel={t.owned ? `${t.name}. ${t.line}` : `Recipe not found yet. ${t.drop}`} style={[styles.tile, !t.owned && styles.tileLocked]}>
      <RecipeArt n={t.n} owned={t.owned} />
      <Text style={[styles.name, !t.owned && styles.nameLocked]} numberOfLines={2} maxFontSizeMultiplier={1.15}>
        {t.name}
      </Text>
      <Text style={styles.line} numberOfLines={t.owned ? 3 : 2} maxFontSizeMultiplier={1.15}>
        {t.owned ? t.line : t.drop}
      </Text>
    </View>
  );
}

export function RecipesSection({ groups, bottom }: { groups: RecipeGroup[]; bottom: number }) {
  return (
    <View style={{ padding: 14, gap: 16, paddingBottom: bottom }} testID="recipes-section">
      {groups.map((g) => (
        <View key={g.id} style={styles.chapter}>
          <View style={[styles.head, { backgroundColor: g.color }]}>
            <Text style={styles.shop}>{g.shop}</Text>
            <Text style={styles.count}>{`${g.owned}/${g.total}`}</Text>
          </View>
          <View style={styles.grid}>
            {g.tiles.map((t) => (
              <Tile key={t.id} t={t} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chapter: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 3, borderColor: C.ink, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 3, borderColor: C.ink },
  shop: { fontFamily: F.bold, fontSize: 18, color: C.ink },
  count: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  tile: { width: '48%', flexGrow: 1, minHeight: 130, borderRadius: 12, backgroundColor: '#FFF4E0', borderWidth: 2, borderColor: C.cheeseDark, padding: 8, alignItems: 'center', gap: 2 },
  tileLocked: { backgroundColor: '#F1ECE7', borderColor: C.locked },
  name: { fontFamily: F.bold, fontSize: 14, lineHeight: 16, color: C.ink, textAlign: 'center' },
  nameLocked: { color: C.inkSoft },
  line: { fontFamily: F.semi, fontSize: 11.5, lineHeight: 14, color: C.inkSoft, textAlign: 'center' },
});
