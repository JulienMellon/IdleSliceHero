// Game-screen building blocks: chunky buttons, the HUD + goal bar, the oven, upgrade rows, popups.
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { cashText, duration, goalAmount, money, shownValue } from '../engine/format';
import { C, F } from '../theme';
import { GOAL_BAR, goalBarLayout } from './goal-model';
import { BookIcon, ClipboardIcon, CoinIcon, GiftIcon, MapIcon, ScooterIcon, SliceIcon, StarIcon, WhooshIcon } from './icons';
import { onPayout, setCoinTarget } from './pulse-bus';
import { BUTTON_H, COMPACT_FONT_MAX_SCALE } from './tap-targets';

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

/**
 * The game's purchase button (a 3D "candy" button). `onPress` returns true on a successful purchase (burst) or false
 * (shake). `tone`: `normal` is green when affordable and grey when not; `neutral` is white (de-emphasised, e.g. before
 * a shop has a manager); `nogain` is a buy that adds nothing right now, drawn flat and muted (no strike-through: a struck price read as
 * "unaffordable" or "discounted", D359), so green always means "this adds income" (D313). `nogain` is a style of the same element tree, so a station
 * flipping to it right after a purchase keeps its burst (C56). `saving` (with `progress` 0–1) marks the bottleneck
 * the player is saving for (D326). `compact` is the 44 pt sidewalk button: `icon` + `sub` above the price.
 */
export function BuyButton({ label, sub, enabled, onPress, testID, compact, icon, tone = 'normal', saving = false, progress = 0 }: { label: string; sub?: string; enabled: boolean; onPress: () => boolean | void; testID?: string; compact?: boolean; icon?: React.ReactNode; tone?: 'normal' | 'neutral' | 'nogain'; saving?: boolean; progress?: number }) {
  const nogain = tone === 'nogain';
  // saving for the bottleneck: a pale basil face, so the one thing worth saving for stands out among the greys (D326)
  const wait = saving && !enabled && !nogain;
  const outerBg = nogain ? '#CFC3B2' : wait ? '#A9CFB1' : !enabled ? '#C9BCAD' : C.basilDark;
  const innerBg = nogain ? '#EFE6D8' : wait ? '#DDEFD9' : !enabled ? '#E2D9CE' : tone === 'neutral' ? '#FFFFFF' : C.basil;
  // a greyed-out button still reads at ~4:1 (was #8A7B6E, ~2:1: D310)
  const labelColor = nogain ? '#8A7B6C' : wait ? '#2E7D3E' : !enabled ? '#665A4F' : tone === 'neutral' ? C.ink : '#fff';
  const innerBorder = nogain ? styles.noGainInner : enabled && tone === 'neutral' ? { borderColor: C.basil, borderWidth: 1.5 } : null;
  // lazily created once, not a throwaway Animated.Value on every render (M29)
  const [burst] = useState(() => new Animated.Value(0));
  const [shake] = useState(() => new Animated.Value(0));
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
      <Pressable testID={testID} onPress={press} style={({ pressed }) => [styles.buyOuter, compact && styles.buyOuterCompact, { backgroundColor: outerBg }, pressed && { transform: [{ translateY: 3 }] }]}>
        <View style={[styles.buyInner, compact && styles.buyInnerCompact, { backgroundColor: innerBg }, innerBorder]}>
          {sub && (compact || !nogain) ? (
            compact ? (
              <View style={styles.buySubRow}>
                {icon}
                <Text style={[styles.buySubCompact, { color: labelColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
                  {sub}
                </Text>
              </View>
            ) : (
              <Text style={styles.buySub}>{sub}</Text>
            )
          ) : null}
          <Text style={[styles.buyLabel, compact && styles.buyLabelCompact, { color: labelColor }]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={compact ? COMPACT_FONT_MAX_SCALE : undefined}>
            {label}
          </Text>
          {wait ? (
            <View style={styles.saveTrack} pointerEvents="none">
              <View style={[styles.saveFill, { width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }]} />
            </View>
          ) : null}
          {/* a no-gain button explains itself under the price */}
          {sub && !compact && nogain ? <Text style={[styles.buySub, { color: '#8A7B6C', letterSpacing: 0.3 }]}>{sub}</Text> : null}
        </View>
      </Pressable>
      {/* no burst on the small sidewalk buttons: it showed through the buttons beside them (D357) */}
      {bursting &&
        !compact &&
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

export function Hud({ cash, subtitle, boostText, goal, onScrapbook, onCity, newScenes, halo = null, onTasks, tasksBadge = 0, onGift, giftDot = false }: { cash: number; subtitle: string; /** The running boost, "2× 10m": drawn in basil after the subtitle. */ boostText?: string; goal: Goal | null; onScrapbook: () => void; onCity: () => void; newScenes: number; halo?: 'cash' | 'goal' | null; onTasks?: () => void; tasksBadge?: number; onGift?: () => void; giftDot?: boolean }) {
  const shown = useCountUp(cash);
  const [flash] = useState(() => new Animated.Value(1));
  // the cash text's window position: payout coins land on it (C81)
  const cashRef = useRef<ComponentRef<typeof Text>>(null);
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
  const [goalW, setGoalW] = useState(0);
  const bar = goalBarLayout(goal?.current ?? 0, goal?.target ?? 0, !!goal?.onPress, goalW);
  const { pct, ready } = bar;
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
        {/* v5.4: the clipboard and the gift show once rewards unlock (their handlers are passed) */}
        {onTasks && (
          <Pressable onPress={onTasks} style={styles.hudIcon} testID="open-tasks" accessibilityLabel="Daily and weekly tasks">
            <ClipboardIcon size={30} />
            {tasksBadge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tasksBadge}</Text>
              </View>
            )}
          </Pressable>
        )}
        <View style={[styles.cashPill, halo === 'cash' && styles.halo]}>
          <Animated.Text
            ref={cashRef}
            onLayout={() => cashRef.current?.measureInWindow?.((x: number, y: number, w: number, h: number) => setCoinTarget(x + w / 2, y + h / 2))}
            style={[styles.cash, { transform: [{ scale: flash }] }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            testID="cash">
            {cashText(shown)}
          </Animated.Text>
          <Text style={styles.perSec} numberOfLines={1}>
            {subtitle}
            {boostText ? (
              <>
                {subtitle ? ' · ' : ''}
                <Text style={styles.boostTail}>{`\u00A0${boostText}\u00A0`}</Text>
              </>
            ) : null}
          </Text>
        </View>
        {onGift && (
          <Pressable onPress={onGift} style={styles.hudIcon} testID="open-gift" accessibilityLabel="Daily gift">
            <GiftIcon size={30} />
            {giftDot && <View style={styles.giftDot} />}
          </Pressable>
        )}
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
          onLayout={(e) => setGoalW(e.nativeEvent.layout.width)}
          style={[styles.goal, ready && styles.goalReady, halo === 'goal' && styles.haloGoal]}>
          <View style={[styles.goalFill, { width: `${pct * 100}%` }, ready && { backgroundColor: C.basil }]} />
          <GoalLine label={ready ? `▶ ${goal.label} — tap!` : goal.label} amount={goal.text ?? goalAmount(goal.current, goal.target)} icon={goal.icon} tone={ready ? 'ready' : 'track'} />
          {/* D297: the same line again in cream, clipped to the fill, so the part over the fill is light and the rest stays dark */}
          {bar.split ? (
            <View pointerEvents="none" style={[styles.goalClip, { width: bar.fillW }]}>
              <View style={[styles.goalClipLine, { width: bar.innerW }]}>
                <GoalLine label={goal.label} amount={goal.text ?? goalAmount(goal.current, goal.target)} icon={goal.icon} tone="fill" />
              </View>
            </View>
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

/** One line of the goal bar (label, then amount or icon) in one of its three inks. Primitive props, so it stays memo-friendly. */
function GoalLine({ label, amount, icon, tone }: { label: string; amount: string; icon?: React.ReactNode; tone: 'track' | 'fill' | 'ready' }) {
  const color = tone === 'track' ? GOAL_BAR.onTrack : tone === 'fill' ? GOAL_BAR.onFill : '#fff';
  return (
    <>
      <Text style={[styles.goalLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
      {icon ? <View style={{ zIndex: 1, marginLeft: 6 }}>{icon}</View> : <Text style={[styles.goalAmt, { color }]}>{amount}</Text>}
    </>
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

export function OfflinePopup({ seconds, capped, awaySeconds, earned, byShop, onCollect }: { seconds: number; capped: boolean; awaySeconds: number; earned: number; byShop: { name: string; earned: number; managed: boolean }[]; onCollect: () => void }) {
  const [pop] = useState(() => new Animated.Value(0.7));
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
            : `Your kitchens finished the pizzas already in the oven while you were away`}
        </Text>
        {capped ? <Text style={[styles.small, { fontFamily: F.semi }]}>{`Capped at ${duration(seconds).replace(/ /g, '\u00A0')} (away ${duration(awaySeconds).replace(/ /g, '\u00A0')})`}</Text> : null}
        <View style={{ alignSelf: 'stretch', gap: 2 }}>
          {byShop.map((b) => (
            <View key={b.name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.small}>
                {b.name}
                {b.managed ? '' : ' (orders already in the oven)'}
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
  // compact: a fixed 44 pt (outer, including its 4 pt lip), so nothing depends on flex-grow against a min height (C46)
  buyOuterCompact: { minWidth: 0, alignSelf: 'stretch', height: BUTTON_H },
  buySubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  buySubCompact: { fontFamily: F.semi, fontSize: 10, letterSpacing: 0.1, flexShrink: 1 },
  buyLabelCompact: { fontSize: 15 },
  noGainInner: { backgroundColor: '#EFE6D8', borderColor: '#CFC3B2' },
  saveTrack: { position: 'absolute', left: 6, right: 6, bottom: 2, height: 3, borderRadius: 2, backgroundColor: 'rgba(46,125,62,0.18)' },
  saveFill: { height: 3, borderRadius: 2, backgroundColor: '#2E7D3E' },
  buyInnerCompact: { flex: 1, justifyContent: 'center', paddingVertical: 0, paddingHorizontal: 4 },
  buySub: { fontFamily: F.semi, color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 1 },
  burst: { position: 'absolute', alignSelf: 'center', top: 8 },
  modalIcons: { flexDirection: 'row', alignItems: 'center', gap: 2, marginVertical: 4 },

  hud: { backgroundColor: C.tomato, paddingHorizontal: 12, paddingBottom: 10, paddingTop: 6, gap: 8 },
  hudTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hudIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  hudEmoji: { fontSize: 22 },
  hudIconSmall: { position: 'absolute', right: -4, top: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: C.tomatoDark, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.tomato, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  giftDot: { position: 'absolute', top: -1, right: -1, width: 16, height: 16, borderRadius: 8, backgroundColor: C.cheese, borderWidth: 2, borderColor: C.tomato },
  badgeText: { fontFamily: F.bold, fontSize: 10, color: C.ink },
  cashPill: { flex: 1, alignItems: 'center' },
  cash: { fontFamily: F.bold, fontSize: 34, color: '#fff', textShadowColor: C.tomatoDark, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  boostTail: { color: '#2E7D3E', backgroundColor: '#FFF4E0', fontFamily: F.bold },
  perSec: { fontFamily: F.semi, fontSize: 13, color: '#FFE7C2' },
  // Nonna's tutorial points at the cash or the goal bar with a gold halo
  halo: { borderRadius: 18, borderWidth: 3, borderColor: '#FFC531', backgroundColor: 'rgba(255,197,49,0.18)' },
  haloGoal: { borderColor: '#FFC531', borderWidth: 3 },
  goal: { height: 30, borderRadius: 15, backgroundColor: GOAL_BAR.track, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderWidth: GOAL_BAR.border, borderColor: 'rgba(0,0,0,0.15)' },
  goalReady: { borderColor: '#fff', backgroundColor: C.basil },
  goalFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: GOAL_BAR.fill },
  // two-tone label (D297): dark ink over the track, a cream copy clipped to the fill's width
  goalClip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  goalClipLine: { position: 'absolute', left: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  goalLabel: { flex: 1, fontFamily: F.bold, fontSize: 14 },
  goalAmt: { fontFamily: F.bold, fontSize: 13 },

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
