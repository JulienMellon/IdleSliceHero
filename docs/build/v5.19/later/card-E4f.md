# Card E4f — the fits for Chicago, New York and Los Angeles (v5.19, lane E)

(Split from card E4 on 2026-11-18. It runs once the three packs exist (CITY × 3), because the sim plays each city's story, and after card E4's showdown.)

**Goal:** each city's fitted number set, so the check-in player finishes its story in about the home city's days, given the franchise multiplier at that point.

**Read first:**
- `docs/API.md`;
- `src/content/franchise.ts` (`cityNumbers`, `PRICE_FIT`, `BOSTON_NUMBERS`);
- `src/content/cities/boston/data.ts` (`BOSTON_FIT`, the pattern);
- the `franchise` mode of `scripts/pacing-fit.ts`.

## The code as the refactor left it
- **Rates read the fit** (card R1): `ovenRate`, `tripSeconds`, `tripCapacity`, `tablesShown` and the rest take `city.fit`. So a fit may now change oven `mult`, vehicle `speed` and `capacity`, and footprint `maxTables`/`ovenSlots`, not only prices. Change them only if the fit needs it, and say which in the report. The R0 test city's smoke test proves the engine honours them.
- **The registry guard** (card R2): `playTick`, `featureMults` and `offlineTick` throw when no feature is registered. Each script imports `../src/engine/features` (and `scripts/review/*.ts`, `../../src/engine/features`) before it plays.
- **Imports** come from the engine modules (`engine/state`, `economy`, `purchases`, `offline`, `story`), not `engine/game`, which card R2b deletes after you. Home tables come from `src/content/cities/home`. `tuning.ts` no longer re-exports them (R1).
- Feature files are named by kind (card R1L): `features/layers/boats.ts` (`buyRack`, `rackLock`, `rackPrice`), `game-day.ts`, `menu.ts`, `shifts.ts`, `stars.ts`.
- The pack ids are `chicago`, `newyork` and `la` (`CITY_ORDER`). The folders are `chicago/`, `new-york/` and `los-angeles/` (VERSION.md's city table).

## Files
- Own:
  - `src/content/cities/chicago/fit.ts`, `new-york/fit.ts`, `los-angeles/fit.ts` (card CITY created them in Boston's pattern; its `index.ts` imports them);
  - in `src/content/franchise.ts`, the `PRICE_FIT` entries for indexes 2–4, plus `CHICAGO_NUMBERS`, `NEW_YORK_NUMBERS` and `LA_NUMBERS` if the packs read them;
  - `scripts/pacing-fit.ts`, `scripts/pacing-sim.ts`, `scripts/review/sim2.ts` (imports and the city loop only);
  - `src/engine/__tests__/number-ceiling.test.ts` and the pacing tests' city targets (`src/engine/__tests__/franchise-pacing.test.ts`).
- Do not touch: the packs' `index.ts`, `data.ts` and scenes (card CITY), `src/engine/**` outside its tests.

## Steps
- [ ] **1. Fits.** For each city, a fitted set from the fit script; change no number by hand. Add each city's targets to the pacing tests.
- [ ] **2. Ceiling.** `number-ceiling.test.ts` uses the three real fits. It must pass with the 1e20 margin.
- [ ] **3. Sim:** the check-in player plays all five cities and the showdown. Print one line per city (days to finish) and the total.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/engine src/content`; `npx tsx scripts/pacing-sim.ts | tail -8`.

## Report
Standard format, plus the five-city day table, the largest magnitude from the ceiling test, and any fit field other than prices that you changed.
