# Loop metrics

One row per closed version, so a change to the loop can be judged by numbers. The orchestrator appends the row when it closes a version:

```
python3 scripts/loop_stats.py <version> --line --shots "<n, n>" --layout "<n>"
```

The script reads `git log` and the critic review files and writes nothing; times are UTC. `--shots` and `--layout` are the two columns git cannot give, so without them the row says `not recorded`. Needs enough history (`git fetch --depth=200 origin main` if the script asks). STATE log lines should start `YYYY-MM-DD HH:MM`, so a time is on record for each event.

Columns:
- **version**: the version the row is for.
- **closed**: UTC date of the `v<version> closed` commit.
- **rounds**: distinct `rN` tags in the version's commit messages.
- **wall time**: first `v<version> ` commit to `v<version> closed`.
- **idle**: sum of gaps over 45 minutes between two commits (usage-limit waits, breaks).
- **active time**: wall time minus idle.
- **bugs opened per round**: `bug` rows in each round's critic `## Open notes` table whose ID was not a bug in an earlier round (r1, r2, r3).
- **minors carried at close**: `minor` rows in the last critic round's table.
- **shots changed in each fix round**: screenshots that differ from the round before (fix rounds r2, r3); from the verify step.
- **layout findings at close**: layout-check findings left when the version closed; from the verify step.

| version | closed | rounds | wall time | idle | active time | bugs opened per round | minors carried at close | shots changed in each fix round | layout findings at close |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5.14 | 2026-11-12 | 3 | 2 h 04 min | 0 min | 2 h 04 min | 2, 0, 0 | 4 | not recorded | not recorded |
| 5.15 | 2026-11-13 | 3 | 7 h 17 min | 5 h 07 min | 2 h 10 min | 5, 3, 0 | 8 | 83, 78 | not measured |
| 5.15-loop | 2026-11-14 | 1 | 3 h 36 min | 2 h 18 min (Q1 programmer running, not idle) | 1 h 18 min | no critics | 11 | 0 changed, 93 same (two runs) | 0 new, 32 allowed |
| 5.16 | 2026-11-15 | 3 | 40 h 13 min | 34 h 40 min | 5 h 33 min | 3, 0, 0 | 10 | 96, 83 | 9 |
| 5.17 | 2026-11-17 | 3 | 28 h 55 min | 25 h 31 min | 3 h 24 min | 1, 0, 0 | 4 | 91, 10 | 9 |
| 5.18 | 2026-11-18 | 4 | 34 h 59 min | 32 h 09 min | 2 h 50 min | 3, 0, 0 | 6 | 13, 7 | 9 |
| 5.19 | 2026-11-19 | 2 | 12 h 04 min | 7 h 25 min | 4 h 39 min | 0, 0 | 4 | 47 | 9 |
| 5.19-test | 2026-11-19 | 1 | 3 h 04 min | 2 h 29 min | 35 min | 0 | 4 |  | 9 |
| 5.20 | 2026-11-21 | 3 | 20 h 33 min | 16 h 13 min | 4 h 20 min | 1, 0, 0 | 5 | 30, 23 | 9 |
| 5.22 | 2026-11-22 | 2 | 20 h 32 min | 17 h 38 min | 2 h 54 min | 1, 0 | 20 | 122 | 9 |
| 5.23 | 2026-11-22 | 3 | 2 h 57 min | 47 min | 2 h 09 min | 3, 0, 0 | 22 | 134, 16 | 9 |
| 5.23b | 2026-11-23 | 0 | 0 min | 0 min | 0 min | 0, 0 | 6 | 64 | 9 |
| 5.24 | 2026-11-27 | 3 | 3 h 01 min | 49 min | 2 h 13 min | 1, 0, 0 | 6 | 160, 7 | 9 |
