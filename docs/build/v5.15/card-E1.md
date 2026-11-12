# Card E1 — endgame engine (v5.15, lane E)

**Goal:** the engine side of everything a player does after the story ends, plus the economy loose ends. Each feature is one file under `src/engine/features/` registered in `features/index.ts`. Do not add fields to `GameState` outside the feature bag.

**Read first:** `docs/API.md`. Then `sed -n '135,141p' docs/REVIEW-v5.9-playthrough.md` (the source ideas) and `sed -n '97,109p' docs/REWARDS.md` (boost stacking: follow it).

## Files
- Own: `src/engine/features/mastery.ts`, `counterattack.ts`, `events.ts`, `recipes.ts`, their tests; `src/content/endgame.ts` (new: every number below); `src/content/tuning.ts` (refit only); `scripts/pacing-fit.ts`, `scripts/pacing-sim.ts`.
- Shared, append-only: `src/engine/features/index.ts`.
- Minimal edits: `src/engine/game.ts` for C106 only (step 6); `src/engine/rewards.ts` for step 5 only.
- Do not touch: `src/components/**`, `src/app/**`.

## Steps
- [x] **1. Mastery** (`mastery.ts`, pure). Three stars per shop: all three heads hired; top footprint (Flagship); top oven grade (golden). `masteryStars(shop)`, `masteryTotal(g)` (0–18), `nextStar(g)` → `{ shopId, star, progressText inputs }`. State: which stars have been announced, so each pays once: 10 diamonds and a `mastery` pulse. At totals 6 and 12, grant the next id from `WEEKLY_COSMETICS` the player doesn't own; at 18 grant `plaque-master`. Existing saves: stars already earned are granted silently on migrate, with their diamonds, in one summary.
- [x] **2. Counter-attack** (`counterattack.ts`). Starts the first Monday 00:00 local after the city's last finale has been seen. Use the rewards engine's week number and roll **only when the week number increases** (never on a key change; this is lesson C94). The target is seeded by the week number and never repeats the previous target. While the attack is open, that shop's value multiplier is 0.8. Defend: a 5-minute challenge to sell `ceil(5 min × the shop's current pizza rate × 1.25)` pies; winning ends the attack and pays 30 minutes of boost-free citywide income, 15 diamonds, and that shop's recipe card 4. Losing allows a retry after 60 minutes of real time. The attack ends unpaid at the week's end. Pure `attackView(g, now)` for the UI.
- [x] **3. Events** (`events.ts`). Friday 17:00–21:00 local, "Friday Night Rush": every shop's value × 1.5. Sunday 13:00–16:00 local, "Big Game Day": Suburbs and Downtown value × 2. They apply only while the app is open, never to offline earnings, and combine with boosts as `docs/REWARDS.md` says. `eventView(now)` returns the active event or the next one within 60 minutes with a countdown.
- [x] **4. Recipes** (`recipes.ts`). 24 cards, four per shop, ids `recipe.<hood>.<1-4>`. Drops: (1) any station in that shop reaches level 50; (2) its General Manager is hired; (3) its finale is seen; (4) a counter-attack is defended there. Each owned card multiplies that shop's value by 1.01. Cards come only from play, never from diamonds, ads or purchases. Existing saves get the cards whose conditions are already met, with one summary and no toast flood. `collectionView(g)` → owned and total per shop.
- [x] **5. Worn cosmetics.** Add `worn: string[]` beside the owned cosmetic ids in the rewards state, with a safe migrate default, and pure `wear(g, id)` / `unwear(g, id)`. A newly earned cosmetic is worn automatically; two cosmetics for the same part (two oven skins) can't both be worn. This is the one edit allowed in `src/engine/rewards.ts`. Cards U1 and S1 depend on it.
- [x] **5b. Walk-ins audit.** Read `sed -n '24,41p;70,77p' docs/PLAN-v5.10-playthrough.md`. For each acceptance line of cards A, B and E there, check the code; build what is missing on the engine side and list what is missing on the UI side under `Needs:` for card U1.
- [x] **6. C106.** Add `economy: 2` to the save, set by `newGame` and stamped by `migrate` on saves without it. Change no cash. Test T82: a pre-marker save loads with `economy === 2` and the same cash. Add a comment that any later retune must bump the number and decide a policy.
- [x] **7. Refit, last.** Extend the sim so the check-in player buys heads, Flagship and golden ovens after the story and defends each weekly attack. Run `npx tsx scripts/pacing-fit.ts` and `pacing-sim.ts`. Targets: story days within ±0.3 of 1.0 / 2.0 / 3.1 / 4.4 / 4.8; 18 stars between day 10 and day 14. The tuning is a fitted set: change it only through the fit script. Add the day targets to `story-pacing.test.ts` or a new `endgame-pacing.test.ts` so later versions can't drift silently. The refit changes the hash in `golden.test.ts`: re-record it in the same change and say so in the report.

## Tests that must exist
One file per feature under `src/engine/__tests__/` or `features/__tests__/`: star rules and one-time pay; week roll only on increase, including a time-zone change; target never repeats; challenge target formula; events on and off at the boundaries and absent offline; each recipe drop and the 1.01 multiplier; migrate of a v5.14 save for all four features.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/content`; the two sim commands in step 7.

## Report
Standard format, plus the sim's day table on one line.
