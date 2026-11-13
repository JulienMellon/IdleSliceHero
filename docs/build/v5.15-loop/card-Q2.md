# Card Q2 — one fixture at a time (v5.15-loop, scripts)

**Goal:** any group of shots can be taken by itself in about a minute, and a fixture fails loudly when it did not reach the state it claims to show.

**Why (measured 2026-11-13, `docs/PLAN-loop-improvements.md`):** the full run takes 465 s for 92 shots. Shots 00 to 55 live in one 484-line script, so nothing can be retaken alone. Three v5.15 critic notes were about fixtures that shot the wrong state (G103: the won state never captured; D467: a "behind pace" fixture that was ahead; D459: no bark visible in shot 70), and one verify failed on a fixture (`7e5dd2d`).

**This card lifts one rule of your brief:** you may run `scripts/screenshots.py`, with `--only`, as often as you need. Run `npx expo export --platform web > /tmp/export.log 2>&1` once first. Run the full suite at most twice.

**Read first:** `scripts/fixtures/README.md`, `scripts/shots_lib.py`, then `scripts/screenshots.py` by its numbered section comments (`grep -n "^    # [0-9]" scripts/screenshots.py`).

## Files
- Own: `scripts/screenshots.py`, `scripts/shots_lib.py`, `scripts/fixtures/**`, `.gitignore` (two lines).
- Do not touch: `src/**`, `scripts/review_shots.py`, `docs/build/README.md`, `.claude/agents/**` (card Q4 owns the rules and briefs).

## Steps
- [ ] **1. Split.** Move sections 1 to 18 of `screenshots.py` into fixture files named by their first shot: `00_boot.py` (shots 00 to 04), `05_midgame.py`, `06_scrapbook_offline.py`, `09_lategame.py`, `19_story_props.py`, `24_settings.py`, `29_rewards.py`, `34_sidewalk.py`, `39_ladder.py`, `47_hooks.py`, `51_return.py`. Adjust the grouping if a section depends on the page of the one before it; a fixture must not need another fixture's page. `screenshots.py` keeps only: launch the browser, call `run_fixtures`, write `report.json`.
- [ ] **2. Same shots.** Every shot name and its order stay as they are. Prove it: `ls screenshots/v5.15-r3 | sort > /tmp/a; ls screenshots/dev | sort > /tmp/b; diff /tmp/a /tmp/b` prints nothing after a full run with label `dev`.
- [ ] **3. `--only`.** `python3 scripts/screenshots.py <label> --only 56_u1,05_midgame` runs just those fixture files (match on the file name without `.py`; a number prefix alone, `--only 56`, also matches). With `--only`, `report.json` gains `"only": [...]` so a partial run can never be mistaken for a full one.
- [ ] **4. Fixtures assert their state.** Add `expect(page, testid, timeout=5000)` and `expect_text(page, testid, pattern)` to `shots_lib.py`. A failed expectation appends `fixture <file>: expected <what> before shot <name>` to `report["errors"]` and the fixture carries on. Add an expectation before every shot whose point is a state rather than a screen: at least 61 (`challenge-won` is up), 60 (the challenge chip says it is behind), 70 (a head's bark is on screen), 47 and 47a to 47c (the golden pizza or its bubble), 48 to 50 (the order chip in its three states), 51 to 54, 59, 62 and 62b. Use test IDs that exist (`grep -rn "testID=" src --include=*.tsx`); if a state has no test ID, list it under `Needs:` and assert on its text instead.
- [ ] **5. Ignore scratch sets.** Add `screenshots/dev/` and `screenshots/*-b/` to `.gitignore`.
- [ ] **6. Document.** Update `scripts/fixtures/README.md`: the file list, `--only`, `expect`.

## Rules
- No change to what any shot shows. This card moves code; card Q1 changes the timing.
- Keep `from shots_lib import *` working for the two existing fixtures (`56_u1.py`, `66_s1.py`).
- Don't commit screenshot folders.

## Checks
- `python3 -m py_compile scripts/*.py scripts/fixtures/*.py`
- Step 2's `diff` prints nothing, and `report.json` of that full run has `"loaded": true` and `"errors": []`.
- `( time python3 scripts/screenshots.py dev --only 56_u1 ) 2>&1 | tail -4`: `real` under 1m30s, and `screenshots/dev/` holds only shots 56 to 65.
- Break one expectation on purpose (wrong test ID), run its fixture, see the error in `report.json`, and put it back.
