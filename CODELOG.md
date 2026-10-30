# Code review log

The **codecritic** (`.claude/agents/codecritic.md`) reviews each build step's diff for:
- correctness
- architecture
- performance and **memory** on a real iPhone (the owner's priority since round 2)
- type safety
- testability

It runs alongside the visual critic (`CRITICLOG.md`). A step is done only when the critic is SATISFIED **and** the codecritic APPROVES.

- **APPROVED** means: no blocker, no [high] item (issue, architecture or memory), and ≤ 3 [medium] items across ISSUES + MEMORY.
- **Full history:** rounds 1–7 (v2.15 → v3.5) are kept verbatim in [`docs/logs/CODELOG-archive.md`](docs/logs/CODELOG-archive.md). This file holds only the current state.
- **ID prefixes:** K blocker · C issue · A architecture · M memory · T test. **Next IDs: K1, C39, A13, M20, T29.**

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

## Current state — round 8 (v3.5 → v3.6): ✅ APPROVED

v3.6 fixes the round-7 blocker (the furniture memo missed `prep`, so a managed shop's prep bench never updated): `buildFurniture(lay, fin)` reads only `lay` and one typed object, and the memo deps are `[lay, ...furnitureDeps(fin)]`. The reviewer noted that a hand-listed `furnitureDeps` could still drift; it is now `Object.values(f)` with a length test (C35, T27). `tsc` is clean and `npm test` passes (89 tests, ~100 s). Rounds 6–7 (v3.4, v3.5) were CHANGES REQUESTED and are archived with their build tables.

**Open (none blocks approval)**

| ID | Sev | Where | Problem | Proposed fix |
| --- | --- | --- | --- | --- |
| C37 | low | `storefront.tsx` | The `eslint-disable` on the furniture memo is justified (constant-length deps derived from `fin`); say so in the comment | Reword the comment |
| C38 | low | `backdrop.tsx` | SoldSign and RecipeCard coordinates are magic numbers with no test that they stay inside the cropped window x 99–301 | T28: geometry test |
| A12 | low | `storefront.tsx` | `buildFurniture` still lives in the component file | Move it to `scene/furniture.tsx` |
| M16 | low | `storefront.tsx` items | The items array is spread and sorted every frame | Keep furniture sorted and merge with the cast |
| M19 | low | `storefront.tsx` | One `fin` object and a 12-element deps array per frame (negligible) | None needed |
| C22 | low | `scene/props.tsx` `DomeFront` | Duplicates the dome geometry; `OvenHood` inlines the box-oven test | Use `domeGeom` and `isBoxOven` everywhere |
| C33 | low | `cutscene-player.tsx` | The `[scene.id]` lockout effect is redundant (`_layout.tsx` remounts per scene) | Drop it or comment why |
| M10 | low | `scene/cast.ts` walk cycle | The frame index comes from the wall clock | Have `useClock` return an integer tick |
| M15 | low | `scene/geometry.ts` | `ovenFrame` and friends allocate per oven per frame | Memoise per `(o, grade)` in a WeakMap |
| A10 | low | `app/index.tsx` | Card-detail strings are built inline each render | Extract a pure `stationDetails()` |

**Resolved after the review (same build):** C35 (deps derived from the object, T27) and C36 (redundant `Math.max` in the Drivers lock).
