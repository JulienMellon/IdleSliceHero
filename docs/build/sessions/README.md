# Session files: how the 11-13 handoff gets built

For Julien. **The orchestrator does not read this file.** Each build session reads one file from this folder, then the three files the build README names. That is its whole reading list.

| # | File | Runs | Starts when STATE says |
| --- | --- | --- | --- |
| 1 | `S1-loop-update.md` | The loop update: Q2 + Q6, Q1, Q3, Q4 | `version: 5.15-loop` |
| 2 | `S2-v5.16-first-half.md` | v5.16 waves 1 to 5, ending on `tsc` and tests | `version: 5.16`, `last_shots: v5.15-loop` |
| 3 | `S3-v5.16-second-half.md` | v5.16 waves 6 to 8, verify, reviews, fix rounds, close | `version: 5.16`, `next:` names the file |
| 4 | `S4-v5.17.md` | v5.17 with the new card U4 | `version: 5.17` |
| 5 | `S5-v5.18.md` | v5.18 with the scrolling shop | `version: 5.18` |

## How to run one
1. Merge the last session's pull request.
2. Start a fresh session and paste the prompt below. It is the same every time: STATE's `next:` line names the session file.
3. If a session stops early (usage limit, context), merge its pull request and paste the same prompt again.

```
You are the orchestrator for Slice Empire. Work only from files; do not explore the repo.
1. Run: ls docs/build/sessions/S1-loop-update.md 2>&1 | tail -1
   If the file is missing, run: git fetch -q origin claude/handoff-pointers-plan-e92wd2 && git merge -q --no-edit FETCH_HEAD 2>&1 | tail -3
2. Run: grep -n '^next:' docs/build/STATE.md | cut -c1-300
3. Read the session file that line names (docs/build/sessions/S*.md) and follow it exactly. It tells you the only other files you may read.
At the end of the session, open one pull request from this session's branch to main, as the session file says. I am asking for that pull request now.
```

## Why the context stays small
- One session file (about 30 lines) plus the README, STATE and one VERSION file: under 300 lines read per session.
- Agents get a card by path and report in under 12 lines; the orchestrator keeps one word per card and writes it to STATE at once.
- STATE is rewritten after every wave, so a session can end at any wave and the next one loses nothing.
- v5.16 is two sessions. The first ends on `tsc` and tests only, so the version still pays for one screenshot run and one review round.
- Re-check rounds and document reviews run on Sonnet; the first review of each version, and code reviews of money, consent and save code, keep the session's model.

The plan behind these files: the "Status" block at the end of `docs/build/11-13-handoff-pointers.md`, and DECISIONS #33 and #34.
