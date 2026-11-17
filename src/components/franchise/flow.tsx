// The franchise flow (card T2): the confirm sheet (what you keep, what you give up, the multiplier; two confirmations), then the franchise
// moment. The franchise itself happens when the moment's button is pressed, so a player who has said yes twice can still see the send-off.
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GameState } from '../../engine/game';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { Portrait } from '../portrait';
import { TAP } from '../tap-targets';
import { advance, momentView, retreat, sheetView, type FlowStep } from './franchise-model';

function List({ title, items, mark, color }: { title: string; items: string[]; mark: string; color: string }) {
  return (
    <View style={styles.list}>
      <Text style={[styles.listTitle, { color }]}>{title}</Text>
      {items.map((t) => (
        <Text key={t} style={styles.item}>
          {mark} {t}
        </Text>
      ))}
    </View>
  );
}

function Moment({ game, onGo }: { game: GameState; onGo: () => void }) {
  const m = momentView(game);
  const insets = useSafeAreaInsets();
  const [rise] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [rise]);
  if (!m) return null;
  return (
    <View style={[styles.moment, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} testID="franchise-moment">
      <Animated.View style={[styles.momentBody, { opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
        <Text style={styles.momentSign}>FRANCHISE</Text>
        <Text style={styles.momentTitle} accessibilityRole="header">
          {m.title}
        </Text>
        <Text style={styles.stars}>★ {m.stars}</Text>
        <Text style={styles.starsSub}>Franchise Stars · {m.multiplier} on every pizza</Text>
        <View style={styles.nonna}>
          <Portrait id="nonna-rosa" mood="happy" size={88} />
          <View style={styles.bubble}>
            {m.lines.map((l) => (
              <Text key={l} style={styles.bubbleText}>
                {l}
              </Text>
            ))}
          </View>
        </View>
      </Animated.View>
      <Pressable testID="franchise-moment-go" accessibilityRole="button" accessibilityLabel={m.button} onPress={onGo} style={[styles.go, styles.goGold, styles.goSolo]}>
        <Text style={styles.goText}>{m.button} ▸</Text>
      </Pressable>
    </View>
  );
}

/** The whole flow in one Modal. `game` is the snapshot the City screen shows; `onDone` runs after the franchise (the screen leaves the old city). */
export function FranchiseFlow({ game, onClose, onDone }: { game: GameState; onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<FlowStep>('ask');
  const insets = useSafeAreaInsets();
  const s = sheetView(game);
  if (!s) return null;
  const go = () => {
    const n = advance(step);
    if (n === 'commit') {
      if (useGame.getState().franchise()) onDone();
      else onClose();
    } else setStep(n);
  };
  const back = () => {
    const p = retreat(step);
    if (p === null) onClose();
    else setStep(p);
  };
  return (
    <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={back}>
      {step === 'moment' ? (
        <Moment game={game} onGo={go} />
      ) : (
        <View style={styles.scrim}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={back} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID={`franchise-${step}`}>
            <Text style={styles.title} accessibilityRole="header">
              {step === 'ask' ? s.title : 'Are you sure?'}
            </Text>
            {step === 'ask' ? (
              <ScrollView style={{ maxHeight: 360 }}>
                <List title="You keep" items={s.keep} mark="✓" color={C.basilDark} />
                <List title="You give up" items={s.giveUp} mark="✕" color={C.tomato} />
                <View style={styles.gain}>
                  <Text style={styles.gainStars}>{s.starsLine}</Text>
                  <Text style={styles.gainMult}>{s.multiplierLine}</Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.gain}>
                <Text style={styles.gainStars}>{s.warning}</Text>
                <Text style={styles.gainMult}>
                  {s.from} is sold for {s.starsLine}. {s.to} starts from nothing, with {s.multiplierLine.split(': ')[1].split(' → ')[1]} on every pizza.
                </Text>
              </View>
            )}
            <View style={styles.buttons}>
              <Pressable testID="franchise-back" accessibilityRole="button" accessibilityLabel={step === 'ask' ? s.cancel : 'Go back'} onPress={back} style={[styles.go, styles.goGhost]}>
                <Text style={[styles.goText, { color: C.ink }]}>{step === 'ask' ? s.cancel : 'Go back'}</Text>
              </Pressable>
              <Pressable testID="franchise-go" accessibilityRole="button" accessibilityLabel={step === 'ask' ? s.go[0] : s.go[1]} onPress={go} style={[styles.go, step === 'ask' ? styles.goGold : styles.goRed]}>
                <Text style={styles.goText}>{step === 'ask' ? s.go[0] : s.go[1]}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(30,12,6,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 3, borderColor: C.ink, padding: 18, gap: 12 },
  title: { fontFamily: F.bold, fontSize: 22, color: C.ink, textAlign: 'center' },
  list: { gap: 2, marginBottom: 8 },
  listTitle: { fontFamily: F.bold, fontSize: 16 },
  item: { fontFamily: F.regular, fontSize: 14, color: C.ink },
  gain: { backgroundColor: '#FFF4E0', borderRadius: 14, borderWidth: 2, borderColor: C.cheeseDark, padding: 12, gap: 4 },
  gainStars: { fontFamily: F.bold, fontSize: 17, color: C.ink, textAlign: 'center' },
  gainMult: { fontFamily: F.semi, fontSize: 14, color: C.inkSoft, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 10 },
  go: { flex: 1, minHeight: TAP.min + 4, borderRadius: 16, borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  goGold: { backgroundColor: C.cheese },
  goRed: { backgroundColor: C.tomato },
  goSolo: { flex: 0, alignSelf: 'stretch' },
  goGhost: { backgroundColor: '#fff' },
  goText: { fontFamily: F.bold, fontSize: 16, color: '#fff', textAlign: 'center' },
  moment: { flex: 1, backgroundColor: '#8F2216', justifyContent: 'space-between', paddingHorizontal: 22 },
  momentBody: { alignItems: 'center', gap: 10 },
  momentSign: { fontFamily: F.bold, fontSize: 14, letterSpacing: 4, color: '#FFE7C2' },
  momentTitle: { fontFamily: F.bold, fontSize: 28, color: '#fff', textAlign: 'center' },
  stars: { fontFamily: F.bold, fontSize: 64, color: '#FFD23F' },
  starsSub: { fontFamily: F.semi, fontSize: 16, color: '#FFE7C2', textAlign: 'center' },
  nonna: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  bubble: { flex: 1, backgroundColor: '#FFF4E0', borderRadius: 16, borderWidth: 2.5, borderColor: C.ink, padding: 12, gap: 6 },
  bubbleText: { fontFamily: F.semi, fontSize: 14, color: C.ink },
});
