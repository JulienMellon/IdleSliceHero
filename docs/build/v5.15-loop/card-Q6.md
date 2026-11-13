# Card Q6 — loop metrics (v5.15-loop, scripts)

**Goal:** one line per version says how long the loop took and how many rounds and bugs it cost, so the next change to the loop can be judged by numbers.

**Why:** the figures in `docs/PLAN-loop-improvements.md` (v5.15 took 7 h 18 min, of which 5 h 07 min was a usage-limit wait; fix rounds of 27 and 22 minutes) had to be dug out of `git log` by hand. STATE's log has dates but no times.

**Read first:** `git log --format='%h %ad %s' --date=iso-local -60`, to see how the loop's commit messages are shaped (`v5.15 r2: …`, `v5.15 closed`, `STATE …`); the `## Open notes` tables at the end of `docs/build/v5.15/review-r*-critic.md`.

## Files
- Own: `scripts/loop_stats.py` (new), `docs/build/METRICS.md` (new).
- Do not touch: everything else. Card Q4 adds the README line that keeps `METRICS.md` going.

## Steps
- [ ] **1. `scripts/loop_stats.py <version>`** (for example `5.15`). From `git log` alone, print:
  - start (the first commit whose message starts `v<version> `) and end (`v<version> closed`), and the wall time between them;
  - each round's start and end (`r1`, `r2`, `r3` in the messages) and its length;
  - every gap between two commits longer than 45 minutes, listed as idle time, and the total with those gaps taken out;
  - the number of commits.
  From the review files in `docs/build/v<version>/`, print per round the count of `bug`, `major` and `minor` rows in the `## Open notes` table, and how many bug IDs are new in that round.
  It needs enough history: if the first commit of the version is not in the clone, print `fetch more history: git fetch --depth=200 origin main` and exit 1.
- [ ] **2. `--line`.** `python3 scripts/loop_stats.py <version> --line` prints the same as one markdown table row, in the column order of `METRICS.md`.
- [ ] **3. `docs/build/METRICS.md`.** A short header saying what each column means and that the orchestrator appends one row per closed version, then the table, with rows for 5.14 and 5.15 made by the script. Columns: version, closed (date), rounds, wall time, idle (gaps over 45 min), active time, bugs opened per round, minors carried at close, shots changed in each fix round, layout findings at close. The last two can't be read from git: for 5.15 write `83, 78` and `not measured`; for 5.14 write `not recorded` in both.
- [ ] **4. Times in STATE's log.** The script does not need them, but people do: add one sentence to the header of `METRICS.md` saying STATE log lines should start `YYYY-MM-DD HH:MM`. (Card Q4 owns the README; don't edit it.)

## Rules
- Standard library only. No network.
- Compute with unix timestamps (`%at`). The repo's commits come from sessions in different time zones (`+0000` and `-0500` on the same day), so formatted dates can't be subtracted. Print times in UTC and say so.
- The script reads; it never writes a file. The orchestrator appends the row.

## Checks
- `python3 -m py_compile scripts/loop_stats.py`
- `python3 scripts/loop_stats.py 5.15` reports three rounds, a wall time of about 7 h 18 min, one idle gap of about 5 h 07 min, and 5 bugs in r1, 5 in r2 (3 of them new), 0 in r3.
- `python3 scripts/loop_stats.py 5.15 --line` matches the 5.15 row in `METRICS.md`.
