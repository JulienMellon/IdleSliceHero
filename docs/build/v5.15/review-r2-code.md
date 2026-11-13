# v5.15 r2 — codecritic (range 5d82004..HEAD; fix round 0ad8ea9..HEAD, round 26)

VERDICT: APPROVED
SUMMARY: The five r1 mediums are closed with tests: the challenge survives short absences (C110), rewards ignore events (C111), level keys carry feature parts (C112), the purchase rules moved to `engine/buy-many.ts` and `engine/vanity.ts` (A30), and the registry is now a leaf (A31). Two new mediums come out of those fixes. Clockless readouts flicker to ×1.5 after every autosave during an event. And because features now register through a side-effect import, tests and scripts silently run without them, while `migrate` would drop the saved feature state if it ever ran before registration.

BLOCKERS: none.

ISSUES:
- C116 [medium] `game.ts:664` `shopEarnings(s, id, now = s.lastSavedAt)` combined with `events.runningFor` (`events.ts:58`, 0 ≤ age ≤ 5 s, restamped every 2 s). `lastSavedAt` only moves on save (every 30 s, `_layout.tsx:34`), so for 0–2 s after each save it is fresh against the stamp and every clockless readout includes the event. After the next restamp the age goes negative and the event drops out again. Measured with tsx (Downtown, Friday 18:00): 17.57 → **26.36** just after a save → 17.57 after the restamp. This hits the HUD citywide $/s (`index.tsx:170,250`), the shop tabs (`shop-ui.tsx:87`), `city.tsx:53,93`, the drawer GM line and `bundleHint`/`upgradeGain`. `shopKey` for events is the id alone (`events.ts:81`), so the drawer and bundle caches freeze on whichever value was computed when the event began. → Pick one rule and make it a function of the key. Recommended: readouts show the event while it is stamped, so the default `now` is `eventStampAt(s) || s.lastSavedAt` (export it from events.ts). The value hook's `(b+e−1)/b` also depends on the boost, so add `boostMult > 1` to the event's `shopKey`, or have readouts take the additive form. Test T90.
- C117 [medium] Registration by import (`features/index.ts:16`) has three silent failure modes. (1) `jest.config.js` has no `setupFiles`, so the engine tests that never import `../features` (game, playtest, rewards, orders, bonus, session-hooks, worn-cosmetics and ~10 more) now run with zero features. Before r2 they ran with all five. The golden test needed a manual fix, which shows the problem. (2) `scripts/review/{sim2,facts,rush}.ts` don't register when run on their own. (3) `game.ts:531` `migrate` rebuilds `x` only from `FEATURES`. Any path that migrates before registration drops every star, recipe card and attack record, and the next save makes the loss permanent. → Add `setupFiles: ['<rootDir>/jest.setup.js']` that imports `src/engine/features`. Import it in scripts/review. Have `migrate` keep unknown keys (`{ ...savedX, ...registered }`). Add a `__DEV__` warn in `newGame`/`migrate` when `FEATURES` is empty. Test T91.
- C118 [low] `rewards.ts:189` `targetOf` still uses `earningsPerSecond(s)`, not `rewardIncome`. Income-scaled task targets rolled during an event (first unlock, or a refresh inside the fresh window) are inflated. → Use `rewardIncome(s)`.
- C119 [low] `endgame/stack-model.ts:32` `stackHeight`/`StackParts` are now used only by tests, and `banner-stack.tsx:3` still names the removed `bonusLaneTop`. → Delete them or fix the comment.

ARCHITECTURE:
- (none new; A28 and A29 carried as low)

MEMORY:
- M65 [low] `buy-many.ts:23` `costLadder` keys on `shopLevelKey`, which now includes the event, attack and recipe parts. Prices don't depend on those, so every event start or end, attack and card drop rebuilds up to 4 × 400-step ladders (each step allocates a full `GameState`). → Key the ladders on a levels-only key (the old string, without `fx`).
- Carried: M62, M63 (StationCard still not memoised, `shop-ui.tsx:119`), M60.

CPU:
- U15 [low] `storefront.tsx:222` `eventLook(activeEvent(Date.now()), …)` runs on each 15 fps frame, which means 1–3 local-time `Date`s per frame (the slow part on Hermes, see U14). The new `eventViewNow` per-second cache sits in `components/endgame/event-model.ts`, where the scene can't share it cleanly. → Move the cache into `engine/features/events.ts` (`activeEventNow`/`eventViewNow`) and use it in Storefront and the four endgame selectors.
- `shopLevelKey` now costs 1.26 µs per call in node (measured), about 8–14 calls per tick, so roughly 0.1 ms on Hermes. That is acceptable. It folds into U12 (recipes `ownedIn` builds 4 strings per `shopKey`).
- Carried: U12, U13 (the `teaserStep()` half is still open; the `masteryGoal` half is done), U8, U9, U10, U11.

TESTS:
- T90 `shopEarnings(s, id)` during Friday Rush is identical with `lastSavedAt` = stamp − 1 s, stamp + 0.5 s, and after a restamp. `drawerCards` gives the same GM line in all three.
- T91 `jest.isolateModules`: `migrate(saved)` with an empty registry keeps `saved.x.recipes.owned`. A test file without an explicit import sees `FEATURES.length === 5` (setup file).

FIXED SINCE LAST REVIEW: C110 (T85), C111 (T86; the readout gap is C116), C112 (T87; the event gap is C116), C113, C114, C115 (T89), A30, A31 (T88; the registration gap is C117), M64, U14, T85–T89.
STILL OPEN FROM LAST REVIEW: C107, A28, A29, M60, M62, M63, U8, U9, U10, U11, U12, U13 (teaserStep half), T80.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C116 | medium | E | game.ts:664 shopEarnings, events.ts:58,81 | Readouts flicker ×1.5 after each save during events; default now = event stamp; key boost too (T90) |
| C117 | medium | E | jest.config.js, game.ts:531 migrate, scripts/review | Jest setupFiles imports features; scripts import it; migrate keeps unknown x keys; dev warn if empty (T91) |
| C118 | low | E | rewards.ts:189 targetOf | Use rewardIncome, not earningsPerSecond, for income-scaled task targets |
| C119 | low | U | endgame/stack-model.ts:32, banner-stack.tsx:3 | Delete unused stackHeight/StackParts; fix the bonusLaneTop comment |
| M65 | low | E | buy-many.ts:23 costLadder | Key ladders on levels only; feature parts needlessly rebuild 400-step ladders |
| U15 | low | S | storefront.tsx:222 | activeEvent per frame; use a per-second cached helper moved into engine events.ts |
| M62 | low | E | features/mastery.ts:107, recipes.ts:259 | Early-out settle on a cheap per-shop fingerprint |
| M63 | low | U | app/index.tsx drawer, shop-ui.tsx:119 | memo StationCard, stable onBuy per key, cached icons |
| U12 | low | E | game.ts:968, recipes.ts ownedIn | M62 early-out; cache per-shop recipe count on `owned` identity |
| U13 | low | U | app/index.tsx:156 | teaserStep() helper instead of nextSceneTeaser at 5 Hz |
| C107 | low | E | content/tuning.ts Uptown | Check goal bar and "upgrades ×N" tasks don't point at multi-day buys |
| A28 | low | S | storefront.tsx | Level-up state machine out of render: stepMoments() in moments.ts |
| A29 | low | S | scene FurnitureSource | Make optional counter/drivers fields required |
| M60, U10, U11 | low | S | storefront.tsx, scene/cast.ts | ~60–90 objects/frame; queueSizes/waitingText at 15 Hz: memo on scene keys |
| U8 | low | A | audio/director.ts | Carried: memo on scene keys |
| U9 | low | U | app/city.tsx | Carried: memo on scene keys |
| T80 | low | A | audio perkDuckSeconds | Resume test |
| T90–T91 | low | E | engine tests | See TESTS |

Next IDs: K1, C120, A32, M66, U16, T92
