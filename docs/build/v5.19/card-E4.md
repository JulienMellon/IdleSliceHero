# Card E4 — the showdown and three fits (v5.19, lane E)

**Goal:** the fitted number sets for Chicago, New York and Los Angeles, and the game's last challenge.

**Read first:** `docs/API.md`; `src/engine/features/franchise.ts`; `src/engine/features/layers/rival.ts` (the challenge pattern); `sed -n '/^## The showdown/,/^## /p' docs/story/CITIES-BIBLE.md`.

## Files
- Own: `src/engine/features/showdown.ts` and its test, `src/content/showdown.ts`, the `fit` of `src/content/cities/chicago|new-york|los-angeles/index.ts` (create the folder and a stub `index.ts` with only the fit if the city card hasn't yet), `scripts/pacing-fit.ts`, `scripts/pacing-sim.ts`, `src/engine/__tests__/number-ceiling.test.ts`.
- Shared, append-only: `src/engine/features/index.ts`, `src/store/game-store.ts` (one action: start a showdown round).

## Steps
- [ ] **1. Fits.** For each city, a fitted set so the check-in player finishes its story in about the home city's days, given the franchise multiplier at that point. Use the fit script; change no number by hand. Add each city's targets to the pacing tests.
- [ ] **2. Ceiling.** `number-ceiling.test.ts` now uses the three real fits. It must pass with the 1e20 margin.
- [ ] **3. Showdown** (`showdown.ts`): available when Los Angeles's last finale has been seen. Five rounds, one per city in order. A round is a 5-minute challenge to sell `ceil(5 min × the current shop's pizza rate × 1.5 × 1.2)` pies; a lost round can be retried after 2 minutes; rounds won stay won. Winning the fifth sets the ending as due, grants the cosmetic `crown-empire` and 100 diamonds once. `showdownView(g, now)` for the UI: round, target, progress, time left, retry time.
- [ ] **4. After the ending:** the weekly counter-attack continues unchanged; the franchise multiplier keeps growing if the spec allows repeat franchises, otherwise state that the multiplier is final.
- [ ] **5. Sim:** the check-in player plays all five cities and the showdown. Print one line per city: days to finish. Print the total.

## Tests that must exist
Round order; win, lose, retry; rounds persist across a save and load; the reward pays once; migrate of a v5.18 save; the three pacing targets.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/content`; the sim.

## Report
Standard format, plus the five-city day table and the largest magnitude from the ceiling test.
