# Card X1 — gate and shell (v5.19-test, lanes N + U)

**Goal:** an export made with `EXPO_PUBLIC_TEST_MODE=1` shows a red TEST pill that opens an empty Test panel, saves under its own keys and says `· TEST` in Settings; the normal export is byte-for-byte the same game (0 changed shots) and contains no panel code. In v1 the cheats exist only on the web: an iPhone build has none of it even if the switch is set by mistake (the TestFlight test build is a later card).

**Read first:** `docs/PLAN-test-mode.md` sections 1 and 2 (the panel's outline only), and the "What the code says" and "Defaults" sections of `docs/build/v5.19-test/VERSION.md`. The strip rule there is the core of this card.

## Files
- Own: `src/dev/test-mode.ts` (new), `src/dev/panel.tsx` (new: the bottom sheet, its header and the marker string), `src/dev/panel-sections.ts` (new, the registry the other cards append to), `src/dev/__tests__/source-guard.test.ts` (new), `src/dev/__tests__/test-mode.test.ts` (new), `src/dev/README.md` (new, ten lines: the strip rule and how to add a section), `scripts/shots_lib.py` (the `SHOTS_DIST` / `SHOTS_FIXTURES` env vars only), `scripts/fixtures/test-mode/README.md` and `scripts/fixtures/test-mode/x1_panel.py` (new), `.gitignore` and `eslint.config.js` (add `dist-test/`; `.gitignore` also adds `.env` and `.env.*`), `package.json` (scripts `export:test` and `check:no-test-mode`), `scripts/check-no-test-mode.sh` (new), `.github/workflows/ci.yml` (one step), `src/dev/__tests__/env-files.test.ts` (new).
- Shared, append-only: `src/store/game-store.ts` (the save-key line and the prefs-key choice, in a block marked `X1`), `src/components/game-ui.tsx` (the pill in `Hud`, one guarded block), `src/app/settings.tsx` (the version line, one guarded expression), `src/components/store/store-model.ts` (a `TEST_PREFS_KEY` beside `PREFS_KEY`).
- Do not touch: `src/engine/**` (cards X2, X3), every other `src/components/**` file, `scripts/screenshots.py`'s fixture order, any existing fixture.

## Steps
- [ ] **1. The flag, web only.** `src/dev/test-mode.ts`: `export const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === '1' && Platform.OS === 'web';` and nothing that pulls in UI. Everything outside `src/dev/` that needs the panel writes that same two-part condition literally in its own file (VERSION.md "How the switch is stripped"); Metro inlines both `process.env.EXPO_PUBLIC_*` and `Platform.OS`, so an iOS build drops the branch even with the env var set. Card X2's engine setters use the same condition.
- [ ] **2. Keys.** In the test build the save key is `slice-empire/save/test-v1` and the prefs key `slice-empire/store/test-v1` (chosen where `SAVE_KEY` and `PREFS_KEY` are read; the normal values are unchanged). A test proves a test-mode store never reads or writes `slice-empire/save/v1`.
- [ ] **3. The pill.** In `Hud` (`src/components/game-ui.tsx:256`), under the literal guard: a red pill reading `TEST`, drawn 40 pt, with a 44 pt touch area (the tap rule in `src/components/tap-targets.ts`); tapping it opens the panel. It must not push the HUD row: overlay it.
- [ ] **4. The sheet.** `src/dev/panel.tsx`: a bottom sheet, tap-only (no drag needed to use any row), scrollable, with a header `TEST MODE PANEL` (this exact string is the bundle marker), a close button, and one titled block per entry in `panel-sections.ts`. Ship with the four section titles (Money, Neighbourhoods, Time, Story & save) and an empty body each, so X2 to X4 only append.
- [ ] **5. Settings.** `src/app/settings.tsx:174` reads `Slice Empire v{APP_VERSION} · TEST` in the test build; unchanged otherwise.
- [ ] **6. The test export.** `package.json` script `export:test` = `EXPO_PUBLIC_TEST_MODE=1 npx expo export --platform web --output-dir dist-test`. `scripts/shots_lib.py` serves `$SHOTS_DIST` (default `dist`) and runs fixtures from `$SHOTS_FIXTURES` (default `scripts/fixtures`). `dist-test/` added to `.gitignore` and to `eslint.config.js` ignores.
- [ ] **7. Fixture.** `scripts/fixtures/test-mode/x1_panel.py`: boot the test build, `expect()` the pill, shoot the HUD with the pill, tap it, shoot the open panel, open Settings and shoot the version line. The README there says these run only with the env vars above.
- [ ] **8. Proof the normal build is clean.** Run the normal export and `grep -rl "TEST MODE PANEL" dist/` (must print nothing) and `grep -rl "TEST MODE PANEL" dist-test/` (must print a file). Put both commands in your report.
- [ ] **9. The leak check, on every push.** `scripts/check-no-test-mode.sh` (run by `npm run check:no-test-mode`) exits non-zero with a one-line reason if any of these fail: (a) a normal web export to a temp folder has no `TEST MODE PANEL`; (b) an **iOS** export made **with** `EXPO_PUBLIC_TEST_MODE=1` (`npx expo export --platform ios --output-dir <tmp>`) has no `TEST MODE PANEL` (`grep -ral`: the bundle is Hermes bytecode), which proves the web-only rule holds even when the switch is set by mistake; (c) no `.env*` file in the repo and no `eas.json` (if one exists) sets `EXPO_PUBLIC_TEST_MODE`. Add it to `.github/workflows/ci.yml` as one step after `npm test`: `- run: npm run check:no-test-mode`. If the iOS export can't run on the CI image, report it as `Needs:` with the error line; do not drop part (b).
- [ ] **10. No stray `.env`.** `.gitignore` adds `.env` and `.env.*` (keep `.env*.local`; `expo-env.d.ts` is not an env file).

## Tests that must exist
- `source-guard.test.ts`: walks `src/` (excluding `src/dev/` and `__tests__`) and fails if any file imports or requires a `src/dev/` path other than `src/dev/test-mode`, unless the require sits inside a block opened by the literal `process.env.EXPO_PUBLIC_TEST_MODE === '1'` in the same file. One failing example per rule in the test's own fixtures.
- `test-mode.test.ts`: `TEST_MODE` is false with the env var unset and with `'0'`, true with `'1'` (use `jest.isolateModules`).
- Keys: test build uses both test keys; normal build uses the v1 keys (store test, one assertion each).
- `TEST_MODE` is false on `ios` and `android` with the env var set to `'1'` (mock `Platform.OS`).
- `env-files.test.ts`: no file matching `.env*` at the repo root and no `eas.json` mentions `EXPO_PUBLIC_TEST_MODE`.

## Checks
`npx tsc --noEmit`; `npx expo lint`; `npx prettier --check "src/**/*.{ts,tsx}"`; `npx jest src/dev src/store`; the two greps in step 8; `npm run check:no-test-mode` (must exit 0).

## Fixtures
`scripts/fixtures/test-mode/x1_panel.py` (new; runs against `dist-test/`). After your checks pass: `npm run export:test > /tmp/export-test.log 2>&1 && SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode python3 scripts/screenshots.py dev --only x1_panel`. Then also run the normal `npx expo export --platform web` and confirm `00_boot` still looks the same.

## Report
Standard format, plus: the output of the two greps and of `check:no-test-mode`, and the file list of every place outside `src/dev/` you guarded.
