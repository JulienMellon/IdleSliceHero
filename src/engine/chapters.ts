// Chapters (v5.21, card E1): every main beat of the home city has a chapter of 2-4 visible tasks, and the beat plays when the chapter is done
// (and, as always, one beat per 90 s). The data is `CityDef.chapters`; this file is the progress of a task, the tick that keeps the held counters,
// the selectors the goal bar and the task list read, and the load-time migration.
//   - A task is an outcome, never a purchase (`ChapterTaskKind`). `serve`, `hire`, `build`, `win`, `bid` and `playtime` are read from the save as it is.
//   - `rate` (pizzas a minute, held 30 s) and `noMissed` (no missed orders for N s) are counted by `chaptersTick` while the app is open, only for the
//     chapters that are open (`openChapters`), and the best value held is saved so a task can't un-tick.
//   - A done task stays done: `done` in the save holds the keys.
// The slice lives at `GameState.x.chapters` (no feature owns it: a franchise keeps what no feature owns, and the new city has no chapters to read it).
// It is absent until something is counted (`saveOf` reads an absent slice as empty), so a new game's `x` is the features' alone.
import { cityOf } from '../content/cities';
import type { Chapter, ChapterTask } from '../content/cities/types';
import type { NeighborhoodId, Scene } from '../content/types';
import { challengeWon } from './features/layers/rival';
import { flowOf, missedOf } from './features/service';
import { STORE_INTRO_START, type GameState } from './game';
import { rewardsUnlocked } from './rewards';
import { sceneWaitSeconds, scenesById, triggerPasses } from './story';

export const CHAPTERS_KEY = 'chapters';

/** How long a `rate` must hold, in play seconds. */
export const RATE_HOLD_SECONDS = 30;
/** Missed orders under this many pizzas a minute count as none. */
const MISSED_EPS = 1e-6 * 60;
/**
 * The shop report has a reader (v5.22, card E3/E4): the store sets `report` in the save when the player opens the sheet, and the `report` task reads it.
 * With no reader (false) the task would be done by itself and kept out of the list, so it could not hold a beat back for something the player cannot do.
 */
export const REPORT_READER = true;

export interface ChapterSave {
  /** Keys (`task.<scene>.<n>`) of the tasks that are done. */
  done: string[];
  /** Per task key: the best `rate` held for 30 s, or the longest `noMissed` run, in the task's own unit. */
  best: Record<string, number>;
  /** Per `rate` task key: the window being measured (the lowest rate seen in it and how long it has run). */
  run: Record<string, { lo: number; secs: number }>;
  /** Per `noMissed` task key: seconds in a row with no missed orders, now. */
  calm: Record<string, number>;
  /** The shop report has been opened (set by v5.22). */
  report: boolean;
  /** The "nobody walks out hungry" payoff (Missed reaching 0 on the sheet: the flash, the coins and Nonna's line) has played once (D556). */
  missedZero: boolean;
  /** Coach sequences played or under way (card E4): `report:strip`, `report:bar:ovens`, `report:demand` as each step is seen, then `report` once it has ended. Never shown again. */
  coachDone: string[];
  /** Diamonds earned by chapters whose beats played before the rewards unlocked: paid when they do (VERSION.md "Defaults"). */
  banked: number;
}

export const newChapterSave = (): ChapterSave => ({ done: [], best: {}, run: {}, calm: {}, report: false, missedZero: false, coachDone: [], banked: 0 });

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);
const numMap = (v: unknown): Record<string, number> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(
        Object.entries(v as Record<string, unknown>)
          .filter((e) => typeof e[1] === 'number' && Number.isFinite(e[1]))
          .map((e) => [e[0], num(e[1])]),
      )
    : {};

/** A saved slice, checked field by field; anything broken is dropped. Null when there is no slice (a new game, a save from before chapters). */
export function migrateChapterSave(raw: unknown): ChapterSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const run: ChapterSave['run'] = {};
  if (r.run && typeof r.run === 'object')
    for (const [k, v] of Object.entries(r.run as Record<string, unknown>)) {
      const o = v as Record<string, unknown> | null;
      if (o && typeof o === 'object') run[k] = { lo: num(o.lo), secs: Math.min(RATE_HOLD_SECONDS, num(o.secs)) };
    }
  return {
    done: Array.isArray(r.done) ? (r.done as unknown[]).filter((x): x is string => typeof x === 'string') : [],
    best: numMap(r.best),
    run,
    calm: numMap(r.calm),
    report: r.report === true,
    missedZero: r.missedZero === true,
    coachDone: Array.isArray(r.coachDone) ? [...new Set((r.coachDone as unknown[]).filter((x): x is string => typeof x === 'string'))] : [],
    banked: Math.floor(num(r.banked)),
  };
}

/** The shop report has been opened (the store's `reportOpened` action calls this when the sheet opens); the chapter task `report` reads it. `g` itself when it already was. */
export function markReportOpened(g: GameState): GameState {
  const c = saveOf(g);
  return c.report ? g : withSave(g, { ...c, report: true });
}

/** The payoff for Missed reaching 0 has played (D556): it never plays again. `g` itself when it already had. */
export function markMissedZeroShown(g: GameState): GameState {
  const c = saveOf(g);
  return c.missedZero ? g : withSave(g, { ...c, missedZero: true });
}

/** Record a coach step or sequence as seen (see `ChapterSave.coachDone`). `g` itself when it already was. */
export function markCoachDone(g: GameState, id: string): GameState {
  const c = saveOf(g);
  return c.coachDone.includes(id) ? g : withSave(g, { ...c, coachDone: [...c.coachDone, id] });
}

/** The saved slice (a state with none reads as empty). */
export const saveOf = (g: Pick<GameState, 'x'>): ChapterSave => (g.x?.[CHAPTERS_KEY] as ChapterSave | undefined) ?? EMPTY;
const EMPTY: ChapterSave = Object.freeze(newChapterSave()) as ChapterSave;
const withSave = (g: GameState, c: ChapterSave): GameState => ({ ...g, x: { ...g.x, [CHAPTERS_KEY]: c } });

// ---------- the data, by scene ----------

const BY_SCENE = new WeakMap<readonly Chapter[], ReadonlyMap<string, Chapter>>();
/** The city's chapters in story order (none for a city without any). */
export const chaptersOf = (g: Pick<GameState, 'city'>): readonly Chapter[] => cityOf(g).chapters ?? NONE;
const NONE: readonly Chapter[] = [];

/** The chapter that leads to a scene, or undefined (an interlude, a hire scene, a city without chapters). */
export function chapterOf(g: Pick<GameState, 'city'>, scene: string): Chapter | undefined {
  const list = chaptersOf(g);
  let m = BY_SCENE.get(list);
  if (!m) BY_SCENE.set(list, (m = new Map(list.map((c) => [c.sceneId, c]))));
  return m.get(scene);
}

// ---------- progress ----------

export interface TaskProgress {
  current: number;
  target: number;
  done: boolean;
}

const clamp = (x: number, target: number) => Math.min(target, Math.max(0, x));
const yes = (on: boolean, target: number): TaskProgress => ({ current: on ? target : 0, target, done: on });

/** How far a task is: read from the save, never from a screen. A done task stays done. */
export const taskProgress = (g: GameState, task: ChapterTask): TaskProgress => progressFrom(saveOf(g), g, task);

/** `taskProgress` against a slice that is not (yet) in `g` (the tick's own working copy: no state is built per task). */
function progressFrom(c: ChapterSave, g: GameState, task: ChapterTask): TaskProgress {
  const { target } = task;
  if (c.done.includes(task.key)) return { current: target, target, done: true };
  const shop = g.shops[task.shop];
  switch (task.kind) {
    case 'serve': {
      const current = clamp(shop?.sold ?? 0, target);
      return { current, target, done: current >= target };
    }
    case 'build':
      return yes(!!shop?.built, target);
    case 'hire':
      return yes(!!shop && (shop.managed || (task.head !== undefined && task.head !== 'manager' && shop.heads[task.head])), target);
    case 'win':
      return yes(challengeWon(g, task.shop), target);
    case 'bid':
      return yes(!!shop?.perk, target);
    case 'rate':
    case 'noMissed': {
      const current = clamp(Math.max(c.best[task.key] ?? 0, task.kind === 'noMissed' ? (c.calm[task.key] ?? 0) : 0), target);
      return { current, target, done: current >= target };
    }
    case 'playtime': {
      const from = task.scene !== undefined && g.seenScenes.includes(task.scene) ? (g.sceneAt[task.scene] ?? 0) : null;
      const current = from === null ? 0 : clamp(g.playSeconds - from, target);
      return { current, target, done: current >= target };
    }
    case 'report':
      return yes(!REPORT_READER || c.report, target);
  }
}

/** The chapter is done: its beat has played, or every task is done. */
export const chapterDone = (g: GameState, chapter: Chapter): boolean =>
  g.seenScenes.includes(chapter.sceneId) || chapter.tasks.every((t) => taskProgress(g, t).done);

// ---------- which chapters are open ----------

/**
 * The chapters whose held tasks are being counted: for each neighbourhood, its first chapter that has not played, once the chapter before it in
 * the story has played or the shop is built. (The shop that is not built yet cannot have its own `rate`, but beat 1's teaching task counts the
 * shop before it, so a chapter opens when the one before it ends.) Never every chapter at once: a late chapter's `noMissed` must not tick early.
 */
export function openChapters(g: GameState): Chapter[] {
  const list = chaptersOf(g);
  if (!list.length) return [];
  const seen = new Set(g.seenScenes);
  const byId = scenesById(cityOf(g).scenes);
  const taken = new Set<string>();
  const out: Chapter[] = [];
  list.forEach((c, i) => {
    if (seen.has(c.sceneId)) return;
    const hood = byId.get(c.sceneId)?.neighborhood;
    if (hood === undefined || taken.has(hood)) return;
    taken.add(hood);
    if (i === 0 || seen.has(list[i - 1].sceneId) || g.shops[hood]?.built) out.push(c);
  });
  return out;
}

// ---------- the tick ----------

/**
 * Count the held tasks of the open chapters for `dt` seconds of play and record every task that is newly done. `g` itself when nothing changed.
 * `rate`: the lowest pizzas-a-minute (the shop's flow) in each 30 s window; a window's lowest value is banked in `best`. `noMissed`: the seconds in
 * a row the shop's report (`missedOf`) shows no missed orders. Both read the flow as it is now: a shop's rate changes when the player buys, not between ticks.
 */
export function chaptersTick(g: GameState, dt: number, now: number): GameState {
  if (!(dt > 0)) return g;
  const open = openChapters(g);
  if (!open.length) return g;
  const c = saveOf(g);
  let cur = c;
  let changed = false;
  for (const ch of open) {
    for (const t of ch.tasks) {
      if (cur.done.includes(t.key)) continue;
      if (t.kind === 'rate' || t.kind === 'noMissed') {
        if (!g.shops[t.shop]?.built) continue;
        if (t.kind === 'rate') {
          const r = flowOf(g, t.shop, now).sold * 60;
          const w = cur.run[t.key];
          const lo = w === undefined ? r : Math.min(w.lo, r);
          const secs = (w?.secs ?? 0) + dt;
          if (secs >= RATE_HOLD_SECONDS) {
            if (lo > (cur.best[t.key] ?? 0)) cur = { ...cur, best: { ...cur.best, [t.key]: lo } };
            cur = { ...cur, run: { ...cur.run, [t.key]: { lo: r, secs: 0 } } };
          } else cur = { ...cur, run: { ...cur.run, [t.key]: { lo, secs } } };
        } else {
          const n = missedOf(g, t.shop, now) <= MISSED_EPS ? (cur.calm[t.key] ?? 0) + dt : 0;
          cur = { ...cur, calm: { ...cur.calm, [t.key]: n } };
          if (n > (cur.best[t.key] ?? 0)) cur = { ...cur, best: { ...cur.best, [t.key]: n } };
        }
        changed = true;
      }
      if (progressFrom(cur, g, t).done) {
        cur = { ...cur, done: [...cur.done, t.key] };
        changed = true;
      }
    }
  }
  return changed ? withSave(g, cur) : g;
}

// ---------- the chapter's diamonds ----------

/** The diamonds a finished chapter pays besides its scene, once the rewards are unlocked (before that they are banked and paid at unlock). */
export const CHAPTER_DIAMONDS = 5;

/** The diamonds a chapter pays when its beat plays: a `free` chapter (the opening's) pays none. */
export const chapterDiamonds = (c: Chapter): number => (c.free ? 0 : CHAPTER_DIAMONDS);

/**
 * `next` is the state just after `scene` was seen: pay its chapter's diamonds (a `free` chapter has none, and a scene with no chapter none). Until
 * the rewards unlock they are banked in the chapters' slice, and everything banked is paid on the scene that unlocks them (`downtown-4` at home).
 * The scene is only ever seen once, so a chapter pays once.
 */
export function payChapter(next: GameState, scene: Scene): GameState {
  const chapter = chapterOf(next, scene.id);
  const c = saveOf(next);
  const owed = c.banked + (chapter ? chapterDiamonds(chapter) : 0);
  if (owed <= 0) return next;
  if (!rewardsUnlocked(next)) return owed === c.banked ? next : withSave(next, { ...c, banked: owed });
  const paid = c.banked > 0 ? withSave(next, { ...c, banked: 0 }) : next;
  return { ...paid, rewards: { ...paid.rewards, diamonds: paid.rewards.diamonds + owed } };
}

// ---------- selectors ----------

/**
 * The chapter the player is on: the first in the story whose beat has not played, or null after the last. A `free` chapter (the opening's: its beat
 * plays at the start and waits for nothing) stays current after its beat until every task is done, so the tutorial's tasks show on the bar and the
 * Story tab; it gates no beat and pays nothing, and the chapter after it counts in the background meanwhile (`openChapters`).
 */
export function currentChapter(g: GameState): Chapter | null {
  return chaptersOf(g).find((c) => !(g.seenScenes.includes(c.sceneId) && (!c.free || c.tasks.every((t) => taskProgress(g, t).done)))) ?? null;
}

export interface TaskRow {
  task: ChapterTask;
  current: number;
  target: number;
  done: boolean;
}

/** The tasks of a chapter the player is shown: a `report` task is done by itself until the report has a reader, so it stays out of the list (D539). */
export const visibleTasks = (c: Chapter): ChapterTask[] => (REPORT_READER ? c.tasks : c.tasks.filter((t) => t.kind !== 'report'));

/** The current chapter's tasks with their progress, in order (empty after the last chapter). */
export function chapterTasks(g: GameState): TaskRow[] {
  const c = currentChapter(g);
  return c ? visibleTasks(c).map((task) => ({ task, ...taskProgress(g, task) })) : [];
}

/**
 * The task the bar shows: the first one not done that the player can act on (a hire, a build, a win, a bid, a held rate), before a long `serve`
 * count that only time and the other tasks move (D533). The opening's chapter (`free`: the tutorial's order) and a chapter with only `serve` left
 * go in order. Null when every task is done, or there is no chapter.
 */
export function nextTask(g: GameState): TaskRow | null {
  const open = chapterTasks(g).filter((r) => !r.done);
  if (currentChapter(g)?.free) return open[0] ?? null;
  return open.find((r) => r.task.kind !== 'serve') ?? open[0] ?? null;
}

/**
 * The current chapter is done and its beat is waiting on the story's pacing: `secondsLeft` is what is left of the 90 s between beats (and of the
 * longer waits before a beat 4), 0 when it plays now. Null while a task is open, a scene it requires has not played, or there is no chapter.
 * `lastSceneEndPlay` is the play time the last scene ended this session (the store's), or null right after a launch.
 */
export function chapterReady(g: GameState, lastSceneEndPlay: number | null = null): { secondsLeft: number } | null {
  const c = currentChapter(g);
  const scene: Scene | undefined = c ? scenesById(cityOf(g).scenes).get(c.sceneId) : undefined;
  if (!c || c.free || !scene || !chapterDone(g, c) || scene.requires?.some((id) => !g.seenScenes.includes(id))) return null;
  if (!triggerPasses(g, scene)) return null;
  return { secondsLeft: sceneWaitSeconds(g, scene, lastSceneEndPlay) };
}

// ---------- the build gate (v5.21, card E1b) ----------

/** The beat of the shop before it that must have played before the next shop can be built (its finale, beat 4, is the one the story's own waits and a won challenge or the bid decide). */
export const BUILD_GATE_BEAT = 3;

/**
 * The chapter that holds back the build of shop `id`: while the gate beat (`BUILD_GATE_BEAT`) of the shop before it in the city has not played, the
 * chapter the player is on (the one the Story tab shows, so the lock line and the tab name the same number). The next shop waits for the story of the one the player would leave
 * behind, so a chapter whose tasks need that shop (a `rate`, a `serve`, a hire) is never left to stall behind a shop built too early. Null when
 * nothing holds it: the first shop, a city without chapters (Boston), an id that is not in this city, or the shop before it has played that far.
 * Interludes and hire scenes have no chapter and never hold a build. (A shop already built is the caller's: `buildLock` says "Built" before it asks,
 * so a save that already owns a later shop is never locked out.)
 */
export function buildChapter(g: GameState, id: NeighborhoodId): Chapter | null {
  const list = chaptersOf(g);
  if (!list.length) return null;
  const hoods = cityOf(g).neighbourhoods;
  const idx = hoods.findIndex((n) => n.id === id);
  if (idx < 1) return null;
  const byId = scenesById(cityOf(g).scenes);
  const theirs = list.filter((c) => byId.get(c.sceneId)?.neighborhood === hoods[idx - 1].id);
  // the gate beat or any later one of the shop has played (a beat 4 seen without its beat 3 is a state the dev jumps and old saves can have)
  const from = theirs.findIndex((c) => byId.get(c.sceneId)?.beat === BUILD_GATE_BEAT);
  if (from < 0 || theirs.slice(from).some((c) => g.seenScenes.includes(c.sceneId))) return null;
  // the chapter the Story tab shows (D546): the player's next one, which is never later than the shop's own (the story is told in order)
  return currentChapter(g) ?? theirs.find((c) => !g.seenScenes.includes(c.sceneId)) ?? null;
}

/** The chapter's number in the story (1-based), as the Story tab and the build line print it. */
export const chapterNumber = (g: Pick<GameState, 'city'>, c: Chapter): number => chaptersOf(g).indexOf(c) + 1;

// ---------- migration ----------

/**
 * A save from before chapters (saveVersion < 8): the chapters whose beats have played need nothing (a played beat's chapter is done); in the
 * chapters that are open now the tasks tick from the save: a chapter whose own trigger has already passed (the beat is waiting) is done whole,
 * one that is still short has its `rate` tasks done where the shop already sells that fast (the held counters start from here).
 */
export function migrateChapters(g: GameState, fromVersion: number): GameState {
  if (fromVersion >= 8) return g;
  const scenes = scenesById(cityOf(g).scenes);
  const c = saveOf(g);
  let done = c.done;
  // the opening's chapter (`free`): a save whose tutorial is over counts it done, whatever the tutorial left undone; one that is still in it keeps its tasks
  for (const ch of chaptersOf(g))
    if (ch.free && g.seenScenes.includes(ch.sceneId) && g.tutorial >= STORE_INTRO_START)
      for (const t of ch.tasks) if (!done.includes(t.key)) done = [...done, t.key];
  for (const ch of openChapters(g)) {
    const scene = scenes.get(ch.sceneId);
    const waiting = !!scene && triggerPasses(g, scene);
    for (const t of ch.tasks) {
      if (done.includes(t.key)) continue;
      const now = t.kind === 'rate' && g.shops[t.shop]?.built ? flowOf(g, t.shop, g.lastSavedAt).sold * 60 >= t.target : false;
      if (waiting || now || taskProgress(g, t).done) done = [...done, t.key];
    }
  }
  return done === c.done ? g : withSave(g, { ...c, done });
}
