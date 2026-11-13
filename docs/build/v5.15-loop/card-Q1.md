# Card Q1 — screenshots on a frozen clock (v5.15-loop, scripts)

**Goal:** two runs of one build produce the same pixels, so that "changed since last round" means the code changed it.

**Why (measured 2026-11-13, `docs/PLAN-loop-improvements.md`):** two runs of the same build differ in 59 of 92 shots (0.6% to 7.3% of pixels), because cooks, cars, clouds and the golden pizza are wherever the wall clock put them. In v5.15's fix rounds `review_shots.py` therefore flagged 83 and 78 of 92 shots, and the critic was handed 156 images to re-check notes that named 17 shots.

**What is already known:**
- The game's only `Math.random` calls are in `src/audio/director.ts`. Everything visible is a function of time and the save.
- `clock_page` in `scripts/fixtures/56_u1.py` and `marketing/ad/record.py` already drive Playwright's fake clock.
- `docs/build/v5.15-loop/poc/clock_poc.py` is the recipe that got closest. Freezing the clock **before** the app boots gave identical game state on every run (`playSeconds`, cash) and pixel differences of 0.32%, 0.32%, 0.57% and 0.00%. Pausing the clock after the app had loaded did not work: the game had already run for a different number of real milliseconds each time.
- The residue (0.3% to 0.6%) was not traced. First suspect: an animation that does not run on the JS clock (a CSS transition or animation in react-native-web).

**This card lifts one rule of your brief:** you may run `scripts/screenshots.py`. Develop with `--only` (card Q2), one fixture at a time. Run the full suite only for the final check.

**Read first:** `docs/build/v5.15-loop/poc/clock_poc.py` and `poc/README.md`; `scripts/shots_lib.py`; `clock_page` and `fresh_page` in `scripts/fixtures/56_u1.py`.

## Files
- Own: `scripts/shots_lib.py`, `scripts/screenshots.py`, `scripts/fixtures/**`.
- Do not touch: `src/**` (if the residue can only be removed in the app, stop and report it under `Needs:`), `scripts/review_shots.py`, `docs/build/README.md`, `.claude/agents/**`.

## Steps
- [ ] **1. One fixed moment.** `T0` in `shots_lib.py`: Wednesday 2026-11-11 12:00 local, never changed. Every `time.time()`, `datetime.now()` and `now_ms` in `shots_lib.py` and the fixtures reads `T0` instead (`day_str`, `week_number`, `attack_state`, `hooks_save`, `MID_SAVE["lastSavedAt"]`). Shots 62 and 62b keep their own Friday times.
- [ ] **2. Freeze before boot.** In `seeded_page` (and `fresh_page`, `clock_page`, which should become thin wrappers): `ctx.clock.install(time=T0)`; create the page; `page.clock.pause_at(T0 + 1 s)`; then `goto`, and wait in real time for the network and fonts (`wait_for_load_state("networkidle")`, `document.fonts.status === 'loaded'`). Fake time must not move while real loading is going on.
- [ ] **3. Step, don't sleep.** Add `advance(page, ms)` (one `page.clock.run_for`) and make `settle` and `shot(page, name, wait)` use it. Replace every `time.sleep` in the fixtures (37 of them) with `advance`. A real `time.sleep` stays only where the browser itself needs real time (a navigation, an image decode), and never more than 0.3 s.
- [ ] **4. The same order of taps.** `settle` dismisses whatever is up at fixed fake times, so a popup is always closed on the same tick.
- [ ] **5. Remove the residue.** Run one fixture three times and compare with `poc/shot_diff.py`. If a shot still differs, find what moves: crop the difference (`shot_diff.py -v` prints the bounding box), then look for CSS animations (`document.getAnimations()` in the page lists them; finish or cancel them before the shot) and for `Animated` values driven outside the JS clock.
- [ ] **6. Report the new run time** of the full suite (it was 465 s). If stepping the clock made it slower, say by how much and why.

## Rules
- A shot must still show the moment it was written to show. If a fixed clock hides something (a bark that speaks 4 s in every 150 s), advance to that moment; don't delete the shot. Card Q2's expectations will tell you if you lost a state.
- Don't touch what a shot shows beyond its timing.
- Don't commit screenshot folders.

## Checks
- `python3 -m py_compile scripts/*.py scripts/fixtures/*.py`
- Full run twice: `python3 scripts/screenshots.py dev` then `python3 scripts/screenshots.py dev-b`, then `python3 scripts/review_shots.py dev-b dev | tail -1` prints `0 new, 0 changed`.
- Both `report.json` files have `"loaded": true` and `"errors": []`.
- If you cannot reach zero, report `PARTIAL` with the names and percentages of the shots that still differ and what you ruled out. VERSION.md has a default for that case.
