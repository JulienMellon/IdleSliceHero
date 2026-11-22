# v5.23 r2 code review (fa8c5a5..HEAD, src + scripts; r2 fixes b663903..HEAD)

VERDICT: APPROVED
SUMMARY: The r2 round fixes the one new medium (C182: step 16 no longer holds the story, a tap outside the chip ends it, consent gates on `shopTutorialDone`). It also closes most of the r1 lows: dead event, ledger comment, `recordAdGrant` as a store action, the cheap booster key, `loaded()` for the ledger, the ad-window tests. One fix does not do what it says. C186's `pack_card_seen` reset runs from a `useFocusEffect` inside `StoreTab`, and that cleanup also fires on unmount, so every switch between Shop tabs still re-counts the cards.

BLOCKERS: none

ISSUES:
- C188 [low] store/store-tab.tsx:189 `useFocusEffect(() => () => packsSeen.reset())`. `StoreTab` unmounts whenever the Shop leaves tab 2 (shop.tsx `tab === 2 ? <StoreTab/>`). expo-router's useFocusEffect runs the cleanup on unmount as well as on blur (node_modules/expo-router/build/react-navigation/core/useFocusEffect.js:112-115). So the Set is cleared on every tab switch, and `pack_card_seen` still fires 4-5 times per switch (C186 not fixed in effect). The test only covers the pure `createSeenOnce`. → Move the reset to the Shop screen: call `packsSeen.reset()` (export a `resetPacksSeen`) in shop.tsx's once-per-opening effect beside `STORE_OPENED_EVENT`, or in its own `useFocusEffect`.
- C189 [low] store/use-purchase.ts:28 `void purchases.loaded().then(...)` has no `.catch`. If `kv.get` rejects (AsyncStorage error), every Store tab mount raises an unhandled promise rejection: a red box in dev, a silent one in release. `loaded` also caches the rejected promise. → Add `.catch(() => {})`. In purchases-core `load`, catch to `emptyLedger()` so `loaded()` always resolves.
- C190 [low] app/shop.tsx:142 `shortToStore = nudgeToStore`. A tap on a booster the player can't afford sends `store_opened {from:'nudge'}` and clears the nudge flag, so the funnel mixes two entry points. → Give it its own `from: 'booster'` (add it to `StoreFrom`/`storeFrom`), or a separate callback that does not touch `setNudge`.
- C191 [low] engine/tutorial.ts:183 `store-skip`. Any tap outside the chip ends the intro for good. A veteran's first tap after the update is very likely the oven out of habit, so most players will never see the intro. This is fine as a "polite offer", but it is a product choice. → Optional: let the first outside tap nudge as before and the second skip, or show "tap anywhere to skip" in the card text. Then record the choice in DECISIONS.
- C183 [low, narrowed] components/storefront.tsx:712 `coachRuns` still compares with `TUTORIAL_DONE`. The scene's rect reporter keeps running through 16-17, when the only target is the HUD chip. Cost is small (scroll-event only). → `coachRuns.current = game.tutorial >= 1 && !shopTutorialDone(game)`. The `_layout.tsx` half is fixed.

ARCHITECTURE:
- A46/A44 [medium, carried] app/index.tsx:299-315. Unchanged: step-8 `listSeen` plus the tasks-note effect, and the report-coach effect, still live in the screen. With `useCoachFlow` now also spreading `{...view, onSkip}`, the screen does a second spread for step 8. → One `useCoachFlows` hook in components/coach that returns the final overlay props.
- `coach-view.ts` re-exports `STORE_STEP`/`STARTER_STEP` from the engine, and diamond-chip-model imports `STORE_INTRO_START` and `starterOwned`. One source now, so A47 is closed.

MEMORY:
- No new retained state that grows. `lastBooster` is one small object in the shop-flags store and the saved key. `packsSeen` is a module Set of at most 5 ids. `onSkip` is a stable `useCallback`, so `CoachOverlay`'s memo still holds (the spread passes primitives plus stable callbacks).
- booster-buy.tsx (M76 fixed): the selector builds one roughly 40-char string per store set. The section rebuilds at most once every 5 s of play, or when the diamonds or slot change. That is down from about 15 objects per tick.
- rewards-model.ts:375 `boostSummary` builds two small arrays and spreads them on each HUD refresh. It is negligible (2 arrays per tick), and it can be a plain `Math.min` of two numbers if you are in the file anyway. Not tracked.

CPU:
- U39 fixed. `boosterKey` is about 2 µs per set: one `paidBoostLeft`, one `rewardsUnlocked`, one template. Nothing new runs on the 15 fps scene path. `productRows` gains one `toLocaleString` per pack, but it runs only when the store's answers change, not per tick.
- U38 (director `listenToShop`) is unchanged and still open, [low].

TESTS:
- T136 shop screen (or store-tab render test): open Store tab, switch to Style, back to Store. `pack_card_seen` is tracked once per card. After the Shop blurs and refocuses it is tracked again (would have caught C188).
- T133 is mostly closed by the new tutorial tests. The consent half (`shopTutorialDone` at 16) has no direct test. Add one line to tutorial.test: `shopTutorialDone({tutorial: 15}) === false`, and `true` at 16 and 18.

FIXED SINCE LAST REVIEW: C182, C184, C185, A47, A48, M76, U39, T134, T135, T133 (story half).
STILL OPEN FROM LAST REVIEW: A46, A44, C183 (storefront half), C186 (via C188), C187, U38, C178, C179, U37, M75, T130, T131, T132, C176, C177, A45, U33, T125, T129, C159, C160, A41, M71, U27, T115, T117, C151, C154, M70.

Gate: blockers 0, high 0, medium 2 (A46, A44): APPROVED.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| A46 | medium | U | app/index.tsx:299-315 | Extract useCoachFlows (step-8 listSeen, tasks note, report coach effect) into components/coach; closes A44 |
| A44 | medium | U | app/index.tsx:299-315 | Step-8 seen/free and tasks notes into useCoachFlow and coach-view's seen rule |
| C188 | low | N | store/store-tab.tsx:189 | useFocusEffect cleanup fires on tab unmount; reset packsSeen from shop.tsx's once-per-opening effect instead (C186) |
| C189 | low | N | store/use-purchase.ts:28, purchases-core load | Catch loaded() rejection; load falls back to emptyLedger so loaded always resolves |
| C190 | low | U | app/shop.tsx:142 shortToStore | Own from:'booster' and no setNudge, not the nudge callback |
| C191 | low | E | engine/tutorial.ts:183 store-skip | Optional: first outside tap nudges, second skips, or say "tap to skip"; log in DECISIONS |
| C183 | low | S | storefront.tsx:712 coachRuns | Use !shopTutorialDone(game) instead of < TUTORIAL_DONE |
| C187 | low | N | services/grants.ts:85 redeem | Pre-v5.23 ledgers lack first: keys; note in VERSION.md if any IAP build shipped |
| U38 | low | A | audio/director.ts:251 listenToShop | Share per-second reportView cache; gate on game screen focus |
| T136 | low | N | store-tab / shop-screen test | Tab switch does not re-send pack_card_seen; Shop refocus does |
| T133 | low | E | tutorial test | shopTutorialDone false at 15, true at 16 and 18 |
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

Next IDs: K6, C192, A49, M77, U40, T137
