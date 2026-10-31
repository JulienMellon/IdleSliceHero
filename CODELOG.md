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

## Current state — round 21 (v5.5, cd6f9b2..9f7f1e8): ✅ APPROVED (3 medium). Both reviewers pass on v5.5.
Fixed: C94, C96, C97, U2, U3, U4, U5, T70, T71, T73. Partly: C95 → C98, U1/M56 → U6/M57, T72 → T74.

| ID | Severity | File:line | Issue | Fix |
|---|---|---|---|---|
| C98 | medium | engine/rewards.ts:229-243 | Recovery leaves day/week/gift.last in the future; tasks and gift freeze up to 400 days | Re-key day/week to today without regenerating; clamp gift.last ≤ today |
| U6 | medium | app/index.tsx:82; game.ts:560 | `stats` new every tick → drawer/calendar snapshot 5×/s; GameScreen renders twice per tick | Ignore stats identity; snapshot only while open; `bump` returns `s` on zero |
| A22 / M50 | medium | scene/room.tsx | Facade drawing in room.tsx (1,027 lines) | facade.tsx, one path per pattern |
| C99 | low | package.json:50 | TZ pinned only via the npm script; jest-environment-node undeclared | globalSetup; declare dep |
| A25 | low | app/index.tsx:80-82 | Snapshot made by setState during render | `useSlowSnapshot` hook |
| M57 | low | app/index.tsx:82 | Snapshot + re-render every tick with panels closed | Gate on open panels |
| C92, C93, A24, M53, M54, M55, C85–C89, A23, M51, M52 | low | see round 19/20 (archive) | carried | carried |
| A17 / M32 | medium (carried) | app/index.tsx drawer | Inline card model; gain sims every tick while open | Cached drawerCards() |
| T74, T75 | test | rewards / game | Forward-clock-then-fixed recovery; lineTick keeps stats identity | add |
| T61–T65, T67–T69 | test | — | carried | add |

**Next IDs:** K1, C100, A26, M58, U7, T76.
