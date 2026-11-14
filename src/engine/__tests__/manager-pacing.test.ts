// Pacing pins for v5.16 (card E0 step 7): when the heads and the manager of Waterfront to Uptown arrive for the check-in player
// (5 min every 4 h, rewards on). The first head within two check-ins of the build, all three within four, the manager 70 to 100% of
// the way from the build to the next neighbourhood's build, and Uptown's 0.7 to 1.3 days after its own (it has no next one). The story
// days stay within 0.3 of 1.0 / 2.0 / 3.1 / 4.4 / 4.8. Targets are constants in scripts/pacing-fit.ts (MANAGER_TIMING, TARGETS): card E2b's
// refit changes numbers there, not here. Check it with `npx tsx scripts/pacing-fit.ts managers`.
import { managerRows, managerRun, MANAGER_TIMING, STORY_TOLERANCE, TARGETS } from '../../../scripts/pacing-fit';

jest.setTimeout(120_000);

const SCENE = { waterfront: 'waterfront-1', university: 'university-1', industrial: 'industrial-1', uptown: 'uptown-1', finale: 'uptown-4' } as const;

describe('check-in player: heads and managers', () => {
  const run = managerRun();
  const rows = managerRows(run);

  for (const key of Object.keys(TARGETS) as (keyof typeof TARGETS)[]) {
    it(`${key} still lands within ${STORY_TOLERANCE} days of day ${TARGETS[key]}`, () => {
      const day = run.scenes.find((x) => x.id === SCENE[key])!.wall / 86400;
      expect(Math.abs(day - TARGETS[key])).toBeLessThanOrEqual(STORY_TOLERANCE);
    });
  }

  it('every shop from Waterfront on has its heads and manager hired', () => {
    expect(rows.map((r) => r.id)).toEqual(['waterfront', 'university', 'industrial', 'uptown']);
    for (const r of rows) expect([r.id, [r.build, r.head1, r.heads3, r.manager].every(Number.isFinite)]).toEqual([r.id, true]);
  });

  for (const id of ['waterfront', 'university', 'industrial', 'uptown'] as const) {
    it(`${id}: the first head within ${MANAGER_TIMING.firstHeadCheckins} check-ins of the build, all three within ${MANAGER_TIMING.allHeadsCheckins}`, () => {
      const r = rows.find((x) => x.id === id)!;
      expect(r.head1Checkins).toBeLessThanOrEqual(MANAGER_TIMING.firstHeadCheckins);
      expect(r.heads3Checkins).toBeLessThanOrEqual(MANAGER_TIMING.allHeadsCheckins);
      expect(r.heads3).toBeLessThan(r.manager); // the manager needs all three heads
    });
  }

  for (const id of ['waterfront', 'university', 'industrial'] as const) {
    it(`${id}: the manager comes ${MANAGER_TIMING.managerShare.min * 100} to ${MANAGER_TIMING.managerShare.max * 100}% of the way to the next neighbourhood`, () => {
      const share = rows.find((x) => x.id === id)!.share!;
      expect(share).toBeGreaterThanOrEqual(MANAGER_TIMING.managerShare.min);
      expect(share).toBeLessThanOrEqual(MANAGER_TIMING.managerShare.max);
    });
  }

  it(`uptown: the manager comes ${MANAGER_TIMING.uptownManagerDays.min} to ${MANAGER_TIMING.uptownManagerDays.max} days after its build, after the finale (the finale plays without it)`, () => {
    const r = rows.find((x) => x.id === 'uptown')!;
    expect(r.daysAfter).toBeGreaterThanOrEqual(MANAGER_TIMING.uptownManagerDays.min);
    expect(r.daysAfter).toBeLessThanOrEqual(MANAGER_TIMING.uptownManagerDays.max);
    expect(r.manager).toBeGreaterThan(run.scenes.find((x) => x.id === 'uptown-4')!.wall / 86400);
  });

  it('a manager costs hours of income, not minutes', () => {
    for (const r of rows) expect([r.id, r.hours >= 4]).toEqual([r.id, true]);
  });
});
