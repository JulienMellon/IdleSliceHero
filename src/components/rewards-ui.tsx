// v5.4 rewards screens: the tasks drawer (daily / weekly tasks, Slice Points chests, boosters) and the gift calendar.
// All text and state come from rewards-model.ts; this file only lays them out. No ad buttons yet (D2).
import { useEffect, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DAILY_CHESTS, STREAK_SAVE_DIAMONDS } from '../content/rewards';
import type { GameState } from '../engine/game';
import * as R from '../engine/rewards';
import { C, F } from '../theme';
import { BuyButton } from './game-ui';
import { BoostIcon, DiamondIcon, GiftIcon } from './icons';
import { boosterLabel, boostChip, chestRows, collectionText, countdownText, dailyRows, giftHeader, giftTiles, pointsPct, weeklyChestView, weeklyRows, type GiftTile, type TaskRow } from './rewards-model';
import { CLOSE_SLOP, DRAWER_HEAD, TAP } from './tap-targets';

const native = Platform.OS !== 'web';

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

function TaskItem({ row, onClaim, claimId }: { row: TaskRow; onClaim: () => boolean; claimId: string }) {
  return (
    <View style={[styles.task, row.state === 'ready' && styles.taskReady, row.state === 'claimed' && styles.taskClaimed]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {row.title}
        </Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.round(row.pct * 100)}%` }, row.state !== 'todo' && { backgroundColor: C.basil }]} />
          <Text style={styles.barText}>{row.progress}</Text>
        </View>
        <Text style={styles.taskReward} numberOfLines={1}>
          {row.reward}
        </Text>
      </View>
      <View style={styles.claimSlot}>
        {row.state === 'claimed' ? (
          <Text style={styles.tick} accessibilityLabel="Claimed">
            ✓
          </Text>
        ) : (
          <BuyButton compact testID={claimId} label="Claim" enabled={row.state === 'ready'} tone={row.state === 'ready' ? 'normal' : 'nogain'} onPress={onClaim} />
        )}
      </View>
    </View>
  );
}

function ChestButton({ index, points, state, onPress }: { index: number; points: number; state: 'locked' | 'ready' | 'opened'; onPress: () => boolean }) {
  return (
    <Pressable
      testID={`chest-${index}`}
      onPress={onPress}
      disabled={state === 'opened'}
      accessibilityLabel={`${points} point chest, ${state}`}
      style={[styles.chest, state === 'ready' && styles.chestReady, state === 'opened' && styles.chestOpened, { left: `${points}%`, marginLeft: -22 }]}>
      <View style={state === 'locked' ? { opacity: 0.45 } : null}>
        <GiftIcon size={28} />
      </View>
      {state === 'opened' && <Text style={styles.chestTick}>✓</Text>}
    </Pressable>
  );
}

/** The tasks sheet over the shop (same frame as the upgrades drawer). */
export function TasksDrawer({ game, now, clockOff, bottomInset, tab, onTab, onClose, actions }: { game: GameState; now: number; clockOff: boolean; bottomInset: number; tab: 'daily' | 'weekly'; onTab: (t: 'daily' | 'weekly') => void; onClose: () => void; actions: TaskActions }) {
  const r = game.rewards;
  const rows = tab === 'daily' ? dailyRows(game) : weeklyRows(game);
  const chests = chestRows(game);
  const week = weeklyChestView(game);
  const running = R.runningBoosts(game, now);
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boostRow}>
            {running.map((b, i) => (
              <View key={`run-${i}`} style={[styles.chip, styles.chipRunning]} testID={`boost-running-${i}`}>
                <BoostIcon size={18} />
                <Text style={styles.chipText}>{boostChip(b.mult, Math.max(0, Math.ceil((b.until - now) / 1000)))}</Text>
              </View>
            ))}
            {r.boosters.map((b, i) => (
              <Pressable key={`inv-${i}`} testID={`booster-${i}`} onPress={() => actions.startBooster(i)} style={styles.chip} accessibilityLabel={`Start ${boosterLabel(b)} booster`}>
                <BoostIcon size={18} />
                <Text style={styles.chipText}>{boosterLabel(b)}</Text>
              </Pressable>
            ))}
            {!running.length && !r.boosters.length && <Text style={styles.empty}>None yet. Chests and gifts drop them.</Text>}
          </ScrollView>
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
            <TaskItem key={`${tab}-${row.index}`} row={row} claimId={`claim-${tab}-${row.index}`} onClaim={() => (tab === 'daily' ? actions.claimDaily(row.index) : actions.claimWeekly(row.index))} />
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
                  <ChestButton key={c.index} index={c.index} points={c.points} state={c.state} onPress={() => actions.claimChest(c.index)} />
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
}

function Tile({ tile, w, pulse, onClaim }: { tile: GiftTile; w: number; pulse: Animated.Value; onClaim: () => void }) {
  const today = tile.state === 'today';
  const body = (
    <>
      <Text style={[styles.tileDay, tile.state === 'claimed' && { opacity: 0.45 }]}>{tile.day}</Text>
      <Text style={[styles.tileLabel, tile.state === 'claimed' && { opacity: 0.45 }]} numberOfLines={1} adjustsFontSizeToFit>
        {tile.label}
      </Text>
      {tile.state === 'claimed' && <Text style={styles.tileTick}>✓</Text>}
    </>
  );
  const style = [styles.tile, { width: w, height: Math.max(44, w) }, tile.big && styles.tileBig, tile.state === 'today' && styles.tileToday, tile.state === 'missed' && styles.tileMissed, tile.state === 'claimed' && styles.tileDone];
  if (!today) return <View style={style} testID={`gift-tile-${tile.day}`}>{body}</View>;
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Pressable testID="gift-claim" onPress={onClaim} style={style} accessibilityLabel={`Claim day ${tile.day}`}>
        {body}
      </Pressable>
    </Animated.View>
  );
}

/** The 30-day gift calendar, a modal over the whole screen (like the offline popup). */
export function GiftCalendar({ game, now, onClaim, onClose }: { game: GameState; now: number; onClaim: (repair: boolean) => boolean; onClose: () => void }) {
  const [pop] = useState(() => new Animated.Value(0.7));
  const [pulse] = useState(() => new Animated.Value(1));
  const [gridW, setGridW] = useState(0);
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: native }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pop, pulse]);
  const st = R.giftStatus(game, now);
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
        <View style={[styles.grid, { gap }]} onLayout={(e: LayoutChangeEvent) => setGridW(e.nativeEvent.layout.width)}>
          {w > 0 && tiles.map((t) => <Tile key={t.day} tile={t} w={w} pulse={pulse} onClaim={() => onClaim(false)} />)}
        </View>
        <View style={styles.actions}>
          {st.kind === 'ready' && <BuyButton testID="gift-claim-btn" label={`Claim day ${st.day}`} enabled onPress={() => onClaim(false)} />}
          {st.kind === 'save' && (
            <>
              <Text style={styles.caption}>{`You have ${Math.floor(diamonds)} diamonds`}</Text>
              <BuyButton testID="gift-repair" label={`Repair streak · ${STREAK_SAVE_DIAMONDS} 💎`} enabled={canRepair} onPress={() => onClaim(true)} />
              <BuyButton testID="gift-startover" label="Start over" tone="neutral" enabled onPress={() => onClaim(false)} />
            </>
          )}
          <Pressable testID="gift-close" onPress={onClose} style={styles.closeWide}>
            <Text style={styles.closeText}>{st.kind === 'claimed' ? 'Done' : 'Later'}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

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
  diamondsText: { fontFamily: F.bold, fontSize: 15, color: C.tomatoDark },
  closeBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 12, paddingHorizontal: 12, height: TAP.controls.closeButton.height, justifyContent: 'center' },
  closeWide: { backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 14, height: 44, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' },
  closeText: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  boosters: { paddingLeft: DRAWER_HEAD.padX, gap: 4, paddingBottom: 6 },
  boostLabel: { fontFamily: F.bold, fontSize: 13, color: C.inkSoft },
  boostRow: { gap: 8, alignItems: 'center', paddingRight: DRAWER_HEAD.padX },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#FFE7C2', borderWidth: 2, borderColor: C.cheeseDark },
  chipRunning: { backgroundColor: '#DDEFD9', borderColor: C.basilDark },
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
  tile: { borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: '#D9C4AB', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 1 },
  tileBig: { backgroundColor: '#FFE7C2', borderColor: C.cheeseDark },
  tileToday: { backgroundColor: '#F1FFF0', borderColor: C.basilDark, borderWidth: 3 },
  tileMissed: { borderColor: C.tomato, borderStyle: 'dashed' },
  tileDone: { backgroundColor: '#EFE6D8' },
  tileDay: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  tileLabel: { fontFamily: F.semi, fontSize: 9.5, color: C.inkSoft, alignSelf: 'stretch', textAlign: 'center' },
  tileTick: { position: 'absolute', right: 1, top: -2, fontFamily: F.bold, fontSize: 13, color: C.basilDark },
  actions: { alignSelf: 'stretch', gap: 8, alignItems: 'stretch' },
});
