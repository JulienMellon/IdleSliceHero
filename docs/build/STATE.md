# STATE

Keep this file under 40 lines. It is the only file the orchestrator edits by hand.

```
version: 5.25                   # v5.24 closed 2026-11-27 at r3 (critic 0 bug 0 major 6 minor carried; code APPROVED 1 medium U40; story advisory 9 minor)
step: waves                         # setup | waves | verify | review | fix | close
round: r1              # r1 | r2 | r3
last_shots: v5.24-r3                # r3 verify: True 0 [], layout 0 new; 7 changed vs v5.24-r2
codecritic_range_start: 04b0abf   # v5.24 start (v5.23b closed commit)
cards:                 # todo | running | done | partial | blocked
  (none yet)
reviews:               # latest review file per critic, with verdict and counts
  critic: docs/build/v5.24/review-r3-critic.md (r3 NOT SATISFIED, minors only -> close; bug 0 major 0 minor 6; E1 U2 S2 N1; D577 D586 D572 D573 D564 D570 carried)
  code:   docs/build/v5.24/review-r3-code.md (r3 APPROVED; blocker/high 0 medium 1 low 33; E6 U16 S4 N7 A1; U40 carried)
  story:  docs/build/v5.24/review-r1-story.md (r1 NOT SATISFIED advisory; bug 0 major 0 minor 9; E1 U4 T4)
  audio:  docs/build/v5.18/review-r2-audio.md (r2 SATISFIED; bug 0 major 0 minor 3 low 1; A4; AU41 AU39 AU40 AU25 carried)
open: Julien 2026-11-23: things may cover the WELCOME mat transiently (protected check: only static/parked elements count); scrolling wide shops are fine, no scroll cue needed. ON HOLD (Julien 2026-11-18): every city beyond Boston; cards in docs/build/v5.19/later/ (W4b W4s E4 E4f CITY A3) and the deferred refactor (R2 R2b R3 R4 R5f R6s) are not launched. PARKED for Julien, not in v5.19: economy refit (one pizza per tap +1/10 prep lv, home tops out ~$10M with Suburbs ~$30K, first goal <$50, ECONOMY 3->4 with old saves reset, D493 rival gated at Suburbs 2 stars, D495); don't ask about it during v5.19. Carried: A2 + audio notes AU41 AU39 AU40 AU25 AU82 (music round waits on Julien's R1 listen), SliceAudioSession native module not built; Boston heads need a writer pass (5 barks per head, one per trigger; their script has 4 numbered); Boston GMs placeholder; v5.17/v5.18 critic minors D481 D493 D495 D505 D512 D514. Tools: expo install is refused by the proxy (use npm install with the version from node_modules/expo/bundledNativeModules.json); loop_stats.py cannot read loop: commits; programmer --only takes the fixture name without .py; seam-noise shots 00/24/104/105 and 29-31b. App Store privacy label must say Tracking = Yes; native paths unverified until DEVICE-CHECKLIST.
next: wait for Julien to set the next scope (docs/build/v5.25/VERSION.md says step: setup — v5.25 cards are written with Julien first). Carried notes: docs/build/v5.24/review-r3-{critic,code}.md and review-r1-story.md open-notes tables (critic D577 D586 D572 D573 D564 D570; code U40 medium + 33 low; story 9 minor incl. S106 oven names). Ask Julien: create diamonds_2600 ($19.99, consumable) in App Store Connect and RevenueCat before v5.24 ships; plus the earlier asks (offline earnings vs paid boosts, periodic free gifts, splash_theme, 3 shop SFX unheard).
```

## Log (one line per event, newest last; trim to the last 10)
- 2026-11-27 S11 r2 verify v5.24-r2 PASS (True 0 [], layout 0, 160 changed). r2 re-checks launched (critic, code; story advisory had no majors, carried).
- 2026-11-27 S11 r2 critic: 0 bug 0 major 11 minor (lists D571 D519 open though Julien closed them 2026-11-23). Waiting on codecritic.
- 2026-11-27 S11 gate r2 not met (critic 11 minor; code APPROVED). Fix round r3: E7 || U6, then S4 || N2, then S5. After r3: close (minors carry) unless a bug/major appears.
- 2026-11-27 S11 r3 E7 done (no change; C203 low carried, needs S5 test edit). S4 launched; U6 running.
- 2026-11-27 S11 r3 U6 done (C205, C192 half 1; 3521 tests). N2 launched (C192 half 2); S4 running.
- 2026-11-27 S11 r3 N2 done (C192 fixed in code). crowd chime test red mid-S4 edit; waiting on S4.
- 2026-11-27 S11 r3 S4 done (D579; 3521 tests green). S5 launched.
- 2026-11-27 S11 r3 S5 done (D577 D580 D585 C206 T145 C203). Verify v5.24-r3 running.
- 2026-11-27 S11 r3 verify v5.24-r3 PASS (True 0 [], layout 0, 7 changed). r3 re-checks launched.
- 2026-11-27 S11 gate r3: critic 6 minor (no bug/major), code APPROVED. v5.24 closed at r3; catalog 41 looks / 5,760 diamonds. STATE -> v5.25.
