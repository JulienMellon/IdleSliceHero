import { newGame } from '../../../engine/game';
import { type CoachStep, tutorialNote } from '../../../engine/tutorial';
import { Z } from '../../z-order';
import { coachView, DRAWER_STEP, fallbackStep, LAST_STEP, STARTER_STEP, STORE_STEP, TASKS_STEP } from '../coach-view';

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

  test('the Store step (16) lights the chip on any shop, not only the first', () => {
    const store = step(STORE_STEP, 'tap', ['hud:store']);
    expect(coachView(store, { ...screen, isFirst: false })).toEqual({ targets: ['hud:store'], mode: 'tap', text: 'line 16', hand: true, skippable: true });
    expect(coachView(store, screen)?.targets).toEqual(['hud:store']);
    // every other step still waits for the first shop
    expect(coachView(step(10, 'tap'), { ...screen, isFirst: false })).toBeNull();
  });

  test('only the Store step (16) can be left by tapping outside the chip', () => {
    expect(coachView(step(STORE_STEP, 'tap', ['hud:store']), screen)?.skippable).toBe(true);
    for (const id of [1, 7, 10, 12, 15]) expect(coachView(step(id, 'tap'), screen)?.skippable).toBe(false);
  });

  test('the Starter card step (17) is drawn by the Shop: the game screen shows nothing for it', () => {
    expect(coachView(step(STARTER_STEP, 'look', ['store:starter']), screen)).toBeNull();
    expect(coachView(step(STARTER_STEP, 'look', ['store:starter']), { ...screen, isFirst: false })).toBeNull();
  });

  test('a step shows its own targets, mode and line, with a hand', () => {
    expect(coachView(step(3, 'tap', ['station:oven']), screen)).toEqual({
      targets: ['station:oven'],
      mode: 'tap',
      text: 'line 3',
      hand: true,
      skippable: false,
    });
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

describe('step 8, the task list (A44, T125)', () => {
  const at = (tutorial: number) => ({ ...newGame(0), tutorial });
  const list = step(TASKS_STEP, 'look', ['tasks:story']);

  test('its look turns free once seen, so the list can be read and closed; a look seen on another step does not carry over', () => {
    expect(coachView(list, { ...screen, lookedAt: TASKS_STEP })?.mode).toBe('free');
    expect(coachView(list, { ...screen, lookedAt: 0 })?.mode).toBe('look');
    expect(coachView(list, { ...screen, lookedAt: 7 })?.mode).toBe('look');
  });

  test('after a relaunch with the list closed the step blocks nothing: it is a look (the overlay draws nothing without its target) and opening then closing the list ends it', () => {
    expect(coachView(list, screen)?.mode).toBe('look');
    const g = at(TASKS_STEP);
    expect(tutorialNote(g, 'look')).toBe(g);
    expect(tutorialNote(g, 'tasks-open')).toBe(g);
    expect(tutorialNote(g, 'tasks-closed').tutorial).toBeGreaterThan(TASKS_STEP);
  });

  test('the list opening ends step 7', () => {
    expect(tutorialNote(at(7), 'tasks-open').tutorial).toBeGreaterThan(7);
  });
});

describe('the coach sits under every sheet and the offline popup (T129)', () => {
  test('the coach layer is over the HUD and under the gift, the night oven, the sheets and the offline popup, so none of them is ever behind its scrim', () => {
    expect(Z.coach).toBeGreaterThan(Z.hud);
    for (const above of [Z.gift, Z.nightOven, Z.sheets, Z.offline, Z.coins]) expect(Z.coach).toBeLessThan(above);
  });
});
