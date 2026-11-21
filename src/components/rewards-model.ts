// View models for the tasks drawer, the gift calendar and the HUD boost chip (docs/PLAN-v5.4-rewards.md §4).
// Pure: everything the screen shows as text or state is decided here and unit-tested in node.
import { collectionView } from '../engine/features/recipes';
import { collectionLine } from './endgame/recipes-model';
import {
  cosmeticName,
  DAILY_CHESTS,
  DAILY_TASK_REWARD,
  GIFT_DAYS,
  GIFT_LENGTH,
  GIFT_MILESTONES,
  STREAK_SAVE_DIAMONDS,
  TASK_TEXT,
  VISITOR_LINES,
  VISITOR_NAMES,
  WEEKLY_DIAMONDS,
  WEEKLY_TASK_REWARD,
  type BoosterDef,
  type Chest,
  type GiftDef,
} from '../content/rewards';
import { cityOf } from '../content/cities';
import { count, money, pizzas } from '../engine/format';
import { chapterReady, chaptersOf, currentChapter, taskProgress } from '../engine/chapters';
import { def, founderName, type Booster, type GameState, type Task } from '../engine/game';
import { scenesById } from '../engine/story';
import { t } from '../content/copy';
import type { ChapterTask } from '../content/cities/types';
import type { CharacterId } from '../content/types';
import type { CoachTargetId } from '../engine/coach-types';
import * as R from '../engine/rewards';
import { isStarredTask } from '../engine/features/heads';

// ---------- Time text ----------

/** "5 h 12 m", "2 d 4 h", "12 m": the two biggest units, whole numbers only. */
export function spanText(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m} m`;
  return m > 0 ? `${m} m` : '<1 m';
}

/** The same without spaces, for tight places: "6d 23h", "5h 12m", "14m". */
export function compactSpan(seconds: number): string {
  return spanText(seconds).replace(/ /g, '');
}

/** "Resets in 5 h 12 m". */
export const countdownText = (seconds: number): string => `Resets in ${spanText(seconds)}`;

const multText = (m: number): string => `${Number.isInteger(m) ? m : Math.round(m * 10) / 10}×`;

/** Drawer chip for a running boost: "2× · 6 d 23 h". */
export const boostChip = (mult: number, seconds: number): string => `${multText(mult)} · ${spanText(seconds)}`;

/** HUD subtitle tail: "2× 14m". */
export const hudBoostText = (mult: number, seconds: number): string => `${multText(mult)} ${compactSpan(seconds)}`;

/** Booster stock chip: "Start 2× 15m". */
export const boosterStartLabel = (b: Booster | BoosterDef): string => `Start ${boosterLabel(b)}`;

/** Running-boost chip in the tasks drawer: "ON · 10 m left". */
export const boostOnText = (seconds: number): string => `ON · ${spanText(seconds)} left`;

const RING_TOTALS = [900, 1800, 3600, 86400, 604800];
/** How full the draining ring is, 0..1: the time left over the smallest standard booster length that holds it (a boost doesn't record its start). */
export function boostRingPct(seconds: number): number {
  const s = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const total = RING_TOTALS.find((t) => t >= s) ?? s;
  return total > 0 ? Math.min(1, s / total) : 0;
}

/** Income per second with the running boost applied (lineTick earns x boostMult, so the HUD and the chips must too): "$358/s". */
export const boostedRate = (eps: number, mult: number): number => eps * (mult > 0 ? mult : 1);
export const hudRateText = (eps: number, mult: number): string => `${money(boostedRate(eps, mult))}/s`;

/** The HUD subtitle on a managed shop (D409): short enough for the cash pill without an ellipsis ("$1.27M/s citywide"). */
export const citywideText = (eps: number, mult: number): string => `${hudRateText(eps, mult)} citywide`;

/** The HUD prompt while the player runs the prep table themselves (D409; "Tap to prep a batch of pizzas!" was cut off). */
export const TAP_PREP_TEXT = 'Tap the prep table';

/** Inventory booster button: "2× 15m". */
export const boosterLabel = (b: Booster | BoosterDef): string => `${multText(b.mult)} ${compactSpan('seconds' in b ? b.seconds : b.minutes * 60)}`;

/** The total multiplier now and the seconds until the first running boost ends, or null with none running. */
export function boostSummary(s: GameState, now: number): { mult: number; seconds: number } | null {
  const running = R.runningBoosts(s, now);
  if (!running.length) return null;
  return { mult: R.boostMult(s, now), seconds: Math.max(0, Math.ceil((running[0].until - now) / 1000)) };
}

export interface RewardsHud {
  /** Claimable things in the tasks drawer (the clipboard's badge). */
  badge: number;
  /** The gift has something to claim (ready, or a streak to save). */
  giftDot: boolean;
  /** The calendar should pop open by itself (before the screen's own gates: title card, popups, tutorial). */
  autoGift: boolean;
  /** The running boost, or null. `text` is the HUD tail "2× 14m". */
  boost: { mult: number; seconds: number; text: string } | null;
  /** The multiplier applied to income now (1 with no boost). */
  mult: number;
}

/** Everything the HUD needs from rewards, from ONE giftStatus call. */
export function rewardsHud(s: GameState, now: number): RewardsHud {
  const on = R.rewardsUnlocked(s);
  const off = R.clockBehind(s, now);
  const kind = R.giftStatus(s, now).kind;
  const claimable = kind === 'ready' || kind === 'save';
  const b = boostSummary(s, now);
  return {
    badge: off ? 0 : R.claimableCount(s, now),
    giftDot: claimable,
    autoGift: on && !off && claimable && s.rewards.giftShownDay !== R.dayKey(now),
    boost: b ? { ...b, text: hudBoostText(b.mult, b.seconds) } : null,
    mult: b ? b.mult : 1,
  };
}

// ---------- Tasks ----------

export type TaskState = 'todo' | 'ready' | 'claimed';
export interface TaskRow {
  index: number;
  title: string;
  /** "12 / 40" */
  progress: string;
  /** 0..1 */
  pct: number;
  state: TaskState;
  /** U4: what the pill by an unfinished task says instead of a padlock: "3 / 5" (a cash task: its percent, "25%"). Empty once the task is ready or claimed. */
  pill: string;
  /** The pill's spoken label: "In progress, 3 of 5". */
  pillLabel: string;
  reward: string;
  /** v5.15: a daily task of the kind Head of the Week's station earns (engine/features/heads.ts `isStarredTask`): the row wears a star. */
  starred: boolean;
}

const minutesText = (m: number): string => (m >= 60 && m % 60 === 0 ? `${m / 60} h` : `${m} min`);

function progressText(s: GameState, t: Task): string {
  const p = R.taskProgress(s, t);
  return TASK_TEXT[t.kind].unit === 'cash' ? `${money(Math.floor(p))} / ${money(t.target)}` : `${pizzas(p)} / ${count(t.target)}`;
}

/** U4: the in-progress pill's text and label for an unfinished task (the bar says the same in full; the pill fits 60 pt). */
export function progressPill(s: GameState, t: Task): { pill: string; pillLabel: string } {
  const p = R.taskProgress(s, t);
  if (TASK_TEXT[t.kind].unit === 'cash') {
    const pct = t.target > 0 ? Math.min(99, Math.floor((p / t.target) * 100)) : 0;
    return { pill: `${pct}%`, pillLabel: `In progress, ${money(Math.floor(p))} of ${money(t.target)}` };
  }
  return { pill: `${pizzas(p)} / ${count(t.target)}`, pillLabel: `In progress, ${pizzas(p)} of ${count(t.target)}` };
}

function taskRow(s: GameState, t: Task, index: number, reward: string, starred = false): TaskRow {
  const state: TaskState = t.claimed ? 'claimed' : R.taskDone(s, t) ? 'ready' : 'todo';
  const pill = state === 'todo' ? progressPill(s, t) : { pill: '', pillLabel: '' };
  return {
    ...pill,
    index,
    title: R.taskTitle(t),
    progress: t.claimed ? 'Done' : progressText(s, t),
    pct: t.claimed ? 1 : t.target > 0 ? Math.min(1, R.taskProgress(s, t) / t.target) : 1,
    state,
    reward,
    starred,
  };
}

export function dailyRows(s: GameState): TaskRow[] {
  const reward = `${minutesText(DAILY_TASK_REWARD.minutes)} income (${money(R.minutesToCash(s, DAILY_TASK_REWARD.minutes))}) · +${DAILY_TASK_REWARD.points} pts`;
  return s.rewards.daily.map((t, i) => taskRow(s, t, i, reward, isStarredTask(s, t.kind)));
}

export function weeklyRows(s: GameState): TaskRow[] {
  const cash = money(R.minutesToCash(s, WEEKLY_TASK_REWARD.minutes));
  return s.rewards.weekly.map((t, i) => taskRow(s, t, i, `${minutesText(WEEKLY_TASK_REWARD.minutes)} income (${cash}) · +${WEEKLY_DIAMONDS[i] ?? 0} diamonds`));
}

// ---------- Chests ----------

export interface ChestRow {
  index: number;
  points: number;
  state: 'locked' | 'ready' | 'opened';
  label: string;
}

export function chestLabel(c: Chest): string {
  const parts: string[] = [];
  if (c.minutes) parts.push(`${minutesText(c.minutes)} income`);
  if (c.diamonds) parts.push(`${c.diamonds} diamonds`);
  if (c.booster) parts.push(`${boosterLabel(c.booster)} booster`);
  return parts.join(' + ');
}

export function chestRows(s: GameState): ChestRow[] {
  return DAILY_CHESTS.map((c, index) => ({
    index,
    points: c.points,
    state: s.rewards.chests[index] ? 'opened' : R.chestReady(s, index) ? 'ready' : 'locked',
    label: chestLabel(c),
  }));
}

/** The points bar: 0..1 of the last chest's threshold. */
export const pointsPct = (s: GameState): number => Math.min(1, Math.max(0, s.rewards.points / DAILY_CHESTS[DAILY_CHESTS.length - 1].points));

export interface WeeklyChestView {
  state: 'locked' | 'ready' | 'opened';
  /** What the chest gives: a cosmetic's name and its diamonds ("Gold awning + 8 💎"), or "30 💎 + 2 h income" once every cosmetic is owned. */
  prize: string;
  label: string;
}

export function weeklyChestView(s: GameState): WeeklyChestView {
  const p = R.weeklyChestPrize(s);
  const prize = p.kind === 'cosmetic' ? `${cosmeticName(p.id)} + ${p.diamonds} \u{1F48E}` : `${p.diamonds} \u{1F48E} + ${minutesText(p.minutes)} income`;
  const left = s.rewards.weekly.filter((t) => !t.claimed).length;
  const state = s.rewards.weeklyChest ? 'opened' : R.weeklyChestReady(s) ? 'ready' : 'locked';
  // once opened the prize is already owned (the next one shows), so the opened line doesn't name it
  return {
    state,
    prize,
    label:
      state === 'opened'
        ? 'Opened this week'
        : state === 'ready'
          ? `Open for ${p.kind === 'cosmetic' ? 'the ' : ''}${prize}`
          : `${prize} · ${left} ${left === 1 ? 'task' : 'tasks'} to go`,
  };
}

/** v5.15: the tasks drawer's collection line, "Collection: 9/24 recipes" (the cards of engine/features/recipes.ts; cosmetics live in the Shop screen). */
export function collectionText(s: GameState): string {
  return collectionLine(collectionView(s));
}

// ---------- Gift calendar ----------

/** A duration in full words where there is room: "1 day", "7 days", "24 h" never (a whole day is a day), "90 min". */
const daysText = (minutes: number): string =>
  minutes >= 1440 && minutes % 1440 === 0 ? `${minutes / 1440} ${minutes === 1440 ? 'day' : 'days'}` : minutesText(minutes);

/** What a gift gives, spelled out: "2× income for 7 days · 300 diamonds · Gold oven". */
export function giftText(g: GiftDef, cycle = 0): string {
  const parts: string[] = [];
  if (g.minutes) parts.push(`${minutesText(g.minutes)} of income`);
  if (g.boostNow) parts.push(`${multText(g.boostNow.mult)} income for ${daysText(g.boostNow.minutes)}`);
  if (g.diamonds) parts.push(`${g.diamonds} diamonds`);
  if (g.boosters?.length)
    parts.push(g.boosters.length === 1 ? `${boosterLabel(g.boosters[0])} booster` : `${g.boosters.length} boosters · ${boosterLabel(g.boosters[0])}`);
  if (g.cosmetic) parts.push(cosmeticName(g.cosmetic.replace('{cycle}', String(cycle + 1))));
  return parts.join(' · ');
}

export type GiftIconKind = 'coin' | 'bolt' | 'gem' | 'star' | 'oven';

/** The tile's icon: coin for cash, bolt for boosters and boosts, gem for diamonds, star for skins, the gold oven for the day-30 prize (D499).
 */
export function giftIcon(g: GiftDef): GiftIconKind {
  if (g.cosmetic === 'oven-gold') return 'oven';
  if (g.visit || g.cosmetic) return 'star';
  if (g.boostNow || g.boosters?.length) return 'bolt';
  if (g.diamonds) return 'gem';
  return 'coin';
}

/** The few characters a calendar tile has room for, beside its icon: "30 min", "1 day", "50". */
export function giftShort(g: GiftDef): string {
  if (g.visit) return 'Visit';
  if (g.cosmetic) return 'Skin';
  if (g.boostNow) return g.boostNow.minutes >= 1440 ? daysText(g.boostNow.minutes) : compactSpan(g.boostNow.minutes * 60);
  if (g.boosters?.length) return g.boosters.length === 1 ? compactSpan(g.boosters[0].minutes * 60) : `${g.boosters.length} boosts`;
  if (g.diamonds) return `${g.diamonds}`;
  if (g.minutes) return minutesText(g.minutes);
  return '';
}

export type TileState = 'claimed' | 'today' | 'future' | 'missed';
export interface GiftTile {
  day: number;
  label: string;
  icon: GiftIconKind;
  big: boolean;
  state: TileState;
  /** U4: the prize's name and what it is, for the day-30 cell (drawn full width, the most prominent); '' on the other tiles. */
  name: string;
  what: string;
}

export function giftTiles(s: GameState, now: number): GiftTile[] {
  const st = R.giftStatus(s, now);
  return GIFT_DAYS.map((g, i) => {
    const day = i + 1;
    let state: TileState;
    if (st.kind === 'locked') state = 'future';
    else if (st.kind === 'claimed') state = day <= st.day ? 'claimed' : 'future';
    else if (st.kind === 'save') state = day < st.day ? 'claimed' : day === st.day ? 'missed' : 'future';
    else state = day < st.day ? 'claimed' : day === st.day ? 'today' : 'future';
    const last = day === GIFT_LENGTH;
    return {
      day,
      label: giftShort(g),
      icon: giftIcon(g),
      big: day in GIFT_MILESTONES,
      state,
      name: last ? (g.name ?? 'Golden Oven') : '',
      what: last ? giftText(g, st.cycle) : '',
    };
  });
}

export interface GiftHeader {
  title: string;
  /** A line above the prize ("Nonna Rosa drops by. “…”"), or the status when there is no prize line. */
  caption: string;
  /** What today's claim gives, for its own bold line ("" when there is nothing to claim). */
  prize: string;
  prizeIcon: GiftIconKind;
}

export function giftHeader(s: GameState, now: number): GiftHeader {
  const st = R.giftStatus(s, now);
  const who = VISITOR_NAMES[st.visitor] ?? st.visitor;
  const gift = giftText(st.gift, st.cycle);
  const prizeIcon = giftIcon(st.gift);
  const title = st.day === GIFT_LENGTH ? `Day ${GIFT_LENGTH} \u00B7 ${who} visits` : `Day ${st.day} of ${GIFT_LENGTH}`;
  if (st.kind === 'claimed') return { title, caption: `Claimed. Next gift in ${spanText(R.resetCountdown(now, 'day'))}`, prize: '', prizeIcon };
  if (st.kind === 'locked') return { title, caption: t('rewards.gift.locked', { founder: founderName(s) }, s.city), prize: '', prizeIcon };
  if (st.kind === 'save') {
    return {
      title,
      caption: `Missed a day! Keep your streak for ${STREAK_SAVE_DIAMONDS} \u{1F48E} (day ${st.day}: ${gift.replace(/(\d+) diamonds/, '$1 \u{1F48E}')}).`,
      prize: '',
      prizeIcon,
    };
  }
  if (st.day === GIFT_LENGTH) return { title, caption: visitCaption(st.visitor), prize: gift, prizeIcon };
  return { title, caption: 'Today\u2019s gift', prize: gift, prizeIcon };
}

/** Day 30: "Nonna Rosa drops by. “Thirty days…”" (also the claim confirmation). */
export function visitCaption(visitor: string): string {
  return `${VISITOR_NAMES[visitor] ?? visitor} drops by. \u201C${VISITOR_LINES[visitor] ?? ''}\u201D`;
}

// ---------- Booster strip ----------

/** The booster strip's right inset and the width of the fade that hints it scrolls on (D390). */
export const BOOST_STRIP = { rightInset: 16, fade: 24 } as const;

/** Show the strip's right-edge fade: the chips overflow the strip and it isn't scrolled to the end yet. */
export const boostFadeShown = (contentW: number, viewW: number, scrollX: number): boolean =>
  viewW > 0 && contentW - viewW > 2 && scrollX < contentW - viewW - 2;

// ---------- Story tab (v5.21, card U2) ----------

/** The tasks drawer's tabs: the chapter first, then the daily and weekly lists. */
export type TasksTab = 'story' | 'daily' | 'weekly';
export const TASKS_TABS: readonly TasksTab[] = ['story', 'daily', 'weekly'];

/** The diamonds a finished chapter pays besides its scene (banked until the rewards unlock; VERSION.md "Defaults"). */
export const CHAPTER_DIAMONDS = 5;

/** The tutorial's two spots in the drawer (card E2 adds these ids to `CoachTargetId`; the cast keeps this file compiling until then). */
export const TASKS_STORY_TARGET = 'tasks:story' as unknown as CoachTargetId;
export const TASKS_CLOSE_TARGET = 'tasks:close' as unknown as CoachTargetId;

/** Daily and weekly are the rewards': they stay behind a padlock until the takeover. */
export const rewardsTabLocked = (s: GameState): boolean => !R.rewardsUnlocked(s);

/** The padlocked tab's line: "Opens when Nonna takes over". */
export const tabLockedText = (s: GameState): string => `Opens when ${founderName(s)} takes over`;

/** The Story tab exists in a city that has chapters; one without any (Boston) opens on Daily. */
export const hasStory = (s: GameState): boolean => chaptersOf(s).length > 0;

/** The tab the drawer opens on: Story, or Daily where there is no story list. */
export const defaultTasksTab = (s: GameState): TasksTab => (hasStory(s) ? 'story' : 'daily');

/** "0:42", "12:05". */
export function clockText(seconds: number): string {
  const n = Math.max(0, Math.ceil(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

export interface StoryTask {
  key: string;
  /** "Serve 424 pies in Downtown" */
  label: string;
  done: boolean;
  /** A count (more than one to reach) draws a bar with "212/424"; a yes/no task is only a tick. */
  bar: boolean;
  /** 0..1 */
  pct: number;
  /** "212/424" ('' with no bar) */
  progress: string;
  /** The row as it is read aloud. */
  spoken: string;
}

export interface StoryView {
  /** 'chapter': one is on; 'finished': every chapter has played (or the city has none). */
  kind: 'chapter' | 'finished';
  /** The chapter's place in the story, from 1. */
  number: number;
  title: string;
  teaser: string;
  /** Who is in the next scene: the portrait by the teaser (null when the scene is not found). */
  who: CharacterId | null;
  tasks: StoryTask[];
  /** "🎬 New scene · 💎 5" */
  reward: string;
  /** "Next scene in 0:42" once every task is done and the beat waits on the pacing; null otherwise. */
  wait: string | null;
  /** The line of the finished state. */
  finished: string;
}

/** The reward row: the scene, and the diamonds. */
export const storyRewardText = (): string => `\u{1F3AC} New scene \u00B7 \u{1F48E} ${CHAPTER_DIAMONDS}`;

function storyTask(g: GameState, task: ChapterTask): StoryTask {
  const p = taskProgress(g, task);
  const shop = def(task.shop, cityOf(g)).name;
  // `noMissed`'s {target} is a bare number of seconds; every other count reads as a short number ("12.4K")
  const target = task.kind === 'noMissed' ? String(task.target) : count(task.target);
  const label = t(task.key, { target, shop }, g.city);
  const bar = p.target > 1;
  const progress = bar ? `${pizzas(p.current)}/${count(p.target)}` : '';
  return {
    key: task.key,
    label,
    done: p.done,
    bar,
    pct: p.target > 0 ? Math.min(1, p.current / p.target) : 1,
    progress,
    spoken: p.done ? `${label}, done` : bar ? `${label}, ${pizzas(p.current)} of ${count(p.target)}` : `${label}, not yet`,
  };
}

/** Everything the Story tab shows, from the chapter selectors alone. `lastSceneEnd` is the store's `lastSceneEndPlay` (the pacing's clock). */
export function storyView(g: GameState, lastSceneEnd: number | null): StoryView {
  const c = currentChapter(g);
  const finished = t('chapter.done', {}, g.city);
  if (!c) return { kind: 'finished', number: chaptersOf(g).length, title: '', teaser: '', who: null, tasks: [], reward: '', wait: null, finished };
  const ready = chapterReady(g, lastSceneEnd);
  return {
    kind: 'chapter',
    number: chaptersOf(g).indexOf(c) + 1,
    title: t(`${c.key}.title`, {}, g.city),
    teaser: t(`${c.key}.teaser`, {}, g.city),
    who: scenesById(cityOf(g).scenes).get(c.sceneId)?.character ?? null,
    tasks: c.tasks.map((task) => storyTask(g, task)),
    reward: storyRewardText(),
    wait: ready ? t('chapter.ready', { time: clockText(ready.secondsLeft) }, g.city) : null,
    finished,
  };
}

/** The teaser's room (pt) in the card at a screen width: the list's padding, the card's border and padding, the 36 pt portrait and its gap. */
export const TEASER = { font: 13, portrait: 36, gap: 10, lines: 2, charW: 0.56 } as const;
export const teaserWidth = (screenW: number): number => screenW - 2 * 10 - 2 * (3 + 10) - TEASER.portrait - TEASER.gap;

/** How many lines a line of text takes at a width, by a greedy wrap on an average character width (italic 13 pt: about 0.56 em). A budget, not a layout. */
export function wrapLines(text: string, width: number, font: number = TEASER.font): number {
  const perLine = Math.max(1, Math.floor(width / (font * TEASER.charW)));
  let lines = 1;
  let used = 0;
  for (const word of text.split(' ')) {
    const w = word.length;
    if (used === 0) used = w;
    else if (used + 1 + w <= perLine) used += 1 + w;
    else {
      lines += 1;
      used = w;
    }
  }
  return lines;
}
