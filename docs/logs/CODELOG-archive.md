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

## Code review round 3 — v3.0 → v3.1 — ❌ CHANGES REQUESTED

**Summary:** The static layers really skip now and Storefront is off the 200 ms tick. But the element LRU doesn't do what it claims: React skips only against the props from the previous frame. About 80% of figures still re-render every frame.

- C12 [medium] The element LRU saves only 2 allocations per hit; the comments and CODELOG overclaim it. Fix: remove it.
- C13 [medium] React Compiler is enabled. A render-time `useGame.getState()` could be auto-memoised. Fix: select the fields, or opt out with `'use no memo'`.
- C14 [low] The C10 fix writes to the ref during render. Fix: use `key={id}`.
- C15 [low] The hand-kept `figureKey` list. Removing the cache removes it.
- A6 [high] Split the figure into a memoised body and small limbs.
- A7 [medium] Add a pure `buildCast()` so pose churn can be tested in node.
- M1 [high] Value quantisation is coarser than the per-frame motion: about 18 of 23 figures still re-render, roughly 1,080 nodes and 6.8k allocations per frame. Fix: A6, plus a time-quantised pose clock.
- M3 [medium] The flame level changes on about 65% of frames. Fix: a memoised body plus a separate Flame.
- M7 [medium] Building the cache key and doing the LRU bookkeeping cost about 450 allocations per frame. In dev, retained elements pin fibers.
- M6 [low] Still open.
- T11–T13: key parity, a pose-churn budget, and a flame-only oven change.
- Per frame: about 1,850 nodes and 11.5k allocations in round 2 → about 1,300 and 8k now.

## v3.2 — build (addresses code review round 3)

| ID | Change |
| --- | --- |
| C12 / C15 / M7 | Both element LRUs (figures, ovens) and `figureKey` are removed. Quantisers live in `scene/quantise.ts` |
| A6 / M1 | `Person` is placement only (translate, scale, fade). Under it, three memoised parts: `Limbs part="back"` (legs, back arm), `FigureBody` (back hair, torso, outfit, head, face, headwear; drawn at rest, with walk bob applied as a translate around it) and `Limbs part="front"` (front arm, held prop). `FigureBody` takes only look and expression props, so it re-renders on a blink or mood change, not on arm or step. A shared pure `geom()` computes the measurements for each part |
| M1 (timing) | Worker arm work and diners' eating run on a 7.5 Hz `poseClock` (every second frame), so limbs keep identical props across two frames. Walking stays at 15 fps |
| M3 | `OvenBody` (memoised, no flame) plus a small `Flame`. `flameBox()` places it, memoised per oven spec |
| C13 | `'use no memo'` in Storefront, with a comment: it deliberately reads the live store each clock frame |
| C14 | `key={id}` on Storefront, so a shop switch remounts it (clock, taps, rush, pop) and nothing is written during render |
| A7 / T12 / T13 | Deferred: the cast builder still lives in Storefront |

## Code review round 4 — v3.1 → v3.2 — ✅ APPROVED

**Summary:** The structure is right. `FigureBody` holds its memo frame to frame, the bob translate is correct, the flame is isolated, and Storefront is safely opted out of the compiler. A maxed shop is now about 700 nodes and 5.5k allocations per frame, down from about 1,300 and 8k. What's left is waste inside the split.

- C16 [low] Dome ovens: the flame glow now paints over the keystone and plinth. Fix: draw an `OvenFront` after the flame.
- C17 [low] The bob/walking rule is duplicated in `Person` and `geom`. Fix: `bobFor()`.
- C18 [low] `mem.shopId` is redundant since `key={id}`.
- A8 [low] Split `geom()` into `bodyGeom` and `limbGeom`.
- M8 [medium] `Limbs` call `geom()`, which also builds the torso path and the `lookFor` object: about 1,000 allocations per frame. Fix: A8.
- M9 [medium] `Limbs` take the full prop bag (blink, mood, cap…), and back limbs take `arm`. That costs about 120 nodes and 700 allocations per frame. Fix: pass explicit limb props, and give back limbs `arm` only for `pin`.
- M10 [low] Walkers advance about one `quantStep` bucket per frame, so their memo never hits, and wall-clock jitter makes the gait uneven. Fix: accept it, or step an integer frame counter over 6 phases.
- M6 [low] The `items` list is still rebuilt per frame.
- T14 `flameBox` sits inside the window or mouth · T15 hip y vs body `by` per bucket · T12 pose-churn budget (needs A7).
- Fixed: C12, C13, C14, C15, A6, M1, M3, M7, T11 · Still open: A7, M6, T12.

## v3.3 — build (addresses code review round 4)

| ID | Change |
| --- | --- |
| A7 | Pure `buildCast()` in scene/cast.ts returns cast records and driver phases. Storefront maps them to `<Person/>`. The look data and types moved to the pure scene/looks.ts (people.tsx re-exports them) |
| A8 / M8 | `geom()` is split into `bodyGeom()` (FigureBody only) and `limbGeom()` (hip height, hands and stride only, with no `lookFor` or torso path) |
| M9 | `Limbs` take explicit primitive `LimbProps` (kind, act, front, carry, carryWalk, peelK, step, arm, sleeve, pants, skin, tall). `Person` memoises the look per seed (`useMemo`). Back limbs get `arm` only for `pin` |
| M10 | The walk cycle steps one of 8 phases per frame from an integer frame counter (`floor(clock·15)`), so there are no skipped buckets and no gait jitter. Walker limbs still change every frame (accepted) |
| C16 | Dome ovens draw a memoised `DomeFront` (keystone and plinth) after the flame, so the glow stays in the mouth |
| C17 | `bobFor(kind, step)` in quantise.ts is used by both the body translate and `limbGeom` |
| C18 | `mem.shopId` removed |
| T12 | `crowd.test.ts`: worker limb props change on ≤ 55% of consecutive frames at pace 2.6, plus crowd-overlap budgets in screen space |
| T14 / T15 | Deferred: `flameBox` and `limbGeom` live in .tsx files that the node Jest setup can't import |

## Code review round 5 — v3.2 → v3.3 — ✅ APPROVED

**Summary:** v3.3 delivers the round-4 structure: a pure `buildCast` (measured at 6.5 µs per call), primitive `LimbProps` whose memo holds, the body/limb geometry split, a shared `bobFor`, and a memoised `DomeFront`. Per frame it's about 360 nodes and 1.6k allocations (measured cast), against round 4's estimate of about 700 nodes and 5.5k. 54/54 tests pass.

- C19 [medium] The D275 `b0` snap drops a back-row table in some layouts (fp2 plants 1 with 3 cooks; fp3 with 2 staff and 3 cooks; fp4 plants 1 with 1 cook). Fix: snap only when a column still fits; otherwise use `b0raw`. Add T16.
- C20 [medium] The doormat crowd test can't fail, because feet at y −30 fall outside the checked range. Fix: test screen-box overlap with the projected mat polygon (T17).
- C21 [low] The crowd suite takes about 30 s. Fix: cache the frames in `beforeAll`, collect failures and assert once, and use 20 s instead of 40.
- C22 [low] `DomeFront` duplicates the dome geometry, and the plinth now covers the grade-2 woodpile. Fix: add `domeGeom()` and move the woodpile; `OvenHood` should use `isBoxOven`.
- C23 [low] `SEAT` and `Mood` are imported but unused in storefront.tsx.
- A9 [low] Move `flameBox`, `limbGeom` and `domeGeom` into a pure `scene/geometry.ts`. That unblocks T14 and T15.
- M11 [low] The cook's `focus` mood toggles about 3×/s and re-renders `FigureBody`. Fix: drive it from `floor(t / 1.5)`.
- M10 [low] The frame index still comes from the wall clock, so frames duplicate or skip. Fix: have `useClock` return an integer tick, or correct the comment.
- M6 [low] Static `items` are still rebuilt every frame. Fix: `useMemo` them on `[lay, decor, …]`.
- Tests to add: T16 (table count doesn't regress), T17 (doormat screen box), T14/T15 (after A9).
- Fixed: C16, C17, C18, A7, A8, M8, M9, T12 · Still open: M10, M6, T14, T15.

---

## Rounds 5–7 (v3.3 → v3.5), archived verbatim from CODELOG.md

### Current state — round 5 (v3.2 → v3.3): ✅ APPROVED

**Open: address these in v3.4** (none blocks approval)

| ID | Sev | Where | Problem | Proposed fix |
| --- | --- | --- | --- | --- |
| C19 | medium | `scene/layout.ts`, the `b0` snap (D275) | Snapping the back row to the 2·SEAT grid drops a table in some layouts: fp2 (plants 1, 3 cooks) goes 4→3, fp3 (2 staff, 3 cooks) 4→3, fp4 (plants 1, 1 cook) 5→4 | Snap only when a column still fits; otherwise use `b0raw`. Add **T16** |
| C20 | medium | `crowd.test.ts` "nobody stands still on the doormat" | It can't fail: people pause at y −30, outside the y range it checks | Project the mat polygon (−8…−22) to a screen box; no still figure's box may overlap it by > 20%. This is **T17** |
| C21 | low | `crowd.test.ts` | ~30 s of the ~77 s test run | Compute the frames once in `beforeAll`, collect failures and assert once, simulate 20 s |
| C22 | low | `scene/props.tsx` `DomeFront` | Duplicates the dome geometry; the plinth now paints over the grade-2 woodpile; `OvenHood` inlines the box-oven test | Add `domeGeom(o)` and move the woodpile into `DomeFront`; use `isBoxOven` everywhere |
| C23 | low | `storefront.tsx` imports | `SEAT` and `type Mood` are unused | Remove them |
| A9 | low | `flameBox`, `limbGeom` (`.tsx`) | They can't be unit-tested | Move them, with `domeGeom`, to a pure `scene/geometry.ts`. That unblocks **T14** (flame inside its window or mouth) and **T15** (limb hip `by` = body `by − bob`) |
| M10 | low | `scene/cast.ts` walk cycle | The frame index comes from the wall clock, so frames still duplicate or skip | Have `useClock` return an integer tick, or correct the comment |
| M11 | low | `cast.ts` cook mood | `focus` toggles ~3×/s and re-renders `FigureBody` | Drive it from `floor(t / 1.5)` |
| M6 | low | `storefront.tsx` items | Static furniture entries are rebuilt every frame | `useMemo` them on `[lay, decor, prep, boxes, idleShop]`, then concat with the cast |

### v3.4 — build

| Item | Fix |
| --- | --- |
| C19 + T16 | `layout()` snaps the back row only when no column is lost; test sweeps footprints, cooks, staff, ovens and plants. |
| C20 + T17 | The doormat test projects the mat polygon to a screen box and fails if a still figure covers more than 20%; it includes a "can fail" check. |
| C21 | Crowd frames are computed once per (shop, pace) and shared; the full suite runs in about 100 s. The G72 scene test samples every 7th layout (it took 107 s as a full sweep). |
| C23 | Unused `SEAT` and `Mood` imports removed from `storefront.tsx`. |
| A9 + T14/T15 | `scene/geometry.ts` holds `limbGeom`, `bodyBy`, `domeGeom`, `flameBox` and the oven geometry; `geometry.test.ts` checks the flame sits inside its window or mouth and limb hip equals body height minus bob. |
| M11 | Cook `focus` mood is driven by `floor(poseClock / 1.5 + i)`, not a sine at 15 fps. |
| Playtest | New pure modules: `components/cutscene-input.ts` (`canAdvance`, `sceneMayOpen`, `sceneHeading`) and `rate` / `goalAmount` in `engine/format.ts`. Engine: `upgradeLock` drivers, `buildLock` Suburbs + `nonnaPizzasLeft` / `nonnaCountdownText`, `applyOffline` returns `capped` and `awaySeconds`, `bundleHint`. New tests: `components/__tests__/cutscene-input.test.ts`, `engine/__tests__/playtest.test.ts` (existing build test now sets `seenScenes` for the Suburbs lock). |
| Not done (planned) | C22, M6, M10; tap-target resize (v3.6); 90 s story pacing and perks (v3.5). No `SAVE_VERSION` bump this step (no new saved fields). |

### v3.5 — build (round 6 items from the v3.4 review)

| Item | Fix |
| --- | --- |
| K1 | The heading wording ("Act") now matches code and test; the red test was a working-tree change caught mid-edit. |
| C24 | `cutscene-input.ts` moved to `src/engine/`; the store and player import it from there. |
| C25 | `lastKitchenTap` is store state (not saved) and the gate is the pure `pickScene()`; boundary tests added (T19). |
| C26 | `bundleHint` is cached in the engine on levels, decor and fleet (single-entry cache); the hand-built key, `useMemo` and the eslint suppression in `index.tsx` are gone. |
| C27 | The lockout clocks reset in an effect keyed on `scene.id`. |
| C28 | `NONNA_TAKEOVER` lives in `tuning.ts`; the engine no longer imports scene content; a test ties the constant to downtown-4's trigger. |
| C29 | Tests: Drivers lock with and without room to expand, the bundle advisor never buys drivers past the cap. |
| C30 | `OfflinePopup` `capped` and `awaySeconds` are required. |
| M12 (M6) | Static furniture in `storefront.tsx` is built in a `useMemo` on `[lay, id, fp, plants, tableTier, signageTier, dough, boxes, idleShop, vehicle, shopName]`; only the cast is rebuilt per frame. |
| T18–T23 | Added: single-panel heading, scene gate, no-soft-lock for Nonna's takeover, offline cap boundaries, `rate()` thresholds. |
| Not done | C22, M10, M15, A10 (low). Version labels: this fix build is v3.5, so 90 s story pacing and perks are now v3.6 and the tap-target resize v3.7. |

### v3.6 — build (round 7 items from the v3.5 review)

| Item | Fix |
| --- | --- |
| K1 | The furniture memo missed `prep`: a managed shop's prep bench never updated. Fixed by construction: `scene/furniture-inputs.ts` builds one typed object of primitives (`furnitureInputs`) and `buildFurniture(lay, fin)` reads only that; the memo deps are `[lay, ...furnitureDeps(fin)]`, so a forgotten field can't compile. |
| C31 + A11 | `buildFurniture` extracted from the component body (module-level function in `storefront.tsx`). |
| C32 | The decor part of the `bundleHint` cache key is comma-joined. |
| C34 | Gate test asserts `toBeNull()`. |
| T24 | `furniture-inputs.test.ts`: a prep upgrade changes the deps in a managed shop; every drawn upgrade changes them; the tap queue only matters when unmanaged. |
| T25 | `bundleHint` cache equals a fresh computation across upgrades and alternating shops; cash and sales change only `affordable`. |
| Not done | M16 (merge instead of sort per frame), C22, C33, M10, M15, A10: low or medium and accepted. |

---

## Round 8 (v3.6) and the v3.7 build table, archived verbatim from CODELOG.md

### Current state — round 8 (v3.5 → v3.6): ✅ APPROVED

v3.6 fixes the round-7 blocker (the furniture memo missed `prep`, so a managed shop's prep bench never updated): `buildFurniture(lay, fin)` reads only `lay` and one typed object, and the memo deps are `[lay, ...furnitureDeps(fin)]`. The reviewer noted that a hand-listed `furnitureDeps` could still drift; it is now `Object.values(f)` with a length test (C35, T27). `tsc` is clean and `npm test` passes (89 tests, ~100 s). Rounds 6–7 (v3.4, v3.5) were CHANGES REQUESTED and are archived with their build tables.

**Open (none blocks approval)**

| ID | Sev | Where | Problem | Proposed fix |
| --- | --- | --- | --- | --- |
| C37 | low | `storefront.tsx` | The `eslint-disable` on the furniture memo is justified (constant-length deps derived from `fin`); say so in the comment | Reword the comment |
| C38 | low | `backdrop.tsx` | SoldSign and RecipeCard coordinates are magic numbers with no test that they stay inside the cropped window x 99–301 | T28: geometry test |
| A12 | low | `storefront.tsx` | `buildFurniture` still lives in the component file | Move it to `scene/furniture.tsx` |
| M16 | low | `storefront.tsx` items | The items array is spread and sorted every frame | Keep furniture sorted and merge with the cast |
| M19 | low | `storefront.tsx` | One `fin` object and a 12-element deps array per frame (negligible) | None needed |
| C22 | low | `scene/props.tsx` `DomeFront` | Duplicates the dome geometry; `OvenHood` inlines the box-oven test | Use `domeGeom` and `isBoxOven` everywhere |
| C33 | low | `cutscene-player.tsx` | The `[scene.id]` lockout effect is redundant (`_layout.tsx` remounts per scene) | Drop it or comment why |
| M10 | low | `scene/cast.ts` walk cycle | The frame index comes from the wall clock | Have `useClock` return an integer tick |
| M15 | low | `scene/geometry.ts` | `ovenFrame` and friends allocate per oven per frame | Memoise per `(o, grade)` in a WeakMap |
| A10 | low | `app/index.tsx` | Card-detail strings are built inline each render | Extract a pure `stationDetails()` |

**Resolved after the review (same build):** C35 (deps derived from the object, T27) and C36 (redundant `Math.max` in the Drivers lock).

### v3.7 — build (feature step; open lows carried)

| Item | Change |
| --- | --- |
| Save v3 | `SAVE_VERSION = 3`. `GameState.playSeconds` (foreground play), `GameState.sceneAt` (play time each scene was seen), `Shop.perk`. `migrate` defaults them and grants perks for finales a v2 save had already seen. |
| Play time | `G.playTick(s, dt)` = `tick` + play seconds; the store and the pacing sim use it. `applyOffline` keeps using `tick`, so offline time never counts toward pacing (test). |
| Pacing gate | Pure `sceneReady(game, scene, lastSceneEndPlay)` in `engine/cutscene-input.ts`; `pickScene` now takes the first ready pending scene. `STORY_PACING` in `tuning.ts`. The store keeps `lastSceneEndPlay` (session only, null after load or reset). |
| Perks | `PERKS` in `tuning.ts` (one per neighbourhood except Downtown), `perkOf(id, shop)`; applied in `shopRevenue` (walk-in share, price), `decorMult(shop, id)` (decor boost), `upgradeCostOf` drivers (cost), `applyOffline` (offline bonus, also in `byShop`). `Scene.perk` grants it in `markSceneSeen`. The `bundleHint` cache key includes `perk`. |
| Pier 9 bid | `PIER9_BID` ($2.0M after 50,000 Waterfront pizzas), `pier9Available`, `bidPier9`; new trigger kind `'bid'` plays waterfront-4 when the perk is won. Store action `bidPier9`; goal bar candidate first while available. |
| UI | Cut-scene closing card shows the perk (with or without a reward); drawer perk banner; decor header uses the perk's boost. |
| Tests | `story-pacing.test.ts` (19 tests: gate, beat-4 gaps, play time, migration, each perk and its scope, the bid). 111 tests pass. |
| Not done | Open lows from round 8 (C37, C38, A12, M16, M19, C22, C33, M10, M15, A10). |

---

## Rounds 9–13 (v3.7 → v4.1) and build tables v3.8–v4.3, archived from CODELOG.md

### Rounds 10–13 verdicts (summarised; each build table below records the items and their fixes)
- **Round 10 (v3.8): CHANGES REQUESTED.** C44 [high] hitSlop outside a parent never fires on iOS (web ignores hitSlop), so the 44 pt claim was false; C45 the strip's upward slop stole kitchen taps; C46 compact button height; C47–C49 story-gap edge cases and a weak test; M22/M23 per-render allocations.
- **Round 11 (v3.9): APPROVED.** C50 Larger Text in fixed 44 pt buttons; C51 tap-target tests compared constants with themselves; C52 dead `drawer.focus`; C53 offline popup threshold shared with story pacing; C54 load() vs ticks race; C55 logs not rotated; A15 extract the sidewalk row; M24/M25.
- **Round 12 (v4.0): APPROVED.** C56 the separate no-gain component dropped the purchase burst; C57 Larger Text on badge/All; C58 dead code; C59 stacked doc blocks; A16 pure sidewalk model; M26 four gain simulations per tick; M27/M28.
- **Round 13 (v4.1): CHANGES REQUESTED.** C60 [high] the drawer drew locked/maxed cards as no-gain; C61 docs/`soft` tone; C62 Waterfront wall magic offsets; A17 a cached drawer model; M29 throwaway `Animated.Value`s; M30 drawer gain simulations per tick; M31.

### Current state — round 9 (v3.6 → v3.7): ✅ APPROVED

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

### v3.8 — build (round-9 items + tap targets)

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

### v3.9 — build (round-10 items)

| Item | Change |
| --- | --- |
| C44 | `tap-targets.ts` models `roomTop` / `roomBottom` (space the parent owns); the test fails any hitSlop larger than its room (T33). All sidewalk controls are drawn at 44 pt with no margin (T34). The v3.8 claims in the logs were wrong and are superseded by this row. |
| C45 | The station label strip and its 26 pt upward margin are removed; nothing on the row reaches into the scene's tap area. |
| C46 | Compact `BuyButton` has a fixed `height: 44` (`styles.buyOuterCompact` / `buyInnerCompact`); the inner fills it with `flex: 1`. The manager label is short again ("HIRE A MANAGER · +$x/s" on the sub line, price as the label). |
| C47 | `resumeSceneEnd(prev, away, playSeconds)` clamps the kept gap to the reloaded play time (T35). |
| C48 | On resume, `awaySeconds` is measured from the in-memory `lastSavedAt` even if the reload fails; the offline popup threshold uses `STORY_PACING.returnSeconds`. |
| C49 | The Priya scope test asserts both purchases succeed. |
| M22, M23 | `CLOSE_SLOP` is a module constant; compact button styles are in the StyleSheet. |
| A14 (part) | Row geometry lives in `SIDEWALK_ROW` (card inset/height, raise per mode), tested against the button height. |
| Process | New advisory agents `storycritic` and `audiocritic` (`.claude/agents/`), with `STORYLOG.md` and `AUDIOLOG.md`. 125 tests pass. |

### v4.0 — build (round-11 review of v3.9: APPROVED; its items, plus the critic's round 40)

The round-10 (v3.8, CHANGES REQUESTED) and round-11 (v3.9, APPROVED) reviews are archived with the next log rotation, when this loop passes (C55).

| Item | Change |
| --- | --- |
| C50 | Text in the fixed 44 pt buttons caps iOS Larger Text at ×1.15 (`COMPACT_FONT_MAX_SCALE`). |
| C51 + T36 | `STATION_CARD`, `DRAWER_HEAD`, `IDLE_STACK_GAP`, `BUTTON_H` in `tap-targets.ts`; the StyleSheets are built from them and `SIDEWALK_ROW` / Close's room are derived, so the tests describe the real layout. |
| C52 | The drawer state is a boolean; the dead `focus` prop and `cardFocus` style are gone. |
| C53 | `TUNING.offlinePopupSeconds`. |
| A15 | `components/sidewalk-row.tsx` (`SidewalkRow`) owns the row: static station table and icons at module scope (M24). |
| M25 | Compact text styles in the StyleSheet. |
| UI | `BuyButton` tone `nogain` (a separate `NoGainButton`, chosen after all hooks run) and an optional `icon`; `ChalkSign` takes a scale. |
| Not done | C54, T37, T38 and the carried lows. 125 tests pass. |

### v4.1 — build (round-12 review of v4.0: APPROVED; its items, plus the critic's round 41)

| Item | Change |
| --- | --- |
| C56 | `nogain` is a style variant inside `BuyButton`'s single tree (no separate component), so a station flipping to it right after a purchase keeps the burst, the shake and the pressed feedback. |
| A16 + M26 + T39 | `components/sidewalk-model.ts`: `stationModels` (cost, lock, label, tone, bottleneck) cached on a levels key, `stationViews` adds `affordable` and the frame; `SidewalkRow` renders the views and no longer takes a `tied` closure. Tests: dashed vs solid bottleneck, nogain vs locked MAX, the cache reused across cash changes. |
| C57 | Level badge and All text cap Larger Text. |
| C58 | Dead imports, `managerCost` and `shadow` removed from `index.tsx`. |
| C59 | One doc block on `BuyButton`. |
| T40, T41 | Station locks keep "Lv" and the number together; `offlinePopupSeconds` pinned at 60. |
| Layout | `layout()` centres an incomplete top row of stacked oven decks (D321); scene and crowd tests still pass. |
| Not done | C54, T37, T38, M27 and the carried lows. 130 tests pass. |

### v4.2 — build (round-13 review of v4.1: CHANGES REQUESTED)

| Item | Change |
| --- | --- |
| C60 + T42 | `buttonTone({ lock, gain, muted })` in `sidewalk-model.ts` is the one rule: locked → normal, muted → neutral, gain ≤ 0 → nogain. `stationModels`, the drawer `card()` and the Fleet card use it; `StationCard` takes a `tone` (no more `useless`). Tests cover locked/maxed, no-gain, gain and muted. |
| C61 | One doc block on `BuyButton`; the unused `soft` tone and its branches are removed. |
| M29 | `Animated.Value`s in `BuyButton`, the Hud and the offline popup are created once with `useState(() => …)` instead of a throwaway per render. |
| M30 (part) | The drawer card computes its gain once (Expand at a level cap counts as useful). |
| UI | `BuyButton` gains `saving` / `progress` (pale basil face and a progress line for the bottleneck being saved for) and a drawn strike bar for no-gain prices. |
| Not done | A17 (a full cached drawer model), C62/T43 (Waterfront wall geometry), T44, C54, T37, T38, M27, M31 and the carried lows. 133 tests pass. |

### v4.3 — build (round-14 review of v4.2: CHANGES REQUESTED; not re-reviewed, the codecritic is paused)

| Item | Change |
| --- | --- |
| C63 | Decor cards pass `tone={buttonTone({ lock: cost === null, gain, muted: idleShop })}`; `StationCard.tone` is required, so a missing tone can't fall back to green. |
| C64 | `saving` only on framed (managed) station cards. |
| C65 | `stationTone(lock, gain)` for the unmuted sidewalk case. |
| T46 | `StationView.progress` (0–1, only for the bottleneck being saved for, never NaN), tested. |
| M32 (part) | Grade and Expand gains computed once per render. |
| M33 | Cut-scene `Animated.Value`s created once (`useState(() => …)`). |
| Cooks (D306) | `PersonProps.variant` (cook index) drives the neckerchief colour and the second cook's skull cap. |
| Not done | A17 (cached drawer model) with T45, C66 (strike bar on a shrunk iOS label: check on device), M31, M34, C62/T43, T44, C54, T37, T38, M27, carried lows. 134 tests pass. |

---

# Rounds 14–18 and builds v4.7–v5.1 (playtest 2), archived 2026-10-30

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

## v5.1 — build (steps 5 + 6). Range: a0a9bee..HEAD (round 18 on v5.0 still running; its notes go into v5.2)
| Change | Where | Test |
| --- | --- | --- |
| `LINE.departSeconds` 2.0, `handoffSeconds` 1.0, laps 5.0 / 4.6 (D361); departures settle within 1e-9 s (a float boundary paid one frame late) | `pipeline.ts` | G81 carried test; earnings test over 120 s |
| Tutorial model (pure) + saved `tutorial` step + migration; first Downtown batch ×2.5 | `engine/tutorial.ts`, `game.ts`, `game-store.ts` | `tutorial.test.ts` (full scripted run to Marco, first bake ≤ 3 s, story hold, migration) |
| Bake slide, upgrade flash (effect-detected, mem only), oven `hot` | `storefront.tsx`, `props.tsx` | — |
| Walk cycle by time | `cast.ts` | quantise tests |
| Coach card, HUD/sidewalk highlights | `coach-card.tsx`, `game-ui.tsx`, `sidewalk-row.tsx`, `index.tsx` | — |
| Title card (Animated, native driver, loops stopped on unmount), `titleDone` gate in the store | `title-card.tsx`, `_layout.tsx`, `game-store.ts` | screenshot 00 |
| Logo art as data shared by the component and the PNG renderer | `logo-art.ts`, `logo.tsx`, `scripts/render-logo.ts` | — |
| Identity extras: window views, Industrial haze/steel, lighthouse, fuller street props, city pins; no burst on compact buttons | `room.tsx`, `background.tsx`, `identity.ts`, `city-map.tsx`, `game-ui.tsx` | — |

`tsc` clean; 211 tests; screenshots `v5.1`: `errors: []`.

---

## Archived state — round 18 (v5.0): ✅ APPROVED. Not re-run on v5.1 / v5.2 (range a0a9bee..HEAD unreviewed). The loop is STOPPED (Julien, 2026-10-30).

**Open (round 18 + carried)**

| ID | Type | Note |
| --- | --- | --- |
| C84 | medium | Reset `walkInDebt` when walk-ins aren't buying; clamp it on load |
| A22 / M50 | medium | Move the facade drawing out of `room.tsx` into `facade.tsx`; build one path string per pattern instead of many nodes |
| C85 | low | One `G.idleShop` predicate (storefront and crew each derive "idle") |
| C86 | low | Store the `idle` flag per trip/slot so a hire mid-trip doesn't re-route a walking figure |
| C87 | low | `while` → `if` in `dispatch` (only the due carrier can leave) |
| C88 | low | Re-measure the coin target on layout/rotation |
| C89 | low | Compute `since` once per frame |
| A23 | low | Name the magic route numbers in `crew.ts` |
| M51, M52 | low | Small per-frame allocations |
| T61–T65 | test | Tests requested in rounds 17–18 |
| A17 / M32 | carried | Cached drawer-card model; see archive |

---

## Archived state — round 19 (v5.1–v5.3, a0a9bee..320f0e8): ✅ APPROVED. Loop RESUMED 2026-10-30 night. From round 20 the brief adds a **CPU** section (U IDs).
Fixed: C84 (its clamp introduced C90).

| ID | Severity | File:line | Issue | Fix |
|---|---|---|---|---|
| C90 | medium | engine/pipeline.ts:72,193 | Fixed WALK_IN_DEBT_MAX (72) clamp in `dispatch` stops walk-ins once a dispatch carries > 72/(0.5−f) pies | Clamp to max(WALK_IN_DEBT_MAX, 2n) in dispatch; fixed clamp only in migrateLine |
| C91 | low | stations.ts:198, room.tsx:654,743 | `doorwaySignRect` duplicates what room.tsx draws | Draw the plank from `doorwaySignRect(lay)` |
| C92 | low | app/index.tsx:223-235 | Spotlight-target predicate ×3, nested halo ternary | Derive `sceneSpot`/`hudHalo` once |
| C93 | low | game-ui.tsx `halo`; sidewalk-row.tsx `cardCoach` | Halo changes border width → layout jump, coin target re-measure | Transparent reserved border |
| A24 | low | engine/game.ts:531 | FIRST_BATCH_SPEED hidden in lineRates | `firstBatch(shop)` predicate beside TUTORIAL_DONE |
| M53 | low | storefront.tsx:381-410 | Spotlight path strings rebuilt each frame | useMemo hole + scrim d |
| M54 | low | tutorial.ts:49-52 | Step 7 returns a new object each tick | Cached per-target objects |
| M55 | low | storefront.tsx:~206 | `sp` object + 3 rate calls per frame | Compare levels first |
| A22 / M50 | medium | scene/room.tsx | Facade drawing in room.tsx; many nodes per pattern | facade.tsx; one path per pattern |
| C85–C89, A23, M51, M52 | low | see round 18 (archive) | carried | carried |
| T61–T69 | test | — | T66 split at large batches (fails on C90); T67 coachStep same ref; T68 lineRates first-batch rule; T69 tutorialAdvance identity; T61–T65 archive | add |
| A17 / M32 | carried | — | cached drawer-card model | archive |

**Next IDs:** K1, C94, A25, M56, U1, T70.

---

## Archived state — round 20 (v5.4, 3d60f81..c3796b5): ❌ CHANGES REQUESTED (C94 [high]). First round with the CPU section. Fix round v5.5 in progress.
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

