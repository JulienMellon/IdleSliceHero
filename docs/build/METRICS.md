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
