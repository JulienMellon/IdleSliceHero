# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.20                   # v5.19-test closed 2026-11-19 (r1: critic SATISFIED, codecritic APPROVED)
step: verify                       # setup | waves | verify | review | fix | close
round: r3              # r1 | r2 | r3
last_shots: v5.20-r2               # r2 verify: True 0 [], layout 0 new; 0 new 30 changed vs v5.20
codecritic_range_start: 461e0a4   # v5.20 start (main after planning)
cards:                 # todo | running | done | partial | blocked
  W1 done  C1 done  C2 done  U0 done  C3 done
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.20/review-r2-critic.md (r2 NOT SATISFIED on minors; bug 0 major 0 minor 8; E3 U4 S2; open D525 D526 D531 D481 D519 D528 D530 +1)
  code:   docs/build/v5.20/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 1 low 18; E3 U5 S4 N7; C158 carried)
  story:  docs/build/v5.20/review-r2-story.md (r2 NOT SATISFIED on minors only; bug 0 major 0 minor 4; U1 T3; S48 S67 S70 S71 carried, advisory)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: continue S7-v5.20.md at round r3 verify (r3 fixes done 2026-11-21: C1 C2 C3 fixed, U0 nothing; tsc 0, 2775/2775). Run README section 5 with V=5.20 L=v5.20-r3 P=v5.20-r2, then r3 re-checks (critic+storycritic sonnet, codecritic session model; PREV = review-r2-*), gate, close per README 8, STATE -> 5.21. Carried: D481 D519 (wide-shop scale needs Julien), D530 (graduation ribbon), C158 C156 C151 C153, story S48 S67 S70 S71. Julien 2026-11-21: 'no gain now' label removed for good; v5.22 report says what to build.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-21 S7 Julien on D521/D522: drop the 'no gain now' label, keep the Ovens step, step 11 shows the oven's gain. r2 fixes: C1 (U) + C2 (S) running; then W1 (T) + U0 (U); then C3 (E/U + label drop).
- 2026-11-21 S7 r2 C1 done (D520 D524-6 D529 S69 A42-part C161 C163 C164 M72 T118 T119; 2771 tests). For C3: noteCoach into game-store.ts, D528 goal-model, S72 drawer header, shop-ui hire ref. W1 r2 launched.
- 2026-11-21 S7 r2 W1 done: S68 fixed (tutorial.8 names no task), lines 9-11 now 'faster oven'. Other T rows are storycritic minors: carried.
- 2026-11-21 S7 r2 U0 nothing to fix. C2 done: G112 D522 (Lv/+% oven tag) D523 D527 C156 C162 T120 U28 M69 T114; D481 D519 carried. C3 r2 running (+ dial:oven step 11, 160_c3 step-13 scrim + close-upgrades block).
- 2026-11-21 S7 r2 C3 done (A42 noteCoach, U29, C164, D521 label gone, D522 dial:oven, S72, copy, 160_c3 clean). Verify v5.20-r2.
- 2026-11-21 S7 verify v5.20-r2 pass: True 0 [], layout 0, 30 changed. r2 re-checks launched.
- 2026-11-21 S7 r2 gate not met (critic minor 8 > 3; code APPROVED; story minors carry). Fix round r3: C1 + C2, then C3, then U0.
- 2026-11-21 S7 r3 C1 done (D525 D526 D531 hand; 2775 tests). D531 oven rect sent to C2; C3 r3 launched (+D528).
- 2026-11-21 S7 r3 C3 done (D528 goal bar shows story goal steps 1-11, C166; 2775 tests). U0 r3 check sent; C2 still running.
- 2026-11-21 S7 r3 fixes done (C2: T120 U30 C165 T121 D531 oven head; D481 D519 not fixed). Two fix rounds run: session ends before r3 verify.
