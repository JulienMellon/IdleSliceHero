// Pacing pins for v5.16 (card E0 step 7): rewards are a side dish. The check-in player (rewards on: golden pizzas, special orders, tasks,
// chests, the weekly chest and the daily gift, all through the engine's own functions) earns at most 10% of its cash from them over the
// story; and while the newest shop (Waterfront on) has no manager no single claim pays more than 10% of that manager's price and one
// day's claims together pay less than it. The limits are constants in scripts/pacing-fit.ts (REWARD_RULES): card E2b changes numbers there.
// Check it with `npx tsx scripts/pacing-fit.ts managers`.
import { managerRun, REWARD_RULES } from '../../../scripts/pacing-fit';
import { claimTable, rewardRules } from '../../../scripts/review/sim2';

jest.setTimeout(120_000);

describe('the rewards stay a side dish (check-in player, rewards on)', () => {
  const run = managerRun();
  const rules = rewardRules(run);

  it('the run played the rewards: golden pizzas, tasks, chests and gifts were claimed through the engine', () => {
    const kinds = claimTable(run);
    for (const k of ['golden', 'daily', 'chest', 'gift']) expect([k, (kinds[k]?.n ?? 0) > 0]).toEqual([k, true]);
    expect(run.rewardCash).toBeGreaterThan(0);
    expect(run.earnedCash).toBeGreaterThan(run.rewardCash);
  });

  it(`rewards are at most ${REWARD_RULES.storyShare * 100}% of all cash earned over the story`, () => {
    expect(rules.share).toBeLessThanOrEqual(REWARD_RULES.storyShare);
    expect(rules.share).toBe(run.rewardCash / run.earnedCash);
  });

  it(`while the newest shop has no manager, no single claim pays more than ${REWARD_RULES.claimOfManager * 100}% of that manager's price`, () => {
    expect(rules.maxClaimOfManager).toBeLessThanOrEqual(REWARD_RULES.claimOfManager);
  });

  it("…and one day's claims together pay less than that price", () => {
    expect(rules.maxDayOfManager).toBeLessThan(REWARD_RULES.dayOfManager);
  });

  it('with the rewards off the same player earns no claims at all (REWARDS=0)', () => {
    expect(rewardRules({ ...run, claims: [], rewardCash: 0 }).share).toBe(0);
  });
});
