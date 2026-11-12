# v5.15 r1 — codecritic (range 5d82004..HEAD, round 25)

VERDICT: CHANGES REQUESTED
SUMMARY: The feature-bag design works: each feature lives in its own file, the hooks are pure, migration is defensive, the drawer model is extracted and cached, the facade is split out of room.tsx, and C105, C106, C108 and C109 are closed with tests. Three engine bugs in the new endgame features (a challenge cancelled by Control Center, event-inflated cash rewards, level-keyed caches that ignore feature multipliers) plus two layering problems (the store imports purchase rules from components, and an import cycle between game.ts and the features that crashes depending on load order) add up to five mediums.

BLOCKERS: none.

ISSUES:
- C110 [medium] `features/counterattack.ts:296-301` `onOffline` drops a running challenge whenever `seconds >= 1`. `_layout.tsx` calls `load()` on every `inactive→active`, so pulling down Control Center or Notification Centre, opening the app switcher or taking a call for one second silently cancels a 5-minute defence (no news, the banner just comes back). The orders already handle this correctly (`orders.ts:123` `returnFromAway`). → Pass the pre-offline state to the hook (`onOffline(before, after, seconds, now)`). Take `seconds` off `left` and move `startSold` forward by the pies sold while away; lapse only when `left <= 0`. Test T85.
- C111 [medium] `rewards.ts:280` `rewardIncome` is documented as "no boosts", but it goes through `shopEarnings → featureMults(s, id, now = s.lastSavedAt)` (`game.ts:572`). `events.runningFor` (`events.ts:58-62`) passes whenever `now - at <= 5000`, and that includes every negative difference (a save older than the stamp). Measured with tsx: during Friday Rush every "N minutes of income" payout (daily, weekly, chests, gift, golden pizza, orders) pays **×1.50**. With a 2× boost running it pays **×1.25**, because `(b+e−1)/b` uses the boost at save time. The night-oven price and the income-scaled task targets move by the same factors. → `rewardIncome = earningsPerSecond(withoutEvent(s))`, and make `featureMults`' `now` required (UI readouts pass `tickAt`). Also make freshness `0 <= now − at <= FRESH`. Test T86.
- C112 [medium] `drawer-model.ts:81` `drawerKey`, `game.ts:1227` `shopLevelKey` (used by `bundleHint` and the sidewalk `stationModels`) key only on levels. The new value multipliers (event ×1.5/×2, attack ×0.8, recipe ×1.01ⁿ) leave every cached "+$X/s" stale until the next purchase, which breaks the contract stated in drawer-model's own header. → Add an engine `featureKey(g, id)` (event id, attack target/open, recipes owned in the shop) to `shopLevelKey`. Test T87.
- C113 [low] `sidewalk-row.tsx:61` On ×10/MAX the card frame uses `look(v.frame, v.affordable)` (the ×1 state) while the button uses `many.enabled`, so the card shows the "affordable" outline on a disabled button. → Pass `many?.enabled ?? v.affordable`.
- C114 [low] `endgame/attack-banner.tsx:24` The banner repaints by the minute, so "Retry in 1m" stays disabled for up to 60 s after `retryAt`. → Add `retryAt <= now` to the selector.
- C115 [low] `endgame/shop-model.ts:38,60` The shop sells `storefront-skin-N` for N = the lowest number not owned, and the day-28 gift grants `storefront-skin-{cycle}`. A player who bought skin 1 gets nothing from cycle 1's day 28. → Sell a distinct id, or have the gift grant the next unowned skin. Test T89.

ARCHITECTURE:
- A30 [medium] `store/game-store.ts:6-7` The store imports purchase rules from presentation: `buyPlan`/`buyMany`/`costLadder` (`sidewalk-model.ts:368-424`) and `buyCosmetic`/`VANITY_PRICE` (`endgame/shop-model.ts:60`, which also pulls in the whole COPY table and rewards-model). → Move them to `src/engine/buy-many.ts` and `src/engine/vanity.ts` (price in `content/endgame.ts`). The components keep only the views. This supersedes A27.
- A31 [medium] game.ts ↔ features is a module-evaluation cycle. It is papered over by side-effect `import '../engine/game'` lines in five UI files (goal-model, stack-model, recipes-model, attack-model, news-model). Reproduced: importing `features/recipes` before `engine/game` throws `ReferenceError: Cannot access 'recipes' before initialization` in `features/index.ts`. Any new screen or test that imports a feature first will crash at load. → Add a leaf `features/registry.ts` (`export const FEATURES = []`) that game.ts reads, filled by `features/index.ts` (imported once by the store), or move `SHOP_IDS`/`def`/`finaleId` into a leaf `engine/shops.ts`. Then delete the five guard imports. Test T88.

MEMORY:
- M62 [low] `features/mastery.ts:107`, `features/recipes.ts:259`: each 200 ms tick rebuilds about 18 star objects and 18 key strings, plus 48 `recipeId` strings and 6 `finaleId` strings, to find that nothing changed: ~100 short-lived objects per tick, ~500/s. → Early-out on a cheap fingerprint (heads, footprint and grade per shop, `seenScenes.length`, `defended.length`).
- M63 [low] `app/index.tsx` drawer: with it open, each tick builds a new `withCash` object for each of the ~15 cards, a new `drawerIcon` element and a new `onBuy` closure, and `StationCard` (`shop-ui.tsx:119`) isn't memoised. That is 15 card subtrees reconciled at 5 Hz. → `memo(StationCard)`, a stable `onBuy` keyed by `c.key`, and the icon cached per `DrawerIcon`.
- M64 [low] `app/scrapbook.tsx:30-31` Two selectors run `collectionView` (30 objects plus strings) on every tick. → One string selector on `x.recipes.owned.length`.

CPU:
- U12 [low] `game.ts:968` + `featureMults`: measured with tsx, `playTick` is 52 µs with features vs 20 µs without (endgame city). That is ~0.2–0.3 ms per tick on Hermes. The cost is mostly recipes/mastery settle (4.5 + 2.2 µs) and 6 × `featureMults`, where recipes' `ownedIn` builds 4 strings per call. → The M62 early-out, plus a per-shop owned count cached on `owned` identity.
- U13 [low] `app/index.tsx:156,207` At 5 Hz, `nextSceneTeaser` builds a `Set` and the commas text only to read `.step`, and `masteryGoal` runs even when a goal is already chosen. → A `teaserStep()` helper; compute `masteryGoal` only when `!goal`.
- U14 [low] `eventView` runs about 4× per tick (EventChip, EventBanner, NewsToast selectors, `bonusLaneTop`), with 3–5 local-time `Date`s each. Local-time conversion is the slow part on Hermes. → Memo it by `Math.floor(now/1000)` in events.ts.

TESTS:
- T85 `counterattack.onOffline`: away 3 s keeps the challenge (`left − 3`, offline pies don't count); away longer than `left` lapses it.
- T86 `rewardIncome` during an event equals the off-event value, with and without a 2× boost (today 1.5 and 1.25).
- T87 `drawerCards` / `bundleHint`: an event stamp or a new recipe card changes the GM card's "+$X/s".
- T88 `jest.isolateModules(() => require('../features/recipes'))` does not throw.
- T89 Buy the shop's storefront skin, then claim day 28: a cosmetic is still granted.

FIXED SINCE LAST REVIEW: C105 (T81), C106 (T82), C108 (T84), C109 (format.test), A22/M50 (facade.tsx, room.tsx 1,027→565), A17/M32 (drawer-model.ts, cached; gap is C112). A27 is superseded by A30.
STILL OPEN FROM LAST REVIEW: C107, A28, A29, M60, U8, U9, U10, U11, T80.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C110 | medium | E | features/counterattack.ts:296 onOffline | Take away-seconds off `left`, move startSold past offline pies; lapse only when left ≤ 0 (T85) |
| C111 | medium | E | rewards.ts:280, events.ts:58, game.ts:572 | rewardIncome strips events; featureMults `now` required; freshness 0 ≤ now−at ≤ FRESH (T86) |
| C112 | medium | E | game.ts:1227 shopLevelKey, drawer-model.ts:81 | Add featureKey(g,id) (event, attack, recipes owned) to the level keys (T87) |
| A30 | medium | E | game-store.ts:6-7 | Move buyPlan/buyMany/costLadder and buyCosmetic/VANITY_PRICE into src/engine; components keep views |
| A31 | medium | E | engine/game.ts ↔ features/index.ts | Leaf feature registry or engine/shops.ts; delete the five `import '../engine/game'` guards (T88) |
| C113 | low | U | sidewalk-row.tsx:61 | Card look uses `many?.enabled ?? v.affordable` |
| C114 | low | U | endgame/attack-banner.tsx:24 | Add `retryAt <= now` to the selector so Defend re-enables on time |
| C115 | low | U | endgame/shop-model.ts:38,60 | Sold skin must not collide with day-28 `storefront-skin-{cycle}` (T89) |
| M62 | low | E | features/mastery.ts:107, recipes.ts:259 | Early-out settle on a cheap per-shop fingerprint |
| M63 | low | U | app/index.tsx drawer, shop-ui.tsx:119 | memo StationCard, stable onBuy per key, cached icons |
| M64 | low | U | app/scrapbook.tsx:30-31 | One primitive selector instead of two collectionView calls per tick |
| U12 | low | E | game.ts:968, recipes.ts:289 | M62 early-out; cache per-shop recipe count on `owned` identity |
| U13 | low | U | app/index.tsx:156,207 | teaserStep() helper; masteryGoal only when no goal |
| U14 | low | U | features/events.ts eventView | Memo by whole second; ~4 calls per tick today |
| C107 | low | E | content/tuning.ts Uptown | Check goal bar and "upgrades ×N" tasks don't point at multi-day buys |
| A28 | low | S | storefront.tsx | Level-up state machine out of render: stepMoments() in moments.ts |
| A29 | low | S | scene FurnitureSource | Make optional counter/drivers fields required |
| M60, U10, U11 | low | S | storefront.tsx, scene/cast.ts | ~60–90 objects/frame; queueSizes/waitingText at 15 Hz: memo on scene keys |
| U8 | low | A | audio/director.ts | Carried: memo on scene keys |
| U9 | low | U | app/city.tsx | Carried: memo on scene keys |
| T80 | low | A | audio perkDuckSeconds | Resume test |
| T85–T88 | low | E | engine tests | See TESTS |
| T89 | low | U | shop-model test | See TESTS |

Next IDs: K1, C116, A32, M65, U15, T90
