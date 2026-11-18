# Card R3: the store's layering and slices (v5.19, lane E; this card's Files override OWNERS)

**Goal:** `store/game-store.ts` imports nothing from `components/`, and its 712 lines become slice files composed in one `create()`. The `Store` type and every action's behaviour stay the same.

**Run after E4** (E4 adds one store action).

**Why:** `docs/PLAN-refactor.md`, phase P3. Notes to fix:
- **A34** [low]: game-store.ts, store/standing.ts imports. Move the grant, double, reroll, booster and offline maths to the engine.
- **C148** [low]: game-store.ts:559 `franchise` goes through `benefit()`. While a load is in flight it returns `true` before `canFranchise` has run, so flow.tsx:121 calls `onDone()` and leaves the City screen, even if the franchise is then refused. Use `whenLoaded` and return `false` while `loading > 0`. Also fix the comment on `benefit`, which says "ad benefit".
- **C134** [low]: app/index.tsx:150, _layout.tsx:46. Move `setBackground` into GameRunner's AppState handler, so there is one listener.
- **T104** [test]: a store test for C135. A popup still open across a short background must keep `earned`, and `cash` must not be counted twice.

## Files
- Own: `src/store/**`; new `src/engine/monetization.ts` and its test. The pure maths in `components/store/ad-model.ts` and `store-model.ts` moves (the components keep their view text and re-export what views use). `components/endgame/banner-state.ts` and `stack-model.ts` (`offerWaits`): move whichever part the store reads. `src/app/index.tsx` and `_layout.tsx` (the AppState lines only); `eslint.config.js` (turn the `store → components` rule to error).
- Rename: `src/components/store/` becomes `src/components/monetization/` (`git mv`, imports updated). It is too easily confused with `src/store/`.

## Steps
- [ ] **1. Maths to the engine.** Move `claimDelta`, `applyDouble`, `offlineBoost`, `offlineExtra`, `offlineFactor`, `repairByAd`, `rerollDaily`, `grantDailyBooster`, `claimOffer`, `applyGrant`, `parsePrefs`, `NO_PREFS` and `PREFS_KEY` into `engine/monetization.ts`. The banner's open flag becomes store state, or a getter the store receives at startup; pick whichever keeps the banner's timing identical.
- [ ] **2. Slices.** Split into `store/slices/{core,shop,rewards,monetization,layers,story}.ts`, each `(set, get) => Partial<Store>`, with `game-store.ts` composing them. The load/save, `whenLoaded` and `benefit` helpers live in `core`. Persistence goes through `services/kv.ts`.
- [ ] **3. C148, C134.**
- [ ] **4. Rename** `components/store/` to `components/monetization/`.
- [ ] **5. Lint.** The `store → components` rule is now an error and passes.

## Tests that must exist
T104; C148 (franchise during a load returns false and the flow stays); the existing store tests pass with only import changes.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npm test` (full).

## Fixtures
Run `--only 51_return,98_u3,29_rewards` and compare with the baseline: **0 changed**.
