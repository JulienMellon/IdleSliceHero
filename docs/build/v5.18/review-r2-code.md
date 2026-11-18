# v5.18 r2: code review (codecritic, medium re-check)

Range `229f874..HEAD`. I read the r1 fix round closely (`26dab94..HEAD`) in `src/engine`, `src/store` and `src/content/cities`, plus the component sites behind K3, K4, C140 and C145. tsc and the suite pass (orchestrator). I timed one thing with a throwaway `npx tsx -e` snippet (nothing was added to the repo). The JULIEN questions were already answered in r1, so this file skips them.

```
VERDICT: APPROVED
SUMMARY: All three Boston crashes are fixed at the root. `def` and the price helpers now find the owning city from the id, night-oven tiers are build positions, and the drawer, reroll pool and mastery toast read `cityOf(game)`. A smoke test and a home-id guard pin these fixes. One medium copy leak is left in Boston: the City-map pin still says "Nonna". Everything else is low.
BLOCKERS: none
ISSUES:
- C146 [medium] [U] city-model.ts:32 `lotView` still hard-codes `Nonna in ${…}` / 'Nonna soon' (and `kind: 'nonna'`). The Boston City-map pin reads "Nonna in 424", even though the row below it correctly says "Father Dom takes over…". shop-ui.tsx:71 then string-slices 'Nonna in ' to build "pies to go". Fix: put `pinsLeft: number | null` in the view, with a `founder` name taken from the same `founderName` (export it from game.ts). Then shop-ui formats from the number, which also closes C137.
- C147 [low] [E] game.ts:570 `def` without a city falls back to `HOME_CITY.find(...)!`. For an id that no city has it returns `undefined`, typed as `NeighborhoodDef`, so cutscene-input.ts:25 and game.ts:1230 cast `as {name}|undefined` to survive. Add `findHood(id): NeighborhoodDef | undefined` for those two callers and keep `def` total. Also drop the `HOME_CITY` defaults left in `masteryStars`/`shopStars` (mastery.ts:48,53, called from mastery-model.ts:23 and shop-ui.tsx:103) and in `jamShare`. Today the Boston fit spreads HOME_FIT, so they happen to be right. Remove the `nonnaCountdownText` alias once the U callers move.
- C148 [low] [E] game-store.ts:559 `franchise` now goes through `benefit()`. While a load is in flight it returns `true` before `canFranchise` has run, so flow.tsx:121 calls `onDone()` and leaves the City screen even if the franchise is then refused. Use `whenLoaded` and return `false` while `loading > 0`, so the button just does nothing that one time. The comment on `benefit` also says "ad benefit".
ARCHITECTURE:
- A35 resolved in substance. The `city = cityOfHood(id)` default makes every missed caller correct, because ids are unique across packs, and `SHOP_IDS` is now `HOME_HOOD_IDS`, used only in service `fresh()`. The leftovers are in C147.
MEMORY:
- No new [medium] or higher item. `cityOfHood` allocates an `Object.values(CITIES)` array (2 entries) for each call with a non-home id and no city, which is trivial. The `LAYER_HOODS` WeakMap is bounded by the number of cities times about 6 layer kinds. `cameoGeom` is now memoised (M68 closed).
CPU:
- U24 [low] [E] game.ts:566 `cityOfHood` scans HOME, then `Object.values(CITIES)` with a nested `some`, on every default-city call. Measured on node: `stationCost` costs 198 ns for a Boston id against 51 ns for a home id. That is about 150 ns extra per call, and the drawer makes about 30 such calls, so roughly 5 µs per drawer build. It is negligible but free to fix: build one `Map<NeighborhoodId, CityDef>` over `CITIES` lazily, which also makes `def` O(1). A Boston `playTick` measured 6 µs.
TESTS:
- T109 [E] Extend home-ids-guard to drawer-model, goal-model, city-model, store/ad-model and endgame/mastery-model, the K3 and K4 sites, which the engine/store-only walk does not cover. Scene art stays allowlisted.
- T104 (carried) still has no store test for C135: a popup that is still open across a short background must keep `earned`, and `cash` must not be counted twice.
FIXED SINCE LAST REVIEW: K2, K3, K4, A35, C140, C141 (engine and drawer; the pin is now C146), C143, C144, C145, M68, U22, U23 (7 reads, now in effects and callbacks), C135, C138, C139, T106, T107 (engine/store), T108
STILL OPEN FROM LAST REVIEW: A32, C134, C136, C137, C133, A36, A37, A34, A33, A29, U21, U19, U17, M62, U12, U8, C107, T103, T104–T105, T94
```

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C146 | medium | U | city-model.ts:32, shop-ui.tsx:71 | Pin from a pies-left number plus founderName; no "Nonna in" in Boston, no string slicing |
| A32 | medium | E | features/types.ts, university-menu, industrial-shifts | Station-rate hook; stop faking jam and prep caps as demand (T94) |
| C147 | low | E | game.ts:570 def, mastery.ts:48,53, jamShare | findHood for unknown ids; drop HOME_CITY defaults; remove nonnaCountdownText alias |
| C148 | low | E | game-store.ts:559 franchise | whenLoaded and return false while loading, so the flow doesn't leave the screen |
| U24 | low | E | game.ts:566 cityOfHood | One lazy Map id→CityDef over CITIES; def O(1) |
| A36 | low | E | engine spend sites, night-oven, uptown, boats, vanity | canAfford(s,cost) + pay(s,cost) used by every model and view |
| A37 | low | E | store + view Date.now game-time sites | engine/clock.ts gameNow(); animation keeps Date.now |
| C134 | low | U | app/index.tsx:150, _layout.tsx:46 | setBackground into GameRunner's AppState handler |
| C136 | low | N | services/ads.native.ts:24, ad-flow.ts ready | ready() false with empty unit id; no UMP or ATT for no ad |
| C137 | low | U | shop-ui.tsx:69, app/index.tsx:113, city.tsx:21 | lotView returns pies-to-go text; typed buy handler |
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
| T109 | low | E | home-ids-guard.test.ts | Also walk drawer, goal, city, ad and mastery models |
| T103 | low | N | services/ads.native.ts | Pure createSlotCache with retry, reset, stale tests |
| T104–T105 | low | E | store, cameo tests | T104 E (C135 popup kept, cash not double-counted); T105 S |
| T94 | low | E | service tests | Station-rate hook test, with A32 |

Next IDs: K5, C149, A38, M69, U25, T110
