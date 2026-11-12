# Card K0a — engine seams (v5.14, lane E)

**Goal:** after this card, a new gameplay feature is a new file under `src/engine/features/` plus one line in a registry, with no edit to `game.ts`; story scenes live in one file per neighbourhood; and `docs/API.md` lists every engine export so later programmers don't have to open `game.ts` (1,195 lines) or `home.ts` (1,025 lines) to find a signature. **Nothing the player sees or earns may change.**

## Files
- Own: `src/engine/features/**` (new), `src/engine/game.ts`, `src/engine/__tests__/features.test.ts`, `golden.test.ts`, `scenes-golden.test.ts` (new), `src/content/scenes/**`, `scripts/api-digest.ts` (new), `docs/API.md` (generated).
- Shared, minimal edits: `src/store/game-store.ts` (only if the save path needs it to persist the new field).
- Do not touch: `src/components/**`, `src/app/**`, `scripts/screenshots.py` (card K0b is editing them now).

## Steps
- [x] **1. Golden tests first, before any refactor.**
  - `golden.test.ts`: from `newGame(fixedNow)`, apply a fixed script of about 30 purchases across three shops and 900 one-second ticks, then one `applyOffline` of 3 h. Assert a SHA-1 of the resulting state JSON (minus timestamps you set yourself) equals a constant you record now.
  - `scenes-golden.test.ts`: assert the scene ids in order and a SHA-1 of `JSON.stringify(HOME_SCENES)` equal constants you record now.
  - Both must pass on the untouched tree and stay untouched for the rest of the card.
- [x] **2. Feature slices.** `src/engine/features/types.ts`:
  ```ts
  export interface Feature<S> {
    key: string;                                   // state lives at GameState.x[key]
    init(now: number): S;
    migrate(raw: unknown, now: number): S;         // must accept undefined (old saves)
    tick?(g: GameState, dtPlay: number, now: number): GameState;
    shopValueMult?(g: GameState, id: NeighborhoodId, now: number): number;   // multiplies value per pizza
    shopDemandMult?(g: GameState, id: NeighborhoodId, now: number): number;  // multiplies demand rate
    onOffline?(g: GameState, seconds: number, now: number): GameState;
  }
  ```
  `src/engine/features/index.ts`: `export const FEATURES: Feature<any>[] = [];` plus `getFeature<S>(g, f): S`, `setFeature<S>(g, f, s): GameState`, and a test helper `withFeatures(list, fn)`.
- [x] **3. Wire the registry into `game.ts`.** `GameState` gains `x: Record<string, unknown>`. `newGame` fills it from `FEATURES`; `migrate` calls each feature's `migrate(raw.x?.[key])`; the per-second tick calls each `tick` in registry order after the existing body; the value-per-pizza and demand-rate functions multiply by the products of the two hooks; `applyOffline` calls `onOffline`. `SAVE_VERSION` stays 5: a save without `x` loads with defaults. With `FEATURES` empty, step 1's hash is unchanged.
- [x] **4. `features.test.ts`** with a fake feature registered through `withFeatures`: `init`, `migrate` from a save without `x`, tick order, both multipliers, offline, and a save/load round trip that keeps `x`.
- [x] **5. Split the scenes.** `src/content/scenes/home/<neighbourhood>.ts` × 6 and `home/index.ts`, which builds `HOME_SCENES` in the same order. `scenes/home.ts` becomes a re-export so no import elsewhere changes. Step 1's scene hash is unchanged.
- [x] **6. API digest.** `scripts/api-digest.ts` writes `docs/API.md`: one line per export (`name(signature) — file:line`, plus the first JSDoc sentence if there is one), grouped by file, for `src/engine/**`, `src/content/types.ts`, `src/content/tuning.ts` and `hooks.ts` (names only), `src/components/pulse-bus.ts`, `coin-layer.tsx` and `slots.tsx` if present. No bodies. Top of the file: a 12-line "How to add a feature" note describing steps 2–3 and the UI slots from card K0b (ask nothing; write `see src/components/slots.tsx`). Keep the file under 300 lines. Run it and commit the output.

## Checks
`npx tsc --noEmit`; `npx jest src/engine src/content`; `npx tsx scripts/api-digest.ts && wc -l docs/API.md`.

## Report
Standard format. Add the two golden hashes' test names so the next version can rely on them.
