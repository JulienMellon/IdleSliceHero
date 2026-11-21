// v5.21 (card E1): chapters. The data matches the story's triggers, the gate holds a beat until its chapter is done, the held tasks count while the
// app is open, the selectors say what is next, and a save from before chapters loads on the right chapter.
import '../features';
import { HOME_CHAPTERS } from '../../content/cities/home/chapters';
import { HOME_SCENES } from '../../content/scenes/home';
import { LAYER_KEYS } from '../../content/layers';
import { STORY_PACING } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import {
  CHAPTER_DIAMONDS,
  chapterDone,
  chapterOf,
  chapterReady,
  chaptersTick,
  chapterTasks,
  currentChapter,
  migrateChapterSave,
  nextTask,
  openChapters,
  saveOf,
  taskProgress,
  visibleTasks,
} from '../chapters';
import { pickScene } from '../cutscene-input';
import { flowOf } from '../features/service';
import * as G from '../game';
import { sceneTriggered, sceneWaitSeconds } from '../story';
import { sceneReady } from '../cutscene-input';
import { ALL_TASK_KEYS, withTasksDone } from './chapter-helpers';

const scene = (id: string) => HOME_SCENES.find((s) => s.id === id)!;
const chapter = (id: string) => HOME_CHAPTERS.find((c) => c.sceneId === id)!;
const task = (id: string, n: number) => chapter(id).tasks[n - 1];
const HOODS: NeighborhoodId[] = ['downtown', 'suburbs', 'waterfront', 'university', 'industrial', 'uptown'];
const MAIN = HOME_SCENES.filter((s) => typeof s.beat === 'number');
const withShop = (s: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({
  ...s,
  shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } },
});
const saved = (s: G.GameState, patch: Partial<ReturnType<typeof saveOf>>): G.GameState => ({ ...s, x: { ...s.x, chapters: { ...saveOf(s), ...patch } } });
const OPENING = chapter('downtown-1').tasks.map((t) => t.key);
/** A player past the tutorial: the opening's tasks are done (`free` chapter 1 stays current until they are), `ids` have been seen. */
const seen = (ids: string[], extra: Partial<G.GameState> = {}): G.GameState => {
  const g = G.newGame(0);
  return { ...g, seenScenes: ids, x: { ...g.x, chapters: { ...saveOf(g), done: OPENING } }, ...extra };
};
/** Every scene before `id` in the story has been seen. */
const before = (id: string, extra: Partial<G.GameState> = {}): G.GameState =>
  seen(
    HOME_SCENES.slice(
      0,
      HOME_SCENES.findIndex((s) => s.id === id),
    ).map((s) => s.id),
    extra,
  );
const LATE = 1e9;

describe('the data', () => {
  it('has one chapter for each of the 24 main beats, in story order, and none for an interlude or a hire scene', () => {
    expect(MAIN).toHaveLength(24);
    expect(HOME_CHAPTERS.map((c) => c.sceneId)).toEqual(MAIN.map((s) => s.id));
    for (const s of HOME_SCENES.filter((x) => typeof x.beat !== 'number')) expect(HOME_CHAPTERS.some((c) => c.sceneId === s.id)).toBe(false);
    expect(HOME_CHAPTERS.map((c) => c.sceneId)).toEqual(
      HOODS.flatMap((h) => [1, 2, 3, 4].map((n) => `${h}-${n}`)).sort((a, b) => MAIN.findIndex((s) => s.id === a) - MAIN.findIndex((s) => s.id === b)),
    );
  });

  it('gives every chapter 2 to 4 tasks with unique keys that the copy table can name', () => {
    const keys = HOME_CHAPTERS.flatMap((c) => c.tasks.map((t) => t.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(ALL_TASK_KEYS);
    for (const c of HOME_CHAPTERS) {
      expect(c.tasks.length).toBeGreaterThanOrEqual(2);
      expect(c.tasks.length).toBeLessThanOrEqual(4);
      expect(c.key).toBe(`chapter.${c.sceneId}`);
      c.tasks.forEach((t, i) => expect(t.key).toBe(`task.${c.sceneId}.${i + 1}`));
    }
  });

  it('makes task 1 the scene’s trigger, with its own number', () => {
    for (const c of HOME_CHAPTERS) {
      const tr = scene(c.sceneId).trigger;
      const t = c.tasks[0];
      expect(t.shop).toBe(tr.neighborhood);
      if (tr.kind === 'deliveries') expect([t.kind, t.target]).toEqual(['serve', tr.count]);
      else if (tr.kind === 'unlock') expect(t.kind).toBe(c.sceneId === 'downtown-1' ? 'serve' : 'build');
      else if (tr.kind === 'challenge') expect(t.kind).toBe('win');
      else if (tr.kind === 'bid') expect(t.kind).toBe('bid');
      else throw new Error(`a main beat with a ${tr.kind} trigger`);
    }
  });

  it('only teaches with hire, rate, noMissed and report after task 1, and never asks for a purchase', () => {
    for (const c of HOME_CHAPTERS) for (const t of c.tasks.slice(1)) expect(['hire', 'rate', 'noMissed', 'report', 'serve']).toContain(t.kind);
    for (const c of HOME_CHAPTERS)
      for (const t of c.tasks) expect(['serve', 'rate', 'hire', 'build', 'win', 'bid', 'noMissed', 'playtime', 'report']).toContain(t.kind);
  });

  it('is the opening chapter alone that does not hold its beat (the tutorial)', () => {
    expect(HOME_CHAPTERS.filter((c) => c.free).map((c) => c.sceneId)).toEqual(['downtown-1']);
  });
});

describe('task progress', () => {
  const base = G.newGame(0);
  it('serve counts the shop’s sold pizzas, clamped to the target', () => {
    const t = task('downtown-2', 1);
    expect(taskProgress(withShop(base, 'downtown', { sold: 100 }), t)).toEqual({ current: 100, target: 424, done: false });
    expect(taskProgress(withShop(base, 'downtown', { sold: 9999 }), t)).toEqual({ current: 424, target: 424, done: true });
  });
  it('hire reads the shop’s head, and a manager has them all', () => {
    const t = task('downtown-2', 2);
    expect(t.head).toBe('oven');
    expect(taskProgress(base, t).done).toBe(false);
    expect(taskProgress(withShop(base, 'downtown', { heads: { ...base.shops.downtown.heads, prep: true } }), t).done).toBe(false);
    expect(taskProgress(withShop(base, 'downtown', { heads: { ...base.shops.downtown.heads, oven: true } }), t).done).toBe(true);
    expect(taskProgress(withShop(base, 'downtown', { managed: true }), t).done).toBe(true);
  });
  it('build, win and bid read the save', () => {
    expect(taskProgress(base, task('suburbs-1', 1)).done).toBe(false);
    expect(taskProgress(withShop(base, 'suburbs', { built: true }), task('suburbs-1', 1)).done).toBe(true);
    expect(taskProgress(base, task('suburbs-4', 1)).done).toBe(false);
    const won = { ...base, x: { ...base.x, [LAYER_KEYS.rival]: { won: ['suburbs'], challenge: null, retryAt: {} } } };
    expect(taskProgress(won, task('suburbs-4', 1)).done).toBe(true);
    expect(taskProgress(base, task('waterfront-4', 1)).done).toBe(false);
    expect(taskProgress(withShop(base, 'waterfront', { perk: true }), task('waterfront-4', 1)).done).toBe(true);
  });
  it('playtest counts play seconds from the scene it names', () => {
    const t = { kind: 'playtime' as const, shop: 'downtown' as NeighborhoodId, target: 180, key: 'task.x.1', scene: 'downtown-2' };
    expect(taskProgress({ ...base, playSeconds: 500 }, t)).toEqual({ current: 0, target: 180, done: false });
    const s = { ...base, seenScenes: ['downtown-2'], sceneAt: { 'downtown-2': 100 } };
    expect(taskProgress({ ...s, playSeconds: 160 }, t)).toEqual({ current: 60, target: 180, done: false });
    expect(taskProgress({ ...s, playSeconds: 400 }, t).done).toBe(true);
  });
  it('report is done by itself until the report has a reader', () => {
    expect(taskProgress(base, task('downtown-3', 3)).done).toBe(true);
  });
  it('a done task stays done', () => {
    const t = task('downtown-2', 2);
    const s = saved(base, { done: [t.key] });
    expect(taskProgress(s, t)).toEqual({ current: 1, target: 1, done: true });
  });
});

describe('the gate', () => {
  const dt2 = () => before('downtown-2', { playSeconds: 1000 });
  it('holds a beat whose count has passed until its chapter is done', () => {
    const s = withShop(dt2(), 'downtown', { sold: 424 });
    expect(sceneTriggered(s, scene('downtown-2'))).toBe(false);
    expect(pickScene(s, HOME_SCENES, LATE, 0, false, null)).toBeNull();
    const oven = withShop(s, 'downtown', { heads: { prep: true, oven: true, counter: false } });
    expect(sceneTriggered(oven, scene('downtown-2'))).toBe(false); // the rate task is still open
    const rate = saved(oven, { best: { [task('downtown-2', 3).key]: 6 } });
    expect(sceneTriggered(rate, scene('downtown-2'))).toBe(true);
    expect(pickScene(rate, HOME_SCENES, LATE, 0, false, null)?.id).toBe('downtown-2');
  });
  it('never plays a beat before its own trigger, whatever the tasks say', () => {
    const s = withTasksDone(withShop(dt2(), 'downtown', { sold: 423 }));
    expect(sceneTriggered(s, scene('downtown-2'))).toBe(false);
    expect(sceneTriggered(withShop(s, 'downtown', { sold: 424 }), scene('downtown-2'))).toBe(true);
  });
  it('plays the opening at once, whatever its tasks', () => {
    expect(sceneTriggered(G.newGame(0), scene('downtown-1'))).toBe(true);
  });
  it('keeps the trigger alone for a scene with no chapter (an interlude, a hire scene)', () => {
    const s = withShop(seen(['suburbs-3'], { sceneAt: { 'suburbs-3': 0 }, playSeconds: 1000 }), 'suburbs', { built: true });
    expect(chapterOf(s, 'suburbs-3b')).toBeUndefined();
    expect(sceneTriggered(s, scene('suburbs-3b'))).toBe(true);
  });
  it('keeps the trigger alone in a city with no chapters', () => {
    const boston = G.newGame(0, 'boston');
    expect(currentChapter(boston)).toBeNull();
    expect(chapterTasks(boston)).toEqual([]);
    expect(nextTask(boston)).toBeNull();
    expect(openChapters(boston)).toEqual([]);
  });
  it('a new pizzeria’s beat waits for the teaching task, then plays at once (the player caused it)', () => {
    const s = withShop(before('suburbs-1', { playSeconds: 100 }), 'suburbs', { built: true });
    expect(sceneTriggered(s, scene('suburbs-1'))).toBe(false);
    expect(chapterReady(s)).toBeNull();
    const done = saved(s, { best: { [task('suburbs-1', 2).key]: 300 } });
    expect(sceneTriggered(done, scene('suburbs-1'))).toBe(true);
    expect(chapterReady(done, 99)).toEqual({ secondsLeft: 0 });
  });
});

describe('the tick', () => {
  const live = () => withShop(before('downtown-4', { playSeconds: 100 }), 'downtown', { heads: G.allHeads() });
  const t4 = (n: number) => task('downtown-4', n);
  const run = (g: G.GameState, seconds: number, dt = 1): G.GameState => {
    for (let i = 0; i < seconds; i += dt) g = chaptersTick(g, dt, 0);
    return g;
  };

  it('opens a neighbourhood’s first unplayed chapter once the one before it has played, or its shop is built', () => {
    expect(openChapters(G.newGame(0)).map((c) => c.sceneId)).toEqual(['downtown-1']);
    expect(openChapters(before('downtown-4')).map((c) => c.sceneId)).toEqual(['downtown-4']);
    expect(openChapters(before('suburbs-1')).map((c) => c.sceneId)).toEqual(['suburbs-1']);
    // a built shop opens its chapter though the story has not got there (University before the Pier 9 bid)
    const early = withShop(before('waterfront-4'), 'university', { built: true });
    expect(openChapters(early).map((c) => c.sceneId)).toEqual(['waterfront-4', 'university-1']);
  });

  it('counts a rate only once it has held for 30 s, banks the window’s lowest, and keeps the best', () => {
    const g0 = withShop(live(), 'downtown', { prep: 12, ovens: 12, counter: 12, drivers: 12, tables: 12 });
    const r = flowOf(g0, 'downtown', 0).sold * 60;
    expect(r).toBeGreaterThan(0);
    const g1 = run(g0, 29);
    expect(saveOf(g1).best[t4(2).key] ?? 0).toBe(0);
    expect(taskProgress(g1, t4(2)).current).toBe(0);
    const g2 = run(g1, 2);
    expect(saveOf(g2).best[t4(2).key]).toBeCloseTo(r);
    expect(taskProgress(g2, t4(2)).current).toBeCloseTo(Math.min(r, t4(2).target));
    // a window that dipped banks its lowest: the shop falls back to a slow kitchen for the next 30 s and the best stays
    const slow = withShop(g2, 'downtown', { prep: 1, ovens: 1, counter: 1 });
    const g3 = run(slow, 31);
    expect(flowOf(slow, 'downtown', 0).sold * 60).toBeLessThan(r);
    expect(saveOf(g3).best[t4(2).key]).toBeCloseTo(r);
  });

  it('records a window’s lowest rate, not the rate at its end', () => {
    const fast = withShop(live(), 'downtown', { prep: 12, ovens: 12, counter: 12, drivers: 12, tables: 12 });
    const slow = withShop(fast, 'downtown', { prep: 1, ovens: 1, counter: 1 });
    const g = run(withShop(run(fast, 20), 'downtown', { prep: 1, ovens: 1, counter: 1 }), 11);
    expect(saveOf(g).best[t4(2).key]).toBeCloseTo(flowOf(slow, 'downtown', 0).sold * 60);
  });

  it('records a done task, and never a task of a chapter that is not open', () => {
    const g = run(withShop(before('downtown-4', { playSeconds: 100 }), 'downtown', { sold: 5000 }), 1);
    expect(saveOf(g).done).toContain(t4(1).key);
    const early = run(G.newGame(0), 5);
    expect(saveOf(early).done.every((k) => k.startsWith('task.downtown-1.'))).toBe(true);
    expect(saveOf(early).run[t4(2).key]).toBeUndefined();
    expect(saveOf(early).calm[t4(3).key]).toBeUndefined();
  });

  it('counts the seconds in a row with no missed orders, starts again at the first miss, and keeps the longest', () => {
    const quiet = withShop(live(), 'downtown', { prep: 500, ovens: 500, counter: 500, drivers: 1, tables: 1 });
    const f = flowOf(quiet, 'downtown', 0);
    expect(f.wanted - f.sold).toBeLessThanOrEqual(1e-6);
    const g1 = run(quiet, 12);
    expect(saveOf(g1).calm[t4(3).key]).toBe(12);
    expect(saveOf(g1).best[t4(3).key]).toBe(12);
    const busy = withShop(g1, 'downtown', { prep: 1, ovens: 1, counter: 1, drivers: 60, tables: 60 });
    const f2 = flowOf(busy, 'downtown', 0);
    expect(f2.wanted - f2.sold).toBeGreaterThan(1e-6);
    const g2 = run(busy, 3);
    expect(saveOf(g2).calm[t4(3).key]).toBe(0);
    expect(saveOf(g2).best[t4(3).key]).toBe(12);
    expect(taskProgress(g2, t4(3)).current).toBe(12);
    // enough in a row finishes the task for good
    const g3 = run(quiet, t4(3).target);
    expect(taskProgress(g3, t4(3)).done).toBe(true);
    expect(saveOf(g3).done).toContain(t4(3).key);
    expect(taskProgress(run(withShop(g3, 'downtown', { prep: 1, ovens: 1, counter: 1, drivers: 60 }), 5), t4(3)).done).toBe(true);
  });

  it('is the same state when nothing is open', () => {
    const g = seen(HOME_SCENES.map((s) => s.id));
    expect(chaptersTick(g, 1, 0)).toBe(g);
    expect(chaptersTick(live(), 0, 0)).toEqual(live());
  });

  it('runs inside the game’s own play tick', () => {
    const g = G.playTick(live(), 31, 0);
    expect(Object.keys(saveOf(g).run).length + Object.keys(saveOf(g).best).length).toBeGreaterThan(0);
  });

  it('survives a long tick (a 40 s step is one window)', () => {
    const g = chaptersTick(live(), 40, 0);
    expect(saveOf(g).best[t4(2).key]).toBeGreaterThan(0);
  });
});

describe('the opening chapter (free)', () => {
  const opened = () => seen(['downtown-1'], { x: G.newGame(0).x });
  it('stays current after its beat has played, until every task is done, then hands over to chapter 2', () => {
    const s = opened();
    expect(currentChapter(s)?.sceneId).toBe('downtown-1');
    expect(chapterTasks(s).map((r) => r.task.kind)).toEqual(['serve', 'serve', 'hire']);
    expect(nextTask(s)?.task.key).toBe('task.downtown-1.1');
    const sold = withShop(s, 'downtown', { sold: 4 });
    expect(nextTask(sold)?.task.key).toBe('task.downtown-1.3');
    expect(currentChapter(sold)?.sceneId).toBe('downtown-1');
    const hired = withShop(sold, 'downtown', { heads: { prep: true, oven: false, counter: false } });
    expect(currentChapter(hired)?.sceneId).toBe('downtown-2');
  });
  it('is current from the start of the game too (before its beat has played)', () => {
    expect(currentChapter(G.newGame(0))?.sceneId).toBe('downtown-1');
  });
  it('gates nothing, pays nothing, and says nothing is waiting', () => {
    const s = opened();
    expect(chapterReady(s)).toBeNull();
    expect(saveOf(s).done).toEqual([]);
    // chapter 2's beat still waits for chapter 2's tasks alone
    const dt2 = withShop({ ...s, playSeconds: 1000 }, 'downtown', { sold: 424, heads: { prep: false, oven: true, counter: false } });
    expect(sceneTriggered(saved(dt2, { best: { [task('downtown-2', 3).key]: 6 } }), scene('downtown-2'))).toBe(true);
  });
  it('keeps counting chapter 2 meanwhile', () => {
    const s = withShop(opened(), 'downtown', { heads: G.allHeads() });
    expect(openChapters(s).map((c) => c.sceneId)).toEqual(['downtown-2']);
    const g = chaptersTick(s, 31, 0);
    expect(saveOf(g).best[task('downtown-2', 3).key]).toBeGreaterThan(0);
  });
  it('counts as done in a save from before chapters that is past the opening, whatever the tutorial left', () => {
    const g = G.newGame(0);
    const raw = JSON.parse(JSON.stringify({ ...g, seenScenes: ['downtown-1'], tutorial: 16, saveVersion: 7 }));
    const m = G.migrate(raw, 0);
    expect(currentChapter(m)?.sceneId).toBe('downtown-2');
    expect(saveOf(m).done).toEqual(expect.arrayContaining(OPENING));
  });
});

describe('the selectors', () => {
  it('names the current chapter, its tasks with progress, and the next task', () => {
    const s = withShop(before('downtown-2'), 'downtown', { sold: 100 });
    expect(currentChapter(s)?.sceneId).toBe('downtown-2');
    const rows = chapterTasks(s);
    expect(rows.map((r) => r.task.kind)).toEqual(['serve', 'hire', 'rate']);
    expect(rows[0]).toMatchObject({ current: 100, target: 424, done: false });
    // the bar shows what the player can act on before the long serve count
    expect(nextTask(s)?.task.key).toBe('task.downtown-2.2');
    const hired = withShop(s, 'downtown', { heads: { prep: true, oven: true, counter: false } });
    expect(nextTask(hired)?.task.key).toBe('task.downtown-2.3');
    // with only the serve left it is the serve
    expect(nextTask(saved(hired, { best: { [task('downtown-2', 3).key]: 6 } }))?.task.key).toBe('task.downtown-2.1');
    expect(nextTask(withTasksDone(s))).toBeNull();
  });
  it('is null after the last chapter', () => {
    const s = seen(HOME_SCENES.map((x) => x.id));
    expect(currentChapter(s)).toBeNull();
    expect(chapterTasks(s)).toEqual([]);
    expect(nextTask(s)).toBeNull();
    expect(chapterReady(s)).toBeNull();
  });
  it('says how long a finished chapter waits on the 90 s between beats', () => {
    const s = withTasksDone(withShop(before('downtown-3', { playSeconds: 200, sceneAt: { 'downtown-2': 150 } }), 'downtown', { sold: 941 }));
    expect(chapterDone(s, chapter('downtown-3'))).toBe(true);
    expect(chapterReady(s, 150)).toEqual({ secondsLeft: STORY_PACING.gapSeconds - 50 });
    expect(chapterReady(s, 100)).toEqual({ secondsLeft: 0 });
    expect(chapterReady(s, null)).toEqual({ secondsLeft: 0 });
    expect(chapterReady(withShop(s, 'downtown', { sold: 940 }), 150)).toBeNull();
  });
  it('waits longer before a beat 4 (the gap after beat 3)', () => {
    const s = withTasksDone(withShop(before('downtown-4', { playSeconds: 500, sceneAt: { 'downtown-3': 450 } }), 'downtown', { sold: 2217 }));
    expect(chapterReady(s, null)).toEqual({ secondsLeft: STORY_PACING.firstHoodBeat4GapSeconds - 50 });
  });
});

describe('the save', () => {
  it('reads a broken slice as none, and a partly broken one field by field', () => {
    expect(migrateChapterSave(undefined)).toBeNull();
    expect(migrateChapterSave('x')).toBeNull();
    const m = migrateChapterSave({ done: ['a', 3, null], best: { a: 5, b: 'x', c: -2 }, run: { a: { lo: 3, secs: 99 }, b: 7 }, calm: [], report: 'yes' });
    expect(m).toEqual({ done: ['a'], best: { a: 5, c: 0 }, run: { a: { lo: 3, secs: 30 } }, calm: {}, report: false, banked: 0 });
  });
  it('is absent from a new game and from a state nothing has counted in', () => {
    expect(G.newGame(0).x.chapters).toBeUndefined();
    expect(saveOf(G.newGame(0)).done).toEqual([]);
  });
  it('round-trips through JSON', () => {
    const g = G.playTick(withShop(before('downtown-4', { playSeconds: 100 }), 'downtown', { heads: G.allHeads() }), 35, 0);
    expect(saveOf(G.migrate(JSON.parse(JSON.stringify(g)), 0)).best).toEqual(saveOf(g).best);
  });
});

/** The order the pacing sim's player sees the 40 scenes in (a save can only have seen a scene whose own waits are over: downtown-5 comes after waterfront-4). */
const PLAYED = [
  'downtown-1',
  'downtown-2',
  'downtown-3',
  'downtown-4',
  'suburbs-1',
  'suburbs-2',
  'suburbs-hire',
  'suburbs-3',
  'suburbs-3b',
  'suburbs-4',
  'waterfront-1',
  'waterfront-2',
  'waterfront-3',
  'waterfront-3b',
  'waterfront-4',
  'downtown-5',
  'suburbs-5',
  'waterfront-5',
  'waterfront-hire',
  'university-1',
  'university-2',
  'university-3',
  'university-3b',
  'university-3c',
  'university-hire',
  'university-4',
  'industrial-1',
  'industrial-2',
  'industrial-2b',
  'industrial-3',
  'industrial-3b',
  'industrial-hire',
  'industrial-4',
  'uptown-1',
  'uptown-2',
  'uptown-2b',
  'uptown-3',
  'uptown-3b',
  'uptown-hire',
  'uptown-4',
];

describe('a save from before chapters (v7)', () => {
  /** The save of a player who has played every scene before main beat `i`, as v5.20 wrote it. */
  const v7 = (id: string, patch: Partial<G.GameState> = {}) => {
    const g = { ...G.newGame(0), seenScenes: PLAYED.slice(0, PLAYED.indexOf(id)), ...patch };
    // every neighbourhood whose first beat has played is built, as in a real save
    const built = Object.fromEntries(
      HOODS.map((h) => [h, { ...g.shops[h], built: g.shops[h].built || g.seenScenes.includes(`${h}-1`) }]),
    ) as G.GameState['shops'];
    return JSON.parse(JSON.stringify({ ...g, shops: built, saveVersion: 7, tutorial: G.TUTORIAL_DONE }));
  };

  it.each(MAIN.map((s) => s.id))('a save at %s loads on that chapter', (id: string) => {
    const m = G.migrate(v7(id), 0);
    expect(m.saveVersion).toBe(G.SAVE_VERSION);
    // the first unplayed main beat: an interlude that sits before it in the story may be unseen too, but chapters are for main beats
    expect(currentChapter(m)?.sceneId).toBe(id);
    expect(chapterTasks(m).length).toBeGreaterThanOrEqual(2);
  });

  it('marks the chapters of seen beats done without a record, and ticks the open one from the save', () => {
    const m = G.migrate(v7('downtown-3', { shops: withShop(G.newGame(0), 'downtown', { heads: { prep: true, oven: true, counter: true } }).shops }), 0);
    expect(chapterTasks(m).map((r) => r.done)).toEqual([false, true]); // (the self-done report task is not listed)
    expect(chapterDone(m, chapter('downtown-2'))).toBe(true);
  });

  it('does not hold a beat the save has already reached: a chapter whose trigger has passed is done whole', () => {
    const raw = v7('downtown-2', { shops: withShop(G.newGame(0), 'downtown', { sold: 600 }).shops });
    const m = G.migrate(raw, 0);
    expect(chapterDone(m, chapter('downtown-2'))).toBe(true);
    expect(sceneTriggered(m, scene('downtown-2'))).toBe(true);
  });

  it('leaves a v8 save’s own counters alone', () => {
    const g = G.playTick(withShop(before('downtown-4', { playSeconds: 100 }), 'downtown', { heads: G.allHeads() }), 35, 0);
    const again = G.migrate(JSON.parse(JSON.stringify(g)), 0);
    expect(saveOf(again)).toEqual(saveOf(g));
  });
});

describe('the chapter’s diamonds', () => {
  const dia = (g: G.GameState) => g.rewards.diamonds;
  it('pays nothing for the opening, banks each chapter before the rewards unlock, and pays the bank on the scene that unlocks them', () => {
    let g = G.newGame(0);
    g = G.markSceneSeen(g, scene('downtown-1'));
    expect([dia(g), saveOf(g).banked]).toEqual([0, 0]);
    g = G.markSceneSeen(g, scene('downtown-2'));
    expect([dia(g), saveOf(g).banked]).toEqual([0, CHAPTER_DIAMONDS]);
    g = G.markSceneSeen(g, scene('downtown-3'));
    expect([dia(g), saveOf(g).banked]).toEqual([0, 2 * CHAPTER_DIAMONDS]);
    g = G.markSceneSeen(g, scene('downtown-4')); // the takeover scene unlocks the rewards
    expect([dia(g), saveOf(g).banked]).toEqual([3 * CHAPTER_DIAMONDS, 0]);
    g = G.markSceneSeen(g, scene('suburbs-1'));
    expect(dia(g)).toBe(4 * CHAPTER_DIAMONDS);
  });
  it('pays once: a scene seen again pays nothing', () => {
    const g = G.markSceneSeen(seen(['downtown-1', 'downtown-2', 'downtown-3', 'downtown-4']), scene('suburbs-1'));
    expect(dia(g)).toBe(CHAPTER_DIAMONDS);
    expect(G.markSceneSeen(g, scene('suburbs-1'))).toBe(g);
  });
  it('pays nothing for an interlude or a hire scene', () => {
    const g = seen(['downtown-1', 'downtown-2', 'downtown-3', 'downtown-4', 'suburbs-1', 'suburbs-2', 'suburbs-3']);
    expect(dia(G.markSceneSeen(g, scene('suburbs-3b')))).toBe(0);
    expect(dia(G.markSceneSeen(g, scene('suburbs-hire')))).toBe(0);
  });
  it('keeps the bank through a save', () => {
    const g = G.markSceneSeen(G.markSceneSeen(G.newGame(0), scene('downtown-1')), scene('downtown-2'));
    expect(saveOf(G.migrate(JSON.parse(JSON.stringify(g)), 0)).banked).toBe(CHAPTER_DIAMONDS);
  });
});

describe('the wait on the pacing is one rule', () => {
  /** A state in which `id`'s chapter is current, every task is done and its trigger has passed. */
  const ready = (id: string, playSeconds: number): G.GameState => {
    const tr = scene(id).trigger;
    let g = withTasksDone({ ...before(id), playSeconds, sceneAt: { 'downtown-3': 1000 - 250, 'suburbs-3': 1000 - 250 } });
    if (tr.kind === 'deliveries') g = withShop(g, tr.neighborhood, { built: true, sold: tr.count });
    else if (tr.kind === 'unlock') g = withShop(g, tr.neighborhood, { built: true });
    else if (tr.kind === 'bid') g = withShop(g, tr.neighborhood, { built: true, perk: true });
    else g = withShop({ ...g, x: { ...g.x, [LAYER_KEYS.rival]: { won: [tr.neighborhood], challenge: null, retryAt: {} } } }, tr.neighborhood, { built: true });
    return g;
  };
  it('says 0 s left exactly when sceneReady says the beat may play, over a run of play time', () => {
    for (const id of MAIN.map((x) => x.id).filter((x) => x !== 'downtown-1')) {
      for (let play = 900; play <= 1500; play += 7) {
        for (const last of [null, 1000, 1000 - 60, play - 1, play - 89, play - 90, play - 91]) {
          const g = ready(id, play);
          const wait = chapterReady(g, last);
          expect(wait).not.toBeNull();
          expect(wait!.secondsLeft === 0).toBe(sceneReady(g, scene(id), last));
          expect(wait!.secondsLeft).toBe(sceneWaitSeconds(g, scene(id), last));
        }
      }
    }
  });
});

describe('what the player is shown', () => {
  it('leaves the self-done report task out of the list until the report has a reader', () => {
    expect(chapter('downtown-3').tasks).toHaveLength(3);
    expect(visibleTasks(chapter('downtown-3')).map((t) => t.kind)).toEqual(['serve', 'hire']);
    const s = withShop(before('downtown-3', { x: seen([]).x }), 'downtown', { sold: 10 });
    expect(chapterTasks(s).map((r) => r.task.kind)).toEqual(['serve', 'hire']);
  });
  it('a save still in the tutorial keeps the opening’s tasks (they count done only once the tutorial is over)', () => {
    const raw = JSON.parse(JSON.stringify({ ...G.newGame(0), seenScenes: ['downtown-1'], tutorial: 9, saveVersion: 7 }));
    const m = G.migrate(raw, 0);
    expect(currentChapter(m)?.sceneId).toBe('downtown-1');
    expect(saveOf(m).done.filter((k) => k.startsWith('task.downtown-1.'))).toEqual([]);
  });
});
