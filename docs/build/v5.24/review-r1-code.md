# v5.24 r1 code review (04b0abf..HEAD)

VERDICT: CHANGES REQUESTED
SUMMARY: The catalog, the save v10 migration, the tiered `buyCosmetic`, `dressFor` and the Vanity tab's model are clean, pure and well tested, and the new art is memoised in the furniture and figure bodies. The set-complete flourish, the build's showpiece, will almost never be seen on a device: the scene keeps running under the Shop route and uses up the 3 s window while the player is still looking at the Vanity tab.

BLOCKERS: none

ISSUES:
- C202 [high] `storefront.tsx:611` + `set-flourish.ts:38 flourishDue` (LATE_MS 3 s). A set can only be finished on the Shop screen, which is a stack route. The game screen stays mounted under it and is not paused (`app/index.tsx:441`: `paused` leaves out `!focused`). So the Storefront keeps rendering at 15 fps: within 3 s it finds the entry, adds it to `flourished` and plays the cheer, confetti and line under the Shop screen. If the player stays longer than 3 s, the age check drops it. If the set belongs to another shop, it never plays. Fixture 231 hides this because it seeds `at = T0+500` and opens the scene directly. → Start the flourish on the first visible frame (unpaused and focused) of the set's own shop, for any entry not yet played that was stamped this session (`at` ≥ module load time). The 3 s then count from that frame. Pass `!focused` into `paused` (see U40).
- C203 [low] `engine/game.ts:214 SetDone` is redeclared in `scene/set-flourish.ts:19`. `vanity.ts:47 SET_COMPLETE` and `setCompleteEvent` have no caller outside tests. → Import the engine type. Delete the event, or wire it to analytics.
- C204 [low] `app/shop.tsx:102` the `wardrobe` selector runs `seenScenes.filter(endsWith('-hire')).join` on every store set (5 Hz) while the Shop is open. → Use a count of hire scenes (`filter(...).length`), or a version key the store bumps when a scene is seen.
- C192 [medium] carried (store-tab blur listener, not touched).

ARCHITECTURE:
- none new. `storefront.tsx` grows again (bubble priority chain at :721 is now 5 deep); extract `bubbleOwner(...)` pure helper when next touched (no ID).

MEMORY:
- M77 [low] `furniture-inputs.ts:83 furnitureDeps` runs twice per frame. Each call does a rest spread (an object of about 30 keys), `Object.values` and an array spread. With the `[lay, ...]` spreads that is about 6 arrays and 2 objects per frame per shop, all to work around `awningFounder` being absent. → Put `awningFounder: false` in `NO_DRESS` so the key is always present, go back to `Object.values(f)`, and call it once per render (`const deps = furnitureDeps(fin)`).
- M78 [low] `flourishDue` builds a `flourishKey` template string for every completed set on every frame (up to 6 strings per frame per shop, forever after the sets are done). → Test `hoodOfSet` and age first, and build the key only for a candidate.
- `flourished` (module Set) is bounded by one entry per completion. Apron overlays add about 6 to 9 nodes per crew member, inside the memoised `FigureBody`. Both fine.

CPU:
- U40 [medium] `app/index.tsx:441` the scene clock (15 fps, the whole Storefront tree) keeps running while the Shop, City or Scrapbook route covers the game screen. `focused` is already tracked at :181 but feeds only `hold`. That is a full JS render 15 times a second under a static screen, for as long as the player browses the 42 looks. → `paused={covered || drawerOpen || tasksOpen || giftOpen || !focused}`. This also fixes the cause of C202.
- U41 [low] `storefront.tsx:722` calls `setSpeaker` (`cityHolding` plus `hoodIds`) and `t()` every frame during the 3 s flourish. → Compute the line once when the flourish starts and keep it in `m.flourish`.

TESTS:
- T142 `flourishDue` / storefront: an entry stamped while the scene is paused or not focused still plays on the first visible frame, once, and only in its own shop.
- T143 `dressFor`: in Downtown, worn `awning-founder` + `awning-classic` draws only the classic awning, and worn `storefront-skin-3` + `facade-classic` draws only the theme. In Suburbs, both generic looks show.
- T144 `furnitureDeps` keeps the same length when `awning-founder` is worn or taken off (covers the M77 refactor).

FIXED SINCE LAST REVIEW: n/a (no open item touched; store-tab.tsx and grants.ts changed only for the new pack)
STILL OPEN FROM LAST REVIEW: C192, C199, C200, C201, T140, T141, C187, U38, T136, C178, C179, U37, M75, T130, T131, T132, C176, C177, A45, U33, C159, C160, A41, M71, U27, T115, T117, C151, C154, M70

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C202 | high | S | storefront.tsx:611, set-flourish.ts flourishDue | Start flourish on first visible frame of its shop for unplayed this-session entries; drop the 3 s purchase window |
| U40 | medium | U | app/index.tsx:441 paused | Add !focused to the scene's paused prop so the clock stops under Shop/City/Scrapbook |
| C192 | medium | N | store/store-tab.tsx:193 blur listener | Export resetPacksSeen; call it in shop.tsx once-per-opening effect; drop the tab-owned blur listener (C188 regression) |
| C203 | low | S | set-flourish.ts:19 SetDone, engine/vanity.ts:47 | Import engine SetDone; delete unused setCompleteEvent/SET_COMPLETE or wire to analytics |
| C204 | low | U | app/shop.tsx:102 wardrobe selector | Hire-scene count instead of filter+join of seenScenes on every store set |
| M77 | low | S | scene/furniture-inputs.ts:83 furnitureDeps | awningFounder false in NO_DRESS; plain Object.values; compute deps once per render |
| M78 | low | S | scene/set-flourish.ts:38 flourishDue | Check hood and age before building the flourishKey string |
| U41 | low | S | storefront.tsx:722 fText | Resolve speaker and line once at flourish start; store in m.flourish |
| T142 | low | S | set-flourish / storefront test | Entry stamped while paused or unfocused plays once on first visible frame, own shop only |
| T143 | low | E | engine vanity test dressFor | Set piece beats founder awning and numbered skin in its shop; generic looks elsewhere |
| T144 | low | S | furniture-inputs test | furnitureDeps length unchanged when awning-founder is worn or removed |
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

Next IDs: K6, C205, A49, M79, U42, T145
