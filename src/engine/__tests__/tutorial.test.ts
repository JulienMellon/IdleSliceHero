/// <reference types="jest" />
// Nonna's guided tutorial (P2).
import * as fs from 'fs';
import * as path from 'path';
import { chipShows } from '../../components/endgame/diamond-chip-model';
import * as G from '../game';
import { HOME_CITY } from '../../content/cities/home';
import {
  coachStep,
  HINTS,
  hintsAllowed,
  shopTutorialDone,
  showLockedTabs,
  stepsFor,
  TUTORIAL_DONE,
  tutorialAdvance,
  tutorialHoldsStory,
  tutorialNote,
  type TutorialNote,
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
  test('the script is 17 steps (15 of the shop, 2 of the Store intro) and the tutorial ends at 18', () => {
    expect(STEPS.map((st) => st.id)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    expect(TUTORIAL_DONE).toBe(18);
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
      [8, 'tutorial.8', ['tasks:story'], 'look'],
      [9, 'tutorial.9', [], 'free'],
      [10, 'tutorial.10', ['walk:ovens'], 'tap'],
      [11, 'tutorial.11', ['ovens:all', 'dial:oven'], 'look'],
      [12, 'tutorial.12', ['walk:all'], 'tap'],
      [13, 'tutorial.13', ['drawer:hire:prep'], 'look'],
      [14, 'tutorial.14', [], 'free'],
      [15, 'tutorial.15', ['station:prep', 'dial:prep'], 'look'],
      [16, 'tutorial.16', ['hud:store'], 'tap'],
      [17, 'tutorial.17', ['store:starter'], 'look'],
    ]);
  });
  test('walks the 17 steps on a simulated run and ends at 18', () => {
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
    // 7: the goal bar, which only the task list opening ends; 8: the list's Story tab, which only the list closing ends (v5.21)
    expect(s.tutorial).toBe(7);
    expect(coachStep(s)?.targets).toEqual(['hud:goal']);
    expect(tutorialNote(s, 'look')).toBe(s);
    expect(tutorialNote(s, 'tasks-closed')).toBe(s);
    s = tutorialNote(s, 'tasks-open');
    note();
    expect(coachStep(s)?.targets).toEqual(['tasks:story']);
    expect(tutorialNote(s, 'look')).toBe(s);
    expect(tutorialNote(s, 'tasks-open')).toBe(s);
    s = tutorialNote(s, 'tasks-closed');
    note();
    // the free "save up" step is next
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
    // the Store intro: the chip is lit until the Shop opens; the Starter card until the Shop is left
    expect(s.tutorial).toBe(16);
    expect(coachStep(s)?.targets).toEqual(['hud:store']);
    expect(tutorialNote(s, 'look')).toBe(s);
    expect(tutorialNote(s, 'store-left')).toBe(s);
    expect(tutorialHoldsStory(s)).toBe(false); // a player who never taps the chip is not kept from the story
    expect(shopTutorialDone(s)).toBe(true);
    s = tutorialNote(s, 'store-open');
    note();
    expect(s.tutorial).toBe(17);
    expect(coachStep(s)?.targets).toEqual(['store:starter']);
    // a look that is seen does not end it: only the Shop closing (Not now, Back) or the buy does
    expect(tutorialNote(s, 'look')).toBe(s);
    expect(tutorialHoldsStory(s)).toBe(true);
    s = tutorialNote(s, 'store-left');
    note();
    expect(s.tutorial).toBe(TUTORIAL_DONE);
    expect(coachStep(s)).toBeNull();
    expect(tutorialHoldsStory(s)).toBe(false);
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, TUTORIAL_DONE]);
  });
  // the screen-ended steps (6, 7, 8, 11, 12, 13, 15) in every state they can be in: managed or not, a note or not
  describe.each([6, 7, 8, 11, 12, 13, 15])('step %i', (n) => {
    const at = (managed: boolean) => {
      const g = { ...opened(), tutorial: n };
      return { ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, managed, sold: 5 } } };
    };
    test('a shop that runs itself: the shop steps are over at the next advance, the coach gone, and no note is needed (the Store intro is next)', () => {
      const g = at(true);
      expect(coachStep(g)).toBeNull();
      const next = tutorialAdvance(g);
      expect(next.tutorial).toBe(16);
      expect(coachStep(next)?.targets).toEqual(['hud:store']);
    });
    test('a shop tapped by hand: the step waits for the screen, which ends it', () => {
      const g = at(false);
      expect(coachStep(g)?.id).toBe(n);
      expect(tutorialAdvance(g).tutorial).toBe(n);
      const note = { 6: 'look', 7: 'tasks-open', 8: 'tasks-closed', 11: 'look', 12: 'drawer-open', 13: 'drawer-closed', 15: 'look' }[n] as TutorialNote;
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
  // saves: v5.20 never stored 7 or 8, and a save at 9 or later keeps its step
  test('a saved step 9 or later stays where it is; 7 and 8 are real steps now', () => {
    const g = opened();
    for (const n of [7, 8, 9, 15]) expect(coachStep({ ...g, tutorial: n })?.id).toBe(n);
    for (const n of [9, 11, 12, 13, 14, 15]) {
      const loaded = G.migrate(JSON.parse(JSON.stringify({ ...g, tutorial: n })), 0);
      expect(loaded.tutorial).toBe(n);
      expect(tutorialAdvance(loaded).tutorial).toBe(n);
    }
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
      // the step as shown: step 10 without the oven money falls back to "save up" (D374)
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

// v5.23 (card E6): Nonna's Store intro, steps 16 and 17
describe('the Store intro', () => {
  const at = (tutorial: number, patch: Partial<G.GameState> = {}): G.GameState => ({ ...opened(), tutorial, ...patch });
  const owner = (g: G.GameState): G.GameState => ({ ...g, rewards: { ...g.rewards, cosmetics: [...g.rewards.cosmetics, 'awning-founder'] } });
  test('16 lights the chip and ends when the Store opens; 17 lights the Starter card and ends when the Shop closes', () => {
    expect(coachStep(at(16))?.mode).toBe('tap');
    expect(tutorialNote(at(16), 'store-open').tutorial).toBe(17);
    expect(coachStep(at(17))?.mode).toBe('look');
    expect(tutorialNote(at(17), 'store-left').tutorial).toBe(TUTORIAL_DONE);
  });
  test('the intro runs even when the first shop runs itself (an existing player sees it once)', () => {
    const g = at(16);
    const managed = { ...g, shops: { ...g.shops, downtown: { ...g.shops.downtown, managed: true } } };
    expect(coachStep(managed)?.id).toBe(16);
    expect(tutorialAdvance(managed).tutorial).toBe(16);
  });
  test('an owner of the Starter Pack skips both steps, and buying on step 17 ends it', () => {
    expect(tutorialAdvance(owner(at(15, { tutorial: 16 }))).tutorial).toBe(TUTORIAL_DONE);
    expect(tutorialAdvance(owner(at(17))).tutorial).toBe(TUTORIAL_DONE);
    expect(tutorialAdvance(at(17)).tutorial).toBe(17);
  });
  test('story waits while the Starter card is lit (17), not at 16 or after; gifts wait through both', () => {
    expect(tutorialHoldsStory(at(16))).toBe(false);
    expect(tutorialHoldsStory(at(17))).toBe(true);
    expect(tutorialHoldsStory(at(TUTORIAL_DONE))).toBe(false);
    expect(shopTutorialDone(at(15))).toBe(false);
    expect(shopTutorialDone(at(16))).toBe(true);
    expect(shopTutorialDone(at(17))).toBe(true);
    expect(shopTutorialDone(at(TUTORIAL_DONE))).toBe(true);
    // the calendar and the hints gate on the coach mode (index.tsx `tutorialOn`): it is on for both steps
    expect(hintsAllowed(at(16)).toast).toBe(false);
    expect(hintsAllowed(at(17)).toast).toBe(false);
  });
  test('a tap outside the lit chip (store-skip) ends the intro at 16 and nowhere else; the chip stays', () => {
    const g = at(16);
    const out = tutorialNote(g, 'store-skip');
    expect(out.tutorial).toBe(TUTORIAL_DONE);
    expect(coachStep(out)).toBeNull();
    expect(tutorialHoldsStory(out)).toBe(false);
    expect(shopTutorialDone(out)).toBe(true);
    // the chip is shown from step 16 on, so it is still there to open the Shop
    expect(chipShows(out, false)).toBe(true);
    for (const n of [15, 17, TUTORIAL_DONE]) expect(tutorialNote(at(n), 'store-skip')).toEqual(at(n));
  });
  test('only the lit chip step is skippable, and the overlay and the flow hook carry it', () => {
    const src = (f: string) => fs.readFileSync(path.join(__dirname, '..', '..', 'components', 'coach', f), 'utf8');
    expect(src('overlay.tsx')).toMatch(/skippable && outsideTaps\.current\+\+ >= 1 \? skipRef\.current\?\.\(\) : nudge\(\)/);
    expect(src('use-coach-flow.ts')).toContain("note('store-skip')");
  });
});
