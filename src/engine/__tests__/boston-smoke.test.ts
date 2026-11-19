// T106: a Boston game never throws from the surfaces that used to read the home city (K2 night oven, K3 drawer and reroll pool, K4 mastery toast and goal),
// and the founder, the scene heading and the story hint name Boston's own neighbourhoods.
import '../features';
import * as G from '../game';
import { cityOf, hoodIds } from '../../content/cities';
import { nightOvenLock, nightOvenView } from '../night-oven';
import { nextSceneTeaser } from '../teaser';
import { sceneHeading } from '../cutscene-input';
import { masteryTotal, nextStar } from '../features/mastery';
import { drawerCards, drawerKey } from '../../components/drawer-model';
import { masteryGoal } from '../../components/goal-model';
import { nextStarLine, starToast } from '../../components/endgame/mastery-model';
import { hintForHood } from '../../components/cutscene/story-hint-model';
import { rerollTask } from '../../components/store/ad-model';

const NOW = new Date(2026, 10, 11, 12, 0, 0).getTime();
const BOSTON = hoodIds(cityOf({ city: 'boston' }));

function boston(built: number): G.GameState {
  const g = G.newGame(NOW, 'boston');
  const shops = { ...g.shops };
  BOSTON.slice(0, built).forEach(
    (id) => (shops[id] = { ...shops[id], built: true, managed: true, heads: G.allHeads(), prep: 5, ovens: 5, counter: 5, drivers: 4, tables: 4 }),
  );
  return { ...g, shops, cash: 1e12, active: BOSTON[0], tutorial: G.TUTORIAL_DONE, seenScenes: [...g.seenScenes, cityOf(g).fit.takeover.sceneId] };
}

describe('a Boston game never reads a home id', () => {
  for (const n of [1, 3, 6]) {
    const g = boston(n);
    test(`${n} shops: night oven, teaser, mastery and ticks`, () => {
      expect(() => nightOvenView(g)).not.toThrow();
      expect(nightOvenLock(g, 1)).toBe(n >= 3 ? null : `Unlocks when you build ${G.def(BOSTON[2]).name}`);
      expect(nightOvenLock(g, 2)).toBe(n >= 5 ? 'Needs the 8 h oven first' : `Unlocks when you build ${G.def(BOSTON[4]).name}`);
      expect(() => nextSceneTeaser(g)).not.toThrow();
      expect(masteryTotal(g)).toBeGreaterThanOrEqual(0);
      const ns = nextStar(g);
      if (ns) {
        expect(BOSTON).toContain(ns.shopId);
        expect(starToast(ns.shopId, ns.star)).toContain(G.def(ns.shopId).name);
        expect(nextStarLine(ns)).toContain(G.def(ns.shopId).name);
      }
      expect(() => masteryGoal({ ...g, seenScenes: [...g.seenScenes, G.finaleId(BOSTON[BOSTON.length - 1])] })).not.toThrow();
      expect(() => rerollTask(g, 0)).not.toThrow();
      let s = g;
      for (let i = 0; i < 20; i++) s = G.playTick(s, 1, NOW + i * 1000);
      expect(Number.isFinite(s.cash)).toBe(true);
      expect(() => G.applyOffline({ ...s, lastSavedAt: NOW }, NOW + 3 * 3600_000)).not.toThrow();
    });
    test(`${n} shops: the drawer for every built shop`, () => {
      for (const id of BOSTON.slice(0, n)) {
        expect(() => drawerKey({ game: g, id })).not.toThrow();
        const v = drawerCards({ game: g, id });
        expect(v.built).toBe(n);
      }
    });
  }

  test('the first shop is the founder’s: Father Dom, not Nonna', () => {
    const v = drawerCards({
      game: { ...boston(1), shops: { ...boston(1).shops, [BOSTON[0]]: { ...boston(1).shops[BOSTON[0]], managed: false } } },
      id: BOSTON[0],
    });
    const m = v.cards.find((c) => c.key === 'manager')!;
    expect(m.title).toBe('Manager: Father Dom');
    expect(m.title).not.toMatch(/Nonna/);
  });
});

describe('Boston names (S65, G109)', () => {
  test('the scene heading and the story hint use the display name', () => {
    const scene = { title: 'Spoiler', neighborhood: 'back-bay', beat: 2, panels: [1, 2, 3] } as never;
    expect(sceneHeading(scene, 0, false)).toBe('Back Bay · Act 2');
    expect(hintForHood('Win over Fenway to continue Back Bay’s story', 'back-bay')).not.toBeNull();
  });
});
