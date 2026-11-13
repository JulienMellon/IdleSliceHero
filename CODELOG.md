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

## Current state — round 24 (v5.10–v5.12, 1430f5f..5d82004): ✅ APPROVED (3 medium)
Fixed: C102 (T78), C103 (T79), M59. v5.12 numbers are numerically safe (max cost 1.87e17; suffixes to 1e33). **Skip rule:** the next two builds (v5.13, v5.14) skip the codecritic; v5.15 reviews `5d82004..HEAD`.

| ID | Severity | File | Issue | Fix |
|---|---|---|---|---|
| C105 | medium | game-ui.tsx `GoalLine` | Only the last word shrinks; on 375/320 pt phones the payoff word truncates first and the amount can be pushed under the bar; 6–9 Texts ×2 reconcile every cash tick | Words in a `flexShrink: 1, overflow: hidden` row, amount outside at `flexShrink: 0`, `maxFontSizeMultiplier`; memo'd `GoalWords` with a stable `onSpans` (closes C104); T81 `goalLabelFits` at 320/375/393 |
| A22 / M50 | medium | scene/room.tsx | 1,027 lines, facade node count | facade.tsx |
| A17 / M32 | medium | app/index.tsx drawer | Inline card model, gain sims per tick, now + `capExpandCost` per card | `drawerCards()` in drawer-model.ts |
| C106 | low | saves | Pre-retune saves load but carry no economy marker (windfall or sudden wall) | `economy: 2` field + policy before TestFlight (T82) |
| C107 | low | tuning.ts | Uptown costMult 8e8: Lv 25 round = 5.4 h income; Lv 50 buy ~$6T | Check goal bar and "upgrades ×N" tasks don't point at multi-day buys |
| C108 | low | scene/crew.ts `guestLeg` | New table changes the modulus; seated walk-ins jump tables | Store `table` in `GuestSlot` (T84) |
| C109 | low | engine/format.ts | 999,500–999,999 prints "$1000K" | Recompute the tier after rounding (T83) |
| A28, A29, A27 | low | storefront.tsx, FurnitureSource, index.tsx | Level-up state machine in render body; optional counter/drivers; `buyMany` | `stepMoments()` in moments.ts; required fields; store `buyMany` |
| M60, U10, U11, U8, U9 | low | storefront.tsx, cast.ts, director.ts, city | ~60–90 short-lived objects per frame; `queueSizes`/`waitingText` at 15 Hz; carried | Memo on scene keys |
| T80–T84 | test | — | perkDuckSeconds resume; goal label budget; migrate pre-v5.12; economy pin; crew tables | — |

**Next IDs:** K1, C110, A30, M62, U12, T85.
- v5.14 closed 2026-11-12: codecritic skipped — notes: docs/build/v5.14/review-r3-code.md
- v5.15 closed 2026-11-13: codecritic APPROVED r2 — notes: docs/build/v5.15/review-r2-code.md
