# v5.17 r2 — code review

Range `8cf1349..HEAD` (the fix round), every source hunk read; tests skimmed. tsc and the suite were not re-run (given as passing). Native paths (`ads.native.ts`, `output.native.ts`) were read, not run: nothing here was verified on a device. No runner for a timing snippet was installed, so the per-frame numbers below are counted from the code, not measured.

```
VERDICT: APPROVED
SUMMARY: The blocker and the high are fixed in the code and pinned by tests: ad buttons reload after a stale or unfilled ad, and only a real background reloads the game. One new medium: the visitor's placement search now runs on every scene frame for the whole 7-day visit.

BLOCKERS:
- none. K1 is fixed: `ready()` asks for a preload when nothing is loaded, `show` preloads on every exit, the port has a 30 s retry floor and a failed SDK init is retried (ad-flow.ts:30-44,78; ads.native.ts:81-91).

ISSUES:
- C134 [low] [app/index.tsx:150] `setBackground` still has its own AppState listener, while _layout.tsx:46 says "the one AppState owner". Two handlers decide "background" with two rules (`isForeground` vs `createLifecycle`). → call `setBackground` from GameRunner's handler on `left` / `returned`; delete the screen's listener.
- C135 [low] [game-store.ts `loadSave`] A real background while the offline popup is open still closes it and pays the cash plain (the save holds `cash + earned`). An ad opened from the popup that sends the player to the App Store ends with `doubleOffline()` false: an ad watched for nothing. Narrower than C126, same loss. → when a popup is open and the new away time is under `offlinePopupSeconds`, keep the popup and hold its cash back again.
- C136 [low] [ads.native.ts:24, ad-flow.ts `ready`] An empty unit id still shows the button before consent, so a mis-set build asks UMP and ATT for no ad. → `ready()` false when `unitId()` is empty (asked in r1, not done).
- C137 [low] [shop-ui.tsx:69; app/index.tsx:113] The view cuts `'Nonna in '` off `lot.pin` to rebuild a label, and `onDrawerBuy` splits a string and casts it back to `Upgrade` / decor kind. → `lotView` returns the pies-to-go text; pass `c.buy` and compare it in a custom `memo` comparator, or keep a typed `Record` of handlers. Also city.tsx:21: the comment promises "or when rewards change"; the key is the second only.
- C138 [low] [audio/output.native.ts:120, 169] Every play spreads `voices` and maps ids (two arrays) to test a cap that is rarely hit; a play that wakes a suspended context never suspends it again until the next `setBus`. → test `voices.size > MAX_VOICES` first; call `syncClock()` from the last voice's `onended`.
- C139 [low] [game-store.ts:347] `afterLoad` callbacks run bare in `finally`: one that throws drops the grants queued behind it and rejects a `void load()`. → try/catch per callback.
- C133 [low] carried: settings.tsx:17 still imports `privacy` from `services/runtime`.

ARCHITECTURE:
- A32 [medium] carried, untouched: station-rate hook instead of faking jam and prep caps as demand.
- A34 [low] carried, and grown: `store/standing.ts` and `grants.test.ts` now also import `applyGrant` from `components/store/store-model`. Move the grant, double, reroll, booster and offline maths to `src/engine/`.
- A33, A29 [low] carried, untouched.

MEMORY:
- M68 [medium] [storefront.tsx:200 `cameoGeom`; scene/cameo.ts:89 `cameoSpot`] Called in render at 15 fps while a visit runs (7 days after day 30). r2 added `fixedPeople(lay)` (3 objects a person, plus a spread copy of each head) and a `fits` test per x: about 44 steps, each a `figureBox`, a tag rect and an `others.map` array, then often a second full pass. By count about 300 to 450 short-lived objects a frame, 5 to 7 thousand a second, against roughly 90 before. Inputs are `lay` (already memoised) and the tag text (changes once a minute). → `useMemo(() => cameoGeom(lay, visitTagText), [lay, visitTagText])`.
- M60 partly fixed: `queueSizes` and both pills' words are memoised. What is left is in M68 and U21.
- M67 fixed in code: decoded bytes are counted and stinger preloads stop past 20 MB. The on-device reading stays on the device checklist.
- No leak found: `Epochs` maps are keyed by sound id (bounded by the catalog), `ICONS` by icon kind (about 40), `afterLoad` is drained on every load.

CPU:
- U21 [low] [storefront.tsx:311 `stepMoments`; :251 `moreTagRect`] `stepMoments` runs every frame: three rate calls and about 8 objects to compare values that only move with `key`. `moreTagRect` rebuilds every seated face and canopy box each frame while the "+N" pill shows. → run `stepMoments` only when `key` changed since the last frame; memo `moreTagAt` on `[lay, moreRaw]`.
- U19 [low] narrowed: the HUD tag is cheap now. layer-stack.tsx:131 still runs `rivalView` on every 5 Hz set, and since C125 the `waiting` phase prices the target too. → select `rivalOpen` plus the challenge fields; price on open.
- U20 fixed: the context suspends in the background and when both buses are silent. The 200 ms tick still stops in the background.
- U9 fixed (City repaints at 1 Hz). The `eslint-disable` opts City out of React Compiler; harmless at 1 Hz.
- U8, U17, U12 [low] carried, untouched.

TESTS:
- T103 ads.native slot cache: move `cached / loading / lastTry` into a pure `createSlotCache({ load, now })` and test: no second load inside 30 s after a failure; a shown ad resets the floor; a stale slot reloads. Today the floor is only in the native file, which Jest cannot load.
- T104 store: offline popup open, background under the popup threshold, `load()` → popup kept and `doubleOffline()` pays (C135).
- T105 cameo: `cameoGeom` returns the same object for the same `lay` and tag once memoised at the call site; or a cap on `figureBox` calls per `cameoSpot`.
- T94 carried with A32.

FIXED SINCE LAST REVIEW: K1, C126, C127, C128, C129, C130, C131, C132, C116, C117, C124, C125, C122, C118, A28, M65, M66, M67, M63, M60, U10, U11, U9, U13, U18, U20, T80, T90, T91, T95, T96, T97, T98, T99 (as lifecycle.test), T100, T101, T102
STILL OPEN FROM LAST REVIEW: C133, A32, A33, A34, A29, C107, U19 (narrowed), U17, M62, U12, U8, T94
```

Notes on what I could not confirm: C126's fix depends on iOS reporting the tracking prompt as `inactive` only, and K1's on AdMob allowing a load while an ad is on screen; both are standard behaviour but need the device checklist. U13 and U18 were already fixed before this range (index.tsx:194, slots.tsx:146); the r1 table carried them by mistake.

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| M68 | medium | S | storefront.tsx:200, scene/cameo.ts cameoSpot | Memo cameoGeom on lay + tag text; it allocates ~300–450 objects a frame during a 7-day visit (T105) |
| A32 | medium | E | features/types.ts, university-menu, industrial-shifts | Add a station-rate hook; stop faking jam and prep caps as demand (T94) |
| C134 | low | U | app/index.tsx:150, _layout.tsx:46 | Move setBackground into GameRunner's AppState handler; delete the screen's listener |
| C135 | low | E | game-store.ts loadSave | Keep an open offline popup across a short background so its 2x ad still pays (T104) |
| C136 | low | N | services/ads.native.ts:24, ad-flow.ts ready | ready() false when the unit id is empty; no UMP or ATT for no ad |
| C137 | low | U | shop-ui.tsx:69, app/index.tsx:113, city.tsx:21 | lotView returns the pies-to-go text; typed buy handler, no split and casts; fix City comment |
| C138 | low | A | audio/output.native.ts:120,169 | Check voices.size before copying; syncClock when the last voice ends |
| C139 | low | E | game-store.ts:347 afterLoad | try/catch each queued callback so one throw can't drop the grants behind it |
| C133 | low | N | app/settings.tsx:17, DEVICE-CHECKLIST | Opt-out through the services index; note otherAudio is null without SliceAudioSession |
| A34 | low | E | game-store.ts, store/standing.ts imports | Move grant, double, reroll, booster, offline maths and offerWaits from components to engine |
| A33 | low | E | game.ts imports rival + scenes | Move challengeOffered + migrateStory to engine/story.ts; break game↔rival cycle |
| A29 | low | S | scene FurnitureSource | Make the remaining optional fields required |
| U21 | low | S | storefront.tsx:311, :251 | Run stepMoments only when key changed; memo moreTagAt on lay + text |
| U19 | low | U | layer-stack.tsx:131 | Select rivalOpen plus challenge fields; stop pricing rivalTarget on every 5 Hz set |
| U17 | low | E | service.ts shopValueMult/flowOf | Reuse featureMults' demand; avoid O(F²) hook calls |
| M62 | low | E | features/mastery.ts:107, recipes.ts:259 | Early-out settle on a cheap per-shop fingerprint |
| U12 | low | E | game.ts tick, recipes.ts ownedIn | M62 early-out; cache per-shop recipe count on `owned` identity |
| U8 | low | A | audio/director.ts warmRare, refreshMusic | Carried: memo on scene keys |
| C107 | low | E | content/tuning.ts Uptown | Check goal bar and "upgrades ×N" tasks don't point at multi-day buys |
| T103 | low | N | services/ads.native.ts | Pure createSlotCache with tests for the retry floor, reset after a show, stale reload |
| T104–T105 | low | E | store, cameo tests | See TESTS (T104 E; T105 S) |
| T94 | low | E | service tests | Station-rate hook test, with A32 |

Next IDs: K2, C140, A35, M69, U22, T106
