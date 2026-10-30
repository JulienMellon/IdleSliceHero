# Code review log

The **codecritic** (`.claude/agents/codecritic.md`) reviews each build step's diff for:
- correctness
- architecture
- performance and **memory** on a real iPhone (the owner's priority since round 2)
- type safety
- testability

It runs alongside the visual critic (`CRITICLOG.md`). A step is done only when the critic is SATISFIED **and** the codecritic APPROVES.

- **APPROVED** means: no blocker, no [high] item (issue, architecture or memory), and ≤ 3 [medium] items across ISSUES + MEMORY.
- **Full history:** rounds 1–8 (v2.15 → v3.6) are kept verbatim in [`docs/logs/CODELOG-archive.md`](docs/logs/CODELOG-archive.md). This file holds only the current state.
- **ID prefixes:** K blocker · C issue · A architecture · M memory · T test. **Next IDs: K1, C44, A14, M22, T33.**

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

## Current state — round 9 (v3.6 → v3.7): ✅ APPROVED

v3.7 adds save v3 (`playSeconds`, `sceneAt`, `Shop.perk`), the pure pacing gate (`sceneReady` / `pickScene`), five neighbourhood perks and the Pier 9 bid. The engine changes are pure and every caller uses the new signatures; `tsc` is clean and 111 tests pass. Perk scope, the `bundleHint` key and save compatibility (v2 → v3, and v3 opened by v3.6) were checked.

**Open (none blocks approval). Fix C39 first in v3.8: it is a real gameplay bug.**

| ID | Sev | Where | Problem | Proposed fix |
| --- | --- | --- | --- | --- |
| C39 | medium | `store/game-store.ts` `load()` with `app/_layout.tsx` (AppState) | iOS fires inactive → active for Control Center, Notification Center, call banners and the app switcher; `load()` resets `lastSceneEndPlay` to null each time, so a one-second swipe plays the next beat and breaks the 90 s gap | Reset only after a real absence: `STORY_PACING.returnSeconds` (~60 s) compared with `awaySeconds`; keep null on a cold launch. Extract `resumeSceneEnd(prev, awaySeconds)` and test it (T32) |
| C40 | low | `migrate` (`${id}-4`), `sceneReady` (`${hood}-3`) | Depend on the scene-id pattern; `migrate` hard-codes Downtown | Use `!!PERKS[id]`; pin the pattern with T29 |
| C41 | low | `app/index.tsx` | `G.perkOf(id, shop)` called four times with `!` | Compute once |
| C42 | low | `applyOffline` | The `.map` callback adds to an outer `bonus` | Map, then reduce |
| C43 | low | `nonnaCountdownText` | "Nonna is about to take over" can show for 120 s+ while downtown-4 waits out its gap | Word it for a wait, or show the seconds left |
| A13 | low | `pickScene` | Six positional arguments, three of them clocks | One gate object |
| M20 | low | `playTick` | Spreads the state a second time on top of `tick` | Optional `playDt` in `tick` |
| M21 | low | `queueScene` per 200 ms tick | Builds a `Set` and filtered array while a beat waits out its gap (<1 KB/s) | Optional: skip until the next gap boundary |
| C37, C38, A12, M16, M19, C22, C33, M10, M15, A10 | low | (carried) | See the round-8 archive | |

**Tests to add:** T29 (perk scenes ↔ `PERKS`, id pattern), T30 (v3 round trip, bad `sceneAt` entries dropped), T31 (Priya leaves fleet costs alone, Sal leaves foreground earnings alone, exact Dale test), T32 (`resumeSceneEnd`).

## v3.8 — build (round-9 items + tap targets)

| Item | Change |
| --- | --- |
| C39 + T32 | `STORY_PACING.returnSeconds = 60`; pure `resumeSceneEnd(prev, awaySeconds)` in `engine/cutscene-input.ts`. `load()` keeps the in-memory gap after a short absence and clears it after a real return or a cold launch. |
| C40 + T29 | `sceneId()` / `finaleId()` in `game.ts`; `migrate` uses `!!PERKS[id]`; `sceneReady` uses `sceneId`. Tests pin the `<neighbourhood>-<beat>` pattern and one finale per perk. |
| C41 | `perkOf(id, shop)` computed once in `index.tsx`. |
| C42 | `applyOffline` maps, then sums the bonus with `reduce`. |
| C43 | "Nonna takes over soon — keep baking" once the count is reached but the scene waits out its gap. |
| T30, T31 | v3 round trip (bad `sceneAt` entries dropped); Priya leaves fleet prices alone; Sal leaves foreground earnings alone; exact Dale test. |
| Tap targets | `components/tap-targets.ts` (`TAP`, `hitSize`, `slopOf`) + `tap-targets.test.ts`; `BuyButton` compact draws at 44 pt; `index.tsx` uses the constants for the label strip, chips and Close. |
| Not done | A13, M20, M21 and the carried lows. 123 tests pass. |
