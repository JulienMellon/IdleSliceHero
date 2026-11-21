# v5.21 r3 code review (range 12c99bd..HEAD; new since r2: 13b20e5..HEAD)

VERDICT: CHANGES REQUESTED
SUMMARY: The E1b build gate is sound: `buildChapter` is pure, Boston-safe, keeps owned shops, cannot deadlock (every `build(h)` task's chapter comes after its gate), and is well tested; the r2 U-lane fixes (C173, C174, C175, U32, T126) all landed. One regression ships: the r3 coach layer now sits at zIndex 3, above the offline popup and every sheet, so a tap-mode tutorial step can hide the Collect button behind its scrim.

BLOCKERS:
- K5 [src/app/index.tsx:579-583, :598 `coachLayer`] The overlay was first in the stack and below the calendar, the oven sheet, SHEETS, `OfflinePopup` and `CoinLayer` (the comment at :577 still says so). With `zIndex: 3` it now sits above all of them, and none of them sets a zIndex. `coachView` does not check `offline` (`coachView()` in coach/coach-view.ts:30 checks only isFirst and drawerOpen). A manual shop still earns offline from pies in flight (`offlineTick`, game.ts:1346 `advanceLine`). So a player who leaves at step 10 or 12 (`tap` mode, game.ts tutorial DEFS) comes back to a popup whose Collect button is covered by the scrim pieces. A tap in the hole lands on the popup's backdrop, not on the target, so the only way out is to force-quit. Fix: render the layer only when `coachView && !offline && !giftOpen && !ovenOpen` (or pass `covered` into `CoachScreen` and return null there). Alternatively, wrap the calendar, sheets, popup and coins in one `absoluteFill` view at `zIndex: 4`. Fix the :577 comment as well.

ISSUES:
- C176 [low] [src/components/shop-ui.tsx:87-102] Since E1b, the held shop tab ("+ Waterfront / Chapter 6") is the build button the player sees most, but it is a plain `View`. Only the City row and pin open the Story tab. → For `lot.kind === 'chapter'`, make it a `Pressable` that calls the screen's open-tasks-on-'story' handler. It is the same screen, so it needs no route.
- C177 [low] [src/components/city-model.ts:57] The pin `Chapter ${n}` is hard-coded English, while the row uses `t('chapter.buildLocked')`. → Add the copy key `chapter.pin` (`Chapter {n}`). [src/app/city.tsx:63-67] The map's onPress rebuilds `lotView` with `NEIGHBORHOODS.find(...)!`. → Have `CityMap` pass the `LotView` it already computed (city-map.tsx:206) along with the id.

ARCHITECTURE:
- A44 [medium] (carried) The step-8 seen/free rule and the tasks-open/closed notes are still in app/index.tsx:299-314. Move them into `useCoachFlow` and coach-view's seen rule.
- A45 [low] [city-model.ts:51-53] `lotView` works out again which branch of `buildLock` fired. It copies the takeover test (`neighbourhoods[1]` and the takeover scene not seen) and calls `buildChapter` a second time. → In game.ts, export `buildLockReason(s, id): { kind: 'other' | 'built' | 'prev' | 'founder' | 'chapter'; text: string; chapter?: Chapter } | null`, make `buildLock` return `reason?.text ?? null`, and have `lotView` switch on `kind`.

MEMORY:
- No new findings. The coach wrapper adds 1 view, and only while a step shows. `flashToast`'s timer is left to run (it lives 2.2 s and closes over one number). That is fine.
- M71 and M70 are carried unchanged.

CPU:
- U33 [low] [src/engine/chapters.ts:305 `buildChapter`] Each call does one `filter` over about 24 chapters, a `slice`, and `seenScenes.includes` inside `some`. That is about 300 comparisons and 2 small arrays. `lotView` triggers it twice, plus `chapterNumber`'s `indexOf`. `lotView` runs for the held shop tab on every render of the main screen at 5 Hz, and for every City row and pin. That is under 0.05 ms per tick, so this is optional. If it ever shows in a profile, cache the result by `(city, seenScenes.length, built count)`, as audio/director.ts:162 already does.
- U27 is carried.

TESTS:
- T127 [scripts/pacing-sim.ts] The card's EAGER check only prints `longestBeatWait`. → Set `process.exitCode = 1` when `eagerWait.min > 1.5 * tunedWait.min` (or a named limit).
- T128 [chapters.test] No deadlock: for every chapter with a `build(h)` task, once that chapter is current, `buildChapter(s, h)` is null and `buildLock` is null with enough cash.
- T129 [coach-view test] K5 regression: with an offline popup or a sheet up, `coachView` is null. Alternatively, a render test that checks the coach layer is not mounted while `offline` is set.
- T125 is carried: step 8 after a relaunch with the list closed.

FIXED SINCE LAST REVIEW: C173 (`chapterDiamonds` drives both `payChapter` and the row; 0 for the free chapter), C174 (a build Go opens /city), C175 (`flashToast` owns its timer), U32 (WeakMap scene-id set), T126 (the row's diamonds equal what `markSceneSeen` pays, for every chapter).
STILL OPEN FROM LAST REVIEW: A44, T125, C158, C159, C160, A41, M71, U27, T115, T116, T117, C151, C154, C157, M70, C167 (nothing in this range touched them).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| K5 | blocker | U | app/index.tsx:579-598 coachLayer | zIndex 3 lifts coach above OfflinePopup/sheets; hide coach while offline/gift/oven open, or lift those to zIndex 4 |
| A44 | medium | U | app/index.tsx:299-314 | Step-8 seen/free and tasks notes into useCoachFlow and coach-view's seen rule |
| C158 | medium | N | services/purchases-core.ts:6 | Test-namespace LEDGER_KEY with the literal env check; add it to RESET_KEYS |
| C176 | low | U | shop-ui.tsx:87-102 | Chapter-held shop tab is a Pressable opening the Story tab, like the City row |
| C177 | low | U | city-model.ts:57, city.tsx:63 | Pin text via copy key chapter.pin; CityMap passes its LotView instead of re-running lotView |
| A45 | low | E | game.ts buildLock, city-model.ts:51 | Export buildLockReason with kind; lotView switches on it, no copied takeover test |
| U33 | low | E | chapters.ts:305 buildChapter | Optional: cache by city, seen count, built count if it shows in a profile |
| T125 | low | U | coach-view test | Step 8 after relaunch with list closed never strands the player |
| T127 | low | E | scripts/pacing-sim.ts | Fail the run when EAGER's longest beat wait exceeds a named multiple of tuned |
| T128 | low | E | chapters.test | Every build(h) task's chapter, once current, has buildChapter(s,h) null |
| T129 | low | U | coach-view test | No coach view while the offline popup or a sheet is up (K5) |
| C159 | low | N | dev/cheat-prefs.ts:8 | Import setTestBuyAnswer from @/services with a native no-op, not purchases.web by file name |
| C160 | low | N | dev/jumps.ts:9, game-store.ts:53 | One TEST_SAVE_KEY in dev/test-mode.ts, imported by the store |
| A41 | low | U | dev/jumps-section.tsx:14, story-save-section.tsx:30 | One dev/host.ts; set via testSetGame |
| M71 | low | N | dev/jumps.ts:27 | 126 KB snapshots resident; split per city if it grows |
| U27 | low | U | dev/story-save-section.tsx:72 | nextBeatReason off the per-set selector; compute on open and after actions |
| T115 | low | N | scripts/check-no-test-mode.sh | Also grep normal bundles for test-cheats-v1 and a snapshot string |
| T116 | low | N | services ledger test | Test-mode ledger key differs and reset clears it |
| T117 | low | N | dev/jumps.ts:53 rebase | Every wall stamp in every snapshot row is shifted |
| C151 | low | U | slots.tsx:146 | Night-oven a11y label from nightOvenLines.name, not a hard-coded "Nonna's" |
| C154 | low | E | features/layers/*.ts hoodOf | Null instead of '' sentinel; early-out in each tick and hook |
| C157 | low | U | report/report-strip.tsx:24 | Founder portrait from firstHood(city) and city.founder, not 'downtown' |
| M70 | low | U | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |
| C167 | low | S | storefront.tsx:357 | Use an exported coachTargets(s) built on current(); drop the hand-rolled tutorial-range and step-index check |

Next IDs: K6, C178, A46, M74, U34, T130
