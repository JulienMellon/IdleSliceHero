// The goal bar's numbers and colours as plain data (D297). The label is drawn twice: dark ink over the cream track,
// and a cream copy clipped to the fill's width, so it stays readable at every fill fraction. Pure: unit-tested in node.
import { HOME_SCENES } from '../content/scenes/home';
import { finaleSeen } from '../engine/features/counterattack';
import { masteryMax, masteryTotal, nextStar } from '../engine/features/mastery';
import { cityOf } from '../content/cities';
import type { ChapterTask } from '../content/cities/types';
import { lineOf, t } from '../content/copy';
import { chapterReady, chaptersOf, currentChapter, nextTask } from '../engine/chapters';
import { def, headCost, upgradeCostOf, type GameState } from '../engine/game';
import { goalAmount } from '../engine/format';
import { C } from '../theme';
import { copy } from './endgame/copy-text';
import { nextStarLine, starName } from './endgame/mastery-model';
import { clockText, storyTask, type TasksTab } from './rewards-model';

export const GOAL_BAR = {
  /** The bar's own border (pt); the fill and the clipped copy live inside it. */
  border: 2,
  track: '#FFE7C2',
  /** A caramel fill: cream on it reads at 4.5:1 or better (the old cheese yellow gave cream 1.5:1). */
  fill: '#A8560F',
  onFill: '#FFF4E0',
  onTrack: C.ink,
} as const;

export interface GoalBarLayout {
  /** Fill fraction, 0–1 (0 when the target is 0 or not a number). */
  pct: number;
  /** Full and marked ready (a done chapter waiting on the story's pacing): the bar turns basil and its label white, so there is nothing to split. */
  ready: boolean;
  /** Width inside the border (0 until measured). */
  innerW: number;
  /** The fill's width, and the width the cream copy of the label is clipped to (the same number). */
  fillW: number;
  /** Draw the cream copy at all: only while something is filled and the bar has been measured. */
  split: boolean;
}

/** One whole word, the amount or the icon of the goal line: x from the bar's inner left edge, and its width (pt). */
export interface GoalSpan {
  x: number;
  w: number;
}

/**
 * Where the two-tone seam really goes (G88). A seam inside a word or the amount cut a letter in two ("Hire" read "ire")
 * and split "$15.4M" into two colours. So when the fill's edge lands inside a span, the seam (and the fill's visible
 * edge with it) moves to the nearer end of that span, at most half a word. In a gap, in the padding, or past the last
 * span the seam stays exactly where the progress is, so a small fill never vanishes.
 */
export function snapSeam(fillW: number, spans: readonly GoalSpan[]): number {
  for (const s of spans) {
    if (s.w <= 0) continue;
    if (fillW > s.x && fillW < s.x + s.w) return fillW - s.x >= s.w / 2 ? s.x + s.w : s.x;
  }
  return fillW;
}

/** The label split into the words that are measured and coloured whole (blank runs dropped). */
export const goalWords = (label: string): string[] => label.split(/\s+/).filter(Boolean);

export function goalBarLayout(current: number, target: number, tappable: boolean, outerW: number, spans: readonly GoalSpan[] = []): GoalBarLayout {
  const raw = target > 0 ? current / target : 0;
  const pct = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 0;
  const ready = tappable && pct >= 1;
  const innerW = Math.max(0, outerW - 2 * GOAL_BAR.border);
  const fillW = pct >= 1 ? innerW : Math.min(innerW, snapSeam(pct * innerW, spans));
  return { pct, ready, innerW, fillW, split: !ready && fillW > 0 };
}

/** "a" or "an" from the word's first letter: "a Suburbs", "an Uptown", "an Industrial" (B5). */
export const aOrAn = (word: string): 'a' | 'an' => (/^[aeiou]/i.test(word.trim()) ? 'an' : 'a');

// ---------- the line's fit (C105, T81) ----------
/** Horizontal padding inside the bar (pt) and the gap kept between the words and the amount. */
export const GOAL_PAD = 18;
/** The chevron that says the bar opens something: drawn in the right padding, so it takes nothing from the amount. */
export const GOAL_CHEVRON = '›';
export const GOAL_GAP = 6;
/** Largest Dynamic Type scale the goal line follows: the bar is 30 pt tall, so past this the words would not fit it. */
export const GOAL_FONT_MAX_SCALE = 1.2;
export const GOAL_FONT = { label: 14, amount: 13 } as const;
/** The words keep at least this much room (or all of it, if the label is shorter): "Waterfront:" stays readable before the amount ever clips. */
export const GOAL_MIN_WORDS_W = 72;
/** The bar's layout contract: the words are one row that shrinks and clips, the amount sits outside it and never shrinks (C105). */
export const GOAL_LAYOUT = {
  words: { flexShrink: 1, overflow: 'hidden' },
  amount: { flexShrink: 0 },
} as const;

/** Bold text's width at `size` pt, estimated at 0.56 em a character (the Baloo-style face runs ~0.52–0.55; padded so the check errs wide). */
export const goalTextW = (text: string, size: number): number => Math.ceil(text.length * size * 0.56);

export interface GoalFit {
  amountW: number;
  labelW: number;
  /** Room the words get once the amount has its full width. */
  wordsRoom: number;
  /** The amount shows whole, with at least min(its words, GOAL_MIN_WORDS_W) left for the words. */
  fits: boolean;
}

/** Whether a goal line fits a bar `barW` wide (its outer width, border included): the amount is never clipped and the words keep a readable share. */
export function goalLabelFit(label: string, amount: string, barW: number): GoalFit {
  const inner = Math.max(0, barW - 2 * GOAL_BAR.border) - 2 * GOAL_PAD;
  const amountW = goalTextW(amount, GOAL_FONT.amount);
  const labelW = goalTextW(goalWords(label).join(' '), GOAL_FONT.label);
  const wordsRoom = inner - amountW - GOAL_GAP;
  return { amountW, labelW, wordsRoom, fits: amountW <= inner && wordsRoom >= Math.min(labelW, GOAL_MIN_WORDS_W) };
}
export const goalLabelFits = (label: string, amount: string, barW: number): boolean => goalLabelFit(label, amount, barW).fits;

// ---------- the story count (v5.16) ----------

/** Every scene of the home city: the bar's total (40 with Todd's interludes and the hire scenes), never a number typed in a screen. */
export const STORY_TOTAL = HOME_SCENES.length;
/** The completed-city fallback goal: "Story 12/40", the bar filling as scenes are seen. */
export function storyGoal(seen: number, total: number = STORY_TOTAL): { label: string; current: number; target: number } {
  return { label: `Story ${seen}/${total}`, current: seen, target: total };
}

/** G116: the story count of the city being played: its own scenes seen of its own scenes (a franchise keeps the old city's ids in `seenScenes`). */
export function cityStory(g: GameState): { label: string; current: number; target: number } {
  const scenes = cityOf(g).scenes;
  let ids = SCENE_IDS.get(scenes);
  if (!ids) SCENE_IDS.set(scenes, (ids = new Set(scenes.map((sc) => sc.id))));
  const own = ids;
  return storyGoal(g.seenScenes.filter((id) => own.has(id)).length, scenes.length);
}
/** U32: a city's scene ids, built once per scenes array (the bar asks every render). */
const SCENE_IDS = new WeakMap<readonly unknown[], ReadonlySet<string>>();

// ---------- the post-story goal (v5.15, D427) ----------

/** The goal bar once the story is told: the stars of every shop, 0..18. */
export interface MasteryGoal {
  /** "Mastery 7/18 · Next: Flagship in Suburbs": the words clip at their end, so the count always shows. */
  label: string;
  /** G98: the same line short, "\u260510/18 \u00B7 Flagship: Waterfront", for a narrow bar (an event chip beside it): the star stands for "Mastery". */
  short: string;
  /** The same line shortest, "\u260510/18 \u00B7 Flagship": for a bar with three chips beside it, where even the short line does not fit. */
  tiny: string;
  /** The amount beside the words: the next star's steps with their unit ("2/3 heads"), or a star when all 18 are earned. */
  text: string;
  /** The bar: stars earned of 18. */
  current: number;
  target: number;
}

/** D466: the unit after the next star's steps, so "3/4" is never bare: heads hired, footprint sizes, oven grades. */
export const STAR_UNIT = { heads: 'heads', flagship: 'sizes', golden: 'grades' } as const;

/** The goal bar's line after the last finale, or null while the story is still being told (then the ordinary goals show). */
export function masteryGoal(g: GameState): MasteryGoal | null {
  if (!finaleSeen(g)) return null;
  const n = masteryTotal(g);
  const next = nextStar(g);
  const count = copy('goal.mastery', { n });
  const short = next ? `\u2605${n}/18 \u00B7 ${starName(next.star)}: ${def(next.shopId, cityOf(g)).name}` : `\u2605${n}/18`;
  const tiny = next ? `\u2605${n}/18 \u00B7 ${starName(next.star)}` : `\u2605${n}/18`;
  return {
    label: next ? `${count} \u00B7 ${nextStarLine(next)}` : count,
    short,
    tiny,
    text: next ? `${next.have}/${next.need} ${STAR_UNIT[next.star]}` : '\u2605',
    current: n,
    target: masteryMax(g),
  };
}

/** The line and its amount both show whole in a bar `barW` wide (no word clipped): the strict form of `goalLabelFits`. */
export function goalFitsWhole(label: string, amount: string, barW: number): boolean {
  const f = goalLabelFit(label, amount, barW);
  return f.amountW <= Math.max(0, barW - 2 * GOAL_BAR.border) - 2 * GOAL_PAD && f.wordsRoom >= f.labelW;
}

/**
 * G98: which line the bar shows for the width it has, for a goal with a short form: the full line with its amount if both fit whole;
 * else the short one ("\u260510/18 \u00B7 Flagship: Waterfront") with the amount ("3/4 sizes"); else the short one alone, which gets all
 * the room. A goal with no short line is shown as it is (the ordinary rule, `goalLabelFit`, applies to it).
 */
export function goalLine(goal: { label: string; short?: string; tiny?: string; text?: string }, barW: number): { label: string; text: string | undefined } {
  if (!goal.short || !(barW > 0)) return { label: goal.label, text: goal.text };
  const text = goal.text ?? '';
  if (goalFitsWhole(goal.label, text, barW)) return { label: goal.label, text: goal.text };
  if (goalFitsWhole(goal.short, text, barW)) return { label: goal.short, text: goal.text };
  // the narrowest bars (three chips beside it): the short line alone may still not fit whole, so the tiny one, if it has one
  if (goal.tiny && !goalFitsWhole(goal.short, '', barW)) return { label: goal.tiny, text: '' };
  return { label: goal.short, text: '' };
}

// ---------- the chapter goal (v5.21, U1) ----------

/** The tasks drawer's tab a tap on the goal bar (or the clipboard) opens. */
export const GOAL_TAB: TasksTab = 'story';
/** The tasks tab a `tasks` route param asks for ('story' from a tap on a chapter-locked lot in the City), or null for no (or a stray) value. */
export function tasksParamTab(param: string | string[] | undefined): TasksTab | null {
  const v = Array.isArray(param) ? param[0] : param;
  return v === 'story' || v === 'daily' || v === 'weekly' ? v : null;
}
/** How long the bar flashes when a task completes (ms): once, and short. */
export const GOAL_FLASH_MS = 500;

/** The goal the bar draws: its words in three lengths, the amount beside them, and the fill. */
export interface ChapterGoal {
  /** "Ch 2 · Serve 424 pies in Downtown". */
  label: string;
  /** G98: the same without the shop and what follows a comma ("Ch 2 · Serve 424 pies", "Ch 2 · Hire Lucia"), for a narrow bar. */
  short: string;
  /** The narrowest bar: the chapter and the count, or the task's first word ("Ch 2 · 212/424", "Ch 2 · Hire"): whole words only. */
  tiny: string;
  /** The amount beside the words: "212/424", the countdown "1:29", "Ready" ('' for a yes/no task). */
  text: string;
  current: number;
  target: number;
  /** What the goal is: the task's key (the chapter's while it waits), so the bar flashes once when it changes. */
  key: string;
  /** The chapter's wait is over and its scene plays now: a full basil bar that says "Ready". */
  ready: boolean;
}

/** The label without its shop ("Serve 424 pies in Downtown" → "Serve 424 pies"), for a narrow bar; a label that does not end with the shop is as it was. */
export function withoutShop(label: string, shopName: string): string {
  const tail = ` in ${shopName}`;
  return label.endsWith(tail) ? label.slice(0, -tail.length) : label;
}

/**
 * G117: a task's label made short for a narrow bar, never cutting inside a word: the shop goes ("Serve 424 pies in Downtown" \u2192 "Serve 424 pies",
 * "Build your Suburbs shop" \u2192 "Build Suburbs", "Read the Downtown shop report" \u2192 "Read the shop report"), and so does what follows a comma
 * ("Hire Lucia, head baker" \u2192 "Hire Lucia").
 */
export function shortTask(label: string, shopName: string): string {
  const short = withoutShop(label, shopName).replace(`your ${shopName} shop`, shopName).replace(`the ${shopName} shop`, 'the shop').replace(/,.*$/, '');
  return short.trim() || label;
}

/** The narrowest bar's name for a yes/no task: as many whole words of the short label as fit in 10 characters, at least one ("Hire Lucia", "Build", "Beat", "Pier 9"). */
export function firstWord(label: string): string {
  const words = goalWords(label);
  let out = words[0] ?? label;
  for (const w of words.slice(1)) {
    if (out.length + 1 + w.length > 10) break;
    out += ` ${w}`;
  }
  return out;
}

/** D532: what a hire or a build task costs, or null for any other task (and for a hire that is not on offer): the bar shows the cash against it. */
export function taskPrice(g: GameState, task: ChapterTask): number | null {
  if (task.kind === 'build') return def(task.shop, cityOf(g)).buildCost;
  if (task.kind !== 'hire' || !task.head) return null;
  const price = task.head === 'manager' ? upgradeCostOf(g, task.shop, 'manager') : headCost(task.shop, task.head, cityOf(g));
  return price !== null && price > 0 ? price : null;
}

/**
 * The goal bar's chapter goal: the engine's next task (`nextTask`) of the chapter the player is on, with its progress; or, once every task is done,
 * "Next scene" with the countdown in the amount's place and a basil "Ready" only when the wait is over. Null after the last chapter (the caller shows
 * the mastery goal, then the story count). The words and the progress are the Story tab's own (`storyTask`, rewards-model), so the bar and the list
 * never disagree; only the next task is formatted (U31). `lastSceneEndPlay` is the store's (the pacing's clock).
 */
export function chapterGoal(g: GameState, lastSceneEndPlay: number | null = null): ChapterGoal | null {
  const chapter = currentChapter(g);
  if (!chapter) return null;
  const ch = `Ch ${chaptersOf(g).indexOf(chapter) + 1}`;
  const row = nextTask(g);
  if (row) {
    const shown = storyTask(g, row.task);
    const shop = def(row.task.shop, cityOf(g)).name;
    // a kind with its own short line in the copy ("Beat MegaSlice"), else the label made short
    const own = lineOf(`task.kind.${row.task.kind}.short`, g.city);
    const short = own !== undefined ? t(`task.kind.${row.task.kind}.short`, { target: row.task.target, shop }, g.city) : shortTask(shown.label, shop);
    // a hire or a build is paid for in cash: the bar shows the cash against that task's own price ("$12 / $400"); it still never offers the purchase
    const price = taskPrice(g, row.task);
    return {
      label: `${ch} \u00B7 ${shown.label}`,
      short: `${ch} \u00B7 ${short}`,
      tiny: `${ch} \u00B7 ${shown.progress || firstWord(short)}`,
      text: price !== null ? goalAmount(g.cash, price) : shown.progress,
      current: price !== null ? g.cash : shown.pct * row.target,
      target: price !== null ? price : row.target,
      key: row.task.key,
      ready: false,
    };
  }
  // every task is done: the countdown to the beat (the pacing's gap), "Ready" at 0:00; held by something else, the chapter's title stands in
  const key = `${chapter.key}.ready`;
  const wait = chapterReady(g, lastSceneEndPlay);
  if (!wait) {
    const title = `${ch} \u00B7 ${t(`${chapter.key}.title`, {}, g.city)}`;
    return { label: title, short: title, tiny: `${ch} \u00B7 Done`, text: '', current: 1, target: 1, key, ready: false };
  }
  const next = t('chapter.ready', { time: '' }, g.city).trim();
  const text = wait.secondsLeft > 0 ? clockText(wait.secondsLeft) : 'Ready';
  return {
    label: `${ch} \u00B7 ${next}`,
    short: `${ch} \u00B7 ${next}`,
    tiny: `${ch} \u00B7 ${text}`,
    text,
    current: 1,
    target: 1,
    key,
    ready: wait.secondsLeft === 0,
  };
}

// ---------- the cheer (D541) ----------

/** How long the chapter ribbon stays up (ms), after it has faded in. */
export const CHEER_RIBBON_MS = 1800;

/** What the bar celebrates when its task changes: a task done (a toast), or the chapter's last (a ribbon). */
export interface GoalCheer {
  chapter: boolean;
  /** "Serve 424 pies in Downtown" for a task; "Chapter 2 complete" for a chapter. */
  text: string;
}

/**
 * D541: the goal moved from `prev` to `next` (the chapter goal's key and label). A task done: its words; the last task of a chapter, or the move to the
 * next chapter: "Chapter N complete". Null when nothing was done: no goal before, the same one, or the wait for a scene ending (the beat played).
 */
export function goalCheer(prev: { key: string; label: string } | null, next: { key: string; label: string } | null): GoalCheer | null {
  if (!prev || !next || prev.key === next.key || prev.key.endsWith('.ready')) return null;
  const [ch, ...words] = prev.label.split(' \u00B7 ');
  const nextCh = next.label.split(' \u00B7 ')[0];
  const n = /^Ch (\d+)$/.exec(ch)?.[1];
  if (next.key.endsWith('.ready') || nextCh !== ch) return { chapter: true, text: n ? `Chapter ${n} complete` : 'Chapter complete' };
  return { chapter: false, text: words.join(' \u00B7 ') };
}
