import { newGame } from '../../../engine/game';
import { type CoachStep, tutorialNote } from '../../../engine/tutorial';
import { coachView, DRAWER_STEP, fallbackStep, LAST_STEP } from '../coach-view';

const step = (id: number, mode: CoachStep['mode'], targets: CoachStep['targets'] = ['station:prep']): CoachStep => ({
  id,
  key: `tutorial.${id}`,
  text: `line ${id}`,
  targets,
  mode,
});
const screen = { isFirst: true, drawerOpen: false, lookedAt: 0 };

describe('coachView', () => {
  test('no step, or another shop on screen: nothing', () => {
    expect(coachView(null, screen)).toBeNull();
    expect(coachView(step(1, 'tap'), { ...screen, isFirst: false })).toBeNull();
  });

  test('a step shows its own targets, mode and line, with a hand', () => {
    expect(coachView(step(3, 'tap', ['station:oven']), screen)).toEqual({ targets: ['station:oven'], mode: 'tap', text: 'line 3', hand: true });
  });

  test('the last step has no hand: the ring carries it', () => {
    expect(coachView(step(LAST_STEP, 'look'), screen)?.hand).toBe(false);
  });

  test('the drawer hides the overlay, except at the drawer step', () => {
    const open = { ...screen, drawerOpen: true };
    expect(coachView(step(12, 'tap'), open)).toBeNull();
    expect(coachView(step(10, 'tap'), open)).toBeNull();
    expect(coachView(step(DRAWER_STEP, 'look', ['drawer:hire:prep']), open)?.mode).toBe('look');
  });

  test('the drawer step’s look turns free once seen, so the hire card and Close can be tapped; other looks stay looks', () => {
    const d = step(DRAWER_STEP, 'look', ['drawer:hire:prep']);
    expect(coachView(d, { ...screen, drawerOpen: true, lookedAt: DRAWER_STEP })?.mode).toBe('free');
    expect(coachView(d, { ...screen, drawerOpen: true, lookedAt: 0 })?.mode).toBe('look');
    // a look seen on an earlier step does not carry over
    expect(coachView(d, { ...screen, drawerOpen: true, lookedAt: 11 })?.mode).toBe('look');
    expect(coachView(step(11, 'look'), { ...screen, lookedAt: 11 })?.mode).toBe('look');
  });
});

describe('fallbackStep: the timer that ends a look the overlay cannot show', () => {
  test('armed for a look step, with the drawer shut', () => {
    expect(fallbackStep(step(11, 'look'), { drawerOpen: false })).toBe(11);
    expect(fallbackStep(step(6, 'look'), { drawerOpen: false })).toBe(6);
  });

  test('not at the drawer step: closing the drawer ends that one', () => {
    expect(fallbackStep(step(DRAWER_STEP, 'look'), { drawerOpen: false })).toBe(0);
  });

  test('not while the drawer is open: hiring from it must not end step 15 before it is seen (C161)', () => {
    expect(fallbackStep(step(LAST_STEP, 'look'), { drawerOpen: true })).toBe(0);
    expect(fallbackStep(step(LAST_STEP, 'look'), { drawerOpen: false })).toBe(LAST_STEP);
  });

  test('not for a tap, wait or free step, or no step', () => {
    for (const m of ['tap', 'wait', 'free'] as const) expect(fallbackStep(step(1, m), { drawerOpen: false })).toBe(0);
    expect(fallbackStep(null, { drawerOpen: false })).toBe(0);
  });
});

describe('the notes the screen sends', () => {
  const at = (tutorial: number) => ({ ...newGame(0), tutorial });

  test('the drawer closing at step 12 changes nothing (12 waits for it to open)', () => {
    const g = at(12);
    expect(tutorialNote(g, 'drawer-closed')).toBe(g);
    expect(tutorialNote(g, 'drawer-open').tutorial).toBeGreaterThan(12);
  });

  test('the drawer closing at step 13 ends it', () => {
    expect(tutorialNote(at(DRAWER_STEP), 'drawer-closed').tutorial).toBeGreaterThan(DRAWER_STEP);
  });

  test('a look note does not end the drawer step', () => {
    const g = at(DRAWER_STEP);
    expect(tutorialNote(g, 'look')).toBe(g);
  });
});
