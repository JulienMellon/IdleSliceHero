import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCRAPBOOK_HEAD } from '@/components/endgame/fit-model';
import { recipeGroups } from '@/components/endgame/recipes-model';
import { RecipesSection } from '@/components/endgame/recipes-section';
import { DISPLAY_NAMES, Portrait } from '@/components/portrait';
import { HOME_SCENES } from '@/content/scenes/home';
import { NEIGHBORHOODS } from '@/content/tuning';
import { collectionView } from '@/engine/features/recipes';
import { nextSceneTeaser } from '@/engine/teaser';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

export default function Scrapbook() {
  const insets = useSafeAreaInsets();
  const seen = useGame((s) => s.game.seenScenes);
  const replay = useGame((s) => s.replayScene);
  const markViewed = useGame((s) => s.markScrapbookViewed);
  // one line on whose story is next and what it waits for (a string, so the screen re-renders only when it changes)
  const teaser = useGame((s) => nextSceneTeaser(s.game).text);
  // v5.15: Story | Recipes. The tasks drawer's collection line opens it on Recipes (?section=recipes).
  const { section } = useLocalSearchParams<{ section?: string }>();
  const [tab, setTab] = useState<'story' | 'recipes'>(section === 'recipes' ? 'recipes' : 'story');
  useEffect(() => {
    if (section === 'recipes') setTab('recipes');
  }, [section]);
  // the owned cards are primitives (a count and a key), so the Recipes tab repaints when a card drops, not on every tick
  // M64: one primitive selector (the key), the count is read off it
  const ownedKey = useGame((s) => collectionView(s.game).shops.map((x) => x.cards.map((c) => (c.owned ? 1 : 0)).join('')).join('|'));
  const owned = ownedKey.split('1').length - 1;
  const groups = useMemo(() => recipeGroups(useGame.getState().game), [ownedKey]); // eslint-disable-line react-hooks/exhaustive-deps -- `ownedKey` is what the groups depend on
  useEffect(() => {
    markViewed();
  }, [markViewed, seen.length]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} testID="back">
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Scrapbook</Text>
          <Text style={styles.count}>
            {`Stories ${seen.length}/${HOME_SCENES.length}`}
          </Text>
        </View>
        <Text style={styles.teaser} testID="scrapbook-teaser">
          {teaser}
        </Text>
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {(['story', 'recipes'] as const).map((t) => (
          <Pressable key={t} testID={`scrapbook-tab-${t}`} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'story' ? 'Story' : `Recipes ${owned}/24`}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'recipes' ? (
        <ScrollView>
          <RecipesSection groups={groups} bottom={insets.bottom + 24} />
        </ScrollView>
      ) : (
      <ScrollView contentContainerStyle={{ padding: 14, gap: 16, paddingBottom: insets.bottom + 24 }}>
        {NEIGHBORHOODS.map((n) => {
          const scenes = HOME_SCENES.filter((s) => s.neighborhood === n.id);
          const character = scenes[0].character;
          const met = scenes.some((s) => seen.includes(s.id));
          return (
            <View key={n.id} style={styles.chapter}>
              <View style={[styles.chapterHead, { backgroundColor: met ? n.color : C.locked }]}>
                <View style={styles.avatar}>{met ? <Portrait id={character} mood="happy" size={56} /> : <Text style={styles.q}>?</Text>}</View>
                <View>
                  <Text style={styles.chapterTitle}>{n.name}</Text>
                  <Text style={styles.chapterSub}>{met ? DISPLAY_NAMES[character] : 'Not met yet'}</Text>
                </View>
              </View>
              <View style={styles.grid}>
                {scenes.map((s) => {
                  const open = seen.includes(s.id);
                  return (
                    <Pressable key={s.id} disabled={!open} onPress={() => replay(s)} style={[styles.tile, !open && styles.tileLocked]} testID={`scene-${s.id}`}>
                      <Text style={styles.tileNum}>{s.beat}</Text>
                      <Text style={[styles.tileTitle, !open && { color: C.inkSoft }]} numberOfLines={2}>
                        {open ? s.title : '???'}
                      </Text>
                      {open && <Text style={styles.play}>▶ Replay</Text>}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.tomato, borderBottomWidth: 4, borderColor: C.tomatoDark, gap: 4 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teaser: { fontFamily: F.semi, fontSize: 14, color: '#FFE7C2', textAlign: 'center' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 10 },
  tab: { flex: 1, minHeight: 44, borderRadius: 14, borderWidth: 2.5, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: C.tomato, borderColor: C.tomatoDark },
  tabText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  tabTextOn: { color: '#fff' },
  back: { width: 70 },
  backText: { fontFamily: F.bold, color: '#fff', fontSize: 18 },
  title: { fontFamily: F.bold, color: '#fff', fontSize: SCRAPBOOK_HEAD.title },
  count: { minWidth: 70, textAlign: 'right', fontFamily: F.semi, color: '#FFE7C2', fontSize: SCRAPBOOK_HEAD.count },
  chapter: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 3, borderColor: C.ink, overflow: 'hidden' },
  chapterHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderBottomWidth: 3, borderColor: C.ink },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', borderWidth: 2.5, borderColor: C.ink, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  q: { fontFamily: F.bold, fontSize: 28, color: C.inkSoft },
  chapterTitle: { fontFamily: F.bold, fontSize: 20, color: C.ink },
  chapterSub: { fontFamily: F.semi, fontSize: 14, color: C.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  tile: { width: '48%', flexGrow: 1, minHeight: 74, borderRadius: 12, backgroundColor: '#FFF4E0', borderWidth: 2, borderColor: C.cheeseDark, padding: 8 },
  tileLocked: { backgroundColor: '#F1ECE7', borderColor: C.locked },
  tileNum: { fontFamily: F.bold, fontSize: 12, color: C.inkSoft },
  tileTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  play: { fontFamily: F.semi, fontSize: 12, color: C.tomato, marginTop: 2 },
});
