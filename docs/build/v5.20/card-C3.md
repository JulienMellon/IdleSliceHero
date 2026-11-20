# Card C3 — the Chapter 1 script (v5.20, lane E, with the drawer's targets in lane U)

**Goal:** the tutorial runs the 15 steps in `docs/story/COPY-v5.20.md`, each naming its coach targets and mode. Steps 7 and 8 exist and are skipped until v5.21. Old saves land on the right step.

**Read first:** `docs/PLAN-v5.20-onboarding.md`; `src/engine/tutorial.ts` (all of it); `TUTORIAL_DONE` and `tutorial` in `src/engine/game.ts`; `tutorialAdvance` and `tutorialHoldsStory` call sites in `src/store/game-store.ts`; `src/components/coach/targets.ts` (C1).

## Files
- Own: `src/engine/tutorial.ts`, `src/content/copy/home/tutorial.ts` (new) and its line in `src/content/copy/index.ts`, `src/engine/game.ts` (`TUTORIAL_DONE`, the save migration only), `src/store/game-store.ts` (the `starterAt` cue only, if `TUTORIAL_DONE` moves), the drawer component's card and close button (register `drawer:hire:prep` and `drawer:close` with `useCoachTarget`; find it from `drawerOpen` in `src/app/index.tsx`), the coach block of `src/app/index.tsx`, `src/engine/__tests__/tutorial*.test.ts`, one new fixture file `scripts/fixtures/<next free number>_c3.py`.
- Do not touch: `src/components/coach/**` (C1), `src/components/storefront.tsx` and `scene/**` (C2).

## Steps
- [ ] **1. The step shape.** `CoachStep { id; key: 'tutorial.<n>'; text; targets: CoachTargetId[]; mode: 'tap'|'wait'|'look'|'free' }`. Drop `dock` and `target` (the overlay docks the card). Lines come from a new copy table `src/content/copy/home/tutorial.ts` (keys `tutorial.<n>`, `tutorial.alt.<n>`), copied byte for byte from `docs/story/COPY-v5.20.md` and merged into `HOME_COPY` in `src/content/copy/index.ts`; the engine stores keys, the UI reads `t(key, vars, city)`.
- [ ] **2. The 15 steps** with their ends (the table in `card-W1.md`):
  1 `station:prep` tap · 2 `station:prep`+`dial:prep` wait · 3 `station:oven` tap · 4 `station:oven`+`dial:oven` wait · 5 `station:counter` tap · 6 `hud:cash` look · 7 `hud:goal` tap (skipped) · 8 task list look (skipped) · 9 free, until the second oven is affordable (`tutorial.alt.9` when the money went elsewhere, today's D374 rule) · 10 `walk:ovens` tap, ends at ovens = 2 · 11 `ovens:all` look · 12 `walk:all` tap, ends when the drawer opens · 13 `drawer:hire:prep` look, ends when the drawer closes (`tutorial.alt.13` when Marco is already affordable) · 14 free, ends when the prep head is hired · 15 `station:prep`+`dial:prep` look.
  `TUTORIAL_DONE` = 16. Steps 7 and 8: `coachStep` treats them as done while `CHAPTERS_ON` (a constant, `false` in this version) is false.
- [ ] **3. Save migration.** Bump the save version. A save with `tutorial` in 1..6 keeps it; 7 → 9; 8 → 10; 9 → 14; 10 (old done) → 16. A save whose first shop is managed is done, as today. Test every mapping.
- [ ] **4. Story hold.** `tutorialHoldsStory` holds through step 11. The 90 s pacing rule is unchanged.
- [ ] **5. Hints.** `hintsAllowed` stays as it is (one instruction at a time) for every step except the free steps 9 and 14, where hints show.
- [ ] **6. Wire `index.tsx`** to pass `coach.targets`, `coach.mode` and `coach.text` to the overlay; remove card C1's temporary mapping.
- [ ] **7. Tests.** Step order on a simulated run (tap prep … hire Marco) reaches 16 with no step skipped except 7 and 8; the D374 fallback; each migration.
- [ ] **8. Fixture.** `<n>_c3.py`: one shot for each of steps 1, 2, 4, 6, 9, 10, 11, 12, 13, 15 with `expect()` on the step id.

## Checks
`npx tsc --noEmit`; `npx jest`; `npm run format:check`; `npx tsx scripts/pacing-sim.ts | tail -12` (the day table must equal the previous version's).

## Report
Standard format, plus the migration table as tested.
