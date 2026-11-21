/// <reference types="jest" />
// Nonna's guided tutorial (P2).
import * as G from '../game';
import { HOME_CITY } from '../../content/cities/home';
import {
  CHAPTERS_ON,
  coachStep,
  HINTS,
  hintsAllowed,
  showLockedTabs,
  stepsFor,
  TUTORIAL_DONE,
  tutorialAdvance,
  tutorialHoldsStory,
  tutorialNote,
} from '../tutorial';

const STEPS = stepsFor(HOME_CITY);
const opened = () => tutorialAdvance({ ...G.newGame(0), seenScenes: ['downtown-1'] });
const tap = (s: G.GameState, st: 'prep' | 'oven' | 'counter') => {
  const r = G.tapStation(s, 'downtown', st);
  return r.ok ? tutorialAdvance(r.state) : s;
};
const run = (s: G.GameState, seconds: number) => {
  for (let i = 0; i < seconds * 5; i++) s = tutorialAdvance(G.playTick(s, 0.2));
  return s;
};

describe('tutorial', () => {
  test('starts once the opening scene has played', () => {
    expect(tutorialAdvance(G.newGame(0)).tutorial).toBe(0);
    expect(coachStep(opened())?.targets).toEqual(['station:prep']);
  });
  test('the script is 15 steps and the tutorial ends at 16; chapters are off in this version', () => {
    expect(STEPS.map((st) => st.id)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(TUTORIAL_DONE).toBe(16);
    expect(CHAPTERS_ON).toBe(false);
  });
  test('each step names its targets and mode (card C3)', () => {
    expect(STEPS.map((st) => [st.id, st.key, st.targets, st.mode])).toEqual([
      [1, 'tutorial.1', ['station:prep'], 'tap'],
      [2, 'tutorial.2', ['station:prep', 'dial:prep'], 'wait'],
      [3, 'tutorial.3', ['station:oven'], 'tap'],
      [4, 'tutorial.4', ['station:oven', 'dial:oven'], 'wait'],
      [5, 'tutorial.5', ['station:counter'], 'tap'],
      [6, 'tutorial.6', ['hud:cash'], 'look'],
      [7, 'tutorial.7', ['hud:goal'], 'tap'],
      [8, 'tutorial.8', [], 'look'],
      [9, 'tutorial.9', [], 'free'],
      [10, 'tutorial.10', ['walk:ovens'], 'tap'],
      [11, 'tutorial.11', ['ovens:all', 'dial:oven'], 'look'],
      [12, 'tutorial.12', ['walk:all'], 'tap'],
      [13, 'tutorial.13', ['drawer:hire:prep'], 'look'],
      [14, 'tutorial.14', [], 'free'],
      [15, 'tutorial.15', ['station:prep', 'dial:prep'], 'look'],
    ]);
  });
  test('walks the 15 steps on a simulated run, skipping only 7 and 8, and ends at 16', () => {
    let s = opened();
    const seen: number[] = [s.tutorial];
    const note = () => {
      if (seen[seen.length - 1] !== s.tutorial) seen.push(s.tutorial);
    };
    s = tap(s, 'prep');
    note();
    expect(coachStep(s)?.text).toMatch(/dial/); // G82: no "tap the oven" while the dough is still rolling
    s = run(s, 3);
    note();
    s = tap(s, 'oven');
    note();
    s = run(s, 1);
    note();
    s = run(s, 4);
    note();
    s = tap(s, 'counter');
    note();
    s = run(s, 5);
    note();
    // step 6: the cash, until the screen has shown it (the sale is in, so it is a look; a tap or the look timer)
    expect(s.tutorial).toBe(6);
    expect(coachStep(s)?.mode).toBe('look');
    // (the cash goes elsewhere here, so the free "save up" step is shown: a first sale can already pay for the ovens)
    s = { ...s, cash: 0 };
    s = tutorialNote(s, 'look');
    note();
    // 7 and 8 are skipped: the free "save up" step is next
    expect(s.tutorial).toBe(9);
    expect(coachStep(s)?.mode).toBe('free');
    for (let k = 0; k < 400 && s.tutorial < 10; k++) {
      for (const st of ['counter', 'oven', 'prep'] as const) s = tap(s, st);
      s = run(s, 1);
    }
    note();
    expect(s.tutorial).toBe(10);
    expect(coachStep(s)?.targets).toEqual(['walk:ovens']);
    const b = G.buyUpgrade(s, 'downtown', 'ovens');
    expect(b.ok).toBe(true);
    if (b.ok) s = tutorialAdvance(b.state);
    note();
    expect(coachStep(s)?.targets).toEqual(['ovens:all', 'dial:oven']);
    s = tutorialNote(s, 'look');
    note();
    expect(coachStep(s)?.targets).toEqual(['walk:all']);
    // nothing but the drawer opening ends step 12 (a look note does nothing)
    expect(tutorialNote(s, 'look')).toBe(s);
    expect(tutorialNote(s, 'drawer-closed')).toBe(s);
    s = tutorialNote(s, 'drawer-open');
    note();
    expect(coachStep(s)?.targets).toEqual(['drawer:hire:prep']);
    expect(tutorialNote(s, 'drawer-open')).toBe(s);
    s = tutorialNote(s, 'drawer-closed');
    note();
    expect(s.tutorial).toBe(14);
    expect(coachStep(s)?.mode).toBe('free');
    for (let k = 0; k < 400 && s.cash < G.headCost('downtown', 'prep'); k++) {
      for (const st of ['counter', 'oven', 'prep'] as const) s = tap(s, st);
      s = run(s, 1);
    }
    const h = G.buyUpgrade(s, 'downtown', 'headPrep');
    expect(h.ok).toBe(true);
    if (h.ok) s = tutorialAdvance(h.state);
    note();
    expect(s.tutorial).toBe(15);
    expect(coachStep(s)?.targets).toEqual(['station:prep', 'dial:prep']);
    s = tutorialNote(s, 'look');
    note();
    expect(s.tutorial).toBe(TUTORIAL_DONE);
    expect(coachStep(s)).toBeNull();
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, TUTORIAL_DONE]);
  });
  // the screen-ended steps (6, 11, 12, 13, 15) in every state they can be in: managed or not, a note or not
  describe.each([6, 11, 12, 13, 15])('step %i', (n) => {
    const at = (managed: boolean) => {
      const g = { ...opened(), tutorial: n };
      return { ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, managed, sold: 5 } } };
    };
    test('a shop that runs itself: the tutorial is over at the next advance, the coach gone, and no note is needed', () => {
      const g = at(true);
      expect(coachStep(g)).toBeNull();
      const next = tutorialAdvance(g);
      expect(next.tutorial).toBe(TUTORIAL_DONE);
      expect(tutorialHoldsStory(next)).toBe(false);
    });
    test('a shop tapped by hand: the step waits for the screen, which ends it', () => {
      const g = at(false);
      expect(coachStep(g)?.id).toBe(n);
      expect(tutorialAdvance(g).tutorial).toBe(n);
      const note = { 6: 'look', 11: 'look', 12: 'drawer-open', 13: 'drawer-closed', 15: 'look' }[n] as 'look' | 'drawer-open' | 'drawer-closed';
      expect(tutorialNote(g, note).tutorial).toBeGreaterThan(n);
    });
  });
  test('step 6 waits for the first sale: no look note before it', () => {
    const g = opened();
    const six = { ...g, tutorial: 6 };
    expect(coachStep(six)?.mode).toBe('wait');
    expect(tutorialNote(six, 'look')).toBe(six);
    const sold = { ...six, shops: { ...six.shops, downtown: { ...six.shops.downtown, sold: 1 } } };
    expect(coachStep(sold)?.mode).toBe('look');
  });
  test('saved steps 7 and 8 (chapters off) read as step 9, the free one', () => {
    const g = opened();
    expect(coachStep({ ...g, tutorial: 7 })?.id).toBe(9);
    expect(coachStep({ ...g, tutorial: 8 })?.id).toBe(9);
  });
  test('step 9 names the price, and hires finish steps 12 to 14 whatever the drawer did', () => {
    const g = { ...opened(), tutorial: 9 };
    expect(coachStep(g)?.text).toMatch(/\$\d/);
    expect(coachStep(g)?.text).not.toMatch(/\{/);
    for (const n of [12, 13, 14]) {
      const hired = { ...g, tutorial: n, shops: { ...g.shops, downtown: { ...g.shops.downtown, heads: { ...g.shops.downtown.heads, prep: true } } } };
      expect(tutorialAdvance(hired).tutorial).toBe(15);
    }
  });
  // D374: the Ovens cash went elsewhere
  test('D374: at step 10 with the oven money spent, Nonna goes back to "save up again" (tutorial.alt.9), free play', () => {
    const g = { ...opened(), tutorial: 10, cash: 1e9 };
    expect(coachStep(g)?.key).toBe('tutorial.10');
    expect(coachStep(g)?.mode).toBe('tap');
    const spent = coachStep({ ...g, cash: 0 });
    expect(spent?.key).toBe('tutorial.alt.9');
    expect(spent?.text).toMatch(/^Ay!/);
    expect(spent?.text).toMatch(/\$\d/);
    expect(spent?.mode).toBe('free');
    expect(spent?.targets).toEqual([]);
    // and with the cash back, the step is the oven again; the advance never leaves step 10 until the ovens are bought
    expect(tutorialAdvance({ ...g, cash: 0 }).tutorial).toBe(10);
  });
  test('step 13 says so when Marco is already affordable (tutorial.alt.13)', () => {
    const g = { ...opened(), tutorial: 13, cash: 0 };
    expect(coachStep(g)?.key).toBe('tutorial.13');
    expect(coachStep(g)?.text).toMatch(/Marco/);
    const rich = coachStep({ ...g, cash: 1e9 });
    expect(rich?.key).toBe('tutorial.alt.13');
    expect(rich?.text).toMatch(/You can hire him now/);
  });
  test('the first batch is quick (≤ 3 s in the oven)', () => {
    const s = tap(run(tap(opened(), 'prep'), 3), 'oven');
    expect(s.shops.downtown.line.oven!.total).toBeLessThanOrEqual(3);
  });
  test('story scenes wait through step 11 and not after', () => {
    expect(tutorialHoldsStory({ ...opened(), tutorial: 3 })).toBe(true);
    expect(tutorialHoldsStory({ ...opened(), tutorial: 11 })).toBe(true);
    expect(tutorialHoldsStory({ ...opened(), tutorial: 12 })).toBe(false);
    expect(tutorialHoldsStory({ ...opened(), tutorial: 0 })).toBe(false);
  });
  test('saves from before the tutorial skip it once pizza has been sold; new saves start it', () => {
    const v3 = JSON.parse(JSON.stringify(G.newGame(0)));
    delete v3.tutorial;
    v3.shops.downtown.sold = 12;
    expect(G.migrate(v3, 0).tutorial).toBe(TUTORIAL_DONE);
    const fresh = JSON.parse(JSON.stringify(G.newGame(0)));
    delete fresh.tutorial;
    expect(G.migrate(fresh, 0).tutorial).toBe(0);
  });
  test('Nonna taking over ends the tutorial', () => {
    expect(coachStep({ ...opened(), shops: { ...opened().shops, downtown: { ...opened().shops.downtown, managed: true } } })).toBeNull();
  });
  test('every step has a line of 70 characters or fewer, from the copy table, with Marco named by the city', () => {
    for (const st of STEPS) {
      expect(st.text.length).toBeLessThanOrEqual(70);
      expect(st.text).not.toBe(st.key);
    }
    expect(STEPS[12].text).toMatch(/^Marco /);
    // G83: the wait steps (2 and 4) light the station and its dial
    expect(STEPS.filter((st) => st.mode === 'wait').map((st) => st.targets)).toEqual([
      ['station:prep', 'dial:prep'],
      ['station:oven', 'dial:oven'],
    ]);
  });
  // U4: one instruction at a time; the free steps (9 and 14) are where the hints show
  test('at every tutorial step but the free ones no hint is allowed (Nonna is the one voice); at 9 and 14 and once it is over, all of them', () => {
    for (const st of STEPS) {
      const g = { ...opened(), tutorial: st.id };
      expect(coachStep(g)).not.toBeNull();
      const allowed = HINTS.filter((h) => hintsAllowed(g)[h]);
      // the step as shown: 7 and 8 read as step 9 while the chapters are off, and step 10 without the oven money falls back to "save up" (D374)
      expect(allowed).toEqual(coachStep(g)?.mode === 'free' ? [...HINTS] : []);
    }
    const over = { ...opened(), tutorial: TUTORIAL_DONE };
    expect(HINTS.every((h) => hintsAllowed(over)[h])).toBe(true);
    // Nonna running Downtown ends the tutorial for hints too
    const g = opened();
    expect(HINTS.every((h) => hintsAllowed({ ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, managed: true } } })[h])).toBe(true);
  });
  test('the scene and the screen ask hintsAllowed (no second tutorial test of their own)', () => {
    const read = (p: string) => require('fs').readFileSync(require('path').join(__dirname, '../../..', p), 'utf8') as string;
    expect(read('src/components/storefront.tsx')).toMatch(/hintsAllowed\(/);
    expect(read('src/app/index.tsx')).toMatch(/hintsAllowed\(/);
  });
  test('the padlocked tabs wait for the first hired head', () => {
    const g = opened();
    expect(showLockedTabs(g)).toBe(false);
    expect(showLockedTabs({ ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, heads: { ...g.shops.downtown.heads, prep: true } } } })).toBe(true);
    expect(showLockedTabs({ ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, managed: true } } })).toBe(true);
    // the shop tabs ask it (a source check: the strip is a component)
    const src = require('fs').readFileSync(require('path').join(__dirname, '../../components/shop-ui.tsx'), 'utf8') as string;
    expect(src).toMatch(/showLockedTabs\(/);
  });
});
