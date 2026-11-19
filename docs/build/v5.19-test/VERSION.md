# v5.19-test — the test build (cheats for Julien's own playtesting)

**Scope:** a separate web build of Slice Empire, switched on at export by `EXPO_PUBLIC_TEST_MODE=1`, with a Test panel (tap the red TEST pill) that can buy anything regardless of cash, jump to any neighbourhood, move the clock forward and drive the story and save. The normal build, the App Store build and the existing public playtest artifact contain none of it. Design: `docs/PLAN-test-mode.md` (approved; its section 6 defaults are decided). A tooling step like `v5.15-loop`: it does not bump the game version, and STATE goes back to `version: 5.20` at close.

## What the code says (re-checked by grep on `20b3797`; where it differs from the plan, the code wins)
- `canAfford` (`src/engine/game.ts:977`, null-safe) and `pay` (`:980`) exist. The two bypasses are still there: `src/components/sidewalk-row.tsx:207` (`game.cash >= hireCost`) and `src/engine/night-oven.ts:95` (`s.cash >= price`).
- `src/engine/rewards.ts:311` has its own local `pay(s, cash)` that **gives** cash (task rewards). It is not a spend and gets no free-buy branch.
- `src/store/game-store.ts:355,365` subtract cash when a claim is undone. Not a spend; leave them.
- Diamond checks: `rewards.ts:501` (streak repair), `vanity.ts:30` (buy), `rewards-ui.tsx:628` (`canRepair`), `endgame/shop-model.ts:57` (`'buy' | 'poor'`). Diamonds live at `s.rewards.diamonds`.
- `src/engine/clock.ts` is one line: `gameNow = () => Date.now()`; 66 `gameNow()` sites, 25 `Date.now()` left.
- **C155 is already fixed** (v5.19 r2, card R1L): `storefront.tsx:231` reads `gameNow()`. The plan's "fix C155 first" step is dropped.
- Cities: `home` and `boston` only (`src/content/cities/`). Neighbourhoods are `cityOf(g).neighbourhoods`.
- Save key `slice-empire/save/v1` is `SAVE_KEY` in `src/store/game-store.ts:51`; prefs key `PREFS_KEY` is in `src/components/store/store-model.ts:138`.
- Settings prints `Slice Empire v{APP_VERSION}` (`src/app/settings.tsx:174`), not "Build X.Y".
- `src/dev/` does not exist yet. CI (`.github/workflows/ci.yml`) runs `tsc`, `npx expo lint`, `prettier --check "src/**/*.{ts,tsx}" …` and `npm test`; `eslint.config.js` ignores `dist/**` but not a second export folder.
- `scripts/screenshots.py` expects the export in `dist/` and runs every `scripts/fixtures/NN_*.py`.

## Cards
| ID | Lane | What | Card |
| --- | --- | --- | --- |
| X1 | N + U | Gate and shell: `TEST_MODE`, test save keys, TEST pill, empty sheet, Settings label, source guard, the test export and its fixture | `card-X1.md` |
| X2 | E | Money and time: free buys, diamonds, income buttons, cash → 0, purchase toggle; clock offset, Away for, Next day / Monday, Play forward, speed | `card-X2.md` |
| X3 | E (+ U for the list) | Jumps: `scripts/test-snapshots.ts`, `src/dev/snapshots.json` and its load test, per-city Jump list, backup / undo, build next shop | `card-X3.md` |
| X4 | U (store actions E) | Story and save tools: next beat now, skip tutorial, export / import, reset test save | `card-X4.md` |

## Waves
1. **X1** alone (it creates `src/dev/`, the sheet the others fill, and the test export).
2. **X2 ‖ X3** (two programmers; they share only the append-only files below).
3. **X4.**
4. Verify (both exports, see below), commit, review, fix rounds, close.

## Verify for this step
- Run the README section 5 block with **`V=5.19`** (APP_VERSION does not change) and `L=v5.19-test` (r2: `v5.19-test-r2`, r3: `v5.19-test-r3`), `P=v5.19-r2`. The review index must show **0 new and 0 changed shots** (the normal build is unchanged), report `True 0 []`, layout `0`.
- Then the guard on the normal bundle: `grep -rl "TEST MODE PANEL" dist/ | head -3` must print nothing.
- Then the test export and its shots (from card X1):
  ```
  EXPO_PUBLIC_TEST_MODE=1 npx expo export --platform web --output-dir dist-test > /tmp/export-test.log 2>&1; tail -2 /tmp/export-test.log
  SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode timeout 900 python3 -u scripts/screenshots.py v5.19-test-panel > /tmp/shots-test.log 2>&1
  python3 -c "import json;r=json.load(open('screenshots/v5.19-test-panel/report.json'));print(r['loaded'],len(r['errors']),r['errors'][:3])"
  ```
  Must print `True 0 []`. These panel shots are the only new shots the critic sees.

## Shared, append-only for this step
`src/dev/panel-sections.ts` (one line per section: X2 money and time, X3 jumps, X4 story and save), `src/store/game-store.ts` (each card adds its own test-mode actions in one block marked with its card ID), `scripts/fixtures/test-mode/*.py` (one file per card). Re-read a shared file immediately before editing it.

## Defaults
Decided in the plan (section 6), not asked: slot `5.19-test` before v5.20; free buys ON by default in the test build; a separate private artifact; speeds 1× / 4× / 16×; snapshots from the greedy sim; the need-text is hidden while free buys are on (the goal bar is left as is).

Added by this planning session (from the code):
- **How the switch is stripped.** Metro collects `require()` calls before minifying, so a `require('../dev/…')` behind an *imported* `TEST_MODE` constant still ships the panel. Every file outside `src/dev/` that reaches into `src/dev/` does it with `if (process.env.EXPO_PUBLIC_TEST_MODE === '1') { … require('@/dev/…') … }` written literally in that file (Expo inlines the env var, so the branch folds to `if (false)` and the require is never collected). The only static import allowed is `src/dev/test-mode.ts` itself, which holds no panel code. The `TEST MODE PANEL` bundle grep proves it on every verify, and card X1's `npm run check:no-test-mode` proves it in CI on every push.
- **Every platform, switch-driven.** Test mode works wherever the switch is on (web now, a phone test build later, plan section 5). The App Store build is safe because it is made without the switch: CI checks that a normal iOS export has no panel and that `eas.json`'s `production` profile never sets the switch.
- **Engine-side cheat state** (the free-buy flag, the clock offset, the speed) is module state in the engine file it changes, set through one setter that does nothing unless the same env check holds. The values persist in the test prefs only.
- **APP_VERSION stays `5.19`.** The Settings line in the test build reads `Slice Empire v5.19 · TEST`.
- **Test export folder** `dist-test/`, test fixtures in `scripts/fixtures/test-mode/`, chosen by `SHOTS_DIST` / `SHOTS_FIXTURES` env vars read in `scripts/shots_lib.py` (defaults `dist` and `scripts/fixtures`, so the normal run is unchanged). `dist-test/` goes in `.gitignore` and in `eslint.config.js` ignores.
- **Diamond helpers** `canAffordDiamonds(s, n)` and `payDiamonds(s, n)` live next to `canAfford`/`pay` in `src/engine/game.ts`.
- **Snapshot count:** one per neighbourhood "just built" plus one "city complete" per city (home and Boston: about 14). A later city pack gets rows by re-running the script, not by code.

## Reviews
- r1: `codecritic` **full effort**, range `<codecritic_range_start>..HEAD`, paths `src/dev src/engine/clock.ts src/engine/game.ts src/engine/rewards.ts src/engine/vanity.ts src/engine/night-oven.ts src/store src/components/sidewalk-row.tsx src/components/rewards-ui.tsx src/components/endgame/shop-model.ts src/components/game-ui.tsx src/app/settings.tsx scripts/test-snapshots.ts`; keep the session's model (`src/store` and the save keys). Ask it to check the strip rule above and that no cheat path can write to `slice-empire/save/v1`.
- r1: `critic` **low effort** on `screenshots/v5.19-test-panel/` only, plus the 0-new-0-changed result of the normal verify (`screenshots/v5.19-test/review/index.json`). Launch with `model: sonnet`.
- No `storycritic`, no `audiocritic`.
- r2, r3: medium re-checks on `model: sonnet`, except a codecritic re-check whose open notes touch `src/store` (session's model).

## Fix routing
| Owner | Cards |
| --- | --- |
| N | X1 |
| E | X2 for money, clock and tick; X3 for snapshots, the loader and backup / undo |
| U | X1 for the pill, sheet and Settings line; X3 for the Jump list; X4 for the story and save rows |
| S, T, A | none expected (no card touches their files): carry and say so |

## Close
After APPROVED, set `codecritic_range_start` to this step's closing commit. The CRITICLOG / CODELOG lines use `v5.19-test`. STATE goes to `version: 5.20` (see `docs/build/sessions/S6-v5.19-test.md`).
