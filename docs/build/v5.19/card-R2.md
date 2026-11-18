# Card R2: split engine/game.ts (v5.19, lane E)

**Goal:** `game.ts` (1,464 lines) becomes seven modules plus a barrel. **No caller changes in this card:** everything is still importable from `engine/game`.

**Why:** `docs/PLAN-refactor.md`, phase P2. Notes to fix:
- **A33** [low]: game.ts imports rival and scenes. Move `challengeOffered` and `migrateStory` to `engine/story.ts`.
- **A36** [low]: engine spend sites, night-oven, uptown, boats, vanity. Add `canAfford(s, cost)` and `pay(s, cost)`, used by every model and view.
- **A37** [low]: store and view `Date.now` game-time sites. Add `engine/clock.ts` `gameNow()`; animation keeps `Date.now`.
- **M62 / U12** [low]: `features/mastery.ts:107`, `recipes.ts:259`, game.ts tick. Early-out settle on a per-shop fingerprint, and cache the recipe count on owned identity.

## Files
- Own: `src/engine/game.ts` (the barrel), and new `src/engine/{state,migrate,economy,purchases,offline,story,hints,clock}.ts`; `src/engine/night-oven.ts`, `vanity.ts`, `features/mastery.ts`, `features/recipes.ts`, and the spend sites in `features/layers/*.ts`, which use `canAfford` and `pay`.
- Shared: `src/store/game-store.ts` and the view files that read game time. Only `Date.now()` becomes `gameNow()`, and only where the value is game time, not animation.
- Do not touch: `features/index.ts` and `registry.ts` beyond step 4.

## Steps
- [ ] **1. Move.** Split the code exactly as the plan lists it: `state`, `migrate`, `economy`, `purchases`, `offline`, `story`, `hints`. `game.ts` becomes `export * from './state'` and so on. Move code verbatim. The dependency direction is `state` ← `economy` ← `purchases`/`offline`/`hints`, and `migrate` and `story` depend on `state` and `economy`, with no cycles (`npx expo lint` checks `import/no-cycle`).
- [ ] **2. A36.** Add `canAfford(s, cost)` and `pay(s, cost): BuyResult` in `purchases.ts`. Every spend in the engine goes through them, and so do the "can buy" checks in the views (grep `cash >=` and `.cash -`).
- [ ] **3. A37.** `clock.ts`: `gameNow()` returns `Date.now()` and has a test hook `setGameClock(fn)`. Replace the game-time reads; list in the report the ones you kept as animation.
- [ ] **4. Registry guard.** `playTick`, `featureMults` and `offlineTick` throw `Error('features not registered: import engine/features')` when `FEATURES.length === 0` outside `withFeatures`. `scripts/pacing-fit.ts`, `pacing-sim.ts` and `scripts/review/*.ts` import `../src/engine/features` explicitly.
- [ ] **5. M62 / U12.** Early-out in the mastery and recipe settle on a per-shop fingerprint. Cache the recipe count on the `owned` array's identity.

## Tests that must exist
- `canAfford`/`pay` edge cases (exact cash, NaN cost refused).
- The registry guard throws.
- `gameNow` is overridable.
- Every existing engine test passes with its imports unchanged.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npm test` (full); `npx tsx scripts/pacing-sim.ts | tail -5` (same days as before).

## Report
Standard format, plus each new module's line count and the pacing-sim days before and after.
