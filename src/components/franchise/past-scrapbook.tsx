// An earlier city's Scrapbook, read from the City screen (card T2): its chapters in story order, a tile per scene, replay for the ones seen.
// A franchise keeps every `seenScenes`, so what was seen in Port Marinara is still there to replay in Boston.
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CITIES } from '../../content/cities';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { chapterScenes, tileLabel } from '../cutscene/scrapbook-model';
import { DISPLAY_NAMES, Portrait } from '../portrait/index';
import { TAP } from '../tap-targets';
import { seenCount } from './scrapbook-view';

export function PastScrapbook({ cityId, onClose }: { cityId: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const seen = useGame((s) => s.game.seenScenes);
  const replay = useGame((s) => s.replayScene);
  const city = CITIES[cityId];
  if (!city) return null;
  return (
    <Modal animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]} testID={`past-scrapbook-${cityId}`}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to the City" onPress={onClose} style={styles.back} testID="past-scrapbook-back">
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>{city.name} Scrapbook</Text>
          <Text style={styles.count}>{seenCount(seen, city.scenes)}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 14, gap: 16, paddingBottom: insets.bottom + 24 }}>
          {city.neighbourhoods.map((n) => {
            const scenes = chapterScenes(n.id, city.scenes);
            const character = scenes[0].character;
            const met = scenes.some((s) => seen.includes(s.id));
            return (
              <View key={n.id} style={styles.chapter}>
                <View style={[styles.chapterHead, { backgroundColor: met ? n.color : C.locked }]}>
                  <View style={styles.avatar}>{met ? <Portrait id={character} mood="happy" size={56} city={cityId} /> : <Text style={styles.q}>?</Text>}</View>
                  <View>
                    <Text style={styles.chapterTitle}>{n.name}</Text>
                    <Text style={styles.chapterSub}>{met ? DISPLAY_NAMES[character] : 'Not met yet'}</Text>
                  </View>
                </View>
                <View style={styles.grid}>
                  {scenes.map((s) => {
                    const open = seen.includes(s.id);
                    return (
                      <Pressable
                        key={s.id}
                        accessibilityRole="button"
                        accessibilityLabel={open ? `${tileLabel(s)}: ${s.title}. Replay` : `${tileLabel(s)}: locked, not seen yet`}
                        accessibilityState={{ disabled: !open }}
                        disabled={!open}
                        // the replay opens over the game, not over this modal: close first
                        onPress={() => {
                          onClose();
                          replay(s);
                        }}
                        style={[styles.tile, !open && styles.tileLocked]}
                        testID={`past-scene-${s.id}`}
                      >
                        <Text style={styles.tileNum}>{tileLabel(s)}</Text>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: C.tomato,
    borderBottomWidth: 4,
    borderColor: C.tomatoDark,
  },
  back: { width: 70, minHeight: TAP.min, justifyContent: 'center' },
  backText: { fontFamily: F.bold, color: '#fff', fontSize: 18 },
  title: { fontFamily: F.bold, color: '#fff', fontSize: 20 },
  count: { minWidth: 70, textAlign: 'right', fontFamily: F.semi, color: '#FFE7C2', fontSize: 14 },
  chapter: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 3, borderColor: C.ink, overflow: 'hidden' },
  chapterHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderBottomWidth: 3, borderColor: C.ink },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: C.ink,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
