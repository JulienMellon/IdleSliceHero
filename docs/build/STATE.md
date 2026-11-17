# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.18
step: waves                     # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.17-r3           # label of the last screenshot set that passed verify
codecritic_range_start: 229f874
cards:                 # todo | running | done | partial | blocked
  K1: running  W3: running  V1: todo  E3: todo  T2: todo  A2: todo  V2: todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.17/review-r3-critic.md (r3 SATISFIED; bug 0 major 0 minor 4; E2 U1 S1; D481 D493 D495 D505)
  code:   docs/build/v5.17/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 2 low 20; E10 U3 S3 N3 A2; M68 A32 medium carried)
  story:  docs/build/v5.16/review-r3-story.md (r3 SATISFIED; bug 0 major 0 minor 1; U1)
  audio:  docs/build/v5.17/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 2; A5; carried AU41 AU39 AU40 AU82 AU25)
open: v5.17 carried: critic minors D481 D493 (by choice) D495 D505 (docs/build/v5.17/review-r3-critic.md); code mediums M68 A32 + lows, C133 needs services isOptedOut export (docs/build/v5.17/review-r2-code.md); audio AU41 AU39 AU40 AU82 AU25 (docs/build/v5.17/review-r2-audio.md), SliceAudioSession native module not built. For Julien: D495 is a pacing decision (first hire under $50 vs the 2/5/8 min head targets, content/tuning.ts + pacing refit); day-30 name 'Nonna's Golden Oven' to check with the writer; App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST. expo install is refused by the proxy: use npm install with the version from node_modules/expo/bundledNativeModules.json. loop_stats.py cannot read loop: commits. Programmer cards: --only takes the fixture name without .py.
next: S5-v5.18.md wave 1 running (K1 + W3, then V1, then seam verify v5.18-seam)
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-17 00:32 UTC r2 P1 died at usage limit, resumed after restart (D475 D450 A28 A29 M60 U10 U11). Then verify v5.17-r2.
- 2026-11-17 00:39 UTC r2 P1 done (D450 D475 A28 U10 U11; M60 partial; scene 499 pass). All r2 fixes in. Verify v5.17-r2.
- 2026-11-17 01:01 UTC Verify v5.17-r2: tsc + 1624 tests pass, True 0 [], layout 1 new (recipe-reveal clip, shot 136) -> U4. Re-run shots after its fix.
- 2026-11-17 01:33 UTC Verify v5.17-r2 PASS: True 0 [], layout 0 new; 91 changed. r2 re-checks: critic (sonnet), codecritic, audiocritic (sonnet).
- 2026-11-17 01:37 UTC r2 re-checks: critic minors only (6 > 3), code APPROVED, audio SATISFIED. Fix round r3 (minors): S2a D481 D482 D490 + U4 D478; then E D495. D493 carried by Julien's choice.
- 2026-11-17 01:38 UTC r3 U4 done (D478 card shorter and wider; endgame 89 pass; shot 136 layout to confirm in verify). E launched for D495; S2a running.
- 2026-11-17 01:38 UTC r3 E blocked on D495 (no edits): first goal under $50 needs content/tuning.ts head prices + pacing refit + a UI pop; a pacing decision for Julien -> carried. Waiting S2a.
- 2026-11-17 01:45 UTC r3 S2a done (D482 boat on sea, D490 more poses; 206 pass; D481 in code since r2). Verify v5.17-r3.
- 2026-11-17 02:06 UTC Verify v5.17-r3 PASS: 1625 tests, True 0 [], layout 0 new; 10 changed. r3 re-check: critic (sonnet). Codecritic not re-run: r3 touched only components outside its paths.
- 2026-11-17 02:07 UTC v5.17 closed: r3 critic SATISFIED (4 minors carry), code APPROVED (r2), audio SATISFIED (r2). Next v5.18.
- 2026-11-17 S5 start: v5.18 wave 1 launched (K1 programmer, W3 writer).
