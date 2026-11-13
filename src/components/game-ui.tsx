// Game-screen building blocks: chunky buttons, the HUD + goal bar, the oven, upgrade rows, popups.
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { GIFT } from '../content/hooks';
import { cashText, goalAmount, money } from '../engine/format';
import type { NightOvenView } from '../engine/night-oven';
import { C, F } from '../theme';
import { GOAL_BAR, GOAL_FONT_MAX_SCALE, GOAL_GAP, GOAL_LAYOUT, GOAL_PAD, goalBarLayout, goalWords, type GoalSpan } from './goal-model';
import { BookIcon, ClipboardIcon, CoinIcon, GiftIcon, MapIcon, SliceIcon, StarIcon } from './icons';
import { countUpValue, offlineGiftView, type GiftSummary } from './offline-model';
import { Portrait } from './portrait';
import { emitCoin, emitPayout, onPayout, setCoinTarget } from './pulse-bus';
import { buttonOutline, type ButtonTone } from './sidewalk-model';
import { BUTTON_H, COMPACT_FONT_MAX_SCALE } from './tap-targets';

const native = Platform.OS !== 'web';

/** The Expand buy's amber (D407): a shop-wide purchase that must not read as a station buy. */
export const EXPAND_AMBER = '#F2A51A';

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
 * the player is saving for (D326). `expand` is the amber Expand buy (D407). `compact` is the 44 pt sidewalk button: `icon` + `sub`
 * above the price, and `foot` (or the "need" line) under it.
 */
export function BuyButton({ label, sub, enabled, onPress, testID, compact, icon, tone = 'normal', saving = false, progress = 0, need = null, foot = null, noBurst = false }: { /** D454: no confetti over the label (the offline popup's Collect: a star cut its "C"). */ noBurst?: boolean; label: string; sub?: string; enabled: boolean; onPress: () => boolean | void; testID?: string; compact?: boolean; icon?: React.ReactNode; tone?: ButtonTone; saving?: boolean; progress?: number; need?: string | null; /** A line under the price that shows whether or not the button is affordable (compact only). */ foot?: string | null }) {
  const nogain = tone === 'nogain';
  const amber = tone === 'expand' && enabled;
  const footText = foot ?? (!enabled ? need : null);
  const needLine = !!footText;
  // saving for the bottleneck: a pale basil face, so the one thing worth saving for stands out among the greys (D326)
  const wait = saving && !enabled && !nogain;
  const outerBg = nogain ? '#CFC3B2' : wait ? '#A9CFB1' : !enabled ? '#C9BCAD' : amber ? '#B9780B' : C.basilDark;
  const innerBg = nogain ? '#EFE6D8' : wait ? '#DDEFD9' : !enabled ? '#E2D9CE' : amber ? EXPAND_AMBER : tone === 'neutral' ? '#FFFFFF' : C.basil;
  // a greyed-out button still reads at ~4:1 (was #8A7B6E, ~2:1: D310)
  const labelColor = nogain ? '#8A7B6C' : wait ? '#2E7D3E' : !enabled ? '#665A4F' : amber || tone === 'neutral' ? C.ink : '#fff';
  // D419: a buy you can make has a 2 pt crust-brown outline in every neighbourhood
  const innerBorder = nogain ? styles.noGainInner : buttonOutline(enabled, tone);
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
    if (ok && !noBurst) {
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
                <Text style={[styles.buySubCompact, needLine && styles.buySubTight, { color: labelColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
                  {sub}
                </Text>
              </View>
            ) : (
              <Text style={styles.buySub}>{sub}</Text>
            )
          ) : null}
          <Text style={[styles.buyLabel, compact && styles.buyLabelCompact, compact && needLine && styles.buyLabelTight, { color: labelColor }]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={compact ? COMPACT_FONT_MAX_SCALE : undefined}>
            {label}
          </Text>
          {/* D402: what is still missing, under the muted price (compact only; the line heights tighten to keep the 44 pt button) */}
          {compact && needLine ? (
            <Text style={[styles.buyNeed, { color: labelColor }]} numberOfLines={1} maxFontSizeMultiplier={COMPACT_FONT_MAX_SCALE}>
              {footText}
            </Text>
          ) : null}
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

export function Hud({ topChips, cash, subtitle, boostText, goal, onScrapbook, onCity, newScenes, halo = null, onTasks, tasksBadge = 0, onGift, giftDot = false, chips, scrapRing }: { /** G98: small round chips in the top row, after the gift (the HUD_TOP_CHIPS slot); the goal bar keeps its width. */ topChips?: React.ReactNode; /** The chips at the end of the goal row (the HUD_CHIPS slot); the screen passes `<Slots items={HUD_CHIPS} />`. */ chips?: React.ReactNode; /** The next story scene's progress ring around the scrapbook button, in whole 5% steps (0..20); none when undefined. */ scrapRing?: number; cash: number; subtitle: string; /** The running boost, "2× 10m": drawn in basil after the subtitle. */ boostText?: string; goal: Goal | null; onScrapbook: () => void; onCity: () => void; newScenes: number; halo?: 'cash' | 'goal' | null; onTasks?: () => void; tasksBadge?: number; onGift?: () => void; giftDot?: boolean }) {
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
  // the measured words/amount of the goal line: the two-tone seam snaps to their edges (G88)
  const [words, setWords] = useState<{ label: string; spans: GoalSpan[] }>({ label: '', spans: [] });
  const [amountSpan, setAmountSpan] = useState<GoalSpan | null>(null);
  // stable, so the memoised words never re-render for the HUD's sake (C104, C105)
  const onWords = useCallback((label: string, spans: GoalSpan[]) => setWords({ label, spans }), []);
  const onAmount = useCallback((span: GoalSpan) => setAmountSpan((p) => (p && p.x === span.x && p.w === span.w ? p : span)), []);
  // spans measured for another label (the goal just changed) are not used: until the new line reports, the seam is exact
  const measuredSpans = words.label === goal?.label && amountSpan ? [...words.spans, amountSpan] : [];
  const bar = goalBarLayout(goal?.current ?? 0, goal?.target ?? 0, !!goal?.onPress, goalW, measuredSpans);
  const { pct, ready } = bar;
  return (
    <View style={styles.hud}>
      <View style={styles.hudTop}>
        <Pressable onPress={onScrapbook} style={styles.hudIcon} testID="open-scrapbook" hitSlop={8}>
          {scrapRing !== undefined && <ProgressRing step={scrapRing} />}
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
        {topChips}
        <Pressable onPress={onCity} style={styles.hudIcon} testID="open-city" hitSlop={8}>
          <MapIcon size={32} />
        </Pressable>

      </View>
      {goal && (
        <View style={styles.goalRow}>
        <Pressable
          testID="goal"
          disabled={!goal.onPress}
          onPress={() => {
            const ok = goal.onPress?.();
            haptic(ok ? 'success' : ok === false ? 'error' : 'light');
          }}
          onLayout={(e) => setGoalW(e.nativeEvent.layout.width)}
          style={[styles.goal, styles.goalFlex, ready && styles.goalReady, halo === 'goal' && styles.haloGoal]}>
          <View style={[styles.goalFill, goalW > 0 ? { width: bar.fillW } : { width: `${pct * 100}%` }, ready && { backgroundColor: C.basil }]} />
          <GoalLine key={ready ? 'ready' : goal.label} label={ready ? `▶ ${goal.label}` : goal.label} amount={ready ? 'tap!' : goal.text ?? goalAmount(goal.current, goal.target)} icon={goal.icon} tone={ready ? 'ready' : 'track'} onSpans={ready ? undefined : onWords} onAmount={ready ? undefined : onAmount} />
          {/* D297: the same line again in cream, clipped to the fill, so the part over the fill is light and the rest stays dark */}
          {bar.split ? (
            <View pointerEvents="none" style={[styles.goalClip, { width: bar.fillW }]}>
              <View style={[styles.goalClipLine, { width: bar.innerW }]}>
                <GoalLine label={goal.label} amount={goal.text ?? goalAmount(goal.current, goal.target)} icon={goal.icon} tone="fill" />
              </View>
            </View>
          ) : null}
        </Pressable>
        {chips}
        </View>
      )}
    </View>
  );
}

/** The ring round the scrapbook button: how far along the next story scene is. Primitive props, so it repaints only when the 5% step changes. */
const RING_R = 20;
const RING_LEN = 2 * Math.PI * RING_R;
const ProgressRing = memo(function ProgressRing({ step }: { step: number }) {
  const k = Math.max(0, Math.min(20, step)) / 20;
  // close to the next scene (90%+): the ring breathes, so the player knows a story is about to come
  const near = step >= 18;
  const [pulse] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!near) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [near, pulse]);
  return (
    <Animated.View pointerEvents="none" style={[styles.ring, { opacity: pulse }]}>
      <Svg width={44} height={44} viewBox="0 0 44 44">
        <Circle cx={22} cy={22} r={RING_R} stroke="rgba(255,255,255,0.28)" strokeWidth={3} fill="none" />
        {k > 0 && <Circle cx={22} cy={22} r={RING_R} stroke={C.cheese} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={`${RING_LEN * k} ${RING_LEN}`} transform="rotate(-90 22 22)" />}
      </Svg>
    </Animated.View>
  );
});

/**
 * One line of the goal bar (words, then amount or icon) in one of its three inks. Every word and the amount is its own
 * Text, so the track copy can report where each one sits and the seam can snap to a word edge (G88). The words are one row
 * that shrinks and clips (the last word ellipsizes first); the amount sits outside it and never shrinks, so on a 320 pt
 * phone the payoff word is what gives way, never the amount (C105).
 */
function GoalLine({ label, amount, icon, tone, onSpans, onAmount }: { label: string; amount: string; icon?: React.ReactNode; tone: 'track' | 'fill' | 'ready'; onSpans?: (label: string, spans: GoalSpan[]) => void; onAmount?: (span: GoalSpan) => void }) {
  const color = tone === 'track' ? GOAL_BAR.onTrack : tone === 'fill' ? GOAL_BAR.onFill : '#fff';
  const report = (e: { nativeEvent: { layout: { x: number; width: number } } }) => onAmount?.({ x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width });
  return (
    <View style={styles.goalLine} pointerEvents="none">
      <GoalWords label={label} tone={tone} onSpans={onSpans} />
      <View style={styles.goalSpacer} />
      {icon ? (
        <View onLayout={onAmount ? report : undefined} style={[styles.goalAmtBox, { zIndex: 1 }]}>
          {icon}
        </View>
      ) : (
        <Text onLayout={onAmount ? report : undefined} style={[styles.goalAmt, { color }]} numberOfLines={1} maxFontSizeMultiplier={GOAL_FONT_MAX_SCALE}>
          {amount}
        </Text>
      )}
    </View>
  );
}

/**
 * The goal line's words: memoised on primitives (label, tone and a stable `onSpans`), so the cash ticks that rewrite the
 * amount never reconcile them (C104). Spans are reported in the line's coordinates (the row starts GOAL_PAD in).
 */
const GoalWords = memo(function GoalWords({ label, tone, onSpans }: { label: string; tone: 'track' | 'fill' | 'ready'; onSpans?: (label: string, spans: GoalSpan[]) => void }) {
  const color = tone === 'track' ? GOAL_BAR.onTrack : tone === 'fill' ? GOAL_BAR.onFill : '#fff';
  const words = goalWords(label);
  const seen = useRef<(GoalSpan | undefined)[]>([]);
  const report = (i: number, x: number, w: number) => {
    const prev = seen.current[i];
    if (prev && prev.x === x && prev.w === w) return;
    seen.current[i] = { x, w };
    const all = seen.current.slice(0, words.length);
    if (onSpans && all.length === words.length && all.every(Boolean)) onSpans(label, all as GoalSpan[]);
  };
  return (
    <View style={styles.goalWords}>
      {words.map((w, i) => (
        <Text
          key={`${i}:${w}`}
          onLayout={onSpans ? (e) => report(i, GOAL_PAD + e.nativeEvent.layout.x, e.nativeEvent.layout.width) : undefined}
          style={[styles.goalLabel, i === words.length - 1 && styles.goalLabelLast, { color }]}
          numberOfLines={1}
          maxFontSizeMultiplier={GOAL_FONT_MAX_SCALE}>
          {w}
        </Text>
      ))}
    </View>
  );
});

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

// ---------- The welcome-back gift (v5.14): a night oven to open ----------

const OVEN_INK = '#3B1F14';
/** The oven's drawing: a brick dome with a chimney, in a 160 × 150 box whose viewBox starts 22 pt above the chimney for the smoke. */
const OVEN_VB = { w: 160, h: 150, top: -22 } as const;
/** The oven's mouth and its door (pt, in the drawing's own coordinates). The door is hinged on its left edge. */
const DOOR = { x: 46, y: 62, w: 68, h: 50 } as const;
const ARCH = (w: number, h: number) => `M0 ${h} V${h * 0.4} Q0 0 ${w / 2} 0 Q${w} 0 ${w} ${h * 0.4} V${h} Z`;
const MOUTH_C = { x: DOOR.x + DOOR.w / 2, y: DOOR.y + DOOR.h * 0.55 } as const;
const RAYS = Array.from({ length: 9 }, (_, i) => (-170 + i * 20) * (Math.PI / 180));

/** A crescent moon (SVG, so it draws the same everywhere; the emoji did not). */
export function MoonIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M16.5 3.2A9 9 0 1 0 20.8 15.5 7.2 7.2 0 0 1 16.5 3.2Z" fill="#F6C343" stroke={OVEN_INK} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Nonna's brick dome oven. `glow` is the fill in 5% steps (0..20): the heat halo behind the dome, the mouth's fire and the smoke
 * all grow with it. `open` adds the rays and the stacked pizza boxes. Primitive props: it repaints only on a step or when opened.
 */
const OvenArt = memo(function OvenArt({ glow, open }: { glow: number; open: boolean }) {
  const k = open ? 1 : glow / 20;
  const puffs = open ? 3 : Math.round(k * 3);
  return (
    <Svg width={OVEN_VB.w} height={OVEN_VB.h} viewBox={`0 ${OVEN_VB.top} ${OVEN_VB.w} ${OVEN_VB.h}`} style={styles.ovenArt}>
      <Defs>
        <RadialGradient id="ovenHeat" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFB23E" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#FF7A1A" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* heat halo, behind everything: bigger and brighter as the oven fills */}
      <Circle cx={MOUTH_C.x} cy={MOUTH_C.y} r={46 + 34 * k} fill="url(#ovenHeat)" opacity={0.3 + 0.7 * k} />
      {open
        ? RAYS.map((a, i) => <Path key={i} d={`M${MOUTH_C.x + Math.cos(a) * 52} ${MOUTH_C.y + Math.sin(a) * 52} L${MOUTH_C.x + Math.cos(a) * 78} ${MOUTH_C.y + Math.sin(a) * 78}`} stroke="#F6C343" strokeWidth={4} strokeLinecap="round" />)
        : null}
      {/* smoke from the chimney: more puffs as it fills */}
      {puffs >= 1 ? <Circle cx={106} cy={-5} r={5} fill="#E9E1D8" opacity={0.85} /> : null}
      {puffs >= 2 ? <Circle cx={111} cy={-13} r={6.5} fill="#E9E1D8" opacity={0.7} /> : null}
      {puffs >= 3 ? <Circle cx={105} cy={-21} r={7.5} fill="#E9E1D8" opacity={0.55} /> : null}
      <Rect x={96} y={2} width={20} height={28} rx={3} fill="#9C4A33" stroke={OVEN_INK} strokeWidth={3} />
      <Path d="M14 122 V76 Q14 20 80 20 Q146 20 146 76 V122 Z" fill="#C8553D" stroke={OVEN_INK} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M30 50 Q40 40 52 36 M64 28 H96 M24 70 H38 M118 56 H134 M128 82 H140 M22 100 H34 M122 104 H138 M58 48 H72 M100 44 H112" stroke="#A8412C" strokeWidth={3} strokeLinecap="round" fill="none" />
      <Rect x={6} y={114} width={148} height={14} rx={5} fill="#8F5B3E" stroke={OVEN_INK} strokeWidth={3} />
      <G transform={`translate(${DOOR.x} ${DOOR.y})`}>
        {/* D454: the heat in front of the dome, as a ring round the door's arch: the half outside the arch shows over the bricks */}
        <Path d={ARCH(DOOR.w, DOOR.h)} fill="none" stroke="#FFB23E" strokeWidth={14} strokeLinejoin="round" opacity={0.2 + 0.55 * k} />
        <Path d={ARCH(DOOR.w, DOOR.h)} fill="none" stroke="#FFE08A" strokeWidth={7} strokeLinejoin="round" opacity={0.25 + 0.65 * k} />
        <Path d={ARCH(DOOR.w, DOOR.h)} fill="#3A1D12" stroke={OVEN_INK} strokeWidth={3} />
        <Path d={ARCH(DOOR.w, DOOR.h)} fill="#FF8A1F" opacity={0.15 + 0.85 * k} />
        <Path d={ARCH(DOOR.w, DOOR.h)} fill="#FFD36B" opacity={0.7 * k * k} />
        {open ? (
          <G>
            <Rect x={14} y={36} width={40} height={11} rx={2} fill="#E2B56B" stroke={OVEN_INK} strokeWidth={2} />
            <Rect x={17} y={25} width={34} height={11} rx={2} fill="#EBC27B" stroke={OVEN_INK} strokeWidth={2} />
            <Rect x={20} y={14} width={28} height={11} rx={2} fill="#F3CE8B" stroke={OVEN_INK} strokeWidth={2} />
            <Path d="M24 19.5 H44 M21 30.5 H47 M18 41.5 H50" stroke="#C63B2B" strokeWidth={2} strokeLinecap="round" />
          </G>
        ) : null}
      </G>
    </Svg>
  );
});

/** The door itself: a closed arch with a window that glows with the fill. */
const OvenDoor = memo(function OvenDoor({ glow }: { glow: number }) {
  const k = glow / 20;
  return (
    <Svg width={DOOR.w} height={DOOR.h} viewBox={`0 0 ${DOOR.w} ${DOOR.h}`}>
      <Path d={ARCH(DOOR.w, DOOR.h)} fill="#6B4331" stroke={OVEN_INK} strokeWidth={3} />
      <Circle cx={DOOR.w / 2} cy={26} r={13} fill="#3A1D12" stroke={OVEN_INK} strokeWidth={3} />
      <Circle cx={DOOR.w / 2} cy={26} r={10.5} fill="#FF8A1F" opacity={0.15 + 0.85 * k} />
      <Circle cx={DOOR.w / 2} cy={26} r={6.5} fill="#FFD36B" opacity={0.8 * k * k} />
      <Rect x={DOOR.w - 15} y={28} width={6} height={16} rx={3} fill="#F6C343" stroke={OVEN_INK} strokeWidth={2} />
    </Svg>
  );
});

/**
 * The return popup is a gift, not a receipt (D424, D425, D447): Nonna's night oven stands with its door shut, its heat glowing and
 * its chimney smoking in proportion to how full it got (a full one shakes). The news line is on show before the door opens.
 * "Open the oven" swings the door, shows rays and stacked pizza boxes, counts the total up over GIFT.countUpMs and sends
 * GIFT.coins coins to the cash counter; the shop rows then fade in, and a second tap (or GIFT.autoCloseMs later) closes it. The
 * button keeps testID `collect-offline` in both states. A full oven offers the bigger one (`onUpgrade` opens the night-oven sheet).
 * The maths lives in offline-model.ts.
 */
export function OfflinePopup({ summary, nightOven, onCollect, onUpgrade }: { summary: GiftSummary; nightOven: number; onCollect: () => void; onUpgrade?: () => void }) {
  const view = useMemo(() => offlineGiftView(summary, nightOven), [summary, nightOven]);
  const [pop] = useState(() => new Animated.Value(0.7));
  const [door] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(0));
  const [shake] = useState(() => new Animated.Value(0));
  const [opened, setOpened] = useState(false);
  const [shown, setShown] = useState(0);
  const ovenRef = useRef<ComponentRef<typeof View>>(null);
  const timers = useRef<{ tick: ReturnType<typeof setInterval> | null; close: ReturnType<typeof setTimeout> | null; closed: boolean }>({ tick: null, close: null, closed: false });
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: native }).start();
    const t = timers.current;
    return () => {
      if (t.tick) clearInterval(t.tick);
      if (t.close) clearTimeout(t.close);
    };
  }, [pop]);
  // a full oven rattles until it is opened
  const rattle = view.full && !opened;
  useEffect(() => {
    if (!rattle) {
      shake.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        ...[1, -1, 0.8, -0.8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 70, useNativeDriver: native })),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rattle, shake]);
  const close = () => {
    const t = timers.current;
    if (t.closed) return;
    t.closed = true;
    if (t.tick) clearInterval(t.tick);
    if (t.close) clearTimeout(t.close);
    onCollect();
  };
  const open = () => {
    setOpened(true);
    haptic('success');
    Animated.timing(door, { toValue: 1, duration: GIFT.doorMs, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
    // coins from the oven to the cash counter, and the cash text's kick
    ovenRef.current?.measureInWindow?.((x: number, y: number, w: number, h: number) => {
      // from the oven's mouth, fanned out a little, so the burst reads as coming out of the door
      const mx = x + MOUTH_C.x * (w / OVEN_VB.w);
      const my = y + (MOUTH_C.y - OVEN_VB.top) * (h / OVEN_VB.h);
      for (let i = 0; i < GIFT.coins; i++) emitCoin({ x: mx + (i - (GIFT.coins - 1) / 2) * 5, y: my - (i % 3) * 6, ms: 420 + i * 60 });
      emitPayout();
    });
    const t0 = Date.now();
    const t = timers.current;
    t.tick = setInterval(() => {
      const elapsed = Date.now() - t0;
      setShown(countUpValue(view.total, elapsed, GIFT.countUpMs));
      if (elapsed < GIFT.countUpMs) return;
      if (t.tick) clearInterval(t.tick);
      t.tick = null;
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: native }).start();
      t.close = setTimeout(close, GIFT.autoCloseMs);
    }, 33);
  };
  const upgrade = () => {
    close();
    onUpgrade?.();
  };
  const doorScale = door.interpolate({ inputRange: [0, 1], outputRange: [1, 0.12] });
  const doorShift = door.interpolate({ inputRange: [0, 1], outputRange: [0, -DOOR.w * 0.44] });
  const tilt = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });
  return (
    <View style={[styles.overlay, styles.giftOverlay]}>
      <Animated.View style={[styles.modal, { transform: [{ scale: pop }] }]}>
        <Text style={styles.modalHead}>{view.title}</Text>
        <Animated.View style={{ transform: [{ rotate: tilt }] }}>
          <View ref={ovenRef} style={styles.ovenBox} testID="offline-oven" accessibilityLabel={`Nonna's night oven, ${view.fillText}`}>
            <OvenArt glow={view.step} open={opened} />
            <Animated.View pointerEvents="none" style={[styles.ovenDoor, { transform: [{ translateX: doorShift }, { scaleX: doorScale }] }]}>
              <OvenDoor glow={view.step} />
            </Animated.View>
          </View>
        </Animated.View>
        <View style={styles.meter}>
          <View style={[styles.meterFill, { width: `${view.step * 5}%` }]} />
        </View>
        <Text style={styles.meterText} testID="offline-fill">
          {view.fillText}
        </Text>
        {view.fullLine ? <Text style={styles.giftLine}>{view.fullLine}</Text> : null}
        {view.upgradeLine ? (
          onUpgrade ? (
            <Pressable testID="gift-upgrade" onPress={upgrade} style={styles.upgradeBtn} accessibilityRole="button">
              <MoonIcon size={18} />
              <Text style={styles.upgradeText}>{view.upgradeLine}</Text>
            </Pressable>
          ) : (
            <Text style={styles.giftLine}>{view.upgradeLine}</Text>
          )
        ) : null}
        <Text style={[styles.giftLine, { fontFamily: F.regular, color: C.inkSoft }]} testID="offline-news">
          {view.news}
        </Text>
        {/* no reserved blank slot before the door opens (it left a 70 pt hole): the card is anchored near the top and grows downward */}
        {opened ? (
          <Text style={styles.modalCash} testID="offline-total">
            +{money(shown)}
          </Text>
        ) : null}
        {opened ? (
          <Animated.View style={{ alignSelf: 'stretch', gap: 2, opacity: fade }}>
            {view.rows.map((b) => (
              <View key={b.name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.small}>
                  {b.name}
                  {b.note}
                </Text>
                <Text style={[styles.small, { color: C.basilDark, fontFamily: F.semi }]}>+{money(b.earned)}</Text>
              </View>
            ))}
          </Animated.View>
        ) : null}
        <View style={{ alignSelf: 'stretch' }}>
          <BuyButton
            label={opened ? 'Collect' : 'Open the oven'}
            enabled
            onPress={() => {
              if (opened) close();
              else open();
              return true;
            }}
            testID="collect-offline"
            noBurst
          />
        </View>
      </Animated.View>
    </View>
  );
}

/** Nonna's night oven, explained: what the away meter is, the tiers, and the next one's price or lock reason (opened from the HUD chip or the gift). */
export function NightOvenSheet({ view, onBuy, onClose }: { view: NightOvenView; onBuy: () => boolean; onClose: () => void }) {
  const next = view.next;
  return (
    <View style={styles.overlay} testID="night-oven-sheet">
      <View style={styles.modal}>
        <View style={styles.sheetHead}>
          <Portrait id="nonna-rosa" mood="happy" size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>Nonna’s night oven</Text>
            <View style={styles.sheetSub}>
              <MoonIcon size={16} />
              <Text style={styles.small}>{`Holds ${view.hours}`}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.small, { textAlign: 'center' }]}>{view.body}</Text>
        <Text style={[styles.small, { textAlign: 'center', fontFamily: F.semi, color: C.ink }]} testID="night-oven-leave">
          {view.leaveLine}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 4, marginVertical: 6 }}>
          {view.tiers.map((t) => (
            <View key={t.tier} style={[styles.tierRow, t.state === 'owned' && styles.tierOwned]}>
              <View style={styles.sheetSub}>
                <MoonIcon size={16} />
                <Text style={styles.tierHours}>{t.hours}</Text>
              </View>
              {/* the price is basil only when you can buy it; otherwise ink, like any price you can't pay yet */}
              <Text style={[styles.small, { flexShrink: 1, textAlign: 'right', color: C.ink }, t.state === 'next' && !!next?.canBuy && { color: C.basilDark, fontFamily: F.semi }]}>{t.note}</Text>
            </View>
          ))}
        </View>
        {next ? (
          <View style={{ alignSelf: 'stretch' }}>
            <BuyButton testID="buy-night-oven-sheet" label={`${next.title} · ${money(next.price)}`} enabled={next.canBuy} tone={next.lock ? 'nogain' : 'normal'} onPress={onBuy} />
          </View>
        ) : null}
        <Pressable testID="close-night-oven" onPress={onClose} style={styles.sheetClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
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
  // with a need line the three lines share the 36 pt inside the button: 10 + 15 + 10
  buySubTight: { lineHeight: 10 },
  buyLabelTight: { lineHeight: 15 },
  buyNeed: { fontFamily: F.semi, fontSize: 9, lineHeight: 10, opacity: 0.85 },
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
  ring: { position: 'absolute', left: 0, top: 0 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalFlex: { flex: 1 },
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
  goalClipLine: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  // each word is its own Text so the seam can snap to a word edge (G88); the last one shrinks and truncates
  goalLine: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: GOAL_PAD },
  goalWords: { flexDirection: 'row', alignItems: 'center', ...GOAL_LAYOUT.words },
  goalSpacer: { flexGrow: 1, flexShrink: 0, minWidth: GOAL_GAP },
  goalLabel: { fontFamily: F.bold, fontSize: 14, marginRight: 4, flexShrink: 0 },
  goalLabelLast: { flexShrink: 1 },
  goalAmt: { fontFamily: F.bold, fontSize: 13, ...GOAL_LAYOUT.amount },
  goalAmtBox: { ...GOAL_LAYOUT.amount },

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
  ovenBox: { width: OVEN_VB.w, height: OVEN_VB.h },
  ovenArt: { position: 'absolute', left: 0, top: 0 },
  ovenDoor: { position: 'absolute', left: DOOR.x, top: DOOR.y - OVEN_VB.top, width: DOOR.w, height: DOOR.h },
  meter: { alignSelf: 'stretch', height: 16, borderRadius: 8, backgroundColor: '#F1E4D3', borderWidth: 2, borderColor: C.ink, overflow: 'hidden' },
  meterFill: { height: '100%', backgroundColor: '#FF9A2E' },
  meterText: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  giftLine: { fontFamily: F.semi, fontSize: 14, color: C.ink, textAlign: 'center' },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: C.cheeseDark },
  tierOwned: { backgroundColor: '#FFF4E0' },
  tierHours: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  giftOverlay: { justifyContent: 'flex-start', paddingTop: 64 },
  upgradeBtn: { alignSelf: 'stretch', minHeight: 44, borderRadius: 14, borderWidth: 2, borderColor: C.ink, backgroundColor: C.cheese, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  upgradeText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  sheetTitle: { fontFamily: F.bold, fontSize: 22, color: C.ink },
  sheetSub: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sheetClose: { alignSelf: 'stretch', height: 44, borderRadius: 12, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  modalCash: { fontFamily: F.bold, fontSize: 40, color: C.basilDark, marginBottom: 6 },

  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: C.ink, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  toastCompact: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 14 },
  toastText: { fontFamily: F.semi, color: '#fff', fontSize: 15 },
});
