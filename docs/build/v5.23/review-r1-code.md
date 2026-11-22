# v5.23 r1 code review (fa8c5a5..HEAD, src + scripts)

VERDICT: APPROVED
SUMMARY: The diamond boosters (one capped paid slot), first-buy 2× in the ledger, the test ledger key and the Store intro are pure, migrated (SAVE_VERSION 9, `paidUntil` clamped) and tested. I found no blocker. The one new medium is a design risk: step 16 is a hard `tap` gate for every veteran save, and it holds both the story and ad consent until the Store has been visited.

BLOCKERS: none

ISSUES:
- C182 [medium] engine/tutorial.ts:51 (step 16 `mode: 'tap'`), tutorial.ts:178 `tutorialHoldsStory`, game.ts:680 migrate. Every save that finished the tutorial (and every managed first shop) lands on step 16 after the update. Tap-mode blockers then cover the whole screen except the Store chip. Story scenes are held through 16 and 17, and `_layout.tsx:73` starts ad consent only at `TUTORIAL_DONE` (now 18). So a player must open the Store and leave it before the story or rewarded ads come back. Nothing strands the player (the chip is always shown from 16 on), but a monetisation screen is forced on every existing player. → Make 16 a `look` step with a dismiss, or end it after `LOOK_FALLBACK_MS`. Stop holding the story at 16 (hold only at 17, while the Shop is open). Gate consent on the shop steps (`tutorial >= STORE_INTRO_START`).
- C183 [low] app/_layout.tsx:73, components/storefront.tsx:712. Both still compare to `TUTORIAL_DONE`, which moved from 16 to 18. Consent and the coach reporter (`reporter.report()` on scroll) now also run or wait through the Store intro. → Add `shopTutorialDone(g)` (`>= STORE_INTRO_START`) in engine/tutorial.ts and use it for both.
- C184 [low] services/purchases-core.ts:6-9. The comment says the normal bundle "folds the test key away", but `TEST_LEDGER_KEY` is exported and used by `ledgerKey()`, so the string ships in the normal bundle anyway. This is harmless. → Fix the comment, or inline the literal in the ternary only. Then T115 can grep for it.
- C185 [low] engine/paid-boost.ts:10 `BOOSTER_BOUGHT_EVENT` is dead (the store uses `EVENTS.boosterBought`). → Delete it.
- C186 [low] store/store-tab.tsx:52 `usePrices` is now unused. store-tab.tsx:86 sends `pack_card_seen` once per card each time the Store tab mounts (4-5 events per tab switch). → Delete `usePrices`. Send the event once per Shop opening (a Set per mount of the Shop).
- C187 [low] services/grants.ts:85 `redeem`. A ledger from before v5.23 has `tx:` keys but no `first:` key, and a `tx:` key does not name its product. So someone who already bought a pack gets 2× on their next buy. This is fine if no build with IAP has shipped; otherwise write it down in VERSION.md.

ARCHITECTURE:
- A47 [low] The Store intro's step numbers and "owns the Starter" rule are written out four times: `coach-view.ts:12-14` (literals 16/17), `diamond-chip-model.ts:10` (16) and `:24` (a second `starterOwned` with the literal `'awning-founder'`), `game.ts:342,345`, plus `FOUNDER_COSMETIC` and `FOUNDER_ID`. → Keep one source: `G.STORE_INTRO_START`, `tutorial.STARTER_STEP`, `G.starterOwned` built on `FOUNDER_COSMETIC`. coach-view and diamond-chip-model import them.
- A48 [low] components/store/ad-count.ts writes `useGame` prefs and AsyncStorage directly, a second copy of the store's private `setPrefs` (game-store.ts:313). → Add a `recordAdGrant` store action that calls `setPrefs(withAdGrant(...))`, and delete ad-count.ts.

MEMORY:
- M76 [low] endgame/booster-buy.tsx:67. While the Boosters tab is open, every store `set` (5 Hz tick or more) builds 3 card objects, 3 `money()` strings, 3 regex fills and a ~700 B JSON string, then parses it back once the key changes. That is about 15 short-lived objects per tick: harmless, but it is churn on the tick path. → See U39.
- No leaks found: `adGrants` is capped at 200 stamps and a 7-day window, `ShopEars` holds 5 fields, the shop-flags store has a single read, and the target refs unregister on unmount.

CPU:
- U38 [low] audio/director.ts:251 `listenToShop`. Every store set costs a `Date.now()` and a comparison. Once a second it runs `reportView` (flowOf + effectOf, about 0.1 ms), repeating the per-second `reportView` that storefront.tsx:323 already does. It also runs on the Shop and City screens, so dings play there. → Share one per-second report cache (keyed on shop and the `lastSavedAt` second) in features/service, or gate on the game screen having focus.
- U39 [low] booster-buy.tsx:67. The selector does the whole `boosterSection` and a stringify per set (about 20-40 µs). → Select a cheap key instead (`floor(diamonds)|paidUntil|minute|rewardsUnlocked|round(rewardIncome)`) and build the section in `useMemo`.
- Per frame: no change to the 15 fps scene. The DiamondChip's 4 selectors are booleans or strings.

TESTS:
- T133 tutorial: from step 16, the story is not held once the step's look or dismiss has ended (after C182). The consent gate opens at `STORE_INTRO_START`.
- T134 store-model: `withAdGrant` drops stamps older than 7 days, keeps 200 at most, and `adCount7` counts a future stamp exactly once.
- T135 purchases-core: `firstBuysUsed()` before `start()` resolves. Either it is empty and use-purchase reads it again after start, or the card must not show "First buy: 2×" until the ledger has loaded.

FIXED SINCE LAST REVIEW: C158 (TEST_LEDGER_KEY, in RESET_KEYS), T116 (ledger key and reset test).
STILL OPEN FROM LAST REVIEW: A46, A44, C178, C179, U37, M75, T130, T131, T132, C176, C177, A45, U33, T125, T129, C159, C160, A41, M71, U27, T115, T117, C151, C154, M70.

Gate: blockers 0, high 0, medium 3 (A46, A44, C182): APPROVED.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C182 | medium | E | tutorial.ts:51,178; game.ts:680 | Step 16 a dismissable look; don't hold story at 16; consent gates on STORE_INTRO_START |
| A46 | medium | U | app/index.tsx:316-328 | Extract useCoachFlows (step-8 listSeen + report coach effect) into components/coach; closes A44 |
| A44 | medium | U | app/index.tsx:299-314 | Step-8 seen/free and tasks notes into useCoachFlow and coach-view's seen rule |
| C183 | low | U | _layout.tsx:73, storefront.tsx:712 | Use shopTutorialDone (>= STORE_INTRO_START) instead of TUTORIAL_DONE for consent and coach reporter |
| C184 | low | N | services/purchases-core.ts:6-9 | Comment is wrong: test key ships; inline literal in the env ternary or fix comment |
| C185 | low | E | engine/paid-boost.ts:10 | Delete dead BOOSTER_BOUGHT_EVENT |
| C186 | low | N | store/store-tab.tsx:52,86 | Delete unused usePrices; pack_card_seen once per Shop opening, not per tab mount |
| C187 | low | N | services/grants.ts:85 redeem | Pre-v5.23 ledgers lack first: keys; note in VERSION.md if any IAP build shipped |
| A47 | low | U | coach-view.ts:12, diamond-chip-model.ts:10,24 | Import STORE_INTRO_START, STARTER_STEP, G.starterOwned (on FOUNDER_COSMETIC); no literal 16/17/awning |
| A48 | low | N | store/ad-count.ts | recordAdGrant as a game-store action via setPrefs; delete ad-count.ts |
| M76 | low | U | endgame/booster-buy.tsx:67 | Per-set section build and JSON round trip; fixed by U39 |
| U38 | low | A | audio/director.ts:251 listenToShop | Share per-second reportView cache; gate on game screen focus |
| U39 | low | U | endgame/booster-buy.tsx:67 | Cheap primitive selector key; build boosterSection in useMemo |
| T133 | low | E | tutorial test | Step 16 never holds story after its look; consent opens at STORE_INTRO_START |
| T134 | low | N | store-model test | withAdGrant window and 200 cap; adCount7 future stamp |
| T135 | low | N | purchases-core test | firstBuysUsed before start resolves; card refreshes after ledger load |
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

Next IDs: K6, C188, A49, M77, U40, T136
