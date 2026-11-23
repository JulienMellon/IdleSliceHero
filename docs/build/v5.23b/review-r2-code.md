# v5.23b r2 code review (85202bd..HEAD, r2 delta 5f02b2c..HEAD)

VERDICT: APPROVED
SUMMARY: r2 fixes C194, C195, C197, C198, C183 and C193, and moves the step-8 and report-coach notes into use-coach-flow (closes A44 and A46). One medium is left (C192, store-tab blur listener, not touched), plus lows. That is inside the gate.

BLOCKERS:
- none

ISSUES:
- C199 [low] report-model.ts:268 resetMissedZeroSeen. C196 was half fixed. The comment now says the save flag is write-only, but it also says "a new save should call it too ... not wired". A new game in the same session never replays the payoff. Either call it from game-store newGame/load, or remove the sentence so it stops reading as a TODO. Closes C196.
- C200 [low] rewards-model.ts:400 markNext. nextTask runs chapterTasks over the whole chapter again on every storyView, on top of the visibleTasks pass, roughly doubling the per-second Story-tab cost. Also, if nextTask picks a task that visibleTasks hides, no row is flagged. Pass the computed rows in, or compute the pick from `tasks`.
- C201 [low] report-model.ts:261 imports sidewalk-model and content/hooks, and scene/protected.ts now imports report-model. The model now depends on the presentation layer. No cycle today. Keep idleStripTop/bonusLaneTop beside STRIP, and have callers pass `idle` in rather than stripModel calling hireOnSidewalk.

ARCHITECTURE:
- none new. A44/A46 are closed: tasksOpen notes, SEEN_FREE [8, 13] and useReportCoachNotes live in components/coach.

MEMORY:
- No new churn. MegaShop adds 2 nodes (Ellipse, side Path). It is memoised on `shut`, so the `d` template rebuilds only during the shutter animation. The rival clock now runs only while closing or glowing (2 s), then stops again.
- Carried: M75, M71, M70 (low).

CPU:
- stripModel adds one hireOnSidewalk call per tick, which is O(1). The shallow-compared `idle` is stable, so it causes no extra repaint.
- The C195 fix is correct. useClock(fps, paused) is paused when there is neither a shutter nor a glow, so the idle cost is unchanged and the glow now repaints at 15 fps for 2 s.
- Carried: U38, U37, U33, U27 (low).

TESTS:
- T140 [low] overlay-model.test "C193, T137" only feeds outsideTap(null) by hand, so it never exercises the reset effect in overlay.tsx. Extract a pure `outsideState(prevKey, key, last)`, or test the overlay with react-test-renderer: change idKey, and the first outside tap must not skip.
- T141 [low] rival-glow.test checks rival-scene.tsx's source text with a regex for the useClock call. Any reformat breaks it. Replace it with a fake-timer render test or a pure `rivalClockRuns(closedAt, glowEnd)` helper.

FIXED SINCE LAST REVIEW: C194, C195, C197, C198, C183, C193, A44, A46, T125, T129, T137 (weak, see T140), T138 (weak, see T141), T139, C196 (partly, superseded by C199)
STILL OPEN FROM LAST REVIEW: C192, C187, U38, T136, C178, C179, U37, M75, T130, T131, T132, C176, C177, A45, U33, C159, C160, A41, M71, U27, T115, T117, C151, C154, M70

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C192 | medium | N | store/store-tab.tsx:193 blur listener | Export resetPacksSeen; call it in shop.tsx once-per-opening effect; drop the tab-owned blur listener (C188 regression) |
| C199 | low | U | report-model.ts:268 resetMissedZeroSeen | Wire it into newGame/load, or delete the "should call it too" sentence (closes C196) |
| C200 | low | U | rewards-model.ts:400 markNext | Derive the goal-bar pick from the built rows; no second chapterTasks pass per storyView |
| C201 | low | U | report-model.ts:261 imports | stripModel takes idle from caller; model stops importing sidewalk-model |
| T140 | low | U | coach/overlay.tsx reset effect | Test the real reset: change idKey, then the first outside tap must not skip |
| T141 | low | U | rival-glow.test source regex | Replace the regex with a pure rivalClockRuns helper or a fake-timer render test |
| C187 | low | N | services/grants.ts:85 redeem | Pre-v5.23 ledgers lack first: keys; note in VERSION.md if any IAP build shipped |
| U38 | low | A | audio/director.ts:251 listenToShop | Share per-second reportView cache; gate on game screen focus |
| T136 | low | N | store-tab / shop-screen test | Tab switch does not re-send pack_card_seen; Shop close and reopen does |
| C178 | low | U | app/index.tsx reportCoachLayer | Own Z.reportCoach between sheets and offline, not shared Z.offline |
| C179 | low | E | game.ts tiedStages/bundleHint, content/service.ts thresholds | Delete dead bundle code and unused service thresholds, and their tests |
| U37 | low | U | drawer-model.ts gradeLine | Cache grade after/now ratio in the level part; no capacityAfter per tick |
| M75 | low | E | features/service.ts senseShop | Keep last rawOn in ShopService; return cur when nothing moved |
| T130 | low | U | sidewalk-model test | stationModels stable over ticks of a hand-tapped shop with decaying made |
| T131 | low | U | z-order test | Report coach layer has its own Z between sheets and offline |
| T132 | low | U | sidewalk-model test | stationCap scales machine numbers by made; machineCaps not recomputed when only made changes |
| C176 | low | U | shop-ui.tsx:87-102 | Chapter-held shop tab is a Pressable opening the Story tab, like the City row |
| C177 | low | U | city-model.ts:57, city.tsx:63 | Pin text via copy key chapter.pin; CityMap passes its LotView |
| A45 | low | E | game.ts buildLock, city-model.ts:51 | Export buildLockReason with kind; lotView switches on it |
| U33 | low | E | chapters.ts:305 buildChapter | Optional: cache by city, seen count, built count if it shows in a profile |
| C159 | low | N | dev/cheat-prefs.ts:8 | Import setTestBuyAnswer from @/services with a native no-op |
| C160 | low | N | dev/jumps.ts:9, game-store.ts:55 | One TEST_SAVE_KEY in dev/test-mode.ts, imported by the store |
| A41 | low | U | dev/jumps-section.tsx:14, story-save-section.tsx:30 | One dev/host.ts; set via testSetGame |
| M71 | low | N | dev/jumps.ts:27 | 126 KB snapshots resident; split per city if it grows |
| U27 | low | U | dev/story-save-section.tsx:72 | nextBeatReason off the per-set selector; compute on open and after actions |
| T115 | low | N | scripts/check-no-test-mode.sh | Also grep normal bundles for test-cheats-v1 and a snapshot string |
| T117 | low | N | dev/jumps.ts:53 rebase | Every wall stamp in every snapshot row is shifted |
| C151 | low | U | slots.tsx:144 | Night-oven a11y label from nightOvenLines.name, not hard-coded "Nonna's" |
| C154 | low | E | features/layers/*.ts hoodOf | Null instead of '' sentinel; early-out in each tick and hook |
| M70 | low | S | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |

Next IDs: K6, C202, A49, M77, U40, T142
