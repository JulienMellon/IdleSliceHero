# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.23                   # v5.22 closed 2026-11-22 at r2 (critic SATISFIED, code APPROVED 3 medium, story advisory 10 minor)
step: fix                            # setup | waves | verify | review | fix | close
round: r2              # r1 | r2 | r3
last_shots: v5.23                   # v5.23 r1 verify: True 0 [], layout 0 new; 10 new 39 changed vs v5.22-r2
codecritic_range_start: fa8c5a5   # v5.23 start (main at S10 start)
cards:                 # todo | running | done | partial | blocked
  W4 todo  E5 todo  N1 running  U5 running  E6 todo   # r2 fix round
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.23/review-r1-critic.md (r1 NOT SATISFIED; bug 3 major 2 minor 27; E4 U19 S4 T1 N5; G120 G121 G122 bugs, D558 D559 major)
  code:   docs/build/v5.23/review-r1-code.md (r1 APPROVED; blocker/high 0 medium 3 low 36; E8 U18 S1 N11 A1)
  story:  docs/build/v5.23/review-r1-story.md (r1 NOT SATISFIED advisory; bug 0 major 1 minor 13; E2 U2 T8 N2; S99 major N)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: start S10-v5.23.md. Carried notes: docs/build/v5.22/review-r2-{critic,code,story}.md open-notes tables (D556 minor; A46 A44 C158 medium; S67 S70 S71 S87 S91 S95 S97 S98; N rows 7). A3 done (oven ding, phone ring, tip bell; unheard by Julien). Ask Julien still open: flow-based drivers symptom (new Symptom value + bark)?
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-22 S9c verify v5.22-r2 FAIL: 3 errors (192_e4 coach 'the dashed line' + coach-block click -> E4; 66_s1 head-rush bark text -> E4), layout 4 new (walk-* capacity labels ellipsis -> U4); 0 new 122 changed vs v5.22. E4 || U4 launched. Music: Julien R2 notes, notes round 2 running.
- 2026-11-22 S9c r2 verify fix U4 done (sidewalk capacityFit: unit-shared and now-only fallbacks; walk-* clips fixed in code, not yet re-shot).
- 2026-11-22 S9c r2 verify fix E4 done (192_e4 expects 'Dashed line, cara' per COPY; 66_s1 waits 42 s, symptom bark outranks rush). WIP ea7437a caught composer mid-rebuild (assets deleted); composer told to rebuild clean before verify.
- 2026-11-22 S9c verify v5.22-r2 PASS (re-run after E4/U4 fixes + music rebuild): True 0 [], layout 0; 0 new 122 changed. r2 re-checks launched (critic, code, story; sonnet).
- 2026-11-22 S9c r2 gate MET: critic SATISFIED (0/0/19, carried minors), code APPROVED (medium 3), story NOT SATISFIED advisory (0/0/10). v5.22 closed; v5.21 logged closed as superseded. STATE -> v5.23.
- 2026-11-22 S10 start: wave 1 W4 || E5 launched. Music: Julien R2 answer (Downtown triumph gap ~0:07, bank ok, wants splash theme) -> notes round 3 launched.
- 2026-11-22 S10 W4 done (COPY-v5.23.md; §7 carried copy fixes need code cards). Ask Julien: tutorial.16 says 'starter pack' not 'gift' (paid).
- 2026-11-22 S10 E5 done (paid-boost slot, SAVE_VERSION 9, 3012 tests). Ask Julien: offline earnings ignore paid boosts (12 h bought then away = nothing). Wave 2 N1 || U5 launched.
- 2026-11-22 S10 music notes round 3 done, reel sent, music back at listen; A3 stays blocked. splash_theme cue exists but src does not play it yet (needs a U-lane card).
- 2026-11-22 Julien: "There should be a starter pack that costs money and periodic gifts from time to time, one of which should be early in the game" -> tutorial.16 'starter pack' wording stands; periodic free gifts (one early) are a new feature for a planning session, not v5.23.
- 2026-11-22 S10 U5 done (chip/tabs/boosters/nudge done; StoreTab onClose waits on N1; hud:store CoachTargetId -> E6). U5 needs sent to N1.
- 2026-11-22 S10 N1 done (3059 tests green); U5 done (StoreTab defaults onClose to router.back). Wave 3 E6 launched.
- 2026-11-22 S10 E6 died on the 5-hour limit before editing anything; resumed after the reset (Julien: Go).
- 2026-11-22 S10 music closed (Julien yes on R2). A3 (docs/build/v5.22/card-A3.md) launched beside E6.
- 2026-11-22 S10 A3 done (3 shop SFX + shop-ears rules, 3075 tests). Julien has not heard the three sounds.
- 2026-11-22 S10 E6 done (3075 tests). U follow-ups (98_u3 shot 103, coach-view 16/17) sent to U5 before verify.
- 2026-11-22 S10 U5 follow-ups done (3077 tests). MID_SAVE in shots_lib lands fixtures on step 16 -> sent to E6 before verify.
- 2026-11-22 S10 E6 MID_SAVE fix done (saveVersion 7, tutorial 18; 4 fixtures + 3 TUTORIAL_DONE locals). Possible: fixtures 09/19/56 may need suburbs-hire seen. Verify v5.23 running (tsc, format, 3077 tests ok).
- 2026-11-22 S10 verify v5.23 FAIL: 3 errors (56_u1 soon-card + gift-close click; 106_t2 open-city click), layout 0 new; 10 new 54 changed vs v5.22-r2. Sent to E6 (fixture saves).
- 2026-11-22 S10 verify v5.23 PASS (True 0 [], layout 0). r1 reviews launched: critic full, codecritic high, storycritic low.
- 2026-11-22 S10 gate r1 not met (critic 3 bugs 2 majors; code APPROVED 3 medium; story major S99). Fix round r2: N1 || U5 first, then E5 || E6, then W4. S and A rows have no v5.23 card and carry.
