# v5.23b r1 code review

Range: the task gave `688f26f..HEAD`, but `688f26f` is not an object in this repo. I reviewed `85202bd..HEAD` instead (the merge after "v5.23 closed", the parent of the first v5.23b commit, up to 1c6dbce), paths `src scripts`: 52 files, +1491/-181. tsc and the full suite passed at this commit, per the orchestrator.

```
VERDICT: CHANGES REQUESTED
SUMMARY: The cleanup waves are mostly tidy: protected.ts with its scene test, the rival placed through rivalPlace, STRIP_WORDS, the pile caps and the walk-out spot are pure and tested. Two new mediums go on top of the three carried ones (five in all, so the gate fails): the D547 glow never animates on device, and an unmanaged shop's strip now sits under the order chip.
BLOCKERS: none
ISSUES:
- C194 [medium] app/index.tsx:467-471, report-model.ts STRIP.top. In an unmanaged shop the strip's pill now runs from 16 to 44 pt below the scene area's top. OrderChip is drawn after it at ORDER_VIEW.top 6 with height 68 (6 to 74 pt), and the order is global (chipPhase reads s.order), so any offer or active order covers the strip and takes its taps. The golden pizza lane (BONUS_VIEW.laneTop 8) also crosses it when no chip is up. → When chipPhase(game) !== 'none', place the idle strip at ORDER_VIEW.top + ORDER_VIEW.height + 6, and move bonusTop below the strip. Or add the order chip and bonus lane as covers in sceneCovers/stripRect so the Q8 test sees them (T139).
- C195 [medium] layers/rival/rival-scene.tsx:106 and 430. `useClock(15, closedAt === null)` is paused unless the shutters are running. Nothing else re-renders RivalScene: it is memo'd, and its selectors only change on footprint or open. So `rivalGlowLevel(glowEnd - Date.now())` is worked out once, at elapsed 0 (0.65), and then the glow cuts off at 2 s. The breathing pulse and the 500 ms fade never play. → `useClock(15, closedAt === null && glowEnd === null)`, which only ticks for the 2 s of glow (T138).
- C196 [low] store/game-store.ts:189, report-model.ts:245-250. The payoff now gates on a session Set. `saveOf(game).missedZero` is still written (so a save write and a store set happen once per shop per session), but nothing reads it, and the store comment still says "plays once, ever". Nothing calls resetMissedZeroSeen or resetRivalGlow outside tests, despite their "a new save / a franchise" comments. → Fix the comment and drop the write (or keep it, but document it as analytics only). Call both resets in the store's newGame/franchise path, or delete those claims.
- C197 [low] storefront.tsx:712. publishProtected's reader spreads `coachIn.current!`. Before the first render assigns it, the probe getter throws inside protectedRects (lay is undefined). The `a ? … : []` null path in protected.ts:991 is dead. → `() => coachIn.current ? { ...coachIn.current, scrollX: …, origin: … } : null`.
- C198 [low] scene/protected.ts:882-887. ProtectedId is declared, but Named.id is `string`, so a typo in a protected or cover id goes unchecked. → `id: ProtectedId | CoverId`, or delete the unused type.
ARCHITECTURE:
- A46 [medium] carried (useCoachFlows; closes A44). index.tsx:33-39 still holds listSeen.
- A44 [medium] carried (folded into A46).
- A45 [low] carried.
MEMORY:
- No new findings of weight. report-strip.tsx:751 keeps a flash Animated.View mounted at opacity 0 (one node, native driver): fine. rivalPlace/sceneFit allocate two small objects per RivalScene render, and that only renders during shutters or glow.
- M75, M71, M70 [low] carried.
CPU:
- No new hot-path cost. pileCount now takes a symptom flag: three short filter arrays per scene frame, as before. With C195's fix the rival ticks at 15 fps for 2 s per Go tap, which is negligible. ReportStrip's 10 s hold timer is only armed while Missed is 0 and the payoff has not played yet.
- U38, U37, U33, U27 [low] carried.
TESTS:
- T138 RivalScene with jest fake timers: emitRivalGlow(shop), advance 350 ms and then 1700 ms, and assert that the glow Rect's opacity differs from its value at 0 and is gone after 2000 ms.
- T139 Geometry: for an unmanaged shop on all three SCREENS, stripRect does not overlap the order chip's band (ORDER_VIEW.top to top+height, in scene units) while an order is up. Also cover the bonus lane.
- Carried: T136, T137, T130, T131, T132, T125, T129, T115, T117.
FIXED SINCE LAST REVIEW: n/a. None of the carried rows' code was changed in this range; storefront.tsx:719 (C183), overlay.tsx:83 (C193), index.tsx:608 (C178), shop-ui.tsx tab (C176) and city-model.ts pin (C177) were touched nearby but not fixed.
STILL OPEN FROM LAST REVIEW: C192, A46, A44, C193, C183, C187, U38, T136, T137, C178, C179, U37, M75, T130, T131, T132, C176, C177, A45, U33, T125, T129, C159, C160, A41, M71, U27, T115, T117, C151, C154, M70
```

Gate count: blockers 0, highs 0, mediums 5 (C194, C195, C192, A46, A44). CHANGES REQUESTED.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C194 | medium | U | app/index.tsx:467-471 idle strip | Idle strip at top 16 sits under OrderChip (6-74) and bonus lane; place it below the chip when chipPhase is not none |
| C195 | medium | U | layers/rival/rival-scene.tsx:106 | Clock paused while glowing: useClock(15, closedAt === null && glowEnd === null) so pulse and fade play |
| C192 | medium | N | store/store-tab.tsx:193 blur listener | Export resetPacksSeen; call it in shop.tsx:132 once-per-opening effect; drop the tab-owned blur listener (C188 regression) |
| A46 | medium | U | app/index.tsx:299-315 | Extract useCoachFlows (step-8 listSeen, tasks note, report coach effect) into components/coach; closes A44 |
| A44 | medium | U | app/index.tsx:299-315 | Step-8 seen/free and tasks notes into useCoachFlow and coach-view's seen rule |
| C196 | low | U | game-store.ts:189, report-model.ts:245 | Save missedZero is write-only, comment stale; call resetMissedZeroSeen/resetRivalGlow on new save or drop claims |
| C197 | low | S | storefront.tsx:712 publishProtected | Return null when coachIn.current is unset instead of spreading a non-null assertion |
| C198 | low | S | scene/protected.ts:882 | Type Named.id as ProtectedId or cover id union; delete unused type otherwise |
| T138 | low | U | rival-scene test | Fake timers: glow opacity changes over 2 s and ends at 2000 ms |
| T139 | low | U | strip geometry test | Idle strip rect clear of order chip band and bonus lane on all screens |
| C193 | low | U | coach/overlay.tsx:83 lastOutside | Reset lastOutside when skippable/text changes, or key the overlay by step at index.tsx:562 |
| C183 | low | S | storefront.tsx:719 coachRuns | Use !shopTutorialDone(game) instead of < TUTORIAL_DONE |
| C187 | low | N | services/grants.ts:85 redeem | Pre-v5.23 ledgers lack first: keys; note in VERSION.md if any IAP build shipped |
| U38 | low | A | audio/director.ts:251 listenToShop | Share per-second reportView cache; gate on game screen focus |
| T136 | low | N | store-tab / shop-screen test | Tab switch does not re-send pack_card_seen; Shop close and reopen does |
| T137 | low | U | overlay test | Step-15 outside tap then step 16 within 6 s: first step-16 tap nudges, not skips |
| C178 | low | U | app/index.tsx:608 reportCoachLayer | Own Z.reportCoach between sheets and offline, not shared Z.offline |
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
| C160 | low | N | dev/jumps.ts:9, game-store.ts:55 | One TEST_SAVE_KEY in dev/test-mode.ts, imported by the store |
| A41 | low | U | dev/jumps-section.tsx:14, story-save-section.tsx:30 | One dev/host.ts; set via testSetGame |
| M71 | low | N | dev/jumps.ts:27 | 126 KB snapshots resident; split per city if it grows |
| U27 | low | U | dev/story-save-section.tsx:72 | nextBeatReason off the per-set selector; compute on open and after actions |
| T115 | low | N | scripts/check-no-test-mode.sh | Also grep normal bundles for test-cheats-v1 and a snapshot string |
| T117 | low | N | dev/jumps.ts:53 rebase | Every wall stamp in every snapshot row is shifted |
| C151 | low | U | slots.tsx:144 | Night-oven a11y label from nightOvenLines.name, not a hard-coded "Nonna's" |
| C154 | low | E | features/layers/*.ts hoodOf | Null instead of '' sentinel; early-out in each tick and hook |
| M70 | low | S | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |

Next IDs: K6, C199, A49, M77, U40, T140
