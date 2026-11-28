# Card E8 — the new curve (v5.25, lane E)

**Goal:** a new player sells one pizza per tap, reaches a first goal under $50 in about 20 s, and opens Suburbs at about 20 minutes of active play. The Home city climbs a flat ladder (Suburbs $20K, Waterfront $80K, University $200K, Industrial $500K, Uptown $1.5M). Every number on screen is a whole number. Old saves reset (`ECONOMY` 4). Closes D495.

**Read first:** `docs/build/v5.25/VERSION.md` (Decisions, Defaults); `src/engine/game.ts` (`ECONOMY` at ~69 and its doc at ~61, `newGame` ~394, `migrate` ~617-721, `tapBatch` ~1195); `src/content/tuning.ts`; `src/content/cities/home/data.ts`, `fit.ts`, `chapters.ts`; `src/engine/tutorial.ts` (steps 9 and 13); `scripts/pacing-fit.ts` (`SESSION1` ~33-53, `TARGETS` ~251, `BOSTON_TOLERANCE`), `scripts/pacing-sim.ts`; `src/content/franchise.ts` (the Boston scaling rule); `src/content/cities/boston/fit.ts`.

## Files
- Own: `src/content/tuning.ts`; `src/content/cities/home/{data,fit,chapters}.ts`; `src/engine/game.ts` (the `ECONOMY` constant, `migrate`, `tapBatch` only); `src/engine/tutorial.ts` (goal amounts only); the shared number formatter (find it with `grep -rn "export function format\(Cash\|Money\|Num\)" src | head`) and its tests; `scripts/pacing-fit.ts`, `scripts/pacing-sim.ts`, `scripts/review/sim2.ts`.
- Tests that pin today's numbers (update them to the new curve, never delete a check): `src/content/__tests__/economy.test.ts`, `src/engine/__tests__/{economy-marker,story-pacing,game,tutorial,pipeline,number-ceiling,chapters,session1-pacing,golden,manager-pacing,franchise-pacing,endgame-pacing,reward-share}.test.ts`.
- Fixtures that seed economy numbers (check each still reaches its state; fix the seed values only): `scripts/fixtures/{09_lategame,106_t2,178_u1b,179_e2,180_e1b,19_story_props,195_u5,220_u8,34_sidewalk,56_u1,74_s2a}.py`. Before editing one, re-run `grep -rln "ECONOMY\|tapBatch\|270000\|4600000" src scripts/fixtures` in case the list moved.
- Do not touch: `src/components/**`, `src/services/**`, the layer gates (E9), renovation (E10). Boston's data is not edited by hand: it follows the scaling rule.

## Steps
- [ ] **1. Save reset.** Set `ECONOMY` to 4. In `migrate`, a save whose marker is below 4 (or missing) is replaced by `newGame()`, which is a full reset: nothing carries over, standing IAP grants included (pre-launch, Julien 2026-11-28). Update the doc comment. The test in `economy-marker.test.ts` pins 4 and covers that a v3 save loads as a new game.
- [ ] **2. Taps.** One pizza per tap, +1 for every 10 prep levels (`BATCH_GROWTH` in tuning.ts and `tapBatch`). The tap queue and rush stay as they are unless a test shows the queue fills in under 1 s.
- [ ] **3. Whole numbers on screen.** Gains stay fractional inside the engine. The formatter shows every amount as a whole number, rounded down. A rate under $1/s shows as `$N/min`, and under $1/min as `<$1/min`. There is no case with a decimal point except the existing K/M/B suffix forms (`$1.5K` is allowed). Tests cover 0.4, 0.6, 12.5, 999.9, 1,500 and 1.5M, for amounts and for rates.
- [ ] **4. The ladder.** Hood build prices: Downtown 0, Suburbs 20K, Waterfront 80K, University 200K, Industrial 500K, Uptown 1.5M. Pier 9's bid and every hood's managers and heads scale to fit: about 10x the build price for a manager and about 2x for heads, tuned in the sim. Station base costs and growth, `DECOR_TIER_COST` and milestones are re-fit so that Downtown's own upgrades top out at about $10M of total spend. Write the fitted values in `fit.ts` the way it does today.
- [ ] **5. First minutes (D495).** The first priced goal costs under $50 and is reachable within about 20 s of tapping. The Marco hire (today $400, tutorial step 13) costs no more than about 90 s of play. Chapter 1-3 goal amounts in `chapters.ts` and the tutorial's amounts follow. The first serves must pop cash visibly: if no cash pop exists on a serve, write `Needs: S6 first-serve cash pop` in the report and keep going.
- [ ] **6. Pacing targets.** `SESSION1`:
  - Suburbs opens at 20 ± 2 min of active play.
  - Scene gap max is 3 min. Lower the story gap knobs in tuning.ts (`gapSeconds`, `beat4GapSeconds`, `firstHoodBeat4GapSeconds`) as needed.
  - Heads, takeover, manager and finale slide in proportion.
  - Median buy gap stays ≤ 60 s and max ≤ 120 s.

  `TARGETS` stays as it is (E10 stretches the city to about 7 days once renovation exists). Leave a `// E10:` comment on it. `pacing-sim` passes, Boston included.
- [ ] **7. Tests and fixtures.** Update every listed test to the new numbers, then run the full suite. Run each listed fixture with `--only` only if its seed values changed.
- [ ] **8. Notes for later cards.** Write in the report: the fitted price of the Starter Pack's "one third of the way to Suburbs" (about $7K), income per minute at 2 min and at 20 min of play (for the gift, E9), and every renamed export.

## Checks
- `npx tsc --noEmit`
- `npx jest`
- `npx tsx scripts/pacing-fit.ts check`
- `npx tsx scripts/pacing-fit.ts session1`
- `npx tsx scripts/pacing-sim.ts`
- `npm run format:check`
- `npx tsx scripts/api-digest.ts`

## Report
Standard format, plus a table of the six hood prices, the first goal's price and its time, the Suburbs-open time, the longest scene gap, and the step 8 numbers.
