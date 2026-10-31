// View models for the tasks drawer, the gift calendar and the HUD boost chip (docs/PLAN-v5.4-rewards.md §4).
// Pure: everything the screen shows as text or state is decided here and unit-tested in node.
import { cosmeticName, DAILY_CHESTS, DAILY_TASK_REWARD, GIFT_DAYS, GIFT_LENGTH, GIFT_MILESTONES, STREAK_SAVE_DIAMONDS, TASK_TEXT, VISITOR_LINES, VISITOR_NAMES, WEEKLY_DIAMONDS, WEEKLY_TASK_REWARD, type BoosterDef, type Chest, type GiftDef } from '../content/rewards';
import { count, money, pizzas } from '../engine/format';
import type { Booster, GameState, Task } from '../engine/game';
import * as R from '../engine/rewards';

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

/** Income per second with the running boost applied (lineTick earns x boostMult, so the HUD and the chips must too): "$358/sec". */
export const boostedRate = (eps: number, mult: number): number => eps * (mult > 0 ? mult : 1);
export const hudRateText = (eps: number, mult: number): string => `${money(boostedRate(eps, mult))}/sec`;

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
  reward: string;
}

const minutesText = (m: number): string => (m >= 60 && m % 60 === 0 ? `${m / 60} h` : `${m} min`);

function progressText(s: GameState, t: Task): string {
  const p = R.taskProgress(s, t);
  return TASK_TEXT[t.kind].unit === 'cash' ? `${money(Math.floor(p))} / ${money(t.target)}` : `${pizzas(p)} / ${count(t.target)}`;
}

function taskRow(s: GameState, t: Task, index: number, reward: string): TaskRow {
  const state: TaskState = t.claimed ? 'claimed' : R.taskDone(s, t) ? 'ready' : 'todo';
  return {
    index,
    title: R.taskTitle(t),
    progress: t.claimed ? 'Done' : progressText(s, t),
    pct: t.claimed ? 1 : t.target > 0 ? Math.min(1, R.taskProgress(s, t) / t.target) : 1,
    state,
    reward,
  };
}

export function dailyRows(s: GameState): TaskRow[] {
  const reward = `${minutesText(DAILY_TASK_REWARD.minutes)} income (${money(R.minutesToCash(s, DAILY_TASK_REWARD.minutes))}) · +${DAILY_TASK_REWARD.points} pts`;
  return s.rewards.daily.map((t, i) => taskRow(s, t, i, reward));
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
  return DAILY_CHESTS.map((c, index) => ({ index, points: c.points, state: s.rewards.chests[index] ? 'opened' : R.chestReady(s, index) ? 'ready' : 'locked', label: chestLabel(c) }));
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
  return { state, prize, label: state === 'opened' ? 'Opened this week' : state === 'ready' ? `Open for ${p.kind === 'cosmetic' ? 'the ' : ''}${prize}` : `${prize} · ${left} ${left === 1 ? 'task' : 'tasks'} to go` };
}

/** "Collection: Wood-fired oven, Gold oven" or an empty-state line. */
export function collectionText(s: GameState): string {
  const own = s.rewards.cosmetics;
  return own.length ? `Collection: ${own.map(cosmeticName).join(', ')}` : 'Collection: empty. Open a weekly chest or reach day 28.';
}

// ---------- Gift calendar ----------

/** A duration in full words where there is room: "1 day", "7 days", "24 h" never (a whole day is a day), "90 min". */
const daysText = (minutes: number): string => (minutes >= 1440 && minutes % 1440 === 0 ? `${minutes / 1440} ${minutes === 1440 ? 'day' : 'days'}` : minutesText(minutes));

/** What a gift gives, spelled out: "2× income for 7 days · 300 diamonds · Gold oven". */
export function giftText(g: GiftDef, cycle = 0): string {
  const parts: string[] = [];
  if (g.minutes) parts.push(`${minutesText(g.minutes)} of income`);
  if (g.boostNow) parts.push(`${multText(g.boostNow.mult)} income for ${daysText(g.boostNow.minutes)}`);
  if (g.diamonds) parts.push(`${g.diamonds} diamonds`);
  if (g.boosters?.length) parts.push(g.boosters.length === 1 ? `${boosterLabel(g.boosters[0])} booster` : `${g.boosters.length} boosters · ${boosterLabel(g.boosters[0])}`);
  if (g.cosmetic) parts.push(cosmeticName(g.cosmetic.replace('{cycle}', String(cycle + 1))));
  return parts.join(' · ');
}

export type GiftIconKind = 'coin' | 'bolt' | 'gem' | 'star';

/** The tile's icon: coin for cash, bolt for boosters and boosts, gem for diamonds, star for skins and the visit. */
export function giftIcon(g: GiftDef): GiftIconKind {
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
    return { day, label: giftShort(g), icon: giftIcon(g), big: day in GIFT_MILESTONES, state };
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
  if (st.kind === 'locked') return { title, caption: 'Unlocks when Nonna takes over', prize: '', prizeIcon };
  if (st.kind === 'save') {
    return { title, caption: `Missed a day! Keep your streak for ${STREAK_SAVE_DIAMONDS} \u{1F48E} (day ${st.day}: ${gift.replace(/(\d+) diamonds/, '$1 \u{1F48E}')}).`, prize: '', prizeIcon };
  }
  if (st.day === GIFT_LENGTH) return { title, caption: visitCaption(st.visitor), prize: gift, prizeIcon };
  return { title, caption: "Today\u2019s gift", prize: gift, prizeIcon };
}

/** Day 30: "Nonna Rosa drops by. “Thirty days…”" (also the claim confirmation). */
export function visitCaption(visitor: string): string {
  return `${VISITOR_NAMES[visitor] ?? visitor} drops by. \u201C${VISITOR_LINES[visitor] ?? ''}\u201D`;
}

// ---------- Booster strip ----------

/** The booster strip's right inset and the width of the fade that hints it scrolls on (D390). */
export const BOOST_STRIP = { rightInset: 16, fade: 24 } as const;

/** Show the strip's right-edge fade: the chips overflow the strip and it isn't scrolled to the end yet. */
export const boostFadeShown = (contentW: number, viewW: number, scrollX: number): boolean => viewW > 0 && contentW - viewW > 2 && scrollX < contentW - viewW - 2;
