// A Boston save loads and its build locks resolve by the save's city (D-fix after card T2): no home id may be read from a Boston game's shops.
import '../features';
import * as G from '../game';
import { cityOf, hoodIds } from '../../content/cities';

const NOW = 1_700_000_000_000;
const HOME = hoodIds(cityOf({ city: 'home' }));
const BOSTON = hoodIds(cityOf({ city: 'boston' }));

function bostonSave(built: string[]) {
  const g = G.newGame(NOW, 'boston');
  const shops = Object.fromEntries(BOSTON.map((id) => [id, { ...g.shops[id], built: built.includes(id) }]));
  return JSON.parse(JSON.stringify({ ...g, cash: 5e9, shops, active: built[built.length - 1] }));
}

describe('loading a Boston save', () => {
  it('keeps the city and gives every Boston shop a record (and no home one)', () => {
    const g = G.migrate(bostonSave([BOSTON[0], BOSTON[1]]), NOW);
    expect(g.city).toBe('boston');
    expect(Object.keys(g.shops).sort()).toEqual([...BOSTON].sort());
    expect(g.shops[BOSTON[1]].built).toBe(true);
    expect(g.active).toBe(BOSTON[1]);
  });
  it("buildLock answers for the city the save is in, and never throws for another city's id", () => {
    const g = G.migrate(bostonSave([BOSTON[0]]), NOW);
    expect(G.buildLock(g, BOSTON[0])).toBe('Built');
    expect(typeof G.buildLock(g, BOSTON[2])).toBe('string');
    for (const id of HOME) expect(() => G.buildLock(g, id)).not.toThrow();
    expect(HOME.every((id) => G.buildLock(g, id) !== null)).toBe(true);
  });
  it('buildShop on a Boston lot spends the Boston price; on a home id it refuses', () => {
    const g = G.migrate(bostonSave([BOSTON[0]]), NOW);
    const seen = { ...g, seenScenes: [...g.seenScenes, cityOf(g).fit.takeover.sceneId] };
    const r = G.buildShop(seen, BOSTON[1]);
    expect(r.ok).toBe(true);
    expect(G.buildShop(seen, HOME[1]).ok).toBe(false);
  });
});
