# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.23                   # v5.22 closed 2026-11-22 at r2 (critic SATISFIED, code APPROVED 3 medium, story advisory 10 minor)
step: waves                         # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.22-r2                # v5.22 r2 verify: True 0 [], layout 0 new; 122 changed vs v5.22
codecritic_range_start: 12c99bd   # v5.21 start (main at S8 start)
cards:                 # todo | running | done | partial | blocked
  W4 done  E5 done  N1 running  U5 running  E6 todo
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.22/review-r2-critic.md (r2 SATISFIED; bug 0 major 0 minor 19; E2 U12 S4 T2; G119 D548 D549 G118 D543 fixed, D556 open minor, D557 carried)
  code:   docs/build/v5.22/review-r2-code.md (r2 APPROVED; blocker/high 0 medium 3 low 24; E5 U14 S1 N7; K5 fixed; A46 A44 C158 medium open)
  story:  docs/build/v5.22/review-r2-story.md (r2 NOT SATISFIED advisory; bug 0 major 0 minor 10; E2 U1 T7; S90 resolved; S67 S70 S71 S87 copy not in code, S98 new)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: start S10-v5.23.md. Carried notes: docs/build/v5.22/review-r2-{critic,code,story}.md open-notes tables (D556 minor; A46 A44 C158 medium; S67 S70 S71 S87 S91 S95 S97 S98; N rows 7). A3 blocked: music R2 back at listen (notes round 2 sent 2026-11-22). Ask Julien still open: flow-based drivers symptom (new Symptom value + bark)?
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-22 S9 r2 E landed all COPY-v5.22 barks (36 head + 12 manager, HOME_MANAGER_BARKS wired); home pack had none before (wave-1 gap). Watch bark rate in r2 shots.
- 2026-11-22 S9 r2 S done (D548 piles 1.3-1.6x + spill + rock, D549 Z\/phone bubbles + lean, M74, C167). Julien: skip verify\/reviews, PR now; next session resumes at r2 verify.
- 2026-11-22 S9b Julien: skip verify/shots/critics until this session's fixes land. Shot run stopped. r2 E fix (drivers-short counter symptom, D556 once-flag) launched on E3.
- 2026-11-22 S9b r2 E done (drivers-short counter piling when no idle driver; ChapterSave.missedZero + missedZeroShown). Open for Julien: flow-based drivers symptom (new Symptom value). U launched to wire D556.
- 2026-11-22 S9b r2 U done (D556 payoff once, gated on missedZero; strip flash/coin burst not in U3). tsc ok, 2995 tests pass. Verify deferred to next session.
- 2026-11-22 S9c verify v5.22-r2 FAIL: 3 errors (192_e4 coach 'the dashed line' + coach-block click -> E4; 66_s1 head-rush bark text -> E4), layout 4 new (walk-* capacity labels ellipsis -> U4); 0 new 122 changed vs v5.22. E4 || U4 launched. Music: Julien R2 notes, notes round 2 running.
- 2026-11-22 S9c r2 verify fix U4 done (sidewalk capacityFit: unit-shared and now-only fallbacks; walk-* clips fixed in code, not yet re-shot).
- 2026-11-22 S9c r2 verify fix E4 done (192_e4 expects 'Dashed line, cara' per COPY; 66_s1 waits 42 s, symptom bark outranks rush). WIP ea7437a caught composer mid-rebuild (assets deleted); composer told to rebuild clean before verify.
- 2026-11-22 S9c verify v5.22-r2 PASS (re-run after E4/U4 fixes + music rebuild): True 0 [], layout 0; 0 new 122 changed. r2 re-checks launched (critic, code, story; sonnet).
- 2026-11-22 S9c r2 gate MET: critic SATISFIED (0/0/19, carried minors), code APPROVED (medium 3), story NOT SATISFIED advisory (0/0/10). v5.22 closed; v5.21 logged closed as superseded. STATE -> v5.23.
- 2026-11-22 S10 start: wave 1 W4 || E5 launched. Music: Julien R2 answer (Downtown triumph gap ~0:07, bank ok, wants splash theme) -> notes round 3 launched.
- 2026-11-22 S10 W4 done (COPY-v5.23.md; §7 carried copy fixes need code cards). Ask Julien: tutorial.16 says 'starter pack' not 'gift' (paid).
- 2026-11-22 S10 E5 done (paid-boost slot, SAVE_VERSION 9, 3012 tests). Ask Julien: offline earnings ignore paid boosts (12 h bought then away = nothing). Wave 2 N1 || U5 launched.
