# Card E0 — economy rules after playtest 3: managers, rewards, session 1, the sim (v5.16, lane E)

**Goal:** the first shop lasts, managers are earned, and cash rewards stop buying the game. Rewards go into the sim so the fit can never ignore them again. This card ends with a **baseline** fit; card E2b runs the version's final refit after the layers land.

**Why (Julien's playtest 3, measured on v5.15 with `scripts/review/sim2.ts`):**
- Continuous play: all three Downtown heads hired at 1.6 min, Nonna takes over at 4.5 min, Suburbs opens at 4.7 min, Suburbs manager at 5.8 min, Suburbs finale at 15.9 min.
- From Waterfront on, three heads plus the manager cost 60 / 31 / 15 / 5 seconds of city income when the shop opens, and are all hired in the build session.
- One daily task pays 15 minutes of income. Neither `sim2.ts` nor `pacing-fit.ts` models rewards, golden pizzas or special orders.

**Read first:** `docs/API.md`. Then `src/content/tuning.ts`, `src/content/rewards.ts`, `src/content/hooks.ts`, and the header comments of `scripts/pacing-fit.ts` and `scripts/review/sim2.ts`.

## Files
- Own: `src/content/tuning.ts`, `src/content/rewards.ts`, `scripts/review/sim2.ts`, `scripts/pacing-fit.ts`, `scripts/pacing-sim.ts`, `src/engine/__tests__/endgame-pacing.test.ts`, `economy-marker.test.ts`, and three new tests: `session1-pacing.test.ts`, `manager-pacing.test.ts`, `reward-share.test.ts`.
- Numbers only: `src/content/hooks.ts` (`BONUS`, `ORDER`), `src/content/endgame.ts`.
- Minimal edits in `src/engine/game.ts`: `headCost`, `offlineTick` and its `idle` list (step 2), the per-station price growth (step 5), the economy marker. Nothing else.
- One edit outside the lane: trigger **counts** in `src/content/scenes/home/downtown.ts` and `suburbs.ts` (step 6). No text, no ids, no order. Re-record `scenes-golden.test.ts` only if it pins those counts, and say so.
- Do not touch: `src/engine/features/**`, `src/components/**`. If the welcome-back popup needs a new label for a heads-only shop, list it under `Needs:`.

## Julien's decisions (2026-11-13)
Session 1 lasts about 40 minutes with Suburbs at 16. From Waterfront on a manager arrives about a full day after the build, just before the next neighbourhood. Cash rewards are cut 70 to 80%.

## Steps
- [ ] **1. Managers as data and a price model that can be fitted.**
  - `MANAGERS: Record<NeighborhoodId, { id: string; name: string; title: 'General Manager' }>` in `tuning.ts`: downtown `nonna-rosa` Nonna Rosa, suburbs `deb` Deb, waterfront `skip` Skip, university `noor` Noor, industrial `dee` Dee, uptown `anton` Anton. Later cards read names from here.
  - Each `NeighborhoodDef` gains `headsCost` (the three heads together; split by `HEAD_SHARE`). `headCost` reads it. `managerCost` stays its own number. Downtown keeps `HEAD_COST_DOWNTOWN`.
  - Starting numbers before any fit: `managerCost` = 30% of `buildCost`, `headsCost` = 3% of `buildCost`.
- [ ] **2. Heads keep the shop going while you're away, at half speed.** `HEADS_OFFLINE_SHARE = 0.5` in `tuning.ts` (the fit may move it within 0.3 to 0.6). In `offlineTick`, a shop with all three heads and no manager sells at that share of its rate, without the manager's boost. A shop missing a head still only finishes what was on the line, and is still in `idle`. Reason: with the manager a day away, the newest shop would otherwise earn nothing offline for that day and no day target could hold. Update the function's comment and `Shop.managed`'s.
- [ ] **3. Cut the cash rewards.** Change the numbers, then fix every label and test that states the old ones.

  | Reward | Where | Now | New |
  | --- | --- | --- | --- |
  | Golden pizza / lucky slice | `BONUS.incomeSeconds` / `luckyIncomeSeconds` | 45 s / 180 s | 15 s / 60 s |
  | Special order | `ORDER.rewardMinutes` | 5 | 1.5 |
  | Daily task | `DAILY_TASK_REWARD.minutes` | 15 | 3 |
  | Daily chests 1 and 2 | `DAILY_CHESTS` | 30 / 60 | 5 / 10 |
  | Weekly task | `WEEKLY_TASK_REWARD.minutes` | 120 | 20 |
  | Weekly fallback | `WEEKLY_FALLBACK.minutes` | 120 | 20 |
  | Daily gift, cash days | `GIFT_SMALL[0]` (and its label) | 30 | 10 |

  Then `grep -rn "minutes\|Minutes\|incomeSeconds" src/content | grep -v scenes`: cut every other **reward** paid in time of income by the same factor of about 4 to 5 and list each in your report. **Prices** in time of income (the night oven, the Pier 9 bid) are not rewards: leave them.
- [ ] **4. Rewards in the sim.** `run()` in `sim2.ts` plays with rewards on by default (`cfg.rewards`, env `REWARDS=0` turns them off), calling the engine's own functions with a wall clock, never a copy of the numbers: golden pizzas (the player taps four of every five that appear during a session), special orders (accepts every offer; the engine decides the win), daily tasks and chests claimed when complete, weekly tasks and the weekly chest, the daily gift once per day, night-oven tiers when affordable. Record every claim as `{ wall, kind, cash }` and return `rewardCash` and `earnedCash`. `sim2.ts` must import `src/engine/features` so the registry is live. If `pacing-sim.ts` has its own loop, make it use `run()` or give it the same switch.
- [ ] **5. Make "cheapest" stop meaning "best".** Add a decision metric to the sim's output: among purchases after Nonna's takeover, the share where the best-payback item was also the cheapest item on offer, and the median payback of the third-best option divided by the best. Print the v5.15 numbers first. Then pull the stations apart with an optional per-station `growth` in `STATIONS` (`upgradeCost` already takes one; `costLadder` in `buy-many.ts` must use the same). Starting point: prep 4 at 1.13, counter 7 at 1.15, ovens 14 at 1.17, seating 12 at 1.16, drivers 8 at 1.15. Target: the share at or under 50% and the ratio at or under 3. If prices alone won't reach it, stop at the best set you found and report the numbers: card P1's service tip and the layers add the other routes, and card E2b measures again.
- [ ] **6. Fit session 1** (continuous sim, rewards on).

  | Moment | v5.15 | Target |
  | --- | --- | --- |
  | Downtown heads hired | all by 1.6 min | 2, 5 and 8 min, each ±1 |
  | Nonna takes over (`downtown-4`) | 4.5 min | 10 min ±1.5 |
  | Suburbs opens | 4.7 min | 16 min ±2 |
  | Suburbs manager | 5.8 min | 28 min ±3 |
  | Suburbs finale | 15.9 min | 40 min ±5 |

  Levers: `HEAD_COST_DOWNTOWN`; `NONNA_TAKEOVER.pizzas` with `downtown-4`'s trigger count (they must match); Suburbs' `buildCost`, `costMult`, `orderValue`, `managerCost`, `headsCost`; the Downtown and Suburbs scene trigger counts; step 5's station numbers. Also required in those 40 minutes: a purchase at least every 60 s at the median, no wait over 120 s, a scene at least every 6 minutes, and Suburbs still locked until Nonna takes over. Between Nonna's takeover and the Suburbs build the player must be able to buy at least the first Expand, the Stone oven and one decor tier.
- [ ] **7. Baseline fit for Waterfront to Uptown** (check-in sim: 5 minutes every 4 hours, rewards on).
  - Story days within ±0.3 of 1.0 / 2.0 / 3.1 / 4.4 / 4.8, and the v5.15 endgame targets (18 stars between day 10 and 14).
  - Waterfront, University, Industrial: first head within two check-ins of the build; all three heads by the fourth; the manager at 70 to 100% of the way from that build to the next one. Uptown: the manager 0.7 to 1.3 days after its build. If Uptown's finale cannot play without the manager, say so under `Needs:` and fit the manager before the finale instead.
  - Rewards: at most 10% of all cash earned over the story. While the newest shop has no manager: no single claim pays more than 10% of that manager's price, and one day's claims together pay less than it. When these collide with the timing targets, lower rewards, not manager prices.
- [ ] **8. Tests.** `session1-pacing.test.ts` (step 6's table), `manager-pacing.test.ts` (step 7's timing), `reward-share.test.ts` (step 7's three reward rules), offline tests for a heads-only shop at each of 0, 2 and 3 heads. Keep every target in a named constant beside `TARGETS` in `pacing-fit.ts`, so card E2b changes numbers and not tests. Bump the economy marker from 2 to 3: old saves load with their cash and hires untouched. Re-record `golden.test.ts`'s hash and say so.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/content`; `npx tsx scripts/review/sim2.ts continuous | tail -14`; `npx tsx scripts/review/sim2.ts checkin | head -8`.

## Report
Standard format, plus three short tables: session 1 (target, result), manager timing per shop (build day, heads day, manager day, manager price in hours of income), and rewards (share of cash, largest single claim against the manager price). Then the decision metric before and after, and the final value of `HEADS_OFFLINE_SHARE`.
