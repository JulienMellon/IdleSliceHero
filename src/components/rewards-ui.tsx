// v5.4 rewards screens: the tasks drawer (daily / weekly tasks, Slice Points chests, boosters) and the gift calendar.
// All text and state come from rewards-model.ts; this file only lays them out. No ad buttons yet (D2).
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { DAILY_CHESTS, STREAK_SAVE_DIAMONDS } from '../content/rewards';
import type { GameState } from '../engine/game';
import * as R from '../engine/rewards';
import { C, F } from '../theme';
import { BuyButton } from './game-ui';
import { BoostIcon, CoinIcon, DiamondIcon, GiftIcon, LockIcon, StarIcon } from './icons';
import { BOOST_STRIP, boostFadeShown, boosterLabel, boosterStartLabel, boostOnText, boostRingPct, chestRows, collectionText, countdownText, dailyRows, giftHeader, giftTiles, pointsPct, weeklyChestView, weeklyRows, type GiftIconKind, type TaskState } from './rewards-model';
import { CLOSE_SLOP, DRAWER_HEAD, TAP } from './tap-targets';

const native = Platform.OS !== 'web';

/**
 * The game snapshot the tasks drawer and the calendar draw from (U1): taken while `open`, and then only when the second
 * (`sec`) or `game.rewards` changes (a claim), not on every 200 ms tick or when only `stats` ticks over. While closed it
 * stays frozen; opening takes a fresh one in the same render. No state is set during render.
 */
export function useSlowSnapshot(game: GameState, sec: number, open: boolean): { game: GameState; sec: number } {
  const secKey = open ? sec : -1;
  const rewardsKey = open ? game.rewards : null;
  // `game` is deliberately not a dependency: only the keys above decide when a new snapshot is taken
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({ game, sec }), [secKey, rewardsKey]);
}

export interface TaskActions {
  claimDaily: (i: number) => boolean;
  claimWeekly: (i: number) => boolean;
  claimChest: (i: number) => boolean;
  claimWeeklyChest: () => boolean;
  startBooster: (i: number) => boolean;
}

function Diamonds({ n }: { n: number }) {
  return (
    <View style={styles.diamonds} testID="diamonds">
      <DiamondIcon size={20} />
      <Text style={styles.diamondsText}>{Math.floor(n)}</Text>
    </View>
  );
}

const DIAMOND_INK = '#3B2A20';
const MILESTONE_GOLD = '#F5B700';

function KindIcon({ kind, size }: { kind: GiftIconKind; size: number }) {
  return kind === 'coin' ? <CoinIcon size={size} /> : kind === 'bolt' ? <BoostIcon size={size} /> : kind === 'gem' ? <DiamondIcon size={size} /> : <StarIcon size={size} />;
}

/** The running boost's chip: a ring around the bolt drains as the boost runs out. */
function BoostRing({ seconds }: { seconds: number }) {
  const r = 11;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={28} height={28} viewBox="0 0 28 28" style={StyleSheet.absoluteFill}>
        <Circle cx={14} cy={14} r={r} stroke="rgba(255,255,255,0.35)" strokeWidth={3} fill="none" />
        <Circle cx={14} cy={14} r={r} stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={`${c * boostRingPct(seconds)} ${c}`} transform="rotate(-90 14 14)" />
      </Svg>
      <BoostIcon size={14} />
    </View>
  );
}

// Memoised on primitives, with ONE stable handler bound by index, so a 1 Hz refresh re-renders only the rows that changed (U1, M56).
const TaskItem = memo(function TaskItem({ index, title, progress, pct, state, reward, claimId, onClaim }: { index: number; title: string; progress: string; pct: number; state: TaskState; reward: string; claimId: string; onClaim: (i: number) => boolean }) {
  const press = useCallback(() => onClaim(index), [onClaim, index]);
  return (
    <View style={[styles.task, state === 'ready' && styles.taskReady, state === 'claimed' && styles.taskClaimed]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }, state !== 'todo' && { backgroundColor: C.basil }]} />
          <Text style={styles.barText}>{progress}</Text>
        </View>
        <Text style={styles.taskReward} numberOfLines={1}>
          {reward}
        </Text>
      </View>
      <View style={styles.claimSlot}>
        {state === 'claimed' ? (
          <Text style={styles.tick} accessibilityLabel="Claimed">
            ✓
          </Text>
        ) : state === 'ready' ? (
          <BuyButton compact testID={claimId} label="Claim" enabled onPress={press} />
        ) : (
          // D385: an unfinished task shows a quiet lock, not a struck-through button
          <View style={styles.lockPill} testID={`locked-${claimId}`} accessibilityLabel="Locked until the task is done">
            <LockIcon size={18} color="#CFC3B2" />
          </View>
        )}
      </View>
    </View>
  );
});

const ChestButton = memo(function ChestButton({ index, points, state, onPress }: { index: number; points: number; state: 'locked' | 'ready' | 'opened'; onPress: (i: number) => boolean }) {
  const press = useCallback(() => onPress(index), [onPress, index]);
  return (
    <Pressable
      testID={`chest-${index}`}
      onPress={press}
      disabled={state === 'opened'}
      accessibilityLabel={`${points} point chest, ${state}`}
      style={[styles.chest, state === 'ready' && styles.chestReady, state === 'opened' && styles.chestOpened, { left: `${points}%`, marginLeft: -22 }]}>
      <View style={state === 'locked' ? { opacity: 0.45 } : null}>
        <GiftIcon size={28} />
      </View>
      {state === 'opened' && <Text style={styles.chestTick}>✓</Text>}
    </Pressable>
  );
});

/**
 * The tasks sheet over the shop (same frame as the upgrades drawer). Memoised: the screen feeds it a 1 Hz `now` and a game
 * snapshot that only moves when the second, the rewards or the stats do (U1), plus stable handlers.
 */
export const TasksDrawer = memo(function TasksDrawer({ game, now, clockOff, bottomInset, tab, onTab, onClose, actions }: { game: GameState; now: number; clockOff: boolean; bottomInset: number; tab: 'daily' | 'weekly'; onTab: (t: 'daily' | 'weekly') => void; onClose: () => void; actions: TaskActions }) {
  const r = game.rewards;
  const rows = tab === 'daily' ? dailyRows(game) : weeklyRows(game);
  const chests = chestRows(game);
  const week = weeklyChestView(game);
  const running = R.runningBoosts(game, now);
  const claimTask = useCallback((i: number) => (tab === 'daily' ? actions.claimDaily(i) : actions.claimWeekly(i)), [tab, actions]);
  const claimChest = actions.claimChest;
  // D390: the booster strip fades out on the right while it still scrolls
  const [strip, setStrip] = useState({ content: 0, view: 0, x: 0 });
  const fade = boostFadeShown(strip.content, strip.view, strip.x);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable testID="close-tasks-dim" style={styles.dim} onPress={onClose} />
      <View style={styles.drawer} testID="tasks-drawer">
        <View style={styles.head}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title}>Tasks</Text>
            <Diamonds n={r.diamonds} />
          </View>
          <Pressable testID="close-tasks" onPress={onClose} style={styles.closeBtn} hitSlop={CLOSE_SLOP}>
            <Text style={styles.closeText}>Close ▼</Text>
          </Pressable>
        </View>
        <View style={styles.boosters}>
          <Text style={styles.boostLabel}>Boosters</Text>
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.boostRow}
              scrollEventThrottle={32}
              onLayout={(e) => setStrip((p) => ({ ...p, view: e.nativeEvent.layout.width }))}
              onContentSizeChange={(w) => setStrip((p) => ({ ...p, content: w }))}
              onScroll={(e) => setStrip((p) => ({ ...p, x: e.nativeEvent.contentOffset.x }))}>
              {running.map((b, i) => (
                <View key={`run-${i}`} style={[styles.chip, styles.chipRunning]} testID={`boost-running-${i}`}>
                  <BoostRing seconds={Math.max(0, Math.ceil((b.until - now) / 1000))} />
                  <Text style={[styles.chipText, styles.chipTextRunning]}>{`${boostOnText(Math.max(0, Math.ceil((b.until - now) / 1000)))}`}</Text>
                </View>
              ))}
              {r.boosters.map((b, i) => (
                <Pressable key={`inv-${i}`} testID={`booster-${i}`} onPress={() => actions.startBooster(i)} style={styles.chip} accessibilityLabel={`${boosterStartLabel(b)} booster`}>
                  <BoostIcon size={18} />
                  <Text style={styles.chipText}>{boosterStartLabel(b)}</Text>
                </Pressable>
              ))}
              {!running.length && !r.boosters.length && <Text style={styles.empty}>None yet. Chests and gifts drop them.</Text>}
            </ScrollView>
            {fade && (
              <Svg testID="boost-fade" width={BOOST_STRIP.fade} height="100%" style={styles.boostFade} viewBox="0 0 24 10" preserveAspectRatio="none" pointerEvents="none">
                <Defs>
                  <LinearGradient id="boost-fade-grad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={C.bg} stopOpacity={0} />
                    <Stop offset="1" stopColor={C.bg} stopOpacity={1} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={24} height={10} fill="url(#boost-fade-grad)" />
              </Svg>
            )}
          </View>
        </View>
        {clockOff && (
          <View style={styles.banner} testID="clock-banner">
            <Text style={styles.bannerText}>{R.CLOCK_REASON}</Text>
          </View>
        )}
        <View style={styles.tabs}>
          {(['daily', 'weekly'] as const).map((t) => (
            <Pressable key={t} testID={`tab-${t}`} onPress={() => onTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'daily' ? 'Daily' : 'Weekly'}</Text>
            </Pressable>
          ))}
          <Text style={styles.reset} numberOfLines={1}>
            {countdownText(R.resetCountdown(now, tab === 'daily' ? 'day' : 'week'))}
          </Text>
        </View>
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 20 }]}>
          {rows.length === 0 && <Text style={styles.empty}>New tasks arrive in a moment.</Text>}
          {rows.map((row) => (
            <TaskItem key={`${tab}-${row.index}`} index={row.index} title={row.title} progress={row.progress} pct={row.pct} state={row.state} reward={row.reward} claimId={`claim-${tab}-${row.index}`} onClaim={claimTask} />
          ))}
          {tab === 'daily' ? (
            <View style={styles.points} testID="points-track">
              <View style={styles.pointsHead}>
                <Text style={styles.pointsTitle}>Slice Points</Text>
                <Text style={styles.pointsCount}>{`${Math.min(DAILY_CHESTS[DAILY_CHESTS.length - 1].points, Math.floor(r.points))} / ${DAILY_CHESTS[DAILY_CHESTS.length - 1].points}`}</Text>
              </View>
              <View style={styles.trackWrap}>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${Math.round(pointsPct(game) * 100)}%` }]} />
                </View>
                {chests.map((c) => (
                  <ChestButton key={c.index} index={c.index} points={c.points} state={c.state} onPress={claimChest} />
                ))}
              </View>
              {chests.map((c) => (
                <Text key={c.index} style={[styles.chestCaption, c.state === 'opened' && { opacity: 0.5 }]}>{`${c.points} pts · ${c.label}${c.state === 'opened' ? ' ✓' : ''}`}</Text>
              ))}
            </View>
          ) : (
            <Pressable testID="weekly-chest" onPress={() => actions.claimWeeklyChest()} disabled={week.state === 'opened'} style={[styles.weekChest, week.state === 'ready' && styles.chestReady, week.state === 'opened' && styles.chestOpened]}>
              <View style={week.state === 'locked' ? { opacity: 0.45 } : null}>
                <GiftIcon size={34} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointsTitle}>Weekly chest</Text>
                <Text style={styles.taskReward}>{week.label}</Text>
              </View>
              {week.state === 'opened' && <Text style={styles.tick}>✓</Text>}
            </Pressable>
          )}
          <Text style={styles.collection} testID="collection">
            {collectionText(game)}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
});

const Tile = memo(function Tile({ day, label, icon, big, state, w, pulse, onClaim }: { day: number; label: string; icon: GiftIconKind; big: boolean; state: 'claimed' | 'today' | 'future' | 'missed'; w: number; pulse: Animated.Value; onClaim: () => void }) {
  const today = state === 'today';
  const done = state === 'claimed';
  const body = (
    <>
      <Text style={[styles.tileDay, big && styles.tileDayBig, done && { opacity: 0.45 }]}>{day}</Text>
      <View style={done ? { opacity: 0.45 } : null}>
        <KindIcon kind={icon} size={big ? 22 : 18} />
      </View>
      <Text style={[styles.tileLabel, done && { opacity: 0.45 }]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
      {done && <Text style={styles.tileTick}>✓</Text>}
      {big && !done && <View style={styles.ribbon} pointerEvents="none" />}
    </>
  );
  const style = [styles.tile, { width: w, height: Math.max(44, w + 8) }, big && styles.tileBig, today && styles.tileToday, state === 'missed' && styles.tileMissed, done && styles.tileDone];
  if (!today) return <View style={style} testID={`gift-tile-${day}`}>{body}</View>;
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Pressable testID="gift-claim" onPress={onClaim} style={style} accessibilityLabel={`Claim day ${day}`}>
        {body}
      </Pressable>
    </Animated.View>
  );
});

/**
 * The 30-day gift calendar, a modal over the whole screen (like the offline popup). Memoised: the screen passes a
 * 1 Hz `now` and stable handlers. The pulse only runs while a gift is ready to claim (U5).
 */
export const GiftCalendar = memo(function GiftCalendar({ game, now, onClaim, onClose }: { game: GameState; now: number; onClaim: (repair: boolean) => boolean; onClose: () => void }) {
  const [pop] = useState(() => new Animated.Value(0.7));
  const [pulse] = useState(() => new Animated.Value(1));
  const [gridW, setGridW] = useState(0);
  const st = R.giftStatus(game, now);
  const ready = st.kind === 'ready';
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: native }).start();
  }, [pop]);
  useEffect(() => {
    if (!ready) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(1);
    };
  }, [ready, pulse]);
  const claim = useCallback(() => onClaim(false), [onClaim]);
  const repair = useCallback(() => onClaim(true), [onClaim]);
  const head = giftHeader(game, now);
  const tiles = giftTiles(game, now);
  const gap = 5;
  const w = gridW > 0 ? Math.floor((gridW - gap * 5) / 6) : 0;
  const diamonds = game.rewards.diamonds;
  const canRepair = diamonds >= STREAK_SAVE_DIAMONDS;
  return (
    <View style={styles.overlay} testID="gift-calendar">
      <Animated.View style={[styles.modal, { transform: [{ scale: pop }] }]}>
        <View style={styles.giftHead}>
          <GiftIcon size={34} />
          <Text style={styles.modalHead} testID="gift-title">
            {head.title}
          </Text>
        </View>
        <Text style={styles.caption} testID="gift-caption">
          {head.caption}
        </Text>
        {head.prize !== '' && (
          <View style={styles.prizeLine} testID="gift-prize">
            <KindIcon kind={head.prizeIcon} size={22} />
            <Text style={styles.prizeText}>{head.prize}</Text>
          </View>
        )}
        <View style={[styles.grid, { gap }]} onLayout={(e: LayoutChangeEvent) => setGridW(e.nativeEvent.layout.width)}>
          {w > 0 && tiles.map((t) => <Tile key={t.day} day={t.day} label={t.label} icon={t.icon} big={t.big} state={t.state} w={w} pulse={pulse} onClaim={claim} />)}
        </View>
        <View style={styles.actions}>
          {st.kind === 'ready' && <BuyButton testID="gift-claim-btn" label={`Claim day ${st.day}`} enabled onPress={claim} />}
          {st.kind === 'save' && (
            <>
              <Text style={styles.caption}>{`You have ${Math.floor(diamonds)} diamonds`}</Text>
              <BuyButton testID="gift-repair" label={`Repair streak · ${STREAK_SAVE_DIAMONDS} 💎`} enabled={canRepair} onPress={repair} />
            </>
          )}
          <Pressable testID="gift-close" onPress={onClose} style={styles.closeWide}>
            <Text style={styles.closeText}>{st.kind === 'claimed' ? 'Done' : 'Later'}</Text>
          </Pressable>
          {st.kind === 'save' && (
            <Pressable testID="gift-startover" onPress={claim} style={styles.startOver} accessibilityRole="button">
              <Text style={styles.startOverText}>Start over at day 1</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </View>
  );
});

const shadow = Platform.select({
  web: { boxShadow: '0 3px 0 rgba(59,31,20,0.18)' } as object,
  default: { shadowColor: '#3B1F14', shadowOpacity: 0.18, shadowRadius: 0, shadowOffset: { width: 0, height: 3 } },
});

const styles = StyleSheet.create({
  dim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.4)' },
  drawer: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '14%', backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 3, borderColor: C.ink },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: DRAWER_HEAD.padX, paddingTop: DRAWER_HEAD.padTop, paddingBottom: DRAWER_HEAD.padBottom },
  title: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  diamonds: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  diamondsText: { fontFamily: F.bold, fontSize: 15, color: DIAMOND_INK },
  closeBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 12, paddingHorizontal: 12, height: TAP.controls.closeButton.height, justifyContent: 'center' },
  closeWide: { backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 14, height: 44, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' },
  closeText: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  boosters: { paddingLeft: DRAWER_HEAD.padX, gap: 4, paddingBottom: 6 },
  boostLabel: { fontFamily: F.bold, fontSize: 13, color: C.inkSoft },
  boostRow: { gap: 8, alignItems: 'center', paddingRight: BOOST_STRIP.rightInset },
  boostFade: { position: 'absolute', right: 0, top: 0, bottom: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#FFE7C2', borderWidth: 2, borderColor: C.cheeseDark },
  chipRunning: { backgroundColor: '#3E9B4F', borderColor: C.basilDark },
  chipTextRunning: { color: '#fff' },
  chipText: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  empty: { fontFamily: F.regular, fontSize: 13, color: C.inkSoft, paddingVertical: 4 },
  banner: { marginHorizontal: 10, marginBottom: 6, backgroundColor: '#FFE7C2', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1.5, borderColor: C.cheeseDark },
  bannerText: { fontFamily: F.semi, fontSize: 12.5, color: C.ink, textAlign: 'center' },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingBottom: 8 },
  tab: { height: 44, minWidth: 88, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: C.ink },
  tabText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  tabTextOn: { color: '#fff' },
  reset: { flex: 1, textAlign: 'right', fontFamily: F.semi, fontSize: 12.5, color: C.tomatoDark },
  list: { padding: 10, gap: 8 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.panel, borderRadius: 16, padding: 9, borderWidth: 3, borderColor: C.ink, ...shadow },
  taskReady: { borderColor: C.basilDark, backgroundColor: '#F1FFF0' },
  taskClaimed: { opacity: 0.6 },
  taskTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  taskReward: { fontFamily: F.regular, fontSize: 12, color: C.inkSoft },
  barTrack: { height: 16, borderRadius: 8, backgroundColor: '#F1E4D3', overflow: 'hidden', justifyContent: 'center' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.cheese },
  barText: { fontFamily: F.semi, fontSize: 11, color: C.ink, textAlign: 'center' },
  lockPill: { width: 60, height: 36, borderRadius: 12, backgroundColor: '#E2D9CE', alignItems: 'center', justifyContent: 'center' },
  claimSlot: { width: 84, alignItems: 'center', justifyContent: 'center' },
  tick: { fontFamily: F.bold, fontSize: 26, color: C.basilDark },
  points: { backgroundColor: C.panel, borderRadius: 16, padding: 12, borderWidth: 3, borderColor: C.ink, gap: 4, ...shadow },
  pointsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  pointsTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  pointsCount: { fontFamily: F.semi, fontSize: 13, color: C.inkSoft },
  trackWrap: { height: 52, marginHorizontal: 22, justifyContent: 'center' },
  track: { height: 14, borderRadius: 7, backgroundColor: '#F1E4D3', overflow: 'hidden' },
  trackFill: { height: 14, backgroundColor: C.cheese },
  chest: { position: 'absolute', top: 4, width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2.5, borderColor: C.lockedDark, alignItems: 'center', justifyContent: 'center' },
  chestReady: { borderColor: C.basilDark, backgroundColor: '#F1FFF0' },
  chestOpened: { backgroundColor: '#EFE6D8', borderColor: '#CFC3B2' },
  chestTick: { position: 'absolute', right: -2, bottom: -4, fontFamily: F.bold, fontSize: 16, color: C.basilDark },
  chestCaption: { fontFamily: F.semi, fontSize: 12, color: C.inkSoft },
  weekChest: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, backgroundColor: C.panel, borderRadius: 16, padding: 10, borderWidth: 3, borderColor: C.ink, ...shadow },
  collection: { fontFamily: F.semi, fontSize: 12.5, color: C.inkSoft, textAlign: 'center', marginTop: 4 },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,14,8,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: C.bg, borderRadius: 24, borderWidth: 4, borderColor: C.ink, padding: 18, alignItems: 'center', width: '100%', maxWidth: 360, gap: 8 },
  giftHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalHead: { fontFamily: F.bold, fontSize: 22, color: C.ink, flexShrink: 1, textAlign: 'center' },
  caption: { fontFamily: F.semi, fontSize: 13.5, color: C.inkSoft, textAlign: 'center' },
  grid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', minHeight: 4 },
  tile: { borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: '#D9C4AB', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 1, gap: 1 },
  tileBig: { backgroundColor: '#FFE7C2', borderColor: MILESTONE_GOLD, borderWidth: 2 },
  tileToday: { backgroundColor: '#F1FFF0', borderColor: C.basilDark, borderWidth: 3 },
  tileMissed: { borderColor: C.tomato, borderStyle: 'dashed' },
  tileDone: { backgroundColor: '#EFE6D8' },
  tileDay: { position: 'absolute', left: 4, top: 1, fontFamily: F.bold, fontSize: 10.5, color: C.inkSoft },
  tileDayBig: { color: C.ink },
  tileLabel: { fontFamily: F.semi, fontSize: 10, color: C.ink, alignSelf: 'stretch', textAlign: 'center' },
  tileTick: { position: 'absolute', right: 2, top: -2, fontFamily: F.bold, fontSize: 13, color: C.basilDark },
  ribbon: { position: 'absolute', right: -2, top: -2, width: 16, height: 16, backgroundColor: MILESTONE_GOLD, borderTopRightRadius: 9, borderBottomLeftRadius: 12 },
  prizeLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  prizeText: { fontFamily: F.bold, fontSize: 16, color: C.ink, flexShrink: 1, textAlign: 'center' },
  startOver: { height: 44, alignItems: 'center', justifyContent: 'center' },
  startOverText: { fontFamily: F.semi, fontSize: 13.5, color: '#8A7B6C' },
  actions: { alignSelf: 'stretch', gap: 8, alignItems: 'stretch' },
});
