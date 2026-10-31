/// <reference types="jest" />
// T77 (C100): a panel holds at most two figures. `cast` is a tuple type, every scene in the content obeys it, and the staging
// helper handles 0, 1 and 2 figures (a third used to crash the player: stage[2] was undefined).
import { HOME_SCENES } from '../../content/scenes/home';
import type { Cast, ScenePanel } from '../../content/types';
import { stageLayout, tailShare } from '../cutscene/staging';

describe('T77 cast size', () => {
  test('every panel in the content has 0, 1 or 2 figures', () => {
    const panels = HOME_SCENES.flatMap((s) => s.panels);
    expect(panels.length).toBeGreaterThan(50);
    for (const p of panels) expect(p.cast.length).toBeLessThanOrEqual(2);
  });

  test('the type refuses a third figure', () => {
    const one = { id: 'dale', mood: 'happy' } as const;
    const ok: Cast[] = [[], [one], [one, one]];
    expect(ok.map((c) => c.length)).toEqual([0, 1, 2]);
    // @ts-expect-error a panel with three figures does not type-check
    const three: Cast = [one, one, one];
    expect(three).toHaveLength(3); // (only the compiler stops it; the player is also safe, see the staging test below)
    const panel: Pick<ScenePanel, 'cast'> = { cast: [one] };
    expect(panel.cast).toHaveLength(1);
  });

  test('a panel with a recipe card has a figure to hold it', () => {
    for (const s of HOME_SCENES) for (const p of s.panels) if (p.prop === 'recipe-card') expect(p.cast.length).toBeGreaterThan(0);
  });

  test('staging gives one placement per figure for 0, 1 and 2, and never more than two', () => {
    for (const [w, h] of [[290, 349], [363, 497], [514, 718]]) {
      expect(stageLayout(0, w, h, -1)).toEqual([]);
      expect(stageLayout(1, w, h, 0)).toHaveLength(1);
      expect(stageLayout(2, w, h, 1)).toHaveLength(2);
      // a stray third figure is clamped to the two slots instead of indexing past the end
      expect(stageLayout(3, w, h, 1)).toHaveLength(2);
    }
    expect(tailShare(0, -1)).toBe(0.5);
    expect(tailShare(2, 1)).toBe(0.7);
  });
});
