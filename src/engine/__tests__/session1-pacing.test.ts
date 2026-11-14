// Pacing pins for v5.16 (card E0 step 6): session 1, the continuous player with the rewards on, from the first launch to the Suburbs
// finale. Heads at 2 / 5 / 8 min, Nonna at 10, Suburbs at 16, its manager at 28, its finale at 40 (each within its tolerance), the
// purchases that must be possible before Suburbs opens, and Suburbs locked until Nonna. Every target is a constant in
// scripts/pacing-fit.ts (SESSION1): card E2b's refit changes numbers there, not here. Check it with `npx tsx scripts/pacing-fit.ts session1`.
import { HOME_SCENES } from '../../content/scenes/home';
import { HEAD_COST_DOWNTOWN, NEIGHBORHOODS, NONNA_TAKEOVER } from '../../content/tuning';
import * as G from '../game';
import { SESSION1, SESSION1_MISSES, session1 } from '../../../scripts/pacing-fit';

jest.setTimeout(120_000);

describe('session 1: the first 40 minutes (rewards on)', () => {
  const m = session1();
  const within = (x: number, target: number, tolerance: number) => Math.abs(x - target) <= tolerance + 1e-9;

  SESSION1.downtownHeads.forEach((target, i) => {
    it(`Downtown's head number ${i + 1} is hired at ${target} min, ±${SESSION1.headsTolerance}`, () => {
      expect(m.heads.length).toBe(3);
      expect(within(m.heads[i], target, SESSION1.headsTolerance)).toBe(true);
    });
  });
  it(`Nonna takes over at ${SESSION1.takeover} min, ±${SESSION1.takeoverTolerance}`, () => expect(within(m.takeover, SESSION1.takeover, SESSION1.takeoverTolerance)).toBe(true));
  it(`Suburbs opens at ${SESSION1.suburbsOpens} min, ±${SESSION1.opensTolerance}`, () => expect(within(m.opens, SESSION1.suburbsOpens, SESSION1.opensTolerance)).toBe(true));
  it(`its manager comes at ${SESSION1.suburbsManager} min, ±${SESSION1.managerTolerance}`, () => expect(within(m.manager, SESSION1.suburbsManager, SESSION1.managerTolerance)).toBe(true));
  it(`its finale plays at ${SESSION1.suburbsFinale} min, ±${SESSION1.finaleTolerance}`, () => expect(within(m.finale, SESSION1.suburbsFinale, SESSION1.finaleTolerance)).toBe(true));

  it('a purchase at least every minute at the median', () => expect(m.medianGap).toBeLessThanOrEqual(SESSION1.medianBuyGapSeconds));
  it('the longest wait for a purchase and the longest gap between scenes stay at the fitted values (targets 120 s and 6 min: see SESSION1_MISSES)', () => {
    expect(m.maxGap).toBeLessThanOrEqual(SESSION1_MISSES.maxBuyGapSeconds);
    expect(m.sceneGap).toBeLessThanOrEqual(SESSION1_MISSES.maxSceneGapMinutes + 1e-9);
  });
  it('between Nonna and the Suburbs build the player buys the first Expand, the Stone oven and a decor tier', () => expect(m.bought).toEqual({ expand: true, stone: true, decor: true }));

  it('Suburbs stays locked until Nonna takes over, and is built only after', () => {
    expect(G.buildLock(G.newGame(0), 'suburbs')).not.toBeNull();
    expect(m.suburbsLocked).toBe(true);
    expect(m.opens).toBeGreaterThan(m.takeover);
  });

  it('Nonna’s takeover count is downtown-4’s trigger count', () => {
    expect(HOME_SCENES.find((s) => s.id === NONNA_TAKEOVER.sceneId)?.trigger).toMatchObject({ kind: 'deliveries', neighborhood: 'downtown', count: NONNA_TAKEOVER.pizzas });
  });
  it('Downtown’s headsCost is the sum of its three fixed head prices', () => {
    expect(NEIGHBORHOODS[0].headsCost).toBe(HEAD_COST_DOWNTOWN.prep + HEAD_COST_DOWNTOWN.oven + HEAD_COST_DOWNTOWN.counter);
  });
  it('the scenes come in story order', () => {
    const order = ['downtown-1', 'downtown-2', 'downtown-3', 'downtown-4', 'suburbs-1', 'suburbs-2', 'suburbs-3', 'suburbs-4'];
    expect(m.scenes.map((x) => x.id)).toEqual(order);
  });
});
