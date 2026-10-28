import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DISPLAY_NAMES, Portrait } from '@/components/portrait';
import { HOME_SCENES } from '@/content/scenes/home';
import { NEIGHBORHOODS } from '@/content/tuning';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

export default function Scrapbook() {
  const insets = useSafeAreaInsets();
  const seen = useGame((s) => s.game.seenScenes);
  const replay = useGame((s) => s.replayScene);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} testID="back">
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Scrapbook</Text>
        <Text style={styles.count}>
          {seen.length}/{HOME_SCENES.length}
        </Text>
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.tomato, borderBottomWidth: 4, borderColor: C.tomatoDark },
  back: { width: 70 },
  backText: { fontFamily: F.bold, color: '#fff', fontSize: 18 },
  title: { fontFamily: F.bold, color: '#fff', fontSize: 24 },
  count: { width: 70, textAlign: 'right', fontFamily: F.semi, color: '#FFE7C2', fontSize: 16 },
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
