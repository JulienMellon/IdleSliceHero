# Slice Empire — Daily Tasks, Weekly Tasks and Daily Gift

Oct 29, 2026 · @Julien

## Overview

Three retention features that give the player a reason to open the game every day and to keep coming back for a month. None of them grants a permanent gameplay advantage: permanent rewards are cosmetic, and every income boost is timed.

| Feature | Resets | Purpose |
| --- | --- | --- |
| Daily tasks | Local midnight | Short goals for each session |
| Weekly tasks | Monday 12:00 a.m. local | Bigger goals across the week, with an exclusive cosmetic |
| Daily gift (30-day calendar) | One claim per calendar day | Rewards an unbroken 30-day streak |

**Unlock:** all three unlock when the tutorial ends (Nonna Rosa becomes Downtown's manager), so the first session isn't cluttered.

## Reward sizing

- **Cash is expressed as minutes of income,** not fixed amounts: "15 min of income" = current earnings per second × 900, computed when claimed. This keeps rewards meaningful from the first shop to the last, and across franchise resets.
- Income for reward purposes ignores active boosts, so a boost can't be used to inflate a cash reward.
- **Diamonds** buy vanity items only, so diamond rewards never affect balance.
- **Boosters** are timed income multipliers (see Boost stacking).

## Daily tasks

- **5 tasks per day,** drawn from a pool and scaled to the player's progress.
- Tasks only come from features the player has unlocked (no "hire a manager" before stage 2).
- **Per-task reward:** 15 min of income + 20 Slice Points.
- **Reroll:** one task per day can be swapped by watching a rewarded ad.

**Example pool**

| Task | Scales with |
| --- | --- |
| Upgrade any station 10 times | Fixed |
| Serve N walk-ins | Current walk-in rate × ~10 min |
| Deliver N pizzas | Current delivery rate × ~10 min |
| Tap 3 floating bonuses | Fixed |
| Collect offline earnings | Fixed |
| Use 1 booster | Fixed |
| Earn N cash | Current income × ~20 min |

**Slice Points chest track** (resets daily, 100 points max = 5 tasks)

| Points | Chest |
| --- | --- |
| 40 | 30 min of income |
| 70 | 1 hr of income |
| 100 | 10 diamonds + a random 2× booster (15 min) |

## Weekly tasks

- **7 tasks per week.**
- **Per-task reward:** 2 hrs of income. The 7 tasks share 50 diamonds between them.
- **Final chest (all 7 done):** that week's rotating cosmetic, such as a wood-fired oven skin, a driver scooter color or a counter neon sign. A missed week means a missed item; it can return later in the rotation.

**Example pool**

| Task |
| --- |
| Complete 20 daily tasks |
| Play on 5 different days |
| Hire a manager |
| Open a pizzeria in a new neighborhood |
| Buy 5 oven upgrades |
| Reach a cash milestone (scaled to progress) |
| Upgrade the fleet once |

If a task becomes impossible (every neighborhood already built, every manager hired), swap it for one from the pool when the week starts.

## Daily gift (30-day calendar)

A calendar screen that pops up on the first open of each day. Each claim advances the streak by one day.

| Day | Gift |
| --- | --- |
| 1–6 | Small gifts rotating between 30 min of income, a booster and 5 diamonds |
| 7 | 50 diamonds |
| 8–13 | Small gifts |
| 14 | Premium booster pack |
| 15–20 | Small gifts |
| 21 | 24-hour 2× income boost, all shops |
| 22–27 | Small gifts |
| 28 | Exclusive storefront skin (cosmetic) |
| 29 | Small gift |
| 30 | **Nonna Rosa's Visit** (below) |

- **Double it:** every claim has a "watch ad to double" button.
- **Day 30, Nonna Rosa's Visit:** 2× income at every shop for 7 days, a permanent gold oven skin and 300 diamonds. Nonna Rosa appears in the shop for the week, with a timer on the cutaway. It's a cameo, consistent with her story role, and doesn't replace Downtown's manager.

**Streak rules**

- The streak counts consecutive calendar days with a claim.
- **Streak save:** if the player misses one day, they have 24 hours after returning to repair the streak for 20 diamonds or one rewarded ad. Only one save per 30-day cycle; missing a second time resets the streak to day 1.
- **After day 30,** the calendar loops. Each cycle's day 30 brings a different returning character (for example Big Sal, then Genevieve) with the same 7-day 2× boost and a new cosmetic. The exclusivity comes from the visit, not from a bigger number.

## Boost stacking

Timed boosts **add** to each other rather than multiply, then apply to the existing formula:

```latex
\text{earnings/s} = \text{base} \times \text{Franchise Star multiplier} \times \left(1 + \sum_i (\text{boost}_i - 1)\right)
```

Example: Nonna Rosa's 2× plus a 2× shop booster = 3×, not 4×. This keeps a 7-day boost from breaking the progression curve.

- Boosts keep running while the app is closed and count toward offline earnings, but only for the part of the offline window they overlap. The 4-hour offline cap still applies.
- The 2× offline-earnings ad applies to the offline total and doesn't stack with the timed boost formula above.

## UI

- **Clipboard icon** pinned on the counter in the cutaway opens the tasks drawer (Daily / Weekly tabs). A red badge shows when anything is claimable.
- **Gift calendar** opens automatically on the first open each day and from a gift icon afterward.
- Tap only: tap a task to claim it, tap a chest to open it, tap a calendar day to claim it.
- A reset countdown shows on each tab.

## Technical notes

New fields in the saved game state:

| Field | Holds |
| --- | --- |
| `dailyTasks` | Today's 5 task ids, targets, progress, claimed flags, reroll used |
| `dailyPoints` / `dailyChestsClaimed` | Slice Points total and which chests are open |
| `weeklyTasks` | This week's 7 tasks, progress, claimed flags, final chest claimed |
| `gift` | Current streak day, last claim date (local `YYYY-MM-DD`), streak save used this cycle, cycle number |
| `boosts` | Active boosts: multiplier, source, expiry timestamp |
| `cosmetics` | Owned cosmetic ids |
| `lastSeenTime` | Highest device time ever observed |

- **Progress tracking:** the engine emits events (upgrade bought, pizza delivered, walk-in served, bonus tapped, booster used, shop built, manager hired). Task progress listens to those events instead of polling state.
- **Task targets are fixed when the task is generated,** so they don't drift as income grows during the day.
- **Day boundaries** use the device's local date, compared as `YYYY-MM-DD` strings.
- **Clock-rollback guard:** if device time is earlier than `lastSeenTime`, don't allow claims or resets until the clock passes `lastSeenTime` again. If the game later gets a backend, use server time instead.
- Task pools, rewards and calendar contents live in `src/content/` data files, like tuning, so balancing never touches logic.

## Open decisions

- [ ] DESIGN.md currently lists rewarded ads as the only monetization. This doc assumes diamonds, a booster shop and cosmetics exist; those need to be added to DESIGN.md.
- [ ] Exact booster strengths and durations in the booster shop
- [ ] Which returning character visits in each later 30-day cycle
- [ ] List of weekly cosmetics for the first rotation
