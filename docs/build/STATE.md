# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.21                   # v5.20 closed 2026-11-21 (r3: critic SATISFIED, codecritic APPROVED, story advisory minors)
step: waves                        # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.20-r3               # r3 verify: True 0 [], layout 0 new; 0 new 23 changed vs v5.20-r2
codecritic_range_start: 461e0a4   # v5.20 start (main after planning)
cards:                 # todo | running | done | partial | blocked
  E1 done  W2 done  U1 running  U2 running  E2 todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.20/review-r3-critic.md (r3 SATISFIED; bug 0 major 0 minor 5; E3 S2; open D530 D481 D519 D493 D495)
  code:   docs/build/v5.20/review-r3-code.md (r3 APPROVED; blocker/high 0 medium 1 low 15; E1 U7 S1 N7)
  story:  docs/build/v5.20/review-r3-story.md (r3 NOT SATISFIED on minors only; bug 0 major 0 minor 5; U2 T3; S48 S67 S70 S71 S73 carried, advisory)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: start S8-v5.21.md
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-21 S7 r2 U0 nothing to fix. C2 done: G112 D522 (Lv/+% oven tag) D523 D527 C156 C162 T120 U28 M69 T114; D481 D519 carried. C3 r2 running (+ dial:oven step 11, 160_c3 step-13 scrim + close-upgrades block).
- 2026-11-21 S7 r2 C3 done (A42 noteCoach, U29, C164, D521 label gone, D522 dial:oven, S72, copy, 160_c3 clean). Verify v5.20-r2.
- 2026-11-21 S7 verify v5.20-r2 pass: True 0 [], layout 0, 30 changed. r2 re-checks launched.
- 2026-11-21 S7 r2 gate not met (critic minor 8 > 3; code APPROVED; story minors carry). Fix round r3: C1 + C2, then C3, then U0.
- 2026-11-21 S7 r3 C1 done (D525 D526 D531 hand; 2775 tests). D531 oven rect sent to C2; C3 r3 launched (+D528).
- 2026-11-21 S7 r3 C3 done (D528 goal bar shows story goal steps 1-11, C166; 2775 tests). U0 r3 check sent; C2 still running.
- 2026-11-21 S7 r3 fixes done (C2: T120 U30 C165 T121 D531 oven head; D481 D519 not fixed). Two fix rounds run: session ends before r3 verify.
- 2026-11-21 S7 CI failed on expo lint (not in README 5): engine/tutorial.ts imported components/coach types (A43). C3 moved them to engine/coach-types.ts; lint 0 errors, 2777/2777, CI steps pass locally.
- 2026-11-21 S7 verify v5.20-r3 pass: True 0 [], layout 0, 23 changed. r3 re-checks launched.
- 2026-11-21 S7 v5.20 closed at r3: critic SATISFIED (minor 5: D530 D481 D519 D493 D495), codecritic APPROVED (medium 1), storycritic minors carried (S48 S67 S70 S71 S73).
- 2026-11-21 S8 v5.21 wave 1: E1 running (W2 waits for chapters.md).
- 2026-11-21 S8 E1 partial (chapters.md written; pacing moved: downtown-2 4.5->4.9). W2 launched. Needs: boston fixture saveVersion 8, snapshots regen, storyWaitHint callers (U1); open Q: rate/noMissed tasks hold the EAGER sim at waterfront-2.
- 2026-11-21 S8 E1 done (snapshots regen; 2838/2838, tsc clean). U1 extra: remove storyWaitHint callers. W2 running.
- 2026-11-21 S8 W2 done (COPY-v5.21.md). Wave 1 committed. Wave 2: U1 + U2 launched (U2 extra: W2 notes on spoiler titles, noMissed {target} in s).
