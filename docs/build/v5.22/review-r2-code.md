# v5.22 r2 code review (range 12c99bd..HEAD; r2 delta is 5fa1f2e..HEAD)

VERDICT: APPROVED
SUMMARY: The r2 delta is small and clean. U34 is fixed properly: a hand-tapped shop no longer misses the station and drawer caches every tick. The two r1 coach-flow CPU notes (C180, U36) and M74 are also fixed. Three mediums remain (A46, A44, C158), which is exactly the gate limit, so there is no slack for the next round.

**K5: FIXED, and it holds at HEAD.** `z-order.ts` is the one ordered table (hud 2 < coach 3 < gift 4 < nightOven 5 < sheets 6 < offline 7 < coins 8), and `z-order.test.ts` checks the order, uniqueness and that `index.tsx` references every entry. Every overlay in `app/index.tsx` is its own absolute `box-none` layer. The r2 changes don't touch the layering. The new report-coach layer shares `Z.offline` (C178, low), but the coach is hidden while the offline popup is up (`clear` needs `!covered`), so the tie can't show.

BLOCKERS: none

ISSUES:
- C178 [low] app/index.tsx:602 `reportCoachLayer: zIndex: Z.offline` still ties with the offline layer. Add `Z.reportCoach` between sheets and offline and test it (T131).
- C179 [low] Dead code is still there: `G.tiedStages`, `G.bundleHint` (read only by tests, game.ts:902, :1544) and `SERVICE.slammedAt/busyAt/steadyAt` (content/service.ts:21). `lostPerMinute`, `floorRatio` and `loads` are gone from non-test code, so that half is done. Delete the rest, and the tests that pin them.
- C181 [low] sidewalk-model.ts `machineCaps` is one module-level slot keyed on `shopLevelKey(s, id)`. That key includes the id, so it is correct. With two shops on screen alternately (city map, tab switch) it thrashes, but it recomputes only on a tab change. Fine as is; note it if the city view ever calls `stationCap` per shop.

ARCHITECTURE:
- A46 [medium] app/index.tsx:316-328. The report-coach flow (`reportCoachStep`, `stripWas` ref effect, `reportLive`, `onReportLook`) still sits in the screen next to the step-8 `listSeen` state. `stripWas` still depends on child-before-parent effect order. Move both flows into `useCoachFlows()` in components/coach.
- A44 [medium] app/index.tsx:299-314. Step-8 `listSeen` and the tasks-open/closed notes are still in the screen, not in `useCoachFlow`. Fold them into the same hook as A46; one card closes both.

MEMORY:
- M75 [low] features/service.ts `senseShop` is unchanged: about 9 objects per active shop per tick (`mid`, `before`, `after`, `hold`, the spreads). Keep last tick's `rawOn` in `ShopService` and return `cur` when nothing moved.
- M74 is FIXED (people.tsx:287 mounts the ride wrapper only when `p.ride`).

CPU:
- U34 is FIXED. `machineCaps` caches the machine numbers (now, and after with `made` zeroed) on `shopLevelKey`; `stationCap` scales by `now * m.after / m.now` per render, which is two multiplies plus one `reportView`. `drawerKey` no longer carries `capacityKey`. `drawerCards` redoes only the kitchen and grade lines when `tapsByHand`.
- U37 [low] drawer-model.ts `gradeLine`. While a hand-tapped shop's drawer is open, each 200 ms render still runs one `capacityAfter(game, id, 'grade')`, which is two `flowOf` passes on a new state object. That is small, and only while the drawer is open. Cache the grade's after/now ratio in the level part (as `machineCaps` does) and scale it per render.
- U35 FIXED: `lostPerMinute` is gone. U36 and C180 FIXED: `reportCoachStarts` now tests `saveOf(s).report` and the done mark first, then `coachMode`, and only then `nextTask`. It also requires `s.active === row.task.shop`.

TESTS:
- T130 [U] sidewalk-model: `stationModels` is the same array over ticks of a hand-tapped shop with decaying `made`. Not found in the test file; still wanted (the drawer-model side is covered).
- T131 [U] z-order: the report coach layer has its own Z (with C178).
- T132 [U] sidewalk-model: `stationCap` for a hand-tapped station equals `now * after/now` of the machine numbers, and a re-render with changed `made` does not recompute `machineCaps` (spy on `flowOf`).

FIXED SINCE LAST REVIEW: U34, U35, U36, C180, M74. K5 stays fixed.
STILL OPEN FROM LAST REVIEW: A46, A44, C158, C178, C179 (partly), M75, T130, T131, C176, C177, A45, U33, T125, T129, C159, C160, A41, M71, U27, T115, T116, T117, C151, C154, M70, C167 (`coachTargets` is now used by storefront.tsx:357, so C167 is FIXED; drop it).

Gate count: mediums = A46, A44, C158 = 3, no high, no blocker: APPROVED at the limit.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| A46 | medium | U | app/index.tsx:316-328 | Extract useCoachFlows (step-8 listSeen + report coach effect) into components/coach; closes A44 |
| A44 | medium | U | app/index.tsx:299-314 | Step-8 seen/free and tasks notes into useCoachFlow and coach-view's seen rule |
| C158 | medium | N | services/purchases-core.ts:6 | Test-namespace LEDGER_KEY with the literal env check; add it to RESET_KEYS |
| C178 | low | U | app/index.tsx:602 reportCoachLayer | Own Z.reportCoach between sheets and offline, not shared Z.offline |
| C179 | low | E | game.ts tiedStages/bundleHint, content/service.ts slammedAt/busyAt/steadyAt | Delete dead bundle code and unused service thresholds, and their tests |
| U37 | low | U | drawer-model.ts gradeLine | Cache grade after/now ratio in the level part; scale per render, no capacityAfter per tick |
| M75 | low | E | features/service.ts senseShop | Keep last rawOn in ShopService; return cur when nothing moved |
| T130 | low | U | sidewalk-model test | stationModels stable over ticks of a hand-tapped shop with decaying made |
| T131 | low | U | z-order test | Report coach layer has its own Z between sheets and offline |
| T132 | low | U | sidewalk-model test | stationCap scales machine numbers by made; machineCaps not recomputed when only made changes |
| C176 | low | U | shop-ui.tsx:87-102 | Chapter-held shop tab is a Pressable opening the Story tab, like the City row |
| C177 | low | U | city-model.ts:57, city.tsx:63 | Pin text via copy key chapter.pin; CityMap passes its LotView instead of re-running lotView |
| A45 | low | E | game.ts buildLock, city-model.ts:51 | Export buildLockReason with kind; lotView switches on it, no copied takeover test |
| U33 | low | E | chapters.ts:305 buildChapter | Optional: cache by city, seen count, built count if it shows in a profile |
| T125 | low | U | coach-view test | Step 8 after relaunch with list closed never strands the player |
| T129 | low | U | coach-view test | No coach view while the offline popup or a sheet is up |
| C159 | low | N | dev/cheat-prefs.ts:8 | Import setTestBuyAnswer from @/services with a native no-op, not purchases.web by file name |
| C160 | low | N | dev/jumps.ts:9, game-store.ts:53 | One TEST_SAVE_KEY in dev/test-mode.ts, imported by the store |
| A41 | low | U | dev/jumps-section.tsx:14, story-save-section.tsx:30 | One dev/host.ts; set via testSetGame |
| M71 | low | N | dev/jumps.ts:27 | 126 KB snapshots resident; split per city if it grows |
| U27 | low | U | dev/story-save-section.tsx:72 | nextBeatReason off the per-set selector; compute on open and after actions |
| T115 | low | N | scripts/check-no-test-mode.sh | Also grep normal bundles for test-cheats-v1 and a snapshot string |
| T116 | low | N | services ledger test | Test-mode ledger key differs and reset clears it |
| T117 | low | N | dev/jumps.ts:53 rebase | Every wall stamp in every snapshot row is shifted |
| C151 | low | U | slots.tsx:145 | Night-oven a11y label from nightOvenLines.name, not a hard-coded "Nonna's" |
| C154 | low | E | features/layers/*.ts hoodOf | Null instead of '' sentinel; early-out in each tick and hook |
| M70 | low | S | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |

Next IDs: K6, C182, A47, M76, U38, T133
