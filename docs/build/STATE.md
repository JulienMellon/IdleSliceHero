# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.20                   # v5.19-test closed 2026-11-19 (r1: critic SATISFIED, codecritic APPROVED)
step: waves                       # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.19-test             # normal verify: 0 new, 30 changed (0.24-1.36%), True 0 [], layout 0; changed = baseline noise (X1 vs 20b3797)
codecritic_range_start: 461e0a4   # v5.20 start (main after planning)
cards:                 # todo | running | done | partial | blocked
  W1 done  C1 todo  C2 todo  U0 todo  C3 todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.19-test/review-r1-critic.md (r1 SATISFIED; bug 0 major 0 minor 4 = carried D481 D519 + parked D493 D495; E2 S2)
  code:   docs/build/v5.19-test/review-r1-code.md (r1 APPROVED; blocker/high 0 medium 2 low 14; E1 U5 S3 N7; C158 open: purchases-core.ts shared purchase ledger key leaks test-build purchases into normal web build)
  story:  docs/build/v5.18/review-r2-story.md (r2 SATISFIED; bug 0 major 0 minor 2; U1 T1; S67 S48 carried)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: start S7-v5.20.md. v5.20 scope set by Julien 2026-11-20 (docs/PLAN-v5.20-onboarding.md; v5.20-v5.24 planned in docs/build/v5.20..v5.24, DECISIONS #35-#46). Start v5.20 wave 0 (fresh baseline v5.20-base: the v5.19-r2 baseline is stale). Carried: C158 (N1 in v5.23 may fix it) + C156 C151 C153 M69 D481 D519. v5.22 card A3 waits for the music track (round: done) or carries.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-20 S7 W1 done (COPY-v5.20.md, 17 lines, max 66 chars). Needs: {marco} read as Marco's name; lines not checked vs current tutorial.ts (C3 to check).
- 2026-11-19 S6 wave 3: X2 added resetGameClockOffset (1406 tests pass); X4 resumed to wire it and drop the reload.
- 2026-11-19 S6 waves 1-3 done: X1 partial (fixture only) X2 X3 X4 done. tsc pass, 2639/2639, lint 0 errors, normal dist grep clean, dist-test has the panel. Stopped at verify: no Python playwright (install denied), so no shots, reviews or close.
- 2026-11-19 S6 verify: playwright + npm ci ok. Normal checks: tsc 0, format ok, 2639/2639, dist guard clean; normal shots v5.19-test running. Test-mode fixtures x1-x4 all FAIL (TEST pill under HUD 'sales' row); sent to X1 programmer.
- 2026-11-19 S6 verify: X1 done (pill drawn last in Hud, zIndex 10; x1 x3 x4 pass). x2 fails: second Welcome back popup after Away 8 h, clock readout off; sent to X2.
- 2026-11-19 S6 verify: X2 done (no engine bug: two-step gift; fixture helper, readout rounds). Panel run errors [] but loaded False (no boot fixture) and layout 1 new (test-pill 56x40); both back to X1. Normal shots rerun (first run died at 38 shots).
- 2026-11-19 S6 verify: X1 done (pill 56x44, test-mode 00_boot.py sets loaded). Panel run True 0 [], layout 0 new per X1.
- 2026-11-19 S6 verify: normal shots v5.19-test True 0 [], layout 0, 0 new 30 changed (max 1.36%); sent to X1 to classify noise vs leak.
- 2026-11-19 S6 verify done: 30 changed = baseline noise (20b3797 build differs from v5.19-r2 images; current vs 20b3797 0 px but build-hash line); X1 put restoreTestCheats behind env check. Panel True 0 [], layout 0; dist guard + check:no-test-mode clean; 2639/2639.
- 2026-11-19 S6 closed v5.19-test at r1: critic SATISFIED (minor 4 carried/parked), codecritic APPROVED (medium 2, C158). STATE -> 5.20.
- 2026-11-20 planning session: v5.20-v5.24 VERSION files and cards written (onboarding, chapters, reading the shop, store, catalog); pricing in docs/PRICING-STRATEGY.md.
