# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.21                   # v5.20 closed 2026-11-21 (r3: critic SATISFIED, codecritic APPROVED, story advisory minors)
step: verify                        # setup | waves | verify | review | fix | close
round: r3              # r1 | r2 | r3
last_shots: v5.21-r3                # r3 verify: True 2 errors (153_c1 coach step10), layout 0 new; 14 new 107 changed vs r2
codecritic_range_start: 12c99bd   # v5.21 start (main at S8 start)
cards:                 # todo | running | done | partial | blocked
  E1 done  W2 done  U1 done  U2 done  E2 done  E1b done
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.21/review-r2-critic.md (r2 NOT SATISFIED; bug 0 major 3 minor 11; E3 U9 S2; D532 D536 D541 majors, D542 new)
  code:   docs/build/v5.21/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 3 low 18; E1 U12 S1 N7)
  story:  docs/build/v5.21/review-r2-story.md (r2 NOT SATISFIED on minors only; bug 0 major 0 minor 7; E1 U3 T3; S48 S67 S70 S71 S78 S87 S88 advisory)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: resume S8-v5.21.md: FIRST launch programmer on docs/build/v5.21/card-E1b.md (Julien: next shop waits for current chapter; fix routing E), then Do step 3: verify r3 (V=5.21, L=v5.21-r3, P=v5.21-r2; first: npm ci and pip install playwright==1.63.0, the container lacks both), then r3 re-checks (PREV = review-r2-*), gate, close per README 8; at close add "S4 todo" to the v5.22 cards line. D530 gift decided (Julien 2026-11-21): at tutorial end Nonna gives a free unique vanity item, claimed in the store (not auto-granted); route to E2 (grant flag) + the store owner (claim row) as a fix or a v5.22 card. PACING RULE (Julien 2026-11-21): the story must advance in order; no scene may stall because the player skipped growing a shop the path did not need (EAGER sim held ~500 min at waterfront-2 is a bug). Path-independent scenes are fine when intentional. Acceptance: pacing-sim EAGER run holds no beat much longer than the tuned run. Mechanism: option 1, card E1b.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-21 S8 r2 gate not met (critic major 3: D532 D536 D541; code APPROVED; story minors carry). Fix round r3: U1 + U2, then E1 + E2. D532 call: a hire/build chapter task may show cash vs its own price; the bar never offers a non-task purchase.
- 2026-11-21 S8 r3 U2 done (D536 shots 175b-d, C173 free row 0 gems, T126). E1 r3 launched (+chapterDiamonds); U1 r3 running.
- 2026-11-21 S8 r3 E1 done (C173 chapterDiamonds, S78 waterfront-4 serve 50,000 first; 2902 tests; pacing same). E2 r3 (D530) waits for U1's D541 ribbon.
- 2026-11-21 S8 r3 U1 done (D532 cash vs price, D541 tick pop + chapter ribbon + toast shot, D536 Go proved 178h2/i/j, S87 Pier 9 short). E2 r3 launched (D530).
- 2026-11-21 S8 r3 fixes done (E2 D530 ribbon via goalCheer, shot 179e; gift needs Julien). 2902/2902, tsc clean, pacing same (downtown-2 +8.9%). Two fix rounds run: session ends before r3 verify.
- 2026-11-21 S8 resumed: deps installed (npm ci, playwright 1.63.0); E1b launched before r3 verify.
- 2026-11-21 S8 E1b done (gate on beat 3 of prior shop; 2917 tests; EAGER max wait 1940.8 vs tuned 1919.8 at uptown-4, so beat 3 kept per acceptance; beat 4 broke 3 pacing tests). Needs index.tsx tasks param -> U1.
- 2026-11-21 S8 r3 U1 done (locked-lot tap opens Story tab, shot 180b; 2918 tests). Verify v5.21-r3 next.
- 2026-11-21 S8 r3 pre-verify: tsc clean, format ok, 2918/2918, pacing same (downtown-2 +8.9%; EAGER max 1940.8 vs tuned 1919.8). Shots v5.21-r3 running.
- 2026-11-21 S8 verify v5.21-r3 FAIL: 2 errors in 153_c1 (scrim leak shot 155-coach-step10, walk-ovens not visible); layout 0. Sent to E2.
