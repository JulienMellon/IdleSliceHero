# Code review log

The **codecritic** (`.claude/agents/codecritic.md`) reviews each build step's diff for:
- correctness
- architecture
- performance and **memory** on a real iPhone (the owner's priority since round 2)
- type safety
- testability

It runs alongside the visual critic (`CRITICLOG.md`). A step is done only when the critic is SATISFIED **and** the codecritic APPROVES.

- **APPROVED** means: no blocker, no [high] item (issue, architecture or memory), and ≤ 3 [medium] items across ISSUES + MEMORY.
- **Full history:** rounds 1–18 (v2.15 → v5.0) are kept verbatim in [`docs/logs/CODELOG-archive.md`](docs/logs/CODELOG-archive.md). This file holds only the current state.
- **ID prefixes:** K blocker · C issue · A architecture · M memory · T test. **Next IDs: K1, C90, A24, M53, T66.**

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

**Since v3.3 (playtest 2, v4.7–v5.2):** the engine runs a discrete kitchen line (`engine/pipeline.ts`: prep → oven → counter → carriers, `advanceLine` event by event; cash is paid per departure); station heads + GM in `engine/game.ts` (save v4); the tutorial is a pure model (`engine/tutorial.ts`); the crew is event-driven (`scene/crew.ts`, trips start at the engine's dispatch time, routes cached per layout); taps are hit-tested in `scene/stations.ts`; neighbourhood looks are data in `scene/identity.ts`; coins fly in `components/coin-layer.tsx` (native driver) via `pulse-bus.ts`.

---

## Current state — round 19 (v5.1–v5.3, a0a9bee..320f0e8): ✅ APPROVED. Loop RESUMED 2026-10-30 night. From round 20 the brief adds a **CPU** section (U IDs).
Fixed: C84 (its clamp introduced C90).

| ID | Severity | File:line | Issue | Fix |
|---|---|---|---|---|
| C90 | medium | engine/pipeline.ts:72,193 | Fixed WALK_IN_DEBT_MAX (72) clamp in `dispatch` stops walk-ins once a dispatch carries > 72/(0.5−f) pies | Clamp to max(WALK_IN_DEBT_MAX, 2n) in dispatch; fixed clamp only in migrateLine |
| C91 | low | stations.ts:198, room.tsx:654,743 | `doorwaySignRect` duplicates what room.tsx draws | Draw the plank from `doorwaySignRect(lay)` |
| C92 | low | app/index.tsx:223-235 | Spotlight-target predicate ×3, nested halo ternary | Derive `sceneSpot`/`hudHalo` once |
| C93 | low | game-ui.tsx `halo`; sidewalk-row.tsx `cardCoach` | Halo changes border width → layout jump, coin target re-measure | Transparent reserved border |
| A24 | low | engine/game.ts:531 | FIRST_BATCH_SPEED hidden in lineRates | `firstBatch(shop)` predicate beside TUTORIAL_DONE |
| M53 | low | storefront.tsx:381-410 | Spotlight path strings rebuilt each frame | useMemo hole + scrim d |
| M54 | low | tutorial.ts:49-52 | Step 7 returns a new object each tick | Cached per-target objects |
| M55 | low | storefront.tsx:~206 | `sp` object + 3 rate calls per frame | Compare levels first |
| A22 / M50 | medium | scene/room.tsx | Facade drawing in room.tsx; many nodes per pattern | facade.tsx; one path per pattern |
| C85–C89, A23, M51, M52 | low | see round 18 (archive) | carried | carried |
| T61–T69 | test | — | T66 split at large batches (fails on C90); T67 coachStep same ref; T68 lineRates first-batch rule; T69 tutorialAdvance identity; T61–T65 archive | add |
| A17 / M32 | carried | — | cached drawer-card model | archive |

**Next IDs:** K1, C94, A25, M56, U1, T70.
