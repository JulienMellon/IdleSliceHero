# Code review log

The `codecritic` agent (`.claude/agents/codecritic.md`) reviews each build step's diff for code quality and architecture, alongside the visual `critic` (CRITICLOG.md). Both reviews feed the next build. A step is done only when the critic is SATISFIED and the codecritic APPROVES.

ID prefixes: K = blocker, C = issue, A = architecture, T = test.

## Code review round 1 — baseline (v1.5 → v2.15, step v2.14 → v2.15) — ❌ CHANGES REQUESTED

**Summary:** the v2.15 hunks are small and work (tsc clean, 30 tests pass, no crash risk). But the scene's biggest "memoised" layer re-renders every frame, and the geometry behind the recurring overlap notes lives untested inside a 2,527-line render file.

**Blockers:** none

**Issues**
- C1 [high] `layout()` builds a fresh `lay` every 15 fps tick, so `memo(RoomShell)` never skips; FrontWall/Doormat/DoorLeaf/OvenHood aren't memoised → `useMemo` the layout; memoise the static layers
- C2 [high] Render writes to `mem.current` (driver phase, payout edge, lastSold, pop) → a repeated render drops payouts; phase isn't reset on shop change → pure edge detection, bookkeeping in an effect
- C3 [medium] Row depths (6 / 40 / 20) and ledge maths are magic numbers inferred in render → `layout()` returns `frontRowRight`, `ledge`; named row constants
- C4 [medium] Baker placement + "nearest the counter" peel logic lives in render → `layout().bakers`
- C5 [medium] Dead `insideDoor/outsideDoor`; rush values computed twice; door lane literals scattered → `lay.door.lanes`
- C6–C9 [low] Lock text formatted by string slicing; D240 log vs code mismatch; inline cut-scene zoom numbers; 101 `critic Dxxx` comments

**Architecture**
- A1 [high] Split `storefront.tsx` into `scene/` modules (projection, layout, people, props, room, street, timelines, palette); Storefront only assembles
- A2 [medium] `Person` has 22 optional props → `look` + `pose` objects, per-role factories
- A3 [medium] People timelines as pure functions (`driverPose`, `guestPose`)

**Tests**
- T1 layout invariants for every footprint · T2 door lanes ≥ 20 apart inside the door · T3 ledge bar clear of front-row seats · T4 seat/walk-in colours never match neighbours · T5 `along()` endpoints, zero-length, clamp · T6 driver payout edge once per cycle; drivers never share a spot at the same time

## v3.0 — build (addresses code review round 1)

| ID | Change |
| --- | --- |
| A1 | `storefront.tsx` split into `scene/` modules: `projection`, `layout`, `primitives`, `people`, `props`, `background`, `room`, `street`, `timelines` (pure), `clock` (the hook), `palette` (pure). `Storefront` (~400 lines) only assembles the frame |
| C1 | `layout()` is `useMemo`'d on its seven inputs, so `memo(RoomShell)` and the other layers that take `lay` can skip. `SceneDefs`, `PrepBench` and `Counter` are memoised components; clouds and colour tables are module constants |
| C2 | Render is pure: it only computes driver phases. A `useEffect` compares them with the previous frame (`payoutCrossed`), emits the payout, updates the cash pop/lastSold, and resets on shop change |
| C3 | Named `FRONT_ROW_Y`, `BACK_ROW_Y`, `STARTER_Y`, `TABLE_PITCH`, `DOOR_IN_Y/OUT_Y`, `COUNTER_AISLE_Y`, `LEDGE_Y`, `STOOL_Y`, `MIN_OVEN_ZONE`; `layout()` returns `ledge` |
| C4 | `layout().bakers: {x, y, nearCounter}[]` |
| C5 | Dead door points removed; rush pulse/coins use one `rushK`/`rushC`; `lay.door.lanes` and `lay.orderSpots` |
| C6 | `nextVehicleLock()` returns `{kind:'maxed'} | {kind:'story', storyOf}`; `vehicleLockLabel()` formats it |
| C7 | CRITICLOG v3.0 notes that D240 removes the vehicle |
| C8 | `SCENE_ZOOM` table in backdrop.tsx |
| C9 | `critic Dxxx` IDs stripped from code comments (the logs keep the history) |
| A2 | Partly: `PersonProps` is a named, grouped interface (look overrides / pose). Grouping into `look`/`pose` objects and per-role factories is deferred so the split stays reviewable |
| A3 | `driverPhase`, `driverPose`, `guestPose` and `payoutCrossed` are pure functions in `timelines.ts`; `useClock` moved to `clock.ts` |
| T1–T6 | `scene/__tests__/scene.test.ts`: 14 tests across 2,700 layout combinations. They cover layout invariants, lanes, the ledge, seat colours, `along()`, payout once per lap, no shared spot and the aisle route. T1 caught an oven/counter overlap (now fixed) |

## Code review round 2 — v2.15 → v3.0 (memory focus) — ❌ CHANGES REQUESTED

**Summary:** The split and most round-1 fixes are real: tsc is clean, 44 tests pass, render is pure, and the memoised layout lets `RoomShell` skip. C1 is only partly done, and every `Person` still rebuilds its whole tree each frame. As a result, about 1,850 of roughly 2,300 SVG nodes re-render at 15–20 Hz.

**Blockers:** none

**Issues**
- C1 [high] (still open) FrontWall, DoorLeaf, Doormat and OvenHood are not memoised, but the comment and CODELOG say they are.
- C10 [low] Tap pills and the rush burst carry over across a shop switch.
- C11 [low] Leftovers: the unused `onStation`, a duplicate import, and a stale test-path comment.

**Architecture**
- A4 [medium] Finish A2: a memoised `PersonBody` at the origin, keyed on look and discrete pose, plus a light outer pose wrapper.
- A5 [low] `PrepBench`, `Counter` and `SceneDefs` still live in storefront.tsx. Move them to scene/.

**Memory**
- M1 [high] A maxed shop draws 22 people at about 450 allocations each, roughly 10k per frame or 150–200k/s. `arm` and `step` are continuous, so `memo` alone won't help. Fix: A4, quantise `arm`, cache `shade()`, and compute `lookFor` inside the memo.
- M2 [medium] About 20 static layers (FrontWall, Tables, Car, Cloud…) re-render every frame: about 450 nodes and 1.2k allocations. Fix: `memo` them all; draw Cloud at the origin.
- M3 [medium] `Oven` rebuilds the whole oven to move a flame. Fix: a memoised `OvenBody` plus a separate `Flame`.
- M4 [medium] `game` changes every 200 ms and `Storefront` isn't memoised, with fresh callbacks each time. The result is 20 renders/s, and 5/s even while paused. Fix: `memo(Storefront)`, stable callbacks, and read the game on clock frames with a selector that tracks upgrades.
- M5 [low] Drivers at `o = 0` stay mounted, about 120 invisible nodes.
- M6 [low] About 250 remaining per-frame allocations in `items`, the sort and the palette helpers.
- Clean: `useClock`, the pulse-bus unsubscribe, `useCountUp`, bounded refs, unique gradient ids, zustand selectors.
- Device estimate: 10–20 MB/s of young-gen garbage, 15–30 ms of JS per frame on an A11/A12.

**Tests**
- T7 Memo boundaries, via a renderer plus Profiler spies.
- T8 A node budget for the maxed Flagship.
- T9 `payoutCrossed` with arrays of different lengths.
- T10 Cached `shade` matches the uncached version.

## v3.1 — build (addresses code review round 2)

| ID | Change |
| --- | --- |
| M1 / A4 | `Person` is now a light placement wrapper (translate, depth scale, edge fade) around a cached `Figure`. Figures are drawn at the origin and kept as elements in an LRU (768 entries) keyed on look and quantised pose. `arm` snaps to 0.4 steps and the walk cycle to 8 frames, so a figure whose pose was seen before reuses that element and React skips its ~60-node subtree. `lookFor` and the paths only run on a cache miss. `shade()` is cached in a bounded map (cleared at 512) |
| M3 | `Oven` caches a memoised `OvenBody` per (geometry, grade, lit, flame level). The flicker snaps to 5 levels, so each oven cycles through at most 5 cached elements |
| C1 / M2 | `memo` on OvenHood, Table, Rug, WallPlanter, FloorProp, LedgeBar, Stools, FloorPlant, Register, FrontWall, DoorLeaf, ChalkSign, Doormat, Planter, Car, ParkedVehicle and PrepBench/Counter. Cloud is a memoised shape under a translating `G` |
| M4 | `Storefront` is `memo`'d and takes no `game` prop. It re-renders on its own clock (reading `useGame.getState()`) and on a `sceneKey` selector (levels, decor, managed, vehicle), so purchases still show while paused. 200 ms ticks no longer re-render it, and a paused scene stays still. `onTap` is a `useCallback` |
| M5 | Off-screen figures (`o ≤ 0`) aren't mounted. `edgeFade()` applies on both screen edges |
| C10 | Switching shop clears the tap pills and the rush burst |
| C11 | Removed the unused `onStation` and merged the duplicate import; fixed the test path comment |
| A5 | `PrepBench` and `Counter` moved to scene/props.tsx, `SceneDefs` to scene/defs.tsx |
| T9 | `payoutCrossed` ignores frames where the driver count changed (the phases re-space); tested |
| T10 | Cached `shade` equals `shadeRaw` for every pair; tests for the LRU bound and the quantisers (`scene/__tests__/cache.test.ts`) |
| T7/T8 | Deferred. The Jest setup is ts-jest/node for pure `.ts` only; render tests need a `jest-expo` preset and react-test-renderer, which is a separate step |
| M6 | Not changed: the `items` list (~45 entries) is still rebuilt per frame, now with mostly cached elements |
