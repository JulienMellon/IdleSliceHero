/// <reference types="jest" />
// v5.21 (card U2): the Story tab's view model: the chapter's title, teaser, tasks with their ticks and "212/424", the reward row, the wait for the
// next scene, the padlock on Daily and Weekly before the takeover, and the room the teaser has.
import '../../engine/features';
import { HOME_CHAPTERS } from '../../content/cities/home/chapters';
import { NONNA_TAKEOVER } from '../../content/cities/home/fit';
import type { NeighborhoodId } from '../../content/types';
import { HOME_COPY } from '../../content/copy';
import { COPY as CHAPTER_COPY } from '../../content/copy/home/chapters';
import { CHAPTERS_KEY, newChapterSave } from '../../engine/chapters';
import * as G from '../../engine/game';
import {
  CHAPTER_DIAMONDS,
  clockText,
  defaultTasksTab,
  hasStory,
  rewardsTabLocked,
  storyRewardText,
  storyView,
  tabLockedText,
  TASKS_CLOSE_TARGET,
  TASKS_STORY_TARGET,
  TASKS_TABS,
  TEASER,
  teaserWidth,
  wrapLines,
} from '../rewards-model';

const withShop = (s: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({
  ...s,
  shops: { ...s.shops, [id]: { ...s.shops[id], ...patch } },
});
const doneKeys = (s: G.GameState, done: string[]): G.GameState => ({ ...s, x: { ...s.x, [CHAPTERS_KEY]: { ...newChapterSave(), done } } });
/** Chapter 1's three tasks (the tutorial's): a save past the tutorial has them done, and chapter 1 stays current until they are. */
const CH1 = HOME_CHAPTERS[0].tasks.map((t) => t.key);

/** Downtown's tutorial: the opening scene has not played, so chapter 1 is on and its three tasks are all done. */
const tutorial = (): G.GameState =>
  doneKeys(
    withShop(G.newGame(0), 'downtown', { sold: 4, heads: { ...G.noHeads(), prep: true } }),
    HOME_CHAPTERS[0].tasks.map((t) => t.key),
  );
/** Chapter 2 on, 212 of its 424 pies served, nothing else done. */
const midway = (): G.GameState => doneKeys(withShop({ ...G.newGame(0), seenScenes: ['downtown-1'], playSeconds: 400 }, 'downtown', { sold: 212 }), CH1);
/** Chapter 2 with every task done and the last scene ended 50 play seconds ago. */
const waiting = (): G.GameState =>
  doneKeys(withShop({ ...G.newGame(0), seenScenes: ['downtown-1'], playSeconds: 500 }, 'downtown', { sold: 424, heads: { ...G.noHeads(), oven: true } }), [
    ...CH1,
    ...HOME_CHAPTERS[1].tasks.map((t) => t.key),
  ]);

describe('chapter 1 during the tutorial', () => {
  const v = storyView(tutorial(), null);
  it('shows the first chapter with its three tasks ticked', () => {
    expect(v.kind).toBe('chapter');
    expect(v.number).toBe(1);
    expect(v.title).toBe('The Keys');
    expect(v.tasks.map((t) => t.done)).toEqual([true, true, true]);
    expect(v.tasks.map((t) => t.label)).toEqual(['Serve 1 pie in Downtown', 'Serve 4 pies in Downtown', 'Hire Marco, head prep cook']);
  });
  it('names the scene it unlocks: the teaser and who is in it', () => {
    expect(v.teaser).toBe(HOME_COPY['chapter.downtown-1.teaser']);
    expect(v.who).toBe('nonna-rosa');
  });
  it('shows the reward as the scene and the diamonds', () => {
    expect(v.reward).toBe(`\u{1F3AC} New scene · \u{1F48E} ${CHAPTER_DIAMONDS}`);
    expect(storyRewardText()).toBe(v.reward);
  });
});

describe('the tutorial after the opening scene', () => {
  it('still shows chapter 1 (its beat has played, its tasks are not all done), with the ticks that are', () => {
    const g = withShop({ ...G.newGame(0), seenScenes: ['downtown-1'] }, 'downtown', { sold: 4 });
    const v = storyView(g, null);
    expect(v.number).toBe(1);
    expect(v.title).toBe('The Keys');
    expect(v.tasks.map((t) => t.done)).toEqual([true, true, false]);
  });
  it('moves to chapter 2 once the three are done', () => {
    expect(storyView(midway(), null).number).toBe(2);
  });
});

describe('chapter 2 half way', () => {
  const v = storyView(midway(), null);
  it('reads the chapter number, title and its tasks from the save', () => {
    expect(v.number).toBe(2);
    expect(v.title).toBe('First Regulars');
    expect(v.tasks.map((t) => t.label)).toEqual(['Serve 424 pies in Downtown', 'Hire Lucia, head baker', 'Serve 6/min in Downtown']);
  });
  it('gives a count its bar and "212/424", and a hire or a build only a tick', () => {
    const [serve, hire, rate] = v.tasks;
    expect(serve).toMatchObject({ bar: true, done: false, progress: '212/424', pct: 0.5 });
    expect(hire).toMatchObject({ bar: false, done: false, progress: '' });
    expect(rate).toMatchObject({ bar: true, done: false, progress: '0/6' });
    expect(serve.spoken).toBe('Serve 424 pies in Downtown, 212 of 424');
    expect(hire.spoken).toBe('Hire Lucia, head baker, not yet');
  });
  it('is not waiting on the story’s pacing while a task is open', () => {
    expect(v.wait).toBeNull();
  });
  it('ticks a task that is done and keeps its bar full', () => {
    const s = withShop(midway(), 'downtown', { heads: { ...G.noHeads(), oven: true } });
    const [, hire] = storyView(s, null).tasks;
    expect(hire.done).toBe(true);
    expect(hire.spoken).toBe('Hire Lucia, head baker, done');
  });
});

describe('a done chapter waiting on the next scene', () => {
  it('says "Next scene in 0:42" with the seconds the 90 s pacing has left', () => {
    const v = storyView(waiting(), 500 - 48);
    expect(v.tasks.every((t) => t.done)).toBe(true);
    expect(v.wait).toBe('Next scene in 0:42');
  });
  it('counts down as the play seconds move', () => {
    const s = waiting();
    expect(storyView(s, 500 - 10).wait).toBe('Next scene in 1:20');
    expect(storyView({ ...s, playSeconds: 540 }, 500 - 10).wait).toBe('Next scene in 0:40');
  });
  it('is 0:00 when the scene plays now (a launch has no session gap)', () => {
    expect(storyView(waiting(), null).wait).toBe('Next scene in 0:00');
  });
  it('formats seconds as m:ss', () => {
    expect(clockText(42)).toBe('0:42');
    expect(clockText(90)).toBe('1:30');
    expect(clockText(41.2)).toBe('0:42');
    expect(clockText(-3)).toBe('0:00');
    expect(clockText(Number.NaN)).toBe('0:00');
  });
});

describe('after the last chapter', () => {
  it('says every chapter is done and has no tasks', () => {
    const all = doneKeys({ ...G.newGame(0), seenScenes: HOME_CHAPTERS.map((c) => c.sceneId) }, CH1);
    const v = storyView(all, null);
    expect(v.kind).toBe('finished');
    expect(v.finished).toBe('Every chapter done. The city is yours.');
    expect(v.tasks).toEqual([]);
    expect(v.wait).toBeNull();
  });
});

describe('Daily and Weekly before the takeover', () => {
  it('stay locked until the takeover scene has played, and say who opens them', () => {
    const fresh = G.newGame(0);
    expect(rewardsTabLocked(fresh)).toBe(true);
    expect(rewardsTabLocked(midway())).toBe(true);
    expect(tabLockedText(fresh)).toBe('Opens when Nonna takes over');
  });
  it('unlock with the takeover', () => {
    expect(rewardsTabLocked({ ...G.newGame(0), seenScenes: ['downtown-1', NONNA_TAKEOVER.sceneId] })).toBe(false);
  });
  it('open on Story, which comes first', () => {
    expect(TASKS_TABS).toEqual(['story', 'daily', 'weekly']);
    expect(hasStory(G.newGame(0))).toBe(true);
    expect(defaultTasksTab(G.newGame(0))).toBe('story');
  });
  it('a city without chapters opens on Daily', () => {
    const boston = { ...G.newGame(0), city: 'boston' };
    expect(hasStory(boston)).toBe(false);
    expect(defaultTasksTab(boston)).toBe('daily');
  });
});

describe('the tutorial’s two spots', () => {
  it('are named for the Coach', () => {
    expect(TASKS_STORY_TARGET).toBe('tasks:story');
    expect(TASKS_CLOSE_TARGET).toBe('tasks:close');
  });
});

describe('the copy table', () => {
  it('has a title, a teaser and a label for every chapter and task, and the goal bar’s two lines', () => {
    for (const c of HOME_CHAPTERS) {
      expect(CHAPTER_COPY).toHaveProperty([`${c.key}.title`]);
      expect(CHAPTER_COPY).toHaveProperty([`${c.key}.teaser`]);
      for (const t of c.tasks) expect(CHAPTER_COPY).toHaveProperty([t.key]);
    }
    expect(CHAPTER_COPY['chapter.ready']).toBe('Next scene in {time}');
    expect(CHAPTER_COPY['chapter.done']).toBe('Every chapter done. The city is yours.');
  });
  it('is in the home copy', () => {
    for (const k of Object.keys(CHAPTER_COPY)) expect(HOME_COPY[k]).toBe((CHAPTER_COPY as Record<string, string>)[k]);
  });
  it('fills every chapter’s task labels (no placeholder is left on screen)', () => {
    let g = G.newGame(0);
    for (const c of HOME_CHAPTERS) {
      g = doneKeys({ ...g, seenScenes: HOME_CHAPTERS.slice(0, HOME_CHAPTERS.indexOf(c)).map((x) => x.sceneId) }, CH1);
      const v = storyView(g, null);
      expect(v.title).not.toMatch(/^chapter\./);
      for (const t of v.tasks) expect(t.label).not.toMatch(/[{}]|^task\./);
    }
  });
});

describe('the teaser fits two lines at 375 wide', () => {
  it('for every chapter, with its portrait beside it', () => {
    const w = teaserWidth(375);
    expect(w).toBeGreaterThan(250);
    for (const c of HOME_CHAPTERS) {
      const text = CHAPTER_COPY[`${c.key}.teaser` as keyof typeof CHAPTER_COPY];
      expect(wrapLines(text, w)).toBeLessThanOrEqual(TEASER.lines);
    }
  });
  it('the check can fail: a long line takes three', () => {
    expect(wrapLines('word '.repeat(40).trim(), teaserWidth(375))).toBeGreaterThan(TEASER.lines);
  });
  it('the type is 10 pt or more and the portrait 36 pt', () => {
    expect(TEASER.font).toBeGreaterThanOrEqual(10);
    expect(TEASER.portrait).toBe(36);
  });
});
