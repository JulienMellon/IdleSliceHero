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

## Round 15 (v4.7 + backlog d25b801..7e60b02): ✅ APPROVED. Next IDs: **K1, C72, A19, M43, T52**.
Round 14's C63/C64/C65/M33/T46 verified fixed. Notes and their v4.8 status:
| ID | Sev | Note | v4.8 |
| --- | --- | --- | --- |
| C67 | medium | `startAutomated` strands non-multiple remainders | takes everything waiting while under 2 batches; T47 |
| C68 | low | All-heads shop muted and missing from city $/s | `runsItself`; test |
| C69 | low | `migrateLine` ids / walk clamp / Infinity job | fixed; T50; jobs capped at 3600 s |
| C70 | low | `MAX_EVENTS` drops time silently | `__DEV__` warning |
| C71 | low | double `set`, dead check, "queued orders", doc | fixed (goal ids → A17) |
| A18 | low | duplicated level key | `G.shopLevelKey` shared |
| A17 | medium | drawer card model inline (open) | open |
| M40 | low | unused `phases` in `buildCast` | removed (`payoutCrossed` stays until v4.9 routes) |
| M41, M42 | low | per-tick allocations; coin budget | M42 met (≤ 3 coins, ≤ 2 pops); M41 open |
| T47–T51 | — | remainders, ±1% revenue, immutability, save clamp, rush pays 0 | added |

## v4.8 — build (step 2: stations UI). Range: fd58f05..HEAD
| Change | Where | Test |
| --- | --- | --- |
| `stationRects` / `stationAt` / badge row geometry | `scene/stations.ts` | `stations.test.ts` (44 pt on 3 fits, each station hit, front-most, misses, badge band vs plank/menu/shelf, spacing, 1/24 snap) |
| `StationBadge` memoised on primitives (M36); `DeparturePops` (M38: keyed on id, nothing at opacity 0); `HireBubble` | `scene/kitchen-hud.tsx` | — |
| Interpolation from `tickAt`, never past 0; payout bump when a departure id disappears (ids only grow) | `storefront.tsx` | — |
| Tap position from `pageX/pageY − measureInWindow` origin | `storefront.tsx` | screenshot 05b3 |
| `game.tapStation` refusal names the head ("Finn has it covered") | `game.ts` | — |

`tsc` clean; 186 tests pass; screenshots `v4.8`: `errors: []`.

## Round 16 (v4.8): ✅ APPROVED (3 [medium]). Next IDs: **K1, C78, A20, M46, T56**.
| ID | Sev | Note | v4.9 |
| --- | --- | --- | --- |
| C72 | medium | Walk-ins never pop | `popModels` (pure): walk-ins pop for their whole hand-over; T52 |
| C73 | low | Miss does nothing | nudge + station outline, quantised |
| C74 | low | Dead imports/code/comments, `fin` shadow | removed; `isNum` |
| C75 | low | Stale cash sound after a pause | `wasPaused`; payout detected by the oldest id passing the last known one (no per-frame id array) |
| C76 | low | Origin measured only on layout | re-measured `onPressIn` |
| C77 | low | One bubble for several hires; unclamped | queued; clamped |
| A19 | medium | Badge view-model inline | `badgeModels` in `stations.ts`; T53 |
| A17 | medium | Drawer card model inline | open |
| M43 | medium | Badge memo fails on GM shops | ring steps ≈ 8/s (`ringSteps`), pulse/nudge/jump quantised on the 7.5 Hz pose clock |
| M44 | medium | Per-frame allocations | `geo` gone, `rushC`/register/tie set memoised, frozen `AUTOMATIC`, no id arrays, coins off the SVG (native-driven overlay) |
| M45 | low | Pop allocations | `popModels` one pass, no reduce objects |
| T52–T55 | — | | added (T54 now tests a real overlap + real layouts) |

## v4.9 — build (step 3: event-driven people). Range: 5f4f51a..HEAD
| Change | Where | Test |
| --- | --- | --- |
| `crew.ts`: `stepCrew` folds departures (idempotent, bounded: ≤ spots drivers, 1 walk-in), `driverPoseAt`/`guestPoseAt`, `alongTimed` constant speed | `scene/crew.ts` | `crew.test.ts` |
| `buildCast` takes `crew`; carriers tagged with their departure for pops | `cast.ts` | `crowd.test.ts` (+ D336 budget) |
| Storefront folds the crew in render (idempotent ref write, noted) and launches coins via `pulse-bus` `emitCoin` → `CoinLayer` (Animated, native driver, ≤ 3) | `storefront.tsx`, `coin-layer.tsx` | — |
| Store `tapStation` returns the refusal reason (no global toast) | `game-store.ts` | — |
| `LINE.cycleSeconds` 1.6 → 2.4 | `pipeline.ts` | T48 still ±1% |

`tsc` clean; 200 tests; screenshots `v4.9`: `errors: []`.

## Round 17 (v4.9): ❌ CHANGES REQUESTED (4 [medium]). Next IDs: **K1, C84, A22, M50, T61**.
| ID | Sev | Note | v5.0 |
| --- | --- | --- | --- |
| C78 | medium | Walk-in vanishes mid-meal when a tapped shop goes idle | walk-ins stopping only stops arrivals; waiting ones get a `quitAt`; `nextVisit` survives gaps; T56 |
| C79 | medium | Coin animations started inside a setState updater; never stopped | built/started outside updaters, kept in a ref, stopped on unmount |
| C80 | medium | Payout/coin detection assumed id order | payouts from `shop.sold` rising; coins launched per id (small bounded set) |
| M46 | medium | Routes rebuilt per frame | `routesFor` cached per layout (WeakMap); `stepCrew` returns `prev` early |
| C81 | low | Magic coin target | HUD measures its cash text (`setCoinTarget`) |
| C82 | low | Give-up schedule mismatch | one `guestSchedule` for fold and pose |
| C83 | low | Re-export, stale comment | removed |
| A20 | low | Old timelines module only used by tests | open (GUEST_WALK_Y still lives there) |
| A21 | low | Duplicate rate table | `stageRates` |
| M47 | low | Coin layer re-renders/re-interpolates per tick | memo, interpolations built once per coin, no props |
| M48 | low | Per-frame Map etc. | carriers Map reused from the ref |
| T56–T60 | — | | added (T59: the speed test now checks each leg's own speed) |

## v5.0 — build (step 4). Range: efa14c8..HEAD
| Change | Where | Test |
| --- | --- | --- |
| **Carriers in the engine (G81)**: `boxed`, `driverBusy`, `walkinBusy`; `dispatch` hands everything boxed to the due carrier when free; laps in `LINE` | `engine/pipeline.ts`, save fields in `migrateLine` | T48 still ±1%; walk-in split test; offline/save tests |
| Crew rewritten to follow the carriers exactly (trip start = dispatch time via `since`); routes cached; idle-shop lanes (D352); exit lane changes (D353) | `scene/crew.ts`, `cast.ts`, `layout.ts` (order spot) | `crew.test.ts` (G81 carried-every-frame test across footprints and rates, T56–T60), crowd budgets D336/D352/D353 |
| Neighbourhood identity data + facade/awning/band/floor/street prop drawing | `scene/identity.ts`, `room.tsx`, `storefront.tsx` | screenshots |
| Coin layer rework (C79, M47, C81) | `coin-layer.tsx`, `pulse-bus.ts`, `game-ui.tsx` | — |

`tsc` clean; 204 tests; screenshots `v5.0`: `errors: []`. Pacing unchanged (Nonna 5.0 min / 35 taps; city 184.8 min).
