# Card E2b — layers: University, Industrial, Uptown; then the refit (v5.16, lane E)

**Goal:** three more feature modules under `src/engine/features/layers/`, the drone job, and the single economy refit for this version.

**Read first:** `docs/API.md`. Then `sed -n '130,132p' docs/REVIEW-v5.9-playthrough.md` (your three rows; the numbers there are the starting numbers). Card E2a's three layers are the pattern; follow its "rules for every layer". Card E0 landed before you: read its targets in `scripts/pacing-fit.ts` (the named constants beside `TARGETS`) and the three pacing tests it added; rewards are already in the sim, and card P1's service feature (tips and the cold line) is registered.

## Files
- Own: `src/engine/features/layers/university-menu.ts`, `industrial-shifts.ts`, `uptown-stars.ts`, their tests; `src/content/tuning.ts` (refit only); `scripts/pacing-fit.ts`, `scripts/pacing-sim.ts`.
- Shared, append-only: `src/engine/features/index.ts`, `src/content/layers.ts`.
- Minimal edits in `src/engine/game.ts`: the delivery-rate functions take the zone distances into account for University (step 1). Nothing else.

**Running beside you:** card T1a (story functions) edits other functions in `src/engine/game.ts` and `scripts/pacing-sim.ts` at the same time. Re-read each of those two files immediately before every edit, change only your own functions, and never reformat or reorder the file.

## Steps
- [ ] **1. University, menu and campus zones (this is the drone job).**
  - Menu: three recipes. Cheese × 1.0 price. Pepperoni × 1.4 price, + 30% prep time. Garlic Knots × 0.6 price, half the bake time. The player sets a mix; default all Cheese. The mix changes value per pizza and the prep and oven rates.
  - Zones: Dorms, Library, Stadium at distances 1 / 2 / 3. Demand share 50 / 30 / 20. A trip to a zone takes distance × the normal round trip. **Drones ignore distance.** Library unlocks at University footprint 1, Stadium at footprint 2.
  - Result to prove in a test: with drones the far zones are worth serving; without them the fleet tier matters.
- [ ] **2. Industrial, shifts and breakdowns.** Demand follows three shifts on a 20-minute play cycle (day × 1.0, swing × 0.8, night × 1.2 demand); the night shift pays × 2 value. Offline earnings for Industrial use the night rate (this is what Big Sal's offline perk is about; check the perk text still reads true and report if not). Every 5 minutes of play one oven jams: the shop's oven rate drops by one oven's share until the player taps the wrench, or after 30 seconds if the Head Baker is hired.
- [ ] **3. Uptown, stars.** A rating from 1 to 5: oven grade (0–2 points), decor tiers (0–2), and a new Ingredients track of four tiers (Store-brand, Imported, Farm, Truffle; 0–3 points); stars = 1 + floor(points × 4 / 7). Below 3 stars Uptown pays 50%; 3 and 4 pay 100%; 5 pays 200%. Ingredients tiers cost 30 / 120 / 480 minutes of Uptown income at purchase time. A critic visits every 15 minutes of play with a target rating; meeting it pays 3 minutes of citywide income (Julien cut cash rewards by 70 to 80% on 2026-11-13; price every new reward on that scale) and adds a star to the sign (cosmetic count), missing it does nothing.
- [ ] **4. Views.** `menuView`, `zonesView`, `shiftView`, `jamView`, `starsView`, `criticView`: pure, with the numbers the HUD needs and nothing else.
- [ ] **5. Sim.** The sim's player sets the best menu mix, fixes jams within 10 seconds while playing, buys Ingredients when it pays back, and buys drones when they pay back.
- [ ] **6. Stop here and report.** The orchestrator will tell you when card T1a has landed.
- [ ] **7. Refit (after T1a).** Run `npx tsx scripts/pacing-fit.ts` and `pacing-sim.ts` with all six layers, the rival and the Todd interludes in. Targets: story days within ±0.3 of 1.0 / 2.0 / 3.1 / 4.4 / 4.8; no gap between scenes over 12 minutes of play; no check-in day without a scene; drones bought before `uptown-4`; the v5.15 endgame targets still hold; **and card E0's targets, which this refit must not break:** session 1 (heads at 2, 5 and 8 min, Nonna at 10, Suburbs at 16, Suburbs manager at 28, Suburbs finale at 40), each later manager at 70 to 100% of the way to the next build (Uptown 0.7 to 1.3 days after its build), rewards at most 10% of cash earned, no single claim over 10% of the newest unhired manager's price. Re-measure E0's decision metric with the layers and the service tip in (target: the best-payback buy is also the cheapest in at most half of the purchases) and report it. Put the new assertions in the pacing tests. Re-record `golden.test.ts`'s hash and say so.

## Tests that must exist
Menu mix arithmetic; zone trip times with and without drones; shift cycle and the offline night rate; jam, tap-fix and auto-fix; star formula at every boundary; pay multipliers; critic schedule determinism; migrate of a v5.15 save.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/content`; the two sim commands in step 7.

## Report
Standard format; after step 7 add the sim's day table, the longest scene gap, each manager's hire day, the reward share and the decision metric.
