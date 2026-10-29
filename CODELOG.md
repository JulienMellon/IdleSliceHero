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
