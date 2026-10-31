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

## Current state — round 20 (v5.4, 3d60f81..c3796b5): ❌ CHANGES REQUESTED (C94 [high]). First round with the CPU section. Fix round v5.5 in progress.
Fixed: C90, C91, T66. The engine timed: refreshRewards ~1 µs (≤ 1×/s); drawer model 17 µs, gift model 9 µs in node.

| ID | Severity | File:line | Issue | Fix |
|---|---|---|---|---|
| C94 | high | engine/rewards.ts:207,217 | Any day/week key change, even backwards, re-rolls the set; time-zone toggling farms chests/diamonds/`days` (confirmed) | Roll only when the day/week number increases; gift caption for gap<0 |
| C95 | medium | game.ts:290; rewards.ts clockBehind | A clock set forward by mistake locks rewards up to 400 days | If lastSeen−now > 36 h: lastSeen = now, clear boosts |
| C96 | low | game.ts:262-270 | Boost `until` uncapped; boosters > 99 dropped on load; unlimited stacking | Cap until ≤ now + 30 d; cap inventory when granted |
| C97 | low | game.ts:816 | Offline GM: in-flight `carried` boosted twice | Boost only rest·value |
| U1 | medium | app/index.tsx:362,368 | Drawer (~70 views) and calendar (30 tiles) re-render 5×/s, ~1–3 ms JS each | memo + 1 Hz now + slices; memo rows/tiles/chests |
| U2 | medium | app/index.tsx:250 | Scene animates at 15 fps under the gift modal | `giftOpen` in `paused` |
| U3 | low | app/index.tsx:71-75,237 | giftStatus ×2 + claimableCount + boostSummary + new closures per tick | `rewardsHud` model, useCallback |
| U4 | low | engine/rewards.ts:204 | lastSeen bumped 1 Hz → new rewards identity | Bump when ≥ 60 s stale / on claims |
| U5 | low | rewards-ui.tsx:202-211 | Pulse loop runs with no "today" tile | Only when ready |
| M56 | low | rewards-ui.tsx | ~150–200 objects per tick while open | Fixed by U1 |
| C92, C93, A24, M53, M54, M55 | low | see round 19 (archive) | carried | carried |
| A22 / M50 | medium | scene/room.tsx | Facade drawing in room.tsx | facade.tsx, one path per pattern |
| C85–C89, A23, M51, M52 | low | archive | carried | carried |
| T70–T73 | test | rewards | T70 TZ toggle NY↔Kiritimati (+Monday); T71 DST 2026-11-01 + pin TZ; T72 forward-clock recovery; T73 offline GM + boost | add |
| T61–T65, T67–T69 | test | — | carried | add |
| A17 / M32 | carried | — | cached drawer-card model | archive |

**Next IDs:** K1, C98, A25, M57, U6, T74.
