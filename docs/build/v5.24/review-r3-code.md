# v5.24 r3 code review

VERDICT: APPROVED
SUMMARY: r3 closes C192 (pack-seen reset moved to the Shop's once-per-opening effect), C205 and C206/T145 (loaded `setsDone` seeded into `flourished` on first loaded frame), and moves the chime and flourish bubble behind pure, tested geometry. One carried medium (U40) remains, under the gate's limit; new findings are low.

BLOCKERS: none

ISSUES:
- C207 [low] storefront.tsx:631 `flourishSeeded` — module flag seeds once per process, so a later `testSetGame` / dev jump / snapshot load replays every set of the new save once. Test build only today → seed keyed on a load generation (e.g. store `loadedAt`/game identity) instead of a boolean, or re-seed in `testSetGame`.
- C208 [low] storefront.tsx:1035 — `flourishBubbleRect(..., menuRect(lay))` recomputed inline each frame of the 3 s flourish; `menuRect(lay)` is already computed in the `pillAvoid` memo (:709) → hoist `const menu = useMemo(() => menuRect(lay), [lay])` and reuse in both.

ARCHITECTURE: none new. set-flourish.ts stays pure (flourishDue/seedPlayed/flourishBubbleRect), good split; chimeSpot keeps geometry in look-art.ts.

MEMORY:
- No new [medium]. Flourish bubble path allocates ~3 small rects per frame only while a flourish is up (3 s). Extra `<G scale>` wrapper around the first Confetti adds 1 node for 3 s. `flourished` Set grows by one key per set completion (bounded by catalog sets × repeats), fine.

CPU:
- No new [medium]. Seeding check is one boolean test per frame after first load; `flourishDue` is O(setsDone) with `SETS.find` per entry (~tens of ops), unchanged from r2. U40 (scene clock running under Shop/City/Scrapbook) still the main idle-cost item.

TESTS:
- T146 [low] storefront wiring: source/unit test that the seed runs before `flourishDue` and is gated on `g.loaded` (a frame before load must not seed an empty list and then replay the loaded save). Current code is correct; nothing pins it.

FIXED SINCE LAST REVIEW: C192, C205, C206, T145
STILL OPEN FROM LAST REVIEW: U40, C203, C199, C200, C201, T140, T141, C187, U38, T136, C178, C179, U37, M75, T130, T131, T132, C176, C177, A45, U33, C159, C160, A41, M71, U27, T115, T117, C151, C154, M70

Notes on checks: C203 still open (setCompleteEvent now only referenced from catalog.test.ts after the set-flourish test dropped it; delete or wire to analytics). U40: app/index.tsx:441 `paused` still lacks `!focused`. T136 still open: the new shop-screen test pins one `resetPacksSeen()` call in the mount effect but not the tab-switch/no-resend behaviour.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C207 | low | S | storefront.tsx:631 flourishSeeded | Seed per load (game identity/load generation), not once per process; testSetGame loads replay sets |
| C208 | low | S | storefront.tsx:1035 menuRect | Memoise menuRect(lay) once; reuse in pillAvoid and flourishBubbleRect |
| T146 | low | S | storefront flourish seed | Seed gated on g.loaded and runs before flourishDue; pre-load frame never seeds empty |
| U40 | medium | U | app/index.tsx:441 paused | Add !focused to the scene's paused prop so the clock stops under Shop/City/Scrapbook |
| C203 | low | E | engine/vanity.ts:47 setCompleteEvent | Delete unused setCompleteEvent/SET_COMPLETE or wire to analytics |
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

Next IDs: K6, C209, A49, M79, U42, T147
