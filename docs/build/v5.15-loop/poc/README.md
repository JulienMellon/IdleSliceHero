# Proof-of-concept scripts from the loop audit (2026-11-13)

Scratch tools that produced the numbers in `docs/PLAN-loop-improvements.md`. They are starting points for cards Q1 and Q3, not finished code. Run them from the repo root after `npx expo export --platform web`.

| File | What it does | Result on v5.15 r3 code |
| --- | --- | --- |
| `shot_diff.py` | Compares two screenshot folders with the same rule as `review_shots.py` and prints a histogram. `python3 docs/build/v5.15-loop/poc/shot_diff.py screenshots v5.15-r2 v5.15-r3 -v` | Same build run twice: 59 of 92 changed |
| `clock_poc.py` | Shoots two seeded saves three times each with Playwright's clock frozen before the app boots, and prints the pixel difference between runs | 0.32%, 0.32%, 0.57%, 0.00%; game state identical |
| `layout_probe.py` | Runs the normal screenshot suite and, at every shot, asks the DOM for small tap targets, small text, clipped text and off-screen text. Writes `/tmp/layout-probe.json` | 19 controls under 44 pt, 30 strings under 10 pt; the clipped-text test is unreliable (it misses D477) |

Both runners import `scripts/shots_lib.py`, which creates `screenshots/<label>/` for the label they pass (`probe`, `lint`). Delete that folder afterwards; don't commit it.
