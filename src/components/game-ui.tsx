// Game-screen building blocks: chunky buttons, the oven, upgrade rows, popups.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { duration, money } from '../engine/format';
import { C, F } from '../theme';

const native = Platform.OS !== 'web';

export function haptic() {
  if (native) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** 3D-ish "candy" button used for every purchase. */
export function BuyButton({ label, sub, enabled, onPress, testID }: { label: string; sub?: string; enabled: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [styles.buyOuter, { backgroundColor: enabled ? C.basilDark : C.lockedDark }, pressed && enabled && { transform: [{ translateY: 3 }] }]}>
      <View style={[styles.buyInner, { backgroundColor: enabled ? C.basil : C.locked }]}>
        {sub ? <Text style={styles.buySub}>{sub}</Text> : null}
        <Text style={styles.buyLabel} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function Hud({ cash, perSecond, auto, onScrapbook, onSettings, newScenes }: { cash: number; perSecond: number; auto: boolean; onScrapbook: () => void; onSettings: () => void; newScenes: number }) {
  return (
    <View style={styles.hud}>
      <Pressable onPress={onScrapbook} style={styles.hudIcon} testID="open-scrapbook" hitSlop={8}>
        <Text style={styles.hudEmoji}>📖</Text>
        {newScenes > 0 && <View style={styles.badge} />}
      </Pressable>
      <View style={styles.cashPill}>
        <Text style={styles.cash} numberOfLines={1} adjustsFontSizeToFit testID="cash">
          {money(cash)}
        </Text>
        <Text style={styles.perSec}>{auto ? `${money(perSecond)}/sec` : `up to ${money(perSecond)}/sec · keep tapping!`}</Text>
      </View>
      <Pressable onPress={onSettings} style={styles.hudIcon} testID="open-settings" hitSlop={8}>
        <Text style={styles.hudEmoji}>⚙️</Text>
      </Pressable>
    </View>
  );
}

export function OvenCard({ progress, stock, shelf, auto, idle, onTap }: { progress: number; stock: number; shelf: number; auto: boolean; idle: boolean; onTap: () => void }) {
  const bounce = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!idle) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 450, useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 1, duration: 450, useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(1);
    };
  }, [idle, pulse]);

  const tap = () => {
    haptic();
    bounce.setValue(0.88);
    Animated.spring(bounce, { toValue: 1, friction: 3, useNativeDriver: native }).start();
    onTap();
  };
  const R = 44;
  const circ = 2 * Math.PI * R;
  const full = stock >= shelf;
  return (
    <View style={styles.ovenCard}>
      <Pressable onPress={tap} testID="oven">
        <Animated.View style={{ transform: [{ scale: Animated.multiply(bounce, pulse) }] }}>
          <Svg width={110} height={110} viewBox="0 0 110 110">
            <Circle cx={55} cy={55} r={R + 6} fill={C.tomatoDark} />
            <Circle cx={55} cy={55} r={R} fill="#3B1F14" />
            <Circle cx={55} cy={55} r={R} stroke={C.cheese} strokeWidth={8} fill="none" strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - progress)} strokeLinecap="round" transform="rotate(-90 55 55)" />
          </Svg>
          <Text style={styles.ovenEmoji}>{full ? '✅' : '🍕'}</Text>
        </Animated.View>
      </Pressable>
      <View style={styles.ovenInfo}>
        <Text style={styles.cardTitle}>Nonna’s Oven</Text>
        <Text style={styles.ovenStatus}>
          {full ? 'Shelf full — hire drivers!' : idle ? 'TAP TO BAKE!' : auto ? 'Baking automatically · tap to rush' : 'Baking… tap to rush'}
        </Text>
        <View style={styles.shelf}>
          {Array.from({ length: shelf }).map((_, i) => (
            <View key={i} style={[styles.slot, i < Math.floor(stock) && styles.slotFull]} />
          ))}
        </View>
        <Text style={styles.small}>
          {Math.floor(stock)}/{shelf} pizzas ready
        </Text>
      </View>
    </View>
  );
}

export function UpgradeRow(props: {
  icon: string;
  title: string;
  level: string;
  detail: string;
  milestone?: { from: number; to: number; level: number } | null;
  cost: number | null;
  costLabel?: string;
  canBuy: boolean;
  highlight?: boolean;
  onBuy: () => void;
  testID?: string;
}) {
  const m = props.milestone;
  return (
    <View style={[styles.row, props.highlight && styles.rowHighlight]}>
      <View style={styles.iconTile}>
        <Text style={styles.iconText}>{props.icon}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.cardTitle}>
          {props.title} <Text style={styles.level}>{props.level}</Text>
        </Text>
        <Text style={styles.small}>{props.detail}</Text>
        {m ? (
          <View style={styles.msBar}>
            <View style={[styles.msFill, { width: `${Math.min(100, ((m.level - m.from) / (m.to - m.from)) * 100)}%` }]} />
            <Text style={styles.msText}>×2 at {m.to}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.rowBtn}>
        <BuyButton testID={props.testID} label={props.cost === null ? props.costLabel ?? 'MAX' : money(props.cost)} sub={props.cost === null ? undefined : 'BUY'} enabled={props.canBuy} onPress={props.onBuy} />
      </View>
    </View>
  );
}

export function OfflinePopup({ seconds, earned, onCollect }: { seconds: number; earned: number; onCollect: () => void }) {
  const pop = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: native }).start();
  }, [pop]);
  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.modal, { transform: [{ scale: pop }] }]}>
        <Text style={styles.modalHead}>While you were away…</Text>
        <Text style={styles.modalEmoji}>🛵💨🍕</Text>
        <Text style={styles.small}>Nonna kept the oven going for {duration(seconds)}</Text>
        <Text style={styles.modalCash}>+{money(earned)}</Text>
        <BuyButton label="Collect" enabled onPress={onCollect} testID="collect-offline" />
      </Animated.View>
    </View>
  );
}

export function Toast({ text }: { text: string }) {
  return (
    <View style={styles.toast} pointerEvents="none">
      <Text style={styles.toastText}>{text}</Text>
    </View>
  );
}

const shadow = Platform.select({
  web: { boxShadow: '0 3px 0 rgba(59,31,20,0.18)' } as object,
  default: { shadowColor: '#3B1F14', shadowOpacity: 0.18, shadowRadius: 0, shadowOffset: { width: 0, height: 3 } },
});

const styles = StyleSheet.create({
  buyOuter: { borderRadius: 14, paddingBottom: 4, minWidth: 92 },
  buyInner: { borderRadius: 14, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.12)' },
  buyLabel: { fontFamily: F.bold, color: '#fff', fontSize: 17 },
  buySub: { fontFamily: F.semi, color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 1 },

  hud: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 10, backgroundColor: C.tomato, borderBottomWidth: 4, borderColor: C.tomatoDark },
  hudIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  hudEmoji: { fontSize: 22 },
  badge: { position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.tomato },
  cashPill: { flex: 1, alignItems: 'center' },
  cash: { fontFamily: F.bold, fontSize: 34, color: '#fff', textShadowColor: C.tomatoDark, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  perSec: { fontFamily: F.semi, fontSize: 13, color: '#FFE7C2' },

  ovenCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel, borderRadius: 20, padding: 12, gap: 14, borderWidth: 3, borderColor: C.ink, ...shadow },
  ovenEmoji: { position: 'absolute', alignSelf: 'center', top: 34, fontSize: 38 },
  ovenInfo: { flex: 1 },
  ovenStatus: { fontFamily: F.bold, color: C.tomato, fontSize: 16, marginVertical: 2 },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginVertical: 4 },
  slot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#F1E4D3', borderWidth: 1.5, borderColor: '#D9C4AB' },
  slotFull: { backgroundColor: C.cheese, borderColor: C.cheeseDark },

  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel, borderRadius: 18, padding: 10, gap: 10, borderWidth: 3, borderColor: C.ink, ...shadow },
  rowHighlight: { borderColor: C.basilDark, backgroundColor: '#F1FFF0' },
  iconTile: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#FFE9C7', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.cheeseDark },
  iconText: { fontSize: 28 },
  rowMid: { flex: 1 },
  rowBtn: { width: 100 },
  cardTitle: { fontFamily: F.bold, color: C.ink, fontSize: 18 },
  level: { fontFamily: F.semi, color: C.inkSoft, fontSize: 14 },
  small: { fontFamily: F.regular, color: C.inkSoft, fontSize: 13 },
  msBar: { height: 14, borderRadius: 7, backgroundColor: '#F1E4D3', marginTop: 5, overflow: 'hidden', justifyContent: 'center' },
  msFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.cheese },
  msText: { fontFamily: F.semi, fontSize: 10, color: C.ink, textAlign: 'center' },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: C.bg, borderRadius: 24, borderWidth: 4, borderColor: C.ink, padding: 22, alignItems: 'center', width: '100%', maxWidth: 360, gap: 8 },
  modalHead: { fontFamily: F.bold, fontSize: 24, color: C.ink },
  modalEmoji: { fontSize: 44 },
  modalCash: { fontFamily: F.bold, fontSize: 40, color: C.basilDark, marginBottom: 6 },

  toast: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: C.ink, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  toastText: { fontFamily: F.semi, color: '#fff', fontSize: 15 },
});
