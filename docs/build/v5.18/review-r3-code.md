# v5.18 r3: code review (codecritic, medium re-check)

Range `229f874..HEAD`. Since the r2 review (`ddd69b2`), nothing changed in `src/engine`, `src/store` or `src/content`, so every E-owned open item stands as written in r2. The r2 fix round (`fa2895c..HEAD`) touched only 9 component files (+20/−12), and I read all of them: backdrop clouds (D510), franchise moment centring (D506), driver cap colours (D513), and `viewX0`/`viewX1` plumbing through `SceneOverlays`/`SceneSlots` (D512 groundwork). tsc and the suite pass (orchestrator). The JULIEN questions were answered in r1, so this file skips them.

```
VERDICT: APPROVED
SUMMARY: The r2 fix round is small and correct. Driver caps come from a cached per-slot palette pinned by two crowd tests, and the cloud and moment fixes are constant or style edits. The new viewX0/viewX1 props have no consumer yet and break the SceneOverlays memo on every frame while a wide shop scrolls. The engine, store and content are unchanged, so C146 and A32 stay the only mediums.
BLOCKERS: none
ISSUES:
- C149 [low] [S] storefront.tsx:741 works out the overlay span inline (`Math.round(scrollX.current) + VIEW_MARGIN`, `+ width - VIEW_MARGIN`), next to `visibleSpan` (line 318), which does the same job in scene coordinates. It also reads a ref during render, like lines 318 and 483. Add a pure `overlaySpan(scrolls, scrollX, viewW, margin = VIEW_MARGIN): [number, number] | null` to scene/viewport.ts with a viewport test (T110), and call it once. Also make people.tsx:90's driver fallback `DRIVER_CAPS[0]` instead of a second '#D9443A' literal. The delivery driver (cast.ts:117) relies on that fallback.
- C146 [medium] [U] (carried) city-model.ts:32 still builds "Nonna in …" / 'Nonna soon' for every city. Not touched this round.
- C147, C148 [low] [E] (carried) no engine or store edits since r2.
ARCHITECTURE:
- A32 [medium] [E] (carried) station-rate hook. No change.
- No new item. Slot props growing to optional numbers is acceptable while `SceneSlotProps` stays at 5 fields. If a third view field arrives, pass one `view?: {x0, x1}` that is memoised on the rounded values instead.
MEMORY:
- No new [medium] or higher item. `DRIVER_CAPS` is a module constant. `DriverCast.cap` is cached per shop seed in `driverCastCache`, which is bounded by the number of shops. The view props are two numbers, with no per-frame object.
CPU:
- U25 [low] [S] storefront.tsx:741 changes `viewX0`/`viewX1` with every rounded scroll pixel. Storefront re-renders at 15 fps, so during a drag or momentum scroll the `memo` on `SceneOverlays` (room.tsx:564) fails every frame and all 8 SCENE_OVERLAYS entries (slots.tsx:236) re-run their hooks and selectors. That is about 8 component renders × 15/s, roughly 0.1–0.3 ms per frame on an older iPhone, for props nobody reads yet. Idle and non-scrolling shops are unaffected. Fix: pass the span only to the consumer that clamps (jam-overlay) through a small context or a prop of its own, or quantise it (`Math.round(x / 8) * 8`). Either way the other 7 overlays stay memoised.
- U24, U21, U19, U17, U12, U8 (carried) unchanged.
TESTS:
- T110 [S] viewport.test.ts: `overlaySpan` returns null for a non-scrolling shop, `[sx+12, sx+W-12]` for a scrolled one, and stays inside `[0, cw]` at scroll 0 and at maxScroll.
- T109, T104–T105, T103, T94 (carried).
FIXED SINCE LAST REVIEW: n/a (no carried code ID was in scope for the r2 fix round; D513/D510/D506 are critic IDs and are fixed in code)
STILL OPEN FROM LAST REVIEW: C146, A32, C147, C148, U24, A36, A37, C134, C136, C137, C133, A34, A33, A29, U21, U19, U17, M62, U12, U8, C107, T109, T103, T104–T105, T94
```

## Notes on the r2 fix-round hunks

- `looks.ts` `DRIVER_CAPS[q]`: `q` runs from 0 to 3 against a 4-entry `as const` tuple, so there is no undefined path. If `side.drivers` ever goes above 4, `driverCast` still makes only 4 entries. That limit was there before this round.
- `people.tsx:90`: staff still default to mustard and drivers to red. Prop threading goes through the existing `cap` field of `FigureBody`, with no new prop.
- `backdrop.tsx` CLOUDS is a module-level string built once. The D510 comment explains why the change was made.
- `flow.tsx` `momentBody` is a style-only change.
- The `viewX0`/`viewX1` doc comment (slots.tsx:61) says the values are in content pt (`cw` space). Any consumer that works in scene draw space (`useFrame`) has to subtract `shift` and divide by `fit.s`. That is one more reason to put the conversion in viewport.ts (C149).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C146 | medium | U | city-model.ts:32, shop-ui.tsx:71 | Pin from a pies-left number plus founderName; no "Nonna in" in Boston, no string slicing |
| A32 | medium | E | features/types.ts, university-menu, industrial-shifts | Station-rate hook; stop faking jam and prep caps as demand (T94) |
| C149 | low | S | storefront.tsx:741, people.tsx:90 | overlaySpan() helper in viewport.ts; driver cap fallback DRIVER_CAPS[0] |
| U25 | low | S | storefront.tsx:741, room.tsx:564 | Span only to jam-overlay (context or own prop) or quantise; keep 7 overlays memoised while scrolling |
| C147 | low | E | game.ts:570 def, mastery.ts:48,53, jamShare | findHood for unknown ids; drop HOME_CITY defaults; remove nonnaCountdownText alias |
| C148 | low | E | game-store.ts:559 franchise | whenLoaded and return false while loading, so the flow doesn't leave the screen |
| U24 | low | E | game.ts:585 cityOfHood | One lazy Map id→CityDef over CITIES; def O(1) |
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
| T110 | low | S | scene/__tests__/viewport.test.ts | overlaySpan: null when not scrolling, margins, inside [0,cw] at both ends |
| T109 | low | E | home-ids-guard.test.ts | Also walk drawer, goal, city, ad and mastery models |
| T103 | low | N | services/ads.native.ts | Pure createSlotCache with retry, reset, stale tests |
| T104–T105 | low | E | store, cameo tests | T104 E (C135 popup kept, cash not double-counted); T105 S |
| T94 | low | E | service tests | Station-rate hook test, with A32 |

Next IDs: K5, C150, A38, M69, U26, T111
