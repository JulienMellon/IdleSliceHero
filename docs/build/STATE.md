# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.22                   # v5.21 r4 fix done 2026-11-22; r4 verify+reviews+close DEFERRED (Julien: cards first)
step: verify                        # setup | waves | verify | review | fix | close  (r2 fixes landed)
round: r2              # r1 | r2 | r3
last_shots: v5.22                   # v5.22 r1 verify: True 0 [], layout 0 new; 14 new 150 changed vs v5.21-r3
codecritic_range_start: 12c99bd   # v5.21 start (main at S8 start)
cards:                 # todo | running | done | partial | blocked
  S4 done  E3 done  W3 done  U3 done  S3 done  U4 done  E4 done  A3 blocked
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.22/review-r1-critic.md (r1 NOT SATISFIED; bug 1 major 2 minor 19; E2 U13 S5 T2; G119 bug drivers bar never reaches Customers line, D548 major piles same short vs balanced, D549 major poses/idle drivers unreadable at phone size)
  code:   docs/build/v5.22/review-r1-code.md (r1 APPROVED but medium 4 > gate 3; blocker/high 0 medium 4 low 27; E8 U14 S2 N7; K5 fixed)
  story:  docs/build/v5.22/review-r1-story.md (r1 NOT SATISFIED; bug 0 major 1 minor 14; E3 U3 T9; S90 major drivers bar under customers line yet Missed 0, shots 182/183)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: S9 resume at r2 verify (Julien 2026-11-22: skip r2 verify+reviews this session; r2 fixes all landed, tsc clean 2992/2992). Do: verify L=v5.22-r2 P=v5.22 (--jobs 3), re-checks model sonnet with PREV=review-r1-* (critic, code, story; G119 D548 D549 S90 K5 G118 D543 verdicts), gate, r3 if needed, close v5.22 per README 8 (also log v5.21 closed as superseded by v5.22 review). For E: drivers-short shop shows no counter symptom (piling needs wanted>kitchen; bags pile but no pose); D556 needs a once-flag. Carry: D552 D481 D519 S89(vs D533) S97 A45 C154 M75 D493 D495, N rows (7). A3 blocked: music R2 at listen (notes round 1 reel sent 2026-11-22; next composer card renders 192 kbps). Then STATE to v5.23 per S9 step 5.
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-22 S9 verify v5.22 FAIL: 3 errors (140_v2 scroll-cue-left 143, 140_v2 cold strip 146 -> U4; 180_e1b 'Finish Chapter 10 first' -> E4); layout 0 new; 14 new 154 changed vs v5.21-r3. Re-verify after fixes.
- 2026-11-22 S9 verify v5.22 PASS (re-run after 3 fixture fixes): True 0 [], layout 0; 14 new 150 changed. r1 reviews launched (critic full, codecritic medium src scripts 12c99bd..HEAD, storycritic medium COPY-v5.22); audiocritic skipped (A3 blocked).
- 2026-11-22 S9 r1 gate NOT met (critic bug1 major2; code medium 4>3; story S90 major). Fix r2: batch 1 E (E3+E4 via E4 programmer) || S (S3); batch 2 U (U3+U4); batch 3 T (W3). N rows (code, 7) have no v5.22 card: carry.
- 2026-11-22 S9 r2 batch 1 (E, S) hit the 5-hour limit before any edit; resumed 11:31 UTC after reset.
- 2026-11-22 S9 r2 E done (G119/S90: engine right, added ReportView.walkIns -> U draws; C180 U36 fixed, C179 service part). Not done: C179 game.ts part, A45, C154, M75, S89 (vs D533), S97, D493 D495. r2 U (U3+U4) launched beside S.
- 2026-11-22 S9 r2 U done (G119 S90: one Customers row deliveries+seats to the line; S92 D554 U34 T130 D551 D550). Carry: D556 needs W3 line + animation; index.tsx coach/dev rows (A46 A44 C178 T131 C176 C177 T125 T129 A41 U27 C151 M70) and D553 D547 D544 D542 D535 D537 D538 D540 S48 S88 outside U3/U4. r2 T (W3) launched beside S.
- 2026-11-22 S9 r2 T done (D555 S91 S93 S94 S96; report.missed.zero for D556; ignored S67 S70 S71 S87 S95 D545 code-side). Landing: U lands report/tutorial strings + strip.cold split + D556; then E lands barks/manager lines (voice.ts, heads).
- 2026-11-22 S9 r2 U landed report/tutorial copy (strip.cold.tips/.word, You tap, tutorial.report.3). D556 carries (needs a saved once-flag, lane E). E landing barks/manager lines.
- 2026-11-22 S9 r2 E landed all COPY-v5.22 barks (36 head + 12 manager, HOME_MANAGER_BARKS wired); home pack had none before (wave-1 gap). Watch bark rate in r2 shots.
- 2026-11-22 S9 r2 S done (D548 piles 1.3-1.6x + spill + rock, D549 Z\/phone bubbles + lean, M74, C167). Julien: skip verify\/reviews, PR now; next session resumes at r2 verify.
- 2026-11-22 S9b Julien: skip verify/shots/critics until this session's fixes land. Shot run stopped. r2 E fix (drivers-short counter symptom, D556 once-flag) launched on E3.
- 2026-11-22 S9b r2 E done (drivers-short counter piling when no idle driver; ChapterSave.missedZero + missedZeroShown). Open for Julien: flow-based drivers symptom (new Symptom value). U launched to wire D556.
