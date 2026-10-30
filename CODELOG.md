# Code review log

The **codecritic** (`.claude/agents/codecritic.md`) reviews each build step's diff for:
- correctness
- architecture
- performance and **memory** on a real iPhone (the owner's priority since round 2)
- type safety
- testability

It runs alongside the visual critic (`CRITICLOG.md`). A step is done only when the critic is SATISFIED **and** the codecritic APPROVES.

- **APPROVED** means: no blocker, no [high] item (issue, architecture or memory), and ≤ 3 [medium] items across ISSUES + MEMORY.
- **Full history:** rounds 1–5 (v2.15 → v3.3) are kept verbatim in [`docs/logs/CODELOG-archive.md`](docs/logs/CODELOG-archive.md). This file holds only the current state.
- **ID prefixes:** K blocker · C issue · A architecture · M memory · T test. **Next IDs: K1, C24, A10, M12, T18.**

---

## Architecture as of v3.3 (what the reviews converged on)
- `src/components/storefront.tsx` only assembles the frame. It is `memo`'d and opted out of React Compiler (`'use no memo'`), and re-renders on its own 15 fps `useClock`. It reads `useGame.getState()` each frame, plus a `sceneKey` selector so purchases show while paused. `key={id}` remounts it on a shop switch.
- `src/components/scene/` pure modules, which are unit-tested in node:
  - `projection.ts`: `P()`, `kAt()`, a cached `shade()`, `unprojectX()`
  - `layout.ts`: all geometry and named constants
  - `timelines.ts`: driver and walk-in routes, `payoutCrossed`
  - `cast.ts`: `buildCast()`, `edgeFade`
  - `palette.ts`: seat colours
  - `looks.ts`: roles, seeded looks, `PersonProps`
  - `quantise.ts`: `quantArm`, `quantStep`, `bobFor`
- Drawing modules (`.tsx`): `people.tsx`, `props.tsx`, `room.tsx`, `street.tsx`, `background.tsx`, `defs.tsx`, `primitives.tsx`, `clock.ts`.
  - `Person` is placement only, over three memoised parts: `Limbs` (back), `FigureBody` and `Limbs` (front). The parts take primitive props only. Arm work runs on a 7.5 Hz pose clock.
  - Ovens are a memoised `OvenBody`, a per-frame `Flame`, and a memoised `DomeFront`.
  - Every static layer is `memo`'d.
- **Measured** for a maxed shop: ~360 re-rendered SVG nodes and ~1.6k allocations per frame (it was ~1,850 nodes and ~11.5k at round 2).
- **Tests** (`npm test`, ts-jest, node env, `.ts` only): `src/engine/__tests__` and `src/components/scene/__tests__`. The scene tests cover layout invariants, lanes, the ledge, palette, `along`, payouts, quantisers, crowd-overlap budgets and pose churn.
- **What can't be tested here:** anything that imports a `.tsx` file or `react-native-svg`. Render and Profiler tests (T7/T8) would need a `jest-expo` preset.

## Current state — round 5 (v3.2 → v3.3): ✅ APPROVED

**Open: address these in v3.4** (none blocks approval)

| ID | Sev | Where | Problem | Proposed fix |
| --- | --- | --- | --- | --- |
| C19 | medium | `scene/layout.ts`, the `b0` snap (D275) | Snapping the back row to the 2·SEAT grid drops a table in some layouts: fp2 (plants 1, 3 cooks) goes 4→3, fp3 (2 staff, 3 cooks) 4→3, fp4 (plants 1, 1 cook) 5→4 | Snap only when a column still fits; otherwise use `b0raw`. Add **T16** |
| C20 | medium | `crowd.test.ts` "nobody stands still on the doormat" | It can't fail: people pause at y −30, outside the y range it checks | Project the mat polygon (−8…−22) to a screen box; no still figure's box may overlap it by > 20%. This is **T17** |
| C21 | low | `crowd.test.ts` | ~30 s of the ~77 s test run | Compute the frames once in `beforeAll`, collect failures and assert once, simulate 20 s |
| C22 | low | `scene/props.tsx` `DomeFront` | Duplicates the dome geometry; the plinth now paints over the grade-2 woodpile; `OvenHood` inlines the box-oven test | Add `domeGeom(o)` and move the woodpile into `DomeFront`; use `isBoxOven` everywhere |
| C23 | low | `storefront.tsx` imports | `SEAT` and `type Mood` are unused | Remove them |
| A9 | low | `flameBox`, `limbGeom` (`.tsx`) | They can't be unit-tested | Move them, with `domeGeom`, to a pure `scene/geometry.ts`. That unblocks **T14** (flame inside its window or mouth) and **T15** (limb hip `by` = body `by − bob`) |
| M10 | low | `scene/cast.ts` walk cycle | The frame index comes from the wall clock, so frames still duplicate or skip | Have `useClock` return an integer tick, or correct the comment |
| M11 | low | `cast.ts` cook mood | `focus` toggles ~3×/s and re-renders `FigureBody` | Drive it from `floor(t / 1.5)` |
| M6 | low | `storefront.tsx` items | Static furniture entries are rebuilt every frame | `useMemo` them on `[lay, decor, prep, boxes, idleShop]`, then concat with the cast |

## v3.4 — build

| Item | Fix |
| --- | --- |
| C19 + T16 | `layout()` snaps the back row only when no column is lost; test sweeps footprints, cooks, staff, ovens and plants. |
| C20 + T17 | The doormat test projects the mat polygon to a screen box and fails if a still figure covers more than 20%; it includes a "can fail" check. |
| C21 | Crowd frames are computed once per (shop, pace) and shared; the full suite runs in about 100 s. The G72 scene test samples every 7th layout (it took 107 s as a full sweep). |
| C23 | Unused `SEAT` and `Mood` imports removed from `storefront.tsx`. |
| A9 + T14/T15 | `scene/geometry.ts` holds `limbGeom`, `bodyBy`, `domeGeom`, `flameBox` and the oven geometry; `geometry.test.ts` checks the flame sits inside its window or mouth and limb hip equals body height minus bob. |
| M11 | Cook `focus` mood is driven by `floor(poseClock / 1.5 + i)`, not a sine at 15 fps. |
| Playtest | New pure modules: `components/cutscene-input.ts` (`canAdvance`, `sceneMayOpen`, `sceneHeading`) and `rate` / `goalAmount` in `engine/format.ts`. Engine: `upgradeLock` drivers, `buildLock` Suburbs + `nonnaPizzasLeft` / `nonnaCountdownText`, `applyOffline` returns `capped` and `awaySeconds`, `bundleHint`. New tests: `components/__tests__/cutscene-input.test.ts`, `engine/__tests__/playtest.test.ts` (existing build test now sets `seenScenes` for the Suburbs lock). |
| Not done (planned) | C22, M6, M10; tap-target resize (v3.6); 90 s story pacing and perks (v3.5). No `SAVE_VERSION` bump this step (no new saved fields). |

## v3.5 — build (round 6 items from the v3.4 review)

| Item | Fix |
| --- | --- |
| K1 | The heading wording ("Act") now matches code and test; the red test was a working-tree change caught mid-edit. |
| C24 | `cutscene-input.ts` moved to `src/engine/`; the store and player import it from there. |
| C25 | `lastKitchenTap` is store state (not saved) and the gate is the pure `pickScene()`; boundary tests added (T19). |
| C26 | `bundleHint` is cached in the engine on levels, decor and fleet (single-entry cache); the hand-built key, `useMemo` and the eslint suppression in `index.tsx` are gone. |
| C27 | The lockout clocks reset in an effect keyed on `scene.id`. |
| C28 | `NONNA_TAKEOVER` lives in `tuning.ts`; the engine no longer imports scene content; a test ties the constant to downtown-4's trigger. |
| C29 | Tests: Drivers lock with and without room to expand, the bundle advisor never buys drivers past the cap. |
| C30 | `OfflinePopup` `capped` and `awaySeconds` are required. |
| M12 (M6) | Static furniture in `storefront.tsx` is built in a `useMemo` on `[lay, id, fp, plants, tableTier, signageTier, dough, boxes, idleShop, vehicle, shopName]`; only the cast is rebuilt per frame. |
| T18–T23 | Added: single-panel heading, scene gate, no-soft-lock for Nonna's takeover, offline cap boundaries, `rate()` thresholds. |
| Not done | C22, M10, M15, A10 (low). Version labels: this fix build is v3.5, so 90 s story pacing and perks are now v3.6 and the tap-target resize v3.7. |
