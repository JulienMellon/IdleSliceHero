// Game-screen building blocks: chunky buttons, the HUD + goal bar, the oven, upgrade rows, popups.
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { duration, money, shownValue } from '../engine/format';
import { C, F } from '../theme';
import { BookIcon, CoinIcon, MapIcon, ScooterIcon, SliceIcon, StarIcon, WhooshIcon } from './icons';
import { emitPayout, onPayout } from './pulse-bus';

const native = Platform.OS !== 'web';

export function haptic(kind: 'light' | 'success' | 'error' = 'light') {
  if (!native) return;
  const p =
    kind === 'success'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : kind === 'error'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  void p.catch(() => {});
}

/** Shows `target`, but counts up smoothly when it jumps (offline collect, big payouts). */
export function useCountUp(target: number) {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  shownRef.current = shown;
  useEffect(() => {
    const start = shownRef.current;
    const jump = target - start;
    if (jump <= 0 || jump < Math.max(50, start * 0.25)) {
      setShown(target);
      return;
    }
    const t0 = Date.now();
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / 900);
      setShown(start + jump * (1 - Math.pow(1 - k, 3)));
      if (k >= 1) clearInterval(id);
    }, 33);
    return () => clearInterval(id);
  }, [target]);
  return shown;
}

const BURST = ['star', 'coin', 'slice', 'star', 'coin', 'slice'] as const;

/** 3D "candy" button. onPress returns true on a successful purchase (burst) or false (shake). */
/**
 * tone: 'normal' = bright green when affordable; 'soft' = affordable but adds nothing right now;
 * 'neutral' = affordable but deliberately de-emphasised (e.g. before a shop has a manager).
 */
export function BuyButton({ label, sub, enabled, onPress, testID, compact, tone = 'normal' }: { label: string; sub?: string; enabled: boolean; onPress: () => boolean | void; testID?: string; compact?: boolean; tone?: 'normal' | 'soft' | 'neutral' }) {
  // can't afford = flat grey; affordable-but-no-gain-now = white with a basil border and ink text
  const outerBg = !enabled ? '#C9BCAD' : tone === 'soft' ? '#A9CFB1' : tone === 'neutral' ? C.basilDark : C.basilDark;
  const innerBg = !enabled ? '#E2D9CE' : tone === 'soft' ? '#E3F2E6' : tone === 'neutral' ? '#FFFFFF' : C.basil;
  const labelColor = !enabled ? '#8A7B6E' : tone === 'soft' ? C.basilDark : tone === 'neutral' ? C.ink : '#fff';
  const innerBorder = enabled && tone === 'neutral' ? { borderColor: C.basil, borderWidth: 1.5 } : null;
  const burst = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const [bursting, setBursting] = useState(false);
  const press = () => {
    const ok = onPress();
    if (ok === false) {
      haptic('error');
      shake.setValue(0);
      Animated.sequence([-6, 6, -4, 4, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: native }))).start();
      return;
    }
    haptic(ok ? 'success' : 'light');
    if (ok) {
      setBursting(true);
      burst.setValue(0);
      Animated.timing(burst, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: native }).start(() => setBursting(false));
    }
  };
  return (
    <Animated.View style={{ transform: [{ translateX: shake }] }}>
      <Pressable testID={testID} onPress={press} style={({ pressed }) => [styles.buyOuter, compact && { minWidth: 0, alignSelf: 'stretch' }, { backgroundColor: outerBg }, pressed && { transform: [{ translateY: 3 }] }]}>
        <View style={[styles.buyInner, compact && styles.buyCompact, { backgroundColor: innerBg }, innerBorder]}>
          {sub ? <Text style={styles.buySub}>{sub}</Text> : null}
          <Text style={[styles.buyLabel, compact && { fontSize: 15 }, { color: labelColor }]} numberOfLines={1} adjustsFontSizeToFit>
            {label}
          </Text>
        </View>
      </Pressable>
      {bursting &&
        BURST.map((e, i) => {
          const a = (i / BURST.length) * Math.PI * 2;
          return (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                styles.burst,
                {
                  opacity: burst.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
                  transform: [
                    { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * 46] }) },
                    { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * 34 - 14] }) },
                    { scale: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.2, 0.9] }) },
                  ],
                },
              ]}>
              {e === 'star' ? <StarIcon size={18} /> : e === 'coin' ? <CoinIcon size={18} /> : <SliceIcon size={18} />}
            </Animated.View>
          );
        })}
    </Animated.View>
  );
}

export interface Goal {
  label: string;
  current: number;
  target: number;
  /** Shown instead of a money amount, e.g. "9/24". */
  text?: string;
  /** Shown instead of the amount, e.g. a trophy. */
  icon?: React.ReactNode;
  onPress?: () => boolean;
}

export function Hud({ cash, subtitle, goal, onScrapbook, onCity, newScenes }: { cash: number; subtitle: string; goal: Goal | null; onScrapbook: () => void; onCity: () => void; newScenes: number }) {
  const shown = useCountUp(cash);
  const flash = useRef(new Animated.Value(1)).current;
  const counting = shown < cash - 0.5;
  useEffect(() => {
    const bump = (to: number) => {
      flash.setValue(to);
      Animated.spring(flash, { toValue: 1, friction: 4, useNativeDriver: native }).start();
    };
    if (counting) bump(1.15);
    // Every delivery that lands on the map gives the cash total a little kick.
    return onPayout(() => bump(1.08));
  }, [counting, flash]);
  const pct = goal ? Math.max(0, Math.min(1, goal.current / goal.target)) : 0;
  const ready = !!goal?.onPress && pct >= 1;
  return (
    <View style={styles.hud}>
      <View style={styles.hudTop}>
        <Pressable onPress={onScrapbook} style={styles.hudIcon} testID="open-scrapbook" hitSlop={8}>
          <BookIcon size={32} />
          {newScenes > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{newScenes}</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.cashPill}>
          <Animated.Text style={[styles.cash, { transform: [{ scale: flash }] }]} numberOfLines={1} adjustsFontSizeToFit testID="cash">
            {money(shown, true)}
          </Animated.Text>
          <Text style={styles.perSec} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Pressable onPress={onCity} style={styles.hudIcon} testID="open-city" hitSlop={8}>
          <MapIcon size={32} />
        </Pressable>

      </View>
      {goal && (
        <Pressable
          testID="goal"
          disabled={!goal.onPress}
          onPress={() => {
            const ok = goal.onPress?.();
            haptic(ok ? 'success' : ok === false ? 'error' : 'light');
          }}
          style={[styles.goal, ready && styles.goalReady]}>
          <View style={[styles.goalFill, { width: `${pct * 100}%` }, ready && { backgroundColor: C.basil }]} />
          <Text style={[styles.goalLabel, ready && styles.goalTextReady]} numberOfLines={1}>
            {ready ? `▶ ${goal.label} — tap!` : goal.label}
          </Text>
          {goal.icon ? <View style={{ zIndex: 1, marginLeft: 6 }}>{goal.icon}</View> : <Text style={[styles.goalAmt, ready && styles.goalTextReady]}>{goal.text ?? `${money(Math.min(goal.current, goal.target), true)} / ${money(goal.target)}`}</Text>}
        </Pressable>
      )}
    </View>
  );
}

export function UpgradeRow(props: {
  icon: string | React.ReactNode;
  title: string;
  level: string;
  detail: string;
  milestone?: { from: number; to: number; level: number } | null;
  cost: number | null;
  costLabel?: string;
  canBuy: boolean;
  highlight?: boolean;
  onBuy: () => boolean | void;
  testID?: string;
}) {
  const m = props.milestone;
  return (
    <View style={[styles.row, props.highlight && styles.rowHighlight]}>
      <View style={styles.iconTile}>
        {typeof props.icon === 'string' ? <Text style={styles.iconText}>{props.icon}</Text> : props.icon}
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {props.title} <Text style={styles.level}>{props.level}</Text>
        </Text>
        <Text style={styles.small} numberOfLines={2}>
          {props.detail}
        </Text>
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

export function OfflinePopup({ seconds, earned, byShop, onCollect }: { seconds: number; earned: number; byShop: { name: string; earned: number; managed: boolean }[]; onCollect: () => void }) {
  const pop = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: native }).start();
  }, [pop]);
  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.modal, { transform: [{ scale: pop }] }]}>
        <Text style={styles.modalHead}>While you were away…</Text>
        <View style={styles.modalIcons}>
          <ScooterIcon size={46} />
          <WhooshIcon size={34} />
          <SliceIcon size={40} />
        </View>
        <Text style={styles.small}>
          {byShop.some((b) => b.managed)
            ? `Your managers kept ${byShop.filter((b) => b.managed).length} pizzeria${byShop.filter((b) => b.managed).length === 1 ? '' : 's'} running for ${duration(seconds)}`
            : `Your kitchens finished their queued orders while you were away`}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 2 }}>
          {byShop.map((b) => (
            <View key={b.name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.small}>
                {b.name}
                {b.managed ? '' : ' (queued orders)'}
              </Text>
              <Text style={[styles.small, { color: C.basilDark, fontFamily: F.semi }]}>+{money(b.earned)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.modalCash}>+{money(byShop.length ? byShop.reduce((t, b) => t + shownValue(b.earned), 0) : earned)}</Text>
        <View style={{ alignSelf: 'stretch' }}>
          <BuyButton
            label="Collect"
            enabled
            onPress={() => {
              onCollect();
              return true;
            }}
            testID="collect-offline"
          />
        </View>
      </Animated.View>
    </View>
  );
}

export function Toast({ text, top, compact }: { text: string; top: number; compact?: boolean }) {
  return (
    <View style={[styles.toast, compact && styles.toastCompact, { top }]} pointerEvents="none">
      <Text style={[styles.toastText, compact && { fontSize: 13 }]}>{text}</Text>
    </View>
  );
}

const shadow = Platform.select({
  web: { boxShadow: '0 3px 0 rgba(59,31,20,0.18)' } as object,
  default: { shadowColor: '#3B1F14', shadowOpacity: 0.18, shadowRadius: 0, shadowOffset: { width: 0, height: 3 } },
});

const styles = StyleSheet.create({
  buyOuter: { borderRadius: 14, paddingBottom: 4, minWidth: 88 },
  buyInner: { borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.12)' },
  buyLabel: { fontFamily: F.bold, color: '#fff', fontSize: 17 },
  buyCompact: { paddingVertical: 2, paddingHorizontal: 4 },
  buySub: { fontFamily: F.semi, color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 1 },
  burst: { position: 'absolute', alignSelf: 'center', top: 8 },
  modalIcons: { flexDirection: 'row', alignItems: 'center', gap: 2, marginVertical: 4 },

  hud: { backgroundColor: C.tomato, paddingHorizontal: 12, paddingBottom: 10, paddingTop: 6, gap: 8 },
  hudTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hudIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  hudEmoji: { fontSize: 22 },
  hudIconSmall: { position: 'absolute', right: -4, top: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: C.tomatoDark, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.tomato, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontFamily: F.bold, fontSize: 10, color: C.ink },
  cashPill: { flex: 1, alignItems: 'center' },
  cash: { fontFamily: F.bold, fontSize: 34, color: '#fff', textShadowColor: C.tomatoDark, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  perSec: { fontFamily: F.semi, fontSize: 13, color: '#FFE7C2' },
  goal: { height: 30, borderRadius: 15, backgroundColor: '#FFE7C2', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)' },
  goalReady: { borderColor: '#fff', backgroundColor: C.basil },
  goalFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.cheese },
  // Dark ink on a light track + yellow fill: readable at every fill level.
  goalLabel: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.ink },
  goalAmt: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  goalTextReady: { color: '#fff' },

  ovenCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel, borderRadius: 20, padding: 10, gap: 12, borderWidth: 3, borderColor: C.ink, ...shadow },
  ovenIdle: { borderColor: C.tomato, backgroundColor: '#FFF7F2' },
  ovenEmoji: { position: 'absolute', alignSelf: 'center', top: 20, fontSize: 30 },
  ovenInfo: { flex: 1 },
  ovenHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  ovenStatus: { fontFamily: F.bold, color: C.tomato, fontSize: 16, marginVertical: 1 },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 3 },
  slot: { width: 13, height: 13, borderRadius: 6.5, backgroundColor: '#F1E4D3', borderWidth: 1.5, borderColor: '#D9C4AB' },
  slotFull: { backgroundColor: C.cheese, borderColor: C.cheeseDark },

  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel, borderRadius: 18, padding: 9, gap: 10, borderWidth: 3, borderColor: C.ink, ...shadow },
  rowHighlight: { borderColor: C.basilDark, backgroundColor: '#F1FFF0' },
  iconTile: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFE9C7', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.cheeseDark },
  iconText: { fontSize: 26 },
  rowMid: { flex: 1 },
  rowBtn: { width: 96 },
  cardTitle: { fontFamily: F.bold, color: C.ink, fontSize: 17 },
  level: { fontFamily: F.semi, color: C.inkSoft, fontSize: 14 },
  small: { fontFamily: F.regular, color: C.inkSoft, fontSize: 13 },
  msBar: { height: 13, borderRadius: 7, backgroundColor: '#F1E4D3', marginTop: 4, overflow: 'hidden', justifyContent: 'center' },
  msFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.cheese },
  msText: { fontFamily: F.semi, fontSize: 10, color: C.ink, textAlign: 'center' },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: C.bg, borderRadius: 24, borderWidth: 4, borderColor: C.ink, padding: 22, alignItems: 'center', width: '100%', maxWidth: 360, gap: 8 },
  modalHead: { fontFamily: F.bold, fontSize: 24, color: C.ink },
  modalEmoji: { fontSize: 44 },
  modalCash: { fontFamily: F.bold, fontSize: 40, color: C.basilDark, marginBottom: 6 },

  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: C.ink, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  toastCompact: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 14 },
  toastText: { fontFamily: F.semi, color: '#fff', fontSize: 15 },
});
