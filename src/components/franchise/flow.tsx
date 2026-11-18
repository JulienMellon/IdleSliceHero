// The franchise flow (card T2): the confirm sheet (what you keep, what you give up, the multiplier; two confirmations), then the franchise
// moment. The franchise itself happens when the moment's button is pressed, so a player who has said yes twice can still see the send-off.
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GameState } from '../../engine/game';
import { useGame } from '../../store/game-store';
import { C, F } from '../../theme';
import { Portrait } from '../portrait/index';
import { useReducedMotion } from '../scene/clock';
import { TAP } from '../tap-targets';
import { advance, confettiPieces, countUp, momentView, retreat, sheetView, type FlowStep } from './franchise-model';

const CONFETTI = confettiPieces(18);
const COUNT_MS = 1400;

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
  const reduced = useReducedMotion();
  const [rise] = useState(() => new Animated.Value(0));
  const [burst] = useState(() => new Animated.Value(0));
  const [count] = useState(() => new Animated.Value(0));
  const target = m?.stars ?? 0;
  const [shown, setShown] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) {
      rise.setValue(1);
      setShown(target);
      return;
    }
    const id = count.addListener(({ value }) => setShown(countUp(target, value)));
    Animated.timing(rise, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.timing(count, { toValue: 1, duration: COUNT_MS, delay: 400, easing: Easing.linear, useNativeDriver: false }).start();
    Animated.timing(burst, { toValue: 1, duration: 1100, delay: 400 + COUNT_MS - 200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    return () => count.removeListener(id);
  }, [rise, burst, count, reduced, target]);
  if (!m) return null;
  return (
    <View style={[styles.moment, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} testID="franchise-moment">
      <Animated.View
        style={[styles.momentBody, { opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}
      >
        <Text style={styles.momentSign}>FRANCHISE</Text>
        <Text style={styles.momentTitle} accessibilityRole="header">
          {m.title}
        </Text>
        <View style={styles.starsWrap}>
          <Text style={styles.stars} accessibilityLabel={`${m.stars} Franchise Stars`}>
            ★ {shown}
          </Text>
          {!reduced &&
            CONFETTI.map((c, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={[
                  styles.confetti,
                  {
                    backgroundColor: c.color,
                    opacity: burst.interpolate({ inputRange: [0, 0.05, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                    transform: [
                      { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(c.angle) * c.dist] }) },
                      { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(c.angle) * c.dist * 0.8 + 30] }) },
                      { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${c.turns * 360}deg`] }) },
                    ],
                  },
                ]}
              />
            ))}
        </View>
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
        <View style={styles.postcard} testID="franchise-postcard" accessibilityLabel={`${m.postcard.title}. ${m.postcard.line}`}>
          <View style={styles.stripe}>
            {m.postcard.colors.map((c) => (
              <View key={c} style={{ flex: 1, backgroundColor: c }} />
            ))}
          </View>
          <Text style={styles.postTitle}>{m.postcard.title}</Text>
          <Text style={styles.postLine}>{m.postcard.line}</Text>
        </View>
      </Animated.View>
      <Pressable
        testID="franchise-moment-go"
        accessibilityRole="button"
        accessibilityLabel={m.button}
        onPress={onGo}
        style={[styles.go, styles.goGold, styles.goSolo]}
      >
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
              <Pressable
                testID="franchise-back"
                accessibilityRole="button"
                accessibilityLabel={step === 'ask' ? s.cancel : 'Go back'}
                onPress={back}
                style={[styles.go, styles.goGhost]}
              >
                <Text style={[styles.goText, { color: C.ink }]}>{step === 'ask' ? s.cancel : 'Go back'}</Text>
              </Pressable>
              <Pressable
                testID="franchise-go"
                accessibilityRole="button"
                accessibilityLabel={step === 'ask' ? s.go[0] : s.go[1]}
                onPress={go}
                style={[styles.go, step === 'ask' ? styles.goGold : styles.goRed]}
              >
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
  go: {
    flex: 1,
    minHeight: TAP.min + 4,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  goGold: { backgroundColor: C.cheese },
  goRed: { backgroundColor: C.tomato },
  goSolo: { flex: 0, alignSelf: 'stretch' },
  goGhost: { backgroundColor: '#fff' },
  goText: { fontFamily: F.bold, fontSize: 16, color: '#fff', textAlign: 'center' },
  moment: { flex: 1, backgroundColor: '#8F2216', justifyContent: 'space-between', paddingHorizontal: 22 },
  momentBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 16 },
  momentSign: { fontFamily: F.bold, fontSize: 14, letterSpacing: 4, color: '#FFE7C2' },
  momentTitle: { fontFamily: F.bold, fontSize: 28, color: '#fff', textAlign: 'center' },
  starsWrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  stars: { fontFamily: F.bold, fontSize: 64, color: '#FFD23F' },
  confetti: { position: 'absolute', width: 8, height: 12, borderRadius: 2 },
  postcard: {
    alignSelf: 'stretch',
    backgroundColor: '#FFF4E0',
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: C.ink,
    padding: 10,
    gap: 4,
    marginTop: 10,
    transform: [{ rotate: '-1.5deg' }],
  },
  stripe: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', borderWidth: 1.5, borderColor: C.ink },
  postTitle: { fontFamily: F.bold, fontSize: 16, color: C.tomato },
  postLine: { fontFamily: F.semi, fontSize: 13, color: C.ink },
  starsSub: { fontFamily: F.semi, fontSize: 16, color: '#FFE7C2', textAlign: 'center' },
  nonna: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  bubble: { flex: 1, backgroundColor: '#FFF4E0', borderRadius: 16, borderWidth: 2.5, borderColor: C.ink, padding: 12, gap: 6 },
  bubbleText: { fontFamily: F.semi, fontSize: 14, color: C.ink },
});
