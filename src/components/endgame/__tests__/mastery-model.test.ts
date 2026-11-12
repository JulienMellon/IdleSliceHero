/// <reference types="jest" />
import { MASTERY_STARS } from '../../../content/endgame';
import { FOOTPRINTS, NEIGHBORHOODS, OVEN_GRADES } from '../../../content/tuning';
import type { NeighborhoodId } from '../../../content/types';
import * as G from '../../../engine/game';
import { masteryTotal, nextStar } from '../../../engine/features/mastery';
import { masteryGoal, goalLabelFit } from '../../goal-model';
import { masteryNewsText, nextStarLine, pipBits, starName, starPath, starPips, starToast } from '../mastery-model';

const IDS = NEIGHBORHOODS.map((n) => n.id);
const withShop = (g: G.GameState, id: NeighborhoodId, patch: Partial<G.Shop>): G.GameState => ({ ...g, shops: { ...g.shops, [id]: { ...g.shops[id], ...patch } } });
const city = (finale: boolean): G.GameState => {
  let g = G.newGame(1_700_000_000_000);
  for (const id of IDS) g = withShop(g, id, { built: true, managed: true, heads: G.noHeads(), prep: 10, ovens: 10, counter: 10 });
  return finale ? { ...g, seenScenes: ['uptown-4'] } : g;
};
const top = { footprint: FOOTPRINTS.length - 1, grade: OVEN_GRADES.length - 1, heads: G.allHeads() };

describe('post-story goal bar (D427)', () => {
  test('null while the story is still being told: the ordinary goals show', () => {
    expect(masteryGoal(city(false))).toBeNull();
  });

  test('after the last finale: "Mastery n/18" with the bar at n of 18 and the next star', () => {
    const g = withShop(city(true), 'suburbs', { footprint: FOOTPRINTS.length - 1 });
    const goal = masteryGoal(g)!;
    expect(masteryTotal(g)).toBe(1);
    expect(goal.current).toBe(1);
    expect(goal.target).toBe(18);
    expect(goal.label.startsWith('Mastery 1/18')).toBe(true);
    const next = nextStar(g)!;
    expect(goal.label).toContain(nextStarLine(next));
    expect(goal.text).toBe(`${next.have}/${next.need}`);
  });

  test('all 18: the count alone and a star', () => {
    let g = city(true);
    for (const id of IDS) g = withShop(g, id, top);
    const goal = masteryGoal(g)!;
    expect(goal).toMatchObject({ label: 'Mastery 18/18', text: '★', current: 18, target: 18 });
  });

  test('the count leads the words, so a clipped line still shows it; the amount fits an iPhone SE bar with the words kept readable', () => {
    for (const id of IDS) {
      const g = withShop(city(true), id, { footprint: 1 });
      const goal = masteryGoal(g)!;
      // the SE's goal bar beside two chips is about 200 pt
      expect(goalLabelFit(goal.label, goal.text, 200).fits).toBe(true);
    }
  });
});

describe('star names, toasts and pips', () => {
  test('names and toasts come from the copy', () => {
    expect(MASTERY_STARS.map(starName)).toEqual(['Full Crew', 'Flagship', 'Golden Ovens']);
    expect(starToast('uptown', 'golden')).toBe('Golden ovens glow in Uptown!');
    expect(starToast('suburbs', 'flagship')).toBe('Flagship Suburbs! Fly the flag!');
    expect(masteryNewsText({ kind: 'star', shopId: 'downtown', star: 'heads' })).toBe('Every head hired in Downtown!');
    expect(masteryNewsText({ kind: 'cosmetic', id: 'oven-gold' })).toBeNull();
  });

  test('pips: heads, Flagship, golden, in that order', () => {
    const g = withShop(city(true), 'downtown', { heads: G.noHeads(), footprint: FOOTPRINTS.length - 1, grade: 0 });
    expect(starPips(g.shops.downtown)).toEqual([false, true, false]);
    expect(pipBits(starPips(g.shops.downtown))).toBe(2);
    expect(pipBits(starPips(withShop(g, 'downtown', top).shops.downtown))).toBe(7);
  });

  test('a star path is a closed ten-point outline', () => {
    const d = starPath(0, 0, 10);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.split('L')).toHaveLength(10);
  });
});
