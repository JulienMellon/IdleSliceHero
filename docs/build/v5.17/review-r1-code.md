# v5.17 r1 — code review

Range `aff34d1..HEAD`, paths `src/services src/store src/app src/audio app.json` (plus direct callers in `src/components/store`). tsc and the suite were not re-run. Native paths were read, not run: nothing here was verified on a device.

```
VERDICT: CHANGES REQUESTED
SUMMARY: The service seams are well cut (pure consent machine, ledger-first purchases, opt-out checked at every send, stubs behind one import), and the mixer/output split is a real improvement. But on iOS the ad buttons disappear for the session after one stale or unfilled ad, and the reload-on-every-`active` in GameRunner now collides with the tracking prompt and with purchase grants.

BLOCKERS:
- K1 [services/ad-flow.ts:27 `ready`, ads.native.ts:139 `preload`, 163 `showAd`] After the first show `umpDone` is true, so `ready()` is `fresh()`. `preload()` runs only after a show that reached CLOSED. Three ways to end with `cached === null` and nobody loading: the first load gets no fill or times out (`showAd` returns before `preload()`); the preload after a show fails; the cached ad passes `STALE_MS` (50 min). `AdButton` returns null when `!plus && !ready`, so every placement vanishes until the app is killed. The stale case is the normal one for an idle game: the player comes back hours later and `offline_2x` is not there. → `loaded()` starts a preload when not fresh (with a retry floor, e.g. 30 s, since buttons poll every 4 s); call `preload()` on every exit of `showAd` and from `adsTutorialDone()` (its comment already promises that); make `ready()` false when `unitId()` is empty so a mis-set build never shows UMP + ATT for no ad.

ISSUES:
- C126 [high] [app/_layout.tsx:44 AppState handler; store `load`] `load()` runs on every `active`, including after `inactive` only. `inactive` saves `cash + offline.earned`; the reload then finds a seconds-old save, so `offline` becomes null and the cash is paid. The iOS tracking alert is exactly inactive→active, and it shows before the first ad: a first ad taken from the welcome-back popup closes the popup under the prompt, the ad plays, and `doubleOffline()` returns false. The player watched an ad for nothing. (Control Center did the same silent collect before; now it costs a reward.) → reload only when the app really was in `background` (one flag in GameRunner; ticks keep running while inactive, so there is nothing to catch up). Move the `setBackground` listener from `GameScreen` (index.tsx:133) into the same handler: one AppState owner.
- C127 [medium] [game-store.ts `receiveGrant`, `doubleClaim`, ad benefits vs `load`] A grant that lands while `load()` is awaiting `getItem` is overwritten by the older save, and the ledger already holds the transaction: paid diamonds are gone. The window is a few ms after a store sheet closes, small but unrecoverable. → keep the in-flight load as a module promise; `receiveGrant` (and the ad benefits) await it before applying.
- C128 [medium] [services/index.ts:22,33 vs store/ad-model.ts `runAd`, store/use-purchase.ts:25] `ads.show` and `purchases.buy` from `@/services` already track; `runAd` and `usePurchase` track again. Every `ad_started`, `ad_completed` and `iap_purchased` is sent twice. → drop the callers' tracks (wiring.test pins the service side).
- C129 [medium] [game-store.ts `resetGame`] Start over wipes `rewards.cosmetics`; the ledger keeps `product:starter_pack`, so neither start-up sync nor Restore pays the Founder awning again. A paid item is lost for good. → after reset, apply `restoredPart(GRANTS[id])` for each `purchases.owned()` (export one `standingGrants()` from services).
- C130 [medium] [store/use-purchase.ts:21] `purchases.buy` is called inside a `setBusy` updater. Updaters must be pure; StrictMode double-invokes them, so a dev build queues two real purchases. → guard with a ref, call `buy` outside the updater.
- C131 [low] [_layout.tsx:63] `session_start` fires on every `active` (prompts, store sheet, Control Center) while `session_end` fires only on `background`. → track start only after a background.
- C132 [low] [audio/output.native.ts `play`, `stop`, `unload`] A play still decoding is not a voice, so `stop(id)` (Skip, a scene opening) misses it and the stinger sounds afterwards; `unload` during a decode lets the `then` put the buffer back. → per-id epoch checked in both continuations.
- C133 [low] [settings.tsx:17] Imports `privacy` from `services/runtime`; expose `analytics.optedOut()` through the index. `otherAudio()` is always null until `SliceAudioSession` exists, so the hushed-Music path is dead on device: say so in the checklist.

ARCHITECTURE:
- A34 [low] game-store.ts imports game-state transforms from `components/store/ad-model`, `store-model` and `components/endgame/stack-model`, `banner-state`. Move `applyGrant`, `applyDouble`, `rerollDaily`, `repairByAd`, `grantDailyBooster`, the offline maths and `offerWaits` to `src/engine/`; components keep labels and view rules. The store then reads no UI module.

MEMORY:
- M67 [low] [output.native.ts `buffers`] Stingers are now decoded PCM: 9 preloaded × ~5 s × ~0.35 MB/s (stereo float32, 44.1 kHz) ≈ 16 MB per key, against compressed streams before. Fine on a 3 GB phone; `LAUNCH_PLAYER_BUDGET` counts players, not bytes. → log `duration × channels` per buffer once on device; preload only the four commonest kinds if it passes 20 MB.
- No new per-frame churn in range: `AdButton` is memoised, its 4 s poll sets an unchanged boolean; `boosterAd` selector returns a boolean; `usePerfMarks` is a no-op effect unless PERF.

CPU:
- U20 [low] [output.native.ts] The `AudioContext` is never suspended: its render thread runs with Sound off and through hours of idle play. → `ctx.suspend()` on background and when the Sound pref is off, `resume()` before a play; measure on the device checklist.
- Good: the 200 ms tick timer now stops in the background. Director `warmRare` still runs on every store set (U8, carried).

TESTS:
- T98 ad-flow/ads: after one unfilled show `ready()` becomes true again once a retry loads; a stale slot triggers a reload; an empty unit id is never ready.
- T99 store: offline popup open, save, `load()` after a 3 s gap with no background → `offline` kept; `doubleOffline()` still pays.
- T100 store: `receiveGrant` during an in-flight `load()` → diamonds present after it resolves.
- T101 AdButton through `@/services`: one `ad_started`, one `ad_completed`; `usePurchase`: one `iap_purchased`.
- T102 store: `resetGame()` with `starter_pack` owned keeps `awning-founder`; Plus stays.

FIXED SINCE LAST REVIEW: none (carried rows sit outside this range's work; store and app rows C124, U13, M63, U9, U8 re-checked: unchanged)
STILL OPEN FROM LAST REVIEW: C116, C117, A32, C124, C125, U19, C122, C118, C107, A33, M66, U17, U18, M65, M62, U12, M63, U13, A28, A29, M60, U10, U11, U8, U9, T80, T90–T91, T94–T97
```

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| K1 | blocker | N | services/ad-flow.ts:27, ads.native.ts:139,163 | Ad buttons vanish after a stale or unfilled ad: preload from `loaded()` with a retry floor, on every showAd exit, and at tutorial end (T98) |
| C126 | high | U | app/_layout.tsx:44, index.tsx:133 | Reload only after a real background; ATT prompt now closes the offline popup and voids the 2x ad; one AppState owner (T99) |
| C127 | medium | E | game-store.ts receiveGrant, load | Grants and ad benefits await the in-flight load, so an older save can't overwrite paid diamonds (T100) |
| C128 | medium | U | store/ad-model.ts runAd, use-purchase.ts:25 | Drop caller tracks: services index already sends ad_started, ad_completed, iap_purchased (T101) |
| C129 | medium | E | game-store.ts resetGame | Re-apply standing grants of owned products after reset; Founder awning is lost today (T102) |
| C130 | medium | U | store/use-purchase.ts:21 | Call purchases.buy outside the setBusy updater; guard with a ref |
| C131 | low | U | app/_layout.tsx:63 | session_start only after a background, not on every active |
| C132 | low | A | audio/output.native.ts play, stop, unload | Per-id epoch so stop and unload cancel a play or buffer still decoding |
| C133 | low | N | app/settings.tsx:17, DEVICE-CHECKLIST | Opt-out through the services index; note otherAudio is null without SliceAudioSession |
| A34 | low | E | game-store.ts imports | Move grant, double, reroll, booster, offline maths and offerWaits from components to engine |
| M67 | low | A | audio/output.native.ts buffers | Measure decoded stinger bytes on device (~16 MB a key); trim preload past 20 MB |
| U20 | low | A | audio/output.native.ts ctx | Suspend the AudioContext in background and with Sound off; resume before a play |
| T98–T102 | low | N | services, store tests | See TESTS (T98 N; T99, T100, T102 E; T101 U) |
| C116 | medium | E | game.ts:664 shopEarnings, events.ts:58,81 | Readouts flicker ×1.5 after each save during events; default now = event stamp; key boost too (T90) |
| C117 | medium | E | jest.config.js, game.ts migrate | Jest setupFiles imports features; migrate keeps unknown x keys; dev warn if FEATURES empty (T91) |
| A32 | medium | E | features/types.ts, university-menu, industrial-shifts | Add a station-rate hook; stop faking jam and prep caps as demand (service misreads wanted) (T94) |
| C124 | low | E | game-store.ts bonusBlocked | Put layerHold in the Pick, not optional; partial states must not drop the hold (T96) |
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
| U8 | low | A | audio/director.ts warmRare, refreshMusic | Carried: memo on scene keys |
| U9 | low | U | app/city.tsx | Carried: memo on scene keys |
| T80 | low | A | audio perkDuckSeconds | Resume test |
| T90–T91 | low | E | engine tests | Event-stamp readout key; features registered in Jest setup |
| T94–T97 | low | E | service, teaser, store, rival tests | See v5.16 TESTS |

Next IDs: K2, C134, A35, M68, U21, T103
