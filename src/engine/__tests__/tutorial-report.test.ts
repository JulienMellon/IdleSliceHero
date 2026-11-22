/// <reference types="jest" />
// The shop report's coach (v5.22, card E4): strip (tap), the Ovens bar, the dashed line (looks), over when the sheet closes; never again.
import { HOME_CHAPTERS } from '../../content/cities/home/chapters';
import { HOME_SCENES } from '../../content/scenes/home';
import { t } from '../../content/copy';
import { markReportOpened, migrateChapterSave, nextTask, saveOf, taskProgress } from '../chapters';
import * as G from '../game';
import { coachTargets, coachStep, REPORT_COACH, reportCoachLive, reportCoachStep, tutorialNote, type ReportCoachScreen } from '../tutorial';

const ch = (id: string) => HOME_CHAPTERS.find((c) => c.sceneId === id)!;
const keysOf = (...ids: string[]) => ids.flatMap((id) => ch(id).tasks.map((x) => x.key));
const SHUT: ReportCoachScreen = { sheetOpen: false, clear: true };
const OPEN: ReportCoachScreen = { sheetOpen: true, clear: true };

/** A player past the tutorial, on Chapter 3 of Downtown with its other two tasks done: "Open the shop report" is the next task. */
const onChapter3 = (): G.GameState => {
  const g = G.newGame(0);
  const seen = HOME_SCENES.slice(
    0,
    HOME_SCENES.findIndex((s) => s.id === 'downtown-3'),
  ).map((s) => s.id);
  const downtown = { ...g.shops.downtown, heads: { prep: true, oven: true, counter: true }, sold: 1000 };
  const done = [...keysOf('downtown-1', 'downtown-2'), ch('downtown-3').tasks[0].key, ch('downtown-3').tasks[1].key];
  return {
    ...g,
    tutorial: G.TUTORIAL_DONE,
    seenScenes: seen,
    shops: { ...g.shops, downtown },
    x: { ...g.x, chapters: { ...saveOf(g), done } },
  };
};
const note = tutorialNote;

describe('the report coach', () => {
  test('the task is next, so Nonna lights the strip: a tap, her first line', () => {
    const s = onChapter3();
    expect(nextTask(s)?.task.kind).toBe('report');
    const step = reportCoachStep(s, SHUT)!;
    expect([step.id, step.targets, step.mode, step.text]).toEqual(['strip', ['report:strip'], 'tap', t('tutorial.report.1')]);
    expect(reportCoachLive(s)).toBe(false);
  });

  test('opening the sheet: the Ovens bar (look), then the dashed line (look), then nothing; closing it ends the sequence', () => {
    let s = onChapter3();
    s = note(s, 'report-open');
    expect(reportCoachLive(s)).toBe(true);
    expect(reportCoachStep(s, SHUT)).toBeNull(); // shut again before the bar was seen: nothing to light
    const bar = reportCoachStep(s, OPEN)!;
    expect([bar.id, bar.targets, bar.mode, bar.text]).toEqual(['bar', ['report:bar:ovens'], 'look', t('tutorial.report.2')]);
    s = note(s, 'report-look');
    const demand = reportCoachStep(s, OPEN)!;
    expect([demand.id, demand.targets, demand.mode, demand.text]).toEqual(['demand', ['report:demand'], 'look', t('tutorial.report.3')]);
    s = note(s, 'report-look');
    expect(reportCoachStep(s, OPEN)).toBeNull(); // Nonna stops; the player reads the sheet
    expect(reportCoachLive(s)).toBe(true);
    s = note(s, 'report-closed');
    expect(saveOf(s).coachDone).toEqual(['report:strip', 'report:bar:ovens', 'report:demand', REPORT_COACH]);
    expect(reportCoachLive(s)).toBe(false);
  });

  test('the bar is the ovens whatever the shop is doing', () => {
    const s = note(onChapter3(), 'report-open');
    const slowPrep = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep: 1, ovens: 40, counter: 40 } } };
    expect(reportCoachStep(slowPrep, OPEN)?.targets).toEqual(['report:bar:ovens']);
    const slowOvens = { ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, prep: 40, ovens: 1, counter: 40 } } };
    expect(reportCoachStep(slowOvens, OPEN)?.targets).toEqual(['report:bar:ovens']);
  });

  test('never again: once it has ended it does not start, and a new sheet opening changes nothing', () => {
    let s = onChapter3();
    for (const n of ['report-open', 'report-look', 'report-look', 'report-closed'] as const) s = note(s, n);
    const after = markReportOpened(s);
    expect(reportCoachStep(after, SHUT)).toBeNull();
    expect(reportCoachStep({ ...after, x: { ...after.x, chapters: { ...saveOf(after), report: false } } }, SHUT)).toBeNull();
    expect(note(after, 'report-open')).toBe(after);
    expect(note(after, 'report-look')).toBe(after);
    // the save keeps it
    expect(migrateChapterSave(JSON.parse(JSON.stringify(saveOf(after))))?.coachDone).toContain(REPORT_COACH);
  });

  test('a save that already opened the report never sees it, and the task is done whether or not the coach ran', () => {
    const task = ch('downtown-3').tasks[2];
    const s = onChapter3();
    expect(taskProgress(s, task).done).toBe(false);
    const opened = markReportOpened(s);
    expect(taskProgress(opened, task).done).toBe(true);
    expect(reportCoachStep(opened, SHUT)).toBeNull();
    expect(reportCoachStep(opened, OPEN)).toBeNull();
    // opened with the coach under way: the task is done too
    expect(taskProgress(markReportOpened(note(s, 'report-open')), task).done).toBe(true);
  });

  test('waits for its moment: other tasks open, a cut-scene or sheet up, the tutorial running, no strip yet', () => {
    const s = onChapter3();
    expect(reportCoachStep(s, { sheetOpen: false, clear: false })).toBeNull();
    const hireOpen = {
      ...s,
      shops: { ...s.shops, downtown: { ...s.shops.downtown, heads: { prep: true, oven: true, counter: false } } },
      x: { ...s.x, chapters: { ...saveOf(s), done: keysOf('downtown-1', 'downtown-2') } },
    };
    expect(nextTask(hireOpen)?.task.kind).not.toBe('report');
    expect(reportCoachStep(hireOpen, SHUT)).toBeNull();
    const inTutorial = { ...s, tutorial: 9 };
    expect(coachStep(inTutorial)).not.toBeNull();
    expect(reportCoachStep(inTutorial, SHUT)).toBeNull();
    expect(
      reportCoachStep({ ...s, shops: { ...s.shops, downtown: { ...s.shops.downtown, heads: { prep: false, oven: false, counter: false } } } }, SHUT),
    ).toBeNull();
    // stray notes from the sheet with no coach up change nothing
    expect(saveOf(note(G.newGame(0), 'report-open')).coachDone).toEqual([]);
    expect(note(s, 'report-look')).toBe(s);
    expect(note(s, 'report-closed')).toBe(s);
  });

  test('a restart in the middle of it ends it when the sheet is found shut', () => {
    let s = note(onChapter3(), 'report-open');
    s = JSON.parse(JSON.stringify(s)) as G.GameState;
    expect(reportCoachStep(s, SHUT)).toBeNull();
    s = note(s, 'report-closed');
    expect(saveOf(s).coachDone).toContain(REPORT_COACH);
  });
});

describe('coachTargets (C167)', () => {
  test("the current step's targets, none when the tutorial is not running", () => {
    const open = { ...G.newGame(0), seenScenes: ['downtown-1'], tutorial: 1 };
    expect(coachTargets(open)).toEqual(['station:prep']);
    expect(coachTargets({ ...open, tutorial: 11 })).toContain('ovens:all');
    expect(coachTargets({ ...open, tutorial: G.TUTORIAL_DONE })).toEqual([]);
    expect(coachTargets({ ...open, tutorial: 0 })).toEqual([]);
  });
});
