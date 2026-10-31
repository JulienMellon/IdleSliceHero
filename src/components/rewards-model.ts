// View models for the tasks drawer, the gift calendar and the HUD boost chip (docs/PLAN-v5.4-rewards.md §4).
// Pure: everything the screen shows as text or state is decided here and unit-tested in node.
import { cosmeticName, DAILY_CHESTS, DAILY_TASK_REWARD, GIFT_DAYS, GIFT_LENGTH, GIFT_MILESTONES, TASK_TEXT, VISITOR_NAMES, WEEKLY_DIAMONDS, WEEKLY_TASK_REWARD, type BoosterDef, type Chest, type GiftDef } from '../content/rewards';
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

/** Inventory booster button: "2× 15m". */
export const boosterLabel = (b: Booster | BoosterDef): string => `${multText(b.mult)} ${compactSpan('seconds' in b ? b.seconds : b.minutes * 60)}`;

/** The total multiplier now and the seconds until the first running boost ends, or null with none running. */
export function boostSummary(s: GameState, now: number): { mult: number; seconds: number } | null {
  const running = R.runningBoosts(s, now);
  if (!running.length) return null;
  return { mult: R.boostMult(s, now), seconds: Math.max(0, Math.ceil((running[0].until - now) / 1000)) };
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
  cosmetic: string;
  label: string;
}

export function weeklyChestView(s: GameState): WeeklyChestView {
  const cosmetic = cosmeticName(R.weeklyCosmetic(s));
  const left = s.rewards.weekly.filter((t) => !t.claimed).length;
  const state = s.rewards.weeklyChest ? 'opened' : R.weeklyChestReady(s) ? 'ready' : 'locked';
  return { state, cosmetic, label: state === 'opened' ? `${cosmetic} unlocked` : state === 'ready' ? `Open for the ${cosmetic}` : `${cosmetic} · ${left} ${left === 1 ? 'task' : 'tasks'} to go` };
}

/** "Collection: Wood-fired oven, Gold oven" or an empty-state line. */
export function collectionText(s: GameState): string {
  const own = s.rewards.cosmetics;
  return own.length ? `Collection: ${own.map(cosmeticName).join(', ')}` : 'Collection: nothing yet. Finish the weekly chest or the gift calendar';
}

// ---------- Gift calendar ----------

/** What a gift gives, spelled out: "2× income for 7 d · 300 diamonds · Gold oven". */
export function giftText(g: GiftDef, cycle = 0): string {
  const parts: string[] = [];
  if (g.minutes) parts.push(`${minutesText(g.minutes)} of income`);
  if (g.boostNow) parts.push(`${multText(g.boostNow.mult)} income for ${spanText(g.boostNow.minutes * 60).replace(/ 0 h$/, '')}`);
  if (g.diamonds) parts.push(`${g.diamonds} diamonds`);
  if (g.boosters?.length) parts.push(g.boosters.length === 1 ? `${boosterLabel(g.boosters[0])} booster` : `${g.boosters.length} boosters · ${boosterLabel(g.boosters[0])}`);
  if (g.cosmetic) parts.push(cosmeticName(g.cosmetic.replace('{cycle}', String(cycle + 1))));
  return parts.join(' · ');
}

/** The few characters a calendar tile has room for. */
export function giftShort(g: GiftDef): string {
  if (g.visit) return 'Visit';
  if (g.cosmetic) return 'Skin';
  if (g.boostNow) return `${multText(g.boostNow.mult)} ${compactSpan(g.boostNow.minutes * 60).replace(/0h$/, '')}`;
  if (g.boosters?.length) return g.boosters.length === 1 ? boosterLabel(g.boosters[0]) : `${g.boosters.length} boosts`;
  if (g.diamonds) return `${g.diamonds}\u{1F48E}`;
  if (g.minutes) return `${g.minutes}m $`;
  return '';
}

export type TileState = 'claimed' | 'today' | 'future' | 'missed';
export interface GiftTile {
  day: number;
  label: string;
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
    return { day, label: giftShort(g), big: day in GIFT_MILESTONES, state };
  });
}

export interface GiftHeader {
  title: string;
  /** What today's claim gives (or, claimed, a note to come back). */
  caption: string;
}

export function giftHeader(s: GameState, now: number): GiftHeader {
  const st = R.giftStatus(s, now);
  const title = `Day ${st.day} of ${GIFT_LENGTH}`;
  const who = VISITOR_NAMES[st.visitor] ?? st.visitor;
  const gift = giftText(st.gift, st.cycle);
  if (st.kind === 'claimed') return { title, caption: `Claimed. Next gift in ${spanText(R.resetCountdown(now, 'day'))}` };
  if (st.kind === 'locked') return { title, caption: 'Unlocks when Nonna takes over' };
  if (st.kind === 'save') return { title, caption: `You missed a day. Repair the streak to claim day ${st.day}: ${gift}` };
  return { title: st.day === GIFT_LENGTH ? `${title} · ${who} visits` : title, caption: st.day === GIFT_LENGTH ? `${who} drops by: ${gift}` : gift };
}
