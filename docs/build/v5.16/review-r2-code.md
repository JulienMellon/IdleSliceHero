# v5.16 r2 code review (engine, store, content types/tuning, sim2)

VERDICT: APPROVED
SUMMARY: The r2 fix round closes both r1 bugs: C120 (the rival's beat-4 wait is now enforced in the engine with a `waiting` phase that sim2, the sheet and the card all read) and C121 (hire scenes are marked seen only for saves below v6). U16 and C123 are also fixed. Three medium items are still open (C116, C117, A32), which is the most the approval rule allows. Nothing new is above low.

## What changed in r2 (9248fb8..HEAD, review paths)
- `rival.ts`: `rivalView` returns `'waiting'` when `!challengeOffered`. The check comes after `running` and before `retry`, which is the right order: a lost challenge always comes after the gap. `startRivalChallenge` refuses during the wait. The test covers the boundary second for both the 300 s gap and Downtown's gap.
- `game.ts`: `migrateStory(game, num(r.saveVersion, 0))`. A missing or v5 `saveVersion` marks hire scenes as seen; a v6 save keeps them pending. The new `migrate-story.test.ts` covers both sides.
- `uptown-stars.ts`: `criticView` no longer runs the income pass. `criticReward` is split out and only tests use it so far. `ingredientsPrice` uses `shopRevenue` (no event or boost), the same as `rackPrice`.
- `tuning.ts`: `downtownBeat4GapSeconds` goes from 60 to 120. Tests were updated.
- `game-store.ts`: `layerHold` plus `setLayerHold` (no-op when unchanged) feed into `bonusBlocked`.

BLOCKERS: none

ISSUES:
- C124 [low] `game-store.ts:139 bonusBlocked`. The `& { layerHold?: boolean }` makes the field optional, so a caller that builds a partial state silently ignores the layer hold. → Add `'layerHold'` to the `Pick` and drop the optional field; both callers already pass the full store.
- C125 [low] `rival.ts:81 'waiting'` returns `target: 0`. `sheet-model.ts:101` then has to call `rivalTarget` itself to show the ask. → Return `target: rivalTarget(...)` in `waiting` too (it is cheap enough while the sheet is open), or document that 0 is a sentinel. Today two callers have to know about it.
- Carried: C116, C117 (medium). C122, C118, C107 (low).

ARCHITECTURE:
- Carried: A32 (medium), A33 (low). With C120 in place, `challengeOffered` lives in `game.ts`, `rival.ts` imports it, and `game.ts` imports rival. That strengthens the case for A33: move `challengeOffered` and `migrateStory` to `engine/story.ts`.

MEMORY:
- Carried: M62, M63, M65, M66, M60 (low). Nothing new: r2 adds one boolean and one module `Set` (`layer-stack.tsx:114 holds`), and the Set has at most 3 keys, all cleared on unmount.

CPU:
- U19 [low] `layer-stack.tsx:131`, `layer-hud.tsx:38`. Two `rivalView` selectors run on every store set (5 Hz). In `available`/`retry` each one runs `rivalTarget`, which calls `featureMults` (O(F) hooks). That is about 2 full feature passes per tick while an offer is up, plus `Date.now()` inside the selectors. `waiting` now skips this, which is a small win. → Have the HUD tag select a cheap phase string (`rivalPhaseLite`, no target) and leave only the card reading the target.
- U16: fixed. `criticView` costs no income pass, and the banner selectors (`critic-banner.tsx:13,16`, `critic-scene.tsx:67`) are now cheap.
- Carried: U17, U12 (low, E). U13, U18, U9 (low, U). U10, U11 (low, S). U8 (low, A).

TESTS:
- T96 `bonusBlocked`: `{ layerHold: true }` with everything else clear gives true. The store-level case: `setLayerHold(true)` then `tick` leaves `game.bonus` unspawned past its `nextAt`.
- T97 `rivalView` at the Downtown gap edge after a lost challenge: with `retryAt` set and the gap over, the phase is `retry`, never `waiting`. This pins the check order.
- T93 and T92 done. Carried: T80, T90, T91, T94, T95.

FIXED SINCE LAST REVIEW: C120, C121, U16, C123 (both layer prices now use `shopRevenue`; a shared helper is not worth adding for two one-liners), T92, T93.
STILL OPEN FROM LAST REVIEW: C116, C117, A32, C122, C118, C107, A33, M66, U17, U18, M65, M62, U12, M63, U13, A28, A29, M60, U10, U11, U8, U9, T80, T90, T91, T94, T95.

Medium count: C116, C117, A32 = 3. This is at the limit, so all three should be fixed in v5.17's first engine wave.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C116 | medium | E | game.ts:664 shopEarnings, events.ts:58,81 | Readouts flicker ×1.5 after each save during events; default now = event stamp; key boost too (T90) |
| C117 | medium | E | jest.config.js, game.ts migrate | Jest setupFiles imports features; migrate keeps unknown x keys; dev warn if FEATURES empty (T91) |
| A32 | medium | E | features/types.ts, university-menu, industrial-shifts | Add a station-rate hook; stop faking jam and prep caps as demand (service misreads wanted) (T94) |
| C124 | low | E | game-store.ts:139 bonusBlocked | Put layerHold in the Pick, not optional; partial states must not drop the hold (T96) |
| C125 | low | E | rival.ts:81 waiting | Return the real target in 'waiting' (or document the 0) so sheet-model stops recomputing it |
| U19 | low | U | layer-hud.tsx:38, layer-stack.tsx:131 | HUD tag selects a cheap phase only; two rivalTarget/featureMults passes per 5 Hz set |
| C122 | low | E | teaser.ts:74 | Bid ratio uses pier9Price(s), not PIER9_BID.cost (T95) |
| C118 | low | E | rewards.ts:189 targetOf | Use rewardIncome, not earningsPerSecond (now swings with night, tip, rival) |
| C107 | low | E | content/tuning.ts Uptown | Check goal bar and "upgrades ×N" tasks don't point at multi-day buys |
| A33 | low | E | game.ts imports rival + scenes | Move challengeOffered + migrateStory to engine/story.ts; break game↔rival cycle |
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
| T94–T97 | low | E | service, teaser, store, rival tests | See TESTS |

Next IDs: K1, C126, A34, M67, U20, T98
