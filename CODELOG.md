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

## Owner rule (Julien, 2026-10-31): skip after an APPROVED
After the codecritic returns **APPROVED**, it skips the next **two** build rounds. The round after that reviews **everything since the last range it reviewed**. While it's skipped, a build passes when the critic is SATISFIED (the last APPROVED carries).
- Round 22 (v5.6) APPROVED → **v5.7 skipped**, **v5.8 skipped**, the next build reviews `0d6d3a4..HEAD`.

## Current state — round 22 (v5.6, 47e2f3d..0d6d3a4): ✅ APPROVED (3 medium). Loop STOPPED for handoff.
Fixed: C98, U6, A25, M57, C99, T74, T75. Cut-scenes measured: heaviest panel ~160 SVG nodes (target ≤ 350), memoised on primitives, native-driver zoom/slide, unique gradient ids.

| ID | Severity | File:line | Issue | Fix |
|---|---|---|---|---|
| C100 | medium | cutscene-player.tsx:129-137; content/types.ts:37 | A panel with 3+ figures crashes (`stage[2]` undefined); `cast` is an open array (content max today: 2) | Type `cast` as a ≤ 2 tuple; T77 |
| A22 / M50 | medium | scene/room.tsx (1,027 lines) | Facade drawing in room.tsx, many nodes per pattern | facade.tsx, one path per pattern |
| A17 / M32 | medium | app/index.tsx drawer | Inline card model; ~12 gain simulations per tick while open | Cached `drawerCards()` in drawer-model.ts (T45) |
| C101 | low | cutscene/staging.ts:7 | Hands/hats not in the tested boxes; ~0.5 px clearance on iPad mini; two surprised figures overlap palms ~30 px | `HANDS_BOX` per pose; fix the comment; T76 |
| U7 | low | rewards-ui.tsx:159-160 | Strip scroll/size events re-render the whole drawer ~31×/s | Sizes in a ref; state only for the fade boolean |
| M58 | low | backdrop.tsx, figure-art.ts | All scene strings built at import | Lazy per id only if profiling shows a cost |
| A26 | low | backdrop.tsx (930 lines, 9 scenes) | One file for all scenes | Split per scene when the next is added |
| C92 | low | app/index.tsx:223-235 | Spotlight-target predicate ×3; nested halo ternary | Derive `sceneSpot`/`hudHalo` once |
| C93 | low | game-ui.tsx `halo`; sidewalk-row.tsx `cardCoach` | Halo changes border width → layout jump | Transparent reserved border |
| A24 | low | engine/game.ts:~531 | FIRST_BATCH_SPEED hidden in lineRates | `firstBatch(shop)` predicate |
| M53 | low | storefront.tsx:381-410 | Spotlight path strings rebuilt per frame | useMemo hole + scrim d |
| M54 | low | tutorial.ts:49-52 | Step 7 returns a new object per tick | Cached per-target objects |
| M55 | low | storefront.tsx:~206 | `sp` object + 3 rate calls per frame | Compare levels first |
| C85 | low | storefront / crew | Two derivations of "idle" | One `G.idleShop` |
| C86 | low | scene/crew.ts | A hire mid-trip re-routes a walking figure | Idle flag per trip/slot |
| C87 | low | pipeline `dispatch` | `while` where only one carrier can leave | `if` |
| C88 | low | coin-layer / Hud | Coin target not re-measured on layout/rotation | Re-measure |
| C89 | low | storefront | `since` computed several times per frame | Once per frame |
| A23 | low | scene/crew.ts | Magic route numbers | Named constants |
| M51, M52 | low | scene per-frame paths (round 18; full text not preserved) | Small per-frame allocations | Re-derive on next review |
| T61–T65 | test | rounds 17–18 (full text not preserved) | Requested tests | Re-derive on next review |
| T67, T68, T69 | test | tutorial / game | coachStep same ref; lineRates first-batch rule; tutorialAdvance identity | add |
| T76, T77 | test | staging / content | Hands box on every window and speaker; ≤ 2 figures per panel and ids in LOOKS | add |

**Next IDs:** K1, C102, A27, M59, U8, T78.
