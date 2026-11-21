// v5.4 rewards screens: the tasks drawer (daily / weekly tasks, Slice Points chests, boosters) and the gift calendar.
// All text and state come from rewards-model.ts; this file only lays them out. v5.17 (U3): a task row's Swap and the missed day's Save streak are ad buttons (store/ad-button.tsx).
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { DAILY_CHESTS, STREAK_SAVE_DIAMONDS } from '../content/rewards';
import { canAffordDiamonds, type GameState } from '../engine/game';
import * as R from '../engine/rewards';
import { useGame } from '../store/game-store';
import { C, F } from '../theme';
import { useCoachTarget } from './coach/targets';
import { BuyButton } from './game-ui';
import { BoostIcon, CoinIcon, DiamondIcon, GiftIcon, LockIcon, StarIcon } from './icons';
import { Portrait } from './portrait/index';
import { useMotion } from './scene/clock';
import { AdButton } from './store/ad-button';
import { canReroll } from './store/ad-model';
import {
  BOOST_STRIP,
  boostFadeShown,
  boosterLabel,
  boosterStartLabel,
  boostOnText,
  boostRingPct,
  chestRows,
  collectionText,
  countdownText,
  dailyRows,
  defaultTasksTab,
  giftHeader,
  giftTiles,
  hasStory,
  pointsPct,
  rewardsTabLocked,
  storyView,
  tabLockedText,
  TASKS_CLOSE_TARGET,
  TASKS_STORY_TARGET,
  TASKS_TABS,
  TEASER,
  weeklyChestView,
  weeklyRows,
  type GiftIconKind,
  type StoryTask,
  type TaskState,
  type TasksTab,
} from './rewards-model';
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

/** A task row's Swap button gave its benefit: another daily task takes the row (once a day). */
const swapDaily = (i: number): void => void useGame.getState().rerollDaily(i);

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

/** D499: the day-30 prize, a gold oven: arched mouth, a glowing fire and a chimney. */
function GoldOvenIcon({ size }: { size: number }) {
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={size} height={size} viewBox="0 0 32 32">
      <Rect x={22} y={2} width={5} height={9} rx={1.5} fill="#B8860B" stroke="#3B1F14" strokeWidth={1.5} />
      <Path d="M3 28 V16 A13 13 0 0 1 29 16 V28 Z" fill="#F5B700" stroke="#3B1F14" strokeWidth={2} strokeLinejoin="round" />
      <Path d="M10 28 V21 A6 6 0 0 1 22 21 V28 Z" fill="#3B1F14" />
      <Path d="M16 27 C12.5 27 12.5 22.5 16 19 C19.5 22.5 19.5 27 16 27 Z" fill="#FF7A1A" />
    </Svg>
  );
}

function KindIcon({ kind, size }: { kind: GiftIconKind; size: number }) {
  if (kind === 'oven') return <GoldOvenIcon size={size} />;
  return kind === 'coin' ? (
    <CoinIcon size={size} />
  ) : kind === 'bolt' ? (
    <BoostIcon size={size} />
  ) : kind === 'gem' ? (
    <DiamondIcon size={size} />
  ) : (
    <StarIcon size={size} />
  );
}

/** The running boost's chip: a ring around the bolt drains as the boost runs out. */
function BoostRing({ seconds }: { seconds: number }) {
  const r = 11;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        width={28}
        height={28}
        viewBox="0 0 28 28"
        style={StyleSheet.absoluteFill}
      >
        <Circle cx={14} cy={14} r={r} stroke="rgba(255,255,255,0.35)" strokeWidth={3} fill="none" />
        <Circle
          cx={14}
          cy={14}
          r={r}
          stroke="#fff"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * boostRingPct(seconds)} ${c}`}
          transform="rotate(-90 14 14)"
        />
      </Svg>
      <BoostIcon size={14} />
    </View>
  );
}

// Memoised on primitives, with ONE stable handler bound by index, so a 1 Hz refresh re-renders only the rows that changed (U1, M56).
const TaskItem = memo(function TaskItem({
  index,
  title,
  starred,
  progress,
  pill,
  pillLabel,
  pct,
  state,
  reward,
  claimId,
  canSwap,
  onClaim,
  onSwap,
}: {
  index: number;
  title: string;
  starred: boolean;
  progress: string;
  /** U4: the in-progress pill (rewards-model.ts `progressPill`). */ pill: string;
  pillLabel: string;
  pct: number;
  state: TaskState;
  reward: string;
  claimId: string;
  /** The day's swap is still free and this row can use it (store/ad-model.ts `canReroll`). */ canSwap: boolean;
  onClaim: (i: number) => boolean;
  onSwap: (i: number) => void;
}) {
  const press = useCallback(() => onClaim(index), [onClaim, index]);
  const swap = useCallback(() => onSwap(index), [onSwap, index]);
  return (
    <View style={[styles.task, state === 'ready' && styles.taskReady, state === 'claimed' && styles.taskClaimed]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {starred ? (
            <Text testID="task-star" accessibilityLabel="Head of the Week task" style={styles.taskStar}>
              {'\u2605 '}
            </Text>
          ) : null}
          {title}
        </Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }, state !== 'todo' && { backgroundColor: C.basil }]} />
          {state !== 'todo' && <Text style={styles.barText}>{progress}</Text>}
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
          // U4: an unfinished task shows how far it is ("3 / 5"), not a padlock: the list reads as things to do, and Claim appears when one is done
          <>
            <View style={styles.lockPill} testID={`progress-${claimId}`} accessible accessibilityLabel={pillLabel}>
              <Text style={styles.pillText} numberOfLines={1} maxFontSizeMultiplier={1.1}>
                {pill}
              </Text>
            </View>
            {canSwap && (
              <AdButton compact placement="reroll_task" label="Swap" plusLabel="Swap" testID={`swap-${claimId.replace('claim-', '')}`} onBenefit={swap} />
            )}
          </>
        )}
      </View>
    </View>
  );
});

const TAB_LABEL: Record<TasksTab, string> = { story: 'Story', daily: 'Daily', weekly: 'Weekly' };

/** One task of the chapter: a tick (tasks complete themselves, there is no Claim) and, for a count, its bar with "212/424". Primitives only. */
const StoryRow = memo(function StoryRow({ label, done, bar, pct, progress, spoken }: Omit<StoryTask, 'key'>) {
  return (
    <View style={styles.storyTask} testID={done ? 'story-task-done' : 'story-task'} accessible accessibilityLabel={spoken}>
      <View style={[styles.tickBox, done && styles.tickBoxOn]}>{done && <Text style={styles.tickMark}>✓</Text>}</View>
      <View style={styles.storyTaskBody}>
        <Text style={[styles.storyTaskLabel, done && styles.storyTaskDone]} numberOfLines={2}>
          {label}
        </Text>
        {bar && (
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }, done && { backgroundColor: C.basil }]} />
            <Text style={styles.barText}>{progress}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const ChestButton = memo(function ChestButton({
  index,
  points,
  state,
  onPress,
}: {
  index: number;
  points: number;
  state: 'locked' | 'ready' | 'opened';
  onPress: (i: number) => boolean;
}) {
  const press = useCallback(() => onPress(index), [onPress, index]);
  return (
    <Pressable
      testID={`chest-${index}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: state === 'opened' }}
      onPress={press}
      disabled={state === 'opened'}
      accessibilityLabel={`${points} point chest, ${state}`}
      style={[styles.chest, state === 'ready' && styles.chestReady, state === 'opened' && styles.chestOpened, { left: `${points}%`, marginLeft: -22 }]}
    >
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
export const TasksDrawer = memo(function TasksDrawer({
  game,
  now,
  clockOff,
  bottomInset,
  initialTab,
  tab: tabProp,
  onTab,
  onClose,
  actions,
}: {
  game: GameState;
  now: number;
  clockOff: boolean;
  bottomInset: number;
  /** The tab it opens on (Story where the city has chapters, else Daily); U2: the goal bar and the clipboard open Story. */
  initialTab?: TasksTab;
  /** Set to drive the tab from outside; left out, the drawer keeps its own. */
  tab?: TasksTab;
  onTab?: (t: TasksTab) => void;
  onClose: () => void;
  actions: TaskActions;
}) {
  const r = game.rewards;
  const [ownTab, setOwnTab] = useState<TasksTab>(() => initialTab ?? defaultTasksTab(game));
  const storyOn = hasStory(game);
  const picked = tabProp ?? ownTab;
  const tab = picked === 'story' && !storyOn ? 'daily' : picked;
  const selectTab = useCallback(
    (t: TasksTab) => {
      setOwnTab(t);
      onTab?.(t);
    },
    [onTab],
  );
  const locked = rewardsTabLocked(game);
  const sceneEnd = useGame((s) => s.lastSceneEndPlay);
  const story = tab === 'story' ? storyView(game, sceneEnd) : null;
  const storyTarget = useCoachTarget(TASKS_STORY_TARGET);
  const closeTarget = useCoachTarget(TASKS_CLOSE_TARGET);
  const listTab = tab === 'story' || locked ? null : tab;
  const rows = listTab === 'daily' ? dailyRows(game) : listTab === 'weekly' ? weeklyRows(game) : [];
  const chests = chestRows(game);
  const week = weeklyChestView(game);
  const running = R.runningBoosts(game, now);
  const claimTask = useCallback((i: number) => (tab === 'weekly' ? actions.claimWeekly(i) : actions.claimDaily(i)), [tab, actions]);
  const claimChest = actions.claimChest;
  // D390: the booster strip fades out on the right while it still scrolls. U7: the strip's sizes and scroll offset live in a ref (a
  // scroll event fires ~31×/s); only the fade boolean is state, and it is set only when it flips, so scrolling never re-renders the drawer.
  const strip = useRef({ content: 0, view: 0, x: 0 });
  const fadeNow = useRef(false);
  const [fade, setFade] = useState(false);
  const syncFade = useCallback(() => {
    const next = boostFadeShown(strip.current.content, strip.current.view, strip.current.x);
    if (next === fadeNow.current) return;
    fadeNow.current = next;
    setFade(next);
  }, []);
  const onStripLayout = useCallback(
    (e: LayoutChangeEvent) => {
      strip.current.view = e.nativeEvent.layout.width;
      syncFade();
    },
    [syncFade],
  );
  const onStripContent = useCallback(
    (w: number) => {
      strip.current.content = w;
      syncFade();
    },
    [syncFade],
  );
  const onStripScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      strip.current.x = e.nativeEvent.contentOffset.x;
      syncFade();
    },
    [syncFade],
  );
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable testID="close-tasks-dim" accessibilityRole="button" accessibilityLabel="Close the tasks" style={styles.dim} onPress={onClose} />
      <View style={styles.drawer} testID="tasks-drawer">
        <View style={styles.head}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title}>Tasks</Text>
            <Diamonds n={r.diamonds} />
          </View>
          <Pressable
            testID="close-tasks"
            accessibilityRole="button"
            accessibilityLabel="Close the tasks"
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={CLOSE_SLOP}
            ref={closeTarget}
            onLayout={closeTarget.onLayout}
          >
            <Text style={styles.closeText}>Close ▼</Text>
          </Pressable>
        </View>
        {!locked && (
          <View style={styles.boosters}>
            <Text style={styles.boostLabel}>Boosters</Text>
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.boostRow}
                scrollEventThrottle={32}
                onLayout={onStripLayout}
                onContentSizeChange={onStripContent}
                onScroll={onStripScroll}
              >
                {running.map((b, i) => (
                  <View key={`run-${i}`} style={[styles.chip, styles.chipRunning]} testID={`boost-running-${i}`}>
                    <BoostRing seconds={Math.max(0, Math.ceil((b.until - now) / 1000))} />
                    <Text style={[styles.chipText, styles.chipTextRunning]}>{`${boostOnText(Math.max(0, Math.ceil((b.until - now) / 1000)))}`}</Text>
                  </View>
                ))}
                {r.boosters.map((b, i) => (
                  <Pressable
                    key={`inv-${i}`}
                    testID={`booster-${i}`}
                    accessibilityRole="button"
                    onPress={() => actions.startBooster(i)}
                    style={styles.chip}
                    accessibilityLabel={`${boosterStartLabel(b)} booster`}
                  >
                    <BoostIcon size={18} />
                    <Text style={styles.chipText}>{boosterStartLabel(b)}</Text>
                  </Pressable>
                ))}
                {!running.length && !r.boosters.length && <Text style={styles.empty}>None yet. Chests and gifts drop them.</Text>}
              </ScrollView>
              {fade && (
                <Svg
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  testID="boost-fade"
                  width={BOOST_STRIP.fade}
                  height="100%"
                  style={styles.boostFade}
                  viewBox="0 0 24 10"
                  preserveAspectRatio="none"
                  pointerEvents="none"
                >
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
        )}
        {clockOff && !locked && (
          <View style={styles.banner} testID="clock-banner">
            <Text style={styles.bannerText}>{R.CLOCK_REASON}</Text>
          </View>
        )}
        <View style={styles.tabs}>
          {TASKS_TABS.filter((t) => t !== 'story' || storyOn).map((t) => (
            <Pressable
              key={t}
              testID={`tab-${t}`}
              accessibilityRole="tab"
              accessibilityLabel={t !== 'story' && locked ? `${TAB_LABEL[t]}, locked` : TAB_LABEL[t]}
              accessibilityState={{ selected: tab === t }}
              onPress={() => selectTab(t)}
              style={[styles.tab, tab === t && styles.tabOn]}
            >
              {t !== 'story' && locked && <LockIcon size={14} color={tab === t ? '#fff' : C.inkSoft} />}
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{TAB_LABEL[t]}</Text>
            </Pressable>
          ))}
          {listTab && (
            <Text style={styles.reset} numberOfLines={1}>
              {countdownText(R.resetCountdown(now, listTab === 'daily' ? 'day' : 'week'))}
            </Text>
          )}
        </View>
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 20 }]}>
          {story && (
            <View ref={storyTarget} onLayout={storyTarget.onLayout} collapsable={false} style={styles.story} testID="story-tab">
              {story.kind === 'finished' ? (
                <Text style={styles.empty} testID="story-finished">
                  {story.finished}
                </Text>
              ) : (
                <>
                  <View style={styles.chapter}>
                    <Text style={styles.chapterNo} testID="story-number">{`Chapter ${story.number}`}</Text>
                    <Text style={styles.chapterTitle} testID="story-title">
                      {story.title}
                    </Text>
                    <View style={styles.teaserRow}>
                      {story.who && <Portrait id={story.who} size={TEASER.portrait} city={game.city} />}
                      <Text style={styles.teaser} numberOfLines={TEASER.lines} testID="story-teaser">
                        {story.teaser}
                      </Text>
                    </View>
                  </View>
                  {story.tasks.map((task) => (
                    <StoryRow key={task.key} label={task.label} done={task.done} bar={task.bar} pct={task.pct} progress={task.progress} spoken={task.spoken} />
                  ))}
                  <View style={styles.rewardRow} testID="story-reward">
                    <Text style={styles.rewardText}>{story.reward}</Text>
                  </View>
                  {story.wait !== null && (
                    <View style={styles.waitRow} testID="story-wait">
                      <Text style={styles.waitText}>{story.wait}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
          {!story && locked && (
            <View style={styles.lockedTab} testID="tab-locked">
              <LockIcon size={30} color={C.inkSoft} />
              <Text style={styles.lockedText}>{tabLockedText(game)}</Text>
            </View>
          )}
          {listTab && rows.length === 0 && <Text style={styles.empty}>New tasks arrive in a moment.</Text>}
          {rows.map((row) => (
            <TaskItem
              key={`${tab}-${row.index}`}
              index={row.index}
              title={row.title}
              starred={row.starred}
              progress={row.progress}
              pill={row.pill}
              pillLabel={row.pillLabel}
              pct={row.pct}
              state={row.state}
              reward={row.reward}
              claimId={`claim-${tab}-${row.index}`}
              canSwap={tab === 'daily' && row.state === 'todo' && canReroll(game, row.index)}
              onClaim={claimTask}
              onSwap={swapDaily}
            />
          ))}
          {listTab === null ? null : listTab === 'daily' ? (
            <View style={styles.points} testID="points-track">
              <View style={styles.pointsHead}>
                <Text style={styles.pointsTitle}>Slice Points</Text>
                <Text
                  style={styles.pointsCount}
                >{`${Math.min(DAILY_CHESTS[DAILY_CHESTS.length - 1].points, Math.floor(r.points))} / ${DAILY_CHESTS[DAILY_CHESTS.length - 1].points}`}</Text>
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
                <Text
                  key={c.index}
                  style={[styles.chestCaption, c.state === 'opened' && { opacity: 0.5 }]}
                >{`${c.points} pts · ${c.label}${c.state === 'opened' ? ' ✓' : ''}`}</Text>
              ))}
            </View>
          ) : (
            <Pressable
              testID="weekly-chest"
              accessibilityRole="button"
              accessibilityLabel={`Weekly chest, ${week.state === 'opened' ? 'opened' : week.state === 'ready' ? 'ready to open' : 'locked'}`}
              accessibilityState={{ disabled: week.state === 'opened' }}
              onPress={() => actions.claimWeeklyChest()}
              disabled={week.state === 'opened'}
              style={[styles.weekChest, week.state === 'ready' && styles.chestReady, week.state === 'opened' && styles.chestOpened]}
            >
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
          {/* v5.15: the recipe count; a tap opens the Scrapbook on its Recipes tab */}
          {listTab && (
            <Pressable
              testID="collection"
              accessibilityRole="link"
              accessibilityLabel={`${collectionText(game)}. Open the Scrapbook`}
              style={styles.collectionRow}
              onPress={() => {
                onClose();
                router.push({ pathname: '/scrapbook', params: { section: 'recipes' } });
              }}
            >
              <Text style={styles.collection}>{collectionText(game)}</Text>
              <Text style={styles.collectionGo}>{'\u203A'}</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </View>
  );
});

/** The missed day is saved after an ad, with no diamonds spent. The engine offers the repair once per 30-day cycle (`gift.saveUsed`). */
const saveByAd = (): void => void useGame.getState().repairGiftByAd();

const Tile = memo(function Tile({
  day,
  label,
  icon,
  big,
  name,
  what,
  state,
  w,
  pulse,
  onClaim,
}: {
  day: number;
  label: string;
  icon: GiftIconKind;
  big: boolean;
  /** U4: day 30's name and what it is: the cell is drawn the grid's full width. */ name: string;
  what: string;
  state: 'claimed' | 'today' | 'future' | 'missed';
  w: number;
  pulse: Animated.Value;
  onClaim: () => void;
}) {
  const today = state === 'today';
  const done = state === 'claimed';
  const wide = name !== '';
  const body = wide ? (
    <>
      <Text style={[styles.tileDay, styles.tileDayBig, done && { opacity: 0.45 }]}>{day}</Text>
      <View style={done ? { opacity: 0.45 } : null}>
        <KindIcon kind={icon} size={30} />
      </View>
      <View style={styles.wideText}>
        <Text testID="gift-day30-name" style={[styles.wideName, done && { opacity: 0.45 }]} numberOfLines={1}>
          {name}
        </Text>
        <Text testID="gift-day30-what" style={[styles.wideWhat, done && { opacity: 0.45 }]} numberOfLines={2}>
          {what}
        </Text>
      </View>
      {done && <Text style={styles.tileTick}>✓</Text>}
      {!done && <View style={styles.ribbon} pointerEvents="none" />}
    </>
  ) : (
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
  const style = [
    styles.tile,
    wide ? styles.tileWide : { width: w, height: Math.max(44, w + 8) },
    big && styles.tileBig,
    today && styles.tileToday,
    state === 'missed' && styles.tileMissed,
    done && styles.tileDone,
  ];
  if (!today)
    return (
      <View style={style} testID={`gift-tile-${day}`} accessible={wide} accessibilityLabel={wide ? `Day ${day}: ${name}. ${what}` : undefined}>
        {body}
      </View>
    );
  return (
    <Animated.View style={[{ transform: [{ scale: pulse }] }, wide && { alignSelf: 'stretch' }]}>
      <Pressable
        testID="gift-claim"
        onPress={onClaim}
        style={style}
        accessibilityRole="button"
        accessibilityLabel={wide ? `Claim day ${day}: ${name}. ${what}` : `Claim day ${day}`}
      >
        {body}
      </Pressable>
    </Animated.View>
  );
});

/**
 * The 30-day gift calendar, a modal over the whole screen (like the offline popup). Memoised: the screen passes a
 * 1 Hz `now` and stable handlers. The pulse only runs while a gift is ready to claim (U5).
 */
export const GiftCalendar = memo(function GiftCalendar({
  game,
  now,
  onClaim,
  onClose,
}: {
  game: GameState;
  now: number;
  onClaim: (repair: boolean) => boolean;
  onClose: () => void;
}) {
  const [pop] = useState(() => new Animated.Value(0.7));
  const [pulse] = useState(() => new Animated.Value(1));
  const [gridW, setGridW] = useState(0);
  const st = R.giftStatus(game, now);
  const ready = st.kind === 'ready';
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: native }).start();
  }, [pop]);
  const { loops } = useMotion();
  useEffect(() => {
    if (!ready || !loops) return;
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
  }, [ready, loops, pulse]);
  const claim = useCallback(() => onClaim(false), [onClaim]);
  const repair = useCallback(() => onClaim(true), [onClaim]);
  const head = giftHeader(game, now);
  const tiles = giftTiles(game, now);
  const gap = 5;
  const w = gridW > 0 ? Math.floor((gridW - gap * 5) / 6) : 0;
  const diamonds = game.rewards.diamonds;
  const canRepair = canAffordDiamonds(game, STREAK_SAVE_DIAMONDS);
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
          {w > 0 &&
            tiles.map((t) => (
              <Tile
                key={t.day}
                day={t.day}
                label={t.label}
                icon={t.icon}
                big={t.big}
                name={t.name}
                what={t.what}
                state={t.state}
                w={w}
                pulse={pulse}
                onClaim={claim}
              />
            ))}
        </View>
        <View style={styles.actions}>
          {st.kind === 'ready' && <BuyButton testID="gift-claim-btn" label={`Claim day ${st.day}`} enabled onPress={claim} />}
          {st.kind === 'save' && (
            <>
              <Text style={styles.caption}>{`You have ${Math.floor(diamonds)} diamonds`}</Text>
              <BuyButton testID="gift-repair" label={`Repair streak · ${STREAK_SAVE_DIAMONDS} 💎`} enabled={canRepair} onPress={repair} />
              <AdButton
                placement="streak_save"
                label="Save streak · watch an ad"
                plusLabel="Save streak · Nonna’s Plus"
                testID="gift-repair-ad"
                onBenefit={saveByAd}
              />
            </>
          )}
          <Pressable testID="gift-close" accessibilityRole="button" onPress={onClose} style={styles.closeWide}>
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
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '14%',
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 3,
    borderColor: C.ink,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DRAWER_HEAD.padX,
    paddingTop: DRAWER_HEAD.padTop,
    paddingBottom: DRAWER_HEAD.padBottom,
  },
  title: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  diamonds: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  diamondsText: { fontFamily: F.bold, fontSize: 15, color: DIAMOND_INK },
  closeBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: TAP.controls.closeButton.height,
    justifyContent: 'center',
  },
  closeWide: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  closeText: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  boosters: { paddingLeft: DRAWER_HEAD.padX, gap: 4, paddingBottom: 6 },
  boostLabel: { fontFamily: F.bold, fontSize: 13, color: C.inkSoft },
  boostRow: { gap: 8, alignItems: 'center', paddingRight: BOOST_STRIP.rightInset },
  boostFade: { position: 'absolute', right: 0, top: 0, bottom: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFE7C2',
    borderWidth: 2,
    borderColor: C.cheeseDark,
  },
  chipRunning: { backgroundColor: '#3E9B4F', borderColor: C.basilDark },
  chipTextRunning: { color: '#fff' },
  chipText: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  empty: { fontFamily: F.regular, fontSize: 13, color: C.inkSoft, paddingVertical: 4 },
  banner: {
    marginHorizontal: 10,
    marginBottom: 6,
    backgroundColor: '#FFE7C2',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: C.cheeseDark,
  },
  bannerText: { fontFamily: F.semi, fontSize: 12.5, color: C.ink, textAlign: 'center' },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingBottom: 8 },
  tab: {
    height: 44,
    minWidth: 72,
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 4,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: { backgroundColor: C.ink },
  tabText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  tabTextOn: { color: '#fff' },
  reset: { flex: 1, textAlign: 'right', fontFamily: F.semi, fontSize: 12, color: C.tomatoDark },
  story: { gap: 8 },
  chapter: { backgroundColor: C.panel, borderRadius: 16, padding: 10, borderWidth: 3, borderColor: C.ink, gap: 4, ...shadow },
  chapterNo: { fontFamily: F.semi, fontSize: 12, color: C.tomatoDark },
  chapterTitle: { fontFamily: F.bold, fontSize: 19, color: C.ink },
  teaserRow: { flexDirection: 'row', alignItems: 'center', gap: TEASER.gap, paddingTop: 2 },
  teaser: { flex: 1, fontFamily: F.regular, fontStyle: 'italic', fontSize: TEASER.font, lineHeight: 17, color: C.inkSoft },
  storyTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    backgroundColor: C.panel,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 3,
    borderColor: C.ink,
    ...shadow,
  },
  storyTaskBody: { flex: 1, gap: 4 },
  storyTaskLabel: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  storyTaskDone: { color: C.inkSoft },
  tickBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: C.lockedDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  tickBoxOn: { borderColor: C.basilDark, backgroundColor: '#F1FFF0' },
  tickMark: { fontFamily: F.bold, fontSize: 16, lineHeight: 20, color: C.basilDark },
  rewardRow: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#FFE7C2',
    borderWidth: 2,
    borderColor: C.cheeseDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  rewardText: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  waitRow: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#F1FFF0',
    borderWidth: 2,
    borderColor: C.basilDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  waitText: { fontFamily: F.bold, fontSize: 15, color: C.basilDark },
  lockedTab: { alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 20 },
  lockedText: { fontFamily: F.bold, fontSize: 15, color: C.inkSoft, textAlign: 'center' },
  list: { padding: 10, gap: 8 },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.panel,
    borderRadius: 16,
    padding: 9,
    borderWidth: 3,
    borderColor: C.ink,
    ...shadow,
  },
  taskReady: { borderColor: C.basilDark, backgroundColor: '#F1FFF0' },
  taskClaimed: { opacity: 0.6 },
  taskTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  taskReward: { fontFamily: F.regular, fontSize: 12, color: C.inkSoft },
  barTrack: { height: 16, borderRadius: 8, backgroundColor: '#F1E4D3', overflow: 'hidden', justifyContent: 'center' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.cheese },
  barText: { fontFamily: F.semi, fontSize: 11, color: C.ink, textAlign: 'center' },
  // D498: a plain cream label (the bar no longer repeats it), one size, and not button-shaped: no fill edge, no raised look
  lockPill: { width: 84, height: 24, borderRadius: 12, backgroundColor: '#FFF4E0', alignItems: 'center', justifyContent: 'center' },
  pillText: { fontFamily: F.bold, fontSize: 12, color: C.inkSoft },
  claimSlot: { width: 84, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tick: { fontFamily: F.bold, fontSize: 26, color: C.basilDark },
  points: { backgroundColor: C.panel, borderRadius: 16, padding: 12, borderWidth: 3, borderColor: C.ink, gap: 4, ...shadow },
  pointsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  pointsTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  pointsCount: { fontFamily: F.semi, fontSize: 13, color: C.inkSoft },
  trackWrap: { height: 52, marginHorizontal: 22, justifyContent: 'center' },
  track: { height: 14, borderRadius: 7, backgroundColor: '#F1E4D3', overflow: 'hidden' },
  trackFill: { height: 14, backgroundColor: C.cheese },
  chest: {
    position: 'absolute',
    top: 4,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: C.lockedDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestReady: { borderColor: C.basilDark, backgroundColor: '#F1FFF0' },
  chestOpened: { backgroundColor: '#EFE6D8', borderColor: '#CFC3B2' },
  chestTick: { position: 'absolute', right: -2, bottom: -4, fontFamily: F.bold, fontSize: 16, color: C.basilDark },
  chestCaption: { fontFamily: F.semi, fontSize: 12, color: C.inkSoft },
  weekChest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    backgroundColor: C.panel,
    borderRadius: 16,
    padding: 10,
    borderWidth: 3,
    borderColor: C.ink,
    ...shadow,
  },
  taskStar: { color: '#E09B00' },
  collectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: TAP.min, marginTop: 4 },
  collection: { fontFamily: F.semi, fontSize: 12.5, color: C.inkSoft, textAlign: 'center' },
  collectionGo: { fontFamily: F.bold, fontSize: 20, lineHeight: 22, color: C.tomato },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30,14,8,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: C.bg,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: C.ink,
    padding: 18,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    gap: 8,
  },
  giftHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalHead: { fontFamily: F.bold, fontSize: 22, color: C.ink, flexShrink: 1, textAlign: 'center' },
  caption: { fontFamily: F.semi, fontSize: 13.5, color: C.inkSoft, textAlign: 'center' },
  grid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', minHeight: 4 },
  tile: {
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D9C4AB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
    gap: 1,
  },
  // U4: day 30, the grid's full width: the cycle's best prize, named
  tileWide: { alignSelf: 'stretch', width: '100%', minHeight: 56, flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 3 },
  wideText: { flex: 1, gap: 1 },
  wideName: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  wideWhat: { fontFamily: F.semi, fontSize: 11.5, lineHeight: 14, color: C.inkSoft },
  tileBig: { backgroundColor: '#FFE7C2', borderColor: MILESTONE_GOLD, borderWidth: 2 },
  tileToday: { backgroundColor: '#F1FFF0', borderColor: C.basilDark, borderWidth: 3 },
  tileMissed: { borderColor: C.tomato, borderStyle: 'dashed' },
  tileDone: { backgroundColor: '#EFE6D8' },
  tileDay: { position: 'absolute', left: 4, top: 1, fontFamily: F.bold, fontSize: 10.5, color: C.inkSoft },
  tileDayBig: { color: C.ink },
  tileLabel: { fontFamily: F.semi, fontSize: 10, color: C.ink, alignSelf: 'stretch', textAlign: 'center' },
  tileTick: { position: 'absolute', right: 2, top: -2, fontFamily: F.bold, fontSize: 13, color: C.basilDark },
  ribbon: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 16,
    height: 16,
    backgroundColor: MILESTONE_GOLD,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 12,
  },
  prizeLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  prizeText: { fontFamily: F.bold, fontSize: 16, color: C.ink, flexShrink: 1, textAlign: 'center' },
  startOver: { height: 44, alignItems: 'center', justifyContent: 'center' },
  startOverText: { fontFamily: F.semi, fontSize: 13.5, color: '#8A7B6C' },
  actions: { alignSelf: 'stretch', gap: 8, alignItems: 'stretch' },
});
