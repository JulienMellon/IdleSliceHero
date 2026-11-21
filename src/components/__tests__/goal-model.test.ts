/// <reference types="jest" />
import '../../engine/features';
import { HOME_CHAPTERS } from '../../content/cities/home/chapters';
import { CITY_NAME } from '../../content/cities/home/data';
import { CHAPTERS_KEY, newChapterSave } from '../../engine/chapters';
import { count, goalAmount, money, pizzas } from '../../engine/format';
import * as G from '../../engine/game';
import {
  aOrAn,
  chapterGoal,
  GOAL_BAR,
  GOAL_FLASH_MS,
  GOAL_LAYOUT,
  GOAL_TAB,
  goalBarLayout,
  goalLabelFit,
  goalLabelFits,
  goalLine,
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
const everyTaskGoal = () => HOME_CHAPTERS.flatMap((c, i) => c.tasks.map((_, k) => chapterGoal(stateAt(i + 1, k))!));

describe('the goal bar is the next chapter task (U1)', () => {
  test('chapter 2, 212 of 424 pies: "Ch 2 · Serve 424 pies in Downtown", 212/424, the fill at half', () => {
    const g = chapterGoal(stateAt(2, 0, 212))!;
    expect(g.label).toBe('Ch 2 \u00B7 Serve 424 pies in Downtown');
    expect(g.text).toBe('212/424');
    expect([g.current, g.target, g.ready]).toEqual([212, 424, false]);
    expect(goalBarLayout(g.current, g.target, g.ready, 351).pct).toBe(0.5);
  });
  test("it is the Story tab's own line for the same task, so the bar and the list never disagree", () => {
    for (const [n, k] of [
      [2, 0],
      [2, 1],
      [3, 1],
      [9, 0],
      [20, 1],
    ]) {
      const g = stateAt(n, k, 50);
      const row = storyView(g, null).tasks.find((x) => !x.done)!;
      expect(chapterGoal(g)!.label).toBe(`Ch ${n} \u00B7 ${row.label}`);
      expect(chapterGoal(g)!.text).toBe(row.progress);
    }
  });
  test('it changes only when a task completes: the next task, its key and a fresh count', () => {
    const a = chapterGoal(stateAt(2, 0, 100))!;
    const b = chapterGoal(stateAt(2, 0, 300))!;
    expect(b.key).toBe(a.key);
    expect(b.label).toBe(a.label);
    const c = chapterGoal(stateAt(2, 1))!;
    expect(c.key).not.toBe(a.key);
    expect(c.label).toBe('Ch 2 \u00B7 Hire Lucia, head baker');
    expect(c.label).not.toBe(a.label);
  });
  test('a yes/no task has no count and an empty bar', () => {
    const g = chapterGoal(stateAt(2, 1))!;
    expect([g.text, g.current, g.target]).toEqual(['', 0, 1]);
  });
  test('the short form drops the shop, the tiny one keeps the chapter and the count', () => {
    const g = chapterGoal(stateAt(2, 0, 212))!;
    expect(g.short).toBe('Ch 2 \u00B7 Serve 424 pies');
    expect(g.tiny).toBe('Ch 2 \u00B7 212/424');
    expect(withoutShop('Serve 424 pies in Downtown', 'Downtown')).toBe('Serve 424 pies');
    expect(withoutShop('Hire Lucia, head baker', 'Downtown')).toBe('Hire Lucia, head baker');
    expect(withoutShop('Build your Suburbs shop', 'Suburbs')).toBe('Build your Suburbs shop');
  });
  test('every task of every chapter fits a bar of 296, 351 and 369 pt in one of its three forms, with its amount or without', () => {
    const bad: string[] = [];
    for (const g of everyTaskGoal())
      for (const barW of [296, 351, 369]) {
        const line = goalLine(g, barW);
        if (!goalLabelFits(line.label, line.text ?? '', barW)) bad.push(`${barW} ${line.label} ${line.text}`);
      }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  test('the tap opens the list on the Story tab, and a completing task flashes for 600 ms at most', () => {
    expect(GOAL_TAB).toBe('story');
    expect(GOAL_FLASH_MS).toBeLessThanOrEqual(600);
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

describe('a done chapter waiting on the story (U1)', () => {
  const waiting = (playSeconds: number) => {
    const c = HOME_CHAPTERS[1];
    const g = { ...G.newGame(0), seenScenes: ['downtown-1'], playSeconds, sceneAt: { 'downtown-1': 0 } };
    return doneKeys(withShop(g, 'downtown', { sold: 424 }), [...OPENING, ...c.tasks.map((t) => t.key)]);
  };
  test('a full basil bar that says Ready, with the countdown in its words', () => {
    const g = chapterGoal(waiting(500), 450)!;
    expect(g.ready).toBe(true);
    expect(g.label).toBe('Ch 2 \u00B7 Next scene in 0:40');
    expect(g.text).toBe('Ready');
    expect(goalBarLayout(g.current, g.target, g.ready, 351).ready).toBe(true);
  });
  test('its key is not a task key, so the bar flashes once when the last task completes', () => {
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
  test('the progress is the same one the Story tab prints', () => {
    expect(`${pizzas(212)}/${count(424)}`).toBe('212/424');
  });
});
