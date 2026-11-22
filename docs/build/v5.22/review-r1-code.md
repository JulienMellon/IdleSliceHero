# v5.22 r1 code review (range 12c99bd..HEAD; v5.22 proper is fd6562a..HEAD)

VERDICT: APPROVED
SUMMARY: The report rewrite (E3 symptoms, U3 bars, U4 capacity cards, S3 shop-state scene, E4 report coach) is well separated: pure engine/model code, real tests (`tutorial-report`, `piles`, `shop-state`, `service`), and save compatibility holds (`service.migrate` resets the slice, `coachDone` is migrated). K5 is fixed. The main cost is the hand-tapped capacity key, which rebuilds the station and drawer caches on almost every tick, plus dead lamp/bundle code left behind.

**K5: FIXED.** `z-order.ts` makes one ordered table and the test pins it. The coach sits at 3, under gift 4, oven 5, SHEETS 6 and offline 7. Every overlay is wrapped in its own absolute `box-none` layer, so a sheet can't fall under the HUD or the scrim. The new report coach is hidden while the offline popup is up (`clear` needs `!covered`, and `covered` includes `offline`).

BLOCKERS: none

ISSUES:
- C178 [low] app/index.tsx:602 `reportCoachLayer: zIndex: Z.offline`. It ties with the offline popup and relies on sibling order, which goes around the "one value per layer" rule the z-order test checks. → Add `Z.reportCoach` between `sheets` and `offline` (renumber), and add it to the order test.
- C179 [low] Dead code from the lamp/bundle removal. `G.tiedStages`, `G.bundleHint`/`BundleHint` (game.ts) have no readers. Neither do `SERVICE.slammedAt/busyAt/steadyAt` or the header comment at service.ts:5. `ReportView.loads/floorRatio/lostPerMinute/perMin` are read only by tests. `coachTargets` (tutorial.ts:88) is exported but storefront.tsx:357 still uses its own step check (C167). → Delete them, or wire `coachTargets` into storefront and close C167.
- C180 [low] tutorial.ts `reportCoachStarts`. It checks `reportActive(s, row.task.shop)`, but the strip it lights belongs to `s.active`. On another shop's tab the scrim waits on a target that isn't there. It also runs `nextTask` before the cheap `!saveOf(s).report` check. → Test `!saveOf(s).report` first and require `s.active === row.task.shop`.

ARCHITECTURE:
- A46 [medium] app/index.tsx:316-328. The screen now runs two coach flows: step-8 `listSeen` (A44) and the report coach, which has a `stripWas` ref effect that relies on child-before-parent effect order (`Sheet`'s `reportOpened` lands before `report-open`). → Move both into `useCoachFlows()` under components/coach, which returns `{ coachView, reportStep, onDone, onReportLook }`. That shrinks index.tsx and makes the order testable. Closes A44.

MEMORY:
- M74 [low] scene/people.tsx:258. Every `Person` now mounts an extra `<G transform={undefined}>` (the ride wrapper), even when it isn't riding. That is about 25-40 extra nodes per frame tree. Idle drivers add 10 Scooter nodes each. → Render the wrapper only when `p.ride`.
- M75 [low] features/service.ts:419-457 `senseShop` builds about 9 objects per active shop per tick (pile, wait, made, mid, before, after, cumulative, hold, the spread). The `shops` map is now always copied (`sameShop` is gone). That is about 50 objects/s per shop: harmless, but it grows with shops. → Cache last tick's `rawOn` in `ShopService` instead of computing `before` again. Return `cur` when no average moved past 1e-6.

CPU:
- U34 [medium] sidewalk-model.ts:122-128 `capacityKey`, and drawer-model.ts:100 which uses it. The key holds `Math.round(capacity)` for each hand-tapped station. `made` is a running average that changes while the player taps and while it decays afterwards, so after the first head a hand-run shop misses both caches on nearly every 200 ms tick. Each miss costs 4×(`reportView` + `capacityAfter`), or about 12 `flowOf` passes on new state objects that miss the flow cache, each running every feature's demand/station hooks. With the drawer open, `buildLevelPart` also reruns, including the `nextTableHint` loop of up to 400 `tablesShown` calls. On top of that, the integer rounding goes stale below 10/min, where `perMinute` shows one decimal. → Cache the level part on `shopLevelKey` alone, with the after/now ratio `rate/nowRate` per station, and scale `made` per render: two multiplies. Drop `capacityKey` from both keys.
- U35 [low] service.ts:310 `reportView`. Its dead `lostPerMinute` calls `valuePerPizza(featureMults(...))`, a full pass over the feature hooks, on every call. It is called from `missedOf` (chaptersTick, per `noMissed` task per tick), `capacityKey` (every row render) and `capacityNow`. → Drop the field (C179), or compute it lazily in the sheet.
- U36 [low] app/index.tsx:317. `reportCoachStep` runs on every GameScreen render (5 Hz). For a save that opened the report on its own, `REPORT_COACH` is never marked, so `nextTask` (two `currentChapter` scans plus `taskProgress`) runs forever. → The C180 reorder fixes this. Also mark `REPORT_COACH` once `report` is true outside a live sequence.

TESTS:
- T130 [U] sidewalk-model: `stationModels` returns the same array across 10 ticks of a hand-tapped shop whose `made` is decaying (after U34).
- T131 [U] z-order: index.tsx's report coach layer uses its own `Z` entry, between sheets and offline (C178).

FIXED SINCE LAST REVIEW: K5, C157 (founder via `firstHood` + `city.founder`), T127 (pacing-sim sets `exitCode` past 1.25× tuned), T128 (chapters.test:239).
STILL OPEN FROM LAST REVIEW: A44, C158, C176, C177, A45, U33, T125, T129, C159, C160, A41, M71, U27, T115, T116, T117, C151, C154, M70, C167 (helper added, not used).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| U34 | medium | U | sidewalk-model.ts:122 capacityKey, drawer-model.ts:100 | Cache level part on shopLevelKey with after/now ratio; scale made per render; drop capacityKey from keys |
| A46 | medium | U | app/index.tsx:316-328 | Extract useCoachFlows (step-8 listSeen + report coach effect) into components/coach; closes A44 |
| A44 | medium | U | app/index.tsx:299-314 | Step-8 seen/free and tasks notes into useCoachFlow and coach-view's seen rule |
| C158 | medium | N | services/purchases-core.ts:6 | Test-namespace LEDGER_KEY with the literal env check; add it to RESET_KEYS |
| C178 | low | U | app/index.tsx:602 reportCoachLayer | Own Z.reportCoach between sheets and offline, not shared Z.offline |
| C179 | low | E | game.ts tiedStages/bundleHint, content/service.ts lamps, ReportView loads/floorRatio/lostPerMinute | Delete dead lamp and bundle code and unused report fields |
| C180 | low | E | tutorial.ts reportCoachStarts | Check saveOf.report first; require s.active equals the task's shop |
| U35 | low | E | features/service.ts:310 reportView | Drop lostPerMinute's featureMults pass on every call |
| U36 | low | E | tutorial.ts reportCoachStep | Stop running nextTask each render once report is opened; mark REPORT_COACH |
| M74 | low | S | scene/people.tsx:258 | Mount the ride wrapper G only when p.ride |
| M75 | low | E | features/service.ts senseShop | Keep last rawOn in ShopService; return cur when nothing moved |
| T130 | low | U | sidewalk-model test | stationModels stable over ticks of a hand-tapped shop with decaying made |
| T131 | low | U | z-order test | Report coach layer has its own Z between sheets and offline |
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
| M70 | low | U | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |
| C167 | low | S | storefront.tsx:357 | Use the exported coachTargets(s) (now in tutorial.ts) instead of the hand-rolled step check |

Next IDs: K6, C181, A47, M76, U37, T132
