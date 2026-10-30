import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudioPrefs } from '@/audio/prefs';
import { BuyButton } from '@/components/game-ui';
import { BUTTON_H } from '@/components/tap-targets';
import { APP_VERSION } from '@/content/version';
import { money } from '@/engine/format';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const game = useGame((s) => s.game);
  const resetGame = useGame((s) => s.resetGame);
  const [confirm, setConfirm] = useState(false);
  const music = useAudioPrefs((s) => s.music);
  const sound = useAudioPrefs((s) => s.sound);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 70 }} testID="back">
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 70 }} />
      </View>
      <View style={{ padding: 16, gap: 14 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stats</Text>
          <Text style={styles.stat}>Lifetime earnings: {money(game.totalEarned)}</Text>
          <Text style={styles.stat}>Pizzas sold: {Math.floor(Object.values(game.shops).reduce((a, s) => a + s.sold, 0)).toLocaleString()}</Text>
          <Text style={styles.stat}>Story scenes seen: {game.seenScenes.length}/24</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Audio</Text>
          <Text style={styles.stat}>Follows your ring/silent switch.</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Toggle label="Music" on={music} onPress={() => useAudioPrefs.getState().setMusic(!music)} testID="toggle-music" />
            <Toggle label="Sound" on={sound} onPress={() => useAudioPrefs.getState().setSound(!sound)} testID="toggle-sound" />
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Start over</Text>
          <Text style={styles.stat}>Erases your shop, cash, and story progress on this device.</Text>
          <View style={{ marginTop: 10 }}>
            {confirm ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <BuyButton label="Cancel" enabled onPress={() => setConfirm(false)} />
                </View>
                <Pressable
                  testID="confirm-reset"
                  style={styles.danger}
                  onPress={async () => {
                    await resetGame();
                    router.back();
                  }}>
                  <Text style={styles.dangerText}>Yes, erase</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.danger} onPress={() => setConfirm(true)} testID="reset">
                <Text style={styles.dangerText}>Reset game</Text>
              </Pressable>
            )}
          </View>
        </View>
        <Text style={styles.version}>Slice Empire v{APP_VERSION}</Text>
      </View>
    </View>
  );
}

function Toggle({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="switch" accessibilityState={{ checked: on }} onPress={onPress} style={[styles.toggle, on ? styles.toggleOn : styles.toggleOff]}>
      <Text style={[styles.toggleText, { color: on ? '#fff' : C.inkSoft }]}>{`${label}: ${on ? 'On' : 'Off'}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: { flex: 1, minHeight: BUTTON_H, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4 },
  toggleOn: { backgroundColor: C.basil, borderColor: C.basilDark },
  toggleOff: { backgroundColor: '#E2D9CE', borderColor: '#C9BCAD' },
  toggleText: { fontFamily: F.bold, fontSize: 17 },
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.tomato, borderBottomWidth: 4, borderColor: C.tomatoDark },
  backText: { fontFamily: F.bold, color: '#fff', fontSize: 18 },
  title: { fontFamily: F.bold, color: '#fff', fontSize: 24 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 3, borderColor: C.ink, padding: 14 },
  cardTitle: { fontFamily: F.bold, fontSize: 19, color: C.ink, marginBottom: 4 },
  stat: { fontFamily: F.regular, fontSize: 15, color: C.inkSoft },
  danger: { flex: 1, backgroundColor: C.tomato, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 4, borderColor: C.tomatoDark },
  dangerText: { fontFamily: F.bold, color: '#fff', fontSize: 17 },
  version: { textAlign: 'center', fontFamily: F.regular, color: C.inkSoft },
});
