# v5.24 r2 code review (codecritic)

Range: 04b0abf..HEAD (r2 delta reviewed: 9c0d049..2d1a01b). tsc and the full suite passed at this commit (given).

```
VERDICT: APPROVED
SUMMARY: C202 is fixed. The flourish now starts on the first frame its shop can be seen (not paused, route focused), keyed on the session start instead of a 3 s window. Its words are worked out once, and the r1 memory and CPU minors (M77, M78, U41, C204) are closed. Two carried mediums remain (U40, C192) and there is no high, so this passes the gate.
BLOCKERS:
- none
ISSUES:
- C192 [medium] (carried) store/store-tab.tsx:195 still owns the blur listener. resetPacksSeen is exported (line 60) but nothing calls it → call it from shop.tsx's once-per-opening effect and delete the tab's blur listener.
- C206 [low] storefront.tsx:180 SESSION_START = gameNow() at module load. In the test build the clock offset starts at 0 again each launch, so a setsDone entry stamped under an earlier forward jump is newer than SESSION_START and replays once per launch → seed `flourished` with the loaded save's setsDone keys on hydrate/load instead of using a time cut-off (normal build unaffected).
- C205 [low] endgame/shop-model.ts:217 has an orphan doc comment ("The tag on a look the player owns.") above WORN_CHIP's comment → move it onto OWNED_TAG.
- C203 [low] (part fixed) set-flourish.ts now imports the engine SetDone. setCompleteEvent/SET_COMPLETE (engine/vanity.ts:47-57) are still used only by a test → wire them to analytics or delete them.
ARCHITECTURE:
- none new. The gating reads navigation.isFocused() inside the render-time tick block (storefront.tsx:632). It is correct only because a re-render follows focus (the clock running, or the paused prop changing). Once U40 lands, the paused prop change covers it.
MEMORY:
- M77 closed: NO_DRESS carries awningFounder:false, deps are plain Object.values, and they are built once per render (finDeps).
- New nodes: the flourish adds a second Confetti and SetCrest (about 8 paths/circles), mounted only for its 3 s. Crest scale and opacity are rounded, so the memo holds most frames. No concern.
CPU:
- U40 [medium] (carried) app/index.tsx:441 paused still lacks !focused. The 15 fps scene keeps ticking under Shop/City/Scrapbook. It also matters to C202: while unfocused, the flourish check now runs every frame and does nothing.
- flourishDue now checks hood, then age, then builds the key (M78 closed). hoodOfSet does one SETS.find per setsDone entry per frame. That is under 20 entries, so it is negligible.
TESTS:
- T142 covered by set-flourish.test (pure: no age limit, key spent, own shop only).
- T143, T144 covered (catalog.test founder-vs-set; furniture-inputs constant length).
- T145 storefront/set-flourish: a save loaded with setsDone entries stamped after the process start does not replay (pins C206).
FIXED SINCE LAST REVIEW: C202, C204, M77, M78, U41, T142, T143, T144
STILL OPEN FROM LAST REVIEW: U40, C192, C203 (part), C199, C200, C201, T140, T141, C187, U38, T136, C178, C179, U37, M75, T130, T131, T132, C176, C177, A45, U33, C159, C160, A41, M71, U27, T115, T117, C151, C154, M70
```

Gate count: blocker 0, high 0, medium 2 (C192, U40), so APPROVED.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| U40 | medium | U | app/index.tsx:441 paused | Add !focused to the scene's paused prop so the clock stops under Shop/City/Scrapbook |
| C192 | medium | N | store/store-tab.tsx:195 blur listener | Call exported resetPacksSeen in shop.tsx once-per-opening effect; drop the tab-owned blur listener (C188 regression) |
| C206 | low | S | storefront.tsx:180 SESSION_START | Seed flourished with loaded save's setsDone keys on load instead of module-load time cut-off |
| C205 | low | U | endgame/shop-model.ts:217 | Move orphan "tag on a look" doc comment onto OWNED_TAG |
| C203 | low | E | engine/vanity.ts:47 setCompleteEvent | Delete unused setCompleteEvent/SET_COMPLETE or wire to analytics |
| T145 | low | S | set-flourish / storefront test | Loaded save with setsDone stamped after process start does not replay a flourish |
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

Next IDs: K6, C207, A49, M79, U42, T146
