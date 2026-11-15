# v5.16 r1 code review (f83d281..HEAD; engine, store, content types/tuning, sim2)

VERDICT: CHANGES REQUESTED
SUMMARY: The six layers, the service feature and Todd's story are clean pure modules with good test coverage. But the rival challenge skips the beat-4 finale wait in the app, so the app paces faster than the sim the tuning was fitted on. A reload can also silently eat a manager's hire scene.

BLOCKERS: none.

ISSUES:
- C120 [high] bug: `rival.ts:rivalView` / `startRivalChallenge`, `game.ts:1193 challengeOffered`. Only `scripts/review/sim2.ts:218` checks `challengeOffered`. `sceneReady` lets 'challenge' scenes through at once, so the 300 s (Downtown 60 s) wait after beat 3 is never applied in the app. Checked: Suburbs built and managed, suburbs-3 seen 10 s earlier gives `challengeOffered=false`, `phase='available'`, `startRivalChallenge.ok=true`. The E2b refit (all 18 stars at day 11.7) assumed the wait. → Move `challengeOffered` into rival.ts, add a `'waiting'` phase (with `waitIn`) to `rivalView`, and make `startRivalChallenge` refuse until the wait is over. Then the sim and the UI read the same gate (T92).
- C121 [medium] bug: `game.ts:1220 migrateStory` runs on every load and marks `<hood>-hire` as seen for any managed shop. A v6 player who hires a manager and closes the app before the hire scene plays never sees it. This happens easily: the scene queues behind a main beat, the kitchen-tap pause or the title card. Checked: a v6 save with Suburbs managed and the hire scene unseen loads with `suburbs-hire` seen. → Apply the manager rule only when the raw `saveVersion < 6` (the prerequisite chain can stay idempotent) (T93).
- C122 [low] `teaser.ts:74`: the bid ratio uses `PIER9_BID.cost`, but the live auction charges up to 1.5× (`pier9Price`). The bar reads full while the bid is still out of reach. → Use `pier9Price(s)`.
- C123 [low] `uptown-stars.ts:ingredientsPrice` uses `shopEarnings`, which includes stars, the service tip, the rival and events. `waterfront-boats.ts:rackPrice` uses `shopRevenue` with no features. So the Ingredients price halves under 3 stars and moves with the tip, although the comment says "no boost". → Add one helper (`layerPriceIncome(g, hood)` = `shopRevenue` with no fx) and use it for both.
- Carried: C116 and C117 [medium]. C117 matters more now: there are 12 registered features, and any engine test that skips `import '../engine/features'` runs the game with no layers at all. C118 [low] also matters more: `earningsPerSecond` now swings with the Industrial night (×2), the tip and the rival, so income-scaled task targets move with them. C107 [low].

ARCHITECTURE:
- A32 [medium] `features/types.ts` has no station-rate hook. University (slower prep) and Industrial (a jammed oven) fake their capacity limits as a cap on `shopDemandMult`. As a result, `service.flowOf` sees "wanted" drop during a jam: the report shows less lost cash and a quieter floor than the truth. Garlic Knots' faster oven never reaches the engine (the comment in university-menu.ts admits this). → Add `shopStationMult?(g,id,now): {prep, ovens, counter}`, apply it in `stageRates`/`shopRate` via `FeatureMults`, and move both features onto it (T94).
- A33 [low] `game.ts` now imports `features/layers/rival` (a cycle: rival.ts imports game.ts) and `content/scenes/home`. This undoes A31's "game.ts needs no feature". It only works because every use is lazy. → Move the story gating (`triggerPasses`, `sceneTriggered`, `pendingScenes`, `storyWaitHint`, `challengeOffered`, `migrateStory`) into `engine/story.ts`. Have the store's load path call `migrateStory(G.migrate(raw))`.
- Carried: A28, A29.

MEMORY:
- M66 [low] `game.ts storyWaitHint` builds a new Map of about 40 entries, a Set and a recursion Set on every call. It runs inside the slots.tsx selector on every store `set` (5 Hz, more while tapping): about 100 short-lived objects per update. `pendingScenes` now makes 3 arrays per tick. → Hoist the `byId` Map of HOME_SCENES to module scope and build `pendingScenes` in one pass.
- Service tick (`service.ts:tick`): a Flow, a ShopService and a slam object for each active shop on every tick, even when nothing changed (about 18 objects per tick). Acceptable; no action.
- Carried: M60, M62, M63, M65.

CPU (measured with tsx on Node, late-game state with all shops managed at Lv 80; Hermes is roughly 10–30× slower):
- U16 [medium] `uptown-stars.ts:criticView` computes `reward` with `minutesToCash` → `rewardIncome`. That makes two GameState copies plus 6 × `featureMults` (18 µs on Node, so about 0.3–0.5 ms on Hermes). It runs in at least 3 selectors (critic-banner ×2, critic-scene) on every store update once Uptown is built. → Split out `criticReward(g)` and call it only where the reward is drawn, and have the banner selectors read a cheap `criticPhase(g)`.
- U17 [low] `service.ts:shopValueMult` → `effectOf` → `flowOf` reruns every other feature's `shopDemandMult` inside `featureMults`, so the hooks are O(F²). `featureMults` went from 3.9 to 7.2 µs, `playTick` from 51 to 82 µs (72 demand-hook calls per tick). → Pass the demand already computed into the value hooks (evaluate demand first in `featureMults`), or give service a `(g, id, now, demand)` path.
- U18 [low] `slots.tsx:150`: the `storyWaitHint` selector (6 µs Node) reruns on every store set, and its result only changes when scenes, sold counts or perks move. → Key it on `seenScenes` identity plus `shopLevelKey`, or recompute it once per second.
- Carried: U8, U9, U10, U11, U12, U13.

TESTS:
- T92 rival.test: `rivalView(...).phase === 'waiting'` and `startRivalChallenge` fails until `beat4GapSeconds` after beat 3 (Downtown 60 s).
- T93 story-pacing.test: a v6 JSON round trip with Suburbs managed and `suburbs-hire` unseen keeps it pending; the v5 case keeps today's behaviour.
- T94 service.test: during an Industrial jam, `reportView.lostPerMinute` > 0 and `perMin.wanted` does not drop (fails today; this pins A32).
- T95 teaser.test: with the auction at +50%, the bid ratio is `cash / pier9Price`.
- Carried: T80, T90, T91.

FIXED SINCE LAST REVIEW: C119 (stackHeight/StackParts gone), U15 (storefront looks up activeEvent once a second).
STILL OPEN FROM LAST REVIEW: C116, C117, C118, C107, M65, M62, M63, U12, U13, A28, A29, M60, U10, U11, U8, U9, T80, T90, T91.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C120 | bug | E | rival.ts rivalView/startRivalChallenge | Enforce challengeOffered (beat-4 wait) in the engine; add a 'waiting' phase; sim and UI share it (T92) |
| C121 | bug | E | game.ts:1220 migrateStory | Mark hire scenes seen only when raw saveVersion < 6; a v6 reload must keep them pending (T93) |
| C116 | medium | E | game.ts:664 shopEarnings, events.ts:58,81 | Readouts flicker ×1.5 after each save during events; default now = event stamp; key boost too (T90) |
| C117 | medium | E | jest.config.js, game.ts migrate | Jest setupFiles imports features; migrate keeps unknown x keys; dev warn if FEATURES empty (T91) |
| A32 | medium | E | features/types.ts, university-menu, industrial-shifts | Add a station-rate hook; stop faking jam and prep caps as demand (service misreads wanted) (T94) |
| U16 | medium | E | uptown-stars.ts criticView | Split criticReward out; banner selectors read a cheap phase, not rewardIncome per store set |
| C122 | low | E | teaser.ts:74 | Bid ratio uses pier9Price(s), not PIER9_BID.cost (T95) |
| C123 | low | E | uptown-stars ingredientsPrice, boats rackPrice | One layer price-income helper (shopRevenue, no fx) for both |
| C118 | low | E | rewards.ts:189 targetOf | Use rewardIncome, not earningsPerSecond (now swings with night, tip, rival) |
| C107 | low | E | content/tuning.ts Uptown | Check goal bar and "upgrades ×N" tasks don't point at multi-day buys |
| A33 | low | E | game.ts imports rival + scenes | Move story gating to engine/story.ts; store load calls migrateStory; break game↔rival cycle |
| M66 | low | E | game.ts storyWaitHint, pendingScenes | Hoist HOME_SCENES byId map to module; one-pass pendingScenes |
| U17 | low | E | service.ts shopValueMult/flowOf | Reuse featureMults' demand; avoid O(F²) hook calls (playTick 51→82 µs Node) |
| U18 | low | U | slots.tsx:150 | Memo storyWaitHint on seenScenes + shopLevelKey, or once a second |
| M65 | low | E | buy-many.ts:23 costLadder | Key ladders on levels only; feature parts needlessly rebuild 400-step ladders |
| M62 | low | E | features/mastery.ts:107, recipes.ts:259 | Early-out settle on a cheap per-shop fingerprint |
| U12 | low | E | game.ts tick, recipes.ts ownedIn | M62 early-out; cache per-shop recipe count on `owned` identity |
| M63 | low | U | app/index.tsx drawer, shop-ui.tsx:119 | memo StationCard, stable onBuy per key, cached icons |
| U13 | low | U | app/index.tsx:161 | teaserStep() helper instead of nextSceneTeaser at 5 Hz |
| A28 | low | S | storefront.tsx | Level-up state machine out of render: stepMoments() in moments.ts |
| A29 | low | S | scene FurnitureSource | Make optional counter/drivers fields required |
| M60, U10, U11 | low | S | storefront.tsx, scene/cast.ts | ~60–90 objects/frame; queueSizes/waitingText at 15 Hz: memo on scene keys |
| U8 | low | A | audio/director.ts | Carried: memo on scene keys |
| U9 | low | U | app/city.tsx | Carried: memo on scene keys |
| T80 | low | A | audio perkDuckSeconds | Resume test |
| T90–T91 | low | E | engine tests | Event-stamp readout key; features registered in Jest setup |
| T92–T95 | low | E | rival, story-pacing, service, teaser tests | See TESTS |

Next IDs: K1, C124, A34, M67, U19, T96
