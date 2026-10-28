import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuyButton } from '@/components/game-ui';
import { money } from '@/engine/format';
import { useGame } from '@/store/game-store';
import { C, F } from '@/theme';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const game = useGame((s) => s.game);
  const resetGame = useGame((s) => s.resetGame);
  const [confirm, setConfirm] = useState(false);

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
          <Text style={styles.stat}>Pizzas delivered: {Math.floor(Object.values(game.delivered).reduce((a, b) => a + b, 0)).toLocaleString()}</Text>
          <Text style={styles.stat}>Story scenes seen: {game.seenScenes.length}/24</Text>
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
        <Text style={styles.version}>Slice Empire v{Constants.expoConfig?.version ?? '0.1.0'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
