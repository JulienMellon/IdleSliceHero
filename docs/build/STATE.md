# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.15-loop
step: waves                    # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.15-r3      # label of the last screenshot set that passed verify
codecritic_range_start: f83d281
cards:                 # todo | running | done | partial | blocked
  Q2 done, Q6 done, Q1 running, Q3 todo, Q4 todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.15/review-r3-critic.md (r3 NOT SATISFIED; bug 0 major 0 minor 8; U5 S3; carried)
  code:   docs/build/v5.15/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 2 low 16; E8 U4 S4 A2; C116/C117 carry)
  story:  docs/build/v5.15/review-r0-story.md (r0 NOT SATISFIED; bug 0 major 0 minor 6; E1 U2 T3)
  audio:  AUDIOLOG.md (next ID AU78)
open: v5.15 carried: critic minors (docs/build/v5.15/review-r3-critic.md); code C116, C117 + lows (docs/build/v5.15/review-r2-code.md); story r0 minors; D465 needs copy key.
next: fresh session; read docs/build/sessions/S1-loop-update.md (the loop update: wave 1 is Q2 + Q6). Then v5.16 in two sessions, v5.17, v5.18; each session file names the next. Carried notes: docs/build/v5.15/review-r3-critic.md and docs/build/v5.15/review-r2-code.md.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-13 Verify r2 passed (True 0 []; 83 changed vs v5.15). Pushed; critic + codecritic r2 launched.
- 2026-11-13 r2 critic NOT SATISFIED (5 bugs, 1 major, 8 minor; U8 S6). Waiting on codecritic.
- 2026-11-13 r2 codecritic APPROVED (0 high, 2 medium). Critic not met; fix round r3: U1 + S1 sent.
- 2026-11-13 r3 S1 done (D471/D450 partial; D472, D474, D459, D470, U15 fixed). Waiting on U1.
- 2026-11-13 r3 U1 done (G95, G98, G101-G103, D469, D468, C119). Verify r3: tsc clean, 939 tests, export ok; shots v5.15-r3 running.
- 2026-11-13 Verify r3 passed (True 0 []; 78 changed vs r2). Pushed; critic r3 launched.
- 2026-11-13 r3 critic: 0 bugs, 0 major, 8 minor (U5 S3) → close per 4.5; minors carry. v5.15 closed.
- 2026-11-13 Playtest 3 planned: v5.16 gains E0, P1 and edits to W2, T1a, T1b, E2b; v5.18 gains V1, V2. Decisions 19–25 in DECISIONS.md.
- 2026-11-13 16:55 UTC Loop audit: plan in docs/PLAN-loop-improvements.md; Julien approved the loop update before v5.16 (DECISIONS 26–32). Cards in docs/build/v5.15-loop/; v5.16 gains U5. Screenshots v0.1–v4.9 moved to idleslicearchive.
- 2026-11-13 Handoff pointers plan: v5.17 gains U4 (wave 3) and L1's measured perf step; E0 gains step 3b (winnable orders); sessions push their branch and open a PR (DECISIONS 33–34). No new version.
- 2026-11-13 Q6 done: loop_stats.py + METRICS.md (5.14, 5.15 rows). Needs: round = first-to-last rN commit (r3 14 min vs plan 22); kept, Julien may change.
- 2026-11-13 Q2 partial (refactor done, no deps to run). Installed npm deps + py playwright, exported; Q2 resumed for steps 2-3.
- 2026-11-13 Q2 done. Changed: fixtures in scripts/fixtures/ (11 new), --only + expect/expect_text in shots_lib.py; full run ok, --only 56_u1 1m04s. Wave 2: Q1 launched.
