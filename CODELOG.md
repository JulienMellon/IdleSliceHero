# Code review log

The **codecritic** (`.claude/agents/codecritic.md`) reviews each build step's diff for:
- correctness
- architecture
- performance and **memory** on a real iPhone (the owner's priority since round 2)
- type safety
- testability

It runs alongside the visual critic (`CRITICLOG.md`). A step is done only when the critic is SATISFIED **and** the codecritic APPROVES.

- **APPROVED** means: no blocker, no [high] item (issue, architecture or memory), and ≤ 3 [medium] items across ISSUES + MEMORY.
- **Full history:** rounds 1–13 (v2.15 → v4.1) are kept verbatim in [`docs/logs/CODELOG-archive.md`](docs/logs/CODELOG-archive.md). This file holds only the current state.
- **ID prefixes:** K blocker · C issue · A architecture · M memory · T test. **Next IDs: K1, C67, A18, M35, T47.**

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

## Current state — round 14 (v4.1 → v4.2): ❌ CHANGES REQUESTED. The codecritic is PAUSED (Julien, 2026-10-30).

Round 14's two blocking items are fixed in v4.3 (commit d064ce5) but **v4.3 has not been code-reviewed**. When the codecritic resumes, review the range d25b801..HEAD first. `tsc` is clean and 134 tests pass on v4.3.

**Fixed in v4.3, awaiting review:** C63 [high] (decor cards in an unmanaged shop showed a green button: they now pass `buttonTone`, and `StationCard.tone` is required), C64 (the "saving" face only on framed cards), C65 (`stationTone`), M33 (cut-scene `Animated.Value`s created once), T46 (`StationView.progress`).

**Open**

| ID | Sev | Where | Problem | Proposed fix |
| --- | --- | --- | --- | --- |
| A17 | medium | `app/index.tsx` drawer | The drawer's card logic (tone, frame/hot, detail gain, lock label) is inline and not cached; it drifted from the sidewalk twice (C60, C63) | A pure, cached `drawerCards(game, id, idleShop)` in `components/drawer-model.ts`, keyed like `stationModels`; test it (T45) |
| M32 | medium | `app/index.tsx` drawer | While the drawer is open each 200 ms tick still runs ~7 `upgradeGain`, 4 `decorGain` and `vehicleGain` simulations (~400 objects/s) | Folds into A17 |
| C66 | low | `game-ui.tsx` strike bar | On iOS a shrunk (`adjustsFontSizeToFit`) long price keeps its full line box, so the bar may sit low and wide; web can't show it | Check on a device; if off, centre the bar on a wrapper |
| C62 + T43 | low | `scene/room.tsx` Waterfront | Porthole/net offsets are magic numbers checked at one footprint | Named anchors and a pure `waterfrontWallGeom(lay)` tested across footprints |
| T44 | low | `scene/layout.ts` | The centred top oven row has no test | Odd oven counts 3/5/7: midpoint, inside the span, no overlap |
| C54 | low | `store/game-store.ts` `load()` | Ticks and taps during the async reload are overwritten by the disk copy | Skip ticks while loading |
| T37, T38 | low | `engine/cutscene-input.ts`, `load()` | `resumeSceneEnd` never shortens a gap; a pure `awaySecondsOnResume` | Tests |
| M27, M31, M34 | low | various | Remaining small per-render allocations | See the archive |
| C37, C38, A12, A13, M16, M19, M20, M21, C22, C33, M10, M15, A10 | low | (carried) | See the archive | |

---

## Plan review (2026-10-30): PROCEED WITH CHANGES — folded into `docs/PLAN-v4.7-playtest2.md`
Items adopted: price every departure with `valuePerPizza` (#6); offline split GM vs no-GM (#3); `tickAt` interpolation + pops keyed on increasing departure ids (#5); walk-in loop off at ~0 share + max wait (#4, v4.9); no separate 30 fps people layer (#1); 1.0 s walk cycle (#2); smaller steps (#11). Memory notes from the plan review, numbered here: **M35** dough/pass counts outside `furnitureDeps`; **M36** badge progress snapped to 1/24 + memo; **M37** ≤ 800 allocs/frame before any 30 fps; **M38** pills keyed on id, nothing kept at opacity 0; **M39** one working copy per advance. Next IDs: **K1, C67, A18, M40, T47**.

## v4.7 — build (playtest 2, step 1: engine). Range: 7e60b02..HEAD. Also review the backlog d25b801..7e60b02 (paused since round 14).

| Change | Where | Test |
| --- | --- | --- |
| `pipeline.ts`: event-stepped stage machine (`advanceLine`), taps, rush, back-pressure in batches, departures ≤ 6 (merge), Bresenham walk-in split for drawing only, cash = n × `valuePerPizza` | `src/engine/pipeline.ts` | `pipeline.test.ts` (tick-size independence, cash only with departures, increasing ids, split, taps) |
| `Shop.line`, `Shop.heads`, integer `sold`, save v4 with `migrateLine` (v3 `queued` → bench) | `game.ts` | save v4 tests (v3 floor/queued/heads, mid-walk round trip, malformed line) |
| `lineTick`/`playTick` run the line; `offlineTick`: GM = closed form + everything on the line, no GM = only running jobs finish; line settled so a second load pays 0 | `game.ts` | offline tests |
| Heads + GM upgrades (`headCost`, `nextHire`, GM lock), GM ×2 in `shopRevenue`, `auto-bake` brings all heads; `buildGain` counts the GM boost | `game.ts`, `tuning.ts` | heads tests |
| Store: `tapStation` (toast on refusal, updates `lastKitchenTap`), `tickAt` | `game-store.ts` | — |
| Pacing sim models 3-tap play and heads: Nonna at 5.0 min after 35 taps; completion 183 min | `scripts/pacing-sim.ts` | — |

`tsc` clean; `npm test` 173 pass. Screenshots `v4.7`: `errors: []`, `loaded: true`.
