# Test-build fixtures
One file per card of v5.19-test (`x1_panel.py`, ...), written like the fixtures one folder up (`scripts/fixtures/README.md`). They run **only** against a build
made with `EXPO_PUBLIC_TEST_MODE=1`, so they are never picked up by a normal `screenshots.py` run: point the run at them with two env vars.
```
npm run export:test > /tmp/export-test.log 2>&1        # EXPO_PUBLIC_TEST_MODE=1 npx expo export --platform web --output-dir dist-test
SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode python3 scripts/screenshots.py dev --only x1_panel
```
`SHOTS_DIST` (default `dist`) is the export the static server serves; `SHOTS_FIXTURES` (default `scripts/fixtures`) is the folder whose `*.py` run.
The test build saves under `slice-empire/save/test-v1`, so a fixture here seeds that key (see how `x1_panel.py` sets `shots_lib.KEY`).
`00_boot.py` here boots a fresh test build and sets `report["loaded"]`, so a test-mode run prints `True 0 []` like the normal one.
