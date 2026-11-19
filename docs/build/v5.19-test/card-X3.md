# Card X3 — neighbourhood jumps (v5.19-test, lane E; the list is U)

**Goal:** from the Test panel Julien can jump to any neighbourhood of any city "just built" (or the city complete) with the state a real greedy player has at that moment, undo the last jump, and force the next shop open; a tuning change that breaks the snapshots fails a test.

**Read first:** `docs/API.md` (`src/content/cities`, `cityOf`); `docs/PLAN-test-mode.md` section 2 ("Neighbourhoods"); `docs/build/v5.19-test/VERSION.md` ("Defaults"); `src/dev/README.md` (card X1).

## Files
- Own: `scripts/test-snapshots.ts` (new), `src/dev/snapshots.json` (generated, committed), `src/dev/jumps.ts` (new: loader, backup, undo, build-next), `src/dev/jumps-section.tsx` (new: the list UI, lane U), `src/dev/__tests__/snapshots.test.ts` and `src/dev/__tests__/jumps.test.ts` (new), `package.json` (one script, `test-snapshots`).
- Shared, append-only: `src/dev/panel-sections.ts` (one line: Neighbourhoods), `src/store/game-store.ts` (test-mode actions in a block marked `X3`), `scripts/fixtures/test-mode/x3_jumps.py`.
- Read only, do not change: `scripts/review/sim2.ts`, `scripts/pacing-fit.ts`, `src/engine/game.ts`, `src/content/cities/**`.
- Do not touch: anything X2 or X4 own.

## Steps
- [ ] **1. The script.** `scripts/test-snapshots.ts`: run `run('continuous', …)` from `scripts/review/sim2.ts` (line 165) with its `onSecond` hook (line 173) for the home city, and `franchiseRun()` from `scripts/pacing-fit.ts` (line 887) for Boston (if `franchiseRun` gives only day counts and no per-second hook, add the hook by calling `run` the way `franchiseRun` does, inside the script; do not edit the sim files). Capture the state the second each shop is built, and once when the city's last finale has been seen. Iterate cities from `src/content/cities/index.ts`, neighbourhoods from `cityOf(g).neighbourhoods`, so a later city pack gets rows by re-running the script. Write `src/dev/snapshots.json`: `{ saveVersion, made, rows: [{ city, hood, label, state }] }` (`saveVersion` = `SAVE_VERSION`, `game.ts:56`) (about 14 rows). Print one line per row (label, cash, playSeconds).
- [ ] **2. The loader.** `jumps.ts` `loadSnapshot(row, now)`: `migrate(row.state, now)` (`game.ts:575`), with every timestamp in the state rebased so the snapshot's own clock equals `now` (gameNow, including X2's offset).
- [ ] **3. Backup and undo.** Before a jump the current save is written to `slice-empire/save/test-v1-backup`; `Undo last jump` restores it and is disabled when the slot is empty. One level only.
- [ ] **4. The list** (`jumps-section.tsx`): grouped by city name, one row per snapshot ("<hood> — just built", "<city> — complete"), tap → confirm → jump. Every row 44 pt tall.
- [ ] **5. Build next shop now (ignore story lock)**: builds the next neighbourhood in `cityOf(g).neighbourhoods` order through the normal build path with the story lock skipped; labelled `may break story order`.

## Tests that must exist
`snapshots.test.ts`: every row loads under the current `migrate` without throwing, keeps its city and hood, and has the shop it claims built; the file's `saveVersion` equals `SAVE_VERSION`, and each row's next purchase still has a finite cost under the current tuning (so a save bump or a tuning change that invalidates the file fails here, with a message saying to run `npm run test-snapshots`). `jumps.test.ts`: jump then undo gives back the exact save; undo with no backup is refused; the jump never writes `slice-empire/save/v1`; build-next builds exactly one shop.

## Checks
`npx tsc --noEmit`; `npx jest src/dev`; `npx tsx scripts/test-snapshots.ts | tail -15` (the row lines).

## Fixtures
`scripts/fixtures/test-mode/x3_jumps.py` (new): the Neighbourhoods section open; after a jump to Boston's first neighbourhood, the shop screen; the Undo row enabled. Run it as card X1 says (`SHOTS_DIST=dist-test SHOTS_FIXTURES=scripts/fixtures/test-mode … --only x3_jumps`).

## Report
Standard format, plus: the row lines the script printed.
