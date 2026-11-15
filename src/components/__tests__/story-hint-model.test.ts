/// <reference types="jest" />
// v5.16 (T1b): the story wait hint is a one-line banner in the waiting neighbourhood's drawer, and only there.
import { NEIGHBORHOODS } from '../../content/tuning';
import type { NeighborhoodId } from '../../content/types';
import * as G from '../../engine/game';
import { HINT_FONT, hintFit, hintForHood } from '../cutscene/story-hint-model';

const HOODS = NEIGHBORHOODS.map((n) => n.id) as NeighborhoodId[];
const name = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);
/** Every sentence the engine can say: a finale to win over, or the Pier 9 dock, for each neighbourhood waiting. */
const SENTENCES = HOODS.flatMap((waiting) => [...HOODS.filter((h) => h !== waiting).map((f) => `Win over ${name(f)} to continue ${name(waiting)}’s story`), `Save Marisol’s dock to continue ${name(waiting)}’s story`]);

describe('story wait hint banner', () => {
  test("it shows in the waiting neighbourhood's drawer and in no other", () => {
    const hint = 'Win over Industrial to continue Uptown’s story';
    expect(hintForHood(hint, 'uptown')).toBe(hint);
    for (const h of HOODS.filter((x) => x !== 'uptown')) expect([h, hintForHood(hint, h)]).toEqual([h, null]);
    expect(hintForHood(null, 'uptown')).toBeNull();
  });

  test("it picks the neighbourhood out of the engine's own sentence", () => {
    // an Uptown hint ("...continue Uptown's story") is not University's even though University is named as the finale to win
    expect(hintForHood('Win over University to continue Uptown’s story', 'university')).toBeNull();
    expect(hintForHood('Save Marisol’s dock to continue University’s story', 'university')).toBe('Save Marisol’s dock to continue University’s story');
    // and it works on a real game state
    const g: G.GameState = { ...G.newGame(0), seenScenes: ['uptown-1', 'uptown-2'], shops: { ...G.newGame(0).shops, uptown: { ...G.newGame(0).shops.uptown, built: true, sold: 700000 } } };
    const hint = G.storyWaitHint(g);
    expect(hint).toBe('Win over Industrial to continue Uptown’s story');
    expect(hintForHood(hint, 'uptown')).toBe(hint);
    expect(hintForHood(hint, 'industrial')).toBeNull();
  });

  test('every sentence the engine can say fits one line at 10 pt or more on every phone width', () => {
    for (const w of [320, 375, 393, 430, 744]) {
      for (const text of SENTENCES) {
        const f = hintFit(text, w);
        expect([w, text, f.fits, f.fontSize >= HINT_FONT.min, f.fontSize <= HINT_FONT.max]).toEqual([w, text, true, true, true]);
      }
    }
  });

  test('the font is the drawer banner size when there is room and shrinks as the line meets the edge', () => {
    expect(hintFit('Short hint', 393).fontSize).toBe(HINT_FONT.max);
    expect(hintFit(SENTENCES[0], 320).fontSize).toBeLessThan(hintFit(SENTENCES[0], 430).fontSize);
    expect(hintFit('x'.repeat(200), 320).fits).toBe(false);
  });
});
