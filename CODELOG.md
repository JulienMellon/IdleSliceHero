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
- **ID prefixes:** K blocker · C issue · A architecture · M memory · T test. **Next IDs: K1, C105, A28, M60, U10, T81.**

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
- Round 22 (v5.6) APPROVED → v5.7 and v5.8 skipped; round 23 (v5.9) reviewed `0d6d3a4..1430f5f` and APPROVED.
- **Now:** round 23 APPROVED → the next **two** builds skip the codecritic; the third reviews `1430f5f..HEAD`.

## Current state — round 23 (v5.7–v5.9 + lofi audio, 0d6d3a4..1430f5f): ✅ APPROVED (3 medium). Loop STOPPED (both reviewers passed on v5.9).
Fixed: C100 (T77), C101 (T76), U7. AU76/AU77 (audio fixes made after the audio loop closed) checked: correct, except overlapping plays (C102). New UI logic is pure and tested (city-model, goal-model, sidewalk-model). Cut-scene art static and memoised; nothing new on the 15 fps path.

| ID | Severity | File:line | Issue | Fix |
|---|---|---|---|---|
| C102 | medium | audio/director.ts:262-274 | Rare players cached per key and `firing` is a Set: a second play of the same key within its length (task + chest claim within 1.5 s → `collect/v` twice; two quick Expands) is cut when the first play's release runs | `RarePlays` acquire/release counter or play token in logic.ts; release at 0 (T78) |
| A22 / M50 | medium | scene/room.tsx (1,027 lines) | Facade drawing in room.tsx, many nodes per pattern | facade.tsx, one path per pattern |
| A17 / M32 | medium | app/index.tsx drawer | Inline card model; gain simulations per tick while open | Cached `drawerCards()` in drawer-model.ts (T45) |
| C103 | low | cutscene-player.tsx:107 | Card-holder rule inline; `Math.max(0, …)` gives the card to the first figure when Rosa is absent | `cardHolder(panel)` in staging.ts returning −1, keep the backdrop prop (T79) |
| C104 | low | game-ui.tsx `GoalLine` | Comment says memo-friendly; not memo'd, ReactNode icon | Drop the claim or memo + icon key |
| A27 | low | index.tsx:308 `buyBundle` | Up to 8 commits/saves/audio events/queueScene per press | Store `buyMany(steps)`: one commit, one save, one sting |
| M59 | low | director.ts:502 | Sound off → `warmRare` returns before its sweep; a warmed collect stays resident | Run the release loop before the sound check |
| U8 | low | director.ts:501-525 | `warmRare` on every set (≥ 5 Hz) runs `buildLock` for every hood when build/0 isn't resident (pre-Nonna and after the last build, forever) | Early return on a `builtCount\|seen\|offline\|pier9` key |
| U9 | low | city-map.tsx, city.tsx | `lotView` twice per lot per render | Compute lots once in City, pass down |
| T78–T80 | test | — | RarePlays overlap; cardHolder; perkDuckSeconds after a background resume (rebased `startedAt`) | — |
| Carried | low | — | M58, A26 (backdrop.tsx 933 lines), C92, C93, A24, A23, M53, M54, M55, M51/M52, C85–C89; tests T61–T65, T67–T69 | — |

**Next IDs:** K1, C105, A28, M60, U10, T81.
