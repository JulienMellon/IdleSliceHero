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
