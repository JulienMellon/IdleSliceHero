# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.16
step: waves                    # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.15-loop      # label of the last screenshot set that passed verify
codecritic_range_start: f83d281
cards:                 # todo | running | done | partial | blocked
  W2 done  E0 done  E2a running  P1 running  E2b todo  T1a todo
  S2a todo  S2b todo  T1b todo  U5 todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.15/review-r3-critic.md (r3 NOT SATISFIED; bug 0 major 0 minor 8; U5 S3; carried)
  code:   docs/build/v5.15/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 2 low 16; E8 U4 S4 A2; C116/C117 carry)
  story:  docs/build/v5.16/review-r0-story.md (r0 NOT SATISFIED; bug 0 major 1 minor 16; E1 U2 T14; S26 to writer)
  audio:  AUDIOLOG.md (next ID AU78)
open: loop_stats.py can't read 'loop:' commits (5.15-loop METRICS row by hand). Shot 18-sold-sign-scene now always taken (93 shots), no fixture expect yet (Q2 lane). v5.15 carried: critic minors (docs/build/v5.15/review-r3-critic.md); code C116, C117 + lows (docs/build/v5.15/review-r2-code.md); story r0 minors; D465 needs copy key.
next: S2 in progress: wave 3 (E2a + P1) running; then wave 4 (E2b + T1a), E2b refit, session break (docs/build/sessions/S2-v5.16-first-half.md)
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-13 Handoff pointers plan: v5.17 gains U4 (wave 3) and L1's measured perf step; E0 gains step 3b (winnable orders); sessions push their branch and open a PR (DECISIONS 33–34). No new version.
- 2026-11-13 Q6 done: loop_stats.py + METRICS.md (5.14, 5.15 rows). Needs: round = first-to-last rN commit (r3 14 min vs plan 22); kept, Julien may change.
- 2026-11-13 Q2 partial (refactor done, no deps to run). Installed npm deps + py playwright, exported; Q2 resumed for steps 2-3.
- 2026-11-13 Q2 done. Changed: fixtures in scripts/fixtures/ (11 new), --only + expect/expect_text in shots_lib.py; full run ok, --only 56_u1 1m04s. Wave 2: Q1 launched.
- 2026-11-14 Q1 done. Changed: frozen clock (T0) in shots_lib.py, all fixture sleeps -> advance(); two full runs 93/93 identical; run 530 s (+14%). Wave 3: Q3 launched.
- 2026-11-14 Container restart killed Q3 mid-card; work on disk ok, tsc clean; Q3 relaunched with resume line.
- 2026-11-14 Q3 done. Changed: per-shot layout probe (tap/text/clip/edge) in shots_lib.py, layout_check.py, layout_allow.json (32: 17 tap, 14 text, 1 clip D477); full run 0 new, 8m38s. Wave 4: Q4 launched.
- 2026-11-14 Q4 done: README, programmer/critic briefs, review_shots --notes (threshold 0.1%). Verify started.
- 2026-11-14 Verify passed: True 0 []; 0 new, 0 changed, 93 same; layout new 0; --only 56_u1 1m08s. v5.15-loop closed; tsc clean, 939 tests.
- 2026-11-14 11:44 UTC S2: W2 + E0 stopped on the 5-hour limit (reset 03:10); both resumed with the resume line.
- 2026-11-14 11:45 UTC W2 done (COPY-v5.16.md). Needs: (1) Todd script reverses protected scene-file fixes (downtown-1 P4, '150 deliveries.', en-dash scores, university-4 P1, industrial-4 P4, uptown-1 caption, curly quotes) — Julien picks; (2) uptown-4 UI text/lamp fit unchecked, §5 visitor dupes unchecked; (3) waterfront-4 beat after challenge or bid — left as is. r0 storycritic launched.
- 2026-11-14 11:50 UTC Julien: Todd script wins over the scene-file fixes (W2 Needs 1) — tell T1a. r0 story NOT SATISFIED (major 1, S26) sent to W2 once.
- 2026-11-14 16:58 UTC Container restart; E0 report lost but all 7 card steps ticked -> done. W2 fixed S26 (Todd script applied). node_modules gone: npm ci rerun.
- 2026-11-14 17:01 UTC E0 checked: tsc clean, 991 tests pass. Julien: waterfront-4 trigger stays as is. Wave 3: E2a + P1 launched.
