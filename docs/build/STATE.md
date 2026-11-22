# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.22                   # v5.21 r4 fix done 2026-11-22; r4 verify+reviews+close DEFERRED (Julien: cards first)
step: review                        # setup | waves | verify | review | fix | close  (r2 fixes landed)
round: r2              # r1 | r2 | r3
last_shots: v5.22-r2                # v5.22 r2 verify: True 0 [], layout 0 new; 0 new 122 changed vs v5.22
codecritic_range_start: 12c99bd   # v5.21 start (main at S8 start)
cards:                 # todo | running | done | partial | blocked
  S4 done  E3 done  W3 done  U3 done  S3 done  U4 done  E4 done  A3 blocked  (r2 verify fix: E4 done, U4 done)
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.22/review-r2-critic.md (r2 SATISFIED; bug 0 major 0 minor 19; E2 U12 S4 T2; G119 D548 D549 G118 D543 fixed, D556 open minor, D557 carried)
  code:   docs/build/v5.22/review-r1-code.md (r1 APPROVED but medium 4 > gate 3; blocker/high 0 medium 4 low 27; E8 U14 S2 N7; K5 fixed)
  story:  docs/build/v5.22/review-r1-story.md (r1 NOT SATISFIED; bug 0 major 1 minor 14; E3 U3 T9; S90 major drivers bar under customers line yet Missed 0, shots 182/183)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: S9 resume at r2 verify (Julien 2026-11-22: skip verify+shots+critics until this session's fixes landed; done, tsc clean 2995/2995). Do: verify L=v5.22-r2 P=v5.22 (--jobs 3; python playwright must be 1.63.0 to match the browser), re-checks model sonnet with PREV=review-r1-* (critic, code, story; G119 D548 D549 S90 K5 G118 D543 D556 verdicts), gate, r3 if needed, close v5.22 per README 8 (also log v5.21 closed as superseded). Ask Julien: flow-based drivers symptom (new Symptom value + bark)? D556 strip flash + coin burst still open (outside U3). Carry: D552 D481 D519 S89(vs D533) S97 A45 C154 M75 D493 D495, N rows (7). A3 blocked: music R2 at listen. Then STATE to v5.23 per S9 step 5.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-22 S9 r2 E done (G119/S90: engine right, added ReportView.walkIns -> U draws; C180 U36 fixed, C179 service part). Not done: C179 game.ts part, A45, C154, M75, S89 (vs D533), S97, D493 D495. r2 U (U3+U4) launched beside S.
- 2026-11-22 S9 r2 U done (G119 S90: one Customers row deliveries+seats to the line; S92 D554 U34 T130 D551 D550). Carry: D556 needs W3 line + animation; index.tsx coach/dev rows (A46 A44 C178 T131 C176 C177 T125 T129 A41 U27 C151 M70) and D553 D547 D544 D542 D535 D537 D538 D540 S48 S88 outside U3/U4. r2 T (W3) launched beside S.
- 2026-11-22 S9 r2 T done (D555 S91 S93 S94 S96; report.missed.zero for D556; ignored S67 S70 S71 S87 S95 D545 code-side). Landing: U lands report/tutorial strings + strip.cold split + D556; then E lands barks/manager lines (voice.ts, heads).
- 2026-11-22 S9 r2 U landed report/tutorial copy (strip.cold.tips/.word, You tap, tutorial.report.3). D556 carries (needs a saved once-flag, lane E). E landing barks/manager lines.
- 2026-11-22 S9 r2 E landed all COPY-v5.22 barks (36 head + 12 manager, HOME_MANAGER_BARKS wired); home pack had none before (wave-1 gap). Watch bark rate in r2 shots.
- 2026-11-22 S9 r2 S done (D548 piles 1.3-1.6x + spill + rock, D549 Z\/phone bubbles + lean, M74, C167). Julien: skip verify\/reviews, PR now; next session resumes at r2 verify.
- 2026-11-22 S9b Julien: skip verify/shots/critics until this session's fixes land. Shot run stopped. r2 E fix (drivers-short counter symptom, D556 once-flag) launched on E3.
- 2026-11-22 S9b r2 E done (drivers-short counter piling when no idle driver; ChapterSave.missedZero + missedZeroShown). Open for Julien: flow-based drivers symptom (new Symptom value). U launched to wire D556.
- 2026-11-22 S9b r2 U done (D556 payoff once, gated on missedZero; strip flash/coin burst not in U3). tsc ok, 2995 tests pass. Verify deferred to next session.
- 2026-11-22 S9c verify v5.22-r2 FAIL: 3 errors (192_e4 coach 'the dashed line' + coach-block click -> E4; 66_s1 head-rush bark text -> E4), layout 4 new (walk-* capacity labels ellipsis -> U4); 0 new 122 changed vs v5.22. E4 || U4 launched. Music: Julien R2 notes, notes round 2 running.
- 2026-11-22 S9c r2 verify fix U4 done (sidewalk capacityFit: unit-shared and now-only fallbacks; walk-* clips fixed in code, not yet re-shot).
- 2026-11-22 S9c r2 verify fix E4 done (192_e4 expects 'Dashed line, cara' per COPY; 66_s1 waits 42 s, symptom bark outranks rush). WIP ea7437a caught composer mid-rebuild (assets deleted); composer told to rebuild clean before verify.
- 2026-11-22 S9c verify v5.22-r2 PASS (re-run after E4/U4 fixes + music rebuild): True 0 [], layout 0; 0 new 122 changed. r2 re-checks launched (critic, code, story; sonnet).
