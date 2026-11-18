# v5.18 r1: code review (codecritic, full effort)

Range `229f874..HEAD`, paths `src/engine src/store src/content/cities/*/index.ts`. tsc and the full suite pass (orchestrator). I probed a fresh Boston game with throwaway `npx tsx` scripts in the scratchpad (nothing added to the repo).

```
VERDICT: CHANGES REQUESTED
SUMMARY: Turning the city into data is a clean seam: the engine is now keyed on `cityOf(g)`, the franchise reset is one pure function with keep/reset lists pinned by a test, and number formatting holds past 1e36. But the engine-side defaults (`def(id, city = HOME_CITY)`, the exported `SHOP_IDS`, home-only ids in content tables) let three code paths throw on a Boston save, and the franchise flow can already reach a Boston save.
BLOCKERS:
- K2 [E] night-oven.ts:33 `NIGHT_OVEN.needsBuilt = [null,'waterfront','industrial']` (content/hooks.ts:177) → `s.shops['waterfront']` is undefined in Boston → `nightOvenLock` throws "reading 'built'" for tiers 1 and 2 (probed). `nightOvenView` runs whenever the drawer is open (app/index.tsx:191) and `buyNightOven` calls it too: a red screen on the first drawer open after a franchise. Fix: make needsBuilt a build position (`[null, 2, 4]`) and read `cityOf(s).neighbourhoods[i]`; the lock text then names the Boston shop.
- K3 [U] drawer-model.ts:86 `drawerKey` maps `G.SHOP_IDS` → `shopLevelKey` → throws on a Boston game (probed); :252 `built` count does the same; store/ad-model.ts:97-98 (reroll pool) too. Fix: `hoodIds(cityOf(game))` at all four sites; replace `id === 'downtown'` (:86, :195) with `G.firstHood(cityOf(game))`.
- K4 [U] endgame/mastery-model.ts:16,19 and goal-model.ts:141 call `def(shopId)`, which defaults to HOME_CITY → `undefined.name` for a Boston id (probed `starToast('north-end', …)` throws). The first mastery star earned in Boston throws inside the toast. Fix: `def(id, cityOf(g))` (thread `g` into `starToast`/`nextStarLine`), or remove the default entirely (A35).
ISSUES:
- C140 [low] [U] drawer-model.ts:115 `G.perkOf(id, shop)` with no city → Boston perks never reach the banner or the decor title. It doesn't throw, it is silently wrong. A35 makes tsc catch it.
- C141 [medium] [E] game.ts:884 `nonnaCountdownText` (and city-model.ts:32 "Nonna in …", drawer-model.ts:195) says "Nonna takes over in 424 more pizzas" in Boston, where the founder is Father Dom (probed). Fix: take the name from `city.managers[firstHood(city)].name` and rename it `founderCountdownText`.
- C143 [low] [E] mastery.ts:7 and industrial-shifts.ts:16 still read home `FOOTPRINTS`/`OVEN_GRADES`/`NEIGHBORHOODS`. Read them from `cityOf(g).fit` so a city with a different ladder length counts its stars correctly.
- C144 [low] [E] game-store.ts:542 `franchise` doesn't wait for a load in flight (`loading > 0` → wrap it in `whenLoaded`), and it leaves `rushTaps`, `lastKitchenTap` and `toast` from the old city in place. Reset them in the same `set`.
- C145 [low] [U] shop-ui.tsx:77 colours a lot as affordable by `cash >= buildCost` and ignores `buildLock` (see JULIEN 1).
ARCHITECTURE:
- A35 [high] [E] Root cause of K2–K4 and C140: game.ts `def`, `perkOf`, `decorMult`, `stationCost`, `shopRevenue`, `valuePerPizza`, `lineRates`, `headCost` and `buildAllIn` take `city = HOME_CITY` by default, `SHOP_IDS` is still exported, and game.ts imports `cities/home` directly (contradicting cities/index.ts:1). Every caller that was missed compiles and works for the home city, so tests on home saves can't see the gap. Fix in one step: (1) `def(id)` looks the id up in one map built over all `CITIES` (ids are unique, as `savedHoods` already assumes), with no city argument; (2) make `city` required on the others so tsc lists every caller; (3) rename `SHOP_IDS` to `HOME_HOOD_IDS` and allow it only in feature `init`.
- A36 [low] [E] One `canAfford(s, cost)` plus `pay(s, cost)` in the engine (JULIEN 1).
- A37 [low] [E] One `engine/clock.ts` with `gameNow()` (JULIEN 2).
MEMORY:
- No new [medium]+ finding. The franchise keeps `seenScenes` across cities (about 40 ids per city, at most about 200 strings by the fifth city), which is fine. `scenesById` and `hoodIds` are WeakMap caches keyed on static content, so they are bounded. `sceneScroll` is written only on drag or momentum end, holds at most 12 keys, and is never saved.
- M68 (carried) is still the real per-frame cost.
CPU:
- U22 [low] [E] Every layer's `hoodOf(g)` calls `layerHood`, which scans 6 neighbourhoods. `built(g)` scans again, and `shopValueMult`, `shopDemandMult` and `shopKey` each run per shop: about 5 layers × 3 hooks × 2 scans × 6 shops ≈ 1,000 comparisons per `featureMults` sweep, under 10 µs. Cache `layerHood` per city in a WeakMap, the way `hoodIds` already does.
- U23 [low] [S] storefront.tsx reads `Date.now()` 14 times per render (225, 227, 242, 254, 267, 394, 397, 403…). Each read is cheap (37 ns on node; at most about 0.2 µs on Hermes, so under 3 µs a frame), but they can disagree across a boundary. Read `now` once at the top of the render.
TESTS:
- T106 [E] A Boston smoke test: `newGame(NOW,'boston')` with every shop built. `nightOvenView`, `drawerKey`/`drawerView` for each id, `masteryGoal`, `starToast`, `nextSceneTeaser`, `applyOffline` and 600 store-style ticks must not throw. It would have caught K2–K4.
- T107 [E] A guard test: grep `src/engine` and `src/components` for `SHOP_IDS` and for literal home ids (`'downtown'`, `'waterfront'`…) outside an allowlist.
- T108 [E] `founderCountdownText` names Father Dom in Boston and Nonna at home.
FIXED SINCE LAST REVIEW: n/a (no carried E item was touched in this range)
STILL OPEN FROM LAST REVIEW: M68, A32, C134, C135, C136, C137, C138, C139, C133, A34, A33, A29, U21, U19, U17, M62, U12, U8, C107, T103, T104–T105, T94
```

## JULIEN

1. **Affordability checks (about 30 hits).** The checks themselves agree with each other: every one compares `cash >= cost` after a separate `null`/lock test, and `money` maps non-finite values to $0. The real duplication is in spending, not in checking: `spend()` in game.ts:820 covers shops, vehicles and the bid, but night-oven.ts:95, uptown-stars.ts:104 and waterfront-boats.ts:78 each subtract cash inline, and diamonds are checked in rewards.ts:449 and vanity.ts:30. The views (drawer, sidewalk, boats and stars models) recompute `canBuy` on their own, and shop-ui.tsx:77 even skips the lock (C145). Yes, add `canAfford(s, cost)` and `pay(s, cost)` to the engine (A36). Then the test build's bottomless wallet is one switch in `canAfford`/`pay` instead of a cash ceiling.
2. **Clock reads (101 hits).** Each read costs about 37 ns on node and at most about 0.2 µs on Hermes. The busiest sites, storefront at 15 fps and the store tick at 5 Hz, add up to under 5 µs a second: negligible. The engine has no `Date.now()` at all; it takes `now` as a parameter. **Game time** is the store's 20 sites (tick, offline, save, franchise, rewards, gift, ads, challenges, reroll) plus the views that pass `Date.now()` into engine maths (layer-stack, storefront `visitOf`, banners, chips, drawer-cards). **Animation time** is scene/clock.ts, the storefront's cheer, bark and rush timers, harbour, cutscene and audio. A `gameNow()` module (A37) is worth having for the time skip and for one consistent `now` per frame, not for speed.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| K2 | blocker | E | night-oven.ts:33, hooks.ts:177 | needsBuilt as build positions read via cityOf(s); Boston drawer throws today |
| K3 | blocker | U | drawer-model.ts:86,:195,:252; store/ad-model.ts:97-98 | hoodIds(cityOf(game)) and firstHood instead of SHOP_IDS and 'downtown' |
| K4 | blocker | U | mastery-model.ts:16,19; goal-model.ts:141 | def(id, cityOf(g)); a Boston mastery star toast throws |
| A35 | high | E | game.ts def/perkOf/… defaults, SHOP_IDS | def over all cities; city param required; SHOP_IDS → HOME_HOOD_IDS for init only |
| C141 | medium | E | game.ts:884 nonnaCountdownText, city-model.ts:32 | Founder name from city.managers; rename founderCountdownText |
| M68 | medium | S | storefront.tsx:200, scene/cameo.ts cameoSpot | Memo cameoGeom on lay + tag text (T105) |
| A32 | medium | E | features/types.ts, university-menu, industrial-shifts | Station-rate hook; stop faking jam and prep caps as demand (T94) |
| C140 | low | U | drawer-model.ts:115 | perkOf with cityOf(game) so Boston perks show |
| C143 | low | E | mastery.ts:7, industrial-shifts.ts:16 | Read footprints/grades from cityOf(g).fit |
| C144 | low | E | game-store.ts:542 franchise | whenLoaded guard; reset rushTaps, lastKitchenTap, toast |
| C145 | low | U | shop-ui.tsx:77 | Affordable only when buildLock is null |
| A36 | low | E | engine spend sites, night-oven, uptown, boats, vanity | canAfford(s,cost) + pay(s,cost) used by every model and view |
| A37 | low | E | store + view Date.now game-time sites | engine/clock.ts gameNow(); animation keeps Date.now |
| U22 | low | E | layers hoodOf → layerHood | WeakMap cache of layer hood per city |
| U23 | low | S | storefront.tsx render | Read Date.now() once per render |
| C134 | low | U | app/index.tsx:150, _layout.tsx:46 | setBackground into GameRunner's AppState handler |
| C135 | low | E | game-store.ts loadSave | Keep an open offline popup across a short background (T104) |
| C136 | low | N | services/ads.native.ts:24, ad-flow.ts ready | ready() false with empty unit id; no UMP or ATT for no ad |
| C137 | low | U | shop-ui.tsx:69, app/index.tsx:113, city.tsx:21 | lotView returns pies-to-go text; typed buy handler |
| C138 | low | A | audio/output.native.ts:120,169 | Check voices.size before copying; syncClock on last voice end |
| C139 | low | E | game-store.ts:359 afterLoad | try/catch each queued callback |
| C133 | low | N | app/settings.tsx:17, DEVICE-CHECKLIST | Opt-out through services index; note otherAudio null |
| A34 | low | E | game-store.ts, store/standing.ts imports | Move grant, double, reroll, booster, offline maths to engine |
| A33 | low | E | game.ts imports rival + scenes | challengeOffered + migrateStory to engine/story.ts |
| A29 | low | S | scene FurnitureSource | Make the remaining optional fields required |
| U21 | low | S | storefront.tsx:311, :251 | stepMoments only on key change; memo moreTagAt |
| U19 | low | U | layer-stack.tsx:131 | Select rivalOpen plus challenge fields only |
| U17 | low | E | service.ts shopValueMult/flowOf | Reuse featureMults' demand; avoid O(F²) hook calls |
| M62 | low | E | features/mastery.ts:107, recipes.ts:259 | Early-out settle on a per-shop fingerprint |
| U12 | low | E | game.ts tick, recipes.ts ownedIn | M62 early-out; cache recipe count on owned identity |
| U8 | low | A | audio/director.ts warmRare, refreshMusic | Memo on scene keys |
| C107 | low | E | content/tuning.ts Uptown | Goal bar and "upgrades ×N" tasks not on multi-day buys |
| T106 | low | E | new engine test | Boston smoke: night oven, drawer, mastery, teaser, offline, ticks never throw |
| T107 | low | E | new guard test | No SHOP_IDS or literal home ids outside an allowlist |
| T108 | low | E | game tests | Founder countdown names Father Dom in Boston |
| T103 | low | N | services/ads.native.ts | Pure createSlotCache with retry, reset, stale tests |
| T104–T105 | low | E | store, cameo tests | T104 E; T105 S |
| T94 | low | E | service tests | Station-rate hook test, with A32 |

Next IDs: K5, C146, A38, M69, U24, T109
