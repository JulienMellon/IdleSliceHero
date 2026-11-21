/// <reference types="jest" />
import '../../engine/features';
import { HOME_CHAPTERS } from '../../content/cities/home/chapters';
import { cityOf } from '../../content/cities';
import { CITY_NAME } from '../../content/cities/home/data';
import { HOME_SCENES } from '../../content/scenes/home';
import { CHAPTERS_KEY, newChapterSave } from '../../engine/chapters';
import { count, goalAmount, money, pizzas } from '../../engine/format';
import * as G from '../../engine/game';
import { headCost } from '../../engine/game';
import {
  aOrAn,
  chapterGoal,
  CHEER_RIBBON_MS,
  goalCheer,
  taskPrice,
  GOAL_BAR,
  GOAL_FLASH_MS,
  GOAL_LAYOUT,
  GOAL_TAB,
  goalBarLayout,
  cityStory,
  GOAL_CHEVRON,
  GOAL_PAD,
  goalFitsWhole,
  goalLabelFit,
  goalLabelFits,
  goalLine,
  shortTask,
  STORY_TOTAL,
  goalTextW,
  goalWords,
  snapSeam,
  withoutShop,
} from '../goal-model';
import { storyView } from '../rewards-model';
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

describe('goal bar two-tone label (D297)', () => {
  test('both halves of the label read at 4.5:1 or better: cream on the fill, ink on the track', () => {
    expect(contrast(GOAL_BAR.onFill, GOAL_BAR.fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(GOAL_BAR.onTrack, GOAL_BAR.track)).toBeGreaterThanOrEqual(4.5);
  });
  test('the cream copy is clipped to exactly the fill width, at every fraction', () => {
    for (const f of [0.01, 0.1, 0.25, 0.5, 0.74, 0.99]) {
      const b = goalBarLayout(f * 80, 80, false, 354);
      expect(b.split).toBe(true);
      expect(b.fillW).toBeCloseTo(f * (354 - 2 * GOAL_BAR.border), 6);
      expect(b.fillW).toBeLessThan(b.innerW);
    }
  });
  test('nothing to split when empty, unmeasured, or ready to tap (all white on basil)', () => {
    expect(goalBarLayout(0, 80, false, 354).split).toBe(false);
    expect(goalBarLayout(40, 80, false, 0).split).toBe(false);
    const ready = goalBarLayout(80, 80, true, 354);
    expect(ready.ready).toBe(true);
    expect(ready.split).toBe(false);
  });
  test('a full bar with nothing to tap is all fill, so the whole label is cream', () => {
    const b = goalBarLayout(24, 24, false, 354);
    expect(b.ready).toBe(false);
    expect(b.fillW).toBe(b.innerW);
    expect(b.split).toBe(true);
  });
  test('a zero or broken target never gives NaN', () => {
    for (const [c, t] of [
      [0, 0],
      [5, 0],
      [Number.NaN, 10],
      [10, Number.NaN],
    ]) {
      const b = goalBarLayout(c, t, true, 354);
      expect(Number.isNaN(b.pct)).toBe(false);
      expect(Number.isNaN(b.fillW)).toBe(false);
    }
  });
});

describe('a / an (B5)', () => {
  test("picked from the name's first letter", () => {
    expect(aOrAn('Uptown')).toBe('an');
    expect(aOrAn('Industrial')).toBe('an');
    expect(aOrAn('Suburbs')).toBe('a');
    expect(aOrAn('Waterfront')).toBe('a');
    expect(aOrAn('Downtown')).toBe('a');
    expect(aOrAn('university')).toBe('an');
  });
});

describe('goal bar seam snaps to a word edge (G88)', () => {
  // "Downtown:" "Hire" "Marco" and the amount "$15.4M", as the bar lays them out at 14 pt in a 350 pt inner width
  const spans = [
    { x: 12, w: 70 },
    { x: 86, w: 30 },
    { x: 120, w: 46 },
    { x: 290, w: 48 },
  ];
  const inside = (x: number) => spans.some((s) => x > s.x && x < s.x + s.w);
  test('the old code put the seam inside a word at these fractions; the new seam never lands inside any span', () => {
    let hitOld = 0;
    for (let f = 0.01; f < 1; f += 0.01) {
      const raw = f * 350;
      if (inside(raw)) hitOld += 1;
      const b = goalBarLayout(f * 100, 100, false, 354, spans);
      expect(inside(b.fillW)).toBe(false);
    }
    expect(hitOld).toBeGreaterThan(20);
  });
  test('inside a word the seam goes to the nearer end, at most half a word away', () => {
    expect(snapSeam(100, spans)).toBe(86); // 14 of 30 in: back to the start of "Hire"
    expect(snapSeam(105, spans)).toBe(116); // 19 of 30 in: on to its end
    expect(snapSeam(300, spans)).toBe(290); // inside "$15.4M": the amount is never two colours
    expect(snapSeam(330, spans)).toBe(338);
  });
  test('in a gap, the padding, or past the last span the seam stays exactly on the progress', () => {
    for (const x of [3, 10, 84, 118, 200, 340]) expect(snapSeam(x, spans)).toBe(x);
  });
  test('a small fill never vanishes and a full bar stays full', () => {
    expect(goalBarLayout(1, 100, false, 354, spans).fillW).toBeCloseTo(3.5, 6);
    expect(goalBarLayout(100, 100, false, 354, spans).fillW).toBe(350);
    expect(goalBarLayout(100, 100, false, 354, spans).split).toBe(true);
  });
  test('words are split on blanks and the label order is kept', () => {
    expect(goalWords('Downtown:  Hire Marco')).toEqual(['Downtown:', 'Hire', 'Marco']);
    expect(goalWords('')).toEqual([]);
  });
});

// T81 (C105): the goal line must never clip its amount, on a 320, 375 or 393 pt phone. The bar is the screen less the HUD's 12 pt margins.
describe('the goal line fits (C105, T81)', () => {
  const bars = [320, 375, 393].map((w) => w - 24);
  // every line app/index.tsx can show: the chapter goals' three forms (a state on each task of each chapter), the mastery and the story fallbacks
  const labels = (): string[] => {
    const out: string[] = [];
    for (const g of everyTaskGoal()) out.push(g.label, g.short, g.tiny);
    out.push(`${CITY_NAME} is yours! Franchising soon`, 'Story 12/24');
    return out;
  };
  // the widest amounts: the two-sided money text at every magnitude, and the story count
  const amounts = (): string[] => [
    ...Array.from({ length: 36 }, (_, i) => goalAmount(Math.pow(10, i) * 9.99, Math.pow(10, i) * 9.99)),
    goalAmount(0, 999_999_999_999_999),
    '24/24',
    money(1e33),
  ];
  test('the amount is never clipped and the words keep a readable share, for every label generator, at 320, 375 and 393 pt', () => {
    const bad: string[] = [];
    for (const barW of bars)
      for (const label of labels()) for (const amount of amounts()) if (!goalLabelFits(label, amount, barW)) bad.push(`${barW} "${label}" ${amount}`);
    expect(bad.slice(0, 5)).toEqual([]);
  });
  test('the check can fail: an amount wider than the bar, or one that leaves the words nothing, does not fit', () => {
    expect(goalLabelFits('Hire Marco', '$1.23K / $4.56K', 40)).toBe(false);
    expect(goalLabelFits('Waterfront: hire Finn (prep)', goalAmount(999e9, 999e9), 150)).toBe(false);
    expect(goalLabelFit('Hire Marco', '$1 / $2', 351).wordsRoom).toBeGreaterThan(goalLabelFit('Hire Marco', '$1.23K / $4.56K', 351).wordsRoom);
    expect(goalTextW('abcd', 10)).toBe(23);
  });
  test('the layout contract: the words are one row that shrinks and clips, the amount sits outside it and never shrinks', () => {
    expect(GOAL_LAYOUT.words).toEqual({ flexShrink: 1, overflow: 'hidden' });
    expect(GOAL_LAYOUT.amount.flexShrink).toBe(0);
  });
});

// ---------- the chapter goal (v5.21, U1) ----------

const withShop = (g: G.GameState, id: string, patch: Partial<G.Shop>): G.GameState => ({
  ...g,
  shops: { ...g.shops, [id]: { ...g.shops[id as G.GameState['active']], ...patch } },
});
/** The free chapter 1's tasks: past the tutorial they are done, or chapter 1 stays current. */
const OPENING = HOME_CHAPTERS[0].tasks.map((t) => t.key);
const doneKeys = (g: G.GameState, done: string[]): G.GameState => ({ ...g, x: { ...g.x, [CHAPTERS_KEY]: { ...newChapterSave(), done } } });
/** Chapter `n` (1-based) is on, with its first `k` tasks done and the next one `sold` pies in. */
const stateAt = (n: number, k: number, sold = 0): G.GameState => {
  const c = HOME_CHAPTERS[n - 1];
  const g = { ...G.newGame(0), seenScenes: HOME_CHAPTERS.slice(0, n - 1).map((x) => x.sceneId) };
  const next = c.tasks[k];
  return doneKeys(next?.kind === 'serve' ? withShop(g, next.shop, { sold }) : g, [...(n > 1 ? OPENING : []), ...c.tasks.slice(0, k).map((x) => x.key)]);
};
/** Chapter `n` with every task but its serve done (D533: the bar shows the hire before the serve), `sold` pies in. */
const serving = (n: number, sold: number): G.GameState => {
  const c = HOME_CHAPTERS[n - 1];
  const serve = c.tasks.find((t) => t.kind === 'serve')!;
  const g = { ...G.newGame(0), seenScenes: HOME_CHAPTERS.slice(0, n - 1).map((x) => x.sceneId) };
  return doneKeys(withShop(g, serve.shop, { sold }), [...(n > 1 ? OPENING : []), ...c.tasks.filter((t) => t !== serve).map((t) => t.key)]);
};
const everyTaskGoal = () => HOME_CHAPTERS.flatMap((c, i) => c.tasks.map((_, k) => chapterGoal(stateAt(i + 1, k))!));

describe('the goal bar is the next chapter task (U1)', () => {
  test('chapter 2, 212 of 424 pies: "Ch 2 · Serve 424 pies in Downtown", 212/424, the fill at half', () => {
    const g = chapterGoal(serving(2, 212))!;
    expect(g.label).toBe('Ch 2 \u00B7 Serve 424 pies in Downtown');
    expect(g.text).toBe('212/424');
    expect([g.current, g.target, g.ready]).toEqual([212, 424, false]);
    expect(goalBarLayout(g.current, g.target, g.ready, 351).pct).toBe(0.5);
  });
  test('the hire comes before the long serve count (D533), and the serve follows once it is hired', () => {
    const open = stateAt(2, 0, 212);
    expect(chapterGoal(open)!.label).toBe('Ch 2 \u00B7 Hire Lucia, head baker');
    expect(chapterGoal(serving(2, 212))!.key).toBe('task.downtown-2.1');
  });
  test("it is the Story tab's own line for the same task, so the bar and the list never disagree", () => {
    for (const g of [stateAt(2, 0, 50), serving(2, 50), stateAt(3, 1, 50), serving(10, 50), stateAt(20, 1, 50)]) {
      const goal = chapterGoal(g)!;
      const row = storyView(g, null).tasks.find((x) => x.key === goal.key)!;
      expect(goal.label.endsWith(row.label)).toBe(true);
      if (
        !taskPrice(
          g,
          HOME_CHAPTERS.flatMap((c) => c.tasks).find((t) => t.key === goal.key)!,
        )
      )
        expect(goal.text).toBe(row.progress);
    }
  });
  test('it changes only when a task completes: the next task, its key and a fresh count', () => {
    const a = chapterGoal(serving(2, 100))!;
    const b = chapterGoal(serving(2, 300))!;
    expect(b.key).toBe(a.key);
    expect(b.label).toBe(a.label);
    const c = chapterGoal(stateAt(2, 0, 300))!;
    expect(c.key).not.toBe(a.key);
    expect(c.label).not.toBe(a.label);
  });
  test('D532: a hire or a build shows the cash against its own price, and fills with the cash', () => {
    const g = chapterGoal({ ...stateAt(2, 0), cash: 12 })!;
    expect(g.label).toBe('Ch 2 \u00B7 Hire Lucia, head baker');
    expect(g.text).toBe('$12 / $' + Math.floor(headCost('downtown', 'oven')));
    expect([g.current, g.target]).toEqual([12, headCost('downtown', 'oven')]);
    expect(g.ready).toBe(false);
    const b = chapterGoal({ ...stateAt(5, 0), cash: 50 })!;
    expect(b.key).toBe('task.suburbs-1.1');
    expect([b.current, b.target]).toEqual([50, G.def('suburbs').buildCost]);
    // cash past the price fills the bar and stops there ("$400 / $400"); the bar still only opens the list
    expect(goalBarLayout(1e9, headCost('downtown', 'oven'), false, 351).pct).toBe(1);
  });
  test('a task that is not bought (a count, a rate) shows its own count; a hire has the price only while it is on offer', () => {
    expect(chapterGoal(serving(2, 100))!.text).toBe('100/424');
    expect(taskPrice(G.newGame(0), HOME_CHAPTERS[1].tasks[0])).toBeNull();
    expect(taskPrice(G.newGame(0), HOME_CHAPTERS[1].tasks[1])).toBe(headCost('downtown', 'oven'));
  });
  test('the short form drops the shop and what follows a comma; the tiny one is the count or the first word', () => {
    const g = chapterGoal(serving(2, 212))!;
    expect(g.short).toBe('Ch 2 \u00B7 Serve 424 pies');
    expect(g.tiny).toBe('Ch 2 \u00B7 212/424');
    const h = chapterGoal(stateAt(2, 0, 212))!;
    expect(h.short).toBe('Ch 2 \u00B7 Hire Lucia');
    expect(h.tiny).toBe('Ch 2 \u00B7 Hire Lucia');
    expect(shortTask('Serve 424 pies in Downtown', 'Downtown')).toBe('Serve 424 pies');
    expect(shortTask('Hire Lucia, head baker', 'Downtown')).toBe('Hire Lucia');
    expect(shortTask('Build your Suburbs shop', 'Suburbs')).toBe('Build Suburbs');
    expect(shortTask('Read the Downtown shop report', 'Downtown')).toBe('Read the shop report');
    expect(withoutShop('Hire Lucia, head baker', 'Downtown')).toBe('Hire Lucia, head baker');
  });
  test("a win task uses the copy's own short line, and a bid task its label without the shop", () => {
    const at = (n: number) => HOME_CHAPTERS[n - 1];
    const win = at(HOME_CHAPTERS.findIndex((c) => c.sceneId === 'suburbs-4') + 1);
    const g = chapterGoal(
      doneKeys({ ...G.newGame(0), seenScenes: HOME_CHAPTERS.slice(0, 7).map((x) => x.sceneId) }, [
        ...OPENING,
        ...win.tasks.filter((t) => t.kind !== 'win').map((t) => t.key),
      ]),
    )!;
    expect(g.key).toBe(win.tasks.find((t) => t.kind === 'win')!.key);
    expect(g.label).toBe('Ch 8 \u00B7 Beat MegaSlice in Suburbs');
    expect(g.short).toBe('Ch 8 \u00B7 Beat MegaSlice');
    expect(g.tiny).toBe('Ch 8 \u00B7 Beat');
    expect(shortTask('Win the auction in Waterfront', 'Waterfront')).toBe('Win the auction');
  });
  test('G117: every task of every chapter shows whole words, never a cut letter, on a bar of 296, 351 and 369 pt (the line goalLine picks)', () => {
    const bad: string[] = [];
    for (const g of everyTaskGoal())
      for (const barW of [296, 351, 369]) {
        const line = goalLine(g, barW);
        if (!goalFitsWhole(line.label, line.text ?? '', barW)) bad.push(`${barW} "${line.label}" ${line.text}`);
      }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  test('the tap opens the list on the Story tab, and a completing task flashes for 600 ms at most', () => {
    expect(GOAL_TAB).toBe('story');
    expect(GOAL_FLASH_MS).toBeLessThanOrEqual(600);
  });
  test('D532: the chevron fits the right padding', () => {
    expect(GOAL_CHEVRON).toBe('\u203A');
    expect(GOAL_PAD).toBeGreaterThanOrEqual(18);
  });
});

describe('the cheer when a task is done (D541)', () => {
  const at = (key: string, label: string) => ({ key, label });
  test('a task done: its words for the toast', () => {
    expect(goalCheer(at('task.downtown-2.2', 'Ch 2 \u00B7 Hire Lucia, head baker'), at('task.downtown-2.3', 'Ch 2 \u00B7 Hold 6/min in Downtown'))).toEqual({
      chapter: false,
      text: 'Hire Lucia, head baker',
    });
  });
  test('the last task of a chapter, or the move to the next chapter: "Chapter N complete"', () => {
    expect(goalCheer(at('task.downtown-2.1', 'Ch 2 \u00B7 Serve 424 pies in Downtown'), at('chapter.downtown-2.ready', 'Ch 2 \u00B7 Next scene in'))).toEqual({
      chapter: true,
      text: 'Chapter 2 complete',
    });
    expect(goalCheer(at('task.downtown-1.3', 'Ch 1 \u00B7 Hire Marco, head prep cook'), at('task.downtown-2.2', 'Ch 2 \u00B7 Hire Lucia'))!.text).toBe(
      'Chapter 1 complete',
    );
  });
  test('nothing to cheer: the first goal, the same goal, or the beat that ends the wait', () => {
    expect(goalCheer(null, at('a', 'Ch 2 \u00B7 x'))).toBeNull();
    expect(goalCheer(at('a', 'Ch 2 \u00B7 x'), at('a', 'Ch 2 \u00B7 x'))).toBeNull();
    expect(goalCheer(at('chapter.downtown-2.ready', 'Ch 2 \u00B7 Next scene in'), at('task.downtown-3.1', 'Ch 3 \u00B7 Hire Raj'))).toBeNull();
    expect(goalCheer(at('a', 'Ch 2 \u00B7 x'), null)).toBeNull();
  });
  test('the ribbon and the tick are short', () => {
    expect(CHEER_RIBBON_MS).toBeLessThanOrEqual(2500);
  });
});

describe('the tutorial is chapter 1 (U1)', () => {
  test("after its beat has played the bar still shows chapter 1's next task, until its three tasks are done", () => {
    const g = { ...G.newGame(0), seenScenes: ['downtown-1'] };
    const a = chapterGoal(g)!;
    expect([a.key, a.ready]).toEqual(['task.downtown-1.1', false]);
    expect(a.label.startsWith('Ch 1 \u00B7 ')).toBe(true);
    const b = chapterGoal(doneKeys(withShop(g, 'downtown', { sold: 1 }), [OPENING[0]]))!;
    expect(b.key).toBe('task.downtown-1.2');
    expect(chapterGoal(doneKeys(withShop(g, 'downtown', { sold: 5 }), OPENING.slice(0, 2)))!.key).toBe('task.downtown-1.3');
    expect(chapterGoal(doneKeys(g, OPENING))!.label.startsWith('Ch 2 \u00B7 ')).toBe(true);
  });
});

describe('a done chapter waiting on the story (U1, D534)', () => {
  const waiting = (playSeconds: number) => {
    const c = HOME_CHAPTERS[1];
    const g = { ...G.newGame(0), seenScenes: ['downtown-1'], playSeconds, sceneAt: { 'downtown-1': 0 } };
    return doneKeys(withShop(g, 'downtown', { sold: 424 }), [...OPENING, ...c.tasks.map((t) => t.key)]);
  };
  test('the countdown is in the amount slot, the bar is full and not yet "Ready"', () => {
    const g = chapterGoal(waiting(500), 450)!;
    expect(g.label).toBe('Ch 2 \u00B7 Next scene in');
    expect(g.text).toBe('0:40');
    expect([g.ready, g.current, g.target]).toEqual([false, 1, 1]);
    expect(goalBarLayout(g.current, g.target, g.ready, 351).pct).toBe(1);
  });
  test('"Ready" and the basil bar only at 0:00, when the scene plays now', () => {
    const g = chapterGoal(waiting(500), 100)!;
    expect([g.text, g.ready]).toEqual(['Ready', true]);
    expect(goalBarLayout(g.current, g.target, g.ready, 351).ready).toBe(true);
    expect(chapterGoal(waiting(500), null)!.text).toBe('Ready');
  });
  test('its key is not a task key, so the bar flashes once when the last task completes, and not again as the seconds count down', () => {
    const k = chapterGoal(waiting(500), 450)!.key;
    expect(k).not.toBe(chapterGoal(stateAt(2, 2))!.key);
    expect(chapterGoal(waiting(520), 450)!.key).toBe(k);
  });
});

describe('after the last chapter, and in a city without chapters (U1)', () => {
  test('no chapter goal: the caller shows the mastery goal, then the story count', () => {
    expect(chapterGoal(doneKeys({ ...G.newGame(0), seenScenes: HOME_CHAPTERS.map((c) => c.sceneId) }, OPENING))).toBeNull();
    expect(chapterGoal(G.newGame(0, 'boston'))).toBeNull();
  });
  test('G116: the story count is the active city\'s own: Boston never shows "Story 42/40"', () => {
    const home = cityStory({ ...G.newGame(0), seenScenes: HOME_SCENES.map((x) => x.id) });
    expect(home.label).toBe(`Story ${HOME_SCENES.length}/${STORY_TOTAL}`);
    const boston = G.newGame(0, 'boston');
    const total = cityOf(boston).scenes.length;
    expect(cityStory(boston).label).toBe(`Story 0/${total}`);
    // a franchise keeps the home scenes in seenScenes: only Boston's own count
    const after = cityStory({ ...boston, seenScenes: [...HOME_SCENES.map((x) => x.id), cityOf(boston).scenes[0].id] });
    expect(after.current).toBe(1);
    expect(after.target).toBe(total);
  });
  test('the progress is the same one the Story tab prints', () => {
    expect(`${pizzas(212)}/${count(424)}`).toBe('212/424');
  });
});
