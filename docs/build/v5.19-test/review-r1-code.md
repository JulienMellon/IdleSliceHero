# v5.19-test r1: code review (full effort, range 20b3797..HEAD)

VERDICT: APPROVED
SUMMARY: The test build follows the strip rule. No cheat path can write `slice-empire/save/v1`, and the normal build costs one add, one multiply and one boolean per tick. The one real leak is the purchase ledger: it is not namespaced, so a test-build "Store purchases succeed" buy of Plus or the starter pack shows up as owned in a normal web build on the same origin. The plan promises that cannot happen.

## The two checks asked for
1. **Strip rule: PASS.** Only two files outside `src/dev/` reach into it: `src/components/game-ui.tsx:28-31` (`require('../dev/panel')`) and `src/store/game-store.ts:61-64` (`require('../dev/cheat-prefs')`). Both sit inside a literal `if (process.env.EXPO_PUBLIC_TEST_MODE === '1') {` block. No file outside `src/dev/` has a static import of `src/dev/`, not even of `test-mode.ts`. The other cheat setters do not touch `src/dev/` and are guarded by the same literal check: `clock.ts:15,20,28`, `game.ts:982`, `purchases.web.ts:22`, `settings.tsx:21`, `game-store.ts:53,54,431,811`. `source-guard.test.ts` enforces this, including a non-vacuous case, and CI runs `check:no-test-mode` on web and iOS.
2. **No cheat writes `slice-empire/save/v1`: PASS.** The store's only save write (`game-store.ts:454`) and its `removeItem` (`:800`) both use `SAVE_KEY`, which is `test-v1` whenever the switch is on. `jumpTo`, `undoJump`, `importSave`, `exportSave` and `resetTestSave` all refuse a key that is not `slice-empire/save/test-` (`jumps.ts:101`, `story-save.ts:18`). `money.ts` and `time.ts` only go through `store.save()`. `RESET_KEYS` holds only test keys. **But** see C158: the purchase ledger is a shared key, and the real build reads it.

BLOCKERS: none.

ISSUES:
- C158 [medium] `src/services/purchases-core.ts:6` `LEDGER_KEY = 'se.purchases.ledger'`, written at `:38`. In the test build, "Store purchases succeed" (`purchases.web.ts:30`) redeems into this un-namespaced localStorage key. A normal web build on the same origin then reads it: Plus at `game-store.ts:728`, Start over grants at `:803`, and Owned in `use-purchase.ts:21`. `PLAN-test-mode.md:27` promises separation "even on a shared origin". The App Store build is not affected (its kv is native). → In `purchases-core.ts` or `purchases.web.ts`, pick the key with the literal check: `process.env.EXPO_PUBLIC_TEST_MODE === '1' ? 'se.purchases.ledger.test' : 'se.purchases.ledger'`. Add it to `RESET_KEYS`.
- C159 [low] `src/dev/cheat-prefs.ts:8` and `story-save-section.tsx` import `../services/purchases.web` by its file name. On web this is the same module as `./purchases`. On the iOS test build that CI already exports, it is a second purchase core that nothing uses, so the toggle silently does nothing. → Export `setTestBuyAnswer` and `testBuyAnswerOn` from `services/purchases.ts` and the platform files, with a no-op on native, and import them from `@/services`.
- C160 [low] `src/dev/jumps.ts:8` repeats the literal `'slice-empire/save/test-v1'` that `game-store.ts:53` holds. `test-mode.test.ts:84` pins it today, but the two can drift. → Put `TEST_SAVE_KEY` in `src/dev/test-mode.ts`, the one static import allowed. `game-store.ts` imports it there, and `jumps.ts` re-exports it.

ARCHITECTURE:
- A41 [low] There are three `JumpHost`/`ResetHost` objects: `jumps-section.tsx:14`, `story-save-section.tsx:30,39`. The jumps one sets the game with a raw `useGame.setState` (no `lastKitchenTap: 0`), while story-save uses `testSetGame`. → One `src/dev/host.ts` that exports `jumpHost` and `resetHost`, with `set = testSetGame`.

MEMORY: (normal build: no new allocation. `gameNow`, `gameSpeed` and `canAfford` add no objects.)
- M71 [low] `src/dev/jumps.ts:27`: `snapshots.json` is 126 KB and holds 14 full `GameState`s. It stays in the require cache, and `groupByCity` makes a second array of the rows. This happens in the test build only. `rebase` uses a JSON round-trip per jump, which is fine. → Accept for now. If a third city doubles the file, load the rows with a per-city `require`.

CPU: (normal build: per 200 ms tick, one `gameSpeed()` call and one multiply, plus one `+ offsetMs` per `gameNow()`. Negligible.)
- U27 [low] `src/dev/story-save-section.tsx:72`: the `nextBeatReason(s.game)` selector runs `nextBeatNow` on every store `set`, which is at least 5 Hz plus taps, the whole time the sheet is open. Each run scans every `city.scenes` entry with `sceneTriggered`, and runs 3600 times during a 1 h Play forward. → Compute the reason once when the panel mounts and again after each action. Alternatively, key it on `seenScenes.length` and `Math.floor(playSeconds)`.

TESTS:
- T115 `scripts/check-no-test-mode.sh`: the marker only proves that `panel.tsx` is absent. → Also grep the normal web and iOS bundles for `test-cheats-v1` (from `cheat-prefs.ts`) and for one string from `snapshots.json`.
- T116 After C158: a test that `LEDGER_KEY` under `EXPO_PUBLIC_TEST_MODE=1` differs from the normal key, and that `resetTestSave` clears it.
- T117 `rebase` (jumps.ts:53): walk every snapshot row and assert that each number which is a wall stamp (within 90 days of `lastSavedAt`) is shifted. Today only the top-level `x.*.at` and `retryAt` are, so a future nested stamp would be missed without any test failing.

FIXED SINCE LAST REVIEW: n/a. No open-note file was touched this step. `shift-model.ts` only got Prettier formatting.
STILL OPEN FROM LAST REVIEW: C156, C151, C154, C157, M69, M70, T114 (carried; lanes S, U, E were outside this step's cards).

## Open notes
| ID | sev | owner | where | fix |
| --- | --- | --- | --- | --- |
| C158 | medium | N | services/purchases-core.ts:6 | Test-namespace LEDGER_KEY with the literal env check; add it to RESET_KEYS |
| C156 | medium | S | storefront.tsx:488, scene/ladder.ts:487 | Milestone speaker from city.founder?.name, not 'Nonna' for any first shop (Boston regression) |
| C159 | low | N | dev/cheat-prefs.ts:8 | Import setTestBuyAnswer from @/services with a native no-op, not purchases.web by file name |
| C160 | low | N | dev/jumps.ts:8, game-store.ts:53 | One TEST_SAVE_KEY in dev/test-mode.ts, imported by the store |
| A41 | low | U | dev/jumps-section.tsx:14, story-save-section.tsx:30 | One dev/host.ts; set via testSetGame |
| M71 | low | N | dev/jumps.ts:27 | 126 KB snapshots resident; split per city if it grows |
| U27 | low | U | dev/story-save-section.tsx:72 | nextBeatReason off the per-set selector; compute on open and after actions |
| T115 | low | N | scripts/check-no-test-mode.sh | Also grep normal bundles for test-cheats-v1 and a snapshot string |
| T116 | low | N | services ledger test | Test-mode ledger key differs and reset clears it |
| T117 | low | N | dev/jumps.ts:53 rebase | Every wall stamp in every snapshot row is shifted |
| C151 | low | U | app/index.tsx:306, slots.tsx:146 | Goal label from bid.name; a11y label from nightOvenLines.name |
| C154 | low | E | features/layers/*.ts hoodOf | Null instead of '' sentinel; early-out in each tick and hook |
| C157 | low | U | report/report-strip.tsx:24 | Founder portrait from firstHood(city) and city.founder, not 'downtown' |
| M69 | low | S | storefront.tsx:529 | Hoist frozen NO_BARKS instead of `?? {}` per frame |
| M70 | low | U | shifts/night-tint.tsx:48 | useMemo nightFeather on L, R, frame width |
| T114 | low | S | ladder / storefront test | Boston North End milestone never speaks as Nonna |

Next IDs: K5, C161, A42, M72, U28, T118
