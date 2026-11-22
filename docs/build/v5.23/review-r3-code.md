# v5.23 r3 code re-check

Range reviewed: fa8c5a5..HEAD, with the r3 fixes read hunk by hunk (83f43ce..HEAD: 17 files, +106/-32). tsc and the full suite passed at this commit, per the orchestrator.

```
VERDICT: APPROVED
SUMMARY: The r3 round closes C189, C190, C191 and T133 cleanly, each with a test, and adds the D569 rate-claim rule to productRows with tests. The C188 fix has its own regression: the reset now lives on a 'blur' listener that the Store tab owns, so the pack-card count no longer resets reliably for each opening (C192). That is one new medium on top of the two carried mediums, which is three in all, so the gate is still met.
BLOCKERS: none
ISSUES:
- C192 [medium] store/store-tab.tsx:191-193. The listener `navigation.addListener('blur', () => packsSeen.reset())` is registered inside StoreTab, and `packsSeen` is module-level (line 58). (1) Open the Shop on the Store tab, switch to Style (StoreTab unmounts and drops the listener), then close the Shop: nothing resets, so the next opening sends no pack_card_seen. (2) Even if the player closes the Shop while still on the Store tab, the route is removed and StoreTab's passive-effect cleanup runs before the navigator's useFocusEvents sends 'blur' to the gone route, so the reset can be skipped there too. useFocusEffect's unmount cleanup did fire in that case. → Do what C188 asked: call `packsSeen.reset()` (export it as `resetPacksSeen`) from shop.tsx's once-per-opening effect at shop.tsx:132, next to STORE_OPENED_EVENT, and delete the blur listener. Tab switches then keep the count, and every opening starts fresh. Covered by T136.
- C193 [low] coach/overlay.tsx:83 lastOutside. index.tsx:562 keeps one CoachOverlay instance (no key) across steps. Step 15 is a `tap` step, so a stray tap there, followed by step 16 coming up within 6 s, lets a single tap skip the Store intro. → Reset `lastOutside.current = null` in an effect on `[skippable, text]`, or key the overlay by step id at index.tsx:562.
- Nit (no ID): the regex at tutorial.test.ts:346, `/skippable && tap\.skip/`, is a source-text test. outsideTap is already unit-tested, so this line only pins formatting. It can go once T137 exists.
ARCHITECTURE:
- A46 [medium] carried. app/index.tsx coach effects into a useCoachFlows hook (closes A44).
- A44 [medium] carried (folded into A46).
- The other carried lows (A45, A41) are unchanged.
MEMORY:
- No new findings. outsideTap allocates one small object per tap, which is negligible. The productRows change computes starterBestRate once instead of once per starter row, so it is neutral or slightly cheaper.
- M75, M71, M70 [low] carried.
CPU:
- No new hot-path work. The r3 changes are all event handlers or memoised (productRows is still under useMemo on prices/owned/amounts/firstUsed/adCount/income/looksLeft).
- U38, U37, U33, U27 [low] carried.
TESTS:
- T136 (still open, now the regression test for C192): render the Shop on the Store tab, switch to Style and back, and check that pack_card_seen is not re-sent; close and reopen the Shop and check that it is re-sent once per card.
- T137: overlay. Step 15 tap followed by step 16 within 6 s: the first outside tap on step 16 nudges and does not skip (C193).
FIXED SINCE LAST REVIEW: C189 (catch in use-purchase plus the emptyLedger fallback in load, tested), C190 (shortToStore has its own from:'booster' and leaves the nudge alone, and storeFrom accepts 'booster', tested), C191 (the second outside tap skips, via outsideTap/SKIP_TAP, unit-tested, and the 209 fixture checks both taps), T133 (16, 17 and TUTORIAL_DONE asserted). C188 was attempted, and the attempt is superseded by C192.
STILL OPEN FROM LAST REVIEW: A46, A44, C183, C187, U38, T136, C178, C179, U37, M75, T130, T131, T132, C176, C177, A45, U33, T125, T129, C159, C160, A41, M71, U27, T115, T117, C151, C154, M70
```

Gate count: blockers 0, highs 0, mediums 3 (A46, A44, C192). APPROVED.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C192 | medium | N | store/store-tab.tsx:193 blur listener | Export resetPacksSeen; call it in shop.tsx:132 once-per-opening effect; drop the tab-owned blur listener (C188 regression) |
| A46 | medium | U | app/index.tsx:299-315 | Extract useCoachFlows (step-8 listSeen, tasks note, report coach effect) into components/coach; closes A44 |
| A44 | medium | U | app/index.tsx:299-315 | Step-8 seen/free and tasks notes into useCoachFlow and coach-view's seen rule |
| C193 | low | U | coach/overlay.tsx:83 lastOutside | Reset lastOutside when skippable/text changes, or key the overlay by step at index.tsx:562 |
| C183 | low | S | storefront.tsx:712 coachRuns | Use !shopTutorialDone(game) instead of < TUTORIAL_DONE |
| C187 | low | N | services/grants.ts:85 redeem | Pre-v5.23 ledgers lack first: keys; note in VERSION.md if any IAP build shipped |
| U38 | low | A | audio/director.ts:251 listenToShop | Share per-second reportView cache; gate on game screen focus |
| T136 | low | N | store-tab / shop-screen test | Tab switch does not re-send pack_card_seen; Shop close and reopen does |
| T137 | low | U | overlay test | Step-15 outside tap then step 16 within 6 s: first step-16 tap nudges, not skips |
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
| C160 | low | N | dev/jumps.ts:9, game-store.ts:55 | One TEST_SAVE_KEY in dev/test-mode.ts, imported by the store |
| A41 | low | U | dev/jumps-section.tsx:14, story-save-section.tsx:30 | One dev/host.ts; set via testSetGame |
| M71 | low | N | dev/jumps.ts:27 | 126 KB snapshots resident; split per city if it grows |
| U27 | low | U | dev/story-save-section.tsx:72 | nextBeatReason off the per-set selector; compute on open and after actions |
| T115 | low | N | scripts/check-no-test-mode.sh | Also grep normal bundles for test-cheats-v1 and a snapshot string |
| T117 | low | N | dev/jumps.ts:53 rebase | Every wall stamp in every snapshot row is shifted |
| C151 | low | U | slots.tsx:144 | Night-oven a11y label from nightOvenLines.name, not a hard-coded "Nonna's" |
| C154 | low | E | features/layers/*.ts hoodOf | Null instead of '' sentinel; early-out in each tick and hook |
| M70 | low | S | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |

Next IDs: K6, C194, A49, M77, U40, T138
