# Card R0: the refactor safety net (v5.19, lane E)

**Goal:** a mechanical gate for the refactor cards that follow: CI, lint with layer rules, a wider home-id guard, and a test city that the current engine fails on. No game behaviour changes.

**Why:** `docs/PLAN-refactor.md`, phase P0. You only need that file's P0 section.

## Files
- Own: `.github/workflows/ci.yml` (new), `eslint.config.js` (new), `package.json` (`lint` script and dev dependencies only), `src/engine/__tests__/home-ids-guard.test.ts`, `src/content/cities/__fixtures__/test-city.ts` (new), `src/engine/__tests__/test-city-smoke.test.ts` (new).
- Read-only: `src/engine/__tests__/boston-smoke.test.ts` (the pattern), `src/content/cities/types.ts`, `src/content/cities/boston/`.

## Steps
- [ ] **1. CI.** `ci.yml` runs on push and pull_request: checkout, setup-node (the version in `package.json` engines, or 22), `npm ci`, `npx tsc --noEmit`, `npm test`. Do not deploy anything.
- [ ] **2. Lint.** Flat config with `eslint-config-expo`. The `expo install` command is refused by the proxy: use `npm install -D` with the version from `node_modules/expo/bundledNativeModules.json`, or the latest that `expo lint` accepts. Rules:
  - `import/no-cycle`: warn.
  - `no-restricted-imports`, error: `src/engine/**` and `src/content/**` may not import from `components`, `store`, `audio` or `services`.
  - `no-restricted-imports`, warn for now: `src/store/**` may not import from `components`. A later card (R3, in `later/`) turns it to error.
  - Existing rule hits elsewhere are warnings. `npx expo lint` must exit 0.
- [ ] **3. Guard.** Extend `home-ids-guard.test.ts` (note T109: "also walk drawer-model, goal-model, city-model, store/ad-model and endgame/mastery-model"). Walk every non-test `.ts` under `src/engine`, `src/store` and `src/components`, with an explicit `ALLOW` list of today's offenders and the reason for each, so the test passes now. Cards R1 and R1L shrink the list. A file that leaves the list may not come back.
- [ ] **4. Test city.** `test-city.ts` is a `CityDef` with six neighbourhoods. Its fit has different oven `mult`, vehicle `speed` and `capacity`, and footprint `maxTables` from the home city. It has a `bid` and one layer of each kind. It is **not** added to `CITIES`; the test registers it locally. `test-city-smoke.test.ts` plays it the way `boston-smoke.test.ts` plays Boston, and asserts the rates use the test city's fit (for example `ovenRate` of a shop at grade 1 equals level speed × the test fit's `ovenGrades[1].mult`). Mark the fit assertions `it.failing` (they fail today: `game.ts:624-631` read the home tables). Card R1 flips them to `it`.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx jest src/engine/__tests__/home-ids-guard.test.ts src/engine/__tests__/test-city-smoke.test.ts`.

## Report
Standard format, plus the guard's `ALLOW` count and the number of lint warnings.
